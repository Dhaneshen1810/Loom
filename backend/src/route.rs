use crate::handlers::{
    auth::{login_handler, register_user_handler},
    focus_session::{
        end_focus_session_handler, get_focus_sessions_handler, start_focus_session_handler,
    },
    health_checker::health_checker_handler,
};
use crate::middleware::auth::require_auth;
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
