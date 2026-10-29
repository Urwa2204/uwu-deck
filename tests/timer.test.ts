import { describe, expect, it } from 'vitest'
import { elapsedMs, idleTimer, isComplete, pauseTimer, remainingMs, sanitizeTimer, startTimer } from '../src/shared/timer'

const MIN = 60_000

describe('timer', () => {
  it('counts elapsed time from timestamps', () => {
    const s = startTimer(idleTimer('focus', 25 * MIN), 1000)
    expect(elapsedMs(s, 1000 + 5 * MIN)).toBe(5 * MIN)
    expect(remainingMs(s, 1000 + 5 * MIN)).toBe(20 * MIN)
  })
  it('does not count paused time', () => {
    let s = startTimer(idleTimer('focus', 25 * MIN), 0)
    s = pauseTimer(s, 10 * MIN)
    expect(elapsedMs(s, 90 * MIN)).toBe(10 * MIN)
    s = startTimer(s, 100 * MIN)
    expect(elapsedMs(s, 105 * MIN)).toBe(15 * MIN)
  })
  it('completes after the planned duration, even if the app was closed', () => {
    const s = startTimer(idleTimer('focus', 25 * MIN), 0)
    expect(isComplete(s, 24 * MIN)).toBe(false)
    expect(isComplete(s, 8 * 60 * MIN)).toBe(true)
    expect(elapsedMs(s, 8 * 60 * MIN)).toBe(25 * MIN)
  })
  it('rejects untrustworthy stored data', () => {
    expect(sanitizeTimer(null)).toBeNull()
    expect(sanitizeTimer({ mode: 'focus', status: 'running', plannedMs: 1500000, accumulatedMs: 0, startedAt: null })).toBeNull()
    expect(sanitizeTimer({ mode: 'x', status: 'idle', plannedMs: 1500000, accumulatedMs: 0 })).toBeNull()
    expect(sanitizeTimer({ mode: 'focus', status: 'paused', plannedMs: 1500000, accumulatedMs: 5000, startedAt: null })?.status).toBe('paused')
  })
})
