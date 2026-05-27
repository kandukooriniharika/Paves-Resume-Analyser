"""Resume text extraction with OCR fallback."""
import io
import base64
import re
from typing import Optional
import fitz  # PyMuPDF
from models.schemas import ParseResumeRequest, ParsedResumeResponse, CandidateData
from services.skill_normalizer import normalize_list

class ResumeParserService:

    async def parse(self, req: ParseResumeRequest) -> ParsedResumeResponse:
        text = req.extracted_text or ""
        ocr_used = False

        # If file bytes provided (OCR path from Java backend)
        if req.file_base64 and (not text or len(text.strip()) < 100):
            file_bytes = base64.b64decode(req.file_base64)
            filename = req.filename or "resume.pdf"
            text, ocr_used = self._extract_with_ocr(file_bytes, filename)

        candidate = self._extract_candidate_info(text)
        candidate.extracted_text = text

        return ParsedResumeResponse(
            candidate=candidate,
            extracted_text=text,
            ocr_used=ocr_used,
        )

    def _extract_with_ocr(self, file_bytes: bytes, filename: str):
        """Try PyMuPDF first; fall back to Tesseract OCR for scanned PDFs."""
        text = ""
        ocr_used = False

        try:
            if filename.lower().endswith(".pdf"):
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                text = "\n".join(page.get_text() for page in doc)

                # If text too short, try OCR
                if len(text.strip()) < 100:
                    text = self._tesseract_ocr(file_bytes)
                    ocr_used = True
            elif filename.lower().endswith(".txt"):
                text = file_bytes.decode("utf-8", errors="ignore")
            else:
                text = file_bytes.decode("utf-8", errors="ignore")
        except Exception as e:
            # Last resort: try to decode as text
            text = file_bytes.decode("utf-8", errors="ignore")

        return text, ocr_used

    def _tesseract_ocr(self, pdf_bytes: bytes) -> str:
        """Convert PDF pages to images and run Tesseract OCR."""
        try:
            import pytesseract
            from pdf2image import convert_from_bytes

            images = convert_from_bytes(pdf_bytes, dpi=200)
            pages_text = []
            for img in images:
                page_text = pytesseract.image_to_string(img, lang='eng')
                pages_text.append(page_text)
            return "\n".join(pages_text)
        except Exception:
            return ""

    def _extract_candidate_info(self, text: str) -> CandidateData:
        """Simple regex-based extraction of name, email, phone, skills."""
        # Email
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        email = email_match.group() if email_match else None

        # Phone
        phone_match = re.search(r'[\+\(]?[0-9][0-9 \-\(\)]{7,}[0-9]', text)
        phone = phone_match.group().strip() if phone_match else None

        # Skills — common tech terms (simplified)
        common_skills = ['python', 'java', 'javascript', 'react', 'angular', 'vue', 'nodejs', 'spring',
                        'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'docker', 'kubernetes', 'aws',
                        'azure', 'gcp', 'machine learning', 'deep learning', 'nlp', 'tensorflow', 'pytorch',
                        'fastapi', 'django', 'flask', 'git', 'ci/cd', 'agile', 'scrum', 'microservices']
        text_lower = text.lower()
        found_skills = normalize_list([s for s in common_skills if s in text_lower])

        # Experience years (e.g., "5 years", "5+ years")
        exp_match = re.search(r'(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)', text, re.IGNORECASE)
        exp_years = float(exp_match.group(1)) if exp_match else None

        # Name: first non-empty line (heuristic — often the name at top)
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        name = lines[0] if lines and len(lines[0]) < 60 and not '@' in lines[0] else None

        return CandidateData(
            name=name,
            email=email,
            phone=phone,
            skills=found_skills,
            experience_years=exp_years,
        )
