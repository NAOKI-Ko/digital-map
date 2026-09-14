/** The API stores only UTC days with views. Preserve the calendar spacing. */
export function analyticsSeries(start: string, end: string, records: Array<{ date: string, viewCount: number }>) {
  const first = Date.parse(`${start}T00:00:00Z`)
  const last = Date.parse(`${end}T00:00:00Z`)
  if (!Number.isFinite(first) || !Number.isFinite(last) || last < first || last - first > 366 * 86_400_000) return []
  const counts = new Map(records.map(record => [record.date, record.viewCount]))
  return Array.from({ length: Math.floor((last - first) / 86_400_000) + 1 }, (_, index) => {
    const date = new Date(first + index * 86_400_000).toISOString().slice(0, 10)
    return { date, viewCount: counts.get(date) ?? 0 }
  })
}
