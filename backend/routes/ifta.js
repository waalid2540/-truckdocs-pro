const express = require('express');
const { query } = require('../config/database');
const { authenticate, requireSubscription } = require('../middleware/auth');

const router = express.Router();

// GET /api/ifta/records - Get all IFTA fuel records
router.get('/records', authenticate, requireSubscription, async (req, res) => {
    try {
        const { quarter, year, state } = req.query;

        let queryText = 'SELECT * FROM ifta_records WHERE user_id = $1';
        const queryParams = [req.user.id];
        let paramCount = 1;

        if (quarter) {
            paramCount++;
            queryText += ` AND quarter = $${paramCount}`;
            queryParams.push(quarter);
        }

        if (year) {
            paramCount++;
            queryText += ` AND year = $${paramCount}`;
            queryParams.push(parseInt(year));
        }

        if (state) {
            paramCount++;
            queryText += ` AND state = $${paramCount}`;
            queryParams.push(state);
        }

        queryText += ' ORDER BY purchase_date DESC';

        const result = await query(queryText, queryParams);

        res.json({
            records: result.rows
        });

    } catch (error) {
        console.error('Get IFTA records error:', error);
        res.status(500).json({
            error: 'Failed to get IFTA records',
            message: error.message
        });
    }
});

// POST /api/ifta/records - Create new IFTA fuel record
router.post('/records', authenticate, requireSubscription, async (req, res) => {
    try {
        const {
            purchase_date,
            state,
            gallons,
            cost,
            vendor_name,
            receipt_number,
            miles_in_state
        } = req.body;

        if (!purchase_date || !state || !gallons || !cost) {
            return res.status(400).json({
                error: 'purchase_date, state, gallons, and cost are required'
            });
        }

        // Determine quarter
        const date = new Date(purchase_date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const quarter = `${year}-Q${Math.ceil(month / 3)}`;

        const price_per_gallon = cost / gallons;

        const result = await query(
            `INSERT INTO ifta_records (
                user_id, quarter, year, state, purchase_date, gallons,
                cost, price_per_gallon, vendor_name, receipt_number, miles_in_state
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [req.user.id, quarter, year, state, purchase_date, gallons,
             cost, price_per_gallon, vendor_name, receipt_number, miles_in_state]
        );

        res.status(201).json({
            message: 'IFTA record created successfully',
            record: result.rows[0]
        });

    } catch (error) {
        console.error('Create IFTA record error:', error);
        res.status(500).json({
            error: 'Failed to create IFTA record',
            message: error.message
        });
    }
});

// GET /api/ifta/reports/:quarter - Get IFTA report for a quarter
router.get('/reports/:quarter', authenticate, requireSubscription, async (req, res) => {
    try {
        const { quarter } = req.params; // Format: 2024-Q1

        // Get all records for this quarter
        const records = await query(
            `SELECT state, SUM(gallons) as total_gallons, SUM(cost) as total_cost,
                    SUM(miles_in_state) as total_miles, COUNT(*) as purchase_count
             FROM ifta_records
             WHERE user_id = $1 AND quarter = $2
             GROUP BY state
             ORDER BY state`,
            [req.user.id, quarter]
        );

        // Get overall summary
        const summary = await query(
            `SELECT SUM(gallons) as total_gallons, SUM(cost) as total_cost,
                    SUM(miles_in_state) as total_miles, COUNT(*) as total_purchases
             FROM ifta_records
             WHERE user_id = $1 AND quarter = $2`,
            [req.user.id, quarter]
        );

        res.json({
            quarter,
            summary: summary.rows[0],
            by_state: records.rows
        });

    } catch (error) {
        console.error('Get IFTA report error:', error);
        res.status(500).json({
            error: 'Failed to get IFTA report',
            message: error.message
        });
    }
});

// GET /api/ifta/quarters - Get available quarters
router.get('/quarters', authenticate, requireSubscription, async (req, res) => {
    try {
        const result = await query(
            `SELECT DISTINCT quarter, year
             FROM ifta_records
             WHERE user_id = $1
             ORDER BY year DESC, quarter DESC`,
            [req.user.id]
        );

        res.json({
            quarters: result.rows
        });

    } catch (error) {
        console.error('Get quarters error:', error);
        res.status(500).json({
            error: 'Failed to get quarters',
            message: error.message
        });
    }
});

module.exports = router;
