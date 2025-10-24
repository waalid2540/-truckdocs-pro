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

// Helper function to generate JWT access token (short-lived)
const generateToken = (userId) => {
    return jwt.sign(
        { userId, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // Short-lived for security
    );
};

// Helper function to generate refresh token (long-lived)
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' } // Long-lived
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

        // Generate access and refresh tokens
        const token = generateToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Store refresh token in database
        const refreshTokenExpiresAt = new Date();
        refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 30);

        await query(
            'UPDATE users SET refresh_token = $1, refresh_token_expires_at = $2 WHERE id = $3',
            [refreshToken, refreshTokenExpiresAt, user.id]
        );

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
            token,
            refreshToken
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: error.message
        });
    }
});

// POST /api/auth/login - Login user with account lockout protection
router.post('/login', loginValidation, async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Get user from database with lockout fields
        const result = await query(
            `SELECT id, email, password_hash, full_name, subscription_status,
                    subscription_tier, trial_ends_at, subscription_ends_at,
                    failed_login_attempts, account_locked_until
             FROM users WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            // Log failed attempt for non-existent user
            await query(
                `INSERT INTO security_audit_log (event_type, ip_address, user_agent, details)
                 VALUES ($1, $2, $3, $4)`,
                ['login_failed', req.ip, req.get('user-agent'), JSON.stringify({ email, reason: 'user_not_found' })]
            );
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        const user = result.rows[0];

        // Check if account is locked
        if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
            const lockTimeRemaining = Math.ceil((new Date(user.account_locked_until) - new Date()) / 1000 / 60);
            await query(
                `INSERT INTO security_audit_log (user_id, event_type, ip_address, user_agent, details)
                 VALUES ($1, $2, $3, $4, $5)`,
                [user.id, 'login_blocked', req.ip, req.get('user-agent'), JSON.stringify({ reason: 'account_locked', minutes_remaining: lockTimeRemaining })]
            );
            return res.status(423).json({
                error: 'Account temporarily locked',
                message: `Too many failed login attempts. Please try again in ${lockTimeRemaining} minutes.`,
                locked_until: user.account_locked_until
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            // Increment failed login attempts
            const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
            const lockAccount = newFailedAttempts >= 5;

            if (lockAccount) {
                // Lock account for 30 minutes
                const lockUntil = new Date();
                lockUntil.setMinutes(lockUntil.getMinutes() + 30);

                await query(
                    `UPDATE users
                     SET failed_login_attempts = $1,
                         account_locked_until = $2,
                         last_failed_login = CURRENT_TIMESTAMP
                     WHERE id = $3`,
                    [newFailedAttempts, lockUntil, user.id]
                );

                await query(
                    `INSERT INTO security_audit_log (user_id, event_type, ip_address, user_agent, details)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [user.id, 'account_locked', req.ip, req.get('user-agent'), JSON.stringify({ reason: '5_failed_attempts', locked_until: lockUntil })]
                );

                return res.status(423).json({
                    error: 'Account locked',
                    message: 'Too many failed login attempts. Your account has been locked for 30 minutes.',
                    locked_until: lockUntil
                });
            } else {
                // Just increment failed attempts
                await query(
                    `UPDATE users
                     SET failed_login_attempts = $1,
                         last_failed_login = CURRENT_TIMESTAMP
                     WHERE id = $2`,
                    [newFailedAttempts, user.id]
                );

                await query(
                    `INSERT INTO security_audit_log (user_id, event_type, ip_address, user_agent, details)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [user.id, 'login_failed', req.ip, req.get('user-agent'), JSON.stringify({ attempts: newFailedAttempts, remaining: 5 - newFailedAttempts })]
                );

                return res.status(401).json({
                    error: 'Invalid credentials',
                    attempts_remaining: 5 - newFailedAttempts
                });
            }
        }

        // Generate access and refresh tokens
        const token = generateToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Store refresh token and reset failed attempts
        const refreshTokenExpiresAt = new Date();
        refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 30);

        await query(
            `UPDATE users
             SET failed_login_attempts = 0,
                 account_locked_until = NULL,
                 last_successful_login = CURRENT_TIMESTAMP,
                 last_login_at = CURRENT_TIMESTAMP,
                 refresh_token = $2,
                 refresh_token_expires_at = $3
             WHERE id = $1`,
            [user.id, refreshToken, refreshTokenExpiresAt]
        );

        // Log successful login
        await query(
            `INSERT INTO security_audit_log (user_id, event_type, ip_address, user_agent, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [user.id, 'login_success', req.ip, req.get('user-agent'), JSON.stringify({ login_time: new Date() })]
        );

        // Also log to activity log for backward compatibility
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
            token,
            refreshToken
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: error.message
        });
    }
});

// POST /api/auth/refresh - Refresh access token using refresh token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                error: 'Refresh token required'
            });
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({
                error: 'Invalid or expired refresh token'
            });
        }

        // Check token type
        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                error: 'Invalid token type'
            });
        }

        // Get user and verify refresh token matches database
        const result = await query(
            `SELECT id, email, full_name, subscription_status, subscription_tier,
                    trial_ends_at, subscription_ends_at, refresh_token, refresh_token_expires_at
             FROM users WHERE id = $1`,
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'User not found'
            });
        }

        const user = result.rows[0];

        // Verify refresh token matches and hasn't expired
        if (user.refresh_token !== refreshToken) {
            await query(
                `INSERT INTO security_audit_log (user_id, event_type, ip_address, user_agent, details)
                 VALUES ($1, $2, $3, $4, $5)`,
                [user.id, 'refresh_token_mismatch', req.ip, req.get('user-agent'), JSON.stringify({ reason: 'token_mismatch' })]
            );
            return res.status(401).json({
                error: 'Invalid refresh token'
            });
        }

        if (new Date(user.refresh_token_expires_at) < new Date()) {
            return res.status(401).json({
                error: 'Refresh token expired',
                message: 'Please login again'
            });
        }

        // Generate new access token
        const newAccessToken = generateToken(user.id);

        // Log token refresh
        await query(
            `INSERT INTO security_audit_log (user_id, event_type, ip_address, user_agent, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [user.id, 'token_refreshed', req.ip, req.get('user-agent'), JSON.stringify({ refresh_time: new Date() })]
        );

        res.json({
            message: 'Token refreshed successfully',
            token: newAccessToken,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                subscription_status: user.subscription_status,
                subscription_tier: user.subscription_tier,
                trial_ends_at: user.trial_ends_at,
                subscription_ends_at: user.subscription_ends_at
            }
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            error: 'Token refresh failed',
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

// POST /api/auth/logout - Logout user and invalidate refresh token
router.post('/logout', authenticate, async (req, res) => {
    try {
        // Clear refresh token from database
        await query(
            'UPDATE users SET refresh_token = NULL, refresh_token_expires_at = NULL WHERE id = $1',
            [req.user.id]
        );

        // Log activity
        await query(
            'INSERT INTO activity_log (user_id, action) VALUES ($1, $2)',
            [req.user.id, 'logout']
        );

        // Log security event
        await query(
            `INSERT INTO security_audit_log (user_id, event_type, ip_address, user_agent, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, 'logout', req.ip, req.get('user-agent'), JSON.stringify({ logout_time: new Date() })]
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
