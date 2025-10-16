const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/user/profile - Get user profile
router.get('/profile', authenticate, async (req, res) => {
    try {
        const result = await query(
            `SELECT id, email, full_name, phone, company_name, truck_number,
                    mc_number, dot_number, subscription_status, subscription_tier,
                    trial_ends_at, subscription_ends_at, created_at
             FROM users WHERE id = $1`,
            [req.user.id]
        );

        res.json({
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            error: 'Failed to get profile',
            message: error.message
        });
    }
});

// PUT /api/user/profile - Update user profile
router.put('/profile', authenticate, async (req, res) => {
    try {
        const {
            full_name,
            phone,
            company_name,
            truck_number,
            mc_number,
            dot_number
        } = req.body;

        const result = await query(
            `UPDATE users SET
                full_name = COALESCE($1, full_name),
                phone = COALESCE($2, phone),
                company_name = COALESCE($3, company_name),
                truck_number = COALESCE($4, truck_number),
                mc_number = COALESCE($5, mc_number),
                dot_number = COALESCE($6, dot_number),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING id, email, full_name, phone, company_name, truck_number, mc_number, dot_number`,
            [full_name, phone, company_name, truck_number, mc_number, dot_number, req.user.id]
        );

        res.json({
            message: 'Profile updated successfully',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            error: 'Failed to update profile',
            message: error.message
        });
    }
});

// GET /api/user/dashboard - Get dashboard summary
router.get('/dashboard', authenticate, async (req, res) => {
    try {
        // Get various stats for dashboard
        const stats = await Promise.all([
            // Document count
            query('SELECT COUNT(*) as count FROM documents WHERE user_id = $1', [req.user.id]),
            // Invoice stats
            query(
                `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid,
                        SUM(CASE WHEN status = 'unpaid' THEN total_amount ELSE 0 END) as unpaid
                 FROM invoices WHERE user_id = $1`,
                [req.user.id]
            ),
            // Expense stats (this month)
            query(
                `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
                 FROM expenses
                 WHERE user_id = $1 AND expense_date >= DATE_TRUNC('month', CURRENT_DATE)`,
                [req.user.id]
            ),
            // IFTA records (current quarter)
            query(
                `SELECT COUNT(*) as count, COALESCE(SUM(gallons), 0) as gallons,
                        COALESCE(SUM(cost), 0) as cost
                 FROM ifta_records
                 WHERE user_id = $1 AND quarter = $2`,
                [req.user.id, `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`]
            )
        ]);

        res.json({
            documents: {
                count: parseInt(stats[0].rows[0].count)
            },
            invoices: {
                total: parseInt(stats[1].rows[0].total),
                paid: parseFloat(stats[1].rows[0].paid),
                unpaid: parseFloat(stats[1].rows[0].unpaid)
            },
            expenses: {
                count: parseInt(stats[2].rows[0].count),
                total: parseFloat(stats[2].rows[0].total)
            },
            ifta: {
                count: parseInt(stats[3].rows[0].count),
                gallons: parseFloat(stats[3].rows[0].gallons),
                cost: parseFloat(stats[3].rows[0].cost)
            }
        });

    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({
            error: 'Failed to get dashboard',
            message: error.message
        });
    }
});

module.exports = router;
