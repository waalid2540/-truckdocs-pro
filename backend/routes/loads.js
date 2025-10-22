const express = require('express');
const { query, getClient } = require('../config/database');
const { authenticate, requireSubscription } = require('../middleware/auth');

const router = express.Router();

// POST /api/loads - Create new load (BROKERS ONLY)
router.post('/', authenticate, requireSubscription, async (req, res) => {
    try {
        const {
            origin_city, origin_state, origin_zip, origin_address,
            destination_city, destination_state, destination_zip, destination_address,
            pickup_date, pickup_time_start, pickup_time_end,
            delivery_date, delivery_time_start, delivery_time_end,
            equipment_type, weight, length, commodity, load_number,
            total_rate, rate_per_mile, distance_miles, fuel_surcharge,
            broker_company, broker_mc_number, broker_dot_number,
            contact_name, contact_phone, contact_email,
            requires_hazmat, requires_team_driver, requires_tsa, requires_twic,
            age_requirement, notes, special_instructions, stops, expires_at
        } = req.body;

        // Validation
        if (!origin_city || !origin_state || !destination_city || !destination_state ||
            !pickup_date || !equipment_type || !total_rate) {
            return res.status(400).json({
                error: 'Required fields: origin_city, origin_state, destination_city, destination_state, pickup_date, equipment_type, total_rate'
            });
        }

        const result = await query(
            `INSERT INTO loads (
                broker_id, origin_city, origin_state, origin_zip, origin_address,
                destination_city, destination_state, destination_zip, destination_address,
                pickup_date, pickup_time_start, pickup_time_end,
                delivery_date, delivery_time_start, delivery_time_end,
                equipment_type, weight, length, commodity, load_number,
                total_rate, rate_per_mile, distance_miles, fuel_surcharge,
                broker_company, broker_mc_number, broker_dot_number,
                contact_name, contact_phone, contact_email,
                requires_hazmat, requires_team_driver, requires_tsa, requires_twic,
                age_requirement, notes, special_instructions, stops, expires_at, external_source
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27,
                $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, 'internal'
            ) RETURNING *`,
            [
                req.user.id, origin_city, origin_state, origin_zip, origin_address,
                destination_city, destination_state, destination_zip, destination_address,
                pickup_date, pickup_time_start, pickup_time_end,
                delivery_date, delivery_time_start, delivery_time_end,
                equipment_type, weight, length, commodity, load_number,
                total_rate, rate_per_mile, distance_miles, fuel_surcharge,
                broker_company, broker_mc_number, broker_dot_number,
                contact_name, contact_phone, contact_email,
                requires_hazmat, requires_team_driver, requires_tsa, requires_twic,
                age_requirement, notes, special_instructions, stops, expires_at
            ]
        );

        // Update broker stats
        await query(
            'UPDATE broker_profiles SET loads_posted = loads_posted + 1 WHERE user_id = $1',
            [req.user.id]
        );

        res.status(201).json({
            message: 'Load posted successfully!',
            load: result.rows[0]
        });

    } catch (error) {
        console.error('Create load error:', error);
        res.status(500).json({
            error: 'Failed to create load',
            message: error.message
        });
    }
});

// GET /api/loads/search - Search available loads
router.get('/search', authenticate, async (req, res) => {
    try {
        const {
            origin_state, origin_city, origin_radius = 50,
            destination_state, destination_city, destination_radius = 50,
            equipment_type, min_rate, max_weight, min_weight,
            pickup_date_start, pickup_date_end,
            sort_by = 'posted_at', sort_order = 'DESC',
            limit = 50, offset = 0
        } = req.query;

        let queryText = `
            SELECT l.*, bp.company_name as broker_company_name,
                   bp.average_rating as broker_rating,
                   bp.on_time_payment_score,
                   bp.quick_pay_available,
                   (SELECT COUNT(*) FROM load_views WHERE load_id = l.id) as view_count
            FROM loads l
            LEFT JOIN broker_profiles bp ON l.broker_id = bp.user_id
            WHERE l.status = 'available'
              AND (l.expires_at IS NULL OR l.expires_at > CURRENT_TIMESTAMP)
        `;

        const queryParams = [];
        let paramCount = 0;

        // Origin filters
        if (origin_state) {
            paramCount++;
            queryText += ` AND l.origin_state = $${paramCount}`;
            queryParams.push(origin_state);
        }
        if (origin_city) {
            paramCount++;
            queryText += ` AND LOWER(l.origin_city) LIKE LOWER($${paramCount})`;
            queryParams.push(`%${origin_city}%`);
        }

        // Destination filters
        if (destination_state) {
            paramCount++;
            queryText += ` AND l.destination_state = $${paramCount}`;
            queryParams.push(destination_state);
        }
        if (destination_city) {
            paramCount++;
            queryText += ` AND LOWER(l.destination_city) LIKE LOWER($${paramCount})`;
            queryParams.push(`%${destination_city}%`);
        }

        // Equipment type
        if (equipment_type) {
            paramCount++;
            queryText += ` AND l.equipment_type = $${paramCount}`;
            queryParams.push(equipment_type);
        }

        // Rate filter
        if (min_rate) {
            paramCount++;
            queryText += ` AND l.rate_per_mile >= $${paramCount}`;
            queryParams.push(parseFloat(min_rate));
        }

        // Weight filters
        if (min_weight) {
            paramCount++;
            queryText += ` AND l.weight >= $${paramCount}`;
            queryParams.push(parseFloat(min_weight));
        }
        if (max_weight) {
            paramCount++;
            queryText += ` AND l.weight <= $${paramCount}`;
            queryParams.push(parseFloat(max_weight));
        }

        // Pickup date filters
        if (pickup_date_start) {
            paramCount++;
            queryText += ` AND l.pickup_date >= $${paramCount}`;
            queryParams.push(pickup_date_start);
        }
        if (pickup_date_end) {
            paramCount++;
            queryText += ` AND l.pickup_date <= $${paramCount}`;
            queryParams.push(pickup_date_end);
        }

        // Sorting
        const validSortFields = ['posted_at', 'pickup_date', 'total_rate', 'rate_per_mile', 'distance_miles'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'posted_at';
        const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        queryText += ` ORDER BY l.${sortField} ${sortDirection}`;

        // Pagination
        paramCount++;
        queryText += ` LIMIT $${paramCount}`;
        queryParams.push(parseInt(limit));

        paramCount++;
        queryText += ` OFFSET $${paramCount}`;
        queryParams.push(parseInt(offset));

        const result = await query(queryText, queryParams);

        // Get total count
        let countQuery = `SELECT COUNT(*) FROM loads l WHERE l.status = 'available' AND (l.expires_at IS NULL OR l.expires_at > CURRENT_TIMESTAMP)`;
        const countResult = await query(countQuery);

        res.json({
            loads: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Search loads error:', error);
        res.status(500).json({
            error: 'Failed to search loads',
            message: error.message
        });
    }
});

// GET /api/loads/:id - Get single load details
router.get('/:id', authenticate, async (req, res) => {
    try {
        const result = await query(
            `SELECT l.*, bp.company_name as broker_company_name,
                    bp.average_rating as broker_rating,
                    bp.on_time_payment_score,
                    bp.quick_pay_available,
                    bp.payment_terms,
                    u.email as broker_email,
                    u.full_name as broker_name
             FROM loads l
             LEFT JOIN broker_profiles bp ON l.broker_id = bp.user_id
             LEFT JOIN users u ON l.broker_id = u.id
             WHERE l.id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Load not found' });
        }

        // Track view (analytics)
        await query(
            'INSERT INTO load_views (load_id, viewer_id) VALUES ($1, $2)',
            [req.params.id, req.user.id]
        ).catch(err => console.log('View tracking error:', err));

        res.json({ load: result.rows[0] });

    } catch (error) {
        console.error('Get load error:', error);
        res.status(500).json({
            error: 'Failed to get load',
            message: error.message
        });
    }
});

// PUT /api/loads/:id - Update load (BROKER WHO POSTED IT)
router.put('/:id', authenticate, requireSubscription, async (req, res) => {
    try {
        const {
            origin_city, origin_state, destination_city, destination_state,
            pickup_date, equipment_type, total_rate, rate_per_mile,
            weight, length, commodity, notes, status
        } = req.body;

        const result = await query(
            `UPDATE loads SET
                origin_city = COALESCE($1, origin_city),
                origin_state = COALESCE($2, origin_state),
                destination_city = COALESCE($3, destination_city),
                destination_state = COALESCE($4, destination_state),
                pickup_date = COALESCE($5, pickup_date),
                equipment_type = COALESCE($6, equipment_type),
                total_rate = COALESCE($7, total_rate),
                rate_per_mile = COALESCE($8, rate_per_mile),
                weight = COALESCE($9, weight),
                length = COALESCE($10, length),
                commodity = COALESCE($11, commodity),
                notes = COALESCE($12, notes),
                status = COALESCE($13, status),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $14 AND broker_id = $15
             RETURNING *`,
            [origin_city, origin_state, destination_city, destination_state,
             pickup_date, equipment_type, total_rate, rate_per_mile,
             weight, length, commodity, notes, status,
             req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Load not found or unauthorized' });
        }

        res.json({
            message: 'Load updated successfully',
            load: result.rows[0]
        });

    } catch (error) {
        console.error('Update load error:', error);
        res.status(500).json({
            error: 'Failed to update load',
            message: error.message
        });
    }
});

// DELETE /api/loads/:id - Delete load (BROKER WHO POSTED IT)
router.delete('/:id', authenticate, requireSubscription, async (req, res) => {
    try {
        const result = await query(
            'DELETE FROM loads WHERE id = $1 AND broker_id = $2 RETURNING id',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Load not found or unauthorized' });
        }

        res.json({ message: 'Load deleted successfully' });

    } catch (error) {
        console.error('Delete load error:', error);
        res.status(500).json({
            error: 'Failed to delete load',
            message: error.message
        });
    }
});

// GET /api/loads/my/posted - Get loads posted by broker
router.get('/my/posted', authenticate, requireSubscription, async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        let queryText = `
            SELECT l.*,
                   (SELECT COUNT(*) FROM load_bookings WHERE load_id = l.id) as booking_count,
                   (SELECT COUNT(*) FROM load_views WHERE load_id = l.id) as view_count
            FROM loads l
            WHERE l.broker_id = $1
        `;
        const queryParams = [req.user.id];

        if (status) {
            queryText += ` AND l.status = $2`;
            queryParams.push(status);
            queryText += ` ORDER BY l.posted_at DESC LIMIT $3 OFFSET $4`;
            queryParams.push(parseInt(limit), parseInt(offset));
        } else {
            queryText += ` ORDER BY l.posted_at DESC LIMIT $2 OFFSET $3`;
            queryParams.push(parseInt(limit), parseInt(offset));
        }

        const result = await query(queryText, queryParams);

        res.json({
            loads: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        console.error('Get my loads error:', error);
        res.status(500).json({
            error: 'Failed to get loads',
            message: error.message
        });
    }
});

module.exports = router;
