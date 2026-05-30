mod auth;
mod commands;

use sqlx::SqlitePool;
use tauri::Manager;

pub struct AppState {
    pub db: SqlitePool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:budgetflow.db", vec![])
                .build(),
        )
        .setup(|app| {
            let app_data_dir = app.path().app_local_data_dir()
                .expect("Failed to get app local data dir");
            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data dir");

            let db_path = app_data_dir.join("budgetflow.db");
            let options = sqlx::sqlite::SqliteConnectOptions::new()
                .filename(&db_path)
                .create_if_missing(true);

            let rt = tokio::runtime::Runtime::new().unwrap();
            let pool = rt.block_on(async {
                let pool = SqlitePool::connect_with(options).await
                    .expect("Failed to connect to database");
                init_tables(&pool).await.expect("Failed to init DB tables");
                pool
            });

            app.manage(AppState { db: pool });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Auth
            auth::register,
            auth::login,
            auth::change_password,
            auth::delete_account,
            // Incomes
            commands::get_incomes,
            commands::add_income,
            commands::update_income,
            commands::delete_income,
            // Expenses
            commands::get_expenses,
            commands::add_expense,
            commands::update_expense,
            commands::delete_expense,
            // Categories
            commands::get_categories,
            commands::add_category,
            commands::update_category,
            commands::delete_category,
            // Goals
            commands::get_goals,
            commands::add_goal,
            commands::update_goal,
            commands::delete_goal,
            // Events
            commands::get_events,
            commands::add_event,
            commands::update_event,
            commands::delete_event,
            // Settings
            commands::get_settings,
            commands::save_settings,
            commands::import_backup,
        ])
        .run(tauri::generate_context!())
        .expect("error while running BudgetFlow");
}

async fn init_tables(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    // Enable foreign keys
    sqlx::query("PRAGMA foreign_keys = ON;").execute(pool).await?;

    // Create users table
    sqlx::query(r#"
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            username    TEXT UNIQUE NOT NULL,
            email       TEXT UNIQUE NOT NULL,
            password    TEXT NOT NULL,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );
    "#).execute(pool).await?;

    // Create incomes table
    sqlx::query(r#"
        CREATE TABLE IF NOT EXISTS incomes (
            id       TEXT PRIMARY KEY,
            user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title    TEXT NOT NULL,
            amount   REAL NOT NULL,
            date     TEXT NOT NULL,
            note     TEXT
        );
    "#).execute(pool).await?;

    // Create expenses table
    sqlx::query(r#"
        CREATE TABLE IF NOT EXISTS expenses (
            id           TEXT PRIMARY KEY,
            user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title        TEXT NOT NULL,
            amount       REAL NOT NULL,
            category_id  TEXT NOT NULL,
            date         TEXT NOT NULL,
            note         TEXT,
            recurring    INTEGER NOT NULL DEFAULT 0
        );
    "#).execute(pool).await?;

    // Create categories table
    sqlx::query(r#"
        CREATE TABLE IF NOT EXISTS categories (
            id       TEXT PRIMARY KEY,
            user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name     TEXT NOT NULL,
            color    TEXT NOT NULL
        );
    "#).execute(pool).await?;

    // Create goals table
    sqlx::query(r#"
        CREATE TABLE IF NOT EXISTS goals (
            id              TEXT PRIMARY KEY,
            user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title           TEXT NOT NULL,
            target_amount   REAL NOT NULL,
            current_amount  REAL NOT NULL DEFAULT 0,
            deadline        TEXT,
            color           TEXT
        );
    "#).execute(pool).await?;

    // Create events table
    sqlx::query(r#"
        CREATE TABLE IF NOT EXISTS events (
            id            TEXT PRIMARY KEY,
            user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title         TEXT NOT NULL,
            date          TEXT NOT NULL,
            color         TEXT NOT NULL,
            description   TEXT,
            reminder_days INTEGER
        );
    "#).execute(pool).await?;

    // Create settings table
    sqlx::query(r#"
        CREATE TABLE IF NOT EXISTS settings (
            user_id           INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            theme             TEXT NOT NULL DEFAULT 'dark',
            currency          TEXT NOT NULL DEFAULT 'TND',
            notif_enabled     INTEGER NOT NULL DEFAULT 1,
            notif_days        INTEGER NOT NULL DEFAULT 3,
            sidebar_collapsed INTEGER NOT NULL DEFAULT 0,
            custom_primary    TEXT,
            custom_accent     TEXT,
            custom_font_size  INTEGER,
            custom_radius     INTEGER
        );
    "#).execute(pool).await?;

    Ok(())
}
