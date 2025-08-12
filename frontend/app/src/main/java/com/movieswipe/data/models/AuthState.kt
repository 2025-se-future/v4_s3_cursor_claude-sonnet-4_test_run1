package com.movieswipe.data.models

/**
 * Represents the current authentication state of the user
 */
sealed class AuthState {
    /**
     * Initial state when authentication status is unknown
     */
    object Loading : AuthState()
    
    /**
     * User is not authenticated
     */
    object Unauthenticated : AuthState()
    
    /**
     * User is authenticated
     */
    data class Authenticated(val user: User) : AuthState()
    
    /**
     * Authentication failed with an error
     */
    data class Error(val message: String, val errorCode: String? = null) : AuthState()
}

/**
 * Represents the result of an authentication operation
 */
sealed class AuthResult {
    /**
     * Authentication was successful
     */
    data class Success(val user: User, val token: String) : AuthResult()
    
    /**
     * Authentication failed
     */
    data class Failure(val message: String, val errorCode: String) : AuthResult()
}

/**
 * Error codes for authentication failures
 */
object AuthErrorCodes {
    const val MISSING_TOKEN = "MISSING_TOKEN"
    const val INVALID_TOKEN = "INVALID_TOKEN"
    const val INVALID_TOKEN_FORMAT = "INVALID_TOKEN_FORMAT"
    const val USER_NOT_FOUND = "USER_NOT_FOUND"
    const val DATABASE_ERROR = "DATABASE_ERROR"
    const val SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    const val RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    const val LOGIN_RATE_LIMIT_EXCEEDED = "LOGIN_RATE_LIMIT_EXCEEDED"
    const val GOOGLE_SIGN_IN_CANCELLED = "GOOGLE_SIGN_IN_CANCELLED"
    const val GOOGLE_SIGN_IN_FAILED = "GOOGLE_SIGN_IN_FAILED"
    const val NETWORK_ERROR = "NETWORK_ERROR"
}
