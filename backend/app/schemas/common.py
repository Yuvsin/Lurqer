from enum import Enum

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        from_attributes=True,
        populate_by_name=True,
    )


class RiskLevel(str, Enum):
    low = "Low"
    medium = "Medium"
    high = "High"


class Severity(str, Enum):
    low = "Low"
    medium = "Medium"
    high = "High"


class JobStatus(str, Enum):
    applied = "Applied"
    screening = "Screening"
    interview = "Interview"
    offer = "Offer"
    rejected = "Rejected"
    ghosted = "Ghosted"
    no_response = "No response"


class ScanSource(str, Enum):
    text = "text"
    url = "url"
    extension = "extension"
