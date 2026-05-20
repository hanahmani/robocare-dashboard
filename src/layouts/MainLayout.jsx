import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
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
  MoonStar,
  SunMedium,
  BarChart2,
  Activity,
  Terminal,
} from 'lucide-react'
import { useDarkMode } from '../hooks/useDarkMode'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/send', label: 'Send', icon: Send },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/templates', label: 'Templates', icon: FileText },
  { to: '/channels', label: 'Channels', icon: Share2 },
  // New analytics & tools
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/performance', label: 'Performance', icon: Activity },
  { to: '/api-test', label: 'API Test', icon: Terminal },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function MainLayout() {
  const location = useLocation()
  const [dark, setDark] = useDarkMode()
  const theme = dark ? 'dark' : 'light'
  const [role, setRole] = useState(() => localStorage.getItem('robocare.role') || 'Admin')
  const [scheduledCount, setScheduledCount] = useState(0)
  const filteredNavItems = useMemo(
    () => navItems.filter((item) => !(role === 'Agronome' && item.to === '/settings')),
    [role],
  )

  useEffect(() => {
    localStorage.setItem('robocare.theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    localStorage.setItem('robocare.role', role)
  }, [role])

  useEffect(() => {
    const syncScheduledCount = () => {
      try {
        const queue = JSON.parse(localStorage.getItem('robocare.notificationSchedules') || '[]')
        setScheduledCount(Array.isArray(queue) ? queue.length : 0)
      } catch {
        setScheduledCount(0)
      }
    }

    syncScheduledCount()
    window.addEventListener('storage', syncScheduledCount)
    const timer = window.setInterval(syncScheduledCount, 10000)

    return () => {
      window.removeEventListener('storage', syncScheduledCount)
      window.clearInterval(timer)
    }
  }, [])

  const current = filteredNavItems.find(
    (n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)),
  )
  const pageTitle = current?.label || 'Dashboard'
  const shellClass = theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
  const sidebarClass = theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-white'
  const topbarClass = theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-white'

  return (
    <div className={`flex min-h-screen ${shellClass}`}>
      {/* Sidebar */}
      <aside className={`w-64 shrink-0 border-r flex flex-col shadow-sm ${sidebarClass}`}>
        <div className={`px-6 h-16 flex items-center border-b ${theme === 'dark' ? 'border-slate-800' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
              RC
            </div>
            <div>
              <div className={`font-bold text-sm ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>RoboCare</div>
              <div className="font-semibold text-blue-600 text-xs">Service</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {filteredNavItems.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all font-medium ${
                      isActive
                        ? 'text-blue-600 bg-blue-50 shadow-sm'
                        : theme === 'dark'
                          ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className={`px-3 py-4 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-gray-200'}`}>
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
            <User className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`} />
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>{role}</div>
              <div className={`text-xs truncate ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>{role === 'Admin' ? 'admin@robocare.io' : 'agronome@robocare.io'}</div>
            </div>
            <button
              type="button"
              onClick={() => setRole((value) => (value === 'Admin' ? 'Agronome' : 'Admin'))}
              className="text-[11px] font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700"
            >
              Switch
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className={`h-16 border-b flex items-center justify-between px-8 shadow-sm ${topbarClass}`}>
          <div className="flex items-center gap-3">
            <h1 className={`font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-900 text-slate-300' : 'hover:bg-gray-100 text-gray-600'}`}
              aria-label="Refresh"
              onClick={() => window.dispatchEvent(new CustomEvent('robocare:refresh'))}
            >
              <RefreshCw className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => setDark((v) => !v)}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-900 text-slate-300' : 'hover:bg-gray-100 text-gray-600'}`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <SunMedium className="w-5 h-5" strokeWidth={1.5} /> : <MoonStar className="w-5 h-5" strokeWidth={1.5} />}
            </button>
            <button
              className={`p-2 rounded-lg transition-colors relative ${theme === 'dark' ? 'hover:bg-slate-900 text-slate-300' : 'hover:bg-gray-100 text-gray-600'}`}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" strokeWidth={1.5} />
              {scheduledCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
                  {scheduledCount}
                </span>
              )}
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-semibold">
              A
            </div>
          </div>
        </header>

        {/* Content */}
        <main className={`flex-1 overflow-auto ${theme === 'dark' ? 'bg-slate-950' : 'bg-gray-50'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
