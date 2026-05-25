'use client'

import { Trophy, Star, Medal, Crown, TrendingUp, TrendingDown } from 'lucide-react'
import { Member, Event } from '@/lib/types'
import { getStatusColor, getStatusIcon } from '@/lib/data'

interface LeaderboardProps {
  members: Member[]
  events: Event[]
}

export function Leaderboard({ members, events }: LeaderboardProps) {
  // Calculate scores: events organised * 10 - fines * 5
  const rankedMembers = [...members]
    .map(member => {
      const memberEvents = events.filter(e => e.organiserId === member.id)
      const avgRating = memberEvents.length > 0 
        ? memberEvents.reduce((sum, e) => sum + e.rating, 0) / memberEvents.length 
        : 0
      const score = (member.eventsOrganised * 10) - (member.fines * 5) + (avgRating * 2)
      return { ...member, score, avgRating }
    })
    .sort((a, b) => b.score - a.score)

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-5 h-5 text-amber-400" />
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 2:
        return <Medal className="w-5 h-5 text-amber-600" />
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
    }
  }

  const getRankBorder = (index: number) => {
    switch (index) {
      case 0:
        return 'border-l-4 border-l-amber-400 glass-card-gold'
      case 1:
        return 'border-l-4 border-l-gray-400'
      case 2:
        return 'border-l-4 border-l-amber-600'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold text-gold-gradient">Council Rankings</h2>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {rankedMembers.slice(0, 3).map((member, index) => {
          const positions = [1, 0, 2] // Display order: 2nd, 1st, 3rd
          const actualIndex = positions[index]
          const podiumMember = rankedMembers[actualIndex]
          if (!podiumMember) return null
          
          return (
            <div 
              key={podiumMember.id}
              className={`glass-card rounded-xl p-3 md:p-4 text-center ${
                actualIndex === 0 ? 'transform md:-translate-y-4 glow-gold' : ''
              }`}
            >
              <div className="flex justify-center mb-2">
                {getRankIcon(actualIndex)}
              </div>
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl mx-auto flex items-center justify-center text-lg font-bold ${
                actualIndex === 0 
                  ? 'bg-primary/20 text-primary border-2 border-primary/50' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {podiumMember.avatar}
              </div>
              <h3 className="font-semibold text-foreground mt-2 text-sm md:text-base truncate">
                {podiumMember.name}
              </h3>
              <p className={`text-lg md:text-xl font-bold ${
                actualIndex === 0 ? 'text-primary' : 'text-secondary'
              }`}>
                {Math.round(podiumMember.score)}
              </p>
              <p className="text-xs text-muted-foreground">points</p>
            </div>
          )
        })}
      </div>

      {/* Full Rankings */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Full Rankings</h3>
        {rankedMembers.map((member, index) => (
          <div 
            key={member.id}
            className={`glass-card rounded-xl p-4 transition-all hover:border-primary/30 ${getRankBorder(index)}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-8 flex justify-center">
                {getRankIcon(index)}
              </div>
              
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                index === 0 
                  ? 'bg-primary/20 text-primary border border-primary/30' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {member.avatar}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground truncate">{member.name}</h4>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getStatusColor(member.status)}`}>
                    {getStatusIcon(member.status)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{member.eventsOrganised} events</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400" />
                    {member.avgRating.toFixed(1)}
                  </span>
                  <span className={member.fines > 0 ? 'text-red-400' : ''}>
                    {member.fines} fines
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className={`text-xl font-bold ${index === 0 ? 'text-primary' : 'text-foreground'}`}>
                  {Math.round(member.score)}
                </p>
                <div className="flex items-center justify-end gap-1 text-xs">
                  {index < 3 ? (
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                  <span className="text-muted-foreground">pts</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold text-primary mb-2">Scoring System</h3>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>• Events Organised: <span className="text-emerald-400">+10 points each</span></li>
          <li>• Average Rating: <span className="text-amber-400">+2 points per star</span></li>
          <li>• Fines Received: <span className="text-red-400">-5 points each</span></li>
        </ul>
      </div>
    </div>
  )
}
