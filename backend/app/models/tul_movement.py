
from __future__ import annotations

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.core.database import Base


class TulMovement(Base):
    """
    Moviment individual d'un tul ITF.

    Els camps technique i execution
    contenen el text visible en català.

    Els camps *_original conserven
    la informació de la font original.
    """

    __tablename__ = "tul_movements"

    __table_args__ = (
        UniqueConstraint(
            "tul_id",
            "movement_number",
            name="uq_tul_movement_number",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    tul_id: Mapped[int] = mapped_column(
        ForeignKey(
            "tuls.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    movement_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # Posició tècnica
    stance: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    # Tècnica en català
    technique: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Tècnica original
    technique_original: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Direcció del diagrama
    direction: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    # Execució en català
    execution: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Execució original
    execution_original: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Crit del moviment
    kihap: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    # Observacions tècniques
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Relació amb el tul
    tul: Mapped["Tul"] = relationship(
        "Tul",
        back_populates="movements_detail",
    )

    def __repr__(self) -> str:
        return (
            f"<TulMovement("
            f"id={self.id}, "
            f"tul_id={self.tul_id}, "
            f"movement_number={self.movement_number}"
            f")>"
        )
