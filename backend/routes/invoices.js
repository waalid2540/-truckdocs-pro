const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, getClient } = require('../config/database');
const { authenticate, requireSubscription } = require('../middleware/auth');
const { logFinancialTransaction } = require('../utils/audit-logger');

const router = express.Router();

// Helper to generate invoice number
const generateInvoiceNumber = async (userId) => {
    const year = new Date().getFullYear();
    const result = await query(
        `SELECT COUNT(*) FROM invoices WHERE user_id = $1 AND EXTRACT(YEAR FROM created_at) = $2`,
        [userId, year]
    );
    const count = parseInt(result.rows[0].count) + 1;
    return `INV-${year}-${String(count).padStart(4, '0')}`;
};

// GET /api/invoices - Get all invoices
router.get('/', authenticate, requireSubscription, async (req, res) => {
    try {
        const { status, start_date, end_date, limit = 50, offset = 0 } = req.query;

        let queryText = `
            SELECT id, invoice_number, client_name, invoice_date, due_date,
                   total_amount, status, payment_date, created_at
            FROM invoices
            WHERE user_id = $1
        `;
        const queryParams = [req.user.id];
        let paramCount = 1;

        if (status) {
            paramCount++;
            queryText += ` AND status = $${paramCount}`;
            queryParams.push(status);
        }

        if (start_date) {
            paramCount++;
            queryText += ` AND invoice_date >= $${paramCount}`;
            queryParams.push(start_date);
        }

        if (end_date) {
            paramCount++;
            queryText += ` AND invoice_date <= $${paramCount}`;
            queryParams.push(end_date);
        }

        queryText += ` ORDER BY invoice_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        queryParams.push(limit, offset);

        const result = await query(queryText, queryParams);

        // Get total count
        const countResult = await query(
            'SELECT COUNT(*) FROM invoices WHERE user_id = $1',
            [req.user.id]
        );

        res.json({
            invoices: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({
            error: 'Failed to get invoices',
            message: error.message
        });
    }
});

// POST /api/invoices - Create new invoice
router.post('/', authenticate, requireSubscription, async (req, res) => {
    const client = await getClient();

    try {
        await client.query('BEGIN');

        const {
            client_name,
            client_email,
            client_phone,
            client_address,
            invoice_date,
            due_date,
            items, // Array of { description, quantity, unit_price }
            tax_rate = 0,
            notes,
            terms
        } = req.body;

        // Validate required fields
        if (!client_name || !invoice_date || !items || items.length === 0) {
            return res.status(400).json({
                error: 'client_name, invoice_date, and items are required'
            });
        }

        // Generate invoice number
        const invoice_number = await generateInvoiceNumber(req.user.id);

        // Calculate totals
        let subtotal = 0;
        items.forEach(item => {
            const itemTotal = (item.quantity || 1) * item.unit_price;
            subtotal += itemTotal;
        });

        const tax_amount = (subtotal * tax_rate) / 100;
        const total_amount = subtotal + tax_amount;

        // Insert invoice
        const invoiceResult = await client.query(
            `INSERT INTO invoices (
                user_id, invoice_number, client_name, client_email, client_phone,
                client_address, invoice_date, due_date, subtotal, tax_rate,
                tax_amount, total_amount, notes, terms, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *`,
            [
                req.user.id, invoice_number, client_name, client_email, client_phone,
                client_address, invoice_date, due_date, subtotal, tax_rate,
                tax_amount, total_amount, notes, terms, 'unpaid'
            ]
        );

        const invoice = invoiceResult.rows[0];

        // Insert invoice items
        for (const item of items) {
            const itemTotal = (item.quantity || 1) * item.unit_price;
            await client.query(
                `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
                 VALUES ($1, $2, $3, $4, $5)`,
                [invoice.id, item.description, item.quantity || 1, item.unit_price, itemTotal]
            );
        }

        await client.query('COMMIT');

        // Log to audit trail
        await logFinancialTransaction(
            req.user.id,
            'invoice_created',
            'invoice',
            invoice.id,
            total_amount,
            { invoice_number, client_name, status: 'unpaid' }
        );

        // Get full invoice with items
        const fullInvoice = await query(
            `SELECT i.*,
                    json_agg(json_build_object(
                        'id', ii.id,
                        'description', ii.description,
                        'quantity', ii.quantity,
                        'unit_price', ii.unit_price,
                        'total', ii.total
                    )) as items
             FROM invoices i
             LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
             WHERE i.id = $1
             GROUP BY i.id`,
            [invoice.id]
        );

        res.status(201).json({
            message: 'Invoice created successfully',
            invoice: fullInvoice.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create invoice error:', error);
        res.status(500).json({
            error: 'Failed to create invoice',
            message: error.message
        });
    } finally {
        client.release();
    }
});

// GET /api/invoices/:id - Get single invoice with items
router.get('/:id', authenticate, requireSubscription, async (req, res) => {
    try {
        const result = await query(
            `SELECT i.*,
                    json_agg(json_build_object(
                        'id', ii.id,
                        'description', ii.description,
                        'quantity', ii.quantity,
                        'unit_price', ii.unit_price,
                        'total', ii.total
                    )) as items
             FROM invoices i
             LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
             WHERE i.id = $1 AND i.user_id = $2
             GROUP BY i.id`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Invoice not found'
            });
        }

        res.json({
            invoice: result.rows[0]
        });

    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({
            error: 'Failed to get invoice',
            message: error.message
        });
    }
});

// PUT /api/invoices/:id/status - Update invoice status (paid/unpaid)
router.put('/:id/status', authenticate, requireSubscription, async (req, res) => {
    try {
        const { status, payment_date, payment_method } = req.body;

        if (!['unpaid', 'paid', 'overdue', 'cancelled'].includes(status)) {
            return res.status(400).json({
                error: 'Invalid status. Must be: unpaid, paid, overdue, or cancelled'
            });
        }

        const result = await query(
            `UPDATE invoices SET
                status = $1,
                payment_date = $2,
                payment_method = $3,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $4 AND user_id = $5
             RETURNING *`,
            [status, payment_date, payment_method, req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Invoice not found'
            });
        }

        const invoice = result.rows[0];

        // Log to audit trail
        await logFinancialTransaction(
            req.user.id,
            status === 'paid' ? 'invoice_paid' : 'invoice_status_updated',
            'invoice',
            invoice.id,
            invoice.total_amount,
            { previous_status: invoice.status, new_status: status, payment_method }
        );

        res.json({
            message: 'Invoice status updated',
            invoice: invoice
        });

    } catch (error) {
        console.error('Update invoice status error:', error);
        res.status(500).json({
            error: 'Failed to update invoice',
            message: error.message
        });
    }
});

// DELETE /api/invoices/:id - Delete invoice
router.delete('/:id', authenticate, requireSubscription, async (req, res) => {
    try {
        // Get invoice details before deletion for audit trail
        const invoiceResult = await query(
            'SELECT id, invoice_number, total_amount FROM invoices WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (invoiceResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Invoice not found'
            });
        }

        const invoice = invoiceResult.rows[0];

        // Delete invoice
        await query(
            'DELETE FROM invoices WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        // Log to audit trail
        await logFinancialTransaction(
            req.user.id,
            'invoice_deleted',
            'invoice',
            invoice.id,
            invoice.total_amount,
            { invoice_number: invoice.invoice_number }
        );

        res.json({
            message: 'Invoice deleted successfully'
        });

    } catch (error) {
        console.error('Delete invoice error:', error);
        res.status(500).json({
            error: 'Failed to delete invoice',
            message: error.message
        });
    }
});

// GET /api/invoices/stats/summary - Get invoice statistics
router.get('/stats/summary', authenticate, requireSubscription, async (req, res) => {
    try {
        const stats = await query(
            `SELECT
                COUNT(*) as total_invoices,
                COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
                COUNT(CASE WHEN status = 'unpaid' THEN 1 END) as unpaid_count,
                COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) as total_paid,
                COALESCE(SUM(CASE WHEN status = 'unpaid' THEN total_amount ELSE 0 END), 0) as total_outstanding
             FROM invoices
             WHERE user_id = $1`,
            [req.user.id]
        );

        res.json({
            stats: stats.rows[0]
        });

    } catch (error) {
        console.error('Get invoice stats error:', error);
        res.status(500).json({
            error: 'Failed to get statistics',
            message: error.message
        });
    }
});

module.exports = router;
