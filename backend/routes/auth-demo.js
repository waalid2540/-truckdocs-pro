const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

// In-memory user storage (for demo without database)
// Pre-create a demo user so you can login immediately!
const users = [
    {
        id: 'demo-user-1',
        email: 'demo@test.com',
        password: 'demo123',
        full_name: 'Demo Driver',
        phone: '555-0123',
        company_name: 'Demo Trucking Co',
        truck_number: 'T-001',
        subscription_status: 'trial',
        subscription_tier: 'solo',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        created_at: new Date()
    }
];

// Helper function to generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'demo-secret-key',
        { expiresIn: '30d' }
    );
};

// POST /api/auth/register - Register new user (DEMO - No database)
router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name, phone, company_name, truck_number } = req.body;

        // Check if user already exists
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({
                error: 'Email already registered'
            });
        }

        // Create trial end date (14 days from now)
        const trial_ends_at = new Date();
        trial_ends_at.setDate(trial_ends_at.getDate() + 14);

        // Create new user
        const user = {
            id: Date.now().toString(),
            email,
            password, // In demo mode, storing plain password (NEVER do this in production!)
            full_name,
            phone,
            company_name,
            truck_number,
            subscription_status: 'trial',
            subscription_tier: 'solo',
            trial_ends_at,
            created_at: new Date()
        };

        users.push(user);

        // Generate JWT token
        const token = generateToken(user.id);

        res.status(201).json({
            message: 'Registration successful (DEMO MODE - No database)',
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                subscription_status: user.subscription_status,
                subscription_tier: user.subscription_tier,
                trial_ends_at: user.trial_ends_at
            },
            token
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: error.message
        });
    }
});

// POST /api/auth/login - Login user (DEMO - No database)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = generateToken(user.id);

        res.json({
            message: 'Login successful (DEMO MODE)',
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                subscription_status: user.subscription_status,
                subscription_tier: user.subscription_tier,
                trial_ends_at: user.trial_ends_at
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: error.message
        });
    }
});

// GET /api/auth/me - Get current user (DEMO)
router.get('/me', async (req, res) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No token provided'
            });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret-key');

        // Find user
        const user = users.find(u => u.id === decoded.userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                company_name: user.company_name,
                truck_number: user.truck_number,
                subscription_status: user.subscription_status,
                subscription_tier: user.subscription_tier,
                trial_ends_at: user.trial_ends_at,
                created_at: user.created_at
            }
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Failed to get user',
            message: error.message
        });
    }
});

module.exports = router;
