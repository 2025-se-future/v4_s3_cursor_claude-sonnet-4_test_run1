package com.movieswipe.ui.viewModels

import android.content.Context
import android.content.Intent
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.movieswipe.data.models.AuthResult
import com.movieswipe.data.models.AuthState
import com.movieswipe.data.repositories.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel for managing authentication state and operations
 */
class AuthViewModel(private val authRepository: AuthRepository) : ViewModel() {
    
    private val _authState = MutableStateFlow<AuthState>(AuthState.Loading)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    init {
        checkAuthenticationStatus()
    }
    
    /**
     * Check current authentication status
     */
    private fun checkAuthenticationStatus() {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            
            if (authRepository.isLoggedIn()) {
                // Verify token with backend
                val result = authRepository.verifyToken()
                _authState.value = when (result) {
                    is AuthResult.Success -> AuthState.Authenticated(result.user)
                    is AuthResult.Failure -> {
                        // Token is invalid, user needs to re-authenticate
                        AuthState.Unauthenticated
                    }
                    null -> AuthState.Unauthenticated
                }
            } else {
                _authState.value = AuthState.Unauthenticated
            }
        }
    }
    
    /**
     * Get Google Sign-In intent
     */
    fun getGoogleSignInIntent(): Intent {
        return authRepository.getGoogleSignInIntent()
    }
    
    /**
     * Handle Google Sign-In result
     */
    fun handleGoogleSignInResult(data: Intent?) {
        viewModelScope.launch {
            _isLoading.value = true
            
            try {
                val result = authRepository.handleGoogleSignInResult(data)
                _authState.value = when (result) {
                    is AuthResult.Success -> AuthState.Authenticated(result.user)
                    is AuthResult.Failure -> AuthState.Error(result.message, result.errorCode)
                }
            } catch (e: Exception) {
                _authState.value = AuthState.Error(
                    "Unexpected error during authentication: ${e.message}",
                    "UNKNOWN_ERROR"
                )
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    /**
     * Refresh authentication token
     */
    fun refreshToken() {
        viewModelScope.launch {
            val result = authRepository.refreshToken()
            _authState.value = when (result) {
                is AuthResult.Success -> AuthState.Authenticated(result.user)
                is AuthResult.Failure -> AuthState.Error(result.message, result.errorCode)
                null -> AuthState.Unauthenticated
            }
        }
    }
    
    /**
     * Logout user
     */
    fun logout() {
        viewModelScope.launch {
            _isLoading.value = true
            
            try {
                val success = authRepository.logout()
                if (success) {
                    _authState.value = AuthState.Unauthenticated
                } else {
                    _authState.value = AuthState.Error("Logout failed", "LOGOUT_ERROR")
                }
            } catch (e: Exception) {
                _authState.value = AuthState.Error(
                    "Error during logout: ${e.message}",
                    "LOGOUT_ERROR"
                )
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    /**
     * Clear error state and return to unauthenticated
     */
    fun clearError() {
        if (_authState.value is AuthState.Error) {
            _authState.value = AuthState.Unauthenticated
        }
    }
    
    /**
     * Retry authentication after error
     */
    fun retryAuthentication() {
        checkAuthenticationStatus()
    }
    
    /**
     * Get current user if authenticated
     */
    fun getCurrentUser() = authRepository.getCurrentUser()
    
    /**
     * Get current JWT token
     */
    fun getCurrentToken() = authRepository.getCurrentToken()
}

/**
 * Factory for creating AuthViewModel with dependencies
 */
class AuthViewModelFactory(private val context: Context) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AuthViewModel::class.java)) {
            return AuthViewModel(AuthRepository(context)) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
