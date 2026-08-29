use jsonwebtoken::{EncodingKey, Header, encode};
use std::sync::Arc;

use crate::{
    AppState,
    model::{Claims, LoginUserSchema, NewUser, RegisterUserSchema},
    repositories::user::{create_user, find_user_by_email},
};
use argon2::{Argon2, PasswordHash, PasswordVerifier, password_hash::PasswordHasher};
use axum::{Json, extract::State, response::IntoResponse};
use chrono::{Duration, Utc};

pub async fn register_user_handler(
    State(data): State<Arc<AppState>>,
    Json(body): Json<RegisterUserSchema>,
) -> impl IntoResponse {
    // Validate body (lowercase email and trim email)
    let email = body.email.trim().to_lowercase();
    let name = body.name.trim().to_string();

    if email.is_empty() || name.is_empty() || body.password.is_empty() {
        return Json(serde_json::json!({
            "status": "error",
            "message": "Invalid request body"
        }));
    }

    // Check if user already exists
    let user = find_user_by_email(&data.db, &email).await;

    match user {
        Ok(Some(_)) => {
            return Json(serde_json::json!({
                "status": "error",
                "message": "User already exists"
            }));
        }
        Ok(None) => {
            // User does not exist, hash password and create user
            let password_hash = hash_password(&body.password).unwrap();
            let new_user = NewUser {
                name: body.name,
                email: body.email,
                password_hash,
            };
            let new_user = create_user(&data.db, &new_user).await;
            match new_user {
                Ok(user) => {
                    let token = generate_jwt_token(
                        user.id,
                        &data.env.jwt_secret,
                        data.env.jwt_maxage.into(),
                    );

                    match token {
                        Ok(token) => {
                            return Json(serde_json::json!({
                                "status": "success",
                                "message": "User registered successfully",
                                "token": token,
                            }));
                        }
                        Err(_) => {
                            return Json(serde_json::json!({
                                "status": "error",
                                "message": "Failed to generate JWT token."
                            }));
                        }
                    }
                }
                Err(_) => {
                    return Json(serde_json::json!({
                        "status": "error",
                        "message": "Failed to create user."
                    }));
                }
            };
        }
        Err(_) => {
            return Json(serde_json::json!({
                "status": "error",
                "message": "Internal server error"
            }));
        }
    };
}

pub async fn login_handler(
    State(data): State<Arc<AppState>>,
    Json(body): Json<LoginUserSchema>,
) -> impl IntoResponse {
    // Trim email
    let email = body.email.trim().to_lowercase();
    // Check if user exists
    let user = find_user_by_email(&data.db, &email).await;
    println!("User: {:?}", user);
    match user {
        Ok(Some(user)) => {
            // Verify password
            let parsed_hash = PasswordHash::new(&user.password_hash).unwrap();
            let is_valid = Argon2::default()
                .verify_password(body.password.as_bytes(), &parsed_hash)
                .is_ok();
            if is_valid {
                // Generate jwt token
                let token =
                    generate_jwt_token(user.id, &data.env.jwt_secret, data.env.jwt_maxage.into());
                match token {
                    Ok(token) => {
                        return Json(serde_json::json!({
                            "status": "success",
                            "message": "User logged in successfully",
                            "token": token,
                        }));
                    }
                    Err(_) => {
                        return Json(serde_json::json!({
                            "status": "error",
                            "message": "Failed to generate JWT token."
                        }));
                    }
                }
            } else {
                return Json(serde_json::json!({
                    "status": "error",
                    "message": "Invalid password."
                }));
            }
        }
        _ => {
            return Json(serde_json::json!({
                "status": "error",
                "message": "User not found."
            }));
        }
    }
}

fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    Argon2::default()
        .hash_password(password.as_bytes())
        .map(|hash| hash.to_string())
}

fn generate_jwt_token(
    user_id: uuid::Uuid,
    secret: &str,
    expires_minutes: i64,
) -> Result<String, jsonwebtoken::errors::Error> {
    let now = Utc::now();

    let claims = Claims {
        sub: user_id,
        iat: now.timestamp(),
        exp: (now + Duration::minutes(expires_minutes)).timestamp(),
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}
