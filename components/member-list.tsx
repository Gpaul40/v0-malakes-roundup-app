'use client'

import { useState } from 'react'
import { Edit2, Check, X, Users } from 'lucide-react'
import { Member, MemberStatus } from '@/lib/types'
import { getStatusColor, getStatusIcon } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface MemberListProps {
  members: Member[]
  onUpdateMember: (member: Member) => void
}

export function MemberList({ members, onUpdateMember }: MemberListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleEdit = (member: Member) => {
    setEditingId(member.id)
    setEditName(member.name)
  }

  const handleSave = (member: Member) => {
    if (editName.trim()) {
      onUpdateMember({
        ...member,
        name: editName.trim(),
        avatar: editName.trim()[0].toUpperCase(),
      })
    }
    setEditingId(null)
    setEditName('')
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditName('')
  }

  const handleStatusChange = (member: Member, status: MemberStatus) => {
    onUpdateMember({ ...member, status })
  }

  const statuses: MemberStatus[] = ['Compliant', 'Under Investigation', 'Dog Act']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-gold-gradient">Council Members</h2>
        </div>
        <span className="text-sm text-muted-foreground">{members.length} members</span>
      </div>

      <div className="grid gap-4">
        {members.map((member, index) => (
          <div 
            key={member.id} 
            className="glass-card rounded-xl p-4 transition-all hover:border-primary/30"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-xl font-bold text-primary border border-primary/30">
                {member.avatar}
              </div>
              
              <div className="flex-1 min-w-0">
                {editingId === member.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 bg-muted/50 border-primary/30"
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" onClick={() => handleSave(member)}>
                      <Check className="w-4 h-4 text-emerald-400" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancel}>
                      <X className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">{member.name}</h3>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleEdit(member)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                )}
                
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {member.eventsOrganised} events
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ${member.totalFineAmount} fines
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(member.status)}`}>
                  {getStatusIcon(member.status)} {member.status}
                </span>
                
                <select
                  value={member.status}
                  onChange={(e) => handleStatusChange(member, e.target.value as MemberStatus)}
                  className="text-xs bg-muted/50 border border-border rounded px-2 py-1 text-muted-foreground"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Status Legend</h3>
        <div className="flex flex-wrap gap-3">
          {statuses.map((status) => (
            <div key={status} className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                {getStatusIcon(status)} {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
