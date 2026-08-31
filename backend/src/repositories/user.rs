use sqlx::PgPool;
use uuid::Uuid;

use crate::model::{NewUser, User};

pub async fn find_user_by_id(pool: &PgPool, id: Uuid) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        "SELECT *
         FROM users
         WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn find_user_by_email(pool: &PgPool, email: &str) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        "SELECT id, name, email, password_hash, coins, role, created_at, updated_at
         FROM users
         WHERE email = $1",
    )
    .bind(email)
    .fetch_optional(pool)
    .await
}

pub async fn find_all_users(pool: &PgPool) -> Result<Vec<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        "SELECT *
         FROM users
         ORDER BY created_at DESC",
    )
    .fetch_all(pool)
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

pub async fn update_user_coins(
    pool: &PgPool,
    user_id: Uuid,
    coins_to_add: i64,
) -> Result<User, sqlx::Error> {
    sqlx::query_as::<_, User>(
        "UPDATE users
         SET coins = coins + $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, name, email, password_hash, coins, role, created_at, updated_at",
    )
    .bind(coins_to_add)
    .bind(user_id)
    .fetch_one(pool)
    .await
}
