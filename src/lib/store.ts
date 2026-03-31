import { writable, derived, get } from "svelte/store";
import { invoke } from "@tauri-apps/api/core";
import type { Project, SortMode } from "./types";
import { generateId, nowISO } from "./types";
import { fetchRepoReadme } from "./github";

// ── State stores ──────────────────────────────────────────────────────────────

export const projects = writable<Project[]>([]);
export const selectedId = writable<string | null>(null);
export const searchQuery = writable<string>("");
export const sortMode = writable<SortMode>("manual");
export const activeTag = writable<string | null>(null);
export const githubToken = writable<string>(
  localStorage.getItem("github_token") ?? ""
);

// Persist token
githubToken.subscribe((val) => {
  localStorage.setItem("github_token", val);
});

// ── Derived ───────────────────────────────────────────────────────────────────

export const allTags = derived(projects, ($projects) => {
  const set = new Set<string>();
  for (const p of $projects) {
    for (const t of p.tags) set.add(t);
  }
  return [...set].sort();
});

export const filteredProjects = derived(
  [projects, searchQuery, sortMode, activeTag],
  ([$projects, $search, $sort, $tag]) => {
    let list = [...$projects];

    // Tag filter
    if ($tag) {
      list = list.filter((p) => p.tags.includes($tag));
    }

    // Search filter
    if ($search.trim()) {
      const q = $search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
    switch ($sort) {
      case "nameAZ":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "nameZA":
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "recentlyUpdated":
        list.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        break;
      case "oldest":
        list.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "biggest":
        list.sort((a, b) => b.readme.length - a.readme.length);
        break;
      case "smallest":
        list.sort((a, b) => a.readme.length - b.readme.length);
        break;
      case "manual":
        // Keep original order (as stored)
        break;
    }

    // Pinned items always at top
    list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

    return list;
  }
);

export const selectedProject = derived(
  [projects, selectedId],
  ([$projects, $id]) => $projects.find((p) => p.id === $id) ?? null
);

// ── Persistence ───────────────────────────────────────────────────────────────

async function persist(list: Project[]) {
  const metadata = list.map(({ readme: _readme, ...rest }) => rest);
  const readmes: Record<string, string> = {};
  for (const p of list) {
    readmes[p.id] = p.readme;
  }
  await invoke("save_projects", {
    metadata: metadata,
    readmes,
  });
}

// ── Load ──────────────────────────────────────────────────────────────────────

export async function load() {
  try {
    const result = await invoke<{
      projects: Omit<Project, "readme">[];
      readmes: Record<string, string>;
    }>("load_projects");

    const loaded: Project[] = result.projects.map((meta) => ({
      ...meta,
      readme: result.readmes[meta.id] ?? "",
    }));

    if (loaded.length === 0) {
      const samples = makeSampleProjects();
      projects.set(samples);
      await persist(samples);
      selectedId.set(samples[0].id);
    } else {
      projects.set(loaded);
      selectedId.set(loaded[0]?.id ?? null);
    }
  } catch (e) {
    console.error("Failed to load projects:", e);
    const samples = makeSampleProjects();
    projects.set(samples);
    selectedId.set(samples[0].id);
  }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function addProject(data: Omit<Project, "id" | "createdAt" | "updatedAt">) {
  const project: Project = {
    ...data,
    id: generateId(),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  projects.update((list) => {
    const next = [project, ...list];
    persist(next);
    return next;
  });
  selectedId.set(project.id);
  return project;
}

export async function updateProject(id: string, data: Partial<Project>) {
  projects.update((list) => {
    const next = list.map((p) =>
      p.id === id ? { ...p, ...data, updatedAt: nowISO() } : p
    );
    persist(next);
    return next;
  });
}

export async function deleteProject(id: string) {
  try {
    await invoke("delete_readme", { id });
  } catch (_) {}
  projects.update((list) => {
    const next = list.filter((p) => p.id !== id);
    persist(next);
    return next;
  });
  selectedId.update((cur) => {
    if (cur === id) {
      const remaining = get(projects);
      return remaining[0]?.id ?? null;
    }
    return cur;
  });
}

export async function duplicateProject(id: string) {
  const list = get(projects);
  const original = list.find((p) => p.id === id);
  if (!original) return;
  const copy: Project = {
    ...original,
    id: generateId(),
    name: `${original.name} (copie)`,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    isPinned: false,
  };
  projects.update((l) => {
    const next = [copy, ...l];
    persist(next);
    return next;
  });
  selectedId.set(copy.id);
}

export async function togglePin(id: string) {
  projects.update((list) => {
    const next = list.map((p) =>
      p.id === id ? { ...p, isPinned: !p.isPinned, updatedAt: nowISO() } : p
    );
    persist(next);
    return next;
  });
}

export async function reorderProjects(newOrder: Project[]) {
  projects.set(newOrder);
  await persist(newOrder);
}

export async function refreshFromGitHub(id: string, token?: string) {
  const list = get(projects);
  const project = list.find((p) => p.id === id);
  if (!project?.gitURL) throw new Error("No GitHub URL set for this project");

  const result = await fetchRepoReadme(project.gitURL, token ?? get(githubToken));
  await updateProject(id, {
    readme: result.content,
    description: result.description || project.description,
  });
}

// ── Sample projects ───────────────────────────────────────────────────────────

function makeSampleProjects(): Project[] {
  const now = nowISO();
  return [
    {
      id: generateId(),
      name: "Mon Portfolio",
      description: "Site web personnel avec Next.js et TypeScript",
      readme: `# Mon Portfolio

Un site web portfolio moderne construit avec **Next.js 14** et **TypeScript**.

## Stack technique

- **Framework**: Next.js 14 (App Router)
- **Langage**: TypeScript
- **Styles**: Tailwind CSS
- **Animations**: Framer Motion
- **Déploiement**: Vercel

## Fonctionnalités

- 🎨 Design responsive et moderne
- ⚡ Performance optimisée (Lighthouse 100)
- 🌍 Multi-langue (FR/EN)
- 📊 Analytics intégrés

## Installation

\`\`\`bash
git clone https://github.com/monuser/portfolio
cd portfolio
npm install
npm run dev
\`\`\`

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Structure

\`\`\`
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Header.tsx
│   ├── Hero.tsx
│   └── Projects.tsx
└── lib/
    └── utils.ts
\`\`\`

## Déploiement

\`\`\`bash
npm run build
vercel deploy
\`\`\`

## Licence

MIT — Valentin Roche
`,
      gitURL: "",
      tags: ["nextjs", "typescript", "web"],
      color: "#6C63FF",
      createdAt: now,
      updatedAt: now,
      isPinned: true,
    },
    {
      id: generateId(),
      name: "API REST",
      description: "API REST avec Node.js, Express et PostgreSQL",
      readme: `# API REST — Node.js + PostgreSQL

API RESTful complète avec authentification JWT et base de données PostgreSQL.

## Technologies

- **Runtime**: Node.js 20
- **Framework**: Express 4
- **Base de données**: PostgreSQL 16 + Prisma ORM
- **Auth**: JWT + bcrypt
- **Validation**: Zod
- **Tests**: Vitest + Supertest

## Démarrage rapide

\`\`\`bash
# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env

# Lancer les migrations
npx prisma migrate dev

# Démarrer le serveur
npm run dev
\`\`\`

## Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /auth/register | Créer un compte |
| POST | /auth/login | Se connecter |
| GET | /users/me | Profil utilisateur |
| GET | /projects | Liste des projets |
| POST | /projects | Créer un projet |
| PUT | /projects/:id | Modifier un projet |
| DELETE | /projects/:id | Supprimer un projet |

## Exemple de requête

\`\`\`javascript
const response = await fetch('/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${token}\`
  },
  body: JSON.stringify({
    name: 'Mon projet',
    description: 'Description du projet'
  })
});
\`\`\`

## Variables d'environnement

\`\`\`env
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
JWT_SECRET=your-super-secret-key
PORT=3000
\`\`\`

## Licence

MIT
`,
      gitURL: "",
      tags: ["nodejs", "backend", "postgresql"],
      color: "#43D9AD",
      createdAt: now,
      updatedAt: now,
      isPinned: false,
    },
  ];
}
