const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/users - Get all users (simple version - no auth required for now)
router.get('/users', async (req, res) => {
    try {
        const result = await query(
            `SELECT id, email, full_name, subscription_status,
                    subscription_end_date, created_at, updated_at
             FROM users
             ORDER BY created_at DESC`
        );

        // Count statistics
        const stats = await query(`
            SELECT
                COUNT(*) as total_users,
                COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_subscriptions,
                COUNT(CASE WHEN subscription_status = 'trial' THEN 1 END) as trial_users,
                COUNT(CASE WHEN subscription_status = 'inactive' THEN 1 END) as inactive_users
            FROM users
        `);

        res.json({
            stats: stats.rows[0],
            users: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            error: 'Failed to get users',
            message: error.message
        });
    }
});

// GET /api/admin/user/:id - Get specific user details
router.get('/user/:id', async (req, res) => {
    try {
        const user = await query(
            `SELECT id, email, full_name, subscription_status,
                    subscription_end_date, created_at, updated_at
             FROM users
             WHERE id = $1`,
            [req.params.id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user's document count
        const docs = await query(
            'SELECT COUNT(*) FROM documents WHERE user_id = $1',
            [req.params.id]
        );

        // Get user's expense count and total
        const expenses = await query(
            `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
             FROM expenses WHERE user_id = $1`,
            [req.params.id]
        );

        // Get user's invoice count and total
        const invoices = await query(
            `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
             FROM invoices WHERE user_id = $1`,
            [req.params.id]
        );

        res.json({
            user: user.rows[0],
            activity: {
                documents: parseInt(docs.rows[0].count),
                expenses: {
                    count: parseInt(expenses.rows[0].count),
                    total: parseFloat(expenses.rows[0].total)
                },
                invoices: {
                    count: parseInt(invoices.rows[0].count),
                    total: parseFloat(invoices.rows[0].total)
                }
            }
        });

    } catch (error) {
        console.error('Get user details error:', error);
        res.status(500).json({
            error: 'Failed to get user details',
            message: error.message
        });
    }
});

module.exports = router;
