# Ligne de Front — fan-site War Thunder

Site multi-pages non officiel consacré à War Thunder, écrit en **HTML, CSS et JavaScript purs** : aucune bibliothèque, aucune étape de compilation.

## Pages

| Page | Contenu |
| --- | --- |
| `index.html` | Accueil : scène de bataille procédurale sur canvas (avions, DCA, traçantes, char dont le canon suit la souris), HUD animé, théâtres Air/Terre/Mer, fiche vedette en rotation |
| `hangar.html` | 38 véhicules filtrables (type, nation, recherche, tri), fiche détaillée avec diagramme radar, comparateur côte à côte |
| `nations.html` | Les 10 nations : drapeau flottant animé sur canvas, doctrine, forces par domaine, matrice comparative |
| `modes.html` | Arcade / Réaliste / Simulation, carte tactique simulée en temps réel (Domination, Conquête, Bataille), progression par rangs |
| `chronologie.html` | Frise 1930 → aujourd'hui pilotée par le défilement, année géante animée |
| `academie.html` | Simulateur de blindage incliné (e = t / cos θ, ricochets), conseils tactiques, quiz de promotion avec grade final |
| `404.html` | Page d'erreur « hors carte » |

## Lancer le site

Ouvrir `index.html` dans un navigateur suffit. Pour un rendu identique à la mise en ligne :

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

Le fichier `.nojekyll` permet une publication directe sur GitHub Pages.

## Structure

```
assets/
  css/style.css      thème, composants et mises en page
  js/data.js         nations, véhicules, silhouettes SVG, diagramme radar
  js/core.js         en-tête, pied de page, transitions, curseur, révélations
  js/hero.js         scène canvas de l'accueil
  js/home.js         accueil (théâtres, vedette, parallaxe)
  js/hangar.js / nations.js / modes.js / chrono.js / academie.js
```

Accessibilité : navigation au clavier (modale, onglets, quiz 1–4), respect de `prefers-reduced-motion`, mise en page adaptée au mobile.

> Site de fan sans affiliation. War Thunder est une marque de Gaijin Entertainment. Les cotes de bataille (BR) sont indicatives.
