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

  /* ---------- Silhouettes latérales (viewBox 200x80, vers la droite) ---------- */
  const sil = {
    fighter: `<path d="M12 40 L30 35 L118 31 Q158 30 176 36 L184 40 L176 44 Q158 49 118 48 L40 46 Z"/><path d="M14 39 L8 17 L22 17 L38 35 Z"/><path d="M98 31 Q112 19 130 31 Z" opacity=".75"/><path d="M84 44 L142 44 L136 51 L90 51 Z"/><rect x="183" y="20" width="3" height="40" rx="1.5" opacity=".55"/><path d="M176 36 L190 40 L176 44 Z"/><path d="M20 41 L52 41 L50 44 L22 44 Z"/>`,
    jet: `<path d="M6 41 L42 36 L150 32 Q182 34 198 40 Q182 46 150 47 L42 47 Z"/><path d="M18 38 L8 10 L28 10 L58 36 Z"/><path d="M120 33 Q136 21 156 33 Z" opacity=".75"/><path d="M66 45 L132 43 L108 56 L72 56 Z"/><rect x="98" y="37" width="18" height="7" rx="2" opacity=".5"/><path d="M4 39 L0 41 L4 44 Z"/>`,
    bomber: `<path d="M6 40 L30 33 L158 30 Q186 32 196 40 Q186 48 158 49 L30 47 Z"/><path d="M8 38 L3 12 L20 12 L36 33 Z"/><path d="M176 33 Q188 36 192 40 L176 40 Z" opacity=".55"/><ellipse cx="108" cy="47" rx="16" ry="5"/><ellipse cx="140" cy="47" rx="14" ry="4.6"/><path d="M84 45 L160 45 L152 52 L90 52 Z"/><path d="M120 30 Q128 23 138 30 Z" opacity=".75"/><circle cx="70" cy="30" r="4" opacity=".7"/>`,
    attacker: `<path d="M10 40 L30 35 L124 31 Q164 32 180 37 L188 40 L180 44 Q162 49 124 48 L38 46 Z"/><path d="M12 39 L6 18 L20 18 L36 35 Z"/><path d="M104 31 Q116 21 134 31 Z" opacity=".75"/><path d="M80 44 L146 44 L140 51 L86 51 Z"/><rect x="187" y="21" width="3" height="38" rx="1.5" opacity=".55"/><rect x="92" y="51" width="30" height="4" rx="2" opacity=".7"/>`,
    tank: `<path d="M18 52 L38 42 L160 42 L182 52 L174 62 L26 62 Z"/><rect x="20" y="58" width="158" height="16" rx="8"/><path d="M66 42 L76 27 L124 26 L136 42 Z"/><rect x="132" y="31" width="60" height="4" rx="1"/><rect x="92" y="20" width="16" height="7" rx="2"/>${[36,56,76,96,116,136,156].map(x=>`<circle cx="${x}" cy="66" r="6" fill="#000" opacity=".35"/>`).join('')}`,
    heavy: `<path d="M14 50 L32 38 L166 38 L186 50 L178 62 L22 62 Z"/><rect x="16" y="58" width="168" height="17" rx="8.5"/><path d="M58 38 L64 20 L130 18 L142 38 Z"/><rect x="138" y="25" width="54" height="5" rx="1"/><rect x="188" y="23" width="10" height="9" rx="1"/><rect x="80" y="12" width="20" height="8" rx="3"/>${[32,52,72,92,112,132,152,170].map(x=>`<circle cx="${x}" cy="67" r="6.5" fill="#000" opacity=".35"/>`).join('')}`,
    td: `<path d="M14 52 L26 34 L120 28 L168 44 L186 52 L178 62 L22 62 Z"/><rect x="16" y="58" width="168" height="16" rx="8"/><rect x="150" y="35" width="48" height="5" rx="1"/><path d="M150 32 L164 38 L150 44 Z"/>${[32,54,76,98,120,142,164].map(x=>`<circle cx="${x}" cy="66" r="6.5" fill="#000" opacity=".35"/>`).join('')}`,
    mbt: `<path d="M12 52 L28 44 L166 44 L188 52 L178 62 L22 62 Z"/><rect x="16" y="58" width="166" height="15" rx="7.5"/><path d="M52 44 L58 32 L120 29 L152 35 L152 44 Z"/><rect x="148" y="34" width="50" height="3.6" rx="1"/><rect x="150" y="33" width="18" height="6" rx="1.5"/><rect x="64" y="24" width="14" height="8" rx="2"/><rect x="96" y="24" width="10" height="6" rx="1.5" opacity=".7"/>${[32,52,72,92,112,132,152,170].map(x=>`<circle cx="${x}" cy="65.5" r="5.5" fill="#000" opacity=".35"/>`).join('')}`,
    stank: `<path d="M10 52 L22 44 L150 38 L192 46 L186 54 L178 62 L22 62 Z"/><rect x="14" y="58" width="170" height="15" rx="7.5"/><rect x="146" y="39" width="52" height="4" rx="1"/><rect x="60" y="30" width="22" height="9" rx="2"/>${[30,56,82,108,134,160].map(x=>`<circle cx="${x}" cy="65.5" r="6" fill="#000" opacity=".35"/>`).join('')}`,
    heli: `<path d="M44 44 Q60 28 112 30 L142 34 Q154 42 142 50 L64 53 Q44 53 44 44 Z"/><path d="M46 40 L6 36 L6 42 L46 47 Z"/><path d="M4 26 L10 26 L12 44 L4 44 Z" opacity=".8"/><circle cx="8" cy="36" r="9" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".45"/><rect x="18" y="20" width="164" height="2.6" rx="1.3" opacity=".6"/><rect x="96" y="21" width="5" height="9"/><path d="M118 32 Q130 26 142 34 Z" opacity=".75"/><rect x="78" y="52" width="40" height="3" rx="1.5"/><rect x="82" y="55" width="10" height="4" rx="1" opacity=".7"/><rect x="104" y="55" width="10" height="4" rx="1" opacity=".7"/><path d="M60 54 L56 62 L120 62 L118 58" fill="none" stroke="currentColor" stroke-width="1.6"/>`,
    ship: `<path d="M2 50 L198 44 L186 62 L18 62 Z"/><rect x="72" y="34" width="36" height="12"/><rect x="82" y="22" width="18" height="12"/><rect x="88" y="6" width="3" height="16"/><rect x="112" y="30" width="12" height="16" rx="2"/><rect x="42" y="40" width="18" height="7" rx="2"/><rect x="28" y="42" width="16" height="3"/><rect x="140" y="38" width="18" height="7" rx="2"/><rect x="156" y="40" width="18" height="3"/><rect x="60" y="30" width="3" height="12"/>`,
    boat: `<path d="M20 50 L190 44 L180 60 L30 60 Z"/><rect x="92" y="34" width="36" height="12" rx="2"/><rect x="104" y="24" width="14" height="10" rx="2"/><rect x="110" y="12" width="2.4" height="12"/><rect x="40" y="44" width="40" height="5" rx="2.5" opacity=".8"/><rect x="140" y="40" width="16" height="6" rx="2"/>`,
  };
  const silhouette = (key, cls = 'sil') =>
    `<svg class="${cls}" viewBox="0 0 200 80" fill="currentColor" aria-hidden="true">${sil[key] || sil.tank}</svg>`;

  /* ---------- Véhicules ----------
     BR = cote de bataille indicative (mode Réaliste), susceptible d'évoluer avec les mises à jour.
     stats : feu, prot, mob, vit, polyv (appréciation sur 100). */
  const T = { air:'Aviation', sol:'Blindés', heli:'Hélicoptères', mer:'Marine' };
  const vehicles = [
    // ---- Aviation
    { id:'spitfire9', name:'Spitfire Mk IX', nation:'uk', type:'air', role:'Chasseur', sil:'fighter', year:1942, rank:'III', br:5.3, speed:'657 km/h', arm:'2 × 20 mm Hispano, 4 × 7,7 mm', prot:'Pare-brise blindé, plaque dorsale',
      desc:"Réponse directe au Fw 190, le Mk IX associe le moteur Merlin 61 à compresseur deux étages à la cellule la plus agile de la guerre. Un tourneur redoutable qui ne pardonne pas l'adversaire trop lent.",
      stats:{feu:62,prot:28,mob:95,vit:70,polyv:66} },
    { id:'bf109g6', name:'Bf 109 G-6', nation:'de', type:'air', role:'Chasseur', sil:'fighter', year:1943, rank:'III', br:4.7, speed:'630 km/h', arm:'1 × 20 mm MG 151, 2 × 13 mm MG 131', prot:'Vitre et appui-tête blindés',
      desc:"Le « Gustav » le plus produit de la famille Messerschmitt. Excellent grimpeur, il brille en tactique « boom & zoom » : piquer, tirer, remonter.",
      stats:{feu:64,prot:30,mob:78,vit:72,polyv:70} },
    { id:'p51d', name:'P-51D Mustang', nation:'usa', type:'air', role:'Chasseur d’escorte', sil:'fighter', year:1944, rank:'III', br:4.7, speed:'703 km/h', arm:'6 × 12,7 mm M2 Browning', prot:'Plaque blindée de siège',
      desc:"Autonomie exceptionnelle, verrière bulle et vitesse en piqué remarquable : le Mustang a escorté les bombardiers jusqu'à Berlin. Un maître du combat en énergie.",
      stats:{feu:60,prot:30,mob:74,vit:82,polyv:78} },
    { id:'yak3', name:'Yak-3', nation:'ussr', type:'air', role:'Chasseur léger', sil:'fighter', year:1944, rank:'III', br:4.7, speed:'655 km/h', arm:'1 × 20 mm ShVAK, 2 × 12,7 mm UBS', prot:'Plaque blindée arrière',
      desc:"L'un des chasseurs les plus légers de la guerre. À basse altitude, son rapport poids/puissance lui permet de surclasser presque tout ce qui vole.",
      stats:{feu:58,prot:24,mob:94,vit:74,polyv:60} },
    { id:'a6m2', name:'A6M2 Zero', nation:'jp', type:'air', role:'Chasseur embarqué', sil:'fighter', year:1940, rank:'II', br:3.3, speed:'533 km/h', arm:'2 × 20 mm Type 99, 2 × 7,7 mm', prot:'Aucune',
      desc:"Allonge et agilité inégalées en 1941, au prix d'une protection inexistante. En combat tournant, peu d'avions peuvent le suivre.",
      stats:{feu:56,prot:8,mob:98,vit:48,polyv:62} },
    { id:'il2', name:'IL-2 (1941)', nation:'ussr', type:'air', role:'Avion d’attaque', sil:'attacker', year:1941, rank:'I', br:2.3, speed:'414 km/h', arm:'2 × 23 mm VYa, 2 × 7,62 mm, roquettes, bombes', prot:'Caisson blindé intégral',
      desc:"Le « char volant » : moteur et équipage enfermés dans une baignoire blindée. Il pilonne les colonnes blindées et encaisse un feu nourri.",
      stats:{feu:74,prot:82,mob:34,vit:30,polyv:70} },
    { id:'b17g', name:'B-17G Flying Fortress', nation:'usa', type:'air', role:'Bombardier lourd', sil:'bomber', year:1943, rank:'III', br:5.3, speed:'462 km/h', arm:'13 × 12,7 mm, jusqu’à 7 800 kg de bombes', prot:'Blindage d’équipage, réservoirs auto-obturants',
      desc:"Une forteresse volante hérissée de mitrailleuses. Capable d'encaisser des dégâts spectaculaires et de raser une base entière à elle seule.",
      stats:{feu:84,prot:70,mob:18,vit:40,polyv:44} },
    { id:'me262', name:'Me 262 A-1a', nation:'de', type:'air', role:'Chasseur à réaction', sil:'jet', year:1944, rank:'IV', br:7.3, speed:'870 km/h', arm:'4 × 30 mm MK 108', prot:'Pare-brise blindé',
      desc:"Premier chasseur à réaction opérationnel de l'histoire. Ses quatre canons de 30 mm désintègrent n'importe quel bombardier en une rafale.",
      stats:{feu:90,prot:34,mob:40,vit:92,polyv:54} },
    { id:'f86f', name:'F-86F Sabre', nation:'usa', type:'air', role:'Chasseur à réaction', sil:'jet', year:1953, rank:'V', br:9.0, speed:'1 106 km/h', arm:'6 × 12,7 mm M3', prot:'Blindage de siège',
      desc:"Icône de la guerre de Corée, rival historique du MiG-15. Ailes en flèche, commandes hydrauliques et viseur à télémètre radar.",
      stats:{feu:58,prot:30,mob:84,vit:86,polyv:66} },
    { id:'mig15', name:'MiG-15bis', nation:'ussr', type:'air', role:'Chasseur à réaction', sil:'jet', year:1950, rank:'V', br:8.7, speed:'1 076 km/h', arm:'1 × 37 mm N-37D, 2 × 23 mm NR-23', prot:'Plaques blindées',
      desc:"Conçu pour abattre les bombardiers, il surprend l'Occident au-dessus de la Corée. Montée foudroyante et obus explosifs dévastateurs.",
      stats:{feu:82,prot:32,mob:80,vit:84,polyv:58} },
    { id:'f4e', name:'F-4E Phantom II', nation:'usa', type:'air', role:'Chasseur multirôle', sil:'jet', year:1967, rank:'VII', br:11.3, speed:'Mach 2,2', arm:'1 × 20 mm M61A1, AIM-7, AIM-9, bombes', prot:'—',
      desc:"Le « Rhino » : puissant, lourd, polyvalent. Le modèle E ajoute enfin le canon interne qui manquait à ses prédécesseurs au Vietnam.",
      stats:{feu:86,prot:28,mob:56,vit:94,polyv:92} },
    { id:'mig21', name:'MiG-21SMT', nation:'ussr', type:'air', role:'Intercepteur', sil:'jet', year:1971, rank:'VII', br:11.0, speed:'Mach 2,05', arm:'1 × 23 mm GSh-23L, R-60, R-3', prot:'—',
      desc:"L'avion supersonique le plus produit de l'histoire. Léger, vif et redoutable en accélération, au prix d'une autonomie très limitée.",
      stats:{feu:70,prot:22,mob:72,vit:95,polyv:66} },
    { id:'mirage2000', name:'Mirage 2000C', nation:'fr', type:'air', role:'Chasseur multirôle', sil:'jet', year:1984, rank:'VIII', br:12.7, speed:'Mach 2,2', arm:'2 × 30 mm DEFA 554, Magic 2, Super 530', prot:'—',
      desc:"Aile delta à commandes de vol électriques : le Mirage 2000 conserve une énergie remarquable en virage et frappe fort avec ses canons de 30 mm.",
      stats:{feu:84,prot:24,mob:88,vit:94,polyv:88} },
    { id:'gripen', name:'JAS 39 Gripen', nation:'se', type:'air', role:'Chasseur multirôle', sil:'jet', year:1996, rank:'VIII', br:13.7, speed:'Mach 2', arm:'1 × 27 mm BK 27, missiles air-air', prot:'—',
      desc:"Compact, agile et bourré d'électronique, le Gripen est pensé pour opérer depuis des routes. Une machine moderne d'une efficacité redoutable.",
      stats:{feu:88,prot:24,mob:92,vit:92,polyv:96} },
    { id:'su27', name:'Su-27', nation:'ussr', type:'air', role:'Chasseur de supériorité', sil:'jet', year:1985, rank:'VIII', br:13.3, speed:'Mach 2,35', arm:'1 × 30 mm GSh-30-1, R-27, R-73', prot:'—',
      desc:"Le « Flanker » : maniabilité extraordinaire, grande autonomie et missiles puissants. Un géant capable de figures qui semblent défier la physique.",
      stats:{feu:90,prot:26,mob:94,vit:96,polyv:84} },

    // ---- Blindés
    { id:'t3485', name:'T-34-85', nation:'ussr', type:'sol', role:'Char moyen', sil:'tank', year:1944, rank:'III', br:5.7, speed:'55 km/h', arm:'Canon 85 mm ZiS-S-53', prot:'Tourelle 90 mm, caisse 45 mm inclinée',
      desc:"Évolution du T-34, doté d'une tourelle trois hommes et d'un canon de 85 mm. Le char le plus produit de la guerre, fiable et polyvalent.",
      stats:{feu:68,prot:56,mob:74,vit:66,polyv:78} },
    { id:'tiger1', name:'Tiger H1', nation:'de', type:'sol', role:'Char lourd', sil:'heavy', year:1942, rank:'IV', br:6.7, speed:'45 km/h', arm:'Canon 88 mm KwK 36', prot:'100 mm frontal, 80 mm flancs',
      desc:"Le char le plus redouté de la Seconde Guerre mondiale. Son 88 mm d'une précision chirurgicale et son épais blindage en font un roc sur le champ de bataille.",
      stats:{feu:82,prot:78,mob:40,vit:42,polyv:60} },
    { id:'panther', name:'Panther A', nation:'de', type:'sol', role:'Char moyen', sil:'tank', year:1943, rank:'IV', br:6.7, speed:'55 km/h', arm:'Canon 75 mm KwK 42 L/70', prot:'Glacis 80 mm à 55°',
      desc:"Considéré comme l'un des meilleurs chars de la guerre : son long 75 mm perce à grande distance et son glacis incliné fait ricocher de nombreux obus.",
      stats:{feu:84,prot:66,mob:64,vit:62,polyv:74} },
    { id:'m4a3e8', name:'M4A3E8 Sherman', nation:'usa', type:'sol', role:'Char moyen', sil:'tank', year:1944, rank:'III', br:5.7, speed:'48 km/h', arm:'Canon 76 mm M1A2', prot:'Glacis 63 mm à 47°',
      desc:"Le « Easy Eight » : suspension HVSS, canon de 76 mm et stabilisateur vertical. Un Sherman abouti, confortable et précis en mouvement.",
      stats:{feu:64,prot:54,mob:66,vit:60,polyv:82} },
    { id:'is2', name:'IS-2', nation:'ussr', type:'sol', role:'Char lourd', sil:'heavy', year:1944, rank:'IV', br:6.7, speed:'37 km/h', arm:'Canon 122 mm D-25T', prot:'Tourelle 100 mm, caisse 120 mm',
      desc:"Char de percée armé d'un canon de 122 mm dont les obus explosifs pulvérisent tout ce qu'ils touchent. Le rechargement est lent : chaque tir doit compter.",
      stats:{feu:92,prot:74,mob:38,vit:36,polyv:56} },
    { id:'jagdpanther', name:'Jagdpanther', nation:'de', type:'sol', role:'Chasseur de chars', sil:'td', year:1944, rank:'IV', br:7.0, speed:'46 km/h', arm:'Canon 88 mm PaK 43/3 L/71', prot:'Casemate 80 mm à 55°',
      desc:"Le 88 mm long du Tiger II sur un châssis de Panther : un chasseur de chars d'élite, discret et mortel à toute distance.",
      stats:{feu:90,prot:68,mob:56,vit:52,polyv:44} },
    { id:'centurion3', name:'Centurion Mk 3', nation:'uk', type:'sol', role:'Char moyen', sil:'tank', year:1948, rank:'V', br:7.7, speed:'35 km/h', arm:'Canon 84 mm Ordnance QF 20 livres', prot:'Tourelle 152 mm, glacis 76 mm',
      desc:"Arrivé trop tard pour la guerre, le Centurion devient l'un des chars les plus réussis de l'après-guerre. Stabilisé, précis, son APDS perce tout.",
      stats:{feu:78,prot:70,mob:48,vit:40,polyv:80} },
    { id:'strv103', name:'Strv 103C', nation:'se', type:'sol', role:'Chasseur de chars', sil:'stank', year:1986, rank:'VI', br:9.3, speed:'50 km/h', arm:'Canon 105 mm L74 à chargement automatique', prot:'Caisse très inclinée, profil ultra-bas',
      desc:"Le célèbre « S-Tank » : sans tourelle, il pointe son canon en orientant et en inclinant toute la caisse. Une silhouette minuscule, idéale en embuscade.",
      stats:{feu:78,prot:58,mob:62,vit:60,polyv:46} },
    { id:'leo2a6', name:'Leopard 2A6', nation:'de', type:'sol', role:'Char de combat principal', sil:'mbt', year:2001, rank:'VIII', br:12.0, speed:'72 km/h', arm:'Canon 120 mm L/55', prot:'Composite + tourelle en flèche',
      desc:"Le canon L/55 allongé propulse ses flèches à plus de 1 700 m/s. Mobilité, précision et optiques thermiques de premier ordre.",
      stats:{feu:96,prot:82,mob:88,vit:86,polyv:88} },
    { id:'m1a2', name:'M1A2 Abrams', nation:'usa', type:'sol', role:'Char de combat principal', sil:'mbt', year:1992, rank:'VIII', br:11.7, speed:'67 km/h', arm:'Canon 120 mm M256', prot:'Composite à uranium appauvri',
      desc:"Turbine de 1 500 ch, blindage composite et vision panoramique du chef de char : l'Abrams accélère comme une berline et encaisse comme un bunker.",
      stats:{feu:92,prot:86,mob:86,vit:82,polyv:86} },
    { id:'t90a', name:'T-90A', nation:'ussr', type:'sol', role:'Char de combat principal', sil:'mbt', year:2004, rank:'VIII', br:11.7, speed:'60 km/h', arm:'Canon 125 mm 2A46M-5, missiles 9M119M', prot:'Composite + blindage réactif Kontakt-5',
      desc:"Compact et lourdement protégé par des briques réactives, le T-90A dispose d'un chargeur automatique et peut tirer des missiles par le tube.",
      stats:{feu:92,prot:88,mob:70,vit:74,polyv:82} },
    { id:'leclerc', name:'Leclerc', nation:'fr', type:'sol', role:'Char de combat principal', sil:'mbt', year:1992, rank:'VIII', br:11.3, speed:'71 km/h', arm:'Canon 120 mm CN120-26, chargeur automatique', prot:'Composite modulaire',
      desc:"Chargeur automatique à 12 coups par minute, conduite de tir numérique et vitesse de pointe élevée : le Leclerc est taillé pour le tir en mouvement.",
      stats:{feu:90,prot:78,mob:90,vit:88,polyv:88} },
    { id:'merkava4', name:'Merkava Mk.4', nation:'il', type:'sol', role:'Char de combat principal', sil:'mbt', year:2004, rank:'VIII', br:11.7, speed:'64 km/h', arm:'Canon 120 mm MG253', prot:'Blindage modulaire, moteur à l’avant',
      desc:"Moteur placé à l'avant pour protéger l'équipage, compartiment arrière accessible : le Merkava est conçu autour d'une idée — ramener l'équipage vivant.",
      stats:{feu:88,prot:90,mob:68,vit:72,polyv:84} },
    { id:'type10', name:'Type 10', nation:'jp', type:'sol', role:'Char de combat principal', sil:'mbt', year:2012, rank:'VIII', br:11.7, speed:'70 km/h', arm:'Canon 120 mm à chargement automatique', prot:'Blindage modulaire céramique',
      desc:"Léger (44 t), agile et doté d'une suspension hydropneumatique capable d'incliner la caisse : le Type 10 excelle sur les terrains accidentés.",
      stats:{feu:88,prot:70,mob:94,vit:86,polyv:86} },
    { id:'chally2', name:'Challenger 2', nation:'uk', type:'sol', role:'Char de combat principal', sil:'mbt', year:1998, rank:'VIII', br:11.3, speed:'59 km/h', arm:'Canon rayé 120 mm L30A1', prot:'Blindage Chobham / Dorchester',
      desc:"Réputé pour sa survivabilité exceptionnelle, le Challenger 2 est l'un des rares chars modernes à conserver un canon rayé.",
      stats:{feu:84,prot:92,mob:62,vit:66,polyv:80} },
    { id:'ztz99a', name:'ZTZ99A', nation:'cn', type:'sol', role:'Char de combat principal', sil:'mbt', year:2011, rank:'VIII', br:12.0, speed:'70 km/h', arm:'Canon 125 mm ZPT-98', prot:'Composite + blindage réactif',
      desc:"Fleuron des forces blindées chinoises : puissant moteur, blindage en pointe de flèche et munitions modernes à haute pénétration.",
      stats:{feu:92,prot:88,mob:84,vit:84,polyv:84} },
    { id:'ariete', name:'Ariete', nation:'it', type:'sol', role:'Char de combat principal', sil:'mbt', year:1995, rank:'VII', br:11.0, speed:'65 km/h', arm:'Canon 120 mm/44', prot:'Composite',
      desc:"Premier char de combat entièrement conçu en Italie depuis 1945. Excellente conduite de tir et stabilisation pour un tir précis en mouvement.",
      stats:{feu:82,prot:66,mob:76,vit:76,polyv:80} },

    // ---- Hélicoptères
    { id:'ah64a', name:'AH-64A Apache', nation:'usa', type:'heli', role:'Hélicoptère d’attaque', sil:'heli', year:1986, rank:'VII', br:10.7, speed:'293 km/h', arm:'Canon 30 mm M230, AGM-114 Hellfire, roquettes', prot:'Cockpit blindé, systèmes redondants',
      desc:"Le prédateur des blindés : missiles Hellfire à longue portée, canon de 30 mm asservi au casque et une résistance au combat remarquable.",
      stats:{feu:92,prot:56,mob:70,vit:52,polyv:84} },
    { id:'mi24v', name:'Mi-24V', nation:'ussr', type:'heli', role:'Hélicoptère d’assaut', sil:'heli', year:1976, rank:'VI', br:10.3, speed:'335 km/h', arm:'12,7 mm Yak-B, missiles 9K114 Shturm, roquettes', prot:'Cockpit blindé, verrière blindée',
      desc:"Le « Hind » : un char volant capable de transporter des troupes. Rapide, lourdement armé et blindé, il fait figure de légende.",
      stats:{feu:88,prot:66,mob:52,vit:62,polyv:86} },

    // ---- Marine
    { id:'fletcher', name:'USS Fletcher', nation:'usa', type:'mer', role:'Destroyer', sil:'ship', year:1942, rank:'III', br:4.3, speed:'36,5 nœuds', arm:'5 × 127 mm/38, 10 tubes lance-torpilles', prot:'Faible',
      desc:"Tête de série d'une classe de 175 destroyers. Ses cinq canons de 127 mm à double usage crachent un déluge d'obus sur navires et avions.",
      stats:{feu:78,prot:30,mob:74,vit:70,polyv:84} },
    { id:'belfast', name:'HMS Belfast', nation:'uk', type:'mer', role:'Croiseur léger', sil:'ship', year:1939, rank:'IV', br:5.7, speed:'32 nœuds', arm:'12 × 152 mm en 4 tourelles triples', prot:'Ceinture de 114 mm',
      desc:"Croiseur de la classe Town, aujourd'hui musée sur la Tamise. Sa puissance de feu a pris part au naufrage du Scharnhorst et au Débarquement.",
      stats:{feu:88,prot:62,mob:44,vit:58,polyv:72} },
    { id:'s100', name:'Schnellboot S-100', nation:'de', type:'mer', role:'Vedette lance-torpilles', sil:'boat', year:1943, rank:'I', br:2.3, speed:'43,6 nœuds', arm:'2 × 533 mm torpilles, 20 mm et 37 mm', prot:'Passerelle blindée',
      desc:"La redoutable « E-boat » : rapide, basse sur l'eau, elle surgit de nuit pour torpiller et disparaître avant la riposte.",
      stats:{feu:70,prot:18,mob:90,vit:94,polyv:52} },
    { id:'tashkent', name:'Tashkent', nation:'ussr', type:'mer', role:'Conducteur de flottille', sil:'ship', year:1939, rank:'III', br:4.3, speed:'43,5 nœuds', arm:'6 × 130 mm B-2LM, 9 tubes lance-torpilles', prot:'Faible',
      desc:"Construit en Italie pour la marine soviétique, le « croiseur bleu » était l'un des navires de guerre les plus rapides de son époque.",
      stats:{feu:78,prot:26,mob:78,vit:88,polyv:74} },
  ];
  vehicles.forEach(v => { v.typeLabel = T[v.type]; v.nationData = nationById[v.nation]; });

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

  return { flags, flag, nations, nationById, sil, silhouette, vehicles, types: T, AXES, radar, esc };
})();
