# TruckDocs Pro - Backend API

Document management system for truck drivers - Backend API built with Node.js, Express, and PostgreSQL.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

**Required environment variables:**
- `DATABASE_URL` - Your Render PostgreSQL connection string
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `STRIPE_SECRET_KEY` - From Stripe dashboard
- `AWS_ACCESS_KEY_ID` - From AWS S3
- `AWS_SECRET_ACCESS_KEY` - From AWS S3
- `AWS_BUCKET_NAME` - Your S3 bucket name

### 3. Set Up Database

Run the database schema on your Render PostgreSQL:

```bash
# Connect to your Render PostgreSQL
psql your-database-url

# Run the schema
\i database/schema.sql
```

Or copy the contents of `database/schema.sql` and run it in your Render dashboard SQL editor.

### 4. Run Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### 5. Deploy to Render

1. **Create Web Service on Render:**
   - Connect your GitHub repo
   - Select "Node" environment
   - Build command: `npm install`
   - Start command: `npm start`

2. **Add Environment Variables:**
   - Go to your Render web service dashboard
   - Add all variables from `.env`

3. **Deploy:**
   - Render will auto-deploy on every git push to main branch

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js        # PostgreSQL connection
├── database/
│   └── schema.sql         # Database schema
├── middleware/
│   └── auth.js            # JWT authentication
├── routes/
│   ├── auth.js            # User authentication
│   ├── documents.js       # Document management
│   ├── invoices.js        # Invoice CRUD
│   ├── expenses.js        # Expense tracking
│   ├── ifta.js            # IFTA fuel records
│   ├── user.js            # User profile
│   └── subscription.js    # Stripe subscriptions
├── utils/
│   ├── fileUpload.js      # S3 file uploads
│   └── ocr.js             # OCR text extraction
├── .env.example           # Environment template
├── package.json
└── server.js              # Main entry point
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Documents
- `GET /api/documents` - Get all documents
- `POST /api/documents` - Upload document
- `GET /api/documents/:id` - Get single document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/stats/summary` - Get statistics

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice with items
- `PUT /api/invoices/:id/status` - Update invoice status
- `DELETE /api/invoices/:id` - Delete invoice
- `GET /api/invoices/stats/summary` - Get statistics

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/stats/summary` - Get statistics

### IFTA
- `GET /api/ifta/records` - Get fuel records
- `POST /api/ifta/records` - Create fuel record
- `GET /api/ifta/reports/:quarter` - Get quarterly report
- `GET /api/ifta/quarters` - Get available quarters

### Subscription
- `POST /api/subscription/create-checkout` - Create Stripe checkout
- `POST /api/subscription/webhook` - Stripe webhook
- `GET /api/subscription/status` - Get subscription status
- `POST /api/subscription/cancel` - Cancel subscription

### User
- `GET /api/user/profile` - Get profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/dashboard` - Get dashboard stats

## 🔐 Authentication

All endpoints (except `/api/auth/register` and `/api/auth/login`) require JWT authentication.

Include the token in the `Authorization` header:

```
Authorization: Bearer your-jwt-token
```

## 💳 Stripe Integration

### Pricing Tiers
- **Solo**: $19/month or $199/year
- **Professional**: $29/month or $299/year
- **Fleet**: $49/month or $499/year

### Setting Up Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-api.onrender.com/api/subscription/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET` env variable

## 📦 File Storage (AWS S3)

### Setup S3 Bucket

1. Create S3 bucket (e.g., `truckdocs-files`)
2. Set bucket to private (not public)
3. Create IAM user with S3 permissions
4. Add credentials to `.env`

### Alternative: Cloudflare R2 (Cheaper)

R2 is S3-compatible but cheaper. To use R2:

1. Create R2 bucket in Cloudflare
2. Get access keys
3. Update `utils/fileUpload.js` to use R2 endpoint

## 🧪 Testing the API

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"driver@example.com","password":"password123","full_name":"John Driver"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"driver@example.com","password":"password123"}'

# Get dashboard (with token)
curl http://localhost:5000/api/user/dashboard \
  -H "Authorization: Bearer your-jwt-token"
```

### Using Postman

Import the API endpoints from the documentation above.

## 🐛 Troubleshooting

### Database Connection Error
- Check `DATABASE_URL` is correct
- Ensure Render PostgreSQL is running
- Verify SSL settings in `config/database.js`

### File Upload Error
- Check AWS credentials
- Verify S3 bucket exists and has correct permissions
- Check bucket region matches `AWS_REGION`

### Stripe Webhook Error
- Verify webhook secret is correct
- Check webhook endpoint is publicly accessible
- Test with Stripe CLI: `stripe listen --forward-to localhost:5000/api/subscription/webhook`

## 📝 License

MIT
