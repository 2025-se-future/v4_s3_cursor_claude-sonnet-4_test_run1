// Database configuration
// Store MongoDB connection settings
import mongoose from 'mongoose';
export class DatabaseConnection {
    static instance;
    isConnected = false;
    constructor() { }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    async connect() {
        if (this.isConnected) {
            console.log('Database already connected');
            return;
        }
        try {
            const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/movieswipe';
            const options = {
                maxPoolSize: 10, // Maintain up to 10 socket connections
                serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
                socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
                bufferCommands: false, // Disable mongoose buffering
                bufferMaxEntries: 0, // Disable mongoose buffering
            };
            await mongoose.connect(uri, options);
            this.isConnected = true;
            console.log('Connected to MongoDB');
            // Handle connection events
            mongoose.connection.on('error', (error) => {
                console.error('MongoDB connection error:', error);
                this.isConnected = false;
            });
            mongoose.connection.on('disconnected', () => {
                console.log('MongoDB disconnected');
                this.isConnected = false;
            });
            mongoose.connection.on('reconnected', () => {
                console.log('MongoDB reconnected');
                this.isConnected = true;
            });
            // Handle process termination
            process.on('SIGINT', async () => {
                await this.disconnect();
                process.exit(0);
            });
        }
        catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await mongoose.connection.close();
            this.isConnected = false;
            console.log('Disconnected from MongoDB');
        }
        catch (error) {
            console.error('Error disconnecting from MongoDB:', error);
            throw error;
        }
    }
    isConnectedToDatabase() {
        return this.isConnected && mongoose.connection.readyState === 1;
    }
    getConnectionState() {
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting',
        };
        return states[mongoose.connection.readyState] || 'unknown';
    }
}
export const databaseConnection = DatabaseConnection.getInstance();
//# sourceMappingURL=database.js.map