import { fallbackEmrData } from '../data/fallback'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost/bluecaresolutions/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Request failed for ${path}`)
  }

  return response.json()
}

export async function fetchEmrData() {
  try {
    const [
      dashboard,
      patients,
      doctors,
      appointments,
      consultations,
      prescriptions,
      invoices,
      reports,
      notifications,
    ] = await Promise.all([
      request('/dashboard'),
      request('/patients'),
      request('/doctors'),
      request('/appointments'),
      request('/consultations'),
      request('/prescriptions'),
      request('/billing/invoices'),
      request('/reports/summary'),
      request('/notifications'),
    ])

    return {
      dashboard: dashboard.data,
      patients: patients.data,
      doctors: doctors.data,
      appointments: appointments.data,
      consultations: consultations.data,
      prescriptions: prescriptions.data,
      invoices: invoices.data,
      reports: reports.data,
      notifications: notifications.data,
      source: 'api',
    }
  } catch (error) {
    return {
      ...fallbackEmrData,
      source: 'fallback',
      error: error.message,
    }
  }
}

export async function createResource(resourcePath, payload) {
  const response = await request(resourcePath, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function updateResource(resourcePath, payload) {
  const response = await request(resourcePath, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  return response.data
}

export { API_BASE_URL }
