import fallback from './assets/bg.svg'

// Drop a Haikei SVG export into src/renderer/src/assets/backgrounds/ and it is used automatically.
const exported = import.meta.glob('./assets/backgrounds/*.svg', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>

export function applyBackground(): void {
  const entries = Object.entries(exported)
  const pick = entries.find(([name]) => name.toLowerCase().includes('haikei')) ?? entries[0]
  const url = pick ? pick[1] : fallback
  document.documentElement.style.setProperty('--bg-image', `url("${url}")`)
}
