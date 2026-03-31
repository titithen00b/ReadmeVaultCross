<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  const year = new Date().getFullYear();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="overlay" on:click={() => dispatch("close")} role="dialog" aria-modal="true">
  <div class="modal" on:click|stopPropagation>

    <div class="header">
      <div class="logo-circle">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      </div>
      <h1 class="app-name">ReadmeVault</h1>
      <span class="app-version">Version 1.0.0</span>
    </div>

    <div class="info-list">
      <div class="info-row">
        <span class="info-label">Développeur</span>
        <span class="info-value">Valentin R. (Titithen00b)</span>
      </div>
      <div class="info-row">
        <span class="info-label">Technologie</span>
        <span class="info-value">Tauri 2 · Svelte · Rust</span>
      </div>
      <div class="info-row">
        <span class="info-label">Stockage</span>
        <span class="info-value">Local · Application Support</span>
      </div>
      <div class="info-row">
        <span class="info-label">Licence</span>
        <span class="info-value">MIT</span>
      </div>
    </div>

    <p class="tagline">Centralisez tous vos READMEs en un seul endroit.</p>

    <p class="copyright">© {year} Valentin R. (Titithen00b)</p>

    <button class="close-btn" on:click={() => dispatch("close")}>Fermer</button>
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
    width: 380px;
    overflow: hidden;
    box-shadow: var(--shadow-lg);
    animation: slideUp 150ms ease;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .header {
    width: 100%;
    background: linear-gradient(135deg, #6C63FF 0%, #FF6584 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 32px 24px 24px;
  }

  .logo-circle {
    width: 80px;
    height: 80px;
    border-radius: 20px;
    background: rgba(255,255,255,0.15);
    border: 1.5px solid rgba(255,255,255,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  }

  .app-name {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    margin: 0;
  }

  .app-version {
    font-size: 12px;
    color: rgba(255,255,255,0.75);
    background: rgba(255,255,255,0.15);
    padding: 2px 12px;
    border-radius: 20px;
  }

  .info-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 20px 24px 0;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    padding: 9px 0;
    border-bottom: 1px solid var(--main-border);
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .info-label {
    color: var(--main-text-muted);
  }

  .info-value {
    color: var(--main-text);
    font-weight: 600;
  }

  .tagline {
    font-size: 13px;
    color: var(--main-text-muted);
    text-align: center;
    padding: 16px 24px 4px;
    line-height: 1.5;
  }

  .copyright {
    font-size: 11px;
    color: var(--main-text-muted);
    opacity: 0.6;
    padding: 0 24px 20px;
  }

  .close-btn {
    margin: 0 24px 24px;
    align-self: stretch;
    background: var(--color-primary);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .close-btn:hover {
    background: #5a52e0;
  }
</style>
