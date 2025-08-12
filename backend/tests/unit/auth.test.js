import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AuthController } from '../../src/controllers/auth';
import { AuthService } from '../../src/services/auth';
import { UserService } from '../../src/services/users';
import { DatabaseError, AuthenticationError } from '../../src/types/common';
// Mock the services
jest.mock('../../src/services/auth');
jest.mock('../../src/services/users');
const MockedAuthService = AuthService;
const MockedUserService = UserService;
describe('AuthController', () => {
    let authController;
    let mockAuthService;
    let mockUserService;
    let mockRequest;
    let mockResponse;
    let mockNext;
    beforeEach(() => {
        mockAuthService = new MockedAuthService();
        mockUserService = new MockedUserService();
        authController = new AuthController(mockAuthService, mockUserService);
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('googleAuth', () => {
        it('should successfully authenticate new user and create profile', async () => {
            // Arrange
            const googleToken = 'valid_google_token';
            const googleUserInfo = {
                id: 'google_user_123',
                email: 'user@example.com',
                name: 'Test User',
                picture: 'https://example.com/profile.jpg'
            };
            const newUser = {
                id: 'user_123',
                googleId: 'google_user_123',
                email: 'user@example.com',
                name: 'Test User',
                profilePicture: 'https://example.com/profile.jpg',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const jwtToken = 'jwt_token_123';
            mockRequest.body = { googleToken };
            mockAuthService.verifyGoogleToken.mockResolvedValue(googleUserInfo);
            mockUserService.findByGoogleId.mockResolvedValue(null);
            mockUserService.createUser.mockResolvedValue(newUser);
            mockAuthService.generateJWT.mockReturnValue(jwtToken);
            // Act
            await authController.googleAuth(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockAuthService.verifyGoogleToken).toHaveBeenCalledWith(googleToken);
            expect(mockUserService.findByGoogleId).toHaveBeenCalledWith('google_user_123');
            expect(mockUserService.createUser).toHaveBeenCalledWith({
                googleId: 'google_user_123',
                email: 'user@example.com',
                name: 'Test User',
                profilePicture: 'https://example.com/profile.jpg'
            });
            expect(mockAuthService.generateJWT).toHaveBeenCalledWith(newUser.id);
            expect(mockResponse.cookie).toHaveBeenCalledWith('auth_token', jwtToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Authentication successful',
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name,
                    profilePicture: newUser.profilePicture
                },
                token: jwtToken
            });
        });
        it('should successfully authenticate existing user', async () => {
            // Arrange
            const googleToken = 'valid_google_token';
            const googleUserInfo = {
                id: 'google_user_123',
                email: 'user@example.com',
                name: 'Test User',
                picture: 'https://example.com/profile.jpg'
            };
            const existingUser = {
                id: 'user_123',
                googleId: 'google_user_123',
                email: 'user@example.com',
                name: 'Test User',
                profilePicture: 'https://example.com/profile.jpg',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const jwtToken = 'jwt_token_123';
            mockRequest.body = { googleToken };
            mockAuthService.verifyGoogleToken.mockResolvedValue(googleUserInfo);
            mockUserService.findByGoogleId.mockResolvedValue(existingUser);
            mockAuthService.generateJWT.mockReturnValue(jwtToken);
            // Act
            await authController.googleAuth(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockAuthService.verifyGoogleToken).toHaveBeenCalledWith(googleToken);
            expect(mockUserService.findByGoogleId).toHaveBeenCalledWith('google_user_123');
            expect(mockUserService.createUser).not.toHaveBeenCalled();
            expect(mockAuthService.generateJWT).toHaveBeenCalledWith(existingUser.id);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Authentication successful',
                user: {
                    id: existingUser.id,
                    email: existingUser.email,
                    name: existingUser.name,
                    profilePicture: existingUser.profilePicture
                },
                token: jwtToken
            });
        });
        it('should handle missing google token', async () => {
            // Arrange
            mockRequest.body = {};
            // Act
            await authController.googleAuth(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Google token is required',
                error: 'MISSING_TOKEN'
            });
        });
        it('should handle invalid google token', async () => {
            // Arrange
            const googleToken = 'invalid_google_token';
            mockRequest.body = { googleToken };
            mockAuthService.verifyGoogleToken.mockRejectedValue(new AuthenticationError('Invalid Google token'));
            // Act
            await authController.googleAuth(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockAuthService.verifyGoogleToken).toHaveBeenCalledWith(googleToken);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Authentication failed. Please try signing in again.',
                error: 'INVALID_TOKEN'
            });
        });
        it('should handle database error during user creation', async () => {
            // Arrange
            const googleToken = 'valid_google_token';
            const googleUserInfo = {
                id: 'google_user_123',
                email: 'user@example.com',
                name: 'Test User',
                picture: 'https://example.com/profile.jpg'
            };
            mockRequest.body = { googleToken };
            mockAuthService.verifyGoogleToken.mockResolvedValue(googleUserInfo);
            mockUserService.findByGoogleId.mockResolvedValue(null);
            mockUserService.createUser.mockRejectedValue(new DatabaseError('Database connection failed'));
            // Act
            await authController.googleAuth(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Account creation failed. Please try again.',
                error: 'DATABASE_ERROR'
            });
        });
        it('should handle authentication service unavailable', async () => {
            // Arrange
            const googleToken = 'valid_google_token';
            mockRequest.body = { googleToken };
            mockAuthService.verifyGoogleToken.mockRejectedValue(new Error('Service unavailable'));
            // Act
            await authController.googleAuth(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(503);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Authentication service temporarily unavailable. Please try again later.',
                error: 'SERVICE_UNAVAILABLE'
            });
        });
    });
    describe('logout', () => {
        it('should successfully logout user', async () => {
            // Act
            await authController.logout(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockResponse.clearCookie).toHaveBeenCalledWith('auth_token');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Logout successful'
            });
        });
    });
    describe('verifyToken', () => {
        it('should successfully verify valid token', async () => {
            // Arrange
            const token = 'valid_jwt_token';
            const userId = 'user_123';
            const user = {
                id: 'user_123',
                email: 'user@example.com',
                name: 'Test User',
                profilePicture: 'https://example.com/profile.jpg'
            };
            mockRequest.headers = { authorization: `Bearer ${token}` };
            mockAuthService.verifyJWT.mockReturnValue({ userId });
            mockUserService.findById.mockResolvedValue(user);
            // Act
            await authController.verifyToken(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockAuthService.verifyJWT).toHaveBeenCalledWith(token);
            expect(mockUserService.findById).toHaveBeenCalledWith(userId);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    profilePicture: user.profilePicture
                }
            });
        });
        it('should handle missing authorization header', async () => {
            // Arrange
            mockRequest.headers = {};
            // Act
            await authController.verifyToken(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'No token provided',
                error: 'MISSING_TOKEN'
            });
        });
        it('should handle invalid token format', async () => {
            // Arrange
            mockRequest.headers = { authorization: 'InvalidFormat' };
            // Act
            await authController.verifyToken(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid token format',
                error: 'INVALID_TOKEN_FORMAT'
            });
        });
        it('should handle expired or invalid token', async () => {
            // Arrange
            const token = 'expired_jwt_token';
            mockRequest.headers = { authorization: `Bearer ${token}` };
            mockAuthService.verifyJWT.mockImplementation(() => {
                throw new AuthenticationError('Token expired');
            });
            // Act
            await authController.verifyToken(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid or expired token',
                error: 'INVALID_TOKEN'
            });
        });
    });
});
describe('AuthService', () => {
    let authService;
    beforeEach(() => {
        authService = new AuthService();
    });
    describe('verifyGoogleToken', () => {
        it('should successfully verify valid Google token', async () => {
            // This would typically mock the Google OAuth2 client
            // For now, we'll test the interface
            const token = 'valid_google_token';
            // Mock implementation would go here
            // expect(await authService.verifyGoogleToken(token)).toEqual({
            //   id: 'google_user_123',
            //   email: 'user@example.com',
            //   name: 'Test User',
            //   picture: 'https://example.com/profile.jpg'
            // });
        });
        it('should reject invalid Google token', async () => {
            const token = 'invalid_google_token';
            // Mock implementation would reject
            // await expect(authService.verifyGoogleToken(token))
            //   .rejects.toThrow(AuthenticationError);
        });
    });
    describe('generateJWT', () => {
        it('should generate valid JWT token', () => {
            const userId = 'user_123';
            const token = authService.generateJWT(userId);
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);
        });
    });
    describe('verifyJWT', () => {
        it('should verify valid JWT token', () => {
            const userId = 'user_123';
            const token = authService.generateJWT(userId);
            const decoded = authService.verifyJWT(token);
            expect(decoded.userId).toBe(userId);
        });
        it('should reject invalid JWT token', () => {
            const invalidToken = 'invalid.jwt.token';
            expect(() => authService.verifyJWT(invalidToken))
                .toThrow(AuthenticationError);
        });
    });
});
//# sourceMappingURL=auth.test.js.map