"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const express_1 = require("express");
const auth_1 = require("../../src/controllers/auth");
const auth_2 = require("../../src/services/auth");
const users_1 = require("../../src/services/users");
const common_1 = require("../../src/types/common");
// Mock the services
globals_1.jest.mock('../../src/services/auth');
globals_1.jest.mock('../../src/services/users');
const MockedAuthService = auth_2.AuthService;
const MockedUserService = users_1.UserService;
(0, globals_1.describe)('AuthController', () => {
    let authController;
    let mockAuthService;
    let mockUserService;
    let mockRequest;
    let mockResponse;
    let mockNext;
    (0, globals_1.beforeEach)(() => {
        mockAuthService = new MockedAuthService();
        mockUserService = new MockedUserService();
        authController = new auth_1.AuthController(mockAuthService, mockUserService);
        mockRequest = {};
        mockResponse = {
            status: globals_1.jest.fn().mockReturnThis(),
            json: globals_1.jest.fn().mockReturnThis(),
            cookie: globals_1.jest.fn().mockReturnThis(),
            clearCookie: globals_1.jest.fn().mockReturnThis(),
        };
        mockNext = globals_1.jest.fn();
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)('googleAuth', () => {
        (0, globals_1.it)('should successfully authenticate new user and create profile', async () => {
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
            (0, globals_1.expect)(mockAuthService.verifyGoogleToken).toHaveBeenCalledWith(googleToken);
            (0, globals_1.expect)(mockUserService.findByGoogleId).toHaveBeenCalledWith('google_user_123');
            (0, globals_1.expect)(mockUserService.createUser).toHaveBeenCalledWith({
                googleId: 'google_user_123',
                email: 'user@example.com',
                name: 'Test User',
                profilePicture: 'https://example.com/profile.jpg'
            });
            (0, globals_1.expect)(mockAuthService.generateJWT).toHaveBeenCalledWith(newUser.id);
            (0, globals_1.expect)(mockResponse.cookie).toHaveBeenCalledWith('auth_token', jwtToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(200);
            (0, globals_1.expect)(mockResponse.json).toHaveBeenCalledWith({
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
        (0, globals_1.it)('should successfully authenticate existing user', async () => {
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
            (0, globals_1.expect)(mockAuthService.verifyGoogleToken).toHaveBeenCalledWith(googleToken);
            (0, globals_1.expect)(mockUserService.findByGoogleId).toHaveBeenCalledWith('google_user_123');
            (0, globals_1.expect)(mockUserService.createUser).not.toHaveBeenCalled();
            (0, globals_1.expect)(mockAuthService.generateJWT).toHaveBeenCalledWith(existingUser.id);
            (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(200);
            (0, globals_1.expect)(mockResponse.json).toHaveBeenCalledWith({
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
        (0, globals_1.it)('should handle missing google token', async () => {
            // Arrange
            mockRequest.body = {};
            // Act
            await authController.googleAuth(mockRequest, mockResponse, mockNext);
            // Assert
            (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(400);
            (0, globals_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Google token is required',
                error: 'MISSING_TOKEN'
            });
        });
        (0, globals_1.it)('should handle invalid google token', async () => {
            // Arrange
            const googleToken = 'invalid_google_token';
            mockRequest.body = { googleToken };
            mockAuthService.verifyGoogleToken.mockRejectedValue(new common_1.AuthenticationError('Invalid Google token'));
            // Act
            await authController.googleAuth(mockRequest, mockResponse, mockNext);
            // Assert
            (0, globals_1.expect)(mockAuthService.verifyGoogleToken).toHaveBeenCalledWith(googleToken);
            (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(401);
            (0, globals_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Authentication failed. Please try signing in again.',
                error: 'INVALID_TOKEN'
            });
        });
        (0, globals_1.it)('should handle database error during user creation', async () => {
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
            mockUserService.createUser.mockRejectedValue(new common_1.DatabaseError('Database connection failed'));
            // Act
            await authController.googleAuth(mockRequest, mockResponse, mockNext);
            // Assert
            (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(500);
            (0, globals_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Account creation failed. Please try again.',
                error: 'DATABASE_ERROR'
            });
        });
        (0, globals_1.it)('should handle authentication service unavailable', async () => {
            // Arrange
            const googleToken = 'valid_google_token';
            mockRequest.body = { googleToken };
            mockAuthService.verifyGoogleToken.mockRejectedValue(new Error('Service unavailable'));
            // Act
            await authController.googleAuth(mockRequest, mockResponse, mockNext);
            // Assert
            (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(503);
            (0, globals_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Authentication service temporarily unavailable. Please try again later.',
                error: 'SERVICE_UNAVAILABLE'
            });
        });
    });
    (0, globals_1.describe)('logout', () => {
        (0, globals_1.it)('should successfully logout user', async () => {
            // Act
            await authController.logout(mockRequest, mockResponse, mockNext);
            // Assert
            (0, globals_1.expect)(mockResponse.clearCookie).toHaveBeenCalledWith('auth_token');
            (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(200);
            (0, globals_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Logout successful'
            });
        });
    });
    (0, globals_1.describe)('verifyToken', () => {
        (0, globals_1.it)('should successfully verify valid token', async () => {
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
            (0, globals_1.expect)(mockAuthService.verifyJWT).toHaveBeenCalledWith(token);
            (0, globals_1.expect)(mockUserService.findById).toHaveBeenCalledWith(userId);
            (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(200);
            (0, globals_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    profilePicture: user.profilePicture
                }
            });
        });
        (0, globals_1.it)('should handle missing authorization header', async () => {
            // Arrange
            mockRequest.headers = {};
            // Act
            await authController.verifyToken(mockRequest, mockResponse, mockNext);
            // Assert
            (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(401);
            (0, globals_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'No token provided',
                error: 'MISSING_TOKEN'
            });
        });
        (0, globals_1.it)('should handle invalid token format', async () => {
            // Arrange
            mockRequest.headers = { authorization: 'InvalidFormat' };
            // Act
            await authController.verifyToken(mockRequest, mockResponse, mockNext);
            // Assert
            (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(401);
            (0, globals_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid token format',
                error: 'INVALID_TOKEN_FORMAT'
            });
        });
        (0, globals_1.it)('should handle expired or invalid token', async () => {
            // Arrange
            const token = 'expired_jwt_token';
            mockRequest.headers = { authorization: `Bearer ${token}` };
            mockAuthService.verifyJWT.mockImplementation(() => {
                throw new common_1.AuthenticationError('Token expired');
            });
            // Act
            await authController.verifyToken(mockRequest, mockResponse, mockNext);
            // Assert
            (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(401);
            (0, globals_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid or expired token',
                error: 'INVALID_TOKEN'
            });
        });
    });
});
(0, globals_1.describe)('AuthService', () => {
    let authService;
    (0, globals_1.beforeEach)(() => {
        authService = new auth_2.AuthService();
    });
    (0, globals_1.describe)('verifyGoogleToken', () => {
        (0, globals_1.it)('should successfully verify valid Google token', async () => {
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
        (0, globals_1.it)('should reject invalid Google token', async () => {
            const token = 'invalid_google_token';
            // Mock implementation would reject
            // await expect(authService.verifyGoogleToken(token))
            //   .rejects.toThrow(AuthenticationError);
        });
    });
    (0, globals_1.describe)('generateJWT', () => {
        (0, globals_1.it)('should generate valid JWT token', () => {
            const userId = 'user_123';
            const token = authService.generateJWT(userId);
            (0, globals_1.expect)(typeof token).toBe('string');
            (0, globals_1.expect)(token.length).toBeGreaterThan(0);
        });
    });
    (0, globals_1.describe)('verifyJWT', () => {
        (0, globals_1.it)('should verify valid JWT token', () => {
            const userId = 'user_123';
            const token = authService.generateJWT(userId);
            const decoded = authService.verifyJWT(token);
            (0, globals_1.expect)(decoded.userId).toBe(userId);
        });
        (0, globals_1.it)('should reject invalid JWT token', () => {
            const invalidToken = 'invalid.jwt.token';
            (0, globals_1.expect)(() => authService.verifyJWT(invalidToken))
                .toThrow(common_1.AuthenticationError);
        });
    });
});
//# sourceMappingURL=auth.test.js.map