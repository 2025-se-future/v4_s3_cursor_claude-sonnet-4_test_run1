package com.movieswipe.data.repositories

import android.content.Context
import android.content.Intent
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.movieswipe.data.local.AuthTokenStorage
import com.movieswipe.data.models.AuthErrorCodes
import com.movieswipe.data.models.AuthErrorResponse
import com.movieswipe.data.models.AuthResult
import com.movieswipe.data.models.GoogleAuthRequest
import com.movieswipe.data.models.User
import com.movieswipe.data.remote.AuthApiService
import com.movieswipe.data.remote.NetworkModule
import com.squareup.moshi.Moshi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.HttpException
import java.io.IOException

/**
 * Repository for handling authentication operations
 * Integrates Google Sign-In with backend authentication
 */
class AuthRepository(private val context: Context) {
    
    private val authApiService: AuthApiService = NetworkModule.authApiService
    private val tokenStorage = AuthTokenStorage(context)
    
    // Google Sign-In configuration
    private val googleSignInOptions = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
        .requestIdToken("123456789012-zyxwvutsrqponmlkjihgfedcba654321.apps.googleusercontent.com") // Web client ID from google-services.json
        .requestEmail()
        .build()
    
    private val googleSignInClient: GoogleSignInClient = GoogleSignIn.getClient(context, googleSignInOptions)
    
    /**
     * Get Google Sign-In intent for starting the sign-in flow
     */
    fun getGoogleSignInIntent(): Intent {
        return googleSignInClient.signInIntent
    }
    
    /**
     * Handle Google Sign-In result and authenticate with backend
     */
    suspend fun handleGoogleSignInResult(data: Intent?): AuthResult = withContext(Dispatchers.IO) {
        try {
            val task = GoogleSignIn.getSignedInAccountFromIntent(data)
            val account = task.result
            
            account.idToken?.let { idToken ->
                authenticateWithBackend(idToken)
            } ?: AuthResult.Failure(
                "Failed to get Google ID token",
                AuthErrorCodes.GOOGLE_SIGN_IN_FAILED
            )
        } catch (e: ApiException) {
            when (e.statusCode) {
                12501 -> AuthResult.Failure(
                    "Google Sign-In was cancelled",
                    AuthErrorCodes.GOOGLE_SIGN_IN_CANCELLED
                )
                else -> AuthResult.Failure(
                    "Google Sign-In failed: ${e.message}",
                    AuthErrorCodes.GOOGLE_SIGN_IN_FAILED
                )
            }
        } catch (e: Exception) {
            AuthResult.Failure(
                "Unexpected error during Google Sign-In: ${e.message}",
                AuthErrorCodes.GOOGLE_SIGN_IN_FAILED
            )
        }
    }
    
    /**
     * Authenticate with backend using Google ID token
     */
    private suspend fun authenticateWithBackend(googleToken: String): AuthResult {
        return try {
            val request = GoogleAuthRequest(googleToken)
            val response = authApiService.authenticateWithGoogle(request)
            
            if (response.isSuccessful) {
                val authResponse = response.body()!!
                
                // Store token and user info locally
                tokenStorage.saveJwtToken(authResponse.token)
                tokenStorage.saveUserInfo(
                    authResponse.user.id,
                    authResponse.user.email,
                    authResponse.user.name,
                    authResponse.user.profilePicture
                )
                
                AuthResult.Success(authResponse.user, authResponse.token)
            } else {
                val errorBody = response.errorBody()?.string()
                val errorResponse = parseErrorResponse(errorBody)
                AuthResult.Failure(
                    errorResponse?.message ?: "Authentication failed",
                    errorResponse?.error ?: "UNKNOWN_ERROR"
                )
            }
        } catch (e: HttpException) {
            val errorResponse = parseErrorResponse(e.response()?.errorBody()?.string())
            AuthResult.Failure(
                errorResponse?.message ?: "Server error: ${e.message}",
                errorResponse?.error ?: "SERVER_ERROR"
            )
        } catch (e: IOException) {
            AuthResult.Failure(
                "Network error. Please check your internet connection.",
                AuthErrorCodes.NETWORK_ERROR
            )
        } catch (e: Exception) {
            AuthResult.Failure(
                "Unexpected error: ${e.message}",
                "UNKNOWN_ERROR"
            )
        }
    }
    
    /**
     * Verify current token with backend
     */
    suspend fun verifyToken(): AuthResult? = withContext(Dispatchers.IO) {
        val token = tokenStorage.getJwtToken() ?: return@withContext null
        
        try {
            val response = authApiService.verifyToken("Bearer $token")
            
            if (response.isSuccessful) {
                val verifyResponse = response.body()!!
                verifyResponse.user?.let { user ->
                    // Update stored user info
                    tokenStorage.saveUserInfo(user.id, user.email, user.name, user.profilePicture)
                    AuthResult.Success(user, token)
                }
            } else {
                // Token is invalid, clear stored data
                tokenStorage.clearAuthData()
                null
            }
        } catch (e: Exception) {
            // On error, assume token is invalid
            tokenStorage.clearAuthData()
            null
        }
    }
    
    /**
     * Refresh current token
     */
    suspend fun refreshToken(): AuthResult? = withContext(Dispatchers.IO) {
        val token = tokenStorage.getJwtToken() ?: return@withContext null
        
        try {
            val response = authApiService.refreshToken("Bearer $token")
            
            if (response.isSuccessful) {
                val authResponse = response.body()!!
                
                // Update stored token and user info
                tokenStorage.saveJwtToken(authResponse.token)
                tokenStorage.saveUserInfo(
                    authResponse.user.id,
                    authResponse.user.email,
                    authResponse.user.name,
                    authResponse.user.profilePicture
                )
                
                AuthResult.Success(authResponse.user, authResponse.token)
            } else {
                // Refresh failed, clear stored data
                tokenStorage.clearAuthData()
                null
            }
        } catch (e: Exception) {
            // On error, clear stored data
            tokenStorage.clearAuthData()
            null
        }
    }
    
    /**
     * Logout user
     */
    suspend fun logout(): Boolean = withContext(Dispatchers.IO) {
        try {
            // Sign out from Google
            googleSignInClient.signOut()
            
            // Call backend logout endpoint
            authApiService.logout()
            
            // Clear local storage
            tokenStorage.clearAuthData()
            
            true
        } catch (e: Exception) {
            // Even if backend call fails, clear local data
            tokenStorage.clearAuthData()
            true
        }
    }
    
    /**
     * Check if user is currently logged in
     */
    fun isLoggedIn(): Boolean {
        return tokenStorage.isLoggedIn()
    }
    
    /**
     * Get current user from local storage
     */
    fun getCurrentUser(): User? {
        val userId = tokenStorage.getUserId() ?: return null
        val email = tokenStorage.getUserEmail() ?: return null
        val name = tokenStorage.getUserName() ?: return null
        val profilePicture = tokenStorage.getUserProfilePicture() ?: return null
        
        return User(userId, email, name, profilePicture)
    }
    
    /**
     * Get current JWT token
     */
    fun getCurrentToken(): String? {
        return tokenStorage.getJwtToken()
    }
    
    /**
     * Parse error response from JSON
     */
    private fun parseErrorResponse(errorBody: String?): AuthErrorResponse? {
        return try {
            errorBody?.let {
                val moshi = Moshi.Builder().build()
                val adapter = moshi.adapter(AuthErrorResponse::class.java)
                adapter.fromJson(it)
            }
        } catch (e: Exception) {
            null
        }
    }
}
