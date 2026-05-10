import { useEffect, useRef } from 'react'

/**
 * Browser-time-zone helpers for the production form's Today/Yesterday toggle
 * and the Exceptional Entry date picker. Per the spec, the user's browser TZ
 * defines the day boundary for live data entry. The server stores the
 * resulting calendar date (YYYY-MM-DD) verbatim.
 *
 * See: specs/001-backdated-production-entries/research.md (Decision 2).
 */

/** Format a Date as YYYY-MM-DD using its **local** components (browser TZ). */
function formatLocalISODate(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Today's calendar date in the user's browser TZ, as YYYY-MM-DD. */
export function clientTodayISO(): string {
  return formatLocalISODate(new Date())
}

/** Yesterday's calendar date in the user's browser TZ, as YYYY-MM-DD. */
export function clientYesterdayISO(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return formatLocalISODate(d)
}

/**
 * Format a YYYY-MM-DD string for display next to a toggle pill, e.g.
 * "May 9". Defensive against malformed input — falls back to the raw
 * string if it can't be parsed.
 */
export function formatDayLabel(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  // Parse as a local date (not UTC) by constructing component-by-component.
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * Schedule a callback to fire shortly after the next browser-local midnight,
 * then re-arm itself. Used by the production page to refresh toggle labels
 * and re-fetch when the day rolls over while the page stays open.
 *
 * The 1-second padding avoids a race where the callback runs at exactly
 * 00:00:00 but the browser clock has not yet ticked into the new day.
 */
export function useMidnightTick(callback: () => void): void {
  // Hold the latest callback in a ref so re-renders don't reschedule.
  const cbRef = useRef(callback)
  useEffect(() => {
    cbRef.current = callback
  }, [callback])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const arm = () => {
      const now = new Date()
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 1, 0, // 1 second past midnight, local time
      )
      const ms = Math.max(1000, nextMidnight.getTime() - now.getTime())
      timer = setTimeout(() => {
        cbRef.current()
        arm()
      }, ms)
    }

    arm()
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [])
}
