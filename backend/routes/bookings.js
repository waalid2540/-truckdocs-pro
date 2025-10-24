const express = require('express');
const { query, getClient } = require('../config/database');
const { authenticate, requireSubscription } = require('../middleware/auth');
const { logFinancialTransaction } = require('../utils/audit-logger');

const router = express.Router();

// POST /api/bookings - Book a load (DRIVERS)
router.post('/', authenticate, requireSubscription, async (req, res) => {
    const client = await getClient();

    try {
        await client.query('BEGIN');

        const {
            load_id,
            agreed_rate,
            truck_number,
            trailer_number,
            driver_license,
            notes
        } = req.body;

        if (!load_id || !agreed_rate) {
            return res.status(400).json({ error: 'load_id and agreed_rate are required' });
        }

        // Check if load exists and is available
        const loadResult = await client.query(
            'SELECT * FROM loads WHERE id = $1 AND status = $2',
            [load_id, 'available']
        );

        if (loadResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Load not available' });
        }

        const load = loadResult.rows[0];

        // Check if driver already booked this load
        const existingBooking = await client.query(
            'SELECT * FROM load_bookings WHERE load_id = $1 AND driver_id = $2',
            [load_id, req.user.id]
        );

        if (existingBooking.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'You have already booked this load' });
        }

        // Create booking
        const bookingResult = await client.query(
            `INSERT INTO load_bookings (
                load_id, driver_id, broker_id, agreed_rate,
                truck_number, trailer_number, driver_license,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
            RETURNING *`,
            [load_id, req.user.id, load.broker_id, agreed_rate,
             truck_number, trailer_number, driver_license]
        );

        await client.query('COMMIT');

        const booking = bookingResult.rows[0];

        // Log to audit trail
        await logFinancialTransaction(
            req.user.id,
            'booking_created',
            'booking',
            booking.id,
            agreed_rate,
            { load_id, status: 'pending', broker_id: load.broker_id }
        );

        res.status(201).json({
            message: 'Load booked successfully! Waiting for broker confirmation.',
            booking: booking
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Book load error:', error);
        res.status(500).json({
            error: 'Failed to book load',
            message: error.message
        });
    } finally {
        client.release();
    }
});

// PUT /api/bookings/:id/confirm - Confirm booking (BROKERS)
router.put('/:id/confirm', authenticate, requireSubscription, async (req, res) => {
    try {
        const { rate_confirmation_number } = req.body;

        const result = await query(
            `UPDATE load_bookings lb SET
                status = 'confirmed',
                rate_confirmation_number = $1,
                confirmed_at = CURRENT_TIMESTAMP
             FROM loads l
             WHERE lb.id = $2
               AND lb.load_id = l.id
               AND l.broker_id = $3
               AND lb.status = 'pending'
             RETURNING lb.*`,
            [rate_confirmation_number, req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found or already confirmed' });
        }

        const booking = result.rows[0];

        // Log to audit trail
        await logFinancialTransaction(
            req.user.id,
            'booking_confirmed',
            'booking',
            booking.id,
            booking.agreed_rate,
            { rate_confirmation_number, status: 'confirmed' }
        );

        res.json({
            message: 'Booking confirmed!',
            booking: booking
        });

    } catch (error) {
        console.error('Confirm booking error:', error);
        res.status(500).json({
            error: 'Failed to confirm booking',
            message: error.message
        });
    }
});

// PUT /api/bookings/:id/reject - Reject booking (BROKERS)
router.put('/:id/reject', authenticate, requireSubscription, async (req, res) => {
    try {
        const { reason } = req.body;

        const result = await query(
            `UPDATE load_bookings lb SET
                status = 'rejected',
                cancellation_reason = $1,
                cancelled_at = CURRENT_TIMESTAMP,
                cancelled_by = $2
             FROM loads l
             WHERE lb.id = $3
               AND lb.load_id = l.id
               AND l.broker_id = $2
               AND lb.status = 'pending'
             RETURNING lb.*`,
            [reason, req.user.id, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json({
            message: 'Booking rejected',
            booking: result.rows[0]
        });

    } catch (error) {
        console.error('Reject booking error:', error);
        res.status(500).json({
            error: 'Failed to reject booking',
            message: error.message
        });
    }
});

// PUT /api/bookings/:id/pickup - Mark as picked up (DRIVERS)
router.put('/:id/pickup', authenticate, requireSubscription, async (req, res) => {
    try {
        const { bol_number, pickup_signature } = req.body;

        const result = await query(
            `UPDATE load_bookings SET
                status = 'in_transit',
                bol_number = $1,
                pickup_signature = $2,
                picked_up_at = CURRENT_TIMESTAMP
             WHERE id = $3 AND driver_id = $4 AND status = 'confirmed'
             RETURNING *`,
            [bol_number, pickup_signature, req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found or not confirmed' });
        }

        // Update load status
        await query(
            'UPDATE loads SET status = $1 WHERE id = $2',
            ['in_transit', result.rows[0].load_id]
        );

        res.json({
            message: 'Load picked up!',
            booking: result.rows[0]
        });

    } catch (error) {
        console.error('Pickup error:', error);
        res.status(500).json({
            error: 'Failed to mark as picked up',
            message: error.message
        });
    }
});

// PUT /api/bookings/:id/deliver - Mark as delivered (DRIVERS)
router.put('/:id/deliver', authenticate, requireSubscription, async (req, res) => {
    try {
        const { delivery_signature, pod_url } = req.body;

        const result = await query(
            `UPDATE load_bookings SET
                status = 'delivered',
                delivery_signature = $1,
                pod_url = $2,
                delivered_at = CURRENT_TIMESTAMP
             WHERE id = $3 AND driver_id = $4 AND status = 'in_transit'
             RETURNING *`,
            [delivery_signature, pod_url, req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found or not in transit' });
        }

        // Update load status
        await query(
            'UPDATE loads SET status = $1 WHERE id = $2',
            ['delivered', result.rows[0].load_id]
        );

        res.json({
            message: 'Load delivered! Waiting for broker to complete.',
            booking: result.rows[0]
        });

    } catch (error) {
        console.error('Deliver error:', error);
        res.status(500).json({
            error: 'Failed to mark as delivered',
            message: error.message
        });
    }
});

// PUT /api/bookings/:id/complete - Complete booking (BROKERS - confirms payment)
router.put('/:id/complete', authenticate, requireSubscription, async (req, res) => {
    try {
        const { payment_date, invoice_id } = req.body;

        const result = await query(
            `UPDATE load_bookings lb SET
                status = 'completed',
                payment_status = 'paid',
                payment_date = $1,
                invoice_id = $2,
                completed_at = CURRENT_TIMESTAMP
             FROM loads l
             WHERE lb.id = $3
               AND lb.load_id = l.id
               AND l.broker_id = $4
               AND lb.status = 'delivered'
             RETURNING lb.*`,
            [payment_date, invoice_id, req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found or not delivered' });
        }

        const booking = result.rows[0];

        // Update load status
        await query(
            'UPDATE loads SET status = $1 WHERE id = $2',
            ['completed', booking.load_id]
        );

        // Log to audit trail
        await logFinancialTransaction(
            req.user.id,
            'booking_completed',
            'booking',
            booking.id,
            booking.agreed_rate,
            { payment_date, invoice_id, status: 'completed', payment_status: 'paid' }
        );

        res.json({
            message: 'Booking completed!',
            booking: booking
        });

    } catch (error) {
        console.error('Complete booking error:', error);
        res.status(500).json({
            error: 'Failed to complete booking',
            message: error.message
        });
    }
});

// GET /api/bookings/my/driver - Get bookings as driver
router.get('/my/driver', authenticate, requireSubscription, async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        let queryText = `
            SELECT lb.*,
                   l.origin_city, l.origin_state, l.destination_city, l.destination_state,
                   l.pickup_date, l.equipment_type, l.total_rate,
                   l.broker_company, l.contact_phone,
                   bp.company_name as broker_company_name,
                   bp.average_rating as broker_rating
            FROM load_bookings lb
            JOIN loads l ON lb.load_id = l.id
            LEFT JOIN broker_profiles bp ON lb.broker_id = bp.user_id
            WHERE lb.driver_id = $1
        `;
        const queryParams = [req.user.id];

        if (status) {
            queryText += ` AND lb.status = $2`;
            queryParams.push(status);
            queryText += ` ORDER BY lb.booked_at DESC LIMIT $3 OFFSET $4`;
            queryParams.push(parseInt(limit), parseInt(offset));
        } else {
            queryText += ` ORDER BY lb.booked_at DESC LIMIT $2 OFFSET $3`;
            queryParams.push(parseInt(limit), parseInt(offset));
        }

        const result = await query(queryText, queryParams);

        res.json({
            bookings: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        console.error('Get driver bookings error:', error);
        res.status(500).json({
            error: 'Failed to get bookings',
            message: error.message
        });
    }
});

// GET /api/bookings/my/broker - Get bookings as broker
router.get('/my/broker', authenticate, requireSubscription, async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        let queryText = `
            SELECT lb.*,
                   l.origin_city, l.origin_state, l.destination_city, l.destination_state,
                   l.pickup_date, l.equipment_type, l.load_number,
                   u.full_name as driver_name,
                   u.email as driver_email,
                   u.phone as driver_phone
            FROM load_bookings lb
            JOIN loads l ON lb.load_id = l.id
            JOIN users u ON lb.driver_id = u.id
            WHERE lb.broker_id = $1
        `;
        const queryParams = [req.user.id];

        if (status) {
            queryText += ` AND lb.status = $2`;
            queryParams.push(status);
            queryText += ` ORDER BY lb.booked_at DESC LIMIT $3 OFFSET $4`;
            queryParams.push(parseInt(limit), parseInt(offset));
        } else {
            queryText += ` ORDER BY lb.booked_at DESC LIMIT $2 OFFSET $3`;
            queryParams.push(parseInt(limit), parseInt(offset));
        }

        const result = await query(queryText, queryParams);

        res.json({
            bookings: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        console.error('Get broker bookings error:', error);
        res.status(500).json({
            error: 'Failed to get bookings',
            message: error.message
        });
    }
});

// GET /api/bookings/:id - Get booking details
router.get('/:id', authenticate, requireSubscription, async (req, res) => {
    try {
        const result = await query(
            `SELECT lb.*,
                    l.*,
                    bp.company_name as broker_company_name,
                    bp.average_rating as broker_rating,
                    driver.full_name as driver_name,
                    driver.email as driver_email,
                    driver.phone as driver_phone
             FROM load_bookings lb
             JOIN loads l ON lb.load_id = l.id
             LEFT JOIN broker_profiles bp ON lb.broker_id = bp.user_id
             LEFT JOIN users driver ON lb.driver_id = driver.id
             WHERE lb.id = $1
               AND (lb.driver_id = $2 OR lb.broker_id = $2)`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json({ booking: result.rows[0] });

    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({
            error: 'Failed to get booking',
            message: error.message
        });
    }
});

module.exports = router;
