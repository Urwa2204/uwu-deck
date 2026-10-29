export const DATA_KEYS = [
  'tasks',
  'notes',
  'events',
  'sessions',
  'timer',
  'shortcuts',
  'settings'
] as const
export type DataKey = (typeof DATA_KEYS)[number]

export interface SystemSnapshot {
  cpu: number | null
  memUsedBytes: number | null
  memTotalBytes: number | null
  memPercent: number | null
  diskPercent: number | null
  uptimeSec: number
  takenAt: number
}

export interface ActionResult {
  ok: boolean
  message: string
}

export interface AudioTrack {
  id: string
  name: string
  /** True when the file was moved or deleted. The real path never reaches the renderer. */
  missing: boolean
}

/** The only surface the renderer can use to talk to the main process. */
export interface DeckApi {
  load(key: DataKey): Promise<unknown>
  save(key: DataKey, value: unknown): Promise<void>
  system(): Promise<SystemSnapshot>
  openExternal(url: string): Promise<boolean>
  exportData(): Promise<ActionResult>
  importData(): Promise<ActionResult>
  audio: {
    list(): Promise<AudioTrack[]>
    add(): Promise<AudioTrack[]>
    remove(id: string): Promise<AudioTrack[]>
  }
  onFlush(cb: () => Promise<void> | void): void
  win: {
    minimize(): void
    toggleMaximize(): void
    close(): void
    isMaximized(): Promise<boolean>
    onMaximizeChange(cb: (maximized: boolean) => void): void
  }
}
