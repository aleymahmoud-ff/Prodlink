'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { clientTodayISO, formatDayLabel } from '@/shared/lib/date/factory-day'
import { CalendarDays, Save, ShieldCheck, X } from 'lucide-react'

/**
 * Admin-only entry form for recording production against an arbitrary past
 * (or current) date. The parent component is responsible for gating render
 * on `session.user.role === 'admin'`; this component does not perform any
 * client-side authorization beyond that — server-side enforcement in
 * /api/production is the source of truth.
 *
 * See specs/001-backdated-production-entries/spec.md (User Story 2).
 */

interface Line {
  id: string
  name: string
  code: string
  type?: string
  is_active: boolean
}

interface Product {
  id: string
  name: string
  code: string
  unit_of_measure: string
  line_id: string | null
  is_active: boolean
}

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

interface ExceptionalEntryFormProps {
  lines: Line[]
  products: Product[]
  onClose: () => void
  onSaved: () => void
}

export function ExceptionalEntryForm({ lines, products, onClose, onSaved }: ExceptionalEntryFormProps) {
  const today = clientTodayISO()

  const [productionDate, setProductionDate] = useState<string>(today)
  const [lineId, setLineId] = useState<string>('')
  const [productId, setProductId] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('')
  const [unit, setUnit] = useState<string>('unit')
  const [batch, setBatch] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activeLines = useMemo(() => lines.filter(l => l.is_active), [lines])
  const lineProducts = useMemo(
    () => products.filter(p => p.is_active && p.line_id === lineId),
    [products, lineId],
  )

  // Pre-fill the unit from the selected product's default.
  const onPickProduct = (id: string) => {
    setProductId(id)
    const picked = products.find(p => p.id === id)
    if (picked) setUnit(picked.unit_of_measure)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!lineId || !productId || !productionDate) {
      setError('Please choose a date, line, and product.')
      return
    }
    const qty = parseFloat(quantity)
    if (!quantity || Number.isNaN(qty) || qty <= 0) {
      setError('Please enter a quantity greater than zero.')
      return
    }
    if (productionDate > today) {
      setError('Future dates are not allowed.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_id: lineId,
          product_id: productId,
          quantity: qty,
          unit_of_measure: unit,
          batch_number: batch || null,
          notes: notes || null,
          production_date: productionDate,
          client_today: today,
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        if (response.status === 403 && data?.error === 'backdate_not_allowed_for_role') {
          throw new Error('Server rejected the date — admin role required.')
        }
        if (response.status === 400 && data?.error === 'invalid_production_date') {
          throw new Error('Invalid production date.')
        }
        throw new Error('Failed to save the entry.')
      }
      setSuccess(`Entry recorded for ${formatDayLabel(productionDate)}.`)
      // Reset just the per-entry fields; keep date/line/product so an admin
      // can quickly enter several rows for the same day.
      setQuantity('')
      setBatch('')
      setNotes('')
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-xl shadow-sm">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Exceptional Entry</h3>
            <p className="text-sm text-slate-500">Record production against any past date — admin only.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                Production date *
              </span>
            </label>
            <input
              type="date"
              value={productionDate}
              max={today}
              onChange={(e) => setProductionDate(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <p className="text-xs text-slate-500">
              Selected: <span className="font-medium text-slate-700">{formatDayLabel(productionDate)}</span>
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Production line *
            </label>
            <select
              value={lineId}
              onChange={(e) => { setLineId(e.target.value); setProductId('') }}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="">Select a line</option>
              {activeLines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name} ({line.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Product *</label>
            <select
              value={productId}
              onChange={(e) => onPickProduct(e.target.value)}
              required
              disabled={!lineId}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">{lineId ? 'Select a product' : 'Pick a line first'}</option>
              {lineProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Quantity *</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.001"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                required
                className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                {UNIT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Batch # (optional)</label>
            <input
              type="text"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="space-y-2 md:col-span-1">
            <label className="block text-sm font-medium text-slate-700">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-500/20"
          >
            <Save className="w-4 h-4 me-2" />
            {isSubmitting ? 'Saving...' : 'Save entry'}
          </Button>
        </div>
      </form>
    </div>
  )
}
