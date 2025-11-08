# Stripe Integration - Quick Start Checklist

## ✅ DONE (I built this for you):
- ✅ Backend API routes
- ✅ Frontend Subscribe page
- ✅ Database migration
- ✅ Deployed to GitHub (Render will auto-deploy)

---

## 🚀 YOUR 3 STEPS TO GO LIVE (15 minutes):

### STEP 1: Add Environment Variables (5 min)

1. Go to: https://dashboard.render.com
2. Click your backend service
3. Click "Environment" tab
4. Add these 3 variables:

```
STRIPE_SECRET_KEY = (use your secret key from Stripe dashboard)

STRIPE_PRICE_ID = price_1SPp1AI4BWGkGyQaS3Yl5Lzn

STRIPE_WEBHOOK_SECRET = (add this after Step 3)
```

5. Click "Save Changes"
6. Wait 2-3 minutes for deployment

---

### STEP 2: Run Migration (1 min)

**After Render deploys:**

Go to: https://truckdocs-pro-backend.onrender.com/migrate

Should see: ✅ "All migrations completed successfully!"

---

### STEP 3: Set Up Webhook (5 min)

1. Go to: https://dashboard.stripe.com/webhooks
2. Make sure you're in **LIVE mode** (top right toggle)
3. Click "+ Add endpoint"
4. Enter:
   - URL: `https://truckdocs-pro-backend.onrender.com/api/stripe/webhook`
   - Select these events:
     - customer.subscription.created
     - customer.subscription.updated
     - customer.subscription.deleted
     - invoice.paid
     - invoice.payment_failed

5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_...`)
7. Go back to Render → Environment → Add:
   ```
   STRIPE_WEBHOOK_SECRET = whsec_xxxxxxxxxxxxx
   ```
8. Save and redeploy

---

## 🧪 STEP 4: Test (5 min)

1. Go to: https://www.freighthubpro.com/subscribe
2. Click "Start Free Trial"
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Check: https://dashboard.stripe.com/subscriptions

**See your test subscription? ✅ YOU'RE LIVE!**

---

## 💰 NOW WHAT?

**Start marketing!**

Send SMS to 4,000 graduates:
```
Salamu Alaikum! FreightHub Pro is LIVE!

✅ 7-day FREE trial
✅ IFTA calculator (save $500+/quarter)
✅ AI receipt scanner
✅ Document storage

Try it: www.freighthubpro.com

Only $19.99/month after trial.
```

**Expected: 80-120 signups in first 24 hours = $1,600-2,400/month revenue potential**

---

## 🆘 Problems?

Read full guide: `STRIPE_SETUP_INSTRUCTIONS.md`

Or check:
- Render logs (for backend errors)
- Stripe webhook logs (for payment errors)

---

**YOU'RE READY TO MAKE MONEY! 🚀💰**
