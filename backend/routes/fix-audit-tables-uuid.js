const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// Migration route to fix audit tables (INTEGER → UUID)
router.post('/fix-audit-tables', async (req, res) => {
    try {
        console.log('🔧 Starting audit tables UUID migration...');

        // Drop and recreate security_audit_log with UUID
        await query(`
            DROP TABLE IF EXISTS security_audit_log CASCADE;

            CREATE TABLE security_audit_log (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                event_type VARCHAR(50) NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                details JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX idx_security_audit_user_id ON security_audit_log(user_id);
            CREATE INDEX idx_security_audit_event_type ON security_audit_log(event_type);
            CREATE INDEX idx_security_audit_created_at ON security_audit_log(created_at);
        `);

        console.log('✅ Security audit log table recreated with UUID');

        // Drop and recreate financial_audit_trail with UUID
        await query(`
            DROP TABLE IF EXISTS financial_audit_trail CASCADE;

            CREATE TABLE financial_audit_trail (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                transaction_type VARCHAR(50) NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id UUID NOT NULL,
                amount DECIMAL(10, 2),
                details JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX idx_financial_audit_user_id ON financial_audit_trail(user_id);
            CREATE INDEX idx_financial_audit_type ON financial_audit_trail(transaction_type);
            CREATE INDEX idx_financial_audit_created_at ON financial_audit_trail(created_at);
        `);

        console.log('✅ Financial audit trail table recreated with UUID');

        res.json({
            success: true,
            message: 'Audit tables successfully migrated to UUID',
            tables_updated: [
                'security_audit_log',
                'financial_audit_trail'
            ]
        });

    } catch (error) {
        console.error('❌ Migration failed:', error);
        res.status(500).json({
            success: false,
            error: 'Migration failed',
            message: error.message
        });
    }
});

module.exports = router;
