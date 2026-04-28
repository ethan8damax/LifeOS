export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ')
}

export function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayStr(): string {
  return toLocalDateStr(new Date())
}

// Returns ISO date strings Mon–Sun for the week containing `anchor` (default: today).
export function getWeekDates(anchor?: Date): string[] {
  const now = anchor ?? new Date()
  const dow = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return toLocalDateStr(d)
  })
}

// Returns every ISO date string in [from, to] inclusive.
export function datesInRange(from: string, to: string): string[] {
  const result: string[] = []
  const cur = new Date(from + 'T00:00:00')
  const end = new Date(to   + 'T00:00:00')
  while (cur <= end) {
    result.push(toLocalDateStr(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return result
}

// Count how many dates in `dates` fall on a day listed in `habitDays`.
// habitDays uses keys: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
const DOW_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
export function countHabitDaysInDates(
  habitDays: string[] | null,
  dates:     string[],
): number {
  if (!habitDays || habitDays.length === 0) return 0
  return dates.filter(d => habitDays.includes(DOW_KEY[new Date(d + 'T00:00:00').getDay()])).length
}

// Which week (1–12) of the 12-week cycle are we in?
export function weekOfTwelve(startDate: string, today: string): number {
  const start = new Date(startDate + 'T00:00:00')
  const cur   = new Date(today     + 'T00:00:00')
  const days  = Math.floor((cur.getTime() - start.getTime()) / 86_400_000)
  return Math.min(12, Math.max(1, Math.floor(days / 7) + 1))
}

// Add `n` days to an ISO date string, return ISO date string.
export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return toLocalDateStr(d)
}
