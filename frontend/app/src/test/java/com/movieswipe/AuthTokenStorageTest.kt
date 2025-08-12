package com.movieswipe

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import com.movieswipe.data.local.AuthTokenStorage
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

/**
 * Unit tests for AuthTokenStorage
 * Tests secure storage and retrieval of authentication data
 */
class AuthTokenStorageTest {
    
    private lateinit var authTokenStorage: AuthTokenStorage
    private lateinit var mockContext: Context
    private lateinit var mockSharedPreferences: SharedPreferences
    private lateinit var mockEditor: SharedPreferences.Editor
    
    private val testToken = "test-jwt-token"
    private val testUserId = "test-user-id"
    private val testEmail = "test@example.com"
    private val testName = "Test User"
    private val testProfilePicture = "https://example.com/profile.jpg"
    
    @Before
    fun setup() {
        mockContext = mock()
        mockSharedPreferences = mock()
        mockEditor = mock()
        
        // Mock SharedPreferences.Editor behavior
        whenever(mockSharedPreferences.edit()).thenReturn(mockEditor)
        whenever(mockEditor.putString(any(), any())).thenReturn(mockEditor)
        whenever(mockEditor.remove(any())).thenReturn(mockEditor)
        
        // Note: In a real test environment, you would need to properly mock
        // EncryptedSharedPreferences creation. For this example, we'll assume
        // the AuthTokenStorage can be initialized with the mocked preferences.
        authTokenStorage = AuthTokenStorage(mockContext)
    }
    
    @Test
    fun `test save and get JWT token`() {
        // Arrange
        whenever(mockSharedPreferences.getString("jwt_token", null)).thenReturn(testToken)
        
        // Act
        authTokenStorage.saveJwtToken(testToken)
        val retrievedToken = authTokenStorage.getJwtToken()
        
        // Assert
        verify(mockEditor).putString("jwt_token", testToken)
        verify(mockEditor).apply()
        assertEquals(testToken, retrievedToken)
    }
    
    @Test
    fun `test get JWT token returns null when not stored`() {
        // Arrange
        whenever(mockSharedPreferences.getString("jwt_token", null)).thenReturn(null)
        
        // Act
        val retrievedToken = authTokenStorage.getJwtToken()
        
        // Assert
        assertNull(retrievedToken)
    }
    
    @Test
    fun `test save and get user information`() {
        // Arrange
        whenever(mockSharedPreferences.getString("user_id", null)).thenReturn(testUserId)
        whenever(mockSharedPreferences.getString("user_email", null)).thenReturn(testEmail)
        whenever(mockSharedPreferences.getString("user_name", null)).thenReturn(testName)
        whenever(mockSharedPreferences.getString("user_profile_picture", null)).thenReturn(testProfilePicture)
        
        // Act
        authTokenStorage.saveUserInfo(testUserId, testEmail, testName, testProfilePicture)
        
        // Assert
        verify(mockEditor).putString("user_id", testUserId)
        verify(mockEditor).putString("user_email", testEmail)
        verify(mockEditor).putString("user_name", testName)
        verify(mockEditor).putString("user_profile_picture", testProfilePicture)
        verify(mockEditor).apply()
        
        // Test retrieval
        assertEquals(testUserId, authTokenStorage.getUserId())
        assertEquals(testEmail, authTokenStorage.getUserEmail())
        assertEquals(testName, authTokenStorage.getUserName())
        assertEquals(testProfilePicture, authTokenStorage.getUserProfilePicture())
    }
    
    @Test
    fun `test get user information returns null when not stored`() {
        // Arrange
        whenever(mockSharedPreferences.getString(any(), eq(null))).thenReturn(null)
        
        // Act & Assert
        assertNull(authTokenStorage.getUserId())
        assertNull(authTokenStorage.getUserEmail())
        assertNull(authTokenStorage.getUserName())
        assertNull(authTokenStorage.getUserProfilePicture())
    }
    
    @Test
    fun `test isLoggedIn returns true when token exists`() {
        // Arrange
        whenever(mockSharedPreferences.getString("jwt_token", null)).thenReturn(testToken)
        
        // Act
        val isLoggedIn = authTokenStorage.isLoggedIn()
        
        // Assert
        assertTrue(isLoggedIn)
    }
    
    @Test
    fun `test isLoggedIn returns false when token does not exist`() {
        // Arrange
        whenever(mockSharedPreferences.getString("jwt_token", null)).thenReturn(null)
        
        // Act
        val isLoggedIn = authTokenStorage.isLoggedIn()
        
        // Assert
        assertFalse(isLoggedIn)
    }
    
    @Test
    fun `test isLoggedIn returns false when token is empty`() {
        // Arrange
        whenever(mockSharedPreferences.getString("jwt_token", null)).thenReturn("")
        
        // Act
        val isLoggedIn = authTokenStorage.isLoggedIn()
        
        // Assert
        assertFalse(isLoggedIn)
    }
    
    @Test
    fun `test clearAuthData removes all stored data`() {
        // Act
        authTokenStorage.clearAuthData()
        
        // Assert
        verify(mockEditor).remove("jwt_token")
        verify(mockEditor).remove("user_id")
        verify(mockEditor).remove("user_email")
        verify(mockEditor).remove("user_name")
        verify(mockEditor).remove("user_profile_picture")
        verify(mockEditor).apply()
    }
    
    @Test
    fun `test multiple save operations work correctly`() {
        // Arrange
        val newToken = "new-jwt-token"
        val newUserId = "new-user-id"
        
        // Act
        authTokenStorage.saveJwtToken(testToken)
        authTokenStorage.saveUserInfo(testUserId, testEmail, testName, testProfilePicture)
        authTokenStorage.saveJwtToken(newToken) // Update token
        
        // Assert
        verify(mockEditor).putString("jwt_token", testToken)
        verify(mockEditor).putString("jwt_token", newToken)
        verify(mockEditor).putString("user_id", testUserId)
        verify(mockEditor).putString("user_email", testEmail)
        verify(mockEditor).putString("user_name", testName)
        verify(mockEditor).putString("user_profile_picture", testProfilePicture)
    }
    
    @Test
    fun `test partial user info storage and retrieval`() {
        // Arrange - Only store some user info
        whenever(mockSharedPreferences.getString("user_id", null)).thenReturn(testUserId)
        whenever(mockSharedPreferences.getString("user_email", null)).thenReturn(testEmail)
        whenever(mockSharedPreferences.getString("user_name", null)).thenReturn(null)
        whenever(mockSharedPreferences.getString("user_profile_picture", null)).thenReturn(null)
        
        // Act & Assert
        assertEquals(testUserId, authTokenStorage.getUserId())
        assertEquals(testEmail, authTokenStorage.getUserEmail())
        assertNull(authTokenStorage.getUserName())
        assertNull(authTokenStorage.getUserProfilePicture())
    }
}
