# Use Case 1: Authenticate User

This document provides a detailed description of the "Authenticate User” use case using the following format:

- A short description of the use case  
- Primary actor(s)  
- Success scenario(s)  
- Failure scenario(s)

A success scenario is a numbered sequence of steps in the normal flow of events in the system. A failure scenario describes what can go wrong in each step of the success scenario and how this is handled. A failure scenario is numbered with the same number as the corresponding success scenario. That is, the list of failure scenarios does not have to start at 1. 

## Description

To access app features, a user must authenticate using “Sign in with Google in Android” first. New users are automatically registered upon first login.

## Primary Actors

- User  
- External Authentication Service (“Sign in with Google in Android”)

## Success Scenario

1. User opens the MovieSwipe application.  
2. System displays the login screen with the "Sign in with Google" button.  
3. User taps the "Sign in with Google" button.  
4. System initiates Google authentication flow, either presenting available Google accounts or prompting the user to sign in with their Google credentials.  
5. User completes the Google authentication process by selecting an account or entering their credentials.  
6. Google authentication service validates credentials and grants permission.  
7. System receives an authentication token from Google.  
8. System checks if the user exists in the database using Google user ID.  
9. If the user does not exist in the database, System creates a new user profile with Google account information (name, email, profile picture).  
10. System stores the user session and redirects the user to the main application page, displaying the list of groups the user has created or joined. 

## Failure Scenarios

4a. Google Authentication Service is unavailable. 

- 4a1. System displays an error message "Authentication service temporarily unavailable. Please try again later."   
- 4a2. User waits and retries authentication.

5a. User cancels Google authentication. 

- 5a1. System returns to login screen without authentication.   
- 5a2. User retries authentication or exits the application.

6a. Authentication token is invalid or corrupted. 

- 6a1. System displays an error message "Authentication failed. Please try signing in again."   
- 6a2. User restarts authentication process from step 3.

7a. User profile creation fails due to database error. 

- 7a1. System displays an error message "Account creation failed. Please try again."   
- 7a2. System logs error details for debugging and user retries authentication.

