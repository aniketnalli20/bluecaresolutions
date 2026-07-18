const SESSION_STORAGE_KEY = 'bluecare-clinic-auth-session'
const AUTH_EVENT_NAME = 'bluecare-clinic-auth-change'
const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '')

export const hasSupabaseConfig = Boolean(apiBaseUrl)
export const CLINIC_WORKSPACE_ID = import.meta.env.VITE_CLINIC_ID || 'sv-kini-ayurvedic-clinic'
export const supabase = null

function readSession() {
  try {
    const rawValue = localStorage.getItem(SESSION_STORAGE_KEY)
    return rawValue ? JSON.parse(rawValue) : null
  } catch {
    return null
  }
}

function writeSession(session) {
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  } else {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  }

  window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME, { detail: session }))
}

async function parseJson(response) {
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.message || 'Authentication request failed.')
  }

  return payload
}

export async function getSupabaseSession() {
  return readSession()
}

export async function getSupabaseSessionUser() {
  const session = readSession()
  return session?.user ?? null
}

export function onSupabaseAuthStateChange(callback) {
  const handler = (event) => callback(event.detail ?? readSession())
  window.addEventListener(AUTH_EVENT_NAME, handler)

  return {
    data: {
      subscription: {
        unsubscribe() {
          window.removeEventListener(AUTH_EVENT_NAME, handler)
        },
      },
    },
  }
}

export async function signInWithClinicPassword(email, password) {
  const response = await fetch(`${apiBaseUrl}/api/auth/login?clinicId=${encodeURIComponent(CLINIC_WORKSPACE_ID)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
  const payload = await parseJson(response)
  writeSession(payload.session || null)

  return payload
}

export async function signUpClinicUser({ email, password, fullName }) {
  const response = await fetch(`${apiBaseUrl}/api/auth/register?clinicId=${encodeURIComponent(CLINIC_WORKSPACE_ID)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, fullName }),
  })
  const payload = await parseJson(response)
  writeSession(payload.session || null)

  return payload
}

export async function sendClinicPasswordReset() {
  throw new Error('Password reset is not enabled in the current clinic backend.')
}

export async function updateClinicUserPassword() {
  throw new Error('Password update is not enabled in the current clinic backend.')
}

export async function signOutClinicUser() {
  writeSession(null)
}

export async function getClinicAuthUsers() {
  const response = await fetch(`${apiBaseUrl}/api/auth/users?clinicId=${encodeURIComponent(CLINIC_WORKSPACE_ID)}`)
  const payload = await parseJson(response)
  return payload.users || []
}
