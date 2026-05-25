'use client'

import { DollarSign, Check, AlertTriangle, Scale } from 'lucide-react'
import { Fine } from '@/lib/types'
import { Button } from '@/components/ui/button'

interface FineTrackerProps {
  fines: Fine[]
  onPayFine: (fineId: string) => void
}

export function FineTracker({ fines, onPayFine }: FineTrackerProps) {
  const unpaidFines = fines.filter(f => !f.paid)
  const paidFines = fines.filter(f => f.paid)
  const totalOutstanding = unpaidFines.reduce((sum, f) => sum + f.amount, 0)
  const totalCollected = paidFines.reduce((sum, f) => sum + f.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Scale className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold text-gold-gradient">Fine Tribunal</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <DollarSign className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-red-400">${totalOutstanding}</p>
          <p className="text-xs text-muted-foreground">Outstanding</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <Check className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-400">${totalCollected}</p>
          <p className="text-xs text-muted-foreground">Collected</p>
        </div>
      </div>

      {/* Outstanding Fines */}
      {unpaidFines.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Outstanding Fines ({unpaidFines.length})
          </h3>
          {unpaidFines.map((fine) => (
            <div 
              key={fine.id} 
              className="glass-card rounded-xl p-4 border-l-4 border-l-red-500"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{fine.memberName}</span>
                    <span className="text-lg font-bold text-red-400">${fine.amount}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{fine.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Issued: {new Date(fine.date).toLocaleDateString('en-AU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => onPayFine(fine.id)}
                  className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Pay
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paid Fines */}
      {paidFines.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Paid Fines ({paidFines.length})
          </h3>
          {paidFines.map((fine) => (
            <div 
              key={fine.id} 
              className="glass-card rounded-xl p-4 opacity-60 border-l-4 border-l-emerald-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{fine.memberName}</span>
                    <span className="text-sm font-bold text-emerald-400 line-through">${fine.amount}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{fine.reason}</p>
                </div>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                  Settled
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {fines.length === 0 && (
        <div className="glass-card rounded-xl p-8 text-center">
          <Scale className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No fines on record. The council is pleased.</p>
        </div>
      )}

      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold text-primary mb-2">Fine Schedule</h3>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li>• Failed to organise event: <span className="text-red-400">$25</span></li>
          <li>• Late submission: <span className="text-amber-400">$15</span></li>
          <li>• Substandard event quality: <span className="text-amber-400">$10-25</span></li>
          <li>• Repeat offenders: <span className="text-red-400">Double penalties</span></li>
        </ul>
      </div>
    </div>
  )
}
