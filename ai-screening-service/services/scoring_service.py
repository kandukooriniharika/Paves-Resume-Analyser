"""Gemini AI scoring service (Layer 3)."""
import os
import json
import re
from models.schemas import ScoreResumeRequest, ScoreResumeResponse, RecommendationEnum, SeniorityEnum

_gemini_model = None

def _get_gemini():
    global _gemini_model
    if _gemini_model is None:
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None
        genai.configure(api_key=api_key)
        _gemini_model = genai.GenerativeModel(
            "gemini-1.5-flash",
            generation_config={"response_mime_type": "application/json"},
        )
    return _gemini_model

class ScoringService:

    async def score(self, req: ScoreResumeRequest) -> ScoreResumeResponse:
        """Score resume against JD using Gemini 1.5 Flash. Returns structured JSON."""
        resume = req.resume_data
        jd = req.jd_data
        weights = req.weights or {}

        prompt = self._build_prompt(resume, jd, weights)

        try:
            model = _get_gemini()
            if not model:
                return self._fallback_score(resume, jd)

            response = model.generate_content(prompt)
            result = json.loads(response.text)

            return ScoreResumeResponse(
                layer3_score=float(result.get("ai_score", 50)),
                overall_score=float(result.get("overall_score", 50)),
                recommendation=RecommendationEnum(result.get("recommendation", "MAYBE")),
                matched_skills=result.get("matched_skills", []),
                missing_skills=result.get("missing_skills", []),
                strengths=result.get("strengths", []),
                weaknesses=result.get("weaknesses", []),
                ai_feedback=result.get("feedback", ""),
                experience_years=result.get("experience_years"),
                education_level=result.get("education_level"),
                seniority=result.get("seniority"),
            )
        except Exception as e:
            return self._fallback_score(resume, jd)

    def _build_prompt(self, resume: dict, jd: dict, weights: dict) -> str:
        return f"""You are an expert HR analyst at Paves Technologies. Score this candidate resume against the job description.

Job Description:
- Role: {jd.get('title', 'Unknown')}
- Required Skills: {', '.join(jd.get('required_skills', []))}
- Nice to Have: {', '.join(jd.get('nice_to_have_skills', []))}
- Experience Required: {jd.get('min_experience', 0)}-{jd.get('max_experience', 10)} years

Candidate:
- Name: {resume.get('name', 'Unknown')}
- Skills: {', '.join(resume.get('skills', []))}
- Experience: {resume.get('experience_years', 0)} years
- Summary: {str(resume.get('summary', ''))[:300]}

Scoring Weights: Skills={weights.get('skills_weight', 40)}%, Experience={weights.get('experience_weight', 30)}%, Education={weights.get('education_weight', 15)}%, AI={weights.get('ai_score_weight', 15)}%

Respond with ONLY valid JSON (no markdown):
{{
  "ai_score": <0-100 float>,
  "overall_score": <0-100 float>,
  "recommendation": "<STRONGLY_RECOMMENDED|RECOMMENDED|MAYBE|REJECT>",
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill3", "skill4"],
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "feedback": "<2-3 sentence professional summary>",
  "experience_years": <int or null>,
  "education_level": "<Bachelor|Master|PhD|Diploma|Other or null>",
  "seniority": "<INTERN|JUNIOR|MID|SENIOR|LEAD|PRINCIPAL>"
}}"""

    def _fallback_score(self, resume: dict, jd: dict) -> ScoreResumeResponse:
        """Return neutral scores when Gemini is unavailable."""
        resume_skills = set(s.lower() for s in resume.get("skills", []))
        jd_skills = [s.lower() for s in jd.get("required_skills", [])]
        matched = [s for s in jd_skills if s in resume_skills]
        missing = [s for s in jd_skills if s not in resume_skills]
        score = (len(matched) / max(len(jd_skills), 1)) * 100 if jd_skills else 50

        rec = RecommendationEnum.STRONGLY_RECOMMENDED if score >= 80 \
            else RecommendationEnum.RECOMMENDED if score >= 60 \
            else RecommendationEnum.MAYBE if score >= 40 \
            else RecommendationEnum.REJECT

        return ScoreResumeResponse(
            layer3_score=score,
            overall_score=score,
            recommendation=rec,
            matched_skills=matched,
            missing_skills=missing,
            strengths=["Relevant skill set"] if matched else [],
            weaknesses=[f"Missing: {', '.join(missing[:3])}"] if missing else [],
            ai_feedback="AI scoring unavailable — basic keyword match applied.",
        )
