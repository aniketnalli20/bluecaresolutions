import { Router } from 'express'
import { env } from '../config/env.js'
import { pingDatabase } from '../db/pool.js'

const router = Router()

router.get('/', async (request, response, next) => {
  try {
    await pingDatabase()

    response.json({
      ok: true,
      message: 'Backend and database connection are healthy.',
      clinicId: env.clinicId,
      database: 'online',
    })
  } catch (error) {
    if (['ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'].includes(error?.code)) {
      response.json({
        ok: true,
        message: 'Backend is running. Database is currently offline, so fallback mode is active.',
        clinicId: env.clinicId,
        database: 'offline',
      })
      return
    }

    next(error)
  }
})

export default router
