# Stripe Customer Portal Setup - REQUIRED FOR CANCELLATION

## ⚠️ IMPORTANT: Enable Customer Portal in Stripe

To allow customers to cancel subscriptions, you MUST enable the Stripe Customer Portal.

---

## 🔧 STEP 1: Enable Customer Portal (2 minutes)

1. **Go to:** https://dashboard.stripe.com/settings/billing/portal
2. **Make sure:** You're in **LIVE mode** (toggle top right)
3. **Click:** "Activate test link" or "Activate" button
4. **Configure the following settings:**

### What customers can do:
- ✅ **Cancel subscriptions** - ENABLE THIS
- ✅ **Update payment methods** - ENABLE THIS
- ✅ **View invoices** - ENABLE THIS
- ✅ **Update billing information** - ENABLE THIS

### Business settings:
- **Business name:** FreightHub Pro
- **Privacy policy URL:** https://www.freighthubpro.com/privacy (create this page later)
- **Terms of service URL:** https://www.freighthubpro.com/terms (create this page later)

5. **Click:** "Save changes"

---

## ✅ STEP 2: Test Cancellation Flow

1. **Go to:** https://www.freighthubpro.com
2. **Login** with a test account that has an active subscription
3. **Go to:** Settings → Subscription tab
4. **Click:** "Manage Billing & Payment Method" button
5. **You should see:** Stripe Customer Portal page
6. **In the portal, you can:**
   - Cancel subscription
   - Update payment method
   - View invoices
   - Download receipts

---

## 🛠️ How Cancellation Works:

### When customer cancels:

1. **Customer clicks:** "Manage Billing" in Settings
2. **Redirected to:** Stripe Customer Portal
3. **Customer clicks:** "Cancel subscription"
4. **Stripe asks:** "Are you sure?"
5. **Customer confirms:** Cancellation

### What happens after cancellation:

- **Immediately:** Subscription marked as "cancel_at_period_end = true"
- **Webhook sent:** `customer.subscription.updated` event
- **Backend updates:** Database to reflect cancellation
- **Customer keeps access:** Until end of billing period
- **On period end:** Subscription fully canceled
- **Webhook sent:** `customer.subscription.deleted` event
- **Backend updates:** Status to "canceled"

---

## 💡 Customizing Cancellation Settings:

### Cancellation behavior options:

**Go to:** https://dashboard.stripe.com/settings/billing/portal

**Choose one:**

1. **Cancel immediately** - Customer loses access right away (NOT RECOMMENDED)
2. **Cancel at period end** - Customer keeps access until billing period ends (✅ RECOMMENDED)

**We use option #2 (cancel at period end) because:**
- Customer already paid for the month
- Better customer experience
- Reduces refund requests

### Retention features (Optional):

You can enable these to reduce cancellations:

- **Pause subscriptions** - Let customers pause instead of cancel
- **Discount offers** - Offer discount when they try to cancel
- **Feedback survey** - Ask why they're canceling

---

## 🧪 Testing Cancellation:

1. **Create test subscription:**
   - Use test card: `4242 4242 4242 4242`
   - Subscribe to FreightHub Pro

2. **Go to Settings:**
   - Click "Manage Billing"
   - You'll see Stripe portal

3. **Cancel subscription:**
   - Click "Cancel subscription"
   - Confirm cancellation

4. **Verify in Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/subscriptions
   - Find your subscription
   - Should show "Cancels on [date]"

5. **Verify in your app:**
   - Refresh Settings page
   - Should show cancellation notice
   - Check database: `cancel_at_period_end = true`

---

## 🚨 Common Issues:

### Issue 1: "Customer Portal is not enabled"

**Error:** Customer Portal activation required

**Solution:**
1. Go to: https://dashboard.stripe.com/settings/billing/portal
2. Click "Activate" button
3. Save settings

### Issue 2: "Invalid return URL"

**Error:** Return URL doesn't match allowed domains

**Solution:**
1. Check `FRONTEND_URL` in Render: Should be `https://www.freighthubpro.com`
2. Add domain to allowed list in Stripe Portal settings

### Issue 3: Button doesn't work

**Error:** Nothing happens when clicking "Manage Billing"

**Solution:**
1. Check browser console for errors
2. Verify user has `stripe_customer_id` in database
3. Check backend logs for API errors

---

## 📊 Monitoring Cancellations:

### In Stripe Dashboard:

**Go to:** https://dashboard.stripe.com/subscriptions

**Filter by:** Status = "Canceled"

**You can see:**
- Who canceled
- When they canceled
- Why they canceled (if you enabled survey)
- Total churned MRR (Monthly Recurring Revenue)

### In Your Database:

```sql
-- See all canceled subscriptions
SELECT
  u.email,
  u.full_name,
  s.status,
  s.cancel_at_period_end,
  s.current_period_end
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE s.cancel_at_period_end = true
ORDER BY s.current_period_end DESC;
```

---

## 🎯 Reducing Cancellations (Advanced):

### 1. Exit Survey
When customer cancels, ask why:
- Too expensive
- Not using enough
- Missing features
- Found alternative
- Other reason

### 2. Win-back Campaigns
Send email 7 days after cancellation:
- "We miss you! Here's 50% off to come back"
- Highlight new features they missed
- Ask for feedback

### 3. Proactive Engagement
Before they cancel:
- Email when trial ends in 3 days
- Email when payment fails
- Email when they haven't logged in for 30 days

---

## ✅ Portal Configuration Checklist:

Before going live, verify:

- [ ] Customer Portal is ACTIVATED in Stripe
- [ ] Cancellation is ENABLED
- [ ] Update payment method is ENABLED
- [ ] Invoice viewing is ENABLED
- [ ] Return URL is set correctly
- [ ] Tested cancellation flow end-to-end
- [ ] Webhook receives cancellation events
- [ ] Database updates when subscription canceled
- [ ] Customer sees cancellation notice in app

---

## 🆘 Need Help?

If cancellation still doesn't work:

1. **Check Stripe logs:**
   - https://dashboard.stripe.com/logs
   - Look for portal session creation errors

2. **Check backend logs:**
   - Render dashboard → Your service → Logs
   - Look for `/api/stripe/create-portal-session` errors

3. **Check webhook logs:**
   - https://dashboard.stripe.com/webhooks
   - Verify `customer.subscription.updated` events arrive

4. **Contact Stripe Support:**
   - https://support.stripe.com
   - They respond within 24 hours

---

## 🎉 You're Done!

Once the Customer Portal is activated, customers can:
- ✅ Cancel subscriptions themselves
- ✅ Update payment methods
- ✅ View all invoices
- ✅ Download receipts

**No need for support tickets!** Everything is self-service.

---

**Quick link to enable:** https://dashboard.stripe.com/settings/billing/portal
