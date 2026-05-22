import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Bell, Users, FileText, Share2, Settings,
  RefreshCw, Send, Inbox, Menu, Sun, Moon, BarChart2, Activity,
  Terminal, Sparkles, History, UserCog, LogOut,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import RoboCareLogo from '../components/RoboCareLogo'

const BASE_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/history', label: 'Historique', icon: History },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/send', label: 'Envoyer', icon: Send },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/recipients', label: 'Clients', icon: Users },
  { to: '/templates', label: 'Templates', icon: FileText },
  { to: '/channels', label: 'Canaux', icon: Share2 },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/performance', label: 'Performance', icon: Activity },
  { to: '/api-test', label: 'API Test', icon: Terminal },
  { to: '/settings', label: 'Paramètres', icon: Settings },
  { to: '/users', label: 'Comptes', icon: UserCog, adminOnly: true },
]

export default function MainLayout() {
  const location = useLocation()
  const { dark, toggle } = useTheme()
  const { user, logout } = useAuth()

  const navItems = BASE_NAV.filter((n) => !n.adminOnly || user?.role === 'ADMIN')

  const current = navItems.find(
    (n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)),
  )
  const pageTitle = current?.label || 'Dashboard'

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const initials = user
    ? `${(user.prenom || '')[0] || ''}${(user.nom || '')[0] || ''}`.toUpperCase() || 'U'
    : 'U'
  const displayName = user ? `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || user.login : 'Utilisateur'
  const displayRole = user?.role || 'USER'

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
        {/* Logo header */}
        <div className="px-5 h-16 flex items-center border-b border-gray-200 dark:border-gray-800">
          <RoboCareLogo compact />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 px-3 mb-3">
            Menu
          </div>
          <ul className="flex flex-col gap-0.5">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-all font-medium group ${
                      isActive
                        ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/50'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }`
                  }
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-[15px] h-[15px]" strokeWidth={1.75} />
                    {label}
                  </span>
                  {location.pathname === to && (
                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" viewBox="0 0 6 10" fill="none">
                      <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* System Status */}
        <div className="px-3 pb-2">
          <div className="rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-900/50 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-green-700 dark:text-green-400" strokeWidth={1.75} />
              <span className="text-[11px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">
                System Status
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-[12px] text-green-700 dark:text-green-400 font-medium">
                All systems operational
              </span>
            </div>
          </div>
        </div>

        {/* User info + logout */}
        <div className="px-3 pb-4 border-t border-gray-200 dark:border-gray-800 pt-3 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-gray-900 dark:text-gray-100 leading-tight truncate">
                {displayName}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                {displayRole}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors w-full font-medium"
          >
            <LogOut className="w-[15px] h-[15px]" strokeWidth={1.75} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main column ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors lg:hidden">
              <Menu className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </button>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-gray-100 text-[16px] leading-tight">
                {pageTitle}
              </h1>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5 capitalize">
                {today}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </button>
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </button>
            <button
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              aria-label="Toggle dark mode"
              title={dark ? 'Mode clair' : 'Mode sombre'}
            >
              {dark
                ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.75} />
                : <Moon className="w-[18px] h-[18px]" strokeWidth={1.75} />}
            </button>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            <div className="flex items-center gap-2.5 ml-1">
              <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold">
                {initials}
              </div>
              <div className="hidden sm:block">
                <div className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                  {displayName}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                  {displayRole}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
