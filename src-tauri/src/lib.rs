use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{Emitter, Manager};

/// Returns the base data directory for the app.
fn data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Cannot resolve app data dir: {e}"))
}

/// Returns path to projects.json
fn projects_file(base: &PathBuf) -> PathBuf {
    base.join("projects.json")
}

/// Returns path to readmes/<id>.md
fn readme_file(base: &PathBuf, id: &str) -> PathBuf {
    base.join("readmes").join(format!("{id}.md"))
}

// ── Commands ─────────────────────────────────────────────────────────────────

/// Load all project metadata and all readme contents from disk.
/// Returns: { projects: [...metadata], readmes: { id: content } }
#[tauri::command]
fn load_projects(
    app: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let base = data_dir(&app)?;
    let proj_file = projects_file(&base);
    let readmes_dir = base.join("readmes");

    // Read metadata array
    let projects: Vec<serde_json::Value> = if proj_file.exists() {
        let raw = fs::read_to_string(&proj_file)
            .map_err(|e| format!("Cannot read projects.json: {e}"))?;
        serde_json::from_str(&raw)
            .map_err(|e| format!("Cannot parse projects.json: {e}"))?
    } else {
        Vec::new()
    };

    // Read readme files
    let mut readmes: HashMap<String, String> = HashMap::new();
    if readmes_dir.exists() {
        for entry in fs::read_dir(&readmes_dir)
            .map_err(|e| format!("Cannot read readmes dir: {e}"))?
        {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) == Some("md") {
                    if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                        if let Ok(content) = fs::read_to_string(&path) {
                            readmes.insert(stem.to_string(), content);
                        }
                    }
                }
            }
        }
    }

    Ok(serde_json::json!({
        "projects": projects,
        "readmes": readmes
    }))
}

/// Save metadata array and all readme contents to disk.
#[tauri::command]
fn save_projects(
    app: tauri::AppHandle,
    metadata: serde_json::Value,
    readmes: HashMap<String, String>,
) -> Result<(), String> {
    let base = data_dir(&app)?;
    let readmes_dir = base.join("readmes");

    // Ensure directories exist
    fs::create_dir_all(&base)
        .map_err(|e| format!("Cannot create data dir: {e}"))?;
    fs::create_dir_all(&readmes_dir)
        .map_err(|e| format!("Cannot create readmes dir: {e}"))?;

    // Write metadata
    let json = serde_json::to_string_pretty(&metadata)
        .map_err(|e| format!("Cannot serialize projects: {e}"))?;
    fs::write(projects_file(&base), json)
        .map_err(|e| format!("Cannot write projects.json: {e}"))?;

    // Write each readme file
    for (id, content) in &readmes {
        fs::write(readme_file(&base, id), content)
            .map_err(|e| format!("Cannot write readme {id}: {e}"))?;
    }

    Ok(())
}

/// Delete a single readme file.
#[tauri::command]
fn delete_readme(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let base = data_dir(&app)?;
    let path = readme_file(&base, &id);
    if path.exists() {
        fs::remove_file(&path)
            .map_err(|e| format!("Cannot delete readme {id}: {e}"))?;
    }
    Ok(())
}

/// Open a URL in the system default browser.
#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    open::that(&url).map_err(|e| format!("Cannot open URL: {e}"))
}

// ── Menu ──────────────────────────────────────────────────────────────────────

fn build_menu(app: &tauri::AppHandle) -> Result<Menu<tauri::Wry>, tauri::Error> {
    // Menu application (premier menu = nom de l'app sur macOS)
    let app_menu = Submenu::with_items(
        app,
        "ReadmeVault",
        true,
        &[
            &MenuItem::with_id(app, "about", "À propos de ReadmeVault", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::hide(app, None)?,
            &PredefinedMenuItem::hide_others(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, Some("Quitter ReadmeVault"))?,
        ],
    )?;

    let fichier = Submenu::with_items(
        app,
        "Fichier",
        true,
        &[
            &MenuItem::with_id(app, "new_project", "Nouveau projet", true, Some("CmdOrCtrl+N"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "import_github", "Importer depuis GitHub…", true, Some("CmdOrCtrl+I"))?,
            &MenuItem::with_id(app, "import_bulk", "Importer en masse depuis GitHub…", true, None::<&str>)?,
            &MenuItem::with_id(app, "import_file", "Ouvrir un fichier .md…", true, Some("CmdOrCtrl+O"))?,
        ],
    )?;

    let edition = Submenu::with_items(
        app,
        "Édition",
        true,
        &[
            &PredefinedMenuItem::undo(app, Some("Annuler"))?,
            &PredefinedMenuItem::redo(app, Some("Rétablir"))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::cut(app, Some("Couper"))?,
            &PredefinedMenuItem::copy(app, Some("Copier"))?,
            &PredefinedMenuItem::paste(app, Some("Coller"))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::select_all(app, Some("Tout sélectionner"))?,
        ],
    )?;

    let aide = Submenu::with_items(
        app,
        "Aide",
        true,
        &[
            &MenuItem::with_id(app, "help", "Aide ReadmeVault", true, Some("CmdOrCtrl+/"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "check_update", "Rechercher des mises à jour…", true, None::<&str>)?,
        ],
    )?;

    Menu::with_items(app, &[&app_menu, &fichier, &edition, &aide])
}

// ── App entry point ───────────────────────────────────────────────────────────

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            let menu = build_menu(app.handle())?;
            app.set_menu(menu)?;
            Ok(())
        })
        .on_menu_event(|app, event| match event.id().as_ref() {
            "new_project" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.emit("menu:new-project", ());
                }
            }
            "import_github" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.emit("menu:import-github", ());
                }
            }
            "import_file" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.emit("menu:import-file", ());
                }
            }
            "import_bulk" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.emit("menu:import-bulk", ());
                }
            }
            "about" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.emit("menu:about", ());
                }
            }
            "help" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.emit("menu:help", ());
                }
            }
            "check_update" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.emit("menu:check-update", ());
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            load_projects,
            save_projects,
            delete_readme,
            open_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
