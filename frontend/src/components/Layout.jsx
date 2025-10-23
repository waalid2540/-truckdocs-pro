import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Truck, FileText, DollarSign, Receipt, Fuel, Settings, LogOut, LayoutDashboard, Sparkles, Scan, PenTool, Package, PlusSquare, ClipboardList } from 'lucide-react'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* TOP NAVIGATION BAR - HORIZONTAL */}
      <header className="bg-white border-b-4 border-blue-600 shadow-xl sticky top-0 z-50">
        <div className="max-w-full px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo Section - LEFT */}
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-xl shadow-lg">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">TruckDocs Pro</h1>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Enterprise Platform</p>
              </div>
            </div>

            {/* HORIZONTAL NAVIGATION - CENTER */}
            <nav className="flex items-center gap-2">
              <NavLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" active={isActive('/dashboard')} />

              <div className="h-8 w-px bg-gray-300 mx-2"></div>

              {/* FREIGHT MARKETPLACE */}
              <NavLink to="/load-board" icon={Package} label="Find Loads" active={isActive('/load-board')} />
              <NavLink to="/post-load" icon={PlusSquare} label="Post Load" active={isActive('/post-load')} />
              <NavLink to="/my-bookings" icon={ClipboardList} label="My Bookings" active={isActive('/my-bookings')} />

              <div className="h-8 w-px bg-gray-300 mx-2"></div>

              {/* DOCUMENTS */}
              <NavLink to="/documents" icon={FileText} label="Documents" active={isActive('/documents')} />
              <NavLink to="/invoices" icon={DollarSign} label="Invoices" active={isActive('/invoices')} />
              <NavLink to="/expenses" icon={Receipt} label="Expenses" active={isActive('/expenses')} />
              <NavLink to="/ifta" icon={Fuel} label="IFTA" active={isActive('/ifta')} />
            </nav>

            {/* USER INFO - RIGHT */}
            <div className="flex items-center gap-4">
              <NavLink to="/settings" icon={Settings} label="Settings" active={isActive('/settings')} />

              <div className="h-8 w-px bg-gray-300"></div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-600 font-semibold">Logged in as</p>
                  <p className="font-black text-gray-900 text-sm">{user?.full_name || user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 font-bold shadow-lg text-white"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - FULL WIDTH */}
      <div className="overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

function NavLink({ to, icon: Icon, label, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 group ${
        active
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
          : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-600'}`} />
      <span className={`font-bold text-sm whitespace-nowrap ${active ? 'text-white' : 'text-gray-900'}`}>{label}</span>
    </Link>
  )
}
