"""Paves AI Screening Service — FastAPI microservice for resume parsing, embedding, scoring and fraud detection."""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import parse, embed, score, fraud, search

load_dotenv()

app = FastAPI(
    title="Paves AI Screening Service",
    version="1.0.0",
    description="AI/NLP microservice for resume parsing, embedding, scoring and fraud detection",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parse.router,  prefix="/ai", tags=["Parsing"])
app.include_router(embed.router,  prefix="/ai", tags=["Embeddings"])
app.include_router(score.router,  prefix="/ai", tags=["Scoring"])
app.include_router(fraud.router,  prefix="/ai", tags=["Fraud Detection"])
app.include_router(search.router, prefix="/ai", tags=["Search & Normalization"])

@app.get("/health", tags=["default"])
def health():
    return {"status": "ok", "service": "paves-ai-screening"}
