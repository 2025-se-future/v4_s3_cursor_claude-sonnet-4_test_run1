import { GoogleTokenPayload, JWTPayload } from '../types/auth';
export declare class AuthService {
    private googleClient;
    private jwtSecret;
    private jwtExpiration;
    constructor();
    /**
     * Verify Google OAuth token and extract user information
     * @param token - Google OAuth token
     * @returns Promise<GoogleTokenPayload> - User information from Google
     * @throws AuthenticationError - If token is invalid
     * @throws ExternalServiceError - If Google service is unavailable
     */
    verifyGoogleToken(token: string): Promise<GoogleTokenPayload>;
    /**
     * Generate JWT token for authenticated user
     * @param userId - User ID to encode in token
     * @returns string - JWT token
     */
    generateJWT(userId: string): string;
    /**
     * Verify and decode JWT token
     * @param token - JWT token to verify
     * @returns JWTPayload - Decoded token payload
     * @throws AuthenticationError - If token is invalid or expired
     */
    verifyJWT(token: string): JWTPayload;
    /**
     * Extract token from Authorization header
     * @param authHeader - Authorization header value
     * @returns string | null - Extracted token or null if invalid format
     */
    extractTokenFromHeader(authHeader: string | undefined): string | null;
    /**
     * Generate secure cookie options for JWT token
     * @returns object - Cookie options
     */
    getSecureCookieOptions(): object;
}
//# sourceMappingURL=auth.d.ts.map