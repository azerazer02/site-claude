/* ==========================================================================
   LIGNE DE FRONT — silhouettes de profil (SVG, viewBox 240×100, vers la droite)
   Chaque véhicule possède son propre dessin : train de roulement, forme de
   caisse et de tourelle, canon (frein de bouche, évacuateur, manchon), etc.
   ========================================================================== */
window.WT_SIL = (() => {
  const HOLE = ' fill="#000" fill-opacity=".42"';            // creux : galets, ouvertures
  const DIM = ' fill-opacity=".55"';                        // détails secondaires : vitrages…
  const RIM = ' fill="#000" fill-opacity=".28" stroke="currentColor" stroke-opacity=".6" stroke-width="1.1"';
  const p = (d, a = '') => `<path d="${d}"${a}/>`;
  const r = (x, y, w, h, rx = 0, a = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${rx ? ` rx="${rx}"` : ''}${a}/>`;
  const c = (x, y, rad, a = '') => `<circle cx="${x}" cy="${y}" r="${rad}"${a}/>`;
  const seq = (from, step, n) => Array.from({ length: n }, (_, i) => from + i * step);

  /* ---- train de roulement ---- */
  // chenille : arrière x1, avant x2, brin supérieur y1, sol y2
  const track = (x1, x2, y1, y2 = 93) => {
    const h = y2 - y1;
    const shape = (a, b, t, u, k) => `M${a} ${t + k * .38} Q${a} ${t} ${a + k * .42} ${t} L${b - k * .42} ${t} Q${b} ${t} ${b} ${t + k * .38} L${b - k * .55} ${u} L${a + k * .55} ${u} Z`;
    // bande extérieure + intérieur ombré : la chenille se lit comme une bande
    return p(shape(x1, x2, y1, y2, h)) + p(shape(x1 + 2.6, x2 - 2.6, y1 + 2.6, y2 - 2.6, h - 5.2), ' fill="#000" fill-opacity=".2"');
  };
  const wheels = (xs, y, rad, hub = .32) => xs.map(x => c(x, y, rad, HOLE) + c(x, y, rad * hub)).join('');
  const interleaved = (xs, y, rad) => // galets entrelacés (Tiger, Panther…)
    xs.map((x, i) => c(x, y + (i % 2 ? 1.5 : 0), rad, RIM)).join('') + xs.filter((_, i) => !(i % 2)).map(x => c(x, y, rad * .3)).join('');
  const rollers = (xs, y, rad = 2.6) => xs.map(x => c(x, y, rad, HOLE)).join('');
  const sprocket = (x, y, rad) => c(x, y, rad, HOLE) + c(x, y, rad * .45);
  const skirt = (x1, x2, y1, y2) => r(x1, y1, x2 - x1, y2 - y1, 1.5);
  const tyres = (xs, y, rad) => xs.map(x => c(x, y, rad) + c(x, y, rad * .62, HOLE) + c(x, y, rad * .25)).join('');

  /* ---- canon ---- */
  // o.brake = [longueur, hauteur] ; o.evac = [position 0-1, longueur] ; o.sleeve = fraction manchonnée
  const gun = (x, y, len, t, o = {}) => {
    let s = r(x, y - t / 2, len, t);
    if (o.sleeve) s += r(x, y - t * .68, len * o.sleeve, t * 1.36, .8);
    if (o.evac) s += r(x + len * o.evac[0], y - t * .9, o.evac[1], t * 1.8, t * .9);
    if (o.brake) s += r(x + len - o.brake[0], y - o.brake[1] / 2, o.brake[0], o.brake[1], 1);
    return s;
  };
  // briques de blindage réactif (ERA)
  const era = (x, y, cols, rows, w = 5, h = 3.2) => {
    let s = '';
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) s += r(x + i * (w + .8), y + j * (h + .8), w, h, .5, ' fill="#000" fill-opacity=".22"');
    return s;
  };

  /* ---- sous-ensembles récurrents ---- */
  // châssis soviétique à 6 grands galets (T-72 / T-90)
  const t72Chassis = () =>
    track(14, 180, 70) + wheels(seq(31, 26.4, 6), 83, 10) + rollers([50, 102, 152], 71.5, 2.4) +
    skirt(18, 170, 62, 71) + p('M10 70 L14 60 L132 60 L180 67 L181 72 L12 72 Z');
  // châssis T-80 / T-64 : petits galets et nombreux rouleaux porteurs
  const t80Chassis = (small = false) =>
    track(14, 180, 71) + wheels(seq(31, 26.4, 6), small ? 86 : 85, small ? 6.5 : 8) +
    rollers(small ? [44, 84, 124, 164] : [44, 70, 97, 124, 150], 73.5, 2.4) +
    skirt(18, 172, 62, 72) + p('M10 71 L13 60 L132 60 L180 67 L181 73 L12 73 Z');
  // châssis Leopard 2 (7 galets derrière des jupes)
  const leo2Chassis = () =>
    track(10, 188, 70) + wheels(seq(25, 24.2, 7), 85, 8.4) +
    p('M14 60 L184 60 L184 74 ' + seq(172, -24.2, 7).map(x => `Q${x - 12} 80 ${x - 24} 74`).join(' ') + ' L14 74 Z') +
    p('M6 70 L10 58 L144 58 L192 64 L192 70 Z');
  // châssis Abrams / Leclerc / Merkava (galets sous jupes épaisses)
  const modernChassis = (n, x1 = 10, x2 = 190, y = 70) =>
    track(x1, x2, y) + wheels(seq(x1 + 16, (x2 - x1 - 32) / (n - 1), n), 85, 8.2) + skirt(x1 + 4, x2 - 6, 60, 76);

  const S = {
    /* =================== BLINDÉS =================== */
    t3485: // suspension Christie : 5 grands galets, glacis à 60°
      track(24, 162, 69) + wheels(seq(41, 26, 5), 81, 10.8) + sprocket(29, 78, 6) +
      p('M18 69 L28 55 L126 55 L166 69 Z') +
      p('M64 55 L68 43 Q70 39 80 39 L114 39 L126 45 L128 55 Z') + r(78, 33, 12, 7, 2) + r(125, 42, 8, 11, 2) +
      gun(131, 46.5, 88, 3.3) + r(32, 50, 20, 5, 1, DIM),
    m4a1: // M4A1 : caisse moulée arrondie, 3 bogies VVSS, 75 mm court
      track(22, 176, 72) + wheels([42, 57, 86, 101, 130, 145], 86, 7) + r(44, 75, 11, 6, 2, HOLE) + r(88, 75, 11, 6, 2, HOLE) + r(132, 75, 11, 6, 2, HOLE) +
      rollers([49, 93, 137], 72.5, 2.4) + sprocket(168, 79, 7) +
      p('M20 74 L24 55 Q28 50 40 50 L124 50 Q146 50 166 62 Q178 68 178 76 Z') +
      p('M62 50 L64 39 Q66 33 78 33 L110 33 Q120 34 124 42 L124 50 Z') + r(74, 28, 12, 5, 2) + r(122, 37, 8, 10, 2) +
      gun(128, 42, 54, 3.4),
    m4a3e8: // « Easy Eight » : suspension HVSS à paires de galets, 76 mm à frein de bouche
      track(22, 178, 72) + wheels([40, 52, 82, 94, 124, 136], 86, 6.2) + rollers([46, 88, 130, 158], 73, 2.2) + sprocket(170, 79, 7) +
      p('M20 74 L23 52 L124 52 L166 63 Q178 68 178 76 Z') +
      p('M52 52 L56 41 Q58 34 70 34 L112 34 Q124 35 128 43 L128 52 Z') + r(66, 28, 14, 6, 2) + r(126, 37, 8, 11, 2) +
      gun(132, 42.5, 82, 3.2, { brake: [7, 6] }),
    m26: // M26 Pershing : 6 galets, masque imposant, 90 mm à double frein
      track(14, 180, 70) + wheels(seq(31, 24.4, 6), 83, 9.4) + rollers([43, 67, 92, 116, 141], 71.5, 2.2) +
      p('M10 70 L14 54 L132 54 L178 66 L180 72 L12 72 Z') +
      p('M44 54 L46 43 L60 41 L64 35 L118 34 L132 40 L134 54 Z') + r(70, 29, 14, 6, 2) + r(131, 37, 10, 13, 2) +
      gun(141, 43.5, 80, 3.4, { brake: [11, 8] }),
    m18: // M18 Hellcat : bas et rapide, tourelle ouverte
      track(20, 174, 73) + wheels(seq(37, 28, 5), 84.5, 8.8) + rollers([51, 79, 107, 135], 74.5, 2.2) + sprocket(166, 79, 6) +
      p('M16 75 L20 59 L118 57 L176 68 L178 75 Z') +
      p('M62 57 L68 42 L118 41 L134 50 L134 57 Z') + r(70, 40, 44, 2.5, 1, DIM) +
      gun(134, 47, 74, 3, { brake: [8, 6] }),
    m60a1: // M60A1 : tourelle en « nez d'aiguille », grosse coupole M19
      track(10, 186, 68) + wheels(seq(27, 26.6, 6), 83.5, 9) + rollers([43, 96, 150], 70, 2.6) +
      p('M6 68 L10 54 L140 54 L186 64 L187 70 L8 70 Z') +
      p('M38 54 L42 41 L60 36 L118 36 L152 46 L150 54 Z') + p('M70 36 L72 26 L96 26 L98 36 Z') + r(98, 30, 8, 3, 1, DIM) +
      gun(150, 46.5, 80, 3.2, { evac: [.36, 15] }),
    m1: // M1 Abrams (105 mm)
      modernChassis(7) + p('M6 70 L10 58 L146 58 L194 65 L194 72 L8 72 Z') +
      p('M30 58 L34 44 L130 42 L160 50 L160 58 Z') + r(58, 37, 18, 6, 1.5) + r(118, 37, 8, 5, 1) +
      gun(158, 50, 74, 3.2, { evac: [.38, 14] }),
    m1a2: // M1A2 : 120 mm à manchon thermique, viseur indépendant du chef (CITV)
      modernChassis(7) + p('M6 70 L10 58 L146 58 L194 65 L194 72 L8 72 Z') +
      p('M30 58 L34 44 L130 42 L160 50 L160 58 Z') + r(58, 37, 18, 6, 1.5) + r(100, 33, 11, 9, 1.5) + r(118, 37, 8, 5, 1) +
      gun(158, 50, 80, 3.6, { sleeve: .9 }),

    pz4f2: // Pz.IV F2 : 8 petits galets par paires, 75 mm L/43
      track(16, 178, 71) + wheels([35, 48, 69, 82, 103, 116, 137, 150], 86, 6.4) + rollers([42, 76, 110, 144], 72.5, 2.4) + sprocket(172, 77, 6.5) +
      p('M12 71 L14 54 L146 54 L150 58 L172 60 L180 69 L180 73 L14 73 Z') +
      p('M56 54 L62 37 L114 37 L126 44 L126 54 Z') + r(60, 31, 15, 6, 2) + r(124, 40, 7, 10, 2) +
      gun(129, 45, 70, 2.8, { brake: [6, 5] }),
    tiger1: // Tiger H1 : caisse verticale, galets entrelacés, tourelle en fer à cheval
      track(12, 184, 67) + interleaved(seq(30, 18, 9), 81, 10.5) +
      p('M10 68 L12 49 L166 49 L168 59 L186 64 L186 70 L12 70 Z') +
      p('M52 49 Q44 49 44 40 Q44 31 56 31 L130 31 L134 35 L134 49 Z') + r(52, 24, 17, 8, 3) + r(132, 33, 12, 14, 2) +
      gun(144, 40, 84, 3.6, { brake: [11, 10] }),
    tiger2: // Tiger II : glacis incliné, longue tourelle Henschel, 88 mm L/71
      track(10, 188, 68) + interleaved(seq(25, 18.2, 9), 81.5, 11) +
      p('M8 69 L12 51 L150 51 L190 66 L190 71 L10 71 Z') +
      p('M46 51 L52 33 L128 33 L144 42 L144 51 Z') + r(56, 27, 15, 7, 2.5) + r(141, 36, 9, 11, 3) +
      gun(148, 41.5, 88, 3.6, { brake: [11, 9] }),
    panther: // Panther A : glacis à 55°, galets entrelacés, masque « groin »
      track(14, 180, 69) + interleaved(seq(29, 18.8, 8), 82, 10.4) +
      p('M10 69 L16 53 L140 53 L182 69 L180 72 L12 72 Z') +
      p('M54 53 L62 37 L112 35 L124 41 L126 53 Z') + r(62, 30, 14, 7, 2.5) + p('M122 39 Q134 39 134 46 Q134 52 122 52 Z') +
      gun(134, 44, 92, 3.2, { brake: [9, 7] }),
    jagdpanther: // Jagdpanther : casemate dans le prolongement du glacis
      track(14, 182, 69) + interleaved(seq(29, 18.8, 8), 82, 10.4) +
      p('M10 69 L14 53 L20 35 L118 33 L184 69 L182 72 L12 72 Z') +
      c(150, 49, 7.5) + gun(150, 49, 86, 3.6, { brake: [10, 8] }) + r(40, 29, 14, 5, 2),
    maus: // Maus : 188 t, jupes latérales, 128 mm + 75 mm coaxial
      track(8, 194, 84) + r(8, 86, 186, 6, 3, HOLE) +
      p('M6 86 L8 44 L150 44 L192 58 L194 86 Z') + r(14, 70, 170, 2, 0, HOLE) +
      p('M56 44 L60 22 L136 22 Q152 25 156 44 Z') + r(70, 16, 18, 7, 2.5) +
      gun(154, 33, 70, 4.4) + gun(154, 27.5, 26, 2.2),
    leo1: // Leopard I : 7 galets, tourelle moulée arrondie, L7 105 mm
      track(8, 184, 70) + wheels(seq(25, 23.3, 7), 84.5, 8.6) + rollers([48, 94, 140], 71.5, 2.4) + r(14, 62, 158, 7, 1.5, DIM) +
      p('M6 70 L10 56 L138 56 L186 66 L186 72 L8 72 Z') +
      p('M46 56 L52 41 Q56 36 70 36 L120 36 Q138 38 148 48 L148 56 Z') + r(74, 30, 14, 6, 2) + r(106, 31, 12, 5, 1.5) +
      gun(148, 47.5, 82, 3, { evac: [.36, 14], sleeve: .3 }),
    leo2a4: // Leopard 2A4 : tourelle à faces verticales, 120 mm L/44
      leo2Chassis() + p('M34 58 L36 40 L138 40 L144 44 L144 58 Z') + r(62, 32, 11, 8, 1.5) + r(104, 34, 14, 6, 1.5) +
      gun(144, 48.5, 84, 3.6, { evac: [.42, 16], sleeve: .3 }),
    leo2a6: // Leopard 2A6 : modules en coin, canon L/55 allongé
      leo2Chassis() + p('M34 58 L36 40 L136 40 L172 50 L150 58 Z') + r(62, 32, 11, 8, 1.5) + r(104, 34, 14, 6, 1.5) + p('M136 40 L172 50 L168 51 L136 42 Z', HOLE) +
      gun(150, 49.5, 88, 3.6, { evac: [.34, 16], sleeve: .3 }),
    leo2a7v: // Leopard 2A7V : coin frontal, tourelleau téléopéré, blindage additionnel
      leo2Chassis() + p('M28 58 L32 38 L136 38 L174 50 L150 58 Z') + r(56, 30, 13, 8, 1.5) + r(84, 26, 16, 5, 1.5) + r(90, 31, 3, 7) + r(106, 32, 14, 6, 1.5) +
      p('M136 38 L174 50 L170 51 L136 40 Z', HOLE) + gun(150, 49.5, 88, 3.6, { evac: [.34, 16], sleeve: .3 }),
    strv122: // Strv 122 : Leopard 2 suédois surblindé, L/44
      leo2Chassis() + p('M150 58 L194 63 L194 70 L150 70 Z') + p('M32 58 L34 39 L136 39 L170 50 L150 58 Z') + r(60, 31, 12, 8, 1.5) + r(104, 33, 14, 6, 1.5) +
      p('M136 39 L170 50 L166 51 L136 41 Z', HOLE) + gun(150, 49.5, 80, 3.6, { evac: [.42, 16], sleeve: .3 }),

    kv1: // KV-1 (ZiS-5) : caisse massive, tourelle haute surblindée
      track(14, 176, 70) + wheels(seq(31, 24.4, 6), 84.5, 8.6) + rollers([43, 92, 141], 72, 2.6) +
      p('M10 70 L12 53 L146 53 L176 65 L178 72 L12 72 Z') +
      p('M54 53 L58 31 L122 31 L128 39 L128 53 Z') + r(56, 42, 70, 2, 0, HOLE) + r(126, 36, 8, 12, 2) +
      gun(132, 42, 48, 3.6),
    is2: // IS-2 : caisse moulée, tourelle ronde, 122 mm à gros frein de bouche
      track(14, 178, 70) + wheels(seq(32, 24, 6), 84.5, 8.6) + rollers([52, 96, 140], 72, 2.6) +
      p('M10 70 L16 56 L138 56 L152 58 L180 70 L178 72 L12 72 Z') +
      p('M60 56 Q56 38 76 36 L118 36 Q134 38 136 50 L136 56 Z') + r(74, 30, 13, 6, 2) + r(133, 40, 10, 12, 3) +
      gun(143, 45.5, 80, 4.2, { brake: [13, 9] }),
    is3: // IS-3 : nez en brochet, tourelle en bol
      track(14, 180, 71) + wheels(seq(32, 24, 6), 85, 8.6) + rollers([52, 96, 140], 73, 2.6) +
      p('M10 71 L16 59 L134 59 L170 63 L182 71 L180 73 L12 73 Z') +
      p('M54 59 Q56 43 90 41 Q126 41 142 59 Z') + r(82, 37, 11, 5, 2) +
      gun(138, 50, 86, 4, { brake: [12, 8] }),
    t54: // T-54 : 5 galets avec écart entre le 1er et le 2e, tourelle en dôme
      track(16, 178, 70) + wheels([34, 74, 102, 130, 158], 81, 10.8) +
      p('M12 70 L16 60 L128 60 L178 67 L180 72 L14 72 Z') + r(18, 62, 150, 3, 0, DIM) +
      p('M60 60 Q62 43 96 41 Q126 41 136 60 Z') + r(80, 37, 11, 4, 2) + r(128, 44, 7, 5, 1) +
      gun(134, 50.5, 94, 3.6),
    t62: // T-62 : 115 mm lisse, évacuateur proche du masque
      track(14, 180, 70) + wheels([32, 58, 84, 120, 156], 81, 10.8) +
      p('M10 70 L14 60 L132 60 L180 67 L181 72 L12 72 Z') + r(18, 62, 152, 3, 0, DIM) +
      p('M58 60 Q60 42 96 40 Q128 40 138 60 Z') + r(80, 36, 11, 4, 2) + r(130, 44, 7, 5, 1) +
      gun(136, 50.5, 94, 3.4, { evac: [.2, 15] }),
    t64b: // T-64B : petits galets, briques Kontakt-1 sur la tourelle
      t80Chassis(true) + p('M58 60 Q60 44 94 42 Q124 42 134 60 Z') + era(110, 46, 4, 3) + r(80, 38, 11, 4, 2) +
      gun(134, 51.5, 94, 3.4, { evac: [.35, 14], sleeve: .45 }),
    t72a: // T-72A : 6 grands galets, jupes en caoutchouc, schnorchel à l'arrière
      t72Chassis() + p('M58 60 Q60 44 94 42 Q126 42 136 60 Z') + r(44, 52, 16, 4, 2) + r(80, 38, 11, 4, 2) + r(126, 44, 7, 5, 1) +
      gun(136, 51.5, 92, 3.4, { evac: [.33, 14], sleeve: .45 }),
    t80b: // T-80B : turbine, 6 galets caoutchoutés et 5 rouleaux porteurs
      t80Chassis() + p('M58 60 Q60 44 94 42 Q124 42 134 60 Z') + r(80, 38, 11, 4, 2) + r(126, 44, 8, 6, 1) +
      gun(134, 51.5, 94, 3.4, { evac: [.33, 14], sleeve: .45 }),
    t80u: // T-80U : coins réactifs Kontakt-5 sur la tourelle et le glacis
      t80Chassis() + p('M56 60 Q58 44 92 42 L120 43 L142 50 L140 60 Z') + p('M120 43 L142 50 L140 60 L124 60 Z', ' fill="#000" fill-opacity=".2"') +
      r(76, 38, 12, 4, 2) + p('M132 60 L178 66 L178 69 L132 64 Z', ' fill="#000" fill-opacity=".2"') +
      gun(140, 51.5, 92, 3.4, { evac: [.33, 14], sleeve: .45 }),
    t90a: // T-90A : châssis T-72, tourelle soudée, projecteurs Shtora
      t72Chassis() + p('M54 60 L58 45 L118 43 L140 50 L140 60 Z') + p('M118 43 L140 50 L140 60 L124 60 Z', ' fill="#000" fill-opacity=".2"') +
      r(78, 38, 12, 5, 2) + r(112, 46, 7, 5, 1, HOLE) + r(40, 50, 16, 4, 2) +
      gun(140, 51.5, 90, 3.4, { evac: [.33, 14], sleeve: .45 }),
    t90m: // T-90M : nouvelle tourelle, blindage Relikt, cage à l'arrière
      t72Chassis() + p('M44 60 L48 43 L120 41 L144 50 L144 60 Z') + p('M120 41 L144 50 L144 60 L128 60 Z', ' fill="#000" fill-opacity=".2"') +
      p('M30 46 H46 V58 H30 Z', DIM) + r(72, 34, 14, 7, 2) + r(96, 32, 12, 7, 1.5) +
      gun(144, 51.5, 90, 3.4, { evac: [.33, 14], sleeve: .45 }),
    type59: // Type 59 : dérivé chinois du T-54
      track(16, 178, 70) + wheels([34, 74, 102, 130, 158], 81, 10.8) +
      p('M12 70 L16 60 L128 60 L178 67 L180 72 L14 72 Z') + r(18, 62, 150, 3, 0, DIM) +
      p('M60 60 Q62 43 96 41 Q126 41 136 60 Z') + r(80, 37, 11, 4, 2) + r(128, 43, 9, 7, 2) +
      gun(134, 50.5, 94, 3.6),
    ztz96a: // ZTZ96A : caisse type 59 allongée, tourelle à modules réactifs
      t72Chassis() + p('M52 60 L56 45 L118 43 L144 51 L142 60 Z') + p('M118 43 L144 51 L142 60 L126 60 Z', ' fill="#000" fill-opacity=".2"') + r(78, 38, 12, 5, 2) +
      gun(142, 51.5, 90, 3.4, { evac: [.33, 14], sleeve: .45 }),
    ztz99a: // ZTZ99A : tourelle en pointe de flèche, gros viseur panoramique
      track(12, 184, 70) + wheels(seq(29, 26.8, 6), 84, 10) + rollers([48, 101, 154], 71.5, 2.4) + skirt(16, 176, 61, 72) +
      p('M8 70 L12 59 L136 59 L186 66 L186 72 L10 72 Z') +
      p('M46 59 L50 43 L118 41 L160 52 L148 59 Z') + p('M118 41 L160 52 L154 54 L120 45 Z', ' fill="#000" fill-opacity=".2"') + r(70, 34, 12, 7, 2) + r(98, 32, 10, 9, 1.5) +
      gun(148, 51, 90, 3.4, { evac: [.33, 14], sleeve: .45 }),

    centurion3: // Centurion Mk 3 : bogies Horstmann, jupes, 20 livres
      track(12, 184, 70) + wheels([30, 46, 78, 94, 126, 142], 86, 7.4) + skirt(16, 170, 60, 76) +
      p('M8 70 L12 54 L146 54 L188 67 L188 72 L10 72 Z') +
      p('M42 54 L44 39 L58 36 L118 36 L136 44 L136 54 Z') + r(44, 43, 22, 9, 1, DIM) + r(66, 30, 14, 6, 2) +
      gun(136, 44.5, 90, 3.2, { evac: [.55, 13] }),
    shotkal: // Sho't Kal Gimel : Centurion israélien, L7 de 105 mm, moteur diesel
      track(12, 184, 70) + wheels([30, 46, 78, 94, 126, 142], 86, 7.4) + skirt(16, 170, 60, 76) +
      p('M8 70 L10 52 L42 50 L42 54 L146 54 L188 67 L188 72 L10 72 Z') +
      p('M42 54 L44 39 L58 36 L118 36 L136 44 L136 54 Z') + r(44, 43, 22, 9, 1, DIM) + r(66, 30, 14, 6, 2) + r(84, 30, 3, 6) +
      gun(136, 44.5, 90, 3.2, { evac: [.34, 13] }),
    churchill7: // Churchill VII : chenilles enveloppant la caisse, 11 petits galets
      p('M12 72 Q12 46 36 46 L176 46 Q196 46 198 62 L186 93 L28 93 Z') + wheels(seq(34, 13.4, 11), 87.5, 4.6) +
      r(64, 62, 14, 16, 2, HOLE) + r(28, 42, 150, 5) +
      p('M78 42 L80 25 L128 25 L132 29 L132 42 Z') + r(88, 19, 13, 6, 2) + r(130, 29, 7, 10, 2) +
      gun(134, 34, 42, 3.2),
    cromwell5: // Cromwell V : caisse à flancs plats, 5 galets Christie
      track(18, 178, 70) + wheels(seq(36, 30.5, 5), 81.5, 10.8) +
      p('M14 70 L16 53 L158 53 L166 57 L180 62 L180 72 L16 72 Z') + r(24, 48, 40, 5, 1) +
      p('M64 53 L64 33 L126 33 L128 36 L128 53 Z') + r(68, 38, 22, 9, 1, DIM) + r(74, 27, 14, 6, 2) +
      gun(128, 41.5, 52, 3.2),
    chieftain10: // Chieftain Mk 10 : très long, tourelle couchée, blindage Stillbrew
      track(10, 190, 70) + wheels(seq(28, 25, 6), 86, 7.6) + skirt(14, 176, 60, 77) +
      p('M6 70 L10 58 L150 58 L196 66 L196 72 L8 72 Z') +
      p('M38 58 L44 44 L64 38 L116 38 L162 51 L160 58 Z') + p('M116 39 L150 46 L160 52 L128 52 Z', ' fill="#000" fill-opacity=".18"') + r(70, 32, 14, 6, 2) +
      gun(158, 50.5, 78, 3.4, { evac: [.38, 15], sleeve: .75 }),
    chally2: // Challenger 2 : tourelle anguleuse, canon rayé L30 à manchon
      modernChassis(6) + p('M6 70 L10 58 L150 58 L194 65 L194 72 L8 72 Z') +
      p('M38 58 L42 42 L134 40 L160 49 L158 58 Z') + r(96, 30, 14, 11, 1.5) + r(62, 36, 16, 6, 2) +
      gun(158, 49.5, 78, 3.6, { evac: [.4, 14], sleeve: .9 }),

    chito: // Chi-To : longue caisse, tourelle hexagonale, 75 mm
      track(14, 180, 71) + wheels(seq(32, 22, 7), 85.5, 7) + rollers([43, 87, 131], 72.5, 2.4) + sprocket(172, 78, 6) +
      p('M10 71 L14 56 L144 56 L178 66 L180 73 L12 73 Z') +
      p('M56 56 L60 38 L118 38 L130 46 L130 56 Z') + r(66, 32, 14, 6, 2) + gun(130, 46, 82, 3),
    type74: // Type 74 : suspension hydropneumatique, tourelle moulée
      track(14, 180, 72) + wheels(seq(32, 32, 5), 84, 10) +
      p('M10 72 L14 61 L132 61 L180 68 L180 74 L12 74 Z') +
      p('M52 61 Q54 45 88 43 Q124 43 138 61 Z') + r(76, 38, 13, 5, 2) + r(128, 46, 8, 6, 1) +
      gun(138, 52.5, 86, 3.2, { evac: [.4, 14], sleeve: .4 }),
    type90: // Type 90 : 6 galets, tourelle anguleuse, 120 mm
      modernChassis(6) + p('M6 70 L10 58 L146 58 L192 65 L192 72 L8 72 Z') +
      p('M34 58 L36 41 L136 41 L144 46 L144 58 Z') + r(62, 34, 14, 7, 2) + r(106, 34, 12, 7, 1.5) +
      gun(144, 49.5, 84, 3.6, { evac: [.42, 16], sleeve: .3 }),
    type10: // Type 10 : compact, 5 galets, tourelle modulaire
      track(16, 178, 71) + wheels(seq(34, 32, 5), 85, 9.6) + skirt(20, 170, 61, 75) +
      p('M12 71 L16 59 L136 59 L180 66 L180 73 L14 73 Z') +
      p('M36 59 L40 43 L124 42 L152 50 L150 59 Z') + r(96, 34, 12, 9, 1.5) + r(60, 37, 14, 6, 2) +
      gun(150, 50.5, 80, 3.6, { sleeve: .85 }),

    arl44: // ARL-44 : train de roulement à nombreux petits galets, tourelle Schneider
      track(10, 190, 65) + wheels(seq(26, 12.4, 13), 88, 4.8) + skirt(14, 186, 60, 80) +
      p('M8 65 L10 50 L150 50 L190 62 L190 68 L10 68 Z') +
      p('M58 50 L64 29 L118 29 L144 40 L144 50 Z') + r(70, 23, 14, 6, 2) +
      gun(144, 39, 84, 3.4, { brake: [10, 7] }),
    amx13: // AMX-13 : tourelle oscillante très haute, barbotin avant
      track(22, 172, 72) + wheels(seq(38, 26.5, 5), 84.5, 8.4) + rollers([52, 105], 73.5, 2.4) + sprocket(166, 78, 6) +
      p('M18 74 L22 60 L110 58 L170 66 L174 74 Z') +
      p('M46 58 L50 52 L110 52 L112 58 Z') + p('M32 52 L38 36 L108 34 L124 42 L118 52 Z') + r(56, 29, 12, 6, 2) +
      gun(122, 42.5, 92, 3, { brake: [8, 5] }),
    amx30b2: // AMX-30B2 : tourelle moulée effilée, 105 mm à manchon
      track(12, 184, 70) + wheels(seq(29, 30.5, 5), 84.5, 9.6) + rollers([44, 74, 105, 136, 166], 71.5, 2.2) +
      p('M8 70 L12 57 L138 57 L186 66 L186 72 L10 72 Z') +
      p('M44 57 L50 43 Q56 38 70 38 L118 38 L150 48 L148 57 Z') + p('M72 38 L74 28 L92 28 L94 38 Z') +
      gun(148, 48.5, 80, 3.2, { sleeve: .8 }),
    leclerc: // Leclerc : 6 galets, tourelle à nuque d'autochargeur
      modernChassis(6) + p('M6 70 L10 58 L144 58 L192 65 L192 72 L8 72 Z') +
      p('M26 58 L30 42 L134 42 L160 50 L160 58 Z') + r(106, 33, 11, 9, 1.5) + r(70, 36, 14, 6, 2) +
      gun(158, 50.5, 80, 3.6, { sleeve: .9 }),

    m13_40: // M13/40 : riveté, bogies à 4 petits galets, 47 mm
      track(26, 172, 73) + wheels([44, 55, 66, 77, 110, 121, 132, 143], 87, 5) + r(46, 78, 30, 5, 1, HOLE) + r(112, 78, 30, 5, 1, HOLE) + rollers([60, 99, 138], 74, 2.2) +
      p('M22 74 L24 56 L140 56 L168 64 L172 74 Z') + seq(40, 12, 9).map(x => c(x, 60, .9, HOLE)).join('') +
      p('M84 56 L88 40 L128 40 L134 46 L134 56 Z') + gun(134, 47, 38, 2.6),
    ariete: // Ariete : 7 galets, longue tourelle, 120 mm
      modernChassis(7) + p('M6 70 L10 58 L146 58 L192 65 L192 72 L8 72 Z') +
      p('M30 58 L34 43 L132 42 L156 50 L156 58 Z') + r(98, 34, 12, 8, 1.5) + r(62, 37, 14, 6, 2) +
      gun(156, 50.5, 80, 3.6, { evac: [.4, 14], sleeve: .4 }),
    centauro: // Centauro : 8×8 à roues, tourelle de 105 mm
      tyres([34, 66, 124, 156], 83, 10.5) + p('M10 78 L14 58 L150 56 L188 64 L190 76 L10 78 Z') +
      p('M44 56 L48 42 L128 42 L146 50 L146 56 Z') + r(70, 36, 14, 6, 2) + r(102, 36, 10, 6, 1.5) +
      gun(146, 49, 84, 3.2, { evac: [.36, 13], sleeve: .3 }),
    merkava3: // Merkava Mk.3 : moteur à l'avant, tourelle en coin, chaînes à l'arrière
      modernChassis(6) + p('M6 70 L10 60 L120 56 L194 64 L194 72 L8 72 Z') +
      p('M24 56 L28 46 L92 41 L168 52 L160 56 Z') + seq(26, 5, 6).map(x => r(x, 56, 1.8, 9, .8)).join('') + r(70, 35, 14, 6, 2) +
      gun(160, 52, 76, 3.6, { sleeve: .85 }),
    merkava4: // Merkava Mk.4 : tourelle très allongée, rideau de chaînes
      modernChassis(6) + p('M6 70 L10 60 L120 56 L194 64 L194 72 L8 72 Z') +
      p('M20 57 L24 45 L88 39 L180 53 L168 57 Z') + seq(22, 5, 7).map(x => r(x, 57, 1.8, 10, .8)).join('') + r(66, 33, 14, 7, 2) + r(100, 36, 10, 6, 1.5) +
      gun(166, 52, 72, 3.6, { sleeve: .85 }),
    strv103: // Strv 103 : sans tourelle, canon fixé dans la caisse, lame de bouteur
      track(20, 176, 72) + wheels(seq(42, 34, 4), 84, 10) + rollers([59, 93, 127], 73, 2.4) +
      p('M10 74 L14 60 L100 55 L176 58 L198 66 L196 76 Z') + p('M150 60 L200 64 L200 67 L150 64 Z', DIM) + r(188, 66, 6, 20, 1) +
      r(84, 47, 16, 8, 2) + r(110, 50, 10, 5, 1.5) + gun(150, 56.5, 88, 3, { evac: [.45, 14] }),
    zsu234: // ZSU-23-4 « Shilka » : 4 canons de 23 mm, radar sur la tourelle
      track(20, 176, 72) + wheels(seq(36, 26.4, 6), 83, 9.4) +
      p('M14 74 L18 60 L150 58 L178 66 L178 74 Z') + p('M44 58 L46 42 L138 42 L140 58 Z') +
      r(58, 38, 4, 6) + p('M44 32 Q60 22 76 32 Z') + gun(134, 46, 56, 2.2) + gun(134, 51, 56, 2.2),
    gepard: // Gepard : 2 canons de 35 mm latéraux, radars de veille et de poursuite
      track(8, 184, 70) + wheels(seq(25, 23.3, 7), 84.5, 8.6) + rollers([48, 94, 140], 71.5, 2.4) +
      p('M6 70 L10 56 L138 56 L186 66 L186 72 L8 72 Z') + p('M50 56 L52 34 L134 34 L140 40 L140 56 Z') +
      r(64, 18, 3, 16) + r(40, 12, 50, 7, 2) + c(146, 38, 8) + r(140, 36, 6, 4) +
      gun(84, 46, 118, 3, { brake: [6, 5] }) + r(76, 42, 26, 8, 2),

    /* =================== AVIATION =================== */
    spitfire9:
      p('M14 50 Q14 44 24 43 L150 40 Q178 39 196 44 L202 48 L196 52 Q172 56 124 56 L40 52 Z') +
      p('M18 44 Q16 25 28 24 Q38 25 42 43 Z') + p('M8 48 L46 47 L46 50 L10 51 Z') +
      p('M112 40 Q118 31 132 31 L144 40 Z', DIM) + p('M96 54 L152 53 L148 57 L100 58 Z') + r(112, 56.5, 20, 6, 3) +
      p('M196 44 Q212 48 196 52 Z') + r(204, 22, 2.6, 52, 1.3, DIM),
    bf109g6:
      p('M14 50 L30 44 L150 41 Q182 40 198 46 L202 49 L198 53 Q176 57 140 57 L40 53 Z') +
      p('M16 45 L14 24 Q18 19 28 21 L44 44 Z') + p('M8 48 L44 47 L44 50 L10 51 Z') +
      p('M118 41 L124 33 L146 33 L150 41 Z', DIM) + p('M100 55 L152 54 L148 58 L104 59 Z') + r(110, 57, 14, 5, 2) +
      c(170, 43, 3.5) + p('M198 46 Q214 49 198 53 Z') + r(206, 24, 2.6, 50, 1.3, DIM),
    p51d:
      p('M12 50 L30 44 L150 42 Q182 41 198 46 L202 49 L198 53 Q180 56 150 56 L44 54 Z') +
      p('M14 46 L12 21 Q14 17 24 19 L44 40 L74 43 Z') + p('M6 48 L42 47 L42 50 L8 51 Z') +
      p('M108 43 Q114 30 132 30 Q142 32 146 42 Z', DIM) + p('M112 55 L162 54 L158 58 L116 59 Z') +
      p('M72 54 L118 56 L114 64 L88 63 Z') + p('M198 46 Q214 49 198 53 Z') + r(206, 22, 2.6, 54, 1.3, DIM),
    yak3:
      p('M14 50 L30 45 L148 42 Q180 41 196 46 L200 49 L196 53 Q176 56 140 56 L40 53 Z') +
      p('M16 46 L14 25 Q18 20 28 22 L44 45 Z') + p('M8 48 L44 47 L44 50 L10 51 Z') +
      p('M112 42 Q118 32 134 33 L140 42 Z', DIM) + p('M100 55 L150 54 L146 58 L104 59 Z') +
      p('M92 55 L120 56 L116 62 L96 61 Z') + p('M196 46 Q210 49 196 53 Z') + r(203, 25, 2.6, 48, 1.3, DIM),
    a6m2:
      p('M14 50 L30 45 L140 41 L176 39 L176 59 L140 58 L40 54 Z') + p('M176 38 Q192 38 193 49 Q192 60 176 60 Z') +
      p('M18 45 Q16 27 28 26 Q38 27 42 44 Z') + p('M8 48 L44 47 L44 50 L10 51 Z') +
      p('M98 41 Q106 30 124 30 L150 31 L156 40 Z', DIM) + p('M104 56 L160 55 L156 59 L108 60 Z') + r(198, 26, 2.6, 46, 1.3, DIM),
    il2:
      p('M14 50 L30 44 L142 40 Q182 40 200 46 L204 50 L200 54 Q180 60 142 60 L40 55 Z') +
      p('M16 45 L14 22 Q18 18 28 20 L44 44 Z') + p('M8 48 L44 47 L44 50 L10 51 Z') +
      p('M100 40 Q108 30 124 30 L150 31 L156 40 Z', DIM) + p('M96 58 L160 57 L156 61 L100 62 Z') +
      r(130, 59, 22, 9, 4) + p('M200 46 Q214 50 200 54 Z') + r(208, 24, 2.6, 52, 1.3, DIM),
    b17g:
      p('M6 50 L20 46 L170 42 Q196 42 210 48 Q213 52 206 56 L170 58 L30 55 Z') +
      p('M8 48 L6 14 Q10 10 22 13 L78 42 Z') + p('M2 49 L40 48 L40 51 L4 52 Z') +
      p('M168 42 Q176 35 190 38 L196 44 Z', DIM) + p('M200 46 Q212 49 207 55 L198 55 Z', DIM) +
      c(156, 41, 5) + c(110, 58, 6) + c(200, 58, 4) +
      p('M120 55 L200 53 Q206 56 200 59 L120 60 Z') + p('M140 57 L188 57 Q194 60 188 63 L140 63 Z', DIM) +
      r(204, 38, 2.4, 30, 1.2, DIM),
    me262:
      p('M8 50 L28 45 L150 40 Q190 42 208 50 Q190 54 150 56 L40 54 Z') +
      p('M12 46 L6 20 L20 20 L42 44 Z') + p('M2 48 L36 47 L36 50 L4 51 Z') +
      p('M120 41 Q128 32 144 33 L150 40 Z', DIM) + p('M98 55 L150 54 L146 58 L102 59 Z') +
      p('M106 58 L168 56 Q184 60 168 66 L106 66 Z') + c(170, 61, 3, HOLE),
    f86f:
      p('M10 50 L30 46 L160 42 Q196 43 208 46 L208 54 Q190 56 160 56 L36 54 Z') + p('M204 46 L210 46 L210 54 L204 54 Z', HOLE) +
      p('M14 47 L4 17 L18 17 L52 44 Z') + p('M2 47 L32 46 L32 49 L4 50 Z') +
      p('M146 43 Q154 32 172 34 L180 43 Z', DIM) + p('M96 53 L148 52 L138 59 L104 59 Z') + r(4, 48, 8, 5, 1, HOLE),
    mig15:
      p('M12 50 L32 46 L150 43 Q190 43 206 46 L206 55 Q186 57 150 57 L40 55 Z') + p('M202 46 L208 46 L208 55 L202 55 Z', HOLE) +
      p('M16 47 L6 12 L22 12 L56 44 Z') + p('M4 26 L36 26 L36 29 L8 30 Z') +
      p('M150 44 Q158 34 174 36 L180 44 Z', DIM) + p('M104 54 L150 53 L140 60 L110 60 Z'),
    f4e:
      p('M6 52 L20 48 L168 44 Q200 45 224 50 Q206 55 180 57 L30 57 Z') +
      p('M10 49 L2 18 L18 18 L54 46 Z') + p('M4 60 L30 53 L32 56 L8 64 Z') +
      p('M148 45 Q158 34 180 35 Q188 38 192 45 Z', DIM) + r(128, 47, 16, 8, 2, HOLE) +
      p('M186 55 L218 52 L216 55 L188 58 Z') + p('M90 56 L150 54 L140 60 L96 61 Z') + p('M96 62 Q110 58 124 62 Q110 66 96 62 Z'),
    mig21:
      p('M8 50 L28 46 L170 43 L208 44 L208 56 L170 57 L30 54 Z') + p('M208 44 L224 50 L208 56 Z') + r(206, 44, 3, 12, 1, HOLE) +
      p('M100 44 L160 40 L172 43 Z') + p('M160 43 Q168 36 182 38 L186 43 Z', DIM) +
      p('M12 47 L2 12 L18 12 L58 44 Z') + p('M2 50 L28 49 L28 52 L4 53 Z') + p('M76 54 L140 52 L92 60 Z'),
    mirage2000:
      p('M10 50 L26 46 L160 42 Q200 44 226 50 Q200 54 160 56 L30 54 Z') +
      p('M12 47 L6 8 L22 8 L66 45 Z') + p('M118 46 L140 45 L140 54 L118 54 Z', HOLE) + p('M140 45 L148 49.5 L140 54 Z') +
      p('M152 43 Q162 32 180 34 L188 43 Z', DIM) + p('M36 54 L132 50 L60 59 Z'),
    gripen:
      p('M10 50 L26 46 L160 42 Q198 44 222 50 Q198 54 160 56 L30 54 Z') +
      p('M12 47 L6 12 L22 12 L60 45 Z') + p('M122 46 L140 46 L140 54 L122 54 Z', HOLE) + p('M130 44 L156 42 L146 46 L132 47 Z') +
      p('M152 43 Q162 33 180 35 L188 43 Z', DIM) + p('M40 54 L128 50 L64 59 Z'),
    su27:
      p('M6 50 L26 46 L150 41 Q170 36 186 38 Q210 44 230 50 Q210 52 190 54 L30 54 Z') +
      p('M20 54 L152 54 L152 62 L40 62 Z') + r(148, 54, 6, 8, 1, HOLE) +
      p('M24 46 L20 14 L32 14 L62 44 Z', DIM) + p('M12 46 L6 10 L20 10 L52 44 Z') + p('M2 52 L34 51 L34 54 L4 56 Z') +
      p('M168 38 Q178 29 196 33 L204 41 Z', DIM) + p('M70 54 L140 52 L96 60 Z'),

    /* =================== HÉLICOPTÈRES =================== */
    ah64a:
      p('M50 54 L60 44 L98 40 L150 42 Q176 46 186 55 L184 61 L150 65 L70 65 Z') +
      p('M54 49 L12 44 L10 50 L54 58 Z') + p('M8 50 L4 24 L16 26 L18 50 Z') + p('M2 52 L26 52 L26 55 L4 56 Z') +
      c(12, 32, 10, ' fill="none" stroke="currentColor" stroke-width="1.4" stroke-opacity=".5"') +
      p('M138 43 L148 32 L166 34 L178 47 Z', DIM) + p('M160 48 L172 47 L182 56 L166 56 Z', DIM) +
      r(104, 27, 6, 15) + r(16, 24, 190, 2.8, 1.4, DIM) + p('M84 42 L130 42 L130 50 L88 50 Z') +
      r(90, 56, 42, 4, 1.5) + r(94, 61, 30, 3, 1.5, DIM) + p('M168 62 L190 64 L190 66 L168 67 Z') +
      p('M84 66 L80 74 M150 66 L154 74', ' stroke="currentColor" stroke-width="2"') + r(74, 73, 12, 2.5, 1) + r(148, 73, 12, 2.5, 1),
    mi24v:
      p('M58 50 Q62 40 100 38 L150 38 Q172 40 192 52 Q194 60 184 64 L72 66 Z') +
      p('M60 46 L14 44 L12 50 L60 56 Z') + p('M12 48 L6 22 L18 24 L22 48 Z') +
      c(12, 34, 10, ' fill="none" stroke="currentColor" stroke-width="1.4" stroke-opacity=".5"') +
      p('M160 42 Q168 30 182 36 L188 48 Z', DIM) + p('M142 40 Q148 30 160 32 L164 40 Z', DIM) +
      r(104, 26, 6, 13) + r(10, 23, 200, 2.8, 1.4, DIM) + p('M82 38 L140 38 L136 30 L90 30 Z') +
      p('M88 56 L134 56 L138 64 L84 64 Z') + r(88, 64, 12, 4, 1, DIM) + r(120, 64, 12, 4, 1, DIM) + r(102, 48, 18, 8, 1, DIM),

    /* =================== MARINE =================== */
    fletcher: // 2 cheminées, 5 tourelles simples de 127 mm
      p('M2 58 L230 52 L220 70 L14 70 Z') + p('M150 52 L150 38 L176 38 L180 52 Z') + r(158, 26, 12, 12) + r(163, 6, 2.4, 20) +
      r(114, 34, 10, 20, 2) + r(92, 36, 10, 18, 2) + p('M190 52 L192 44 L206 44 L210 52 Z') + gun(206, 47, 14, 1.8) +
      p('M170 44 L174 38 L186 38 L188 44 Z') + gun(186, 40.5, 12, 1.8) + p('M20 56 L22 48 L36 48 L40 56 Z') + gun(10, 51, 12, 1.8) +
      p('M44 55 L46 47 L60 47 L62 55 Z') + p('M66 54 L68 46 L82 46 L84 54 Z') + r(126, 49, 18, 4, 2),
    belfast: // 4 tourelles triples de 152 mm, 2 cheminées, mâts tripodes
      p('M2 58 L232 50 L222 72 L14 72 Z') + p('M120 50 L122 32 L160 32 L166 50 Z') + r(132, 18, 14, 14) + r(138, 2, 2.4, 16) +
      r(100, 26, 11, 26, 2) + r(80, 28, 11, 24, 2) + r(64, 12, 2.4, 40) +
      p('M178 50 L180 40 L200 40 L204 50 Z') + gun(200, 43, 18, 2) + p('M160 36 L162 28 L180 28 L182 36 Z') + gun(180, 31, 16, 2) +
      p('M20 57 L22 47 L42 47 L46 57 Z') + gun(6, 50, 16, 2) + p('M44 50 L46 40 L64 40 L68 50 Z') + gun(30, 43, 16, 2),
    s100: // Schnellboot : coque basse, passerelle blindée, tubes à l'avant
      p('M10 60 L222 52 Q218 60 206 68 L24 68 Z') + p('M104 52 L108 40 L136 40 L142 52 Z') + r(118, 26, 3, 14) +
      r(150, 48, 44, 5, 2.5) + r(40, 50, 16, 6, 2) + gun(56, 50, 14, 1.6) + r(84, 50, 10, 6, 2),
    tashkent: // conducteur de flottille : 3 tourelles doubles de 130 mm
      p('M2 58 L232 52 L222 70 L14 70 Z') + p('M156 52 L158 38 L182 38 L186 52 Z') + r(164, 24, 12, 14) + r(169, 6, 2.4, 18) +
      r(118, 34, 11, 20, 2) + r(98, 34, 11, 20, 2) + p('M192 52 L194 42 L212 42 L216 52 Z') + gun(212, 46, 14, 2) +
      p('M20 56 L22 46 L40 46 L44 56 Z') + gun(8, 50, 14, 2) + p('M48 54 L50 44 L68 44 L72 54 Z') + r(132, 48, 20, 4, 2),
  };

  /* alias génériques utilisés dans les décors */
  Object.assign(S, {
    fighter: S.spitfire9, jet: S.f86f, bomber: S.b17g, attacker: S.il2,
    tank: S.t3485, heavy: S.tiger1, td: S.jagdpanther, mbt: S.leo2a6, stank: S.strv103,
    heli: S.ah64a, ship: S.fletcher, boat: S.s100,
  });
  return S;
})();
