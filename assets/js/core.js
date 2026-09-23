/* ==========================================================================
   LIGNE DE FRONT — noyau commun à toutes les pages
   En-tête, pied de page, transitions, curseur, révélations au défilement…
   ========================================================================== */
(() => {
  const html = document.documentElement;
  const body = document.body;
  const page = body.dataset.page || '';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  const NAV = [
    { href: 'index.html',       id: 'accueil',     label: 'Accueil' },
    { href: 'hangar.html',      id: 'hangar',      label: 'Hangar' },
    { href: 'nations.html',     id: 'nations',     label: 'Nations' },
    { href: 'modes.html',       id: 'modes',       label: 'Modes' },
    { href: 'chronologie.html', id: 'chronologie', label: 'Chronologie' },
    { href: 'academie.html',    id: 'academie',    label: 'Académie' },
  ];
  const pad = n => String(n).padStart(2, '0');

  /* silhouettes déclaratives : <div data-sil="tank"></div> */
  if (window.WT) document.querySelectorAll('[data-sil]').forEach(el => { el.innerHTML = WT.silhouette(el.dataset.sil); });
  const cur = id => (id === page ? ' aria-current="page"' : '');

  const LOGO = `<svg class="brand-mark" viewBox="0 0 40 40" fill="none" stroke="currentColor" aria-hidden="true">
      <g class="spin"><circle cx="20" cy="20" r="17" stroke-width="1.2" stroke-dasharray="3 5"/></g>
      <path d="M20 6 L32 13 V27 L20 34 L8 27 V13 Z" stroke-width="1.6"/>
      <path d="M13 22 L20 17 L27 22 M13 27 L20 22 L27 27" stroke-width="2.2" stroke-linejoin="round"/>
    </svg>`;
  const ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16M14 6l6 6-6 6"/></svg>`;

  /* ---------- En-tête ---------- */
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="wrap header-inner">
      <a class="brand" href="index.html" aria-label="Ligne de Front — accueil">
        ${LOGO}
        <span class="brand-text"><b>LIGNE DE FRONT</b><small>WAR THUNDER · FAN CODEX</small></span>
      </a>
      <nav class="main-nav" aria-label="Navigation principale">
        ${NAV.map((n, i) => `<a href="${n.href}"${cur(n.id)}><span>${pad(i + 1)}</span>${n.label}</a>`).join('')}
      </nav>
      <div class="header-clock" aria-hidden="true"><b>EN LIGNE</b><br><span data-clock>--:--:--</span> UTC</div>
      <button class="burger" aria-label="Ouvrir le menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
    <div class="scroll-progress"></div>`;
  body.prepend(header);

  const mobile = document.createElement('nav');
  mobile.className = 'mobile-menu';
  mobile.setAttribute('aria-label', 'Menu mobile');
  mobile.innerHTML = NAV.map((n, i) => `<a href="${n.href}"${cur(n.id)}><span>${pad(i + 1)}</span>${n.label}</a>`).join('');
  header.after(mobile);

  const burger = header.querySelector('.burger');
  burger.addEventListener('click', () => {
    const open = html.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && html.classList.contains('menu-open')) burger.click(); });

  /* ---------- Pied de page ---------- */
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="wrap">
      <div class="footer-giant" aria-hidden="true">Ligne de front</div>
      <div class="footer-grid">
        <div>
          <a class="brand" href="index.html" style="margin-bottom:18px">${LOGO}<span class="brand-text"><b>LIGNE DE FRONT</b><small>WAR THUNDER · FAN CODEX</small></span></a>
          <p>Un codex non officiel consacré à War Thunder : véhicules, nations, modes de jeu et conseils tactiques. Conçu avec passion, entièrement en HTML, CSS et JavaScript, sans aucune bibliothèque.</p>
          <p style="font-size:.8rem;color:var(--dim)">Site de fan sans affiliation. War Thunder est une marque de Gaijin Entertainment. Rangs et cotes de bataille (BR) issus des fichiers du jeu${window.WT && WT.GAME_VERSION ? ` (version ${WT.GAME_VERSION})` : ''} ; ils évoluent au fil des mises à jour.</p>
        </div>
        <div>
          <h4>// NAVIGATION</h4>
          <ul>${NAV.map(n => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}</ul>
        </div>
        <div>
          <h4>// THÉÂTRES</h4>
          <ul>
            <li><a href="hangar.html?type=air">Aviation</a></li>
            <li><a href="hangar.html?type=sol">Blindés</a></li>
            <li><a href="hangar.html?type=heli">Hélicoptères</a></li>
            <li><a href="hangar.html?type=mer">Marine</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} LIGNE DE FRONT — PROJET DE FAN</span>
        <a href="#top" class="to-top" data-no-transition>RETOUR EN HAUT ↑</a>
      </div>
    </div>`;
  body.append(footer);
  footer.querySelector('.to-top').addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- Horloge UTC ---------- */
  const clock = header.querySelector('[data-clock]');
  const tick = () => { const d = new Date(); clock.textContent = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`; };
  tick(); setInterval(tick, 1000);

  /* ---------- En-tête au défilement + barre de progression ---------- */
  const progress = header.querySelector('.scroll-progress');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('scrolled', y > 30);
    const hide = y > 400 && y > lastY && !html.classList.contains('menu-open');
    header.classList.toggle('hidden', hide);
    html.classList.toggle('header-hidden', hide);
    lastY = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Transitions de page ---------- */
  const exit = document.createElement('div');
  exit.className = 'page-exit';
  body.append(exit);
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || reduce) return;
    if (a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-no-transition')) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
    e.preventDefault();
    html.classList.add('leaving');
    setTimeout(() => { location.href = url.href; }, 460);
  });
  addEventListener('pageshow', e => { if (e.persisted) html.classList.remove('leaving', 'menu-open'); });

  /* ---------- Curseur viseur ---------- */
  if (finePointer && !reduce) {
    html.classList.add('has-cursor');
    const c = document.createElement('div');
    c.className = 'cursor hidden';
    c.innerHTML = `<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="22" cy="22" r="14" opacity=".6"/>
        <path d="M22 2v10M22 32v10M2 22h10M32 22h10"/>
      </svg><span class="cursor-label"></span>`;
    const dot = document.createElement('div');
    dot.className = 'cursor-dot hidden';
    body.append(c, dot);
    const label = c.querySelector('.cursor-label');
    let x = -100, y = -100, cx = x, cy = y;
    addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY;
      dot.style.transform = `translate(${x}px,${y}px)`;
      c.classList.remove('hidden'); dot.classList.remove('hidden');
    }, { passive: true });
    document.addEventListener('pointerleave', () => { c.classList.add('hidden'); dot.classList.add('hidden'); });
    const loop = () => {
      cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
      c.style.transform = `translate(${cx}px,${cy}px)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('a, button, [data-cursor], summary, .v-card');
      c.classList.toggle('hover', !!t);
      label.textContent = t && t.dataset.cursor ? t.dataset.cursor : '';
    });
  }

  /* ---------- Découpage de texte (lettres) ---------- */
  document.querySelectorAll('[data-split]').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(word => {
            if (!word) return;
            if (/^\s+$/.test(word)) { frag.append(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'word';
            [...word].forEach(ch => {
              const s = document.createElement('span');
              s.className = 'char'; s.textContent = ch; s.style.setProperty('--i', i++);
              w.append(s);
            });
            frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    walk(el);
    el.classList.add('split');
  });

  /* ---------- Révélations au défilement ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      en.target.dispatchEvent(new CustomEvent('reveal'));
      io.unobserve(en.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  const observe = root => root.querySelectorAll('[data-reveal], [data-split], [data-count], .ranks').forEach(el => {
    if (el.dataset.delay) el.style.setProperty('--delay', el.dataset.delay + 's');
    io.observe(el);
  });
  observe(document);

  /* ---------- Compteurs ---------- */
  const fmt = new Intl.NumberFormat('fr-FR');
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = +el.dataset.count;
    el.textContent = reduce ? fmt.format(target) : '0';
    el.addEventListener('reveal', () => {
      if (reduce) return;
      const t0 = performance.now(), dur = 1800;
      const step = t => {
        const p = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt.format(Math.round(target * e));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { once: true });
  });

  /* ---------- Inclinaison 3D + halo ---------- */
  const tilt = el => {
    if (!finePointer || reduce) return;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
      el.style.setProperty('--rx', `${(0.5 - py) * 7}deg`);
      el.style.setProperty('--ry', `${(px - 0.5) * 9}deg`);
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  };
  document.querySelectorAll('[data-tilt]').forEach(tilt);

  /* ---------- Boucle de chargement (accueil, 1re visite de la session) ---------- */
  const loader = document.querySelector('.loader');
  if (loader && html.classList.contains('boot')) {
    const lines = loader.querySelector('.loader-lines');
    const bar = loader.querySelector('.loader-bar i');
    const pct = loader.querySelector('.loader-pct');
    const steps = ['Liaison radio établie', 'Chargement du hangar', 'Armement des munitions', 'Calibrage des optiques', 'Déploiement sur le front'];
    let k = 0;
    const finish = () => {
      loader.classList.add('done');
      html.classList.remove('boot');
      try { sessionStorage.setItem('ldf-boot', '1'); } catch (e) { /* stockage indisponible */ }
    };
    const next = () => {
      if (k < steps.length) {
        const d = document.createElement('div');
        d.innerHTML = `${steps[k]} <span class="ok">[OK]</span>`;
        lines.append(d);
        k++;
        const p = Math.round(k / steps.length * 100);
        bar.style.width = p + '%';
        pct.textContent = p + '%';
        setTimeout(next, reduce ? 0 : 230 + Math.random() * 160);
      } else setTimeout(finish, reduce ? 0 : 280);
    };
    next();
  }

  /* API minimale pour les scripts de page */
  window.LDF = { observe, tilt, reduce, finePointer, ARROW };
})();
