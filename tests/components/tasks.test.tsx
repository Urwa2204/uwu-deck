// @vitest-environment jsdom
import './setup'
import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Tasks } from '../../src/renderer/src/widgets/Tasks'
import type { Task } from '../../src/renderer/src/types'

function Harness(): JSX.Element {
  const [tasks, setTasks] = useState<Task[]>([])
  return <Tasks tasks={tasks} update={setTasks} />
}

async function addTask(text: string): Promise<void> {
  await userEvent.type(screen.getByLabelText('New task'), `${text}{Enter}`)
}

describe('Tasks widget', () => {
  it('shows an empty state first', () => {
    render(<Harness />)
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
  })

  it('adds a task with Enter and clears the input', async () => {
    render(<Harness />)
    await addTask('Write tests')
    expect(screen.getByText('Write tests')).toBeInTheDocument()
    expect(screen.getByLabelText('New task')).toHaveValue('')
  })

  it('rejects empty input without adding anything', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByLabelText('New task'), '   {Enter}')
    expect(screen.getByLabelText('New task')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
  })

  it('completes a task, updates the count and filters', async () => {
    render(<Harness />)
    await addTask('Alpha')
    await addTask('Beta')
    await userEvent.click(screen.getByRole('checkbox', { name: /Mark done: Alpha/ }))
    expect(screen.getByText('1 / 2 completed')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Completed' }))
    await waitFor(() => expect(screen.queryByText('Beta')).not.toBeInTheDocument())
    expect(screen.getByText('Alpha')).toBeInTheDocument()
  })

  it('needs two clicks to delete a task', async () => {
    render(<Harness />)
    await addTask('Alpha')
    await userEvent.click(screen.getByRole('button', { name: 'Delete task: Alpha' }))
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Confirm: Delete task: Alpha' }))
    await waitFor(() => expect(screen.queryByText('Alpha')).not.toBeInTheDocument())
  })
})
