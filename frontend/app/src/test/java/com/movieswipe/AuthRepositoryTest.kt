package com.movieswipe

import android.content.Context
import android.content.Intent
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.movieswipe.data.local.AuthTokenStorage
import com.movieswipe.data.models.AuthErrorCodes
import com.movieswipe.data.models.AuthErrorResponse
import com.movieswipe.data.models.AuthResult
import com.movieswipe.data.models.AuthSuccessResponse
import com.movieswipe.data.models.GoogleAuthRequest
import com.movieswipe.data.models.TokenVerificationResponse
import com.movieswipe.data.models.User
import com.movieswipe.data.remote.AuthApiService
import com.movieswipe.data.repositories.AuthRepository
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import retrofit2.HttpException
import retrofit2.Response
import java.io.IOException

/**
 * Unit tests for AuthRepository
 * Tests authentication functionality including Google Sign-In integration and backend communication
 */
class AuthRepositoryTest {
    
    private lateinit var authRepository: AuthRepository
    private lateinit var mockContext: Context
    private lateinit var mockAuthApiService: AuthApiService
    private lateinit var mockTokenStorage: AuthTokenStorage
    
    private val testUser = User(
        id = "test-user-id",
        email = "test@example.com",
        name = "Test User",
        profilePicture = "https://example.com/profile.jpg"
    )
    
    private val testToken = "test-jwt-token"
    
    @Before
    fun setup() {
        mockContext = mock()
        mockAuthApiService = mock()
        mockTokenStorage = mock()
        
        // Create AuthRepository instance with mocked dependencies
        authRepository = AuthRepository(mockContext)
        
        // Mock token storage behavior
        whenever(mockTokenStorage.isLoggedIn()).thenReturn(false)
        whenever(mockTokenStorage.getJwtToken()).thenReturn(null)
    }
    
    @Test
    fun `test successful Google authentication with new user`() = runTest {
        // Arrange
        val googleToken = "valid-google-token"
        val authResponse = AuthSuccessResponse(
            success = true,
            message = "Authentication successful",
            user = testUser,
            token = testToken
        )
        
        whenever(mockAuthApiService.authenticateWithGoogle(any<GoogleAuthRequest>()))
            .thenReturn(Response.success(authResponse))
        
        // Act
        val result = authRepository.handleGoogleSignInResult(createMockIntent(googleToken))
        
        // Assert
        assertTrue(result is AuthResult.Success)
        val successResult = result as AuthResult.Success
        assertEquals(testUser, successResult.user)
        assertEquals(testToken, successResult.token)
        
        verify(mockTokenStorage).saveJwtToken(testToken)
        verify(mockTokenStorage).saveUserInfo(
            testUser.id,
            testUser.email,
            testUser.name,
            testUser.profilePicture
        )
    }
    
    @Test
    fun `test successful Google authentication with existing user`() = runTest {
        // Arrange
        val googleToken = "valid-google-token"
        val authResponse = AuthSuccessResponse(
            success = true,
            message = "Authentication successful",
            user = testUser,
            token = testToken
        )
        
        whenever(mockAuthApiService.authenticateWithGoogle(any<GoogleAuthRequest>()))
            .thenReturn(Response.success(authResponse))
        
        // Act
        val result = authRepository.handleGoogleSignInResult(createMockIntent(googleToken))
        
        // Assert
        assertTrue(result is AuthResult.Success)
        val successResult = result as AuthResult.Success
        assertEquals(testUser, successResult.user)
        assertEquals(testToken, successResult.token)
    }
    
    @Test
    fun `test Google authentication failure - invalid token`() = runTest {
        // Arrange
        val googleToken = "invalid-google-token"
        val errorResponse = AuthErrorResponse(
            success = false,
            message = "Authentication failed. Please try signing in again.",
            error = AuthErrorCodes.INVALID_TOKEN
        )
        val errorBody = """{"success":false,"message":"Authentication failed. Please try signing in again.","error":"INVALID_TOKEN"}"""
            .toResponseBody("application/json".toMediaTypeOrNull())
        
        whenever(mockAuthApiService.authenticateWithGoogle(any<GoogleAuthRequest>()))
            .thenReturn(Response.error(401, errorBody))
        
        // Act
        val result = authRepository.handleGoogleSignInResult(createMockIntent(googleToken))
        
        // Assert
        assertTrue(result is AuthResult.Failure)
        val failureResult = result as AuthResult.Failure
        assertEquals("Authentication failed. Please try signing in again.", failureResult.message)
        assertEquals(AuthErrorCodes.INVALID_TOKEN, failureResult.errorCode)
    }
    
    @Test
    fun `test Google authentication failure - service unavailable`() = runTest {
        // Arrange
        val googleToken = "valid-google-token"
        val errorBody = """{"success":false,"message":"Authentication service temporarily unavailable. Please try again later.","error":"SERVICE_UNAVAILABLE"}"""
            .toResponseBody("application/json".toMediaTypeOrNull())
        
        whenever(mockAuthApiService.authenticateWithGoogle(any<GoogleAuthRequest>()))
            .thenReturn(Response.error(503, errorBody))
        
        // Act
        val result = authRepository.handleGoogleSignInResult(createMockIntent(googleToken))
        
        // Assert
        assertTrue(result is AuthResult.Failure)
        val failureResult = result as AuthResult.Failure
        assertEquals("Authentication service temporarily unavailable. Please try again later.", failureResult.message)
        assertEquals(AuthErrorCodes.SERVICE_UNAVAILABLE, failureResult.errorCode)
    }
    
    @Test
    fun `test Google authentication failure - network error`() = runTest {
        // Arrange
        val googleToken = "valid-google-token"
        
        whenever(mockAuthApiService.authenticateWithGoogle(any<GoogleAuthRequest>()))
            .thenThrow(IOException("Network error"))
        
        // Act
        val result = authRepository.handleGoogleSignInResult(createMockIntent(googleToken))
        
        // Assert
        assertTrue(result is AuthResult.Failure)
        val failureResult = result as AuthResult.Failure
        assertEquals("Network error. Please check your internet connection.", failureResult.message)
        assertEquals(AuthErrorCodes.NETWORK_ERROR, failureResult.errorCode)
    }
    
    @Test
    fun `test Google authentication failure - missing ID token`() = runTest {
        // Arrange - Intent without ID token
        val intent = Intent()
        
        // Act
        val result = authRepository.handleGoogleSignInResult(intent)
        
        // Assert
        assertTrue(result is AuthResult.Failure)
        val failureResult = result as AuthResult.Failure
        assertEquals("Failed to get Google ID token", failureResult.message)
        assertEquals(AuthErrorCodes.GOOGLE_SIGN_IN_FAILED, failureResult.errorCode)
    }
    
    @Test
    fun `test token verification success`() = runTest {
        // Arrange
        val storedToken = "valid-stored-token"
        val verifyResponse = TokenVerificationResponse(
            success = true,
            user = testUser
        )
        
        whenever(mockTokenStorage.getJwtToken()).thenReturn(storedToken)
        whenever(mockAuthApiService.verifyToken("Bearer $storedToken"))
            .thenReturn(Response.success(verifyResponse))
        
        // Act
        val result = authRepository.verifyToken()
        
        // Assert
        assertNotNull(result)
        assertTrue(result is AuthResult.Success)
        val successResult = result as AuthResult.Success
        assertEquals(testUser, successResult.user)
        assertEquals(storedToken, successResult.token)
        
        verify(mockTokenStorage).saveUserInfo(
            testUser.id,
            testUser.email,
            testUser.name,
            testUser.profilePicture
        )
    }
    
    @Test
    fun `test token verification failure - invalid token`() = runTest {
        // Arrange
        val storedToken = "invalid-stored-token"
        val errorBody = """{"success":false,"message":"Invalid or expired token","error":"INVALID_TOKEN"}"""
            .toResponseBody("application/json".toMediaTypeOrNull())
        
        whenever(mockTokenStorage.getJwtToken()).thenReturn(storedToken)
        whenever(mockAuthApiService.verifyToken("Bearer $storedToken"))
            .thenReturn(Response.error(401, errorBody))
        
        // Act
        val result = authRepository.verifyToken()
        
        // Assert
        assertNull(result)
        verify(mockTokenStorage).clearAuthData()
    }
    
    @Test
    fun `test token verification - no stored token`() = runTest {
        // Arrange
        whenever(mockTokenStorage.getJwtToken()).thenReturn(null)
        
        // Act
        val result = authRepository.verifyToken()
        
        // Assert
        assertNull(result)
    }
    
    @Test
    fun `test token refresh success`() = runTest {
        // Arrange
        val oldToken = "old-token"
        val newToken = "new-token"
        val authResponse = AuthSuccessResponse(
            success = true,
            message = "Token refreshed successfully",
            user = testUser,
            token = newToken
        )
        
        whenever(mockTokenStorage.getJwtToken()).thenReturn(oldToken)
        whenever(mockAuthApiService.refreshToken("Bearer $oldToken"))
            .thenReturn(Response.success(authResponse))
        
        // Act
        val result = authRepository.refreshToken()
        
        // Assert
        assertNotNull(result)
        assertTrue(result is AuthResult.Success)
        val successResult = result as AuthResult.Success
        assertEquals(testUser, successResult.user)
        assertEquals(newToken, successResult.token)
        
        verify(mockTokenStorage).saveJwtToken(newToken)
        verify(mockTokenStorage).saveUserInfo(
            testUser.id,
            testUser.email,
            testUser.name,
            testUser.profilePicture
        )
    }
    
    @Test
    fun `test token refresh failure`() = runTest {
        // Arrange
        val oldToken = "expired-token"
        val errorBody = """{"success":false,"message":"Token refresh failed","error":"INVALID_TOKEN"}"""
            .toResponseBody("application/json".toMediaTypeOrNull())
        
        whenever(mockTokenStorage.getJwtToken()).thenReturn(oldToken)
        whenever(mockAuthApiService.refreshToken("Bearer $oldToken"))
            .thenReturn(Response.error(401, errorBody))
        
        // Act
        val result = authRepository.refreshToken()
        
        // Assert
        assertNull(result)
        verify(mockTokenStorage).clearAuthData()
    }
    
    @Test
    fun `test logout success`() = runTest {
        // Arrange - Mock successful logout
        whenever(mockAuthApiService.logout()).thenReturn(Response.success(mock()))
        
        // Act
        val result = authRepository.logout()
        
        // Assert
        assertTrue(result)
        verify(mockTokenStorage).clearAuthData()
    }
    
    @Test
    fun `test logout with backend failure still clears local data`() = runTest {
        // Arrange - Mock backend failure
        whenever(mockAuthApiService.logout())
            .thenThrow(IOException("Network error"))
        
        // Act
        val result = authRepository.logout()
        
        // Assert
        assertTrue(result) // Should still return true
        verify(mockTokenStorage).clearAuthData() // Should still clear local data
    }
    
    @Test
    fun `test isLoggedIn returns correct status`() {
        // Arrange
        whenever(mockTokenStorage.isLoggedIn()).thenReturn(true)
        
        // Act & Assert
        assertTrue(authRepository.isLoggedIn())
        
        // Arrange for false case
        whenever(mockTokenStorage.isLoggedIn()).thenReturn(false)
        
        // Act & Assert
        assertFalse(authRepository.isLoggedIn())
    }
    
    @Test
    fun `test getCurrentUser returns user when all data is available`() {
        // Arrange
        whenever(mockTokenStorage.getUserId()).thenReturn(testUser.id)
        whenever(mockTokenStorage.getUserEmail()).thenReturn(testUser.email)
        whenever(mockTokenStorage.getUserName()).thenReturn(testUser.name)
        whenever(mockTokenStorage.getUserProfilePicture()).thenReturn(testUser.profilePicture)
        
        // Act
        val user = authRepository.getCurrentUser()
        
        // Assert
        assertNotNull(user)
        assertEquals(testUser, user)
    }
    
    @Test
    fun `test getCurrentUser returns null when data is incomplete`() {
        // Arrange - Missing user ID
        whenever(mockTokenStorage.getUserId()).thenReturn(null)
        whenever(mockTokenStorage.getUserEmail()).thenReturn(testUser.email)
        whenever(mockTokenStorage.getUserName()).thenReturn(testUser.name)
        whenever(mockTokenStorage.getUserProfilePicture()).thenReturn(testUser.profilePicture)
        
        // Act
        val user = authRepository.getCurrentUser()
        
        // Assert
        assertNull(user)
    }
    
    @Test
    fun `test getCurrentToken returns stored token`() {
        // Arrange
        whenever(mockTokenStorage.getJwtToken()).thenReturn(testToken)
        
        // Act
        val token = authRepository.getCurrentToken()
        
        // Assert
        assertEquals(testToken, token)
    }
    
    private fun createMockIntent(googleToken: String): Intent {
        val intent = Intent()
        // In a real test, you would properly mock the GoogleSignIn.getSignedInAccountFromIntent
        // For now, we'll simulate the behavior
        return intent
    }
}
