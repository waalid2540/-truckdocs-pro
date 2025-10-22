const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// GET /add-expiration-fields - Add expiration fields to documents table
router.get('/add-expiration-fields', async (req, res) => {
    try {
        // Add expiration_date column if it doesn't exist
        await query(`
            ALTER TABLE documents
            ADD COLUMN IF NOT EXISTS expiration_date DATE,
            ADD COLUMN IF NOT EXISTS alert_snoozed_until DATE,
            ADD COLUMN IF NOT EXISTS has_signature BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS signature_data TEXT
        `);

        // Create index for expiration queries
        await query(`
            CREATE INDEX IF NOT EXISTS idx_documents_expiration
            ON documents(user_id, expiration_date)
            WHERE expiration_date IS NOT NULL
        `);

        res.json({
            success: true,
            message: '✅ Expiration fields added to documents table!',
            fields_added: [
                'expiration_date (DATE)',
                'alert_snoozed_until (DATE)',
                'has_signature (BOOLEAN)',
                'signature_data (TEXT)'
            ]
        });

    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
