/* ==========================================================================
   Scène de bataille procédurale (canvas) — page d'accueil
   Ciel au crépuscule, reliefs en parallaxe, avions, DCA, traçantes, braises
   et un char au premier plan dont le canon suit la souris.
   ========================================================================== */
(() => {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;

  let W = 0, H = 0, DPR = 1;
  let mx = 0, my = 0, tmx = 0, tmy = 0; // souris normalisée [-1, 1]
  let shake = 0;
  let running = true;

  /* ---------- Sprite de fumée pré-rendu ---------- */
  const smoke = document.createElement('canvas');
  smoke.width = smoke.height = 128;
  (() => {
    const s = smoke.getContext('2d');
    const g = s.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(30,24,22,.55)');
    g.addColorStop(.5, 'rgba(24,19,18,.25)');
    g.addColorStop(1, 'rgba(20,16,15,0)');
    s.fillStyle = g; s.fillRect(0, 0, 128, 128);
  })();
  const glow = document.createElement('canvas');
  glow.width = glow.height = 64;
  (() => {
    const s = glow.getContext('2d');
    const g = s.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,240,200,1)');
    g.addColorStop(.25, 'rgba(255,170,60,.8)');
    g.addColorStop(1, 'rgba(255,90,20,0)');
    s.fillStyle = g; s.fillRect(0, 0, 64, 64);
  })();

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
  const ridgeY = (l, x) => { // x normalisé
    let y = 0;
    for (const w of l.waves) y += Math.sin(x * w.f + w.p) * w.a;
    return (l.base - y * l.amp * .6) * H;
  };

  /* ---------- Entités ---------- */
  const planes = [], flak = [], tracers = [], embers = [], puffs = [], sparks = [];
  const clouds = Array.from({ length: 14 }, () => ({ x: Math.random(), y: rand(.08, .5), s: rand(.5, 1.6), v: rand(.004, .012), a: rand(.25, .6) }));

  const spawnPlane = (initial = false) => {
    const dir = Math.random() < .5 ? 1 : -1;
    const depth = rand(.35, 1);
    planes.push({
      x: initial ? rand(.1, .9) * W : (dir > 0 ? -80 : W + 80),
      y: rand(.1, .42) * H,
      vx: dir * rand(70, 130) * depth,
      bob: rand(0, TAU),
      depth,
      jet: Math.random() < .35,
      trail: [],
      hit: 0,
    });
  };
  const burst = (x, y, big = false) => {
    flak.push({ x, y, t: 0, r: big ? rand(16, 24) : rand(7, 12) });
    for (let i = 0; i < (big ? 3 : 1); i++) puffs.push({ x: x + rand(-8, 8), y: y + rand(-6, 6), r: rand(10, 18) * (big ? 1.8 : 1), t: 0, life: rand(3, 5), vx: rand(-6, 6), vy: rand(-4, 2) });
  };

  const emitters = [.08, .48, .62, .9];
  const fireTracers = () => {
    const ex = emitters[Math.floor(Math.random() * emitters.length)] * W;
    const ey = ridgeY(layers[2], ex / W) + 4;
    const target = planes.length && Math.random() < .7 ? planes[Math.floor(Math.random() * planes.length)] : null;
    const ang = target ? Math.atan2(target.y - ey, target.x - ex + rand(-120, 120)) : rand(-2.2, -.9);
    const n = Math.floor(rand(5, 11));
    for (let i = 0; i < n; i++) {
      tracers.push({ x: ex, y: ey, vx: Math.cos(ang) * 900, vy: Math.sin(ang) * 900, delay: i * .07, life: rand(.9, 1.4), t: 0 });
    }
  };

  /* ---------- Char au premier plan ---------- */
  const tank = { x: .6, recoil: 0, flash: 0, nextShot: 2.5, elev: 0 };

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
    return { x: Math.random() * W, y: initial ? Math.random() * H : H + 10, vy: rand(20, 60), vx: rand(-10, 10), s: rand(.6, 2.2), ph: rand(0, TAU), life: 1 };
  }

  addEventListener('pointermove', e => {
    tmx = (e.clientX / innerWidth) * 2 - 1;
    tmy = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  /* ---------- Dessin ---------- */
  function drawSky(t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#07080b');
    g.addColorStop(.35, '#15121a');
    g.addColorStop(.55, '#3a1a14');
    g.addColorStop(.68, '#8a3512');
    g.addColorStop(.76, '#ff7a1a');
    g.addColorStop(1, '#2a1208');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // soleil voilé
    const sx = W * .68 - mx * 20, sy = H * .63 - my * 10;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, W * .55);
    sg.addColorStop(0, 'rgba(255,220,160,.95)');
    sg.addColorStop(.04, 'rgba(255,170,80,.7)');
    sg.addColorStop(.2, 'rgba(255,110,30,.25)');
    sg.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, W, H);

    // étoiles discrètes
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    for (let i = 0; i < 60; i++) {
      const x = (i * 97.3 % 1) * W, y = ((i * 53.7) % 1) * H * .3;
      const a = .2 + .3 * Math.sin(t * 1.5 + i);
      ctx.globalAlpha = Math.max(0, a);
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
    const off = -mx * 60 * l.depth;
    ctx.beginPath();
    ctx.moveTo(-10, H);
    for (let x = -10; x <= W + 10; x += 8) ctx.lineTo(x, ridgeY(l, (x - off) / W) - my * 14 * l.depth);
    ctx.lineTo(W + 10, H);
    ctx.closePath();
    ctx.fillStyle = l.col;
    ctx.fill();
    if (l.haze) {
      const g = ctx.createLinearGradient(0, l.base * H - l.amp * H, 0, H);
      g.addColorStop(0, l.haze); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fill();
    }
    // liseré lumineux sur la crête
    if (i < 2) {
      ctx.strokeStyle = `rgba(255,150,70,${.18 - i * .07})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = -10; x <= W + 10; x += 8) {
        const y = ridgeY(l, (x - off) / W) - my * 14 * l.depth;
        x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  // silhouette d'avion (profil) — centrée, orientée vers la droite
  function planePath(jet) {
    const p = new Path2D();
    if (jet) {
      p.moveTo(-30, 0); p.lineTo(-20, -2); p.lineTo(22, -3); p.quadraticCurveTo(32, -1, 36, 0); p.quadraticCurveTo(30, 2, 20, 3); p.lineTo(-20, 3); p.closePath();
      p.moveTo(-26, -1); p.lineTo(-32, -12); p.lineTo(-24, -12); p.lineTo(-14, -2); p.closePath();
      p.moveTo(-6, 1); p.lineTo(14, 1); p.lineTo(4, 7); p.lineTo(-6, 7); p.closePath();
    } else {
      p.moveTo(-26, 0); p.lineTo(-18, -2); p.lineTo(18, -3); p.quadraticCurveTo(28, -2, 30, 0); p.quadraticCurveTo(28, 2, 18, 3); p.lineTo(-18, 2); p.closePath();
      p.moveTo(-24, -1); p.lineTo(-28, -10); p.lineTo(-21, -10); p.lineTo(-14, -2); p.closePath();
      p.moveTo(-4, 1); p.lineTo(12, 1); p.lineTo(10, 5); p.lineTo(-2, 5); p.closePath();
      p.rect(30, -7, 1.4, 14);
    }
    return p;
  }
  const PLANE = planePath(false), JET = planePath(true);

  function drawPlanes(dt, t) {
    for (let i = planes.length - 1; i >= 0; i--) {
      const p = planes[i];
      p.x += p.vx * dt;
      const y = p.y + Math.sin(t * .8 + p.bob) * 8;
      const px = p.x - mx * 40 * p.depth, py = y - my * 16 * p.depth;
      p.trail.push({ x: px, y: py, a: 1 });
      if (p.trail.length > 70) p.trail.shift();

      // traînée
      ctx.lineCap = 'round';
      for (let k = 1; k < p.trail.length; k++) {
        const a = k / p.trail.length;
        ctx.strokeStyle = p.hit > 0 ? `rgba(40,30,28,${a * .6})` : `rgba(255,230,210,${a * .16 * p.depth})`;
        ctx.lineWidth = (p.hit > 0 ? 6 : 1.6) * p.depth * a;
        ctx.beginPath();
        ctx.moveTo(p.trail[k - 1].x - (p.vx > 0 ? 20 : -20) * p.depth, p.trail[k - 1].y);
        ctx.lineTo(p.trail[k].x - (p.vx > 0 ? 20 : -20) * p.depth, p.trail[k].y);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(px, py);
      const s = .7 + p.depth * .9;
      ctx.scale(p.vx > 0 ? s : -s, s);
      ctx.rotate(Math.sin(t * .8 + p.bob) * .04);
      ctx.fillStyle = `rgb(${12 + (1 - p.depth) * 70},${10 + (1 - p.depth) * 40},${10 + (1 - p.depth) * 30})`;
      ctx.fill(p.jet ? JET : PLANE);
      // liseré de lumière
      ctx.strokeStyle = 'rgba(255,160,80,.35)'; ctx.lineWidth = .6; ctx.stroke(p.jet ? JET : PLANE);
      ctx.restore();

      if (p.hit > 0) {
        p.hit += dt;
        p.vx *= .998; p.y += 30 * dt * p.hit;
        if (Math.random() < .5) puffs.push({ x: px, y: py, r: rand(6, 12), t: 0, life: rand(2, 3), vx: 0, vy: -4 });
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = .8;
        ctx.drawImage(glow, px - 12, py - 12, 24, 24);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }

      if (p.x < -200 || p.x > W + 200 || p.y > H * .8) planes.splice(i, 1);
    }
  }

  function drawFlak(dt) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = flak.length - 1; i >= 0; i--) {
      const f = flak[i];
      f.t += dt;
      const k = f.t / .35;
      if (k >= 1) { flak.splice(i, 1); continue; }
      const r = f.r * (0.4 + k * 1.6);
      ctx.globalAlpha = 1 - k;
      ctx.drawImage(glow, f.x - r * 2, f.y - r * 2, r * 4, r * 4);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawPuffs(dt) {
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.t += dt;
      if (p.t > p.life) { puffs.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const k = p.t / p.life;
      const r = p.r * (1 + k * 2.4);
      ctx.globalAlpha = (1 - k) * .9;
      ctx.drawImage(smoke, p.x - r, p.y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  }

  function drawTracers(dt) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = tracers.length - 1; i >= 0; i--) {
      const b = tracers[i];
      if (b.delay > 0) { b.delay -= dt; continue; }
      b.t += dt;
      if (b.t > b.life) {
        if (Math.random() < .3) burst(b.x, b.y);
        tracers.splice(i, 1); continue;
      }
      b.vy += 120 * dt;
      const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
      const a = 1 - b.t / b.life;
      ctx.strokeStyle = `rgba(255,200,110,${a})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(b.x - b.vx * .018, b.y - b.vy * .018); ctx.lineTo(nx, ny); ctx.stroke();
      ctx.strokeStyle = `rgba(255,120,40,${a * .35})`;
      ctx.lineWidth = 6;
      ctx.stroke();
      b.x = nx; b.y = ny;
      // collision avec un avion
      for (const p of planes) {
        if (!p.hit && Math.abs(p.x - b.x) < 26 && Math.abs(p.y - b.y) < 12 && Math.random() < .08) {
          p.hit = .01; burst(p.x, p.y, true); shake = Math.max(shake, 4);
        }
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawEmbers(dt, t) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < embers.length; i++) {
      const e = embers[i];
      e.y -= e.vy * dt; e.x += (e.vx + Math.sin(t * 2 + e.ph) * 14) * dt;
      if (e.y < H * .2) embers[i] = newEmber(false);
      const a = Math.min(1, (e.y - H * .2) / (H * .3)) * (.5 + .5 * Math.sin(t * 8 + e.ph));
      ctx.globalAlpha = Math.max(0, a);
      ctx.drawImage(glow, e.x - e.s * 3, e.y - e.s * 3, e.s * 6, e.s * 6);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawTank(dt, t) {
    const l = layers[3];
    const off = -mx * 60 * l.depth;
    const base = Math.min(W, 1400);
    const s = Math.max(.6, base / 950);
    const tx = W * tank.x;
    const gy = ridgeY(l, (tx - off) / W) - my * 14 * l.depth;
    const x = tx;
    // angle du terrain
    const gy2 = ridgeY(l, (tx + 40 - off) / W) - my * 14 * l.depth;
    const slope = Math.atan2(gy2 - gy, 40);

    // élévation du canon vers la souris
    const target = -(my + 1) * .16 - .04;
    tank.elev += (target - tank.elev) * Math.min(1, dt * 3);

    tank.nextShot -= dt;
    if (tank.nextShot <= 0 && !reduce) {
      tank.nextShot = rand(3.5, 6);
      tank.recoil = 1; tank.flash = 1; shake = 7;
    }
    tank.recoil = Math.max(0, tank.recoil - dt * 2.2);
    tank.flash = Math.max(0, tank.flash - dt * 6);

    ctx.save();
    ctx.translate(x, gy + 2);
    ctx.rotate(slope);
    ctx.scale(s, s);
    ctx.fillStyle = '#050404';
    // chenilles
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-78, -22, 156, 22, 11) : ctx.rect(-78, -22, 156, 22); ctx.fill();
    // caisse
    ctx.beginPath(); ctx.moveTo(-80, -18); ctx.lineTo(-66, -34); ctx.lineTo(62, -34); ctx.lineTo(84, -20); ctx.lineTo(76, -12); ctx.lineTo(-74, -12); ctx.closePath(); ctx.fill();
    // tourelle
    ctx.save();
    ctx.translate(0, -34);
    ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(-32, -20); ctx.lineTo(22, -22); ctx.lineTo(44, -12); ctx.lineTo(44, 0); ctx.closePath(); ctx.fill();
    ctx.fillRect(-26, -28, 14, 7);
    // antenne
    ctx.strokeStyle = '#050404'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-30, -20); ctx.quadraticCurveTo(-36, -60, -44, -86); ctx.stroke();
    // canon
    ctx.save();
    ctx.translate(38, -12);
    ctx.rotate(tank.elev);
    const rec = tank.recoil * 10;
    ctx.fillRect(-rec, -2.6, 104, 5.2);
    ctx.fillRect(38 - rec, -4, 22, 8);
    // flamme de bouche
    if (tank.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = tank.flash;
      ctx.drawImage(glow, 80, -60, 120, 120);
      ctx.drawImage(glow, 110, -24, 90, 48);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
    // liseré lumineux
    ctx.strokeStyle = 'rgba(255,140,60,.28)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-32, -20); ctx.lineTo(22, -22); ctx.lineTo(44, -12); ctx.stroke();
    ctx.restore();
    ctx.restore();

    // fumée de tir + obus (en coordonnées écran)
    if (tank.flash > .8) {
      const ang = slope + tank.elev;
      const lx = 38 + Math.cos(tank.elev) * 104, ly = -46 + Math.sin(tank.elev) * 104;
      const mxp = x + s * (lx * Math.cos(slope) - ly * Math.sin(slope));
      const myp = gy + 2 + s * (lx * Math.sin(slope) + ly * Math.cos(slope));
      for (let i = 0; i < 5; i++) puffs.push({ x: mxp + rand(-6, 10), y: myp + rand(-6, 6), r: rand(10, 20) * s, t: 0, life: rand(1.8, 3), vx: rand(10, 40), vy: rand(-18, -4) });
      tracers.push({ x: mxp, y: myp, vx: Math.cos(ang) * 1400, vy: Math.sin(ang) * 1400, delay: 0, life: 1.1, t: 0 });
      tank.flash = .8;
    }
  }

  function drawForegroundGlow() {
    const g = ctx.createLinearGradient(0, H * .75, 0, H);
    g.addColorStop(0, 'rgba(255,90,20,0)');
    g.addColorStop(1, 'rgba(255,90,20,.08)');
    ctx.fillStyle = g;
    ctx.fillRect(0, H * .75, W, H * .25);
  }

  /* ---------- Boucle ---------- */
  let last = performance.now(), acc = { plane: 3, flak: 1, tracer: 1.5 }, time = 0;
  function frame(now) {
    if (!running) return;
    const dt = Math.min(.05, (now - last) / 1000);
    last = now; time += dt;
    mx += (tmx - mx) * Math.min(1, dt * 2.5);
    my += (tmy - my) * Math.min(1, dt * 2.5);

    acc.plane -= dt; acc.flak -= dt; acc.tracer -= dt;
    if (acc.plane <= 0 && planes.length < 6) { spawnPlane(); acc.plane = rand(2, 5); }
    if (acc.flak <= 0) {
      const p = planes[Math.floor(Math.random() * planes.length)];
      if (p) burst(p.x + rand(-140, 140), p.y + rand(-60, 60));
      acc.flak = rand(.3, 1.2);
    }
    if (acc.tracer <= 0) { fireTracers(); acc.tracer = rand(.6, 1.8); }

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
    drawRidge(layers[2], 2);
    drawRidge(layers[3], 3);
    drawTank(dt, time);
    drawEmbers(dt, time);
    drawForegroundGlow();
    ctx.restore();

    if (!reduce) requestAnimationFrame(frame);
  }

  // pause quand le héros n'est pas visible
  new IntersectionObserver(([en]) => {
    const vis = en.isIntersecting;
    if (vis && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    running = vis;
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && running) { last = performance.now(); }
  });

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
