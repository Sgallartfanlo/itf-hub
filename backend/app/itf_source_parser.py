"""Extracció validada de moviments des de fonts públiques.

Requereix beautifulsoup4 i accés HTTP(S).

Ús:
  python -m app.seed_tul_movements --dry-run
  python -m app.seed_tul_movements
  python -m app.seed_tul_movements --tul Juche --overwrite

El text de la font es desa al camp `execution` en anglès, per evitar
traduccions automàtiques inexactes en terminologia tècnica.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from html import unescape
from pathlib import Path
from urllib.error import URLError, HTTPError
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup

NAMES = [
    "Chon-Ji", "Dan-Gun", "Do-San", "Won-Hyo", "Yul-Gok", "Joong-Gun",
    "Toi-Gye", "Hwa-Rang", "Choong-Moo", "Kwang-Gae", "Po-Eun", "Ge-Baek",
    "Eui-Am", "Choong-Jang", "Juche", "Sam-Il", "Yoo-Sin", "Choi-Yong",
    "Yon-Gae", "Ul-Ji", "Moon-Moo", "So-San", "Se-Jong", "Tong-Il",
]
# Recomptes basats en la llista clàssica de 24 tuls.
EXPECTED = [19,21,24,28,38,32,37,29,30,39,36,44,45,52,45,33,68,46,49,42,61,72,24,56]

SOURCES = {
    name: (
        "https://www.matkd.net/juche" if name == "Juche" else
        f"https://www.itf-administration.com/articles/?arturn={834 + index}"
    )
    for index, name in enumerate(NAMES)
}

# Mostra les descripcions originalment publicades, inclosa la informació
# de desplaçaments i posicions. No dedueix tècniques que no constin a la font.

def download(url: str) -> str:
    req = Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; ITFHubEducationalImporter/1.0)",
        "Accept": "text/html,application/xhtml+xml",
    })
    with urlopen(req, timeout=25) as result:
        content = result.read(3_000_000)
        return content.decode(result.headers.get_content_charset() or "utf-8", errors="replace")


def parse_numbered(text: str, expected: int) -> list[dict]:
    """Localitza moviments en HTML transformat en text continu.

    No depèn de salts de línia HTML, que canvien segons la pàgina.
    Els inicis vàlids són 'N. Move/Execute/...' consecutius.
    """
    clean = re.sub(r"\s+", " ", unescape(text)).strip()
    clean = clean.replace("\u00a0", " ")
    # Un número de moviment ha d'anar seguit d'una instrucció, mai d'un any
    # ni d'una referència a una altra posició.
    opening = (r"Move|Execute|Bring|Slide|Turn|Jump|Perform|Lower|Raise|"
               r"Pull|Cross|Shift|Bend|Extend|Form|Place|Step|Kick|"
               r"Strike|Rotate|Pivot|Lift|Stamp|Withdraw|Thrust|"
               r"Spring|Keep|Release|Return|Twist|Deliver|"
               r"Slightly|Maintain|Continue")
    start_re = re.compile(
        r"(?<![A-Za-z0-9])(\d{1,2})\s*[.)]\s+(?=(?:" + opening + r")\b)",
        re.I,
    )
    matches = list(start_re.finditer(clean))
    # Pot haver-hi numeracions de l'article o de la navegació: busquem
    # el primer bloc continu complet de 1 a N, sense saltar cap entrada.
    blocks = []
    for idx, match in enumerate(matches):
        if match.group(1) != "1":
            continue
        selected = [match]
        wanted = 2
        for next_match in matches[idx + 1:]:
            value = int(next_match.group(1))
            if value == wanted:
                selected.append(next_match)
                wanted += 1
                if wanted > expected:
                    break
            elif value == 1 and wanted > 2:
                break
        if len(selected) == expected:
            blocks = selected
            break
    if not blocks:
        encountered = sorted(set(int(x.group(1)) for x in matches))
        raise ValueError(
            f"Numeració no vàlida: no s'ha trobat una seqüència de "
            f"1 a {expected}. Candidats: {encountered[:90]}"
        )
    records = []
    for index, match in enumerate(blocks):
        end = blocks[index+1].start() if index+1 < len(blocks) else len(clean)
        content = clean[match.end():end].strip()
        if index == len(blocks)-1:
            content = re.split(
                r"\bEND\s*:|\bArticle Slideshow\b|\bCopyright\b|"
                r"\b©\s*20\d\d\b|\bYou need to login\b",
                content, maxsplit=1, flags=re.I,
            )[0].strip()
        # Un peu de pàgina intercalat no s'ha d'emmagatzemar com a moviment.
        if len(content) < 12 or len(content) > 1200:
            raise ValueError(
                f"Moviment {index+1} té una longitud sospitosa "
                f"({len(content)} caràcters); revisa la font."
            )
        direction_match = re.search(
            r"\b(?:toward|to|facing)\s+"
            r"(AB|AC|AD|AE|AF|BA|BC|BD|BE|BF|CA|CB|CD|CE|CF|"
            r"DA|DB|DC|DE|DF|EA|EB|EC|ED|EF|FA|FB|FC|FD|FE|A|B|C|D|E|F)\b",
            content, re.I,
        )
        stance_match = re.search(
            r"\b((?:left|right)?\s*(?:walking|L|sitting|rear foot|low|"
            r"fixed|X|one-leg|parallel|close|closed|vertical|diagonal|"
            r"bending|ready)\s+stance(?:\s+[ABCD])?)\b",
            content, re.I,
        )
        # Descripció sencera en anglès per preservar precisió tècnica.
        records.append({
            "movement_number": index + 1,
            "stance": stance_match.group(1).strip() if stance_match else None,
            "technique": content[:240],
            "direction": direction_match.group(1).upper() if direction_match else None,
            "execution": content,
            "notes": None,
        })
    return records


def parse_ordered_list(soup: BeautifulSoup, expected: int) -> list[dict] | None:
    """Llegeix els <li> d'una <ol>; la numeració és HTML, no text.

    En una llista <ol><li>Move...</li></ol>, get_text() elimina
    els números 1, 2, 3... perquè els dibuixa el navegador.
    """
    for ordered in soup.find_all("ol"):
        items = ordered.find_all("li", recursive=False)
        if len(items) != expected:
            continue
        # No confondre el menú de navegació amb la llista de moviments.
        contents = [re.sub(r"\s+", " ", x.get_text(" ", strip=True)).strip() for x in items]
        if not all(12 <= len(x) <= 1200 for x in contents):
            continue
        if not any(re.search(r"\b(?:move|execute|form|bring|slide|turn|jump|perform|kick|step)\b", x, re.I) for x in contents[:3]):
            continue
        # Reutilitza l'extracció de posicions i direccions existent.
        numbered = " ".join(f"{i}. {instruction}" for i, instruction in enumerate(contents, 1))
        try:
            return parse_numbered(numbered, expected)
        except ValueError:
            # Alguns moviments comencen amb instruccions diferents de
            # l'expressió regular. Els <li> ja en garanteixen el número.
            records = []
            for i, content in enumerate(contents, 1):
                direction = re.search(r"\b(?:toward|to|facing)\s+(A|B|C|D|E|F)\b", content, re.I)
                stance = re.search(r"\b((?:left|right)?\s*(?:walking|L|sitting|rear foot|low|fixed|X|one-leg|parallel|close|closed|vertical|diagonal|bending|ready)\s+stance(?:\s+[ABCD])?)\b", content, re.I)
                records.append({
                    "movement_number": i,
                    "stance": stance.group(1).strip() if stance else None,
                    "technique": content[:240],
                    "direction": direction.group(1).upper() if direction else None,
                    "execution": content,
                    "notes": None,
                })
            return records
    return None


def build_records(contents: list[str]) -> list[dict]:
    """Converteix instruccions individuals en registres per a la BD.

    Mai no divideix arbitràriament una instrucció per ajustar-la al
    recompte esperat: si la font no es pot segmentar, falla.
    """
    records = []
    for i, original in enumerate(contents, 1):
        content = re.sub(r"\s+", " ", unescape(original)).strip()
        if not 12 <= len(content) <= 1200:
            raise ValueError(f"Moviment {i}: longitud sospitosa ({len(content)})")
        direction = re.search(
            r"\b(?:toward|to|facing)\s+(AB|AC|AD|AE|AF|BA|BC|BD|BE|BF|CA|CB|CD|CE|CF|DA|DB|DC|DE|DF|EA|EB|EC|ED|EF|FA|FB|FC|FD|FE|A|B|C|D|E|F)\b",
            content, re.I,
        )
        stance = re.search(
            r"\b((?:left|right)?\s*(?:walking|L|sitting|rear foot|low|fixed|X|one-leg|parallel|close|closed|vertical|diagonal|bending|ready)\s+stance(?:\s+[ABCD])?)\b",
            content, re.I,
        )
        records.append({
            "movement_number": i,
            "stance": stance.group(1).strip() if stance else None,
            "technique": content[:240],
            "direction": direction.group(1).upper() if direction else None,
            "execution": content,
            "notes": None,
        })
    return records


# Verbs que poden començar una instrucció individual. No exigim que
# totes les instruccions comencin amb Move (aquest era un dels errors).
STEP_BEGIN = re.compile(
    r"^(?:Move|Execute|Bring|Slide|Turn|Jump|Perform|Lower|Raise|Pull|"
    r"Cross|Shift|Bend|Extend|Form|Place|Step|Kick|Strike|Rotate|Pivot|"
    r"Lift|Stamp|Withdraw|Thrust|Spring|Keep|Release|Return|Twist|"
    r"Deliver|Slightly|Maintain|Continue|Assume|Make|Put|Adopt|"
    r"Carry|Drop|Swing|Straighten|Take|Apply|Open|Close|Punch|Block|Change|Land)\b",
    re.I,
)


def parse_dom_instructions(soup: BeautifulSoup, expected: int) -> list[dict]:
    """Extreu instruccions per línia DOM, sense exigir un verb inicial.

    Les pàgines examinades presenten cada moviment en una línia i
    alguns elements auxiliars separats (posició inicial, Ki-Hap i una
    indicació de ritme a Ul-Ji). Mai inventem passos per assolir el total.
    """
    raw = soup.get_text("\n", strip=True)
    marker = re.search(r"Ready\s+Posture\s*[-–:]", raw, re.I)
    if not marker:
        raise ValueError("No s'ha trobat 'Ready Posture'")

    rest = raw[marker.end():]
    end = re.search(r"(?m)^\s*END\s*:", rest, re.I)
    if not end:
        raise ValueError("No s'ha trobat 'END:'; s'atura per seguretat")
    rest = rest[:end.start()]
    lines = [re.sub(r"\s+", " ", unescape(x)).strip()
             for x in rest.splitlines() if x.strip()]
    if not lines:
        raise ValueError("Secció de moviments buida")

    # La primera línia, anterior als moviments, indica la posició inicial.
    # Detectar-la per contingut i no pas descartar sempre la primera línia.
    first = lines[0]
    if re.fullmatch(
        r"(?:PARALLEL|CLOSED?|WARRIOR|SITTING|WALKING|L|X|"
        r"(?:LEFT|RIGHT)\s+\w+)"
        r"(?:\s+(?:READY|STANCE|WITH|AN|A|B|C|D|THE|TWIN|HAND|BACK|X|ELBOW|SIDE|FOREARM|KNIFE))*"
        r"(?:\s+\w+)*",
        first,
        re.I,
    ) and not STEP_BEGIN.match(first):
        lines.pop(0)
    elif re.search(r"\b(?:READY|STANCE)\b", first, re.I) and not STEP_BEGIN.match(first):
        lines.pop(0)

    movements: list[str] = []
    for line in lines:
        line = re.sub(r"^\d{1,3}\s*[.)]\s*", "", line)
        if re.fullmatch(r"Ki[- ]?Hap[.!]?", line, re.I):
            if not movements:
                raise ValueError("Ki-Hap abans del primer moviment")
            movements[-1] += " Ki-Hap."
            continue
        # Nota editorial específica d'Ul-Ji, no és un moviment.
        # No es descarten altres 'Perform...' perquè poden ser passos reals.
        if re.fullmatch(r"Perform\s+2\s+and\s+3\s+in\s+a\s+continuous\s+motion\.?", line, re.I):
            if not movements:
                raise ValueError("Nota de ritme abans del primer moviment")
            movements[-1] += " " + line
            continue
        if len(line) < 12 or len(line) > 1200:
            raise ValueError(
                f"Fragment curt/llarg no reconegut ({len(line)} caràcters): {line[:120]!r}"
            )
        # Una pàgina amb 'END' i el nombre correcte encara podria contenir
        # notes. Comprovem que els fragments tenen forma d'instrucció.
        if not STEP_BEGIN.match(line):
            raise ValueError(f"Fragment no identificat com a instrucció: {line[:120]!r}")
        movements.append(line)

    if len(movements) != expected:
        raise ValueError(
            f"HTML DOM: {len(movements)} moviments trobats, "
            f"esperats {expected}. "
            f"Inicis: {[x[:55] for x in movements[:3]]}"
        )
    return build_records(movements)


def parse_source(html: str, name: str, expected: int) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    for node in soup(["script", "style", "nav", "footer", "header"]):
        node.decompose()
    text = re.sub(r"\s+", " ", unescape(soup.get_text(" ", strip=True))).strip()
    marker_text = r"STEP\s*[- ]?BY\s*[- ]?STEP\s*:" if name == "Juche" else r"Movements\s*[-–:]\s*\d+"
    marker = re.search(marker_text, text, re.I)
    if not marker:
        raise ValueError(f"No s'ha trobat l'apartat de moviments de {name}")
    if name != "Juche":
        count = int(re.search(r"\d+", marker.group(0)).group())
        if count != expected:
            raise ValueError(f"La font indica {count} moviments; s'esperaven {expected}")
    else:
        count_match = re.search(r"MOVEMENTS\s*:\s*(\d+)", text, re.I)
        if not count_match or int(count_match.group(1)) != expected:
            raise ValueError("La font de Juche no confirma el recompte")

    ordered = parse_ordered_list(soup, expected)
    if ordered is not None:
        return ordered
    try:
        return parse_numbered(text[marker.end():], expected)
    except ValueError:
        return parse_dom_instructions(soup, expected)

