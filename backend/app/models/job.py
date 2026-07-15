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
    __tablename__ = "jobs"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "normalized_source_url",
            name="uq_jobs_user_normalized_source_url",
        ),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(nullable=False, index=True)
    company: str = Field(max_length=200)
    title: str = Field(max_length=250)
    platform: str = Field(max_length=100)
    source_url: str = Field(max_length=2048)
    normalized_source_url: str = Field(max_length=2048, index=True)
    location: str | None = Field(default=None, max_length=200)
    status: str = Field(default="Applied", max_length=30)
    date_applied: date | None = Field(default=None)
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            onupdate=utc_now,
        ),
    )

    reports: list["Report"] = Relationship(
        back_populates="job",
        cascade_delete=True,
    )
