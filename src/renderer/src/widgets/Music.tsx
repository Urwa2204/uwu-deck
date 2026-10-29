import { FormEvent, useState } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, Music as MusicIcon, Pencil, Search, Trash2 } from 'lucide-react'
import { Card, ConfirmButton, Empty } from '../components/ui'
import { LocalPlayer } from './LocalPlayer'
import { Settings, Shortcut } from '../types'
import { YOUTUBE_MUSIC_HOME, buildSearchUrl, normalizeMusicUrl } from '../../../shared/urls'
import { notify, uid } from '../ui'

interface Props {
  shortcuts: Shortcut[]
  update: (next: Shortcut[] | ((prev: Shortcut[]) => Shortcut[])) => void
  settings: Settings
}

export function Music({ shortcuts, update, settings }: Props): JSX.Element {
  const [term, setTerm] = useState('')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState('')

  const open = async (target: string): Promise<void> => {
    const ok = await window.deck.openExternal(target)
    if (!ok) notify('That link was blocked. Only YouTube links can be opened.', 'error')
  }

  const search = (e: FormEvent): void => {
    e.preventDefault()
    const target = buildSearchUrl(term, settings.musicDestination)
    if (target) void open(target)
  }

  const submit = (e: FormEvent): void => {
    e.preventDefault()
    const safe = normalizeMusicUrl(url)
    const label = name.trim().slice(0, 60)
    if (!label) return setError('Give the shortcut a name.')
    if (!safe) return setError('Use an https link from youtube.com, music.youtube.com or youtu.be.')
    update((p) => (editing ? p.map((s) => (s.id === editing ? { ...s, name: label, url: safe } : s)) : [...p, { id: uid(), name: label, url: safe }]))
    setName('')
    setUrl('')
    setEditing(null)
    setError('')
  }

  const move = (i: number, dir: -1 | 1): void =>
    update((p) => {
      const j = i + dir
      if (j < 0 || j >= p.length) return p
      const copy = [...p]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })

  return (
    <Card title="Music" icon={<MusicIcon size={16} />} className="w-music">
      <form className="row" onSubmit={search}>
        <label className="search grow">
          <Search size={14} aria-hidden />
          <input value={term} placeholder={`Search ${settings.musicDestination === 'youtube-music' ? 'YouTube Music' : 'YouTube'}`} aria-label="Search music" onChange={(e) => setTerm(e.target.value)} />
        </label>
        <button className="btn primary" type="submit">Search</button>
        <button className="btn" type="button" onClick={() => void open(YOUTUBE_MUSIC_HOME)}>
          <ExternalLink size={14} /> YouTube Music
        </button>
      </form>
      <p className="muted small">Playback happens in your browser. uwu-deck opens links; it can’t see or control what is playing.</p>

      <h3 className="sub">Saved shortcuts</h3>
      <ul className="list compact">
        {shortcuts.length === 0 && <Empty title="No shortcuts yet" hint="Save a playlist or mix link below." />}
        {shortcuts.map((s, i) => (
          <li key={s.id} className="item">
            <button className="link grow" onClick={() => void open(s.url)} title={s.url}>{s.name}</button>
            <button className="icon-btn" aria-label={`Move up: ${s.name}`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={14} /></button>
            <button className="icon-btn" aria-label={`Move down: ${s.name}`} disabled={i === shortcuts.length - 1} onClick={() => move(i, 1)}><ArrowDown size={14} /></button>
            <button className="icon-btn" aria-label={`Edit shortcut: ${s.name}`} onClick={() => { setEditing(s.id); setName(s.name); setUrl(s.url); setError('') }}><Pencil size={14} /></button>
            <ConfirmButton label={`Delete shortcut: ${s.name}`} onConfirm={() => update((p) => p.filter((x) => x.id !== s.id))}><Trash2 size={14} /></ConfirmButton>
          </li>
        ))}
      </ul>

      <form className="event-form" onSubmit={submit}>
        <input className="input" value={name} maxLength={60} placeholder="Name" aria-label="Shortcut name" onChange={(e) => setName(e.target.value)} />
        <input className="input grow" value={url} placeholder="https://music.youtube.com/playlist?list=…" aria-label="Shortcut link" aria-invalid={!!error} onChange={(e) => { setUrl(e.target.value); setError('') }} />
        <button className="btn primary" type="submit">{editing ? 'Save shortcut' : 'Add shortcut'}</button>
        {editing && <button className="btn" type="button" onClick={() => { setEditing(null); setName(''); setUrl(''); setError('') }}>Cancel</button>}
      </form>
      {error && <p className="error-text" role="alert">{error}</p>}

      <LocalPlayer />
    </Card>
  )
}
