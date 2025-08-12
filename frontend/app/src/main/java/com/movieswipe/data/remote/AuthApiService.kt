package com.movieswipe.data.remote

import com.movieswipe.data.models.AuthSuccessResponse
import com.movieswipe.data.models.GoogleAuthRequest
import com.movieswipe.data.models.LogoutResponse
import com.movieswipe.data.models.TokenVerificationResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

/**
 * Authentication API service interface for communicating with the backend
 */
interface AuthApiService {
    
    /**
     * Authenticate with Google OAuth token
     * @param request Google authentication request containing the Google OAuth token
     * @return Authentication response with user data and JWT token
     */
    @POST("auth/google")
    suspend fun authenticateWithGoogle(
        @Body request: GoogleAuthRequest
    ): Response<AuthSuccessResponse>
    
    /**
     * Logout the current user
     * @return Logout response
     */
    @POST("auth/logout")
    suspend fun logout(): Response<LogoutResponse>
    
    /**
     * Verify the current JWT token
     * @param authorization JWT token in Bearer format
     * @return Token verification response with user data
     */
    @GET("auth/verify")
    suspend fun verifyToken(
        @Header("Authorization") authorization: String
    ): Response<TokenVerificationResponse>
    
    /**
     * Refresh the current JWT token
     * @param authorization Current JWT token in Bearer format
     * @return New authentication response with refreshed token
     */
    @POST("auth/refresh")
    suspend fun refreshToken(
        @Header("Authorization") authorization: String
    ): Response<AuthSuccessResponse>
}
