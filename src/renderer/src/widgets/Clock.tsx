import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Sparkles } from 'lucide-react'
import { Card } from '../components/ui'
import { TextEffect } from '../components/motion'

function greeting(hour: number): string {
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Clock({ name }: { name: string }): JSX.Element {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const message = `${greeting(now.getHours())}${name.trim() ? `, ${name.trim()}` : ''}.`
  return (
    <Card title="Today" icon={<Sparkles size={16} />} className="w-clock">
      <div className="clock-date">{format(now, 'EEEE, MMM d, yyyy')}</div>
      <div className="clock-time" aria-label={format(now, 'h:mm a')}>
        {format(now, 'hh:mm')}
        <span>{format(now, 'a')}</span>
      </div>
      <p className="clock-greeting">
        <TextEffect key={message}>{message}</TextEffect>
      </p>
    </Card>
  )
}
