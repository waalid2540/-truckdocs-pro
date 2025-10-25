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

// PUT /api/ifta/records/:id - Update an IFTA fuel record
router.put('/records/:id', authenticate, requireSubscription, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            purchase_date,
            state,
            gallons,
            cost,
            vendor_name,
            receipt_number,
            miles_in_state
        } = req.body;

        // Check if record exists and belongs to user
        const existingRecord = await query(
            'SELECT id FROM ifta_records WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (existingRecord.rows.length === 0) {
            return res.status(404).json({
                error: 'IFTA record not found or you do not have permission to update it'
            });
        }

        // Determine quarter if date is being updated
        let quarter, year;
        if (purchase_date) {
            const date = new Date(purchase_date);
            year = date.getFullYear();
            const month = date.getMonth() + 1;
            quarter = `${year}-Q${Math.ceil(month / 3)}`;
        }

        // Calculate price per gallon
        let price_per_gallon;
        if (gallons && cost) {
            price_per_gallon = cost / gallons;
        }

        // Build dynamic update query
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (purchase_date) {
            updates.push(`purchase_date = $${paramCount}`);
            values.push(purchase_date);
            paramCount++;
            updates.push(`quarter = $${paramCount}`);
            values.push(quarter);
            paramCount++;
            updates.push(`year = $${paramCount}`);
            values.push(year);
            paramCount++;
        }
        if (state) {
            updates.push(`state = $${paramCount}`);
            values.push(state);
            paramCount++;
        }
        if (gallons !== undefined) {
            updates.push(`gallons = $${paramCount}`);
            values.push(gallons);
            paramCount++;
        }
        if (cost !== undefined) {
            updates.push(`cost = $${paramCount}`);
            values.push(cost);
            paramCount++;
        }
        if (price_per_gallon) {
            updates.push(`price_per_gallon = $${paramCount}`);
            values.push(price_per_gallon);
            paramCount++;
        }
        if (vendor_name !== undefined) {
            updates.push(`vendor_name = $${paramCount}`);
            values.push(vendor_name);
            paramCount++;
        }
        if (receipt_number !== undefined) {
            updates.push(`receipt_number = $${paramCount}`);
            values.push(receipt_number);
            paramCount++;
        }
        if (miles_in_state !== undefined) {
            updates.push(`miles_in_state = $${paramCount}`);
            values.push(miles_in_state);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                error: 'No fields to update'
            });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        // Add id and user_id to values
        values.push(id);
        values.push(req.user.id);

        const result = await query(
            `UPDATE ifta_records
             SET ${updates.join(', ')}
             WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
             RETURNING *`,
            values
        );

        res.json({
            message: 'IFTA record updated successfully',
            record: result.rows[0]
        });

    } catch (error) {
        console.error('Update IFTA record error:', error);
        res.status(500).json({
            error: 'Failed to update IFTA record',
            message: error.message
        });
    }
});

// DELETE /api/ifta/records/:id - Delete an IFTA fuel record
router.delete('/records/:id', authenticate, requireSubscription, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if record exists and belongs to user
        const existingRecord = await query(
            'SELECT id FROM ifta_records WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (existingRecord.rows.length === 0) {
            return res.status(404).json({
                error: 'IFTA record not found or you do not have permission to delete it'
            });
        }

        // Delete the record
        await query(
            'DELETE FROM ifta_records WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        res.json({
            message: 'IFTA record deleted successfully',
            deleted_id: id
        });

    } catch (error) {
        console.error('Delete IFTA record error:', error);
        res.status(500).json({
            error: 'Failed to delete IFTA record',
            message: error.message
        });
    }
});

module.exports = router;
