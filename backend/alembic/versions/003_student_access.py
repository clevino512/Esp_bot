"""Add the registrar-managed student access registry.

Revision ID: 003
Revises: 002
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "student_access",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("full_name_normalized", sa.String(length=120), nullable=False),
        sa.Column("identifier_digest", sa.String(length=64), nullable=False),
        sa.Column("masked_identifier", sa.String(length=64), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("identifier_digest"),
    )
    op.create_index("ix_student_access_identifier_digest", "student_access", ["identifier_digest"])
    op.create_index("ix_student_access_full_name_normalized", "student_access", ["full_name_normalized"])


def downgrade() -> None:
    op.drop_index("ix_student_access_full_name_normalized", table_name="student_access")
    op.drop_index("ix_student_access_identifier_digest", table_name="student_access")
    op.drop_table("student_access")