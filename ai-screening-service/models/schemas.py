from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from enum import Enum

class FraudRiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class RecommendationEnum(str, Enum):
    STRONGLY_RECOMMENDED = "STRONGLY_RECOMMENDED"
    RECOMMENDED = "RECOMMENDED"
    MAYBE = "MAYBE"
    REJECT = "REJECT"

class SeniorityEnum(str, Enum):
    INTERN = "INTERN"
    JUNIOR = "JUNIOR"
    MID = "MID"
    SENIOR = "SENIOR"
    LEAD = "LEAD"
    PRINCIPAL = "PRINCIPAL"

class EducationEntry(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    year: Optional[int] = None
    gpa: Optional[float] = None

class ExperienceEntry(BaseModel):
    company: Optional[str] = None
    title: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    years: Optional[float] = None

class CandidateData(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = []
    experience_years: Optional[float] = None
    experience_entries: List[ExperienceEntry] = []
    education: List[EducationEntry] = []
    summary: Optional[str] = None
    certifications: List[str] = []
    languages: List[str] = []
    extracted_text: Optional[str] = None  # raw text used by OCR path

class JDData(BaseModel):
    title: Optional[str] = None
    required_skills: List[str] = []
    nice_to_have_skills: List[str] = []
    min_experience: Optional[float] = None
    max_experience: Optional[float] = None
    description: Optional[str] = None

class ScoringWeights(BaseModel):
    skills_weight: float = 40.0
    experience_weight: float = 30.0
    education_weight: float = 15.0
    ai_score_weight: float = 15.0

class ParseResumeRequest(BaseModel):
    extracted_text: Optional[str] = None
    file_base64: Optional[str] = None  # for OCR path
    filename: Optional[str] = None

class ParsedResumeResponse(BaseModel):
    candidate: CandidateData
    extracted_text: str
    ocr_used: bool = False

class ParseJDRequest(BaseModel):
    jd_text: str

class ParsedJDResponse(BaseModel):
    jd: JDData

class EmbedRequest(BaseModel):
    text: str
    type: str = "resume"  # "resume" or "jd"

class EmbedResponse(BaseModel):
    embedding: List[float]
    tokens_used: int

class ScoreResumeRequest(BaseModel):
    resume_data: Dict[str, Any]
    jd_data: Dict[str, Any]
    weights: Optional[Dict[str, Any]] = None

class ScoreResumeResponse(BaseModel):
    layer3_score: float
    overall_score: float
    recommendation: RecommendationEnum
    matched_skills: List[str]
    missing_skills: List[str]
    strengths: List[str]
    weaknesses: List[str]
    ai_feedback: str
    experience_years: Optional[int] = None
    education_level: Optional[str] = None
    seniority: Optional[SeniorityEnum] = None

class FraudDetectRequest(BaseModel):
    resume_data: Dict[str, Any]
    extracted_text: str

class FraudDetectResponse(BaseModel):
    is_fraud: bool
    risk_level: FraudRiskLevel
    fraud_score: float  # 0-100
    reasons: List[str]

class DuplicateCheckRequest(BaseModel):
    embedding: List[float]
    campaign_id: int
    threshold: float = 0.95
