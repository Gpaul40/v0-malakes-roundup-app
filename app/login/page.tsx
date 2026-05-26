'use client'

import { useActionState, useState } from 'react'
import { Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { loginAction } from '@/app/actions/auth'
import { getCurrentCycleInfo } from '@/lib/data'
import { ROTATION_ORDER } from '@/lib/data'

const cycleInfo = getCurrentCycleInfo()
const currentOrganiser = ROTATION_ORDER[cycleInfo.currentOrganiserIndex]

const MEMBER_NAMES = ['Gabe', 'Zak', 'Greg', 'Kion', 'Kozzy', 'Sammy']

export default function LoginPage() {
  const [selectedName, setSelectedName] = useState('')
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      formData.set('name', selectedName)
      return loginAction(formData)
    },
    null,
  )

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center space-y-6 animate-slide-up">
        <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center glow-gold">
          <Crown className="w-10 h-10 text-primary" />
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-sm uppercase tracking-widest">Attention</p>
          <h1 className="text-3xl font-bold text-gold-gradient">
            {"IT'S"} {currentOrganiser} WEEK
          </h1>
        </div>

        <form action={formAction} className="space-y-3 text-left">
          <Select value={selectedName} onValueChange={setSelectedName} name="name">
            <SelectTrigger className="bg-muted/30 border-border">
              <SelectValue placeholder="Who are you?" />
            </SelectTrigger>
            <SelectContent>
              {MEMBER_NAMES.map((name) => (
                <SelectItem key={name} value={name.toUpperCase()}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="password"
            name="password"
            placeholder="Password"
            className="bg-muted/30 border-border"
          />

          <p className="text-xs text-muted-foreground/60">Password is your name</p>

          {state?.error && <p className="text-red-400 text-xs">{state.error}</p>}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isPending || !selectedName}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base glow-gold"
            >
              {isPending ? 'Checking...' : 'Acknowledge Responsibility'}
            </Button>
          </div>
        </form>

        <div className="text-left border border-border/40 rounded-xl p-4 bg-muted/10 space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">How it works</p>
          {[
            "Each week one member is on organiser duty — they must plan the event.",
            "Vote on dates using the availability grid so everyone can attend.",
            "Once a date is locked, the event is confirmed and the next person is up.",
            "Miss your week and face the tribunal. No excuses.",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-primary font-bold text-xs mt-0.5 shrink-0">{i + 1}.</span>
              <p className="text-xs text-muted-foreground/80 leading-snug">{step}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/60">
          Failure to comply will result in tribunal action
        </p>
      </div>
    </div>
  )
}
