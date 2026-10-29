import { FormEvent, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Pin, Search, StickyNote, Trash2, Send } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Card, ConfirmButton, Empty } from '../components/ui'
import { Note } from '../types'
import { uid } from '../ui'

interface Props {
  notes: Note[]
  ready: boolean
  update: (next: Note[] | ((prev: Note[]) => Note[])) => void
}

export function Notes({ notes, ready, update }: Props): JSX.Element {
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const create = (e: FormEvent): void => {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    const [first, ...rest] = body.split('\n')
    const id = uid()
    update((p) => [
      { id, title: first.slice(0, 80), body: rest.join('\n'), pinned: false, updatedAt: Date.now() },
      ...p
    ])
    setDraft('')
    setOpen(id)
  }

  const patch = (id: string, change: Partial<Note>): void =>
    update((p) => p.map((n) => (n.id === id ? { ...n, ...change, updatedAt: Date.now() } : n)))

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notes
      .filter((n) => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)
  }, [notes, query])

  return (
    <Card title="Quick notes" icon={<StickyNote size={16} />} className="w-notes">
      <form className="row" onSubmit={create}>
        <input
          className="input grow"
          value={draft}
          placeholder="Write a quick note, press Enter"
          aria-label="New note"
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="btn primary" type="submit" aria-label="Create note">
          <Send size={15} />
        </button>
      </form>
      <label className="search">
        <Search size={14} aria-hidden />
        <input value={query} placeholder="Search notes" aria-label="Search notes" onChange={(e) => setQuery(e.target.value)} />
      </label>

      <ul className="list">
        {!ready && <Empty title="Loading notes…" />}
        {ready && shown.length === 0 && (
          <Empty title={notes.length ? 'No matching notes' : 'No notes yet'} hint={notes.length ? undefined : 'Your notes autosave as you type.'} />
        )}
        <AnimatePresence initial={false}>
        {shown.map((n) => (
          <motion.li key={n.id} className={`note ${n.pinned ? 'pinned' : ''}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <div className="note-head">
              <button className="note-title" aria-expanded={open === n.id} onClick={() => setOpen(open === n.id ? null : n.id)}>
                {n.title || 'Untitled note'}
              </button>
              <button
                className={`icon-btn ${n.pinned ? 'on' : ''}`}
                aria-pressed={n.pinned}
                aria-label={n.pinned ? `Unpin note: ${n.title}` : `Pin note: ${n.title}`}
                onClick={() => patch(n.id, { pinned: !n.pinned })}
              >
                <Pin size={14} />
              </button>
              <ConfirmButton label={`Delete note: ${n.title}`} onConfirm={() => update((p) => p.filter((x) => x.id !== n.id))}>
                <Trash2 size={14} />
              </ConfirmButton>
            </div>
            {open === n.id ? (
              <div className="note-edit">
                <input className="input" value={n.title} maxLength={80} aria-label="Note title" onChange={(e) => patch(n.id, { title: e.target.value })} />
                <textarea className="input" rows={5} value={n.body} aria-label="Note body" onChange={(e) => patch(n.id, { body: e.target.value })} />
              </div>
            ) : (
              n.body && <p className="note-preview">{n.body}</p>
            )}
            <time className="muted small">Edited {format(n.updatedAt, 'MMM d, h:mm a')}</time>
          </motion.li>
        ))}
        </AnimatePresence>
      </ul>
    </Card>
  )
}
