
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db

from app.models.grade import Grade
from app.models.tul import Tul
from app.models.tul_movement import TulMovement

from app.schemas.academy import (
    AcademyStatsResponse,
    GradeResponse,
    TulResponse,
    TulMovementResponse,
)


# ==========================================================
# ROUTER ITF ACADEMY
# ==========================================================

router = APIRouter(
    prefix="/api/academy",
    tags=["ITF Academy"],
)


# ==========================================================
# GRAUS GUP I DAN
# ==========================================================

@router.get(
    "/grades",
    response_model=list[GradeResponse],
)
def get_grades(db: Session = Depends(get_db)):
    statement = select(Grade).order_by(
        Grade.category,
        Grade.level,
    )

    return db.scalars(statement).all()


@router.get(
    "/grades/{grade_id}",
    response_model=GradeResponse,
)
def get_grade(
    grade_id: int,
    db: Session = Depends(get_db),
):
    grade = db.get(Grade, grade_id)

    if grade is None:
        raise HTTPException(
            status_code=404,
            detail="Grau no trobat",
        )

    return grade


# ==========================================================
# TULS
# ==========================================================

@router.get(
    "/tuls",
    response_model=list[TulResponse],
)
def get_tuls(db: Session = Depends(get_db)):
    statement = select(Tul).order_by(Tul.id)

    return db.scalars(statement).all()


@router.get(
    "/tuls/{tul_id}",
    response_model=TulResponse,
)
def get_tul(
    tul_id: int,
    db: Session = Depends(get_db),
):
    tul = db.get(Tul, tul_id)

    if tul is None:
        raise HTTPException(
            status_code=404,
            detail="Tul no trobat",
        )

    return tul


# ==========================================================
# ESTADÍSTIQUES
# ==========================================================

@router.get(
    "/stats",
    response_model=AcademyStatsResponse,
)
def get_stats(db: Session = Depends(get_db)):
    total_tuls = db.scalar(
        select(func.count(Tul.id))
    ) or 0

    total_grades = db.scalar(
        select(func.count(Grade.id))
    ) or 0

    total_movements = db.scalar(
        select(func.coalesce(func.sum(Tul.movements), 0))
    ) or 0

    return AcademyStatsResponse(
        total_tuls=total_tuls,
        total_grades=total_grades,
        total_movements=total_movements,
    )


# ==========================================================
# MOVIMENTS INDIVIDUALS D'UN TUL
# ==========================================================

@router.get(
    "/tuls/{tul_id}/movements",
    response_model=list[TulMovementResponse],
)
def get_tul_movements(
    tul_id: int,
    db: Session = Depends(get_db),
):
    """
    Retorna els moviments d'un tul,
    ordenats pel número de moviment.

    Inclou els camps en català i,
    quan existeixin, els textos originals.
    """

    tul = db.get(Tul, tul_id)

    if tul is None:
        raise HTTPException(
            status_code=404,
            detail="Tul no trobat",
        )

    statement = (
        select(TulMovement)
        .where(TulMovement.tul_id == tul_id)
        .order_by(TulMovement.movement_number)
    )

    return db.scalars(statement).all()


# ==========================================================
# MOVIMENT INDIVIDUAL
# ==========================================================

@router.get(
    "/tuls/{tul_id}/movements/{movement_number}",
    response_model=TulMovementResponse,
)
def get_tul_movement(
    tul_id: int,
    movement_number: int,
    db: Session = Depends(get_db),
):
    """
    Retorna un moviment concret
    del tul seleccionat.
    """

    tul = db.get(Tul, tul_id)

    if tul is None:
        raise HTTPException(
            status_code=404,
            detail="Tul no trobat",
        )

    statement = select(TulMovement).where(
        TulMovement.tul_id == tul_id,
        TulMovement.movement_number == movement_number,
    )

    movement = db.scalar(statement)

    if movement is None:
        raise HTTPException(
            status_code=404,
            detail="Moviment no trobat",
        )

    return movement
