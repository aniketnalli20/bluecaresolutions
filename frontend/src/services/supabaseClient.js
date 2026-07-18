import { requestClinicApiJson, resolveClinicId, resolvePrimaryApiBaseUrl } from './clinicApi'

const SESSION_STORAGE_KEY = 'bluecare-clinic-auth-session'
const AUTH_EVENT_NAME = 'bluecare-clinic-auth-change'

export const hasSupabaseConfig = Boolean(resolvePrimaryApiBaseUrl())
export const CLINIC_WORKSPACE_ID = resolveClinicId()
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
  const payload = await requestClinicApiJson(
    `/api/auth/login?clinicId=${encodeURIComponent(CLINIC_WORKSPACE_ID)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    },
    {
      requestFailed: 'Sign-in failed.',
      networkFailed: 'Unable to reach the clinic login service. Start the backend server or update the API URL.',
    },
  )
  writeSession(payload.session || null)

  return payload
}

export async function signUpClinicUser({ email, password, fullName }) {
  const payload = await requestClinicApiJson(
    `/api/auth/register?clinicId=${encodeURIComponent(CLINIC_WORKSPACE_ID)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, fullName }),
    },
    {
      requestFailed: 'Account creation failed.',
      networkFailed: 'Unable to reach the clinic registration service. Start the backend server or update the API URL.',
    },
  )
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
  const payload = await requestClinicApiJson(
    `/api/auth/users?clinicId=${encodeURIComponent(CLINIC_WORKSPACE_ID)}`,
    undefined,
    {
      requestFailed: 'Unable to load clinic users.',
      networkFailed: 'Unable to reach the clinic backend to load users. Start the backend server or update the API URL.',
    },
  )
  if (!payload || typeof payload !== 'object') {
    throw new Error('Clinic user directory returned an invalid response.')
  }

  return Array.isArray(payload.users) ? payload.users : []
}
