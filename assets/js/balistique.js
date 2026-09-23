/* ==========================================================================
   LIGNE DE FRONT — moteur balistique du simulateur de blindage
   Modèle calqué sur celui de War Thunder, alimenté par les fichiers du jeu
   (balistique-data.js) :
   - vitesse à distance : traînée aérodynamique (Cx, calibre balistique, masse)
   - obus pleins et sous-calibrés : formule de De Marre (coefficients du jeu)
     et perte de pénétration liée à la charge explosive
   - obus-flèches : formule de Lanz-Odermatt (longueur utile, densité, matériau)
   - charges creuses et HESH : pénétration fixe (armorPower)
   - inclinaison : tables d'effet de pente du jeu, selon le rapport calibre/épaisseur
   - ricochet : tables de probabilité du jeu ; dispersion aléatoire de ±5 %
   ========================================================================== */
window.WT_BALLISTICS = (() => {
  const D = window.WT_BAL;
  if (!D) return null;
  const RHO_AIR = 1.225;                      // kg/m³
  const RHA = { density: 7850, bhn: 260 };    // acier de blindage de référence
  // Lanz-Odermatt : constantes publiées pour les pénétrateurs longs
  const LO = {
    tungsten: { a: .994, c0: 134.5, c1: -.148 },
    depletedUranium: { a: .825, c0: 90, c1: -.0849 },
    steel: { a: 1.104, c0: 9874, c1: 0 },
  };
  const LO_B0 = .283, LO_B1 = .0656;

  /* ---------- types d'obus ---------- */
  const kindOf = t =>
    /apds_fs/.test(t) ? 'apfsds' : /apds/.test(t) ? 'apds' : /apcr|hvap/.test(t) ? 'apcr' :
    /hesh/.test(t) ? 'hesh' : /heat/.test(t) ? 'heat' : /aphe|apcbc|apc_|apbc/.test(t) ? 'apfull' : 'ap';
  const LABEL = {
    ap_tank: 'AP', apcbc_tank: 'APCBC', aphe_tank: 'APHE', aphebc_tank: 'APHEBC', apcr_tank: 'APCR',
    apds_tank: 'APDS', apds_l15_tank: 'APDS', heat_tank: 'HEAT', heat_fs_tank: 'HEAT-FS', hesh_tank: 'HESH',
  };
  const label = s => LABEL[s.type] || (/apds_fs/.test(s.type) ? 'APFSDS' : s.type.toUpperCase());
  const DEFAULT_CX = { ap: .4, apfull: .37, apcr: .3, apds: .2, apfsds: .5, heat: .55, hesh: .7 };

  /* ---------- outils ---------- */
  const lerp = (a, b, k) => a + (b - a) * k;
  const interp = (pts, x) => {           // pts : [[x, y], …] triés
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (x <= pts[i][0]) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        return x1 === x0 ? y1 : lerp(y0, y1, (x - x0) / (x1 - x0));
      }
    }
    return pts[pts.length - 1][1];
  };
  // valeur d'une table dépendant de l'angle ET du rapport calibre/épaisseur
  const table2 = (tables, angle, c2a) => {
    if (tables.length === 1 || c2a <= tables[0].c2a) return interp(tables[0].pts, angle);
    const last = tables[tables.length - 1];
    if (c2a >= last.c2a) return interp(last.pts, angle);
    for (let i = 1; i < tables.length; i++) {
      if (c2a <= tables[i].c2a) {
        const a = tables[i - 1], b = tables[i];
        return lerp(interp(a.pts, angle), interp(b.pts, angle), (c2a - a.c2a) / (b.c2a - a.c2a));
      }
    }
    return interp(last.pts, angle);
  };

  /* ---------- caractéristiques dérivées ---------- */
  const penCaliber = s => (s.damageCaliber || s.caliber) * 1000;          // mm
  const flightArea = s => Math.PI * Math.pow((s.ballisticCaliber || s.caliber) / 2, 2);
  const cx = s => s.cx || DEFAULT_CX[kindOf(s.type)];
  const dragK = s => RHO_AIR * cx(s) * flightArea(s) / (2 * s.mass);        // 1/m
  const velocityAt = (s, dist) => s.speed * Math.exp(-dragK(s) * dist);    // m/s
  const flightTime = (s, dist) => (Math.exp(dragK(s) * dist) - 1) / (dragK(s) * s.speed);
  const tntGrams = s => (s.explosiveMass || 0) * (D.tnt[s.explosiveType] || 1) * 1000;

  // pénétration à incidence normale contre du RHA, à la vitesse v
  function penetrationAtVelocity(s, v) {
    if (s.cumulative) return s.cumulative[0];
    if (s.lo) {
      const [mat, L, rho] = s.lo, c = LO[mat] || LO.tungsten, d = penCaliber(s);
      const coth = 1 / Math.tanh(LO_B0 + LO_B1 * L / d);
      const vk = v / 1000;
      return L * c.a * coth * Math.sqrt(rho / RHA.density) * Math.exp(-(c.c0 + c.c1 * RHA.bhn) * RHA.bhn / (rho * vk * vk));
    }
    if (s.demarre) {
      const [k, sp, mp, cp] = s.demarre;
      const m = s.damageMass || s.mass, d = penCaliber(s);
      let p = k * 100 * Math.pow(v / D.system.armorResistance, sp) * Math.pow(m, mp) / Math.pow(d / 100, cp);
      const filler = (s.explosiveMass || 0) / s.mass;
      if (filler > 0) p *= interp(D.system.fillerModifier, filler);
      return p;
    }
    return 0;
  }
  const penetrationAt = (s, dist) => penetrationAtVelocity(s, velocityAt(s, dist));

  // vitesse limite : plus petite vitesse qui perce l'épaisseur donnée (dichotomie)
  function ballisticLimit(s, eff) {
    let lo = 0, hi = s.speed * 2;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      penetrationAtVelocity(s, mid) >= eff ? hi = mid : lo = mid;
    }
    return hi;
  }

  /* ---------- analyse d'un tir ---------- */
  function analyse(s, { dist, thick, angle, quality }) {
    const kind = kindOf(s.type);
    const surf = 90 - angle;                      // les tables du jeu comptent l'angle depuis la surface
    const cal = penCaliber(s);
    const c2a = cal / thick;
    let mult;
    if (kind === 'hesh') mult = 1;                // la HESH ignore l'inclinaison dans le jeu
    else {
      const preset = D.slope[s.slope] || D.slope.cos_slope_table;
      mult = Math.min(D.system.maxArmorEffectiveScale, table2(preset, surf, c2a));
    }
    const eff = thick * quality * mult;
    const v = velocityAt(s, dist);
    const pen = penetrationAtVelocity(s, v);
    const ricTables = D.ricochet[s.ricochet];
    const ricochet = ricTables ? Math.max(0, Math.min(1, table2(ricTables, surf, c2a))) : 0;
    const fuseArmed = s.fuseSens != null && s.explosiveMass > 0 && eff >= s.fuseSens;
    const vbl = kind === 'heat' || kind === 'hesh' ? 0 : ballisticLimit(s, eff);
    const residual = pen > eff && vbl ? Math.sqrt(Math.max(0, v * v - vbl * vbl)) : 0;   // Lambert-Jonas (p = 2)
    return {
      kind, label: label(s), v, pen, eff, mult, c2a, cal, ricochet, fuseArmed, residual,
      time: flightTime(s, dist), margin: pen - eff, tnt: tntGrams(s),
      dispersion: kind === 'heat' || kind === 'hesh' ? D.system.cumulativePierceDispersion : D.system.pierceDispersion,
    };
  }

  // tirage d'un résultat, avec la dispersion de pénétration et le hasard du ricochet
  function roll(a, rnd = Math.random) {
    if (rnd() < a.ricochet) return 'rico';
    const pen = a.pen * (1 + (rnd() * 2 - 1) * a.dispersion);
    if (a.kind === 'hesh') return pen >= a.eff ? 'spall' : 'nopen';
    return pen >= a.eff ? 'pen' : 'nopen';
  }

  return { data: D, kindOf, label, velocityAt, penetrationAt, penetrationAtVelocity, analyse, roll, penCaliber, tntGrams, cx };
})();
