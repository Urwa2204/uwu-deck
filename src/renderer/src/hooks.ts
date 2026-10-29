import { useCallback, useEffect, useRef, useState } from 'react'
import type { DataKey, SystemSnapshot } from '../../shared/api'
import { notify } from './ui'

const flushers = new Set<() => Promise<void>>()
/** Called by the main process before quit so no edit is lost. */
export const flushAll = async (): Promise<void> => {
  await Promise.all([...flushers].map((f) => f()))
}

export interface Persisted<T> {
  value: T
  ready: boolean
  update: (next: T | ((prev: T) => T)) => void
}

/** State that is loaded from, and debounce-saved to, the main process store. */
export function usePersisted<T>(
  key: DataKey,
  fallback: T,
  normalize?: (raw: unknown) => T
): Persisted<T> {
  const [value, setValue] = useState<T>(fallback)
  const [ready, setReady] = useState(false)
  const latest = useRef<T>(fallback)
  const dirty = useRef(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    window.deck
      .load(key)
      .then((raw) => {
        if (cancelled) return
        if (raw !== null && raw !== undefined) {
          const v = normalize ? normalize(raw) : (raw as T)
          latest.current = v
          setValue(v)
        }
      })
      .catch(() => notify(`Could not load saved ${key}. Starting empty.`, 'error'))
      .finally(() => !cancelled && setReady(true))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current)
    if (!dirty.current) return
    dirty.current = false
    try {
      await window.deck.save(key, latest.current)
    } catch {
      dirty.current = true
      notify(`Could not save ${key}. Your latest change is not stored yet.`, 'error')
    }
  }, [key])

  useEffect(() => {
    flushers.add(flush)
    return () => {
      flushers.delete(flush)
      void flush()
    }
  }, [flush])

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const v = typeof next === 'function' ? (next as (p: T) => T)(latest.current) : next
      latest.current = v
      setValue(v)
      dirty.current = true
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => void flush(), 300)
    },
    [flush]
  )

  return { value, ready, update }
}

export interface SystemHistoryPoint {
  cpu: number | null
  mem: number | null
}

/** Polls real metrics while mounted; pauses while the window is hidden. */
export function useSystem(intervalSec: number): {
  snap: SystemSnapshot | null
  history: SystemHistoryPoint[]
  failed: boolean
} {
  const [snap, setSnap] = useState<SystemSnapshot | null>(null)
  const [history, setHistory] = useState<SystemHistoryPoint[]>([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let stopped = false
    let handle: number | undefined
    const tick = async (): Promise<void> => {
      if (!document.hidden) {
        try {
          const s = await window.deck.system()
          if (stopped) return
          setSnap(s)
          setFailed(false)
          setHistory((h) => [...h.slice(-39), { cpu: s.cpu, mem: s.memPercent }])
        } catch {
          if (!stopped) setFailed(true)
        }
      }
      if (!stopped) handle = window.setTimeout(() => void tick(), intervalSec * 1000)
    }
    void tick()
    return () => {
      stopped = true
      window.clearTimeout(handle)
    }
  }, [intervalSec])

  return { snap, history, failed }
}
