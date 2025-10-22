const express = require('express');
const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// GET /setup-load-board - Run load board database migration
router.get('/setup-load-board', async (req, res) => {
    try {
        // Read schema file
        const schemaPath = path.join(__dirname, '../database/load-board-schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        await query(schema);

        res.json({
            success: true,
            message: '🚛 Load Board database setup complete!',
            tables_created: [
                'loads',
                'load_bookings',
                'load_searches',
                'broker_profiles',
                'load_reviews',
                'load_views'
            ],
            views_created: [
                'active_loads_view',
                'broker_performance_view'
            ]
        });

    } catch (error) {
        console.error('Load board migration error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            hint: 'Make sure DATABASE_URL is set correctly'
        });
    }
});

module.exports = router;
