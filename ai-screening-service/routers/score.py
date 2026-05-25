"""Scoring endpoint."""
from fastapi import APIRouter
from models.schemas import ScoreResumeRequest, ScoreResumeResponse
from services.scoring_service import ScoringService

router = APIRouter()
scorer = ScoringService()

@router.post("/score-resume", response_model=ScoreResumeResponse)
async def score_resume(req: ScoreResumeRequest):
    """Layer 3: Score resume against JD using Gemini AI."""
    return await scorer.score(req)
