// Rate limiter middleware
// Implement rate limiting to prevent abuse

import rateLimit, { RateLimitRequestHandler, Options } from 'express-rate-limit';
import { env } from '../config/environment';

export interface RateLimitConfig extends Partial<Options> {
  windowMs?: number;
  max?: number;
  message?: any;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

/**
 * Create a rate limiter middleware with custom configuration
 * @param config - Rate limit configuration
 * @returns Express rate limit middleware
 */
export const rateLimiter = (config: RateLimitConfig = {}): RateLimitRequestHandler => {
  const defaultConfig: Options = {
    windowMs: env.rateLimitWindowMs, // Default from environment
    max: env.rateLimitMaxRequests, // Default from environment
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

  return rateLimit({ ...defaultConfig, ...config });
};

// Pre-configured rate limiters for common use cases
export const globalRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'GLOBAL_RATE_LIMIT_EXCEEDED'
  }
});

export const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Stricter limit for authentication endpoints
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    error: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

export const strictAuthRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Very strict limit for login attempts
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    error: 'LOGIN_RATE_LIMIT_EXCEEDED'
  }
});
