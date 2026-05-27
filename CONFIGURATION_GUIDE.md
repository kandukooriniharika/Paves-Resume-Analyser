# Configuration Guide — Paves Enterprise AI Hiring Platform

All required credentials and where to get them.

---

## 1. Google Gemini API Key (REQUIRED)

Used for: Layer 3 AI resume scoring

**Where to get it:**
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with a Google account
3. Click "Create API Key"
4. Copy the key

**Where to set it:**
```
ai-screening-service/.env
GEMINI_API_KEY=AIza...
```

---

## 2. Cloudinary (REQUIRED if using cloud storage)

Used for: Storing resume PDFs, DOCX files, and JD files in the cloud

**Where to get it:**
1. Sign up at https://cloudinary.com (free tier: 25 GB storage, 25 GB bandwidth/month)
2. Go to Dashboard → API Keys
3. Copy Cloud Name, API Key, and API Secret

**Where to set it:**

In `resume-analyser/src/main/resources/application.properties` OR as environment variables:
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

Also set the storage type:
```
STORAGE_TYPE=cloudinary
```

> Leave `STORAGE_TYPE=local` during development — no Cloudinary needed locally.

---

## 3. PostgreSQL (REQUIRED)

The default `docker-compose.yml` starts PostgreSQL automatically.

```bash
docker-compose up -d
```

Default connection (change in production):
```
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/resumedb
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=root
```

---

## 4. Redis (REQUIRED)

Used for: Resume duplicate detection, embedding cache

The default `docker-compose.yml` starts Redis automatically.
```bash
docker-compose up -d
```

For production, use Upstash (free tier: 10,000 commands/day):
1. Sign up at https://upstash.com
2. Create a Redis database
3. Copy the connection URL

```
# In ai-screening-service/.env
REDIS_URL=redis://default:<password>@<host>.upstash.io:6379
```

---

## 5. LinkedIn ATS Integration (OPTIONAL — enterprise feature)

Used for: Receiving "Easy Apply" applications automatically via webhook

**Requirements:**
- Active LinkedIn Recruiter Corporate account
- LinkedIn Developer app approved for Talent Solutions APIs

**Steps:**
1. Register at https://developer.linkedin.com/
2. Create an app → request "Talent Solutions" product access
3. Once approved, set webhook URL to: `https://your-domain.com/webhooks/linkedin/apply`
4. Copy your webhook secret

```
LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret
LINKEDIN_WEBHOOK_SECRET=your-webhook-secret
```

> Without these, the webhook endpoint still exists but skips HMAC verification.
> LinkedIn approval typically takes 1–4 weeks.

---

## 6. Naukri API (OPTIONAL — enterprise tier)

Used for: Automatically pulling candidates from Naukri job posts

**Option A — XLSX Export (available to all Naukri Recruiter accounts):**
- No API key needed
- Download XLSX from Naukri portal → upload via `POST /api/intake/naukri/import`

**Option B — Naukri RMS API (enterprise subscription only):**
```
NAUKRI_API_URL=https://api.naukri.com/...
NAUKRI_API_KEY=your-naukri-api-key
```
Contact Naukri enterprise sales for API access.

---

## 7. JWT Secret (REQUIRED in production)

Change the default secret before going to production:
```
JWT_SECRET=your-random-256-bit-secret-minimum-32-characters
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

---

## 8. AWS S3 (OPTIONAL — alternative to Cloudinary)

If you prefer S3 over Cloudinary:
```
STORAGE_TYPE=s3
AWS_S3_BUCKET=paves-resumes-prod
AWS_S3_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIAxxxxxx
AWS_SECRET_ACCESS_KEY=your-secret
```

---

## Quick-Start: Minimum Required to Run

| Service | Config needed |
|---------|--------------|
| Spring Boot | PostgreSQL running (via docker-compose) |
| FastAPI | `GEMINI_API_KEY` in `ai-screening-service/.env` |
| Frontend | None (auto-connects to Spring Boot at port 8080) |
| Redis | Running via docker-compose |
| File storage | None needed for local development (`STORAGE_TYPE=local`) |

---

## Default Login Credentials (seed data)

| Role | Email | Password |
|------|-------|----------|
| HR_ADMIN | admin@pavestechnologies.com | Paves@2024 |
| RECRUITER | recruiter@pavestechnologies.com | Paves@2024 |
| HIRING_MANAGER | hm@pavestechnologies.com | Paves@2024 |

**Change these immediately in production.**

---

## How to Start All Services

```bash
# 1. Start PostgreSQL + Redis
docker-compose up -d

# 2. Start FastAPI AI service
cd ai-screening-service
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env                             # then add GEMINI_API_KEY
uvicorn main:app --reload --port 8000

# 3. Start Spring Boot backend
cd resume-analyser
./mvnw spring-boot:run

# 4. Start React frontend
cd frontend
npm install
npm run dev
```

URLs:
- Frontend:  http://localhost:5173
- Backend:   http://localhost:8080
- AI Service: http://localhost:8000
- Swagger UI: http://localhost:8080/swagger-ui.html
- AI Docs:   http://localhost:8000/docs
