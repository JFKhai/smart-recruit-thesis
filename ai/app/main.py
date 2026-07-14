from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from app.services.embedding_service import generate_embedding
from app.services.matching_service import calculate_cosine_similarity

app = FastAPI(title="Smart Recruit AI Service")

class TextRequest(BaseModel):
    text: str

class MatchingRequest(BaseModel):
    cv_vector: List[float]
    job_vector: List[float]

@app.get("/")
def read_root():
    return {"status": "AI Service is online"}

@app.post("/get-embedding")
async def get_embedding_endpoint(request: TextRequest):
    vector = generate_embedding(request.text)
    return {"embedding": vector}

@app.post("/calculate-matching")
async def calculate_matching_endpoint(request: MatchingRequest):
    score = calculate_cosine_similarity(request.cv_vector, request.job_vector)
    return {"score": score}