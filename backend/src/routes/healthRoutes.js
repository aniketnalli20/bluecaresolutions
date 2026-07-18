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
    })
  } catch (error) {
    next(error)
  }
})

export default router
