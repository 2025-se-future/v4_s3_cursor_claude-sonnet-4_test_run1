import mongoose from 'mongoose';
export interface DatabaseConfig {
    uri: string;
    options: mongoose.ConnectOptions;
}
export declare class DatabaseConnection {
    private static instance;
    private isConnected;
    private constructor();
    static getInstance(): DatabaseConnection;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnectedToDatabase(): boolean;
    getConnectionState(): string;
}
export declare const databaseConnection: DatabaseConnection;
//# sourceMappingURL=database.d.ts.map