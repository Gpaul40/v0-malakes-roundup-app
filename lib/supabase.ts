import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zgzyrklanyupslqjvtpj.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_C_tOtz5b_vNN4o3aEvoVpQ_jxA55pY0'

export const supabase = createClient(supabaseUrl, supabaseKey)
