"""Embedding endpoint."""
from fastapi import APIRouter
from models.schemas import EmbedRequest, EmbedResponse
from services.embedding_service import EmbeddingService

router = APIRouter()
embedder = EmbeddingService()

@router.post("/layer2-embed", response_model=EmbedResponse)
async def layer2_embed(req: EmbedRequest):
    """Generate sentence-transformer embedding for semantic similarity (Layer 2)."""
    embedding = embedder.embed(req.text)
    return EmbedResponse(embedding=embedding, tokens_used=len(req.text.split()))
