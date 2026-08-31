use axum::{Extension, extract::State, response::IntoResponse};
use std::sync::Arc;

use crate::{
    AppError, AppState, AppSuccess, model::Claims,
    repositories::user_world_item::find_user_world_items_by_user_id,
};

pub async fn get_user_world_items_handler(
    Extension(claims): Extension<Claims>,
    State(data): State<Arc<AppState>>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = claims.sub;

    let user_world_items = find_user_world_items_by_user_id(&data.db, user_id).await?;

    Ok(AppSuccess::with_data(
        "Found user world items.",
        user_world_items,
    ))
}
