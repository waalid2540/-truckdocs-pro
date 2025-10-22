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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-900 text-white flex flex-col">
        <div className="p-6 flex-1">
          <div className="flex items-center gap-2 mb-8">
            <Truck className="w-8 h-8" />
            <h1 className="text-xl font-bold">TruckDocs Pro</h1>
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

            {/* Load Board Section */}
            <div className="pt-4 border-t border-blue-800 mt-4">
              <p className="text-xs text-blue-300 px-4 mb-2 font-semibold uppercase">Load Board</p>
              <NavLink to="/load-board" icon={Package} label="Find Loads" active={isActive('/load-board')} />
              <NavLink to="/post-load" icon={PlusSquare} label="Post Load" active={isActive('/post-load')} />
              <NavLink to="/my-bookings" icon={ClipboardList} label="My Bookings" active={isActive('/my-bookings')} />
            </div>

            <div className="pt-4 border-t border-blue-800 mt-4">
              <NavLink to="/settings" icon={Settings} label="Settings" active={isActive('/settings')} />
            </div>
          </nav>
        </div>

        {/* User Info */}
        <div className="p-6 border-t border-blue-800">
          <p className="text-sm text-blue-200">Logged in as</p>
          <p className="font-medium truncate">{user?.full_name || user?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-4 w-full bg-blue-800 hover:bg-blue-700 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
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

function NavLink({ to, icon: Icon, label, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        active ? 'bg-blue-800' : 'hover:bg-blue-800'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </Link>
  )
}
