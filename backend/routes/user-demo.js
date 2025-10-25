const express = require('express');

const router = express.Router();

// GET /api/user/dashboard - Get dashboard summary (DEMO)
router.get('/dashboard', async (req, res) => {
    try {
        // Return demo stats
        res.json({
            documents: {
                count: 12
            },
            invoices: {
                total: 5,
                paid: 3500.00,
                unpaid: 1500.00
            },
            expenses: {
                count: 23,
                total: 2847.50
            },
            ifta: {
                count: 8,
                gallons: 245.50,
                cost: 892.15
            }
        });

    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({
            error: 'Failed to get dashboard',
            message: error.message
        });
    }
});

// GET /api/user/profile - Get user profile (DEMO)
router.get('/profile', async (req, res) => {
    try {
        res.json({
            user: {
                id: '1',
                email: 'demo@truckdocs.com',
                full_name: 'Demo Driver',
                phone: '555-0123',
                company_name: 'Demo Trucking',
                truck_number: 'T-001',
                subscription_status: 'trial',
                subscription_tier: 'solo',
                trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                created_at: new Date()
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            error: 'Failed to get profile',
            message: error.message
        });
    }
});

module.exports = router;
