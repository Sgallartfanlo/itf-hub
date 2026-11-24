
"""Afegir camps de text original als moviments.

Revision ID: 0003_translation_fields
Revises: 0002_tul_movements
"""

from alembic import op
import sqlalchemy as sa


revision = "0003_translation_fields"
down_revision = "0002_tul_movements"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "tul_movements",
        sa.Column(
            "technique_original",
            sa.Text(),
            nullable=True,
        ),
    )

    op.add_column(
        "tul_movements",
        sa.Column(
            "execution_original",
            sa.Text(),
            nullable=True,
        ),
    )


def downgrade():
    op.drop_column(
        "tul_movements",
        "execution_original",
    )

    op.drop_column(
        "tul_movements",
        "technique_original",
    )
