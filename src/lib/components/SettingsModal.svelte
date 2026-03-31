<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { githubToken, projects } from "../store";
  import { get } from "svelte/store";

  const dispatch = createEventDispatcher();

  let token = $githubToken;
  let showToken = false;
  let saved = false;
  let exportSuccess = false;

  function close() {
    dispatch("close");
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  function saveToken() {
    githubToken.set(token.trim());
    saved = true;
    setTimeout(() => (saved = false), 2000);
  }

  function clearToken() {
    token = "";
    githubToken.set("");
  }

  function exportData() {
    const data = get(projects);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "readmevault-export.json";
    a.click();
    URL.revokeObjectURL(url);
    exportSuccess = true;
    setTimeout(() => (exportSuccess = false), 2000);
  }

  $: projectCount = $projects.length;
  $: totalSize = $projects.reduce((acc, p) => acc + p.readme.length, 0);

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / 1024 / 1024).toFixed(2)} Mo`;
  }
</script>

<svelte:window on:keydown={onKeyDown} />

<div class="modal-overlay" on:click|self={close}>
  <div class="modal-box settings-modal">
    <div class="modal-header">
      <div class="header-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <h2>Paramètres</h2>
      </div>
      <button class="close-btn" on:click={close}>✕</button>
    </div>

    <div class="settings-body">
      <!-- GitHub Token section -->
      <section class="settings-section">
        <h3 class="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: var(--main-text);">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          Token GitHub
        </h3>

        <div class="form-group">
          <label for="settings-token">Personal Access Token</label>
          <div class="token-input-row">
            {#if showToken}
              <input
                id="settings-token"
                type="text"
                bind:value={token}
                placeholder="ghp_xxxxxxxxxxxx"
              />
            {:else}
              <input
                id="settings-token"
                type="password"
                bind:value={token}
                placeholder="ghp_xxxxxxxxxxxx"
              />
            {/if}
            <button
              class="toggle-show"
              on:click={() => (showToken = !showToken)}
              title={showToken ? "Masquer" : "Afficher"}
            >
              {showToken ? "👁️" : "🔒"}
            </button>
          </div>
          <div class="field-hint">
            Créez un token sur <strong>GitHub → Settings → Developer settings → Personal access tokens (classic)</strong>.
            Scopes nécessaires : <code>repo</code> (pour les dépôts privés).
            <br>Le token est stocké dans localStorage de votre navigateur local.
          </div>
        </div>

        <div class="token-status">
          {#if token}
            <span class="status-dot active"></span>
            <span class="status-text">Token configuré</span>
          {:else}
            <span class="status-dot"></span>
            <span class="status-text inactive">Aucun token configuré (API publique uniquement)</span>
          {/if}
        </div>

        <div class="token-actions">
          <button class="btn-primary" on:click={saveToken}>
            {saved ? "✓ Enregistré !" : "Enregistrer le token"}
          </button>
          {#if token}
            <button class="btn-danger" on:click={clearToken}>Supprimer le token</button>
          {/if}
        </div>
      </section>

      <!-- Stats section -->
      <section class="settings-section">
        <h3 class="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          Statistiques
        </h3>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{projectCount}</div>
            <div class="stat-label">Projets</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{formatSize(totalSize)}</div>
            <div class="stat-label">Taille totale READMEs</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">
              {$projects.filter((p) => p.isPinned).length}
            </div>
            <div class="stat-label">Épinglés</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">
              {$projects.filter((p) => p.gitURL).length}
            </div>
            <div class="stat-label">Avec GitHub URL</div>
          </div>
        </div>
      </section>

      <!-- Export section -->
      <section class="settings-section">
        <h3 class="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Données
        </h3>

        <p class="section-desc">
          Exportez tous vos projets et README en JSON.
        </p>

        <button class="btn-secondary" on:click={exportData}>
          {exportSuccess ? "✓ Exporté !" : "Exporter en JSON"}
        </button>
      </section>

      <!-- About section -->
      <section class="settings-section about-section">
        <div class="app-logo">📚</div>
        <div class="about-info">
          <div class="about-name">ReadmeVault</div>
          <div class="about-version">Version 1.0.0</div>
          <div class="about-desc">
            Port cross-platform de l'app macOS SwiftUI.<br>
            Construit avec Tauri v2 + Svelte 4 + TypeScript.
          </div>
        </div>
      </section>
    </div>
  </div>
</div>

<style>
  .settings-modal {
    width: 520px;
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

  .settings-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .settings-section {
    padding: 20px 0;
    border-bottom: 1px solid var(--main-border);
  }

  .settings-section:last-child { border-bottom: none; }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 700;
    color: var(--main-text);
    margin-bottom: 16px;
  }

  .form-group { margin-bottom: 14px; }

  .token-input-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .toggle-show {
    background: rgba(0,0,0,0.04);
    border: 1.5px solid var(--main-border);
    border-radius: var(--radius-sm);
    padding: 6px 10px;
    font-size: 14px;
    cursor: pointer;
    flex-shrink: 0;
    transition: background var(--transition-fast);
  }

  .toggle-show:hover { background: rgba(0,0,0,0.08); }

  .field-hint {
    font-size: 11px;
    color: var(--main-text-muted);
    margin-top: 6px;
    line-height: 1.5;
  }

  .field-hint code {
    background: rgba(108, 99, 255, 0.1);
    color: var(--color-primary);
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 11px;
  }

  .token-status {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
    font-size: 13px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--main-text-muted);
    opacity: 0.4;
  }

  .status-dot.active {
    background: var(--color-accent-2);
    opacity: 1;
    box-shadow: 0 0 0 3px rgba(67, 217, 173, 0.2);
  }

  .status-text { color: var(--main-text-muted); }
  .status-text.inactive { opacity: 0.7; }

  .token-actions {
    display: flex;
    gap: 10px;
  }

  /* Stats */
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .stat-card {
    background: rgba(108, 99, 255, 0.04);
    border: 1px solid rgba(108, 99, 255, 0.1);
    border-radius: var(--radius-md);
    padding: 14px;
    text-align: center;
  }

  .stat-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-primary);
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 12px;
    color: var(--main-text-muted);
  }

  /* About */
  .about-section {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .app-logo { font-size: 36px; }

  .about-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--main-text);
    margin-bottom: 2px;
  }

  .about-version {
    font-size: 12px;
    color: var(--color-primary);
    margin-bottom: 6px;
  }

  .about-desc {
    font-size: 12px;
    color: var(--main-text-muted);
    line-height: 1.5;
  }

  /* Buttons */
  .btn-primary {
    background: var(--color-primary);
    color: #fff;
    padding: 8px 18px;
    border-radius: var(--radius-sm);
    font-weight: 600;
    font-size: 13px;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-primary:hover { background: #5a52e0; }

  .btn-secondary {
    background: rgba(108, 99, 255, 0.1);
    color: var(--color-primary);
    padding: 8px 18px;
    border-radius: var(--radius-sm);
    font-weight: 600;
    font-size: 13px;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-secondary:hover { background: rgba(108, 99, 255, 0.18); }

  .btn-danger {
    background: rgba(255, 101, 132, 0.1);
    color: var(--color-accent-1);
    padding: 8px 18px;
    border-radius: var(--radius-sm);
    font-weight: 600;
    font-size: 13px;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-danger:hover { background: rgba(255, 101, 132, 0.18); }

  .section-desc {
    font-size: 13px;
    color: var(--main-text-muted);
    margin-bottom: 14px;
    line-height: 1.5;
  }
</style>
