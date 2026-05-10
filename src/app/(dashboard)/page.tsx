'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/features/auth/hooks/useUser'
import { useTranslation } from '@/shared/i18n'
import { Header } from '@/shared/components/layout/Header'
import { Factory, Trash2, RefreshCw, Clock, AlertTriangle, LayoutDashboard, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  todayProduction: number
  pendingApprovals: number
  todayWaste: number
  todayReprocessing: number
}

interface RecentActivity {
  id: string
  type: 'production' | 'waste' | 'damage' | 'reprocessing'
  product_name: string
  quantity: number
  created_at: string
  // Production rows expose this; non-production rows do not (FR-016 scope).
  production_date?: string
  user_name: string
}

export default function DashboardPage() {
  const { user, profile, isLoading } = useUser()
  const { t, locale } = useTranslation()
  const [stats, setStats] = useState<DashboardStats>({
    todayProduction: 0,
    pendingApprovals: 0,
    todayWaste: 0,
    todayReprocessing: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [hasFetched, setHasFetched] = useState(false)

  useEffect(() => {
    if (user && !hasFetched) {
      fetchDashboardData()
      setHasFetched(true)
    }
  }, [user, hasFetched])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (!response.ok) throw new Error('Failed to fetch dashboard data')

      const data = await response.json()
      setStats(data.stats)
      setRecentActivity(data.recentActivity)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 font-medium">{t('common.loading')}</span>
        </div>
      </div>
    )
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'production': return Factory
      case 'waste': return Trash2
      case 'damage': return AlertTriangle
      case 'reprocessing': return RefreshCw
      default: return Factory
    }
  }

  const getActivityStyles = (type: string) => {
    switch (type) {
      case 'production': return { bg: 'bg-blue-50', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' }
      case 'waste': return { bg: 'bg-red-50', icon: 'text-red-600', badge: 'bg-red-100 text-red-700' }
      case 'damage': return { bg: 'bg-amber-50', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' }
      case 'reprocessing': return { bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' }
      default: return { bg: 'bg-slate-50', icon: 'text-slate-600', badge: 'bg-slate-100 text-slate-700' }
    }
  }

  const getActivityLabel = (type: string) => {
    return t(`nav.${type}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  // For production rows, the meaningful date is the production calendar day
  // (FR-016) — not the insertion timestamp. ISO 'YYYY-MM-DD' parsed as local.
  const formatProductionDate = (iso: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
    const [y, m, d] = iso.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  return (
    <div>
      <Header
        title={t('dashboard.title')}
        subtitle={t('dashboard.todayOverview')}
        icon={
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-violet-500 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">{t('dashboard.welcomeBack')}</p>
              <h2 className="text-2xl font-bold mt-1">{profile?.fullName || user?.name}</h2>
              <p className="text-blue-100 mt-2 text-sm">
                Track your production metrics and activities
              </p>
            </div>
            <div className="hidden md:block">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <TrendingUp className="w-12 h-12 text-white/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t('dashboard.todayProduction')}
            value={loadingStats ? '...' : stats.todayProduction.toString()}
            icon={Factory}
            gradient="from-blue-500 to-blue-600"
            shadowColor="shadow-blue-500/20"
            href="/production"
          />
          <StatCard
            title={t('dashboard.pendingApprovals')}
            value={loadingStats ? '...' : stats.pendingApprovals.toString()}
            icon={Clock}
            gradient="from-amber-500 to-orange-500"
            shadowColor="shadow-amber-500/20"
            href="/approvals"
          />
          <StatCard
            title={t('dashboard.todayWaste')}
            value={loadingStats ? '...' : stats.todayWaste.toString()}
            icon={Trash2}
            gradient="from-red-500 to-red-600"
            shadowColor="shadow-red-500/20"
            href="/waste"
          />
          <StatCard
            title={t('dashboard.reprocessing')}
            value={loadingStats ? '...' : stats.todayReprocessing.toString()}
            icon={RefreshCw}
            gradient="from-emerald-500 to-emerald-600"
            shadowColor="shadow-emerald-500/20"
            href="/reprocessing"
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-violet-400 to-violet-500 rounded-xl shadow-sm">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{t('dashboard.recentActivity')}</h3>
                  <p className="text-sm text-slate-500">Latest entries across all categories</p>
                </div>
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {loadingStats ? (
              <div className="p-8 text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-slate-500 font-medium">{t('common.loading')}</span>
                </div>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="p-8">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-medium">{t('dashboard.noRecentActivity')}</p>
                  <p className="text-slate-400 text-sm mt-1">Start by recording production entries</p>
                </div>
              </div>
            ) : (
              recentActivity.map((activity, index) => {
                const Icon = getActivityIcon(activity.type)
                const styles = getActivityStyles(activity.type)
                return (
                  <div
                    key={`${activity.type}-${activity.id}`}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`p-2.5 rounded-xl ${styles.bg}`}>
                      <Icon className={`w-5 h-5 ${styles.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {activity.product_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${styles.badge}`}>
                          {getActivityLabel(activity.type)}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{activity.quantity} units</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{activity.user_name}</span>
                      </div>
                    </div>
                    <div className="text-sm text-slate-400 font-medium whitespace-nowrap">
                      {activity.type === 'production' && activity.production_date
                        ? formatProductionDate(activity.production_date)
                        : formatDate(activity.created_at)}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  icon: React.ElementType
  gradient: string
  shadowColor: string
  href: string
}

function StatCard({ title, value, icon: Icon, gradient, shadowColor, href }: StatCardProps) {
  return (
    <Link href={href} className="group">
      <div className={`bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 hover:shadow-lg ${shadowColor} transition-all duration-300 hover:-translate-y-0.5`}>
        <div className="flex items-start justify-between">
          <div className={`p-2.5 bg-gradient-to-br ${gradient} rounded-xl shadow-lg ${shadowColor}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500 mt-1 font-medium">{title}</p>
        </div>
      </div>
    </Link>
  )
}
