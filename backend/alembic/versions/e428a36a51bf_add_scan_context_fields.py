"""add scan context fields

Revision ID: e428a36a51bf
Revises: dca30cfdbeb0
Create Date: 2026-07-21
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import sqlmodel

revision: str = "e428a36a51bf"
down_revision: Union[str, Sequence[str], None] = "dca30cfdbeb0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("jobs", sa.Column("posting_date", sa.Date(), nullable=True))
    op.add_column(
        "reports",
        sa.Column(
            "quality_concerns",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "reports",
        sa.Column(
            "positive_signals",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "reports",
        sa.Column("submitted_url", sqlmodel.sql.sqltypes.AutoString(length=2048), nullable=True),
    )
    op.add_column(
        "reports",
        sa.Column("final_url", sqlmodel.sql.sqltypes.AutoString(length=2048), nullable=True),
    )
    op.alter_column("reports", "quality_concerns", server_default=None)
    op.alter_column("reports", "positive_signals", server_default=None)


def downgrade() -> None:
    op.drop_column("reports", "final_url")
    op.drop_column("reports", "submitted_url")
    op.drop_column("reports", "positive_signals")
    op.drop_column("reports", "quality_concerns")
    op.drop_column("jobs", "posting_date")
