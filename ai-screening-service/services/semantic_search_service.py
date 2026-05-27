"""
In-memory vector store for semantic candidate search.

In production replace the in-memory dict with pgvector or a dedicated
vector DB (Pinecone, Qdrant, Weaviate).  The interface stays the same.
"""
from __future__ import annotations

import numpy as np
from sentence_transformers import SentenceTransformer

_model: SentenceTransformer | None = None
# { resume_id: (embedding_np_array, metadata_dict) }
_store: dict[str, tuple[np.ndarray, dict]] = {}


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def index_candidate(resume_id: str, text: str, metadata: dict) -> None:
    """Embed candidate text and store it in the in-memory index."""
    model = _get_model()
    emb = model.encode(text, normalize_embeddings=True)
    _store[resume_id] = (emb, metadata)


def search(query: str, campaign_id: str | None = None, top_k: int = 10) -> list[dict]:
    """
    Find the top-k candidates whose embedding is most similar to the query.
    If campaign_id is provided, only candidates from that campaign are returned.
    """
    if not _store:
        return []

    model = _get_model()
    query_emb = model.encode(query, normalize_embeddings=True)

    scores: list[tuple[float, str, dict]] = []
    for rid, (emb, meta) in _store.items():
        if campaign_id and meta.get("campaign_id") != campaign_id:
            continue
        score = float(np.dot(query_emb, emb))
        scores.append((score, rid, meta))

    scores.sort(key=lambda x: x[0], reverse=True)
    return [
        {"resume_id": rid, "score": round(score, 4), **meta}
        for score, rid, meta in scores[:top_k]
    ]


def remove_candidate(resume_id: str) -> None:
    _store.pop(resume_id, None)


def store_size() -> int:
    return len(_store)
