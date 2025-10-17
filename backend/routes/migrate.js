/**
 * MIGRATION ENDPOINT
 *
 * Visit /migrate in your browser to create database tables
 * WARNING: Only use this once during initial setup!
 */

const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const router = express.Router();

router.get('/migrate', async (req, res) => {
    try {
        // Create database connection
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        // Read schema file
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        await pool.query(schema);

        res.json({
            success: true,
            message: '✅ Database tables created successfully!',
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
        console.error('Migration error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            hint: 'Make sure DATABASE_URL is set correctly'
        });
    }
});

module.exports = router;
