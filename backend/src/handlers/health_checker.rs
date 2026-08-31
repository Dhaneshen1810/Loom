use axum::response::IntoResponse;

use crate::{AppError, AppSuccess};

pub async fn health_checker_handler() -> Result<impl IntoResponse, AppError> {
    const MESSAGE: &str = "Server is up and running!!";

    Ok(AppSuccess::response(MESSAGE))
}
