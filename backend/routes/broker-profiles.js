const express = require('express');
const { query } = require('../config/database');
const { authenticate, requireSubscription } = require('../middleware/auth');

const router = express.Router();

// POST /api/broker-profiles - Create/Update broker profile
router.post('/', authenticate, requireSubscription, async (req, res) => {
    try {
        const {
            company_name, mc_number, dot_number, scac_code,
            office_phone, after_hours_phone, fax, website,
            address_line1, address_line2, city, state, zip,
            payment_terms, quick_pay_available, quick_pay_fee,
            cargo_insurance_amount, liability_insurance_amount, insurance_expiration,
            preferred_lanes, service_areas
        } = req.body;

        if (!company_name || !mc_number) {
            return res.status(400).json({ error: 'company_name and mc_number are required' });
        }

        // Check if profile exists
        const existing = await query(
            'SELECT * FROM broker_profiles WHERE user_id = $1',
            [req.user.id]
        );

        let result;

        if (existing.rows.length > 0) {
            // Update existing profile
            result = await query(
                `UPDATE broker_profiles SET
                    company_name = $1, mc_number = $2, dot_number = $3, scac_code = $4,
                    office_phone = $5, after_hours_phone = $6, fax = $7, website = $8,
                    address_line1 = $9, address_line2 = $10, city = $11, state = $12, zip = $13,
                    payment_terms = $14, quick_pay_available = $15, quick_pay_fee = $16,
                    cargo_insurance_amount = $17, liability_insurance_amount = $18,
                    insurance_expiration = $19, preferred_lanes = $20, service_areas = $21,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $22
                 RETURNING *`,
                [company_name, mc_number, dot_number, scac_code,
                 office_phone, after_hours_phone, fax, website,
                 address_line1, address_line2, city, state, zip,
                 payment_terms, quick_pay_available, quick_pay_fee,
                 cargo_insurance_amount, liability_insurance_amount,
                 insurance_expiration, preferred_lanes, service_areas,
                 req.user.id]
            );
        } else {
            // Create new profile
            result = await query(
                `INSERT INTO broker_profiles (
                    user_id, company_name, mc_number, dot_number, scac_code,
                    office_phone, after_hours_phone, fax, website,
                    address_line1, address_line2, city, state, zip,
                    payment_terms, quick_pay_available, quick_pay_fee,
                    cargo_insurance_amount, liability_insurance_amount,
                    insurance_expiration, preferred_lanes, service_areas
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
                RETURNING *`,
                [req.user.id, company_name, mc_number, dot_number, scac_code,
                 office_phone, after_hours_phone, fax, website,
                 address_line1, address_line2, city, state, zip,
                 payment_terms, quick_pay_available, quick_pay_fee,
                 cargo_insurance_amount, liability_insurance_amount,
                 insurance_expiration, preferred_lanes, service_areas]
            );
        }

        res.json({
            message: 'Broker profile saved successfully',
            profile: result.rows[0]
        });

    } catch (error) {
        console.error('Save broker profile error:', error);
        res.status(500).json({
            error: 'Failed to save broker profile',
            message: error.message
        });
    }
});

// GET /api/broker-profiles/my - Get my broker profile
router.get('/my', authenticate, requireSubscription, async (req, res) => {
    try {
        const result = await query(
            `SELECT bp.*, u.email, u.full_name
             FROM broker_profiles bp
             JOIN users u ON bp.user_id = u.id
             WHERE bp.user_id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Broker profile not found' });
        }

        res.json({ profile: result.rows[0] });

    } catch (error) {
        console.error('Get my broker profile error:', error);
        res.status(500).json({
            error: 'Failed to get broker profile',
            message: error.message
        });
    }
});

// GET /api/broker-profiles/:id - Get broker profile by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const result = await query(
            `SELECT bp.*, u.full_name, u.email,
                    (SELECT AVG(rating) FROM load_reviews WHERE reviewee_id = bp.user_id) as avg_rating,
                    (SELECT COUNT(*) FROM load_reviews WHERE reviewee_id = bp.user_id) as review_count
             FROM broker_profiles bp
             JOIN users u ON bp.user_id = u.id
             WHERE bp.id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Broker profile not found' });
        }

        res.json({ profile: result.rows[0] });

    } catch (error) {
        console.error('Get broker profile error:', error);
        res.status(500).json({
            error: 'Failed to get broker profile',
            message: error.message
        });
    }
});

// GET /api/broker-profiles/search - Search brokers
router.get('/search', authenticate, async (req, res) => {
    try {
        const { mc_number, company_name, state, min_rating } = req.query;

        let queryText = `
            SELECT bp.*, u.full_name,
                   (SELECT AVG(rating) FROM load_reviews WHERE reviewee_id = bp.user_id) as avg_rating,
                   (SELECT COUNT(*) FROM load_reviews WHERE reviewee_id = bp.user_id) as review_count
            FROM broker_profiles bp
            JOIN users u ON bp.user_id = u.id
            WHERE 1=1
        `;
        const queryParams = [];
        let paramCount = 0;

        if (mc_number) {
            paramCount++;
            queryText += ` AND bp.mc_number = $${paramCount}`;
            queryParams.push(mc_number);
        }

        if (company_name) {
            paramCount++;
            queryText += ` AND LOWER(bp.company_name) LIKE LOWER($${paramCount})`;
            queryParams.push(`%${company_name}%`);
        }

        if (state) {
            paramCount++;
            queryText += ` AND bp.state = $${paramCount}`;
            queryParams.push(state);
        }

        queryText += ` ORDER BY bp.average_rating DESC, bp.loads_completed DESC`;

        const result = await query(queryText, queryParams);

        // Filter by min_rating if specified (after aggregation)
        let profiles = result.rows;
        if (min_rating) {
            profiles = profiles.filter(p => parseFloat(p.avg_rating) >= parseFloat(min_rating));
        }

        res.json({ profiles });

    } catch (error) {
        console.error('Search brokers error:', error);
        res.status(500).json({
            error: 'Failed to search brokers',
            message: error.message
        });
    }
});

// GET /api/broker-profiles/:id/stats - Get broker statistics
router.get('/:id/stats', authenticate, async (req, res) => {
    try {
        const stats = await query(
            `SELECT
                COUNT(DISTINCT l.id) as total_loads_posted,
                COUNT(DISTINCT CASE WHEN l.status = 'completed' THEN l.id END) as completed_loads,
                COUNT(DISTINCT lb.id) as total_bookings,
                AVG(CASE WHEN lb.status = 'completed' THEN lb.agreed_rate END) as avg_load_rate,
                SUM(CASE WHEN lb.status = 'completed' THEN lb.agreed_rate ELSE 0 END) as total_revenue,
                AVG(CASE WHEN lb.status = 'completed' AND lr.rating IS NOT NULL THEN lr.rating END) as avg_driver_rating
             FROM broker_profiles bp
             LEFT JOIN loads l ON bp.user_id = l.broker_id
             LEFT JOIN load_bookings lb ON l.id = lb.load_id
             LEFT JOIN load_reviews lr ON lb.id = lr.booking_id AND lr.reviewer_type = 'driver'
             WHERE bp.id = $1
             GROUP BY bp.id`,
            [req.params.id]
        );

        res.json({ stats: stats.rows[0] || {} });

    } catch (error) {
        console.error('Get broker stats error:', error);
        res.status(500).json({
            error: 'Failed to get broker stats',
            message: error.message
        });
    }
});

module.exports = router;
