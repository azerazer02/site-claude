/* ==========================================================================
   Accueil — théâtres, véhicule vedette, parallaxe
   ========================================================================== */
(() => {
  const { reduce } = window.LDF;

  /* ---------- Théâtres (accordéon) ---------- */
  const theatres = [...document.querySelectorAll('.theatre')];
  const activate = t => theatres.forEach(x => x.classList.toggle('active', x === t));
  theatres.forEach(t => {
    t.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') activate(t); });
    t.addEventListener('focusin', () => activate(t));
    t.addEventListener('click', () => activate(t));
  });

  /* ---------- Véhicule vedette ---------- */
  const picks = ['tiger1', 'spitfire9', 'leo2a6', 'me262', 'ah64a', 'strv103', 'fletcher', 'su27', 'is2', 'mirage2000']
    .map(id => WT.vehicles.find(v => v.id === id)).filter(Boolean);
  const $ = s => document.querySelector(s);
  const el = {
    sil: $('[data-sc-sil]'), ghost: $('[data-sc-ghost]'), meta: $('[data-sc-meta]'), name: $('[data-sc-name]'),
    desc: $('[data-sc-desc]'), specs: $('[data-sc-specs]'), count: $('[data-sc-count]'), link: $('[data-sc-link]'),
    progress: $('[data-sc-progress]'),
  };
  if (!el.sil) return;
  let idx = 0, timer = null;
  const LABELS = { feu: 'Puissance', prot: 'Protection', mob: 'Mobilité', vit: 'Vitesse' };

  const render = (first = false) => {
    const v = picks[idx];
    const apply = () => {
      el.sil.innerHTML = WT.silhouette(v.sil);
      el.ghost.textContent = v.name;
      el.meta.innerHTML = `${WT.flag(v.nation)}<span>${v.nationData.name} · ${v.typeLabel} · Rang ${v.rank}</span>`;
      el.name.textContent = v.name;
      el.desc.textContent = v.desc;
      el.specs.innerHTML = Object.entries(LABELS).map(([k, l]) =>
        `<li><span>${l}</span><span class="bar"><i style="--v:0"></i></span><b>${v.stats[k]}</b></li>`).join('') +
        `<li><span>Cote (BR)</span><span class="bar"><i style="--v:0"></i></span><b>${v.br.toFixed(1)}</b></li>`;
      el.count.innerHTML = `<b>${String(idx + 1).padStart(2, '0')}</b> / ${String(picks.length).padStart(2, '0')}`;
      el.link.href = `hangar.html?v=${v.id}`;
      el.sil.classList.remove('swap');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const vals = [...Object.keys(LABELS).map(k => v.stats[k] / 100), v.br / 14];
        el.specs.querySelectorAll('.bar i').forEach((b, i) => b.style.setProperty('--v', vals[i]));
      }));
    };
    if (first || reduce) apply();
    else { el.sil.classList.add('swap'); setTimeout(apply, 380); }
    // barre de progression de l'auto-défilement
    el.progress.classList.remove('run'); void el.progress.offsetWidth;
    if (!reduce) el.progress.classList.add('run');
    clearTimeout(timer);
    if (!reduce) timer = setTimeout(() => go(1), 6000);
  };
  const go = d => { idx = (idx + d + picks.length) % picks.length; render(); };
  $('[data-sc-prev]').addEventListener('click', () => go(-1));
  $('[data-sc-next]').addEventListener('click', () => go(1));
  render(true);

  /* ---------- Parallaxe horizontale de la citation ---------- */
  const para = [...document.querySelectorAll('[data-parallax]')];
  if (para.length && !reduce) {
    const band = para[0].parentElement;
    const upd = () => {
      const r = band.getBoundingClientRect();
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      para.forEach(n => { n.style.transform = `translateX(${p * +n.dataset.parallax * 100}%)`; });
    };
    addEventListener('scroll', upd, { passive: true });
    upd();
  }
})();
