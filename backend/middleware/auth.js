const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No token provided'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const result = await query(
            'SELECT id, email, full_name, subscription_status, subscription_tier FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User not found'
            });
        }

        // Attach user to request object
        req.user = result.rows[0];
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Token expired'
            });
        }
        console.error('Auth middleware error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Authentication failed'
        });
    }
};

// Middleware to check if user has active subscription or valid trial
const requireSubscription = async (req, res, next) => {
    try {
        const { subscription_status } = req.user;

        // If user has active paid subscription, allow access
        if (subscription_status === 'active' || subscription_status === 'trialing') {
            return next();
        }

        // If user is on trial, check if trial has expired
        if (subscription_status === 'trial') {
            // Get trial_ends_at from database
            const result = await query(
                'SELECT trial_ends_at FROM users WHERE id = $1',
                [req.user.id]
            );

            const trialEndsAt = result.rows[0]?.trial_ends_at;

            // Check if trial has expired
            if (trialEndsAt && new Date(trialEndsAt) < new Date()) {
                return res.status(402).json({
                    error: 'Trial expired',
                    message: 'Your 7-day free trial has ended. Please upgrade to continue using TruckDocs Pro.',
                    trial_ended: true,
                    upgrade_required: true
                });
            }

            // Trial is still active
            return next();
        }

        // User has no valid subscription (cancelled, expired, etc.)
        return res.status(403).json({
            error: 'Subscription required',
            message: 'Active subscription required to access this feature',
            subscription_status,
            upgrade_required: true
        });

    } catch (error) {
        console.error('Subscription check error:', error);
        return res.status(500).json({
            error: 'Server error',
            message: 'Failed to verify subscription'
        });
    }
};

// Middleware to check subscription tier
const requireTier = (...allowedTiers) => {
    return (req, res, next) => {
        const { subscription_tier } = req.user;

        if (!allowedTiers.includes(subscription_tier)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `This feature requires ${allowedTiers.join(' or ')} subscription`,
                current_tier: subscription_tier
            });
        }

        next();
    };
};

module.exports = {
    authenticate,
    requireSubscription,
    requireTier
};
