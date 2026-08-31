use axum::{Extension, Json, extract::Path, extract::State, response::IntoResponse};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    AppError, AppState, AppSuccess,
    model::{Claims, PurchaseWorldItemSchema},
    repositories::{
        user_world_item::{PurchaseWorldItemOutcome, purchase_world_item},
        world_item::find_all_world_items,
    },
};

pub async fn get_world_items_handler(
    State(data): State<Arc<AppState>>,
) -> Result<impl IntoResponse, AppError> {
    // Fetch and return all focus sessions
    let fetched_world_items = find_all_world_items(&data.db).await;

    match fetched_world_items {
        Ok(world_items) => {
            return Ok(AppSuccess::with_data("World items found.", world_items));
        }
        Err(error) => {
            eprint!("Error: {}", error);
            return Err(AppError::NotFound("World items not found".into()));
        }
    }
}

pub async fn world_item_purchase_handler(
    Path(world_item_id): Path<Uuid>,
    Extension(claims): Extension<Claims>,
    State(data): State<Arc<AppState>>,
    Json(body): Json<PurchaseWorldItemSchema>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = claims.sub;

    // Validate tile > 0
    if body.tile == 0 {
        return Err(AppError::Invalid("Tile location is invalid.".into()));
    }

    // User has enough coins
    // Add to user's inventory and reduce coins
    let outcome =
        purchase_world_item(&data.db, user_id, world_item_id, i16::from(body.tile)).await?;

    match outcome {
        PurchaseWorldItemOutcome::Purchased {
            user_world_item,
            remaining_coins,
        } => Ok(AppSuccess::with_data(
            "World item purchased.",
            serde_json::json!({
                "user_world_item": user_world_item,
                "remaining_coins": remaining_coins,
            }),
        )),
        PurchaseWorldItemOutcome::WorldItemNotFound => {
            Err(AppError::NotFound("World item not found.".into()))
        }
        PurchaseWorldItemOutcome::InsufficientCoins {
            coins_owned,
            world_item_price,
        } => Err(AppError::Invalid(format!(
            "Insufficient coins. You have {coins_owned}, but the item costs {world_item_price}."
        ))),
    }
}
