/* ==========================================================================
   Académie — simulateur de blindage (obus réels, modèle balistique du jeu)
   ========================================================================== */
(() => {
  const B = window.WT_BALLISTICS;
  const cv = document.querySelector('[data-sim]');
  if (!B || !cv) return;
  const ctx = cv.getContext('2d');
  const $ = s => document.querySelector(s);
  const W = cv.width, H = cv.height;
  const CX = 600, CY = 360, PLATE_LEN = 2400;
  const rad = d => d * Math.PI / 180;
  const rand = (a, b) => a + Math.random() * (b - a);
  const fr = (n, d = 0) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const esc = window.WT ? WT.esc : s => s;

  const DATA = B.data;
  const guns = DATA.guns;
  const SCENARIOS = [
    { name: 'Glacis du Panther', t: 80, a: 55, m: 'RHA_tank' },
    { name: 'Avant du Tiger H1', t: 100, a: 10, m: 'RHA_tank' },
    { name: 'Glacis du T-34', t: 45, a: 60, m: 'RHA_tank' },
    { name: 'Flanc du Sherman', t: 38, a: 0, m: 'RHA_tank' },
    { name: 'Glacis du T-54', t: 100, a: 60, m: 'RHA_tank' },
    { name: 'Bloc de 400 mm à 60°', t: 400, a: 60, m: 'RHA_tank' },
  ];
  const MAT_LOOK = {
    RHA_tank: ['#66706a', '#8d978f', '#4b534e', '#323733'],
    CHA_tank: ['#6b6a62', '#918f84', '#51504a', '#363530'],
    RHAHH_tank: ['#56606c', '#7d8896', '#434b56', '#2c3239'],
    tank_structural_steel: ['#7a7468', '#a39c8d', '#5e594f', '#3f3b34'],
  };

  /* ---------- état ---------- */
  const st = { gun: 5, shell: 0, dist: 500, t: 80, a: 55, mat: 'RHA_tank' };
  let A = null;              // analyse courante
  const shot = { phase: 'idle', t: 0, x: 0, y: CY, vx: 0, vy: 0, rot: 0, outcome: null, sabot: [], alpha: 1 };
  let parts = [], marks = [], flashes = [], jet = null, scab = null, blob = null;
  const modules = [
    { name: 'Chef de char', kind: 'crew', x: 960, y: 250, w: 46, h: 70 },
    { name: 'Tireur', kind: 'crew', x: 1060, y: 410, w: 46, h: 70 },
    { name: 'Culasse', kind: 'breech', x: 860, y: 330, w: 110, h: 46 },
    { name: 'Munitions', kind: 'ammo', x: 1070, y: 560, w: 150, h: 60 },
  ];
  modules.forEach(m => { m.hits = 0; m.flash = 0; });

  const gun = () => guns[st.gun];
  const shell = () => gun().shells[st.shell];
  const quality = () => (DATA.armor.find(a => a.id === st.mat) || { quality: 1 }).quality;

  /* ---------- contrôles ---------- */
  const gunSel = $('[data-gun]'), shellBox = $('[data-shells]'), matSel = $('[data-mat]'), scenBox = $('[data-scen]');
  const inD = $('[data-s-d]'), inT = $('[data-s-t]'), inA = $('[data-s-a]');
  gunSel.innerHTML = guns.map((g, i) => `<option value="${i}">${esc(g.name)} — ${esc(g.vehicle)}</option>`).join('');
  matSel.innerHTML = DATA.armor.map(a => `<option value="${a.id}">${esc(a.name)} · ×${fr(a.quality, 2)}</option>`).join('');
  scenBox.innerHTML = SCENARIOS.map((s, i) => `<button type="button" data-i="${i}">${esc(s.name)}<small>${s.t} mm · ${s.a}°</small></button>`).join('');

  function renderShells() {
    shellBox.innerHTML = gun().shells.map((s, i) =>
      `<button type="button" data-i="${i}" aria-pressed="${i === st.shell}"><b>${esc(s.name)}</b><small>${B.label(s)}</small></button>`).join('');
  }
  gunSel.addEventListener('change', () => { st.gun = +gunSel.value; st.shell = 0; renderShells(); update(); });
  shellBox.addEventListener('click', e => {
    const b = e.target.closest('[data-i]'); if (!b) return;
    st.shell = +b.dataset.i;
    shellBox.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    update();
  });
  scenBox.addEventListener('click', e => {
    const b = e.target.closest('[data-i]'); if (!b) return;
    const s = SCENARIOS[+b.dataset.i];
    st.t = s.t; st.a = s.a; st.mat = s.m;
    inT.value = s.t; inA.value = s.a; matSel.value = s.m;
    update();
  });
  const bind = (el, key) => el.addEventListener('input', () => { st[key] = +el.value; update(); });
  bind(inD, 'dist'); bind(inT, 't'); bind(inA, 'a');
  matSel.addEventListener('change', () => { st.mat = matSel.value; update(); });

  // glisser verticalement sur le schéma pour incliner la plaque, cliquer pour tirer
  let drag = null;
  cv.addEventListener('pointerdown', e => { drag = { y: e.clientY, a: st.a, moved: false }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => {
    if (!drag) return;
    const dy = e.clientY - drag.y;
    if (Math.abs(dy) > 4) drag.moved = true;
    if (drag.moved) { st.a = Math.max(0, Math.min(85, Math.round(drag.a - dy * .35))); inA.value = st.a; update(); }
  });
  cv.addEventListener('pointerup', () => { if (drag && !drag.moved) fire(); drag = null; });
  $('[data-fire]').addEventListener('click', fire);
  $('[data-mc]').addEventListener('click', montecarlo);

  /* ---------- analyse & affichage ---------- */
  function update() {
    A = B.analyse(shell(), { dist: st.dist, thick: st.t, angle: st.a, quality: quality() });
    reset();
    [inD, inT, inA].forEach(i => i.style.setProperty('--p', ((i.value - i.min) / (i.max - i.min) * 100) + '%'));
    $('[data-o-d]').textContent = `${fr(st.dist)} m`;
    $('[data-o-t]').textContent = `${st.t} mm`;
    $('[data-o-a]').textContent = `${st.a}°`;
    renderCard(); renderReadouts(); renderVerdict(); renderChart();
    $('[data-stats]').innerHTML = '<p class="muted small">Lancez une série pour mesurer l’effet du hasard (dispersion de la pénétration et ricochets).</p>';
  }

  function renderCard() {
    const s = shell(), k = A.kind;
    const rows = [
      ['Type', `${A.label}${s.explosiveMass ? ' · charge explosive' : ''}`],
      ['Masse', `${fr(s.mass, 2)} kg${s.damageMass ? ` (noyau ${fr(s.damageMass, 2)} kg)` : ''}`],
      ['Calibre', `${fr(s.caliber * 1000)} mm${s.damageCaliber ? ` · pénétrateur ${fr(s.damageCaliber * 1000)} mm` : ''}`],
      ['Vitesse initiale', `${fr(s.speed)} m/s`],
    ];
    if (s.explosiveMass) rows.push(['Explosif', `${fr(s.explosiveMass * 1000)} g · ≈ ${fr(A.tnt)} g éq. TNT`]);
    if (k === 'apfull' && s.explosiveMass) rows.push(['Fusée', `armée dès ${fr(s.fuseSens)} mm · retard ${fr(s.fuseDelay, 1)} m`]);
    rows.push(['Modèle', s.lo ? `Lanz-Odermatt · ${s.lo[0] === 'depletedUranium' ? 'uranium appauvri' : 'tungstène'}, L = ${fr(s.lo[1])} mm`
      : s.demarre ? `De Marre · k = ${fr(s.demarre[0], 2)}` : k === 'hesh' ? `HESH · ${fr(s.cumulative[0])} mm` : `Charge creuse · ${fr(s.cumulative[0])} mm`]);
    $('[data-shell-card]').innerHTML = rows.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('');
  }

  function renderReadouts() {
    const s = shell();
    const fuse = A.kind === 'heat' ? 'Impact (charge creuse)' : A.kind === 'hesh' ? 'Impact (explosif plastique)'
      : s.explosiveMass ? (A.fuseArmed ? 'Armée' : `Non armée (< ${fr(s.fuseSens)} mm)`) : 'Aucune (obus plein)';
    const cells = [
      ['Vitesse à l’impact', `${fr(A.v)} m/s`, `vol : ${fr(A.time * 1000)} ms`],
      ['Pénétration à 0°', `${fr(A.pen)} mm`, A.kind === 'heat' || A.kind === 'hesh' ? 'indépendante de la distance' : `à ${fr(st.dist)} m`],
      ['Épaisseur effective', `${fr(A.eff)} mm`, `${st.t} mm × ${fr(A.mult, 2)}${quality() !== 1 ? ` × ${fr(quality(), 2)}` : ''}`],
      ['Rapport calibre / épaisseur', fr(A.c2a, 2), A.c2a >= 3 ? 'surcalibrage fort' : A.c2a >= 1 ? 'surcalibrage' : 'plaque épaisse'],
      ['Risque de ricochet', `${fr(A.ricochet * 100)} %`, `angle à la surface : ${90 - st.a}°`],
      ['Fusée', fuse, s.explosiveMass && A.kind === 'apfull' ? `sensibilité ${fr(s.fuseSens)} mm` : ''],
    ];
    $('[data-readouts]').innerHTML = cells.map(([l, v, sub]) => `<div><small>${l}</small><b>${v}</b>${sub ? `<i>${sub}</i>` : ''}</div>`).join('');
  }

  function expected() {
    if (A.ricochet >= .5) return 'rico';
    const lo = A.pen * (1 - A.dispersion), hi = A.pen * (1 + A.dispersion);
    if (A.kind === 'hesh') return lo >= A.eff ? 'spall' : hi < A.eff ? 'nopen' : 'edge';
    return lo >= A.eff ? 'pen' : hi < A.eff ? 'nopen' : 'edge';
  }
  const VERDICT = {
    pen: ['Pénétration', 'pen'], nopen: ['Non pénétrant', 'nopen'], rico: ['Ricochet probable', 'rico'],
    edge: ['À la limite', 'rico'], spall: ['Écaillage', 'pen'],
  };
  function renderVerdict(outcome) {
    const e = outcome || expected();
    const [txt, cls] = VERDICT[e] || VERDICT.nopen;
    const m = Math.round(A.margin);
    const sub = outcome ? 'Résultat de ce tir' : e === 'edge' ? `Écart de ${m > 0 ? '+' : ''}${m} mm : la dispersion de ±5 % décide` : `Marge : ${m > 0 ? '+' : ''}${m} mm`;
    $('[data-verdict]').className = `verdict ${cls}`;
    $('[data-verdict]').innerHTML = `${txt}<small>${sub}</small>`;
    const s = shell(), why = [];
    why.push(A.kind === 'hesh'
      ? `La HESH s’écrase contre la plaque avant d’exploser : dans le jeu, l’inclinaison ne change pas l’épaisseur qu’elle doit traverser.`
      : `L’inclinaison multiplie l’épaisseur par ${fr(A.mult, 2)} selon la table du jeu pour un ${A.label} et un rapport calibre/épaisseur de ${fr(A.c2a, 2)} (le calcul trigonométrique simple donnerait ×${fr(1 / Math.cos(rad(st.a)), 2)}).`);
    if (quality() !== 1) why.push(`Le matériau compte pour ×${fr(quality(), 2)} par rapport à l’acier laminé de référence.`);
    if (A.ricochet > 0) why.push(`À ${90 - st.a}° de la surface, ce type d’obus a ${fr(A.ricochet * 100)} % de risque de ricocher.`);
    else if (st.a > 0) why.push(`Aucun risque de ricochet à cet angle pour ce type d’obus.`);
    if ((A.kind === 'ap' || A.kind === 'apfull' || A.kind === 'apcr') && st.dist > 10) why.push(`La traînée fait chuter la vitesse de ${fr(s.speed)} à ${fr(A.v)} m/s sur ${fr(st.dist)} m, et la pénétration avec elle.`);
    if (A.kind === 'heat') why.push(`La charge creuse perce grâce à un jet de métal : sa pénétration ne dépend ni de la vitesse ni de la distance.`);
    if (A.kind === 'apfsds') why.push(`Pénétrateur long de ${fr(s.lo[1])} mm pour ${fr(A.cal)} mm de diamètre (rapport ${fr(s.lo[1] / A.cal, 1)}), calculé avec la formule de Lanz-Odermatt.`);
    if (A.residual > 0) why.push(`Vitesse résiduelle derrière la plaque : environ ${fr(A.residual)} m/s.`);
    if (A.kind === 'apfull' && s.explosiveMass) {
      const through = (outcome || e) === 'pen';
      why.push(!A.fuseArmed
        ? `Moins de ${fr(s.fuseSens)} mm d’acier effectif : la fusée ne s’arme pas${through ? ', l’obus traverse sans exploser' : ''}.`
        : through ? `La plaque est assez épaisse pour armer la fusée : l’obus explose ${fr(s.fuseDelay, 1)} m après l’avoir traversée.`
        : `La fusée s’arme, mais l’obus ne perce pas : il explose contre la plaque, sans effet à l’intérieur.`);
    }
    $('[data-why]').innerHTML = why.map(w => `<li>${w}</li>`).join('');
  }

  function renderChart() {
    const s = shell(), w = 320, h = 150, pad = { l: 34, r: 8, t: 10, b: 22 };
    const maxD = 3000, pen0 = B.penetrationAt(s, 0);
    const maxY = Math.max(pen0, A.eff) * 1.15;
    const X = d => pad.l + d / maxD * (w - pad.l - pad.r), Y = p => h - pad.b - p / maxY * (h - pad.t - pad.b);
    let pts = '';
    for (let d = 0; d <= maxD; d += 100) pts += `${X(d).toFixed(1)},${Y(B.penetrationAt(s, d)).toFixed(1)} `;
    const ticks = [0, 1000, 2000, 3000].map(d => `<text x="${X(d)}" y="${h - 6}" text-anchor="middle">${d ? d / 1000 + ' km' : '0'}</text>`).join('');
    const yt = [0, .5, 1].map(k => `<text x="${pad.l - 5}" y="${Y(maxY * k / 1.15) + 3}" text-anchor="end">${fr(maxY * k / 1.15)}</text>`).join('');
    $('[data-chart]').innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Pénétration selon la distance">
      <line x1="${pad.l}" y1="${h - pad.b}" x2="${w - pad.r}" y2="${h - pad.b}" class="ax"/>
      <line x1="${X(st.dist)}" y1="${pad.t}" x2="${X(st.dist)}" y2="${h - pad.b}" class="cur"/>
      <line x1="${pad.l}" y1="${Y(A.eff)}" x2="${w - pad.r}" y2="${Y(A.eff)}" class="eff"/>
      <text x="${w - pad.r}" y="${Y(A.eff) - 4}" text-anchor="end" class="effl">épaisseur effective ${fr(A.eff)} mm</text>
      <polyline points="${pts}" class="pen"/>
      <circle cx="${X(st.dist)}" cy="${Y(A.pen)}" r="4" class="dot"/>
      ${ticks}${yt}</svg>`;
  }

  function montecarlo() {
    const n = 1000, c = { pen: 0, nopen: 0, rico: 0, spall: 0 };
    for (let i = 0; i < n; i++) c[B.roll(A)]++;
    const p = k => c[k] / n * 100;
    const segs = [['pen', 'Pénétration', p('pen')], ['spall', 'Écaillage', p('spall')], ['nopen', 'Non pénétrant', p('nopen')], ['rico', 'Ricochet', p('rico')]].filter(s => s[2] > 0);
    $('[data-stats]').innerHTML = `<div class="mc-bar">${segs.map(([k, , v]) => `<i class="${k}" style="width:${v}%"></i>`).join('')}</div>
      <ul class="mc-legend">${segs.map(([k, l, v]) => `<li><i class="${k}"></i>${l}<b>${fr(v, 1)} %</b></li>`).join('')}</ul>`;
  }

  /* ---------- géométrie de la plaque ---------- */
  function geom() {
    const th = rad(st.a);
    const chordMm = st.t / Math.cos(th);
    const k = Math.max(.35, Math.min(1.25, 280 / chordMm));   // px par mm (schéma)
    const h = st.t * k, half = (h / 2) / Math.cos(th);
    return { th, k, h, entry: CX - half, exit: CX + half };
  }
  const shellLen = () => Math.max(70, Math.min(170, shell().caliber * 1000 * geom().k * 4.2));

  /* ---------- tir ---------- */
  function reset() {
    shot.phase = 'idle'; shot.outcome = null; shot.alpha = 1; shot.token = (shot.token || 0) + 1;
    shot.reported = false; shot.spalled = false; shot.explodeAt = null;
    parts = []; marks = []; flashes = []; jet = null; scab = null; blob = null; shot.sabot = [];
    modules.forEach(m => { m.hits = 0; m.flash = 0; });
    const hits = document.querySelector('[data-mod-hits]'); if (hits) hits.textContent = '';
  }
  function fire() {
    reset();
    shot.phase = 'flight'; shot.t = 0;
    shot.x = 150; shot.y = CY; shot.vx = 1150; shot.vy = 0; shot.rot = 0;
    shot.outcome = B.roll(A);
    flashes.push({ x: 120, y: CY, r: 70, t: 0, life: .25 });
    for (let i = 0; i < 14; i++) parts.push({ type: 'smoke', x: 120 + rand(0, 30), y: CY + rand(-12, 12), vx: rand(20, 120), vy: rand(-50, 50), t: 0, life: rand(.6, 1.2), r: rand(10, 22) });
    if (A.kind === 'apds' || A.kind === 'apfsds') { // pétales du sabot
      const n = A.kind === 'apfsds' ? 3 : 2;
      for (let i = 0; i < n; i++) shot.sabot.push({ x: 150, y: CY, vx: 900, vy: (i - (n - 1) / 2) * 260 + rand(-40, 40), rot: 0, vr: (i - (n - 1) / 2) * 7 + rand(-2, 2), t: 0 });
    }
  }
  function spark(x, y, dir, spread, n, speed = 500, cols = ['#ffe6a8', '#ffb347', '#fff']) {
    for (let i = 0; i < n; i++) {
      const a = dir + (Math.random() - .5) * spread, v = speed * rand(.3, 1);
      parts.push({ type: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: rand(.3, .8), c: cols[Math.floor(Math.random() * cols.length)], r: rand(1, 2.4) });
    }
  }
  function frags(x, y, dir, spread, n, speed, hot = true) {
    for (let i = 0; i < n; i++) {
      const a = dir + (Math.random() - .5) * spread, v = speed * rand(.45, 1);
      parts.push({ type: 'frag', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: rand(.7, 1.3), r: rand(1.2, 2.8), hot, done: false });
    }
  }
  function explode(x, y, grams) {
    const r = 40 + Math.cbrt(grams) * 14;
    flashes.push({ x, y, r, t: 0, life: .45 });
    frags(x, y, 0, Math.PI * 2, Math.min(140, 20 + grams / 2), 700);
    for (let i = 0; i < 10; i++) parts.push({ type: 'smoke', x: x + rand(-20, 20), y: y + rand(-20, 20), vx: rand(-40, 40), vy: rand(-60, 10), t: 0, life: rand(1, 1.8), r: rand(16, 34) });
  }

  function impact(g) {
    const s = shell(), o = shot.outcome;
    const cal = Math.max(3, A.cal * g.k);
    if (A.kind === 'heat' && o === 'rico') { ricochet(g); return; }
    if (A.kind === 'heat') {
      shot.phase = 'jet';
      flashes.push({ x: g.entry, y: CY, r: 60, t: 0, life: .3 });
      spark(g.entry, CY, Math.PI, 1.8, 30, 520);
      const through = o === 'pen';
      const depth = through ? g.exit - g.entry : (g.exit - g.entry) * Math.min(.95, A.pen / A.eff);
      jet = { x0: g.entry - 6, len: 0, max: depth + (through ? Math.min(420, 60 + s.cumulative[1] * 70) : 0), through, stop: g.entry + depth, t: 0 };
      frags(g.entry, CY, Math.PI, 1.2, 20, 300, false);   // corps de l'obus détruit
      return;
    }
    if (A.kind === 'hesh') {
      if (o === 'rico') { ricochet(g); return; }
      shot.phase = 'squash';
      blob = { x: g.entry, t: 0, th: g.th, size: Math.max(20, A.cal * g.k * 1.2) };
      return;
    }
    if (o === 'rico') { ricochet(g); return; }
    if (o === 'pen') {
      shot.phase = 'pen'; shot.t = 0;
      marks.push({ type: 'hole', x0: g.entry, x1: g.exit, w: cal });
      spark(g.entry, CY, Math.PI, 1.5, 22, 450);
      return;
    }
    // non-pénétration
    shot.phase = 'stuck'; shot.t = 0;
    const depth = (g.exit - g.entry) * Math.min(.9, A.pen / A.eff);
    marks.push({ type: 'dent', x: g.entry, depth, w: cal });
    spark(g.entry, CY, Math.PI, 2.2, 40, 520);
    shot.stopX = g.entry + depth;
    if (A.kind === 'apfull' && s.explosiveMass && A.fuseArmed) { const token = shot.token; setTimeout(() => { if (token === shot.token) explode(g.entry - 10, CY, A.tnt * .6); }, 120); }
    else frags(g.entry, CY, Math.PI, 1.6, 16, 260, false);          // obus brisé
  }
  function ricochet(g) {
    shot.phase = 'rico';
    const th = g.th;
    shot.x = g.entry; shot.y = CY;
    const sp = 1150 * (.35 + DATA.system.ricochetSpeedMul);
    const jitter = rand(-.05, .05);
    shot.vx = -Math.cos(2 * th + jitter) * sp; shot.vy = -Math.sin(2 * th + jitter) * sp;
    shot.rot = Math.atan2(shot.vy, shot.vx);
    marks.push({ type: 'gouge', x: g.entry, th });
    spark(g.entry, CY, shot.rot, .9, 46, 700);
  }

  function step(dt) {
    const g = geom(), s = shell();
    shot.t += dt;
    for (const p of shot.sabot) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .985; p.vy += 300 * dt; p.rot += p.vr * dt; }
    if (shot.phase === 'flight') {
      shot.x += shot.vx * dt;
      const nose = shot.x + shellLen() / 2;
      if (nose >= g.entry) { shot.x = g.entry - shellLen() / 2; impact(g); }
    } else if (shot.phase === 'pen') {
      const speed = 1150 * Math.max(.18, A.residual / Math.max(1, A.v));
      shot.x += (shot.x < g.exit ? 420 : speed) * dt;
      if (!shot.spalled && shot.x - shellLen() / 2 > g.exit - 4) {
        shot.spalled = true;
        const excess = Math.max(0, A.pen - A.eff);
        const n = Math.round(Math.max(10, Math.min(110, A.cal * .5 + excess * .35)));
        const cone = A.kind === 'apfsds' ? .55 : A.kind === 'apds' || A.kind === 'apcr' ? .6 : .8;
        frags(g.exit, CY, 0, cone, n, 760);
        flashes.push({ x: g.exit + 6, y: CY, r: 40, t: 0, life: .2 });
        if (A.kind === 'apfull' && s.explosiveMass) shot.explodeAt = A.fuseArmed ? g.exit + Math.min(260, 60 + s.fuseDelay * 120) : null;
      }
      if (shot.explodeAt && shot.x >= shot.explodeAt) { explode(shot.x, CY, A.tnt); shot.explodeAt = null; shot.phase = 'done'; }
      if (shot.x > W + 200) shot.phase = 'done';
    } else if (shot.phase === 'stuck') {
      shot.x = Math.min(shot.x + 260 * dt, shot.stopX - shellLen() / 2);
      if (shot.t > .35) shot.alpha = Math.max(0, shot.alpha - dt * 2.5);
    } else if (shot.phase === 'rico') {
      shot.x += shot.vx * dt; shot.y += shot.vy * dt;
    } else if (shot.phase === 'jet' && jet) {
      jet.t += dt;
      jet.len = Math.min(jet.max, jet.len + 2600 * dt);
      shot.alpha = Math.max(0, shot.alpha - dt * 8);
      if (jet.through && !jet.spalled && jet.x0 + jet.len > g.exit) {
        jet.spalled = true;
        frags(g.exit, CY, 0, .35, Math.round(Math.min(60, 12 + (A.pen - A.eff) * .08)), 820);
        marks.push({ type: 'hole', x0: g.entry, x1: g.exit, w: Math.max(3, A.cal * g.k * .25) });
      }
      if (!jet.through && jet.len >= jet.max && !jet.cratered) { jet.cratered = true; marks.push({ type: 'dent', x: g.entry, depth: jet.max, w: Math.max(4, A.cal * g.k * .3) }); }
      if (jet.t > 1.2) jet.fade = true;
    } else if (shot.phase === 'squash' && blob) {
      blob.t += dt;
      if (blob.t > .35 && !blob.boom) {
        blob.boom = true;
        flashes.push({ x: g.entry - 8, y: CY, r: 90, t: 0, life: .35 });
        spark(g.entry, CY, Math.PI, 2.4, 50, 600);
        if (shot.outcome === 'spall') { // écaille arrachée de la face arrière (effet Hopkinson)
          scab = { x: g.exit, y: CY, vx: 380, vy: rand(-40, 40), rot: 0, vr: rand(-4, 4), size: Math.max(14, A.cal * g.k * .9) };
          frags(g.exit, CY, 0, 1.1, 60, 640);
        }
      }
    }
    if (scab) { scab.x += scab.vx * dt; scab.y += scab.vy * dt; scab.rot += scab.vr * dt; scab.vy += 200 * dt; }

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.t > p.life) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.type === 'smoke') { p.vx *= .95; p.vy *= .95; }
      else { p.vx *= .985; p.vy += (p.type === 'spark' ? 420 : 160) * dt; }
      if (p.type === 'frag' && !p.done) {
        for (const m of modules) {
          if (p.x > m.x && p.x < m.x + m.w && p.y > m.y && p.y < m.y + m.h) { m.hits++; m.flash = 1; p.done = true; p.life = p.t + .08; modulesDirty = true; break; }
        }
      }
    }
    modules.forEach(m => { m.flash = Math.max(0, m.flash - dt * 2.5); });
    if (modulesDirty) { modulesDirty = false; reportModules(); }
    for (let i = flashes.length - 1; i >= 0; i--) { flashes[i].t += dt; if (flashes[i].t > flashes[i].life) flashes.splice(i, 1); }

    if (shot.phase !== 'idle' && shot.phase !== 'flight' && !shot.reported && shot.t > .1) {
      shot.reported = true;
      const token = shot.token;
      setTimeout(() => { if (token === shot.token) { renderVerdict(shot.outcome); reportModules(); } }, 900);
      setTimeout(() => { if (token === shot.token) reportModules(true); }, 2600);
    }
  }
  let modulesDirty = false;
  function reportModules(final = false) {
    const el = document.querySelector('[data-mod-hits]');
    if (!el) return;
    const hit = modules.filter(m => m.hits);
    el.textContent = hit.length
      ? `Éclats dans le compartiment : ${hit.map(m => `${m.name} (${m.hits})`).join(', ')}`
      : final || shot.phase === 'rico' || shot.phase === 'stuck' ? 'Aucun module touché' : '';
  }

  /* ---------- dessin ---------- */
  function drawShell(x, y, rot, alpha = 1) {
    const kind = A.kind, L = shellLen();
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y); ctx.rotate(rot);
    const steel = '#c9cdd1', brass = '#d8b46a', dark = '#4a4f55', lw = 1.2;
    ctx.lineWidth = lw; ctx.strokeStyle = '#1b1d1f';
    const body = (d, nose, fill) => { // corps ogival de longueur L, diamètre d
      ctx.fillStyle = fill; ctx.beginPath();
      ctx.moveTo(-L / 2, -d / 2); ctx.lineTo(L / 2 - nose, -d / 2);
      ctx.quadraticCurveTo(L / 2 - nose * .15, -d / 2, L / 2, 0);
      ctx.quadraticCurveTo(L / 2 - nose * .15, d / 2, L / 2 - nose, d / 2);
      ctx.lineTo(-L / 2, d / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    };
    if (kind === 'apfsds') {
      const d = Math.max(4, L / 16);
      ctx.fillStyle = '#9aa0a6'; ctx.beginPath();
      ctx.moveTo(-L / 2, -d / 2); ctx.lineTo(L / 2 - d * 2.2, -d / 2); ctx.lineTo(L / 2, 0); ctx.lineTo(L / 2 - d * 2.2, d / 2); ctx.lineTo(-L / 2, d / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = dark;
      for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-L / 2, sgn * d / 2); ctx.lineTo(-L / 2 - d * .4, sgn * d * 2.2); ctx.lineTo(-L / 2 + d * 3, sgn * d / 2); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#6b7075'; for (let i = 0; i < 7; i++) ctx.fillRect(-L / 2 + L * .35 + i * d * 1.1, -d / 2, d * .5, d);
    } else if (kind === 'apds') {
      const d = L / 6.5;
      body(d, d * 1.6, '#8b9197');
      ctx.fillStyle = '#3b3f44'; ctx.fillRect(-L / 2 + L * .15, -d * .3, L * .6, d * .6);
    } else if (kind === 'apcr') {
      const d = L / 4.2;
      body(d, d * 1.8, '#b7b1a3');
      ctx.fillStyle = '#34383c'; ctx.beginPath(); ctx.ellipse(L * .05, 0, L * .22, d * .22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = brass; ctx.fillRect(-L / 2 + L * .2, -d / 2, L * .06, d);
    } else if (kind === 'heat') {
      const d = L / 4.5;
      ctx.fillStyle = '#7d8a6a'; ctx.beginPath();
      ctx.moveTo(-L / 2, -d / 2); ctx.lineTo(L * .12, -d / 2); ctx.lineTo(L * .32, -d * .18); ctx.lineTo(L * .32, d * .18); ctx.lineTo(L * .12, d / 2); ctx.lineTo(-L / 2, d / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = steel; ctx.fillRect(L * .32, -d * .09, L * .18, d * .18);
      if (shell().type.includes('fs')) { ctx.fillStyle = dark; for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-L / 2, sgn * d * .3); ctx.lineTo(-L / 2 - d * .3, sgn * d * .95); ctx.lineTo(-L / 2 + d * 1.2, sgn * d * .3); ctx.closePath(); ctx.fill(); } }
      ctx.fillStyle = 'rgba(255,210,90,.35)'; ctx.beginPath(); ctx.moveTo(L * .1, -d * .4); ctx.lineTo(-L * .1, 0); ctx.lineTo(L * .1, d * .4); ctx.closePath(); ctx.fill();
    } else if (kind === 'hesh') {
      const d = L / 3.6;
      ctx.fillStyle = '#b8a36d'; ctx.beginPath();
      ctx.moveTo(-L / 2, -d / 2); ctx.lineTo(L * .15, -d / 2); ctx.quadraticCurveTo(L / 2, -d / 2, L / 2, 0); ctx.quadraticCurveTo(L / 2, d / 2, L * .15, d / 2); ctx.lineTo(-L / 2, d / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = brass; ctx.fillRect(-L / 2 + L * .12, -d / 2, L * .06, d);
    } else {
      const d = L / 4.2;
      body(d, d * 1.7, kind === 'apfull' && shell().explosiveMass ? '#8e8f86' : steel);
      if (/apcbc|apbc/.test(shell().type)) { // coiffe perforante + coiffe balistique
        ctx.fillStyle = '#5c6167'; ctx.beginPath(); ctx.moveTo(L / 2 - d * 1.7, -d / 2); ctx.quadraticCurveTo(L / 2 - d * .9, -d * .45, L / 2 - d * .7, 0); ctx.quadraticCurveTo(L / 2 - d * .9, d * .45, L / 2 - d * 1.7, d / 2); ctx.closePath(); ctx.fill();
      }
      if (shell().explosiveMass) { ctx.fillStyle = 'rgba(240,200,80,.55)'; ctx.fillRect(-L * .3, -d * .16, L * .3, d * .32); }
      ctx.fillStyle = brass; ctx.fillRect(-L / 2 + L * .14, -d / 2 - .5, L * .06, d + 1);
    }
    ctx.restore();
  }

  function drawPlate(g) {
    const look = MAT_LOOK[st.mat] || MAT_LOOK.RHA_tank;
    ctx.save();
    ctx.translate(CX, CY); ctx.rotate(g.th);
    const grd = ctx.createLinearGradient(-g.h / 2, 0, g.h / 2, 0);
    grd.addColorStop(0, look[0]); grd.addColorStop(.12, look[1]); grd.addColorStop(.55, look[2]); grd.addColorStop(1, look[3]);
    ctx.fillStyle = grd;
    ctx.fillRect(-g.h / 2, -PLATE_LEN / 2, g.h, PLATE_LEN);
    ctx.save(); ctx.beginPath(); ctx.rect(-g.h / 2, -PLATE_LEN / 2, g.h, PLATE_LEN); ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,.16)'; ctx.lineWidth = 1;
    for (let y = -PLATE_LEN / 2; y < PLATE_LEN / 2; y += 12) { ctx.beginPath(); ctx.moveTo(-g.h / 2, y); ctx.lineTo(g.h / 2, y + g.h); ctx.stroke(); }
    if (st.mat === 'CHA_tank') { ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 260; i++) ctx.fillRect(-g.h / 2 + ((i * 37) % 97) / 97 * g.h, -300 + ((i * 53) % 101) / 101 * 600, 2, 2); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,200,140,.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-g.h / 2, -PLATE_LEN / 2); ctx.lineTo(-g.h / 2, PLATE_LEN / 2); ctx.stroke();
    // cote de l'épaisseur nominale
    const ny = -170;
    ctx.strokeStyle = ctx.fillStyle = '#7fa6c9'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-g.h / 2, ny); ctx.lineTo(g.h / 2, ny); ctx.moveTo(-g.h / 2, ny - 8); ctx.lineTo(-g.h / 2, ny + 8); ctx.moveTo(g.h / 2, ny - 8); ctx.lineTo(g.h / 2, ny + 8); ctx.stroke();
    ctx.save(); ctx.translate(g.h / 2 + 10, ny); ctx.rotate(-g.th);
    ctx.font = '600 19px "JetBrains Mono", monospace'; ctx.textBaseline = 'middle'; ctx.fillText(`${st.t} mm`, 0, 0);
    ctx.restore();
    ctx.restore();
  }

  function drawMarks(g) {
    ctx.save();
    ctx.translate(CX, CY); ctx.rotate(g.th);
    ctx.beginPath(); ctx.rect(-g.h / 2 - 1, -PLATE_LEN / 2, g.h + 2, PLATE_LEN); ctx.clip();
    ctx.rotate(-g.th); ctx.translate(-CX, -CY);
    for (const m of marks) {
      if (m.type === 'hole') {
        ctx.fillStyle = 'rgba(8,6,5,.92)';
        ctx.fillRect(m.x0 - 2, CY - m.w / 2, m.x1 - m.x0 + 4, m.w);
        ctx.strokeStyle = 'rgba(255,140,60,.55)'; ctx.lineWidth = 1;
        ctx.strokeRect(m.x0 - 2, CY - m.w / 2, m.x1 - m.x0 + 4, m.w);
      } else if (m.type === 'dent') {
        ctx.fillStyle = 'rgba(12,8,6,.9)';
        ctx.beginPath(); ctx.moveTo(m.x, CY - m.w / 2 - 2); ctx.lineTo(m.x + m.depth, CY - m.w * .25); ctx.lineTo(m.x + m.depth, CY + m.w * .25); ctx.lineTo(m.x, CY + m.w / 2 + 2); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,170,90,.6)'; ctx.stroke();
      } else if (m.type === 'gouge') {
        ctx.save(); ctx.translate(m.x, CY); ctx.rotate(m.th - Math.PI / 2);
        ctx.fillStyle = 'rgba(255,200,140,.75)'; ctx.fillRect(-2, -3, 46, 6);
        ctx.fillStyle = 'rgba(20,14,10,.8)'; ctx.fillRect(0, -1.5, 44, 3);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function drawModules() {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.025)'; ctx.fillRect(820, 150, 440, 520);
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.setLineDash([6, 6]); ctx.strokeRect(820, 150, 440, 520); ctx.setLineDash([]);
    ctx.font = '500 14px "JetBrains Mono", monospace'; ctx.fillStyle = 'rgba(236,232,220,.35)';
    ctx.textAlign = 'right'; ctx.fillText('COMPARTIMENT DE COMBAT', 1248, 656); ctx.textAlign = 'start';
    for (const m of modules) {
      const hot = m.flash, col = hot ? `rgba(255,${120 - hot * 60 | 0},80,${.45 + hot * .5})` : 'rgba(236,232,220,.14)';
      ctx.fillStyle = col; ctx.strokeStyle = hot ? '#ff6a5a' : 'rgba(236,232,220,.3)'; ctx.lineWidth = 1.5;
      if (m.kind === 'crew') {
        ctx.beginPath(); ctx.arc(m.x + m.w / 2, m.y + 12, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(m.x + 6, m.y + 26, m.w - 12, m.h - 26, 8) : ctx.rect(m.x + 6, m.y + 26, m.w - 12, m.h - 26); ctx.fill(); ctx.stroke();
      } else if (m.kind === 'ammo') {
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.rect(m.x + i * 30 + 3, m.y + 6, 22, m.h - 12); ctx.fill(); ctx.stroke(); }
      } else { ctx.beginPath(); ctx.rect(m.x, m.y, m.w, m.h); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = hot ? '#ffd0c8' : 'rgba(236,232,220,.5)';
      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.fillText(m.name.toUpperCase() + (m.hits ? ` ×${m.hits}` : ''), m.x, m.y + m.h + 16);
    }
    ctx.restore();
  }

  function draw() {
    const g = geom();
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0b0e0c'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); ctx.stroke(); }
    drawModules();
    ctx.setLineDash([6, 8]); ctx.strokeStyle = 'rgba(255,122,26,.22)';
    ctx.beginPath(); ctx.moveTo(0, CY); ctx.lineTo(W, CY); ctx.stroke(); ctx.setLineDash([]);

    // bouche du canon + distance (échelle compressée)
    ctx.fillStyle = '#2a302c'; ctx.fillRect(0, CY - 13, 110, 26); ctx.fillRect(60, CY - 19, 26, 38);
    ctx.font = '500 13px "JetBrains Mono", monospace'; ctx.fillStyle = 'rgba(236,232,220,.4)';
    ctx.fillText(`⟵ ${fr(st.dist)} m (distance compressée) ⟶`, 150, CY + 44);

    drawPlate(g);
    drawMarks(g);

    // angle
    ctx.strokeStyle = 'rgba(236,232,220,.35)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(g.entry, CY - 240); ctx.lineTo(g.entry, CY + 40); ctx.stroke(); ctx.setLineDash([]);
    if (st.a > 0) {
      ctx.strokeStyle = ctx.fillStyle = '#ffb347'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(g.entry, CY, 150, -Math.PI / 2, -Math.PI / 2 + g.th); ctx.stroke();
      const la = -Math.PI / 2 + g.th / 2;
      ctx.font = '700 24px "Saira Condensed", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${st.a}°`, g.entry + Math.cos(la) * 185, CY + Math.sin(la) * 185);
      ctx.textAlign = 'start';
    }
    // épaisseur effective (le long de la trajectoire)
    if (shot.phase === 'idle') {
      const y = CY + 36, x1 = Math.max(10, g.entry), x2 = Math.min(W - 10, g.exit);
      ctx.strokeStyle = ctx.fillStyle = '#ff7a1a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.moveTo(x1, y - 8); ctx.lineTo(x1, y + 8); ctx.moveTo(x2, y - 8); ctx.lineTo(x2, y + 8); ctx.stroke();
      ctx.font = '700 19px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
      const lbl = `effectif ${fr(A.eff)} mm`, tw = ctx.measureText(lbl).width;
      ctx.fillStyle = '#0b0e0c'; ctx.fillRect((x1 + x2) / 2 - tw / 2 - 8, y + 12, tw + 16, 28);
      ctx.fillStyle = '#ff7a1a'; ctx.fillText(lbl, (x1 + x2) / 2, y + 32); ctx.textAlign = 'start';
    }

    // sabot
    for (const p of shot.sabot) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - p.t * .9);
      ctx.fillStyle = '#6e6a5e'; ctx.fillRect(-shellLen() * .25, -9, shellLen() * .5, 18);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // obus
    if (shot.phase === 'idle') drawShell(170, CY, 0);
    else if (shot.phase === 'pen') {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, g.entry, H); ctx.rect(g.exit, 0, W, H); ctx.clip();
      drawShell(shot.x, shot.y, 0); ctx.restore();
    } else if (shot.phase === 'stuck') {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, g.entry + 2, H); ctx.clip(); drawShell(shot.x, shot.y, 0, shot.alpha); ctx.restore();
    } else if (shot.phase !== 'jet' && shot.phase !== 'squash' && shot.phase !== 'done') drawShell(shot.x, shot.y, shot.rot);
    else if (shot.phase === 'jet' && shot.alpha > 0) drawShell(shot.x, shot.y, 0, shot.alpha);

    // jet de charge creuse
    if (jet) {
      const a = jet.fade ? Math.max(0, 1 - (jet.t - 1.2) * 2) : 1;
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(255,240,200,${a})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(jet.x0, CY); ctx.lineTo(jet.x0 + jet.len, CY); ctx.stroke();
      ctx.strokeStyle = `rgba(255,150,60,${.4 * a})`; ctx.lineWidth = 10; ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
    // HESH qui s'écrase
    if (blob && !blob.boom) {
      const k = Math.min(1, blob.t / .35);
      ctx.save(); ctx.translate(g.entry - 4 - (1 - k) * 20, CY); ctx.rotate(g.th);
      ctx.fillStyle = '#c9b27a'; ctx.beginPath(); ctx.ellipse(0, 0, 6 + (1 - k) * 12, blob.size * (.5 + k), 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    if (scab) {
      ctx.save(); ctx.translate(scab.x, scab.y); ctx.rotate(scab.rot);
      ctx.fillStyle = MAT_LOOK[st.mat][1]; ctx.beginPath();
      ctx.moveTo(-scab.size * .3, -scab.size / 2); ctx.lineTo(scab.size * .4, -scab.size * .3); ctx.lineTo(scab.size * .2, scab.size / 2); ctx.lineTo(-scab.size * .35, scab.size * .3); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    // particules
    for (const p of parts) {
      const a = 1 - p.t / p.life;
      if (p.type === 'smoke') { ctx.globalAlpha = a * .3; ctx.fillStyle = '#9a948a'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + p.t), 0, Math.PI * 2); ctx.fill(); continue; }
      ctx.globalAlpha = a;
      if (p.type === 'frag') {
        ctx.strokeStyle = p.hot ? '#ffcf7a' : '#b9b3a6'; ctx.lineWidth = p.r;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * .014, p.y - p.vy * .014); ctx.stroke();
      } else { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter';
    for (const f of flashes) {
      const k = f.t / f.life, r = f.r * (.5 + k);
      const gr = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
      gr.addColorStop(0, `rgba(255,240,200,${1 - k})`); gr.addColorStop(.4, `rgba(255,160,60,${(1 - k) * .7})`); gr.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = gr; ctx.fillRect(f.x - r, f.y - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';

    // légende
    const s = shell();
    ctx.font = '700 22px "Saira Condensed", sans-serif'; ctx.fillStyle = '#ece8dc';
    ctx.fillText(`${s.name} · ${A.label}`, 24, 38);
    ctx.font = '500 15px "JetBrains Mono", monospace'; ctx.fillStyle = 'rgba(236,232,220,.55)';
    ctx.fillText(`${gun().name} (${gun().vehicle}) · ${fr(A.v)} m/s à l’impact`, 24, 62);
    if (shot.outcome && shot.phase !== 'flight') {
      const [txt] = VERDICT[shot.outcome];
      const col = { pen: '#7ed67e', spall: '#7ed67e', nopen: '#ff5d5d', rico: '#ffc94a' }[shot.outcome];
      ctx.font = '800 50px "Saira Condensed", sans-serif'; ctx.fillStyle = col; ctx.textAlign = 'right';
      ctx.fillText(txt.toUpperCase(), W - 30, 60); ctx.textAlign = 'start';
    }
  }

  /* ---------- boucle ---------- */
  let last = performance.now(), visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(cv);
  const loop = now => {
    const dt = Math.min(.04, (now - last) / 1000); last = now;
    if (visible) { step(dt); draw(); }
    requestAnimationFrame(loop);
  };
  renderShells();
  gunSel.value = st.gun;
  update();
  requestAnimationFrame(loop);
  if (document.fonts) document.fonts.ready.then(draw);
  const ver = document.querySelector('[data-bal-version]');
  if (ver) ver.textContent = DATA.version;
})();
