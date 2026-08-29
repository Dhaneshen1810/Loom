use crate::handlers::{
    auth::{login_handler, register_user_handler},
    health_checker::health_checker_handler,
};
use std::sync::Arc;

use axum::{
    Router,
    routing::{get, post},
};

use crate::AppState;

pub fn create_router(app_state: Arc<AppState>) -> Router {
    Router::new()
        .route("/api/healthchecker", get(health_checker_handler))
        .route("/api/auth/register", post(register_user_handler))
        .route("/api/auth/login", post(login_handler))
        // .route(
        //     "/api/auth/logout",
        //     get(logout_handler)
        //         .route_layer(middleware::from_fn_with_state(app_state.clone(), auth)),
        // )
        // .route(
        //     "/api/users/me",
        //     get(get_me_handler)
        //         .route_layer(middleware::from_fn_with_state(app_state.clone(), auth)),
        // )
        .with_state(app_state)
}
