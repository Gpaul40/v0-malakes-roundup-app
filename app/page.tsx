'use client'

import { useState } from 'react'
import { Crown, Clock, Users, Calendar, Scale, Trophy, History, AlertTriangle } from 'lucide-react'
import { CurrentOrganiser } from '@/components/current-organiser'
import { CountdownTimer } from '@/components/countdown-timer'
import { NextOrganiser } from '@/components/next-organiser'
import { MemberList } from '@/components/member-list'
import { EventSubmission } from '@/components/event-submission'
import { FineTracker } from '@/components/fine-tracker'
import { Leaderboard } from '@/components/leaderboard'
import { EventHistory } from '@/components/event-history'
import { members, events, fines, currentCycle } from '@/lib/data'
import { Member, Event, Fine } from '@/lib/types'

export default function MalakesRoundup() {
  const [membersState, setMembersState] = useState<Member[]>(members)
  const [eventsState, setEventsState] = useState<Event[]>(events)
  const [finesState, setFinesState] = useState<Fine[]>(fines)
  const [activeSection, setActiveSection] = useState<string>('dashboard')

  const currentOrganiser = membersState.find(m => m.id === currentCycle.currentOrganiserId)
  const nextOrganiser = membersState.find(m => m.id === currentCycle.nextOrganiserId)

  const handleAddEvent = (event: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...event,
      id: String(eventsState.length + 1),
    }
    setEventsState([newEvent, ...eventsState])
  }

  const handleUpdateMember = (updatedMember: Member) => {
    setMembersState(membersState.map(m => m.id === updatedMember.id ? updatedMember : m))
  }

  const handlePayFine = (fineId: string) => {
    setFinesState(finesState.map(f => f.id === fineId ? { ...f, paid: true } : f))
  }

  const navItems = [
    { id: 'dashboard', label: 'Tribunal', icon: Scale },
    { id: 'members', label: 'Council', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'fines', label: 'Fines', icon: AlertTriangle },
    { id: 'leaderboard', label: 'Rankings', icon: Trophy },
    { id: 'history', label: 'Archives', icon: History },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-gold">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gold-gradient">The Malakes Roundup</h1>
                <p className="text-xs text-muted-foreground">Event Tribunal & Council</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Cycle {Math.floor(Date.now() / (14 * 24 * 60 * 60 * 1000)) % 100}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden sticky top-[73px] z-40 glass-card border-b border-border overflow-x-auto">
        <div className="flex gap-1 p-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeSection === item.id
                  ? 'bg-primary/20 text-primary glow-gold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop Navigation */}
      <nav className="hidden md:block border-b border-border glass-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 py-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeSection === item.id
                    ? 'bg-primary/20 text-primary glow-gold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24">
        {/* Dashboard View */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            {/* Current Organiser & Countdown Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {currentOrganiser && (
                <CurrentOrganiser member={currentOrganiser} cycleInfo={currentCycle} />
              )}
              <CountdownTimer endDate={currentCycle.cycleEndDate} />
            </div>

            {/* Next Organiser */}
            {nextOrganiser && (
              <NextOrganiser member={nextOrganiser} />
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-primary">{eventsState.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Events</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-secondary">{membersState.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Council Members</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-amber-400">${finesState.filter(f => !f.paid).reduce((sum, f) => sum + f.amount, 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Outstanding Fines</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-emerald-400">{membersState.filter(m => m.status === 'Compliant').length}</p>
                <p className="text-xs text-muted-foreground mt-1">Compliant Members</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold text-primary mb-4">Recent Tribunal Activity</h3>
              <div className="space-y-3">
                {finesState.slice(0, 3).map((fine) => (
                  <div key={fine.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{fine.memberName}</p>
                      <p className="text-xs text-muted-foreground">{fine.reason}</p>
                    </div>
                    <span className={`text-sm font-bold ${fine.paid ? 'text-emerald-400' : 'text-red-400'}`}>
                      ${fine.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Members View */}
        {activeSection === 'members' && (
          <MemberList 
            members={membersState} 
            onUpdateMember={handleUpdateMember} 
          />
        )}

        {/* Events View */}
        {activeSection === 'events' && currentOrganiser && (
          <EventSubmission 
            currentOrganiser={currentOrganiser}
            members={membersState}
            onSubmit={handleAddEvent}
          />
        )}

        {/* Fines View */}
        {activeSection === 'fines' && (
          <FineTracker 
            fines={finesState}
            onPayFine={handlePayFine}
          />
        )}

        {/* Leaderboard View */}
        {activeSection === 'leaderboard' && (
          <Leaderboard members={membersState} events={eventsState} />
        )}

        {/* History View */}
        {activeSection === 'history' && (
          <EventHistory events={eventsState} />
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 glass-card border-t border-border py-3 md:hidden">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs text-muted-foreground">
            {"⚖️ Justice is served fortnightly"}
          </p>
        </div>
      </footer>
    </div>
  )
}
