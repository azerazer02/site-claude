/* ==========================================================================
   LIGNE DE FRONT — données partagées (nations, véhicules, silhouettes, radar)
   ========================================================================== */
window.WT = (() => {

  /* ---------- Drapeaux (SVG simplifiés, viewBox 30x20) ---------- */
  const flags = {
    usa: `<rect width="30" height="20" fill="#b22234"/>${[1,3,5,7,9,11].map(i=>`<rect y="${i*20/13}" width="30" height="${20/13}" fill="#fff"/>`).join('')}<rect width="13" height="${20*7/13}" fill="#3c3b6e"/>${Array.from({length:12},(_,i)=>`<circle cx="${1.8+(i%4)*3.1}" cy="${1.7+Math.floor(i/4)*3.3}" r=".55" fill="#fff"/>`).join('')}`,
    de: `<rect width="30" height="7" fill="#111"/><rect y="6.66" width="30" height="6.7" fill="#dd0000"/><rect y="13.33" width="30" height="6.67" fill="#ffce00"/>`,
    ussr: `<rect width="30" height="20" fill="#cc0000"/><path d="M6 2.2l.9 2.7h2.8l-2.3 1.7.9 2.7L6 7.6 3.7 9.3l.9-2.7-2.3-1.7h2.8z" fill="#ffd700"/>`,
    uk: `<rect width="30" height="20" fill="#012169"/><path d="M0 0L30 20M30 0L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0L30 20M30 0L0 20" stroke="#c8102e" stroke-width="1.4"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6"/><path d="M15 0v20M0 10h30" stroke="#c8102e" stroke-width="3.4"/>`,
    jp: `<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#bc002d"/>`,
    cn: `<rect width="30" height="20" fill="#de2910"/><path d="M5 2l1.2 3.5h3.7l-3 2.2 1.1 3.5L5 9l-3 2.2 1.1-3.5-3-2.2h3.7z" fill="#ffde00"/>${[[10,2],[12,4],[12,7],[10,9]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r=".8" fill="#ffde00"/>`).join('')}`,
    it: `<rect width="10" height="20" fill="#009246"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ce2b37"/>`,
    fr: `<rect width="10" height="20" fill="#0055a4"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ef4135"/>`,
    se: `<rect width="30" height="20" fill="#006aa7"/><rect x="8.5" width="4" height="20" fill="#fecc00"/><rect y="8" width="30" height="4" fill="#fecc00"/>`,
    il: `<rect width="30" height="20" fill="#fff"/><rect y="2" width="30" height="2.4" fill="#0038b8"/><rect y="15.6" width="30" height="2.4" fill="#0038b8"/><path d="M15 6.1l3.3 5.7h-6.6zM15 13.9l-3.3-5.7h6.6z" fill="none" stroke="#0038b8" stroke-width=".8"/>`,
  };
  const flag = (id, cls = 'flag') =>
    `<svg class="${cls}" viewBox="0 0 30 20" preserveAspectRatio="none" aria-hidden="true">${flags[id] || ''}</svg>`;

  /* ---------- Nations ---------- */
  const nations = [
    { id:'usa',  name:'États-Unis',   short:'USA', color:'#5b8def',
      doctrine:'Puissance industrielle et polyvalence',
      text:"Des chasseurs rapides à haute altitude, des chars fiables et bien équipés, une artillerie navale redoutable. L'arbre américain récompense la patience : stabilisateurs précoces, excellentes munitions et une aviation embarquée d'exception.",
      tags:['Énergie & altitude','Stabilisateurs','Mitrailleuses .50'],
      power:{ air:92, sol:80, mer:85, heli:84 } },
    { id:'de',   name:'Allemagne',    short:'GER', color:'#e0b43a',
      doctrine:'Précision et puissance de feu',
      text:"Canons à haute vélocité, optiques remarquables et blindages lourds : les chars allemands dominent à distance. Côté ciel, les Bf 109 et Fw 190 excellent en attaque plongeante, avant l'arrivée des premiers chasseurs à réaction.",
      tags:['Tir à longue portée','Canons de 88 mm','Chasseurs à réaction'],
      power:{ air:85, sol:94, mer:60, heli:70 } },
    { id:'ussr', name:'URSS / Russie', short:'URSS', color:'#e8483b',
      doctrine:'Masse, robustesse et gros calibres',
      text:"Profils bas, blindages inclinés et canons massifs : les chars soviétiques encaissent et frappent fort. L'aviation mise sur la maniabilité à basse altitude, puis sur des jets et missiles parmi les plus redoutés du jeu.",
      tags:['Blindage incliné','Calibres 122–125 mm','Combat à basse altitude'],
      power:{ air:88, sol:92, mer:74, heli:86 } },
    { id:'uk',   name:'Royaume-Uni',  short:'UK',  color:'#8fb6ff',
      doctrine:'Maniabilité et innovation',
      text:"Des Spitfire d'une agilité légendaire, des obus APDS précoces qui transpercent tout, et une Royal Navy imposante. Les chars britanniques demandent de la finesse mais récompensent le tir précis.",
      tags:['Obus APDS / HESH','Virage serré','Royal Navy'],
      power:{ air:86, sol:78, mer:88, heli:62 } },
    { id:'jp',   name:'Japon',        short:'JPN', color:'#ff5d73',
      doctrine:'Agilité extrême et marine impériale',
      text:"Des chasseurs ultra-maniables comme le Zero, une flotte de destroyers torpilleurs redoutable et des chars modernes parmi les plus mobiles. Un arbre exigeant, fait pour les joueurs qui aiment surprendre.",
      tags:['Dogfight tournant','Torpilles longue portée','Chars modernes agiles'],
      power:{ air:84, sol:70, mer:90, heli:66 } },
    { id:'cn',   name:'Chine',        short:'CHN', color:'#ff8a3d',
      doctrine:'Arsenal hybride et modernité',
      text:"Un arbre mêlant matériel d'origine américaine, soviétique et développements nationaux. Au sommet, les ZTZ99 et chasseurs J-10 offrent une puissance moderne de premier plan.",
      tags:['Mélange de doctrines','Chars ZTZ','Puissance moderne'],
      power:{ air:76, sol:84, mer:62, heli:72 } },
    { id:'it',   name:'Italie',       short:'ITA', color:'#3fbf6f',
      doctrine:'Vitesse et élégance',
      text:"Des chasseurs racés, des vedettes lance-torpilles rapides et des véhicules à roues pleins de caractère comme le Centauro. L'Italie brille par la mobilité et les embuscades.",
      tags:['Véhicules à roues','Vedettes rapides','Chasseurs racés'],
      power:{ air:78, sol:76, mer:80, heli:64 } },
    { id:'fr',   name:'France',       short:'FRA', color:'#4f8dff',
      doctrine:'Mobilité et chargeurs automatiques',
      text:"Des chars légers à chargeur-barillet capables de vider leur tambour en quelques secondes, le Leclerc au sommet et une aviation Dassault emblématique, du Mystère au Mirage 2000.",
      tags:['Chargeurs à barillet','Dassault Mirage','Mobilité élevée'],
      power:{ air:84, sol:80, mer:70, heli:74 } },
    { id:'se',   name:'Suède',        short:'SWE', color:'#ffd43b',
      doctrine:'Ingéniosité et conceptions uniques',
      text:"Le char sans tourelle Strv 103, les Saab Draken, Viggen et Gripen : la Suède regorge de machines atypiques, conçues pour la défense d'un territoire exigeant.",
      tags:['Strv 103 sans tourelle','Saab Gripen','Conceptions atypiques'],
      power:{ air:82, sol:82, mer:58, heli:60 } },
    { id:'il',   name:'Israël',       short:'ISR', color:'#7fb2ff',
      doctrine:'Protection de l’équipage avant tout',
      text:"Des Merkava pensés pour la survie de l'équipage, des Sherman modernisés et une aviation au combat éprouvée. Un arbre compact mais très compétitif au haut rang.",
      tags:['Merkava','Survivabilité','Chasseurs éprouvés'],
      power:{ air:86, sol:84, mer:40, heli:78 } },
  ];
  const nationById = Object.fromEntries(nations.map(n => [n.id, n]));

  /* ---------- Silhouettes (voir silhouettes.js) ---------- */
  const sil = window.WT_SIL || {};
  const silhouette = (key, cls = 'sil') =>
    `<svg class="${cls}" viewBox="0 0 240 100" fill="currentColor" aria-hidden="true">${sil[key] || sil.tank || ''}</svg>`;

  /* ---------- Cotes de bataille officielles ----------
     Générées par tools/maj_br.py à partir des fichiers du jeu (War-Thunder-Datamine).
     Format : id → [rang, BR Arcade, BR Réaliste, BR Simulation, premium]
     Ne pas modifier à la main : relancer le script après une mise à jour du jeu. */
  /* BR:START */
  const GAME_VERSION = '2.59.0.29';
  const BR = {
    a6m2:[2, 3.7, 3.7, 3.3, 0],
    il2:[2, 2.7, 2.3, 2.3, 0],
    spitfire9:[3, 4.3, 4.7, 4.7, 0],
    bf109g6:[4, 5.3, 4.7, 4.7, 0],
    yak3:[3, 4.7, 4.7, 4.7, 0],
    p51d:[3, 4.0, 4.0, 5.0, 0],
    b17g:[4, 5.0, 5.0, 6.3, 0],
    me262:[5, 7.3, 7.0, 7.0, 0],
    mig15:[5, 8.7, 8.3, 8.7, 0],
    f86f:[5, 8.0, 8.3, 8.7, 0],
    f4e:[7, 11.3, 11.3, 10.7, 0],
    mig21:[7, 10.3, 10.3, 10.7, 0],
    mirage2000:[8, 12.3, 12.3, 12.7, 0],
    su27:[8, 13.3, 13.0, 13.3, 0],
    gripen:[8, 13.7, 13.7, 13.7, 0],
    m13_40:[1, 2.0, 2.0, 2.0, 0],
    pz4f2:[2, 3.3, 3.3, 3.3, 0],
    m4a1:[2, 3.7, 3.7, 3.7, 0],
    kv1:[3, 4.7, 4.7, 4.7, 0],
    cromwell5:[3, 3.7, 4.0, 4.0, 0],
    chito:[3, 4.7, 4.7, 4.7, 0],
    t3485:[3, 5.7, 5.7, 5.7, 0],
    m4a3e8:[3, 5.3, 5.7, 5.7, 0],
    churchill7:[3, 5.0, 5.0, 5.0, 0],
    tiger1:[3, 5.7, 5.7, 5.7, 0],
    m18:[3, 5.3, 6.0, 6.0, 0],
    arl44:[3, 5.3, 5.3, 5.3, 0],
    panther:[4, 6.0, 6.0, 6.0, 0],
    is2:[4, 6.0, 6.0, 6.0, 0],
    jagdpanther:[4, 6.3, 6.3, 6.3, 0],
    tiger2:[4, 7.0, 6.7, 6.7, 0],
    m26:[4, 6.7, 6.7, 6.7, 0],
    is3:[5, 7.3, 7.3, 7.3, 0],
    maus:[5, 8.0, 7.7, 7.7, 0],
    centurion3:[4, 7.7, 7.7, 7.7, 0],
    t54:[5, 8.0, 8.0, 8.0, 0],
    amx13:[4, 6.7, 7.0, 7.0, 0],
    type59:[5, 8.0, 8.0, 8.0, 0],
    t62:[6, 8.7, 8.7, 8.7, 0],
    m60a1:[6, 8.3, 8.3, 8.3, 0],
    leo1:[5, 8.0, 8.0, 8.0, 0],
    zsu234:[6, 8.0, 8.0, 8.0, 0],
    strv103:[6, 8.7, 9.0, 9.0, 0],
    type74:[6, 9.0, 9.0, 9.0, 0],
    gepard:[6, 8.3, 8.3, 8.3, 0],
    t64b:[7, 10.3, 10.3, 10.3, 0],
    t80b:[7, 10.7, 10.7, 10.7, 0],
    t72a:[6, 9.3, 9.3, 9.3, 0],
    amx30b2:[6, 8.7, 8.7, 8.7, 0],
    chieftain10:[6, 9.0, 9.3, 9.3, 0],
    shotkal:[6, 8.7, 8.7, 8.7, 0],
    m1:[7, 10.7, 10.7, 10.7, 0],
    leo2a4:[7, 10.7, 10.7, 10.7, 0],
    t80u:[7, 11.7, 11.7, 11.7, 0],
    merkava3:[7, 11.3, 11.3, 11.3, 0],
    type90:[7, 11.7, 11.7, 11.7, 0],
    centauro:[6, 9.3, 9.3, 9.3, 0],
    m1a2:[7, 12.0, 12.0, 12.0, 0],
    leclerc:[8, 12.7, 12.7, 12.7, 0],
    strv122:[8, 12.7, 12.7, 12.7, 0],
    ariete:[7, 11.7, 11.7, 11.7, 0],
    chally2:[7, 11.7, 11.7, 11.7, 0],
    leo2a6:[8, 12.7, 12.7, 12.7, 0],
    merkava4:[8, 12.3, 12.3, 12.3, 0],
    t90a:[7, 11.0, 11.0, 11.0, 0],
    ztz96a:[7, 10.3, 10.3, 10.3, 0],
    ztz99a:[8, 12.3, 12.3, 12.3, 0],
    type10:[8, 12.7, 12.7, 12.7, 0],
    leo2a7v:[8, 12.7, 12.7, 12.7, 0],
    t90m:[8, 12.7, 12.7, 12.7, 0],
    mi24v:[6, 10.0, 9.7, 9.7, 0],
    ah64a:[6, 10.3, 11.3, 10.3, 0],
    s100:[2, 2.3, 2.3, 2.3, 0],
    fletcher:[2, 4.7, 4.7, 4.7, 0],
    tashkent:[3, 5.0, 5.0, 5.0, 0],
    belfast:[4, 6.0, 6.0, 6.0, 1],
  };
  /* BR:END */

  /* ---------- Véhicules ----------
     dm = identifiant du véhicule dans les fichiers du jeu.
     stats : feu, prot, mob, vit, polyv (appréciation éditoriale sur 100). */
  const T = { air:'Aviation', sol:'Blindés', heli:'Hélicoptères', mer:'Marine' };
  const vehicles = [
    // ================= AVIATION =================
    { id:'a6m2', dm:'a6m2_zero', name:'A6M2 Zero', nation:'jp', type:'air', role:'Chasseur embarqué', year:1940, speed:'533 km/h', arm:'2 × 20 mm Type 99, 2 × 7,7 mm', prot:'Aucune',
      desc:"Allonge et agilité inégalées en 1941, au prix d'une protection inexistante. En combat tournant, peu d'avions peuvent le suivre.",
      stats:{feu:56,prot:8,mob:98,vit:48,polyv:62} },
    { id:'il2', dm:'il_2_1941', name:'IL-2 (1941)', nation:'ussr', type:'air', role:'Avion d’attaque', year:1941, speed:'414 km/h', arm:'2 × 23 mm VYa, 2 × 7,62 mm, roquettes, bombes', prot:'Caisson blindé intégral',
      desc:"Le « char volant » : moteur et équipage enfermés dans une baignoire blindée. Il pilonne les colonnes blindées et encaisse un feu nourri.",
      stats:{feu:74,prot:82,mob:34,vit:30,polyv:70} },
    { id:'spitfire9', dm:'spitfire_ix_early', name:'Spitfire F Mk IX', nation:'uk', type:'air', role:'Chasseur', year:1942, speed:'657 km/h', arm:'2 × 20 mm Hispano, 4 × 7,7 mm', prot:'Pare-brise blindé, plaque dorsale',
      desc:"Réponse directe au Fw 190, le Mk IX associe le moteur Merlin 61 à compresseur deux étages à la cellule la plus agile de la guerre. Un tourneur redoutable.",
      stats:{feu:62,prot:28,mob:95,vit:70,polyv:66} },
    { id:'bf109g6', dm:'bf-109g-6', name:'Bf 109 G-6', nation:'de', type:'air', role:'Chasseur', year:1943, speed:'630 km/h', arm:'1 × 20 mm MG 151, 2 × 13 mm MG 131', prot:'Vitre et appui-tête blindés',
      desc:"Le « Gustav » le plus produit de la famille Messerschmitt. Excellent grimpeur, il brille en tactique « boom & zoom » : piquer, tirer, remonter.",
      stats:{feu:64,prot:30,mob:78,vit:72,polyv:70} },
    { id:'yak3', dm:'yak-3', name:'Yak-3', nation:'ussr', type:'air', role:'Chasseur léger', year:1944, speed:'655 km/h', arm:'1 × 20 mm ShVAK, 2 × 12,7 mm UBS', prot:'Plaque blindée arrière',
      desc:"L'un des chasseurs les plus légers de la guerre. À basse altitude, son rapport poids/puissance lui permet de surclasser presque tout ce qui vole.",
      stats:{feu:58,prot:24,mob:94,vit:74,polyv:60} },
    { id:'p51d', dm:'p-51d-5', name:'P-51D-5 Mustang', nation:'usa', type:'air', role:'Chasseur d’escorte', year:1944, speed:'703 km/h', arm:'6 × 12,7 mm M2 Browning', prot:'Plaque blindée de siège',
      desc:"Autonomie exceptionnelle, verrière bulle et vitesse en piqué remarquable : le Mustang a escorté les bombardiers jusqu'à Berlin. Un maître du combat en énergie.",
      stats:{feu:60,prot:30,mob:74,vit:82,polyv:78} },
    { id:'b17g', dm:'b-17g', name:'B-17G Flying Fortress', nation:'usa', type:'air', role:'Bombardier lourd', year:1943, speed:'462 km/h', arm:'13 × 12,7 mm, jusqu’à 7 800 kg de bombes', prot:'Blindage d’équipage, réservoirs auto-obturants',
      desc:"Une forteresse volante hérissée de mitrailleuses. Capable d'encaisser des dégâts spectaculaires et de raser une base entière à elle seule.",
      stats:{feu:84,prot:70,mob:18,vit:40,polyv:44} },
    { id:'me262', dm:'me-262a-1a', name:'Me 262 A-1a', nation:'de', type:'air', role:'Chasseur à réaction', year:1944, speed:'870 km/h', arm:'4 × 30 mm MK 108', prot:'Pare-brise blindé',
      desc:"Premier chasseur à réaction opérationnel de l'histoire. Ses quatre canons de 30 mm désintègrent n'importe quel bombardier en une rafale.",
      stats:{feu:90,prot:34,mob:40,vit:92,polyv:54} },
    { id:'mig15', dm:'mig-15', name:'MiG-15bis', nation:'ussr', type:'air', role:'Chasseur à réaction', year:1950, speed:'1 076 km/h', arm:'1 × 37 mm N-37D, 2 × 23 mm NR-23', prot:'Plaques blindées',
      desc:"Conçu pour abattre les bombardiers, il surprend l'Occident au-dessus de la Corée. Montée foudroyante et obus explosifs dévastateurs.",
      stats:{feu:82,prot:32,mob:80,vit:84,polyv:58} },
    { id:'f86f', dm:'f-86f-25', name:'F-86F-25 Sabre', nation:'usa', type:'air', role:'Chasseur à réaction', year:1953, speed:'1 106 km/h', arm:'6 × 12,7 mm M3', prot:'Blindage de siège',
      desc:"Icône de la guerre de Corée, rival historique du MiG-15. Ailes en flèche, commandes hydrauliques et viseur à télémètre radar.",
      stats:{feu:58,prot:30,mob:84,vit:86,polyv:66} },
    { id:'f4e', dm:'f-4e', name:'F-4E Phantom II', nation:'usa', type:'air', role:'Chasseur multirôle', year:1967, speed:'Mach 2,2', arm:'1 × 20 mm M61A1, AIM-7, AIM-9, bombes', prot:'—',
      desc:"Le « Rhino » : puissant, lourd, polyvalent. Le modèle E ajoute enfin le canon interne qui manquait à ses prédécesseurs au Vietnam.",
      stats:{feu:86,prot:28,mob:56,vit:94,polyv:92} },
    { id:'mig21', dm:'mig-21_smt', name:'MiG-21SMT', nation:'ussr', type:'air', role:'Intercepteur', year:1971, speed:'Mach 2,05', arm:'1 × 23 mm GSh-23L, R-60, R-3', prot:'—',
      desc:"L'avion supersonique le plus produit de l'histoire. Léger, vif et redoutable en accélération, au prix d'une autonomie très limitée.",
      stats:{feu:70,prot:22,mob:72,vit:95,polyv:66} },
    { id:'mirage2000', dm:'mirage_2000c_s5', name:'Mirage 2000C-S5', nation:'fr', type:'air', role:'Chasseur multirôle', year:1984, speed:'Mach 2,2', arm:'2 × 30 mm DEFA 554, Magic 2, Super 530', prot:'—',
      desc:"Aile delta à commandes de vol électriques : le Mirage 2000 conserve une énergie remarquable en virage et frappe fort avec ses canons de 30 mm.",
      stats:{feu:84,prot:24,mob:88,vit:94,polyv:88} },
    { id:'su27', dm:'su_27', name:'Su-27', nation:'ussr', type:'air', role:'Chasseur de supériorité', year:1985, speed:'Mach 2,35', arm:'1 × 30 mm GSh-30-1, R-27, R-73', prot:'—',
      desc:"Le « Flanker » : maniabilité extraordinaire, grande autonomie et missiles puissants. Un géant capable de figures qui semblent défier la physique.",
      stats:{feu:90,prot:26,mob:94,vit:96,polyv:84} },
    { id:'gripen', dm:'saab_jas39c', name:'JAS39C Gripen', nation:'se', type:'air', role:'Chasseur multirôle', year:2002, speed:'Mach 2', arm:'1 × 27 mm BK 27, missiles air-air', prot:'—',
      desc:"Compact, agile et bourré d'électronique, le Gripen est pensé pour opérer depuis des routes. Une machine moderne d'une efficacité redoutable.",
      stats:{feu:88,prot:24,mob:92,vit:92,polyv:96} },

    // ================= BLINDÉS — Seconde Guerre mondiale =================
    { id:'m13_40', dm:'it_m13_40_serie_3', name:'M13/40 (III)', nation:'it', type:'sol', role:'Char moyen', year:1940, speed:'32 km/h', arm:'Canon 47 mm 47/32', prot:'30 mm riveté',
      desc:"Le char italien de la campagne d'Afrique du Nord : caisse rivetée, quatre hommes d'équipage et un canon de 47 mm efficace contre les blindés légers.",
      stats:{feu:40,prot:30,mob:44,vit:34,polyv:52} },
    { id:'pz4f2', dm:'germ_pzkpfw_IV_ausf_F2', name:'Pz.IV F2', nation:'de', type:'sol', role:'Char moyen', year:1942, speed:'40 km/h', arm:'Canon 75 mm KwK 40 L/43', prot:'50 mm frontal',
      desc:"Le « Mark IV Special » des Britanniques : le premier Panzer IV à canon long transforme le cheval de trait de la Panzerwaffe en chasseur de T-34.",
      stats:{feu:64,prot:40,mob:58,vit:52,polyv:76} },
    { id:'m4a1', dm:'us_m4a1_1942_sherman', name:'M4A1 Sherman', nation:'usa', type:'sol', role:'Char moyen', year:1942, speed:'39 km/h', arm:'Canon 75 mm M3', prot:'Caisse moulée 51 mm',
      desc:"La version à caisse moulée arrondie du Sherman. Stabilisateur vertical, bon obus explosif et fiabilité exemplaire : la base de la victoire alliée.",
      stats:{feu:52,prot:46,mob:60,vit:56,polyv:84} },
    { id:'kv1', dm:'ussr_kv_1_zis_5', name:'KV-1 (ZiS-5)', nation:'ussr', type:'sol', role:'Char lourd', year:1941, speed:'35 km/h', arm:'Canon 76 mm ZiS-5', prot:'75 mm + surblindage',
      desc:"En 1941, les canons allemands rebondissaient sur son blindage. Lent et lourd, le KV-1 reste une forteresse capable de tenir un carrefour à lui seul.",
      stats:{feu:56,prot:70,mob:34,vit:32,polyv:58} },
    { id:'cromwell5', dm:'uk_a27m_cromwell_5', name:'Cromwell V', nation:'uk', type:'sol', role:'Char de croisière', year:1944, speed:'64 km/h', arm:'Canon 75 mm OQF Mk V', prot:'76 mm frontal',
      desc:"L'un des chars les plus rapides de la guerre grâce à son moteur Meteor dérivé du Merlin. Parfait pour contourner l'ennemi et frapper les flancs.",
      stats:{feu:50,prot:42,mob:86,vit:86,polyv:66} },
    { id:'chito', dm:'jp_type_4_chi_to', name:'Chi-To', nation:'jp', type:'sol', role:'Char moyen', year:1944, speed:'45 km/h', arm:'Canon 75 mm Type 5', prot:'75 mm frontal',
      desc:"Le char le plus abouti du Japon impérial, doté d'un 75 mm dérivé d'un canon antiaérien. Construit à une poignée d'exemplaires seulement.",
      stats:{feu:66,prot:48,mob:62,vit:60,polyv:64} },
    { id:'t3485', dm:'ussr_t_34_85_zis_53', name:'T-34-85', nation:'ussr', type:'sol', role:'Char moyen', year:1944, speed:'55 km/h', arm:'Canon 85 mm ZiS-S-53', prot:'Tourelle 90 mm, caisse 45 mm inclinée',
      desc:"Évolution du T-34, doté d'une tourelle trois hommes et d'un canon de 85 mm. Le char le plus produit de la guerre, fiable et polyvalent.",
      stats:{feu:68,prot:56,mob:74,vit:66,polyv:78} },
    { id:'m4a3e8', dm:'us_m4a3e8_76w_sherman', name:'M4A3 (76) W « Easy Eight »', nation:'usa', type:'sol', role:'Char moyen', year:1944, speed:'48 km/h', arm:'Canon 76 mm M1A2', prot:'Glacis 63 mm à 47°',
      desc:"Suspension HVSS, canon de 76 mm et stabilisateur vertical. Un Sherman abouti, confortable et précis en mouvement.",
      stats:{feu:64,prot:54,mob:66,vit:60,polyv:82} },
    { id:'churchill7', dm:'uk_a_22f_mk_7_churchill_1944', name:'Churchill VII', nation:'uk', type:'sol', role:'Char d’infanterie', year:1944, speed:'21 km/h', arm:'Canon 75 mm OQF', prot:'152 mm frontal',
      desc:"Lent mais incroyablement blindé, le Churchill VII grimpe partout grâce à ses chenilles enveloppantes. Un bouclier pour l'infanterie.",
      stats:{feu:50,prot:84,mob:32,vit:20,polyv:60} },
    { id:'tiger1', dm:'germ_pzkpfw_VI_ausf_h1_tiger', name:'Tiger H1', nation:'de', type:'sol', role:'Char lourd', year:1942, speed:'45 km/h', arm:'Canon 88 mm KwK 36', prot:'100 mm frontal, 80 mm flancs',
      desc:"Le char le plus redouté de la Seconde Guerre mondiale. Son 88 mm d'une précision chirurgicale et son épais blindage en font un roc sur le champ de bataille.",
      stats:{feu:82,prot:78,mob:40,vit:42,polyv:60} },
    { id:'m18', dm:'us_m18_hellcat', name:'M18 GMC Hellcat', nation:'usa', type:'sol', role:'Chasseur de chars', year:1944, speed:'jusqu’à 88 km/h', arm:'Canon 76 mm M1A1', prot:'13 mm, tourelle ouverte',
      desc:"Le blindé à chenilles le plus rapide de la guerre. Presque sans blindage, il mise tout sur la vitesse pour frapper et disparaître.",
      stats:{feu:66,prot:14,mob:96,vit:98,polyv:52} },
    { id:'arl44', dm:'fr_arl_44', name:'ARL-44', nation:'fr', type:'sol', role:'Char lourd', year:1950, speed:'37 km/h', arm:'Canon 90 mm DCA 45', prot:'120 mm frontal',
      desc:"Premier char lourd français d'après-guerre, conçu dans la clandestinité pendant l'Occupation. Son train de roulement hérite directement du B1 bis.",
      stats:{feu:74,prot:64,mob:36,vit:36,polyv:52} },
    { id:'panther', dm:'germ_pzkpfw_V_ausf_a_panther', name:'Panther A', nation:'de', type:'sol', role:'Char moyen', year:1943, speed:'46 km/h', arm:'Canon 75 mm KwK 42 L/70', prot:'Glacis 80 mm à 55°',
      desc:"Considéré comme l'un des meilleurs chars de la guerre : son long 75 mm perce à grande distance et son glacis incliné fait ricocher de nombreux obus.",
      stats:{feu:84,prot:66,mob:64,vit:62,polyv:74} },
    { id:'is2', dm:'ussr_is_2_1943', name:'IS-2', nation:'ussr', type:'sol', role:'Char lourd', year:1944, speed:'37 km/h', arm:'Canon 122 mm D-25T', prot:'Tourelle 100 mm, caisse 120 mm',
      desc:"Char de percée armé d'un canon de 122 mm dont les obus explosifs pulvérisent tout ce qu'ils touchent. Le rechargement est lent : chaque tir doit compter.",
      stats:{feu:92,prot:74,mob:38,vit:36,polyv:56} },
    { id:'jagdpanther', dm:'germ_panzerjager_panther', name:'Jagdpanther G1', nation:'de', type:'sol', role:'Chasseur de chars', year:1944, speed:'46 km/h', arm:'Canon 88 mm PaK 43/3 L/71', prot:'Casemate 80 mm à 55°',
      desc:"Le 88 mm long du Tiger II sur un châssis de Panther : un chasseur de chars d'élite, discret et mortel à toute distance.",
      stats:{feu:90,prot:68,mob:56,vit:52,polyv:44} },
    { id:'tiger2', dm:'germ_pzkpfw_VI_ausf_b_tiger_IIh', name:'Tiger II', nation:'de', type:'sol', role:'Char lourd', year:1944, speed:'41 km/h', arm:'Canon 88 mm KwK 43 L/71', prot:'Glacis 150 mm à 50°, tourelle 180 mm',
      desc:"Le « Königstiger » : un glacis quasi invulnérable de face et le 88 mm le plus puissant de la guerre. Son poids de 68 tonnes pèse lourd sur sa mobilité.",
      stats:{feu:90,prot:86,mob:34,vit:38,polyv:54} },
    { id:'m26', dm:'us_m26_pershing', name:'M26 Pershing', nation:'usa', type:'sol', role:'Char lourd', year:1945, speed:'40 km/h', arm:'Canon 90 mm M3', prot:'Glacis 102 mm à 46°',
      desc:"La réponse américaine au Tiger, arrivée à la toute fin de la guerre en Europe. Son 90 mm et sa suspension à barres de torsion annoncent les chars d'après-guerre.",
      stats:{feu:76,prot:66,mob:54,vit:50,polyv:74} },
    { id:'is3', dm:'ussr_is_3', name:'IS-3', nation:'ussr', type:'sol', role:'Char lourd', year:1945, speed:'40 km/h', arm:'Canon 122 mm D-25T', prot:'Nez en brochet, tourelle jusqu’à 220 mm',
      desc:"Présenté au défilé de la victoire à Berlin en 1945, l'IS-3 et sa tourelle en bol ont stupéfié les Alliés et inspiré toute une génération de chars.",
      stats:{feu:90,prot:84,mob:40,vit:40,polyv:56} },
    { id:'maus', dm:'germ_pzkpfw_Maus', name:'Maus', nation:'de', type:'sol', role:'Char super-lourd', year:1944, speed:'20 km/h', arm:'Canon 128 mm KwK 44 + 75 mm coaxial', prot:'Tourelle 240 mm, caisse 200 mm',
      desc:"188 tonnes : le plus lourd char jamais construit. Seuls deux prototypes ont roulé, mais sa tourelle reste l'une des plus épaisses du jeu.",
      stats:{feu:88,prot:96,mob:8,vit:12,polyv:40} },

    // ================= BLINDÉS — Guerre froide =================
    { id:'centurion3', dm:'uk_centurion_mk_3', name:'Centurion Mk 3', nation:'uk', type:'sol', role:'Char moyen', year:1948, speed:'35 km/h', arm:'Canon 84 mm Ordnance QF 20 livres', prot:'Tourelle 152 mm, glacis 76 mm',
      desc:"Arrivé trop tard pour la guerre, le Centurion devient l'un des chars les plus réussis de l'après-guerre. Stabilisé, précis, son APDS perce tout.",
      stats:{feu:78,prot:70,mob:48,vit:40,polyv:80} },
    { id:'t54', dm:'ussr_t_54_1951', name:'T-54 (1951)', nation:'ussr', type:'sol', role:'Char moyen', year:1951, speed:'50 km/h', arm:'Canon 100 mm D-10T', prot:'Tourelle 200 mm, glacis 100 mm à 60°',
      desc:"Tourelle en dôme, profil très bas et canon de 100 mm : la famille T-54/55 est devenue le char le plus produit de l'histoire.",
      stats:{feu:80,prot:74,mob:62,vit:58,polyv:74} },
    { id:'amx13', dm:'fr_amx_13_75', name:'AMX-13', nation:'fr', type:'sol', role:'Char léger', year:1953, speed:'60 km/h', arm:'Canon 75 mm SA 50, 2 barillets de 6 coups', prot:'40 mm max',
      desc:"Sa tourelle oscillante et ses barillets lui permettent de tirer une rafale de six obus en quelques secondes. Un char léger au succès mondial.",
      stats:{feu:72,prot:18,mob:84,vit:82,polyv:62} },
    { id:'type59', dm:'cn_type_59', name:'Type 59', nation:'cn', type:'sol', role:'Char moyen', year:1959, speed:'50 km/h', arm:'Canon 100 mm Type 59', prot:'Tourelle 200 mm',
      desc:"Version chinoise du T-54A, produite à des milliers d'exemplaires. Il équipera l'Armée populaire de libération pendant plusieurs décennies.",
      stats:{feu:78,prot:72,mob:60,vit:56,polyv:72} },
    { id:'t62', dm:'ussr_t_62', name:'T-62', nation:'ussr', type:'sol', role:'Char de combat', year:1961, speed:'50 km/h', arm:'Canon lisse 115 mm U-5TS', prot:'Tourelle 242 mm',
      desc:"Premier char de série au monde équipé d'un canon lisse. Ses obus-flèches à très haute vitesse surclassent les canons rayés de l'époque.",
      stats:{feu:84,prot:74,mob:60,vit:58,polyv:70} },
    { id:'m60a1', dm:'us_m60a1', name:'M60A1 (AOS)', nation:'usa', type:'sol', role:'Char de combat', year:1962, speed:'48 km/h', arm:'Canon 105 mm M68', prot:'Glacis 109 mm à 65°',
      desc:"Le « Patton » de la guerre froide : haute silhouette, tourelle en nez d'aiguille et canon de 105 mm. Stabilisé, il est redoutable en mouvement.",
      stats:{feu:78,prot:68,mob:54,vit:52,polyv:80} },
    { id:'leo1', dm:'germ_leopard_I', name:'Leopard I', nation:'de', type:'sol', role:'Char de combat', year:1965, speed:'65 km/h', arm:'Canon 105 mm L7A3', prot:'70 mm max',
      desc:"L'Allemagne de l'Ouest choisit la mobilité plutôt que le blindage : le Leopard I est rapide, précis et peut tirer dès les premières secondes d'une rencontre.",
      stats:{feu:80,prot:34,mob:90,vit:86,polyv:78} },
    { id:'zsu234', dm:'ussr_zsu_23_4', name:'ZSU-23-4 « Shilka »', nation:'ussr', type:'sol', role:'Automoteur antiaérien', year:1965, speed:'50 km/h', arm:'4 × 23 mm AZP-23', prot:'15 mm',
      desc:"Quatre canons de 23 mm guidés par radar : le cauchemar des avions et hélicoptères volant bas. Il peut aussi déchiqueter les blindés légers.",
      stats:{feu:78,prot:18,mob:62,vit:60,polyv:58} },
    { id:'strv103', dm:'sw_strv_103c', name:'Strv 103C', nation:'se', type:'sol', role:'Chasseur de chars', year:1986, speed:'50 km/h', arm:'Canon 105 mm L74 à chargement automatique', prot:'Caisse très inclinée, profil ultra-bas',
      desc:"Le célèbre « S-Tank » : sans tourelle, il pointe son canon en orientant et en inclinant toute la caisse. Une silhouette minuscule, idéale en embuscade.",
      stats:{feu:78,prot:58,mob:62,vit:60,polyv:46} },
    { id:'type74', dm:'jp_type_74', name:'Type 74 (E)', nation:'jp', type:'sol', role:'Char de combat', year:1975, speed:'53 km/h', arm:'Canon 105 mm L7', prot:'Tourelle moulée',
      desc:"Sa suspension hydropneumatique lui permet de s'accroupir, de se cabrer ou de pencher sur le côté pour tirer depuis les pentes les plus difficiles.",
      stats:{feu:78,prot:36,mob:80,vit:74,polyv:74} },
    { id:'gepard', dm:'germ_flakpz_I_Gepard', name:'Gepard', nation:'de', type:'sol', role:'Automoteur antiaérien', year:1976, speed:'65 km/h', arm:'2 × 35 mm KDA', prot:'Léger',
      desc:"Deux canons de 35 mm, un radar de veille et un radar de poursuite sur châssis de Leopard I : l'un des systèmes antiaériens à canons les plus efficaces.",
      stats:{feu:82,prot:24,mob:80,vit:78,polyv:60} },
    { id:'t64b', dm:'ussr_t_64_b_1984', name:'T-64B', nation:'ussr', type:'sol', role:'Char de combat', year:1976, speed:'60 km/h', arm:'Canon 125 mm 2A46-2, missiles 9K112 Kobra', prot:'Composite + Kontakt-1',
      desc:"Le premier char à blindage composite et chargeur automatique. Le T-64B ajoute des missiles tirés par le tube et une conduite de tir moderne.",
      stats:{feu:88,prot:80,mob:74,vit:74,polyv:80} },
    { id:'t80b', dm:'ussr_t_80b', name:'T-80B', nation:'ussr', type:'sol', role:'Char de combat', year:1978, speed:'70 km/h', arm:'Canon 125 mm 2A46-2, missiles 9K112', prot:'Composite',
      desc:"Une turbine à gaz de 1 100 ch dans un char de 42 tonnes : le T-80B est surnommé le « char volant » pour ses accélérations fulgurantes.",
      stats:{feu:88,prot:78,mob:88,vit:88,polyv:80} },
    { id:'t72a', dm:'ussr_t_72a', name:'T-72A', nation:'ussr', type:'sol', role:'Char de combat', year:1979, speed:'60 km/h', arm:'Canon 125 mm 2A46', prot:'Composite, tourelle « Dolly Parton »',
      desc:"Plus simple et moins cher que le T-64, le T-72 devient le char soviétique d'exportation par excellence. Le modèle A renforce nettement la tourelle.",
      stats:{feu:86,prot:76,mob:72,vit:72,polyv:74} },
    { id:'amx30b2', dm:'fr_amx_30_b2', name:'AMX-30B2', nation:'fr', type:'sol', role:'Char de combat', year:1982, speed:'65 km/h', arm:'Canon 105 mm CN-105-F1', prot:'Acier moulé 80 mm',
      desc:"Modernisation de l'AMX-30 : conduite de tir numérique, caméra thermique et obus-flèche OFL 105. Léger, rapide et précis.",
      stats:{feu:80,prot:32,mob:84,vit:82,polyv:76} },
    { id:'chieftain10', dm:'uk_chieftain_mk_10', name:'Chieftain Mk 10', nation:'uk', type:'sol', role:'Char de combat', year:1986, speed:'48 km/h', arm:'Canon rayé 120 mm L11A5', prot:'Blindage Stillbrew sur la tourelle',
      desc:"Le char le plus lourdement armé de son temps. Sa position de conduite couchée donne une silhouette très basse ; le Mk 10 ajoute le blindage Stillbrew.",
      stats:{feu:84,prot:80,mob:44,vit:46,polyv:72} },
    { id:'shotkal', dm:'il_centurion_shot_kal_gimel', name:'Sho’t Kal Gimel', nation:'il', type:'sol', role:'Char de combat', year:1976, speed:'43 km/h', arm:'Canon 105 mm L7', prot:'Tourelle 152 mm',
      desc:"Le Centurion israélien, remotorisé avec un diesel et réarmé d'un L7 de 105 mm. La famille Sho't s'est illustrée sur le plateau du Golan en 1973.",
      stats:{feu:80,prot:66,mob:54,vit:50,polyv:78} },

    // ================= BLINDÉS — Ère moderne =================
    { id:'m1', dm:'us_m1_abrams', name:'M1 Abrams', nation:'usa', type:'sol', role:'Char de combat principal', year:1980, speed:'72 km/h', arm:'Canon 105 mm M68A1', prot:'Composite Chobham',
      desc:"Le premier Abrams, encore armé d'un 105 mm. Sa turbine AGT1500 et son blindage composite révolutionnent le char de combat occidental.",
      stats:{feu:82,prot:84,mob:88,vit:86,polyv:82} },
    { id:'leo2a4', dm:'germ_leopard_2a4', name:'Leopard 2A4', nation:'de', type:'sol', role:'Char de combat principal', year:1985, speed:'68 km/h', arm:'Canon 120 mm L/44', prot:'Composite, tourelle à faces verticales',
      desc:"La version la plus exportée du Leopard 2, reconnaissable à sa tourelle à faces verticales. Un équilibre remarquable entre puissance et mobilité.",
      stats:{feu:90,prot:78,mob:86,vit:84,polyv:86} },
    { id:'t80u', dm:'ussr_t_80u', name:'T-80U', nation:'ussr', type:'sol', role:'Char de combat principal', year:1985, speed:'70 km/h', arm:'Canon 125 mm 2A46M-1, missiles 9K119 Refleks', prot:'Composite + Kontakt-5',
      desc:"Blindage réactif lourd Kontakt-5, turbine de 1 250 ch et missiles guidés laser : le T-80U est l'aboutissement des chars soviétiques.",
      stats:{feu:90,prot:88,mob:88,vit:86,polyv:84} },
    { id:'merkava3', dm:'il_merkava_mk_3b', name:'Merkava Mk.3B', nation:'il', type:'sol', role:'Char de combat principal', year:1990, speed:'60 km/h', arm:'Canon 120 mm MG251', prot:'Blindage modulaire, moteur à l’avant',
      desc:"Premier Merkava armé d'un 120 mm, avec blindage modulaire remplaçable et le célèbre rideau de chaînes protégeant l'arrière de la tourelle.",
      stats:{feu:86,prot:86,mob:64,vit:66,polyv:82} },
    { id:'type90', dm:'jp_type_90', name:'Type 90', nation:'jp', type:'sol', role:'Char de combat principal', year:1990, speed:'70 km/h', arm:'Canon 120 mm L/44 à chargement automatique', prot:'Composite',
      desc:"Le Japon adopte le chargeur automatique et le canon de 120 mm : le Type 90 réduit l'équipage à trois hommes et gagne en cadence de tir.",
      stats:{feu:88,prot:78,mob:84,vit:84,polyv:84} },
    { id:'centauro', dm:'it_b1_centauro', name:'Centauro I 105', nation:'it', type:'sol', role:'Chasseur de chars à roues', year:1991, speed:'108 km/h', arm:'Canon 105 mm', prot:'Léger',
      desc:"Un canon de char sur huit roues : le Centauro traverse la carte à plus de 100 km/h pour tendre des embuscades là où personne ne l'attend.",
      stats:{feu:80,prot:18,mob:92,vit:100,polyv:64} },
    { id:'m1a2', dm:'us_m1a2_abrams', name:'M1A2 Abrams', nation:'usa', type:'sol', role:'Char de combat principal', year:1992, speed:'67 km/h', arm:'Canon 120 mm M256', prot:'Composite à uranium appauvri',
      desc:"Turbine de 1 500 ch, blindage composite et viseur panoramique du chef de char : l'Abrams accélère comme une berline et encaisse comme un bunker.",
      stats:{feu:92,prot:86,mob:86,vit:82,polyv:86} },
    { id:'leclerc', dm:'fr_leclerc_s1', name:'Leclerc', nation:'fr', type:'sol', role:'Char de combat principal', year:1992, speed:'71 km/h', arm:'Canon 120 mm CN120-26, chargeur automatique', prot:'Composite modulaire',
      desc:"Chargeur automatique à 12 coups par minute, conduite de tir numérique et vitesse de pointe élevée : le Leclerc est taillé pour le tir en mouvement.",
      stats:{feu:90,prot:78,mob:90,vit:88,polyv:88} },
    { id:'strv122', dm:'sw_strv_122', name:'Strv 122A', nation:'se', type:'sol', role:'Char de combat principal', year:1997, speed:'72 km/h', arm:'Canon 120 mm L/44', prot:'Leopard 2 surblindé à la suédoise',
      desc:"Leopard 2 amélioré pour la Suède : blindage frontal renforcé, système de gestion du champ de bataille et protection accrue du toit de tourelle.",
      stats:{feu:90,prot:88,mob:84,vit:84,polyv:86} },
    { id:'ariete', dm:'it_c1_ariete', name:'Ariete', nation:'it', type:'sol', role:'Char de combat principal', year:1995, speed:'65 km/h', arm:'Canon 120 mm/44', prot:'Composite',
      desc:"Premier char de combat entièrement conçu en Italie depuis 1945. Excellente conduite de tir et stabilisation pour un tir précis en mouvement.",
      stats:{feu:84,prot:70,mob:76,vit:76,polyv:80} },
    { id:'chally2', dm:'uk_challenger_2_dorchester', name:'Challenger 2 (2F)', nation:'uk', type:'sol', role:'Char de combat principal', year:1998, speed:'59 km/h', arm:'Canon rayé 120 mm L30A1', prot:'Blindage Dorchester',
      desc:"Réputé pour sa survivabilité exceptionnelle, le Challenger 2 est l'un des rares chars modernes à conserver un canon rayé.",
      stats:{feu:84,prot:92,mob:62,vit:66,polyv:80} },
    { id:'leo2a6', dm:'germ_leopard_2a6', name:'Leopard 2A6', nation:'de', type:'sol', role:'Char de combat principal', year:2001, speed:'72 km/h', arm:'Canon 120 mm L/55', prot:'Composite + tourelle en flèche',
      desc:"Le canon L/55 allongé propulse ses flèches à plus de 1 700 m/s. Mobilité, précision et optiques thermiques de premier ordre.",
      stats:{feu:96,prot:82,mob:88,vit:86,polyv:88} },
    { id:'merkava4', dm:'il_merkava_mk_4b', name:'Merkava Mk.4B', nation:'il', type:'sol', role:'Char de combat principal', year:2004, speed:'64 km/h', arm:'Canon 120 mm MG253', prot:'Blindage modulaire, moteur à l’avant',
      desc:"Moteur placé à l'avant pour protéger l'équipage, compartiment arrière accessible : le Merkava est conçu autour d'une idée — ramener l'équipage vivant.",
      stats:{feu:88,prot:90,mob:68,vit:72,polyv:84} },
    { id:'t90a', dm:'ussr_t_90a', name:'T-90A', nation:'ussr', type:'sol', role:'Char de combat principal', year:2004, speed:'60 km/h', arm:'Canon 125 mm 2A46M-5, missiles 9M119M', prot:'Composite + Kontakt-5',
      desc:"Compact et lourdement protégé par des briques réactives, le T-90A dispose d'un chargeur automatique et de brouilleurs Shtora contre les missiles.",
      stats:{feu:92,prot:88,mob:70,vit:74,polyv:82} },
    { id:'ztz96a', dm:'cn_ztz_96a', name:'ZTZ96A', nation:'cn', type:'sol', role:'Char de combat principal', year:2006, speed:'65 km/h', arm:'Canon 125 mm', prot:'Composite + blindage réactif',
      desc:"Le char le plus répandu de l'armée chinoise moderne : léger, bon marché et doté d'un canon de 125 mm à chargeur automatique.",
      stats:{feu:86,prot:74,mob:78,vit:78,polyv:78} },
    { id:'ztz99a', dm:'cn_ztz_99a', name:'ZTZ99A', nation:'cn', type:'sol', role:'Char de combat principal', year:2011, speed:'70 km/h', arm:'Canon 125 mm ZPT-98', prot:'Composite + blindage réactif',
      desc:"Fleuron des forces blindées chinoises : puissant moteur, blindage en pointe de flèche et munitions modernes à haute pénétration.",
      stats:{feu:92,prot:88,mob:84,vit:84,polyv:84} },
    { id:'type10', dm:'jp_type_10', name:'Type 10', nation:'jp', type:'sol', role:'Char de combat principal', year:2012, speed:'70 km/h', arm:'Canon 120 mm à chargement automatique', prot:'Blindage modulaire céramique',
      desc:"Léger (44 t), agile et doté d'une suspension hydropneumatique capable d'incliner la caisse : le Type 10 excelle sur les terrains accidentés.",
      stats:{feu:88,prot:70,mob:94,vit:86,polyv:86} },
    { id:'leo2a7v', dm:'germ_leopard_2a7v', name:'Leopard 2A7V', nation:'de', type:'sol', role:'Char de combat principal', year:2020, speed:'68 km/h', arm:'Canon 120 mm L/55A1', prot:'Blindage additionnel frontal et latéral',
      desc:"La dernière évolution du Leopard 2 : canon L/55A1, blindage renforcé et nouvelles optiques. L'un des chars les plus complets du jeu.",
      stats:{feu:96,prot:90,mob:84,vit:84,polyv:90} },
    { id:'t90m', dm:'ussr_t_90m_2020', name:'T-90M', nation:'ussr', type:'sol', role:'Char de combat principal', year:2020, speed:'60 km/h', arm:'Canon 125 mm 2A46M-4', prot:'Composite + Relikt',
      desc:"Nouvelle tourelle, blindage réactif Relikt et viseur panoramique Sosna-U : le T-90M est la version la plus aboutie de la famille T-72/T-90.",
      stats:{feu:92,prot:90,mob:72,vit:74,polyv:86} },

    // ================= HÉLICOPTÈRES =================
    { id:'mi24v', dm:'mi_24v', name:'Mi-24V', nation:'ussr', type:'heli', role:'Hélicoptère d’assaut', year:1976, speed:'335 km/h', arm:'12,7 mm Yak-B, missiles 9K114 Shturm, roquettes', prot:'Cockpit et verrière blindés',
      desc:"Le « Hind » : un char volant capable de transporter des troupes. Rapide, lourdement armé et blindé, il fait figure de légende.",
      stats:{feu:88,prot:66,mob:52,vit:62,polyv:86} },
    { id:'ah64a', dm:'ah_64a', name:'AH-64A Apache', nation:'usa', type:'heli', role:'Hélicoptère d’attaque', year:1986, speed:'293 km/h', arm:'Canon 30 mm M230, AGM-114 Hellfire, roquettes', prot:'Cockpit blindé, systèmes redondants',
      desc:"Le prédateur des blindés : missiles Hellfire à longue portée, canon de 30 mm asservi au casque et une résistance au combat remarquable.",
      stats:{feu:92,prot:56,mob:70,vit:52,polyv:84} },

    // ================= MARINE =================
    { id:'s100', dm:'germ_s_100_class', name:'S-100', nation:'de', type:'mer', role:'Vedette lance-torpilles', year:1943, speed:'43,6 nœuds', arm:'2 × 533 mm torpilles, 20 mm et 37 mm', prot:'Passerelle blindée',
      desc:"La redoutable « E-boat » : rapide, basse sur l'eau, elle surgit de nuit pour torpiller et disparaître avant la riposte.",
      stats:{feu:70,prot:18,mob:90,vit:94,polyv:52} },
    { id:'fletcher', dm:'us_destroyer_fletcher', name:'USS Fletcher', nation:'usa', type:'mer', role:'Destroyer', year:1942, speed:'36,5 nœuds', arm:'5 × 127 mm/38, 10 tubes lance-torpilles', prot:'Faible',
      desc:"Tête de série d'une classe de 175 destroyers. Ses cinq canons de 127 mm à double usage crachent un déluge d'obus sur navires et avions.",
      stats:{feu:78,prot:30,mob:74,vit:70,polyv:84} },
    { id:'tashkent', dm:'ussr_destroyer_pr20_tashkent', name:'Tashkent', nation:'ussr', type:'mer', role:'Conducteur de flottille', year:1939, speed:'43,5 nœuds', arm:'6 × 130 mm B-2LM, 9 tubes lance-torpilles', prot:'Faible',
      desc:"Construit en Italie pour la marine soviétique, le « croiseur bleu » était l'un des navires de guerre les plus rapides de son époque.",
      stats:{feu:78,prot:26,mob:78,vit:88,polyv:74} },
    { id:'belfast', dm:'uk_cruiser_belfast', name:'HMS Belfast', nation:'uk', type:'mer', role:'Croiseur léger', year:1939, speed:'32 nœuds', arm:'12 × 152 mm en 4 tourelles triples', prot:'Ceinture de 114 mm',
      desc:"Croiseur de la classe Town, aujourd'hui musée sur la Tamise. Sa puissance de feu a pris part au naufrage du Scharnhorst et au Débarquement.",
      stats:{feu:88,prot:62,mob:44,vit:58,polyv:72} },
  ];
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
  vehicles.forEach(v => {
    const b = BR[v.id] || [0, 0, 0, 0, 0];
    v.rankNum = b[0];
    v.rank = ROMAN[b[0]] || '?';
    v.brs = { ab: b[1], rb: b[2], sb: b[3] };
    v.br = b[2];                   // BR de référence : mode Réaliste
    v.premium = !!b[4];
    v.sil = v.id;
    v.typeLabel = T[v.type];
    v.nationData = nationById[v.nation];
  });

  /* ---------- Radar (SVG) ---------- */
  const AXES = [
    ['feu','Puissance de feu'], ['prot','Protection'], ['mob','Mobilité'], ['vit','Vitesse'], ['polyv','Polyvalence'],
  ];
  function radar(series, { size = 280, labels = true } = {}) {
    const c = size / 2, r = size / 2 - (labels ? 46 : 8), n = AXES.length;
    const pt = (i, v) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / n;
      return [c + Math.cos(a) * r * v, c + Math.sin(a) * r * v];
    };
    let s = `<svg class="radar" viewBox="0 0 ${size} ${size}" role="img" aria-label="Diagramme radar des caractéristiques">`;
    [0.25, 0.5, 0.75, 1].forEach(k => {
      s += `<polygon class="radar-grid" points="${AXES.map((_, i) => pt(i, k).join(',')).join(' ')}"/>`;
    });
    AXES.forEach((ax, i) => {
      const [x, y] = pt(i, 1);
      s += `<line class="radar-axis" x1="${c}" y1="${c}" x2="${x}" y2="${y}"/>`;
      if (labels) {
        const [lx, ly] = pt(i, 1.2);
        const anchor = Math.abs(lx - c) < 4 ? 'middle' : lx > c ? 'start' : 'end';
        s += `<text class="radar-label" x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="middle">${ax[1]}</text>`;
      }
    });
    series.forEach((ser, si) => {
      const pts = AXES.map((ax, i) => pt(i, ser.stats[ax[0]] / 100).join(',')).join(' ');
      s += `<g class="radar-series" style="--c:${ser.color};--d:${si * 0.15}s;transform-origin:${c}px ${c}px">
        <polygon points="${pts}" fill="${ser.color}" fill-opacity=".18" stroke="${ser.color}" stroke-width="2"/>
        ${AXES.map((ax, i) => { const [x, y] = pt(i, ser.stats[ax[0]] / 100); return `<circle cx="${x}" cy="${y}" r="3.2" fill="${ser.color}"/>`; }).join('')}
      </g>`;
    });
    return s + '</svg>';
  }

  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));

  return { flags, flag, nations, nationById, sil, silhouette, vehicles, types: T, AXES, radar, esc, GAME_VERSION, ROMAN };
})();
