'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Crown, ChevronRight, Plus, Trophy, AlertTriangle, Star, CalendarDays, DollarSign, MapPin, Check, Settings, X, LogOut } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { members as initialMembers, getCurrentCycleInfo, getStatusColor, ROTATION_ORDER } from '@/lib/data'
import { Member, Event, Fine, EventProposal } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { logoutAction } from '@/app/actions/auth'
import confetti from 'canvas-confetti'
import {
  submitEventProposalAction,
  toggleAvailabilityAction,
  confirmEventAction,
  payFineAction,
  deleteEventAction,
  uploadAvatarAction,
} from '@/app/actions/db'

interface MainAppProps {
  currentUser: string
}

export function MainApp({ currentUser }: MainAppProps) {
  const [membersState] = useState<Member[]>(initialMembers)
  const [eventsState, setEventsState] = useState<Event[]>([])
  const [finesState, setFinesState] = useState<Fine[]>([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [showVoting, setShowVoting] = useState(false)
  const [showEventComplete, setShowEventComplete] = useState(false)
  const [confirmedEvent, setConfirmedEvent] = useState<{ title: string; location: string; date: string; time: string; attendees: string[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [avatars, setAvatars] = useState<Record<string, string>>({})
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Admin override for current organiser
  const [overrideOrganiser, setOverrideOrganiser] = useState<string | null>(null)
  const isAdmin = currentUser === 'GABE'
  const [rippleCell, setRippleCell] = useState<string | null>(null)

  // Confetti burst when celebration modal opens
  useEffect(() => {
    if (!showEventComplete) return
    const burst = () => confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 }, colors: ['#d4af37', '#fff', '#ff4444', '#22c55e'] })
    burst()
    const t = setTimeout(burst, 400)
    return () => clearTimeout(t)
  }, [showEventComplete])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadAvatarAction(fd)
    if ('error' in result) {
      console.error('Avatar upload failed:', result.error)
      alert('Upload failed: ' + result.error)
    } else {
      setAvatars(prev => ({ ...prev, [currentUser]: result.url }))
    }
    setUploadingAvatar(false)
    // reset input so same file can be re-selected
    e.target.value = ''
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    const [eventsRes, finesRes, proposalsRes, profilesRes] = await Promise.all([
      supabase.from('events').select('*').order('created_at', { ascending: false }),
      supabase.from('fines').select('*').order('created_at', { ascending: false }),
      // Fetch proposals + date_options separately from votes to avoid needing an FK constraint
      supabase.from('proposals').select('*, date_options(*)').eq('status', 'voting').order('created_at', { ascending: false }).limit(1),
      supabase.from('member_profiles').select('name, avatar_url'),
    ])

    if (eventsRes.error) console.error('events error:', eventsRes.error)
    if (finesRes.error) console.error('fines error:', finesRes.error)

    if (eventsRes.data) {
      setEventsState(eventsRes.data.map((e: any) => ({
        id: e.id, organiserId: e.organiser_id, organiserName: e.organiser_name,
        title: e.title, date: e.date, description: e.description,
        attendees: e.attendees || [], rating: e.rating || 0,
      })))
    }
    if (finesRes.data) {
      setFinesState(finesRes.data.map((f: any) => ({
        id: f.id, memberId: f.member_id, memberName: f.member_name,
        amount: f.amount, reason: f.reason, date: f.date, paid: f.paid,
      })))
    }
    if (proposalsRes.error) {
      console.error('proposals error:', proposalsRes.error)
      // Don't clear voting state on error
    } else if (proposalsRes.data && proposalsRes.data.length > 0) {
      const p = proposalsRes.data[0] as any
      const dateOptionIds: string[] = (p.date_options || []).map((d: any) => d.id)

      // Fetch votes separately — avoids relying on an FK between votes and date_options
      let votesMap: Record<string, string[]> = {}
      if (dateOptionIds.length > 0) {
        const votesRes = await supabase
          .from('votes')
          .select('date_option_id, member_name')
          .in('date_option_id', dateOptionIds)
        if (!votesRes.error && votesRes.data) {
          for (const v of votesRes.data as any[]) {
            if (!votesMap[v.date_option_id]) votesMap[v.date_option_id] = []
            votesMap[v.date_option_id].push(v.member_name)
          }
        }
      }

      setCurrentProposal({
        id: p.id, organiserId: p.organiser_id, organiserName: p.organiser_name,
        title: p.title, location: p.location, status: p.status,
        dateOptions: (p.date_options || []).map((d: any) => ({
          id: d.id, date: d.date, time: d.time,
          availableMembers: votesMap[d.id] || [],
        })),
      })
      setShowVoting(true)
    } else {
      setShowVoting(false)
      setCurrentProposal(null)
    }
    if (profilesRes.data) {
      const map: Record<string, string> = {}
      for (const p of profilesRes.data as any[]) if (p.avatar_url) map[p.name] = p.avatar_url
      setAvatars(map)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    // Poll every 30 seconds so all users see live updates
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  // Event form state
  const [eventTitle, setEventTitle] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [calendarDates, setCalendarDates] = useState<Date[]>([])
  const [dateTimes, setDateTimes] = useState<Record<string, string>>({})

  // Current proposal for voting
  const [currentProposal, setCurrentProposal] = useState<EventProposal | null>(null)

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

  const toYMD = (d: Date) => d.toISOString().split('T')[0]

  const handleSubmitEvent = async () => {
    if (!eventTitle.trim() || !eventLocation.trim()) return
    const validDates = calendarDates.filter(d => dateTimes[toYMD(d)])
    if (validDates.length === 0) return

    const proposalId = String(Date.now())
    const dateRows = validDates.map((d, i) => ({
      id: `${proposalId}-${i}`,
      proposal_id: proposalId,
      date: toYMD(d),
      time: dateTimes[toYMD(d)],
    }))

    await submitEventProposalAction({
      proposalId,
      organiserId: currentMember?.id || '1',
      organiserName: currentOrganiser,
      title: eventTitle,
      location: eventLocation,
      dateRows,
    })

    setCurrentProposal({
      id: proposalId,
      organiserId: currentMember?.id || '1',
      organiserName: currentOrganiser,
      title: eventTitle,
      location: eventLocation,
      status: 'voting',
      dateOptions: dateRows.map(d => ({ id: d.id, date: d.date, time: d.time, availableMembers: [] })),
    })
    setEventTitle('')
    setEventLocation('')
    setCalendarDates([])
    setDateTimes({})
    setShowEventForm(false)
    setShowVoting(true)
    // Immediately sync from DB to confirm the proposal was persisted
    await loadData()
  }

  const handleToggleAvailability = async (dateOptionId: string, currentlyAvailable: boolean) => {
    if (!currentUser || !currentProposal) return

    await toggleAvailabilityAction({
      proposalId: currentProposal.id,
      dateOptionId,
      memberName: currentUser,
      currentlyAvailable,
    })

    // Optimistic update
    setCurrentProposal(prev => {
      if (!prev) return prev
      return {
        ...prev,
        dateOptions: prev.dateOptions.map(opt => {
          if (opt.id !== dateOptionId) return opt
          return {
            ...opt,
            availableMembers: currentlyAvailable
              ? opt.availableMembers.filter(m => m !== currentUser)
              : [...opt.availableMembers, currentUser],
          }
        }),
      }
    })
    loadData()
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

  const handleConfirmEvent = async () => {
    if (!currentProposal) return
    const majorityDateId = getMajorityDate()
    const majorityDate = currentProposal.dateOptions.find(d => d.id === majorityDateId)
    if (majorityDate) {
      await confirmEventAction({
        proposalId: currentProposal.id,
        organiserId: currentProposal.organiserId,
        organiserName: currentProposal.organiserName,
        title: currentProposal.title,
        location: currentProposal.location,
        date: majorityDate.date,
        attendees: majorityDate.availableMembers,
      })
      setConfirmedEvent({
        title: currentProposal.title,
        location: currentProposal.location,
        date: majorityDate.date,
        time: majorityDate.time,
        attendees: majorityDate.availableMembers,
      })
    }
    setCurrentProposal(null)
    setShowVoting(false)
    setShowEventComplete(true)
    await loadData()
  }

  const handlePayFine = async (fineId: string) => {
    await payFineAction(fineId)
    setFinesState(finesState.map(f => f.id === fineId ? { ...f, paid: true } : f))
  }

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEventAction(eventId)
    setEventsState(prev => prev.filter(e => e.id !== eventId))
  }

  // Leaderboard sorted by events organised
  const leaderboard = [...membersState].sort((a, b) => b.eventsOrganised - a.eventsOrganised)
  const outstandingFines = finesState.filter(f => !f.paid)
  const totalOutstanding = outstandingFines.reduce((sum, f) => sum + f.amount, 0)
  const majorityDateId = getMajorityDate()

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-gold">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gold-gradient">The Malakes Roundup</h1>
                <p className="text-xs text-muted-foreground">Cycle {cycleInfo.cycleNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{currentUser}</span>
              <form action={logoutAction}>
                <Button variant="ghost" size="sm" type="submit" title="Log out" className="text-muted-foreground hover:text-foreground">
                  <LogOut className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {/* Admin Override - only visible to GABE */}
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
        <div className="glass-card rounded-xl p-5 glow-gold animate-breathe">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Current Organiser</span>
            {currentMember && (
              <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(currentMember.status)}`}>
                {currentMember.status}
              </span>
            )}
          </div>
          <div className="flex flex-col items-center gap-3">
            {/* Avatar — clickable to upload if it's your own */}
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <button
              onClick={() => currentUser === currentOrganiser && avatarInputRef.current?.click()}
              className={`relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary/50 bg-primary/20 flex items-center justify-center ${currentUser === currentOrganiser ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
              title={currentUser === currentOrganiser ? 'Tap to change photo' : undefined}
            >
              {avatars[currentOrganiser]
                ? <img src={avatars[currentOrganiser]} alt={currentOrganiser} className="w-full h-full object-cover" />
                : <span className="text-2xl font-bold text-primary">{currentOrganiser[0]}</span>
              }
              {currentUser === currentOrganiser && (
                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center py-0.5">
                  {uploadingAvatar ? '...' : '📷'}
                </span>
              )}
            </button>
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gold-gradient">{currentOrganiser}</h2>
              <p className="text-sm text-muted-foreground">
                {currentMember?.eventsOrganised || 0} events organised
              </p>
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className={`glass-card rounded-xl p-5 border transition-all ${timeLeft.days <= 2 ? 'animate-heartbeat bg-red-500/5' : 'border-transparent'}`}>
          {/* Big bomb at top center */}
          <div className="flex flex-col items-center mb-3">
            <span className="relative inline-flex items-center justify-center">
              <span className={`text-6xl leading-none select-none ${timeLeft.days <= 2 ? 'animate-bomb-shake' : ''}`}>💣</span>
              {/* Pulsing fuse spark */}
              <span className="absolute -top-1 right-3 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2 leading-none">Lifeline</p>
            <p className={`text-base font-extrabold uppercase tracking-widest leading-tight ${timeLeft.days <= 2 ? 'text-red-400' : 'text-foreground'}`}>— Time Remaining —</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: timeLeft.days, label: 'Days' },
              { value: timeLeft.hours, label: 'Hrs' },
              { value: timeLeft.minutes, label: 'Min' },
              { value: timeLeft.seconds, label: 'Sec' },
            ].map((item) => (
              <div key={item.label} className={`rounded-lg p-3 text-center overflow-hidden ${timeLeft.days <= 2 ? 'bg-red-500/15' : 'bg-muted/30'}`}>
                <p key={item.value} className={`text-2xl font-bold animate-flip-digit ${timeLeft.days <= 2 ? 'text-red-400' : 'text-secondary'}`}>{String(item.value).padStart(2, '0')}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
          {!showVoting && (() => {
            if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) return null
            if (timeLeft.days <= 1) return (
              <p className="text-xs text-red-400 font-bold mt-3 text-center animate-pulse">
                🚨 FINAL WARNING. {currentOrganiser}, you have hours left. Failure means tribunal. No excuses.
              </p>
            )
            if (timeLeft.days <= 3) return (
              <p className="text-xs text-red-400 mt-3 text-center">
                ⚠️ The council grows impatient. {currentOrganiser} has {timeLeft.days} days before consequences are enforced.
              </p>
            )
            if (timeLeft.days <= 5) return (
              <p className="text-xs text-amber-400 mt-3 text-center">
                👁️ The tribunal is watching, {currentOrganiser}. Don&apos;t make them act.
              </p>
            )
            if (timeLeft.days <= 7) return (
              <p className="text-xs text-amber-400/70 mt-3 text-center">
                🕰️ Time is ticking, {currentOrganiser}. Sort the event or face the fine.
              </p>
            )
            return (
              <p className="text-xs text-muted-foreground/60 mt-3 text-center">
                {currentOrganiser} has {timeLeft.days} days to organise. Don&apos;t squander it.
              </p>
            )
          })()}
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

        {/* Event Confirmed Celebration Modal */}
        {showEventComplete && confirmedEvent && (() => {
          const eventDateTime = new Date(`${confirmedEvent.date}T${confirmedEvent.time}`)
          const now = new Date()
          const diff = Math.max(0, eventDateTime.getTime() - now.getTime())
          const days = Math.floor(diff / (1000 * 60 * 60 * 24))
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
              <div className="glass-card rounded-2xl p-6 w-full max-w-sm border border-primary/50 shadow-2xl space-y-5 text-center">
                <div className="text-5xl">🎉</div>
                <div>
                  <h2 className="text-2xl font-bold text-gold-gradient mb-1">It&apos;s ON!</h2>
                  <p className="text-lg font-semibold">{confirmedEvent.title}</p>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {confirmedEvent.location}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Event Date</p>
                  <p className="font-bold text-primary">
                    {eventDateTime.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-sm text-muted-foreground">{confirmedEvent.time}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Countdown</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ value: days, label: 'Days' }, { value: hours, label: 'Hrs' }, { value: minutes, label: 'Min' }].map(item => (
                      <div key={item.label} className="bg-muted/30 rounded-lg p-3">
                        <p className="text-2xl font-bold text-secondary">{String(item.value).padStart(2, '0')}</p>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {confirmedEvent.attendees.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Attending: <span className="text-foreground font-medium">{confirmedEvent.attendees.join(', ')}</span>
                  </p>
                )}

                <Button
                  onClick={() => setShowEventComplete(false)}
                  className="w-full bg-primary hover:bg-primary/90 glow-gold text-lg font-bold py-6"
                >
                  WOOOHOOO! 🎊
                </Button>
              </div>
            </div>
          )
        })()}

        {/* Event Submission / Voting Section */}
        {showVoting && currentProposal ? (
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Availability Grid</span>
              </div>
              {(currentUser === currentProposal.organiserName || isAdmin) && (
                <Button
                  size="sm"
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs shrink-0"
                  onClick={() => {
                    setEventTitle(currentProposal.title)
                    setEventLocation(currentProposal.location)
                    const dates = currentProposal.dateOptions.map(d => new Date(d.date + 'T00:00:00'))
                    setCalendarDates(dates)
                    const times: Record<string, string> = {}
                    for (const d of currentProposal.dateOptions) times[d.date] = d.time
                    setDateTimes(times)
                    setShowVoting(false)
                    setShowEventForm(true)
                  }}
                >
                  Change Event
                </Button>
              )}
            </div>

            {/* Event Details */}
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
              <h3 className="font-semibold text-primary">{currentProposal.title}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" /> {currentProposal.location}
              </p>
            </div>

            {/* Spreadsheet Grid */}
            <div className="overflow-x-auto">
              <p className="text-xs text-muted-foreground mb-2">Tap your name to mark availability ✓</p>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="text-left p-2 text-muted-foreground font-normal border-b border-border">Date</th>
                    {ROTATION_ORDER.map(name => (
                      <th key={name} className={`p-2 text-center font-semibold border-b border-border ${name === currentUser ? 'text-primary' : 'text-muted-foreground'}`}>
                        {name[0] + name.slice(1).toLowerCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...currentProposal.dateOptions].sort((a, b) => a.date.localeCompare(b.date)).map((opt, i) => {
                    const isMajority = opt.id === majorityDateId && opt.availableMembers.length > 0
                    return (
                      <tr key={opt.id} className={`border-b border-border/50 ${isMajority ? 'bg-emerald-500/10' : i % 2 === 0 ? 'bg-muted/10' : ''}`}>
                        <td className="p-2 whitespace-nowrap">
                          <span className="font-medium">{new Date(opt.date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                          <span className="text-muted-foreground ml-1">{opt.time}</span>
                          {isMajority && <span className="ml-1 text-emerald-400">★</span>}
                        </td>
                        {ROTATION_ORDER.map(name => {
                          const isAvailable = opt.availableMembers.includes(name)
                          const isMe = name === currentUser
                          return (
                            <td key={name} className="p-1 text-center">
                              <button
                                onClick={() => {
                                  if (!isMe) return
                                  const key = `${opt.id}-${name}`
                                  setRippleCell(key)
                                  setTimeout(() => setRippleCell(null), 400)
                                  handleToggleAvailability(opt.id, isAvailable)
                                }}
                                className={`relative overflow-hidden w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all text-xs font-bold
                                  ${isAvailable
                                    ? isMe ? 'bg-primary text-primary-foreground shadow-md' : 'bg-emerald-500/25 text-emerald-400'
                                    : isMe ? 'bg-muted/40 border border-dashed border-border hover:border-primary text-muted-foreground/40' : 'bg-muted/10 text-muted-foreground/20'
                                  } ${isMe ? 'cursor-pointer' : 'cursor-default'}`}
                                title={isMe ? (isAvailable ? 'Click to remove' : 'Click to mark available') : name}
                              >
                                {isAvailable ? <Check className="w-3.5 h-3.5" /> : isMe ? '+' : ''}
                                {rippleCell === `${opt.id}-${name}` && (
                                  <span className="absolute inset-0 rounded-lg" style={{ animation: 'cell-ripple 0.4s ease-out both', background: 'rgba(255,255,255,0.35)', borderRadius: '50%', transform: 'scale(0)' }} />
                                )}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Majority summary */}
            {majorityDateId && (() => {
              const best = currentProposal.dateOptions.find(d => d.id === majorityDateId)!
              return (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm">
                  <span className="text-emerald-400 font-semibold">★ Best date: </span>
                  {new Date(best.date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })} at {best.time}
                  <span className="text-muted-foreground ml-1">({best.availableMembers.length} available)</span>
                </div>
              )
            })()}

            {/* Confirm Event Button - organiser + admin only */}
            {majorityDateId && (currentUser === currentOrganiser || isAdmin) && (
              <Button
                onClick={handleConfirmEvent}
                className="w-full bg-primary hover:bg-primary/90 glow-gold"
              >
                Confirm Event with Best Date
              </Button>
            )}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Submit Event</span>
              </div>
              {!showEventForm && (currentUser === currentOrganiser || isAdmin) && (
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

            {!showEventForm && currentUser !== currentOrganiser && !isAdmin && (
              <p className="text-xs text-muted-foreground">Only {currentOrganiser} can submit an event this week.</p>
            )}

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

                {/* Date Options - Calendar */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Proposed Dates — {cycleInfo.cycleStartDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} to {cycleInfo.cycleEndDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <div className="flex justify-center bg-muted/20 rounded-lg p-2">
                    <Calendar
                      mode="multiple"
                      selected={calendarDates}
                      onSelect={(dates) => {
                        const next = dates || []
                        if (next.length <= 5) setCalendarDates(next)
                      }}
                      disabled={(date) => date < cycleInfo.cycleStartDate || date > cycleInfo.cycleEndDate}
                      defaultMonth={cycleInfo.cycleStartDate}
                    />
                  </div>
                  {calendarDates.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <p className="text-xs text-muted-foreground">Add a time for each selected date:</p>
                      {[...calendarDates].sort((a, b) => a.getTime() - b.getTime()).map((d) => {
                        const key = toYMD(d)
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-sm flex-1">{d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            <Input
                              type="time"
                              value={dateTimes[key] || ''}
                              onChange={(e) => setDateTimes(prev => ({ ...prev, [key]: e.target.value }))}
                              className="bg-muted/30 border-border w-28"
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {calendarDates.length === 0 && (
                    <p className="text-xs text-muted-foreground/60 text-center">Tap dates on the calendar (up to 5)</p>
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
                    onClick={() => { setShowEventForm(false); setCalendarDates([]); setDateTimes({}) }}
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

        {/* Roulette Rule Card */}
        <div className="glass-card rounded-xl overflow-hidden">
          {/* Roulette table image */}
          <div className="relative h-36 w-full overflow-hidden">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Roulette-wheel-and-table.jpg/1200px-Roulette-wheel-and-table.jpg"
              alt="Roulette table"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute bottom-3 left-4 flex items-center gap-2">
              <span className="text-2xl">🎰</span>
              <span className="text-base font-bold text-white tracking-wide uppercase">The Fine Fund</span>
            </div>
          </div>
          {/* Rule breakdown */}
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-amber-400 font-bold text-lg leading-none mt-0.5">$200</span>
              <p className="text-sm text-muted-foreground leading-snug">Fine issued to the organiser for every failed or cancelled event.</p>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-lg leading-none mt-0.5">🎡</span>
              <p className="text-sm text-muted-foreground leading-snug">The full $200 goes on <span className="text-white font-medium">Roulette at the Casino</span>. One spin. No exceptions.</p>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex items-start gap-3">
              <span className="text-emerald-400 text-lg leading-none mt-0.5">💸</span>
              <p className="text-sm text-muted-foreground leading-snug">Winnings are split <span className="text-white font-medium">equally among all members</span> — excluding the organiser who failed.</p>
            </div>
          </div>
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
                  {member.eventsOrganised} events held
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
            {eventsState.slice(0, 5).map((event) => (
              <div key={event.id} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-medium text-sm">{event.title}</h4>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {event.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-primary fill-primary" />
                        <span className="text-xs text-primary">{event.rating}</span>
                      </div>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-muted-foreground/40 hover:text-red-400 transition-colors"
                        title="Delete event"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  by {event.organiserName} - {new Date(event.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </p>
                <p className="text-xs text-muted-foreground/80 line-clamp-2">
                  {event.description}
                </p>
              </div>
            ))}
            {eventsState.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground text-center py-2">No events yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
