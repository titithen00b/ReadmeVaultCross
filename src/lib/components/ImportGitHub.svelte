<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fetchRepoReadme, type FetchedReadme } from "../github";
  import { githubToken, addProject } from "../store";
  import { ACCENT_COLORS } from "../types";

  const dispatch = createEventDispatcher();

  let url = "";
  let token = $githubToken;
  let loading = false;
  let error = "";
  let preview: FetchedReadme | null = null;
  let selectedColor = ACCENT_COLORS[0];
  let importing = false;

  function close() {
    dispatch("close");
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  async function fetchPreview() {
    error = "";
    preview = null;
    if (!url.trim()) {
      error = "Veuillez entrer une URL GitHub.";
      return;
    }
    loading = true;
    try {
      preview = await fetchRepoReadme(url.trim(), token.trim() || undefined);
    } catch (e: any) {
      error = e?.message ?? String(e);
    } finally {
      loading = false;
    }
  }

  async function doImport() {
    if (!preview) return;
    importing = true;
    try {
      await addProject({
        name: preview.repoName,
        description: preview.description,
        gitURL: preview.htmlUrl,
        tags: [],
        color: selectedColor,
        readme: preview.content,
        isPinned: false,
      });
      if (token.trim()) githubToken.set(token.trim());
      close();
    } catch (e: any) {
      error = e?.message ?? String(e);
    } finally {
      importing = false;
    }
  }
</script>

<svelte:window on:keydown={onKeyDown} />

<div class="modal-overlay" on:click|self={close}>
  <div class="modal-box import-modal">
    <div class="modal-header">
      <div class="header-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="color: var(--color-primary);">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
        </svg>
        <h2>Importer depuis GitHub</h2>
      </div>
      <button class="close-btn" on:click={close}>✕</button>
    </div>

    <div class="modal-body">
      <div class="form-group">
        <label for="gh-url">URL du dépôt</label>
        <input
          id="gh-url"
          type="url"
          bind:value={url}
          placeholder="https://github.com/owner/repository"
          autofocus
          on:keydown={(e) => e.key === "Enter" && fetchPreview()}
        />
      </div>

      <div class="form-group">
        <label for="gh-token">Token GitHub (optionnel, pour les dépôts privés)</label>
        <input
          id="gh-token"
          type="password"
          bind:value={token}
          placeholder="ghp_xxxxxxxxxxxx"
        />
        <div class="field-hint">
          Le token permet d'accéder aux dépôts privés et augmente les limites de l'API.
        </div>
      </div>

      {#if !preview}
        <button
          class="btn-fetch"
          on:click={fetchPreview}
          disabled={loading || !url.trim()}
        >
          {#if loading}
            <span class="spinner"></span>
            Récupération…
          {:else}
            Récupérer le README
          {/if}
        </button>
      {/if}

      {#if error}
        <div class="error-box">{error}</div>
      {/if}

      {#if preview}
        <div class="preview-card">
          <div class="preview-header">
            <div class="preview-info">
              <div class="preview-name">{preview.repoName}</div>
              {#if preview.description}
                <div class="preview-desc">{preview.description}</div>
              {/if}
              <a href={preview.htmlUrl} target="_blank" class="preview-url">
                {preview.htmlUrl}
              </a>
            </div>
          </div>

          <div class="color-section">
            <label>Couleur du projet</label>
            <div class="color-grid">
              {#each ACCENT_COLORS as c}
                <button
                  class="color-swatch"
                  class:selected={selectedColor === c}
                  style="background: {c};"
                  on:click={() => (selectedColor = c)}
                ></button>
              {/each}
            </div>
          </div>

          <div class="preview-readme">
            <label>Aperçu README ({(preview.content.length / 1024).toFixed(1)} Ko)</label>
            <textarea
              class="readme-preview-text"
              readonly
              value={preview.content.slice(0, 500) + (preview.content.length > 500 ? "\n…" : "")}
              rows={6}
            ></textarea>
          </div>

          <div class="preview-actions">
            <button class="btn-ghost" on:click={() => { preview = null; error = ""; }}>
              ← Retour
            </button>
            <button class="btn-primary" on:click={doImport} disabled={importing}>
              {importing ? "Import en cours…" : "Importer ce projet"}
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .import-modal {
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

  .close-btn:hover {
    background: rgba(0,0,0,0.1);
    color: var(--main-text);
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .field-hint {
    font-size: 11px;
    color: var(--main-text-muted);
    margin-top: 5px;
    line-height: 1.4;
  }

  .btn-fetch {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 11px;
    background: var(--color-primary);
    color: #fff;
    border: none;
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
    margin-top: 4px;
  }

  .btn-fetch:hover:not(:disabled) {
    background: #5a52e0;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(108, 99, 255, 0.3);
  }

  .btn-fetch:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-box {
    background: rgba(255, 101, 132, 0.1);
    border: 1px solid rgba(255, 101, 132, 0.25);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    color: #ff6584;
    font-size: 13px;
    line-height: 1.5;
  }

  .preview-card {
    border: 1px solid var(--main-border);
    border-radius: var(--radius-lg);
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: rgba(108, 99, 255, 0.02);
    animation: slideUp 200ms ease;
  }

  .preview-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--main-text);
    margin-bottom: 4px;
  }

  .preview-desc {
    font-size: 13px;
    color: var(--main-text-muted);
    margin-bottom: 6px;
  }

  .preview-url {
    font-size: 12px;
    color: var(--color-primary);
    text-decoration: none;
    word-break: break-all;
  }

  .color-section label,
  .preview-readme label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--main-text-muted);
    margin-bottom: 8px;
  }

  .color-grid {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .color-swatch {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .color-swatch:hover {
    transform: scale(1.15);
  }

  .color-swatch.selected {
    border-color: white;
    box-shadow: 0 0 0 2px rgba(0,0,0,0.3);
    transform: scale(1.1);
  }

  .readme-preview-text {
    font-family: monospace;
    font-size: 12px;
    background: #1e1e2e;
    color: #cdd6f4;
    border-color: rgba(255,255,255,0.08);
    resize: none;
    border-radius: var(--radius-sm);
  }

  .preview-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--main-border);
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
</style>
