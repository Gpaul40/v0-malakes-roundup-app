'use client'

import { Crown, AlertCircle } from 'lucide-react'
import { Member, CycleInfo } from '@/lib/types'
import { getStatusColor, getStatusIcon } from '@/lib/data'

interface CurrentOrganiserProps {
  member: Member
  cycleInfo: CycleInfo
}

export function CurrentOrganiser({ member, cycleInfo }: CurrentOrganiserProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
    })
  }

  return (
    <div className="glass-card-gold rounded-2xl p-6 animate-pulse-gold">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-primary">Current Organiser</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(member.status)}`}>
          {getStatusIcon(member.status)} {member.status}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary border-2 border-primary/30">
          {member.avatar}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">{member.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDate(cycleInfo.cycleStartDate)} - {formatDate(cycleInfo.cycleEndDate)}
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-muted/30 rounded-xl">
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span className="text-muted-foreground">
            {member.status === 'Dog Act' 
              ? 'This individual is under tribunal review. Prayers recommended.'
              : member.status === 'Under Investigation'
              ? 'Currently being monitored by the council.'
              : 'In good standing with the tribunal.'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="text-center p-3 bg-muted/20 rounded-lg">
          <p className="text-xl font-bold text-primary">{member.eventsOrganised}</p>
          <p className="text-xs text-muted-foreground">Events Hosted</p>
        </div>
        <div className="text-center p-3 bg-muted/20 rounded-lg">
          <p className="text-xl font-bold text-red-400">{member.fines}</p>
          <p className="text-xs text-muted-foreground">Infractions</p>
        </div>
      </div>
    </div>
  )
}
