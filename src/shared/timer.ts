export type TimerMode = 'focus' | 'break'
export type TimerStatus = 'idle' | 'running' | 'paused'

/**
 * Timer state is timestamp-based so it never drifts and survives restarts.
 * Active time = accumulatedMs (finished running segments) + (now - startedAt) while running.
 * Paused time is never added.
 */
export interface TimerState {
  mode: TimerMode
  status: TimerStatus
  plannedMs: number
  accumulatedMs: number
  startedAt: number | null
  sessionStartedAt: number | null
}

export const idleTimer = (mode: TimerMode, plannedMs: number): TimerState => ({
  mode,
  status: 'idle',
  plannedMs,
  accumulatedMs: 0,
  startedAt: null,
  sessionStartedAt: null
})

export function elapsedMs(s: TimerState, now: number): number {
  const live = s.status === 'running' && s.startedAt !== null ? Math.max(0, now - s.startedAt) : 0
  return Math.min(s.plannedMs, s.accumulatedMs + live)
}

export const remainingMs = (s: TimerState, now: number): number =>
  Math.max(0, s.plannedMs - elapsedMs(s, now))

export function startTimer(s: TimerState, now: number): TimerState {
  if (s.status === 'running') return s
  return { ...s, status: 'running', startedAt: now, sessionStartedAt: s.sessionStartedAt ?? now }
}

export function pauseTimer(s: TimerState, now: number): TimerState {
  if (s.status !== 'running') return s
  return { ...s, status: 'paused', accumulatedMs: elapsedMs(s, now), startedAt: null }
}

export const isComplete = (s: TimerState, now: number): boolean =>
  s.status === 'running' && elapsedMs(s, now) >= s.plannedMs

/** Repairs timer data loaded from disk; returns null if it cannot be trusted. */
export function sanitizeTimer(raw: unknown): TimerState | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0
  const mode = r.mode === 'break' ? 'break' : r.mode === 'focus' ? 'focus' : null
  const status = r.status === 'running' || r.status === 'paused' || r.status === 'idle' ? r.status : null
  if (!mode || !status || !num(r.plannedMs) || r.plannedMs < 1000 || !num(r.accumulatedMs)) return null
  const startedAt = num(r.startedAt) ? r.startedAt : null
  if (status === 'running' && startedAt === null) return null
  return {
    mode,
    status,
    plannedMs: r.plannedMs,
    accumulatedMs: Math.min(r.accumulatedMs, r.plannedMs),
    startedAt,
    sessionStartedAt: num(r.sessionStartedAt) ? r.sessionStartedAt : null
  }
}
