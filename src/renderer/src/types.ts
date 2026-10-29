import type { MusicDestination } from '../../shared/urls'

export type Priority = 'low' | 'medium' | 'high'
export interface Task {
  id: string
  text: string
  done: boolean
  priority: Priority
  due: string | null // yyyy-MM-dd, local
  createdAt: number
}
export interface Note {
  id: string
  title: string
  body: string
  pinned: boolean
  updatedAt: number
}
export interface CalEvent {
  id: string
  title: string
  date: string // yyyy-MM-dd, local
  time: string // HH:mm or ''
  description: string
}
export interface Shortcut {
  id: string
  name: string
  url: string
}
export interface Session {
  id: string
  date: string
  startedAt: number
  mode: 'focus' | 'break'
  durationMs: number
  plannedMs: number
  completed: boolean
}

export type WidgetId = 'clock' | 'tasks' | 'system' | 'music' | 'calendar' | 'timer' | 'notes'
export const ALL_WIDGETS: WidgetId[] = ['clock', 'tasks', 'system', 'music', 'calendar', 'timer', 'notes']
export const WIDGET_LABELS: Record<WidgetId, string> = {
  clock: 'Clock & greeting',
  tasks: 'Tasks',
  system: 'System monitor',
  music: 'Music',
  calendar: 'Calendar',
  timer: 'Focus timer',
  notes: 'Quick notes'
}

export interface Settings {
  userName: string
  launchAtLogin: boolean
  minimizeToTray: boolean
  alwaysOnTop: boolean
  reducedMotion: boolean
  focusMin: number
  breakMin: number
  monitorIntervalSec: number
  musicDestination: MusicDestination
  widgetOrder: WidgetId[]
  hiddenWidgets: WidgetId[]
}

export const DEFAULT_SETTINGS: Settings = {
  userName: 'Dreamer',
  launchAtLogin: false,
  minimizeToTray: true,
  alwaysOnTop: false,
  reducedMotion: false,
  focusMin: 25,
  breakMin: 5,
  monitorIntervalSec: 2,
  musicDestination: 'youtube',
  widgetOrder: ALL_WIDGETS,
  hiddenWidgets: []
}

const clamp = (n: unknown, min: number, max: number, fallback: number): number =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback

/** Merges stored settings over defaults and repairs anything out of range. */
export function normalizeSettings(raw: unknown): Settings {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  const d = DEFAULT_SETTINGS
  const bool = (v: unknown, f: boolean): boolean => (typeof v === 'boolean' ? v : f)
  const order = Array.isArray(r.widgetOrder)
    ? (r.widgetOrder as unknown[]).filter((w): w is WidgetId => ALL_WIDGETS.includes(w as WidgetId))
    : []
  const fullOrder = [...new Set([...order, ...ALL_WIDGETS])]
  const hidden = Array.isArray(r.hiddenWidgets)
    ? (r.hiddenWidgets as unknown[]).filter((w): w is WidgetId => ALL_WIDGETS.includes(w as WidgetId))
    : []
  return {
    userName: typeof r.userName === 'string' ? r.userName.slice(0, 40) : d.userName,
    launchAtLogin: bool(r.launchAtLogin, d.launchAtLogin),
    minimizeToTray: bool(r.minimizeToTray, d.minimizeToTray),
    alwaysOnTop: bool(r.alwaysOnTop, d.alwaysOnTop),
    reducedMotion: bool(r.reducedMotion, d.reducedMotion),
    focusMin: clamp(r.focusMin, 1, 180, d.focusMin),
    breakMin: clamp(r.breakMin, 1, 60, d.breakMin),
    monitorIntervalSec: clamp(r.monitorIntervalSec, 1, 10, d.monitorIntervalSec),
    musicDestination: r.musicDestination === 'youtube-music' ? 'youtube-music' : 'youtube',
    widgetOrder: fullOrder,
    hiddenWidgets: hidden
  }
}
