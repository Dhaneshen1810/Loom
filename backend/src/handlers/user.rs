use std::sync::Arc;

use axum::{Extension, Json, extract::State, response::IntoResponse};

use crate::{
    AppError, AppState,
    model::Claims,
    repositories::user::{find_all_users, find_user_by_id},
};

pub async fn get_all_users_handler(
    State(data): State<Arc<AppState>>,
) -> Result<impl IntoResponse, AppError> {
    let users = find_all_users(&data.db).await.map_err(AppError::Database)?;

    Ok(Json(serde_json::json!({
        "status": "success",
        "users": users
            .iter()
            .map(|user| {
                serde_json::json!({
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "coins": user.coins,
                    "role": user.role,
                })
            })
            .collect::<Vec<_>>(),
    })))
}

pub async fn get_current_user_handler(
    Extension(claims): Extension<Claims>,
    State(data): State<Arc<AppState>>,
) -> Result<impl IntoResponse, AppError> {
    let user = find_user_by_id(&data.db, claims.sub)
        .await
        .map_err(AppError::Database)?
        .ok_or_else(|| AppError::NotFound("User not found.".to_string()))?;

    Ok(Json(serde_json::json!({
        "status": "success",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "coins": user.coins
        }
    })))
}
