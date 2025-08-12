export interface EnvironmentConfig {
    nodeEnv: string;
    port: number;
    mongodbUri: string;
    jwtSecret: string;
    jwtExpiration: string;
    googleClientId: string;
    corsOrigin: string;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    cookieSecret: string;
    logLevel: string;
}
declare class Environment {
    private static instance;
    private config;
    private constructor();
    static getInstance(): Environment;
    private loadConfig;
    private validateConfig;
    getConfig(): EnvironmentConfig;
    get(key: keyof EnvironmentConfig): any;
    isProduction(): boolean;
    isDevelopment(): boolean;
    isTest(): boolean;
}
export declare const environment: Environment;
export declare const env: EnvironmentConfig;
export {};
//# sourceMappingURL=environment.d.ts.map