"use strict";
// User service
// Contains the business logic for user operations
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const users_1 = require("../models/users");
const common_1 = require("../types/common");
const auth_1 = require("../types/auth");
class UserService {
    /**
     * Find user by Google ID
     * @param googleId - Google user ID
     * @returns Promise<IUser | null> - User document or null if not found
     */
    async findByGoogleId(googleId) {
        try {
            return await users_1.User.findByGoogleId(googleId);
        }
        catch (error) {
            throw new common_1.DatabaseError('Failed to find user by Google ID', error);
        }
    }
    /**
     * Find user by email
     * @param email - User email
     * @returns Promise<IUser | null> - User document or null if not found
     */
    async findByEmail(email) {
        try {
            return await users_1.User.findByEmail(email);
        }
        catch (error) {
            throw new common_1.DatabaseError('Failed to find user by email', error);
        }
    }
    /**
     * Find user by ID
     * @param id - User ID
     * @returns Promise<IUser | null> - User document or null if not found
     */
    async findById(id) {
        try {
            return await users_1.User.findById(id);
        }
        catch (error) {
            if (error instanceof Error && error.name === 'CastError') {
                return null;
            }
            throw new common_1.DatabaseError('Failed to find user by ID', error);
        }
    }
    /**
     * Create a new user
     * @param userData - User data to create
     * @returns Promise<IUser> - Created user document
     * @throws ValidationError - If user data is invalid
     * @throws DatabaseError - If database operation fails
     */
    async createUser(userData) {
        try {
            // Validate input data
            this.validateUserData(userData);
            // Check if user already exists
            const existingUser = await this.findByGoogleId(userData.googleId);
            if (existingUser) {
                throw new common_1.ValidationError('User already exists with this Google ID');
            }
            const existingEmail = await this.findByEmail(userData.email);
            if (existingEmail) {
                throw new common_1.ValidationError('User already exists with this email');
            }
            // Create new user
            const user = new users_1.User({
                googleId: userData.googleId,
                email: userData.email.toLowerCase(),
                name: userData.name.trim(),
                profilePicture: userData.profilePicture
            });
            return await user.save();
        }
        catch (error) {
            if (error instanceof common_1.ValidationError) {
                throw error;
            }
            if (error instanceof Error) {
                if (error.name === 'ValidationError') {
                    throw new common_1.ValidationError('Invalid user data: ' + error.message);
                }
                if (error.name === 'MongoServerError' && error.code === 11000) {
                    throw new common_1.ValidationError('User already exists');
                }
            }
            throw new common_1.DatabaseError('Failed to create user', error);
        }
    }
    /**
     * Update user information
     * @param id - User ID
     * @param updateData - Data to update
     * @returns Promise<IUser> - Updated user document
     * @throws NotFoundError - If user not found
     * @throws ValidationError - If update data is invalid
     * @throws DatabaseError - If database operation fails
     */
    async updateUser(id, updateData) {
        try {
            const user = await users_1.User.findById(id);
            if (!user) {
                throw new common_1.NotFoundError('User not found');
            }
            // Validate update data
            if (updateData.email) {
                updateData.email = updateData.email.toLowerCase();
            }
            if (updateData.name) {
                updateData.name = updateData.name.trim();
            }
            Object.assign(user, updateData);
            return await user.save();
        }
        catch (error) {
            if (error instanceof common_1.NotFoundError || error instanceof common_1.ValidationError) {
                throw error;
            }
            if (error instanceof Error && error.name === 'ValidationError') {
                throw new common_1.ValidationError('Invalid update data: ' + error.message);
            }
            throw new common_1.DatabaseError('Failed to update user', error);
        }
    }
    /**
     * Delete user by ID
     * @param id - User ID
     * @returns Promise<boolean> - True if user was deleted
     * @throws NotFoundError - If user not found
     * @throws DatabaseError - If database operation fails
     */
    async deleteUser(id) {
        try {
            const result = await users_1.User.findByIdAndDelete(id);
            if (!result) {
                throw new common_1.NotFoundError('User not found');
            }
            return true;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundError) {
                throw error;
            }
            throw new common_1.DatabaseError('Failed to delete user', error);
        }
    }
    /**
     * Convert user document to safe object for API responses
     * @param user - User document
     * @returns AuthenticatedUser - Safe user object
     */
    toAuthenticatedUser(user) {
        return {
            id: user._id.toString(),
            googleId: user.googleId,
            email: user.email,
            name: user.name,
            profilePicture: user.profilePicture,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }
    /**
     * Validate user data
     * @param userData - User data to validate
     * @throws ValidationError - If data is invalid
     */
    validateUserData(userData) {
        if (!userData.googleId || typeof userData.googleId !== 'string') {
            throw new common_1.ValidationError('Google ID is required and must be a string');
        }
        if (!userData.email || typeof userData.email !== 'string') {
            throw new common_1.ValidationError('Email is required and must be a string');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
            throw new common_1.ValidationError('Invalid email format');
        }
        if (!userData.name || typeof userData.name !== 'string') {
            throw new common_1.ValidationError('Name is required and must be a string');
        }
        if (userData.name.trim().length < 1 || userData.name.trim().length > 100) {
            throw new common_1.ValidationError('Name must be between 1 and 100 characters');
        }
        if (!userData.profilePicture || typeof userData.profilePicture !== 'string') {
            throw new common_1.ValidationError('Profile picture URL is required and must be a string');
        }
        if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(userData.profilePicture)) {
            throw new common_1.ValidationError('Invalid profile picture URL format');
        }
    }
}
exports.UserService = UserService;
//# sourceMappingURL=users.js.map