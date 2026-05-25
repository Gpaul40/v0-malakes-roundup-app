'use client'

import { useState, useEffect } from 'react'
import { Crown, Clock, ChevronRight, Plus, Trophy, AlertTriangle, Star, Calendar, DollarSign, MapPin, Check, Users, Settings, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { members as initialMembers, events, fines, getCurrentCycleInfo, getStatusColor, ROTATION_ORDER } from '@/lib/data'
import { Member, Event, Fine, DateOption, EventProposal } from '@/lib/types'

export default function MalakesRoundup() {
  const [showModal, setShowModal] = useState(true)
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [membersState] = useState<Member[]>(initialMembers)
  const [eventsState, setEventsState] = useState<Event[]>(events)
  const [finesState, setFinesState] = useState<Fine[]>(fines)
  const [showEventForm, setShowEventForm] = useState(false)
  const [showVoting, setShowVoting] = useState(false)
  
  // Admin override for current organiser
  const [overrideOrganiser, setOverrideOrganiser] = useState<string | null>(null)
  const isAdmin = loggedInUser === 'GABE'

  // Password map — Zeus is Gabe's secret
  const PASSWORDS: Record<string, string> = {
    GREG: 'Greg',
    ZAK: 'Zak',
    GABE: 'Zeus',
    KOZZY: 'Kozzy',
    SAMMY: 'Sammy',
    KION: 'Kion',
  }

  const handleLogin = () => {
    if (!selectedName) { setLoginError('Pick your name'); return }
    if (PASSWORDS[selectedName] === password) {
      setLoggedInUser(selectedName)
      setShowModal(false)
      setLoginError('')
    } else {
      setLoginError('Wrong password, try again')
    }
  }
  
  // Event form state
  const [eventTitle, setEventTitle] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [dateOptions, setDateOptions] = useState<{ date: string; time: string }[]>([
    { date: '', time: '' }
  ])
  
  // Current proposal for voting
  const [currentProposal, setCurrentProposal] = useState<EventProposal | null>(null)
  
  // Voting state
  const [selectedVoter, setSelectedVoter] = useState<string>('')
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  
  const cycleInfo = getCurrentCycleInfo()
  const cycleEndDateStr = cycleInfo.cycleEndDate.toISOString()
  
  // Use override or calculated organiser
  const currentOrganiser = overrideOrganiser || ROTATION_ORDER[cycleInfo.currentOrganiserIndex]
  const nextOrganiserIndex = (ROTATION_ORDER.indexOf(currentOrganiser) + 1) % ROTATION_ORDER.length
  const nextOrganiser = ROTATION_ORDER[nextOrganiserIndex]
  
  const currentMember = membersState.find(m => m.name === currentOrganiser)
  
  // Countdown timer
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const endDate = new Date(cycleEndDateStr)
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
  }, [cycleEndDateStr])
  
  const addDateOption = () => {
    if (dateOptions.length < 5) {
      setDateOptions([...dateOptions, { date: '', time: '' }])
    }
  }
  
  const removeDateOption = (index: number) => {
    if (dateOptions.length > 1) {
      setDateOptions(dateOptions.filter((_, i) => i !== index))
    }
  }
  
  const updateDateOption = (index: number, field: 'date' | 'time', value: string) => {
    const updated = [...dateOptions]
    updated[index][field] = value
    setDateOptions(updated)
  }
  
  const handleSubmitEvent = () => {
    if (!eventTitle.trim() || !eventLocation.trim()) return
    
    const validDateOptions = dateOptions.filter(d => d.date && d.time)
    if (validDateOptions.length === 0) return
    
    const proposal: EventProposal = {
      id: String(Date.now()),
      organiserId: currentMember?.id || '1',
      organiserName: currentOrganiser,
      title: eventTitle,
      location: eventLocation,
      dateOptions: validDateOptions.map((d, i) => ({
        id: String(i + 1),
        date: d.date,
        time: d.time,
        availableMembers: [],
      })),
      status: 'voting',
    }
    
    setCurrentProposal(proposal)
    setShowEventForm(false)
    setShowVoting(true)
    setEventTitle('')
    setEventLocation('')
    setDateOptions([{ date: '', time: '' }])
  }
  
  const toggleDateSelection = (dateId: string) => {
    setSelectedDates(prev => 
      prev.includes(dateId) 
        ? prev.filter(id => id !== dateId)
        : [...prev, dateId]
    )
  }
  
  const handleSubmitAvailability = () => {
    if (!selectedVoter || selectedDates.length === 0 || !currentProposal) return
    
    const updatedProposal = {
      ...currentProposal,
      dateOptions: currentProposal.dateOptions.map(opt => ({
        ...opt,
        availableMembers: selectedDates.includes(opt.id) && !opt.availableMembers.includes(selectedVoter)
          ? [...opt.availableMembers, selectedVoter]
          : opt.availableMembers,
      })),
    }
    
    setCurrentProposal(updatedProposal)
    setSelectedVoter('')
    setSelectedDates([])
  }
  
  const getMajorityDate = () => {
    if (!currentProposal) return null
    const sorted = [...currentProposal.dateOptions].sort(
      (a, b) => b.availableMembers.length - a.availableMembers.length
    )
    if (sorted[0]?.availableMembers.length > 0) {
      return sorted[0].id
    }
    return null
  }
  
  const handleConfirmEvent = () => {
    if (!currentProposal) return
    
    const majorityDateId = getMajorityDate()
    const majorityDate = currentProposal.dateOptions.find(d => d.id === majorityDateId)
    
    if (majorityDate) {
      const newEvent: Event = {
        id: String(eventsState.length + 1),
        organiserId: currentProposal.organiserId,
        organiserName: currentProposal.organiserName,
        title: currentProposal.title,
        date: majorityDate.date,
        description: `Location: ${currentProposal.location}`,
        attendees: majorityDate.availableMembers,
        rating: 0,
      }
      setEventsState([newEvent, ...eventsState])
    }
    
    setCurrentProposal(null)
    setShowVoting(false)
  }
  
  const handlePayFine = (fineId: string) => {
    setFinesState(finesState.map(f => f.id === fineId ? { ...f, paid: true } : f))
  }
  
  // Leaderboard sorted by events organised
  const leaderboard = [...membersState].sort((a, b) => b.eventsOrganised - a.eventsOrganised)
  const outstandingFines = finesState.filter(f => !f.paid)
  const totalOutstanding = outstandingFines.reduce((sum, f) => sum + f.amount, 0)
  const majorityDateId = getMajorityDate()

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

          <div className="space-y-3 text-left">
            <Select value={selectedName} onValueChange={setSelectedName}>
              <SelectTrigger className="bg-muted/30 border-border">
                <SelectValue placeholder="Who are you?" />
              </SelectTrigger>
              <SelectContent>
                {['Gabe', 'Zak', 'Greg', 'Kion', 'Kozzy', 'Sammy'].map((name) => (
                  <SelectItem key={name} value={name.toUpperCase()}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="bg-muted/30 border-border"
            />
            <p className="text-xs text-muted-foreground/60">Password is your name</p>
            {loginError && <p className="text-red-400 text-xs">{loginError}</p>}
          </div>
          
          <div className="pt-2">
            <Button 
              onClick={handleLogin}
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
        {/* Admin Override - only visible to Zeus */}
        {isAdmin && (
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-secondary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Admin Control</span>
            </div>
            <Select 
              value={overrideOrganiser || ''} 
              onValueChange={(value) => setOverrideOrganiser(value || null)}
            >
              <SelectTrigger className="bg-muted/30 border-border">
                <SelectValue placeholder="Change Current Organiser" />
              </SelectTrigger>
              <SelectContent>
                {ROTATION_ORDER.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {overrideOrganiser && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setOverrideOrganiser(null)}
                className="mt-2 text-xs text-muted-foreground"
              >
                Reset to automatic rotation
              </Button>
            )}
          </div>
        )}

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

        {/* Event Submission / Voting Section */}
        {showVoting && currentProposal ? (
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Availability Voting</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setShowVoting(false); setCurrentProposal(null) }}
                className="text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Event Details */}
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
              <h3 className="font-semibold text-primary">{currentProposal.title}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" /> {currentProposal.location}
              </p>
            </div>
            
            {/* Date Options with Results */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Proposed Dates</p>
              {currentProposal.dateOptions.map((opt) => {
                const isMajority = opt.id === majorityDateId && opt.availableMembers.length > 0
                return (
                  <div 
                    key={opt.id} 
                    className={`p-3 rounded-lg border ${
                      isMajority 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {new Date(opt.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-xs text-muted-foreground">{opt.time}</span>
                      </div>
                      {isMajority && (
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                          Majority Date
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {opt.availableMembers.length} available
                      </span>
                      {opt.availableMembers.length > 0 && (
                        <span className="text-xs text-secondary">
                          ({opt.availableMembers.join(', ')})
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Vote Section */}
            <div className="p-4 bg-muted/20 rounded-lg space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Submit Your Availability</p>
              
              <Select value={selectedVoter} onValueChange={setSelectedVoter}>
                <SelectTrigger className="bg-muted/30 border-border">
                  <SelectValue placeholder="Select your name" />
                </SelectTrigger>
                <SelectContent>
                  {ROTATION_ORDER.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="space-y-2">
                {currentProposal.dateOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleDateSelection(opt.id)}
                    className={`w-full p-3 rounded-lg border flex items-center justify-between transition-all ${
                      selectedDates.includes(opt.id)
                        ? 'bg-primary/20 border-primary/50'
                        : 'bg-muted/30 border-border hover:border-primary/30'
                    }`}
                  >
                    <span className="text-sm">
                      {new Date(opt.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} - {opt.time}
                    </span>
                    {selectedDates.includes(opt.id) && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
              
              <Button 
                onClick={handleSubmitAvailability}
                disabled={!selectedVoter || selectedDates.length === 0}
                className="w-full bg-secondary hover:bg-secondary/90"
              >
                Submit Availability
              </Button>
            </div>
            
            {/* Confirm Event Button */}
            {majorityDateId && (
              <Button 
                onClick={handleConfirmEvent}
                className="w-full bg-primary hover:bg-primary/90 glow-gold"
              >
                Confirm Event with Majority Date
              </Button>
            )}
          </div>
        ) : (
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
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Location..."
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="bg-muted/30 border-border flex-1"
                  />
                </div>
                
                {/* Date Options */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Proposed Dates & Times</p>
                  {dateOptions.map((opt, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={opt.date}
                        onChange={(e) => updateDateOption(index, 'date', e.target.value)}
                        className="bg-muted/30 border-border flex-1"
                      />
                      <Input
                        type="time"
                        value={opt.time}
                        onChange={(e) => updateDateOption(index, 'time', e.target.value)}
                        className="bg-muted/30 border-border w-24"
                      />
                      {dateOptions.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeDateOption(index)}
                          className="text-muted-foreground hover:text-red-400 px-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {dateOptions.length < 5 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={addDateOption}
                      className="text-secondary"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Another Date
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={handleSubmitEvent}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    Create & Start Voting
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => { setShowEventForm(false); setDateOptions([{ date: '', time: '' }]) }}
                    className="border-border"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {currentOrganiser}, submit your event proposal with date options.
              </p>
            )}
          </div>
        )}

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
                  by {event.organiserName} - {new Date(event.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
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
