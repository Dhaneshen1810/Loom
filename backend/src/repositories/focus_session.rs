use crate::model::{FocusSession, NewSession};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn find_focus_session_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<FocusSession>, sqlx::Error> {
    sqlx::query_as::<_, FocusSession>(
        "SELECT *
         FROM focus_sessions
         WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn find_all_focus_sessions(pool: &PgPool) -> Result<Vec<FocusSession>, sqlx::Error> {
    sqlx::query_as::<_, FocusSession>(
        "SELECT *
         FROM focus_sessions
         ORDER BY start_time DESC",
    )
    .fetch_all(pool)
    .await
}

pub async fn create_focus_session(
    pool: &PgPool,
    new_session: &NewSession,
) -> Result<FocusSession, sqlx::Error> {
    sqlx::query_as::<_, FocusSession>("INSERT INTO focus_sessions (user_id, start_time, end_time, goal_seconds) VALUES ($1, $2, $3, $4) RETURNING id, user_id, start_time, end_time, goal_seconds, created_at, updated_at")
        .bind(&new_session.user_id)
        .bind(&new_session.start_time)
        .bind(&new_session.end_time)
        .bind(new_session.goal_seconds)
    .fetch_one(pool)
    .await
}

pub async fn update_focus_session(
    pool: &PgPool,
    session: &FocusSession,
) -> Result<FocusSession, sqlx::Error> {
    sqlx::query_as::<_, FocusSession>("UPDATE focus_sessions SET end_time = $1 WHERE id = $2 AND end_time IS NULL RETURNING id, user_id, start_time, end_time, goal_seconds, created_at, updated_at")
        .bind(&session.end_time)
        .bind(&session.id)
    .fetch_one(pool)
    .await
}
