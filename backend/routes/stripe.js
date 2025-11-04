const express = require('express');
const Stripe = require('stripe');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Initialize Stripe with secret key
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/stripe/create-checkout-session - Create subscription checkout
router.post('/create-checkout-session', authenticate, async (req, res) => {
    try {
        const user = req.user;

        // Check if user already has active subscription
        const existingSubscription = await query(
            'SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2',
            [user.id, 'active']
        );

        if (existingSubscription.rows.length > 0) {
            return res.status(400).json({
                error: 'You already have an active subscription'
            });
        }

        // Create or get Stripe customer
        let stripeCustomerId;

        const existingCustomer = await query(
            'SELECT stripe_customer_id FROM users WHERE id = $1',
            [user.id]
        );

        if (existingCustomer.rows[0].stripe_customer_id) {
            stripeCustomerId = existingCustomer.rows[0].stripe_customer_id;
        } else {
            // Create new Stripe customer
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.full_name,
                metadata: {
                    user_id: user.id.toString()
                }
            });

            stripeCustomerId = customer.id;

            // Save customer ID to database
            await query(
                'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
                [stripeCustomerId, user.id]
            );
        }

        // Create checkout session with 7-day free trial
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
            cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
            subscription_data: {
                trial_period_days: 7,
                metadata: {
                    user_id: user.id.toString()
                }
            },
            metadata: {
                user_id: user.id.toString()
            }
        });

        res.json({
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        console.error('Stripe checkout error:', error);
        res.status(500).json({
            error: 'Failed to create checkout session',
            message: error.message
        });
    }
});

// POST /api/stripe/create-portal-session - Customer portal for managing subscription
router.post('/create-portal-session', authenticate, async (req, res) => {
    try {
        const user = req.user;

        // Get user's Stripe customer ID
        const result = await query(
            'SELECT stripe_customer_id FROM users WHERE id = $1',
            [user.id]
        );

        if (!result.rows[0].stripe_customer_id) {
            return res.status(400).json({
                error: 'No subscription found'
            });
        }

        // Create portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: result.rows[0].stripe_customer_id,
            return_url: `${process.env.FRONTEND_URL}/settings`,
        });

        res.json({ url: session.url });

    } catch (error) {
        console.error('Portal session error:', error);
        res.status(500).json({
            error: 'Failed to create portal session',
            message: error.message
        });
    }
});

// GET /api/stripe/subscription-status - Check current subscription status
router.get('/subscription-status', authenticate, async (req, res) => {
    try {
        const user = req.user;

        // Get subscription from database
        const result = await query(
            `SELECT s.*, s.current_period_end as period_end, s.cancel_at_period_end
             FROM subscriptions s
             WHERE s.user_id = $1
             ORDER BY s.created_at DESC
             LIMIT 1`,
            [user.id]
        );

        if (result.rows.length === 0) {
            return res.json({
                hasSubscription: false,
                status: null,
                trialEnd: null,
                periodEnd: null
            });
        }

        const subscription = result.rows[0];

        res.json({
            hasSubscription: true,
            status: subscription.status,
            trialEnd: subscription.trial_end,
            periodEnd: subscription.period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end
        });

    } catch (error) {
        console.error('Subscription status error:', error);
        res.status(500).json({
            error: 'Failed to get subscription status',
            message: error.message
        });
    }
});

// POST /api/stripe/webhook - Handle Stripe webhook events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionUpdate(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;

            case 'invoice.paid':
                await handleInvoicePaid(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
});

// Helper function: Update subscription in database
async function handleSubscriptionUpdate(subscription) {
    const userId = subscription.metadata.user_id;

    if (!userId) {
        console.error('No user_id in subscription metadata');
        return;
    }

    await query(
        `INSERT INTO subscriptions (
            user_id, stripe_subscription_id, stripe_customer_id,
            status, current_period_start, current_period_end,
            trial_end, cancel_at_period_end
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (stripe_subscription_id)
        DO UPDATE SET
            status = $4,
            current_period_start = $5,
            current_period_end = $6,
            trial_end = $7,
            cancel_at_period_end = $8,
            updated_at = CURRENT_TIMESTAMP`,
        [
            userId,
            subscription.id,
            subscription.customer,
            subscription.status,
            new Date(subscription.current_period_start * 1000),
            new Date(subscription.current_period_end * 1000),
            subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            subscription.cancel_at_period_end
        ]
    );

    // Update user's subscription status
    await query(
        'UPDATE users SET subscription_status = $1 WHERE id = $2',
        [subscription.status, userId]
    );

    console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
}

// Helper function: Handle subscription deletion
async function handleSubscriptionDeleted(subscription) {
    const userId = subscription.metadata.user_id;

    if (!userId) {
        console.error('No user_id in subscription metadata');
        return;
    }

    await query(
        `UPDATE subscriptions
         SET status = 'canceled', updated_at = CURRENT_TIMESTAMP
         WHERE stripe_subscription_id = $1`,
        [subscription.id]
    );

    await query(
        'UPDATE users SET subscription_status = $1 WHERE id = $2',
        ['canceled', userId]
    );

    console.log(`Subscription canceled for user ${userId}`);
}

// Helper function: Handle successful payment
async function handleInvoicePaid(invoice) {
    console.log(`Invoice paid: ${invoice.id}`);
    // Additional logic if needed (e.g., send receipt email)
}

// Helper function: Handle failed payment
async function handlePaymentFailed(invoice) {
    console.log(`Payment failed for invoice: ${invoice.id}`);
    // Additional logic if needed (e.g., send payment failure email)
}

module.exports = router;
