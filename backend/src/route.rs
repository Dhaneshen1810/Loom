use crate::handlers::user_world_items::get_user_world_items_handler;
use crate::handlers::world_item::get_world_items_handler;
use crate::handlers::{
    auth::{login_handler, register_user_handler},
    focus_session::{
        end_focus_session_handler, get_focus_sessions_handler, start_focus_session_handler,
    },
    health_checker::health_checker_handler,
    user::{get_all_users_handler, get_current_user_handler},
    world_item::world_item_purchase_handler,
};
use crate::middleware::auth::{require_admin, require_auth};
use axum::middleware;
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
        .route(
            "/api/focus-session/start",
            post(start_focus_session_handler).layer(middleware::from_fn_with_state(
                app_state.clone(),
                require_auth,
            )),
        )
        .route(
            "/api/focus-session/{id}/end",
            post(end_focus_session_handler).layer(middleware::from_fn_with_state(
                app_state.clone(),
                require_auth,
            )),
        )
        .route(
            "/api/focus-session",
            get(get_focus_sessions_handler).layer(middleware::from_fn_with_state(
                app_state.clone(),
                require_auth,
            )),
        )
        .route(
            "/api/users/me",
            get(get_current_user_handler).layer(middleware::from_fn_with_state(
                app_state.clone(),
                require_auth,
            )),
        )
        // World items
        .route(
            "/api/world_items",
            get(get_world_items_handler)
                .layer(middleware::from_fn_with_state(
                    app_state.clone(),
                    require_admin,
                ))
                .layer(middleware::from_fn_with_state(
                    app_state.clone(),
                    require_auth,
                )),
        )
        .route(
            "/api/world_items",
            post(world_item_purchase_handler)
                .layer(middleware::from_fn_with_state(
                    app_state.clone(),
                    require_admin,
                ))
                .layer(middleware::from_fn_with_state(
                    app_state.clone(),
                    require_auth,
                )),
        )
        // User world items
        .route(
            "/api/world_items/{world_item_id}/purchase",
            post(world_item_purchase_handler).layer(middleware::from_fn_with_state(
                app_state.clone(),
                require_auth,
            )),
        )
        .route(
            "/api/user_world_items/me",
            get(get_user_world_items_handler).layer(middleware::from_fn_with_state(
                app_state.clone(),
                require_auth,
            )),
        )
        .route(
            "/api/users",
            get(get_all_users_handler)
                .layer(middleware::from_fn_with_state(
                    app_state.clone(),
                    require_admin,
                ))
                .layer(middleware::from_fn_with_state(
                    app_state.clone(),
                    require_auth,
                )),
        )
        .with_state(app_state)
}
