/**
 * DATABASE MIGRATION SCRIPT
 *
 * Run this to create all tables in your PostgreSQL database
 *
 * Usage: node migrations/run.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigrations() {
    try {
        console.log('🔄 Starting database migrations...');
        console.log(`📡 Connecting to: ${process.env.DATABASE_URL ? 'Database configured' : 'No database URL'}`);

        // Read schema file
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('📝 Running schema.sql...');

        // Execute schema
        await pool.query(schema);

        console.log('✅ Database tables created successfully!');
        console.log('\n📊 Tables created:');
        console.log('   - users');
        console.log('   - documents');
        console.log('   - invoices');
        console.log('   - invoice_items');
        console.log('   - expenses');
        console.log('   - ifta_records');
        console.log('   - ifta_reports');
        console.log('   - vehicles');
        console.log('   - subscription_history');
        console.log('   - activity_log');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

runMigrations();
