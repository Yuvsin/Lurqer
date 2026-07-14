from __future__ import annotations
#job refers to reports but reports will also refer to jobs so 
#future annotations is needed
from datetime import date, datetime, timezone
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.report import Report


def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Job(SQLModel, table=True):
    _tablename__ = "jobs"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "normalized_source_url",
            name="uq_jobs_user_normalized_source_url",
        ),
    )

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
    )

    #comes from Supabase JWT, not request body from the web browser
    user_id: UUID = Field(
        nullable = False, #user_id can't be false
        index = True, #makes an index in the database table
    )

    company: str = Field(
        max_length=100,
    )

    title: str = Field(
        max_length = 50,
    )

    platform: str = Field(
        max_length=50,
    )
    
    source_url: str = Field(
        max_length=2048,
    )

    normalzed_source_url: str = Field(
        max_length=2048,
        index=True,
    )

    location: str | None = Field(
        max_length=50,
    )

    status: str = Field(
        default="Saved",
        max_length=30,
    )

    date_applied: date | None = Field(
        default = None,
    )

    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
        ),
    )

    updated_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
        ),
    )

    reports: list["Report"] = Relationship(
        back_populates="job",
        cascade_delete=True #automatically deletes child rows when parent is deleted
    )