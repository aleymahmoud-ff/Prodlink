'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Header } from '@/shared/components/layout/Header'
import { Button } from '@/shared/components/ui/Button'
import { useUser } from '@/features/auth/hooks/useUser'
import { useTranslation } from '@/shared/i18n'
import {
  clientTodayISO,
  clientYesterdayISO,
  formatDayLabel,
  useMidnightTick,
} from '@/shared/lib/date/factory-day'
import { ExceptionalEntryForm } from './exceptional-entry-form'
import { Factory, Filter, Save, History, Search, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle, Package, CalendarClock, ShieldCheck } from 'lucide-react'

interface Line {
  id: string
  name: string
  code: string
  type: string
  is_active: boolean
}

interface Product {
  id: string
  name: string
  code: string
  category: string | null
  unit_of_measure: string
  line_id: string | null
  is_active: boolean
}

interface ProductionEntry {
  id: string
  line_id: string
  product_id: string
  quantity: number
  unit_of_measure: string
  batch_number: string | null
  notes: string | null
  created_by: string
  created_at: string
  production_date: string
  lines?: { id: string; name: string; code: string; type?: string }
  products?: { id: string; name: string; code: string }
  profiles?: { id: string; full_name: string }
}

interface ProductEntry {
  product_id: string
  quantity: string
  unit_of_measure: string
}

interface ProductTotals {
  // "Today" here means the currently-selected production date (Today or Yesterday).
  // The names are kept for backwards-compatibility with existing column headers.
  userToday: number
  globalToday: number
}

type ProductionMode = 'today' | 'yesterday'

const UNIT_OPTIONS = [
  { value: 'unit', label: 'Unit / Piece' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'l', label: 'Liter (L)' },
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'box', label: 'Box' },
  { value: 'carton', label: 'Carton' },
  { value: 'tray', label: 'Tray' },
]

type SortField = 'code' | 'name' | 'userToday' | 'globalToday'
type SortDirection = 'asc' | 'desc'

export default function ProductionPage() {
  const [entries, setEntries] = useState<ProductionEntry[]>([])
  const [lines, setLines] = useState<Line[]>([])
  const [products, setProducts] = useState<Product[]>([])
  // Entries fetched per day so per-row totals can use either day's data.
  const [todayEntries, setTodayEntries] = useState<ProductionEntry[]>([])
  const [yesterdayEntries, setYesterdayEntries] = useState<ProductionEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  // Per-row Today/Yesterday selection. Defaults to 'today' for any product
  // that has not been individually flipped (or bulk-set). Resets to empty
  // on every page load (FR-002) so each session starts from Today.
  const [rowModes, setRowModes] = useState<Record<string, ProductionMode>>({})
  // Bumped by useMidnightTick to force re-derivation of the resolved dates
  // when the local clock crosses midnight (FR-007a).
  const [dayTick, setDayTick] = useState(0)
  // Admin-only Exceptional Entry view (Story 2). Hidden from non-admins.
  const [showExceptional, setShowExceptional] = useState(false)

  // Filters
  const [selectedLineId, setSelectedLineId] = useState<string>('')
  const [selectedLineType, setSelectedLineType] = useState<string>('')
  const [productSearch, setProductSearch] = useState<string>('')

  // Sorting
  const [sortField, setSortField] = useState<SortField>('code')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Product entries (quantity for each product)
  const [productEntries, setProductEntries] = useState<Record<string, ProductEntry>>({})

  const { user, profile } = useUser()
  const { t } = useTranslation()

  // Resolved calendar dates for the toggle. Recomputed when the day ticks.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const todayISO = useMemo(() => clientTodayISO(), [dayTick])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const yesterdayISO = useMemo(() => clientYesterdayISO(), [dayTick])

  // Resolve a row's currently-selected production date.
  const getRowMode = (productId: string): ProductionMode =>
    rowModes[productId] ?? 'today'
  const getRowDateISO = (productId: string): string =>
    getRowMode(productId) === 'today' ? todayISO : yesterdayISO

  // Re-arm the midnight refresh whenever this component is mounted.
  useMidnightTick(() => setDayTick(t => t + 1))

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [entriesRes, linesRes, productsRes, todayRes, yesterdayRes] = await Promise.all([
        fetch('/api/production'),
        fetch('/api/lines'),
        fetch('/api/products'),
        fetch(`/api/production?date=${todayISO}`),
        fetch(`/api/production?date=${yesterdayISO}`),
      ])

      if (entriesRes.ok) {
        const data = await entriesRes.json()
        setEntries(data)
      }
      if (linesRes.ok) {
        const data = await linesRes.json()
        setLines(data.filter((l: Line) => l.is_active))
      }
      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data.filter((p: Product) => p.is_active))
      }
      if (todayRes.ok) {
        const data = await todayRes.json()
        setTodayEntries(data)
      }
      if (yesterdayRes.ok) {
        const data = await yesterdayRes.json()
        setYesterdayEntries(data)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [todayISO, yesterdayISO])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user?.id, fetchData])

  // Reset product entries and per-row date selections when line changes
  useEffect(() => {
    setProductEntries({})
    setProductSearch('')
    setRowModes({})
  }, [selectedLineId])

  // Filter lines by type
  const filteredLines = selectedLineType
    ? lines.filter(line => line.type === selectedLineType)
    : lines

  // Get products for selected line
  const lineProducts = selectedLineId
    ? products.filter(p => p.line_id === selectedLineId)
    : []

  // Calculate totals for each product on its OWN selected day. Each row's
  // toggle picks Today or Yesterday independently, so totals must follow.
  const productTotals = useMemo(() => {
    const totals: Record<string, ProductTotals> = {}

    lineProducts.forEach(product => {
      const mode = rowModes[product.id] ?? 'today'
      const source = mode === 'today' ? todayEntries : yesterdayEntries

      const userEntries = source.filter(
        e => e.product_id === product.id && e.created_by === profile?.id
      )
      const globalEntries = source.filter(
        e => e.product_id === product.id
      )

      totals[product.id] = {
        userToday: userEntries.reduce((sum, e) => sum + e.quantity, 0),
        globalToday: globalEntries.reduce((sum, e) => sum + e.quantity, 0),
      }
    })

    return totals
  }, [lineProducts, todayEntries, yesterdayEntries, rowModes, profile?.id])

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = lineProducts

    // Filter by search
    if (productSearch.trim()) {
      const search = productSearch.toLowerCase()
      filtered = filtered.filter(
        p => p.name.toLowerCase().includes(search) ||
             p.code.toLowerCase().includes(search)
      )
    }

    // Sort
    return [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'code':
          comparison = a.code.localeCompare(b.code)
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'userToday':
          comparison = (productTotals[a.id]?.userToday || 0) - (productTotals[b.id]?.userToday || 0)
          break
        case 'globalToday':
          comparison = (productTotals[a.id]?.globalToday || 0) - (productTotals[b.id]?.globalToday || 0)
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [lineProducts, productSearch, sortField, sortDirection, productTotals])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-slate-400" />
    return sortDirection === 'asc'
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />
  }

  const handleQuantityChange = (productId: string, quantity: string, defaultUnit: string) => {
    setProductEntries(prev => ({
      ...prev,
      [productId]: {
        product_id: productId,
        quantity,
        unit_of_measure: prev[productId]?.unit_of_measure || defaultUnit,
      }
    }))
  }

  const handleUnitChange = (productId: string, unit: string, defaultUnit: string) => {
    setProductEntries(prev => ({
      ...prev,
      [productId]: {
        product_id: productId,
        quantity: prev[productId]?.quantity || '',
        unit_of_measure: unit,
      }
    }))
  }

  const handleSubmit = async () => {
    if (!profile || !selectedLineId) return

    // Filter entries that have quantity > 0
    const validEntries = Object.values(productEntries).filter(
      entry => entry.quantity && parseFloat(entry.quantity) > 0
    )

    if (validEntries.length === 0) {
      setError('Please enter quantity for at least one product')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    // Snapshot the dates at submit time so a midnight tick mid-flight can't
    // change which day the entries land on.
    const clientToday = todayISO
    const today = todayISO
    const yesterday = yesterdayISO
    // Resolve each row's date snapshot up-front to avoid mid-loop drift.
    const rows = validEntries.map((entry) => ({
      ...entry,
      production_date: (rowModes[entry.product_id] ?? 'today') === 'today' ? today : yesterday,
    }))

    try {
      for (const entry of rows) {
        const response = await fetch('/api/production', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            line_id: selectedLineId,
            product_id: entry.product_id,
            quantity: parseFloat(entry.quantity),
            unit_of_measure: entry.unit_of_measure,
            production_date: entry.production_date,
            client_today: clientToday,
          }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          if (response.status === 403 && data?.error === 'backdate_not_allowed_for_role') {
            throw new Error('Only admins can record production for an earlier date. Use the Exceptional Entry view.')
          }
          if (response.status === 400 && data?.error === 'invalid_production_date') {
            throw new Error('Invalid production date. Please reload and try again.')
          }
          throw new Error('Failed to save entry')
        }
      }

      const dates = Array.from(new Set(rows.map(r => r.production_date))).sort()
      const dateSummary = dates.length === 1
        ? `for ${formatDayLabel(dates[0])}`
        : `across ${dates.map(formatDayLabel).join(' and ')}`
      setSuccess(`Successfully recorded ${rows.length} production ${rows.length === 1 ? 'entry' : 'entries'} ${dateSummary}`)
      setProductEntries({})
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const hasEntries = Object.values(productEntries).some(
    entry => entry.quantity && parseFloat(entry.quantity) > 0
  )

  return (
    <div>
      <Header
        title={t('production.title')}
        subtitle={t('production.description')}
        icon={
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
            <Factory className="w-5 h-5 text-white" />
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            {profile?.role === 'admin' && (
              <Button
                variant={showExceptional ? 'primary' : 'outline'}
                onClick={() => setShowExceptional(v => !v)}
                className="rounded-xl"
              >
                <ShieldCheck className="w-4 h-4 me-2" />
                {showExceptional ? 'Hide Exceptional Entry' : 'Exceptional Entry'}
              </Button>
            )}
            <Button
              variant={showHistory ? 'primary' : 'outline'}
              onClick={() => setShowHistory(!showHistory)}
              className="rounded-xl"
            >
              <History className="w-4 h-4 me-2" />
              {showHistory ? 'Hide History' : 'Show History'}
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Exceptional Entry — admin only. Non-admins render no DOM at all. */}
        {profile?.role === 'admin' && showExceptional && (
          <ExceptionalEntryForm
            lines={lines}
            products={products}
            onClose={() => setShowExceptional(false)}
            onSaved={fetchData}
          />
        )}

        {/* Filters Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl shadow-sm">
                <Filter className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Filter Production Line</h3>
                <p className="text-sm text-slate-500">Select a line to record production</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Line Type
                </label>
                <select
                  value={selectedLineType}
                  onChange={(e) => {
                    setSelectedLineType(e.target.value)
                    setSelectedLineId('')
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer hover:bg-slate-100"
                >
                  <option value="">All Types</option>
                  <option value="finished">Finished</option>
                  <option value="semi-finished">Semi-Finished</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Production Line *
                </label>
                <select
                  value={selectedLineId}
                  onChange={(e) => setSelectedLineId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer hover:bg-slate-100"
                >
                  <option value="">Select a production line</option>
                  {filteredLines.map((line) => (
                    <option key={line.id} value={line.id}>
                      {line.name} ({line.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-3">
            <div className="p-1 bg-red-100 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-3">
            <div className="p-1 bg-emerald-100 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
            {success}
          </div>
        )}

        {/* Set all rows — sits directly above the products table. Only shown
            when a line is selected (otherwise there's nothing to act on). */}
        {selectedLineId && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="px-6 py-4 flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl shadow-sm">
                  <CalendarClock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Set all rows</h3>
                  <p className="text-sm text-slate-500">
                    Apply a date to every product in the table. Each row can be flipped individually.
                  </p>
                </div>
              </div>
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => {
                    if (filteredAndSortedProducts.length === 0) return
                    const next: Record<string, ProductionMode> = { ...rowModes }
                    filteredAndSortedProducts.forEach(p => { next[p.id] = 'today' })
                    setRowModes(next)
                  }}
                  disabled={filteredAndSortedProducts.length === 0}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 hover:text-slate-900 hover:bg-white transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  All to Today <span className="text-xs text-slate-500">({formatDayLabel(todayISO)})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (filteredAndSortedProducts.length === 0) return
                    const next: Record<string, ProductionMode> = { ...rowModes }
                    filteredAndSortedProducts.forEach(p => { next[p.id] = 'yesterday' })
                    setRowModes(next)
                  }}
                  disabled={filteredAndSortedProducts.length === 0}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 hover:text-slate-900 hover:bg-white transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  All to Yesterday <span className="text-xs text-slate-500">({formatDayLabel(yesterdayISO)})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        {selectedLineId ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl shadow-sm">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Products for {lines.find(l => l.id === selectedLineId)?.name}
                    </h3>
                    <p className="text-sm text-slate-500">{filteredAndSortedProducts.length} products available</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Product Search */}
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search products..."
                      className="ps-10 pe-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64"
                    />
                  </div>
                  {hasEntries && (
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/20">
                      <Save className="w-4 h-4 me-2" />
                      {isSubmitting ? 'Saving...' : 'Save Entries'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-slate-500 font-medium">{t('common.loading')}</span>
                </div>
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Factory className="w-8 h-8 text-slate-400" />
                </div>
                {productSearch ? (
                  <p className="text-slate-600 font-medium">No products match your search</p>
                ) : (
                  <>
                    <p className="text-slate-600 font-medium">No products assigned to this line</p>
                    <p className="text-sm text-slate-500 mt-2">Go to Settings → Products to assign products</p>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th
                        className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => handleSort('code')}
                      >
                        <div className="flex items-center gap-2">
                          Code
                          <SortIcon field="code" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-2">
                          Product
                          <SortIcon field="name" />
                        </div>
                      </th>
                      <th className="px-4 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider w-44">
                        Date
                      </th>
                      <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider w-40">
                        Quantity
                      </th>
                      <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider w-36">
                        Unit
                      </th>
                      <th
                        className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => handleSort('userToday')}
                      >
                        <div className="flex items-center gap-2">
                          My Total
                          <SortIcon field="userToday" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => handleSort('globalToday')}
                      >
                        <div className="flex items-center gap-2">
                          All Users
                          <SortIcon field="globalToday" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {filteredAndSortedProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2.5 py-1 text-xs font-mono font-medium bg-slate-100 text-slate-700 rounded-lg">
                            {product.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-900">
                            {product.name}
                          </div>
                          {product.category && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              {product.category}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div
                            role="radiogroup"
                            aria-label={`Production date for ${product.name}`}
                            className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
                          >
                            <button
                              type="button"
                              role="radio"
                              aria-checked={getRowMode(product.id) === 'today'}
                              title={`Today (${formatDayLabel(todayISO)})`}
                              onClick={() => setRowModes(prev => ({ ...prev, [product.id]: 'today' }))}
                              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                                getRowMode(product.id) === 'today'
                                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Today
                            </button>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={getRowMode(product.id) === 'yesterday'}
                              title={`Yesterday (${formatDayLabel(yesterdayISO)})`}
                              onClick={() => setRowModes(prev => ({ ...prev, [product.id]: 'yesterday' }))}
                              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                                getRowMode(product.id) === 'yesterday'
                                  ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Yesterday
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={productEntries[product.id]?.quantity || ''}
                            onChange={(e) => handleQuantityChange(product.id, e.target.value, product.unit_of_measure)}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={productEntries[product.id]?.unit_of_measure || product.unit_of_measure}
                            onChange={(e) => handleUnitChange(product.id, e.target.value, product.unit_of_measure)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          >
                            {UNIT_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg">
                            <span className="text-sm font-bold text-blue-600">
                              {productTotals[product.id]?.userToday || 0}
                            </span>
                            <span className="text-xs text-blue-500">
                              {product.unit_of_measure}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg">
                            <span className="text-sm font-bold text-emerald-600">
                              {productTotals[product.id]?.globalToday || 0}
                            </span>
                            <span className="text-xs text-emerald-500">
                              {product.unit_of_measure}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredAndSortedProducts.length > 0 && hasEntries && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/20">
                  <Save className="w-4 h-4 me-2" />
                  {isSubmitting ? 'Saving...' : 'Save Entries'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <Factory className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-slate-600 font-medium">Select a production line to enter data</p>
            <p className="text-sm text-slate-500 mt-2">Choose from the filters above to get started</p>
          </div>
        )}

        {/* History Section */}
        {showHistory && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-violet-400 to-violet-500 rounded-xl shadow-sm">
                  <History className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{t('production.recentEntries')}</h3>
                  <p className="text-sm text-slate-500">Your recent production records</p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-slate-500 font-medium">{t('common.loading')}</span>
                </div>
              </div>
            ) : entries.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <History className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium">{t('production.noEntries')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Production date
                      </th>
                      <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Recorded at
                      </th>
                      <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {t('production.line')}
                      </th>
                      <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {t('production.product')}
                      </th>
                      <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {t('production.quantity')}
                      </th>
                      <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {t('production.recordedBy')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                          {formatDayLabel(entry.production_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {formatDate(entry.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-900">
                            {entry.lines?.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {entry.lines?.type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-900">
                            {entry.products?.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {entry.products?.code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg">
                            <span className="text-sm font-bold text-emerald-600">{entry.quantity}</span>
                            <span className="text-xs text-emerald-500">{entry.unit_of_measure}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                          {entry.profiles?.full_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
