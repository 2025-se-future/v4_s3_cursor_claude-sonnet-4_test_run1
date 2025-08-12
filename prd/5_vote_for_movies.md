# Use Case 5: Vote for Movies

This document provides a detailed description of the "Start Voting Movies” use case using the following format:

- A short description of the use case  
- Primary actor(s)  
- Success scenario(s)  
- Failure scenario(s)

A success scenario is a numbered sequence of steps in the normal flow of events in the system. A failure scenario describes what can go wrong in each step of the success scenario and how this is handled. A failure scenario is numbered with the same number as the corresponding success scenario. That is, the list of failure scenarios does not have to start at 1. 

## Description

In the voting session, each group member indicates their movie preferences by swiping right for “yes” or swiping left for “no” on each movie card displaying metadata retrieved from the TMDB API. 

## Primary Actors

- User

## Success Scenario:

1. User navigates to the group details page and taps on the “Join Session” button.   
2. System displays a voting page with the first movie card showing movie details (title, poster, rating, length, and summary).   
3. User swipes right (interested) or left (not interested) on the displayed movie card.  
4. System records each vote in real-time and updates vote counts in the database.  
5. System automatically advances to the next movie card after the user votes.  
6. User continues voting through all recommended movies in the session.  
7. The voting session continues until the group owner ends the session.

## Failure Scenarios:

1a. The voting session status of the group is not “voting”. 

- 1a1. System displays an error message “There is no session to vote.”

2a. Database error while activating voting session. 

- 2a1. System displays an error message "Failed to join the voting session. Please try again."   
- 2a2. User retries joining the voting session.

4a. Database error when recording votes. 

- 4a1. System retries vote recording up to 3 times.   
- 4a2. If still failing, System displays an error message "Unable to save the vote. Please try again later."

