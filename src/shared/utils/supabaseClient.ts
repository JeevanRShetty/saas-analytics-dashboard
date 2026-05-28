/**
 * supabaseClient.ts
 *
 * Creates and exports the single Supabase client instance.
 *
 * Architecture decisions:
 *
 * 1. SINGLETON — one client, one WebSocket connection, one auth listener.
 *    If you import this file in 100 components, they all share the same instance.
 *    Creating multiple instances causes desynchronized auth state and connection leaks.
 *
 * 2. TYPED — we pass the Database generic so every query is fully typed.
 *    supabase.from('profiles').select() returns Profile[], not any[].
 *    This is the most impactful TypeScript win in the entire stack.
 *
 * 3. ENVIRONMENT VARIABLES — VITE_* prefix is required for Vite to expose
 *    env vars to the browser bundle. Non-prefixed vars are server-only and
 *    will be undefined at runtime. The anon key is safe to expose — it's
 *    designed for public use and Row Level Security enforces data access.
 *
 * 4. AUTH STORAGE — Supabase defaults to localStorage for session persistence.
 *    This is correct for a SaaS dashboard (users expect to stay logged in).
 *    For a banking or healthcare app you'd consider sessionStorage or
 *    in-memory only and accept that refreshes require re-login.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session across page refreshes via localStorage
    persistSession: true,
    // Automatically refresh the JWT before it expires
    autoRefreshToken: true,
    // Detect session from URL hash on OAuth redirect
    detectSessionInUrl: true,
  },
  realtime: {
    // Heartbeat keeps the WebSocket alive through idle periods
    params: {
      eventsPerSecond: 10,
    },
  },
})