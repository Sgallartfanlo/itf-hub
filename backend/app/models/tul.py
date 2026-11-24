
from __future__ import annotations

from sqlalchemy import (
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.core.database import Base


# ==========================================================
# MODEL: TUL
# ==========================================================

class Tul(Base):
    """
    Representa un tul del Taekwon-Do ITF.

    Cada tul conté:
        - Nom
        - Significat
        - Nombre total de moviments
        - Diagrama
        - Descripció
        - Grau associat
        - Moviments individuals

    Relacions:
        Grade (N:1)
        TulMovement (1:N)
    """

    __tablename__ = "tuls"

    # ======================================================
    # IDENTIFICADOR
    # ======================================================

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    # ======================================================
    # INFORMACIÓ GENERAL
    # ======================================================

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True,
    )

    meaning: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    movements: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    diagram: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # ======================================================
    # RELACIÓ AMB ELS GRAUS
    # ======================================================

    grade_id: Mapped[int | None] = mapped_column(
        ForeignKey("grades.id"),
        nullable=True,
    )

    grade: Mapped["Grade | None"] = relationship(
        "Grade",
        back_populates="tuls",
    )

    # ======================================================
    # RELACIÓ AMB ELS MOVIMENTS
    # ======================================================

    movements_detail: Mapped[list["TulMovement"]] = relationship(
        "TulMovement",
        back_populates="tul",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="TulMovement.movement_number",
    )

    # ======================================================
    # REPRESENTACIÓ
    # ======================================================

    def __repr__(self) -> str:
        return (
            f"<Tul("
            f"id={self.id}, "
            f"name='{self.name}', "
            f"movements={self.movements}, "
            f"grade_id={self.grade_id}"
            f")>"
        )
