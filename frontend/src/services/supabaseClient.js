import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const hasSupabaseConfig = Boolean(supabaseUrl && supabasePublishableKey)
export const CLINIC_WORKSPACE_ID = 'sv-kini-ayurvedic-clinic'

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

function ensureSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase authentication is not configured.')
  }

  return supabase
}

export async function getSupabaseSession() {
  const client = ensureSupabaseClient()
  const {
    data: { session },
    error,
  } = await client.auth.getSession()

  if (error) {
    throw error
  }

  return session
}

export async function getSupabaseSessionUser() {
  const session = await getSupabaseSession().catch(() => null)
  return session?.user ?? null
}

export function onSupabaseAuthStateChange(callback) {
  const client = ensureSupabaseClient()
  return client.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
}

export async function signInWithClinicPassword(email, password) {
  const client = ensureSupabaseClient()
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

export async function signUpClinicUser({ email, password, fullName }) {
  const client = ensureSupabaseClient()
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    throw error
  }

  return data
}

export async function sendClinicPasswordReset(email) {
  const client = ensureSupabaseClient()
  const { data, error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  })

  if (error) {
    throw error
  }

  return data
}

export async function updateClinicUserPassword(password) {
  const client = ensureSupabaseClient()
  const { data, error } = await client.auth.updateUser({
    password,
  })

  if (error) {
    throw error
  }

  return data
}

export async function signOutClinicUser() {
  const client = ensureSupabaseClient()
  const { error } = await client.auth.signOut()

  if (error) {
    throw error
  }
}
