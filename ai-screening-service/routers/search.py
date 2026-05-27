"""Semantic candidate search and skill normalization endpoints."""
from fastapi import APIRouter
from pydantic import BaseModel

from services import semantic_search_service as sss
from services.skill_normalizer import normalize_list

router = APIRouter()


# ── Semantic search ───────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str
    campaign_id: str | None = None
    top_k: int = 10


class IndexRequest(BaseModel):
    resume_id: str
    text: str
    campaign_id: str | None = None
    candidate_name: str | None = None
    candidate_email: str | None = None
    overall_score: float | None = None


@router.post("/semantic-search")
def semantic_search(req: SearchRequest):
    results = sss.search(req.query, req.campaign_id, req.top_k)
    return {"query": req.query, "results": results, "total": len(results)}


@router.post("/index-candidate")
def index_candidate(req: IndexRequest):
    """Called by the pipeline after screening to add the candidate to the search index."""
    meta = {
        "campaign_id":      req.campaign_id,
        "candidate_name":   req.candidate_name,
        "candidate_email":  req.candidate_email,
        "overall_score":    req.overall_score,
    }
    sss.index_candidate(req.resume_id, req.text, meta)
    return {"indexed": req.resume_id, "store_size": sss.store_size()}


@router.delete("/index-candidate/{resume_id}")
def remove_from_index(resume_id: str):
    sss.remove_candidate(resume_id)
    return {"removed": resume_id}


# ── Skill normalization ───────────────────────────────────────────────────────

class NormalizeRequest(BaseModel):
    skills: list[str]


@router.post("/normalize-skills")
def normalize_skills(req: NormalizeRequest):
    normalized = normalize_list(req.skills)
    return {"original": req.skills, "normalized": normalized}
