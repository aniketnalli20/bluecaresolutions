const DEFAULT_API_BASE_URL = 'http://localhost:4000'
const DEFAULT_CLINIC_ID = 'sv-kini-ayurvedic-clinic'

function normalizeBaseUrl(value, fallback = DEFAULT_API_BASE_URL) {
  return String(value || fallback).replace(/\/+$/, '')
}

function isLocalHost(hostname) {
  return ['localhost', '127.0.0.1'].includes(String(hostname || '').toLowerCase())
}

function resolveBrowserOrigin() {
  if (typeof window === 'undefined') {
    return ''
  }

  return String(window.location.origin || '').replace(/\/+$/, '')
}

export function resolveClinicId() {
  return import.meta.env.VITE_CLINIC_ID || DEFAULT_CLINIC_ID
}

export function resolvePrimaryApiBaseUrl() {
  return normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)
}

export function resolveApiBaseUrls() {
  const configuredBaseUrl = resolvePrimaryApiBaseUrl()
  const browserOrigin = resolveBrowserOrigin()
  const candidates = [configuredBaseUrl]

  if (browserOrigin) {
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : ''
    const shouldTrySameOrigin = !isLocalHost(currentHost) && browserOrigin !== configuredBaseUrl

    if (shouldTrySameOrigin) {
      candidates.push(browserOrigin)
    }
  }

  return [...new Set(candidates.filter(Boolean))]
}

async function parseJson(response, fallbackMessage) {
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.message || fallbackMessage || `Backend request failed with status ${response.status}.`)
  }

  return payload
}

export async function requestClinicApiJson(path, options = {}, messages = {}) {
  const candidates = resolveApiBaseUrls()
  let lastNetworkError = null

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(`${baseUrl}${path}`, options)
      return await parseJson(response, messages.requestFailed)
    } catch (error) {
      const isNetworkError =
        error instanceof TypeError ||
        String(error?.message || '').toLowerCase().includes('failed to fetch')

      if (!isNetworkError) {
        throw error
      }

      lastNetworkError = error
    }
  }

  throw new Error(
    messages.networkFailed ||
      'Unable to reach the clinic backend. Start the backend server or update VITE_API_BASE_URL to the correct API address.',
  )
}
