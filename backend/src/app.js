"use strict";
// Express application setup
// Configure Express app with middleware and routes
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importStar(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const environment_1 = require("./config/environment");
const database_1 = require("./config/database");
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const groups_1 = __importDefault(require("./routes/groups"));
const movies_1 = __importDefault(require("./routes/movies"));
const voting_1 = __importDefault(require("./routes/voting"));
const createApp = () => {
    const app = (0, express_1.default)();
    // Security middleware
    app.use((0, helmet_1.default)({
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
    app.use((0, cors_1.default)({
        origin: environment_1.env.corsOrigin.split(',').map(origin => origin.trim()),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['X-Total-Count', 'X-Page-Count']
    }));
    // Body parsing middleware
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    app.use((0, cookie_parser_1.default)(environment_1.env.cookieSecret));
    // Global rate limiting
    app.use(rateLimiter_1.globalRateLimit);
    // Health check endpoint
    app.get('/health', (req, res) => {
        const dbState = database_1.databaseConnection.getConnectionState();
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: environment_1.env.nodeEnv,
            database: dbState,
            uptime: process.uptime()
        });
    });
    // API routes
    app.use('/api/auth', auth_1.default);
    app.use('/api/users', users_1.default);
    app.use('/api/groups', groups_1.default);
    app.use('/api/movies', movies_1.default);
    app.use('/api/voting', voting_1.default);
    // API documentation route
    app.get('/api', (req, res) => {
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
    app.use('/api/*', (req, res) => {
        res.status(404).json({
            success: false,
            message: 'API endpoint not found',
            error: 'NOT_FOUND'
        });
    });
    // Global error handler (must be last)
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createApp = createApp;
exports.default = exports.createApp;
//# sourceMappingURL=app.js.map