#!/usr/bin/env python3
"""Génère assets/js/balistique-data.js pour le simulateur de blindage de l'Académie.

Source : fichiers extraits du client du jeu, publiés par le dépôt public
https://github.com/gszabi99/War-Thunder-Datamine :
  - gamedata/weapons/groundmodels_weapons/*.blkx : caractéristiques des obus
  - gamedata/damage_model/ricochet.blkx          : probabilités de ricochet
  - gamedata/damage_model/slope_effect.blkx      : effet de l'inclinaison
  - gamedata/damage_model/armor_classes.blkx     : qualité des aciers
  - gamedata/damage_model/damage_system.blkx     : constantes du moteur de dégâts
  - gamedata/damage_model/explosive.blkx         : équivalents TNT

Usage : python3 tools/maj_balistique.py
"""
import json, urllib.request
from pathlib import Path

RAW = 'https://raw.githubusercontent.com/gszabi99/War-Thunder-Datamine/master/'
DM = 'aces.vromfs.bin_u/gamedata/damage_model/'
WEAPONS = 'aces.vromfs.bin_u/gamedata/weapons/groundmodels_weapons/'
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'js' / 'balistique-data.js'

# canon (fichier du jeu) → nom affiché, véhicule, obus retenus (identifiant → nom réel)
GUNS = [
    ('75mm_kwk40_l43_user_cannon', '7,5 cm KwK 40 L/43', 'Pz.IV F2', [('75mm_pzgr_39', 'PzGr 39'), ('75mm_grhl_38_b', 'Gr 38 Hl/B')]),
    ('75mm_kwk42_user_cannon', '7,5 cm KwK 42', 'Panther A', [('75mm_pzrg_39_42', 'PzGr 39/42'), ('75mm_pzrg_40_42', 'PzGr 40/42')]),
    ('88mm_kwk36_user_cannon', '8,8 cm KwK 36', 'Tiger H1', [('88mm_pzrg_39', 'PzGr 39'), ('88mm_pzrg_40', 'PzGr 40'), ('88mm_grhl39', 'Gr 39 Hl')]),
    ('76mm_m1_user_cannon', '76 mm M1', 'M4A3 (76) W', [('76mm_m79', 'M79'), ('76mm_m62', 'M62'), ('76mm_m93', 'M93 HVAP')]),
    ('85mm_zis_s_53_user_cannon', '85 mm ZiS-S-53', 'T-34-85', [('85mm_br_365k', 'BR-365K'), ('85mm_br_365p', 'BR-365P')]),
    ('122mm_d25t_user_cannon', '122 mm D-25T', 'IS-2', [('122mm_br_471', 'BR-471'), ('122mm_br_471d', 'BR-471D')]),
    ('105mm_l7a3_user_cannon', '105 mm L7A3', 'Leopard I', [('105mm_dm13', 'DM13'), ('105mm_dm23', 'DM23'), ('105mm_dm12', 'DM12'), ('105mm_dm502', 'DM502')]),
    ('120mm_l11a5_user_cannon', '120 mm L11A5', 'Chieftain Mk 10', [('120mm_l15a5', 'L15A5'), ('120mm_l23a1', 'L23A1'), ('120mm_l37a7', 'L37A7')]),
    ('120mm_rheinmetall_l55_user_cannon', '120 mm Rh L/55', 'Leopard 2A6', [('120mm_dm53', 'DM53'), ('120mm_dm12a1', 'DM12A1')]),
    ('120mm_m256_m1a2_user_cannon', '120 mm M256', 'M1A2 Abrams', [('120mm_m829a2', 'M829A2'), ('120mm_m830', 'M830')]),
    ('125mm_2a46m_5_user_cannon', '125 mm 2A46M-5', 'T-90A', [('125mm_3bm60', '3BM60'), ('125mm_3bk_29m', '3BK29M')]),
]
ARMORS = [('RHA_tank', 'Acier laminé (RHA)'), ('CHA_tank', 'Acier moulé'), ('RHAHH_tank', 'Acier à haute dureté'), ('tank_structural_steel', 'Acier de construction')]


def fetch(path):
    with urllib.request.urlopen(RAW + path, timeout=120) as r:
        return json.loads(r.read().decode('utf-8'))


def points(entry):
    """Aplatit les couples [angle, valeur] (parfois imbriqués) et les trie par angle."""
    pts = []
    for k, v in entry.items():
        if k == 'caliberToArmor' or not isinstance(v, list):
            continue
        for p in (v if v and isinstance(v[0], list) else [v]):
            pts.append([float(p[0]), float(p[1])])
    return sorted(pts)


def tables(preset):
    """Preset → liste de tables {c2a, pts} triées par rapport calibre/épaisseur."""
    subs = [v for v in preset.values() if isinstance(v, dict) and 'caliberToArmor' in v]
    if not subs:
        return [{'c2a': 1.0, 'pts': points(preset)}]
    return sorted(({'c2a': s['caliberToArmor'], 'pts': points(s)} for s in subs), key=lambda t: t['c2a'])


def find_bullets(o, out):
    if isinstance(o, dict):
        if 'bulletType' in o and 'speed' in o and 'bulletName' in o:
            out.setdefault(o['bulletName'], o)
            return
        for v in o.values():
            find_bullets(v, out)
    elif isinstance(o, list):
        for v in o:
            find_bullets(v, out)


def shell(b, label):
    t = b['bulletType']
    kin = (b.get('damage') or {}).get('kinetic') or {}
    cum = b.get('cumulativeDamage') or (b.get('damage') or {}).get('cumulative') or {}
    s = {
        'id': b['bulletName'], 'name': label, 'type': t,
        'mass': b['mass'], 'caliber': b['caliber'], 'speed': b['speed'],
        'cx': b.get('Cx'), 'ballisticCaliber': b.get('ballisticCaliber'),
        'damageMass': b.get('damageMass'), 'damageCaliber': b.get('damageCaliber'),
        'explosiveMass': b.get('explosiveMass', 0), 'explosiveType': b.get('explosiveType'),
        'fuseDelay': b.get('fuseDelayDist'), 'fuseSens': b.get('explodeTreshold'),
        'ricochet': b.get('ricochetPreset'), 'slope': b.get('slopeEffectPreset'),
    }
    if 'demarrePenetrationK' in kin:
        s['demarre'] = [kin['demarrePenetrationK'], kin['demarreSpeedPow'], kin['demarreMassPow'], kin['demarreCaliberPow']]
    if 'lanzOdermattMaterial' in kin:
        s['lo'] = [kin['lanzOdermattMaterial'], kin['lanzOdermattWorkingLength'], kin['lanzOdermattDensity']]
    if cum.get('armorPower'):
        s['cumulative'] = [cum['armorPower'], cum.get('distance', 0)]
    return {k: v for k, v in s.items() if v is not None}


def main():
    ric = fetch(DM + 'ricochet.blkx')
    slope = fetch(DM + 'slope_effect.blkx')
    armor = fetch(DM + 'armor_classes.blkx')
    system = fetch(DM + 'damage_system.blkx')
    expl = fetch(DM + 'explosive.blkx')['explosiveTypes']
    try:
        with urllib.request.urlopen(RAW + 'version', timeout=60) as r:
            version = r.read().decode().strip()
    except Exception:
        version = ''

    guns, used_ric, used_slope, used_expl = [], set(), set(), set()
    for file, name, vehicle, wanted in GUNS:
        found = {}
        find_bullets(fetch(WEAPONS + file + '.blkx'), found)
        shells = []
        for bid, label in wanted:
            if bid not in found:
                raise SystemExit(f'Obus introuvable : {bid} dans {file}')
            s = shell(found[bid], label)
            shells.append(s)
            used_ric.add(s.get('ricochet'))
            used_slope.add(s.get('slope'))
            used_expl.add(s.get('explosiveType'))
        guns.append({'id': file, 'name': name, 'vehicle': vehicle, 'shells': shells})
    used_slope.add('cos_slope_table')

    data = {
        'version': version,
        'system': {
            'armorResistance': system['armorResistance'],
            'pierceDispersion': system['pierceDispersion'],
            'cumulativePierceDispersion': system['cumulativePierceDispersion'],
            'maxArmorEffectiveScale': system['maxArmorEffectiveScale'],
            'ricochetSpeedMul': system['ricochetSpeedMul'],
            'fillerModifier': system['penetrationByExplosiveMassModifier']['mod'],
        },
        'ricochet': {k: tables(ric[k]) for k in sorted(x for x in used_ric if x)},
        'slope': {k: tables(slope[k]) for k in sorted(x for x in used_slope if x)},
        'armor': [{'id': k, 'name': n, 'quality': armor[k].get('armorQuality', 1.0)} for k, n in ARMORS],
        'tnt': {k: expl[k]['strengthEquivalent'] for k in sorted(x for x in used_expl if x)},
        'guns': guns,
    }
    OUT.write_text('/* Généré par tools/maj_balistique.py — ne pas modifier à la main.\n'
                   '   Données extraites des fichiers du jeu (War-Thunder-Datamine). */\n'
                   'window.WT_BAL = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    n = sum(len(g['shells']) for g in guns)
    print(f'{n} obus sur {len(guns)} canons écrits dans {OUT.name} (version du jeu : {version or "inconnue"}).')


if __name__ == '__main__':
    main()
