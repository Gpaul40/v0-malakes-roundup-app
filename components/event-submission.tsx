'use client'

import { useState } from 'react'
import { Calendar, Send, Users, Star } from 'lucide-react'
import { Member, Event } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface EventSubmissionProps {
  currentOrganiser: Member
  members: Member[]
  onSubmit: (event: Omit<Event, 'id'>) => void
}

export function EventSubmission({ currentOrganiser, members, onSubmit }: EventSubmissionProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  const otherMembers = members.filter(m => m.id !== currentOrganiser.id)

  const handleAttendeeToggle = (name: string) => {
    setSelectedAttendees(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name)
        : [...prev, name]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !date) return

    onSubmit({
      organiserId: currentOrganiser.id,
      organiserName: currentOrganiser.name,
      title,
      description,
      date,
      attendees: selectedAttendees,
      rating: 0,
    })

    setSubmitted(true)
    setTimeout(() => {
      setTitle('')
      setDescription('')
      setDate('')
      setSelectedAttendees([])
      setSubmitted(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold text-gold-gradient">Submit Event</h2>
      </div>

      <div className="glass-card-gold rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
            {currentOrganiser.avatar}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Submitting as</p>
            <p className="font-semibold text-foreground">{currentOrganiser.name}</p>
          </div>
        </div>
      </div>

      {submitted ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-emerald-400">Event Submitted!</h3>
          <p className="text-muted-foreground mt-2">The council has been notified.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Event Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Souvlaki Night at The Greek Club"
                className="bg-muted/50 border-border"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Date *
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-muted/50 border-border"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell the council about your glorious event..."
                className="w-full h-24 px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                <Users className="w-4 h-4 inline mr-1" />
                Expected Attendees
              </label>
              <div className="flex flex-wrap gap-2">
                {otherMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleAttendeeToggle(member.name)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedAttendees.includes(member.name)
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                    }`}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-gold"
            disabled={!title || !date}
          >
            <Send className="w-4 h-4 mr-2" />
            Submit to Tribunal
          </Button>
        </form>
      )}

      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold text-amber-400 mb-2">⚠️ Tribunal Notice</h3>
        <p className="text-xs text-muted-foreground">
          Failure to submit an event within your allocated fortnight will result in a $25 fine 
          and potential &quot;Dog Act&quot; status. The council does not show mercy.
        </p>
      </div>
    </div>
  )
}
