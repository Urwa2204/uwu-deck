import { ReactNode, useEffect, useState } from 'react'
import {
  Activity, CalendarDays, Copy, LayoutDashboard, ListChecks, Minus, Music as MusicIcon,
  Settings as SettingsIcon, Sparkles, Square, StickyNote, Timer as TimerIcon, X
} from 'lucide-react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { AnimatedGroup, AnimatedItem } from './components/motion'
import { Clock } from './widgets/Clock'
import { Tasks } from './widgets/Tasks'
import { Notes } from './widgets/Notes'
import { WorkTimer } from './widgets/Timer'
import { Calendar } from './widgets/Calendar'
import { SystemMonitor } from './widgets/SystemMonitor'
import { Music } from './widgets/Music'
import { SettingsView } from './widgets/SettingsView'
import { Toaster } from './components/ui'
import { flushAll, usePersisted } from './hooks'
import { CalEvent, DEFAULT_SETTINGS, Note, Session, Shortcut, Task, WidgetId, normalizeSettings } from './types'
import { TimerState, sanitizeTimer } from '../../shared/timer'

type View = 'dashboard' | 'tasks' | 'system' | 'music' | 'calendar' | 'focus' | 'notes' | 'settings'

const NAV: { id: View; label: string; icon: ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'tasks', label: 'Tasks', icon: <ListChecks size={20} /> },
  { id: 'system', label: 'System', icon: <Activity size={20} /> },
  { id: 'music', label: 'Music', icon: <MusicIcon size={20} /> },
  { id: 'calendar', label: 'Calendar', icon: <CalendarDays size={20} /> },
  { id: 'focus', label: 'Focus', icon: <TimerIcon size={20} /> },
  { id: 'notes', label: 'Notes', icon: <StickyNote size={20} /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} /> }
]

export function App(): JSX.Element {
  const [view, setView] = useState<View>('dashboard')
  const [maximized, setMaximized] = useState(false)
  const settings = usePersisted('settings', DEFAULT_SETTINGS, normalizeSettings)
  const tasks = usePersisted<Task[]>('tasks', [])
  const notes = usePersisted<Note[]>('notes', [])
  const events = usePersisted<CalEvent[]>('events', [])
  const sessions = usePersisted<Session[]>('sessions', [])
  const shortcuts = usePersisted<Shortcut[]>('shortcuts', [])
  const timer = usePersisted<TimerState | null>('timer', null, sanitizeTimer)
  const s = settings.value

  useEffect(() => {
    window.deck.onFlush(flushAll)
    void window.deck.win.isMaximized().then(setMaximized)
    window.deck.win.onMaximizeChange(setMaximized)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(s.reducedMotion)
  }, [s.reducedMotion])

  const widgets: Record<WidgetId, JSX.Element> = {
    clock: <Clock name={s.userName} />,
    tasks: <Tasks tasks={tasks.value} update={tasks.update} />,
    system: <SystemMonitor intervalSec={s.monitorIntervalSec} />,
    music: <Music shortcuts={shortcuts.value} update={shortcuts.update} settings={s} />,
    calendar: <Calendar events={events.value} update={events.update} />,
    timer: (
      <WorkTimer
        timer={timer.value}
        setTimer={(t) => timer.update(t)}
        sessions={sessions.value}
        setSessions={sessions.update}
        settings={s}
        setSettings={settings.update}
      />
    ),
    notes: <Notes notes={notes.value} ready={notes.ready} update={notes.update} />
  }

  const single: Partial<Record<View, WidgetId>> = {
    tasks: 'tasks', system: 'system', music: 'music', calendar: 'calendar', focus: 'timer', notes: 'notes'
  }

  let content: JSX.Element
  if (view === 'dashboard') {
    const shown = s.widgetOrder.filter((id) => !s.hiddenWidgets.includes(id))
    content = shown.length ? (
      <AnimatedGroup className="grid">
        {shown.map((id) => (
          <AnimatedItem key={id} className={`cell cell-${id}`}>{widgets[id]}</AnimatedItem>
        ))}
      </AnimatedGroup>
    ) : (
      <p className="muted pad">All widgets are hidden. Turn some back on in Settings.</p>
    )
  } else if (view === 'settings') {
    content = <div className="single"><SettingsView settings={s} setSettings={settings.update} /></div>
  } else {
    content = <div className="single">{widgets[single[view] as WidgetId]}</div>
  }

  return (
    <MotionConfig reducedMotion={s.reducedMotion ? 'always' : 'user'}>
    <div className="shell">
      <header className="titlebar">
        <div className="brand"><Sparkles size={15} aria-hidden /> uwu-deck</div>
        <div className="win-controls">
          <button aria-label="Minimize" onClick={() => window.deck.win.minimize()}><Minus size={15} /></button>
          <button aria-label={maximized ? 'Restore' : 'Maximize'} onClick={() => window.deck.win.toggleMaximize()}>
            {maximized ? <Copy size={13} /> : <Square size={13} />}
          </button>
          <button className="close" aria-label="Close" onClick={() => window.deck.win.close()}><X size={16} /></button>
        </div>
      </header>
      <nav className="rail" aria-label="Main">
        {NAV.map((n) => (
          <button key={n.id} className={`rail-btn ${view === n.id ? 'on' : ''} ${n.id === 'settings' ? 'bottom' : ''}`} aria-label={n.label} aria-current={view === n.id ? 'page' : undefined} data-tip={n.label} onClick={() => setView(n.id)}>
            {view === n.id && (
              <motion.span layoutId="rail-pill" className="rail-pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
            )}
            <span className="rail-icon">{n.icon}</span>
          </button>
        ))}
      </nav>
      <main className="content">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
            {content}
          </motion.div>
        </AnimatePresence>
      </main>
      <Toaster />
    </div>
    </MotionConfig>
  )
}
