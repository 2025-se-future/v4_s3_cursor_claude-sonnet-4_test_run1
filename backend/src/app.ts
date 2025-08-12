// Express application setup
// Configure Express app with middleware and routes

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/environment';
import { databaseConnection } from './config/database';
import { globalRateLimit } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import authRouter from './routes/auth';
import userRouter from './routes/users';
import groupRouter from './routes/groups';
import movieRouter from './routes/movies';
import votingRouter from './routes/voting';

export const createApp = (): Express => {
  const app: Express = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.use(cors({
    origin: env.corsOrigin.split(',').map(origin => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(env.cookieSecret));

  // Global rate limiting
  app.use(globalRateLimit);

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    const dbState = databaseConnection.getConnectionState();
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.nodeEnv,
      database: dbState,
      uptime: process.uptime()
    });
  });

  // API routes
  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/groups', groupRouter);
  app.use('/api/movies', movieRouter);
  app.use('/api/voting', votingRouter);

  // API documentation route
  app.get('/api', (req: Request, res: Response) => {
    res.json({
      name: 'MovieSwipe API',
      version: '1.0.0',
      description: 'Backend API for the MovieSwipe application',
      endpoints: {
        authentication: '/api/auth',
        users: '/api/users',
        groups: '/api/groups',
        movies: '/api/movies',
        voting: '/api/voting'
      },
      documentation: '/api/docs',
      health: '/health'
    });
  });

  // 404 handler for API routes
  app.use('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found',
      error: 'NOT_FOUND'
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};

export default createApp;
