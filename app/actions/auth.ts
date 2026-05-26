'use server'

import { redirect } from 'next/navigation'
import { createSession, destroySession } from '@/lib/session'

const PASSWORDS: Record<string, string | undefined> = {
  GREG: process.env.PASSWORD_GREG,
  ZAK: process.env.PASSWORD_ZAK,
  GABE: process.env.PASSWORD_GABE,
  KOZZY: process.env.PASSWORD_KOZZY,
  SAMMY: process.env.PASSWORD_SAMMY,
  KION: process.env.PASSWORD_KION,
}

export async function loginAction(formData: FormData): Promise<{ error: string } | never> {
  const name = (formData.get('name') as string | null)?.toUpperCase()
  const password = formData.get('password') as string | null

  if (!name || !PASSWORDS[name]) {
    return { error: 'Pick your name' }
  }
  if (!password || PASSWORDS[name] !== password) {
    return { error: 'Wrong password, try again' }
  }

  await createSession(name)
  redirect('/')
}

export async function logoutAction(): Promise<never> {
  await destroySession()
  redirect('/login')
}
