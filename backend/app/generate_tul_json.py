"""Genera fitxers JSON per al carregador d'ITF Hub v2.

No desa res a PostgreSQL i no fa traducció automàtica.
Les descripcions de la font es conserven a *_original.
Els camps catalans es marquen com a pendents de revisió.

Exemples:
    python -m app.generate_tul_json --tul Chon-Ji
    python -m app.generate_tul_json
    python -m app.generate_tul_json --overwrite-json
"""

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from app.itf_source_parser import NAMES, EXPECTED, SOURCES, download, parse_source

DEST = Path(__file__).resolve().parent / 'academy_movements'


def filename(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-') + '.json'


def convert(name: str, raw: list[dict]) -> dict:
    movements = []
    for item in raw:
        n = item['movement_number']
        original = item['execution'].strip()
        # La tècnica abreujada de l'extractor no és una traducció,
        # és text de la mateixa font; es conserva només com a original.
        movements.append({
            'movement_number': n,
            'stance': item.get('stance'),
            'technique': f'Moviment {n} — traducció pendent de revisió',
            'technique_original': item.get('technique') or original,
            'direction': item.get('direction'),
            'execution': None,
            'execution_original': original,
            'kihap': bool(re.search(r'\bki[- ]?hap\b', original, re.I)),
            'notes': 'Text català pendent de revisió tècnica. Consulta els camps originals.',
        })
    return {'tul_name': name, 'movements': movements}


def main() -> int:
    cli = argparse.ArgumentParser(description='Genera JSON dels tuls sense escriure a PostgreSQL')
    cli.add_argument('--tul', choices=NAMES, help='Només un tul')
    cli.add_argument('--overwrite-json', action='store_true', help='Substituir JSON existents (precaució)')
    cli.add_argument('--skip-tul', action='append', default=[], choices=NAMES)
    args = cli.parse_args()
    selected = [args.tul] if args.tul else NAMES
    selected = [name for name in selected if name not in args.skip_tul]
    DEST.mkdir(parents=True, exist_ok=True)

    successes = 0
    failed = []
    skipped = 0
    for name in selected:
        destination = DEST / filename(name)
        if destination.exists() and not args.overwrite_json:
            print(f'[CONSERVAT] {name}: {destination.name} ja existeix')
            skipped += 1
            continue
        expected = EXPECTED[NAMES.index(name)]
        try:
            html = download(SOURCES[name])
            # El parser descarta HTML amb numeració incompleta.
            parsed = parse_source(html, name, expected)
            numbers = [r['movement_number'] for r in parsed]
            if numbers != list(range(1, expected + 1)):
                raise ValueError(f'Numeració no consecutiva: {numbers}')
            if not all(r.get('execution', '').strip() for r in parsed):
                raise ValueError('Hi ha moviments sense descripció original')
            converted = convert(name, parsed)
            # Validació final contra el mateix Pydantic que utilitza l'importador.
            from app.schemas.academy import TulMovementsImport
            TulMovementsImport.model_validate(converted)
            # Escriure de manera atòmica per no deixar JSON parcials.
            temporary = destination.with_suffix('.json.tmp')
            temporary.write_text(json.dumps(converted, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            temporary.replace(destination)
            successes += 1
            print(f'[OK] {name}: {expected} moviments -> {destination.name}')
        except Exception as exc:
            failed.append(name)
            print(f'[ERROR] {name}: {exc}', file=sys.stderr)

    print(f'\nJSON creats: {successes}; conservats: {skipped}; errors: {len(failed)}')
    if failed:
        print('Pendents:', ', '.join(failed))
    print('PostgreSQL no s’ha modificat.')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
