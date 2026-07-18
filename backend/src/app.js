import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/authRoutes.js'
import healthRoutes from './routes/healthRoutes.js'
import workspaceRoutes from './routes/workspaceRoutes.js'

const app = express()

app.use(
  cors({
    origin: env.corsOrigin.split(',').map((value) => value.trim()),
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
