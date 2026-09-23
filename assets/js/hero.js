/* ==========================================================================
   Scène de bataille procédurale + mini-jeu de tir — page d'accueil
   Ciel au crépuscule, reliefs en parallaxe, avions et chars ennemis (dessinés
   avec les silhouettes du site), DCA, traçantes, braises. Le char du premier
   plan vise la souris : un clic tire un obus qui explose au point visé.
   ========================================================================== */
(() => {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const hero = canvas.closest('.hero');
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const TAU = Math.PI * 2;
  const fmt = n => Math.round(n).toLocaleString('fr-FR');

  let W = 0, H = 0, DPR = 1;
  let mx = 0, my = 0, tmx = 0, tmy = 0;            // souris normalisée [-1, 1] (parallaxe)
  const mouse = { x: -1, y: -1, in: false };       // souris en pixels canvas
  let shake = 0;
  let running = true;

  /* ---------- Sprites pré-rendus ---------- */
  const sprite = (size, stops) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const s = c.getContext('2d'), h = size / 2;
    const g = s.createRadialGradient(h, h, 0, h, h, h);
    stops.forEach(([o, col]) => g.addColorStop(o, col));
    s.fillStyle = g; s.fillRect(0, 0, size, size);
    return c;
  };
  const smoke = sprite(128, [[0, 'rgba(30,24,22,.55)'], [.5, 'rgba(24,19,18,.25)'], [1, 'rgba(20,16,15,0)']]);
  const glow = sprite(64, [[0, 'rgba(255,240,200,1)'], [.25, 'rgba(255,170,60,.8)'], [1, 'rgba(255,90,20,0)']]);

  // silhouettes du site converties en images (version sombre + liseré lumineux)
  const SIL = window.WT_SIL || {};
  const images = {};
  const silImg = (id, color) => {
    const key = id + color;
    if (images[key]) return images[key];
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 100" width="480" height="200" fill="${color}" style="color:${color}">${SIL[id] || ''}</svg>`);
    return (images[key] = img);
  };
  const DARK = '#140d0a', RIMC = '#ff9a55';
  const nameOf = id => (window.WT && WT.vehicles.find(v => v.id === id) || {}).name || id;

  /* ---------- Catalogue des cibles ---------- */
  const AIR = [
    { id: 'spitfire9', pts: 100, speed: [80, 120] }, { id: 'bf109g6', pts: 100, speed: [80, 120] },
    { id: 'p51d', pts: 100, speed: [90, 130] }, { id: 'yak3', pts: 100, speed: [80, 120] },
    { id: 'a6m2', pts: 100, speed: [70, 110] }, { id: 'il2', pts: 120, speed: [60, 90] },
    { id: 'me262', pts: 150, speed: [140, 190], jet: true }, { id: 'mig15', pts: 150, speed: [150, 200], jet: true },
    { id: 'f86f', pts: 150, speed: [150, 200], jet: true }, { id: 'mig21', pts: 200, speed: [190, 240], jet: true },
    { id: 'f4e', pts: 200, speed: [170, 220], jet: true }, { id: 'mirage2000', pts: 200, speed: [180, 230], jet: true },
    { id: 'b17g', pts: 300, speed: [45, 65], hp: 2, big: true }, { id: 'ah64a', pts: 250, speed: [50, 75], heli: true },
    { id: 'mi24v', pts: 250, speed: [55, 80], heli: true },
  ];
  const GROUND = ['tiger1', 't3485', 'm4a3e8', 'panther', 'is2', 'pz4f2', 'kv1', 'm26', 'cromwell5', 't54', 'churchill7', 'chito', 'tiger2', 'm18'];
  [...AIR.map(a => a.id), ...GROUND].forEach(id => { silImg(id, DARK); silImg(id, RIMC); });

  /* ---------- Reliefs ---------- */
  const layers = [
    { base: .60, amp: .09, depth: .12, col: '#4a2616', haze: 'rgba(255,120,50,.10)', n: 5 },
    { base: .68, amp: .08, depth: .25, col: '#2a1710', haze: 'rgba(255,110,40,.06)', n: 6 },
    { base: .78, amp: .06, depth: .45, col: '#150d0a', haze: null, n: 7 },
    { base: .88, amp: .045, depth: .8, col: '#070605', haze: null, n: 5 },
  ];
  layers.forEach(l => {
    l.waves = Array.from({ length: l.n }, (_, i) => ({ f: rand(.6, 1.4) * (i + 1) * 1.7, p: rand(0, TAU), a: 1 / (i + 1.2) }));
  });
  const ridgeRaw = (l, x) => { let y = 0; for (const w of l.waves) y += Math.sin(x * w.f + w.p) * w.a; return (l.base - y * l.amp * .6) * H; };
  // hauteur de la crête à l'écran (parallaxe comprise)
  const ridgeAt = (l, sx) => ridgeRaw(l, (sx + mx * 60 * l.depth) / W) - my * 14 * l.depth;

  /* ---------- Entités ---------- */
  const planes = [], foes = [], flak = [], tracers = [], embers = [], puffs = [], shells = [], sparks = [], floaters = [];
  const clouds = Array.from({ length: 14 }, () => ({ x: Math.random(), y: rand(.08, .5), s: rand(.5, 1.6), v: rand(.004, .012), a: rand(.25, .6) }));

  const spawnPlane = (initial = false) => {
    const type = pick(AIR);
    const dir = Math.random() < .5 ? 1 : -1;
    const depth = type.big ? rand(.7, 1) : rand(.45, 1);
    planes.push({
      type, depth, hp: type.hp || 1,
      x: initial ? rand(.15, .85) * W : (dir > 0 ? -140 : W + 140),
      y: type.heli ? rand(.36, .52) * H : rand(.1, .42) * H,
      vx: dir * rand(...type.speed) * (.55 + depth * .45) * game.speedMul,
      bob: rand(0, TAU), trail: [], hit: 0, sx: 0, sy: 0, r: 0,
    });
  };
  const spawnFoe = () => {
    const dir = Math.random() < .5 ? 1 : -1;
    foes.push({ id: pick(GROUND), dir, x: dir > 0 ? -120 : W + 120, v: rand(22, 42) * game.speedMul, dead: 0, sx: 0, sy: 0, r: 0, fire: rand(2, 5) });
  };
  const burst = (x, y, big = false) => {
    flak.push({ x, y, t: 0, r: big ? rand(16, 24) : rand(7, 12) });
    for (let i = 0; i < (big ? 3 : 1); i++) puffs.push({ x: x + rand(-8, 8), y: y + rand(-6, 6), r: rand(10, 18) * (big ? 1.8 : 1), t: 0, life: rand(3, 5), vx: rand(-6, 6), vy: rand(-4, 2) });
  };
  const explode = (x, y, size = 1) => {
    flak.push({ x, y, t: 0, r: 26 * size });
    for (let i = 0; i < 4; i++) puffs.push({ x: x + rand(-10, 10), y: y + rand(-8, 8), r: rand(14, 24) * size, t: 0, life: rand(2.5, 4), vx: rand(-10, 10), vy: rand(-16, -4) });
    for (let i = 0; i < 26 * size; i++) {
      const a = rand(0, TAU), v = rand(80, 320) * size;
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, t: 0, life: rand(.5, 1.1) });
    }
  };

  // traçantes d'ambiance (DCA alliée) : purement décoratives
  const emitters = [.08, .48, .62, .9];
  const fireTracers = () => {
    const ex = pick(emitters) * W;
    const ey = ridgeAt(layers[2], ex) + 4;
    const target = planes.length && Math.random() < .7 ? pick(planes) : null;
    const ang = target ? Math.atan2(target.sy - ey, target.sx - ex + rand(-160, 160)) : rand(-2.2, -.9);
    const n = Math.floor(rand(5, 11));
    for (let i = 0; i < n; i++) tracers.push({ x: ex, y: ey, vx: Math.cos(ang) * 900, vy: Math.sin(ang) * 900, delay: i * .07, life: rand(.9, 1.4), t: 0 });
  };

  /* ---------- Char du joueur ---------- */
  const tank = { x: .62, recoil: 0, flash: 0, elev: -.2, facing: 1, cooldown: 0, auto: 2.5, pivot: { x: 0, y: 0 }, muzzle: { x: 0, y: 0 } };
  const RELOAD = .45;

  /* ---------- Jeu ---------- */
  const game = { score: 0, shots: 0, hits: 0, combo: 1, comboT: 0, played: false, mode: 'free', timeLeft: 0, speedMul: 1, record: 0 };
  try { game.record = +localStorage.getItem('ldf-record') || 0; } catch (e) { /* stockage indisponible */ }
  const ROUND = 60;
  const ui = {
    score: document.querySelector('[data-g-score]'), combo: document.querySelector('[data-g-combo]'),
    acc: document.querySelector('[data-g-acc]'), kills: document.querySelector('[data-g-kills]'),
    feed: document.querySelector('[data-g-feed]'), timer: document.querySelector('[data-g-timer]'),
    record: document.querySelector('[data-g-record]'), end: document.querySelector('[data-g-end]'),
    hint: document.querySelector('[data-g-hint]'),
  };
  let shown = {};
  const setText = (el, key, val) => { if (el && shown[key] !== val) { el.textContent = val; shown[key] = val; } };
  function syncHud() {
    setText(ui.score, 'score', fmt(game.score));
    setText(ui.combo, 'combo', '×' + game.combo);
    setText(ui.acc, 'acc', game.shots ? Math.round(game.hits / game.shots * 100) + ' %' : '—');
    setText(ui.kills, 'kills', String(game.hits));
    setText(ui.record, 'record', fmt(game.record));
    if (ui.timer && game.mode === 'combat') setText(ui.timer, 'timer', Math.ceil(game.timeLeft) + ' s');
    if (ui.combo) ui.combo.classList.toggle('hot', game.combo > 1);
  }
  function feed(text, pts) {
    if (!ui.feed) return;
    const d = document.createElement('div');
    d.innerHTML = `<b>+${pts}</b> ${text}`;
    ui.feed.prepend(d);
    while (ui.feed.children.length > 4) ui.feed.lastChild.remove();
    setTimeout(() => d.classList.add('out'), 2600);
    setTimeout(() => d.remove(), 3200);
  }
  function score(base, x, y, label) {
    const pts = base * game.combo;
    game.score += pts;
    game.hits++;
    floaters.push({ x, y, t: 0, text: `+${pts}${game.combo > 1 ? `  ×${game.combo}` : ''}` });
    feed(`${label} détruit`, pts);
    game.combo = Math.min(5, game.combo + 1);
    game.comboT = 3;
  }

  // demo = tir automatique de démonstration (ne rapporte aucun point)
  function fire(tx, ty, demo = false) {
    if (!demo) {
      if (tank.cooldown > 0 || game.mode === 'over') return;
      game.played = true;
      game.shots++;
      if (ui.hint) ui.hint.classList.add('gone');
      if (!looping) resume();
    }
    aimAt(tx, ty);
    tank.cooldown = RELOAD;
    tank.recoil = 1; tank.flash = 1; shake = Math.max(shake, 5);
    const { x, y } = tank.muzzle;
    const d = Math.hypot(tx - x, ty - y);
    shells.push({ x, y, x0: x, y0: y, tx, ty, t: 0, dur: Math.max(.08, d / 3000), demo });
    for (let i = 0; i < 4; i++) puffs.push({ x: x + rand(-6, 6), y: y + rand(-6, 6), r: rand(8, 16), t: 0, life: rand(1.4, 2.4), vx: rand(-10, 10), vy: rand(-18, -4) });
  }

  function detonate(sh) {
    const R = 34;
    let hit = false;
    for (const p of planes) {
      if (p.hit || Math.hypot(p.sx - sh.tx, p.sy - sh.ty) > p.r + R) continue;
      hit = true;
      p.hp--;
      burst(p.sx, p.sy, true);
      if (p.hp <= 0) {
        p.hit = .01;
        const pts = Math.round(p.type.pts * (p.depth < .6 ? 1.5 : 1) / 10) * 10;
        if (!sh.demo) score(pts, p.sx, p.sy - 20, nameOf(p.type.id));
      } else if (!sh.demo) floaters.push({ x: p.sx, y: p.sy - 20, t: 0, text: 'TOUCHÉ !' });
    }
    for (const f of foes) {
      if (f.dead || Math.hypot(f.sx - sh.tx, f.sy - sh.ty) > f.r + R * .8) continue;
      hit = true;
      f.dead = .01;
      explode(f.sx, f.sy, 1.1);
      shake = Math.max(shake, 9);
      if (!sh.demo) score(150, f.sx, f.sy - 30, nameOf(f.id));
    }
    if (!hit) {
      if (!sh.demo) game.combo = 1;
      const ground = sh.ty > ridgeAt(layers[2], sh.tx) - 4;
      if (ground) explode(sh.tx, sh.ty, .6); else burst(sh.tx, sh.ty);
    }
  }

  function aimAt(tx, ty) {
    // angle local du canon compte tenu de l'orientation (le char se retourne)
    const p = tank.pivot;
    tank.facing = tx < p.x - 30 ? -1 : tx > p.x + 30 ? 1 : tank.facing;
  }

  /* ---------- Mode combat (manche chronométrée) ---------- */
  function startCombat() {
    Object.assign(game, { score: 0, shots: 0, hits: 0, combo: 1, comboT: 0, mode: 'combat', timeLeft: ROUND, speedMul: 1.15 });
    planes.length = 0; foes.length = 0;
    for (let i = 0; i < 3; i++) spawnPlane(true);
    spawnFoe();
    hero.classList.add('combat');
    hero.classList.remove('over');
    if (ui.end) ui.end.hidden = true;
    if (ui.feed) ui.feed.innerHTML = '';
    if (!looping) resume();
  }
  function endCombat() {
    game.mode = 'over';
    const best = game.score > game.record;
    if (best) { game.record = game.score; try { localStorage.setItem('ldf-record', game.record); } catch (e) { /* ignoré */ } }
    hero.classList.add('over');
    if (ui.end) {
      ui.end.hidden = false;
      ui.end.querySelector('[data-g-final]').textContent = fmt(game.score);
      ui.end.querySelector('[data-g-final-kills]').textContent = game.hits;
      ui.end.querySelector('[data-g-final-acc]').textContent = game.shots ? Math.round(game.hits / game.shots * 100) + ' %' : '—';
      ui.end.querySelector('[data-g-best]').hidden = !best;
      ui.end.querySelector('[data-g-rank]').textContent =
        game.score >= 6000 ? 'As de la DCA' : game.score >= 3500 ? 'Tireur d’élite' : game.score >= 1500 ? 'Artilleur confirmé' : game.score >= 500 ? 'Pointeur' : 'Recrue';
    }
    syncHud();
  }
  function quitCombat() {
    Object.assign(game, { mode: 'free', speedMul: 1, combo: 1 });
    hero.classList.remove('combat', 'over');
    if (ui.end) ui.end.hidden = true;
  }
  document.querySelectorAll('[data-g-start]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); startCombat(); }));
  document.querySelectorAll('[data-g-quit]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); quitCombat(); }));
  addEventListener('keydown', e => { if (e.key === 'Escape' && game.mode !== 'free') quitCombat(); });

  /* ---------- Entrées ---------- */
  const toCanvas = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  addEventListener('pointermove', e => {
    tmx = (e.clientX / innerWidth) * 2 - 1;
    tmy = (e.clientY / innerHeight) * 2 - 1;
    const p = toCanvas(e);
    mouse.x = p.x; mouse.y = p.y;
    mouse.in = p.y >= 0 && p.y <= H;
  }, { passive: true });
  hero.addEventListener('click', e => {
    if (e.target.closest('a, button, [data-g-end]')) return;
    const p = toCanvas(e);
    mouse.x = p.x; mouse.y = p.y; mouse.in = true; // sur écran tactile, le canon pivote vers le point touché
    fire(p.x, p.y);
  });

  /* ---------- Dimensionnement ---------- */
  const resize = () => {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  };
  resize();
  addEventListener('resize', resize);
  for (let i = 0; i < 3; i++) spawnPlane(true);
  for (let i = 0; i < 70; i++) embers.push(newEmber(true));
  function newEmber(initial) {
    return { x: Math.random() * W, y: initial ? Math.random() * H : H + 10, vy: rand(20, 60), vx: rand(-10, 10), s: rand(.6, 2.2), ph: rand(0, TAU) };
  }

  /* ---------- Dessin du décor ---------- */
  function drawSky(t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#07080b'); g.addColorStop(.35, '#15121a'); g.addColorStop(.55, '#3a1a14');
    g.addColorStop(.68, '#8a3512'); g.addColorStop(.76, '#ff7a1a'); g.addColorStop(1, '#2a1208');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const sx = W * .68 - mx * 20, sy = H * .63 - my * 10;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, W * .55);
    sg.addColorStop(0, 'rgba(255,220,160,.95)'); sg.addColorStop(.04, 'rgba(255,170,80,.7)');
    sg.addColorStop(.2, 'rgba(255,110,30,.25)'); sg.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    for (let i = 0; i < 60; i++) {
      const x = (i * 97.3 % 1) * W, y = ((i * 53.7) % 1) * H * .3;
      ctx.globalAlpha = Math.max(0, .2 + .3 * Math.sin(t * 1.5 + i));
      ctx.fillRect((x + i * 131) % W, y, 1.2, 1.2);
    }
    ctx.globalAlpha = 1;
  }
  function drawClouds(dt) {
    for (const c of clouds) {
      c.x += c.v * dt * .1;
      if (c.x > 1.2) c.x = -.2;
      const x = c.x * W - mx * 30 * c.s, y = c.y * H - my * 10;
      const w = 360 * c.s, h = 90 * c.s;
      ctx.globalAlpha = c.a;
      ctx.drawImage(smoke, x - w / 2, y - h / 2, w, h);
      ctx.drawImage(smoke, x - w * .2, y - h * .8, w * .7, h * 1.1);
    }
    ctx.globalAlpha = 1;
  }
  function drawRidge(l, i) {
    ctx.beginPath();
    ctx.moveTo(-10, H);
    for (let x = -10; x <= W + 10; x += 8) ctx.lineTo(x, ridgeAt(l, x));
    ctx.lineTo(W + 10, H);
    ctx.closePath();
    ctx.fillStyle = l.col; ctx.fill();
    if (l.haze) {
      const g = ctx.createLinearGradient(0, l.base * H - l.amp * H, 0, H);
      g.addColorStop(0, l.haze); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fill();
    }
    if (i < 2) {
      ctx.strokeStyle = `rgba(255,150,70,${.18 - i * .07})`; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = -10; x <= W + 10; x += 8) x === -10 ? ctx.moveTo(x, ridgeAt(l, x)) : ctx.lineTo(x, ridgeAt(l, x));
      ctx.stroke();
    }
  }
  // silhouette : liseré lumineux décalé puis aplat sombre
  function drawSil(id, cx, cy, w, flip, rot = 0, alpha = 1) {
    const dark = silImg(id, DARK), rim = silImg(id, RIMC);
    if (!dark.complete || !dark.naturalWidth) return;
    const h = w * 100 / 240;
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(flip ? -1 : 1, 1);
    ctx.globalAlpha = .45 * alpha;
    if (rim.complete && rim.naturalWidth) ctx.drawImage(rim, -w / 2, -h / 2 - 1.4, w, h);
    ctx.globalAlpha = alpha;
    ctx.drawImage(dark, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  /* ---------- Cibles ---------- */
  function drawPlanes(dt, t) {
    for (let i = planes.length - 1; i >= 0; i--) {
      const p = planes[i];
      p.x += p.vx * dt;
      if (p.hit > 0) { p.hit += dt; p.y += 40 * dt * p.hit * p.hit; p.vx *= .995; }
      const y = p.y + Math.sin(t * .8 + p.bob) * (p.type.heli ? 4 : 8);
      p.sx = p.x - mx * 40 * p.depth; p.sy = y - my * 16 * p.depth;
      const w = (p.type.big ? 150 : p.type.heli ? 110 : 88) * (.55 + p.depth * .6);
      p.r = w * .32;
      const flip = p.vx < 0;

      // traînée
      p.trail.push({ x: p.sx - (flip ? -1 : 1) * w * .42, y: p.sy });
      if (p.trail.length > 60) p.trail.shift();
      ctx.lineCap = 'round';
      for (let k = 1; k < p.trail.length; k++) {
        const a = k / p.trail.length;
        ctx.strokeStyle = p.hit ? `rgba(40,30,28,${a * .6})` : `rgba(255,230,210,${a * (p.type.jet ? .22 : .12) * p.depth})`;
        ctx.lineWidth = (p.hit ? 7 : 1.6) * p.depth * a;
        ctx.beginPath(); ctx.moveTo(p.trail[k - 1].x, p.trail[k - 1].y); ctx.lineTo(p.trail[k].x, p.trail[k].y); ctx.stroke();
      }
      const rot = p.hit ? (flip ? -1 : 1) * Math.min(.9, p.hit * .5) : Math.sin(t * .8 + p.bob) * .04;
      drawSil(p.type.id, p.sx, p.sy, w, flip, rot);
      if (p.type.heli && !p.hit) { // rotor en rotation
        ctx.fillStyle = 'rgba(20,13,10,.55)';
        const rw = w * .8 * Math.abs(Math.cos(t * 26));
        ctx.fillRect(p.sx - rw / 2, p.sy - w * .2, rw, 2);
      }
      if (p.hit) {
        if (Math.random() < .6) puffs.push({ x: p.sx, y: p.sy, r: rand(6, 12), t: 0, life: rand(2, 3), vx: 0, vy: -4 });
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = .9; ctx.drawImage(glow, p.sx - 16, p.sy - 16, 32, 32);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        if (p.sy > ridgeAt(layers[1], p.sx)) { explode(p.sx, p.sy, .9); planes.splice(i, 1); continue; }
      }
      if (p.x < -260 || p.x > W + 260) planes.splice(i, 1);
    }
  }
  function drawFoes(dt) {
    const l = layers[2];
    for (let i = foes.length - 1; i >= 0; i--) {
      const f = foes[i];
      if (!f.dead) f.x += f.dir * f.v * dt;
      else f.dead += dt;
      const w = Math.max(70, Math.min(120, W * .075));
      const gy = ridgeAt(l, f.x), gy2 = ridgeAt(l, f.x + 16);
      const slope = Math.atan2(gy2 - gy, 16);
      f.sx = f.x; f.sy = gy - w * .17;
      f.r = w * .36;
      // le char repose sur la crête : le bas de la silhouette (y≈93/100) touche le sol
      const cy = gy - (93 - 50) / 100 * (w * 100 / 240);
      drawSil(f.id, f.x, cy, w, f.dir < 0, slope, f.dead ? Math.max(0, 1 - (f.dead - 3) / 2) * .9 + .1 : 1);
      if (!f.dead) {
        f.fire -= dt;
        if (f.fire <= 0) { // tir d'ambiance vers le ciel
          f.fire = rand(3, 6);
          const a = f.dir > 0 ? rand(-.9, -.4) : Math.PI - rand(-.9, -.4);
          tracers.push({ x: f.x + f.dir * w * .45, y: cy - w * .03, vx: Math.cos(a) * 1100, vy: Math.sin(a) * 1100, delay: 0, life: 1.1, t: 0 });
          flak.push({ x: f.x + f.dir * w * .45, y: cy - w * .03, t: 0, r: 7 });
        }
      } else {
        if (Math.random() < .5) puffs.push({ x: f.x + rand(-10, 10), y: cy - 6, r: rand(8, 14), t: 0, life: rand(2, 3.5), vx: rand(-4, 8), vy: rand(-22, -10) });
        if (f.dead < 3.5) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = .6 + Math.random() * .4;
          ctx.drawImage(glow, f.x - 18, cy - 24, 36, 36);
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        }
      }
      if (f.x < -200 || f.x > W + 200 || f.dead > 5) foes.splice(i, 1);
    }
  }

  /* ---------- Effets ---------- */
  function drawFlak(dt) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = flak.length - 1; i >= 0; i--) {
      const f = flak[i];
      f.t += dt;
      const k = f.t / .35;
      if (k >= 1) { flak.splice(i, 1); continue; }
      const r = f.r * (.4 + k * 1.6);
      ctx.globalAlpha = 1 - k;
      ctx.drawImage(glow, f.x - r * 2, f.y - r * 2, r * 4, r * 4);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  function drawPuffs(dt) {
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.t += dt;
      if (p.t > p.life) { puffs.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const k = p.t / p.life, r = p.r * (1 + k * 2.4);
      ctx.globalAlpha = (1 - k) * .9;
      ctx.drawImage(smoke, p.x - r, p.y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  }
  function drawTracers(dt) {
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let i = tracers.length - 1; i >= 0; i--) {
      const b = tracers[i];
      if (b.delay > 0) { b.delay -= dt; continue; }
      b.t += dt;
      if (b.t > b.life) { if (Math.random() < .3) burst(b.x, b.y); tracers.splice(i, 1); continue; }
      b.vy += 120 * dt;
      const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt, a = 1 - b.t / b.life;
      ctx.strokeStyle = `rgba(255,200,110,${a})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(b.x - b.vx * .018, b.y - b.vy * .018); ctx.lineTo(nx, ny); ctx.stroke();
      ctx.strokeStyle = `rgba(255,120,40,${a * .35})`; ctx.lineWidth = 6; ctx.stroke();
      b.x = nx; b.y = ny;
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  function drawShells(dt) {
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let i = shells.length - 1; i >= 0; i--) {
      const s = shells[i];
      s.t += dt;
      const k = Math.min(1, s.t / s.dur);
      const px = s.x, py = s.y;
      s.x = s.x0 + (s.tx - s.x0) * k; s.y = s.y0 + (s.ty - s.y0) * k;
      ctx.strokeStyle = 'rgba(255,236,190,.95)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(s.x, s.y); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,140,50,.35)'; ctx.lineWidth = 9; ctx.stroke();
      if (k >= 1) { detonate(s); shells.splice(i, 1); }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  function drawSparks(dt) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t += dt;
      if (s.t > s.life) { sparks.splice(i, 1); continue; }
      s.vy += 380 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      ctx.fillStyle = `rgba(255,${150 + Math.random() * 90 | 0},60,${1 - s.t / s.life})`;
      ctx.fillRect(s.x, s.y, 2.2, 2.2);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  function drawEmbers(dt, t) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < embers.length; i++) {
      const e = embers[i];
      e.y -= e.vy * dt; e.x += (e.vx + Math.sin(t * 2 + e.ph) * 14) * dt;
      if (e.y < H * .2) embers[i] = newEmber(false);
      ctx.globalAlpha = Math.max(0, Math.min(1, (e.y - H * .2) / (H * .3)) * (.5 + .5 * Math.sin(t * 8 + e.ph)));
      ctx.drawImage(glow, e.x - e.s * 3, e.y - e.s * 3, e.s * 6, e.s * 6);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  function drawFloaters(dt) {
    ctx.textAlign = 'center';
    ctx.font = '800 22px "Saira Condensed", "Arial Narrow", sans-serif';
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.t += dt;
      if (f.t > 1.3) { floaters.splice(i, 1); continue; }
      ctx.globalAlpha = 1 - f.t / 1.3;
      ctx.fillStyle = '#ffd08a';
      ctx.fillText(f.text, f.x, f.y - f.t * 40);
    }
    ctx.globalAlpha = 1; ctx.textAlign = 'start';
  }
  // réticule avec jauge de rechargement
  function drawReticle() {
    if (!mouse.in || mouse.x < 0) return;
    const r = 18, k = 1 - tank.cooldown / RELOAD;
    ctx.save();
    ctx.translate(mouse.x, mouse.y);
    ctx.strokeStyle = 'rgba(255,122,26,.25)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = k >= 1 ? 'rgba(126,214,126,.9)' : 'rgba(255,122,26,.95)';
    ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, k)); ctx.stroke();
    ctx.restore();
  }

  /* ---------- Char du joueur ---------- */
  function drawTank(dt) {
    const l = layers[3];
    const s = Math.max(.6, Math.min(W, 1400) / 950);
    const x = W * tank.x;
    const gy = ridgeAt(l, x), gy2 = ridgeAt(l, x + 40);
    const slope = Math.atan2(gy2 - gy, 40);

    // pivot du canon en coordonnées écran (tourelle : (38, -46) en local)
    const f = tank.facing;
    const local = (lx, ly) => ({ x: x + s * (f * lx * Math.cos(slope) - ly * Math.sin(slope)), y: gy + 2 + s * (f * lx * Math.sin(slope) + ly * Math.cos(slope)) });
    tank.pivot = local(38, -46);

    // visée : vers la souris (ou balayage automatique tant que personne n'a joué)
    let aimX = mouse.in ? mouse.x : tank.pivot.x + f * 300, aimY = mouse.in ? mouse.y : tank.pivot.y - 120;
    if (mouse.in) aimAt(aimX, aimY);
    const world = Math.atan2(aimY - tank.pivot.y, aimX - tank.pivot.x);
    let target = f > 0 ? world - slope : Math.PI - (world - slope);
    target = Math.atan2(Math.sin(target), Math.cos(target));
    target = Math.max(-1.35, Math.min(.18, target));
    tank.elev += (target - tank.elev) * Math.min(1, dt * 10);

    // tir automatique de démonstration tant que le visiteur n'a pas joué
    if (!game.played && !reduce) {
      tank.auto -= dt;
      if (tank.auto <= 0 && planes.length) {
        tank.auto = rand(3.5, 6);
        const p = pick(planes);
        fire(p.sx + p.vx * .25 + rand(-60, 60), p.sy + rand(-40, 40), true);
      }
    }
    tank.cooldown = Math.max(0, tank.cooldown - dt);
    tank.recoil = Math.max(0, tank.recoil - dt * 2.2);
    tank.flash = Math.max(0, tank.flash - dt * 6);

    ctx.save();
    ctx.translate(x, gy + 2);
    ctx.rotate(slope);
    ctx.scale(f * s, s);
    ctx.fillStyle = '#050404';
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-78, -22, 156, 22, 11) : ctx.rect(-78, -22, 156, 22); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-80, -18); ctx.lineTo(-66, -34); ctx.lineTo(62, -34); ctx.lineTo(84, -20); ctx.lineTo(76, -12); ctx.lineTo(-74, -12); ctx.closePath(); ctx.fill();
    ctx.save();
    ctx.translate(0, -34);
    ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(-32, -20); ctx.lineTo(22, -22); ctx.lineTo(44, -12); ctx.lineTo(44, 0); ctx.closePath(); ctx.fill();
    ctx.fillRect(-26, -28, 14, 7);
    ctx.strokeStyle = '#050404'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-30, -20); ctx.quadraticCurveTo(-36, -60, -44, -86); ctx.stroke();
    ctx.save();
    ctx.translate(38, -12);
    ctx.rotate(tank.elev);
    const rec = tank.recoil * 10;
    ctx.fillRect(-rec, -2.6, 104, 5.2);
    ctx.fillRect(38 - rec, -4, 22, 8);
    if (tank.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = tank.flash;
      ctx.drawImage(glow, 80, -60, 120, 120);
      ctx.drawImage(glow, 110, -24, 90, 48);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,140,60,.28)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-32, -20); ctx.lineTo(22, -22); ctx.lineTo(44, -12); ctx.stroke();
    ctx.restore();
    ctx.restore();

    tank.muzzle = local(38 + Math.cos(tank.elev) * 104, -46 + Math.sin(tank.elev) * 104);
  }
  function drawForegroundGlow() {
    const g = ctx.createLinearGradient(0, H * .75, 0, H);
    g.addColorStop(0, 'rgba(255,90,20,0)'); g.addColorStop(1, 'rgba(255,90,20,.08)');
    ctx.fillStyle = g; ctx.fillRect(0, H * .75, W, H * .25);
  }

  /* ---------- Boucle ---------- */
  let last = performance.now(), time = 0;
  const acc = { plane: 3, foe: 2, flak: 1, tracer: 1.5 };
  // en mouvement réduit, la scène reste figée tant que le visiteur ne joue pas
  const animating = () => !reduce || game.played || game.mode !== 'free';
  let looping = false;
  function update(dt) {
    const combat = game.mode === 'combat';
    acc.plane -= dt; acc.foe -= dt; acc.flak -= dt; acc.tracer -= dt;
    if (acc.plane <= 0 && planes.length < (combat ? 7 : 5)) { spawnPlane(); acc.plane = combat ? rand(1, 2.4) : rand(2, 4.5); }
    if (acc.foe <= 0 && foes.length < (combat ? 3 : 2)) { spawnFoe(); acc.foe = combat ? rand(2.5, 4.5) : rand(4, 8); }
    if (acc.flak <= 0) { const p = pick(planes); if (p) burst(p.sx + rand(-160, 160), p.sy + rand(-70, 70)); acc.flak = rand(.4, 1.3); }
    if (acc.tracer <= 0) { fireTracers(); acc.tracer = rand(.8, 2); }
    if (game.comboT > 0) { game.comboT -= dt; if (game.comboT <= 0) game.combo = 1; }
    if (combat) {
      game.timeLeft -= dt;
      game.speedMul = 1.15 + (1 - game.timeLeft / ROUND) * .5; // la cadence monte au fil de la manche
      if (game.timeLeft <= 0) { game.timeLeft = 0; endCombat(); }
    }
  }
  function frame(now) {
    looping = false;
    if (!running) return;
    const dt = Math.min(.05, (now - last) / 1000);
    last = now; time += dt;
    mx += (tmx - mx) * Math.min(1, dt * 2.5);
    my += (tmy - my) * Math.min(1, dt * 2.5);
    update(dt);

    ctx.save();
    if (shake > 0) { ctx.translate(rand(-shake, shake), rand(-shake, shake)); shake = Math.max(0, shake - dt * 30); }
    drawSky(time);
    drawClouds(dt);
    drawRidge(layers[0], 0);
    drawPuffs(dt);
    drawPlanes(dt, time);
    drawFlak(dt);
    drawRidge(layers[1], 1);
    drawTracers(dt);
    drawFoes(dt);
    drawRidge(layers[2], 2);
    drawRidge(layers[3], 3);
    drawTank(dt);
    drawShells(dt);
    drawSparks(dt);
    drawEmbers(dt, time);
    drawForegroundGlow();
    drawFloaters(dt);
    ctx.restore();
    drawReticle();
    syncHud();

    if (animating()) { looping = true; requestAnimationFrame(frame); }
  }
  const resume = () => { running = true; last = performance.now(); looping = true; requestAnimationFrame(frame); };

  // pause quand le héros n'est pas visible
  new IntersectionObserver(([en]) => {
    const vis = en.isIntersecting;
    if (vis && !running && !looping) resume();
    running = vis;
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) last = performance.now(); });
  looping = true;
  requestAnimationFrame(frame);

  /* ---------- Compas du HUD ---------- */
  const tape = document.querySelector('.compass-tape');
  if (tape) {
    const labels = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SO', 270: 'O', 315: 'NO' };
    let s = '';
    for (let r = 0; r < 3; r++) for (let d = 0; d < 360; d += 15) s += `<span class="${labels[d] ? 'major' : ''}">${labels[d] || d}</span>`;
    tape.innerHTML = s;
    const readHdg = document.querySelector('[data-hdg]');
    const readAlt = document.querySelector('[data-alt]');
    const readSpd = document.querySelector('[data-spd]');
    let hdg = 120;
    const upd = () => {
      hdg = (hdg + mx * .6 + .05 + 360) % 360;
      const px = -(hdg / 15) * 40 - 24 * 40 + (tape.parentElement.clientWidth / 2) - 20;
      tape.style.transform = `translateX(${px}px)`;
      if (readHdg) readHdg.textContent = String(Math.round(hdg)).padStart(3, '0') + '°';
      if (readAlt) readAlt.textContent = Math.round(3200 - my * 400 + Math.sin(time) * 12).toLocaleString('fr-FR') + ' m';
      if (readSpd) readSpd.textContent = Math.round(540 + Math.sin(time * .7) * 8) + ' km/h';
      if (!reduce) requestAnimationFrame(upd);
    };
    upd();
  }
})();
