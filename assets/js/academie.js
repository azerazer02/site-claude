/* ==========================================================================
   Académie — simulateur de blindage incliné + quiz de promotion
   ========================================================================== */
(() => {
  const $ = s => document.querySelector(s);
  const reduce = LDF.reduce;

  /* ======================= SIMULATEUR ======================= */
  const cv = $('[data-sim]');
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const CX = 780, CY = 360, PLATE_LEN = 1800;
  const RICO = { ap: 70, apfsds: 78, heat: 80 };
  const AMMO_NAME = { ap: 'APHE', apfsds: 'APFSDS', heat: 'HEAT' };
  const inT = $('[data-s-t]'), inA = $('[data-s-a]'), inP = $('[data-s-p]');
  const out = { t: $('[data-o-t]'), a: $('[data-o-a]'), p: $('[data-o-p]'), eff: $('[data-o-eff]'), m: $('[data-o-m]'), v: $('[data-verdict]') };

  const st = { ammo: 'ap', t: 80, a: 55, p: 150 };
  const shot = { phase: 'idle', x: 0, y: CY, vx: 0, vy: 0, rot: 0, result: null, t: 0 };
  let parts = [];
  let flash = 0;

  const rad = d => d * Math.PI / 180;
  const eff = () => st.t / Math.cos(rad(st.a));
  const outcome = () => st.a >= RICO[st.ammo] ? 'rico' : st.p >= eff() ? 'pen' : 'nopen';
  const scale = () => Math.min(1.1, 520 / eff()); // px par mm

  function syncUI() {
    out.t.textContent = `${st.t} mm`;
    out.a.textContent = `${st.a}°`;
    out.p.textContent = `${st.p} mm`;
    const e = eff();
    out.eff.textContent = `${Math.round(e)} mm`;
    const m = Math.round(st.p - e);
    out.m.textContent = `${m >= 0 ? '+' : ''}${m} mm`;
    out.m.style.color = m >= 0 ? 'var(--good)' : 'var(--bad)';
    const o = outcome();
    const V = {
      pen: ['Pénétration', `L'obus traverse avec une marge de ${m} mm.`],
      nopen: ['Non pénétrant', `Il manque ${-m} mm : le blindage tient.`],
      rico: ['Ricochet', `À ${st.a}°, un obus ${AMMO_NAME[st.ammo]} risque fortement de ricocher (seuil ≈ ${RICO[st.ammo]}°).`],
    }[o];
    out.v.className = `verdict ${o}`;
    out.v.innerHTML = `${V[0]}<small>${V[1]}</small>`;
    [inT, inA, inP].forEach(i => i.style.setProperty('--p', ((i.value - i.min) / (i.max - i.min) * 100) + '%'));
  }
  const bind = (input, key) => input.addEventListener('input', () => { st[key] = +input.value; resetShot(); syncUI(); });
  bind(inT, 't'); bind(inA, 'a'); bind(inP, 'p');
  $('[data-ammo]').addEventListener('click', e => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    st.ammo = b.dataset.a;
    $('[data-ammo]').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    const defaults = { ap: 150, apfsds: 480, heat: 300 };
    st.p = defaults[st.ammo]; inP.value = st.p;
    resetShot(); syncUI();
  });

  // glisser sur le canvas pour incliner, clic simple pour tirer
  let drag = null;
  cv.addEventListener('pointerdown', e => { drag = { y: e.clientY, a: st.a, moved: false }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => {
    if (!drag) return;
    const dy = e.clientY - drag.y;
    if (Math.abs(dy) > 4) drag.moved = true;
    if (drag.moved) {
      st.a = Math.max(0, Math.min(85, Math.round(drag.a - dy * .35)));
      inA.value = st.a; resetShot(); syncUI();
    }
  });
  cv.addEventListener('pointerup', () => { if (drag && !drag.moved) fire(); drag = null; });
  $('[data-fire]').addEventListener('click', fire);

  function resetShot() { shot.phase = 'idle'; parts = []; }
  function fire() {
    shot.phase = 'fly';
    shot.x = 60; shot.y = CY; shot.vx = 1700; shot.vy = 0; shot.rot = 0; shot.t = 0;
    shot.result = outcome();
    parts = [];
    flash = 1;
    for (let i = 0; i < 16; i++) parts.push({ x: 70, y: CY, vx: Math.random() * 200 + 60, vy: (Math.random() - .5) * 160, life: .6, t: 0, c: 'smoke', r: 14 + Math.random() * 18 });
  }

  // géométrie de la plaque
  const geom = () => {
    const k = scale(), h = st.t * k, th = rad(st.a);
    const half = (h / 2) / Math.cos(th);
    return { k, h, th, entry: CX - half, exit: CX + half };
  };

  function burst(x, y, n, spread, dir, colors, speed = 500) {
    for (let i = 0; i < n; i++) {
      const a = dir + (Math.random() - .5) * spread;
      const v = speed * (.3 + Math.random());
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .5 + Math.random() * .7, t: 0, c: colors[Math.floor(Math.random() * colors.length)], r: 1 + Math.random() * 2.5 });
    }
  }

  function update(dt) {
    const g = geom();
    if (shot.phase === 'fly') {
      shot.t += dt;
      shot.x += shot.vx * dt; shot.y += shot.vy * dt;
      if (shot.x >= g.entry - 14 && shot.vx > 0 && shot.vy === 0) {
        if (shot.result === 'pen') {
          shot.phase = 'pass';
          burst(g.entry, CY, 26, 1.4, Math.PI, ['#ffd28a', '#ff9a3d', '#fff'], 420);
          flash = .8;
        } else if (shot.result === 'nopen') {
          shot.phase = 'stop';
          shot.x = g.entry - 14;
          burst(g.entry, CY, 40, 2.2, Math.PI, ['#ffd28a', '#ff9a3d', '#fff'], 520);
          flash = 1;
        } else {
          shot.phase = 'rico';
          // déviation le long de la surface de la plaque (vers le haut-droite)
          const surf = -Math.PI / 2 + g.th;
          const sp = 1300;
          shot.vx = Math.cos(surf) * sp; shot.vy = Math.sin(surf) * sp;
          shot.rot = surf;
          burst(g.entry, CY, 30, .8, surf, ['#ffe7a0', '#ffb347'], 700);
          flash = .7;
        }
      }
    } else if (shot.phase === 'pass') {
      shot.x += shot.vx * dt * .8;
      if (shot.x > g.exit && !shot.spalled) {
        shot.spalled = true;
        burst(g.exit, CY, 70, .9, 0, ['#ffd28a', '#ff7a1a', '#fff', '#ff5a2a'], 650);
      }
    } else if (shot.phase === 'rico') {
      shot.x += shot.vx * dt; shot.y += shot.vy * dt;
    }
    if (shot.phase !== 'pass') shot.spalled = false;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.t > p.life) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= .97; p.vy = p.vy * .97 + 300 * dt * (p.c === 'smoke' ? -.1 : 1);
    }
    flash = Math.max(0, flash - dt * 4);
  }

  function drawShell(x, y, rot) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = '#e8c890'; ctx.strokeStyle = '#6b5530'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (st.ammo === 'apfsds') {
      ctx.rect(-60, -3, 60, 6);
      ctx.moveTo(0, -3); ctx.lineTo(12, 0); ctx.lineTo(0, 3);
      ctx.moveTo(-60, -3); ctx.lineTo(-68, -10); ctx.lineTo(-50, -3);
      ctx.moveTo(-60, 3); ctx.lineTo(-68, 10); ctx.lineTo(-50, 3);
    } else if (st.ammo === 'heat') {
      ctx.moveTo(-34, -9); ctx.lineTo(-4, -9); ctx.lineTo(14, -2); ctx.lineTo(18, 0); ctx.lineTo(14, 2); ctx.lineTo(-4, 9); ctx.lineTo(-34, 9);
      ctx.closePath();
    } else {
      ctx.moveTo(-30, -9); ctx.lineTo(0, -9); ctx.quadraticCurveTo(16, -8, 20, 0); ctx.quadraticCurveTo(16, 8, 0, 9); ctx.lineTo(-30, 9); ctx.closePath();
    }
    ctx.fill(); ctx.stroke();
    if (st.ammo !== 'apfsds') { ctx.fillStyle = '#b07a3a'; ctx.fillRect(-26, -9, 6, 18); }
    ctx.restore();
  }

  function draw() {
    const g = geom();
    ctx.clearRect(0, 0, W, H);
    // fond quadrillé
    ctx.fillStyle = '#0b0e0c'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); ctx.stroke(); }

    // axe de tir
    ctx.setLineDash([6, 8]); ctx.strokeStyle = 'rgba(255,122,26,.25)';
    ctx.beginPath(); ctx.moveTo(0, CY); ctx.lineTo(W, CY); ctx.stroke(); ctx.setLineDash([]);

    // plaque
    ctx.save();
    ctx.translate(CX, CY); ctx.rotate(g.th);
    const grd = ctx.createLinearGradient(-g.h / 2, 0, g.h / 2, 0);
    grd.addColorStop(0, '#5d6660'); grd.addColorStop(.15, '#8b958d'); grd.addColorStop(.5, '#4a524d'); grd.addColorStop(1, '#2f3531');
    ctx.fillStyle = grd;
    ctx.fillRect(-g.h / 2, -PLATE_LEN / 2, g.h, PLATE_LEN);
    // hachures
    ctx.save();
    ctx.beginPath(); ctx.rect(-g.h / 2, -PLATE_LEN / 2, g.h, PLATE_LEN); ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,.18)';
    for (let y = -PLATE_LEN / 2; y < PLATE_LEN / 2; y += 14) { ctx.beginPath(); ctx.moveTo(-g.h / 2, y); ctx.lineTo(g.h / 2, y + g.h); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,190,120,.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-g.h / 2, -PLATE_LEN / 2); ctx.lineTo(-g.h / 2, PLATE_LEN / 2); ctx.stroke();
    // cote d'épaisseur nominale (perpendiculaire à la plaque)
    const ny = -150;
    ctx.strokeStyle = '#7fa6c9'; ctx.fillStyle = '#7fa6c9'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-g.h / 2, ny); ctx.lineTo(g.h / 2, ny); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-g.h / 2, ny - 8); ctx.lineTo(-g.h / 2, ny + 8); ctx.moveTo(g.h / 2, ny - 8); ctx.lineTo(g.h / 2, ny + 8); ctx.stroke();
    ctx.save(); ctx.translate(g.h / 2 + 10, ny); ctx.rotate(-g.th);
    ctx.font = '600 20px "JetBrains Mono", monospace'; ctx.textBaseline = 'middle';
    ctx.fillText(`t = ${st.t} mm`, 0, 0);
    ctx.restore();
    ctx.restore();

    // verticale de référence + arc d'angle
    ctx.strokeStyle = 'rgba(236,232,220,.35)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(g.entry, CY - 230); ctx.lineTo(g.entry, CY + 40); ctx.stroke(); ctx.setLineDash([]);
    if (st.a > 0) {
      ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(g.entry, CY, 150, -Math.PI / 2, -Math.PI / 2 + g.th); ctx.stroke();
      const la = -Math.PI / 2 + g.th / 2;
      ctx.fillStyle = '#ffb347'; ctx.font = '700 26px "Saira Condensed", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`θ = ${st.a}°`, g.entry + Math.cos(la) * 190, CY + Math.sin(la) * 190);
      ctx.textAlign = 'start';
    }

    // cote de l'épaisseur effective (le long de la trajectoire)
    if (shot.phase === 'idle' || shot.phase === 'fly') {
      const y = CY + 34;
      ctx.strokeStyle = '#ff7a1a'; ctx.fillStyle = '#ff7a1a'; ctx.lineWidth = 2;
      const x1 = Math.max(10, g.entry), x2 = Math.min(W - 10, g.exit);
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, y - 8); ctx.lineTo(x1, y + 8); ctx.moveTo(x2, y - 8); ctx.lineTo(x2, y + 8); ctx.stroke();
      ctx.font = '700 22px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = '#0b0e0c'; const lbl = `e = ${Math.round(eff())} mm`; const tw = ctx.measureText(lbl).width;
      ctx.fillRect((x1 + x2) / 2 - tw / 2 - 8, y + 14, tw + 16, 30);
      ctx.fillStyle = '#ff7a1a'; ctx.fillText(lbl, (x1 + x2) / 2, y + 36);
      ctx.textAlign = 'start';
    }

    // canon (gauche)
    ctx.fillStyle = '#2a302c';
    ctx.fillRect(0, CY - 12, 70, 24); ctx.fillRect(40, CY - 18, 18, 36);
    if (flash > 0 && shot.phase === 'fly' && shot.t < .2) {
      ctx.globalCompositeOperation = 'lighter';
      const fg = ctx.createRadialGradient(80, CY, 0, 80, CY, 80);
      fg.addColorStop(0, `rgba(255,230,160,${flash})`); fg.addColorStop(1, 'rgba(255,120,30,0)');
      ctx.fillStyle = fg; ctx.fillRect(0, CY - 80, 180, 160);
      ctx.globalCompositeOperation = 'source-over';
    }

    // obus
    if (shot.phase === 'idle') drawShell(110, CY, 0);
    else if (shot.phase === 'pass') {
      ctx.save(); ctx.beginPath(); ctx.rect(g.exit - 4, 0, W, H); ctx.clip(); drawShell(shot.x, shot.y, 0); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, g.entry, H); ctx.clip(); drawShell(shot.x, shot.y, 0); ctx.restore();
      // trou
      ctx.fillStyle = 'rgba(10,8,6,.9)'; ctx.fillRect(g.entry - 2, CY - 7, g.exit - g.entry + 4, 14);
    } else if (shot.phase !== 'idle' && shot.x < W + 100 && shot.y > -100) drawShell(shot.x, shot.y, shot.rot);
    if (shot.phase === 'stop') {
      ctx.fillStyle = 'rgba(20,14,10,.9)';
      ctx.beginPath(); ctx.arc(g.entry, CY, 10, 0, Math.PI * 2); ctx.fill();
    }

    // particules
    ctx.globalCompositeOperation = 'lighter';
    for (const p of parts) {
      const a = 1 - p.t / p.life;
      if (p.c === 'smoke') continue;
      ctx.fillStyle = p.c; ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    for (const p of parts) {
      if (p.c !== 'smoke') continue;
      ctx.globalAlpha = (1 - p.t / p.life) * .35;
      ctx.fillStyle = '#9a948a';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + p.t * 2), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // légende
    ctx.font = '500 18px "JetBrains Mono", monospace'; ctx.fillStyle = 'rgba(236,232,220,.5)';
    ctx.fillText(`MUNITION : ${AMMO_NAME[st.ammo]} · PÉN. ${st.p} mm`, 24, 40);
    ctx.fillText(`ÉCHELLE : ${(1 / scale()).toFixed(2)} mm/px`, 24, 66);
    if (shot.result && shot.phase !== 'idle' && shot.phase !== 'fly') {
      const txt = { pen: 'PÉNÉTRATION', nopen: 'NON PÉNÉTRANT', rico: 'RICOCHET' }[shot.result];
      const col = { pen: '#7ed67e', nopen: '#ff5d5d', rico: '#ffc94a' }[shot.result];
      ctx.font = '800 56px "Saira Condensed", sans-serif'; ctx.fillStyle = col; ctx.textAlign = 'right';
      ctx.fillText(txt, W - 30, H - 40); ctx.textAlign = 'start';
    }
  }

  let last = performance.now(), simVisible = true;
  new IntersectionObserver(([e]) => { simVisible = e.isIntersecting; }).observe(cv);
  const loop = now => {
    const dt = Math.min(.04, (now - last) / 1000); last = now;
    if (simVisible) { update(dt); draw(); }
    requestAnimationFrame(loop);
  };
  syncUI();
  requestAnimationFrame(loop);
  // les polices web peuvent arriver après le premier dessin
  if (document.fonts) document.fonts.ready.then(draw);

  /* ======================= QUIZ ======================= */
  const Q = [
    { q: 'Combien de nations jouables compte War Thunder ?', o: ['7', '8', '10', '12'], a: 2,
      e: "Dix nations : États-Unis, Allemagne, URSS, Royaume-Uni, Japon, Chine, Italie, France, Suède et Israël." },
    { q: 'Une plaque de 100 mm inclinée à 60° offre une épaisseur effective d’environ…', o: ['115 mm', '150 mm', '200 mm', '300 mm'], a: 2,
      e: 'cos(60°) = 0,5 : l’obus doit traverser 100 / 0,5 = 200 mm d’acier.' },
    { q: 'Dans quel mode la vue est-elle limitée au cockpit pour les avions ?', o: ['Arcade', 'Réaliste', 'Simulation', 'Aucun'], a: 2,
      e: 'En Simulation, les avions se pilotent uniquement depuis le cockpit, sans vue extérieure.' },
    { q: 'Quelle munition utilise un pénétrateur-flèche sous-calibré ?', o: ['APHE', 'HESH', 'APFSDS', 'HEAT'], a: 2,
      e: 'L’APFSDS (Armor-Piercing Fin-Stabilized Discarding Sabot) perce grâce à l’énergie cinétique d’une longue flèche.' },
    { q: 'Le Messerschmitt Me 262 est entré dans l’histoire comme…', o: ['Le premier chasseur à réaction opérationnel', 'Le premier hélicoptère armé', 'Le premier bombardier furtif', 'Le premier avion supersonique'], a: 0,
      e: 'Opérationnel en 1944, le Me 262 est le premier chasseur à réaction engagé au combat.' },
    { q: 'Que signifie l’abréviation « BR » ?', o: ['Blindage renforcé', 'Battle Rating (cote de bataille)', 'Base de réapparition', 'Bonus de rang'], a: 1,
      e: 'La Battle Rating détermine contre quels véhicules vous serez opposé.' },
    { q: 'Sur quel principe repose un obus HEAT ?', o: ['L’énergie cinétique', 'Un jet de métal issu d’une charge creuse', 'L’écaillage du blindage', 'L’incendie du moteur'], a: 1,
      e: 'La charge creuse forme un jet de métal à très haute vitesse : sa pénétration ne dépend pas de la distance de tir.' },
    { q: 'Quelle est la particularité du Strv 103 suédois ?', o: ['Il flotte', 'Il n’a pas de tourelle', 'Il a deux canons', 'Il est à roues'], a: 1,
      e: 'Le « S-Tank » vise en orientant et en inclinant toute sa caisse grâce à sa suspension.' },
    { q: 'En domination aérienne, comment capture-t-on un aérodrome ?', o: ['En le bombardant', 'En atterrissant sur la piste', 'En larguant des troupes', 'En le survolant à basse altitude'], a: 1,
      e: 'Il faut poser son appareil sur la piste et y rester le temps de la capture.' },
    { q: 'Pourquoi le moteur du Merkava est-il placé à l’avant ?', o: ['Pour aller plus vite', 'Pour protéger l’équipage', 'Pour réduire le bruit', 'Pour flotter'], a: 1,
      e: 'Le moteur sert de protection supplémentaire devant le compartiment de l’équipage.' },
  ];
  const GRADES = [
    [0, 'Recrue', 1, '#8f978d'], [4, 'Sergent', 2, '#c08a4a'], [7, 'Lieutenant', 3, '#c9ced6'], [9, 'Commandant', 4, '#ffcf5a'], [10, 'Maréchal', 5, '#ff7a1a'],
  ];
  const quiz = $('[data-quiz]');
  let qi = 0, score = 0, answered = false;
  const shuffled = () => Q.slice().sort(() => Math.random() - .5);
  let deck = shuffled();

  function renderQ() {
    const item = deck[qi];
    answered = false;
    quiz.innerHTML = `
      <div class="quiz-top"><span>Question ${String(qi + 1).padStart(2, '0')} / ${deck.length}</span><span>Score : <b style="color:var(--accent)">${score}</b></span></div>
      <div class="quiz-progress"><i style="width:${qi / deck.length * 100}%"></i></div>
      <div class="anim-in">
        <h3 class="quiz-q">${item.q}</h3>
        <div class="quiz-opts">${item.o.map((o, i) => `<button data-i="${i}" data-k="${i + 1}">${o}</button>`).join('')}</div>
        <div class="quiz-expl" aria-live="polite"></div>
        <div class="quiz-foot"></div>
      </div>`;
  }
  function answer(i) {
    if (answered) return;
    answered = true;
    const item = deck[qi];
    const btns = quiz.querySelectorAll('.quiz-opts button');
    btns.forEach(b => b.disabled = true);
    btns[item.a].classList.add('ok');
    if (i === item.a) score++; else btns[i].classList.add('ko');
    quiz.querySelector('.quiz-top b').textContent = score;
    quiz.querySelector('.quiz-expl').innerHTML = `<b style="color:${i === item.a ? 'var(--good)' : 'var(--bad)'}">${i === item.a ? 'Exact.' : 'Raté.'}</b> ${item.e}`;
    const last = qi === deck.length - 1;
    quiz.querySelector('.quiz-foot').innerHTML = `<button class="btn btn-sm btn-primary" data-next>${last ? 'Voir mon grade' : 'Question suivante'} ${LDF.ARROW}</button>`;
    quiz.querySelector('.quiz-progress i').style.width = `${(qi + 1) / deck.length * 100}%`;
    quiz.querySelector('[data-next]').focus({ preventScroll: true });
  }
  function medal(stars, col) {
    const pts = n => Array.from({ length: n }, (_, i) => {
      const x = 80 + (i - (n - 1) / 2) * 22;
      return `<path transform="translate(${x} 58) scale(.8)" d="M0 -10 L2.9 -3.1 L10 -3.1 L4.3 1.2 L6.2 8.1 L0 4 L-6.2 8.1 L-4.3 1.2 L-10 -3.1 L-2.9 -3.1 Z" fill="${col}"/>`;
    }).join('');
    return `<svg class="medal" viewBox="0 0 160 160" aria-hidden="true">
      <path d="M50 0 L70 50 L90 50 L110 0" fill="none" stroke="${col}" stroke-width="10" opacity=".5"/>
      <circle cx="80" cy="100" r="48" fill="#141916" stroke="${col}" stroke-width="3"/>
      <circle cx="80" cy="100" r="38" fill="none" stroke="${col}" stroke-width="1" stroke-dasharray="3 4"/>
      <path d="M80 72 L104 86 V114 L80 128 L56 114 V86 Z" fill="none" stroke="${col}" stroke-width="2"/>
      <path d="M66 104 L80 94 L94 104 M66 114 L80 104 L94 114" fill="none" stroke="${col}" stroke-width="3" stroke-linejoin="round"/>
      ${pts(stars)}
    </svg>`;
  }
  function result() {
    const g = GRADES.filter(x => score >= x[0]).pop();
    quiz.innerHTML = `
      <div class="quiz-result">
        ${medal(g[2], g[3])}
        <div class="eyebrow" style="justify-content:center">// Examen terminé</div>
        <h3 style="color:${g[3]}">${g[1]}</h3>
        <div class="score">SCORE ${score} / ${deck.length}</div>
        <p class="muted" style="max-width:46ch;margin:0 auto 26px">${score === deck.length ? 'Sans faute. Le front est entre de bonnes mains.' : score >= 7 ? 'Excellent travail, soldat. Encore un effort pour le grade suprême.' : score >= 4 ? 'Des bases solides. Relisez les conseils de terrain et retentez votre chance.' : 'Un passage par le simulateur de blindage s’impose. Rompez !'}</p>
        <button class="btn btn-primary" data-restart>Repasser l'examen</button>
      </div>`;
  }
  quiz.addEventListener('click', e => {
    const o = e.target.closest('.quiz-opts button');
    if (o) { answer(+o.dataset.i); return; }
    if (e.target.closest('[data-next]')) { qi++; qi < deck.length ? renderQ() : result(); return; }
    if (e.target.closest('[data-restart]')) { qi = 0; score = 0; deck = shuffled(); renderQ(); }
  });
  addEventListener('keydown', e => {
    const r = quiz.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    if (/^[1-4]$/.test(e.key) && !answered && quiz.querySelector('.quiz-opts')) answer(+e.key - 1);
  });
  renderQ();
})();
