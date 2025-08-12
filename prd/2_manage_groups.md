# Use Case 2: Manage Groups

This document provides a detailed description of the "Manage Groups” use case using the following format:

- A short description of the use case  
- Primary actor(s)  
- Success scenario(s)  
- Failure scenario(s)

A success scenario is a numbered sequence of steps in the normal flow of events in the system. A failure scenario describes what can go wrong in each step of the success scenario and how this is handled. A failure scenario is numbered with the same number as the corresponding success scenario. That is, the list of failure scenarios does not have to start at 1. 

## Description

A user can create a group (becoming its owner), view groups they own or belong to, and delete groups they own. When creating a group, the system generates a unique invitation code for member recruitment, and the owner specifies their movie genre preferences from a list of genres retrieved using the TMDB API for group movie recommendations. 

## Primary Actors

- User

## Success Scenarios

### Scenario1: Create Group

1. User navigates to the main application page and selects the "Create New Group" option.  
2. System displays group creation form requesting group name.  
3. User enters the group name, then taps the "Create Group" button.  
4. System generates a unique 6-digit alphanumeric invitation code for the group.  
5. System retrieves movie genres from TMDB API.  
6. System displays genre preferences screen with checkboxes for all available genres.  
7. User selects their preferred movie genres from the list.  
8. User taps the "Save Preferences" button to confirm selections.  
9. System creates a new group in the database, sets the group voting status as “waiting”, saves the user's genre preferences, assigns the user as the group owner, and adds them to the group.  
10. System displays the group details page showing group name, invitation code, role (“owner”), the "Start Voting Session" button, the “Join Session” button, and the "Delete Group" button.

### Scenario2: View Groups

11. User navigates to the main application page.   
12. System retrieves and displays the list of groups where the user is owner or member.   
13. System shows the group name and user's role (“owner”/“member”) for each group.   
14. User can select any group to view detailed information.

### Scenario3: Delete Group

15. User selects a group they own from the groups list.   
16. User (group owner) taps the "Delete Group" button from the group details page.   
17. System displays a confirmation dialog warning about permanent deletion.   
18. User (group owner) confirms deletion by tapping the "Delete" button.   
19. System removes the group from the database.   
20. System returns the user (group owner) to the main application page with a confirmation message.

## Failure Scenarios

### Scenario1: Create Group

3a. User enters an empty or invalid group name. 

- 3a1. System displays an error message "Group name is required and must be 3-30 characters."   
- 3a2. User corrects the group name and resubmits the form.

4a. System fails to generate a unique invitation code. 

- 4a1. System retries code generation up to 3 times.   
- 4a2. If still failing, System displays an error message "Unable to create the group. Please try again later."

5a. TMDB API is unavailable or returns an error. 

- 5a1. System displays an error message "Unable to load movie genres. Please try again later."   
- 5a2. System provides an option to retry the TMDB API call or use cached genre list if available.

7a. User selects no genres. 

- 7a1. System displays error "Genre selection is required. Please choose your preferred movie types."   
- 7a2. User must select genres before proceeding to create the group.

9a. Database error while creating the group. 

- 9a1. System displays an error message "Failed to create group. Please try again."   
- 9a2. User retries the creating group process.

### Scenario2: View Groups

12a. Database error while retrieving the group list. 

- 12a1. System displays an error message "Unable to load groups. Please try again."   
- 12a2. User retries by pulling to refresh or navigating back to the group list.

### Scenario3: Delete Group

19a. Database error during group deletion. 

- 19a1. System displays an error message "Failed to delete group. Please try again."   
- 19a2. User (group owner) retries deletion.