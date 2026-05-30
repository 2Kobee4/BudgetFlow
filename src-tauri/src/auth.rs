use serde::{Deserialize, Serialize};
use tauri::State;
use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthUser {
    pub id: i64,
    pub username: String,
    pub email: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterInput {
    pub username: String,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginInput {
    pub username: String,
    pub password: String,
}

#[tauri::command]
pub async fn register(
    input: RegisterInput,
    state: State<'_, AppState>,
) -> Result<AuthUser, String> {
    // Validate inputs
    if input.username.trim().len() < 3 {
        return Err("Username must be at least 3 characters".to_string());
    }
    if input.password.len() < 6 {
        return Err("Password must be at least 6 characters".to_string());
    }
    if !input.email.contains('@') {
        return Err("Invalid email address".to_string());
    }

    let pool = &state.db;

    // Check if username already exists
    let existing: Option<(i64,)> = sqlx::query_as(
        "SELECT id FROM users WHERE username = ? OR email = ?"
    )
    .bind(&input.username.trim())
    .bind(&input.email.trim())
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?;

    if existing.is_some() {
        return Err("Username or email already taken".to_string());
    }

    // Hash password
    let hashed = bcrypt::hash(&input.password, bcrypt::DEFAULT_COST)
        .map_err(|e| e.to_string())?;

    // Insert user
    let result = sqlx::query(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)"
    )
    .bind(input.username.trim())
    .bind(input.email.trim())
    .bind(&hashed)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    let user_id = result.last_insert_rowid();

    // Create default settings for user
    sqlx::query(
        "INSERT INTO settings (user_id) VALUES (?)"
    )
    .bind(user_id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    // Create default categories
    let default_categories = vec![
        (uuid::Uuid::new_v4().to_string(), "Food & Dining", "#10b981"),
        (uuid::Uuid::new_v4().to_string(), "Transport", "#06b6d4"),
        (uuid::Uuid::new_v4().to_string(), "Shopping", "#f59e0b"),
        (uuid::Uuid::new_v4().to_string(), "Bills", "#ef4444"),
        (uuid::Uuid::new_v4().to_string(), "Entertainment", "#8b5cf6"),
        (uuid::Uuid::new_v4().to_string(), "Health", "#ec4899"),
    ];

    for (id, name, color) in &default_categories {
        sqlx::query(
            "INSERT INTO categories (id, user_id, name, color) VALUES (?, ?, ?, ?)"
        )
        .bind(id)
        .bind(user_id)
        .bind(name)
        .bind(color)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    }

    // Fetch and return user
    let row: (i64, String, String, String) = sqlx::query_as(
        "SELECT id, username, email, created_at FROM users WHERE id = ?"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    let user = AuthUser {
        id: row.0,
        username: row.1,
        email: row.2,
        created_at: row.3,
    };

    Ok(user)
}

#[tauri::command]
pub async fn login(
    input: LoginInput,
    state: State<'_, AppState>,
) -> Result<AuthUser, String> {
    let pool = &state.db;

    // Find user by username
    let row: Option<(i64, String, String, String, String)> = sqlx::query_as(
        "SELECT id, username, email, password, created_at FROM users WHERE username = ?"
    )
    .bind(input.username.trim())
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?;

    match row {
        None => Err("User not found".to_string()),
        Some((id, username, email, hashed_pw, created_at)) => {
            // Verify password
            let valid = bcrypt::verify(&input.password, &hashed_pw)
                .map_err(|e| e.to_string())?;

            if !valid {
                return Err("Incorrect password".to_string());
            }

            Ok(AuthUser { id, username, email, created_at })
        }
    }
}

#[tauri::command]
pub async fn change_password(
    user_id: i64,
    old_password: String,
    new_password: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    if new_password.len() < 6 {
        return Err("New password must be at least 6 characters".to_string());
    }

    let pool = &state.db;

    let row: Option<(String,)> = sqlx::query_as(
        "SELECT password FROM users WHERE id = ?"
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?;

    let (hashed_pw,) = row.ok_or("User not found")?;

    let valid = bcrypt::verify(&old_password, &hashed_pw)
        .map_err(|e| e.to_string())?;

    if !valid {
        return Err("Current password is incorrect".to_string());
    }

    let new_hash = bcrypt::hash(&new_password, bcrypt::DEFAULT_COST)
        .map_err(|e| e.to_string())?;

    sqlx::query("UPDATE users SET password = ? WHERE id = ?")
        .bind(&new_hash)
        .bind(user_id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_account(
    user_id: i64,
    password: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let pool = &state.db;

    let row: Option<(String,)> = sqlx::query_as(
        "SELECT password FROM users WHERE id = ?"
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?;

    let (hashed_pw,) = row.ok_or("User not found")?;

    let valid = bcrypt::verify(&password, &hashed_pw)
        .map_err(|e| e.to_string())?;

    if !valid {
        return Err("Incorrect password".to_string());
    }

    // CASCADE will delete all user data
    sqlx::query("DELETE FROM users WHERE id = ?")
        .bind(user_id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
