# Use Case 3: Join Groups

This document provides a detailed description of the "Join Groups” use case using the following format:

- A short description of the use case  
- Primary actor(s)  
- Success scenario(s)  
- Failure scenario(s)

A success scenario is a numbered sequence of steps in the normal flow of events in the system. A failure scenario describes what can go wrong in each step of the success scenario and how this is handled. A failure scenario is numbered with the same number as the corresponding success scenario. That is, the list of failure scenarios does not have to start at 1. 

## Description

A user can join a group using the invitation code (becoming its member) and, as part of joining, specify their movie genre preferences from a list retrieved via the TMDB API. When a user joins the group, the group owner receives a real-time notification. 

## Primary Actors

- User  
- External Movie Service (TMDB API)

## Success Scenario

1. User selects the "Join Group" option from the main application page.  
2. System displays invitation code entry screen with text input field.  
3. User enters the 6-digit alphanumeric invitation code and taps the "Join" button.  
4. System validates the invitation code format, and checks if the group exists in the database and accepts new members.  
5. System verifies that the user is not already a member of this group.  
6. System retrieves movie genres from TMDB API.  
7. System displays genre preferences screen with checkboxes for all available genres.  
8. User selects their preferred movie genres from the list.  
9. User taps the "Save Preferences" button to confirm selections.  
10. System saves the user's genre preferences and adds the user to the group as a member.  
11. System sends a real-time notification to the group owner about the new member joining.  
12. System displays the group details page showing group name, invitation code, role (“member”), and the “Join Session” button.

## Failure Scenarios

4a. User enters invalid invitation code. 

- 4a1. System displays an error message "Invalid invitation code. Please check the code and try again."  
- 4a2. User corrects the invitation code and resubmits.

4b.  The voting session status of the group associated with the invitation code is not “waiting”. 

- 4b1. System displays an error message "This group no longer accepts new members." 

4c. Group associated with the invitation code has been deleted. 

- 4c1. System displays an error message "This group is no longer available." 

5a. User is already a member of this group. 

- 5a1. System displays a message "You are already a member of this group" and redirects to the group details page.

6a. TMDB API is unavailable or returns an error. 

- 6a1. System displays an error message "Unable to load movie genres. Please try again later."   
- 6a2. System provides an option to retry the TMDB API call or use cached genre list if available.

8a. User selects no genres. 

- 8a1. System displays error "Genre selection is required. Please choose your preferred movie types."   
- 8a2. User must select genres before proceeding to join the group.

10a. Database error while saving user preferences or group membership. 

- 10a1. System displays an error message "Failed to join group. Please try again."   
- 10a2. User retries the joining process.

11a. Group owner is offline and cannot receive real-time notification. 

- 11a1. System queues notification for delivery when the group owner comes online.   
- 11a2. Group owner receives notification when they next open the application.

