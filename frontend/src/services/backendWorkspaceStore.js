const DEFAULT_API_BASE_URL = 'http://localhost:4000'
const DEFAULT_CLINIC_ID = 'sv-kini-ayurvedic-clinic'

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_API_BASE_URL).replace(/\/+$/, '')
}

function resolveApiBaseUrl() {
  return normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)
}

function resolveClinicId() {
  return import.meta.env.VITE_CLINIC_ID || DEFAULT_CLINIC_ID
}

async function parseJson(response) {
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.message || `Backend request failed with status ${response.status}.`)
  }

  return payload
}

export async function loadBackendWorkspaceData() {
  const apiBaseUrl = resolveApiBaseUrl()
  const clinicId = resolveClinicId()
  const response = await fetch(`${apiBaseUrl}/api/workspace?clinicId=${encodeURIComponent(clinicId)}`)
  const payload = await parseJson(response)

  return payload.workspace || null
}

export async function saveBackendWorkspaceData(workspace) {
  const apiBaseUrl = resolveApiBaseUrl()
  const clinicId = resolveClinicId()
  const response = await fetch(`${apiBaseUrl}/api/workspace?clinicId=${encodeURIComponent(clinicId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ workspace }),
  })
  const payload = await parseJson(response)

  return payload.workspace || null
}
