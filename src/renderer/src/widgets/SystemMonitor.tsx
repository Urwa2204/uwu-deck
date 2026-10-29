import { Activity } from 'lucide-react'
import { Card } from '../components/ui'
import { SystemHistoryPoint, useSystem } from '../hooks'

const gb = (b: number | null): string => (b === null ? 'unavailable' : `${(b / 1024 ** 3).toFixed(1)} GB`)

function Gauge({ label, value }: { label: string; value: number | null }): JSX.Element {
  const R = 34
  const C = 2 * Math.PI * R
  return (
    <div className="gauge" role="img" aria-label={`${label}: ${value === null ? 'unavailable' : `${value} percent`}`}>
      <svg viewBox="0 0 88 88" aria-hidden>
        <circle cx="44" cy="44" r={R} className="ring-bg" />
        {value !== null && <circle cx="44" cy="44" r={R} className="ring-fg" strokeDasharray={C} strokeDashoffset={C * (1 - value / 100)} transform="rotate(-90 44 44)" />}
      </svg>
      <strong>{value === null ? 'n/a' : `${value}%`}</strong>
      <span>{label}</span>
    </div>
  )
}

function Spark({ data, pick }: { data: SystemHistoryPoint[]; pick: 'cpu' | 'mem' }): JSX.Element {
  const pts = data.map((d, i) => ({ x: i, y: d[pick] })).filter((p): p is { x: number; y: number } => p.y !== null)
  if (pts.length < 2) return <svg className="spark" viewBox="0 0 200 50" aria-hidden />
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${(p.x / 39) * 200},${50 - (p.y / 100) * 48 - 1}`).join(' ')
  return (
    <svg className={`spark ${pick}`} viewBox="0 0 200 50" preserveAspectRatio="none" aria-hidden>
      <path d={path} fill="none" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

const uptime = (s: number): string => {
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  return d ? `${d}d ${h}h` : `${h}h ${m}m`
}

export function SystemMonitor({ intervalSec }: { intervalSec: number }): JSX.Element {
  const { snap, history, failed } = useSystem(intervalSec)
  return (
    <Card title="System monitor" icon={<Activity size={16} />} className="w-system">
      {!snap && !failed && <p className="muted">Reading system metrics…</p>}
      {failed && !snap && <p className="muted">System metrics are unavailable right now.</p>}
      {snap && (
        <>
          <div className="gauges">
            <Gauge label="CPU" value={snap.cpu} />
            <Gauge label="RAM" value={snap.memPercent} />
            <Gauge label="Disk" value={snap.diskPercent} />
          </div>
          <div className="spark-wrap">
            <Spark data={history} pick="cpu" />
            <Spark data={history} pick="mem" />
            <div className="legend"><span className="cpu">CPU</span><span className="mem">RAM</span><span className="muted">last {history.length * intervalSec}s</span></div>
          </div>
          <dl className="stats">
            <div><dt>Memory</dt><dd>{gb(snap.memUsedBytes)} / {gb(snap.memTotalBytes)}</dd></div>
            <div><dt>Uptime</dt><dd>{uptime(snap.uptimeSec)}</dd></div>
            <div><dt>Temperature</dt><dd className="muted">unavailable</dd></div>
          </dl>
        </>
      )}
    </Card>
  )
}
