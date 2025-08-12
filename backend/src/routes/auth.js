"use strict";
// Authentication routes
// Defines all the authentication endpoints and links them to controllers
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../controllers/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const authRouter = (0, express_1.Router)();
const authController = new auth_1.AuthController();
// Rate limiting for authentication endpoints
const authRateLimit = (0, rateLimiter_1.rateLimiter)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs for auth endpoints
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again later.',
        error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const strictAuthRateLimit = (0, rateLimiter_1.rateLimiter)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Stricter limit for login attempts
    message: {
        success: false,
        message: 'Too many login attempts. Please try again later.',
        error: 'LOGIN_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * @route   POST /api/auth/google
 * @desc    Authenticate user with Google OAuth token
 * @access  Public
 * @body    { googleToken: string }
 * @returns { success: boolean, message: string, user?: object, token?: string, error?: string }
 */
authRouter.post('/google', strictAuthRateLimit, authController.googleAuth);
/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear authentication cookie
 * @access  Public
 * @returns { success: boolean, message: string }
 */
authRouter.post('/logout', authController.logout);
/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token and return user information
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @returns { success: boolean, user?: object, error?: string }
 */
authRouter.get('/verify', authRateLimit, authController.verifyToken);
/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @returns { success: boolean, message: string, user?: object, token?: string, error?: string }
 */
authRouter.post('/refresh', authRateLimit, authController.refreshToken);
exports.default = authRouter;
//# sourceMappingURL=auth.js.map