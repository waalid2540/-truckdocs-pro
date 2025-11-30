-- Security Enhancements Migration
-- Adds account lockout and security tracking fields to users table

-- Add account lockout fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_successful_login TIMESTAMP;

-- Add refresh token support
ALTER TABLE users
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMP;

-- Create security audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'login_success', 'login_failed', 'account_locked', 'password_reset', etc.
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON security_audit_log(created_at);

-- Create financial audit trail table
CREATE TABLE IF NOT EXISTS financial_audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'invoice_created', 'invoice_paid', 'booking_created', 'expense_added', etc.
    entity_type VARCHAR(50) NOT NULL, -- 'invoice', 'booking', 'expense', etc.
    entity_id UUID NOT NULL,
    amount DECIMAL(10, 2),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_financial_audit_user_id ON financial_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_audit_type ON financial_audit_trail(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_audit_created_at ON financial_audit_trail(created_at);

-- Grant permissions (if using specific database user)
-- GRANT SELECT, INSERT, UPDATE ON security_audit_log TO your_db_user;
-- GRANT SELECT, INSERT, UPDATE ON financial_audit_trail TO your_db_user;

COMMENT ON TABLE security_audit_log IS 'Tracks all security-related events for compliance and monitoring';
COMMENT ON TABLE financial_audit_trail IS 'Tracks all financial transactions for audit compliance';
