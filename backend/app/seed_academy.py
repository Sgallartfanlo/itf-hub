
from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.grade import Grade
from app.models.tul import Tul


ROMAN = {
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
    7: "VII",
    8: "VIII",
    9: "IX",
}


# Nom, moviments, categoria, nivell del grau,
# descripció breu del significat.
TULS = [
    ("Chon-Ji", 19, "GUP", 9,
     "Cel i Terra; representa l'inici de la creació."),

    ("Dan-Gun", 21, "GUP", 8,
     "Dangun, figura llegendària fundadora de Corea."),

    ("Do-San", 24, "GUP", 7,
     "Pseudònim del patriota coreà Ahn Chang-Ho."),

    ("Won-Hyo", 28, "GUP", 6,
     "Monjo budista que va contribuir a difondre el budisme a Corea."),

    ("Yul-Gok", 38, "GUP", 5,
     "Pseudònim del filòsof i erudit Yi I."),

    ("Joong-Gun", 32, "GUP", 4,
     "Dedicat al patriota coreà Ahn Joong-Gun."),

    ("Toi-Gye", 37, "GUP", 3,
     "Pseudònim de l'erudit neoconfucià Yi Hwang."),

    ("Hwa-Rang", 29, "GUP", 2,
     "Recorda el grup juvenil Hwarang del regne de Silla."),

    ("Choong-Moo", 30, "GUP", 1,
     "Nom pòstum de l'almirall coreà Yi Sun-Sin."),

    ("Kwang-Gae", 39, "DAN", 1,
     "Dedicat al rei Gwanggaeto de Goguryeo."),

    ("Po-Eun", 36, "DAN", 1,
     "Pseudònim del poeta i funcionari Jeong Mong-Ju."),

    ("Ge-Baek", 44, "DAN", 1,
     "Dedicat al general Ge-Baek de Baekje."),

    ("Eui-Am", 45, "DAN", 2,
     "Pseudònim de Son Byong-Hi, dirigent religiós i independentista."),

    ("Choong-Jang", 52, "DAN", 2,
     "Pseudònim del general Kim Duk-Ryang."),

    ("Juche", 45, "DAN", 2,
     "Tul associat al concepte polític Juche."),

    ("Sam-Il", 33, "DAN", 3,
     "Commemora el moviment independentista de l'1 de març de 1919."),

    ("Yoo-Sin", 68, "DAN", 3,
     "Dedicat al general Kim Yoo-Sin."),

    ("Choi-Yong", 46, "DAN", 3,
     "Dedicat al general Choi Yong de Goryeo."),

    ("Yon-Gae", 49, "DAN", 4,
     "Dedicat al general Yeon Gaesomun de Goguryeo."),

    ("Ul-Ji", 42, "DAN", 4,
     "Dedicat al general Eulji Mundeok."),

    ("Moon-Moo", 61, "DAN", 4,
     "Dedicat al rei Munmu de Silla."),

    ("So-San", 72, "DAN", 5,
     "Pseudònim del monjo budista Hyujeong."),

    ("Se-Jong", 24, "DAN", 5,
     "Dedicat al rei Sejong el Gran."),

    ("Tong-Il", 56, "DAN", 6,
     "Simbolitza la reunificació de Corea."),
]


def get_belt_color(level: int) -> str:
    colors = {
        10: "Blanc",
        9: "Blanc amb punta groga",
        8: "Groc",
        7: "Groc amb punta verda",
        6: "Verd",
        5: "Verd amb punta blava",
        4: "Blau",
        3: "Blau amb punta vermella",
        2: "Vermell",
        1: "Vermell amb punta negra",
    }

    return colors[level]


def seed():
    created_grades = 0
    updated_grades = 0
    created_tuls = 0
    updated_tuls = 0

    with SessionLocal() as db:
        try:
            grade_lookup = {}

            # Graus GUP: 10 fins a 1
            for level in range(10, 0, -1):
                grade = db.scalar(
                    select(Grade).where(
                        Grade.category == "GUP",
                        Grade.level == level,
                    )
                )

                values = {
                    "name": f"{level} GUP",
                    "level": level,
                    "category": "GUP",
                    "belt_color": get_belt_color(level),
                }

                if grade is None:
                    grade = Grade(**values)
                    db.add(grade)
                    created_grades += 1
                else:
                    grade.name = values["name"]
                    grade.belt_color = values["belt_color"]
                    updated_grades += 1

                db.flush()
                grade_lookup[("GUP", level)] = grade.id

            # Graus DAN: I fins a IX
            for level in range(1, 10):
                grade = db.scalar(
                    select(Grade).where(
                        Grade.category == "DAN",
                        Grade.level == level,
                    )
                )

                name = f"{ROMAN[level]} DAN"

                if grade is None:
                    grade = Grade(
                        name=name,
                        level=level,
                        category="DAN",
                        belt_color="Negre",
                    )
                    db.add(grade)
                    created_grades += 1
                else:
                    grade.name = name
                    grade.belt_color = "Negre"
                    updated_grades += 1

                db.flush()
                grade_lookup[("DAN", level)] = grade.id

            # Els 24 tuls Chang-Hon
            for name, movements, category, level, meaning in TULS:
                tul = db.scalar(
                    select(Tul).where(Tul.name == name)
                )

                grade_id = grade_lookup[(category, level)]

                if tul is None:
                    tul = Tul(
                        name=name,
                        movements=movements,
                        meaning=meaning,
                        grade_id=grade_id,
                    )
                    db.add(tul)
                    created_tuls += 1
                else:
                    tul.movements = movements
                    tul.meaning = meaning
                    tul.grade_id = grade_id
                    updated_tuls += 1

            db.commit()

        except Exception:
            db.rollback()
            raise

    print("=" * 50)
    print("ITF HUB V2 - INICIALITZACIO")
    print("=" * 50)
    print(f"Graus creats: {created_grades}")
    print(f"Graus actualitzats: {updated_grades}")
    print(f"Tuls creats: {created_tuls}")
    print(f"Tuls actualitzats: {updated_tuls}")
    print("Inicialitzacio completada correctament!")


if __name__ == "__main__":
    seed()
