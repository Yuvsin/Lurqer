from pydantic import BaseModel, Field
from app.schemas.common import RiskLevel
from enum import Enum

class ScanSource(str, Enum):
    text = "text"
    url = "url"
    extension = "extension"


class ReportFlag(BaseModel):
    title: str
    description: str
    severity: RiskLevel
    evidence: str | None = None # Default value of None. Evidence can be optional

# Max score is 100, lowest score is 100
class CategoryScores(BaseModel):
    phishing: int = Field(ge=0, le=100)
    fakeRecruiter: int = Field(ge=0, le=100)
    scam: int = Field(ge=0, le=100)
    ghost: int = Field(ge=0, le=100)


class Report(BaseModel):
    id: str
    jobId: str | None = None

    company: str
    title: str
    platform: str | None = None

    scanDate: str
    source: ScanSource
    scannedUrl: str | None = None

    riskLevel: RiskLevel
    overallScore: int = Field(ge=0, le=100)
    topFinding: str
    summary: str

    categories: CategoryScores
    flags: list[ReportFlag]

    recommendation: str