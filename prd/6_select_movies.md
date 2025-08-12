# Use Case 6: Select Movies

This document provides a detailed description of the "Select Movies” use case using the following format:

- A short description of the use case  
- Primary actor(s)  
- Success scenario(s)  
- Failure scenario(s)

A success scenario is a numbered sequence of steps in the normal flow of events in the system. A failure scenario describes what can go wrong in each step of the success scenario and how this is handled. A failure scenario is numbered with the same number as the corresponding success scenario. That is, the list of failure scenarios does not have to start at 1. 

## Description

The group owner can end the voting session, triggering the system to analyze votes and determine the winning movie. The system then displays the winning movie to everyone in the session, along with the details of the movie. 

## Primary Actors

- User 

## Success Scenario

1. User (group owner) selects the "End Voting Session" button after they finish voting.  
2. System retrieves all vote records from the database for the current voting session.  
3. System counts total votes per movie (interested vs not interested).  
4. System sorts the movies based on vote counts and identifies the movie with the highest number of votes as the winning movie.  
5. System displays the winning movie details (title, poster, genre, length, and summary) to everyone in the voting session.

## Failure Scenarios:

2a. Database error while retrieving vote records. 

- 2a1. System displays an error message "Unable to retrieve voting results. Please try again."   
- 2a2. User (group owner) retries the ending voting session process after checking network connectivity.

4a. All movies have equal number of vote counts (tie situation). 

- 4a1. System randomly selects a winner from tied movies.

