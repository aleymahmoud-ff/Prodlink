'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Portal } from '@/shared/components/ui/Portal'
import { X } from 'lucide-react'

interface Product {
  id: string
  name: string
  code: string
  category: string | null
  unit_of_measure: string
  line_id: string | null
  is_active: boolean
}

interface Line {
  id: string
  name: string
  code: string
  type: string
  is_active: boolean
}

interface ProductModalProps {
  product: Product | null
  onClose: () => void
  onSave: () => void
}

export function ProductModal({ product, onClose, onSave }: ProductModalProps) {
  const [name, setName] = useState(product?.name || '')
  const [code, setCode] = useState(product?.code || '')
  const [category, setCategory] = useState(product?.category || '')
  const [unitOfMeasure, setUnitOfMeasure] = useState(product?.unit_of_measure || 'unit')
  const [lineId, setLineId] = useState(product?.line_id || '')
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
  const [lines, setLines] = useState<Line[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!product

  useEffect(() => {
    fetchLines()
  }, [])

  const fetchLines = async () => {
    try {
      const res = await fetch('/api/lines')
      if (res.ok) {
        const data = await res.json()
        setLines(data.filter((l: Line) => l.is_active))
      }
    } catch (error) {
      console.error('Error fetching lines:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const url = '/api/products'
      const method = isEditing ? 'PUT' : 'POST'
      const body = isEditing
        ? {
            id: product.id,
            name,
            code,
            category: category || null,
            unit_of_measure: unitOfMeasure,
            line_id: lineId || null,
            is_active: isActive,
          }
        : {
            name,
            code,
            category: category || null,
            unit_of_measure: unitOfMeasure,
            line_id: lineId || null,
            is_active: isActive,
          }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save product')
      }

      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={onClose}
          />

          <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Production Line *
                  </label>
                  <select
                    value={lineId}
                    onChange={(e) => setLineId(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a production line</option>
                    {lines.map((line) => (
                      <option key={line.id} value={line.id}>
                        {line.name} ({line.code}) - {line.type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g., Chocolate Croissant"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Product Code / SKU *
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    placeholder="e.g., PRD-001"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category (optional)
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Pastries"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Unit of Measure
                  </label>
                  <select
                    value={unitOfMeasure}
                    onChange={(e) => setUnitOfMeasure(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="unit">Unit / Piece</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="l">Liter (L)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="box">Box</option>
                    <option value="carton">Carton</option>
                    <option value="tray">Tray</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Active</span>
                      <span className="block text-xs text-gray-500">
                        Inactive products are hidden from production, waste, damage, and reprocessing forms
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Portal>
  )
}
