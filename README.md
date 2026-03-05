# JobTracker

Outil Kanban de suivi de candidatures — construit en HTML/CSS/JS vanilla, sans dépendance externe.

## Aperçu

![Kanban board avec 5 colonnes : Repéré, Postulé, Entretien, Offre, Refus]

JobTracker permet de centraliser et visualiser toutes ses candidatures en un coup d'œil, avec un système de rappels de relance, un dashboard de statistiques, et des outils d'import/export.

## Fonctionnalités

- **Kanban 5 colonnes** — Repéré, Postulé, Entretien, Offre, Refus
- **Drag & drop** — glisser une carte entre colonnes
- **Ajouter / modifier / supprimer** — entreprise, poste, salaire, localisation, lien, notes, dates
- **Tags personnalisés** — étiquettes libres sur chaque candidature (Remote, Priorité, Alternance...)
- **Rappels de relance** — badge coloré selon l'urgence (en retard, dans 7 jours, OK)
- **Dashboard stats** — taux de réponse, entonnoir de candidature, relances à venir
- **Export CSV** — télécharger toutes ses candidatures en fichier Excel-compatible
- **Import CSV** — recharger un export ou importer depuis Excel, avec choix fusion/remplacement
- **Persistance** — données sauvegardées en localStorage, aucun compte requis

## Stack technique

| Technologie | Usage |
|---|---|
| HTML5 sémantique | Structure (header, section, article) |
| CSS / SCSS | Variables, Flexbox, Grid, animations |
| JavaScript vanilla | DOM, événements, localStorage, Drag & Drop API, FileReader API |
| Google Fonts | Fraunces, Plus Jakarta Sans, JetBrains Mono |
| localStorage | Persistance des données côté client |

## Structure du projet

```
jobtracker/
├── index.html          # Structure HTML
├── app.js              # Logique JS (render, modal, drag & drop, stats, CSV, tags)
├── icons/              # Icônes SVG
│   ├── delete-svgrepo-com.svg
│   └── update-svgrepo-com.svg
└── scss/
    ├── style.scss      # Point d'entrée SCSS
    ├── style.css       # CSS compilé (lié dans index.html)
    ├── _variables.scss
    ├── _base.scss
    ├── _layout.scss
    ├── _header.scss
    ├── _kanban.scss
    ├── _card.scss
    ├── _modal.scss
    ├── _stats.scss
    └── _animations.scss
```

## Lancer le projet

Aucune installation requise. Ouvre `index.html` directement dans un navigateur, ou utilise Live Server dans VS Code.

```bash
# Avec Live Server (VS Code)
# Clic droit sur index.html → "Open with Live Server"
```

## Compiler le SCSS

```bash
# Installation globale de Sass
npm install -g sass

# Compilation en mode watch
sass scss/style.scss scss/style.css --watch
```

Ou utilise l'extension **Live Sass Compiler** dans VS Code.

## Déploiement

Le projet est déployé sur GitHub Pages :
**[https://konchu974.github.io/jobtracker](https://konchu974.github.io/jobtracker)**
