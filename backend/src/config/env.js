import dotenv from 'dotenv'

dotenv.config()

function toNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  clinicId: process.env.CLINIC_ID || 'sv-kini-ayurvedic-clinic',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: toNumber(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sv_kini_clinic',
    connectionLimit: toNumber(process.env.DB_CONNECTION_LIMIT, 10),
  },
}

export function missingDbEnv() {
  return ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'].filter((key) => !process.env[key])
}
