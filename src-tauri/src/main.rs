#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{Manager, State};
use std::sync::Mutex;
use log::info;

struct AppState {
    backend_url: String,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to AIRIS", name)
}

#[tauri::command]
fn get_backend_url(state: State<Mutex<AppState>>) -> String {
    let app_state = state.lock().unwrap();
    app_state.backend_url.clone()
}

#[tauri::command]
fn set_backend_url(url: String, state: State<Mutex<AppState>>) {
    let mut app_state = state.lock().unwrap();
    app_state.backend_url = url;
    info!("Backend URL updated");
}

fn main() {
    env_logger::init();

    let app_state = Mutex::new(AppState {
        backend_url: "http://localhost:8000".to_string(),
    });

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            greet,
            get_backend_url,
            set_backend_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
