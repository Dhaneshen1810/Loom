use chrono::prelude::*;
use serde::{Deserialize, Serialize};
#[allow(non_snake_case)]
#[derive(Debug, Deserialize, sqlx::FromRow, Serialize, Clone)]

pub struct NewUser {
    pub name: String,
    pub email: String,
    pub password_hash: String,
}

#[derive(Debug, Deserialize, Serialize, Clone, sqlx::FromRow)]
pub struct User {
    pub id: uuid::Uuid,
    pub name: String,
    pub email: String,
    pub password_hash: String,
    #[serde(rename = "createdAt")]
    pub created_at: Option<DateTime<Utc>>,
    #[serde(rename = "updatedAt")]
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct RegisterUserSchema {
    pub name: String,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginUserSchema {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Claims {
    pub sub: uuid::Uuid,
    pub iat: i64,
    pub exp: i64,
}
