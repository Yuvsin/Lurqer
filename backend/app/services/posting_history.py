from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, datetime
from uuid import UUID

from sqlmodel import Session, select

from app.models.job import Job


@dataclass(frozen=True)
class PostingHistory:
    posting_date: date | None
    first_seen: datetime
    most_recently_seen: datetime
    observed_age_days: int
    repeat_count: int
    possible_reposting: bool


def posting_fingerprint(company: str, title: str, location: str | None) -> str:
    return "|".join(
        re.sub(r"\s+", " ", value or "").strip().casefold()
        for value in (company, title, location or "")
    )


def derive_posting_history(
    session: Session,
    current_user_id: UUID,
    job: Job,
) -> PostingHistory:
    target = posting_fingerprint(job.company, job.title, job.location)
    owned_jobs = session.exec(
        select(Job).where(Job.user_id == current_user_id)
    ).all()
    matches = [
        candidate
        for candidate in owned_jobs
        if posting_fingerprint(candidate.company, candidate.title, candidate.location) == target
    ] or [job]
    first_seen = min(candidate.created_at for candidate in matches)
    most_recently_seen = max(candidate.updated_at for candidate in matches)
    repeat_count = len({candidate.normalized_source_url for candidate in matches})
    return PostingHistory(
        posting_date=job.posting_date,
        first_seen=first_seen,
        most_recently_seen=most_recently_seen,
        observed_age_days=max(0, (most_recently_seen.date() - first_seen.date()).days),
        repeat_count=max(1, repeat_count),
        possible_reposting=repeat_count > 1,
    )
