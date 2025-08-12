export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
    };
}
export declare class ValidationError extends Error {
    field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
export declare class AuthenticationError extends Error {
    constructor(message: string);
}
export declare class AuthorizationError extends Error {
    constructor(message: string);
}
export declare class NotFoundError extends Error {
    constructor(message: string);
}
export declare class DatabaseError extends Error {
    originalError?: Error | undefined;
    constructor(message: string, originalError?: Error | undefined);
}
export declare class ExternalServiceError extends Error {
    service: string;
    originalError?: Error | undefined;
    constructor(message: string, service: string, originalError?: Error | undefined);
}
//# sourceMappingURL=common.d.ts.map