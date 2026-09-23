/* ==========================================================================
   Nations — sélecteur, drapeau flottant (canvas), matrice des forces
   ========================================================================== */
(() => {
  const { nations, nationById, vehicles, flag, silhouette, esc } = WT;
  const $ = s => document.querySelector(s);
  const picker = $('[data-picker]');
  const panel = $('[data-panel]');
  const info = $('[data-info]');
  const code = $('[data-code]');
  const canvas = $('[data-flag]');
  const ctx = canvas.getContext('2d');
  const reduce = LDF.reduce;

  const DOMAINS = [['air', 'Aviation'], ['sol', 'Blindés'], ['mer', 'Marine'], ['heli', 'Hélicoptères']];
  const start = new URLSearchParams(location.search).get('n');
  let currentId = nationById[start] ? start : 'fr';

  /* ---------- Sélecteur ---------- */
  picker.innerHTML = nations.map(n => `
    <button class="nation-tile" role="tab" data-id="${n.id}" style="--nc:${n.color}" aria-selected="false" aria-controls="panel" data-cursor="${n.short}">
      ${flag(n.id)}<span>${n.short}</span>
    </button>`).join('');
  picker.addEventListener('click', e => {
    const b = e.target.closest('[data-id]');
    if (b) select(b.dataset.id);
  });
  picker.addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    const i = nations.findIndex(n => n.id === currentId);
    const n = nations[(i + (e.key === 'ArrowRight' ? 1 : -1) + nations.length) % nations.length];
    select(n.id);
    picker.querySelector(`[data-id="${n.id}"]`).focus();
  });

  /* ---------- Drapeau flottant ---------- */
  const images = {};
  const getImg = id => {
    if (images[id]) return images[id];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" width="600" height="400" preserveAspectRatio="none">${WT.flags[id]}</svg>`;
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return (images[id] = img);
  };
  nations.forEach(n => getImg(n.id));

  let flagImg = getImg(currentId), prevImg = null, swapT = 1;
  const W = canvas.width, H = canvas.height;
  const fx = 40, fy = 70, fw = W - 90, fh = fw * 2 / 3 * .92;
  let t = 0, last = performance.now();

  function drawFlag(img, alpha, drop) {
    if (!img.complete || !img.naturalWidth) return;
    const step = 4;
    ctx.globalAlpha = alpha;
    for (let x = 0; x < fw; x += step) {
      const p = x / fw;
      const amp = 4 + p * 26;
      const dy = Math.sin(p * 9 - t * 3.2) * amp * (reduce ? .3 : 1) + drop;
      const slope = Math.cos(p * 9 - t * 3.2);
      ctx.drawImage(img, p * img.naturalWidth, 0, img.naturalWidth * step / fw + .5, img.naturalHeight, fx + x, fy + dy, step + .6, fh);
      // ombrage des plis
      ctx.fillStyle = slope > 0 ? `rgba(255,255,255,${slope * .13 * p + .02})` : `rgba(0,0,0,${-slope * .32 * (p + .2)})`;
      ctx.fillRect(fx + x, fy + dy, step + .6, fh);
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    ctx.clearRect(0, 0, W, H);
    // mât
    const g = ctx.createLinearGradient(fx - 14, 0, fx - 2, 0);
    g.addColorStop(0, '#3a3a38'); g.addColorStop(.5, '#d8d4c8'); g.addColorStop(1, '#4a4a46');
    ctx.fillStyle = g;
    ctx.fillRect(fx - 14, fy - 40, 10, H - fy + 40);
    ctx.beginPath(); ctx.arc(fx - 9, fy - 44, 9, 0, Math.PI * 2); ctx.fill();
    swapT = Math.min(1, swapT + dt * 2.2);
    const e = 1 - Math.pow(1 - swapT, 3);
    if (prevImg && swapT < 1) drawFlag(prevImg, 1 - e, e * 40);
    drawFlag(flagImg, e, (1 - e) * -40);
    if (!reduce) requestAnimationFrame(frame);
  }
  // premier dessin dès que l'image est chargée
  flagImg.addEventListener('load', () => { if (reduce) frame(performance.now()); });
  requestAnimationFrame(frame);

  /* ---------- Panneau ---------- */
  function select(id, scroll = false) {
    const n = nationById[id];
    if (!n) return;
    if (id !== currentId) { prevImg = flagImg; flagImg = getImg(id); swapT = 0; if (reduce) requestAnimationFrame(frame); }
    currentId = id;
    picker.querySelectorAll('[data-id]').forEach(b => {
      const on = b.dataset.id === id;
      b.setAttribute('aria-selected', on);
      b.tabIndex = on ? 0 : -1;
    });
    panel.style.setProperty('--nc', n.color);
    code.textContent = n.short;
    const all = vehicles.filter(v => v.nation === id);
    const vs = all.slice().sort((a, b) => b.br - a.br).slice(0, 9);
    info.innerHTML = `
      <div class="anim-in">
        <div class="eyebrow" style="color:${n.color}">// Nation ${String(nations.indexOf(n) + 1).padStart(2, '0')} / ${nations.length}</div>
        <h2>${esc(n.name)}</h2>
        <div class="doctrine">${esc(n.doctrine)}</div>
        <p>${esc(n.text)}</p>
        <div class="theatre-tags">${n.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <div class="power-bars">
          ${DOMAINS.map(([k, l]) => `<div><span>${l}</span><span class="bar"><i style="--v:0" data-v="${n.power[k] / 100}"></i></span><b>${n.power[k]}</b></div>`).join('')}
        </div>
        ${vs.length ? `<div class="eyebrow" style="margin:6px 0 0">// Véhicules emblématiques</div>
        <div class="icon-vehicles">${vs.map(v => `<a href="hangar.html?v=${v.id}">${silhouette(v.sil)}<b>${esc(v.name)}</b><small>${v.typeLabel} · BR ${v.br.toFixed(1)}</small></a>`).join('')}</div>
        <a class="btn btn-sm btn-ghost" style="margin-top:14px" href="hangar.html?nation=${id}">Voir les ${all.length} véhicules dans le hangar</a>` : ''}
      </div>`;
    requestAnimationFrame(() => requestAnimationFrame(() =>
      info.querySelectorAll('[data-v]').forEach(b => b.style.setProperty('--v', b.dataset.v))));
    history.replaceState(null, '', `?n=${id}`);
    if (scroll) panel.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    document.querySelectorAll('.matrix tbody tr').forEach(r => r.style.background = r.dataset.id === id ? 'rgba(255,122,26,.06)' : '');
  }

  /* ---------- Matrice ---------- */
  const tbody = document.querySelector('[data-matrix] tbody');
  tbody.innerHTML = nations.map(n => {
    const vals = DOMAINS.map(([k]) => n.power[k]);
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const cell = v => `<td class="heat" style="--o:${Math.max(.04, (v - 35) / 65 * .55).toFixed(2)}"><span>${v}</span></td>`;
    return `<tr data-id="${n.id}" tabindex="0"><th>${flag(n.id)}${esc(n.name)}</th>${vals.map(cell).join('')}${cell(avg)}</tr>`;
  }).join('');
  tbody.addEventListener('click', e => { const r = e.target.closest('tr'); if (r) select(r.dataset.id, true); });
  tbody.addEventListener('keydown', e => { if (e.key === 'Enter') { const r = e.target.closest('tr'); if (r) select(r.dataset.id, true); } });

  select(currentId);
})();
