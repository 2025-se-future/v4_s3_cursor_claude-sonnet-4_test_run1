# Use Case 4: Start Voting Session

This document provides a detailed description of the "Start Voting Movies” use case using the following format:

- A short description of the use case  
- Primary actor(s)  
- Success scenario(s)  
- Failure scenario(s)

A success scenario is a numbered sequence of steps in the normal flow of events in the system. A failure scenario describes what can go wrong in each step of the success scenario and how this is handled. A failure scenario is numbered with the same number as the corresponding success scenario. That is, the list of failure scenarios does not have to start at 1. 

## Description

The group owner can start a voting session, triggering the system to generate a movie list based on all members’ genre preferences. Once the list is ready, the system sends real-time notification to all members announcing the start of the voting session.

## Primary Actors

- User (group owner)  
- External Movie Service (TMDB API)

## Success Scenario

1. User (group owner) navigates to the group details page and taps the "Start Voting Session" button.  
2. System retrieves genre preferences of everyone in the group from the database.  
3. System applies an intelligent preference analysis that:  
- Calculates the frequency of each genre across the group,  
- Assigns higher weights to genres liked by more members,   
- Identifies unique genres chosen by only one member to promote diversity.  
4. System generates a genre priority list using these weights, balancing popular and unique genres.   
5. System queries the TMDB API in priority order to fetch movie candidates.  
6. System removes duplicate movies and applies diversity and quality checks (e.g., avoiding overrepresentation of a single genre, removing low-rated movies).  
7. System compiles a final list of 10 movies by:  
- Filling most slots with movies from common genres.  
- Filling the rest with movies from unique genres.  
8. System stores the 10 movie details  (title, poster, rating, length, and summary) in the database and updates the group voting session status from “waiting” to “voting”.  
9. System displays a confirmation message to the user (group owner).   
10. System sends real-time notification to all group members that the voting session is ready. 

## Failure Scenarios

1a. The voting session status of the group is not “waiting”. 

- 1a1. If the voting session status is “voting”, System displays an error message "The voting session is in progress." If the voting session status is “completed”, System displays an error message "The voting session is completed."

2a. Database error while retrieving genre preferences. 

- 2a1. System displays an error message "Unable to load member preferences. Please try again." 

3a. All group members have different genre preferences with no overlap. 

- 3a1. System assigns the same weights to all genres.

4a. Multiple genres have the same weight. 

- 4a1. System randomly orders these genres.  

5a. TMDB API is unavailable or returns an error. 

- 5a1. System displays an error message "Unable to load movies. Please try again later."   
- 5a2. System provides the option to retry the TMDB API call or use the cached movie list if available.

8a. Database error while saving movie details or updating group voting session status. 

- 8a1. System displays an error message "Failed to prepare voting session. Please try again."   
- 8a2. User (group owner) retries the starting voting session process. 