// Authentication controller
// Handles incoming HTTP requests for authentication operations

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';
import { UserService, CreateUserData } from '../services/users';
import { AuthResponse } from '../types/auth';
import { 
  AuthenticationError, 
  ValidationError, 
  DatabaseError, 
  ExternalServiceError 
} from '../types/common';

export class AuthController {
  private authService: AuthService;
  private userService: UserService;

  constructor(authService?: AuthService, userService?: UserService) {
    this.authService = authService || new AuthService();
    this.userService = userService || new UserService();
  }

  /**
   * Handle Google OAuth authentication
   * POST /api/auth/google
   */
  googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { googleToken } = req.body;

      // Validate input
      if (!googleToken) {
        const response: AuthResponse = {
          success: false,
          message: 'Google token is required',
          error: 'MISSING_TOKEN'
        };
        res.status(400).json(response);
        return;
      }

      // Verify Google token
      let googleUserInfo;
      try {
        googleUserInfo = await this.authService.verifyGoogleToken(googleToken);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          const response: AuthResponse = {
            success: false,
            message: 'Authentication failed. Please try signing in again.',
            error: 'INVALID_TOKEN'
          };
          res.status(401).json(response);
          return;
        } else if (error instanceof ExternalServiceError) {
          const response: AuthResponse = {
            success: false,
            message: 'Authentication service temporarily unavailable. Please try again later.',
            error: 'SERVICE_UNAVAILABLE'
          };
          res.status(503).json(response);
          return;
        }
        throw error;
      }

      // Check if user exists or create new user
      let user = await this.userService.findByGoogleId(googleUserInfo.id);
      
      if (!user) {
        // Create new user
        const userData: CreateUserData = {
          googleId: googleUserInfo.id,
          email: googleUserInfo.email,
          name: googleUserInfo.name,
          profilePicture: googleUserInfo.picture
        };

        try {
          user = await this.userService.createUser(userData);
        } catch (error) {
          if (error instanceof DatabaseError) {
            const response: AuthResponse = {
              success: false,
              message: 'Account creation failed. Please try again.',
              error: 'DATABASE_ERROR'
            };
            res.status(500).json(response);
            return;
          }
          throw error;
        }
      }

      // Generate JWT token
      const jwtToken = this.authService.generateJWT(user._id.toString());

      // Set secure HTTP-only cookie
      const cookieOptions = this.authService.getSecureCookieOptions();
      res.cookie('auth_token', jwtToken, cookieOptions);

      // Send success response
      const response: AuthResponse = {
        success: true,
        message: 'Authentication successful',
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture
        },
        token: jwtToken
      };

      res.status(200).json(response);
    } catch (error) {
      // Handle unexpected errors
      const response: AuthResponse = {
        success: false,
        message: 'Authentication service temporarily unavailable. Please try again later.',
        error: 'SERVICE_UNAVAILABLE'
      };
      res.status(503).json(response);
      next(error);
    }
  };

  /**
   * Handle user logout
   * POST /api/auth/logout
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Clear authentication cookie
      res.clearCookie('auth_token');

      const response: AuthResponse = {
        success: true,
        message: 'Logout successful'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify JWT token and return user information
   * GET /api/auth/verify
   */
  verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      // Check if authorization header exists
      if (!authHeader) {
        const response: AuthResponse = {
          success: false,
          message: 'No token provided',
          error: 'MISSING_TOKEN'
        };
        res.status(401).json(response);
        return;
      }

      // Extract token from header
      const token = this.authService.extractTokenFromHeader(authHeader);
      if (!token) {
        const response: AuthResponse = {
          success: false,
          message: 'Invalid token format',
          error: 'INVALID_TOKEN_FORMAT'
        };
        res.status(401).json(response);
        return;
      }

      // Verify JWT token
      let decodedToken;
      try {
        decodedToken = this.authService.verifyJWT(token);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          const response: AuthResponse = {
            success: false,
            message: 'Invalid or expired token',
            error: 'INVALID_TOKEN'
          };
          res.status(401).json(response);
          return;
        }
        throw error;
      }

      // Get user information
      const user = await this.userService.findById(decodedToken.userId);
      if (!user) {
        const response: AuthResponse = {
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        };
        res.status(401).json(response);
        return;
      }

      // Send user information
      const response: AuthResponse = {
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture
        }
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refresh JWT token
   * POST /api/auth/refresh
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        const response: AuthResponse = {
          success: false,
          message: 'No token provided',
          error: 'MISSING_TOKEN'
        };
        res.status(401).json(response);
        return;
      }

      const token = this.authService.extractTokenFromHeader(authHeader);
      if (!token) {
        const response: AuthResponse = {
          success: false,
          message: 'Invalid token format',
          error: 'INVALID_TOKEN_FORMAT'
        };
        res.status(401).json(response);
        return;
      }

      // Verify current token
      let decodedToken;
      try {
        decodedToken = this.authService.verifyJWT(token);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          const response: AuthResponse = {
            success: false,
            message: 'Invalid or expired token',
            error: 'INVALID_TOKEN'
          };
          res.status(401).json(response);
          return;
        }
        throw error;
      }

      // Verify user still exists
      const user = await this.userService.findById(decodedToken.userId);
      if (!user) {
        const response: AuthResponse = {
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        };
        res.status(401).json(response);
        return;
      }

      // Generate new token
      const newToken = this.authService.generateJWT(user._id.toString());

      // Set new cookie
      const cookieOptions = this.authService.getSecureCookieOptions();
      res.cookie('auth_token', newToken, cookieOptions);

      const response: AuthResponse = {
        success: true,
        message: 'Token refreshed successfully',
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture
        },
        token: newToken
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
