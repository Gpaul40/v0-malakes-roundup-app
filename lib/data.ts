import { Member, Event, Fine, CycleInfo, MemberStatus } from './types'

// Rotation order - fixed sequence starting with GREG from 25/05/2026
export const ROTATION_ORDER = ['GREG', 'ZAK', 'GABE', 'KOZZY', 'SAMMY', 'KION']

// Rotation start date: 25/05/2026
const ROTATION_START = new Date('2026-05-25T00:00:00')
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
    eventsOrganised: 0,
    fines: 0,
    totalFineAmount: 0,
  },
  {
    id: '2',
    name: 'ZAK',
    avatar: 'Z',
    status: 'Compliant',
    eventsOrganised: 0,
    fines: 0,
    totalFineAmount: 0,
  },
  {
    id: '3',
    name: 'GABE',
    avatar: 'G',
    status: 'Compliant',
    eventsOrganised: 0,
    fines: 0,
    totalFineAmount: 0,
  },
  {
    id: '4',
    name: 'KOZZY',
    avatar: 'K',
    status: 'Compliant',
    eventsOrganised: 0,
    fines: 0,
    totalFineAmount: 0,
  },
  {
    id: '5',
    name: 'SAMMY',
    avatar: 'S',
    status: 'Compliant',
    eventsOrganised: 0,
    fines: 0,
    totalFineAmount: 0,
  },
  {
    id: '6',
    name: 'KION',
    avatar: 'K',
    status: 'Compliant',
    eventsOrganised: 0,
    fines: 0,
    totalFineAmount: 0,
  },
]

export const events: Event[] = []

export const fines: Fine[] = []

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

// ── Malaka Rank System ──────────────────────────────────────────────────────

export type MalakaRankTier = 'top' | 'good' | 'suspicious' | 'bad' | 'shame'

export interface MalakaRank {
  name: string
  tier: MalakaRankTier
  color: string
  glowStyle: string
}

const TOP_TIER_RANKS    = ['MALAKA PRIME', 'ARCHMALAKA', 'MALAKIUS MAXIMUS', 'OMEGA MALAKA', 'GRAND MALAKA']
const GOOD_RANKS        = ['Certified Malaka', 'Active Malaka', 'Supreme Malak', 'Alpha Malak', 'Gold Malaka']
const SUSPICIOUS_RANKS  = ['Malak Under Review', 'Semi-Malaka', 'Malaklite', 'Malak-ish Behaviour', 'Beta Malak']
const BAD_RANKS         = ['Dog Malaka', 'Malakruptcy', 'Malakdown', 'Malakastrophe', 'Malakageddon', 'Public Malakace', 'Malakalypse']
const SHAME_RANKS       = ["Malakan't", 'MissingMalaka', 'Malafraudius', 'BrokeMalak', 'Malakaflop', 'WeakMalak Syndrome']

function nameHash(name: string): number {
  return name.split('').reduce((acc, c) => ((acc * 31) + c.charCodeAt(0)) & 0xffff, 0)
}

/**
 * Returns the Malaka rank for a member based on their events organised and fines.
 * Score = eventsOrganised * 10 - fines * 5
 *   ≥ 30  → TOP TIER
 *   ≥  0  → GOOD STATUS  (starting tier)
 *   ≥ -15 → SUSPICIOUS
 *   ≥ -30 → BAD
 *   < -30 → HALL OF SHAME
 */
export function getMalakaRank(eventsOrganised: number, fines: number, memberName: string): MalakaRank {
  const score = eventsOrganised * 10 - fines * 5
  const h = nameHash(memberName)

  if (score >= 30) {
    return {
      name: TOP_TIER_RANKS[h % TOP_TIER_RANKS.length],
      tier: 'top',
      color: 'text-amber-300',
      glowStyle: '0 0 8px rgba(252,211,77,0.95), 0 0 20px rgba(252,211,77,0.5)',
    }
  }
  if (score >= 0) {
    return {
      name: GOOD_RANKS[h % GOOD_RANKS.length],
      tier: 'good',
      color: 'text-emerald-400',
      glowStyle: '0 0 8px rgba(52,211,153,0.95), 0 0 20px rgba(52,211,153,0.5)',
    }
  }
  if (score >= -15) {
    return {
      name: SUSPICIOUS_RANKS[h % SUSPICIOUS_RANKS.length],
      tier: 'suspicious',
      color: 'text-amber-400',
      glowStyle: '0 0 8px rgba(251,191,36,0.95), 0 0 20px rgba(251,191,36,0.5)',
    }
  }
  if (score >= -30) {
    return {
      name: BAD_RANKS[h % BAD_RANKS.length],
      tier: 'bad',
      color: 'text-red-400',
      glowStyle: '0 0 8px rgba(248,113,113,0.95), 0 0 20px rgba(248,113,113,0.5)',
    }
  }
  return {
    name: SHAME_RANKS[h % SHAME_RANKS.length],
    tier: 'shame',
    color: 'text-purple-400',
    glowStyle: '0 0 8px rgba(192,132,252,0.95), 0 0 20px rgba(192,132,252,0.5)',
  }
}
