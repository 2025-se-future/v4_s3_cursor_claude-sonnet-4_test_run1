// Main entry point
// Server startup and configuration

import { createApp } from './app';
import { databaseConnection } from './config/database';
import { env } from './config/environment';

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    console.log('Connecting to database...');
    await databaseConnection.connect();
    console.log('Database connection established');

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(env.port, () => {
      console.log(`🚀 Server running on port ${env.port}`);
      console.log(`📊 Environment: ${env.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${env.port}/health`);
      console.log(`📚 API docs: http://localhost:${env.port}/api`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        try {
          await databaseConnection.disconnect();
          console.log('Database connection closed');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();