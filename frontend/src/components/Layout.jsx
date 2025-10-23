import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Truck, FileText, DollarSign, Receipt, Fuel, Settings, LogOut, LayoutDashboard, Sparkles, Scan, PenTool, Package, PlusSquare, ClipboardList, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [openDropdown, setOpenDropdown] = useState(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.dropdown-container')) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* TOP NAVIGATION BAR - HORIZONTAL */}
      <header className="bg-white border-b-4 border-green-600 shadow-xl sticky top-0 z-50">
        <div className="max-w-full px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo Section - LEFT */}
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-3 rounded-xl shadow-lg">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">FreightHub Pro</h1>
                <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Complete Trucking Command Center</p>
              </div>
            </div>

            {/* HORIZONTAL NAVIGATION - CENTER WITH DROPDOWNS */}
            <nav className="flex items-center gap-4">
              <NavLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" active={isActive('/dashboard')} />

              {/* LOAD BOARD DROPDOWN */}
              <DropdownMenu
                label="Load Board"
                icon={Truck}
                isOpen={openDropdown === 'loadboard'}
                onToggle={() => toggleDropdown('loadboard')}
                items={[
                  { to: '/load-board', icon: Package, label: 'Find Loads', active: isActive('/load-board') },
                  { to: '/post-load', icon: PlusSquare, label: 'Post Load', active: isActive('/post-load') },
                  { to: '/my-bookings', icon: ClipboardList, label: 'My Bookings', active: isActive('/my-bookings') }
                ]}
              />

              {/* DOCUMENTS DROPDOWN */}
              <DropdownMenu
                label="Documents"
                icon={FileText}
                isOpen={openDropdown === 'documents'}
                onToggle={() => toggleDropdown('documents')}
                items={[
                  { to: '/ai-assistant', icon: Sparkles, label: 'AI Assistant', active: isActive('/ai-assistant') },
                  { to: '/receipt-scanner', icon: Scan, label: 'Receipt Scanner', active: isActive('/receipt-scanner') },
                  { to: '/signature', icon: PenTool, label: 'Digital Signature', active: isActive('/signature') },
                  { to: '/documents', icon: FileText, label: 'Documents', active: isActive('/documents') },
                  { to: '/invoices', icon: DollarSign, label: 'Invoices', active: isActive('/invoices') },
                  { to: '/expenses', icon: Receipt, label: 'Expenses', active: isActive('/expenses') },
                  { to: '/ifta', icon: Fuel, label: 'IFTA', active: isActive('/ifta') }
                ]}
              />
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

function DropdownMenu({ label, icon: Icon, isOpen, onToggle, items }) {
  const hasActiveItem = items.some(item => item.active)

  return (
    <div className="relative dropdown-container">
      {/* Dropdown Button */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
          hasActiveItem || isOpen
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
            : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
        }`}
      >
        <Icon className={`w-5 h-5 ${hasActiveItem || isOpen ? 'text-white' : 'text-gray-600'}`} />
        <span className={`font-bold text-sm whitespace-nowrap ${hasActiveItem || isOpen ? 'text-white' : 'text-gray-900'}`}>
          {label}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${hasActiveItem || isOpen ? 'text-white' : 'text-gray-600'}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 py-2 min-w-[240px] z-50">
          {items.map((item, index) => (
            <Link
              key={index}
              to={item.to}
              onClick={onToggle}
              className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
                item.active
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <item.icon className={`w-5 h-5 ${item.active ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className={`font-semibold text-sm ${item.active ? 'text-blue-600' : 'text-gray-900'}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
