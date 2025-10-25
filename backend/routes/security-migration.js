const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// GET /setup-security-enhancements - Run security enhancements migration
router.get('/setup-security-enhancements', async (req, res) => {
    try {
        const results = [];

        // Step 1: Add columns to users table
        try {
            await query(`
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
                ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP,
                ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP,
                ADD COLUMN IF NOT EXISTS last_successful_login TIMESTAMP,
                ADD COLUMN IF NOT EXISTS refresh_token TEXT,
                ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMP
            `);
            results.push('✅ Added security columns to users table');
        } catch (error) {
            results.push(`⚠️  Users table: ${error.message}`);
        }

        // Step 2: Create security_audit_log table (without foreign key first)
        try {
            await query(`
                CREATE TABLE IF NOT EXISTS security_audit_log (
                    id SERIAL PRIMARY KEY,
                    user_id UUID,
                    event_type VARCHAR(50) NOT NULL,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    details JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            results.push('✅ Created security_audit_log table');
        } catch (error) {
            results.push(`⚠️  Security audit log: ${error.message}`);
        }

        // Step 3: Create indexes for security_audit_log
        try {
            await query(`CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON security_audit_log(user_id)`);
            await query(`CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON security_audit_log(event_type)`);
            await query(`CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON security_audit_log(created_at)`);
            results.push('✅ Created security audit log indexes');
        } catch (error) {
            results.push(`⚠️  Security indexes: ${error.message}`);
        }

        // Step 4: Create financial_audit_trail table (without foreign key first)
        try {
            await query(`
                CREATE TABLE IF NOT EXISTS financial_audit_trail (
                    id SERIAL PRIMARY KEY,
                    user_id UUID,
                    transaction_type VARCHAR(50) NOT NULL,
                    entity_type VARCHAR(50) NOT NULL,
                    entity_id VARCHAR(255) NOT NULL,
                    amount DECIMAL(10, 2),
                    details JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            results.push('✅ Created financial_audit_trail table');
        } catch (error) {
            results.push(`⚠️  Financial audit trail: ${error.message}`);
        }

        // Step 5: Create indexes for financial_audit_trail
        try {
            await query(`CREATE INDEX IF NOT EXISTS idx_financial_audit_user_id ON financial_audit_trail(user_id)`);
            await query(`CREATE INDEX IF NOT EXISTS idx_financial_audit_type ON financial_audit_trail(transaction_type)`);
            await query(`CREATE INDEX IF NOT EXISTS idx_financial_audit_created_at ON financial_audit_trail(created_at)`);
            results.push('✅ Created financial audit trail indexes');
        } catch (error) {
            results.push(`⚠️  Financial indexes: ${error.message}`);
        }

        res.json({
            success: true,
            message: '🔒 Security enhancements setup complete!',
            results: results,
            note: 'Foreign key constraints skipped to avoid permission issues - tables will still work correctly'
        });

    } catch (error) {
        console.error('Security migration error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            hint: 'Check the logs for specific errors'
        });
    }
});

module.exports = router;
