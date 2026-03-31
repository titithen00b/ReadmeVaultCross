<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import { check } from "@tauri-apps/plugin-updater";
  import { relaunch } from "@tauri-apps/plugin-process";

  const dispatch = createEventDispatcher();

  type State = "checking" | "available" | "downloading" | "ready" | "uptodate" | "error";

  let state: State = "checking";
  let version = "";
  let progress = 0;
  let errorMsg = "";
  let updater: Awaited<ReturnType<typeof check>> = null;

  onMount(async () => {
    try {
      updater = await check();
      if (updater?.available) {
        version = updater.version;
        state = "available";
      } else {
        state = "uptodate";
      }
    } catch (e) {
      errorMsg = String(e);
      state = "error";
    }
  });

  async function install() {
    if (!updater) return;
    state = "downloading";
    let downloaded = 0;
    let total = 0;
    await updater.downloadAndInstall((event) => {
      if (event.event === "Started") {
        total = event.data.contentLength ?? 0;
      } else if (event.event === "Progress") {
        downloaded += event.data.chunkLength;
        progress = total > 0 ? Math.round((downloaded / total) * 100) : 0;
      } else if (event.event === "Finished") {
        state = "ready";
      }
    });
  }

  async function doRelaunch() {
    await relaunch();
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="overlay" on:click={() => dispatch("close")} role="dialog" aria-modal="true">
  <div class="modal" on:click|stopPropagation>

    <div class="modal-header">
      <h2>Mises à jour</h2>
      <button class="close-x" on:click={() => dispatch("close")}>✕</button>
    </div>

    <div class="content">

      {#if state === "checking"}
        <div class="status">
          <span class="spinner">⟳</span>
          <span>Vérification en cours…</span>
        </div>

      {:else if state === "uptodate"}
        <div class="status ok">
          <span class="icon">✓</span>
          <span>ReadmeVault est à jour.</span>
        </div>
        <button class="btn-secondary" on:click={() => dispatch("close")}>Fermer</button>

      {:else if state === "available"}
        <div class="update-info">
          <div class="update-badge">Mise à jour disponible</div>
          <p class="update-version">Version <strong>{version}</strong></p>
          <p class="update-desc">Une nouvelle version de ReadmeVault est disponible. Veux-tu l'installer maintenant ?</p>
        </div>
        <div class="actions">
          <button class="btn-secondary" on:click={() => dispatch("close")}>Plus tard</button>
          <button class="btn-primary" on:click={install}>Installer</button>
        </div>

      {:else if state === "downloading"}
        <div class="status">
          <span class="spinner">⟳</span>
          <span>Téléchargement… {progress > 0 ? `${progress}%` : ""}</span>
        </div>
        {#if progress > 0}
          <div class="progress-bar">
            <div class="progress-fill" style="width: {progress}%"></div>
          </div>
        {/if}

      {:else if state === "ready"}
        <div class="status ok">
          <span class="icon">✓</span>
          <span>Mise à jour prête. Relance l'app pour appliquer.</span>
        </div>
        <div class="actions">
          <button class="btn-secondary" on:click={() => dispatch("close")}>Plus tard</button>
          <button class="btn-primary" on:click={doRelaunch}>Relancer</button>
        </div>

      {:else if state === "error"}
        <div class="status error">
          <span class="icon">✗</span>
          <span>Impossible de vérifier les mises à jour.</span>
        </div>
        <p class="error-detail">{errorMsg}</p>
        <button class="btn-secondary" on:click={() => dispatch("close")}>Fermer</button>
      {/if}

    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 150ms ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .modal {
    background: var(--main-bg-alt);
    border: 1px solid var(--main-border);
    border-radius: 16px;
    width: 400px;
    overflow: hidden;
    box-shadow: var(--shadow-lg);
    animation: slideUp 150ms ease;
    display: flex;
    flex-direction: column;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--main-border);
  }

  .modal-header h2 {
    font-size: 17px;
    font-weight: 700;
    color: var(--main-text);
    margin: 0;
  }

  .close-x {
    background: none;
    border: none;
    color: var(--main-text-muted);
    font-size: 14px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
  }

  .close-x:hover { background: rgba(255,255,255,0.08); color: var(--main-text); }

  .content {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: var(--main-text);
  }

  .status.ok  { color: #43D9AD; }
  .status.error { color: #FF6584; }

  .spinner {
    font-size: 18px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  .icon { font-size: 18px; }

  .update-info { display: flex; flex-direction: column; gap: 8px; }

  .update-badge {
    display: inline-block;
    background: rgba(108, 99, 255, 0.15);
    color: var(--color-primary);
    border: 1px solid rgba(108, 99, 255, 0.3);
    border-radius: 20px;
    padding: 3px 12px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    width: fit-content;
  }

  .update-version {
    font-size: 15px;
    color: var(--main-text);
    margin: 0;
  }

  .update-desc {
    font-size: 13px;
    color: var(--main-text-muted);
    line-height: 1.5;
    margin: 0;
  }

  .progress-bar {
    height: 6px;
    background: rgba(255,255,255,0.08);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: 3px;
    transition: width 200ms ease;
  }

  .error-detail {
    font-size: 11px;
    color: var(--main-text-muted);
    background: rgba(255,101,132,0.08);
    border: 1px solid rgba(255,101,132,0.2);
    border-radius: 6px;
    padding: 8px 12px;
    margin: 0;
    word-break: break-all;
  }

  .actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .btn-primary {
    background: var(--color-primary);
    color: #fff;
    padding: 8px 20px;
    border-radius: var(--radius-sm);
    font-weight: 500;
    font-size: 13px;
    border: none;
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .btn-primary:hover { background: #5a52e0; }

  .btn-secondary {
    background: transparent;
    color: var(--main-text-muted);
    padding: 8px 20px;
    border-radius: var(--radius-sm);
    font-weight: 500;
    font-size: 13px;
    border: 1px solid var(--main-border);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-secondary:hover { color: var(--main-text); border-color: var(--main-text-muted); }
</style>
