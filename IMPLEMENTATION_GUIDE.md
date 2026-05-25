# Paves TalentOS — AI Resume Screening Module
## Production Implementation Guide

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Environment Setup](#4-environment-setup)
5. [Backend — Spring Boot](#5-backend--spring-boot)
6. [AI Service — FastAPI](#6-ai-service--fastapi)
7. [Frontend — React + Tailwind v4](#7-frontend--react--tailwind-v4)
8. [Database Schema](#8-database-schema)
9. [Upload Modes (Files / ZIP / Folder)](#9-upload-modes-files--zip--folder)
10. [OCR Pipeline](#10-ocr-pipeline)
11. [3-Layer Screening Pipeline](#11-3-layer-screening-pipeline)
12. [Fraud Detection](#12-fraud-detection)
13. [API Reference](#13-api-reference)
14. [Running the Application](#14-running-the-application)
15. [Environment Variables](#15-environment-variables)
16. [Testing Guide](#16-testing-guide)
17. [Production Deployment](#17-production-deployment)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (React 18)                       │
│  Tailwind v4 · Zustand · Axios · Lucide icons · Vite 5      │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST /api/**  (JWT Bearer + X-User-Role)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│           Spring Boot 3.5  (port 8080)                       │
│  Auth · Campaign CRUD · Resume Upload · Pipeline Trigger     │
│  Results · Analytics · File Serve · JWT Security            │
│                                                              │
│  Storage:  LocalStorageService (default)                     │
│            S3StorageService (set storage.type=s3)            │
└─────────────────────┬───────────────────────────────────────┘
                      │ WebClient  (port 8000)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│           FastAPI AI Service  (port 8000)                    │
│  /ai/parse-resume   → PyMuPDF + Tesseract OCR               │
│  /ai/parse-jd       → Regex heuristics                       │
│  /ai/layer2-embed   → sentence-transformers (all-MiniLM)    │
│  /ai/score-resume   → Gemini 1.5 Flash                       │
│  /ai/detect-fraud   → 7-check rule engine                    │
│  /ai/check-duplicate→ cosine similarity (stub → pgvector)   │
└─────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              PostgreSQL  (port 5432)                         │
│  users · branches · screening_campaigns                      │
│  screening_resumes · screening_results                       │
└─────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- Spring Boot handles all business logic and orchestrates the pipeline
- FastAPI handles heavy ML work (embeddings, Gemini calls, OCR)
- If FastAPI is offline, Layer 1 (keyword scoring) still runs — Layer 2/3 fall back to 50% neutral score
- `storage.type=local` (default) saves files to `./uploads/screening/` — flip to `s3` for production
- Pipeline runs `@Async` — frontend polls `/upload-status/{campaignId}` every 3 seconds

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React | 18.2 |
| Frontend | Vite | 5.0 |
| Frontend | Tailwind CSS | v4 (via `@tailwindcss/vite`) |
| Frontend | Zustand | 4.4 |
| Frontend | Axios | 1.6 |
| Frontend | Lucide React | 0.294 |
| Backend | Spring Boot | 3.5.13 |
| Backend | Java | 21 |
| Backend | PostgreSQL | 14+ |
| Backend | Apache PDFBox | 3.0.3 |
| Backend | Apache POI | 5.3 (DOCX/DOC + XLSX export) |
| Backend | Apache Commons CSV | 1.11 |
| Backend | AWS SDK v2 S3 | 2.25.60 (optional) |
| Backend | SpringDoc OpenAPI | 2.5 |
| AI Service | FastAPI | 0.111 |
| AI Service | sentence-transformers | 3.0 (`all-MiniLM-L6-v2`) |
| AI Service | PyMuPDF (fitz) | 1.24 |
| AI Service | Tesseract OCR | via pytesseract |
| AI Service | Google Gemini | 1.5 Flash |

---

## 3. Project Structure

```
Paves Resume Analyser/
├── frontend/                          # React app
│   ├── src/
│   │   ├── api/
│   │   │   ├── api.js                 # Legacy API (auth endpoints)
│   │   │   └── screeningApi.js        # Screening module API
│   │   ├── store/
│   │   │   ├── authStore.js           # JWT + user state (Zustand)
│   │   │   └── screeningStore.js      # Upload progress state
│   │   ├── components/
│   │   │   ├── Button/Button.jsx      # Multi-variant button
│   │   │   ├── status/StatusBadge.jsx # Status + recommendation badges
│   │   │   ├── Pagination/Pagination.jsx
│   │   │   ├── Cards/StatCard.jsx     # Stats dashboard tiles
│   │   │   ├── forms/FormInput.jsx
│   │   │   ├── forms/FormTextArea.jsx
│   │   │   ├── forms/FormNativeSelect.jsx
│   │   │   ├── ui/EmptyState.jsx
│   │   │   ├── SearchInput/SearchInput.jsx
│   │   │   └── layout/
│   │   │       ├── Navbar.jsx
│   │   │       └── Sidebar.jsx        # Screening nav
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   └── screening/
│   │   │       ├── ScreeningDashboard.jsx
│   │   │       ├── JobRoleList.jsx    # Campaigns list (UI calls them "Job Roles")
│   │   │       ├── CreateJobRole.jsx  # Create/edit campaign
│   │   │       ├── BulkUpload.jsx     # Files / ZIP / Folder upload
│   │   │       ├── CandidateList.jsx  # Screening results
│   │   │       └── CandidateDetail.jsx
│   │   └── styles/index.css           # Tailwind v4 globals + brand colors
│   ├── vite.config.js                 # @tailwindcss/vite plugin
│   └── package.json
│
├── resume-analyser/                   # Spring Boot backend
│   └── src/main/java/com/paves/resume_analyser/
│       ├── config/                    # CorsConfig, SecurityConfig, GeminiConfig
│       ├── security/                  # JwtFilter, JwtUtil, UserDetailsServiceImpl
│       ├── controller/                # AuthController (legacy)
│       ├── service/                   # AuthService (legacy)
│       ├── model/                     # User, Branch (legacy)
│       └── screening/                 # ← ALL NEW CODE
│           ├── common/ApiResponse.java
│           ├── campaign/              # Campaign entity + CRUD
│           ├── resume/                # ScreeningResume + upload service
│           ├── result/                # ScreeningResult + HR actions
│           ├── pipeline/              # Async 3-layer pipeline
│           │   └── layer1/            # Java-native keyword scoring
│           ├── analytics/             # Dashboard + per-campaign stats
│           ├── storage/               # StorageService interface + Local/S3 impls
│           ├── ocr/                   # ResumeParserService (PDF/DOCX/DOC/TXT)
│           ├── ai/                    # AIScreeningClient (WebClient → FastAPI)
│           └── config/               # AsyncConfig, S3Config, FileServeController
│
└── ai-screening-service/              # Python FastAPI
    ├── main.py
    ├── requirements.txt
    ├── .env.example
    ├── models/schemas.py              # All Pydantic models
    ├── routers/                       # parse, embed, score, fraud
    └── services/                      # resume_parser, jd_parser, embedding,
                                       # scoring, fraud
```

---

## 4. Environment Setup

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Java | 21 | Required for Spring Boot 3.5 |
| Maven | 3.9+ | Or use `./mvnw` wrapper |
| Node.js | 18+ | For React frontend |
| Python | 3.10+ | For FastAPI service |
| PostgreSQL | 14+ | Create DB `resumedb` |
| Tesseract | 5.x | For OCR — install separately |

**Install Tesseract (Windows):**
```
winget install UB-Mannheim.TesseractOCR
# or download from: https://github.com/UB-Mannheim/tesseract/wiki
```

**Install Tesseract (Ubuntu/Debian):**
```bash
sudo apt-get install tesseract-ocr
```

### Database Setup
```sql
CREATE DATABASE resumedb;
-- Spring Boot creates tables automatically via ddl-auto=update
```

---

## 5. Backend — Spring Boot

### Key Packages

| Package | Responsibility |
|---|---|
| `screening.campaign` | Job role (campaign) CRUD — create, list, activate, delete |
| `screening.resume` | Bulk upload (files/ZIP), status polling |
| `screening.pipeline` | Async 3-layer scoring pipeline |
| `screening.result` | Results, HR override, shortlist/reject, CSV/XLSX export |
| `screening.analytics` | Dashboard stats, per-campaign breakdown |
| `screening.storage` | File storage abstraction (local or S3) |
| `screening.ocr` | Text extraction (PDFBox + POI + AI OCR fallback) |
| `screening.ai` | WebClient calls to Python FastAPI |

### Security

All `/api/screening/**` endpoints require a valid JWT token (from `/api/auth/login`). Additionally, the role header `X-User-Role` controls permissions:

| Role | Mapped from | Permissions |
|---|---|---|
| `ADMIN` | `HEAD` user role | Full access including delete |
| `HR` | `ACQUISITION` user role | Create, edit, upload, shortlist/reject |
| `GENERAL` | Unknown | Read-only |

The frontend automatically maps `HEAD → ADMIN` and `ACQUISITION → HR` in `screeningApi.js`.

### Storage Configuration

**Local (default — no config needed):**
```properties
storage.type=local
# Files saved to: ./uploads/screening/
# Served at: GET /api/screening/files/{filename}
```

**AWS S3:**
```properties
storage.type=s3
aws.s3.bucket=paves-resumes-prod
aws.s3.region=ap-south-1
aws.s3.access-key=AKIAXXXXXXXXXXXXXXXX
aws.s3.secret-key=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Build & Run
```bash
cd resume-analyser
./mvnw spring-boot:run
# or
./mvnw clean package -DskipTests
java -jar target/resume-analyser-0.0.1-SNAPSHOT.jar
```

Swagger UI: http://localhost:8080/swagger-ui.html

---

## 6. AI Service — FastAPI

### Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/ai/parse-resume` | Extract candidate info from resume text/bytes |
| POST | `/ai/parse-jd` | Parse JD text into structured data |
| POST | `/ai/layer2-embed` | Generate sentence-transformer embedding |
| POST | `/ai/score-resume` | Gemini 1.5 Flash scoring (Layer 3) |
| POST | `/ai/detect-fraud` | 7-check fraud analysis |
| POST | `/ai/check-duplicate` | Cosine similarity duplicate check |
| GET  | `/health` | Health check — Java backend calls this before AI calls |

### Graceful Degradation

If the AI service is unavailable (`/health` returns error), the pipeline continues with:
- Layer 2 score = 50.0 (neutral)
- Layer 3 score = 50.0 (neutral)
- Candidate name/email/phone = null (filled later by HR)

### Setup
```bash
cd ai-screening-service
python -m venv venv
venv\Scripts\activate        # Windows
# or
source venv/bin/activate      # Linux/Mac

pip install -r requirements.txt
cp .env.example .env
# Edit .env: set GEMINI_API_KEY=your-key
uvicorn main:app --port 8000 --reload
```

API docs: http://localhost:8000/docs

### Getting a Gemini API Key
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with a Google account
3. Click "Create API Key"
4. Copy to `.env` as `GEMINI_API_KEY=AIza...`
5. Free tier: 15 RPM, 1M TPD — sufficient for development

---

## 7. Frontend — React + Tailwind v4

### Tailwind v4 Setup (Already Done)

**`vite.config.js`** — uses `@tailwindcss/vite` plugin (no `postcss.config.js` needed):
```js
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({ plugins: [react(), tailwindcss()] })
```

**`src/styles/index.css`** — CSS-first config with `@theme` block:
```css
@import "tailwindcss";
@import "tw-animate-css";
@theme { ... }
:root { --primary: #d23369; --secondary: #212d74; ... }
```

### Important: Package Rules
- **Always use `clsx`** for conditional classes (not `classnames` — not installed)
- **Never import from `@/lib/utils`** — no path alias configured
- **Never set `Content-Type: multipart/form-data` manually** in axios — it strips the boundary
- `@headlessui/react` and `framer-motion` are **not installed** — use native HTML + CSS transitions

### Install & Run
```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

---

## 8. Database Schema

Spring Boot auto-creates these tables via `ddl-auto=update`.

### `screening_campaigns`
```sql
CREATE TABLE screening_campaigns (
  id                BIGSERIAL PRIMARY KEY,
  role_name         VARCHAR(255) NOT NULL,
  job_description   TEXT,
  required_skills   TEXT,           -- comma-separated
  nice_to_have_skills TEXT,
  min_experience    INTEGER,
  max_experience    INTEGER,
  target_headcount  INTEGER,
  department        VARCHAR(100),
  branch_id         BIGINT,
  status            VARCHAR(50) DEFAULT 'DRAFT',
  created_by        VARCHAR(255),
  skill_weights_json TEXT,          -- JSON blob
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);
```

### `screening_resumes`
```sql
CREATE TABLE screening_resumes (
  id                BIGSERIAL PRIMARY KEY,
  campaign_id       BIGINT NOT NULL REFERENCES screening_campaigns(id),
  original_filename VARCHAR(500),
  file_url          VARCHAR(1000),
  s3_key            VARCHAR(1000),
  content_type      VARCHAR(100),
  extracted_text    TEXT,
  candidate_name    VARCHAR(255),
  candidate_email   VARCHAR(255),
  candidate_phone   VARCHAR(50),
  status            VARCHAR(50) DEFAULT 'PENDING',
  ocr_used          BOOLEAN DEFAULT FALSE,
  fraud_flagged     BOOLEAN DEFAULT FALSE,
  uploaded_at       TIMESTAMP DEFAULT NOW(),
  parsed_at         TIMESTAMP
);
```

### `screening_results`
```sql
CREATE TABLE screening_results (
  id                BIGSERIAL PRIMARY KEY,
  resume_id         BIGINT UNIQUE REFERENCES screening_resumes(id),
  campaign_id       BIGINT REFERENCES screening_campaigns(id),
  layer1_score      DOUBLE PRECISION,
  layer2_score      DOUBLE PRECISION,
  layer3_score      DOUBLE PRECISION,
  ats_score         DOUBLE PRECISION,
  overall_score     DOUBLE PRECISION,
  recommendation    VARCHAR(50),
  matched_skills    TEXT,
  missing_skills    TEXT,
  strengths         TEXT,
  weaknesses        TEXT,
  ai_feedback       TEXT,
  experience_years  INTEGER,
  education_level   VARCHAR(100),
  seniority         VARCHAR(50),
  fraud_details     TEXT,
  hr_override_score DOUBLE PRECISION,
  hr_notes          TEXT,
  hr_status         VARCHAR(50),
  hr_override_by    VARCHAR(255),
  hr_override_at    TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW()
);
```

---

## 9. Upload Modes (Files / ZIP / Folder)

### Files Mode
Standard multi-file select. `accept=".pdf,.docx,.doc,.txt"`. Each file sent as multipart.

### ZIP Archive Mode
Upload a single `.zip` file containing resumes. **Backend automatically extracts it:**

```java
// ResumeUploadService.java
if (filename.endsWith(".zip")) {
    try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(bytes))) {
        ZipEntry entry;
        while ((entry = zis.getNextEntry()) != null) {
            if (entry.isDirectory()) continue;
            String name = Path.of(entry.getName()).getFileName().toString();
            if (isAllowedFile(name)) processSingleFile(campaign, zis.readAllBytes(), name, null);
        }
    }
}
```

### Folder Upload Mode
Uses `webkitdirectory` HTML attribute to let users select an entire folder:
```jsx
<input type="file" webkitdirectory directory multiple
  onChange={e => setFiles(Array.from(e.target.files))} />
```
The browser sends each file individually — backend treats them exactly like regular files.

### File Limits
- Max individual file size: **100 MB**
- Max request size: **500 MB** (covers large ZIP archives)
- Accepted formats: `.pdf`, `.docx`, `.doc`, `.txt`

---

## 10. OCR Pipeline

### Java Side (ResumeParserService.java)

```
File arrives at ResumeUploadService
        │
        ▼
extractText(bytes, filename)
        │
    ┌───┴────────────────────────────────┐
    │ .pdf         │ .docx  │ .doc  │ .txt│
    ▼              ▼        ▼       ▼     │
PDFBox         XWPFDoc  HWPFDoc  UTF-8   │
    │                                    │
    ▼ < 100 chars?                       │
    │   YES                              │
    ▼                                    │
callAiOcr()  ──► POST /ai/parse-resume  │
                  (file_base64 + name)   │
                        │               │
                        ▼               │
                  extracted_text ◄──────┘
```

### Python Side (resume_parser.py)

```python
# OCR path triggered when file_base64 is provided and text is < 100 chars
file_bytes = base64.b64decode(req.file_base64)
doc = fitz.open(stream=file_bytes, filetype="pdf")
text = "\n".join(page.get_text() for page in doc)

if len(text.strip()) < 100:
    # Scanned PDF — convert pages to images and OCR
    images = convert_from_bytes(pdf_bytes, dpi=200)
    text = "\n".join(pytesseract.image_to_string(img) for img in images)
```

---

## 11. 3-Layer Screening Pipeline

The pipeline runs asynchronously (`@Async("screeningExecutor")`). The thread pool has 5 core / 20 max threads and a queue of 200.

```
Resume (status=PENDING)
        │
        ▼ PARSING
Text extraction (PDFBox / POI / OCR)
        │
        ▼ LAYER1
Keyword matching — Java-native, zero cost
Score = (required skills matched / total) * 100
Bonus up to +10 for nice-to-have skills
        │
        ▼ LAYER2  [skipped if AI service offline]
sentence-transformers embeddings
Cosine similarity(resume_embed, jd_embed) * 100
        │
        ▼ AI_SCORING  [skipped if AI service offline]
Gemini 1.5 Flash — structured JSON response
Fields: ai_score, recommendation, matched_skills,
        missing_skills, strengths, weaknesses, feedback
        │
        ▼ COMPLETED
Composite ATS score: 20% L1 + 30% L2 + 50% L3
```

### Scoring Weights

| Layer | Weight | Cost | Notes |
|---|---|---|---|
| Layer 1 — Keyword Match | 20% | Free | Java, runs always |
| Layer 2 — Semantic Similarity | 30% | Free (local model) | Requires FastAPI running |
| Layer 3 — Gemini AI | 50% | ~$0.00015/request | Requires GEMINI_API_KEY |

### Recommendation Thresholds (Gemini decides, Java parses)

| Score | Recommendation |
|---|---|
| ≥ 80 | STRONGLY_RECOMMENDED |
| ≥ 60 | RECOMMENDED |
| ≥ 40 | MAYBE |
| < 40 | REJECT |

---

## 12. Fraud Detection

7 automated checks in `FraudDetectionService` (Python):

| # | Check | Score Impact |
|---|---|---|
| 1 | Experience years > 30 | +15 |
| 2 | Skills count > 40 (keyword stuffing) | +20 |
| 3 | Duplicate job entries (same company + title) | +25 |
| 4 | Future dates in text (e.g., 2027) | +30 |
| 5 | Disposable email domain | +20 |
| 6 | Excessive uppercase text (>40% caps) | +10 |
| 7 | Resume text < 200 chars | +15 |

- Score ≥ 50 → `is_fraud = true`
- Score ≥ 70 → `CRITICAL` risk
- Score ≥ 50 → `HIGH` risk
- Score ≥ 25 → `MEDIUM` risk

Flagged resumes are marked `fraudFlagged = true` on the `ScreeningResume` entity and shown with a warning badge in the UI.

---

## 13. API Reference

### Base URL: `http://localhost:8080`
### Auth: `Authorization: Bearer {jwt_token}`
### Role header: `X-User-Role: ADMIN | HR | GENERAL`

#### Campaign (Job Role) Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/screening/campaigns` | List all (params: status, branchId, page, size) |
| POST | `/api/screening/campaigns` | Create new |
| GET | `/api/screening/campaigns/{id}` | Get with live stats |
| PUT | `/api/screening/campaigns/{id}` | Update |
| DELETE | `/api/screening/campaigns/{id}` | Delete (ADMIN only) |
| POST | `/api/screening/campaigns/{id}/activate` | Set status → ACTIVE |
| POST | `/api/screening/campaigns/{id}/pull-applications` | Pull from recruitment module |

#### Resume Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/screening/resumes/bulk-upload` | Upload files (multipart: campaignId + files[]) |
| GET | `/api/screening/resumes/{campaignId}` | List resumes for campaign |
| GET | `/api/screening/resumes/upload-status/{campaignId}` | Real-time progress |
| DELETE | `/api/screening/resumes/detail/{resumeId}` | Delete resume |

#### Pipeline

| Method | Path | Description |
|---|---|---|
| POST | `/api/screening/run/{campaignId}` | Start pipeline (returns 202 immediately) |

#### Results

| Method | Path | Description |
|---|---|---|
| GET | `/api/screening/results/{campaignId}` | Paginated results sorted by score |
| GET | `/api/screening/results/{campaignId}/top` | Top 10 candidates |
| GET | `/api/screening/results/detail/{resultId}` | Full detail |
| PATCH | `/api/screening/results/{resultId}/override` | HR override score + notes |
| POST | `/api/screening/results/{resultId}/shortlist` | Mark shortlisted |
| POST | `/api/screening/results/{resultId}/reject` | Mark rejected |
| GET | `/api/screening/results/{campaignId}/export` | Export (format=csv or xlsx) |

#### Analytics

| Method | Path | Description |
|---|---|---|
| GET | `/api/screening/analytics/dashboard` | Global stats |
| GET | `/api/screening/analytics/campaign/{campaignId}` | Per-campaign stats |

---

## 14. Running the Application

### Step 1 — PostgreSQL
```bash
# Ensure PostgreSQL is running on localhost:5432
# Create the database
psql -U postgres -c "CREATE DATABASE resumedb;"
```

### Step 2 — AI Service
```bash
cd ai-screening-service
venv\Scripts\activate   # or source venv/bin/activate
uvicorn main:app --port 8000 --reload
# → http://localhost:8000/health should return {"status":"ok"}
```

### Step 3 — Spring Boot Backend
```bash
cd resume-analyser
./mvnw spring-boot:run
# → http://localhost:8080/swagger-ui.html
```

### Step 4 — React Frontend
```bash
cd frontend
npm install   # first time only
npm run dev
# → http://localhost:3000
```

### Step 5 — Test Login
Use any user created via `POST /api/auth/register`:
```json
{
  "fullName": "Admin User",
  "email": "admin@paves.com",
  "password": "admin123",
  "role": "HEAD"
}
```

---

## 15. Environment Variables

### Spring Boot — `application.properties`
```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/resumedb
spring.datasource.username=postgres
spring.datasource.password=your-password

# JWT
jwt.secret=paves-technologies-super-secret-key-2024-minimum-32-characters-long
jwt.expiration.ms=86400000

# AI Service
ai.service.url=http://localhost:8000

# Storage
storage.type=local           # or: s3

# AWS S3 (only if storage.type=s3)
aws.s3.bucket=paves-resumes-prod
aws.s3.region=ap-south-1
aws.s3.access-key=AKIAXXXXXXXX
aws.s3.secret-key=xxxxxxxxxxxxxxxxxx

# Gemini (legacy direct calls — still used by old AIAnalysisService if needed)
gemini.api.key=AIzaSy...
```

### FastAPI — `ai-screening-service/.env`
```env
GEMINI_API_KEY=AIzaSy...your-key-here
REDIS_URL=redis://localhost:6379   # optional, for duplicate check
AI_SERVICE_PORT=8000
EMBED_MODEL=all-MiniLM-L6-v2      # change to larger model for better accuracy
```

### Frontend — no `.env` needed
The Vite proxy (`/api` → `http://localhost:8080`) handles routing automatically.

---

## 16. Testing Guide

### Manual Test Flow (Full Pipeline)

1. **Register + Login**
   - POST `/api/auth/register` with `role: HEAD`
   - POST `/api/auth/login` → get JWT token
   - Open `http://localhost:3000` → should redirect to `/screening`

2. **Create a Job Role**
   - Navigate to "New Job Role"
   - Fill: Role Name = "Backend Engineer", Required Skills = "Java,Spring Boot,PostgreSQL"
   - Submit → should appear in Job Roles list with status "DRAFT"

3. **Activate the Job Role**
   - On the Job Roles card → click "Activate"
   - Status changes to "ACTIVE"

4. **Upload Resumes**
   - Click "Upload Resumes" on the Job Role card
   - Test all 3 upload modes:
     - **Files**: upload 2-3 PDF resumes
     - **ZIP**: create a `.zip` with resumes, upload it
     - **Folder**: select a folder containing resumes
   - All uploaded files should appear in the file list with status "Uploaded"

5. **Run Screening Pipeline**
   - Click "Start Screening Pipeline"
   - Watch the progress tiles update every 3 seconds: Parsing → Layer1 → Layer2 → AI Scoring → Completed
   - When progress = 100%: click "View Results →"

6. **Review Results**
   - Results sorted by ATS score descending
   - Check recommendation badges (Strong Fit / Recommended / Maybe / Not a Fit)
   - Try sorting by name, score, recommendation
   - Export as CSV and XLSX

7. **Candidate Detail**
   - Click on a candidate name
   - Verify: Layer 1/2/3 scores, matched/missing skills, AI feedback
   - Try "Shortlist" button → status badge should change
   - Try HR Override: enter score 85, notes, save

8. **Dashboard**
   - Navigate to `/screening`
   - Should show total campaigns, active screenings, avg score
   - Top candidates table should show recently screened candidates

### Test Files to Prepare

| File | What to test |
|---|---|
| `good_resume.pdf` | Strong match — should get RECOMMENDED or better |
| `weak_resume.pdf` | Poor skill match — should get REJECT |
| `scanned_resume.pdf` | Scanned/image PDF — should trigger OCR |
| `resume.docx` | DOCX format |
| `resume.doc` | Legacy DOC format |
| `resumes.zip` | ZIP with multiple PDFs — test ZIP extraction |
| A folder | Test folder upload mode |

---

## 17. Production Deployment

### Backend
```bash
# Build JAR
./mvnw clean package -DskipTests
# Run
java -jar target/resume-analyser-0.0.1-SNAPSHOT.jar \
  --spring.datasource.url=$DB_URL \
  --storage.type=s3 \
  --aws.s3.access-key=$AWS_KEY \
  --aws.s3.secret-key=$AWS_SECRET
```

### AI Service
```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
```

### Frontend
```bash
npm run build          # outputs to frontend/dist/
# Serve dist/ via Nginx or static hosting (Vercel, Netlify, S3)
```

### Production Checklist

- [ ] Move all secrets to environment variables / AWS Secrets Manager
- [ ] Replace `ddl-auto=update` with Flyway migrations (see SQL in Section 8)
- [ ] Enable HTTPS (nginx reverse proxy + Let's Encrypt)
- [ ] Configure Redis for Gemini result caching (24h TTL)
- [ ] Set up CloudWatch / Prometheus metrics via `/actuator`
- [ ] Configure Tesseract path for your OS in production environment
- [ ] Add rate limiting on `/api/screening/run/{id}` (prevent pipeline spam)
- [ ] Set up S3 bucket with versioning and lifecycle rules for old resume cleanup

### AWS S3 IAM Policy (minimum permissions)
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
    "Resource": "arn:aws:s3:::paves-resumes-prod/*"
  }]
}
```

---

*Generated for Paves Technologies — TalentOS v1.0*
*Stack: Spring Boot 3.5 · FastAPI · React 18 · Tailwind v4 · PostgreSQL · Gemini 1.5 Flash*
