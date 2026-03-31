<script lang="ts">
  import { onMount } from "svelte";
  import { listen } from "@tauri-apps/api/event";
  import Sidebar from "./lib/components/Sidebar.svelte";
  import ProjectDetail from "./lib/components/ProjectDetail.svelte";
  import ProjectForm from "./lib/components/ProjectForm.svelte";
  import ImportGitHub from "./lib/components/ImportGitHub.svelte";
  import ImportBulkGitHub from "./lib/components/ImportBulkGitHub.svelte";
  import SettingsModal from "./lib/components/SettingsModal.svelte";
  import AboutModal from "./lib/components/AboutModal.svelte";
  import HelpModal from "./lib/components/HelpModal.svelte";
  import UpdaterModal from "./lib/components/UpdaterModal.svelte";
  import { load, selectedProject } from "./lib/store";

  // Modal state
  let showProjectForm = false;
  let editingProject = null;
  let showImportGitHub = false;
  let showImportBulk = false;
  let showSettings = false;
  let showAbout = false;
  let showHelp = false;
  let showUpdater = false;
  let importedFileMd: { name: string; content: string } | null = null;

  onMount(async () => {
    await load();
    // Écoute des événements du menu natif
    await listen("menu:new-project", () => handleNewProject());
    await listen("menu:import-github", () => (showImportGitHub = true));
    await listen("menu:import-bulk", () => (showImportBulk = true));
    await listen("menu:import-file", () => handleImportFile());
    await listen("menu:about", () => (showAbout = true));
    await listen("menu:help", () => (showHelp = true));
    await listen("menu:check-update", () => (showUpdater = true));
  });

  function handleNewProject() {
    editingProject = null;
    showProjectForm = true;
  }

  function handleEditProject(e: CustomEvent) {
    editingProject = e.detail;
    showProjectForm = true;
  }

  function handleImportFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,.txt";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const content = await file.text();
      const name = file.name.replace(/\.(md|markdown|txt)$/i, "");
      importedFileMd = { name, content };
      editingProject = null;
      showProjectForm = true;
    };
    input.click();
  }
</script>

<div class="app-layout">
  <Sidebar
    on:newProject={handleNewProject}
    on:importGitHub={() => (showImportGitHub = true)}
    on:importBulk={() => (showImportBulk = true)}
    on:importFile={handleImportFile}
    on:openSettings={() => (showSettings = true)}
    on:editProject={handleEditProject}
  />

  <main class="main-area">
    {#if $selectedProject}
      <ProjectDetail
        project={$selectedProject}
        on:editProject={handleEditProject}
      />
    {:else}
      <div class="empty-state">
        <div class="empty-icon">📄</div>
        <h2>Aucun projet sélectionné</h2>
        <p>Sélectionnez un projet dans la sidebar ou créez-en un nouveau.</p>
        <button class="btn-primary" on:click={handleNewProject}>
          + Nouveau projet
        </button>
      </div>
    {/if}
  </main>
</div>

{#if showProjectForm}
  <ProjectForm
    project={editingProject}
    prefillName={importedFileMd?.name ?? ""}
    prefillReadme={importedFileMd?.content ?? ""}
    on:close={() => {
      showProjectForm = false;
      editingProject = null;
      importedFileMd = null;
    }}
  />
{/if}

{#if showImportGitHub}
  <ImportGitHub on:close={() => (showImportGitHub = false)} />
{/if}

{#if showImportBulk}
  <ImportBulkGitHub on:close={() => (showImportBulk = false)} />
{/if}

{#if showSettings}
  <SettingsModal on:close={() => (showSettings = false)} />
{/if}

{#if showAbout}
  <AboutModal on:close={() => (showAbout = false)} />
{/if}

{#if showHelp}
  <HelpModal on:close={() => (showHelp = false)} />
{/if}

{#if showUpdater}
  <UpdaterModal on:close={() => (showUpdater = false)} />
{/if}

<style>
  .app-layout {
    display: flex;
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }

  .main-area {
    flex: 1;
    overflow: hidden;
    background: var(--main-bg);
    display: flex;
    flex-direction: column;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: var(--main-text-muted);
    text-align: center;
    padding: 40px;
  }

  .empty-icon {
    font-size: 64px;
    opacity: 0.3;
  }

  .empty-state h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--main-text);
    margin: 0;
  }

  .empty-state p {
    font-size: 14px;
    max-width: 300px;
    line-height: 1.6;
  }

  .btn-primary {
    background: var(--color-primary);
    color: #fff;
    padding: 10px 22px;
    border-radius: var(--radius-sm);
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-primary:hover {
    background: #5a52e0;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(108, 99, 255, 0.35);
  }
</style>
