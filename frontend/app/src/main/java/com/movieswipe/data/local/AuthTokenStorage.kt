package com.movieswipe.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys

/**
 * Secure storage for authentication tokens using EncryptedSharedPreferences
 */
class AuthTokenStorage(context: Context) {
    
    companion object {
        private const val PREFS_NAME = "auth_prefs"
        private const val KEY_JWT_TOKEN = "jwt_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_PROFILE_PICTURE = "user_profile_picture"
    }
    
    private val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
    
    private val sharedPreferences: SharedPreferences = EncryptedSharedPreferences.create(
        PREFS_NAME,
        masterKeyAlias,
        context,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
    
    /**
     * Save JWT token securely
     */
    fun saveJwtToken(token: String) {
        sharedPreferences.edit()
            .putString(KEY_JWT_TOKEN, token)
            .apply()
    }
    
    /**
     * Get stored JWT token
     */
    fun getJwtToken(): String? {
        return sharedPreferences.getString(KEY_JWT_TOKEN, null)
    }
    
    /**
     * Save user information
     */
    fun saveUserInfo(userId: String, email: String, name: String, profilePicture: String) {
        sharedPreferences.edit()
            .putString(KEY_USER_ID, userId)
            .putString(KEY_USER_EMAIL, email)
            .putString(KEY_USER_NAME, name)
            .putString(KEY_USER_PROFILE_PICTURE, profilePicture)
            .apply()
    }
    
    /**
     * Get stored user ID
     */
    fun getUserId(): String? {
        return sharedPreferences.getString(KEY_USER_ID, null)
    }
    
    /**
     * Get stored user email
     */
    fun getUserEmail(): String? {
        return sharedPreferences.getString(KEY_USER_EMAIL, null)
    }
    
    /**
     * Get stored user name
     */
    fun getUserName(): String? {
        return sharedPreferences.getString(KEY_USER_NAME, null)
    }
    
    /**
     * Get stored user profile picture URL
     */
    fun getUserProfilePicture(): String? {
        return sharedPreferences.getString(KEY_USER_PROFILE_PICTURE, null)
    }
    
    /**
     * Check if user is logged in (has valid token)
     */
    fun isLoggedIn(): Boolean {
        return getJwtToken() != null
    }
    
    /**
     * Clear all stored authentication data
     */
    fun clearAuthData() {
        sharedPreferences.edit()
            .remove(KEY_JWT_TOKEN)
            .remove(KEY_USER_ID)
            .remove(KEY_USER_EMAIL)
            .remove(KEY_USER_NAME)
            .remove(KEY_USER_PROFILE_PICTURE)
            .apply()
    }
}
