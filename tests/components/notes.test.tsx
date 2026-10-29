// @vitest-environment jsdom
import './setup'
import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Notes } from '../../src/renderer/src/widgets/Notes'
import type { Note } from '../../src/renderer/src/types'

function Harness({ ready = true }: { ready?: boolean }): JSX.Element {
  const [notes, setNotes] = useState<Note[]>([])
  return <Notes notes={notes} ready={ready} update={setNotes} />
}

describe('Notes widget', () => {
  it('shows a loading state until ready', () => {
    render(<Harness ready={false} />)
    expect(screen.getByText('Loading notes…')).toBeInTheDocument()
  })

  it('creates a note from the first line and shows an edit time', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByLabelText('New note'), 'Project ideas{Enter}')
    expect(screen.getAllByText('Project ideas').length).toBeGreaterThan(0)
    expect(screen.getByText(/^Edited /)).toBeInTheDocument()
  })

  it('searches by title and content', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByLabelText('New note'), 'Groceries{Enter}')
    await userEvent.type(screen.getByLabelText('New note'), 'Reading list{Enter}')
    await userEvent.type(screen.getByLabelText('Search notes'), 'groc')
    await waitFor(() => expect(screen.queryByText('Reading list')).not.toBeInTheDocument())
    expect(screen.getAllByText('Groceries').length).toBeGreaterThan(0)
    await userEvent.clear(screen.getByLabelText('Search notes'))
    await userEvent.type(screen.getByLabelText('Search notes'), 'zzz')
    await waitFor(() => expect(screen.getByText('No matching notes')).toBeInTheDocument())
  })

  it('pins a note', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByLabelText('New note'), 'Keep me{Enter}')
    const pin = screen.getByRole('button', { name: 'Pin note: Keep me' })
    await userEvent.click(pin)
    expect(screen.getByRole('button', { name: 'Unpin note: Keep me' })).toHaveAttribute('aria-pressed', 'true')
  })
})
