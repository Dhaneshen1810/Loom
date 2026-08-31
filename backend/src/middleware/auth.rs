use crate::{
    AppError, AppState,
    model::{Claims, UserRole},
    repositories::user::find_user_by_id,
};
use axum::{
    Extension, Json,
    extract::{Request, State},
    http::{StatusCode, header::AUTHORIZATION},
    middleware::Next,
    response::{IntoResponse, Response},
};
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};
use std::sync::Arc;

pub async fn require_auth(
    State(data): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Response {
    let token = match request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|header| header.to_str().ok())
        .and_then(|header| header.strip_prefix("Bearer "))
    {
        Some(token) => token,
        None => return unauthorized("Missing or invalid Authorization header"),
    };

    let mut validation = Validation::new(Algorithm::HS256);
    validation.set_required_spec_claims(&["sub", "exp"]);

    let token_data = match decode::<Claims>(
        token,
        &DecodingKey::from_secret(data.env.jwt_secret.as_bytes()),
        &validation,
    ) {
        Ok(token_data) => token_data,
        Err(_) => return unauthorized("Invalid or expired token"),
    };

    request.extensions_mut().insert(token_data.claims);
    next.run(request).await
}

pub async fn require_admin(
    State(data): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    request: Request,
    next: Next,
) -> Response {
    match find_user_by_id(&data.db, claims.sub).await {
        Ok(Some(user)) if user.role == UserRole::Admin => next.run(request).await,
        Ok(Some(_)) => forbidden("Admin access required"),
        Ok(None) => unauthorized("User not found"),
        Err(error) => AppError::Database(error).into_response(),
    }
}

fn forbidden(message: &str) -> Response {
    (
        StatusCode::FORBIDDEN,
        Json(serde_json::json!({
            "status": "error",
            "message": message
        })),
    )
        .into_response()
}

fn unauthorized(message: &str) -> Response {
    (
        StatusCode::UNAUTHORIZED,
        Json(serde_json::json!({
            "status": "error",
            "message": message
        })),
    )
        .into_response()
}
