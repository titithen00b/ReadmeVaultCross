<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import {
    filteredProjects,
    selectedId,
    searchQuery,
    sortMode,
    activeTag,
    allTags,
    togglePin,
    deleteProject,
    duplicateProject,
    reorderProjects,
    projects,
  } from "../store";
  import { getInitials } from "../types";
  import type { Project, SortMode } from "../types";
  import { get } from "svelte/store";

  const dispatch = createEventDispatcher();

  // Context menu
  let contextMenu: { x: number; y: number; project: Project } | null = null;
  let confirmDeleteId: string | null = null;

  // Drag state
  let dragId: string | null = null;
  let dragOverId: string | null = null;

  // Multi-selection
  let multiSelectedIds: Set<string> = new Set();
  let lastClickedId: string | null = null;

  function handleItemClick(e: MouseEvent, project: Project) {
    contextMenu = null;
    const isMeta = e.metaKey || e.ctrlKey;
    const isShift = e.shiftKey;

    if (isMeta) {
      // Cmd/Ctrl+click: toggle item in multi-selection
      const next = new Set(multiSelectedIds);
      if (next.has(project.id)) {
        next.delete(project.id);
      } else {
        next.add(project.id);
      }
      multiSelectedIds = next;
      lastClickedId = project.id;
    } else if (isShift && lastClickedId) {
      // Shift+click: select range
      const list = $filteredProjects;
      const fromIdx = list.findIndex((p) => p.id === lastClickedId);
      const toIdx = list.findIndex((p) => p.id === project.id);
      if (fromIdx !== -1 && toIdx !== -1) {
        const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
        const next = new Set<string>();
        for (let i = start; i <= end; i++) next.add(list[i].id);
        multiSelectedIds = next;
      }
    } else {
      // Normal click: clear multi-selection, select single
      multiSelectedIds = new Set();
      selectedId.set(project.id);
      lastClickedId = project.id;
    }
  }

  async function deleteMultiSelected() {
    if (multiSelectedIds.size === 0) return;
    for (const id of multiSelectedIds) {
      await deleteProject(id);
    }
    multiSelectedIds = new Set();
  }

  function selectProject(id: string) {
    selectedId.set(id);
    contextMenu = null;
  }

  function onRightClick(e: MouseEvent, project: Project) {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 180);
    const y = Math.min(e.clientY, window.innerHeight - 200);
    contextMenu = { x, y, project };
  }

  function closeContextMenu() {
    contextMenu = null;
  }

  async function ctxEdit() {
    if (!contextMenu) return;
    dispatch("editProject", contextMenu.project);
    closeContextMenu();
  }

  async function ctxDuplicate() {
    if (!contextMenu) return;
    await duplicateProject(contextMenu.project.id);
    closeContextMenu();
  }

  async function ctxPin() {
    if (!contextMenu) return;
    await togglePin(contextMenu.project.id);
    closeContextMenu();
  }

  function ctxDelete() {
    if (!contextMenu) return;
    confirmDeleteId = contextMenu.project.id;
  }

  async function ctxDeleteConfirm() {
    if (!confirmDeleteId) return;
    await deleteProject(confirmDeleteId);
    confirmDeleteId = null;
    closeContextMenu();
  }

  function ctxDeleteCancel() {
    confirmDeleteId = null;
    closeContextMenu();
  }

  // Drag and drop
  function onDragStart(e: DragEvent, id: string) {
    dragId = id;
    e.dataTransfer!.effectAllowed = "move";
  }

  function onDragOver(e: DragEvent, id: string) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "move";
    dragOverId = id;
  }

  function onDrop(e: DragEvent, targetId: string) {
    e.preventDefault();
    if (!dragId || dragId === targetId) {
      dragId = null;
      dragOverId = null;
      return;
    }
    const list = get(projects);
    const from = list.findIndex((p) => p.id === dragId);
    const to = list.findIndex((p) => p.id === targetId);
    if (from === -1 || to === -1) return;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    reorderProjects(next);
    sortMode.set("manual");
    dragId = null;
    dragOverId = null;
  }

  function onDragEnd() {
    dragId = null;
    dragOverId = null;
  }

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: "manual", label: "Manuel" },
    { value: "nameAZ", label: "Nom A→Z" },
    { value: "nameZA", label: "Nom Z→A" },
    { value: "recentlyUpdated", label: "Récemment modifié" },
    { value: "oldest", label: "Plus ancien" },
    { value: "biggest", label: "Plus grand" },
    { value: "smallest", label: "Plus petit" },
  ];

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
</script>

<svelte:window on:click={closeContextMenu} />

<aside class="sidebar">
  <!-- Search -->
  <div class="search-bar">
    <span class="search-icon">🔍</span>
    <input
      type="text"
      placeholder="Rechercher…"
      bind:value={$searchQuery}
      class="search-input"
    />
    {#if $searchQuery}
      <button class="clear-btn" on:click={() => searchQuery.set("")}>✕</button>
    {/if}
  </div>

  <!-- Sort -->
  <div class="sort-bar">
    <select bind:value={$sortMode} class="sort-select">
      {#each sortOptions as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
  </div>

  <!-- Project list -->
  <div class="project-list">
    {#if $filteredProjects.length === 0}
      <div class="empty-list">Aucun projet trouvé</div>
    {/if}
    {#each $filteredProjects as project (project.id)}
      <div
        class="project-item"
        class:active={$selectedId === project.id && multiSelectedIds.size === 0}
        class:multi-selected={multiSelectedIds.has(project.id)}
        class:drag-over={dragOverId === project.id}
        draggable={$sortMode === "manual"}
        role="button"
        tabindex="0"
        on:click={(e) => handleItemClick(e, project)}
        on:keydown={(e) => e.key === "Enter" && selectProject(project.id)}
        on:contextmenu={(e) => onRightClick(e, project)}
        on:dragstart={(e) => onDragStart(e, project.id)}
        on:dragover={(e) => onDragOver(e, project.id)}
        on:drop={(e) => onDrop(e, project.id)}
        on:dragend={onDragEnd}
      >
        <!-- Color dot with initials -->
        <div
          class="project-avatar"
          style="background: {project.color};"
        >
          {getInitials(project.name)}
        </div>

        <!-- Content -->
        <div class="project-info">
          <div class="project-header">
            <span class="project-name">{project.name}</span>
            <div class="project-badges">
              {#if project.isPinned}
                <span class="pin-icon" title="Épinglé">📌</span>
              {/if}
              {#if project.gitURL}
                <span class="github-icon" title="GitHub">⑂</span>
              {/if}
            </div>
          </div>
          {#if project.description}
            <div class="project-desc">{project.description}</div>
          {/if}
          {#if project.tags.length > 0}
            <div class="project-tags">
              {#each project.tags.slice(0, 3) as tag}
                <span class="tag-chip" style="background: {project.color}20; color: {project.color};">
                  {tag}
                </span>
              {/each}
            </div>
          {/if}
          <div class="project-date">{formatDate(project.updatedAt)}</div>
        </div>
      </div>
    {/each}
  </div>

  <!-- Tag filter chips -->
  {#if $allTags.length > 0}
    <div class="tag-filter-section">
      <div class="tag-filter-label">Filtrer par tag</div>
      <div class="tag-chips">
        <button
          class="tag-filter-chip"
          class:active={$activeTag === null}
          on:click={() => activeTag.set(null)}
        >
          Tous
        </button>
        {#each $allTags as tag}
          <button
            class="tag-filter-chip"
            class:active={$activeTag === tag}
            on:click={() => activeTag.set($activeTag === tag ? null : tag)}
          >
            {tag}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Multi-selection banner -->
  {#if multiSelectedIds.size > 1}
    <div class="multi-select-bar">
      <span>{multiSelectedIds.size} projets sélectionnés</span>
      <div class="multi-select-actions">
        <button class="multi-clear-btn" on:click={() => (multiSelectedIds = new Set())}>
          Annuler
        </button>
        <button class="multi-delete-btn" on:click={deleteMultiSelected}>
          Supprimer ({multiSelectedIds.size})
        </button>
      </div>
    </div>
  {/if}

  <!-- Bottom toolbar -->
  <div class="sidebar-toolbar">
    <button
      class="toolbar-btn primary-btn"
      title="Nouveau projet"
      on:click={() => dispatch("newProject")}
    >
      <span>+</span>
    </button>
    <button
      class="toolbar-btn"
      title="Importer depuis GitHub"
      on:click={() => dispatch("importGitHub")}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    </button>
    <button
      class="toolbar-btn"
      title="Import en masse GitHub"
      on:click={() => dispatch("importBulk")}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    </button>
    <button
      class="toolbar-btn"
      title="Importer fichier .md"
      on:click={() => dispatch("importFile")}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    </button>
    <button
      class="toolbar-btn"
      title="Paramètres"
      on:click={() => dispatch("openSettings")}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </button>
  </div>
</aside>

<!-- Context menu -->
{#if contextMenu}
  <div
    class="context-menu"
    style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
    on:click|stopPropagation
  >
    <button class="ctx-item" on:click={ctxEdit}>
      <span>✏️</span> Modifier
    </button>
    <button class="ctx-item" on:click={ctxDuplicate}>
      <span>📋</span> Dupliquer
    </button>
    <button class="ctx-item" on:click={ctxPin}>
      <span>{contextMenu.project.isPinned ? "📌" : "📍"}</span>
      {contextMenu.project.isPinned ? "Désépingler" : "Épingler"}
    </button>
    <div class="ctx-divider"></div>
    {#if confirmDeleteId === contextMenu.project.id}
      <div class="ctx-confirm">
        <span class="ctx-confirm-label">Supprimer ?</span>
        <div class="ctx-confirm-btns">
          <button class="ctx-confirm-no" on:click={ctxDeleteCancel}>Annuler</button>
          <button class="ctx-confirm-yes" on:click={ctxDeleteConfirm}>Supprimer</button>
        </div>
      </div>
    {:else}
      <button class="ctx-item danger" on:click={ctxDelete}>
        <span>🗑️</span> Supprimer
      </button>
    {/if}
  </div>
{/if}

<style>
  .sidebar {
    width: var(--sidebar-width);
    min-width: var(--sidebar-width);
    max-width: var(--sidebar-width);
    background: var(--sidebar-bg);
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    border-right: 1px solid var(--sidebar-border);
  }

  /* Search */
  .search-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 12px 8px;
    position: relative;
  }

  .search-icon {
    font-size: 13px;
    position: absolute;
    left: 22px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.5;
    pointer-events: none;
  }

  .search-input {
    flex: 1;
    background: var(--sidebar-input-bg);
    border: 1.5px solid transparent;
    border-radius: var(--radius-sm);
    color: var(--sidebar-text);
    padding: 7px 28px 7px 30px;
    font-size: 13px;
    width: 100%;
  }

  .search-input:focus {
    border-color: rgba(108, 99, 255, 0.4);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.1);
  }

  .search-input::placeholder {
    color: var(--sidebar-text-muted);
  }

  .clear-btn {
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    color: var(--sidebar-text-muted);
    font-size: 11px;
    padding: 2px 5px;
    border-radius: 4px;
    cursor: pointer;
  }

  .clear-btn:hover {
    color: var(--sidebar-text);
    background: rgba(255, 255, 255, 0.1);
  }

  /* Sort */
  .sort-bar {
    padding: 0 12px 8px;
  }

  .sort-select {
    width: 100%;
    background: var(--sidebar-input-bg);
    border: 1.5px solid transparent;
    border-radius: var(--radius-sm);
    color: var(--sidebar-text);
    padding: 6px 10px;
    font-size: 12px;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236c7086' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 28px;
  }

  .sort-select:focus {
    outline: none;
    border-color: rgba(108, 99, 255, 0.4);
  }

  .sort-select option {
    background: #2a2a3e;
    color: var(--sidebar-text);
  }

  /* Project list */
  .project-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px 8px;
  }

  .empty-list {
    text-align: center;
    color: var(--sidebar-text-muted);
    font-size: 13px;
    padding: 32px 16px;
  }

  .project-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 8px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background var(--transition-fast);
    margin-bottom: 2px;
    position: relative;
    user-select: none;
  }

  .project-item:hover {
    background: var(--sidebar-item-hover);
  }

  .project-item.active {
    background: var(--sidebar-item-active);
  }

  .project-item.multi-selected {
    background: rgba(108, 99, 255, 0.18);
    outline: 1.5px solid rgba(108, 99, 255, 0.35);
    outline-offset: -1px;
  }

  .multi-select-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(108, 99, 255, 0.15);
    border-top: 1px solid rgba(108, 99, 255, 0.25);
    font-size: 12px;
    color: var(--color-primary);
    font-weight: 500;
  }

  .multi-select-actions {
    display: flex;
    gap: 6px;
  }

  .multi-clear-btn {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.08);
    color: var(--sidebar-text-muted);
    border: none;
    cursor: pointer;
  }

  .multi-delete-btn {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 4px;
    background: rgba(255, 101, 132, 0.2);
    color: #ff6584;
    border: none;
    cursor: pointer;
    font-weight: 600;
  }

  .multi-delete-btn:hover {
    background: rgba(255, 101, 132, 0.35);
  }

  .project-item.drag-over {
    background: rgba(108, 99, 255, 0.15);
    outline: 2px dashed rgba(108, 99, 255, 0.4);
    outline-offset: -2px;
  }

  .project-avatar {
    width: 38px;
    height: 38px;
    min-width: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.5px;
  }

  .project-info {
    flex: 1;
    min-width: 0;
  }

  .project-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    margin-bottom: 2px;
  }

  .project-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--sidebar-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .project-badges {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
  }

  .pin-icon, .github-icon {
    font-size: 11px;
    opacity: 0.8;
  }

  .github-icon {
    font-size: 14px;
    font-weight: 700;
    color: var(--sidebar-text-muted);
    line-height: 1;
  }

  .project-desc {
    font-size: 11px;
    color: var(--sidebar-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
  }

  .project-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-bottom: 4px;
  }

  .tag-chip {
    font-size: 10px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 20px;
    letter-spacing: 0.02em;
  }

  .project-date {
    font-size: 10px;
    color: var(--sidebar-text-muted);
    opacity: 0.7;
  }

  /* Tag filter */
  .tag-filter-section {
    padding: 8px 12px;
    border-top: 1px solid var(--sidebar-border);
  }

  .tag-filter-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--sidebar-text-muted);
    margin-bottom: 6px;
  }

  .tag-chips {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .tag-filter-chip {
    font-size: 11px;
    font-weight: 500;
    padding: 3px 9px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.06);
    color: var(--sidebar-text-muted);
    border: 1px solid transparent;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .tag-filter-chip:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--sidebar-text);
  }

  .tag-filter-chip.active {
    background: rgba(108, 99, 255, 0.2);
    color: var(--color-primary);
    border-color: rgba(108, 99, 255, 0.3);
  }

  /* Toolbar */
  .sidebar-toolbar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 10px 12px;
    border-top: 1px solid var(--sidebar-border);
  }

  .toolbar-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    border-radius: var(--radius-sm);
    background: rgba(255, 255, 255, 0.06);
    color: var(--sidebar-text-muted);
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: 14px;
  }

  .toolbar-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: var(--sidebar-text);
  }

  .toolbar-btn.primary-btn {
    background: rgba(108, 99, 255, 0.25);
    color: var(--color-primary);
    font-size: 20px;
    font-weight: 300;
  }

  .toolbar-btn.primary-btn:hover {
    background: rgba(108, 99, 255, 0.4);
    color: #fff;
  }

  /* Context menu */
  .context-menu {
    position: fixed;
    z-index: 200;
    background: #2a2a3e;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    padding: 4px;
    min-width: 170px;
    animation: slideUp 150ms ease;
  }

  .ctx-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    background: none;
    color: var(--sidebar-text);
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .ctx-item:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .ctx-item.danger {
    color: #ff6584;
  }

  .ctx-item.danger:hover {
    background: rgba(255, 101, 132, 0.12);
  }

  .ctx-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
    margin: 4px 0;
  }

  .ctx-confirm {
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ctx-confirm-label {
    font-size: 12px;
    color: #ff6584;
    font-weight: 600;
  }

  .ctx-confirm-btns {
    display: flex;
    gap: 6px;
  }

  .ctx-confirm-no {
    flex: 1;
    font-size: 11px;
    padding: 4px 0;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.08);
    color: var(--sidebar-text-muted);
    border: none;
    cursor: pointer;
  }

  .ctx-confirm-yes {
    flex: 1;
    font-size: 11px;
    padding: 4px 0;
    border-radius: 4px;
    background: rgba(255, 101, 132, 0.25);
    color: #ff6584;
    border: none;
    cursor: pointer;
    font-weight: 600;
  }

  .ctx-confirm-yes:hover {
    background: rgba(255, 101, 132, 0.4);
  }
</style>
