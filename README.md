# Ligne de Front — fan-site War Thunder

Site multi-pages non officiel consacré à War Thunder, écrit en **HTML, CSS et JavaScript purs** : aucune bibliothèque, aucune étape de compilation.

## Pages

| Page | Contenu |
| --- | --- |
| `index.html` | Accueil : scène de bataille sur canvas devenue **mini-jeu de tir** (cliquez pour abattre avions, hélicoptères et chars ; score, combo, précision, mode combat chronométré de 60 s et record enregistré), théâtres Air/Terre/Mer, fiche vedette en rotation |
| `hangar.html` | 76 véhicules dont 55 blindés, filtrables (type, nation, rang, recherche, tri), fiche détaillée avec BR Arcade/Réaliste/Simulation et diagramme radar, comparateur côte à côte |
| `nations.html` | Les 10 nations : drapeau flottant animé sur canvas, doctrine, forces par domaine, matrice comparative |
| `modes.html` | Arcade / Réaliste / Simulation, carte tactique simulée en temps réel (Domination, Conquête, Bataille), progression sur 9 rangs |
| `chronologie.html` | Frise 1930 → aujourd'hui pilotée par le défilement, année géante animée |
| `academie.html` | **Simulateur de blindage** : 27 obus réels de 11 canons (données du jeu), traînée, formules de De Marre et de Lanz-Odermatt, tables d'inclinaison et de ricochet du jeu, fusées retardées, jets de charge creuse, écaillage HESH, éclats dans le compartiment, courbe pénétration/distance et série de 1 000 tirs ; conseils tactiques, quiz de promotion |
| `404.html` | Page d'erreur « hors carte » |

## Lancer le site

Ouvrir `index.html` dans un navigateur suffit. Pour un rendu identique à la mise en ligne :

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

Le fichier `.nojekyll` permet une publication directe sur GitHub Pages.

## Cotes de bataille (BR)

Les rangs et BR ne sont pas saisis à la main : ils proviennent des fichiers du client du jeu,
publiés par le dépôt public [War-Thunder-Datamine](https://github.com/gszabi99/War-Thunder-Datamine)
(`config/wpcost.blkx`, BR = economicRank / 3 + 1). Après une mise à jour du jeu :

```bash
python3 tools/maj_br.py
```

Le script relit l'identifiant `dm` de chaque véhicule dans `assets/js/data.js` et réécrit le bloc `BR:START … BR:END`.

Les données du simulateur de blindage (obus, tables de ricochet et d'inclinaison, qualité des aciers, constantes du moteur de dégâts) viennent de la même source :

```bash
python3 tools/maj_balistique.py   # régénère assets/js/balistique-data.js
```

## Structure

```
tools/maj_br.py            mise à jour des BR depuis les fichiers du jeu
tools/maj_balistique.py    données des obus pour le simulateur
assets/
  css/style.css      thème, composants et mises en page
  js/silhouettes.js  silhouette de profil propre à chaque véhicule (SVG)
  js/data.js         nations, véhicules, BR du jeu, diagramme radar
  js/core.js         en-tête, pied de page, transitions, curseur, révélations
  js/hero.js         scène canvas et mini-jeu de tir de l'accueil
  js/home.js         accueil (théâtres, vedette, parallaxe)
  js/balistique-data.js  données des obus (générées)
  js/balistique.js   moteur balistique (traînée, De Marre, Lanz-Odermatt, pente, ricochet)
  js/simulateur.js   simulateur de blindage de l'Académie
  js/hangar.js / nations.js / modes.js / chrono.js / academie.js
```

Accessibilité : navigation au clavier (modale, onglets, quiz 1–4), respect de `prefers-reduced-motion`, mise en page adaptée au mobile.

> Site de fan sans affiliation. War Thunder est une marque de Gaijin Entertainment.
