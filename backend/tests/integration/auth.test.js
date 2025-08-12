"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = require("express");
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = require("../../src/app");
const users_1 = require("../../src/models/users");
(0, globals_1.describe)('Authentication Integration Tests', () => {
    let app;
    let mongoServer;
    (0, globals_1.beforeAll)(async () => {
        // Start in-memory MongoDB instance
        mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        // Connect to the in-memory database
        await mongoose_1.default.connect(mongoUri);
        // Create the Express app
        app = (0, app_1.createApp)();
    });
    (0, globals_1.afterAll)(async () => {
        // Clean up
        await mongoose_1.default.disconnect();
        await mongoServer.stop();
    });
    (0, globals_1.beforeEach)(async () => {
        // Clean the database before each test
        await users_1.User.deleteMany({});
    });
    (0, globals_1.describe)('POST /api/auth/google', () => {
        (0, globals_1.it)('should successfully authenticate with valid Google token for new user', async () => {
            // Mock Google token verification (this would typically be mocked at the service level)
            const mockGoogleToken = 'mock_valid_google_token';
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/google')
                .send({ googleToken: mockGoogleToken })
                .expect(200);
            (0, globals_1.expect)(response.body).toMatchObject({
                success: true,
                message: 'Authentication successful',
                user: {
                    email: globals_1.expect.any(String),
                    name: globals_1.expect.any(String),
                    profilePicture: globals_1.expect.any(String)
                },
                token: globals_1.expect.any(String)
            });
            // Verify user was created in database
            const user = await users_1.User.findOne({ email: response.body.user.email });
            (0, globals_1.expect)(user).toBeTruthy();
            (0, globals_1.expect)(user?.googleId).toBeTruthy();
        });
        (0, globals_1.it)('should successfully authenticate with valid Google token for existing user', async () => {
            // First, create a user in the database
            const existingUser = new users_1.User({
                googleId: 'google_user_123',
                email: 'existing@example.com',
                name: 'Existing User',
                profilePicture: 'https://example.com/existing.jpg'
            });
            await existingUser.save();
            const mockGoogleToken = 'mock_valid_google_token_existing';
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/google')
                .send({ googleToken: mockGoogleToken })
                .expect(200);
            (0, globals_1.expect)(response.body).toMatchObject({
                success: true,
                message: 'Authentication successful',
                user: {
                    id: existingUser._id.toString(),
                    email: 'existing@example.com',
                    name: 'Existing User',
                    profilePicture: 'https://example.com/existing.jpg'
                },
                token: globals_1.expect.any(String)
            });
            // Verify no duplicate user was created
            const userCount = await users_1.User.countDocuments({ email: 'existing@example.com' });
            (0, globals_1.expect)(userCount).toBe(1);
        });
        (0, globals_1.it)('should return 400 for missing Google token', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/google')
                .send({})
                .expect(400);
            (0, globals_1.expect)(response.body).toMatchObject({
                success: false,
                message: 'Google token is required',
                error: 'MISSING_TOKEN'
            });
        });
        (0, globals_1.it)('should return 401 for invalid Google token', async () => {
            const invalidToken = 'invalid_google_token';
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/google')
                .send({ googleToken: invalidToken })
                .expect(401);
            (0, globals_1.expect)(response.body).toMatchObject({
                success: false,
                message: 'Authentication failed. Please try signing in again.',
                error: 'INVALID_TOKEN'
            });
        });
        (0, globals_1.it)('should set secure HTTP-only cookie', async () => {
            const mockGoogleToken = 'mock_valid_google_token';
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/google')
                .send({ googleToken: mockGoogleToken })
                .expect(200);
            const cookies = response.headers['set-cookie'];
            (0, globals_1.expect)(cookies).toBeDefined();
            const authCookie = cookies.find((cookie) => cookie.startsWith('auth_token='));
            (0, globals_1.expect)(authCookie).toBeDefined();
            (0, globals_1.expect)(authCookie).toContain('HttpOnly');
            (0, globals_1.expect)(authCookie).toContain('Secure');
            (0, globals_1.expect)(authCookie).toContain('SameSite=Strict');
        });
    });
    (0, globals_1.describe)('POST /api/auth/logout', () => {
        (0, globals_1.it)('should successfully logout user', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/logout')
                .expect(200);
            (0, globals_1.expect)(response.body).toMatchObject({
                success: true,
                message: 'Logout successful'
            });
            // Verify auth cookie is cleared
            const cookies = response.headers['set-cookie'];
            if (cookies) {
                const authCookie = cookies.find((cookie) => cookie.startsWith('auth_token='));
                if (authCookie) {
                    (0, globals_1.expect)(authCookie).toContain('Max-Age=0');
                }
            }
        });
    });
    (0, globals_1.describe)('GET /api/auth/verify', () => {
        (0, globals_1.it)('should verify valid JWT token', async () => {
            // First authenticate to get a token
            const mockGoogleToken = 'mock_valid_google_token';
            const authResponse = await (0, supertest_1.default)(app)
                .post('/api/auth/google')
                .send({ googleToken: mockGoogleToken })
                .expect(200);
            const token = authResponse.body.token;
            // Now verify the token
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/verify')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            (0, globals_1.expect)(response.body).toMatchObject({
                success: true,
                user: {
                    email: globals_1.expect.any(String),
                    name: globals_1.expect.any(String),
                    profilePicture: globals_1.expect.any(String)
                }
            });
        });
        (0, globals_1.it)('should return 401 for missing authorization header', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/verify')
                .expect(401);
            (0, globals_1.expect)(response.body).toMatchObject({
                success: false,
                message: 'No token provided',
                error: 'MISSING_TOKEN'
            });
        });
        (0, globals_1.it)('should return 401 for invalid token format', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/verify')
                .set('Authorization', 'InvalidFormat')
                .expect(401);
            (0, globals_1.expect)(response.body).toMatchObject({
                success: false,
                message: 'Invalid token format',
                error: 'INVALID_TOKEN_FORMAT'
            });
        });
        (0, globals_1.it)('should return 401 for invalid JWT token', async () => {
            const invalidToken = 'invalid.jwt.token';
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/verify')
                .set('Authorization', `Bearer ${invalidToken}`)
                .expect(401);
            (0, globals_1.expect)(response.body).toMatchObject({
                success: false,
                message: 'Invalid or expired token',
                error: 'INVALID_TOKEN'
            });
        });
    });
    (0, globals_1.describe)('Authentication Flow End-to-End', () => {
        (0, globals_1.it)('should complete full authentication flow', async () => {
            // Step 1: Authenticate with Google
            const mockGoogleToken = 'mock_valid_google_token_e2e';
            const authResponse = await (0, supertest_1.default)(app)
                .post('/api/auth/google')
                .send({ googleToken: mockGoogleToken })
                .expect(200);
            (0, globals_1.expect)(authResponse.body.success).toBe(true);
            (0, globals_1.expect)(authResponse.body.token).toBeDefined();
            const token = authResponse.body.token;
            const userId = authResponse.body.user.id;
            // Step 2: Verify token works for protected routes
            const verifyResponse = await (0, supertest_1.default)(app)
                .get('/api/auth/verify')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            (0, globals_1.expect)(verifyResponse.body.user.id).toBe(userId);
            // Step 3: Logout
            const logoutResponse = await (0, supertest_1.default)(app)
                .post('/api/auth/logout')
                .expect(200);
            (0, globals_1.expect)(logoutResponse.body.success).toBe(true);
            // Step 4: Verify token no longer works (if we implement token blacklisting)
            // This would depend on whether we implement server-side token invalidation
        });
        (0, globals_1.it)('should handle authentication service unavailable scenario', async () => {
            // Mock service unavailable error
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/google')
                .send({ googleToken: 'service_unavailable_token' })
                .expect(503);
            (0, globals_1.expect)(response.body).toMatchObject({
                success: false,
                message: 'Authentication service temporarily unavailable. Please try again later.',
                error: 'SERVICE_UNAVAILABLE'
            });
        });
        (0, globals_1.it)('should handle database error during user creation', async () => {
            // This would require mocking the database connection to fail
            // Implementation would depend on how we structure the database layer
        });
    });
    (0, globals_1.describe)('Rate Limiting', () => {
        (0, globals_1.it)('should apply rate limiting to authentication endpoints', async () => {
            const mockGoogleToken = 'mock_rate_limit_token';
            // Make multiple rapid requests
            const requests = Array(10).fill(null).map(() => (0, supertest_1.default)(app)
                .post('/api/auth/google')
                .send({ googleToken: mockGoogleToken }));
            const responses = await Promise.all(requests);
            // Some requests should be rate limited (429 status)
            const rateLimitedResponses = responses.filter(res => res.status === 429);
            (0, globals_1.expect)(rateLimitedResponses.length).toBeGreaterThan(0);
        });
    });
    (0, globals_1.describe)('Security Headers', () => {
        (0, globals_1.it)('should include security headers in responses', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/google')
                .send({ googleToken: 'mock_token' });
            // Check for security headers (these would be set by middleware)
            (0, globals_1.expect)(response.headers['x-content-type-options']).toBe('nosniff');
            (0, globals_1.expect)(response.headers['x-frame-options']).toBe('DENY');
            (0, globals_1.expect)(response.headers['x-xss-protection']).toBe('1; mode=block');
        });
    });
});
//# sourceMappingURL=auth.test.js.map