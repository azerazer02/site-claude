/* ==========================================================================
   Académie — quiz de promotion (le simulateur est dans simulateur.js)
   ========================================================================== */
(() => {
  const $ = s => document.querySelector(s);

  /* ======================= QUIZ ======================= */
  const Q = [
    { q: 'Combien de nations jouables compte War Thunder ?', o: ['7', '8', '10', '12'], a: 2,
      e: "Dix nations : États-Unis, Allemagne, URSS, Royaume-Uni, Japon, Chine, Italie, France, Suède et Israël." },
    { q: 'Une plaque de 100 mm inclinée à 60° offre une épaisseur effective d’environ…', o: ['115 mm', '150 mm', '200 mm', '300 mm'], a: 2,
      e: 'Géométriquement, 1 / cos(60°) = 2 : l’obus traverse 200 mm d’acier. Dans le jeu, des tables affinent encore ce chiffre selon le type d’obus et son calibre (voir le simulateur).' },
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
