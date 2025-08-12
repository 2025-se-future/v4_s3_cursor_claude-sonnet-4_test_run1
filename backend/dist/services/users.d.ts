import { IUser } from '../models/users';
import { AuthenticatedUser } from '../types/auth';
export interface CreateUserData {
    googleId: string;
    email: string;
    name: string;
    profilePicture: string;
}
export declare class UserService {
    /**
     * Find user by Google ID
     * @param googleId - Google user ID
     * @returns Promise<IUser | null> - User document or null if not found
     */
    findByGoogleId(googleId: string): Promise<IUser | null>;
    /**
     * Find user by email
     * @param email - User email
     * @returns Promise<IUser | null> - User document or null if not found
     */
    findByEmail(email: string): Promise<IUser | null>;
    /**
     * Find user by ID
     * @param id - User ID
     * @returns Promise<IUser | null> - User document or null if not found
     */
    findById(id: string): Promise<IUser | null>;
    /**
     * Create a new user
     * @param userData - User data to create
     * @returns Promise<IUser> - Created user document
     * @throws ValidationError - If user data is invalid
     * @throws DatabaseError - If database operation fails
     */
    createUser(userData: CreateUserData): Promise<IUser>;
    /**
     * Update user information
     * @param id - User ID
     * @param updateData - Data to update
     * @returns Promise<IUser> - Updated user document
     * @throws NotFoundError - If user not found
     * @throws ValidationError - If update data is invalid
     * @throws DatabaseError - If database operation fails
     */
    updateUser(id: string, updateData: Partial<CreateUserData>): Promise<IUser>;
    /**
     * Delete user by ID
     * @param id - User ID
     * @returns Promise<boolean> - True if user was deleted
     * @throws NotFoundError - If user not found
     * @throws DatabaseError - If database operation fails
     */
    deleteUser(id: string): Promise<boolean>;
    /**
     * Convert user document to safe object for API responses
     * @param user - User document
     * @returns AuthenticatedUser - Safe user object
     */
    toAuthenticatedUser(user: IUser): AuthenticatedUser;
    /**
     * Validate user data
     * @param userData - User data to validate
     * @throws ValidationError - If data is invalid
     */
    private validateUserData;
}
//# sourceMappingURL=users.d.ts.map