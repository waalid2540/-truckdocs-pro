const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
} else {
    console.log('🧪 Demo mode: Using in-memory storage (no database)');
    app.use('/api/auth', require('./routes/auth-demo'));
    app.use('/api/user', require('./routes/user-demo'));
}

// Migration routes (only for initial setup) - MUST be before other routes
app.use('/', require('./routes/migrate'));
app.use('/', require('./routes/reset-db'));

// These routes work in both modes
app.use('/api/ai', require('./routes/ai-assistant'));
app.use('/api/ocr', require('./routes/ocr-scanner'));
app.use('/api/signature', require('./routes/signature-pad'));
app.use('/api/reminders', require('./routes/reminders'));

// Welcome route - MUST be after all other routes
app.get('/', (req, res) => {
    res.json({
        message: 'TruckDocs Pro API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
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
    console.log(`🚛 TruckDocs Pro API running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});
