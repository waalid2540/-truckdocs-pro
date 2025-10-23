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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Sidebar - PREMIUM REDESIGN */}
      <div className="w-80 bg-white flex flex-col shadow-2xl border-r-4 border-blue-600">
        <div className="p-8 flex-1">
          {/* Logo Section - LUXURY */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-2xl shadow-xl mb-4">
              <Truck className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-1">TruckDocs Pro</h1>
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Enterprise Platform</p>
          </div>

          <nav className="space-y-2">
            <NavLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" active={isActive('/dashboard')} />

            {/* FREIGHT MARKETPLACE - TOP SECTION */}
            <div className="pt-6 border-t-2 border-gray-200 mt-6">
              <div className="px-2 mb-4 flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border-l-4 border-green-500">
                <Truck className="w-5 h-5 text-green-600" />
                <p className="text-sm text-gray-900 font-black uppercase tracking-wide">Freight Marketplace</p>
              </div>
              <div className="space-y-2">
                <NavLink to="/load-board" icon={Package} label="Find Loads" active={isActive('/load-board')} />
                <NavLink to="/post-load" icon={PlusSquare} label="Post Load" active={isActive('/post-load')} />
                <NavLink to="/my-bookings" icon={ClipboardList} label="My Bookings" active={isActive('/my-bookings')} />
              </div>
            </div>

            {/* DOCUMENTS & OPERATIONS */}
            <div className="pt-6 border-t-2 border-gray-200 mt-6">
              <div className="px-2 mb-4 flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border-l-4 border-blue-500">
                <FileText className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-gray-900 font-black uppercase tracking-wide">Documents & Finance</p>
              </div>
              <div className="space-y-2">
                <NavLink to="/ai-assistant" icon={Sparkles} label="AI Assistant" active={isActive('/ai-assistant')} />
                <NavLink to="/receipt-scanner" icon={Scan} label="Receipt Scanner" active={isActive('/receipt-scanner')} />
                <NavLink to="/signature" icon={PenTool} label="Digital Signature" active={isActive('/signature')} />
                <NavLink to="/documents" icon={FileText} label="Documents" active={isActive('/documents')} />
                <NavLink to="/invoices" icon={DollarSign} label="Invoices" active={isActive('/invoices')} />
                <NavLink to="/expenses" icon={Receipt} label="Expenses" active={isActive('/expenses')} />
                <NavLink to="/ifta" icon={Fuel} label="IFTA" active={isActive('/ifta')} />
              </div>
            </div>

            <div className="pt-6 border-t-2 border-gray-200 mt-6">
              <NavLink to="/settings" icon={Settings} label="Settings" active={isActive('/settings')} />
            </div>
          </nav>
        </div>

        {/* User Info - PREMIUM */}
        <div className="p-8 border-t-2 border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="bg-white rounded-2xl p-5 mb-4 shadow-lg border border-gray-200">
            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-2">Logged in as</p>
            <p className="font-black text-gray-900 truncate text-lg">{user?.full_name || user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 font-bold shadow-xl transform hover:scale-105 text-white text-base"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
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
      className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-200 group ${
        active
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl transform scale-105'
          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md hover:scale-102 border border-gray-200'
      }`}
    >
      <div className={`p-2 rounded-lg ${active ? 'bg-white/20' : 'bg-white group-hover:bg-blue-50'}`}>
        <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-blue-600'}`} />
      </div>
      <span className={`font-bold text-base ${active ? 'text-white' : 'text-gray-900'}`}>{label}</span>
    </Link>
  )
}
