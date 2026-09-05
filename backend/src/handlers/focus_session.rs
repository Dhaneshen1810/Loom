use axum::{Extension, Json, extract::Path, extract::State, response::IntoResponse};
use chrono::{DateTime, Utc};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    AppError, AppState, AppSuccess,
    model::{Claims, CreateFocusSessionSchema, FocusSession, NewSession},
    repositories::{
        focus_session::{
            create_focus_session, find_all_focus_sessions, find_focus_session_by_id,
            update_focus_session,
        },
        user::update_user_coins,
    },
};

pub async fn get_focus_sessions_handler(
    State(data): State<Arc<AppState>>,
) -> Result<impl IntoResponse, AppError> {
    // Fetch and return all focus sessions
    let fetched_focus_sessions = find_all_focus_sessions(&data.db).await;

    match fetched_focus_sessions {
        Ok(focus_sessions) => {
            return Ok(AppSuccess::with_data(
                "Focus sessions found.",
                focus_sessions,
            ));
        }
        Err(error) => {
            eprint!("Error: {}", error);
            return Err(AppError::NotFound("Failed to fetch focus sessions.".into()));
        }
    }
}

pub async fn start_focus_session_handler(
    Extension(claims): Extension<Claims>,
    State(data): State<Arc<AppState>>,
    Json(body): Json<CreateFocusSessionSchema>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = claims.sub;
    let goal_description = body
        .normalized_goal_description()
        .map_err(AppError::Invalid)?;

    let new_session = NewSession::new(user_id, body.goal_seconds, goal_description);
    let session = create_focus_session(&data.db, &new_session).await?;

    Ok(Json(serde_json::json!({
        "status": "success",
        "message": "Session has started",
        "session_id": session.id,
    })))
}

pub async fn end_focus_session_handler(
    Path(id): Path<Uuid>,
    Extension(claims): Extension<Claims>,
    State(data): State<Arc<AppState>>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = claims.sub;
    // Get session by id
    let fetched_session = find_focus_session_by_id(&data.db, id).await;

    // If session exist, update end time
    let mut session = match fetched_session {
        Ok(Some(session)) => session,
        Ok(None) => {
            return Err(AppError::NotFound("Session not found".into()));
        }
        Err(_) => {
            return Err(AppError::NotFound("Failed to fetch session".into()));
        }
    };

    if session.user_id != user_id {
        return Err(AppError::NotFound("Session not found".into()));
    }

    session.set_end_time(Utc::now());

    match update_focus_session(&data.db, &session).await {
        Ok(_) => {
            // Update user coins
            let reward_coins = calculate_coins_reward(&session);
            match update_user_coins(&data.db, session.user_id, reward_coins).await {
                Ok(user) => Ok(AppSuccess::with_data(
                    "Session has ended.",
                    serde_json::json!({
                        "reward_coins": reward_coins,
                        "user": {
                            "coins": user.coins
                        }
                    }),
                )),
                Err(_) => Err(AppError::NotFound("Session not found".into())),
            }
        }
        Err(_) => Err(AppError::NotFound("Session not found".into())),
    }
}

pub fn calculate_coins_reward(focus_session: &FocusSession) -> i64 {
    match focus_session.end_time {
        Some(end_time) => {
            // Verify if focus session has reached its goal.
            if seconds_between(focus_session.start_time, end_time) >= focus_session.goal_seconds {
                // if goal has been reached, calculate and return reward
                match focus_session.goal_seconds {
                    // 0 - 5 min
                    0..=300 => 5,
                    // up to 10 min
                    301..=600 => 10,
                    // up to 15 min
                    601..=900 => 15,
                    // up to 20 min
                    901..=1200 => 20,
                    // up to 25 min
                    1201..=1500 => 25,
                    // up to 30 min
                    1501..=1800 => 30,
                    // up to 35 min
                    1801..=2100 => 35,
                    // up to 40 min
                    2101..=2400 => 40,
                    // up to 45 min
                    2401..=2700 => 45,
                    // up to 50 min
                    2701..=3000 => 50,
                    // up to 55 min
                    3001..=3300 => 55,
                    // 1 hour or longer
                    _ => 60,
                }
            } else {
                // if not, return 0
                0
            }
        }
        None => 0,
    }
}

fn seconds_between(start: DateTime<Utc>, end: DateTime<Utc>) -> i64 {
    end.signed_duration_since(start).num_seconds()
}
