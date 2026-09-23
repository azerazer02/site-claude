#!/usr/bin/env python3
"""Met à jour les rangs et cotes de bataille (BR) de assets/js/data.js.

Source : fichiers extraits du client du jeu, publiés par le dépôt public
https://github.com/gszabi99/War-Thunder-Datamine (config/wpcost.blkx).
Pour chaque véhicule, BR = economicRank / 3 + 1, pour chaque mode de jeu.

Usage : python3 tools/maj_br.py            (télécharge les données)
        python3 tools/maj_br.py wpcost.blkx (fichier déjà téléchargé)
"""
import json, re, sys, urllib.request
from pathlib import Path

RAW = 'https://raw.githubusercontent.com/gszabi99/War-Thunder-Datamine/master/'
DATA = Path(__file__).resolve().parent.parent / 'assets' / 'js' / 'data.js'


def fetch(path):
    with urllib.request.urlopen(RAW + path, timeout=120) as r:
        return r.read().decode('utf-8')


def main():
    wp = json.loads(open(sys.argv[1]).read() if len(sys.argv) > 1 else fetch('char.vromfs.bin_u/config/wpcost.blkx'))
    try:
        version = fetch('version').strip()
    except Exception:
        version = ''
    src = DATA.read_text(encoding='utf-8')
    pairs = re.findall(r"\{ id:'([^']+)', dm:'([^']+)'", src)
    rows, missing = [], []
    br = lambda u, k: round(u[k] / 3 + 1, 1)
    for vid, dm in pairs:
        u = wp.get(dm)
        if not isinstance(u, dict):
            missing.append(f'{vid} ({dm})')
            continue
        prem = 1 if u.get('costGold') else 0
        rows.append(f"    {vid}:[{u['rank']}, {br(u, 'economicRankArcade')}, {br(u, 'economicRankHistorical')}, {br(u, 'economicRankSimulation')}, {prem}],")
    if missing:
        sys.exit('Identifiants introuvables dans les données du jeu : ' + ', '.join(missing))
    block = ("/* BR:START */\n"
             f"  const GAME_VERSION = '{version}';\n"
             "  const BR = {\n" + '\n'.join(rows) + "\n  };\n"
             "  /* BR:END */")
    src = re.sub(r'/\* BR:START \*/.*?/\* BR:END \*/', lambda m: block, src, flags=re.S)
    DATA.write_text(src, encoding='utf-8')
    print(f'{len(rows)} véhicules mis à jour (version du jeu : {version or "inconnue"}).')


if __name__ == '__main__':
    main()
