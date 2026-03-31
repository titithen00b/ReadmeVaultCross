<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fetchUserRepos, fetchRepoReadme, type GithubRepo } from "../github";
  import { githubToken, addProject, projects } from "../store";
  import { ACCENT_COLORS } from "../types";
  import { get } from "svelte/store";

  const dispatch = createEventDispatcher();

  let token = $githubToken;
  let repos: GithubRepo[] = [];
  let selected = new Set<number>();
  let loadingRepos = false;
  let importing = false;
  let error = "";
  let progress = 0;
  let progressTotal = 0;
  let progressLabel = "";
  let searchFilter = "";
  let done = false;
  let importedCount = 0;

  function close() {
    dispatch("close");
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  async function fetchRepos() {
    error = "";
    repos = [];
    selected = new Set();
    if (!token.trim()) {
      error = "Un token GitHub est requis pour lister vos dépôts.";
      return;
    }
    loadingRepos = true;
    try {
      repos = await fetchUserRepos(token.trim());
      if (repos.length === 0) {
        error = "Aucun dépôt trouvé pour ce compte.";
      }
    } catch (e: any) {
      error = e?.message ?? String(e);
    } finally {
      loadingRepos = false;
    }
  }

  function toggleRepo(id: number) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selected = next;
  }

  function selectAll() {
    selected = new Set(filteredRepos.map((r) => r.id));
  }

  function deselectAll() {
    selected = new Set();
  }

  $: filteredRepos = repos.filter(
    (r) =>
      !searchFilter ||
      r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (r.description ?? "").toLowerCase().includes(searchFilter.toLowerCase())
  );

  async function importSelected() {
    const toImport = repos.filter((r) => selected.has(r.id));
    if (toImport.length === 0) return;

    importing = true;
    error = "";
    progress = 0;
    progressTotal = toImport.length;
    done = false;
    importedCount = 0;

    // Existing project URLs to avoid duplicates
    const existingUrls = new Set(get(projects).map((p) => p.gitURL));

    const colors = [...ACCENT_COLORS];
    let colorIdx = 0;

    for (const repo of toImport) {
      progressLabel = `Import de "${repo.name}"…`;
      try {
        if (!existingUrls.has(repo.html_url)) {
          const readme = await fetchRepoReadme(repo.html_url, token.trim());
          await addProject({
            name: readme.repoName,
            description: readme.description,
            gitURL: readme.htmlUrl,
            tags: [],
            color: colors[colorIdx % colors.length],
            readme: readme.content,
            isPinned: false,
          });
          importedCount++;
          colorIdx++;
        }
      } catch (_) {
        // Skip repos without README
      }
      progress++;
    }

    if (token.trim()) githubToken.set(token.trim());
    done = true;
    importing = false;
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
</script>

<svelte:window on:keydown={onKeyDown} />

<div class="modal-overlay" on:click|self={close}>
  <div class="modal-box bulk-modal">
    <div class="modal-header">
      <div class="header-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <h2>Import en masse GitHub</h2>
      </div>
      <button class="close-btn" on:click={close}>✕</button>
    </div>

    <div class="modal-body">
      {#if done}
        <!-- Done state -->
        <div class="done-state">
          <div class="done-icon">✅</div>
          <h3>Import terminé !</h3>
          <p>{importedCount} projet{importedCount !== 1 ? "s" : ""} importé{importedCount !== 1 ? "s" : ""} avec succès.</p>
          <button class="btn-primary" on:click={close}>Fermer</button>
        </div>
      {:else if importing}
        <!-- Progress state -->
        <div class="progress-state">
          <div class="progress-label">{progressLabel}</div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              style="width: {progressTotal > 0 ? (progress / progressTotal) * 100 : 0}%;"
            ></div>
          </div>
          <div class="progress-count">{progress} / {progressTotal}</div>
        </div>
      {:else}
        <!-- Token + fetch -->
        <div class="form-group">
          <label for="bulk-token">Token GitHub *</label>
          <input
            id="bulk-token"
            type="password"
            bind:value={token}
            placeholder="ghp_xxxxxxxxxxxx"
            autofocus
            on:keydown={(e) => e.key === "Enter" && fetchRepos()}
          />
          <div class="field-hint">
            Token requis pour récupérer la liste de vos dépôts (publics et privés).
            Créez-en un sur <strong>GitHub → Settings → Developer settings → Personal access tokens</strong>.
          </div>
        </div>

        <button
          class="btn-fetch"
          on:click={fetchRepos}
          disabled={loadingRepos || !token.trim()}
        >
          {#if loadingRepos}
            <span class="spinner"></span> Récupération des dépôts…
          {:else}
            Lister mes dépôts
          {/if}
        </button>

        {#if error}
          <div class="error-box">{error}</div>
        {/if}

        {#if repos.length > 0}
          <div class="repos-section">
            <div class="repos-toolbar">
              <input
                type="text"
                bind:value={searchFilter}
                placeholder="Filtrer les dépôts…"
                class="repos-search"
              />
              <div class="repos-actions">
                <span class="selected-count">{selected.size} sélectionné{selected.size !== 1 ? "s" : ""}</span>
                <button class="btn-sm" on:click={selectAll}>Tout</button>
                <button class="btn-sm" on:click={deselectAll}>Aucun</button>
              </div>
            </div>

            <div class="repos-list">
              {#each filteredRepos as repo (repo.id)}
                <label class="repo-item" class:checked={selected.has(repo.id)}>
                  <input
                    type="checkbox"
                    checked={selected.has(repo.id)}
                    on:change={() => toggleRepo(repo.id)}
                  />
                  <div class="repo-info">
                    <div class="repo-name">{repo.name}</div>
                    {#if repo.description}
                      <div class="repo-desc">{repo.description}</div>
                    {/if}
                    <div class="repo-date">Mis à jour le {formatDate(repo.updated_at)}</div>
                  </div>
                </label>
              {/each}

              {#if filteredRepos.length === 0}
                <div class="repos-empty">Aucun dépôt ne correspond à votre filtre.</div>
              {/if}
            </div>

            <div class="import-footer">
              <button class="btn-ghost" on:click={close}>Annuler</button>
              <button
                class="btn-primary"
                disabled={selected.size === 0}
                on:click={importSelected}
              >
                Importer {selected.size > 0 ? `${selected.size} dépôt${selected.size !== 1 ? "s" : ""}` : ""}
              </button>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .bulk-modal {
    width: 580px;
    max-width: 96vw;
    max-height: 88vh;
    display: flex;
    flex-direction: column;
    background: var(--main-bg-alt);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--main-border);
    flex-shrink: 0;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .modal-header h2 {
    font-size: 17px;
    font-weight: 700;
    color: var(--main-text);
  }

  .close-btn {
    background: rgba(0,0,0,0.05);
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: var(--main-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .close-btn:hover { background: rgba(0,0,0,0.1); color: var(--main-text); }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .form-group { margin-bottom: 4px; }

  .field-hint {
    font-size: 11px;
    color: var(--main-text-muted);
    margin-top: 5px;
    line-height: 1.5;
  }

  .btn-fetch {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    background: var(--color-primary);
    color: #fff;
    border: none;
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-fetch:hover:not(:disabled) {
    background: #5a52e0;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(108, 99, 255, 0.3);
  }

  .btn-fetch:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .error-box {
    background: rgba(255, 101, 132, 0.1);
    border: 1px solid rgba(255, 101, 132, 0.25);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    color: #ff6584;
    font-size: 13px;
  }

  .repos-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-top: 1px solid var(--main-border);
    padding-top: 12px;
  }

  .repos-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .repos-search {
    flex: 1;
    padding: 7px 12px;
    font-size: 13px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--main-border);
    background: var(--main-bg);
    color: var(--main-text);
  }

  .repos-search:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.1);
    outline: none;
  }

  .repos-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .selected-count {
    font-size: 12px;
    color: var(--main-text-muted);
    white-space: nowrap;
  }

  .btn-sm {
    font-size: 12px;
    padding: 4px 10px;
    background: rgba(108, 99, 255, 0.08);
    color: var(--color-primary);
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-weight: 500;
    transition: background var(--transition-fast);
  }

  .btn-sm:hover { background: rgba(108, 99, 255, 0.15); }

  .repos-list {
    max-height: 340px;
    overflow-y: auto;
    border: 1px solid var(--main-border);
    border-radius: var(--radius-md);
    display: flex;
    flex-direction: column;
  }

  .repo-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    cursor: pointer;
    transition: background var(--transition-fast);
    border-bottom: 1px solid var(--main-border);
  }

  .repo-item:last-child { border-bottom: none; }

  .repo-item:hover { background: rgba(108, 99, 255, 0.03); }

  .repo-item.checked { background: rgba(108, 99, 255, 0.06); }

  .repo-item input[type="checkbox"] {
    width: 16px;
    height: 16px;
    min-width: 16px;
    margin-top: 2px;
    accent-color: var(--color-primary);
    cursor: pointer;
  }

  .repo-info { flex: 1; min-width: 0; }

  .repo-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--main-text);
    margin-bottom: 2px;
  }

  .repo-desc {
    font-size: 12px;
    color: var(--main-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 2px;
  }

  .repo-date {
    font-size: 11px;
    color: var(--main-text-muted);
    opacity: 0.7;
  }

  .repos-empty {
    text-align: center;
    padding: 24px;
    color: var(--main-text-muted);
    font-size: 13px;
  }

  .import-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 4px;
  }

  .btn-primary {
    background: var(--color-primary);
    color: #fff;
    padding: 9px 20px;
    border-radius: var(--radius-sm);
    font-weight: 600;
    font-size: 14px;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-primary:hover:not(:disabled) { background: #5a52e0; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-ghost {
    background: transparent;
    color: var(--main-text-muted);
    padding: 9px 14px;
    border-radius: var(--radius-sm);
    font-size: 14px;
    border: 1px solid var(--main-border);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-ghost:hover { background: rgba(0,0,0,0.04); color: var(--main-text); }

  /* Progress */
  .progress-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 32px;
  }

  .progress-label {
    font-size: 14px;
    color: var(--main-text);
    text-align: center;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(108, 99, 255, 0.12);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: 4px;
    transition: width 300ms ease;
  }

  .progress-count {
    font-size: 13px;
    color: var(--main-text-muted);
  }

  /* Done */
  .done-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px 20px;
    text-align: center;
  }

  .done-icon { font-size: 48px; }

  .done-state h3 {
    font-size: 18px;
    font-weight: 700;
    color: var(--main-text);
  }

  .done-state p {
    font-size: 14px;
    color: var(--main-text-muted);
  }
</style>
