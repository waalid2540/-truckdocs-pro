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

// Middleware to check if user has active subscription
const requireSubscription = (req, res, next) => {
    const { subscription_status } = req.user;

    if (subscription_status !== 'active' && subscription_status !== 'trial') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Active subscription required',
            subscription_status
        });
    }

    next();
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
