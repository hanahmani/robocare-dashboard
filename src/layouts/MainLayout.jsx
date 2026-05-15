import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Bell,
  Users,
  FileText,
  Share2,
  Settings,
  RefreshCw,
  User,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/recipients', label: 'Recipients', icon: Users },
  { to: '/templates', label: 'Templates', icon: FileText },
  { to: '/channels', label: 'Channels', icon: Share2 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function MainLayout() {
  const location = useLocation()
  const current = navItems.find(
    (n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)),
  )
  const pageTitle = current?.label || 'Dashboard'

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-5 h-14 flex items-center border-b border-gray-200">
          <span className="font-semibold text-gray-900 text-[15px]">RoboCare Service</span>
        </div>
        <nav className="flex-1 py-3 px-2">
          <ul className="space-y-0.5">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'text-brand-600 bg-brand-50 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
              aria-label="Toggle menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h1 className="font-semibold text-gray-900 text-[15px]">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-xs font-medium">
              <User className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
