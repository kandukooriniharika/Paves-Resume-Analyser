"""Resume and JD parsing endpoints."""
import base64
from fastapi import APIRouter
from models.schemas import ParseResumeRequest, ParsedResumeResponse, ParseJDRequest, ParsedJDResponse
from services.resume_parser import ResumeParserService
from services.jd_parser import JDParserService

router = APIRouter()
parser = ResumeParserService()
jd_parser = JDParserService()

@router.post("/parse-resume", response_model=ParsedResumeResponse)
async def parse_resume(req: ParseResumeRequest):
    """Parse resume: extract text (with OCR fallback) and structured candidate data."""
    return await parser.parse(req)

@router.post("/parse-jd", response_model=ParsedJDResponse)
async def parse_jd(req: ParseJDRequest):
    """Parse job description into structured JD data."""
    return await jd_parser.parse(req.jd_text)
