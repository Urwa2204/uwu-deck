// @vitest-environment jsdom
import './setup'
import { useState } from 'react'
import { addMonths, format, startOfMonth } from 'date-fns'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Calendar } from '../../src/renderer/src/widgets/Calendar'
import type { CalEvent } from '../../src/renderer/src/types'

function Harness(): JSX.Element {
  const [events, setEvents] = useState<CalEvent[]>([])
  return <Calendar events={events} update={setEvents} />
}

describe('Calendar widget', () => {
  it('navigates between months', async () => {
    render(<Harness />)
    const next = addMonths(startOfMonth(new Date()), 1)
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }))
    expect(screen.getByText(format(next, 'MMMM yyyy'))).toBeInTheDocument()
  })

  it('adds, edits and deletes an event', async () => {
    render(<Harness />)
    expect(screen.getByText('No events this day')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Event title'), 'Standup')
    await userEvent.click(screen.getByRole('button', { name: 'Add event' }))
    expect(screen.getAllByText('Standup').length).toBeGreaterThan(0)

    await userEvent.click(screen.getByRole('button', { name: 'Edit event: Standup' }))
    await userEvent.clear(screen.getByLabelText('Event title'))
    await userEvent.type(screen.getByLabelText('Event title'), 'Retro')
    await userEvent.click(screen.getByRole('button', { name: 'Save event' }))
    expect(screen.getAllByText('Retro').length).toBeGreaterThan(0)

    await userEvent.click(screen.getByRole('button', { name: 'Delete event: Retro' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirm: Delete event: Retro' }))
    expect(screen.queryByText('Retro')).not.toBeInTheDocument()
  })

  it('does not add an event without a title', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Add event' }))
    expect(screen.getByText('No events this day')).toBeInTheDocument()
  })
})
