use serde::{Deserialize, Serialize};
use tauri::State;
use crate::AppState;

// ─── Shared types ─────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Income {
    pub id: String,
    pub user_id: i64,
    pub title: String,
    pub amount: f64,
    pub date: String,
    pub note: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Expense {
    pub id: String,
    pub user_id: i64,
    pub title: String,
    pub amount: f64,
    pub category_id: String,
    pub date: String,
    pub note: Option<String>,
    pub recurring: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Category {
    pub id: String,
    pub user_id: i64,
    pub name: String,
    pub color: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Goal {
    pub id: String,
    pub user_id: i64,
    pub title: String,
    pub target_amount: f64,
    pub current_amount: f64,
    pub deadline: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Event {
    pub id: String,
    pub user_id: i64,
    pub title: String,
    pub date: String,
    pub color: String,
    pub description: Option<String>,
    pub reminder_days: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    pub user_id: i64,
    pub theme: String,
    pub currency: String,
    pub notif_enabled: bool,
    pub notif_days: i64,
    pub sidebar_collapsed: bool,
    pub custom_primary: Option<String>,
    pub custom_accent: Option<String>,
    pub custom_font_size: Option<i64>,
    pub custom_radius: Option<i64>,
}

// ─── Income commands ───────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_incomes(user_id: i64, state: State<'_, AppState>) -> Result<Vec<Income>, String> {
    let pool = &state.db;
    let rows: Vec<(String, i64, String, f64, String, Option<String>)> = sqlx::query_as(
        "SELECT id, user_id, title, amount, date, note FROM incomes WHERE user_id = ? ORDER BY date DESC"
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(|(id, user_id, title, amount, date, note)| {
        Income { id, user_id, title, amount, date, note }
    }).collect())
}

#[tauri::command]
pub async fn add_income(
    user_id: i64, title: String, amount: f64, date: String, note: Option<String>,
    state: State<'_, AppState>,
) -> Result<Income, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let pool = &state.db;
    sqlx::query(
        "INSERT INTO incomes (id, user_id, title, amount, date, note) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&id).bind(user_id).bind(&title).bind(amount).bind(&date).bind(&note)
    .execute(pool).await.map_err(|e| e.to_string())?;
    Ok(Income { id, user_id, title, amount, date, note })
}

#[tauri::command]
pub async fn update_income(
    id: String, title: String, amount: f64, date: String, note: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    sqlx::query("UPDATE incomes SET title=?, amount=?, date=?, note=? WHERE id=?")
        .bind(&title).bind(amount).bind(&date).bind(&note).bind(&id)
        .execute(&state.db).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn delete_income(id: String, state: State<'_, AppState>) -> Result<(), String> {
    sqlx::query("DELETE FROM incomes WHERE id=?")
        .bind(&id).execute(&state.db).await.map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Expense commands ──────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_expenses(user_id: i64, state: State<'_, AppState>) -> Result<Vec<Expense>, String> {
    let rows: Vec<(String, i64, String, f64, String, String, Option<String>, i64)> =
        sqlx::query_as(
            "SELECT id, user_id, title, amount, category_id, date, note, recurring FROM expenses WHERE user_id = ? ORDER BY date DESC"
        )
        .bind(user_id)
        .fetch_all(&state.db).await.map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(|(id, user_id, title, amount, category_id, date, note, recurring)| {
        Expense { id, user_id, title, amount, category_id, date, note, recurring: recurring != 0 }
    }).collect())
}

#[tauri::command]
pub async fn add_expense(
    user_id: i64, title: String, amount: f64, category_id: String,
    date: String, note: Option<String>, recurring: bool,
    state: State<'_, AppState>,
) -> Result<Expense, String> {
    let id = uuid::Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO expenses (id, user_id, title, amount, category_id, date, note, recurring) VALUES (?,?,?,?,?,?,?,?)"
    )
    .bind(&id).bind(user_id).bind(&title).bind(amount)
    .bind(&category_id).bind(&date).bind(&note).bind(recurring as i64)
    .execute(&state.db).await.map_err(|e| e.to_string())?;
    Ok(Expense { id, user_id, title, amount, category_id, date, note, recurring })
}

#[tauri::command]
pub async fn update_expense(
    id: String, title: String, amount: f64, category_id: String,
    date: String, note: Option<String>, recurring: bool,
    state: State<'_, AppState>,
) -> Result<(), String> {
    sqlx::query("UPDATE expenses SET title=?,amount=?,category_id=?,date=?,note=?,recurring=? WHERE id=?")
        .bind(&title).bind(amount).bind(&category_id).bind(&date)
        .bind(&note).bind(recurring as i64).bind(&id)
        .execute(&state.db).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn delete_expense(id: String, state: State<'_, AppState>) -> Result<(), String> {
    sqlx::query("DELETE FROM expenses WHERE id=?")
        .bind(&id).execute(&state.db).await.map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Category commands ─────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_categories(user_id: i64, state: State<'_, AppState>) -> Result<Vec<Category>, String> {
    let rows: Vec<(String, i64, String, String)> = sqlx::query_as(
        "SELECT id, user_id, name, color FROM categories WHERE user_id = ? ORDER BY name ASC"
    )
    .bind(user_id)
    .fetch_all(&state.db).await.map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(|(id, user_id, name, color)| {
        Category { id, user_id, name, color }
    }).collect())
}

#[tauri::command]
pub async fn add_category(
    user_id: i64, name: String, color: String,
    state: State<'_, AppState>,
) -> Result<Category, String> {
    let id = uuid::Uuid::new_v4().to_string();
    sqlx::query("INSERT INTO categories (id, user_id, name, color) VALUES (?,?,?,?)")
        .bind(&id).bind(user_id).bind(&name).bind(&color)
        .execute(&state.db).await.map_err(|e| e.to_string())?;
    Ok(Category { id, user_id, name, color })
}

#[tauri::command]
pub async fn update_category(id: String, name: String, color: String, state: State<'_, AppState>) -> Result<(), String> {
    sqlx::query("UPDATE categories SET name=?, color=? WHERE id=?")
        .bind(&name).bind(&color).bind(&id)
        .execute(&state.db).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn delete_category(id: String, state: State<'_, AppState>) -> Result<(), String> {
    sqlx::query("DELETE FROM categories WHERE id=?")
        .bind(&id).execute(&state.db).await.map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Goal commands ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_goals(user_id: i64, state: State<'_, AppState>) -> Result<Vec<Goal>, String> {
    let rows: Vec<(String, i64, String, f64, f64, Option<String>, Option<String>)> = sqlx::query_as(
        "SELECT id, user_id, title, target_amount, current_amount, deadline, color FROM goals WHERE user_id = ?"
    )
    .bind(user_id)
    .fetch_all(&state.db).await.map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(|(id, user_id, title, target_amount, current_amount, deadline, color)| {
        Goal { id, user_id, title, target_amount, current_amount, deadline, color }
    }).collect())
}

#[tauri::command]
pub async fn add_goal(
    user_id: i64, title: String, target_amount: f64,
    current_amount: f64, deadline: Option<String>, color: Option<String>,
    state: State<'_, AppState>,
) -> Result<Goal, String> {
    let id = uuid::Uuid::new_v4().to_string();
    sqlx::query("INSERT INTO goals (id, user_id, title, target_amount, current_amount, deadline, color) VALUES (?,?,?,?,?,?,?)")
        .bind(&id).bind(user_id).bind(&title).bind(target_amount)
        .bind(current_amount).bind(&deadline).bind(&color)
        .execute(&state.db).await.map_err(|e| e.to_string())?;
    Ok(Goal { id, user_id, title, target_amount, current_amount, deadline, color })
}

#[tauri::command]
pub async fn update_goal(
    id: String, title: String, target_amount: f64,
    current_amount: f64, deadline: Option<String>, color: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    sqlx::query("UPDATE goals SET title=?,target_amount=?,current_amount=?,deadline=?,color=? WHERE id=?")
        .bind(&title).bind(target_amount).bind(current_amount)
        .bind(&deadline).bind(&color).bind(&id)
        .execute(&state.db).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn delete_goal(id: String, state: State<'_, AppState>) -> Result<(), String> {
    sqlx::query("DELETE FROM goals WHERE id=?")
        .bind(&id).execute(&state.db).await.map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Event commands ────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_events(user_id: i64, state: State<'_, AppState>) -> Result<Vec<Event>, String> {
    let rows: Vec<(String, i64, String, String, String, Option<String>, Option<i64>)> = sqlx::query_as(
        "SELECT id, user_id, title, date, color, description, reminder_days FROM events WHERE user_id = ?"
    )
    .bind(user_id)
    .fetch_all(&state.db).await.map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(|(id, user_id, title, date, color, description, reminder_days)| {
        Event { id, user_id, title, date, color, description, reminder_days }
    }).collect())
}

#[tauri::command]
pub async fn add_event(
    user_id: i64, title: String, date: String, color: String,
    description: Option<String>, reminder_days: Option<i64>,
    state: State<'_, AppState>,
) -> Result<Event, String> {
    let id = uuid::Uuid::new_v4().to_string();
    sqlx::query("INSERT INTO events (id, user_id, title, date, color, description, reminder_days) VALUES (?,?,?,?,?,?,?)")
        .bind(&id).bind(user_id).bind(&title).bind(&date)
        .bind(&color).bind(&description).bind(reminder_days)
        .execute(&state.db).await.map_err(|e| e.to_string())?;
    Ok(Event { id, user_id, title, date, color, description, reminder_days })
}

#[tauri::command]
pub async fn update_event(
    id: String, title: String, date: String, color: String,
    description: Option<String>, reminder_days: Option<i64>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    sqlx::query("UPDATE events SET title=?,date=?,color=?,description=?,reminder_days=? WHERE id=?")
        .bind(&title).bind(&date).bind(&color).bind(&description).bind(reminder_days).bind(&id)
        .execute(&state.db).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn delete_event(id: String, state: State<'_, AppState>) -> Result<(), String> {
    sqlx::query("DELETE FROM events WHERE id=?")
        .bind(&id).execute(&state.db).await.map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Settings commands ─────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_settings(user_id: i64, state: State<'_, AppState>) -> Result<Settings, String> {
    let row: (i64, String, String, i64, i64, i64, Option<String>, Option<String>, Option<i64>, Option<i64>) =
        sqlx::query_as(
            "SELECT user_id, theme, currency, notif_enabled, notif_days, sidebar_collapsed, custom_primary, custom_accent, custom_font_size, custom_radius FROM settings WHERE user_id = ?"
        )
        .bind(user_id)
        .fetch_one(&state.db).await.map_err(|e| e.to_string())?;

    Ok(Settings {
        user_id: row.0,
        theme: row.1,
        currency: row.2,
        notif_enabled: row.3 != 0,
        notif_days: row.4,
        sidebar_collapsed: row.5 != 0,
        custom_primary: row.6,
        custom_accent: row.7,
        custom_font_size: row.8,
        custom_radius: row.9,
    })
}

#[tauri::command]
pub async fn save_settings(settings: Settings, state: State<'_, AppState>) -> Result<(), String> {
    sqlx::query(
        "UPDATE settings SET theme=?,currency=?,notif_enabled=?,notif_days=?,sidebar_collapsed=?,custom_primary=?,custom_accent=?,custom_font_size=?,custom_radius=? WHERE user_id=?"
    )
    .bind(&settings.theme)
    .bind(&settings.currency)
    .bind(settings.notif_enabled as i64)
    .bind(settings.notif_days)
    .bind(settings.sidebar_collapsed as i64)
    .bind(&settings.custom_primary)
    .bind(&settings.custom_accent)
    .bind(settings.custom_font_size)
    .bind(settings.custom_radius)
    .bind(settings.user_id)
    .execute(&state.db).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn import_backup(
    user_id: i64,
    incomes: Vec<Income>,
    expenses: Vec<Expense>,
    categories: Vec<Category>,
    goals: Vec<Goal>,
    events: Vec<Event>,
    settings: Settings,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut tx = state.db.begin().await.map_err(|e| e.to_string())?;

    // 1. Delete existing data for user
    sqlx::query("DELETE FROM incomes WHERE user_id = ?").bind(user_id).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM expenses WHERE user_id = ?").bind(user_id).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM categories WHERE user_id = ?").bind(user_id).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM goals WHERE user_id = ?").bind(user_id).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM events WHERE user_id = ?").bind(user_id).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM settings WHERE user_id = ?").bind(user_id).execute(&mut *tx).await.map_err(|e| e.to_string())?;

    // 2. Insert settings
    sqlx::query(
        "INSERT INTO settings (user_id, theme, currency, notif_enabled, notif_days, sidebar_collapsed, custom_primary, custom_accent, custom_font_size, custom_radius) VALUES (?,?,?,?,?,?,?,?,?,?)"
    )
    .bind(user_id)
    .bind(&settings.theme)
    .bind(&settings.currency)
    .bind(settings.notif_enabled as i64)
    .bind(settings.notif_days)
    .bind(settings.sidebar_collapsed as i64)
    .bind(&settings.custom_primary)
    .bind(&settings.custom_accent)
    .bind(settings.custom_font_size)
    .bind(settings.custom_radius)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    // 3. Insert categories
    for cat in categories {
        sqlx::query("INSERT INTO categories (id, user_id, name, color) VALUES (?,?,?,?)")
            .bind(&cat.id)
            .bind(user_id)
            .bind(&cat.name)
            .bind(&cat.color)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    // 4. Insert incomes
    for inc in incomes {
        sqlx::query("INSERT INTO incomes (id, user_id, title, amount, date, note) VALUES (?,?,?,?,?,?)")
            .bind(&inc.id)
            .bind(user_id)
            .bind(&inc.title)
            .bind(inc.amount)
            .bind(&inc.date)
            .bind(&inc.note)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    // 5. Insert expenses
    for exp in expenses {
        sqlx::query("INSERT INTO expenses (id, user_id, title, amount, category_id, date, note, recurring) VALUES (?,?,?,?,?,?,?,?)")
            .bind(&exp.id)
            .bind(user_id)
            .bind(&exp.title)
            .bind(exp.amount)
            .bind(&exp.category_id)
            .bind(&exp.date)
            .bind(&exp.note)
            .bind(exp.recurring as i64)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    // 6. Insert goals
    for goal in goals {
        sqlx::query("INSERT INTO goals (id, user_id, title, target_amount, current_amount, deadline, color) VALUES (?,?,?,?,?,?,?)")
            .bind(&goal.id)
            .bind(user_id)
            .bind(&goal.title)
            .bind(goal.target_amount)
            .bind(goal.current_amount)
            .bind(&goal.deadline)
            .bind(&goal.color)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    // 7. Insert events
    for ev in events {
        sqlx::query("INSERT INTO events (id, user_id, title, date, color, description, reminder_days) VALUES (?,?,?,?,?,?,?)")
            .bind(&ev.id)
            .bind(user_id)
            .bind(&ev.title)
            .bind(&ev.date)
            .bind(&ev.color)
            .bind(&ev.description)
            .bind(ev.reminder_days)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}

