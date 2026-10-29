import { app, dialog, BrowserWindow } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import type { AudioTrack } from '../shared/api'

/**
 * The playlist is owned by the main process. The renderer only ever sees opaque ids and names,
 * so a compromised page cannot ask for arbitrary files. Audio files are never copied.
 */
const EXTENSIONS = new Set(['.mp3', '.wav', '.ogg', '.oga', '.opus', '.flac', '.m4a', '.aac', '.webm'])
const MAX_TRACKS = 500

interface Entry {
  id: string
  name: string
  path: string
}

let cache: Entry[] | null = null
const file = (): string => path.join(app.getPath('userData'), 'data', 'playlist.json')
const allowed = (p: string): boolean => path.isAbsolute(p) && EXTENSIONS.has(path.extname(p).toLowerCase())

const isEntry = (v: unknown): v is Entry => {
  if (typeof v !== 'object' || v === null) return false
  const e = v as Record<string, unknown>
  return typeof e.id === 'string' && e.id.length <= 64 && typeof e.name === 'string' && typeof e.path === 'string' && allowed(e.path)
}

async function entries(): Promise<Entry[]> {
  if (cache) return cache
  try {
    const raw: unknown = JSON.parse(await fs.readFile(file(), 'utf8'))
    cache = Array.isArray(raw) ? raw.filter(isEntry) : []
  } catch {
    cache = []
  }
  return cache
}

async function persist(list: Entry[]): Promise<void> {
  cache = list
  await fs.mkdir(path.dirname(file()), { recursive: true })
  const tmp = `${file()}.tmp`
  await fs.writeFile(tmp, JSON.stringify(list), 'utf8')
  await fs.rename(tmp, file())
}

const exists = (p: string): Promise<boolean> =>
  fs.access(p).then(
    () => true,
    () => false
  )

export async function listTracks(): Promise<AudioTrack[]> {
  const list = await entries()
  return Promise.all(list.map(async (e) => ({ id: e.id, name: e.name, missing: !(await exists(e.path)) })))
}

export async function addTracks(win: BrowserWindow | null): Promise<AudioTrack[]> {
  const options = {
    title: 'Add audio files',
    properties: ['openFile' as const, 'multiSelections' as const],
    filters: [{ name: 'Audio', extensions: [...EXTENSIONS].map((e) => e.slice(1)) }]
  }
  const res = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options)
  if (res.canceled) return listTracks()
  const list = [...(await entries())]
  for (const p of res.filePaths) {
    if (!allowed(p) || list.some((e) => e.path === p) || list.length >= MAX_TRACKS) continue
    list.push({ id: randomUUID(), name: path.basename(p, path.extname(p)), path: p })
  }
  await persist(list)
  return listTracks()
}

export async function removeTrack(id: unknown): Promise<AudioTrack[]> {
  if (typeof id === 'string') await persist((await entries()).filter((e) => e.id !== id))
  return listTracks()
}

export async function resolveTrackPath(id: string): Promise<string | null> {
  const entry = (await entries()).find((e) => e.id === id)
  return entry && (await exists(entry.path)) ? entry.path : null
}
