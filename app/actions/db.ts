'use server'

import { getSession } from '@/lib/session'
import { supabaseServer } from '@/lib/supabase-server'

async function requireSession() {
  const session = await getSession()
  if (!session) throw new Error('Not authenticated')
  return session
}

export async function submitEventProposalAction(data: {
  proposalId: string
  organiserId: string
  organiserName: string
  title: string
  location: string
  dateRows: { id: string; proposal_id: string; date: string; time: string }[]
}) {
  await requireSession()

  // Cancel any existing voting proposals
  await supabaseServer.from('proposals').update({ status: 'cancelled' }).eq('status', 'voting')

  await supabaseServer.from('proposals').insert({
    id: data.proposalId,
    organiser_id: data.organiserId,
    organiser_name: data.organiserName,
    title: data.title,
    location: data.location,
    status: 'voting',
  })

  await supabaseServer.from('date_options').insert(data.dateRows)
}

export async function toggleAvailabilityAction(data: {
  proposalId: string
  dateOptionId: string
  memberName: string
  currentlyAvailable: boolean
}) {
  const session = await requireSession()
  // Users can only toggle their own availability
  if (session.username !== data.memberName) throw new Error('Forbidden')

  if (data.currentlyAvailable) {
    await supabaseServer
      .from('votes')
      .delete()
      .eq('proposal_id', data.proposalId)
      .eq('date_option_id', data.dateOptionId)
      .eq('member_name', data.memberName)
  } else {
    await supabaseServer.from('votes').insert({
      proposal_id: data.proposalId,
      date_option_id: data.dateOptionId,
      member_name: data.memberName,
    })
  }
}

export async function confirmEventAction(data: {
  proposalId: string
  organiserId: string
  organiserName: string
  title: string
  location: string
  date: string
  attendees: string[]
}) {
  await requireSession()

  await supabaseServer.from('events').insert({
    id: String(Date.now()),
    organiser_id: data.organiserId,
    organiser_name: data.organiserName,
    title: data.title,
    date: data.date,
    description: `Location: ${data.location}`,
    attendees: data.attendees,
    rating: 0,
  })

  await supabaseServer
    .from('proposals')
    .update({ status: 'confirmed' })
    .eq('id', data.proposalId)
}

export async function payFineAction(fineId: string) {
  await requireSession()
  await supabaseServer.from('fines').update({ paid: true }).eq('id', fineId)
}

export async function deleteEventAction(eventId: string) {
  const session = await requireSession()
  if (session.username !== 'GABE') throw new Error('Admin only')
  await supabaseServer.from('events').delete().eq('id', eventId)
}

export async function uploadAvatarAction(formData: FormData): Promise<{ url: string } | { error: string }> {
  const session = await requireSession()
  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided' }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${session.username.toLowerCase()}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: upErr } = await supabaseServer.storage
    .from('Photos')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (upErr) return { error: upErr.message }

  const { data: { publicUrl } } = supabaseServer.storage.from('Photos').getPublicUrl(path)

  await supabaseServer.from('member_profiles').upsert({ name: session.username, avatar_url: publicUrl })

  return { url: publicUrl }
}
