import { FormEvent, useState } from 'react'
import { ListChecks, Pencil, Plus, Trash2, Check } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Card, ConfirmButton, Empty, Progress } from '../components/ui'
import { Priority, Task } from '../types'
import { todayStr, uid } from '../ui'

type Filter = 'all' | 'active' | 'completed'
const MAX_LEN = 200

interface Props {
  tasks: Task[]
  update: (next: Task[] | ((prev: Task[]) => Task[])) => void
}

export function Tasks({ tasks, update }: Props): JSX.Element {
  const [text, setText] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [due, setDue] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [invalid, setInvalid] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const today = todayStr()

  const add = (e: FormEvent): void => {
    e.preventDefault()
    const clean = text.trim().slice(0, MAX_LEN)
    if (!clean) {
      setInvalid(true)
      return
    }
    update((p) => [
      ...p,
      { id: uid(), text: clean, done: false, priority, due: due || null, createdAt: Date.now() }
    ])
    setText('')
    setDue('')
    setInvalid(false)
  }

  const patch = (id: string, change: Partial<Task>): void =>
    update((p) => p.map((t) => (t.id === id ? { ...t, ...change } : t)))

  const saveEdit = (id: string): void => {
    const clean = editText.trim().slice(0, MAX_LEN)
    if (clean) patch(id, { text: clean })
    setEditing(null)
  }

  const visible = tasks
    .filter((t) => (filter === 'all' ? true : filter === 'active' ? !t.done : t.done))
    .sort((a, b) => Number(a.done) - Number(b.done) || a.createdAt - b.createdAt)
  const doneCount = tasks.filter((t) => t.done).length

  return (
    <Card title="Tasks" icon={<ListChecks size={16} />} className="w-tasks">
      <form className="row" onSubmit={add}>
        <input
          className={`input grow ${invalid ? 'invalid' : ''}`}
          value={text}
          maxLength={MAX_LEN}
          placeholder="Add a task and press Enter"
          aria-label="New task"
          aria-invalid={invalid}
          onChange={(e) => {
            setText(e.target.value)
            setInvalid(false)
          }}
        />
        <select
          className="input"
          value={priority}
          aria-label="Priority"
          onChange={(e) => setPriority(e.target.value as Priority)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input className="input" type="date" value={due} aria-label="Due date" onChange={(e) => setDue(e.target.value)} />
        <button className="btn primary" type="submit" aria-label="Add task">
          <Plus size={16} />
        </button>
      </form>

      <div className="tabs" role="tablist" aria-label="Task filter">
        {(['all', 'active', 'completed'] as Filter[]).map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? 'tab on' : 'tab'} onClick={() => setFilter(f)}>
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <ul className="list">
        {visible.length === 0 && (
          <Empty
            title={tasks.length === 0 ? 'No tasks yet' : 'Nothing in this filter'}
            hint={tasks.length === 0 ? 'Type above and press Enter to add your first task.' : undefined}
          />
        )}
        <AnimatePresence initial={false}>
        {visible.map((t) => {
          const overdue = !t.done && t.due !== null && t.due < today
          return (
            <motion.li
              key={t.id}
              className={`item ${t.done ? 'done' : ''}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18 }}
            >
              <motion.button
                whileTap={{ scale: 0.82 }}
                role="checkbox"
                aria-checked={t.done}
                aria-label={`${t.done ? 'Mark active' : 'Mark done'}: ${t.text}`}
                className={`check ${t.done ? 'on' : ''}`}
                onClick={() => patch(t.id, { done: !t.done })}
              >
                {t.done && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 520, damping: 20 }} style={{ display: 'grid' }}>
                    <Check size={13} />
                  </motion.span>
                )}
              </motion.button>
              {editing === t.id ? (
                <input
                  className="input grow"
                  autoFocus
                  value={editText}
                  maxLength={MAX_LEN}
                  aria-label="Edit task text"
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={() => saveEdit(t.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(t.id)
                    if (e.key === 'Escape') setEditing(null)
                  }}
                />
              ) : (
                <span className="item-text grow">{t.text}</span>
              )}
              <span className={`chip p-${t.priority}`}>{t.priority}</span>
              {t.due && <span className={`chip ${overdue ? 'overdue' : ''}`}>{overdue ? `Overdue · ${t.due}` : t.due}</span>}
              <button
                className="icon-btn"
                aria-label={`Edit task: ${t.text}`}
                onClick={() => {
                  setEditing(t.id)
                  setEditText(t.text)
                }}
              >
                <Pencil size={14} />
              </button>
              <ConfirmButton label={`Delete task: ${t.text}`} onConfirm={() => update((p) => p.filter((x) => x.id !== t.id))}>
                <Trash2 size={14} />
              </ConfirmButton>
            </motion.li>
          )
        })}
        </AnimatePresence>
      </ul>

      <footer className="foot">
        <span>
          {doneCount} / {tasks.length} completed
        </span>
        <Progress value={tasks.length ? (doneCount / tasks.length) * 100 : 0} label="Task completion" />
      </footer>
    </Card>
  )
}
