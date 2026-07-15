from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.job import Job


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Report(SQLModel, table=True):
    __tablename__ = "reports"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
    )

    # Supabase user UUID taken from the verified JWT.
    user_id: UUID = Field(
        nullable=False,
        index=True,
    )

    # Foreign key containing the ID of the related Job row.
    job_id: UUID = Field(
        foreign_key="jobs.id",
        ondelete="CASCADE",
        nullable=False,
        index=True,
    )

    risk_level: str = Field(
        max_length=10,
    )

    overall_score: int = Field(
        ge=0,
        le=100,
    )

    top_finding: str | None = Field(
        default=None,
        max_length=500,
    )

    categories: dict[str, int] = Field(
        default_factory=dict,
        sa_column=Column(
            JSONB,
            nullable=False,
        ),
    )

    findings: list[dict[str, Any]] = Field(
        default_factory=list,
        sa_column=Column(
            JSONB,
            nullable=False,
        ),
    )

    scan_date: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
        ),
    )

    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
        ),
    )

    # Python relationship attribute—not a separate database column.
    job: Job = Relationship(
        back_populates="reports",
    )