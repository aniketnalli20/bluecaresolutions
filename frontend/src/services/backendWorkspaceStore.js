import { requestClinicApiJson, resolveClinicId } from './clinicApi'

export async function loadBackendWorkspaceData() {
  const clinicId = resolveClinicId()
  const payload = await requestClinicApiJson(
    `/api/workspace?clinicId=${encodeURIComponent(clinicId)}`,
    undefined,
    {
      requestFailed: 'Unable to load workspace data.',
      networkFailed: 'Unable to reach the clinic backend to load workspace data. Start the backend server or update the API URL.',
    },
  )

  return payload.workspace || null
}

export async function saveBackendWorkspaceData(workspace) {
  const clinicId = resolveClinicId()
  const payload = await requestClinicApiJson(
    `/api/workspace?clinicId=${encodeURIComponent(clinicId)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workspace }),
    },
    {
      requestFailed: 'Unable to save workspace data.',
      networkFailed: 'Unable to reach the clinic backend to save workspace data. Start the backend server or update the API URL.',
    },
  )

  return payload.workspace || null
}
