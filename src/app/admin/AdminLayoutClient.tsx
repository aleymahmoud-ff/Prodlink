'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout'
import { useTranslation } from '@/shared/i18n'
import { cn } from '@/shared/lib/utils'
import {
  Settings,
  Users,
  Factory,
  Package,
  List,
  ChevronRight,
  GitBranch,
} from 'lucide-react'

interface TabItem {
  key: string
  href: string
  icon: React.ElementType
}

const tabs: TabItem[] = [
  { key: 'general', href: '/admin/settings', icon: Settings },
  { key: 'users', href: '/admin/users', icon: Users },
  { key: 'lines', href: '/admin/lines', icon: Factory },
  { key: 'products', href: '/admin/products', icon: Package },
  { key: 'reasons', href: '/admin/reasons', icon: List },
  { key: 'approvalLevels', href: '/admin/approval-levels', icon: GitBranch },
]

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { t } = useTranslation()

  return (
    <DashboardLayout>
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {/* Settings Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-8 py-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                {t('nav.settings')}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage your application preferences
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-h-[calc(100vh-8rem)]">
          {/* Left Tab Navigation */}
          <div className="w-64 bg-white/50 backdrop-blur-sm border-e border-slate-200/60 p-4">
            <nav className="space-y-1">
              {tabs.map((tab, index) => {
                const isActive = pathname === tab.href ||
                  (tab.href !== '/admin/settings' && pathname.startsWith(tab.href))

                return (
                  <Link
                    key={tab.key}
                    href={tab.href}
                    className={cn(
                      'group flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative',
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    )}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <div className={cn(
                      'p-1.5 rounded-lg transition-colors duration-200',
                      isActive
                        ? 'bg-white/20'
                        : 'bg-slate-100 group-hover:bg-slate-200/80'
                    )}>
                      <tab.icon className={cn(
                        'w-4 h-4 transition-colors duration-200',
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'
                      )} />
                    </div>
                    <span className="flex-1">{t(`admin.tabs.${tab.key}`)}</span>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-white/70" />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Decorative element */}
            <div className="mt-8 mx-4 p-4 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl border border-slate-200/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-slate-600">System Status</span>
              </div>
              <p className="text-xs text-slate-500">All services operational</p>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
