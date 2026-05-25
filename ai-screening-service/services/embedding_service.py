"""Sentence-transformer embedding service with lazy loading."""
import os
import numpy as np
from typing import List

_model = None  # lazy-loaded

def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        model_name = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")
        _model = SentenceTransformer(model_name)
    return _model

class EmbeddingService:

    def embed(self, text: str) -> List[float]:
        """Generate embedding vector for given text. Truncates to 512 tokens."""
        try:
            model = _get_model()
            # Truncate long text
            truncated = " ".join(text.split()[:400])
            embedding = model.encode(truncated, normalize_embeddings=True)
            return embedding.tolist()
        except Exception as e:
            # Return zero vector on failure (model not loaded)
            return [0.0] * 384  # all-MiniLM-L6-v2 dimension

    def cosine_similarity(self, a: List[float], b: List[float]) -> float:
        a_arr = np.array(a)
        b_arr = np.array(b)
        if np.linalg.norm(a_arr) == 0 or np.linalg.norm(b_arr) == 0:
            return 0.0
        return float(np.dot(a_arr, b_arr) / (np.linalg.norm(a_arr) * np.linalg.norm(b_arr)))
