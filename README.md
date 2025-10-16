# 🚛 TruckDocs Pro - Document Management SaaS for Truck Drivers

> **Your Path to $100K/Month MRR**
>
> Complete, production-ready SaaS application for truck driver document management.
> Target: 5,000 users × $20/month = $100,000 MRR

---

## 🎯 What This Is

TruckDocs Pro solves the #1 pain point for truck drivers: **PAPERWORK**

### Core Features:
- 📄 **Document Management** - Upload & organize receipts, BOL, POD, permits
- 🧾 **IFTA Automation** - Track fuel purchases by state, generate quarterly reports
- 💰 **Invoice Generator** - Create professional invoices in 30 seconds
- 💵 **Expense Tracking** - Categorize expenses, calculate tax deductions
- 🤖 **Smart OCR** - Automatically extract data from receipts
- 💳 **Stripe Subscriptions** - $19/month, $29/month, $49/month tiers

---

## 🏗️ Tech Stack

### Backend
- **Node.js + Express** - REST API
- **PostgreSQL** - Database (Render)
- **JWT** - Authentication
- **Stripe** - Payments
- **AWS S3** - File storage
- **Tesseract.js** - OCR

### Frontend
- **React + Vite** - Fast dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - API calls

### Deployment
- **Render** - Backend + Database + Frontend
- **Cost:** $0-$50/month (scales with usage)

---

## 📁 Project Structure

```
truckdocs-pro/
├── backend/
│   ├── config/           # Database config
│   ├── database/         # SQL schema
│   ├── middleware/       # Auth middleware
│   ├── routes/           # API endpoints
│   │   ├── auth.js       # Register/Login
│   │   ├── documents.js  # Document CRUD
│   │   ├── invoices.js   # Invoice CRUD
│   │   ├── expenses.js   # Expense tracking
│   │   ├── ifta.js       # IFTA records
│   │   ├── subscription.js # Stripe integration
│   │   └── user.js       # User profile
│   ├── utils/            # Helpers (S3, OCR)
│   ├── .env.example      # Environment template
│   ├── package.json
│   └── server.js         # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── context/      # Auth context
│   │   ├── pages/        # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Documents.jsx
│   │   │   ├── Invoices.jsx
│   │   │   ├── Expenses.jsx
│   │   │   ├── IFTA.jsx
│   │   │   └── Settings.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── SETUP_GUIDE.md        # Detailed setup instructions
└── README.md             # This file
```

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (free on Render)
- AWS account (for S3 storage)
- Stripe account (for payments)

### 1. Clone & Install

```bash
# Backend
cd truckdocs-pro/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Set Up Environment

**Backend `.env`:**
```env
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=your-secret-here
STRIPE_SECRET_KEY=sk_test_xxx
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_BUCKET_NAME=truckdocs-files
FRONTEND_URL=http://localhost:5173
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:5000
```

### 3. Set Up Database

```bash
# Copy contents of backend/database/schema.sql
# Run in your PostgreSQL database (Render dashboard or psql)
```

### 4. Start Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit: **http://localhost:5173**

---

## 📊 Database Schema

### Core Tables:
- `users` - User accounts + subscription status
- `documents` - All uploaded files
- `ifta_records` - Fuel purchases by state
- `invoices` + `invoice_items` - Invoice management
- `expenses` - Expense tracking
- `subscription_history` - Payment records
- `activity_log` - Audit trail

See `backend/database/schema.sql` for full schema.

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account (14-day trial)
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Documents
- `GET /api/documents` - List all documents
- `POST /api/documents` - Upload document (with OCR)
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id/status` - Mark paid/unpaid
- `GET /api/invoices/stats/summary` - Invoice statistics

### IFTA
- `POST /api/ifta/records` - Add fuel purchase
- `GET /api/ifta/reports/:quarter` - Generate IFTA report
- `GET /api/ifta/quarters` - List available quarters

### Subscription (Stripe)
- `POST /api/subscription/create-checkout` - Create payment session
- `POST /api/subscription/webhook` - Handle Stripe events
- `POST /api/subscription/cancel` - Cancel subscription

Full API docs in `backend/README.md`

---

## 💳 Pricing Strategy

### Solo - $19/month ($199/year)
- Unlimited documents
- IFTA automation
- 50 invoices/month
- Basic support
**Target: 80% of users**

### Professional - $29/month ($299/year)
- Everything in Solo
- Unlimited invoices
- QuickBooks integration
- Priority support
**Target: 15% of users**

### Fleet - $49/month ($499/year)
- Everything in Professional
- Up to 5 trucks
- Team management
- Phone support
**Target: 5% of users**

**Average revenue per user: ~$20/month**

---

## 📈 Path to $100K MRR

### Year 1 Timeline:

**Month 1-3:** Build & Beta
- Get 10-20 beta users (your friend + network)
- Fix bugs, improve UX
- Goal: $200-500 MRR

**Month 4-6:** Launch & Initial Growth
- Launch on truck driver Facebook groups
- YouTube channel sponsorships
- Google Ads
- Goal: $5K-10K MRR (250-500 users)

**Month 7-12:** Scale Marketing
- Truck stop partnerships
- Referral program
- Content marketing
- Goal: $30K-40K MRR (1,500-2,000 users)

**Month 13-24:** Aggressive Growth
- Radio ads (SiriusXM Road Dog)
- Trucking conference sponsorships
- Insurance company partnerships
- Goal: $100K MRR (5,000 users)

### Customer Acquisition Cost (CAC):
- **Target CAC:** $20-40 per user
- **Lifetime Value (LTV):** $240-480 (12-24 month retention)
- **LTV:CAC Ratio:** 6:1 to 12:1 (excellent)

---

## 🎯 Marketing Channels

### 1. Facebook Groups (FREE - Highest ROI)
- Join 30+ truck driver groups (200K+ total members)
- Post helpful IFTA/tax tips
- Organic mentions of your tool
- **Cost:** $0
- **Expected:** 1,000 users

### 2. YouTube Sponsorships (PAID - High ROI)
- Sponsor truck driver YouTube channels
- 60-second product demos
- Discount code tracking
- **Cost:** $500-2,000/video
- **Expected:** 1,500 users

### 3. Google Ads (PAID - Medium ROI)
- Target: "IFTA software", "truck driver invoice"
- High-intent keywords
- **Cost:** $1,000-2,000/month
- **Expected:** 800 users

### 4. TikTok/Instagram (FREE/PAID - Viral Potential)
- Post daily truck driver tips
- Product demos
- **Cost:** $500-1,000/month (ads)
- **Expected:** 500 users

### 5. Truck Stops (PAID - Offline)
- Flyers with QR codes at Love's, Pilot, TA
- **Cost:** $500 for 5,000 flyers
- **Expected:** 500 users

### 6. Referral Program (FREE - Compounding)
- $10 credit per referral
- Built into app
- **Cost:** $10/user
- **Expected:** 30% of users from referrals

---

## 🚀 Deployment to Render

### Backend Deployment:

1. **Create PostgreSQL Database:**
   - Render → New → PostgreSQL
   - Name: `truckdocs-db`
   - Copy connection URL

2. **Create Web Service:**
   - Render → New → Web Service
   - Connect GitHub repo
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - Add all environment variables
   - Deploy!

3. **Run Database Schema:**
   - In Render PostgreSQL dashboard
   - Go to "Shell"
   - Paste contents of `database/schema.sql`

### Frontend Deployment:

1. **Create Static Site:**
   - Render → New → Static Site
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Publish Directory:** `frontend/dist`
   - **Environment Variable:** `VITE_API_URL=https://your-backend.onrender.com`
   - Deploy!

### Costs:
- **PostgreSQL:** $7/month (or free tier)
- **Backend:** $7/month (scales up)
- **Frontend:** $0 (free for static sites)
- **Total:** ~$14/month to start

---

## 🧪 Testing

### Manual Testing:

```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234","full_name":"Test User"}'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234"}'

# 3. Get Dashboard (use token from login)
curl http://localhost:5000/api/user/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test with Your Friend:
1. Deploy to Render
2. Give your truck driver friend access
3. Watch him use it for 1 week
4. Collect feedback
5. Fix issues
6. Repeat!

---

## 📞 Support & Maintenance

### What to Monitor:
- **Uptime:** Render auto-restarts if crashes
- **Database size:** Upgrade plan when needed
- **S3 storage costs:** Monitor file uploads
- **Stripe webhooks:** Check for failed payments
- **Error logs:** Set up Sentry or LogRocket

### Monthly Tasks:
- Check Stripe dashboard for revenue
- Review customer feedback
- Update features based on requests
- Monitor competitor pricing
- Check AWS S3 costs

---

## 🎯 Success Metrics

### Key Performance Indicators (KPIs):

**Revenue:**
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Churn rate (target: <5%/month)
- Expansion revenue (upgrades)

**Growth:**
- New signups/month
- Trial-to-paid conversion (target: >40%)
- CAC (Customer Acquisition Cost)
- LTV:CAC ratio (target: >3:1)

**Product:**
- Daily Active Users (DAU)
- Documents uploaded/day
- Invoices created/day
- IFTA reports generated/month

---

## 🆘 Troubleshooting

### Common Issues:

**"Database connection failed"**
- Check `DATABASE_URL` format
- Verify PostgreSQL is running
- Check IP whitelist in Render

**"CORS error on frontend"**
- Check `FRONTEND_URL` in backend `.env`
- Verify CORS middleware in `server.js`

**"File upload fails"**
- Check AWS credentials
- Verify S3 bucket permissions
- Check bucket region matches env variable

**"Stripe webhook not working"**
- Verify webhook secret
- Check endpoint is publicly accessible
- Test with Stripe CLI: `stripe listen`

---

## 💡 Pro Tips

1. **Start with your friend:** Your truck driver friend is your best beta tester
2. **Keep it simple:** Don't add features users don't ask for
3. **Focus on retention:** A user who stays 12 months is worth 12x more
4. **Automate support:** Create video tutorials, FAQ docs
5. **Build referral program early:** Word of mouth is GOLD in trucking
6. **Partner with fuel card companies:** They already have your customers
7. **Offer annual discounts:** Get cash upfront, reduce churn

---

## 🚧 Roadmap

### Phase 1 (Months 1-3): MVP
- ✅ Core features (docs, invoices, IFTA, expenses)
- ✅ User authentication
- ✅ Stripe subscriptions
- ⏳ Mobile-responsive design
- ⏳ Email notifications

### Phase 2 (Months 4-6): Growth Features
- ⏳ Mobile app (React Native)
- ⏳ QuickBooks integration
- ⏳ Mileage tracking
- ⏳ Load management
- ⏳ Referral program

### Phase 3 (Months 7-12): Scale
- ⏳ Multi-truck fleet management
- ⏳ Team collaboration
- ⏳ Advanced reporting
- ⏳ API for integrations
- ⏳ White-label option

---

## 📚 Additional Resources

- **Backend README:** `backend/README.md` - API documentation
- **Setup Guide:** `SETUP_GUIDE.md` - Detailed setup walkthrough
- **Database Schema:** `backend/database/schema.sql` - Full schema

---

## 📄 License

MIT License - Free to use, modify, and sell

---

## 🎉 You're Ready to Build Your $100K/Month SaaS!

**Next Steps:**
1. Follow `SETUP_GUIDE.md` to get running locally
2. Test with your truck driver friend
3. Deploy to Render
4. Start marketing!
5. Hit $1K MRR in first 3 months
6. Scale to $100K MRR in 24 months

**Remember:** Every successful SaaS started with ONE user. Your friend is user #1. Get feedback, iterate, and grow!

Good luck! 🚛💰🚀

---

**Questions?** Check `SETUP_GUIDE.md` for detailed instructions!
