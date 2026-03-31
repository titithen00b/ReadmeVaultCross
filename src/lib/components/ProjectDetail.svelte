<script lang="ts">
  import { createEventDispatcher, onMount, afterUpdate } from "svelte";
  import { renderMarkdown } from "../markdown";
  import type { Project, TabMode } from "../types";
  import { invoke } from "@tauri-apps/api/core";
  import { githubToken, updateProject, refreshFromGitHub } from "../store";

  export let project: Project;

  const dispatch = createEventDispatcher();

  let activeTab: TabMode = "rendered";
  let renderedHtml = "";
  let copySuccess = false;
  let refreshing = false;
  let refreshError = "";

  $: {
    renderedHtml = project?.readme
      ? renderMarkdown(project.readme)
      : "<p style='color:var(--main-text-muted)'>Aucun contenu README.</p>";
  }

  async function copyRaw() {
    await navigator.clipboard.writeText(project.readme);
    copySuccess = true;
    setTimeout(() => (copySuccess = false), 2000);
  }

  async function openInBrowser() {
    if (!project.gitURL) return;
    try {
      await invoke("open_url", { url: project.gitURL });
    } catch (e) {
      console.error(e);
      window.open(project.gitURL, "_blank");
    }
  }

  async function doRefresh() {
    refreshing = true;
    refreshError = "";
    try {
      await refreshFromGitHub(project.id, $githubToken);
    } catch (e: any) {
      refreshError = e?.message ?? String(e);
    } finally {
      refreshing = false;
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function readableSize(content: string): string {
    const bytes = new TextEncoder().encode(content).length;
    if (bytes < 1024) return `${bytes} o`;
    return `${(bytes / 1024).toFixed(1)} Ko`;
  }
</script>

<div class="detail">
  <!-- Header -->
  <div class="detail-header">
    <div class="project-title">
      <span class="color-dot" style="background: {project.color};"></span>
      <h1>{project.name}</h1>
    </div>
    <div class="header-actions">
      {#if project.gitURL}
        <button
          class="action-btn"
          title="Rafraîchir depuis GitHub"
          on:click={doRefresh}
          disabled={refreshing}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class:spinning={refreshing}
          >
            <path d="M23 4v6h-6"/>
            <path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          {refreshing ? "Rafraîchissement…" : "Rafraîchir"}
        </button>
        <button class="action-btn" title="Ouvrir dans le navigateur" on:click={openInBrowser}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 0 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          GitHub
        </button>
      {/if}
      <button class="action-btn edit-btn" on:click={() => dispatch("editProject", project)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Modifier
      </button>
    </div>
  </div>

  {#if refreshError}
    <div class="error-banner">{refreshError}</div>
  {/if}

  <!-- Tabs -->
  <div class="tabs-bar">
    <button
      class="tab"
      class:active={activeTab === "rendered"}
      on:click={() => (activeTab = "rendered")}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      Rendu
    </button>
    <button
      class="tab"
      class:active={activeTab === "raw"}
      on:click={() => (activeTab = "raw")}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
      Brut
    </button>
    <button
      class="tab"
      class:active={activeTab === "info"}
      on:click={() => (activeTab = "info")}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      Infos
    </button>
  </div>

  <!-- Tab content -->
  <div class="tab-content">
    {#if activeTab === "rendered"}
      <div class="rendered-tab">
        <div class="markdown-rendered" id="rendered-content">
          {@html renderedHtml}
        </div>
      </div>
    {:else if activeTab === "raw"}
      <div class="raw-tab">
        <div class="raw-toolbar">
          <span class="raw-size">{readableSize(project.readme)}</span>
          <button class="btn-secondary copy-btn" on:click={copyRaw}>
            {#if copySuccess}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Copié !
            {:else}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copier
            {/if}
          </button>
        </div>
        <textarea class="raw-content" readonly value={project.readme} spellcheck="false"></textarea>
      </div>
    {:else if activeTab === "info"}
      <div class="info-tab">
        <div class="info-card">
          <div class="info-header">
            <div class="info-avatar" style="background: {project.color};">
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 class="info-name">{project.name}</h2>
              {#if project.description}
                <p class="info-desc">{project.description}</p>
              {/if}
            </div>
          </div>

          <div class="info-grid">
            {#if project.gitURL}
              <div class="info-field">
                <div class="info-label">URL GitHub</div>
                <button
                  class="info-link-btn"
                  on:click={openInBrowser}
                >{project.gitURL}</button>
              </div>
            {/if}

            {#if project.tags.length > 0}
              <div class="info-field">
                <div class="info-label">Tags</div>
                <div class="info-tags">
                  {#each project.tags as tag}
                    <span class="tag-pill" style="background: {project.color}20; color: {project.color};">
                      {tag}
                    </span>
                  {/each}
                </div>
              </div>
            {/if}

            <div class="info-field">
              <div class="info-label">Couleur</div>
              <div class="info-color-row">
                <span class="info-color-dot" style="background: {project.color};"></span>
                <span class="info-color-hex">{project.color}</span>
              </div>
            </div>

            <div class="info-field">
              <div class="info-label">Taille README</div>
              <div class="info-value">{readableSize(project.readme)}</div>
            </div>

            <div class="info-field">
              <div class="info-label">Créé le</div>
              <div class="info-value">{formatDate(project.createdAt)}</div>
            </div>

            <div class="info-field">
              <div class="info-label">Modifié le</div>
              <div class="info-value">{formatDate(project.updatedAt)}</div>
            </div>

            <div class="info-field">
              <div class="info-label">ID</div>
              <div class="info-value mono">{project.id}</div>
            </div>
          </div>

          <div class="info-actions">
            <button class="btn-primary" on:click={() => dispatch("editProject", project)}>
              Modifier le projet
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .detail {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--main-bg);
  }

  /* Header */
  .detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 28px 14px;
    border-bottom: 1px solid var(--main-border);
    background: var(--main-bg-alt);
    flex-shrink: 0;
  }

  .project-title {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .color-dot {
    width: 14px;
    height: 14px;
    min-width: 14px;
    border-radius: 50%;
  }

  .project-title h1 {
    font-size: 20px;
    font-weight: 700;
    color: var(--main-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 500;
    background: rgba(0,0,0,0.04);
    color: var(--main-text-muted);
    border: 1px solid var(--main-border);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .action-btn:hover:not(:disabled) {
    background: rgba(0,0,0,0.07);
    color: var(--main-text);
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .edit-btn {
    background: rgba(108, 99, 255, 0.08);
    color: var(--color-primary);
    border-color: rgba(108, 99, 255, 0.2);
  }

  .edit-btn:hover {
    background: rgba(108, 99, 255, 0.15) !important;
    color: var(--color-primary) !important;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .error-banner {
    background: rgba(255, 101, 132, 0.1);
    border-left: 3px solid var(--color-accent-1);
    padding: 10px 20px;
    font-size: 13px;
    color: var(--color-accent-1);
    flex-shrink: 0;
  }

  /* Tabs */
  .tabs-bar {
    display: flex;
    gap: 0;
    padding: 0 28px;
    border-bottom: 1px solid var(--main-border);
    background: var(--main-bg-alt);
    flex-shrink: 0;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 12px 18px;
    font-size: 13px;
    font-weight: 500;
    color: var(--main-text-muted);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: all var(--transition-fast);
    margin-bottom: -1px;
  }

  .tab:hover {
    color: var(--main-text);
  }

  .tab.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
    background: rgba(108, 99, 255, 0.04);
  }

  /* Tab content */
  .tab-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Rendered tab */
  .rendered-tab {
    flex: 1;
    overflow-y: auto;
    padding: 32px 28px;
  }

  /* Raw tab */
  .raw-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 16px 28px;
    gap: 12px;
    overflow: hidden;
  }

  .raw-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .raw-size {
    font-size: 12px;
    color: var(--main-text-muted);
    background: rgba(0,0,0,0.04);
    padding: 3px 10px;
    border-radius: 20px;
  }

  .copy-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    font-size: 13px;
  }

  .raw-content {
    flex: 1;
    font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", monospace;
    font-size: 12.5px;
    line-height: 1.6;
    border: 1.5px solid var(--main-border);
    border-radius: var(--radius-md);
    background: #1e1e2e;
    color: #cdd6f4;
    padding: 16px;
    resize: none;
    overflow-y: auto;
    white-space: pre;
  }

  .raw-content:focus {
    border-color: rgba(108, 99, 255, 0.4);
    box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.1);
  }

  /* Info tab */
  .info-tab {
    flex: 1;
    overflow-y: auto;
    padding: 28px;
  }

  .info-card {
    max-width: 600px;
    background: var(--main-bg-alt);
    border: 1px solid var(--main-border);
    border-radius: var(--radius-lg);
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .info-header {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .info-avatar {
    width: 52px;
    height: 52px;
    min-width: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 700;
    color: #fff;
  }

  .info-name {
    font-size: 18px;
    font-weight: 700;
    color: var(--main-text);
    margin-bottom: 4px;
  }

  .info-desc {
    font-size: 13px;
    color: var(--main-text-muted);
    line-height: 1.5;
  }

  .info-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .info-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .info-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--main-text-muted);
  }

  .info-value {
    font-size: 14px;
    color: var(--main-text);
  }

  .info-value.mono {
    font-family: monospace;
    font-size: 12px;
    color: var(--main-text-muted);
    word-break: break-all;
  }

  .info-link-btn {
    font-size: 14px;
    color: var(--color-primary);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    word-break: break-all;
    text-align: left;
    font-family: inherit;
    transition: opacity var(--transition-fast);
  }

  .info-link-btn:hover {
    opacity: 0.8;
    text-decoration: underline;
  }

  .info-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .tag-pill {
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }

  .info-color-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .info-color-dot {
    width: 18px;
    height: 18px;
    border-radius: 50%;
  }

  .info-color-hex {
    font-family: monospace;
    font-size: 13px;
    color: var(--main-text);
  }

  .info-actions {
    padding-top: 8px;
    border-top: 1px solid var(--main-border);
  }

  .btn-primary {
    background: var(--color-primary);
    color: #fff;
    padding: 9px 20px;
    border-radius: var(--radius-sm);
    font-weight: 500;
    font-size: 14px;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-primary:hover {
    background: #5a52e0;
  }

  .btn-secondary {
    background: rgba(108, 99, 255, 0.1);
    color: var(--color-primary);
    padding: 6px 14px;
    border-radius: var(--radius-sm);
    font-weight: 500;
    font-size: 13px;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-secondary:hover {
    background: rgba(108, 99, 255, 0.18);
  }
</style>
