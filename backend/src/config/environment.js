"use strict";
// Environment configuration
// Store environment variables and app settings
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = exports.environment = void 0;
const dotenv_1 = require("dotenv");
// Load environment variables from .env file
(0, dotenv_1.config)();
class Environment {
    static instance;
    config;
    constructor() {
        this.config = this.loadConfig();
        this.validateConfig();
    }
    static getInstance() {
        if (!Environment.instance) {
            Environment.instance = new Environment();
        }
        return Environment.instance;
    }
    loadConfig() {
        return {
            nodeEnv: process.env.NODE_ENV || 'development',
            port: parseInt(process.env.PORT || '3000', 10),
            mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/movieswipe',
            jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
            jwtExpiration: process.env.JWT_EXPIRATION || '7d',
            googleClientId: process.env.GOOGLE_CLIENT_ID || '',
            corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
            rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
            cookieSecret: process.env.COOKIE_SECRET || 'your-cookie-secret-change-in-production',
            logLevel: process.env.LOG_LEVEL || 'info',
        };
    }
    validateConfig() {
        const requiredEnvVars = [
            'GOOGLE_CLIENT_ID',
        ];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missingVars.length > 0) {
            console.warn(`Warning: Missing required environment variables: ${missingVars.join(', ')}`);
            console.warn('The application may not function correctly without these variables.');
        }
        // Validate port
        if (this.config.port < 1 || this.config.port > 65535) {
            throw new Error('PORT must be between 1 and 65535');
        }
        // Validate JWT secret in production
        if (this.config.nodeEnv === 'production' && this.config.jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
            throw new Error('JWT_SECRET must be set to a secure value in production');
        }
        // Validate Google Client ID
        if (!this.config.googleClientId) {
            console.warn('GOOGLE_CLIENT_ID is not set. Google authentication will not work.');
        }
        // Validate MongoDB URI format
        if (!this.config.mongodbUri.startsWith('mongodb://') && !this.config.mongodbUri.startsWith('mongodb+srv://')) {
            throw new Error('MONGODB_URI must be a valid MongoDB connection string');
        }
    }
    getConfig() {
        return { ...this.config };
    }
    get(key) {
        return this.config[key];
    }
    isProduction() {
        return this.config.nodeEnv === 'production';
    }
    isDevelopment() {
        return this.config.nodeEnv === 'development';
    }
    isTest() {
        return this.config.nodeEnv === 'test';
    }
}
exports.environment = Environment.getInstance();
exports.env = exports.environment.getConfig();
//# sourceMappingURL=environment.js.map