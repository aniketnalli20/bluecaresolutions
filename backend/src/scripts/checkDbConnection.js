import { env, missingDbEnv } from '../config/env.js'
import { pingDatabase } from '../db/pool.js'

async function run() {
  const missing = missingDbEnv()

  if (missing.length) {
    console.warn(`Missing database environment values: ${missing.join(', ')}`)
    console.warn('Using defaults where available. Update backend/.env before production use.')
  }

  await pingDatabase()
  console.log(`MySQL connection successful for database "${env.db.database}" on ${env.db.host}:${env.db.port}.`)
}

run().catch((error) => {
  console.error('Database connection check failed.')
  console.error(error.message)
  process.exitCode = 1
})
