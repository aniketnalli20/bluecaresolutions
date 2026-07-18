import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/authRoutes.js'
import healthRoutes from './routes/healthRoutes.js'
import workspaceRoutes from './routes/workspaceRoutes.js'

const app = express()
const configuredCorsOrigins = env.corsOrigin.split(',').map((value) => value.trim()).filter(Boolean)

function isAllowedCorsOrigin(origin) {
  if (!origin) {
    return true
  }

  if (configuredCorsOrigins.includes(origin)) {
    return true
  }

  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedCorsOrigin(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`CORS origin not allowed: ${origin}`))
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '10mb' }))

app.get('/', (request, response) => {
  response.json({
    ok: true,
    service: 'S.V. Kini clinic backend',
    message: 'Node + Express + MySQL API is running.',
  })
})

app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/workspace', workspaceRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
