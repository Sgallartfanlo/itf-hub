
from pydantic import BaseModel, ConfigDict, Field


# ==========================================================
# GRAUS DEL TAEKWON-DO ITF
# ==========================================================

class GradeResponse(BaseModel):
    """
    Esquema de resposta dels graus GUP i DAN.

    Exemples:
        10 GUP
        1 GUP
        I DAN
        II DAN
        III DAN
    """

    id: int
    name: str
    level: int
    category: str
    belt_color: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# TULS DEL TAEKWON-DO ITF
# ==========================================================

class TulResponse(BaseModel):
    """
    Esquema de resposta d'un tul.

    Conté:
        - Identificador
        - Nom del tul
        - Significat
        - Nombre total de moviments
        - Diagrama
        - Descripció
        - Grau associat
    """

    id: int
    name: str
    meaning: str
    movements: int
    diagram: str | None = None
    description: str | None = None
    grade_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# MOVIMENTS INDIVIDUALS DELS TULS
# ==========================================================

class TulMovementResponse(BaseModel):
    """
    Esquema de resposta d'un moviment individual.

    Camps en català:
        technique
        execution
        stance
        notes

    Camps originals en anglès:
        technique_original
        execution_original

    El camp kihap indica si el moviment inclou un crit.
    """

    id: int
    tul_id: int
    movement_number: int

    # Posició tècnica
    stance: str | None = None

    # Tècnica en català
    technique: str

    # Tècnica original en anglès
    technique_original: str | None = None

    # Direcció del diagrama
    direction: str | None = None

    # Execució en català
    execution: str | None = None

    # Execució original en anglès
    execution_original: str | None = None

    # Crit del moviment
    kihap: bool = False

    # Observacions
    notes: str | None = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# ESTADÍSTIQUES D'ITF ACADEMY
# ==========================================================

class AcademyStatsResponse(BaseModel):
    """
    Estadístiques generals de l'acadèmia.

    total_movements és la suma dels moviments
    indicats a les fitxes dels tuls, no el nombre
    de registres de la taula tul_movements.
    """

    total_tuls: int
    total_grades: int
    total_movements: int


# ==========================================================
# ESQUEMES DE VALIDACIÓ PER A FUTURES IMPORTACIONS
# ==========================================================

class TulMovementImport(BaseModel):
    """
    Estructura per validar moviments procedents
    de fitxers JSON abans d'importar-los.

    No modifica PostgreSQL per si sola.
    """

    movement_number: int = Field(
        ge=1,
        description="Número del moviment, començant per 1.",
    )

    stance: str | None = None

    technique: str = Field(
        min_length=1,
        description="Nom de la tècnica en català.",
    )

    technique_original: str | None = None
    direction: str | None = None

    execution: str | None = None
    execution_original: str | None = None

    kihap: bool = False
    notes: str | None = None

    model_config = ConfigDict(extra="forbid")


class TulMovementsImport(BaseModel):
    """
    Conjunt de moviments d'un tul.

    Permet preparar la importació completa
    de les seqüències dels 24 tuls.
    """

    tul_name: str = Field(
        min_length=1,
        description="Nom del tul, per exemple Chon-Ji.",
    )

    movements: list[TulMovementImport] = Field(
        min_length=1,
        description="Llista de moviments del tul.",
    )

    model_config = ConfigDict(extra="forbid")
