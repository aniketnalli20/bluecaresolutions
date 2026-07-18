import { env } from '../config/env.js'
import { getWorkspace, saveWorkspace } from '../services/workspaceService.js'

function resolveClinicId(request) {
  return request.query.clinicId || request.body?.clinicId || env.clinicId
}

export async function getWorkspaceController(request, response, next) {
  try {
    const clinicId = resolveClinicId(request)
    const workspace = await getWorkspace(clinicId)

    response.json({
      ok: true,
      clinicId,
      workspace,
    })
  } catch (error) {
    next(error)
  }
}

export async function saveWorkspaceController(request, response, next) {
  try {
    const clinicId = resolveClinicId(request)
    const workspace = await saveWorkspace(request.body?.workspace || request.body || {}, clinicId)

    response.json({
      ok: true,
      message: 'Workspace saved successfully.',
      clinicId,
      workspace,
    })
  } catch (error) {
    next(error)
  }
}
