export interface Project {
  id: string;
  name: string;
  description: string;
  readme: string;
  gitURL: string;
  tags: string[];
  color: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
}

export type SortMode =
  | "nameAZ"
  | "nameZA"
  | "recentlyUpdated"
  | "oldest"
  | "biggest"
  | "smallest"
  | "manual";

export type TabMode = "rendered" | "raw" | "info";

export interface AppState {
  projects: Project[];
  selectedId: string | null;
  searchQuery: string;
  sortMode: SortMode;
  activeTag: string | null;
}

export const ACCENT_COLORS = [
  "#6C63FF",
  "#FF6584",
  "#43D9AD",
  "#F7B731",
  "#4ECDC4",
  "#FF6B6B",
  "#A29BFE",
  "#FD79A8",
  "#00B894",
  "#FDCB6E",
  "#E17055",
  "#74B9FF",
] as const;

export function generateId(): string {
  return crypto.randomUUID();
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
