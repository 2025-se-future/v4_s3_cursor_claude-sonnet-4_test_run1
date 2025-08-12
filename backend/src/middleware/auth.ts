// Authentication middleware
// Reusable function for authentication handling

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';
import { UserService } from '../services/users';
import { AuthenticationError } from '../types/common';
import { IUser } from '../models/users';

// Extend Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
    }
  }
}

export class AuthMiddleware {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
  }

  /**
   * Middleware to authenticate JWT tokens
   * Can be used for both required and optional authentication
   */
  authenticate = (required: boolean = true) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Try to get token from Authorization header first, then from cookies
        let token: string | null = null;
        
        const authHeader = req.headers.authorization;
        if (authHeader) {
          token = this.authService.extractTokenFromHeader(authHeader);
        } else if (req.cookies?.auth_token) {
          token = req.cookies.auth_token;
        }

        // If no token and authentication is required, return error
        if (!token && required) {
          res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.',
            error: 'NO_TOKEN'
          });
          return;
        }

        // If no token but authentication is optional, continue without user
        if (!token && !required) {
          next();
          return;
        }

        // Verify token
        let decodedToken;
        try {
          decodedToken = this.authService.verifyJWT(token!);
        } catch (error) {
          if (required) {
            res.status(401).json({
              success: false,
              message: 'Invalid or expired token.',
              error: 'INVALID_TOKEN'
            });
            return;
          } else {
            // For optional auth, continue without user if token is invalid
            next();
            return;
          }
        }

        // Get user from database
        const user = await this.userService.findById(decodedToken.userId);
        if (!user && required) {
          res.status(401).json({
            success: false,
            message: 'User not found.',
            error: 'USER_NOT_FOUND'
          });
          return;
        }

        // Add user to request object
        if (user) {
          req.user = user;
          req.userId = user._id.toString();
        }

        next();
      } catch (error) {
        if (required) {
          res.status(500).json({
            success: false,
            message: 'Authentication service error.',
            error: 'AUTH_SERVICE_ERROR'
          });
        } else {
          // For optional auth, continue on error
          next();
        }
      }
    };
  };

  /**
   * Middleware that requires authentication
   */
  requireAuth = this.authenticate(true);

  /**
   * Middleware that optionally authenticates (continues without user if no valid token)
   */
  optionalAuth = this.authenticate(false);

  /**
   * Middleware to check if user has specific permissions
   * This is a placeholder for future role-based access control
   */
  requirePermission = (permission: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      // For now, just check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
          error: 'NOT_AUTHENTICATED'
        });
        return;
      }

      // TODO: Implement role-based permission checking
      // For now, all authenticated users have all permissions
      next();
    };
  };

  /**
   * Middleware to check if the authenticated user is accessing their own resources
   */
  requireOwnership = (userIdParam: string = 'userId') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
          error: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const requestedUserId = req.params[userIdParam];
      const authenticatedUserId = req.user._id.toString();

      if (requestedUserId !== authenticatedUserId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.',
          error: 'ACCESS_DENIED'
        });
        return;
      }

      next();
    };
  };
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

// Export the middleware functions
export const requireAuth = authMiddleware.requireAuth;
export const optionalAuth = authMiddleware.optionalAuth;
export const requirePermission = authMiddleware.requirePermission;
export const requireOwnership = authMiddleware.requireOwnership;

// Export the class for testing
export { AuthMiddleware };
