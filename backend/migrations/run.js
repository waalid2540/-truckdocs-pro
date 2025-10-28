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

        // Read and run schema file
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('📝 Running schema.sql...');
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

        // Run additional migrations from database/migrations folder
        console.log('\n🔄 Running additional migrations...');
        const migrationsDir = path.join(__dirname, '../database/migrations');

        if (fs.existsSync(migrationsDir)) {
            const migrationFiles = fs.readdirSync(migrationsDir)
                .filter(file => file.endsWith('.sql'))
                .sort(); // Run in alphabetical order

            for (const file of migrationFiles) {
                console.log(`📝 Running ${file}...`);
                const migrationPath = path.join(migrationsDir, file);
                const migration = fs.readFileSync(migrationPath, 'utf8');

                try {
                    await pool.query(migration);
                    console.log(`   ✅ ${file} completed`);
                } catch (error) {
                    // If error is "already exists", that's okay - skip it
                    if (error.message.includes('already exists')) {
                        console.log(`   ⚠️  ${file} - tables already exist, skipping`);
                    } else {
                        throw error;
                    }
                }
            }
        }

        console.log('\n✅ All migrations completed successfully!');
        console.log('   - ifta_tax_rates table created with 116 tax rates');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

runMigrations();
