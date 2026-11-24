
"""
ITF HUB V2 - IMPORTADOR DE MOVIMENTS

Funcionalitats:
- Importar dades dels 24 tuls des de JSON.
- Validar la numeració dels moviments.
- Conservar els textos originals en anglès.
- Conservar les traduccions en català.
- Evitar duplicats.
- Simular sense modificar PostgreSQL.
- Actualitzar registres només amb --overwrite.

Comandes:
    python -m app.seed_tul_movements --list
    python -m app.seed_tul_movements --dry-run
    python -m app.seed_tul_movements --tul Chon-Ji
    python -m app.seed_tul_movements --overwrite

No descarrega informació ni utilitza
serveis externs de traducció.
"""

import argparse
import json
import re
import sys

from pathlib import Path

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.tul import Tul
from app.models.tul_movement import TulMovement
from app.schemas.academy import TulMovementsImport


# ==========================================================
# CONFIGURACIÓ
# ==========================================================

DATA_DIRECTORY = (
    Path(__file__).resolve().parent
    / "academy_movements"
)

TUL_NAMES = [
    "Chon-Ji",
    "Dan-Gun",
    "Do-San",
    "Won-Hyo",
    "Yul-Gok",
    "Joong-Gun",
    "Toi-Gye",
    "Hwa-Rang",
    "Choong-Moo",
    "Kwang-Gae",
    "Po-Eun",
    "Ge-Baek",
    "Eui-Am",
    "Choong-Jang",
    "Juche",
    "Sam-Il",
    "Yoo-Sin",
    "Choi-Yong",
    "Yon-Gae",
    "Ul-Ji",
    "Moon-Moo",
    "So-San",
    "Se-Jong",
    "Tong-Il",
]

MOVEMENT_FIELDS = [
    "stance",
    "technique",
    "technique_original",
    "direction",
    "execution",
    "execution_original",
    "kihap",
    "notes",
]


# ==========================================================
# UTILITATS
# ==========================================================

def slugify(value: str) -> str:
    return re.sub(
        r"[^a-z0-9]+",
        "-",
        value.lower(),
    ).strip("-")


def json_path(tul_name: str) -> Path:
    return DATA_DIRECTORY / f"{slugify(tul_name)}.json"


def print_title(title: str):
    print()
    print("=" * 60)
    print(title)
    print("=" * 60)


# ==========================================================
# LECTURA DEL JSON
# ==========================================================

def read_movements(tul_name: str):
    path = json_path(tul_name)

    if not path.is_file():
        raise FileNotFoundError(
            f"No existeix el fitxer: {path}"
        )

    try:
        with path.open(
            "r",
            encoding="utf-8-sig",
        ) as file:
            raw = json.load(file)

    except json.JSONDecodeError as error:
        raise ValueError(
            f"JSON incorrecte: {error}"
        ) from error

    try:
        data = TulMovementsImport.model_validate(raw)

    except ValidationError as error:
        raise ValueError(
            f"Format de dades incorrecte:\n{error}"
        ) from error

    if data.tul_name != tul_name:
        raise ValueError(
            f"El fitxer correspon a '{data.tul_name}', "
            f"però s'esperava '{tul_name}'."
        )

    return data


# ==========================================================
# VALIDACIÓ
# ==========================================================

def validate_sequence(data, expected_count: int):
    numbers = [
        movement.movement_number
        for movement in data.movements
    ]

    if len(numbers) != len(set(numbers)):
        raise ValueError(
            "Hi ha números de moviment duplicats."
        )

    expected = set(range(1, expected_count + 1))
    received = set(numbers)

    missing = sorted(expected - received)
    extra = sorted(received - expected)

    if missing or extra:
        raise ValueError(
            f"Numeració incorrecta. "
            f"Esperats: {expected_count}. "
            f"Rebuts: {len(numbers)}. "
            f"Falten: {missing}. "
            f"Sobren: {extra}."
        )

    for movement in data.movements:
        if not movement.technique.strip():
            raise ValueError(
                f"Moviment {movement.movement_number}: "
                "la tècnica està buida."
            )

        if (
            movement.technique_original is not None
            and not movement.technique_original.strip()
        ):
            raise ValueError(
                f"Moviment {movement.movement_number}: "
                "technique_original no pot ser buit."
            )

    return sorted(
        data.movements,
        key=lambda movement: movement.movement_number,
    )


# ==========================================================
# IMPORTACIÓ D'UN TUL
# ==========================================================

def import_tul(
    db: Session,
    tul_name: str,
    dry_run: bool = False,
    overwrite: bool = False,
):
    tul = db.scalar(
        select(Tul).where(
            Tul.name == tul_name
        )
    )

    if tul is None:
        raise ValueError(
            f"El tul '{tul_name}' no existeix "
            "a PostgreSQL."
        )

    tul_id = tul.id
    expected_count = tul.movements

    data = read_movements(tul_name)

    movements = validate_sequence(
        data,
        expected_count,
    )

    existing = {
        movement.movement_number: movement
        for movement in db.scalars(
            select(TulMovement).where(
                TulMovement.tul_id == tul_id
            )
        ).all()
    }

    created = 0
    updated = 0
    skipped = 0

    for movement in movements:
        number = movement.movement_number

        values = movement.model_dump(
            exclude={"movement_number"}
        )

        current = existing.get(number)

        if current is not None:
            if not overwrite:
                skipped += 1
                continue

            updated += 1

            if not dry_run:
                for field in MOVEMENT_FIELDS:
                    setattr(
                        current,
                        field,
                        values[field],
                    )

        else:
            created += 1

            if not dry_run:
                db.add(
                    TulMovement(
                        tul_id=tul_id,
                        movement_number=number,
                        **values,
                    )
                )

    if dry_run:
        db.rollback()
    else:
        db.commit()

    return {
        "name": tul_name,
        "total": expected_count,
        "created": created,
        "updated": updated,
        "skipped": skipped,
    }


# ==========================================================
# LLISTAR ELS 24 TULS
# ==========================================================

def list_tuls():
    print_title("ITF HUB V2 - 24 TULS")

    for name in TUL_NAMES:
        path = json_path(name)

        status = (
            "JSON disponible"
            if path.is_file()
            else "Pendent"
        )

        print(f"{name:<15} {status}")


# ==========================================================
# PROGRAMA PRINCIPAL
# ==========================================================

def main():
    parser = argparse.ArgumentParser(
        description=(
            "Importador de moviments dels 24 tuls "
            "de Taekwon-Do ITF."
        )
    )

    parser.add_argument(
        "--tul",
        type=str,
        help="Importar un únic tul.",
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simular sense modificar PostgreSQL.",
    )

    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Actualitzar moviments existents.",
    )

    parser.add_argument(
        "--list",
        action="store_true",
        help="Mostrar els 24 tuls i els JSON disponibles.",
    )

    parser.add_argument(
        "--skip-tul",
        action="append",
        default=[],
        help="Ometre un tul. Es pot repetir.",
    )

    args = parser.parse_args()

    if args.list:
        list_tuls()
        return 0

    if args.tul:
        if args.tul not in TUL_NAMES:
            print(
                f"[ERROR] Tul desconegut: {args.tul}"
            )
            return 1

        selected = [args.tul]
    else:
        selected = TUL_NAMES

    selected = [
        name
        for name in selected
        if name not in args.skip_tul
    ]

    print_title("ITF HUB V2 - IMPORTACIÓ")

    successful = 0
    errors = 0

    total_created = 0
    total_updated = 0
    total_skipped = 0

    with SessionLocal() as db:
        for name in selected:
            try:
                result = import_tul(
                    db=db,
                    tul_name=name,
                    dry_run=args.dry_run,
                    overwrite=args.overwrite,
                )

                successful += 1

                total_created += result["created"]
                total_updated += result["updated"]
                total_skipped += result["skipped"]

                mode = (
                    "SIMULACIÓ"
                    if args.dry_run
                    else "IMPORTAT"
                )

                print(
                    f"[OK] {name}: "
                    f"{result['total']} moviments; "
                    f"nous={result['created']}; "
                    f"actualitzats={result['updated']}; "
                    f"existents={result['skipped']} "
                    f"[{mode}]"
                )

            except Exception as error:
                db.rollback()
                errors += 1

                print(
                    f"[ERROR] {name}: {error}"
                )

    print_title("RESULTAT FINAL")

    print(f"Tuls correctes: {successful}")
    print(f"Tuls amb errors: {errors}")
    print(f"Moviments nous: {total_created}")
    print(f"Moviments actualitzats: {total_updated}")
    print(f"Moviments conservats: {total_skipped}")

    if args.dry_run:
        print(
            "Simulació finalitzada: "
            "no s'ha modificat PostgreSQL."
        )

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
