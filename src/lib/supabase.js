import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase не налаштований: додайте VITE_SUPABASE_URL та VITE_SUPABASE_ANON_KEY у файл .env (див. .env.example та README.md)'
  )
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
