import { format } from 'date-fns'

export const uid = (): string => crypto.randomUUID()
export const todayStr = (): string => format(new Date(), 'yyyy-MM-dd')
export const dateStr = (d: Date): string => format(d, 'yyyy-MM-dd')

export function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

type Listener = (msg: string, kind: 'info' | 'error') => void
const listeners = new Set<Listener>()
export const onToast = (l: Listener): (() => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
export const notify = (msg: string, kind: 'info' | 'error' = 'info'): void =>
  listeners.forEach((l) => l(msg, kind))
