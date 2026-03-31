<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { addProject, updateProject } from "../store";
  import { ACCENT_COLORS, generateId, nowISO } from "../types";
  import type { Project } from "../types";

  export let project: Project | null = null;
  export let prefillName: string = "";
  export let prefillReadme: string = "";

  const dispatch = createEventDispatcher();
  const isEdit = !!project;

  let activeTab: "general" | "readme" = "general";
  let saving = false;
  let error = "";

  // Form fields
  let name = project?.name ?? prefillName ?? "";
  let description = project?.description ?? "";
  let gitURL = project?.gitURL ?? "";
  let tagsRaw = project?.tags?.join(", ") ?? "";
  let color = project?.color ?? ACCENT_COLORS[0];
  let readme = project?.readme ?? prefillReadme ?? "";

  function close() {
    dispatch("close");
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  async function save() {
    error = "";
    if (!name.trim()) {
      error = "Le nom est obligatoire.";
      activeTab = "general";
      return;
    }
    saving = true;
    try {
      const tags = tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (isEdit && project) {
        await updateProject(project.id, {
          name: name.trim(),
          description: description.trim(),
          gitURL: gitURL.trim(),
          tags,
          color,
          readme,
        });
      } else {
        await addProject({
          name: name.trim(),
          description: description.trim(),
          gitURL: gitURL.trim(),
          tags,
          color,
          readme,
          isPinned: false,
        });
      }
      dispatch("close");
    } catch (e: any) {
      error = e?.message ?? String(e);
    } finally {
      saving = false;
    }
  }
</script>

<svelte:window on:keydown={onKeyDown} />

<div class="modal-overlay" on:click|self={close}>
  <div class="modal-box form-modal">
    <!-- Modal header -->
    <div class="modal-header">
      <h2>{isEdit ? "Modifier le projet" : "Nouveau projet"}</h2>
      <button class="close-btn" on:click={close}>✕</button>
    </div>

    <!-- Tabs -->
    <div class="form-tabs">
      <button
        class="form-tab"
        class:active={activeTab === "general"}
        on:click={() => (activeTab = "general")}
      >
        Général
      </button>
      <button
        class="form-tab"
        class:active={activeTab === "readme"}
        on:click={() => (activeTab = "readme")}
      >
        README
      </button>
    </div>

    <!-- Form content -->
    <div class="form-body">
      {#if activeTab === "general"}
        <div class="form-group">
          <label for="proj-name">Nom *</label>
          <input
            id="proj-name"
            type="text"
            bind:value={name}
            placeholder="Nom du projet"
            autofocus
          />
        </div>

        <div class="form-group">
          <label for="proj-desc">Description</label>
          <input
            id="proj-desc"
            type="text"
            bind:value={description}
            placeholder="Courte description (optionnel)"
          />
        </div>

        <div class="form-group">
          <label for="proj-url">URL GitHub</label>
          <input
            id="proj-url"
            type="url"
            bind:value={gitURL}
            placeholder="https://github.com/user/repo"
          />
        </div>

        <div class="form-group">
          <label for="proj-tags">Tags (séparés par des virgules)</label>
          <input
            id="proj-tags"
            type="text"
            bind:value={tagsRaw}
            placeholder="react, typescript, web"
          />
        </div>

        <div class="form-group">
          <label>Couleur</label>
          <div class="color-grid">
            {#each ACCENT_COLORS as c}
              <button
                class="color-swatch"
                class:selected={color === c}
                style="background: {c};"
                title={c}
                on:click={() => (color = c)}
              >
                {#if color === c}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                {/if}
              </button>
            {/each}
          </div>
          <div class="color-preview">
            <span class="color-dot-preview" style="background: {color};"></span>
            <span class="color-hex">{color}</span>
          </div>
        </div>
      {:else}
        <div class="readme-tab-content">
          <label for="proj-readme">Contenu README (Markdown)</label>
          <textarea
            id="proj-readme"
            bind:value={readme}
            placeholder="# Mon projet&#10;&#10;Description en Markdown…"
            rows={20}
            spellcheck="false"
            class="readme-textarea"
          ></textarea>
        </div>
      {/if}
    </div>

    <!-- Error -->
    {#if error}
      <div class="form-error">{error}</div>
    {/if}

    <!-- Footer -->
    <div class="modal-footer">
      <button class="btn-ghost" on:click={close}>Annuler</button>
      <button class="btn-primary" on:click={save} disabled={saving}>
        {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
      </button>
    </div>
  </div>
</div>

<style>
  .form-modal {
    width: 560px;
    max-width: 96vw;
    max-height: 90vh;
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

  .form-tabs {
    display: flex;
    padding: 0 24px;
    border-bottom: 1px solid var(--main-border);
    flex-shrink: 0;
    background: rgba(0,0,0,0.01);
  }

  .form-tab {
    padding: 10px 16px;
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

  .form-tab:hover { color: var(--main-text); }

  .form-tab.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }

  .form-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
  }

  .form-group {
    margin-bottom: 18px;
  }

  .color-grid {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }

  .color-swatch {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    border: 2px solid transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
    outline: none;
  }

  .color-swatch:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .color-swatch.selected {
    border-color: white;
    box-shadow: 0 0 0 3px rgba(0,0,0,0.2);
    transform: scale(1.1);
  }

  .color-preview {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .color-dot-preview {
    width: 16px;
    height: 16px;
    border-radius: 50%;
  }

  .color-hex {
    font-family: monospace;
    font-size: 13px;
    color: var(--main-text-muted);
  }

  .readme-tab-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 8px;
  }

  .readme-textarea {
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 12.5px;
    line-height: 1.6;
    resize: none;
    min-height: 360px;
    background: #1e1e2e;
    color: #cdd6f4;
    border-color: rgba(255,255,255,0.1);
  }

  .form-error {
    margin: 0 24px;
    padding: 10px 14px;
    background: rgba(255, 101, 132, 0.1);
    border: 1px solid rgba(255, 101, 132, 0.2);
    border-radius: var(--radius-sm);
    color: #ff6584;
    font-size: 13px;
    flex-shrink: 0;
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid var(--main-border);
    flex-shrink: 0;
  }

  .btn-primary {
    background: var(--color-primary);
    color: #fff;
    padding: 9px 22px;
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
    padding: 9px 16px;
    border-radius: var(--radius-sm);
    font-size: 14px;
    border: 1px solid var(--main-border);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-ghost:hover { background: rgba(0,0,0,0.04); color: var(--main-text); }
</style>
