import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { MainApp } from './_components/main-app'

export default async function Page() {
  const session = await getSession()
  if (!session) redirect('/login')
  return <MainApp currentUser={session.username} />
}
