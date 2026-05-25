export type MemberStatus = 'Compliant' | 'Under Investigation' | 'Dog Act'

export interface Member {
  id: string
  name: string
  avatar: string
  status: MemberStatus
  eventsOrganised: number
  fines: number
  totalFineAmount: number
}

export interface DateOption {
  id: string
  date: string
  time: string
  availableMembers: string[]
}

export interface EventProposal {
  id: string
  organiserId: string
  organiserName: string
  title: string
  location: string
  dateOptions: DateOption[]
  status: 'voting' | 'confirmed'
  confirmedDate?: string
}

export interface Event {
  id: string
  organiserId: string
  organiserName: string
  title: string
  date: string
  description: string
  attendees: string[]
  rating: number
}

export interface Fine {
  id: string
  memberId: string
  memberName: string
  amount: number
  reason: string
  date: string
  paid: boolean
}

export interface CycleInfo {
  currentOrganiserId: string
  cycleStartDate: string
  cycleEndDate: string
  nextOrganiserId: string
}
