use sqlx::PgPool;
use uuid::Uuid;

use crate::model::{NewWorldItem, WorldItem};

pub async fn find_world_item_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<WorldItem>, sqlx::Error> {
    sqlx::query_as::<_, WorldItem>(
        "SELECT *
         FROM world_items
         WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn find_all_world_items(pool: &PgPool) -> Result<Vec<WorldItem>, sqlx::Error> {
    sqlx::query_as::<_, WorldItem>(
        "SELECT *
         FROM world_items
         ORDER BY created_at DESC",
    )
    .fetch_all(pool)
    .await
}

pub async fn create_world_item(
    pool: &PgPool,
    new_world_item: &NewWorldItem,
) -> Result<WorldItem, sqlx::Error> {
    sqlx::query_as::<_, WorldItem>("INSERT INTO world_items (name, description, price, category) VALUES ($1, $2, $3, $4) RETURNING *")
        .bind(&new_world_item.name)
        .bind(&new_world_item.description)
        .bind(&new_world_item.price)
        .bind(&new_world_item.category)
    .fetch_one(pool)
    .await
}
