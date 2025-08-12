package com.movieswipe.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.movieswipe.data.models.AuthState
import com.movieswipe.ui.screens.LoginScreen
import com.movieswipe.ui.screens.MainScreen
import com.movieswipe.ui.viewModels.AuthViewModel
import com.movieswipe.ui.viewModels.AuthViewModelFactory

/**
 * Navigation destinations
 */
object AuthDestinations {
    const val LOGIN = "login"
    const val MAIN = "main"
}

/**
 * Main authentication navigation component
 */
@Composable
fun AuthNavigation() {
    val navController = rememberNavController()
    val context = LocalContext.current
    val authViewModel: AuthViewModel = viewModel(factory = AuthViewModelFactory(context))
    val authState by authViewModel.authState.collectAsState()
    
    // Determine start destination based on auth state
    val startDestination = when (authState) {
        is AuthState.Authenticated -> AuthDestinations.MAIN
        is AuthState.Loading -> AuthDestinations.LOGIN // Will show loading in LoginScreen
        else -> AuthDestinations.LOGIN
    }
    
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(AuthDestinations.LOGIN) {
            LoginScreen(
                onAuthenticationSuccess = {
                    navController.navigate(AuthDestinations.MAIN) {
                        // Clear the back stack to prevent going back to login
                        popUpTo(AuthDestinations.LOGIN) { inclusive = true }
                    }
                },
                authViewModel = authViewModel
            )
        }
        
        composable(AuthDestinations.MAIN) {
            MainScreen(
                onLogout = {
                    navController.navigate(AuthDestinations.LOGIN) {
                        // Clear the back stack to prevent going back to main
                        popUpTo(AuthDestinations.MAIN) { inclusive = true }
                    }
                },
                authViewModel = authViewModel
            )
        }
    }
}
