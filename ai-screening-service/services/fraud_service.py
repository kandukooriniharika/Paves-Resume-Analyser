"""Resume fraud detection — 7 detection checks."""
import re
from typing import List, Dict, Any
from models.schemas import FraudDetectRequest, FraudDetectResponse, FraudRiskLevel

class FraudDetectionService:

    def detect(self, req: FraudDetectRequest) -> FraudDetectResponse:
        reasons = []
        score = 0.0

        text = req.extracted_text or ""
        resume = req.resume_data or {}

        # Check 1: Implausibly long experience for claimed age/graduation
        exp_years = resume.get("experience_years", 0) or 0
        if exp_years > 30:
            reasons.append("Implausibly long experience claimed (>30 years)")
            score += 15

        # Check 2: Too many skills claimed
        skills = resume.get("skills", [])
        if len(skills) > 40:
            reasons.append(f"Excessive skills listed ({len(skills)} skills — possibly keyword stuffed)")
            score += 20

        # Check 3: Duplicate job titles (same company + title repeated)
        exp_entries = resume.get("experience_entries", [])
        seen = {}
        for entry in exp_entries:
            key = f"{entry.get('company','')}|{entry.get('title','')}"
            if key in seen:
                reasons.append("Duplicate job entries detected")
                score += 25
                break
            seen[key] = True

        # Check 4: Future dates in experience
        future_pattern = re.search(r'20(2[6-9]|[3-9]\d)', text)
        if future_pattern:
            reasons.append(f"Future date detected: {future_pattern.group()}")
            score += 30

        # Check 5: Inconsistent email domain (generic vs professional)
        email = resume.get("email", "")
        if email and any(d in email.lower() for d in ["tempmail", "mailinator", "throwaway", "guerrilla"]):
            reasons.append("Disposable email address detected")
            score += 20

        # Check 6: All-caps or nonsensical text blocks
        caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        if caps_ratio > 0.4 and len(text) > 200:
            reasons.append("Suspicious formatting: excessive uppercase text")
            score += 10

        # Check 7: Very short resume text (possible fake/minimal)
        if len(text.strip()) < 200:
            reasons.append("Resume text too short — may be incomplete or fake")
            score += 15

        score = min(score, 100)

        if score >= 70:
            risk = FraudRiskLevel.CRITICAL
        elif score >= 50:
            risk = FraudRiskLevel.HIGH
        elif score >= 25:
            risk = FraudRiskLevel.MEDIUM
        else:
            risk = FraudRiskLevel.LOW

        return FraudDetectResponse(
            is_fraud=score >= 50,
            risk_level=risk,
            fraud_score=score,
            reasons=reasons,
        )

    def is_duplicate(self, embedding: List[float], campaign_id: int, threshold: float = 0.95) -> bool:
        """Placeholder duplicate check — real implementation would query a vector store."""
        # In production: query Redis/Postgres for stored embeddings and compare cosine similarity
        return False
