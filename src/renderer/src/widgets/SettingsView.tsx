import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, Download, Settings as SettingsIcon, Upload } from 'lucide-react'
import { Card, Toggle } from '../components/ui'
import { Settings, WIDGET_LABELS, WidgetId } from '../types'
import { notify } from '../ui'

interface Props {
  settings: Settings
  setSettings: (s: Settings) => void
}

function Row(props: { label: string; hint?: string; children: ReactNode }): JSX.Element {
  return (
    <div className="setting">
      <div>
        <strong>{props.label}</strong>
        {props.hint && <span className="muted small">{props.hint}</span>}
      </div>
      {props.children}
    </div>
  )
}

export function SettingsView({ settings, setSettings }: Props): JSX.Element {
  const set = <K extends keyof Settings>(key: K, value: Settings[K]): void => setSettings({ ...settings, [key]: value })
  const visible = (id: WidgetId): boolean => !settings.hiddenWidgets.includes(id)
  const move = (i: number, dir: -1 | 1): void => {
    const j = i + dir
    if (j < 0 || j >= settings.widgetOrder.length) return
    const order = [...settings.widgetOrder]
    ;[order[i], order[j]] = [order[j], order[i]]
    set('widgetOrder', order)
  }
  const run = async (fn: () => Promise<{ ok: boolean; message: string }>, reload: boolean): Promise<void> => {
    try {
      const r = await fn()
      notify(r.message, r.ok ? 'info' : 'error')
      if (r.ok && reload) window.setTimeout(() => window.location.reload(), 600)
    } catch {
      notify('That action failed. Nothing was changed.', 'error')
    }
  }

  return (
    <Card title="Settings" icon={<SettingsIcon size={16} />} className="w-settings">
      <h3 className="sub">General</h3>
      <Row label="Your name" hint="Used in the greeting.">
        <input className="input" value={settings.userName} maxLength={40} aria-label="Your name" onChange={(e) => set('userName', e.target.value)} />
      </Row>
      <Row label="Launch at Windows login" hint="Applies to the installed app, not the dev build.">
        <Toggle label="Launch at login" checked={settings.launchAtLogin} onChange={(v) => set('launchAtLogin', v)} />
      </Row>
      <Row label="Close button hides to tray" hint="Off: closing the window quits the app. Quit from the tray menu otherwise.">
        <Toggle label="Minimize to tray" checked={settings.minimizeToTray} onChange={(v) => set('minimizeToTray', v)} />
      </Row>
      <Row label="Always on top">
        <Toggle label="Always on top" checked={settings.alwaysOnTop} onChange={(v) => set('alwaysOnTop', v)} />
      </Row>
      <Row label="Reduce motion">
        <Toggle label="Reduce motion" checked={settings.reducedMotion} onChange={(v) => set('reducedMotion', v)} />
      </Row>
      <Row label="Show / hide shortcut" hint="Fixed: Ctrl + Alt + D">
        <kbd>Ctrl+Alt+D</kbd>
      </Row>

      <h3 className="sub">Focus timer defaults</h3>
      <Row label="Focus minutes">
        <input className="input narrow" type="number" min={1} max={180} value={settings.focusMin} aria-label="Focus minutes" onChange={(e) => set('focusMin', Number(e.target.value) || 1)} />
      </Row>
      <Row label="Break minutes">
        <input className="input narrow" type="number" min={1} max={60} value={settings.breakMin} aria-label="Break minutes" onChange={(e) => set('breakMin', Number(e.target.value) || 1)} />
      </Row>

      <h3 className="sub">System monitor & music</h3>
      <Row label="Refresh interval" hint="1 to 10 seconds. Longer uses less CPU.">
        <input className="input narrow" type="number" min={1} max={10} value={settings.monitorIntervalSec} aria-label="Refresh interval in seconds" onChange={(e) => set('monitorIntervalSec', Math.min(10, Math.max(1, Number(e.target.value) || 2)))} />
      </Row>
      <Row label="Search destination">
        <select className="input" value={settings.musicDestination} aria-label="Search destination" onChange={(e) => set('musicDestination', e.target.value === 'youtube-music' ? 'youtube-music' : 'youtube')}>
          <option value="youtube">YouTube</option>
          <option value="youtube-music">YouTube Music</option>
        </select>
      </Row>

      <h3 className="sub">Dashboard widgets</h3>
      <ul className="list compact">
        {settings.widgetOrder.map((id, i) => (
          <li key={id} className="item">
            <span className="grow">{WIDGET_LABELS[id]}</span>
            <button className="icon-btn" aria-label={`Move up: ${WIDGET_LABELS[id]}`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={14} /></button>
            <button className="icon-btn" aria-label={`Move down: ${WIDGET_LABELS[id]}`} disabled={i === settings.widgetOrder.length - 1} onClick={() => move(i, 1)}><ArrowDown size={14} /></button>
            <Toggle
              label={`Show ${WIDGET_LABELS[id]}`}
              checked={visible(id)}
              onChange={(v) => set('hiddenWidgets', v ? settings.hiddenWidgets.filter((w) => w !== id) : [...settings.hiddenWidgets, id])}
            />
          </li>
        ))}
      </ul>

      <h3 className="sub">Your data</h3>
      <Row label="Backup" hint="Export everything to one JSON file, or restore from one. Importing keeps a safety copy first.">
        <div className="row tight">
          <button className="btn" onClick={() => void run(() => window.deck.exportData(), false)}><Download size={14} /> Export</button>
          <button className="btn" onClick={() => void run(() => window.deck.importData(), true)}><Upload size={14} /> Import</button>
        </div>
      </Row>
    </Card>
  )
}
