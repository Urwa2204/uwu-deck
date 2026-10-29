import { ReactNode, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { onToast } from '../ui'

export function Card(props: {
  title: string
  icon: ReactNode
  actions?: ReactNode
  className?: string
  children: ReactNode
}): JSX.Element {
  return (
    <section className={`card ${props.className ?? ''}`} aria-label={props.title}>
      <header className="card-head">
        <span className="card-icon" aria-hidden>
          {props.icon}
        </span>
        <h2>{props.title}</h2>
        <div className="card-actions">{props.actions}</div>
      </header>
      <div className="card-body">{props.children}</div>
    </section>
  )
}

export function Progress({ value, label }: { value: number; label: string }): JSX.Element {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className="progress" role="progressbar" aria-label={label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-fill" style={{ width: `${v}%` }} />
    </div>
  )
}

export function Empty({ title, hint }: { title: string; hint?: string }): JSX.Element {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {hint && <span>{hint}</span>}
    </div>
  )
}

export function Toggle(props: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.checked}
      aria-label={props.label}
      className={`toggle ${props.checked ? 'on' : ''}`}
      onClick={() => props.onChange(!props.checked)}
    >
      <span />
    </button>
  )
}

/** Two-step delete: the first click arms the button, the second click confirms. */
export function ConfirmButton(props: {
  onConfirm: () => void
  label: string
  children: ReactNode
  className?: string
}): JSX.Element {
  const [armed, setArmed] = useState(false)
  const t = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(t.current), [])
  return (
    <button
      type="button"
      className={`icon-btn ${armed ? 'armed' : ''} ${props.className ?? ''}`}
      aria-label={armed ? `Confirm: ${props.label}` : props.label}
      title={armed ? 'Click again to confirm' : props.label}
      onClick={() => {
        if (armed) {
          window.clearTimeout(t.current)
          setArmed(false)
          props.onConfirm()
        } else {
          setArmed(true)
          t.current = window.setTimeout(() => setArmed(false), 3000)
        }
      }}
    >
      {armed ? <span className="confirm-text">Sure?</span> : props.children}
    </button>
  )
}

export function Toaster(): JSX.Element {
  const [items, setItems] = useState<{ id: number; msg: string; kind: string }[]>([])
  useEffect(
    () =>
      onToast((msg, kind) => {
        const id = Date.now() + Math.random()
        setItems((p) => [...p.slice(-3), { id, msg, kind }])
        window.setTimeout(() => setItems((p) => p.filter((i) => i.id !== id)), 4500)
      }),
    []
  )
  return (
    <div className="toaster" role="status" aria-live="polite">
      <AnimatePresence>
        {items.map((i) => (
          <motion.div
            key={i.id}
            className={`toast ${i.kind}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.2 }}
          >
            {i.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
