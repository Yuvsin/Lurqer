from pydantic import BaseModel
from enum import Enum
from app.schemas.common import RiskLevel

class JobStatus(str, Enum):
    applied = "Applied"
    screening = "Screening"
    interview = "Interview"
    offer = "Offer"
    rejected = "Rejected"
    ghosted = "Ghosted"
    no_response = "No response"


class Job(BaseModel):
    id: str
    company: str
    title: str
    platform: str

    dateApplied: str
    status: JobStatus
    riskLevel: RiskLevel

    location: str | None = None
    jobUrl: str | None = None
    notes: str | None = None

    createdAt: str | None = None
    updatedAt: str | None = None