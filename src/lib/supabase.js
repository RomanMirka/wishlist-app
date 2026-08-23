import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase не налаштований: додайте VITE_SUPABASE_URL та VITE_SUPABASE_ANON_KEY у файл .env (див. .env.example та README.md)'
  )
}

// Do not construct a broken client when the app is opened before .env is set.
// App.jsx renders the setup screen instead.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
