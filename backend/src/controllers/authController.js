import { env } from '../config/env.js'
import { listClinicUsers, loginClinicUser, registerClinicUser } from '../services/authService.js'

function resolveClinicId(request) {
  return request.query.clinicId || request.body?.clinicId || env.clinicId
}

export async function loginController(request, response, next) {
  try {
    const clinicId = resolveClinicId(request)
    const result = await loginClinicUser({
      clinicId,
      email: request.body?.email,
      password: request.body?.password,
    })

    response.json({
      ok: true,
      clinicId,
      ...result,
    })
  } catch (error) {
    next(error)
  }
}

export async function registerController(request, response, next) {
  try {
    const clinicId = resolveClinicId(request)
    const result = await registerClinicUser({
      clinicId,
      fullName: request.body?.fullName,
      email: request.body?.email,
      password: request.body?.password,
    })

    response.status(201).json({
      ok: true,
      clinicId,
      ...result,
    })
  } catch (error) {
    next(error)
  }
}

export async function listUsersController(request, response, next) {
  try {
    const clinicId = resolveClinicId(request)
    const users = await listClinicUsers(clinicId)

    response.json({
      ok: true,
      clinicId,
      users,
    })
  } catch (error) {
    next(error)
  }
}
