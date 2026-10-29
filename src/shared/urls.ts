export const YOUTUBE_MUSIC_HOME = 'https://music.youtube.com/'

const ALLOWED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be'
])

export type MusicDestination = 'youtube' | 'youtube-music'

/** Returns a parsed URL only if it is https and on an approved YouTube host. */
export function parseMusicUrl(raw: unknown): URL | null {
  if (typeof raw !== 'string' || raw.length > 2048) return null
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:') return null
  if (url.username || url.password) return null
  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return null
  return url
}

export const isAllowedMusicUrl = (raw: unknown): boolean => parseMusicUrl(raw) !== null

/** Accepts "youtube.com/..." typed without a scheme. Returns a safe https URL or null. */
export function normalizeMusicUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
  return parseMusicUrl(withScheme)?.toString() ?? null
}

/** Builds a search URL with proper encoding; never concatenates user input. */
export function buildSearchUrl(term: string, destination: MusicDestination): string | null {
  const text = term.trim().slice(0, 200)
  if (!text) return null
  const music = destination === 'youtube-music'
  const url = new URL(music ? 'https://music.youtube.com/search' : 'https://www.youtube.com/results')
  url.searchParams.set(music ? 'q' : 'search_query', text)
  return url.toString()
}
