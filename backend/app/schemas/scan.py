from pydantic import Field, HttpUrl

from app.schemas.common import ApiModel, JobStatus, ScanSource
from app.schemas.job import JobRead
from app.schemas.report import ReportRead


class ScanUrlRequest(ApiModel):
    url: HttpUrl
    add_to_dashboard: bool = True
    status: JobStatus = JobStatus.applied


class ScanTextFallbackRequest(ApiModel):
    text: str = Field(min_length=20, max_length=100_000)
    company: str = Field(default="Unknown company", max_length=200)
    title: str = Field(default="Untitled posting", max_length=250)
    platform: str = Field(default="Pasted text", max_length=100)
    source_url: HttpUrl | None = None
    add_to_dashboard: bool = True
    status: JobStatus = JobStatus.applied


class ScanResponse(ApiModel):
    source: ScanSource
    job: JobRead
    report: ReportRead
