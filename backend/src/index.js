"use strict";
// Main entry point
// Server startup and configuration
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const database_1 = require("./config/database");
const environment_1 = require("./config/environment");
const startServer = async () => {
    try {
        // Connect to database
        console.log('Connecting to database...');
        await database_1.databaseConnection.connect();
        console.log('Database connection established');
        // Create Express app
        const app = (0, app_1.createApp)();
        // Start server
        const server = app.listen(environment_1.env.port, () => {
            console.log(`🚀 Server running on port ${environment_1.env.port}`);
            console.log(`📊 Environment: ${environment_1.env.nodeEnv}`);
            console.log(`🔗 Health check: http://localhost:${environment_1.env.port}/health`);
            console.log(`📚 API docs: http://localhost:${environment_1.env.port}/api`);
        });
        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            console.log(`\n${signal} received. Starting graceful shutdown...`);
            server.close(async () => {
                console.log('HTTP server closed');
                try {
                    await database_1.databaseConnection.disconnect();
                    console.log('Database connection closed');
                    process.exit(0);
                }
                catch (error) {
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
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Start the server
startServer();
//# sourceMappingURL=index.js.map