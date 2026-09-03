use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::model::{UserWorldItem, UserWorldItemView};

#[derive(Debug, Deserialize, Serialize)]
pub enum PurchaseWorldItemOutcome {
    Purchased {
        user_world_item: UserWorldItem,
        remaining_coins: i64,
    },
    WorldItemNotFound,
    TileOccupied,
    InsufficientCoins {
        coins_owned: i64,
        world_item_price: i64,
    },
}

pub async fn find_user_world_items_by_user_id(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<UserWorldItemView>, sqlx::Error> {
    sqlx::query_as::<_, UserWorldItemView>(
        "SELECT user_world_items.id,
                user_world_items.user_id,
                user_world_items.world_item_id,
                user_world_items.tile,
                user_world_items.purchased_at,
                world_items.name,
                world_items.description,
                world_items.price,
                world_items.category
         FROM user_world_items
         INNER JOIN world_items ON world_items.id = user_world_items.world_item_id
         WHERE user_world_items.user_id = $1
         ORDER BY user_world_items.purchased_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

pub async fn purchase_world_item(
    pool: &PgPool,
    user_id: Uuid,
    world_item_id: Uuid,
    tile: i16,
) -> Result<PurchaseWorldItemOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;

    let price = sqlx::query_scalar::<_, i64>(
        "SELECT price
         FROM world_items
         WHERE id = $1",
    )
    .bind(world_item_id)
    .fetch_optional(&mut *transaction)
    .await?;

    let Some(price) = price else {
        return Ok(PurchaseWorldItemOutcome::WorldItemNotFound);
    };

    let coins_owned = sqlx::query_scalar::<_, i64>(
        "SELECT coins
         FROM users
         WHERE id = $1
         FOR UPDATE",
    )
    .bind(user_id)
    .fetch_one(&mut *transaction)
    .await?;
    if coins_owned < price {
        return Ok(PurchaseWorldItemOutcome::InsufficientCoins {
            coins_owned,
            world_item_price: price,
        });
    }

    let remaining_coins = sqlx::query_scalar::<_, i64>(
        "UPDATE users
         SET coins = coins - $1, updated_at = NOW()
         WHERE id = $2
           AND coins >= $1
         RETURNING coins",
    )
    .bind(price)
    .bind(user_id)
    .fetch_one(&mut *transaction)
    .await?;

    let user_world_item = match sqlx::query_as::<_, UserWorldItem>(
        "INSERT INTO user_world_items (user_id, world_item_id, tile)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, world_item_id, tile, purchased_at",
    )
    .bind(user_id)
    .bind(world_item_id)
    .bind(tile)
    .fetch_one(&mut *transaction)
    .await
    {
        Ok(user_world_item) => user_world_item,
        Err(error) if is_unique_violation(&error) => {
            return Ok(PurchaseWorldItemOutcome::TileOccupied);
        }
        Err(error) => return Err(error),
    };

    transaction.commit().await?;

    Ok(PurchaseWorldItemOutcome::Purchased {
        user_world_item,
        remaining_coins,
    })
}

fn is_unique_violation(error: &sqlx::Error) -> bool {
    error
        .as_database_error()
        .and_then(|database_error| database_error.code())
        .is_some_and(|code| code == "23505")
}
