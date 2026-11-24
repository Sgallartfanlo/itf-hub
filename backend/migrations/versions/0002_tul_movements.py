
"""Afegir els moviments individuals dels tuls.

Revision ID: 0002_tul_movements
Revises: 0001_initial
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_tul_movements"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "tul_movements",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "tul_id",
            sa.Integer(),
            sa.ForeignKey(
                "tuls.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),

        sa.Column(
            "movement_number",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "stance",
            sa.String(200),
            nullable=True,
        ),

        sa.Column(
            "technique",
            sa.Text(),
            nullable=False,
        ),

        sa.Column(
            "direction",
            sa.String(30),
            nullable=True,
        ),

        sa.Column(
            "execution",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "kihap",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),

        sa.Column(
            "notes",
            sa.Text(),
            nullable=True,
        ),

        sa.UniqueConstraint(
            "tul_id",
            "movement_number",
            name="uq_tul_movement_number",
        ),
    )

    op.create_index(
        "ix_tul_movements_tul_id",
        "tul_movements",
        ["tul_id"],
    )


def downgrade():
    op.drop_index(
        "ix_tul_movements_tul_id",
        table_name="tul_movements",
    )

    op.drop_table("tul_movements")
