"use strict";
// Authentication service
// Contains the business logic for authentication operations
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const auth_1 = require("../types/auth");
const common_1 = require("../types/common");
class AuthService {
    googleClient;
    jwtSecret;
    jwtExpiration;
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
        this.jwtExpiration = process.env.JWT_EXPIRATION || '7d';
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        if (!googleClientId) {
            throw new Error('GOOGLE_CLIENT_ID environment variable is required');
        }
        this.googleClient = new google_auth_library_1.OAuth2Client(googleClientId);
    }
    /**
     * Verify Google OAuth token and extract user information
     * @param token - Google OAuth token
     * @returns Promise<GoogleTokenPayload> - User information from Google
     * @throws AuthenticationError - If token is invalid
     * @throws ExternalServiceError - If Google service is unavailable
     */
    async verifyGoogleToken(token) {
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                throw new common_1.AuthenticationError('Invalid Google token - no payload');
            }
            if (!payload.email_verified) {
                throw new common_1.AuthenticationError('Google account email not verified');
            }
            return {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                email_verified: payload.email_verified
            };
        }
        catch (error) {
            if (error instanceof common_1.AuthenticationError) {
                throw error;
            }
            // Handle specific Google Auth errors
            if (error instanceof Error) {
                if (error.message.includes('Token used too early') ||
                    error.message.includes('Token used too late') ||
                    error.message.includes('Invalid token signature')) {
                    throw new common_1.AuthenticationError('Invalid Google token');
                }
                if (error.message.includes('fetch')) {
                    throw new common_1.ExternalServiceError('Authentication service temporarily unavailable. Please try again later.', 'Google OAuth', error);
                }
            }
            throw new common_1.AuthenticationError('Failed to verify Google token');
        }
    }
    /**
     * Generate JWT token for authenticated user
     * @param userId - User ID to encode in token
     * @returns string - JWT token
     */
    generateJWT(userId) {
        const payload = {
            userId,
            iat: Math.floor(Date.now() / 1000)
        };
        return jsonwebtoken_1.default.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpiration,
            issuer: 'movieswipe-api',
            audience: 'movieswipe-app'
        });
    }
    /**
     * Verify and decode JWT token
     * @param token - JWT token to verify
     * @returns JWTPayload - Decoded token payload
     * @throws AuthenticationError - If token is invalid or expired
     */
    verifyJWT(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.jwtSecret, {
                issuer: 'movieswipe-api',
                audience: 'movieswipe-app'
            });
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new common_1.AuthenticationError('Token has expired');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new common_1.AuthenticationError('Invalid token');
            }
            else if (error instanceof jsonwebtoken_1.default.NotBeforeError) {
                throw new common_1.AuthenticationError('Token not active yet');
            }
            throw new common_1.AuthenticationError('Token verification failed');
        }
    }
    /**
     * Extract token from Authorization header
     * @param authHeader - Authorization header value
     * @returns string | null - Extracted token or null if invalid format
     */
    extractTokenFromHeader(authHeader) {
        if (!authHeader) {
            return null;
        }
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }
        return parts[1];
    }
    /**
     * Generate secure cookie options for JWT token
     * @returns object - Cookie options
     */
    getSecureCookieOptions() {
        return {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
            path: '/'
        };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.js.map