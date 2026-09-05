use chrono::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone, sqlx::Type, PartialEq)]
#[sqlx(type_name = "text", rename_all = "lowercase")]
pub enum UserRole {
    User,
    Admin,
}

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
    pub coins: i64,
    pub role: UserRole,
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

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Claims {
    pub sub: uuid::Uuid,
    pub iat: i64,
    pub exp: i64,
}

// Focus session
#[derive(Debug, Deserialize, Serialize, Clone, sqlx::FromRow)]
pub struct FocusSession {
    pub id: uuid::Uuid,
    pub user_id: uuid::Uuid,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub goal_seconds: i64,
    pub goal_description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl FocusSession {
    pub fn set_end_time(&mut self, end_time: DateTime<Utc>) {
        self.end_time = Some(end_time);
    }
}

#[derive(Debug, Deserialize, Serialize, Clone, sqlx::FromRow)]
pub struct NewSession {
    pub user_id: uuid::Uuid,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub goal_seconds: i64,
    pub goal_description: Option<String>,
}

impl NewSession {
    pub fn new(user_id: uuid::Uuid, goal_seconds: i64, goal_description: Option<String>) -> Self {
        Self {
            user_id,
            start_time: Utc::now(),
            end_time: None,
            goal_seconds,
            goal_description,
        }
    }
}

pub const MAX_GOAL_DESCRIPTION_LEN: usize = 140;

#[derive(Debug, Deserialize)]
pub struct CreateFocusSessionSchema {
    pub goal_seconds: i64,
    pub goal_description: Option<String>,
}

impl CreateFocusSessionSchema {
    pub fn normalized_goal_description(&self) -> Result<Option<String>, String> {
        let Some(raw) = self.goal_description.as_deref() else {
            return Ok(None);
        };

        let trimmed = raw.trim();

        if trimmed.is_empty() {
            return Ok(None);
        }

        if trimmed.chars().count() > MAX_GOAL_DESCRIPTION_LEN {
            return Err("Keep your goal under 140 characters.".into());
        }

        Ok(Some(trimmed.to_string()))
    }
}

#[derive(Debug, Deserialize, Serialize, Clone, sqlx::Type)]
#[sqlx(type_name = "text", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum WorldItemCategory {
    Tree,
    Building,
    Decoration,
    Road,
}

#[derive(Debug, Deserialize, Serialize, Clone, sqlx::FromRow)]
pub struct WorldItem {
    pub id: uuid::Uuid,
    pub name: String,
    pub description: String,
    pub price: i64,
    pub category: WorldItemCategory,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Serialize, Clone, sqlx::FromRow)]
pub struct NewWorldItem {
    pub name: String,
    pub description: String,
    pub price: i64,
    pub category: WorldItemCategory,
}

#[derive(Debug, Deserialize)]
pub struct PurchaseWorldItemSchema {
    pub tile: u8,
    pub planted_on: Option<NaiveDate>,
}

#[derive(Debug, Deserialize, Serialize, Clone, sqlx::FromRow)]
pub struct UserWorldItem {
    pub id: uuid::Uuid,
    pub user_id: uuid::Uuid,
    pub world_item_id: uuid::Uuid,
    pub tile: i16,
    pub purchased_at: DateTime<Utc>,
    pub planted_on: NaiveDate,
}

#[derive(Debug, Deserialize, Serialize, Clone, sqlx::FromRow)]
pub struct UserWorldItemView {
    pub id: uuid::Uuid,
    pub user_id: uuid::Uuid,
    pub world_item_id: uuid::Uuid,
    pub tile: i16,
    pub purchased_at: DateTime<Utc>,
    pub planted_on: NaiveDate,
    pub name: String,
    pub description: String,
    pub price: i64,
    pub category: WorldItemCategory,
}
