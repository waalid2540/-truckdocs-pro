const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { logFinancialTransaction } = require('../utils/audit-logger');

const router = express.Router();

// Pricing configuration (prices in cents)
const PRICING = {
    pro_monthly: 1999,      // $19.99/month - Unlimited everything
};

// POST /api/subscription/create-checkout - Create Stripe checkout session
router.post('/create-checkout', authenticate, async (req, res) => {
    try {
        const { tier, billing_period } = req.body; // tier: pro | billing_period: monthly

        if (!tier || !billing_period) {
            return res.status(400).json({
                error: 'tier and billing_period are required'
            });
        }

        const priceKey = `${tier}_${billing_period}`;
        const price = PRICING[priceKey];

        if (!price) {
            return res.status(400).json({
                error: 'Invalid tier or billing period. Only pro_monthly is available.'
            });
        }

        // Get or create Stripe customer
        let stripeCustomerId = req.user.stripe_customer_id;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: req.user.email,
                metadata: {
                    user_id: req.user.id
                }
            });

            stripeCustomerId = customer.id;

            // Update user with Stripe customer ID
            await query(
                'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
                [stripeCustomerId, req.user.id]
            );
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `FreightHub Pro - ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
                            description: `${billing_period === 'monthly' ? 'Monthly' : 'Yearly'} subscription - Complete Trucking Command Center`
                        },
                        unit_amount: price,
                        recurring: {
                            interval: billing_period === 'monthly' ? 'month' : 'year'
                        }
                    },
                    quantity: 1
                }
            ],
            success_url: `${process.env.FRONTEND_URL}/dashboard?subscription=success`,
            cancel_url: `${process.env.FRONTEND_URL}/pricing?subscription=cancelled`,
            metadata: {
                user_id: req.user.id,
                tier: tier,
                billing_period: billing_period
            }
        });

        res.json({
            checkout_url: session.url,
            session_id: session.id
        });

    } catch (error) {
        console.error('Create checkout error:', error);
        res.status(500).json({
            error: 'Failed to create checkout session',
            message: error.message
        });
    }
});

// POST /api/subscription/webhook - Stripe webhook handler
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
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });

    } catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({
            error: 'Webhook handler failed'
        });
    }
});

// Helper: Handle successful checkout
async function handleCheckoutCompleted(session) {
    const userId = session.metadata.user_id;
    const tier = session.metadata.tier;
    const billingPeriod = session.metadata.billing_period;
    const subscriptionId = session.subscription;
    const amountPaid = session.amount_total / 100; // Convert from cents

    // Update user subscription
    const subscriptionEndsAt = new Date();
    if (billingPeriod === 'yearly') {
        subscriptionEndsAt.setFullYear(subscriptionEndsAt.getFullYear() + 1);
    } else {
        subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);
    }

    await query(
        `UPDATE users SET
            subscription_status = 'active',
            subscription_tier = $1,
            stripe_subscription_id = $2,
            subscription_ends_at = $3,
            updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [tier, subscriptionId, subscriptionEndsAt, userId]
    );

    // Log to financial audit trail
    await logFinancialTransaction(
        userId,
        'subscription_activated',
        'subscription',
        subscriptionId,
        amountPaid,
        { tier, billing_period: billingPeriod, stripe_session_id: session.id }
    );

    console.log(`✅ Subscription activated for user ${userId} - ${tier} (${billingPeriod})`);
}

// Helper: Handle subscription update
async function handleSubscriptionUpdated(subscription) {
    const customerId = subscription.customer;

    // Get user by Stripe customer ID
    const userResult = await query(
        'SELECT id FROM users WHERE stripe_customer_id = $1',
        [customerId]
    );

    if (userResult.rows.length === 0) {
        console.error('User not found for customer:', customerId);
        return;
    }

    const userId = userResult.rows[0].id;

    // Update subscription status
    const status = subscription.status === 'active' ? 'active' : subscription.status;
    const endsAt = new Date(subscription.current_period_end * 1000);

    await query(
        `UPDATE users SET
            subscription_status = $1,
            subscription_ends_at = $2,
            updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [status, endsAt, userId]
    );

    console.log(`✅ Subscription updated for user ${userId}`);
}

// Helper: Handle subscription deletion
async function handleSubscriptionDeleted(subscription) {
    const customerId = subscription.customer;

    const userResult = await query(
        'SELECT id, subscription_tier FROM users WHERE stripe_customer_id = $1',
        [customerId]
    );

    if (userResult.rows.length === 0) return;

    const userId = userResult.rows[0].id;
    const tier = userResult.rows[0].subscription_tier;

    await query(
        `UPDATE users SET
            subscription_status = 'cancelled',
            updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [userId]
    );

    // Log to financial audit trail
    await logFinancialTransaction(
        userId,
        'subscription_cancelled',
        'subscription',
        subscription.id,
        null,
        { tier, cancellation_reason: subscription.cancellation_details?.reason || 'user_cancelled' }
    );

    console.log(`⚠️ Subscription cancelled for user ${userId}`);
}

// Helper: Handle successful payment
async function handlePaymentSucceeded(invoice) {
    const customerId = invoice.customer;
    const amount = invoice.amount_paid / 100; // Convert from cents

    const userResult = await query(
        'SELECT id, subscription_tier FROM users WHERE stripe_customer_id = $1',
        [customerId]
    );

    if (userResult.rows.length === 0) return;

    const userId = userResult.rows[0].id;
    const tier = userResult.rows[0].subscription_tier;

    // Record payment in subscription history
    await query(
        `INSERT INTO subscription_history (
            user_id, subscription_tier, amount, stripe_payment_intent_id,
            status, billing_period_start, billing_period_end
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
            userId,
            tier,
            amount,
            invoice.payment_intent,
            'succeeded',
            new Date(invoice.period_start * 1000),
            new Date(invoice.period_end * 1000)
        ]
    );

    // Log to financial audit trail
    await logFinancialTransaction(
        userId,
        'subscription_payment_succeeded',
        'subscription',
        invoice.subscription,
        amount,
        {
            tier,
            payment_intent: invoice.payment_intent,
            invoice_id: invoice.id,
            period_start: new Date(invoice.period_start * 1000),
            period_end: new Date(invoice.period_end * 1000)
        }
    );

    console.log(`💰 Payment succeeded for user ${userId}: $${amount}`);
}

// Helper: Handle failed payment
async function handlePaymentFailed(invoice) {
    const customerId = invoice.customer;
    const amount = invoice.amount_due / 100; // Convert from cents

    const userResult = await query(
        'SELECT id, subscription_tier FROM users WHERE stripe_customer_id = $1',
        [customerId]
    );

    if (userResult.rows.length === 0) return;

    const userId = userResult.rows[0].id;
    const tier = userResult.rows[0].subscription_tier;

    // Log to financial audit trail
    await logFinancialTransaction(
        userId,
        'subscription_payment_failed',
        'subscription',
        invoice.subscription,
        amount,
        {
            tier,
            invoice_id: invoice.id,
            failure_reason: invoice.failure_message || 'Unknown',
            attempt_count: invoice.attempt_count
        }
    );

    // TODO: Send email notification about failed payment

    console.error(`❌ Payment failed for user ${userId} - Amount: $${amount}`);
}

// GET /api/subscription/status - Get current subscription status
router.get('/status', authenticate, async (req, res) => {
    try {
        const result = await query(
            `SELECT subscription_status, subscription_tier, trial_ends_at, subscription_ends_at
             FROM users WHERE id = $1`,
            [req.user.id]
        );

        res.json({
            subscription: result.rows[0]
        });

    } catch (error) {
        console.error('Get subscription status error:', error);
        res.status(500).json({
            error: 'Failed to get subscription status',
            message: error.message
        });
    }
});

// POST /api/subscription/portal - Create customer portal session for managing subscription
router.post('/portal', authenticate, async (req, res) => {
    try {
        const userResult = await query(
            'SELECT stripe_customer_id FROM users WHERE id = $1',
            [req.user.id]
        );

        if (!userResult.rows[0].stripe_customer_id) {
            return res.status(400).json({
                error: 'No Stripe customer found'
            });
        }

        // Create customer portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: userResult.rows[0].stripe_customer_id,
            return_url: `${process.env.FRONTEND_URL}/settings`,
        });

        res.json({
            portal_url: session.url
        });

    } catch (error) {
        console.error('Customer portal error:', error);
        res.status(500).json({
            error: 'Failed to create portal session',
            message: error.message
        });
    }
});

// POST /api/subscription/cancel - Cancel subscription
router.post('/cancel', authenticate, async (req, res) => {
    try {
        const userResult = await query(
            'SELECT stripe_subscription_id, subscription_tier FROM users WHERE id = $1',
            [req.user.id]
        );

        if (!userResult.rows[0].stripe_subscription_id) {
            return res.status(400).json({
                error: 'No active subscription found'
            });
        }

        const subscriptionId = userResult.rows[0].stripe_subscription_id;
        const tier = userResult.rows[0].subscription_tier;

        // Cancel subscription at period end (don't cancel immediately)
        await stripe.subscriptions.update(
            subscriptionId,
            { cancel_at_period_end: true }
        );

        // Log to financial audit trail
        await logFinancialTransaction(
            req.user.id,
            'subscription_cancel_scheduled',
            'subscription',
            subscriptionId,
            null,
            { tier, cancel_at_period_end: true }
        );

        res.json({
            message: 'Subscription will be cancelled at the end of the billing period'
        });

    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({
            error: 'Failed to cancel subscription',
            message: error.message
        });
    }
});

module.exports = router;
