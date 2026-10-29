import { FormEvent, useMemo, useState } from 'react'
import { addDays, addMonths, endOfMonth, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { Card, ConfirmButton, Empty } from '../components/ui'
import { CalEvent } from '../types'
import { dateStr, todayStr, uid } from '../ui'

interface Props {
  events: CalEvent[]
  update: (next: CalEvent[] | ((prev: CalEvent[]) => CalEvent[])) => void
}

const byTime = (a: CalEvent, b: CalEvent): number => (a.date + (a.time || '99:99')).localeCompare(b.date + (b.time || '99:99'))

export function Calendar({ events, update }: Props): JSX.Element {
  const [month, setMonth] = useState(startOfMonth(new Date()))
  const [selected, setSelected] = useState(todayStr())
  const [editing, setEditing] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayStr())
  const [time, setTime] = useState('')
  const [description, setDescription] = useState('')
  const today = todayStr()

  const cells = useMemo(() => {
    const start = startOfWeek(startOfMonth(month))
    const last = endOfMonth(month)
    const days = Math.round((+last - +start) / 86_400_000) + 1
    const total = Math.ceil(days / 7) * 7
    return Array.from({ length: total }, (_, i) => addDays(start, i))
  }, [month])

  const withEvents = useMemo(() => new Set(events.map((e) => e.date)), [events])
  const dayEvents = events.filter((e) => e.date === selected).sort(byTime)
  const upcoming = events.filter((e) => e.date >= today).sort(byTime).slice(0, 4)

  const reset = (d: string): void => {
    setEditing(null)
    setTitle('')
    setTime('')
    setDescription('')
    setDate(d)
  }

  const submit = (e: FormEvent): void => {
    e.preventDefault()
    const clean = title.trim().slice(0, 120)
    if (!clean || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return
    const next: Omit<CalEvent, 'id'> = { title: clean, date, time, description: description.trim().slice(0, 500) }
    update((p) => (editing ? p.map((x) => (x.id === editing ? { ...x, ...next } : x)) : [...p, { id: uid(), ...next }]))
    setSelected(date)
    setMonth(startOfMonth(new Date(`${date}T00:00:00`)))
    reset(date)
  }

  return (
    <Card
      title="Calendar"
      icon={<CalendarDays size={16} />}
      className="w-calendar"
      actions={
        <div className="row tight">
          <button className="icon-btn" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft size={16} /></button>
          <span className="month-label">{format(month, 'MMMM yyyy')}</span>
          <button className="icon-btn" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight size={16} /></button>
        </div>
      }
    >
      <div className="cal-grid" role="grid" aria-label={format(month, 'MMMM yyyy')}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="cal-dow" role="columnheader">{d}</div>
        ))}
        {cells.map((d) => {
          const s = dateStr(d)
          return (
            <button
              key={s}
              role="gridcell"
              aria-label={format(d, 'EEEE, MMMM d')}
              aria-selected={s === selected}
              className={`cal-day ${isSameMonth(d, month) ? '' : 'out'} ${s === today ? 'today' : ''} ${s === selected ? 'sel' : ''}`}
              onClick={() => {
                setSelected(s)
                if (!editing) setDate(s)
              }}
            >
              {format(d, 'd')}
              {withEvents.has(s) && <i className="dot" />}
            </button>
          )
        })}
      </div>

      <h3 className="sub">{format(new Date(`${selected}T00:00:00`), 'EEEE, MMM d')}</h3>
      <ul className="list compact">
        {dayEvents.length === 0 && <Empty title="No events this day" />}
        {dayEvents.map((ev) => (
          <li key={ev.id} className="item">
            <span className="muted mono">{ev.time || 'All day'}</span>
            <span className="item-text grow">{ev.title}{ev.description && <small className="muted"> — {ev.description}</small>}</span>
            <button
              className="icon-btn"
              aria-label={`Edit event: ${ev.title}`}
              onClick={() => {
                setEditing(ev.id)
                setTitle(ev.title)
                setDate(ev.date)
                setTime(ev.time)
                setDescription(ev.description)
              }}
            >
              <Pencil size={14} />
            </button>
            <ConfirmButton label={`Delete event: ${ev.title}`} onConfirm={() => update((p) => p.filter((x) => x.id !== ev.id))}>
              <Trash2 size={14} />
            </ConfirmButton>
          </li>
        ))}
      </ul>

      <form className="event-form" onSubmit={submit}>
        <input className="input grow" value={title} maxLength={120} placeholder={editing ? 'Edit event title' : 'New event title'} aria-label="Event title" onChange={(e) => setTitle(e.target.value)} />
        <input className="input" type="date" value={date} aria-label="Event date" onChange={(e) => setDate(e.target.value)} />
        <input className="input" type="time" value={time} aria-label="Start time" onChange={(e) => setTime(e.target.value)} />
        <input className="input grow" value={description} maxLength={500} placeholder="Description (optional)" aria-label="Description" onChange={(e) => setDescription(e.target.value)} />
        <button className="btn primary" type="submit">{editing ? 'Save event' : 'Add event'}</button>
        {editing && <button className="btn" type="button" onClick={() => reset(selected)}>Cancel</button>}
      </form>

      <h3 className="sub">Upcoming</h3>
      <ul className="list compact">
        {upcoming.length === 0 && <Empty title="Nothing upcoming" hint="Events from today onward appear here." />}
        {upcoming.map((ev) => (
          <li key={ev.id} className="item">
            <span className="muted mono">{ev.date.slice(5)}</span>
            <span className="item-text grow">{ev.title}</span>
            <span className="muted mono">{ev.time}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
