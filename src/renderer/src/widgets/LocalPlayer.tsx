import { useCallback, useEffect, useRef, useState } from 'react'
import { FolderPlus, Pause, Play, SkipBack, SkipForward, Trash2, Volume2 } from 'lucide-react'
import { ConfirmButton, Empty } from '../components/ui'
import type { AudioTrack } from '../../../shared/api'
import { notify } from '../ui'

const mmss = (s: number): string =>
  Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00'

/** Plays audio files the user picked. Real play/pause, seek, volume and previous/next. */
export function LocalPlayer(): JSX.Element {
  const audio = useRef<HTMLAudioElement>(null)
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [current, setCurrent] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)

  useEffect(() => {
    window.deck.audio.list().then(setTracks).catch(() => notify('Could not read your audio list.', 'error'))
  }, [])

  useEffect(() => {
    if (audio.current) audio.current.volume = volume
  }, [volume])

  // Start playback whenever the selected track changes.
  useEffect(() => {
    const el = audio.current
    if (!el || !current) return
    el.load()
    el.play().catch(() => setPlaying(false))
  }, [current])

  const step = useCallback(
    (dir: 1 | -1) => {
      const ok = tracks.filter((t) => !t.missing)
      if (ok.length === 0) return
      const i = ok.findIndex((t) => t.id === current)
      setCurrent(ok[(i + dir + ok.length) % ok.length].id)
    },
    [tracks, current]
  )

  const toggle = (): void => {
    const el = audio.current
    if (!el) return
    if (!current) return step(1)
    if (el.paused) el.play().catch(() => setPlaying(false))
    else el.pause()
  }

  const track = tracks.find((t) => t.id === current)

  return (
    <div className="local-player">
      <div className="row">
        <h3 className="sub grow">Local audio</h3>
        <button
          className="btn"
          onClick={() => window.deck.audio.add().then(setTracks).catch(() => notify('Could not add files.', 'error'))}
        >
          <FolderPlus size={14} /> Add files
        </button>
      </div>
      <audio
        ref={audio}
        src={current ? `uwu-media://${current}/` : undefined}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => step(1)}
        onError={() => {
          setPlaying(false)
          notify(`Can't play "${track?.name ?? 'that file'}". It may be moved or in an unsupported format.`, 'error')
        }}
      />
      <div className="player-bar">
        <button className="icon-btn" aria-label="Previous track" onClick={() => step(-1)} disabled={tracks.length === 0}><SkipBack size={16} /></button>
        <button className="btn primary" aria-label={playing ? 'Pause' : 'Play'} onClick={toggle} disabled={tracks.length === 0}>
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button className="icon-btn" aria-label="Next track" onClick={() => step(1)} disabled={tracks.length === 0}><SkipForward size={16} /></button>
        <span className="mono muted">{mmss(time)}</span>
        <input
          type="range"
          className="grow"
          aria-label="Seek"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(time, duration || 0)}
          disabled={!current}
          onChange={(e) => {
            if (audio.current) audio.current.currentTime = Number(e.target.value)
          }}
        />
        <span className="mono muted">{mmss(duration)}</span>
        <Volume2 size={14} aria-hidden />
        <input type="range" aria-label="Volume" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
      </div>
      {track && <p className="muted small">Now playing: {track.name}</p>}
      <ul className="list compact">
        {tracks.length === 0 && <Empty title="No local audio yet" hint="Add files from your computer. They stay where they are; uwu-deck only remembers their location." />}
        {tracks.map((t) => (
          <li key={t.id} className="item">
            <button className={`link grow ${t.id === current ? 'current' : ''}`} disabled={t.missing} onClick={() => setCurrent(t.id)}>
              {t.name}
            </button>
            {t.missing && <span className="chip overdue">File not found</span>}
            <ConfirmButton label={`Remove from list: ${t.name}`} onConfirm={() => window.deck.audio.remove(t.id).then(setTracks).catch(() => notify('Could not remove that track.', 'error'))}>
              <Trash2 size={14} />
            </ConfirmButton>
          </li>
        ))}
      </ul>
    </div>
  )
}
