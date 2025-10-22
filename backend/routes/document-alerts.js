const express = require('express');
const { query } = require('../config/database');
const { authenticate, requireSubscription } = require('../middleware/auth');

const router = express.Router();

// GET /api/document-alerts/expiring - Get documents expiring soon
router.get('/expiring', authenticate, requireSubscription, async (req, res) => {
    try {
        const { days = 30 } = req.query; // Default to 30 days

        const result = await query(
            `SELECT id, document_type, title, expiration_date,
                    EXTRACT(DAY FROM (expiration_date - CURRENT_DATE)) as days_until_expiration
             FROM documents
             WHERE user_id = $1
             AND expiration_date IS NOT NULL
             AND expiration_date >= CURRENT_DATE
             AND expiration_date <= CURRENT_DATE + INTERVAL '${parseInt(days)} days'
             ORDER BY expiration_date ASC`,
            [req.user.id]
        );

        res.json({
            expiring_documents: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        console.error('Get expiring documents error:', error);
        res.status(500).json({
            error: 'Failed to get expiring documents',
            message: error.message
        });
    }
});

// GET /api/document-alerts/expired - Get expired documents
router.get('/expired', authenticate, requireSubscription, async (req, res) => {
    try {
        const result = await query(
            `SELECT id, document_type, title, expiration_date,
                    EXTRACT(DAY FROM (CURRENT_DATE - expiration_date)) as days_expired
             FROM documents
             WHERE user_id = $1
             AND expiration_date IS NOT NULL
             AND expiration_date < CURRENT_DATE
             ORDER BY expiration_date DESC`,
            [req.user.id]
        );

        res.json({
            expired_documents: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        console.error('Get expired documents error:', error);
        res.status(500).json({
            error: 'Failed to get expired documents',
            message: error.message
        });
    }
});

// GET /api/document-alerts/summary - Get alerts summary
router.get('/summary', authenticate, requireSubscription, async (req, res) => {
    try {
        const summary = await query(
            `SELECT
                COUNT(CASE WHEN expiration_date < CURRENT_DATE THEN 1 END) as expired_count,
                COUNT(CASE WHEN expiration_date >= CURRENT_DATE AND expiration_date <= CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as expiring_this_week,
                COUNT(CASE WHEN expiration_date > CURRENT_DATE + INTERVAL '7 days' AND expiration_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_this_month
             FROM documents
             WHERE user_id = $1 AND expiration_date IS NOT NULL`,
            [req.user.id]
        );

        res.json({
            summary: summary.rows[0]
        });

    } catch (error) {
        console.error('Get alerts summary error:', error);
        res.status(500).json({
            error: 'Failed to get alerts summary',
            message: error.message
        });
    }
});

// PUT /api/document-alerts/:id/snooze - Snooze alert for a document
router.put('/:id/snooze', authenticate, requireSubscription, async (req, res) => {
    try {
        const { days = 7 } = req.body;

        const result = await query(
            `UPDATE documents
             SET alert_snoozed_until = CURRENT_DATE + INTERVAL '${parseInt(days)} days',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Document not found'
            });
        }

        res.json({
            message: `Alert snoozed for ${days} days`,
            document: result.rows[0]
        });

    } catch (error) {
        console.error('Snooze alert error:', error);
        res.status(500).json({
            error: 'Failed to snooze alert',
            message: error.message
        });
    }
});

module.exports = router;
