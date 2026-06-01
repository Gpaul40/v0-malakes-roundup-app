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

export async function uploadAppImageAction(key: string, formData: FormData): Promise<{ url: string } | { error: string }> {
  const session = await requireSession()
  if (session.username !== 'GABE') return { error: 'Admin only' }
  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided' }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `app-${key}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: upErr } = await supabaseServer.storage
    .from('Photos')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (upErr) return { error: upErr.message }

  const { data: { publicUrl } } = supabaseServer.storage.from('Photos').getPublicUrl(path)

  await supabaseServer.from('member_profiles').upsert({ name: `__app_${key}__`, avatar_url: publicUrl })

  return { url: publicUrl }
}

export async function getGalleryUploadUrlAction(eventId: string, fileName: string, contentType: string): Promise<{ signedUrl: string; path: string; token: string } | { error: string }> {
  const session = await getSession()
  if (!session) return { error: 'Not authenticated' }

  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg'
  // Normalize HEIC/HEIF to jpg path so browsers can display it
  const safeExt = ['heic', 'heif'].includes(ext) ? 'jpg' : ext
  const path = `gallery/${eventId}/${session.username.toLowerCase()}-${Date.now()}.${safeExt}`

  const { data, error } = await supabaseServer.storage
    .from('Photos')
    .createSignedUploadUrl(path)

  if (error || !data) return { error: error?.message ?? 'Failed to create upload URL' }

  return { signedUrl: data.signedUrl, path, token: data.token }
}

export async function uploadEventGalleryAction(eventId: string, formData: FormData): Promise<{ url: string } | { error: string }> {
  const session = await getSession()
  if (!session) return { error: 'Not authenticated' }

  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const safeExt = ['heic', 'heif'].includes(ext) ? 'jpg' : ext
  const path = `gallery/${eventId}/${session.username.toLowerCase()}-${Date.now()}.${safeExt}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = file.type || 'image/jpeg'

  const { error: upErr } = await supabaseServer.storage
    .from('Photos')
    .upload(path, buffer, { contentType: mimeType, upsert: true })

  if (upErr) return { error: upErr.message }

  const { data: { publicUrl } } = supabaseServer.storage.from('Photos').getPublicUrl(path)
  return { url: publicUrl }
}

export async function listEventGalleryAction(eventId: string): Promise<{ urls: string[] } | { error: string }> {
  const session = await getSession()
  if (!session) return { error: 'Not authenticated' }

  const { data, error } = await supabaseServer.storage
    .from('Photos')
    .list(`gallery/${eventId}`, { limit: 200, sortBy: { column: 'name', order: 'desc' } })

  if (error) return { error: error.message }

  const urls = (data ?? [])
    .filter(f => f.name !== '.emptyFolderPlaceholder')
    .map(f => supabaseServer.storage.from('Photos').getPublicUrl(`gallery/${eventId}/${f.name}`).data.publicUrl)

  return { urls }
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

export async function detonateOrganiserAction(data: {
  currentOrganiser: string
  nextOrganiser: string
  daysRemaining: number
}): Promise<{ success: boolean } | { error: string }> {
  const session = await requireSession()
  if (session.username !== 'GABE' && session.username !== data.currentOrganiser) {
    return { error: 'Forbidden' }
  }

  const today = new Date().toISOString().split('T')[0]

  const { error: fineErr } = await supabaseServer.from('fines').insert({
    id: String(Date.now()),
    member_id: data.currentOrganiser.toLowerCase(),
    member_name: data.currentOrganiser,
    amount: 200,
    reason: `Failed to organise — Turn detonated by ${session.username === data.currentOrganiser ? 'self' : 'admin'}`,
    date: today,
    paid: false,
  })

  if (fineErr) return { error: fineErr.message }

  // Next organiser gets their normal 14 days PLUS whatever days were remaining
  const newEnd = new Date()
  newEnd.setDate(newEnd.getDate() + 14 + Math.max(0, data.daysRemaining))
  const newEndStr = newEnd.toISOString().split('T')[0]

  const { error: overrideErr } = await supabaseServer.from('member_profiles').upsert({
    name: '__app_detonate_override__',
    avatar_url: JSON.stringify({ organiser: data.nextOrganiser, endDate: newEndStr }),
  })

  if (overrideErr) return { error: overrideErr.message }

  return { success: true }
}

export async function clearDetonateOverrideAction(): Promise<{ success: boolean } | { error: string }> {
  const session = await requireSession()
  if (session.username !== 'GABE') return { error: 'Admin only' }
  await supabaseServer.from('member_profiles').delete().eq('name', '__app_detonate_override__')
  return { success: true }
}
