/* ==========================================================================
   Hangar — filtres, fiches détaillées, comparateur
   ========================================================================== */
(() => {
  const { vehicles, nations, flag, silhouette, radar, esc, types } = WT;
  const $ = s => document.querySelector(s);
  const grid = $('[data-grid]');
  const typeSeg = $('[data-filter-type]');
  const nationSel = $('[data-filter-nation]');
  const sortSel = $('[data-sort]');
  const rankSel = $('[data-filter-rank]');
  const search = $('[data-search]');
  const countOut = $('[data-count-out]');
  const tray = $('[data-tray]');
  const slots = $('[data-slots]');
  const goBtn = $('[data-compare-go]');
  const modal = $('[data-modal]');
  const modalBody = $('[data-modal-body]');
  const panel = modal.querySelector('.modal-panel');

  const params = new URLSearchParams(location.search);
  const state = {
    type: types[params.get('type')] ? params.get('type') : 'all',
    nation: WT.nationById[params.get('nation')] ? params.get('nation') : 'all',
    rank: 0,
    sort: 'br-desc',
    q: '',
    compare: [],
  };
  let list = [];
  let current = -1;
  let lastFocus = null;

  /* ---------- Contrôles ---------- */
  const TYPES = [['all', 'Tous'], ...Object.entries(types)];
  const renderTypeSeg = () => {
    typeSeg.innerHTML = TYPES.map(([k, l]) => {
      const n = vehicles.filter(v => (k === 'all' || v.type === k) && (state.nation === 'all' || v.nation === state.nation) && (!state.rank || v.rankNum === state.rank)).length;
      return `<button type="button" data-type="${k}" aria-pressed="${state.type === k}">${l} <small>${n}</small></button>`;
    }).join('');
  };
  typeSeg.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    state.type = b.dataset.type;
    renderTypeSeg(); render(); syncURL();
  });
  nationSel.innerHTML = `<option value="all">Toutes les nations</option>` +
    nations.map(n => `<option value="${n.id}">${n.name}</option>`).join('');
  nationSel.value = state.nation;
  nationSel.addEventListener('change', () => { state.nation = nationSel.value; renderTypeSeg(); render(); syncURL(); });
  const ranks = [...new Set(vehicles.map(v => v.rankNum))].sort((a, b) => a - b);
  rankSel.innerHTML = `<option value="0">Tous les rangs</option>` + ranks.map(n => `<option value="${n}">Rang ${WT.ROMAN[n]}</option>`).join('');
  rankSel.addEventListener('change', () => { state.rank = +rankSel.value; renderTypeSeg(); render(); });
  sortSel.addEventListener('change', () => { state.sort = sortSel.value; render(); });
  let qT;
  search.addEventListener('input', () => { clearTimeout(qT); qT = setTimeout(() => { state.q = search.value.trim().toLowerCase(); render(); }, 120); });

  const syncURL = () => {
    const p = new URLSearchParams();
    if (state.type !== 'all') p.set('type', state.type);
    if (state.nation !== 'all') p.set('nation', state.nation);
    history.replaceState(null, '', p.toString() ? `?${p}` : location.pathname);
  };

  /* ---------- Grille ---------- */
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filtered = () => {
    const q = norm(state.q);
    const out = vehicles.filter(v =>
      (state.type === 'all' || v.type === state.type) &&
      (state.nation === 'all' || v.nation === state.nation) &&
      (!state.rank || v.rankNum === state.rank) &&
      (!q || norm(`${v.name} ${v.role} ${v.nationData.name} ${v.typeLabel}`).includes(q)));
    const s = state.sort;
    out.sort((a, b) =>
      s === 'br-asc' ? a.br - b.br :
      s === 'year-asc' ? a.year - b.year :
      s === 'year-desc' ? b.year - a.year :
      s === 'name' ? a.name.localeCompare(b.name, 'fr') :
      b.br - a.br || a.name.localeCompare(b.name, 'fr'));
    return out;
  };

  const card = (v, i) => `
    <article class="v-card${state.compare.includes(v.id) ? ' selected' : ''}" data-id="${v.id}" style="--i:${Math.min(i, 16)}" tabindex="0" aria-label="${esc(v.name)}" data-cursor="INSPECTER">
      <div class="v-top">${flag(v.nation)}<span>${v.nationData.short} · ${v.typeLabel}</span><span class="rank">${v.rank}</span></div>
      <div class="v-br">${v.br.toFixed(1)}<small>BR RB</small></div>${v.premium ? '<span class="v-prem">Premium</span>' : ''}
      <div class="v-sil-wrap">${silhouette(v.sil, 'v-sil')}</div>
      <div class="v-name">${esc(v.name)}</div>
      <div class="v-role">${esc(v.role)} · ${v.year}</div>
      <div class="v-bars">
        <div>Feu<span class="bar"><i style="--v:${v.stats.feu / 100}"></i></span></div>
        <div>Protection<span class="bar"><i style="--v:${v.stats.prot / 100}"></i></span></div>
        <div>Mobilité<span class="bar"><i style="--v:${v.stats.mob / 100}"></i></span></div>
      </div>
      <div class="v-actions">
        <button type="button" data-act="detail">Détails</button>
        <button type="button" data-act="compare" aria-pressed="${state.compare.includes(v.id)}">${state.compare.includes(v.id) ? 'Sélectionné' : 'Comparer'}</button>
      </div>
    </article>`;

  function render() {
    list = filtered();
    countOut.textContent = list.length;
    grid.innerHTML = list.length
      ? list.map(card).join('')
      : `<div class="empty">AUCUN VÉHICULE NE CORRESPOND À CES CRITÈRES.<br><br><button class="btn btn-sm btn-ghost" data-reset>Réinitialiser les filtres</button></div>`;
    grid.querySelectorAll('.v-card').forEach(LDF.tilt);
    const r = grid.querySelector('[data-reset]');
    if (r) r.addEventListener('click', () => {
      state.type = 'all'; state.nation = 'all'; state.rank = 0; state.q = ''; search.value = ''; nationSel.value = 'all'; rankSel.value = '0';
      renderTypeSeg(); render(); syncURL();
    });
  }

  grid.addEventListener('click', e => {
    const c = e.target.closest('.v-card');
    if (!c) return;
    const act = e.target.closest('[data-act]');
    if (act && act.dataset.act === 'compare') { toggleCompare(c.dataset.id); return; }
    openDetail(c.dataset.id);
  });
  grid.addEventListener('keydown', e => {
    const c = e.target.closest('.v-card');
    if (c && e.target === c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDetail(c.dataset.id); }
  });

  /* ---------- Comparateur ---------- */
  function toggleCompare(id) {
    const i = state.compare.indexOf(id);
    if (i >= 0) state.compare.splice(i, 1);
    else { state.compare.push(id); if (state.compare.length > 2) state.compare.shift(); }
    updateTray();
    grid.querySelectorAll('.v-card').forEach(c => {
      const on = state.compare.includes(c.dataset.id);
      c.classList.toggle('selected', on);
      const b = c.querySelector('[data-act="compare"]');
      b.setAttribute('aria-pressed', on);
      b.textContent = on ? 'Sélectionné' : 'Comparer';
    });
  }
  function updateTray() {
    const vs = state.compare.map(id => vehicles.find(v => v.id === id));
    slots.innerHTML = [0, 1].map(i => vs[i]
      ? `<span class="slot filled">${esc(vs[i].name)}</span>`
      : `<span class="slot">Emplacement ${i + 1}</span>`).join('');
    tray.classList.toggle('show', vs.length > 0);
    goBtn.disabled = vs.length < 2;
  }
  $('[data-compare-clear]').addEventListener('click', () => { state.compare = []; updateTray(); render(); });
  goBtn.addEventListener('click', openCompare);

  /* ---------- Modale ---------- */
  const COLORS = ['#ff7a1a', '#7fa6c9'];
  function openModal(html) {
    modalBody.innerHTML = html;
    if (!modal.classList.contains('open')) lastFocus = document.activeElement;
    modal.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
    panel.scrollTop = 0;
    panel.focus({ preventScroll: true });
  }
  function closeModal() {
    modal.classList.remove('open');
    document.documentElement.style.overflow = '';
    current = -1;
    const p = new URLSearchParams(location.search); p.delete('v');
    history.replaceState(null, '', p.toString() ? `?${p}` : location.pathname);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });
  addEventListener('keydown', e => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (current >= 0 && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      const n = list.length;
      openDetail(list[(current + (e.key === 'ArrowRight' ? 1 : -1) + n) % n].id);
    }
    if (e.key === 'Tab') { // piège de focus
      const f = [...panel.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')];
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  function openDetail(id) {
    const v = vehicles.find(x => x.id === id);
    if (!v) return;
    current = list.findIndex(x => x.id === id);
    const inList = current >= 0;
    const p = new URLSearchParams(location.search); p.set('v', id);
    history.replaceState(null, '', `?${p}`);
    openModal(`
      <div class="detail">
        <div class="detail-stage">
          <div class="tl">ID&nbsp;<b>${v.id.toUpperCase()}</b><br>RANG&nbsp;<b>${v.rank}</b> · BR RB&nbsp;<b>${v.br.toFixed(1)}</b><br>SERVICE&nbsp;<b>${v.year}</b></div>
          <div class="scan"></div>
          ${silhouette(v.sil, 'detail-sil')}
          <div class="bign" aria-hidden="true">${esc(v.name)}</div>
        </div>
        <div class="detail-info">
          <div class="v-top">${flag(v.nation)}<span>${v.nationData.name} · ${v.typeLabel}</span></div>
          <h2>${esc(v.name)}</h2>
          <div class="role">${esc(v.role)}</div>
          <p>${esc(v.desc)}</p>
          <dl class="specs">
            <div><dt>Vitesse max.</dt><dd>${esc(v.speed)}</dd></div>
            <div><dt>Mise en service</dt><dd>${v.year}</dd></div>
            <div class="wide"><dt>Cote de bataille · rang ${v.rank}${v.premium ? ' · premium' : ''}</dt><dd class="br3"><span><small>Arcade</small>${v.brs.ab.toFixed(1)}</span><span><small>Réaliste</small>${v.brs.rb.toFixed(1)}</span><span><small>Simulation</small>${v.brs.sb.toFixed(1)}</span></dd></div>
            <div class="wide"><dt>Armement</dt><dd>${esc(v.arm)}</dd></div>
            <div class="wide"><dt>Protection</dt><dd>${esc(v.prot)}</dd></div>
          </dl>
          <div class="detail-radar">${radar([{ stats: v.stats, color: COLORS[0] }])}</div>
          <div class="detail-foot">
            <button class="btn btn-sm btn-ghost" data-cmp-add="${v.id}">${state.compare.includes(v.id) ? 'Retirer du comparateur' : 'Ajouter au comparateur'}</button>
            ${inList ? `<span class="kbd-hint"><kbd>←</kbd> <kbd>→</kbd> naviguer · <kbd>Échap</kbd> fermer</span>` : ''}
          </div>
        </div>
      </div>`);
    modalBody.querySelector('[data-cmp-add]').addEventListener('click', e => {
      toggleCompare(v.id);
      e.currentTarget.textContent = state.compare.includes(v.id) ? 'Retirer du comparateur' : 'Ajouter au comparateur';
    });
  }

  function openCompare() {
    const [a, b] = state.compare.map(id => vehicles.find(v => v.id === id));
    if (!a || !b) return;
    current = -1;
    const row = (label, x, y) => `<tr><td class="${x > y ? 'win' : ''}">${x}</td><th>${label}</th><td class="${y > x ? 'win' : ''}">${y}</td></tr>`;
    openModal(`
      <div class="cmp">
        <div class="eyebrow">// Rapport comparatif</div>
        <div class="cmp-head">
          <div class="side" style="color:${COLORS[0]}">${silhouette(a.sil)}<h3 style="color:var(--text)">${esc(a.name)}</h3><div class="v-top" style="justify-content:center">${flag(a.nation)}<span>${a.nationData.short} · BR ${a.br.toFixed(1)}</span></div></div>
          <div class="vs">VS</div>
          <div class="side" style="color:${COLORS[1]}">${silhouette(b.sil)}<h3 style="color:var(--text)">${esc(b.name)}</h3><div class="v-top" style="justify-content:center">${flag(b.nation)}<span>${b.nationData.short} · BR ${b.br.toFixed(1)}</span></div></div>
        </div>
        <div class="cmp-body">
          <div>
            ${radar([{ stats: a.stats, color: COLORS[0] }, { stats: b.stats, color: COLORS[1] }], { size: 320 })}
            <div class="legend"><span><i style="background:${COLORS[0]}"></i>${esc(a.name)}</span><span><i style="background:${COLORS[1]}"></i>${esc(b.name)}</span></div>
          </div>
          <table class="cmp-table">
            <thead><tr><th>${esc(a.name)}</th><th></th><th>${esc(b.name)}</th></tr></thead>
            <tbody>
              ${WT.AXES.map(([k, l]) => row(l, a.stats[k], b.stats[k])).join('')}
              <tr><td>${a.brs.ab.toFixed(1)}</td><th>BR Arcade</th><td>${b.brs.ab.toFixed(1)}</td></tr>
              <tr><td>${a.br.toFixed(1)}</td><th>BR Réaliste</th><td>${b.br.toFixed(1)}</td></tr>
              <tr><td>${a.brs.sb.toFixed(1)}</td><th>BR Simulation</th><td>${b.brs.sb.toFixed(1)}</td></tr>
              <tr><td>${a.rank}</td><th>Rang</th><td>${b.rank}</td></tr>
              <tr><td>${a.year}</td><th>Service</th><td>${b.year}</td></tr>
              <tr><td>${esc(a.speed)}</td><th>Vitesse</th><td>${esc(b.speed)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>`);
  }

  const src = document.querySelector('[data-br-source]');
  if (src) src.textContent = `BR en mode Réaliste (RB), issus des fichiers du jeu, version ${WT.GAME_VERSION}. Les BR Arcade et Simulation figurent dans chaque fiche.`;

  /* ---------- Démarrage ---------- */
  renderTypeSeg();
  render();
  updateTray();
  const deep = params.get('v');
  if (deep) setTimeout(() => openDetail(deep), 500);
})();
