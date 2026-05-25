import { Member, Event, Fine, CycleInfo, MemberStatus } from './types'

// Calculate cycle dates - 14 day rotation
const today = new Date()
const cycleStart = new Date(today)
cycleStart.setDate(today.getDate() - (today.getDate() % 14) + 1)
const cycleEnd = new Date(cycleStart)
cycleEnd.setDate(cycleStart.getDate() + 13)

export const members: Member[] = [
  {
    id: '1',
    name: 'Greg',
    avatar: 'G',
    status: 'Compliant',
    eventsOrganised: 8,
    fines: 0,
    totalFineAmount: 0,
  },
  {
    id: '2',
    name: 'Gabriel',
    avatar: 'G',
    status: 'Under Investigation',
    eventsOrganised: 6,
    fines: 1,
    totalFineAmount: 25,
  },
  {
    id: '3',
    name: 'Zak',
    avatar: 'Z',
    status: 'Dog Act',
    eventsOrganised: 4,
    fines: 3,
    totalFineAmount: 75,
  },
  {
    id: '4',
    name: 'Lucas',
    avatar: 'L',
    status: 'Compliant',
    eventsOrganised: 7,
    fines: 1,
    totalFineAmount: 25,
  },
  {
    id: '5',
    name: 'Kosta',
    avatar: 'K',
    status: 'Compliant',
    eventsOrganised: 9,
    fines: 0,
    totalFineAmount: 0,
  },
  {
    id: '6',
    name: 'Mina',
    avatar: 'M',
    status: 'Under Investigation',
    eventsOrganised: 5,
    fines: 2,
    totalFineAmount: 50,
  },
]

export const events: Event[] = [
  {
    id: '1',
    organiserId: '5',
    organiserName: 'Kosta',
    title: 'Souvlaki Night at The Greek Club',
    date: '2024-01-20',
    description: 'Epic feast with live bouzouki music. The lamb was immaculate.',
    attendees: ['Greg', 'Gabriel', 'Zak', 'Lucas', 'Mina'],
    rating: 5,
  },
  {
    id: '2',
    organiserId: '1',
    organiserName: 'Greg',
    title: 'Poker Night - High Stakes',
    date: '2024-01-06',
    description: 'Texas Hold\'em at Greg\'s. Kosta lost his dignity.',
    attendees: ['Gabriel', 'Zak', 'Lucas', 'Kosta', 'Mina'],
    rating: 4,
  },
  {
    id: '3',
    organiserId: '2',
    organiserName: 'Gabriel',
    title: 'Beach BBQ Bonanza',
    date: '2023-12-23',
    description: 'Christmas beach party. The gyros were questionable.',
    attendees: ['Greg', 'Zak', 'Lucas', 'Kosta'],
    rating: 3,
  },
  {
    id: '4',
    organiserId: '4',
    organiserName: 'Lucas',
    title: 'Go-Kart Championship',
    date: '2023-12-09',
    description: 'Racing for glory. Zak crashed into the barrier 4 times.',
    attendees: ['Greg', 'Gabriel', 'Zak', 'Kosta', 'Mina'],
    rating: 5,
  },
  {
    id: '5',
    organiserId: '6',
    organiserName: 'Mina',
    title: 'Escape Room Challenge',
    date: '2023-11-25',
    description: 'We escaped with 2 minutes left. Greg got locked in the bathroom.',
    attendees: ['Greg', 'Gabriel', 'Lucas', 'Kosta'],
    rating: 4,
  },
  {
    id: '6',
    organiserId: '3',
    organiserName: 'Zak',
    title: 'Movie Marathon',
    date: '2023-11-11',
    description: 'Watched all Godfather films. Zak fell asleep during the first one.',
    attendees: ['Greg', 'Gabriel', 'Lucas', 'Kosta', 'Mina'],
    rating: 2,
  },
]

export const fines: Fine[] = [
  {
    id: '1',
    memberId: '3',
    memberName: 'Zak',
    amount: 25,
    reason: 'Failed to organise event - Dog Act Citation #1',
    date: '2023-10-15',
    paid: true,
  },
  {
    id: '2',
    memberId: '3',
    memberName: 'Zak',
    amount: 25,
    reason: 'Late event submission - Contempt of Council',
    date: '2023-09-01',
    paid: true,
  },
  {
    id: '3',
    memberId: '3',
    memberName: 'Zak',
    amount: 25,
    reason: 'Organised a "movie night" with no snacks - Gross Negligence',
    date: '2023-11-11',
    paid: false,
  },
  {
    id: '4',
    memberId: '2',
    memberName: 'Gabriel',
    amount: 25,
    reason: 'Questionable gyros at Beach BBQ - Food Crimes',
    date: '2023-12-24',
    paid: false,
  },
  {
    id: '5',
    memberId: '4',
    memberName: 'Lucas',
    amount: 25,
    reason: 'Booked go-karts at 8am on a Sunday - Cruel & Unusual',
    date: '2023-12-10',
    paid: true,
  },
  {
    id: '6',
    memberId: '6',
    memberName: 'Mina',
    amount: 25,
    reason: 'Escape room was too hard - Mental Anguish',
    date: '2023-11-26',
    paid: false,
  },
  {
    id: '7',
    memberId: '6',
    memberName: 'Mina',
    amount: 25,
    reason: 'Refused to share dessert - Betrayal',
    date: '2024-01-05',
    paid: false,
  },
]

export const currentCycle: CycleInfo = {
  currentOrganiserId: '3', // Zak is current organiser
  cycleStartDate: cycleStart.toISOString().split('T')[0],
  cycleEndDate: cycleEnd.toISOString().split('T')[0],
  nextOrganiserId: '4', // Lucas is next
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
