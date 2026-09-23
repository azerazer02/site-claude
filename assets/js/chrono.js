/* ==========================================================================
   Chronologie — frise pilotée par le défilement
   ========================================================================== */
(() => {
  const { vehicles, silhouette, esc } = WT;
  const reduce = LDF.reduce;

  const ERAS = [
    { from: 1930, to: 1938, title: "L'entre-deux-guerres", tag: 'Toile, rivets et biplans', sils: ['fighter', 'tank'],
      text: "Les armées se modernisent : les biplans cèdent la place aux monoplans à train rentrant, et les premiers chars à tourelle rotative définissent la doctrine blindée des décennies suivantes.",
      events: [[1935, 'Premier vol du Messerschmitt Bf 109'], [1936, 'Premier vol du Supermarine Spitfire'], [1936, 'La guerre d\'Espagne sert de laboratoire aux blindés et à l\'aviation']] },
    { from: 1939, to: 1942, title: 'Blitzkrieg', tag: 'La vitesse comme arme', sils: ['fighter', 'attacker', 'tank'],
      text: "Coordination chars-aviation, radio dans chaque véhicule : la guerre éclair bouleverse l'Europe. En réponse, l'URSS aligne le T-34 et le IL-2, et le Tiger fait son apparition.",
      events: [[1940, 'Début de la production du T-34'], [1940, 'Bataille d\'Angleterre : Spitfire et Hurricane contre la Luftwaffe'], [1942, 'Premier engagement du Tiger I près de Leningrad']] },
    { from: 1943, to: 1945, title: 'La guerre totale', tag: 'Acier, calibres et réacteurs', sils: ['heavy', 'td', 'jet'],
      text: "Course aux calibres et aux blindages : Panther, IS-2, Jagdpanther. Dans le ciel, les escortes de Mustang accompagnent les B-17 et les premiers jets entrent au combat.",
      events: [[1943, 'Bataille de Koursk, plus grand affrontement de blindés de l\'histoire'], [1944, 'Le Me 262 devient le premier chasseur à réaction opérationnel'], [1944, 'Entrée en service de l\'IS-2 et du T-34-85']] },
    { from: 1946, to: 1959, title: "L'âge du jet", tag: 'Ailes en flèche et mur du son', sils: ['jet', 'tank'],
      text: "Les ailes en flèche s'imposent et le mur du son tombe. Au-dessus de la Corée, Sabre et MiG-15 s'affrontent dans les premiers grands duels de jets. Au sol, le Centurion redéfinit le char moyen.",
      events: [[1947, 'Premiers vols du F-86 Sabre et du MiG-15'], [1950, 'Guerre de Corée : premiers combats entre chasseurs à réaction'], [1953, 'Le F-86F rejoint les escadrons en Corée']] },
    { from: 1960, to: 1979, title: 'La guerre froide', tag: 'Missiles et stabilisateurs', sils: ['jet', 'stank', 'heli'],
      text: "Missiles air-air, stabilisateurs de canon, blindages composites naissants et hélicoptères d'assaut : la technologie transforme le combat. La Suède ose le Strv 103 sans tourelle.",
      events: [[1967, 'Mise en service du F-4E Phantom II et du Strv 103'], [1972, 'Le Mi-24 « Hind » entre en service'], [1973, 'Premières unités équipées du T-72']] },
    { from: 1980, to: 1999, title: 'Blindage composite', tag: 'Turbines et commandes électriques', sils: ['mbt', 'jet', 'heli'],
      text: "Abrams, Leopard 2, Leclerc, Challenger : les chars de combat principaux atteignent des niveaux de protection inédits. Su-27 et Mirage 2000 introduisent une maniabilité hors norme.",
      events: [[1980, 'Le M1 Abrams entre en service'], [1985, 'Le Su-27 « Flanker » rejoint les régiments soviétiques'], [1992, 'Premières livraisons du Leclerc']] },
    { from: 2000, to: 2026, title: "L'ère numérique", tag: 'Réseaux, capteurs et précision', sils: ['mbt', 'jet'],
      text: "Caméras thermiques de 3ᵉ génération, systèmes de gestion du champ de bataille et munitions à haute pénétration : l'information devient une arme à part entière.",
      events: [[2001, 'Leopard 2A6 et son canon de 120 mm L/55'], [2004, 'Mise en service du Merkava Mk.4'], [2012, 'Le Type 10 japonais entre en service']] },
  ];

  const erasEl = document.querySelector('[data-eras]');
  erasEl.innerHTML = ERAS.map((e, i) => {
    const vs = vehicles.filter(v => v.year >= e.from && v.year <= e.to).sort((a, b) => a.year - b.year).slice(0, 14);
    return `
      <article class="era" data-from="${e.from}">
        <span class="era-dot" aria-hidden="true"></span>
        <div class="era-card hud" data-reveal="${i % 2 ? 'right' : 'left'}">
          <div class="years">${e.from} — ${e.to === 2026 ? "AUJOURD'HUI" : e.to}</div>
          <h3>${esc(e.title)}</h3>
          <div class="sil-strip">${e.sils.map(s => silhouette(s)).join('')}</div>
          <p>${esc(e.text)}</p>
          <ul class="era-events">${e.events.map(([y, t]) => `<li><b>${y}</b><span>${esc(t)}</span></li>`).join('')}</ul>
        </div>
        <div class="era-side" data-reveal="${i % 2 ? 'left' : 'right'}">
          <div class="big-y">${String(e.from).slice(0, 2)}<em>${String(e.from).slice(2)}</em></div>
          <div class="tagline">${esc(e.tag)}</div>
          ${vs.length ? `<div class="veh-links">${vs.map(v => `<a class="tag" href="hangar.html?v=${v.id}">${esc(v.name)} · ${v.year}</a>`).join('')}</div>` : ''}
        </div>
      </article>`;
  }).join('');
  LDF.observe(erasEl);

  /* ---------- Année géante + ligne de progression ---------- */
  const chrono = document.querySelector('[data-chrono]');
  const yearEl = document.querySelector('[data-year]');
  const line = document.querySelector('[data-line]');
  const eraEls = [...erasEl.querySelectorAll('.era')];
  let shown = 1930, target = 1930;

  const onScroll = () => {
    const r = chrono.getBoundingClientRect();
    const mid = innerHeight * .55;
    const p = Math.max(0, Math.min(1, (mid - r.top) / r.height));
    line.style.height = (p * 100) + '%';
    let active = null;
    eraEls.forEach(el => {
      const er = el.getBoundingClientRect();
      if (er.top < mid) active = el;
    });
    eraEls.forEach(el => el.classList.toggle('active', el === active));
    if (active) {
      // interpolation fine de l'année à l'intérieur de l'époque
      const i = eraEls.indexOf(active);
      const e = ERAS[i];
      const er = active.getBoundingClientRect();
      const k = Math.max(0, Math.min(1, (mid - er.top) / er.height));
      target = Math.round(e.from + (e.to - e.from) * k);
    } else target = 1930;
    if (reduce) { shown = target; yearEl.textContent = target; }
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  if (!reduce) {
    const tick = () => {
      if (shown !== target) {
        shown += Math.sign(target - shown) * Math.max(1, Math.round(Math.abs(target - shown) * .15));
        yearEl.textContent = shown;
      }
      requestAnimationFrame(tick);
    };
    tick();
  }
})();
