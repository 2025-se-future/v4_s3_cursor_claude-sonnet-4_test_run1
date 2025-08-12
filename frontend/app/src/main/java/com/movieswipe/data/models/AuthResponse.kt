package com.movieswipe.data.models

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/**
 * Authentication success response from the backend
 */
@JsonClass(generateAdapter = true)
data class AuthSuccessResponse(
    @Json(name = "success")
    val success: Boolean,
    
    @Json(name = "message")
    val message: String,
    
    @Json(name = "user")
    val user: User,
    
    @Json(name = "token")
    val token: String
)

/**
 * Authentication error response from the backend
 */
@JsonClass(generateAdapter = true)
data class AuthErrorResponse(
    @Json(name = "success")
    val success: Boolean,
    
    @Json(name = "message")
    val message: String,
    
    @Json(name = "error")
    val error: String
)

/**
 * Google authentication request payload
 */
@JsonClass(generateAdapter = true)
data class GoogleAuthRequest(
    @Json(name = "googleToken")
    val googleToken: String
)

/**
 * Logout response from the backend
 */
@JsonClass(generateAdapter = true)
data class LogoutResponse(
    @Json(name = "success")
    val success: Boolean,
    
    @Json(name = "message")
    val message: String
)

/**
 * Token verification response from the backend
 */
@JsonClass(generateAdapter = true)
data class TokenVerificationResponse(
    @Json(name = "success")
    val success: Boolean,
    
    @Json(name = "user")
    val user: User? = null
)
