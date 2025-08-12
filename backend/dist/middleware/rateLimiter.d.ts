import { RateLimitRequestHandler, Options } from 'express-rate-limit';
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
export declare const rateLimiter: (config?: RateLimitConfig) => RateLimitRequestHandler;
export declare const globalRateLimit: RateLimitRequestHandler;
export declare const authRateLimit: RateLimitRequestHandler;
export declare const strictAuthRateLimit: RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map