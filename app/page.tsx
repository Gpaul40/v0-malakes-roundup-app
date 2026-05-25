'use client'

import { useState, useEffect } from 'react'
import { Crown, Clock, ChevronRight, Plus, Trophy, AlertTriangle, Star, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { members, events, fines, getCurrentOrganiser, getNextOrganiser, getCurrentCycleInfo, getStatusColor } from '@/lib/data'
import { Member, Event, Fine } from '@/lib/types'

export default function MalakesRoundup() {
  const [showModal, setShowModal] = useState(true)
  const [membersState] = useState<Member[]>(members)
  const [eventsState, setEventsState] = useState<Event[]>(events)
  const [finesState, setFinesState] = useState<Fine[]>(fines)
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  
  const currentOrganiser = getCurrentOrganiser()
  const nextOrganiser = getNextOrganiser()
  const cycleInfo = getCurrentCycleInfo()
  const currentMember = membersState.find(m => m.name === currentOrganiser)
  
  // Countdown timer
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const endDate = new Date(cycleInfo.cycleEndDate)
      endDate.setHours(23, 59, 59, 999)
      const diff = endDate.getTime() - now.getTime()
      
      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }
      
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      }
    }
    
    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000)
    return () => clearInterval(timer)
  }, [cycleInfo.cycleEndDate])
  
  const handleSubmitEvent = () => {
    if (!eventTitle.trim()) return
    const newEvent: Event = {
      id: String(eventsState.length + 1),
      organiserId: currentMember?.id || '1',
      organiserName: currentOrganiser,
      title: eventTitle,
      date: new Date().toISOString().split('T')[0],
      description: eventDescription || 'No description provided.',
      attendees: membersState.filter(m => m.name !== currentOrganiser).map(m => m.name),
      rating: 0,
    }
    setEventsState([newEvent, ...eventsState])
    setEventTitle('')
    setEventDescription('')
    setShowEventForm(false)
  }
  
  const handlePayFine = (fineId: string) => {
    setFinesState(finesState.map(f => f.id === fineId ? { ...f, paid: true } : f))
  }
  
  // Leaderboard sorted by events organised
  const leaderboard = [...membersState].sort((a, b) => b.eventsOrganised - a.eventsOrganised)
  const outstandingFines = finesState.filter(f => !f.paid)
  const totalOutstanding = outstandingFines.reduce((sum, f) => sum + f.amount, 0)

  // Opening Modal
  if (showModal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center glow-gold">
            <Crown className="w-10 h-10 text-primary" />
          </div>
          
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm uppercase tracking-widest">Attention</p>
            <h1 className="text-3xl font-bold text-gold-gradient">
              {"IT'S"} {currentOrganiser} WEEK
            </h1>
          </div>
          
          <p className="text-muted-foreground leading-relaxed">
            You have <span className="text-primary font-semibold">14 days</span> to organise the Malakes Roundup.
          </p>
          
          <div className="pt-2">
            <Button 
              onClick={() => setShowModal(false)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base glow-gold"
            >
              Acknowledge Responsibility
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground/60">
            Failure to comply will result in tribunal action
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-gold">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gold-gradient">The Malakes Roundup</h1>
              <p className="text-xs text-muted-foreground">Cycle {cycleInfo.cycleNumber}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {/* Current Organiser Card */}
        <div className="glass-card rounded-xl p-5 glow-gold">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Current Organiser</span>
            {currentMember && (
              <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(currentMember.status)}`}>
                {currentMember.status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary border-2 border-primary/50">
              {currentOrganiser[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gold-gradient">{currentOrganiser}</h2>
              <p className="text-sm text-muted-foreground">
                {currentMember?.eventsOrganised || 0} events organised
              </p>
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-secondary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Time Remaining</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: timeLeft.days, label: 'Days' },
              { value: timeLeft.hours, label: 'Hrs' },
              { value: timeLeft.minutes, label: 'Min' },
              { value: timeLeft.seconds, label: 'Sec' },
            ].map((item) => (
              <div key={item.label} className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-secondary">{String(item.value).padStart(2, '0')}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
          {timeLeft.days <= 3 && timeLeft.days > 0 && (
            <p className="text-xs text-amber-400 mt-3 text-center">
              Time is running out. The tribunal is watching.
            </p>
          )}
        </div>

        {/* Next Organiser */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-sm font-bold text-muted-foreground">
                {nextOrganiser[0]}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next Up</p>
                <p className="font-semibold">{nextOrganiser}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        {/* Event Submission */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Submit Event</span>
            </div>
            {!showEventForm && (
              <Button 
                size="sm" 
                onClick={() => setShowEventForm(true)}
                className="bg-primary/20 hover:bg-primary/30 text-primary"
              >
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            )}
          </div>
          
          {showEventForm ? (
            <div className="space-y-3">
              <Input
                placeholder="Event title..."
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="bg-muted/30 border-border"
              />
              <Textarea
                placeholder="Event description..."
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="bg-muted/30 border-border min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmitEvent}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Submit
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowEventForm(false)}
                  className="border-border"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {currentOrganiser}, submit your event details here.
            </p>
          )}
        </div>

        {/* Fine Tracker */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold">Outstanding Fines</span>
            </div>
            <span className="text-lg font-bold text-amber-400">${totalOutstanding}</span>
          </div>
          
          {outstandingFines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              No outstanding fines. The council is pleased.
            </p>
          ) : (
            <div className="space-y-2">
              {outstandingFines.slice(0, 3).map((fine) => (
                <div key={fine.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fine.memberName}</p>
                    <p className="text-xs text-muted-foreground truncate">{fine.reason}</p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handlePayFine(fine.id)}
                    className="ml-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs"
                  >
                    <DollarSign className="w-3 h-3 mr-1" />
                    {fine.amount}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Leaderboard</span>
          </div>
          
          <div className="space-y-2">
            {leaderboard.map((member, index) => (
              <div 
                key={member.id} 
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-primary text-primary-foreground' : 
                    index === 1 ? 'bg-gray-400 text-gray-900' :
                    index === 2 ? 'bg-amber-700 text-amber-100' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </span>
                  <span className={`font-medium ${index === 0 ? 'text-primary' : ''}`}>
                    {member.name}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {member.eventsOrganised} events
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Events */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-secondary" />
            <span className="text-sm font-semibold">Recent Events</span>
          </div>
          
          <div className="space-y-3">
            {eventsState.slice(0, 3).map((event) => (
              <div key={event.id} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-medium text-sm">{event.title}</h4>
                  {event.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-primary fill-primary" />
                      <span className="text-xs text-primary">{event.rating}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  by {event.organiserName} • {new Date(event.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </p>
                <p className="text-xs text-muted-foreground/80 line-clamp-2">
                  {event.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
