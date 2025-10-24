# FreightHub Pro - Render Deployment Guide

## Quick Start: Deploy in 15 Minutes

This guide will get FreightHub Pro deployed on Render and ready to accept test subscriptions.

---

## Step 1: Push to GitHub (if not done)

```bash
cd truckdocs-pro
git add .
git commit -m "FreightHub Pro - Ready for deployment"
git push origin main
```

---

## Step 2: Create PostgreSQL Database

1. Go to [render.com](https://render.com)
2. Click "New +" → "PostgreSQL"
3. Settings:
   - **Name**: `freighthub-db`
   - **Database**: `freighthub`
   - **User**: `freighthub`
   - **Region**: Oregon (or closest to you)
   - **Plan**: Free or Starter ($7/month)
4. Click "Create Database"
5. **SAVE** the "Internal Database URL" (starts with `postgresql://`)

---

## Step 3: Deploy Backend

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select `truckdocs-pro` repo
4. Settings:
   - **Name**: `freighthub-backend`
   - **Region**: Same as database (Oregon)
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free or Starter ($7/month)

5. **Environment Variables** - Click "Advanced" → Add Environment Variables:

```env
DATABASE_URL=<paste Internal Database URL from Step 2>
JWT_SECRET=<generate with: openssl rand -base64 32>
NODE_ENV=production
FRONTEND_URL=https://freighthub-frontend.onrender.com
PORT=5000
```

6. Click "Create Web Service"
7. Wait for deployment (2-3 minutes)
8. **SAVE** your backend URL (e.g., `https://freighthub-backend.onrender.com`)

---

## Step 4: Run Database Migrations

After backend deploys, run these URLs in browser:

```bash
# 1. Main schema
https://freighthub-backend.onrender.com/migrate

# 2. Security enhancements (REQUIRED)
https://freighthub-backend.onrender.com/setup-security-enhancements

# 3. Load board
https://freighthub-backend.onrender.com/setup-load-board
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Migration complete!"
}
```

---

## Step 5: Deploy Frontend

1. Click "New +" → "Static Site"
2. Connect same GitHub repository
3. Select `truckdocs-pro` repo
4. Settings:
   - **Name**: `freighthub-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

5. **Environment Variables**:

```env
VITE_API_URL=<your backend URL from Step 3>
```

Example:
```env
VITE_API_URL=https://freighthub-backend.onrender.com
```

6. Click "Create Static Site"
7. Wait for build (2-3 minutes)
8. **SAVE** your frontend URL (e.g., `https://freighthub-frontend.onrender.com`)

---

## Step 6: Update Backend with Frontend URL

1. Go to backend service
2. Environment → Edit `FRONTEND_URL`
3. Change to your actual frontend URL:
   ```env
   FRONTEND_URL=https://freighthub-frontend.onrender.com
   ```
4. Save (triggers redeploy)

---

## Step 7: Set Up Stripe

### A. Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Sign up with business email
3. Complete verification

### B. Get Test API Keys

1. Ensure "Test mode" is ON (toggle in top right)
2. Go to Developers → API keys
3. Copy "Secret key" (starts with `sk_test_`)

### C. Configure Webhook

1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. **Endpoint URL**:
   ```
   https://freighthub-backend.onrender.com/api/subscription/webhook
   ```
4. **Events to select**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. Click "Add endpoint"
6. Click "Reveal" signing secret
7. Copy webhook secret (starts with `whsec_`)

### D. Add Stripe to Backend Environment

1. Go to backend service → Environment
2. Add:
   ```env
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```
3. Save (triggers redeploy)

### E. Configure Customer Portal

1. Go to Stripe Dashboard → Settings → Billing → Customer portal
2. Click "Activate"
3. Enable:
   - ✅ Update payment method
   - ✅ View invoices
   - ✅ Cancel subscription
4. Add business info:
   - **Business name**: FreightHub Pro
   - **Support email**: your@email.com
5. Save

---

## Step 8: Test the Complete Flow

1. Visit your frontend: `https://freighthub-frontend.onrender.com`
2. Click "Get Started" or "Pricing"
3. Register a new account
4. Go to Pricing page
5. Click "Get Started" on any plan
6. Use Stripe test card:
   ```
   Card Number: 4242 4242 4242 4242
   Expiry: 12/34
   CVC: 123
   ZIP: 12345
   ```
7. Complete checkout
8. Should redirect to dashboard with active subscription

### Verify in Database

Access your database in Render:
1. Go to PostgreSQL service
2. Click "Connect" → Copy PSQL Command
3. Run in terminal (or use Render's web shell)

```sql
-- Check subscription
SELECT email, subscription_status, subscription_tier, subscription_ends_at
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- Check audit trail
SELECT * FROM financial_audit_trail
ORDER BY created_at DESC
LIMIT 10;
```

---

## Common Issues & Fixes

### Backend won't start
**Error**: `Missing required environment variables`
**Fix**: Ensure `JWT_SECRET` and `DATABASE_URL` are set

### Frontend shows "Network Error"
**Error**: Can't connect to backend
**Fix**:
- Check `VITE_API_URL` is correct
- Ensure backend is running
- Check CORS in backend allows your frontend URL

### "Webhook signature verification failed"
**Error**: Stripe webhook fails
**Fix**:
- Ensure `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Check webhook URL is exactly: `/api/subscription/webhook`

### Database connection fails
**Error**: `Database connection error`
**Fix**:
- Wait 5 minutes (PostgreSQL takes time to provision)
- Check `DATABASE_URL` is the Internal URL, not External
- Ensure database is in same region as backend

---

## Environment Variables Cheat Sheet

### Backend (Required):
```env
DATABASE_URL=<from Render PostgreSQL>
JWT_SECRET=<openssl rand -base64 32>
NODE_ENV=production
FRONTEND_URL=https://your-frontend.onrender.com
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
PORT=5000
```

### Backend (Optional):
```env
OPENAI_API_KEY=sk-your-openai-key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
```

### Frontend (Required):
```env
VITE_API_URL=https://your-backend.onrender.com
```

---

## Free Tier Limitations

Render's free tier:
- ✅ Perfect for testing
- ⚠️ Spins down after 15 min inactivity
- ⚠️ Cold start takes ~30 seconds
- ⚠️ 750 hours/month limit

**For Production**: Upgrade to Starter plan ($7/month per service)
- No spin down
- Faster performance
- Custom domain support

---

## Going to Production

When ready for real customers:

1. **Upgrade Services**:
   - Backend: Starter plan ($7/month)
   - Database: Starter plan ($7/month)
   - Frontend: Remains free

2. **Switch to Live Stripe Keys**:
   - Toggle "Test mode" to OFF in Stripe
   - Get live API keys (`sk_live_...`)
   - Update backend environment variables
   - Create NEW webhook in live mode
   - Update `STRIPE_WEBHOOK_SECRET`

3. **Add Custom Domain** (optional):
   - Buy domain (Namecheap, GoDaddy, etc.)
   - In Render: Settings → Custom Domains
   - Follow DNS setup instructions
   - Update `FRONTEND_URL` in backend

4. **Enable Auto-Deploy** (already enabled by default):
   - Every git push to `main` auto-deploys
   - Check deployment status in Render dashboard

---

## Monitoring Your App

### Check Logs

**Backend Logs**:
1. Go to backend service
2. Click "Logs" tab
3. See real-time server logs

**Frontend Logs**:
1. Go to static site
2. Click "Logs" tab
3. See build logs

### Health Checks

**Backend**:
```bash
curl https://freighthub-backend.onrender.com/health
```

**Frontend**:
Visit URL in browser - should load app

### Database

Check database status:
1. Go to PostgreSQL service
2. See connection count, storage usage
3. View recent queries

---

## Scaling

As your business grows:

**100 users**: Current setup works fine

**1,000 users**:
- Upgrade database to Standard ($20/month)
- Upgrade backend to Pro ($25/month)

**10,000 users**:
- Multiple backend instances (load balancing)
- Redis caching
- CDN for frontend (Cloudflare)
- Dedicated database ($100/month)

---

## Backup Strategy

**Render PostgreSQL includes**:
- Daily backups (free tier: 7 days retention)
- Point-in-time recovery (paid plans)

**Manual Backup**:
```bash
# From your PostgreSQL service, copy external URL
pg_dump <EXTERNAL_DATABASE_URL> > backup.sql

# Restore
psql <EXTERNAL_DATABASE_URL> < backup.sql
```

---

## Security Checklist

- [x] HTTPS enabled (Render does automatically)
- [x] Environment variables secured
- [x] JWT tokens encrypted
- [x] Passwords hashed with bcrypt
- [x] Rate limiting enabled
- [x] CORS configured
- [x] SQL injection prevented (parameterized queries)
- [x] XSS protection (Helmet.js)
- [x] Account lockout after failed logins
- [x] Audit logging enabled

---

## Cost Breakdown

### Development (Free):
- Backend: Free
- Frontend: Free
- Database: Free
- **Total**: $0/month

### Production (Recommended):
- Backend Starter: $7/month
- Database Starter: $7/month
- Frontend: Free
- Stripe: 2.9% + $0.30 per transaction
- **Total**: ~$14/month + transaction fees

### Scale (1000+ users):
- Backend Pro: $25/month
- Database Standard: $20/month
- Frontend: Free
- **Total**: ~$45/month + transaction fees

---

## Next Steps

After deployment:

1. ✅ Test complete user flow
2. ✅ Create Terms of Service page
3. ✅ Create Privacy Policy page
4. ✅ Set up email notifications
5. ✅ Add analytics (Google Analytics)
6. ✅ Test on mobile devices
7. ✅ Get beta users to test
8. ✅ Switch to live Stripe keys
9. ✅ Launch! 🚀

---

## Support

**Render Support**:
- Docs: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

**FreightHub Pro**:
- `PRODUCTION_CHECKLIST.md` - Complete launch checklist
- `STRIPE_SETUP.md` - Detailed Stripe guide
- `SECURITY.md` - Security documentation

---

**Deployment Time**: ~15 minutes
**Total Setup Time**: ~2 hours (including Stripe & testing)

Good luck with your launch! 🚛💰
