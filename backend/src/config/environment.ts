// Environment configuration
// Store environment variables and app settings

import { config } from 'dotenv';

// Load environment variables from .env file
config();

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

class Environment {
  private static instance: Environment;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  public static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }
    return Environment.instance;
  }

  private loadConfig(): EnvironmentConfig {
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

  private validateConfig(): void {
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

  public getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  public get(key: keyof EnvironmentConfig): any {
    return this.config[key];
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  public isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }
}

export const environment = Environment.getInstance();
export const env = environment.getConfig();
