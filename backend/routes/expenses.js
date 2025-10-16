const express = require('express');
const { query } = require('../config/database');
const { authenticate, requireSubscription } = require('../middleware/auth');

const router = express.Router();

// GET /api/expenses - Get all expenses
router.get('/', authenticate, requireSubscription, async (req, res) => {
    try {
        const { category, start_date, end_date, limit = 50, offset = 0 } = req.query;

        let queryText = 'SELECT * FROM expenses WHERE user_id = $1';
        const queryParams = [req.user.id];
        let paramCount = 1;

        if (category) {
            paramCount++;
            queryText += ` AND category = $${paramCount}`;
            queryParams.push(category);
        }

        if (start_date) {
            paramCount++;
            queryText += ` AND expense_date >= $${paramCount}`;
            queryParams.push(start_date);
        }

        if (end_date) {
            paramCount++;
            queryText += ` AND expense_date <= $${paramCount}`;
            queryParams.push(end_date);
        }

        queryText += ` ORDER BY expense_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        queryParams.push(limit, offset);

        const result = await query(queryText, queryParams);

        res.json({
            expenses: result.rows
        });

    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({
            error: 'Failed to get expenses',
            message: error.message
        });
    }
});

// POST /api/expenses - Create new expense
router.post('/', authenticate, requireSubscription, async (req, res) => {
    try {
        const {
            category,
            description,
            amount,
            expense_date,
            vendor_name,
            payment_method,
            is_tax_deductible = true,
            notes
        } = req.body;

        if (!category || !description || !amount || !expense_date) {
            return res.status(400).json({
                error: 'category, description, amount, and expense_date are required'
            });
        }

        const result = await query(
            `INSERT INTO expenses (
                user_id, category, description, amount, expense_date,
                vendor_name, payment_method, is_tax_deductible, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [req.user.id, category, description, amount, expense_date,
             vendor_name, payment_method, is_tax_deductible, notes]
        );

        res.status(201).json({
            message: 'Expense created successfully',
            expense: result.rows[0]
        });

    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({
            error: 'Failed to create expense',
            message: error.message
        });
    }
});

// GET /api/expenses/stats/summary - Get expense statistics
router.get('/stats/summary', authenticate, requireSubscription, async (req, res) => {
    try {
        const stats = await query(
            `SELECT
                COUNT(*) as total_expenses,
                COALESCE(SUM(amount), 0) as total_amount,
                COALESCE(SUM(CASE WHEN is_tax_deductible THEN amount ELSE 0 END), 0) as deductible_amount,
                COUNT(DISTINCT category) as categories
             FROM expenses
             WHERE user_id = $1`,
            [req.user.id]
        );

        // Get expenses by category
        const byCategory = await query(
            `SELECT category, COUNT(*) as count, SUM(amount) as total
             FROM expenses
             WHERE user_id = $1
             GROUP BY category
             ORDER BY total DESC`,
            [req.user.id]
        );

        res.json({
            stats: stats.rows[0],
            by_category: byCategory.rows
        });

    } catch (error) {
        console.error('Get expense stats error:', error);
        res.status(500).json({
            error: 'Failed to get statistics',
            message: error.message
        });
    }
});

module.exports = router;
