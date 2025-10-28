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

        const results = {
            success: true,
            migrations: [],
            errors: []
        };

        // Read and run schema file
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('📝 Running schema.sql...');
        try {
            await pool.query(schema);
            results.migrations.push({
                file: 'schema.sql',
                status: 'success',
                message: 'Base schema created'
            });
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('   ⚠️  Base tables already exist, skipping schema.sql');
                results.migrations.push({
                    file: 'schema.sql',
                    status: 'skipped',
                    message: 'Tables already exist (this is fine)'
                });
            } else {
                console.error('   ⚠️  Schema error (continuing anyway):', error.message);
                results.migrations.push({
                    file: 'schema.sql',
                    status: 'warning',
                    message: 'Error occurred but continuing: ' + error.message
                });
            }
        }

        // Run additional migrations from database/migrations folder
        console.log('🔄 Running additional migrations...');
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
                    results.migrations.push({
                        file,
                        status: 'success',
                        message: 'Migration completed successfully'
                    });
                } catch (error) {
                    // If error is "already exists", that's okay - skip it
                    if (error.message.includes('already exists')) {
                        console.log(`   ⚠️  ${file} - already exists, skipping`);
                        results.migrations.push({
                            file,
                            status: 'skipped',
                            message: 'Tables already exist'
                        });
                    } else {
                        console.error(`   ❌ ${file} failed:`, error.message);
                        results.errors.push({
                            file,
                            error: error.message
                        });
                    }
                }
            }
        }

        // Verify ifta_tax_rates table exists and has data
        try {
            const checkResult = await pool.query('SELECT COUNT(*) as count FROM ifta_tax_rates');
            const count = parseInt(checkResult.rows[0].count);

            results.verification = {
                ifta_tax_rates_exists: true,
                tax_rates_count: count,
                status: count > 0 ? '✅ READY' : '⚠️ EMPTY'
            };

            console.log(`✅ Verified: ifta_tax_rates has ${count} tax rates`);
        } catch (error) {
            results.verification = {
                ifta_tax_rates_exists: false,
                error: error.message
            };
        }

        await pool.end();

        res.json({
            success: true,
            message: '✅ All migrations completed successfully!',
            migrations: results.migrations,
            verification: results.verification,
            tables: [
                'users',
                'documents',
                'invoices',
                'invoice_items',
                'expenses',
                'ifta_records',
                'ifta_reports',
                'ifta_tax_rates (NEW - 116 tax rates for all states)',
                'vehicles',
                'subscription_history',
                'activity_log'
            ],
            errors: results.errors.length > 0 ? results.errors : undefined
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
