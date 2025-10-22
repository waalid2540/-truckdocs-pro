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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Enhanced */}
      <div className="w-72 bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 text-white flex flex-col shadow-2xl">
        <div className="p-6 flex-1">
          {/* Logo Section - Enhanced */}
          <div className="flex items-center gap-3 mb-10 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="bg-white p-2 rounded-lg">
              <Truck className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">TruckDocs Pro</h1>
              <p className="text-xs text-blue-200">Enterprise Solution</p>
            </div>
          </div>

          <nav className="space-y-2">
            <NavLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" active={isActive('/dashboard')} />
            <NavLink to="/ai-assistant" icon={Sparkles} label="AI Assistant" active={isActive('/ai-assistant')} />
            <NavLink to="/receipt-scanner" icon={Scan} label="Receipt Scanner" active={isActive('/receipt-scanner')} />
            <NavLink to="/signature" icon={PenTool} label="Digital Signature" active={isActive('/signature')} />
            <NavLink to="/documents" icon={FileText} label="Documents" active={isActive('/documents')} />
            <NavLink to="/invoices" icon={DollarSign} label="Invoices" active={isActive('/invoices')} />
            <NavLink to="/expenses" icon={Receipt} label="Expenses" active={isActive('/expenses')} />
            <NavLink to="/ifta" icon={Fuel} label="IFTA" active={isActive('/ifta')} />

            {/* Load Board Section - Enhanced */}
            <div className="pt-4 border-t border-white/20 mt-4">
              <div className="px-4 mb-3 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-green-400"></div>
                <p className="text-xs text-green-300 font-bold uppercase tracking-wider">Freight Marketplace</p>
              </div>
              <NavLink to="/load-board" icon={Package} label="Find Loads" active={isActive('/load-board')} />
              <NavLink to="/post-load" icon={PlusSquare} label="Post Load" active={isActive('/post-load')} />
              <NavLink to="/my-bookings" icon={ClipboardList} label="My Bookings" active={isActive('/my-bookings')} />
            </div>

            <div className="pt-4 border-t border-white/20 mt-4">
              <NavLink to="/settings" icon={Settings} label="Settings" active={isActive('/settings')} />
            </div>
          </nav>
        </div>

        {/* User Info - Enhanced */}
        <div className="p-6 border-t border-white/20 bg-black/20">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-3">
            <p className="text-xs text-blue-200 mb-1">Logged in as</p>
            <p className="font-bold truncate text-white">{user?.full_name || user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 font-semibold shadow-lg transform hover:scale-105"
          >
            <LogOut className="w-5 h-5" />
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

function NavLink({ to, icon: Icon, label, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${
        active
          ? 'bg-white text-blue-900 shadow-lg transform scale-105'
          : 'hover:bg-white/10 hover:translate-x-1 text-blue-100'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : ''}`} />
      <span className="text-sm">{label}</span>
    </Link>
  )
}
