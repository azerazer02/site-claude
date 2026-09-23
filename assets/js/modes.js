/* ==========================================================================
   Modes de jeu — onglets de réalisme + bataille tactique simulée (SVG)
   ========================================================================== */
(() => {
  const { reduce } = LDF;
  const $ = s => document.querySelector(s);
  const esc = WT.esc;

  /* ======================= Niveaux de réalisme ======================= */
  const MODES = [
    { id: 'ab', name: 'Arcade', diff: 1,
      text: "Le mode le plus accessible : physique simplifiée, marqueurs au-dessus des ennemis et indicateur de visée pour les avions. Idéal pour découvrir les véhicules et enchaîner les combats nerveux.",
      meters: [['Accessibilité', 95], ['Réalisme', 35], ['Rythme', 95]],
      feats: [['Marqueurs sur les ennemis', 'yes'], ['Vue à la troisième personne', 'yes'], ['Indicateur de visée (avions)', 'yes'], ['Modèle de vol complet', 'part'], ['Batailles interarmes', 'yes'], ['Visée à la souris', 'yes']] },
    { id: 'rb', name: 'Réaliste', diff: 2,
      text: "Le cœur du jeu pour beaucoup de joueurs : modèle de vol et de balistique complet, pas d'indicateur de visée, repérage limité. Il faut anticiper, observer et exploiter le terrain.",
      meters: [['Accessibilité', 60], ['Réalisme', 78], ['Rythme', 65]],
      feats: [['Marqueurs sur les ennemis', 'part'], ['Vue à la troisième personne', 'yes'], ['Indicateur de visée (avions)', 'no'], ['Modèle de vol complet', 'yes'], ['Batailles interarmes', 'yes'], ['Visée à la souris', 'yes']] },
    { id: 'sb', name: 'Simulation', diff: 3,
      text: "L'immersion totale : vue cockpit ou poste d'équipage uniquement, aucun marqueur, identification visuelle des cibles. Joystick, palonnier et suivi de tête sont vivement conseillés.",
      meters: [['Accessibilité', 25], ['Réalisme', 98], ['Rythme', 45]],
      feats: [['Marqueurs sur les ennemis', 'no'], ['Vue à la troisième personne', 'no'], ['Indicateur de visée (avions)', 'no'], ['Modèle de vol complet', 'yes'], ['Batailles interarmes', 'yes'], ['Visée à la souris', 'part']] },
  ];
  const LBL = { yes: '● OUI', no: '○ NON', part: '◐ PARTIEL' };
  const tabs = $('[data-mode-tabs]');
  const mpanel = $('[data-mode-panel]');
  tabs.innerHTML = MODES.map((m, i) => `
    <button class="mode-tab" role="tab" data-i="${i}" aria-selected="${i === 1}">
      <span class="n">MODE 0${i + 1}</span>
      <h3>${m.name}</h3>
      <div class="diff" aria-label="Difficulté ${m.diff} sur 3">${[1, 2, 3].map(k => `<i class="${k <= m.diff ? 'on' : ''}"></i>`).join('')}</div>
    </button>`).join('');
  const showMode = i => {
    const m = MODES[i];
    tabs.querySelectorAll('.mode-tab').forEach(t => t.setAttribute('aria-selected', +t.dataset.i === i));
    mpanel.style.setProperty('--nc', 'var(--accent)');
    mpanel.innerHTML = `
      <div class="anim-in">
        <div class="eyebrow">// ${m.name}</div>
        <p style="font-size:1.08rem">${m.text}</p>
        <div class="power-bars">${m.meters.map(([l, v]) => `<div><span>${l}</span><span class="bar"><i style="--v:0" data-v="${v / 100}"></i></span><b>${v}</b></div>`).join('')}</div>
      </div>
      <div><ul class="feat-list anim-in">${m.feats.map(([l, s]) => `<li><span>${l}</span><span class="${s}">${LBL[s]}</span></li>`).join('')}</ul></div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => mpanel.querySelectorAll('[data-v]').forEach(b => b.style.setProperty('--v', b.dataset.v))));
  };
  tabs.addEventListener('click', e => { const t = e.target.closest('.mode-tab'); if (t) showMode(+t.dataset.i); });
  showMode(1);

  /* ======================= Carte tactique ======================= */
  const VW = 800, VH = 520, ZR = 40;
  const rand = (a, b) => a + Math.random() * (b - a);
  const mapEl = $('[data-map]');

  // courbes de niveau procédurales
  const hills = [[170, 130, 110], [560, 400, 130], [430, 90, 80], [690, 150, 90], [250, 430, 90], [80, 360, 60]];
  let contours = '';
  hills.forEach(([cx, cy, r]) => {
    const p1 = rand(0, 6), p2 = rand(0, 6);
    for (let k = 0; k < 5; k++) {
      const rr = r * (1 - k * .19);
      let d = '';
      for (let a = 0; a <= 48; a++) {
        const t = a / 48 * Math.PI * 2;
        const m = 1 + .14 * Math.sin(3 * t + p1) + .07 * Math.sin(5 * t + p2);
        d += `${a ? 'L' : 'M'}${(cx + Math.cos(t) * rr * m).toFixed(1)} ${(cy + Math.sin(t) * rr * m * .8).toFixed(1)}`;
      }
      contours += `<path d="${d}Z" fill="none" stroke="rgba(170,190,150,${.06 + k * .025})" stroke-width="1"/>`;
    }
  });
  const cols = 'ABCDEFGH';
  const gridLabels = [...cols].map((c, i) => `<text x="${i * 100 + 50}" y="14" class="gl">${c}</text>`).join('') +
    Array.from({ length: 8 }, (_, i) => `<text x="8" y="${i * 65 + 38}" class="gl">${i + 1}</text>`).join('');

  mapEl.innerHTML = `
    <svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Carte tactique animée : deux équipes se disputent des zones de capture">
      <defs>
        <pattern id="tgrid" width="100" height="65" patternUnits="userSpaceOnUse"><path d="M100 0H0V65" fill="none" stroke="rgba(255,255,255,.06)"/></pattern>
        <radialGradient id="zg-n"><stop offset="0" stop-color="rgba(255,255,255,.14)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></radialGradient>
        <radialGradient id="zg-b"><stop offset="0" stop-color="rgba(111,178,255,.35)"/><stop offset="1" stop-color="rgba(111,178,255,0)"/></radialGradient>
        <radialGradient id="zg-r"><stop offset="0" stop-color="rgba(255,106,90,.35)"/><stop offset="1" stop-color="rgba(255,106,90,0)"/></radialGradient>
      </defs>
      <style>
        .gl{fill:rgba(236,232,220,.3);font:500 10px 'JetBrains Mono',monospace;text-anchor:middle}
        .zl{font:800 20px 'Saira Condensed',sans-serif;text-anchor:middle;dominant-baseline:central}
        .ov{font:800 54px 'Saira Condensed',sans-serif;text-anchor:middle;letter-spacing:4px}
      </style>
      <rect width="${VW}" height="${VH}" fill="#0c100d"/>
      <g>${contours}</g>
      <path d="M0 300 C150 275 250 350 380 322 S600 250 800 292" fill="none" stroke="rgba(70,140,180,.22)" stroke-width="18"/>
      <path d="M0 300 C150 275 250 350 380 322 S600 250 800 292" fill="none" stroke="rgba(110,180,220,.35)" stroke-width="2"/>
      <path d="M40 250 L230 240 L400 210 L590 290 L770 270 M400 210 L420 40 M400 210 L390 500" fill="none" stroke="rgba(236,232,220,.13)" stroke-width="2" stroke-dasharray="8 6"/>
      <rect width="${VW}" height="${VH}" fill="url(#tgrid)"/>
      ${gridLabels}
      <rect x="10" y="150" width="60" height="220" fill="rgba(111,178,255,.06)" stroke="rgba(111,178,255,.4)" stroke-dasharray="4 4"/>
      <rect x="730" y="150" width="60" height="220" fill="rgba(255,106,90,.06)" stroke="rgba(255,106,90,.4)" stroke-dasharray="4 4"/>
      <g data-zones></g>
      <g data-fx></g>
      <g data-units></g>
      <g data-overlay></g>
    </svg>`;
  const svg = mapEl.querySelector('svg');
  const gZones = svg.querySelector('[data-zones]');
  const gFx = svg.querySelector('[data-fx]');
  const gUnits = svg.querySelector('[data-units]');
  const gOver = svg.querySelector('[data-overlay]');
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.append(e); return e; };

  const LAYOUTS = {
    dom:  [{ id: 'A', x: 230, y: 240 }, { id: 'B', x: 400, y: 190 }, { id: 'C', x: 580, y: 300 }],
    conq: [{ id: 'B', x: 400, y: 250 }],
    bat:  [{ id: 'A', x: 190, y: 260, cap: 1 }, { id: 'B', x: 610, y: 260, cap: -1 }],
  };
  const names = WT.vehicles.filter(v => v.type === 'sol').map(v => v.name);
  const COL = { b: '#6fb2ff', r: '#ff6a5a' };
  const TEAM = { b: 'BLEU', r: 'ROUGE' };

  let S; // état de la partie
  let mode = 'dom';
  let paused = false;

  function setup() {
    gZones.innerHTML = ''; gFx.innerHTML = ''; gUnits.innerHTML = ''; gOver.innerHTML = '';
    const zones = LAYOUTS[mode].map(z => {
      const cap = z.cap || 0;
      const g = mk('g', { transform: `translate(${z.x} ${z.y})` }, gZones);
      const glow = mk('circle', { r: ZR * 1.8, fill: 'url(#zg-n)' }, g);
      mk('circle', { r: ZR, fill: 'rgba(0,0,0,.25)', stroke: 'rgba(236,232,220,.25)', 'stroke-width': 1, 'stroke-dasharray': '3 4' }, g);
      const ring = mk('circle', { r: ZR, fill: 'none', 'stroke-width': 4, transform: 'rotate(-90)', 'stroke-dasharray': `0 ${2 * Math.PI * ZR}` }, g);
      const label = mk('text', { class: 'zl', fill: '#ece8dc' }, g);
      label.textContent = z.id;
      return { ...z, cap, owner: cap > 0 ? 'b' : cap < 0 ? 'r' : null, g, glow, ring, label };
    });
    const units = [];
    ['b', 'r'].forEach(team => {
      for (let i = 0; i < 6; i++) {
        const u = { team, name: names[Math.floor(Math.random() * names.length)], alive: true, respawn: 0, cool: rand(1, 3), retarget: 0, hdg: team === 'b' ? 0 : 180 };
        spawn(u);
        u.el = mk('g', {}, gUnits);
        mk('path', { d: 'M9 0 L-6 -6 L-3 0 L-6 6 Z', fill: COL[team], stroke: '#000', 'stroke-width': 1 }, u.el);
        mk('circle', { r: 14, fill: 'none', stroke: COL[team], 'stroke-opacity': .25 }, u.el);
        units.push(u);
      }
    });
    S = { zones, units, tickets: { b: 100, r: 100 }, fx: [], over: 0, t: 0 };
    renderCaps();
    logEl.innerHTML = '';
    log(`<span>Début de la bataille — mode ${mode === 'dom' ? 'Domination' : mode === 'conq' ? 'Conquête' : 'Bataille'}.</span>`);
  }
  function spawn(u) {
    u.x = u.team === 'b' ? rand(22, 60) : rand(740, 778);
    u.y = rand(165, 355);
    u.alive = true;
    u.retarget = 0;
  }

  /* ---------- Barre latérale ---------- */
  const capsEl = $('[data-caps]');
  const logEl = $('[data-log]');
  function renderCaps() {
    capsEl.innerHTML = S.zones.map(z => `<div class="cap-row"><span class="l" data-zl="${z.id}">${z.id}</span><span class="bar"><i data-zb="${z.id}" style="--v:0"></i></span></div>`).join('');
  }
  function log(html) {
    const d = document.createElement('div');
    d.innerHTML = `<span style="color:var(--dim)">[${fmtTime(S ? S.t : 0)}]</span> ${html}`;
    logEl.prepend(d);
    while (logEl.children.length > 7) logEl.lastChild.remove();
  }
  const fmtTime = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

  /* ---------- Logique ---------- */
  function pickTarget(u) {
    const sign = u.team === 'b' ? 1 : -1;
    const scored = S.zones.map(z => {
      const d = Math.hypot(z.x - u.x, z.y - u.y);
      const need = 1 - z.cap * sign; // 0 = déjà à nous, 2 = à l'ennemi
      return { z, s: need * 300 - d + rand(0, 160) };
    }).sort((a, b) => b.s - a.s);
    const z = scored[0].z;
    const a = rand(0, Math.PI * 2), r = rand(0, ZR * .7);
    u.tx = z.x + Math.cos(a) * r; u.ty = z.y + Math.sin(a) * r;
    u.retarget = rand(6, 11);
  }

  function step(dt) {
    S.t += dt;
    if (S.over > 0) {
      S.over -= dt;
      if (S.over <= 0) setup();
      return;
    }
    const alive = S.units.filter(u => u.alive);
    for (const u of S.units) {
      if (!u.alive) {
        u.respawn -= dt;
        if (u.respawn <= 0) spawn(u);
        continue;
      }
      u.retarget -= dt;
      if (u.retarget <= 0 || u.tx === undefined) pickTarget(u);
      const dx = u.tx - u.x, dy = u.ty - u.y, d = Math.hypot(dx, dy);
      if (d > 3) {
        const sp = 34 * dt;
        u.x += dx / d * Math.min(sp, d);
        u.y += dy / d * Math.min(sp, d);
        const target = Math.atan2(dy, dx) * 180 / Math.PI;
        let diff = ((target - u.hdg + 540) % 360) - 180;
        u.hdg += diff * Math.min(1, dt * 4);
      }
      // tir
      u.cool -= dt;
      if (u.cool <= 0) {
        let best = null, bd = 190;
        for (const e of alive) if (e.team !== u.team && e.alive) {
          const dd = Math.hypot(e.x - u.x, e.y - u.y);
          if (dd < bd) { bd = dd; best = e; }
        }
        if (best) {
          u.cool = rand(2.2, 4.2);
          fxShot(u, best);
          if (Math.random() < .3) {
            best.alive = false; best.respawn = 5;
            fxBoom(best.x, best.y);
            S.tickets[best.team] = Math.max(0, S.tickets[best.team] - 2);
            log(`<span class="${u.team}">${esc(u.name)}</span> a détruit <span class="${best.team}">${esc(best.name)}</span>`);
          }
        } else u.cool = .5;
      }
    }
    // captures
    for (const z of S.zones) {
      let nb = 0, nr = 0;
      for (const u of S.units) if (u.alive && Math.hypot(u.x - z.x, u.y - z.y) < ZR) u.team === 'b' ? nb++ : nr++;
      const before = z.owner;
      z.cap = Math.max(-1, Math.min(1, z.cap + (nb - nr) * .07 * dt));
      if (z.cap >= 1) z.owner = 'b';
      else if (z.cap <= -1) z.owner = 'r';
      else if (!(z.cap > 0 && z.owner === 'b') && !(z.cap < 0 && z.owner === 'r')) z.owner = null;
      if (before !== z.owner) {
        if (z.owner) log(`Point <b>${z.id}</b> capturé par l'équipe <span class="${z.owner}">${TEAM[z.owner]}</span>`);
        else if (before) log(`Point <b>${z.id}</b> neutralisé`);
      }
    }
    // perte de tickets
    const ob = S.zones.filter(z => z.owner === 'b').length, or = S.zones.filter(z => z.owner === 'r').length;
    if (ob > or) S.tickets.r = Math.max(0, S.tickets.r - (ob - or) * 1.4 * dt);
    if (or > ob) S.tickets.b = Math.max(0, S.tickets.b - (or - ob) * 1.4 * dt);
    const loser = S.tickets.b <= 0 ? 'b' : S.tickets.r <= 0 ? 'r' : null;
    if (loser) {
      const w = loser === 'b' ? 'r' : 'b';
      S.over = 5;
      gOver.innerHTML = `<rect width="${VW}" height="${VH}" fill="rgba(5,7,6,.7)"/><text class="ov" x="${VW / 2}" y="${VH / 2}" fill="${COL[w]}">VICTOIRE ÉQUIPE ${TEAM[w]}</text><text class="gl" x="${VW / 2}" y="${VH / 2 + 40}" style="font-size:12px">NOUVELLE BATAILLE DANS QUELQUES SECONDES…</text>`;
      log(`<b>Fin de la bataille</b> — victoire <span class="${w}">${TEAM[w]}</span>`);
    }
  }

  function fxShot(a, b) {
    const l = mk('line', { x1: a.x, y1: a.y, x2: b.x + rand(-6, 6), y2: b.y + rand(-6, 6), stroke: a.team === 'b' ? '#bfe0ff' : '#ffd0c8', 'stroke-width': 1.6 }, gFx);
    const f = mk('circle', { cx: a.x, cy: a.y, r: 5, fill: '#ffd28a' }, gFx);
    S.fx.push({ el: l, t: 0, life: .3 }, { el: f, t: 0, life: .2 });
  }
  function fxBoom(x, y) {
    const c = mk('circle', { cx: x, cy: y, r: 4, fill: 'rgba(255,160,60,.5)', stroke: '#ffb347', 'stroke-width': 2 }, gFx);
    S.fx.push({ el: c, t: 0, life: .9, boom: true });
  }

  function draw() {
    for (const u of S.units) {
      u.el.style.display = u.alive ? '' : 'none';
      if (u.alive) u.el.setAttribute('transform', `translate(${u.x.toFixed(1)} ${u.y.toFixed(1)}) rotate(${u.hdg.toFixed(1)})`);
    }
    const C = 2 * Math.PI * ZR;
    for (const z of S.zones) {
      const col = z.cap > 0 ? COL.b : COL.r;
      z.ring.setAttribute('stroke', col);
      z.ring.setAttribute('stroke-dasharray', `${(Math.abs(z.cap) * C).toFixed(1)} ${C}`);
      z.glow.setAttribute('fill', z.owner ? `url(#zg-${z.owner})` : 'url(#zg-n)');
      z.label.setAttribute('fill', z.owner ? COL[z.owner] : '#ece8dc');
      const zl = capsEl.querySelector(`[data-zl="${z.id}"]`);
      const zb = capsEl.querySelector(`[data-zb="${z.id}"]`);
      zl.className = `l ${z.owner === 'b' ? 'blue' : z.owner === 'r' ? 'red' : ''}`;
      zb.style.setProperty('--v', Math.abs(z.cap).toFixed(3));
      zb.style.background = col;
    }
    for (let i = S.fx.length - 1; i >= 0; i--) {
      const f = S.fx[i];
      const k = f.t / f.life;
      if (k >= 1) { f.el.remove(); S.fx.splice(i, 1); continue; }
      f.el.setAttribute('opacity', (1 - k).toFixed(2));
      if (f.boom) f.el.setAttribute('r', (4 + k * 26).toFixed(1));
    }
    $('[data-t-blue]').textContent = Math.ceil(S.tickets.b);
    $('[data-t-red]').textContent = Math.ceil(S.tickets.r);
    $('[data-tb-blue]').style.setProperty('--v', S.tickets.b / 100);
    $('[data-tb-red]').style.setProperty('--v', S.tickets.r / 100);
  }

  /* ---------- Boucle ---------- */
  let visible = false, last = performance.now();
  const loop = now => {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (visible && !paused) {
      step(dt);
      for (const f of S.fx) f.t += dt;
      draw();
    }
    requestAnimationFrame(loop);
  };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(mapEl);
  setup();
  draw();
  if (!reduce) requestAnimationFrame(loop);
  else paused = true;

  /* ---------- Contrôles ---------- */
  const modeBtns = $('[data-tac-modes]');
  modeBtns.addEventListener('click', e => {
    const b = e.target.closest('[data-m]');
    if (!b) return;
    mode = b.dataset.m;
    modeBtns.querySelectorAll('[data-m]').forEach(x => x.className = `btn btn-sm ${x === b ? 'btn-primary' : 'btn-ghost'}`);
    setup(); draw();
  });
  const pauseBtn = $('[data-pause]');
  pauseBtn.textContent = paused ? 'Lecture' : 'Pause';
  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? 'Lecture' : 'Pause';
    if (!paused && reduce) { last = performance.now(); requestAnimationFrame(loop); }
  });
  $('[data-restart]').addEventListener('click', () => { setup(); draw(); });
})();
