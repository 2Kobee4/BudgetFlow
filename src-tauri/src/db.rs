use serde::{Deserialize, Serialize};
use tauri_plugin_sql::{DbPool, SqlitePool};

pub const DB_URL: &str = "sqlite:budgetflow.db";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: i64,
    pub username: String,
    pub email: String,
    pub created_at: String,
}

pub async fn init_db(pool: &SqlitePool) -> Result<(), Box<dyn std::error::Error>> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            username    TEXT UNIQUE NOT NULL,
            email       TEXT UNIQUE NOT NULL,
            password    TEXT NOT NULL,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS incomes (
            id          TEXT PRIMARY KEY,
            user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title       TEXT NOT NULL,
            amount      REAL NOT NULL,
            date        TEXT NOT NULL,
            note        TEXT
        );

        CREATE TABLE IF NOT EXISTS expenses (
            id          TEXT PRIMARY KEY,
            user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title       TEXT NOT NULL,
            amount      REAL NOT NULL,
            category_id TEXT NOT NULL,
            date        TEXT NOT NULL,
            note        TEXT,
            recurring   INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS categories (
            id          TEXT PRIMARY KEY,
            user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name        TEXT NOT NULL,
            color       TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS goals (
            id              TEXT PRIMARY KEY,
            user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title           TEXT NOT NULL,
            target_amount   REAL NOT NULL,
            current_amount  REAL NOT NULL DEFAULT 0,
            deadline        TEXT,
            color           TEXT
        );

        CREATE TABLE IF NOT EXISTS events (
            id              TEXT PRIMARY KEY,
            user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title           TEXT NOT NULL,
            date            TEXT NOT NULL,
            color           TEXT NOT NULL,
            description     TEXT,
            reminder_days   INTEGER
        );

        CREATE TABLE IF NOT EXISTS settings (
            user_id         INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            theme           TEXT NOT NULL DEFAULT 'dark',
            currency        TEXT NOT NULL DEFAULT 'TND',
            notif_enabled   INTEGER NOT NULL DEFAULT 1,
            notif_days      INTEGER NOT NULL DEFAULT 3,
            sidebar_collapsed INTEGER NOT NULL DEFAULT 0,
            custom_primary  TEXT,
            custom_accent   TEXT,
            custom_font_size INTEGER,
            custom_radius   INTEGER
        );
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}
