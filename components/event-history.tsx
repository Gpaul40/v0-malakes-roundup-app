'use client'

import { History, Star, Users, Calendar } from 'lucide-react'
import { Event } from '@/lib/types'

interface EventHistoryProps {
  events: Event[]
}

export function EventHistory({ events }: EventHistoryProps) {
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-3 h-3 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} 
      />
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-gold-gradient">Event Archives</h2>
        </div>
        <span className="text-sm text-muted-foreground">{events.length} events</span>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{events.length}</p>
          <p className="text-xs text-muted-foreground">Total Events</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">
            {events.length > 0 
              ? (events.reduce((sum, e) => sum + e.rating, 0) / events.length).toFixed(1)
              : '0'}
          </p>
          <p className="text-xs text-muted-foreground">Avg Rating</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <Users className="w-5 h-5 text-secondary mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">
            {events.length > 0 
              ? Math.round(events.reduce((sum, e) => sum + e.attendees.length, 0) / events.length)
              : '0'}
          </p>
          <p className="text-xs text-muted-foreground">Avg Turnout</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {sortedEvents.map((event, index) => (
          <div 
            key={event.id}
            className="glass-card rounded-xl p-4 relative"
          >
            {/* Timeline connector */}
            {index < sortedEvents.length - 1 && (
              <div className="absolute left-7 top-16 bottom-0 w-px bg-border translate-y-4" />
            )}
            
            <div className="flex gap-4">
              {/* Date badge */}
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/20 flex flex-col items-center justify-center text-primary border border-primary/30">
                <span className="text-xs font-bold">
                  {new Date(event.date).toLocaleDateString('en-AU', { day: 'numeric' })}
                </span>
                <span className="text-[10px] uppercase">
                  {new Date(event.date).toLocaleDateString('en-AU', { month: 'short' })}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Organised by <span className="text-primary">{event.organiserName}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {renderStars(event.rating)}
                  </div>
                </div>

                {event.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {event.description}
                  </p>
                )}

                {event.attendees.length > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {event.attendees.map((attendee) => (
                        <span 
                          key={attendee}
                          className="px-2 py-0.5 bg-muted/50 rounded text-xs text-muted-foreground"
                        >
                          {attendee}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="glass-card rounded-xl p-8 text-center">
          <History className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No events in the archives yet.</p>
          <p className="text-sm text-muted-foreground mt-1">The tribunal awaits your first gathering.</p>
        </div>
      )}

      {/* Legend */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold text-primary mb-2">Rating Guide</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          {[
            { stars: 5, label: 'Legendary' },
            { stars: 4, label: 'Excellent' },
            { stars: 3, label: 'Acceptable' },
            { stars: 2, label: 'Disappointing' },
            { stars: 1, label: 'Tribunal Worthy' },
          ].map((rating) => (
            <div key={rating.stars} className="flex items-center gap-1">
              <div className="flex">
                {Array.from({ length: rating.stars }, (_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <span className="text-muted-foreground">{rating.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
