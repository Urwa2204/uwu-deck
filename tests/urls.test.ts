import { describe, expect, it } from 'vitest'
import { buildSearchUrl, isAllowedMusicUrl, normalizeMusicUrl } from '../src/shared/urls'

describe('music urls', () => {
  it('accepts approved https YouTube hosts', () => {
    expect(isAllowedMusicUrl('https://music.youtube.com/playlist?list=abc')).toBe(true)
    expect(isAllowedMusicUrl('https://youtu.be/abc')).toBe(true)
  })
  it('rejects other hosts, schemes, lookalikes and credentials', () => {
    expect(isAllowedMusicUrl('http://youtube.com/')).toBe(false)
    expect(isAllowedMusicUrl('https://evil.com/youtube.com')).toBe(false)
    expect(isAllowedMusicUrl('https://youtube.com.evil.com/')).toBe(false)
    expect(isAllowedMusicUrl('javascript:alert(1)')).toBe(false)
    expect(isAllowedMusicUrl('file:///C:/Windows/System32/calc.exe')).toBe(false)
    expect(isAllowedMusicUrl('https://user:pw@youtube.com/')).toBe(false)
    expect(isAllowedMusicUrl(42)).toBe(false)
  })
  it('normalizes scheme-less links', () => {
    expect(normalizeMusicUrl('youtube.com/watch?v=1')).toBe('https://youtube.com/watch?v=1')
    expect(normalizeMusicUrl('evil.com')).toBeNull()
  })
  it('encodes search terms safely', () => {
    const url = buildSearchUrl('lofi & chill "mix"', 'youtube')!
    expect(new URL(url).searchParams.get('search_query')).toBe('lofi & chill "mix"')
    expect(url).not.toContain(' ')
    expect(buildSearchUrl('   ', 'youtube')).toBeNull()
    expect(buildSearchUrl('x', 'youtube-music')).toContain('music.youtube.com/search?q=')
  })
})
