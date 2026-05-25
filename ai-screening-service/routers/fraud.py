"""Fraud detection endpoints."""
from fastapi import APIRouter
from models.schemas import FraudDetectRequest, FraudDetectResponse, DuplicateCheckRequest
from services.fraud_service import FraudDetectionService

router = APIRouter()
fraud_svc = FraudDetectionService()

@router.post("/detect-fraud", response_model=FraudDetectResponse)
async def detect_fraud(req: FraudDetectRequest):
    """Detect suspicious patterns in a resume (fake experience, inflated skills, etc.)."""
    return fraud_svc.detect(req)

@router.post("/check-duplicate")
async def check_duplicate(req: DuplicateCheckRequest):
    """Check if a resume embedding is too similar to existing ones (duplicate submission)."""
    is_dup = fraud_svc.is_duplicate(req.embedding, req.campaign_id, req.threshold)
    return {"is_duplicate": is_dup}
