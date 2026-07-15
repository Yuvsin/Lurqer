from app.schemas.job import JobCreate, JobRead, JobUpdate
from app.schemas.report import ReportRead
from app.schemas.scan import ScanResponse, ScanTextFallbackRequest, ScanUrlRequest

__all__ = [
    "JobCreate",
    "JobRead",
    "JobUpdate",
    "ReportRead",
    "ScanResponse",
    "ScanTextFallbackRequest",
    "ScanUrlRequest",
]
