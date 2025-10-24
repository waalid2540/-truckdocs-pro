const { query } = require('../config/database');

/**
 * Log a financial transaction to the audit trail
 * @param {number} userId - The user ID performing the transaction
 * @param {string} transactionType - Type of transaction (e.g., 'invoice_created', 'booking_created')
 * @param {string} entityType - Type of entity (e.g., 'invoice', 'booking', 'expense')
 * @param {number} entityId - ID of the entity
 * @param {number} amount - Transaction amount (optional)
 * @param {object} details - Additional details about the transaction
 */
const logFinancialTransaction = async (userId, transactionType, entityType, entityId, amount = null, details = {}) => {
    try {
        await query(
            `INSERT INTO financial_audit_trail
             (user_id, transaction_type, entity_type, entity_id, amount, details)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, transactionType, entityType, entityId, amount, JSON.stringify(details)]
        );
        console.log(`📊 Audit: ${transactionType} - User ${userId} - ${entityType} #${entityId}`);
    } catch (error) {
        // Don't let audit logging failures break the main flow
        console.error('⚠️  Failed to log financial transaction:', error.message);
    }
};

/**
 * Log a security event
 * @param {number|null} userId - The user ID (null for anonymous events)
 * @param {string} eventType - Type of event (e.g., 'login_success', 'password_change')
 * @param {string} ipAddress - IP address of the request
 * @param {string} userAgent - User agent string
 * @param {object} details - Additional details about the event
 */
const logSecurityEvent = async (userId, eventType, ipAddress, userAgent, details = {}) => {
    try {
        await query(
            `INSERT INTO security_audit_log
             (user_id, event_type, ip_address, user_agent, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, eventType, ipAddress, userAgent, JSON.stringify(details)]
        );
        console.log(`🔒 Security: ${eventType} - User ${userId || 'anonymous'}`);
    } catch (error) {
        console.error('⚠️  Failed to log security event:', error.message);
    }
};

module.exports = {
    logFinancialTransaction,
    logSecurityEvent
};
