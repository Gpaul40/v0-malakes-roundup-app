'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

interface CountdownTimerProps {
  endDate: string
}

export function CountdownTimer({ endDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      const now = new Date()
      const difference = end.getTime() - now.getTime()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  const isUrgent = timeLeft.days <= 2
  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0

  return (
    <div className={`glass-card rounded-2xl p-6 ${isUrgent ? 'glow-purple' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${isUrgent ? 'text-secondary' : 'text-muted-foreground'}`} />
          <span className="text-sm font-medium text-muted-foreground">Time Remaining</span>
        </div>
        {isUrgent && !isExpired && (
          <span className="flex items-center gap-1 px-2 py-1 bg-secondary/20 text-secondary rounded-full text-xs font-medium">
            <AlertTriangle className="w-3 h-3" />
            Urgent
          </span>
        )}
      </div>

      {isExpired ? (
        <div className="text-center py-4">
          <p className="text-2xl font-bold text-red-400">DEADLINE PASSED</p>
          <p className="text-sm text-muted-foreground mt-2">The tribunal awaits...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: timeLeft.days, label: 'Days' },
              { value: timeLeft.hours, label: 'Hours' },
              { value: timeLeft.minutes, label: 'Mins' },
              { value: timeLeft.seconds, label: 'Secs' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className={`text-3xl md:text-4xl font-bold font-mono ${
                  isUrgent ? 'text-secondary' : 'text-foreground'
                }`}>
                  {String(item.value).padStart(2, '0')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  isUrgent ? 'bg-secondary' : 'bg-primary'
                }`}
                style={{ 
                  width: `${Math.max(0, Math.min(100, ((14 - timeLeft.days) / 14) * 100))}%` 
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {timeLeft.days} of 14 days remaining
            </p>
          </div>
        </>
      )}
    </div>
  )
}
