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
  Send,
  Inbox,
  Menu,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/send', label: 'Send', icon: Send },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
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
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white flex flex-col shadow-sm">
        <div className="px-6 h-14 flex items-center border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
              RC
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">RoboCare Service</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-3 px-3 overflow-y-auto">
          <ul className="flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md text-[13px] transition-all font-medium ${
                      isActive
                        ? 'text-brand-600 bg-brand-50'
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
        <div className="px-3 py-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-md bg-gray-50">
            <User className="w-4 h-4 text-gray-600" strokeWidth={1.75} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-gray-900">Admin</div>
              <div className="text-xs text-gray-500 truncate">admin@robocare.io</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-md hover:bg-gray-50 text-gray-600">
              <Menu className="w-5 h-5" strokeWidth={1.75} />
            </button>
            <h1 className="font-bold text-gray-900 text-[15px]">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-md hover:bg-gray-50 text-gray-600" aria-label="Refresh">
              <RefreshCw className="w-5 h-5" strokeWidth={1.75} />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-semibold">
              <User className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
