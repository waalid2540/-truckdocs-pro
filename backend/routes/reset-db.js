/**
 * DATABASE RESET ENDPOINT
 *
 * WARNING: This will DROP all tables and recreate them!
 * Only use during development/initial setup
 *
 * Visit /reset-database?confirm=yes to execute
 */

const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const router = express.Router();

router.get('/reset-database', async (req, res) => {
    // Safety check - require confirmation
    if (req.query.confirm !== 'yes') {
        return res.json({
            warning: 'This will DELETE ALL DATA and recreate tables!',
            instruction: 'Add ?confirm=yes to the URL to proceed',
            example: '/reset-database?confirm=yes'
        });
    }

    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        // Drop all tables
        await pool.query(`
            DROP TABLE IF EXISTS activity_log CASCADE;
            DROP TABLE IF EXISTS subscription_history CASCADE;
            DROP TABLE IF EXISTS vehicles CASCADE;
            DROP TABLE IF EXISTS expenses CASCADE;
            DROP TABLE IF EXISTS invoice_items CASCADE;
            DROP TABLE IF EXISTS invoices CASCADE;
            DROP TABLE IF EXISTS ifta_reports CASCADE;
            DROP TABLE IF EXISTS ifta_records CASCADE;
            DROP TABLE IF EXISTS documents CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
        `);

        // Read and execute schema
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schema);

        await pool.end();

        res.json({
            success: true,
            message: '✅ Database reset successfully!',
            note: 'All tables dropped and recreated with correct schema',
            tables: [
                'users',
                'documents',
                'invoices',
                'invoice_items',
                'expenses',
                'ifta_records',
                'ifta_reports',
                'vehicles',
                'subscription_history',
                'activity_log'
            ]
        });

    } catch (error) {
        console.error('Database reset error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            hint: 'Check DATABASE_URL and database permissions'
        });
    }
});

module.exports = router;
