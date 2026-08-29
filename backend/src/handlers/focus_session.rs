use axum::{Extension, Json, extract::Path, extract::State, response::IntoResponse};
use chrono::Utc;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    AppState,
    model::{Claims, CreateFocusSessionSchema, NewSession},
    repositories::focus_session::{
        create_focus_session, find_all_focus_sessions, find_focus_session_by_id,
        update_focus_session,
    },
};

pub async fn get_focus_sessions_handler(State(data): State<Arc<AppState>>) -> impl IntoResponse {
    // Fetch and return all focus sessions
    let fetched_focus_sessions = find_all_focus_sessions(&data.db).await;

    match fetched_focus_sessions {
        Ok(focus_sessions) => {
            return Json(serde_json::json!({
                "status": "success",
                "message": "Focus sessions found.",
                "sessions": focus_sessions,
            }));
        }
        Err(error) => {
            eprint!("Error: {}", error);
            return Json(serde_json::json!({
                "status": "error",
                "message": "Failed to fetch focus sessions."
            }));
        }
    }
}

pub async fn start_focus_session_handler(
    Extension(claims): Extension<Claims>,
    State(data): State<Arc<AppState>>,
    Json(body): Json<CreateFocusSessionSchema>,
) -> impl IntoResponse {
    let user_id = claims.sub;

    let new_session = NewSession::new(user_id, body.goal_seconds as i64);

    match create_focus_session(&data.db, &new_session).await {
        Ok(session) => {
            return Json(serde_json::json!({
                "status": "success",
                "message": "Session has started",
                "session_id": session.id,
            }));
        }
        Err(_) => {
            return Json(serde_json::json!({
                "status": "success",
                "message": "Session has started"
            }));
        }
    };
}

pub async fn end_focus_session_handler(
    Path(id): Path<Uuid>,
    Extension(claims): Extension<Claims>,
    State(data): State<Arc<AppState>>,
) -> impl IntoResponse {
    let user_id = claims.sub;
    // Get session by id
    let fetched_session = find_focus_session_by_id(&data.db, id).await;

    // If session exist, update end time
    let mut session = match fetched_session {
        Ok(Some(session)) => session,
        Ok(None) => {
            return Json(serde_json::json!({
                "status": "error",
                "message": "Session not found"
            }));
        }
        Err(_) => {
            return Json(serde_json::json!({
                "status": "error",
                "message": "Failed to fetch session"
            }));
        }
    };

    if &session.user_id != &user_id {
        return Json(serde_json::json!({
            "status": "error",
            "message": "Session not found"
        }));
    }

    session.set_end_time(Utc::now());

    match update_focus_session(&data.db, &session).await {
        Ok(_) => {
            return Json(serde_json::json!({
                "status": "success",
                "message": "Session has ended."
            }));
        }
        Err(_) => {
            return Json(serde_json::json!({
                "status": "error",
                "message": "Session not found"
            }));
        }
    };
}
