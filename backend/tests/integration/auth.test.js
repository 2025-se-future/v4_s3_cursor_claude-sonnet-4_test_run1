import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../../src/app';
import { User } from '../../src/models/users';
describe('Authentication Integration Tests', () => {
    let app;
    let mongoServer;
    beforeAll(async () => {
        // Start in-memory MongoDB instance
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        // Connect to the in-memory database
        await mongoose.connect(mongoUri);
        // Create the Express app
        app = createApp();
    });
    afterAll(async () => {
        // Clean up
        await mongoose.disconnect();
        await mongoServer.stop();
    });
    beforeEach(async () => {
        // Clean the database before each test
        await User.deleteMany({});
    });
    describe('POST /api/auth/google', () => {
        it('should successfully authenticate with valid Google token for new user', async () => {
            // Mock Google token verification (this would typically be mocked at the service level)
            const mockGoogleToken = 'mock_valid_google_token';
            const response = await request(app)
                .post('/api/auth/google')
                .send({ googleToken: mockGoogleToken })
                .expect(200);
            expect(response.body).toMatchObject({
                success: true,
                message: 'Authentication successful',
                user: {
                    email: expect.any(String),
                    name: expect.any(String),
                    profilePicture: expect.any(String)
                },
                token: expect.any(String)
            });
            // Verify user was created in database
            const user = await User.findOne({ email: response.body.user.email });
            expect(user).toBeTruthy();
            expect(user?.googleId).toBeTruthy();
        });
        it('should successfully authenticate with valid Google token for existing user', async () => {
            // First, create a user in the database
            const existingUser = new User({
                googleId: 'google_user_123',
                email: 'existing@example.com',
                name: 'Existing User',
                profilePicture: 'https://example.com/existing.jpg'
            });
            await existingUser.save();
            const mockGoogleToken = 'mock_valid_google_token_existing';
            const response = await request(app)
                .post('/api/auth/google')
                .send({ googleToken: mockGoogleToken })
                .expect(200);
            expect(response.body).toMatchObject({
                success: true,
                message: 'Authentication successful',
                user: {
                    id: existingUser._id.toString(),
                    email: 'existing@example.com',
                    name: 'Existing User',
                    profilePicture: 'https://example.com/existing.jpg'
                },
                token: expect.any(String)
            });
            // Verify no duplicate user was created
            const userCount = await User.countDocuments({ email: 'existing@example.com' });
            expect(userCount).toBe(1);
        });
        it('should return 400 for missing Google token', async () => {
            const response = await request(app)
                .post('/api/auth/google')
                .send({})
                .expect(400);
            expect(response.body).toMatchObject({
                success: false,
                message: 'Google token is required',
                error: 'MISSING_TOKEN'
            });
        });
        it('should return 401 for invalid Google token', async () => {
            const invalidToken = 'invalid_google_token';
            const response = await request(app)
                .post('/api/auth/google')
                .send({ googleToken: invalidToken })
                .expect(401);
            expect(response.body).toMatchObject({
                success: false,
                message: 'Authentication failed. Please try signing in again.',
                error: 'INVALID_TOKEN'
            });
        });
        it('should set secure HTTP-only cookie', async () => {
            const mockGoogleToken = 'mock_valid_google_token';
            const response = await request(app)
                .post('/api/auth/google')
                .send({ googleToken: mockGoogleToken })
                .expect(200);
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            const authCookie = cookies.find((cookie) => cookie.startsWith('auth_token='));
            expect(authCookie).toBeDefined();
            expect(authCookie).toContain('HttpOnly');
            expect(authCookie).toContain('Secure');
            expect(authCookie).toContain('SameSite=Strict');
        });
    });
    describe('POST /api/auth/logout', () => {
        it('should successfully logout user', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .expect(200);
            expect(response.body).toMatchObject({
                success: true,
                message: 'Logout successful'
            });
            // Verify auth cookie is cleared
            const cookies = response.headers['set-cookie'];
            if (cookies) {
                const authCookie = cookies.find((cookie) => cookie.startsWith('auth_token='));
                if (authCookie) {
                    expect(authCookie).toContain('Max-Age=0');
                }
            }
        });
    });
    describe('GET /api/auth/verify', () => {
        it('should verify valid JWT token', async () => {
            // First authenticate to get a token
            const mockGoogleToken = 'mock_valid_google_token';
            const authResponse = await request(app)
                .post('/api/auth/google')
                .send({ googleToken: mockGoogleToken })
                .expect(200);
            const token = authResponse.body.token;
            // Now verify the token
            const response = await request(app)
                .get('/api/auth/verify')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            expect(response.body).toMatchObject({
                success: true,
                user: {
                    email: expect.any(String),
                    name: expect.any(String),
                    profilePicture: expect.any(String)
                }
            });
        });
        it('should return 401 for missing authorization header', async () => {
            const response = await request(app)
                .get('/api/auth/verify')
                .expect(401);
            expect(response.body).toMatchObject({
                success: false,
                message: 'No token provided',
                error: 'MISSING_TOKEN'
            });
        });
        it('should return 401 for invalid token format', async () => {
            const response = await request(app)
                .get('/api/auth/verify')
                .set('Authorization', 'InvalidFormat')
                .expect(401);
            expect(response.body).toMatchObject({
                success: false,
                message: 'Invalid token format',
                error: 'INVALID_TOKEN_FORMAT'
            });
        });
        it('should return 401 for invalid JWT token', async () => {
            const invalidToken = 'invalid.jwt.token';
            const response = await request(app)
                .get('/api/auth/verify')
                .set('Authorization', `Bearer ${invalidToken}`)
                .expect(401);
            expect(response.body).toMatchObject({
                success: false,
                message: 'Invalid or expired token',
                error: 'INVALID_TOKEN'
            });
        });
    });
    describe('Authentication Flow End-to-End', () => {
        it('should complete full authentication flow', async () => {
            // Step 1: Authenticate with Google
            const mockGoogleToken = 'mock_valid_google_token_e2e';
            const authResponse = await request(app)
                .post('/api/auth/google')
                .send({ googleToken: mockGoogleToken })
                .expect(200);
            expect(authResponse.body.success).toBe(true);
            expect(authResponse.body.token).toBeDefined();
            const token = authResponse.body.token;
            const userId = authResponse.body.user.id;
            // Step 2: Verify token works for protected routes
            const verifyResponse = await request(app)
                .get('/api/auth/verify')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            expect(verifyResponse.body.user.id).toBe(userId);
            // Step 3: Logout
            const logoutResponse = await request(app)
                .post('/api/auth/logout')
                .expect(200);
            expect(logoutResponse.body.success).toBe(true);
            // Step 4: Verify token no longer works (if we implement token blacklisting)
            // This would depend on whether we implement server-side token invalidation
        });
        it('should handle authentication service unavailable scenario', async () => {
            // Mock service unavailable error
            const response = await request(app)
                .post('/api/auth/google')
                .send({ googleToken: 'service_unavailable_token' })
                .expect(503);
            expect(response.body).toMatchObject({
                success: false,
                message: 'Authentication service temporarily unavailable. Please try again later.',
                error: 'SERVICE_UNAVAILABLE'
            });
        });
        it('should handle database error during user creation', async () => {
            // This would require mocking the database connection to fail
            // Implementation would depend on how we structure the database layer
        });
    });
    describe('Rate Limiting', () => {
        it('should apply rate limiting to authentication endpoints', async () => {
            const mockGoogleToken = 'mock_rate_limit_token';
            // Make multiple rapid requests
            const requests = Array(10).fill(null).map(() => request(app)
                .post('/api/auth/google')
                .send({ googleToken: mockGoogleToken }));
            const responses = await Promise.all(requests);
            // Some requests should be rate limited (429 status)
            const rateLimitedResponses = responses.filter(res => res.status === 429);
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });
    });
    describe('Security Headers', () => {
        it('should include security headers in responses', async () => {
            const response = await request(app)
                .post('/api/auth/google')
                .send({ googleToken: 'mock_token' });
            // Check for security headers (these would be set by middleware)
            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['x-frame-options']).toBe('DENY');
            expect(response.headers['x-xss-protection']).toBe('1; mode=block');
        });
    });
});
//# sourceMappingURL=auth.test.js.map