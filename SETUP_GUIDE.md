# 🚛 TruckDocs Pro - Complete Setup Guide

## ✅ WHAT'S BEEN CREATED

### Backend (COMPLETE ✓)
- ✅ Full Express.js API with PostgreSQL
- ✅ User authentication (JWT)
- ✅ Document management with OCR
- ✅ Invoice generator
- ✅ Expense tracking
- ✅ IFTA fuel records & reports
- ✅ Stripe subscription integration
- ✅ File upload to AWS S3
- ✅ Complete database schema

### Frontend (PARTIAL - Core files created)
- ✅ React + Vite setup
- ✅ Tailwind CSS configuration
- ✅ Authentication context
- ✅ Login & Register pages
- ⏳ Dashboard page (needs creation)
- ⏳ Documents page (needs creation)
- ⏳ Invoices page (needs creation)
- ⏳ IFTA page (needs creation)
- ⏳ Expenses page (needs creation)
- ⏳ Settings page (needs creation)
- ⏳ Pricing page (needs creation)

---

## 🚀 QUICK START (Do This RIGHT NOW)

### Step 1: Install Backend Dependencies

```bash
cd truckdocs-pro/backend
npm install
```

### Step 2: Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add:

```env
PORT=5000
NODE_ENV=development

# IMPORTANT: Get your Render PostgreSQL URL from Render dashboard
DATABASE_URL=postgresql://username:password@dpg-xxxxx.oregon-postgres.render.com/database_name

# Generate JWT secret (run this command):
# openssl rand -base64 32
JWT_SECRET=your-generated-secret-here

# AWS S3 (create free tier AWS account)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_BUCKET_NAME=truckdocs-files

# Stripe (get from stripe.com dashboard)
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Step 3: Set Up Database

1. **Create PostgreSQL database on Render:**
   - Go to render.com
   - Click "New" → "PostgreSQL"
   - Name it `truckdocs-db`
   - Copy the "External Database URL"
   - Paste it in `.env` as `DATABASE_URL`

2. **Run database schema:**

```bash
# Connect to your Render PostgreSQL
psql YOUR_DATABASE_URL_FROM_RENDER

# Then paste the contents of database/schema.sql
# Or use Render dashboard SQL editor
```

### Step 4: Start Backend

```bash
cd truckdocs-pro/backend
npm run dev
```

You should see:
```
🚛 TruckDocs Pro API running on port 5000
📝 Environment: development
```

### Step 5: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 6: Create Frontend Environment Variables

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### Step 7: Start Frontend

```bash
npm run dev
```

Visit: http://localhost:5173

---

## 📝 REMAINING FRONTEND PAGES TO CREATE

I'll provide you with simple starter templates for the missing pages. Create these files:

### 1. `frontend/src/pages/Dashboard.jsx`

```javascript
import { useState, useEffect } from 'react'
import axios from 'axios'
import { Truck, FileText, DollarSign, Fuel } from 'lucide-react'
import Layout from '../components/Layout'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await axios.get('/api/user/dashboard')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Layout><div className="p-8">Loading...</div></Layout>

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FileText}
            label="Documents"
            value={stats?.documents?.count || 0}
            color="bg-blue-500"
          />
          <StatCard
            icon={DollarSign}
            label="Unpaid Invoices"
            value={`$${stats?.invoices?.unpaid?.toFixed(2) || '0.00'}`}
            color="bg-green-500"
          />
          <StatCard
            icon={DollarSign}
            label="Monthly Expenses"
            value={`$${stats?.expenses?.total?.toFixed(2) || '0.00'}`}
            color="bg-red-500"
          />
          <StatCard
            icon={Fuel}
            label="IFTA Records"
            value={stats?.ifta?.count || 0}
            color="bg-purple-500"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionButton href="/documents" label="Upload Document" />
            <ActionButton href="/invoices" label="Create Invoice" />
            <ActionButton href="/ifta" label="Add IFTA Record" />
          </div>
        </div>
      </div>
    </Layout>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}

function ActionButton({ href, label }) {
  return (
    <a
      href={href}
      className="bg-blue-600 text-white py-3 px-6 rounded-lg text-center hover:bg-blue-700 transition-colors"
    >
      {label}
    </a>
  )
}
```

### 2. `frontend/src/components/Layout.jsx`

```javascript
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Truck, FileText, DollarSign, Receipt, Fuel, Settings, LogOut } from 'lucide-react'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-900 text-white">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Truck className="w-8 h-8" />
            <h1 className="text-xl font-bold">TruckDocs Pro</h1>
          </div>

          <nav className="space-y-2">
            <NavLink to="/dashboard" icon={Truck} label="Dashboard" />
            <NavLink to="/documents" icon={FileText} label="Documents" />
            <NavLink to="/invoices" icon={DollarSign} label="Invoices" />
            <NavLink to="/expenses" icon={Receipt} label="Expenses" />
            <NavLink to="/ifta" icon={Fuel} label="IFTA" />
            <NavLink to="/settings" icon={Settings} label="Settings" />
          </nav>
        </div>

        {/* User Info */}
        <div className="absolute bottom-0 w-64 p-6 border-t border-blue-800">
          <p className="text-sm text-blue-200">Logged in as</p>
          <p className="font-medium truncate">{user?.full_name}</p>
          <button
            onClick={handleLogout}
            className="mt-4 w-full bg-blue-800 hover:bg-blue-700 py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

function NavLink({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-800 transition-colors"
    >
      <Icon className="w-5 h-5" />
      {label}
    </Link>
  )
}
```

### 3. Create Placeholder Pages

For now, create simple placeholder pages for the remaining routes:

**`frontend/src/pages/Documents.jsx`:**
```javascript
import Layout from '../components/Layout'

export default function Documents() {
  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-3xl font-bold">Documents</h1>
        <p className="mt-4 text-gray-600">Document management coming soon...</p>
      </div>
    </Layout>
  )
}
```

Repeat this pattern for:
- `Invoices.jsx`
- `Expenses.jsx`
- `IFTA.jsx`
- `Settings.jsx`
- `Pricing.jsx`

---

## 🎯 TESTING YOUR APP

### 1. Test Backend API

```bash
# Register a test user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "full_name": "Test Driver"
  }'
```

### 2. Test Frontend

1. Go to http://localhost:5173
2. Click "Sign up"
3. Create an account
4. You should see the dashboard!

---

## 🚀 DEPLOY TO RENDER

### Deploy Backend:

1. Push code to GitHub
2. Go to render.com → New → Web Service
3. Connect GitHub repo
4. Settings:
   - **Name:** `truckdocs-api`
   - **Environment:** Node
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Add all environment variables from `.env`**

5. Deploy!

### Deploy Frontend:

1. Render → New → Static Site
2. Settings:
   - **Name:** `truckdocs-app`
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Publish Directory:** `frontend/dist`
   - **Add env variable:** `VITE_API_URL=https://your-backend-url.onrender.com`

---

## 📞 NEXT STEPS

1. ✅ Get backend running locally
2. ✅ Get frontend running locally
3. ✅ Test registration and login
4. ⏳ Create remaining frontend pages (Documents, Invoices, etc.)
5. ⏳ Deploy to Render
6. ⏳ Set up Stripe for payments
7. ⏳ Start marketing to truck drivers!

---

## 💡 TIPS

- **Start simple**: Get the MVP working first (auth + dashboard)
- **Test locally**: Make sure everything works before deploying
- **Use your friend**: Have your truck driver friend test it!
- **Iterate**: Add features based on real feedback

---

## 🆘 TROUBLESHOOTING

**Backend won't start:**
- Check `DATABASE_URL` is correct
- Make sure PostgreSQL is running on Render
- Check all env variables are set

**Frontend can't connect to backend:**
- Make sure backend is running on port 5000
- Check `VITE_API_URL` in frontend/.env
- Check CORS settings in backend

**Database errors:**
- Run the schema.sql file
- Check table names match code
- Verify PostgreSQL version compatibility

---

**You're 80% done! The backend is COMPLETE. Just need to finish the frontend pages and deploy!** 🚀

Let me know if you want me to create any specific page in detail!
