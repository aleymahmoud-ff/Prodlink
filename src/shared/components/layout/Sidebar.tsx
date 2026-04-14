'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/lib/utils'
import { useUser } from '@/features/auth/hooks/useUser'
import { useTranslation } from '@/shared/i18n'
import {
  LayoutDashboard,
  Factory,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Settings,
  LogOut,
  Globe,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Boxes,
  ChevronUp,
  User,
  Moon,
  Sun,
} from 'lucide-react'
import { signOut } from '@/features/auth/services/auth'

interface NavItem {
  key: string
  href: string
  icon: React.ElementType
  roles?: string[]
  bgColor: string
  textColor: string
}

const navigation: NavItem[] = [
  { key: 'dashboard', href: '/', icon: LayoutDashboard, bgColor: 'bg-indigo-50 hover:bg-indigo-100', textColor: 'text-indigo-600' },
  { key: 'production', href: '/production', icon: Factory, bgColor: 'bg-emerald-50 hover:bg-emerald-100', textColor: 'text-emerald-600' },
  { key: 'waste', href: '/waste', icon: Trash2, bgColor: 'bg-rose-50 hover:bg-rose-100', textColor: 'text-rose-600' },
  { key: 'damage', href: '/damage', icon: AlertTriangle, bgColor: 'bg-amber-50 hover:bg-amber-100', textColor: 'text-amber-600' },
  { key: 'reprocessing', href: '/reprocessing', icon: RefreshCw, bgColor: 'bg-purple-50 hover:bg-purple-100', textColor: 'text-purple-600' },
  { key: 'approvals', href: '/approvals', icon: ClipboardCheck, roles: ['admin', 'approver'], bgColor: 'bg-cyan-50 hover:bg-cyan-100', textColor: 'text-cyan-600' },
]

const adminNavigation: NavItem[] = [
  { key: 'settings', href: '/admin/settings', icon: Settings, roles: ['admin'], bgColor: 'bg-slate-100 hover:bg-slate-200', textColor: 'text-slate-600' },
]

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user, profile, isLoading } = useUser()
  const { t, locale, setLocale } = useTranslation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayUser = profile
    ? { fullName: profile.fullName, email: profile.email, role: profile.role }
    : user
    ? { fullName: user.name || user.email, email: user.email, role: user.role }
    : null
  const isAdmin = displayUser?.role === 'admin'

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    setUserMenuOpen(false)
    await signOut()
  }

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'ar' : 'en')
    setUserMenuOpen(false)
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-e border-slate-200 transition-all duration-300",
      collapsed ? "w-20" : "w-72"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 border-b border-slate-100",
        collapsed ? "justify-center px-4" : "justify-between px-5"
      )}>
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-slate-800">ProdLink</h1>
              <p className="text-[10px] text-slate-400 font-medium -mt-0.5">Production Manager</p>
            </div>
          )}
        </Link>
      </div>

      {/* Collapse Button */}
      {onToggle && (
        <button
          onClick={onToggle}
          className={cn(
            "hidden lg:flex items-center justify-center mx-4 mt-4 h-9 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors",
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Menu</span>
            </div>
          )}
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto scrollbar-hide">
        {!collapsed && (
          <p className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Navigation
          </p>
        )}

        <div className="space-y-0.5">
          {navigation
            .filter((item) => !item.roles || (profile && item.roles.includes(profile.role)))
            .map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 px-2.5 py-2 rounded-xl font-medium transition-all duration-200',
                    isActive
                      ? `${item.bgColor.split(' ')[0]} ${item.textColor}`
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? t(`nav.${item.key}`) : undefined}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
                    isActive
                      ? `${item.bgColor.split(' ')[0].replace('50', '100')} ${item.textColor}`
                      : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                  )}>
                    <item.icon className="w-[18px] h-[18px]" />
                  </div>
                  {!collapsed && (
                    <span className="text-sm">{t(`nav.${item.key}`)}</span>
                  )}
                </Link>
              )
            })}
        </div>

        {isAdmin && (
          <>
            <div className={cn("my-3 border-t border-slate-100", collapsed && "mx-2")} />

            {!collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Admin
              </p>
            )}

            <div className="space-y-0.5">
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith('/admin/')
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 px-2.5 py-2 rounded-xl font-medium transition-all duration-200',
                      isActive
                        ? `${item.bgColor.split(' ')[0]} ${item.textColor}`
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                      collapsed && 'justify-center px-2'
                    )}
                    title={collapsed ? t(`nav.${item.key}`) : undefined}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
                      isActive
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                    )}>
                      <item.icon className="w-[18px] h-[18px]" />
                    </div>
                    {!collapsed && (
                      <span className="text-sm">{t(`nav.${item.key}`)}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </nav>

      {/* User Menu Section */}
      <div className="relative p-3 border-t border-slate-100" ref={menuRef}>
        {/* User Menu Dropdown */}
        {userMenuOpen && !collapsed && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
            <div className="p-2">
              <Link
                href="/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">My Profile</span>
              </Link>

              <button
                onClick={toggleLanguage}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {locale === 'en' ? 'العربية' : 'English'}
                </span>
              </button>

              <div className="my-2 border-t border-slate-100" />

              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">{t('auth.signOut')}</span>
              </button>
            </div>
          </div>
        )}

        {/* User Profile Button */}
        {!isLoading && displayUser && !collapsed && (
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={cn(
              "w-full p-3 rounded-xl transition-all duration-200",
              userMenuOpen
                ? "bg-slate-100"
                : "bg-gradient-to-r from-slate-50 to-slate-100/50 hover:from-slate-100 hover:to-slate-100"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {displayUser.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-slate-700 truncate">{displayUser.fullName}</p>
                <p className="text-xs text-slate-400 truncate">{displayUser.email}</p>
              </div>
              <ChevronUp className={cn(
                "w-4 h-4 text-slate-400 transition-transform duration-200",
                userMenuOpen ? "rotate-0" : "rotate-180"
              )} />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-indigo-100 text-indigo-600">
                {t(`admin.users.roles.${displayUser.role}`)}
              </span>
            </div>
          </button>
        )}

        {/* Collapsed state - just show avatar that opens menu */}
        {!isLoading && displayUser && collapsed && (
          <div className="relative">
            {userMenuOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                <div className="p-2">
                  <div className="px-3 py-2 border-b border-slate-100 mb-2">
                    <p className="text-sm font-semibold text-slate-700 truncate">{displayUser.fullName}</p>
                    <p className="text-xs text-slate-400 truncate">{displayUser.email}</p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">My Profile</span>
                  </Link>

                  <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {locale === 'en' ? 'العربية' : 'English'}
                    </span>
                  </button>

                  <div className="my-2 border-t border-slate-100" />

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('auth.signOut')}</span>
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={cn(
                "w-full flex items-center justify-center p-2 rounded-xl transition-colors",
                userMenuOpen ? "bg-slate-100" : "hover:bg-slate-50"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {displayUser.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
