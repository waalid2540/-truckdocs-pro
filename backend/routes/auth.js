const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('full_name').trim().notEmpty().withMessage('Full name required'),
    body('phone').optional().isMobilePhone(),
];

const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
];

// Helper function to generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

// POST /api/auth/register - Register new user
router.post('/register', registerValidation, async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, full_name, phone, company_name, truck_number } = req.body;

        // Check if user already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                error: 'Email already registered'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create trial end date (14 days from now)
        const trial_ends_at = new Date();
        trial_ends_at.setDate(trial_ends_at.getDate() + 14);

        // Insert new user
        const result = await query(
            `INSERT INTO users (
                email, password_hash, full_name, phone, company_name, truck_number,
                subscription_status, trial_ends_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, email, full_name, subscription_status, subscription_tier, trial_ends_at`,
            [email, password_hash, full_name, phone, company_name, truck_number, 'trial', trial_ends_at]
        );

        const user = result.rows[0];

        // Generate JWT token
        const token = generateToken(user.id);

        // Log activity
        await query(
            'INSERT INTO activity_log (user_id, action, details) VALUES ($1, $2, $3)',
            [user.id, 'register', JSON.stringify({ email, registration_date: new Date() })]
        );

        res.status(201).json({
            message: 'Registration successful',
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

// POST /api/auth/login - Login user
router.post('/login', loginValidation, async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Get user from database
        const result = await query(
            `SELECT id, email, password_hash, full_name, subscription_status,
                    subscription_tier, trial_ends_at, subscription_ends_at
             FROM users WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // Update last login
        await query(
            'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Generate JWT token
        const token = generateToken(user.id);

        // Log activity
        await query(
            'INSERT INTO activity_log (user_id, action, ip_address) VALUES ($1, $2, $3)',
            [user.id, 'login', req.ip]
        );

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                subscription_status: user.subscription_status,
                subscription_tier: user.subscription_tier,
                trial_ends_at: user.trial_ends_at,
                subscription_ends_at: user.subscription_ends_at
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

// GET /api/auth/me - Get current user (requires authentication)
router.get('/me', authenticate, async (req, res) => {
    try {
        const result = await query(
            `SELECT id, email, full_name, phone, company_name, truck_number,
                    mc_number, dot_number, subscription_status, subscription_tier,
                    trial_ends_at, subscription_ends_at, created_at
             FROM users WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.json({
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Failed to get user',
            message: error.message
        });
    }
});

// POST /api/auth/logout - Logout user (client-side should delete token)
router.post('/logout', authenticate, async (req, res) => {
    try {
        // Log activity
        await query(
            'INSERT INTO activity_log (user_id, action) VALUES ($1, $2)',
            [req.user.id, 'logout']
        );

        res.json({
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Logout failed'
        });
    }
});

module.exports = router;
