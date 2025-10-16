const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK - DEMO MODE (No Database)',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// API Routes - DEMO MODE (No database)
app.use('/api/auth', require('./routes/auth-demo'));
app.use('/api/user', require('./routes/user-demo'));
app.use('/api/ai', require('./routes/ai-assistant'));
app.use('/api/ocr', require('./routes/ocr-scanner'));
app.use('/api/signature', require('./routes/signature-pad'));
app.use('/api/reminders', require('./routes/reminders'));
// Note: Subscription route requires database, not included in demo mode
// app.use('/api/subscription', require('./routes/subscription'));

// Welcome route
app.get('/', (req, res) => {
    res.json({
        message: 'TruckDocs Pro API - DEMO MODE',
        version: '1.0.0',
        mode: 'No database required - In-memory storage',
        demoCredentials: {
            email: 'demo@test.com',
            password: 'demo123'
        },
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            user: '/api/user'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
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
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚛 TruckDocs Pro API (DEMO MODE) running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`✅ No database required - In-memory storage`);
    console.log(`\n🔑 Demo Login Credentials:`);
    console.log(`   Email: demo@test.com`);
    console.log(`   Password: demo123\n`);
});
