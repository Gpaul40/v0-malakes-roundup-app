'use client'

import { ArrowRight, User } from 'lucide-react'
import { Member } from '@/lib/types'
import { getStatusColor, getStatusIcon } from '@/lib/data'

interface NextOrganiserProps {
  member: Member
}

export function NextOrganiser({ member }: NextOrganiserProps) {
  return (
    <div className="glass-card-purple rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-secondary">On Deck</span>
          </div>
          <div className="w-px h-6 bg-border" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-lg font-bold text-secondary border border-secondary/30">
              {member.avatar}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{member.name}</h3>
              <p className="text-xs text-muted-foreground">Next in rotation</p>
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(member.status)}`}>
          {getStatusIcon(member.status)} {member.status}
        </span>
      </div>
    </div>
  )
}
