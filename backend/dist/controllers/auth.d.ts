import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';
import { UserService } from '../services/users';
export declare class AuthController {
    private authService;
    private userService;
    constructor(authService?: AuthService, userService?: UserService);
    /**
     * Handle Google OAuth authentication
     * POST /api/auth/google
     */
    googleAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Handle user logout
     * POST /api/auth/logout
     */
    logout: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Verify JWT token and return user information
     * GET /api/auth/verify
     */
    verifyToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Refresh JWT token
     * POST /api/auth/refresh
     */
    refreshToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
//# sourceMappingURL=auth.d.ts.map