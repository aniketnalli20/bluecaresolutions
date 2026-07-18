import mysql from 'mysql2/promise'
import { env } from '../config/env.js'

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  namedPlaceholders: true,
})

export function getPool() {
  return pool
}

export async function pingDatabase() {
  const connection = await pool.getConnection()

  try {
    await connection.ping()
  } finally {
    connection.release()
  }
}
