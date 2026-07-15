import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import jobs, reports

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

app = FastAPI(title="Lurqer API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router)
app.include_router(reports.router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
