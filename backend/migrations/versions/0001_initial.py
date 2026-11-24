
"""Esquema inicial d'ITF Academy.

Revision ID: 0001_initial
Revises:
"""

from alembic import op
import sqlalchemy as sa


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "grades",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(10), nullable=False),
        sa.Column("belt_color", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
    )

    op.create_table(
        "tuls",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("meaning", sa.Text(), nullable=False),
        sa.Column("movements", sa.Integer(), nullable=False),
        sa.Column("diagram", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("grade_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["grade_id"],
            ["grades.id"],
        ),
        sa.UniqueConstraint("name"),
    )

    op.create_index(
        "ix_tuls_name",
        "tuls",
        ["name"],
        unique=True,
    )


def downgrade():
    op.drop_index("ix_tuls_name", table_name="tuls")
    op.drop_table("tuls")
    op.drop_table("grades")
