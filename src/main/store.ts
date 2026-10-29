import { app, dialog, BrowserWindow } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'
import { DATA_KEYS, DataKey, ActionResult } from '../shared/api'
import { isAllowedMusicUrl } from '../shared/urls'

const SCHEMA_VERSION = 1
const MAX_BYTES = 8 * 1024 * 1024
const LIST_KEYS = new Set<DataKey>(['tasks', 'notes', 'events', 'sessions', 'shortcuts'])

const dataDir = (): string => path.join(app.getPath('userData'), 'data')
const fileFor = (key: string): string => path.join(dataDir(), `${key}.json`)

export const isDataKey = (k: unknown): k is DataKey =>
  typeof k === 'string' && (DATA_KEYS as readonly string[]).includes(k)

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/** Structural validation of everything the renderer asks us to persist. */
export function validate(key: DataKey, value: unknown): boolean {
  if (LIST_KEYS.has(key)) {
    if (!Array.isArray(value) || value.length > 50000) return false
    const ok = value.every((v) => isRecord(v) && typeof v.id === 'string' && v.id.length <= 64)
    if (!ok) return false
    if (key === 'shortcuts') {
      return value.every(
        (v) =>
          typeof (v as Record<string, unknown>).name === 'string' &&
          isAllowedMusicUrl((v as Record<string, unknown>).url)
      )
    }
    return true
  }
  return isRecord(value)
}

async function writeAtomic(file: string, text: string): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true })
  const tmp = `${file}.tmp`
  await fs.writeFile(tmp, text, 'utf8')
  await fs.rename(tmp, file)
}

/** Returns stored data, or null when nothing valid exists. Corrupt files are backed up, not deleted. */
export async function load(key: DataKey): Promise<unknown> {
  const file = fileFor(key)
  let text: string
  try {
    text = await fs.readFile(file, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw err
  }
  try {
    const parsed = JSON.parse(text) as { v?: number; data?: unknown }
    if (isRecord(parsed) && parsed.v === SCHEMA_VERSION && validate(key, parsed.data)) {
      return parsed.data
    }
    throw new Error('invalid shape or unsupported schema version')
  } catch {
    await fs.copyFile(file, `${file}.corrupt-${Date.now()}.bak`).catch(() => undefined)
    return null
  }
}

export async function save(key: DataKey, value: unknown): Promise<void> {
  if (!validate(key, value)) throw new Error(`Rejected invalid data for "${key}"`)
  const text = JSON.stringify({ v: SCHEMA_VERSION, data: value })
  if (Buffer.byteLength(text) > MAX_BYTES) throw new Error('Data too large')
  await writeAtomic(fileFor(key), text)
}

async function snapshotAll(): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {}
  for (const key of DATA_KEYS) {
    const v = await load(key)
    if (v !== null) out[key] = v
  }
  return out
}

export async function exportData(win: BrowserWindow | null): Promise<ActionResult> {
  const options = {
    title: 'Export uwu-deck data',
    defaultPath: `uwu-deck-backup-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  }
  const res = win ? await dialog.showSaveDialog(win, options) : await dialog.showSaveDialog(options)
  if (res.canceled || !res.filePath) return { ok: false, message: 'Export cancelled' }
  const payload = { app: 'uwu-deck', version: SCHEMA_VERSION, exportedAt: Date.now(), data: await snapshotAll() }
  await fs.writeFile(res.filePath, JSON.stringify(payload, null, 2), 'utf8')
  return { ok: true, message: 'Data exported' }
}

export async function importData(win: BrowserWindow | null): Promise<ActionResult> {
  const options = {
    title: 'Import uwu-deck data',
    properties: ['openFile' as const],
    filters: [{ name: 'JSON', extensions: ['json'] }]
  }
  const res = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options)
  if (res.canceled || !res.filePaths[0]) return { ok: false, message: 'Import cancelled' }
  const stat = await fs.stat(res.filePaths[0])
  if (stat.size > MAX_BYTES * 2) return { ok: false, message: 'File is too large' }
  let parsed: unknown
  try {
    parsed = JSON.parse(await fs.readFile(res.filePaths[0], 'utf8'))
  } catch {
    return { ok: false, message: 'File is not valid JSON' }
  }
  if (!isRecord(parsed) || parsed.app !== 'uwu-deck' || !isRecord(parsed.data)) {
    return { ok: false, message: 'Not a uwu-deck backup file' }
  }
  const incoming = parsed.data
  for (const key of DATA_KEYS) {
    if (key in incoming && !validate(key, incoming[key])) {
      return { ok: false, message: `Backup contains invalid "${key}" data. Nothing was changed.` }
    }
  }
  // Keep a safety copy of the current data before replacing anything.
  const backup = path.join(dataDir(), 'backups', `before-import-${Date.now()}.json`)
  await writeAtomic(backup, JSON.stringify({ app: 'uwu-deck', data: await snapshotAll() }))
  for (const key of DATA_KEYS) if (key in incoming) await save(key, incoming[key])
  return { ok: true, message: 'Data imported' }
}

// Window bounds live outside the validated data keys.
const boundsFile = (): string => path.join(dataDir(), 'window.json')
export interface Bounds {
  x?: number
  y?: number
  width: number
  height: number
  maximized: boolean
}
export async function readBounds(): Promise<Bounds | null> {
  try {
    const b = JSON.parse(await fs.readFile(boundsFile(), 'utf8')) as Bounds
    return typeof b.width === 'number' && typeof b.height === 'number' ? b : null
  } catch {
    return null
  }
}
export async function writeBounds(b: Bounds): Promise<void> {
  await writeAtomic(boundsFile(), JSON.stringify(b)).catch(() => undefined)
}
