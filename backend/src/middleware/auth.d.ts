import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/users';
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
            userId?: string;
        }
    }
}
export declare class AuthMiddleware {
    private authService;
    private userService;
    constructor();
    /**
     * Middleware to authenticate JWT tokens
     * Can be used for both required and optional authentication
     */
    authenticate: (required?: boolean) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Middleware that requires authentication
     */
    requireAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Middleware that optionally authenticates (continues without user if no valid token)
     */
    optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Middleware to check if user has specific permissions
     * This is a placeholder for future role-based access control
     */
    requirePermission: (permission: string) => (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Middleware to check if the authenticated user is accessing their own resources
     */
    requireOwnership: (userIdParam?: string) => (req: Request, res: Response, next: NextFunction) => void;
}
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requirePermission: (permission: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireOwnership: (userIdParam?: string) => (req: Request, res: Response, next: NextFunction) => void;
export { AuthMiddleware };
//# sourceMappingURL=auth.d.ts.map