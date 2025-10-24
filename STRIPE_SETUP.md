# FreightHub Pro - Stripe Integration Setup

## Overview
FreightHub Pro uses Stripe for subscription billing and payment processing. This guide will walk you through setting up your Stripe account and configuring the integration.

## Pricing Plans

### Solo Driver - $19/month or $199/year
- Find & Book Freight Loads
- Digital Document Management
- AI Document Assistant
- OCR Receipt Scanner
- Digital Signatures
- Unlimited IFTA Reports
- Unlimited Invoices
- Email Support

### Professional - $29/month or $299/year (MOST POPULAR)
- Everything in Solo, plus:
- Post Your Own Loads
- Broker Profile Dashboard
- Load Analytics & Insights
- Priority Email Support
- Advanced Expense Tracking
- Custom Invoice Branding
- API Access

### Fleet Manager - $49/month or $499/year
- Everything in Professional, plus:
- Multi-User Access (up to 10 users)
- Fleet Dashboard & Reports
- Dedicated Account Manager
- Priority Phone Support
- Custom Integrations
- White-Label Options
- SLA Guarantee

## Step 1: Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Click "Start now" or "Sign up"
3. Create your account with business email
4. Complete the business verification process
5. Activate your account

## Step 2: Get API Keys

### For Development (Test Mode):

1. Log into Stripe Dashboard
2. Click "Developers" in the left sidebar
3. Click "API keys"
4. You'll see two keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)
5. Copy both keys

### For Production (Live Mode):

1. Toggle "Test mode" to OFF in Stripe Dashboard
2. Get your live API keys:
   - **Publishable key** (starts with `pk_live_`)
   - **Secret key** (starts with `sk_live_`)

## Step 3: Configure Environment Variables

### Backend (.env file or Render Environment Variables):

```env
# Required - Stripe Secret Key
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Required - Stripe Webhook Secret (see Step 4)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Required - Frontend URL for redirects
FRONTEND_URL=https://your-frontend.onrender.com
```

### Frontend (.env file):

```env
# Optional - Not currently used (Stripe Elements loaded dynamically)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Required - Backend API URL
VITE_API_URL=https://your-backend.onrender.com
```

## Step 4: Set Up Webhook (CRITICAL!)

Webhooks notify your backend when subscription events occur (payments, cancellations, etc.).

### Local Development (using Stripe CLI):

1. Install Stripe CLI:
   ```bash
   # Mac
   brew install stripe/stripe-cli/stripe

   # Windows (with Scoop)
   scoop install stripe

   # Or download from https://stripe.com/docs/stripe-cli
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:5000/api/subscription/webhook
   ```

4. The CLI will output a webhook signing secret (starts with `whsec_`). Add it to your `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_the_secret_from_cli
   ```

### Production (Render Deployment):

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "+ Add endpoint"
3. Enter your webhook URL:
   ```
   https://your-backend.onrender.com/api/subscription/webhook
   ```

4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Click "Add endpoint"
6. Click "Reveal" under "Signing secret"
7. Copy the secret (starts with `whsec_`) and add to Render environment variables:
   - Key: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_your_production_webhook_secret`

## Step 5: Test the Integration

### Test Subscription Flow:

1. Start your backend server:
   ```bash
   cd backend
   npm start
   ```

2. Start your frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Visit `/pricing` page
4. Click "Get Started" on any plan
5. Use Stripe test card:
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

6. Complete the checkout
7. You should be redirected to `/dashboard?subscription=success`

### Verify in Database:

```sql
SELECT id, email, subscription_status, subscription_tier, subscription_ends_at
FROM users
WHERE email = 'your@email.com';
```

Should show:
- `subscription_status`: `'active'`
- `subscription_tier`: `'solo'`, `'professional'`, or `'fleet'`
- `subscription_ends_at`: Date 1 month or 1 year in future

### Check Audit Trail:

```sql
SELECT * FROM financial_audit_trail
WHERE transaction_type LIKE 'subscription%'
ORDER BY created_at DESC
LIMIT 10;
```

Should see events like:
- `subscription_activated`
- `subscription_payment_succeeded`

## Step 6: Customer Portal Setup

The Customer Portal allows users to:
- Update payment method
- Download invoices
- View billing history
- Cancel subscription

### Enable Customer Portal:

1. Go to Stripe Dashboard → Settings → Billing → Customer portal
2. Click "Activate" or "Configure"
3. Customize settings:
   - **Products**: Select your subscription products
   - **Features**:
     - ✅ Update payment method
     - ✅ View invoices
     - ✅ Cancel subscription
     - ❌ Update subscription (disable to prevent plan changes)
   - **Business information**: Add your company name, support email
4. Save settings

### Test Customer Portal:

1. Log into your app as a subscribed user
2. Go to Settings page
3. Click "Manage Subscription" button
4. Should redirect to Stripe's hosted portal
5. Try updating payment method or viewing invoices

## API Endpoints

### Create Checkout Session
```bash
POST /api/subscription/create-checkout
Headers: Authorization: Bearer <token>
Body: {
  "tier": "solo" | "professional" | "fleet",
  "billing_period": "monthly" | "yearly"
}

Response: {
  "checkout_url": "https://checkout.stripe.com/...",
  "session_id": "cs_..."
}
```

### Get Subscription Status
```bash
GET /api/subscription/status
Headers: Authorization: Bearer <token>

Response: {
  "subscription": {
    "subscription_status": "active",
    "subscription_tier": "solo",
    "trial_ends_at": "2025-11-06T...",
    "subscription_ends_at": "2025-12-23T..."
  }
}
```

### Open Customer Portal
```bash
POST /api/subscription/portal
Headers: Authorization: Bearer <token>

Response: {
  "portal_url": "https://billing.stripe.com/..."
}
```

### Cancel Subscription
```bash
POST /api/subscription/cancel
Headers: Authorization: Bearer <token>

Response: {
  "message": "Subscription will be cancelled at the end of the billing period"
}
```

## Webhook Events Handled

### `checkout.session.completed`
- Activates subscription after successful payment
- Sets subscription_status to 'active'
- Logs to financial_audit_trail

### `customer.subscription.updated`
- Updates subscription status (active, past_due, etc.)
- Updates subscription_ends_at date

### `customer.subscription.deleted`
- Sets subscription_status to 'cancelled'
- Logs cancellation reason to audit trail

### `invoice.payment_succeeded`
- Records payment in subscription_history
- Logs to financial_audit_trail
- Keeps subscription active

### `invoice.payment_failed`
- Logs failed payment attempt
- Records failure reason
- TODO: Send email notification

## Testing Subscription Lifecycle

### Test Successful Payment:
```
Card: 4242 4242 4242 4242
```

### Test Declined Card:
```
Card: 4000 0000 0000 0002
```

### Test Requires Authentication (3D Secure):
```
Card: 4000 0025 0000 3155
```

### Simulate Subscription Events (Stripe CLI):
```bash
# Successful payment
stripe trigger invoice.payment_succeeded

# Failed payment
stripe trigger invoice.payment_failed

# Subscription cancelled
stripe trigger customer.subscription.deleted
```

## Production Checklist

Before going live:

- [ ] Replace test API keys with live API keys
- [ ] Set up production webhook endpoint
- [ ] Configure Customer Portal in live mode
- [ ] Test checkout flow with real card (small amount)
- [ ] Verify webhook events are received
- [ ] Check audit trail logging
- [ ] Set up email notifications for failed payments
- [ ] Configure proper error monitoring (Sentry, LogRocket)
- [ ] Review Stripe Radar rules for fraud prevention
- [ ] Enable 3D Secure (SCA) for EU customers
- [ ] Set up tax collection if required
- [ ] Configure invoice email templates in Stripe
- [ ] Test subscription cancellation flow
- [ ] Verify refund policy is clear to customers

## Troubleshooting

### "No such customer" error:
- User doesn't have `stripe_customer_id` in database
- Try logging out and back in, or delete user and re-register

### Webhook not receiving events:
- Check webhook URL is correct and accessible
- Verify STRIPE_WEBHOOK_SECRET is set correctly
- Check Stripe Dashboard → Developers → Webhooks for failed deliveries
- Look at webhook logs for error messages

### Redirect after checkout fails:
- Ensure FRONTEND_URL is set correctly in backend .env
- Check success_url and cancel_url in create-checkout endpoint

### Subscription status not updating:
- Check webhook events are being received
- Look at database for errors in subscription_history table
- Verify financial_audit_trail has events

### Customer portal not loading:
- Ensure Customer Portal is activated in Stripe Dashboard
- Check that stripe_customer_id exists for user
- Verify FRONTEND_URL is set for return_url

## Security Notes

1. **Never expose SECRET KEY** on frontend
2. **Always validate webhooks** with signing secret
3. **Use HTTPS** in production (required by Stripe)
4. **Keep audit logs** of all subscription events
5. **Monitor for fraud** in Stripe Radar
6. **PCI Compliance**: Stripe handles card data, you never touch it

## Support

For Stripe-related issues:
- **Stripe Docs**: https://stripe.com/docs
- **Stripe Support**: https://support.stripe.com
- **Stripe Status**: https://status.stripe.com

For FreightHub Pro integration issues:
- Check application logs
- Review `financial_audit_trail` table
- Check `security_audit_log` table
- Review SECURITY.md documentation

## Pricing Updates

To change pricing:

1. Update `PRICING` object in `backend/routes/subscription.js`:
   ```javascript
   const PRICING = {
       solo_monthly: 1900,      // $19/month
       solo_yearly: 19900,      // $199/year
       // ... etc
   };
   ```

2. Update pricing in `frontend/src/pages/Pricing.jsx`

3. No database migration needed - prices are passed dynamically to Stripe

## Next Steps

After setting up Stripe:

1. **Test all flows thoroughly** in test mode
2. **Set up monitoring** for subscription events
3. **Configure email notifications** for:
   - Successful subscription
   - Payment receipts
   - Failed payments
   - Subscription cancellation
4. **Review refund policy** and configure in Stripe
5. **Set up dunning** for failed payments (automatic retries)
6. **Configure tax settings** if applicable
7. **Go live** by switching to production API keys

## Version

- **Stripe Integration Version**: 1.0.0
- **Last Updated**: 2025-10-23
- **Stripe API Version**: Latest (2024-12-18.acacia)
