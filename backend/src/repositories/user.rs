use sqlx::PgPool;

use crate::model::{NewUser, User};

pub async fn find_user_by_email(pool: &PgPool, email: &str) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        "SELECT id, name, email, password_hash, created_at, updated_at
         FROM users
         WHERE email = $1",
    )
    .bind(email)
    .fetch_optional(pool)
    .await
}

pub async fn create_user(pool: &PgPool, new_user: &NewUser) -> Result<User, sqlx::Error> {
    sqlx::query_as::<_, User>(
        "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
    )
    .bind(&new_user.name)
    .bind(&new_user.email)
    .bind(&new_user.password_hash)
    .fetch_one(pool)
    .await
}
