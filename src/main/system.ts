import os from 'os'
import si from 'systeminformation'
import type { SystemSnapshot } from '../shared/api'

const pct = (n: unknown): number | null =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : null

/** Reads real machine metrics. Anything that cannot be read is returned as null, never invented. */
export async function getSnapshot(): Promise<SystemSnapshot> {
  const [load, mem, disks] = await Promise.allSettled([si.currentLoad(), si.mem(), si.fsSize()])

  const total = mem.status === 'fulfilled' ? mem.value.total : null
  // "available" matches what Task Manager reports as free-for-use memory.
  const used = mem.status === 'fulfilled' ? mem.value.total - mem.value.available : null

  let diskPercent: number | null = null
  if (disks.status === 'fulfilled' && disks.value.length > 0) {
    const sysDrive = (process.env.SystemDrive ?? 'C:').toUpperCase()
    const disk = disks.value.find((d) => d.mount.toUpperCase().startsWith(sysDrive)) ?? disks.value[0]
    diskPercent = pct(disk.use)
  }

  return {
    cpu: load.status === 'fulfilled' ? pct(load.value.currentLoad) : null,
    memUsedBytes: used,
    memTotalBytes: total,
    memPercent: total && used !== null ? pct((used / total) * 100) : null,
    diskPercent,
    uptimeSec: Math.floor(os.uptime()),
    takenAt: Date.now()
  }
}
