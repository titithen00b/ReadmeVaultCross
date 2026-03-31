export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  updated_at: string;
}

export interface FetchedReadme {
  content: string;
  repoName: string;
  description: string;
  htmlUrl: string;
}

function authHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/** Fetch raw readme content from a GitHub repo URL */
export async function fetchRepoReadme(
  repoUrl: string,
  token?: string
): Promise<FetchedReadme> {
  // Parse owner/repo from URL
  const match = repoUrl
    .trim()
    .replace(/\.git$/, "")
    .match(/github\.com[/:]([\w.-]+)\/([\w.-]+)/);
  if (!match) {
    throw new Error("Invalid GitHub URL. Expected format: https://github.com/owner/repo");
  }
  const [, owner, repo] = match;

  // Fetch repo info
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: authHeaders(token),
  });
  if (!repoRes.ok) {
    const err = await repoRes.json().catch(() => ({}));
    throw new Error(
      `GitHub API error ${repoRes.status}: ${err.message ?? repoRes.statusText}`
    );
  }
  const repoData: GithubRepo = await repoRes.json();

  // Fetch readme
  const readmeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/readme`,
    { headers: authHeaders(token) }
  );
  if (!readmeRes.ok) {
    throw new Error(`No README found for ${owner}/${repo} (${readmeRes.status})`);
  }
  const readmeData = await readmeRes.json();
  // GitHub returns base64-encoded content — decode properly as UTF-8
  const b64 = readmeData.content.replace(/\n/g, "");
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const raw = new TextDecoder("utf-8").decode(bytes);

  return {
    content: raw,
    repoName: repoData.name,
    description: repoData.description ?? "",
    htmlUrl: repoData.html_url,
  };
}

/** Fetch all repos for an authenticated user */
export async function fetchUserRepos(token: string): Promise<GithubRepo[]> {
  const allRepos: GithubRepo[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated`,
      { headers: authHeaders(token) }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        `GitHub API error ${res.status}: ${err.message ?? res.statusText}`
      );
    }
    const repos: GithubRepo[] = await res.json();
    if (repos.length === 0) break;
    allRepos.push(...repos);
    if (repos.length < 100) break;
    page++;
  }

  return allRepos;
}
