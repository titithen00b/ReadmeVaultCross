<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  const shortcuts = [
    { key: "⌘N",  label: "Nouveau projet" },
    { key: "⌘O",  label: "Ouvrir un fichier README local" },
    { key: "⌘I",  label: "Importer depuis GitHub" },
    { key: "⌘D",  label: "Dupliquer le projet sélectionné" },
    { key: "⌘/",  label: "Afficher cette aide" },
    { key: "⌘⌫", label: "Supprimer le(s) projet(s) sélectionné(s)" },
    { key: "⎋",   label: "Fermer / Annuler" },
  ];

  const features = [
    { icon: "⑂", title: "Import GitHub", desc: "Colle une URL de dépôt pour récupérer le README automatiquement." },
    { icon: "📄", title: "Import local", desc: "Ouvre un fichier .md — le titre est détecté automatiquement." },
    { icon: "📌", title: "Épingler", desc: "Clic droit sur un projet pour le garder en tête de liste." },
    { icon: "⇅",  title: "Trier", desc: "Par nom, date, taille ou manuellement par glisser-déposer." },
    { icon: "☑",  title: "Multi-sélection", desc: "⌘+clic pour sélectionner plusieurs projets, puis supprimer." },
    { icon: "↻",  title: "Rafraîchir", desc: "Met à jour le README depuis GitHub en un clic." },
  ];

  const resources = [
    { label: "Code source sur GitHub", url: "https://github.com/Titithen00b/ReadmeVault" },
    { label: "Notes de version", url: "https://github.com/Titithen00b/ReadmeVault/releases" },
    { label: "Signaler un problème", url: "https://github.com/Titithen00b/ReadmeVault/issues" },
  ];

  import { invoke } from "@tauri-apps/api/core";

  function openUrl(url: string) {
    invoke("open_url", { url }).catch(() => window.open(url, "_blank"));
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="overlay" on:click={() => dispatch("close")} role="dialog" aria-modal="true">
  <div class="modal" on:click|stopPropagation>

    <div class="modal-header">
      <h2>Aide ReadmeVault</h2>
      <button class="close-x" on:click={() => dispatch("close")}>✕</button>
    </div>

    <div class="content">

      <section>
        <h3 class="section-title">Raccourcis clavier</h3>
        <div class="shortcuts">
          {#each shortcuts as s}
            <div class="shortcut-row">
              <kbd>{s.key}</kbd>
              <span>{s.label}</span>
            </div>
          {/each}
        </div>
      </section>

      <section>
        <h3 class="section-title">Fonctionnalités</h3>
        <div class="features">
          {#each features as f}
            <div class="feature-row">
              <span class="feature-icon">{f.icon}</span>
              <div>
                <div class="feature-title">{f.title}</div>
                <div class="feature-desc">{f.desc}</div>
              </div>
            </div>
          {/each}
        </div>
      </section>

      <section>
        <h3 class="section-title">Ressources</h3>
        <div class="resources">
          {#each resources as r}
            <button class="resource-link" on:click={() => openUrl(r.url)}>
              <span>{r.label}</span>
              <span class="arrow">→</span>
            </button>
          {/each}
        </div>
      </section>

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
    width: 520px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-lg);
    animation: slideUp 150ms ease;
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
    flex-shrink: 0;
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

  .close-x:hover {
    background: rgba(255,255,255,0.08);
    color: var(--main-text);
  }

  .content {
    overflow-y: auto;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  section { display: flex; flex-direction: column; gap: 10px; }

  .section-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-primary);
    margin: 0;
  }

  /* Raccourcis */
  .shortcuts {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: rgba(0,0,0,0.04);
    border: 1px solid var(--main-border);
    border-radius: 10px;
    padding: 8px 12px;
  }

  .shortcut-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 5px 0;
    font-size: 13px;
    color: var(--main-text);
    border-bottom: 1px solid var(--main-border);
  }

  .shortcut-row:last-child { border-bottom: none; }

  kbd {
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 11px;
    background: rgba(108, 99, 255, 0.12);
    color: var(--color-primary);
    border: 1px solid rgba(108, 99, 255, 0.25);
    border-radius: 5px;
    padding: 2px 7px;
    min-width: 36px;
    text-align: center;
    flex-shrink: 0;
  }

  /* Fonctionnalités */
  .features {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .feature-row {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .feature-icon {
    font-size: 18px;
    width: 28px;
    text-align: center;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .feature-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--main-text);
    margin-bottom: 2px;
  }

  .feature-desc {
    font-size: 12px;
    color: var(--main-text-muted);
    line-height: 1.5;
  }

  /* Ressources */
  .resources {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .resource-link {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 10px 14px;
    background: rgba(108, 99, 255, 0.06);
    border: 1px solid rgba(108, 99, 255, 0.15);
    border-radius: 8px;
    color: var(--color-primary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: background var(--transition-fast);
  }

  .resource-link:hover {
    background: rgba(108, 99, 255, 0.14);
  }

  .arrow {
    opacity: 0.6;
    font-size: 14px;
  }
</style>
