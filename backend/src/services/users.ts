// User service
// Contains the business logic for user operations

import { User, IUser } from '../models/users';
import { DatabaseError, NotFoundError, ValidationError } from '../types/common';
import { AuthenticatedUser } from '../types/auth';

export interface CreateUserData {
  googleId: string;
  email: string;
  name: string;
  profilePicture: string;
}

export class UserService {
  /**
   * Find user by Google ID
   * @param googleId - Google user ID
   * @returns Promise<IUser | null> - User document or null if not found
   */
  async findByGoogleId(googleId: string): Promise<IUser | null> {
    try {
      return await User.findByGoogleId(googleId);
    } catch (error) {
      throw new DatabaseError('Failed to find user by Google ID', error as Error);
    }
  }

  /**
   * Find user by email
   * @param email - User email
   * @returns Promise<IUser | null> - User document or null if not found
   */
  async findByEmail(email: string): Promise<IUser | null> {
    try {
      return await User.findByEmail(email);
    } catch (error) {
      throw new DatabaseError('Failed to find user by email', error as Error);
    }
  }

  /**
   * Find user by ID
   * @param id - User ID
   * @returns Promise<IUser | null> - User document or null if not found
   */
  async findById(id: string): Promise<IUser | null> {
    try {
      return await User.findById(id);
    } catch (error) {
      if (error instanceof Error && error.name === 'CastError') {
        return null;
      }
      throw new DatabaseError('Failed to find user by ID', error as Error);
    }
  }

  /**
   * Create a new user
   * @param userData - User data to create
   * @returns Promise<IUser> - Created user document
   * @throws ValidationError - If user data is invalid
   * @throws DatabaseError - If database operation fails
   */
  async createUser(userData: CreateUserData): Promise<IUser> {
    try {
      // Validate input data
      this.validateUserData(userData);

      // Check if user already exists
      const existingUser = await this.findByGoogleId(userData.googleId);
      if (existingUser) {
        throw new ValidationError('User already exists with this Google ID');
      }

      const existingEmail = await this.findByEmail(userData.email);
      if (existingEmail) {
        throw new ValidationError('User already exists with this email');
      }

      // Create new user
      const user = new User({
        googleId: userData.googleId,
        email: userData.email.toLowerCase(),
        name: userData.name.trim(),
        profilePicture: userData.profilePicture
      });

      return await user.save();
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'ValidationError') {
          throw new ValidationError('Invalid user data: ' + error.message);
        }
        if (error.name === 'MongoServerError' && (error as any).code === 11000) {
          throw new ValidationError('User already exists');
        }
      }
      
      throw new DatabaseError('Failed to create user', error as Error);
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
  async updateUser(id: string, updateData: Partial<CreateUserData>): Promise<IUser> {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
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
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'ValidationError') {
        throw new ValidationError('Invalid update data: ' + error.message);
      }
      
      throw new DatabaseError('Failed to update user', error as Error);
    }
  }

  /**
   * Delete user by ID
   * @param id - User ID
   * @returns Promise<boolean> - True if user was deleted
   * @throws NotFoundError - If user not found
   * @throws DatabaseError - If database operation fails
   */
  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await User.findByIdAndDelete(id);
      if (!result) {
        throw new NotFoundError('User not found');
      }
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete user', error as Error);
    }
  }

  /**
   * Convert user document to safe object for API responses
   * @param user - User document
   * @returns AuthenticatedUser - Safe user object
   */
  toAuthenticatedUser(user: IUser): AuthenticatedUser {
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
  private validateUserData(userData: CreateUserData): void {
    if (!userData.googleId || typeof userData.googleId !== 'string') {
      throw new ValidationError('Google ID is required and must be a string');
    }

    if (!userData.email || typeof userData.email !== 'string') {
      throw new ValidationError('Email is required and must be a string');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      throw new ValidationError('Invalid email format');
    }

    if (!userData.name || typeof userData.name !== 'string') {
      throw new ValidationError('Name is required and must be a string');
    }

    if (userData.name.trim().length < 1 || userData.name.trim().length > 100) {
      throw new ValidationError('Name must be between 1 and 100 characters');
    }

    if (!userData.profilePicture || typeof userData.profilePicture !== 'string') {
      throw new ValidationError('Profile picture URL is required and must be a string');
    }

    if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(userData.profilePicture)) {
      throw new ValidationError('Invalid profile picture URL format');
    }
  }
}
