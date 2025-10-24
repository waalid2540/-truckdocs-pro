const express = require('express');
const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// GET /setup-security-enhancements - Run security enhancements migration
router.get('/setup-security-enhancements', async (req, res) => {
    try {
        // Read schema file
        const schemaPath = path.join(__dirname, '../database/security-enhancements.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        await query(schema);

        res.json({
            success: true,
            message: '🔒 Security enhancements migration complete!',
            enhancements_added: [
                'Account lockout tracking (failed_login_attempts, account_locked_until)',
                'Refresh token support (refresh_token, refresh_token_expires_at)',
                'Security audit log table (tracks login attempts, account locks, etc.)',
                'Financial audit trail table (tracks all financial transactions)',
                'Indexed for performance'
            ],
            next_steps: [
                'Account lockout is now enabled (5 failed attempts = 30 min lock)',
                'All login attempts are logged in security_audit_log',
                'All financial transactions are logged in financial_audit_trail',
                'Refresh tokens will be used for extended sessions'
            ]
        });

    } catch (error) {
        console.error('Security migration error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            hint: 'Make sure DATABASE_URL is set correctly and you have ALTER TABLE permissions'
        });
    }
});

module.exports = router;
