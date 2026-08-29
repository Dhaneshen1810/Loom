mod config;
mod handlers;
mod middleware;
mod model;
mod repositories;
mod route;

use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post, put},
};
use config::Config;
use serde::Deserialize;
use sqlx::{PgPool, Pool, Postgres, postgres::PgPoolOptions};
use std::sync::Arc;
use std::{env, error::Error};

use crate::route::create_router;

#[derive(Deserialize)]
struct NamePayload {
    name: String,
}

pub struct AppState {
    db: Pool<Postgres>,
    env: Config,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenvy::dotenv().ok();

    let config = Config::init();

    let database_url = env::var("DATABASE_URL")?;
    let address = env::var("SERVER_ADDRESS").unwrap_or_else(|_| "0.0.0.0:3000".to_string());

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    let app = create_router(Arc::new(AppState {
        db: pool.clone(),
        env: config.clone(),
    }));

    let listener = tokio::net::TcpListener::bind(&address).await?;
    println!("Server listening on http://{address}");
    axum::serve(listener, app).await?;

    Ok(())
}

async fn hello_world(State(pool): State<PgPool>) -> Result<&'static str, StatusCode> {
    sqlx::query("SELECT 1")
        .execute(&pool)
        .await
        .map_err(|_| StatusCode::SERVICE_UNAVAILABLE)?;

    Ok("hello world")
}

async fn hello_name(Json(payload): Json<NamePayload>) -> String {
    format!("hello {}", payload.name)
}

async fn update_name(Path(name): Path<String>) -> String {
    format!("will update {name}")
}
