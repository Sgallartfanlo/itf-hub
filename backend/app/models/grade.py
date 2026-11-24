
from __future__ import annotations

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Grade(Base):
    __tablename__ = "grades"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    name: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    level: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )

    belt_color: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    tuls: Mapped[list["Tul"]] = relationship(
        "Tul",
        back_populates="grade",
    )
