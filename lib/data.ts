import { Member, Event, Fine, CycleInfo, MemberStatus } from './types'

// Rotation order - fixed sequence starting with GREG from 25/05/2025
export const ROTATION_ORDER = ['GREG', 'ZAK', 'GABE', 'KOZZY', 'SAMMY', 'KION']

// Rotation start date: 25/05/2025
const ROTATION_START = new Date('2025-05-25T00:00:00')
const CYCLE_DAYS = 14

// Calculate which cycle we're in and who's the organiser
export function getCurrentCycleInfo(): { 
  currentOrganiserIndex: number
  cycleNumber: number
  cycleStartDate: Date
  cycleEndDate: Date
  daysRemaining: number
} {
  const now = new Date()
  const msPerDay = 24 * 60 * 60 * 1000
  const daysSinceStart = Math.floor((now.getTime() - ROTATION_START.getTime()) / msPerDay)
  
  // If before start date, show first organiser
  if (daysSinceStart < 0) {
    return {
      currentOrganiserIndex: 0,
      cycleNumber: 1,
      cycleStartDate: ROTATION_START,
      cycleEndDate: new Date(ROTATION_START.getTime() + (CYCLE_DAYS - 1) * msPerDay),
      daysRemaining: CYCLE_DAYS + daysSinceStart,
    }
  }
  
  const cycleNumber = Math.floor(daysSinceStart / CYCLE_DAYS) + 1
  const currentOrganiserIndex = (cycleNumber - 1) % ROTATION_ORDER.length
  const cycleStartDate = new Date(ROTATION_START.getTime() + (cycleNumber - 1) * CYCLE_DAYS * msPerDay)
  const cycleEndDate = new Date(cycleStartDate.getTime() + (CYCLE_DAYS - 1) * msPerDay)
  const daysIntoCycle = daysSinceStart % CYCLE_DAYS
  const daysRemaining = CYCLE_DAYS - daysIntoCycle
  
  return {
    currentOrganiserIndex,
    cycleNumber,
    cycleStartDate,
    cycleEndDate,
    daysRemaining,
  }
}

export function getCurrentOrganiser(): string {
  const { currentOrganiserIndex } = getCurrentCycleInfo()
  return ROTATION_ORDER[currentOrganiserIndex]
}

export function getNextOrganiser(): string {
  const { currentOrganiserIndex } = getCurrentCycleInfo()
  const nextIndex = (currentOrganiserIndex + 1) % ROTATION_ORDER.length
  return ROTATION_ORDER[nextIndex]
}

export const members: Member[] = [
  {
    id: '1',
    name: 'GREG',
    avatar: 'G',
    status: 'Compliant',
    eventsOrganised: 8,
    fines: 0,
    totalFineAmount: 0,
  },
  {
    id: '2',
    name: 'ZAK',
    avatar: 'Z',
    status: 'Dog Act',
    eventsOrganised: 4,
    fines: 3,
    totalFineAmount: 75,
  },
  {
    id: '3',
    name: 'GABE',
    avatar: 'G',
    status: 'Under Investigation',
    eventsOrganised: 6,
    fines: 1,
    totalFineAmount: 25,
  },
  {
    id: '4',
    name: 'KOZZY',
    avatar: 'K',
    status: 'Compliant',
    eventsOrganised: 9,
    fines: 0,
    totalFineAmount: 0,
  },
  {
    id: '5',
    name: 'SAMMY',
    avatar: 'S',
    status: 'Compliant',
    eventsOrganised: 7,
    fines: 1,
    totalFineAmount: 25,
  },
  {
    id: '6',
    name: 'KION',
    avatar: 'K',
    status: 'Under Investigation',
    eventsOrganised: 5,
    fines: 2,
    totalFineAmount: 50,
  },
]

export const events: Event[] = [
  {
    id: '1',
    organiserId: '4',
    organiserName: 'KOZZY',
    title: 'Souvlaki Night at The Greek Club',
    date: '2025-05-11',
    description: 'Epic feast with live bouzouki music. The lamb was immaculate.',
    attendees: ['GREG', 'ZAK', 'GABE', 'SAMMY', 'KION'],
    rating: 5,
  },
  {
    id: '2',
    organiserId: '1',
    organiserName: 'GREG',
    title: 'Poker Night - High Stakes',
    date: '2025-04-27',
    description: 'Texas Hold\'em at Greg\'s. Kozzy lost his dignity.',
    attendees: ['ZAK', 'GABE', 'KOZZY', 'SAMMY', 'KION'],
    rating: 4,
  },
  {
    id: '3',
    organiserId: '3',
    organiserName: 'GABE',
    title: 'Beach BBQ Bonanza',
    date: '2025-04-13',
    description: 'Easter beach party. The gyros were questionable.',
    attendees: ['GREG', 'ZAK', 'KOZZY', 'SAMMY'],
    rating: 3,
  },
  {
    id: '4',
    organiserId: '5',
    organiserName: 'SAMMY',
    title: 'Go-Kart Championship',
    date: '2025-03-30',
    description: 'Racing for glory. Zak crashed into the barrier 4 times.',
    attendees: ['GREG', 'ZAK', 'GABE', 'KOZZY', 'KION'],
    rating: 5,
  },
  {
    id: '5',
    organiserId: '6',
    organiserName: 'KION',
    title: 'Escape Room Challenge',
    date: '2025-03-16',
    description: 'We escaped with 2 minutes left. Greg got locked in the bathroom.',
    attendees: ['GREG', 'ZAK', 'GABE', 'KOZZY'],
    rating: 4,
  },
  {
    id: '6',
    organiserId: '2',
    organiserName: 'ZAK',
    title: 'Movie Marathon',
    date: '2025-03-02',
    description: 'Watched all Godfather films. Zak fell asleep during the first one.',
    attendees: ['GREG', 'GABE', 'KOZZY', 'SAMMY', 'KION'],
    rating: 2,
  },
]

export const fines: Fine[] = [
  {
    id: '1',
    memberId: '2',
    memberName: 'ZAK',
    amount: 25,
    reason: 'Failed to organise event - Dog Act Citation #1',
    date: '2025-02-15',
    paid: true,
  },
  {
    id: '2',
    memberId: '2',
    memberName: 'ZAK',
    amount: 25,
    reason: 'Late event submission - Contempt of Council',
    date: '2025-01-01',
    paid: true,
  },
  {
    id: '3',
    memberId: '2',
    memberName: 'ZAK',
    amount: 25,
    reason: 'Organised a "movie night" with no snacks - Gross Negligence',
    date: '2025-03-02',
    paid: false,
  },
  {
    id: '4',
    memberId: '3',
    memberName: 'GABE',
    amount: 25,
    reason: 'Questionable gyros at Beach BBQ - Food Crimes',
    date: '2025-04-14',
    paid: false,
  },
  {
    id: '5',
    memberId: '5',
    memberName: 'SAMMY',
    amount: 25,
    reason: 'Booked go-karts at 8am on a Sunday - Cruel & Unusual',
    date: '2025-03-31',
    paid: true,
  },
  {
    id: '6',
    memberId: '6',
    memberName: 'KION',
    amount: 25,
    reason: 'Escape room was too hard - Mental Anguish',
    date: '2025-03-17',
    paid: false,
  },
  {
    id: '7',
    memberId: '6',
    memberName: 'KION',
    amount: 25,
    reason: 'Refused to share dessert - Betrayal',
    date: '2025-05-05',
    paid: false,
  },
]

const cycleInfo = getCurrentCycleInfo()
const currentOrganiserName = getCurrentOrganiser()
const nextOrganiserName = getNextOrganiser()
const currentMember = members.find(m => m.name === currentOrganiserName)
const nextMember = members.find(m => m.name === nextOrganiserName)

export const currentCycle: CycleInfo = {
  currentOrganiserId: currentMember?.id || '1',
  cycleStartDate: cycleInfo.cycleStartDate.toISOString().split('T')[0],
  cycleEndDate: cycleInfo.cycleEndDate.toISOString().split('T')[0],
  nextOrganiserId: nextMember?.id || '2',
}

export function getStatusColor(status: MemberStatus): string {
  switch (status) {
    case 'Compliant':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'Under Investigation':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    case 'Dog Act':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

export function getStatusIcon(status: MemberStatus): string {
  switch (status) {
    case 'Compliant':
      return '✓'
    case 'Under Investigation':
      return '⚠'
    case 'Dog Act':
      return '🚫'
    default:
      return '•'
  }
}
