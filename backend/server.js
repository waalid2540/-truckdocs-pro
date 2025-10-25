const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Validate required environment variables on startup
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const optionalEnvVars = ['FRONTEND_URL', 'STRIPE_SECRET_KEY', 'OPENAI_API_KEY', 'AWS_ACCESS_KEY_ID'];

console.log('🔍 Validating environment variables...');

const missingRequired = requiredEnvVars.filter(varName => !process.env[varName]);
const missingOptional = optionalEnvVars.filter(varName => !process.env[varName]);

if (missingRequired.length > 0) {
    console.error('❌ CRITICAL: Missing required environment variables:');
    missingRequired.forEach(varName => console.error(`   - ${varName}`));
    console.error('Server cannot start without these variables. Please add them to your .env file or Render environment.');
    process.exit(1);
}

if (missingOptional.length > 0) {
    console.warn('⚠️  WARNING: Missing optional environment variables (some features may not work):');
    missingOptional.forEach(varName => console.warn(`   - ${varName}`));
}

// Validate JWT_SECRET strength
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('❌ SECURITY WARNING: JWT_SECRET should be at least 32 characters long');
    if (process.env.NODE_ENV === 'production') {
        console.error('Weak JWT_SECRET in production is a critical security risk!');
        process.exit(1);
    }
}

console.log('✅ Environment variables validated successfully\n');

const app = express();

// Trust proxy - Required for Render deployment
app.set('trust proxy', 1);

// Middleware
// Enhanced security headers with Content Security Policy
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for React
            styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React/Tailwind
            imgSrc: ["'self'", "data:", "https:", "blob:"], // Allow images from HTTPS sources
            connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:5173"], // Allow API calls
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
// CORS - Allow requests from frontend only
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (direct browser navigation, mobile apps, etc.)
        // This is normal for visiting URLs directly or API testing tools
        if (!origin) {
            return callback(null, true);
        }

        // In production, FRONTEND_URL is required for actual frontend requests
        if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
            console.error('❌ SECURITY ERROR: FRONTEND_URL must be set in production');
            return callback(new Error('CORS configuration error'));
        }

        // Allow localhost in development
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            'http://localhost:5173',
            'http://localhost:3000'
        ].filter(Boolean);

        // Check if origin matches allowed origins
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`⚠️ CORS blocked request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting (prevent abuse)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 attempts per 15 minutes
    skipSuccessfulRequests: true, // Don't count successful logins
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply strict rate limiting to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check endpoint (for Render)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// API Routes
// Check if we have DATABASE_URL to determine production vs demo mode
const isProduction = process.env.DATABASE_URL && process.env.DATABASE_URL !== 'postgresql://username:password@host:port/database';

if (isProduction) {
    console.log('🗄️  Production mode: Using database');
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/documents', require('./routes/documents'));
    app.use('/api/invoices', require('./routes/invoices'));
    app.use('/api/expenses', require('./routes/expenses'));
    app.use('/api/ifta', require('./routes/ifta'));
    app.use('/api/subscription', require('./routes/subscription'));
    app.use('/api/user', require('./routes/user'));
    app.use('/api/admin', require('./routes/admin'));
    app.use('/api/document-alerts', require('./routes/document-alerts'));
    // LOAD BOARD ROUTES
    app.use('/api/loads', require('./routes/loads'));
    app.use('/api/bookings', require('./routes/bookings'));
    app.use('/api/broker-profiles', require('./routes/broker-profiles'));
} else {
    console.log('🧪 Demo mode: Using in-memory storage (no database)');
    app.use('/api/auth', require('./routes/auth-demo'));
    app.use('/api/user', require('./routes/user-demo'));
}

// Migration routes (only for initial setup) - MUST be before other routes
app.use('/', require('./routes/migrate'));
app.use('/', require('./routes/reset-db'));
app.use('/', require('./routes/add-expiration-fields'));
app.use('/', require('./routes/load-board-migration'));
app.use('/', require('./routes/security-migration'));
app.use('/', require('./routes/fix-audit-tables'));
app.use('/', require('./routes/reset-user'));

// These routes work in both modes
app.use('/api/ai', require('./routes/ai-assistant'));
app.use('/api/ocr', require('./routes/ocr-scanner'));
app.use('/api/signature', require('./routes/signature-pad'));
app.use('/api/reminders', require('./routes/reminders'));

// Welcome route - MUST be after all other routes
app.get('/', (req, res) => {
    res.json({
        message: 'FreightHub Pro API',
        version: '1.0.0',
        tagline: 'Complete Trucking Command Center',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            loads: '/api/loads',
            bookings: '/api/bookings',
            documents: '/api/documents',
            invoices: '/api/invoices',
            expenses: '/api/expenses',
            ifta: '/api/ifta',
            subscription: '/api/subscription',
            user: '/api/user'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.message
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or missing token'
        });
    }

    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found`
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚛 FreightHub Pro API running on port ${PORT}`);
    console.log(`📦 Complete Trucking Command Center`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});
