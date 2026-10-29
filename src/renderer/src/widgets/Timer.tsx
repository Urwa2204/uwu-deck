import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { Pause, Play, RotateCcw, Timer as TimerIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { Card, Empty } from '../components/ui'
import { Session, Settings } from '../types'
import {
  TimerMode,
  TimerState,
  elapsedMs,
  idleTimer,
  isComplete,
  pauseTimer,
  remainingMs,
  startTimer
} from '../../../shared/timer'
import { dateStr, formatDuration, notify, todayStr, uid } from '../ui'

const MIN_LOGGED_MS = 10_000
const PRESETS: [number, number][] = [
  [25, 5],
  [50, 10],
  [90, 15]
]

interface Props {
  timer: TimerState | null
  setTimer: (t: TimerState) => void
  sessions: Session[]
  setSessions: (next: Session[] | ((p: Session[]) => Session[])) => void
  settings: Settings
  setSettings: (next: Settings) => void
}

const clock = (ms: number): string => {
  const s = Math.ceil(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function WorkTimer({ timer, setTimer, sessions, setSessions, settings, setSettings }: Props): JSX.Element {
  const [now, setNow] = useState(Date.now())
  const finishedFor = useRef<number | null>(null)
  const plannedFor = (m: TimerMode): number => (m === 'focus' ? settings.focusMin : settings.breakMin) * 60_000
  const state: TimerState = timer ?? idleTimer('focus', plannedFor('focus'))
  const idle = state.status === 'idle'
  const planned = idle ? plannedFor(state.mode) : state.plannedMs
  const remaining = idle ? planned : remainingMs(state, now)

  // Tick only while running; elapsed time always comes from timestamps, never from counting ticks.
  useEffect(() => {
    if (state.status !== 'running') return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [state.status])

  const log = (s: TimerState, completed: boolean, at: number): void => {
    const elapsed = elapsedMs(s, at)
    if (!completed && elapsed < MIN_LOGGED_MS) return
    const started = s.sessionStartedAt ?? at
    setSessions((p) =>
      [...p, { id: uid(), date: dateStr(new Date(started)), startedAt: started, mode: s.mode, durationMs: elapsed, plannedMs: s.plannedMs, completed }].slice(-500)
    )
  }

  // Completion also covers the case where the app was closed while a session ran past its end.
  useEffect(() => {
    if (!timer || !isComplete(timer, now)) return
    if (finishedFor.current === timer.sessionStartedAt) return
    finishedFor.current = timer.sessionStartedAt
    log(timer, true, now)
    const next: TimerMode = timer.mode === 'focus' ? 'break' : 'focus'
    setTimer(idleTimer(next, plannedFor(next)))
    const body = timer.mode === 'focus' ? 'Focus session complete. Time for a break.' : 'Break over. Ready to focus?'
    notify(body)
    try {
      new Notification('uwu-deck', { body })
    } catch {
      /* the toast above is the fallback when desktop notifications are unavailable */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, timer])

  const start = (): void => {
    const t = Date.now()
    setNow(t)
    setTimer(startTimer(idle ? idleTimer(state.mode, planned) : state, t))
  }
  const pause = (): void => setTimer(pauseTimer(state, Date.now()))
  const reset = (): void => {
    if (!idle) log(state, false, Date.now())
    setTimer(idleTimer(state.mode, plannedFor(state.mode)))
  }
  const pickMode = (m: TimerMode): void => {
    if (!idle) log(state, false, Date.now())
    setTimer(idleTimer(m, plannedFor(m)))
  }

  const today = todayStr()
  const todays = sessions.filter((s) => s.date === today && s.mode === 'focus')
  const doneToday = todays.filter((s) => s.completed).length
  const focusMs = todays.reduce((a, s) => a + s.durationMs, 0)
  const R = 62
  const C = 2 * Math.PI * R
  const progress = planned > 0 ? 1 - remaining / planned : 0

  return (
    <Card title="Focus timer" icon={<TimerIcon size={16} />} className="w-timer">
      <div className="tabs" role="tablist" aria-label="Timer mode">
        {(['focus', 'break'] as TimerMode[]).map((m) => (
          <button key={m} role="tab" aria-selected={state.mode === m} className={state.mode === m ? 'tab on' : 'tab'} onClick={() => pickMode(m)}>
            {m === 'focus' ? 'Focus' : 'Break'}
          </button>
        ))}
      </div>

      <div className="ring">
        <svg viewBox="0 0 150 150" aria-hidden>
          <circle cx="75" cy="75" r={R} className="ring-bg" />
          <circle cx="75" cy="75" r={R} className="ring-fg" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} transform="rotate(-90 75 75)" />
        </svg>
        <div className="ring-text">
          <motion.small key={`${state.status}-${state.mode}`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
            {state.status === 'paused' ? 'Paused' : state.mode === 'focus' ? 'Focus' : 'Break'}
          </motion.small>
          <strong role="timer" aria-live="off">{clock(remaining)}</strong>
          <small>of {clock(planned)}</small>
        </div>
      </div>

      <div className="row center">
        {state.status === 'running' ? (
          <button className="btn primary" onClick={pause}><Pause size={15} /> Pause</button>
        ) : (
          <button className="btn primary" onClick={start}><Play size={15} /> {state.status === 'paused' ? 'Resume' : 'Start'}</button>
        )}
        <button className="btn" onClick={reset} disabled={idle} aria-label="Reset timer"><RotateCcw size={15} /> Reset</button>
      </div>

      <div className="row center presets" aria-label="Presets">
        {PRESETS.map(([f, b]) => (
          <button
            key={f}
            className={`tab ${settings.focusMin === f && settings.breakMin === b ? 'on' : ''}`}
            disabled={!idle}
            onClick={() => setSettings({ ...settings, focusMin: f, breakMin: b })}
          >
            {f}/{b}
          </button>
        ))}
      </div>

      <footer className="foot stack">
        <span>
          Today: {doneToday} completed · {formatDuration(focusMs)} focused
        </span>
        {sessions.length === 0 ? (
          <Empty title="No sessions yet" hint="Finished and stopped sessions are listed here." />
        ) : (
          <ul className="history">
            {[...sessions].reverse().slice(0, 5).map((s) => (
              <li key={s.id}>
                <span>{format(s.startedAt, 'MMM d, HH:mm')}</span>
                <span>{s.mode}</span>
                <span>{formatDuration(s.durationMs)}</span>
                <span className="muted">{s.completed ? 'completed' : 'stopped'}</span>
              </li>
            ))}
          </ul>
        )}
      </footer>
    </Card>
  )
}
