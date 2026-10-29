// @vitest-environment jsdom
import './setup'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Music } from '../../src/renderer/src/widgets/Music'
import { DEFAULT_SETTINGS, type Shortcut } from '../../src/renderer/src/types'

const openExternal = vi.fn().mockResolvedValue(true)

beforeEach(() => {
  openExternal.mockClear()
  ;(window as unknown as { deck: unknown }).deck = {
    openExternal,
    audio: { list: vi.fn().mockResolvedValue([]), add: vi.fn(), remove: vi.fn() }
  }
})

function Harness(): JSX.Element {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([])
  return <Music shortcuts={shortcuts} update={setShortcuts} settings={DEFAULT_SETTINGS} />
}

describe('Music widget', () => {
  it('opens an encoded YouTube search', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByLabelText('Search music'), 'lofi beats{Enter}')
    expect(openExternal).toHaveBeenCalledWith('https://www.youtube.com/results?search_query=lofi+beats')
  })

  it('does nothing for an empty search', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByLabelText('Search music'), '  {Enter}')
    expect(openExternal).not.toHaveBeenCalled()
  })

  it('refuses shortcuts outside YouTube', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByLabelText('Shortcut name'), 'Bad')
    await userEvent.type(screen.getByLabelText('Shortcut link'), 'https://evil.com/playlist')
    await userEvent.click(screen.getByRole('button', { name: 'Add shortcut' }))
    expect(screen.getByRole('alert')).toHaveTextContent('youtube.com')
    expect(screen.getByText('No shortcuts yet')).toBeInTheDocument()
  })

  it('saves a valid shortcut and opens it', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByLabelText('Shortcut name'), 'Focus mix')
    await userEvent.type(screen.getByLabelText('Shortcut link'), 'music.youtube.com/playlist?list=abc')
    await userEvent.click(screen.getByRole('button', { name: 'Add shortcut' }))
    await userEvent.click(screen.getByRole('button', { name: 'Focus mix' }))
    expect(openExternal).toHaveBeenCalledWith('https://music.youtube.com/playlist?list=abc')
  })
})
