from enum import Enum
from pydantic import BaseModel, Field

class RiskLevel(str, Enum):
    high = "High"
    medium = "Medium"
    low = "Low"

class Severity(str, Enum):
    high = "High"
    medium = "Medium"
    low = "Low"

class JobStatus(str, Enum):
    applied = "Applied"
    screening = "Screening"
    interview = "Interview"
    offer = "Offer"
    rejected = "Rejected"
    ghosted = "Ghosted"
    no_response = "No response"

class Finding(BaseModel):
    id: str
    severity: Severity
    category: str
    title: str
    evidence: str
    description: str
    recommendation: str
    points: int = Field(ge=0)

class CategoryScores(BaseModel):
    phishing: int = Field(ge=0, le=100)
    fakeRecruiter: int = Field(ge=0, le=100)
    scam: int = Field(ge=0, le=100)
    ghost: int = Field(ge=0, le=100)

class Job(BaseModel):
    id: str
    company: str
    title: str
    platform: str
    date: str
    riskLevel: RiskLevel
    status: JobStatus

    overallScore: int | None = Field(default=None, ge=0, le=100)
    scanDate: str | None = None
    dateApplied: str | None = None
    topFinding: str | None = None
    categories: CategoryScores | None = None
    findings: list[Finding] | None = None