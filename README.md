<div align="center">

# ReadmeVault

**Centralisez tous vos READMEs en un seul endroit.**

Application desktop multiplateforme pour stocker, organiser et consulter les READMEs de vos projets GitHub.

[![Build & Release](https://github.com/titithen00b/ReadmeVaultCross/actions/workflows/build.yml/badge.svg)](https://github.com/titithen00b/ReadmeVaultCross/actions/workflows/build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-24C8DB?logo=tauri)](https://tauri.app)
[![Svelte](https://img.shields.io/badge/Svelte-4.x-FF3E00?logo=svelte)](https://svelte.dev)
[![Rust](https://img.shields.io/badge/Rust-stable-orange?logo=rust)](https://www.rust-lang.org)

</div>

---

## Captures d'écran

> *Interface principale avec sidebar de navigation, rendu Markdown et thème sombre.*

---

## Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| **Import GitHub** | Colle une URL de dépôt pour récupérer le README automatiquement via l'API GitHub |
| **Import en masse** | Importe plusieurs READMEs depuis une organisation ou une liste de repos GitHub |
| **Import local** | Ouvre un fichier `.md` / `.txt` — le titre est détecté automatiquement |
| **Rendu Markdown** | Affichage rendu avec coloration syntaxique des blocs de code (highlight.js) |
| **Vue brute** | Accès au contenu Markdown source |
| **Épingler** | Clic droit → Épingler pour garder un projet en tête de liste |
| **Multi-sélection** | `⌘+clic` pour sélectionner plusieurs projets et les supprimer en lot |
| **Tri avancé** | Par nom A→Z / Z→A, date de mise à jour, ancienneté, taille, ou ordre manuel (drag & drop) |
| **Recherche** | Filtrage en temps réel par nom, description ou tag |
| **Tags** | Organisation par tags avec filtre dans la sidebar |
| **Couleurs d'accent** | Couleur personnalisable par projet |
| **Rafraîchir** | Mise à jour du README depuis GitHub en un clic |
| **Dupliquer** | Copie rapide d'un projet existant |
| **Token GitHub** | Support d'un token personnel pour lever la limite de l'API (60 → 5000 req/h) |
| **Stockage local** | Toutes les données restent sur votre machine, aucune donnée envoyée en ligne |
| **Menu natif** | Menus Fichier / Édition / Aide intégrés à l'OS |

---

## Raccourcis clavier

| Raccourci | Action |
|---|---|
| `⌘N` | Nouveau projet |
| `⌘O` | Ouvrir un fichier README local |
| `⌘I` | Importer depuis GitHub |
| `⌘D` | Dupliquer le projet sélectionné |
| `⌘/` | Afficher l'aide |
| `⌘⌫` | Supprimer le(s) projet(s) sélectionné(s) |
| `⎋` | Fermer / Annuler |

---

## Installation

### Télécharger une release

Rendez-vous sur la page [Releases](https://github.com/titithen00b/ReadmeVaultCross/releases) et téléchargez le fichier correspondant à votre système.

#### Windows
- Télécharge le fichier `.exe` (installeur NSIS) ou `.msi`
- > Si Windows SmartScreen s'affiche : clic **"Informations complémentaires"** → **"Exécuter quand même"**

#### macOS
- Télécharge le fichier `.dmg`
- > Si macOS bloque l'app : **clic droit** sur l'app → **Ouvrir** → **Ouvrir quand même**

#### Linux
- Télécharge le fichier `.AppImage` et rends-le exécutable :
```bash
chmod +x ReadmeVault_*.AppImage
./ReadmeVault_*.AppImage
```
- Un `.deb` (Debian/Ubuntu) est également disponible.

---

## Compiler depuis les sources

### Prérequis

| Outil | Version minimale | Lien |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | (inclus avec Node.js) |
| Rust | stable | [rustup.rs](https://rustup.rs) |
| Tauri CLI | 2.x | via npm |

#### Dépendances Linux supplémentaires
```bash
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf
```

### Cloner et installer

```bash
git clone https://github.com/titithen00b/ReadmeVaultCross.git
cd ReadmeVaultCross
npm install
```

### Lancer en mode développement

```bash
npm run tauri dev
```

### Compiler pour la production

```bash
npm run tauri build
```

Les artefacts sont générés dans `src-tauri/target/release/bundle/`.

---

## Architecture

```
ReadmeVaultCross/
├── src/                        # Frontend Svelte + TypeScript
│   ├── App.svelte              # Composant racine, layout, modales
│   ├── main.ts                 # Point d'entrée Vite
│   ├── app.css                 # Variables CSS globales (thème, couleurs)
│   └── lib/
│       ├── types.ts            # Types TypeScript (Project, SortMode…)
│       ├── store.ts            # État global Svelte (writable/derived)
│       ├── github.ts           # Appels API GitHub (README, infos repo)
│       ├── markdown.ts         # Rendu Markdown (marked + highlight.js)
│       └── components/
│           ├── Sidebar.svelte          # Liste projets, recherche, tri, tags
│           ├── ProjectDetail.svelte    # Affichage README (rendu/brut/infos)
│           ├── ProjectForm.svelte      # Formulaire création/édition
│           ├── ImportGitHub.svelte     # Import depuis une URL GitHub
│           ├── ImportBulkGitHub.svelte # Import en masse
│           ├── SettingsModal.svelte    # Paramètres (token GitHub, thème…)
│           ├── AboutModal.svelte       # À propos de l'application
│           └── HelpModal.svelte        # Aide et raccourcis clavier
│
├── src-tauri/                  # Backend Rust (Tauri)
│   ├── src/
│   │   ├── main.rs             # Point d'entrée Tauri
│   │   └── lib.rs              # Commandes IPC, menu natif, persistance
│   ├── icons/                  # Icônes app (PNG, ICNS…)
│   ├── capabilities/
│   │   └── default.json        # Permissions Tauri (fs, shell…)
│   └── tauri.conf.json         # Configuration Tauri (fenêtre, bundle…)
│
├── .github/
│   └── workflows/
│       └── build.yml           # CI/CD — builds macOS / Windows / Linux
│
├── index.html                  # Point d'entrée HTML
├── vite.config.ts              # Configuration Vite
├── svelte.config.js            # Configuration Svelte
├── tsconfig.json               # Configuration TypeScript
└── package.json
```

### Stockage des données

Les données sont stockées localement via les commandes Rust `save_projects` / `load_projects` :

| Plateforme | Emplacement |
|---|---|
| macOS | `~/Library/Application Support/com.readmevault.app/` |
| Windows | `%APPDATA%\com.readmevault.app\` |
| Linux | `~/.local/share/com.readmevault.app/` |

- **`projects.json`** — métadonnées de tous les projets (sans le contenu README)
- **`readmes/<id>.md`** — contenu README de chaque projet (fichier séparé)

---

## Stack technique

| Couche | Technologie |
|---|---|
| UI Framework | [Svelte 4](https://svelte.dev) |
| Desktop | [Tauri 2](https://tauri.app) |
| Backend | [Rust](https://www.rust-lang.org) (stable) |
| Bundler | [Vite 5](https://vitejs.dev) |
| Rendu Markdown | [marked](https://marked.js.org) + [marked-highlight](https://github.com/markedjs/marked-highlight) |
| Coloration syntaxique | [highlight.js](https://highlightjs.org) |
| Langage | TypeScript 5 |

---

## CI/CD

Le workflow GitHub Actions (`.github/workflows/build.yml`) se déclenche :
- Sur chaque **push de tag** `v*` (ex: `v1.0.0`) → crée une release draft
- Sur **déclenchement manuel** (`workflow_dispatch`)

Plateformes compilées en parallèle :
- `macos-latest` → `.dmg` + `.app`
- `windows-latest` → `.exe` (NSIS) + `.msi`
- `ubuntu-22.04` → `.AppImage` + `.deb`

### Publier une release

```bash
git tag v1.0.0
git push origin v1.0.0
```

La release est créée en **draft** — vérifier les artefacts avant de la publier manuellement sur GitHub.

---

## Contribuer

Les contributions sont les bienvenues !

1. Fork le repo
2. Crée une branche : `git checkout -b feature/ma-fonctionnalite`
3. Commit : `git commit -m "feat: ajouter ma fonctionnalité"`
4. Push : `git push origin feature/ma-fonctionnalite`
5. Ouvre une Pull Request

### Signaler un bug

Ouvre une [issue GitHub](https://github.com/titithen00b/ReadmeVaultCross/issues) avec :
- OS et version
- Étapes pour reproduire
- Comportement attendu vs observé

---

## Licence

[MIT](LICENSE) — © 2025 Valentin R. (Titithen00b)
