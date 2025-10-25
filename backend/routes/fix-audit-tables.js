const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// GET /fix-audit-tables - Drop and recreate audit tables with correct UUID types
router.get('/fix-audit-tables', async (req, res) => {
    try {
        const results = [];

        // Step 1: Drop existing audit tables (they have wrong schema with INTEGER instead of UUID)
        try {
            await query(`DROP TABLE IF EXISTS security_audit_log CASCADE`);
            await query(`DROP TABLE IF EXISTS financial_audit_trail CASCADE`);
            results.push('✅ Dropped old audit tables');
        } catch (error) {
            results.push(`⚠️  Drop tables: ${error.message}`);
        }

        // Step 2: Create security_audit_log table with UUID type
        try {
            await query(`
                CREATE TABLE security_audit_log (
                    id SERIAL PRIMARY KEY,
                    user_id UUID,
                    event_type VARCHAR(50) NOT NULL,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    details JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            results.push('✅ Created security_audit_log table with UUID');
        } catch (error) {
            results.push(`⚠️  Security audit log: ${error.message}`);
        }

        // Step 3: Create indexes for security_audit_log
        try {
            await query(`CREATE INDEX idx_security_audit_user_id ON security_audit_log(user_id)`);
            await query(`CREATE INDEX idx_security_audit_event_type ON security_audit_log(event_type)`);
            await query(`CREATE INDEX idx_security_audit_created_at ON security_audit_log(created_at)`);
            results.push('✅ Created security audit log indexes');
        } catch (error) {
            results.push(`⚠️  Security indexes: ${error.message}`);
        }

        // Step 4: Create financial_audit_trail table with UUID types
        try {
            await query(`
                CREATE TABLE financial_audit_trail (
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
            results.push('✅ Created financial_audit_trail table with UUID');
        } catch (error) {
            results.push(`⚠️  Financial audit trail: ${error.message}`);
        }

        // Step 5: Create indexes for financial_audit_trail
        try {
            await query(`CREATE INDEX idx_financial_audit_user_id ON financial_audit_trail(user_id)`);
            await query(`CREATE INDEX idx_financial_audit_type ON financial_audit_trail(transaction_type)`);
            await query(`CREATE INDEX idx_financial_audit_created_at ON financial_audit_trail(created_at)`);
            results.push('✅ Created financial audit trail indexes');
        } catch (error) {
            results.push(`⚠️  Financial indexes: ${error.message}`);
        }

        res.json({
            success: true,
            message: '🔧 Audit tables fixed with correct UUID types!',
            results: results,
            note: 'Tables recreated with user_id as UUID instead of INTEGER'
        });

    } catch (error) {
        console.error('Fix audit tables error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            hint: 'Check the logs for specific errors'
        });
    }
});

module.exports = router;
