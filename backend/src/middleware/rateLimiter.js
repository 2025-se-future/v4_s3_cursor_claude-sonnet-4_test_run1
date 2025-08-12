"use strict";
// Rate limiter middleware
// Implement rate limiting to prevent abuse
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictAuthRateLimit = exports.authRateLimit = exports.globalRateLimit = exports.rateLimiter = void 0;
const express_rate_limit_1 = __importStar(require("express-rate-limit"));
const environment_1 = require("../config/environment");
/**
 * Create a rate limiter middleware with custom configuration
 * @param config - Rate limit configuration
 * @returns Express rate limit middleware
 */
const rateLimiter = (config = {}) => {
    const defaultConfig = {
        windowMs: environment_1.env.rateLimitWindowMs, // Default from environment
        max: environment_1.env.rateLimitMaxRequests, // Default from environment
        message: {
            success: false,
            message: 'Too many requests from this IP, please try again later.',
            error: 'RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        handler: (req, res) => {
            res.status(429).json(config.message || defaultConfig.message);
        },
        skip: (req) => {
            // Skip rate limiting for health checks
            return req.path === '/health' || req.path === '/api/health';
        }
    };
    return (0, express_rate_limit_1.default)({ ...defaultConfig, ...config });
};
exports.rateLimiter = rateLimiter;
// Pre-configured rate limiters for common use cases
exports.globalRateLimit = (0, exports.rateLimiter)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        error: 'GLOBAL_RATE_LIMIT_EXCEEDED'
    }
});
exports.authRateLimit = (0, exports.rateLimiter)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Stricter limit for authentication endpoints
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.',
        error: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
});
exports.strictAuthRateLimit = (0, exports.rateLimiter)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Very strict limit for login attempts
    message: {
        success: false,
        message: 'Too many login attempts, please try again later.',
        error: 'LOGIN_RATE_LIMIT_EXCEEDED'
    }
});
//# sourceMappingURL=rateLimiter.js.map