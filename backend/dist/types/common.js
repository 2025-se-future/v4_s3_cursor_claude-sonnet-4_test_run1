// Common type definitions
// Shared custom TypeScript type definitions and interfaces
// Custom Error Classes
export class ValidationError extends Error {
    field;
    constructor(message, field) {
        super(message);
        this.field = field;
        this.name = 'ValidationError';
    }
}
export class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}
export class AuthorizationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthorizationError';
    }
}
export class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
    }
}
export class DatabaseError extends Error {
    originalError;
    constructor(message, originalError) {
        super(message);
        this.originalError = originalError;
        this.name = 'DatabaseError';
    }
}
export class ExternalServiceError extends Error {
    service;
    originalError;
    constructor(message, service, originalError) {
        super(message);
        this.service = service;
        this.originalError = originalError;
        this.name = 'ExternalServiceError';
    }
}
//# sourceMappingURL=common.js.map