import crypto from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { env } from '../config/env.js'
import { getPool } from '../db/pool.js'
import { parseJsonField, toJsonString } from '../utils/json.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { getWorkspace } from './workspaceService.js'
import { fallbackEmrData } from '../../../frontend/src/data/fallback.js'

const DEFAULT_ROLE = 'Front Desk Coordinator'
const DEFAULT_STATUS = 'Active'
const DEFAULT_ALLOWED_VIEWS = ['Dashboard', 'Patients', 'VisitPlanner', 'Billing', 'Notifications']
const FALLBACK_AUTH_STORE_URL = new URL('../../data/auth-fallback-users.json', import.meta.url)
const DEMO_USERS = [
  {
    fullName: 'Clinic Administrator',
    email: 'admin@svkini.clinic',
    password: 'BlueCare@123',
    role: 'Clinic Administrator',
    status: 'Active',
    allowedViews: ['Dashboard', 'Patients', 'VisitPlanner', 'OPD', 'IPD', 'DiseaseMaster', 'Medicines', 'Packages', 'Inventory', 'Billing', 'Reports', 'Notifications', 'Admin'],
  },
  {
    fullName: 'Dr. Kavya Iyer',
    email: 'kavya.iyer@svkini.clinic',
    password: 'Kavya@123',
    role: 'Chief Ayurvedic Physician',
    status: 'Active',
    allowedViews: ['Dashboard', 'Patients', 'VisitPlanner', 'OPD', 'IPD', 'DiseaseMaster', 'Medicines', 'Packages', 'Inventory', 'Billing', 'Reports', 'Notifications', 'Admin'],
  },
  {
    fullName: 'Dr. Rohan Sharma',
    email: 'rohan.sharma@svkini.clinic',
    password: 'Rohan@123',
    role: 'Ayurvedic Consultant',
    status: 'Active',
    allowedViews: ['Dashboard', 'Patients', 'VisitPlanner', 'OPD', 'IPD', 'DiseaseMaster', 'Medicines', 'Packages', 'Billing', 'Reports', 'Notifications'],
  },
  {
    fullName: 'Anjali Das',
    email: 'anjali.das@svkini.clinic',
    password: 'Anjali@123',
    role: 'Front Desk Coordinator',
    status: 'Active',
    allowedViews: DEFAULT_ALLOWED_VIEWS,
  },
]

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function isDatabaseUnavailableError(error) {
  return ['ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'].includes(error?.code)
}

function buildFallbackUserId(email) {
  return `fallback-auth-${normalizeEmail(email).replace(/[^a-z0-9]+/g, '-')}`
}

function getFallbackClinicUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email)
  return (fallbackEmrData?.users || []).find((user) => normalizeEmail(user.email) === normalizedEmail) || null
}

async function readFallbackAuthUsers() {
  try {
    const rawValue = await readFile(FALLBACK_AUTH_STORE_URL, 'utf8')
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return []
    }

    throw error
  }
}

async function writeFallbackAuthUsers(users) {
  await mkdir(new URL('../../data/', import.meta.url), { recursive: true })
  await writeFile(FALLBACK_AUTH_STORE_URL, `${JSON.stringify(users, null, 2)}\n`, 'utf8')
}

function buildFallbackSession(profile, clinicUser = null) {
  return {
    session: {
      user: {
        id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        status: profile.status,
        clinic_user_id: clinicUser?.id || profile.clinic_user_record_id || null,
      },
    },
    user: {
      id: profile.user_id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      status: profile.status,
    },
  }
}

function buildDemoFallbackProfiles() {
  return DEMO_USERS.map((profile) => {
    const clinicUser = getFallbackClinicUserByEmail(profile.email)

    return {
      user_id: buildFallbackUserId(profile.email),
      clinic_user_record_id: clinicUser?.id || null,
      full_name: profile.fullName,
      email: normalizeEmail(profile.email),
      password: profile.password,
      role: profile.role,
      status: profile.status,
      created_at: new Date(0).toISOString(),
    }
  })
}

async function loginClinicUserFallback({ email, password }) {
  const normalizedEmail = normalizeEmail(email)
  const fallbackProfiles = [...buildDemoFallbackProfiles(), ...(await readFallbackAuthUsers())]
  const profile = fallbackProfiles.find((item) => normalizeEmail(item.email) === normalizedEmail)
  const passwordMatches =
    profile &&
    (profile.password ? profile.password === password : verifyPassword(password, profile.password_hash))

  if (!profile || !passwordMatches) {
    throw new Error('Invalid email or password.')
  }

  return buildFallbackSession(profile, getFallbackClinicUserByEmail(normalizedEmail))
}

async function registerClinicUserFallback({ fullName, email, password, clinicId = env.clinicId }) {
  const normalizedEmail = normalizeEmail(email)
  if (!fullName?.trim()) {
    throw new Error('Full name is required.')
  }
  if (!normalizedEmail) {
    throw new Error('Valid email is required.')
  }
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.')
  }

  const existingUsers = [...buildDemoFallbackProfiles(), ...(await readFallbackAuthUsers())]
  if (existingUsers.some((item) => normalizeEmail(item.email) === normalizedEmail)) {
    throw new Error('An account already exists for this email.')
  }

  const createdAt = new Date().toISOString()
  const authUser = {
    user_id: crypto.randomUUID(),
    clinic_id: clinicId,
    clinic_user_record_id: getFallbackClinicUserByEmail(normalizedEmail)?.id || null,
    full_name: fullName.trim(),
    email: normalizedEmail,
    password_hash: hashPassword(password),
    role: DEFAULT_ROLE,
    status: DEFAULT_STATUS,
    created_at: createdAt,
  }

  const storedUsers = await readFallbackAuthUsers()
  await writeFallbackAuthUsers([...storedUsers, authUser])

  return buildFallbackSession(authUser, getFallbackClinicUserByEmail(normalizedEmail))
}

async function listClinicUsersFallback() {
  const fallbackProfiles = [...buildDemoFallbackProfiles(), ...(await readFallbackAuthUsers())]

  return fallbackProfiles.map((profile) => ({
    id: profile.user_id,
    clinic_user_id: profile.clinic_user_record_id || getFallbackClinicUserByEmail(profile.email)?.id || null,
    full_name: profile.full_name,
    email: profile.email,
    role: profile.role,
    status: profile.status,
    created_at: profile.created_at || new Date().toISOString(),
  }))
}

function buildSession(authUser, clinicUser = null) {
  return {
    user: {
      id: authUser.user_id,
      email: authUser.email,
      full_name: authUser.full_name,
      role: authUser.role,
      status: authUser.status,
      clinic_user_id: clinicUser?.id || authUser.clinic_user_record_id || null,
    },
  }
}

async function findClinicUserByEmail(connection, clinicId, email) {
  const [rows] = await connection.execute(
    `
      SELECT record_id, payload
      FROM clinic_users
      WHERE clinic_id = ?
        AND LOWER(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.email'))) = ?
      LIMIT 1
    `,
    [clinicId, normalizeEmail(email)],
  )

  if (!rows[0]) {
    return null
  }

  return {
    id: rows[0].record_id,
    ...parseJsonField(rows[0].payload, {}),
  }
}

async function saveClinicUserPayload(connection, clinicId, clinicUser) {
  const payload = { ...clinicUser, id: clinicUser.id }

  await connection.execute(
    `
      INSERT INTO clinic_users (clinic_id, record_id, payload)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        payload = VALUES(payload),
        updated_at = CURRENT_TIMESTAMP
    `,
    [clinicId, clinicUser.id, toJsonString(payload)],
  )
}

async function ensureClinicUserRecord(connection, clinicId, profile) {
  const existing = await findClinicUserByEmail(connection, clinicId, profile.email)
  if (existing) {
    return existing
  }

  const clinicUser = {
    id: `user-${crypto.randomUUID()}`,
    name: profile.fullName,
    email: normalizeEmail(profile.email),
    role: profile.role || DEFAULT_ROLE,
    status: profile.status || DEFAULT_STATUS,
    phone: profile.phone || '',
    shift: profile.shift || '09:00 - 17:00',
    allowed_views: profile.allowedViews || DEFAULT_ALLOWED_VIEWS,
    auth_user_id: profile.authUserId || null,
  }

  await saveClinicUserPayload(connection, clinicId, clinicUser)
  return clinicUser
}

async function syncClinicUserAuthId(connection, clinicId, clinicUser, authUserId) {
  if (!clinicUser?.id) {
    return clinicUser
  }

  if (clinicUser.auth_user_id === authUserId) {
    return clinicUser
  }

  const nextClinicUser = {
    ...clinicUser,
    auth_user_id: authUserId,
  }

  await saveClinicUserPayload(connection, clinicId, nextClinicUser)
  return nextClinicUser
}

async function ensureDemoAuthUsers(clinicId = env.clinicId) {
  await getWorkspace(clinicId)

  const pool = getPool()
  const connection = await pool.getConnection()

  try {
    const [rows] = await connection.execute('SELECT COUNT(*) AS total FROM auth_users WHERE clinic_id = ?', [clinicId])
    if (Number(rows[0]?.total || 0) > 0) {
      return
    }

    for (const profile of DEMO_USERS) {
      const clinicUser = await ensureClinicUserRecord(connection, clinicId, profile)
      const userId = crypto.randomUUID()
      const linkedClinicUser = await syncClinicUserAuthId(connection, clinicId, clinicUser, userId)

      await connection.execute(
        `
          INSERT INTO auth_users
            (user_id, clinic_id, clinic_user_record_id, full_name, email, password_hash, role, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          userId,
          clinicId,
          linkedClinicUser.id,
          profile.fullName,
          normalizeEmail(profile.email),
          hashPassword(profile.password),
          profile.role,
          profile.status,
        ],
      )
    }
  } finally {
    connection.release()
  }
}

async function loginClinicUserWithDatabase({ email, password, clinicId = env.clinicId }) {
  await ensureDemoAuthUsers(clinicId)

  const pool = getPool()
  const connection = await pool.getConnection()

  try {
    const normalizedEmail = normalizeEmail(email)
    const [rows] = await connection.execute(
      'SELECT * FROM auth_users WHERE clinic_id = ? AND email = ? LIMIT 1',
      [clinicId, normalizedEmail],
    )
    const authUser = rows[0]

    if (!authUser || !verifyPassword(password, authUser.password_hash)) {
      throw new Error('Invalid email or password.')
    }

    let clinicUser = await findClinicUserByEmail(connection, clinicId, normalizedEmail)
    if (clinicUser) {
      clinicUser = await syncClinicUserAuthId(connection, clinicId, clinicUser, authUser.user_id)
    }

    return {
      session: buildSession(authUser, clinicUser),
      user: {
        id: authUser.user_id,
        email: authUser.email,
        fullName: authUser.full_name,
        role: authUser.role,
        status: authUser.status,
      },
    }
  } finally {
    connection.release()
  }
}

async function registerClinicUserWithDatabase({ fullName, email, password, clinicId = env.clinicId }) {
  await ensureDemoAuthUsers(clinicId)

  const normalizedEmail = normalizeEmail(email)
  if (!fullName?.trim()) {
    throw new Error('Full name is required.')
  }
  if (!normalizedEmail) {
    throw new Error('Valid email is required.')
  }
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.')
  }

  const pool = getPool()
  const connection = await pool.getConnection()

  try {
    const [existingRows] = await connection.execute(
      'SELECT user_id FROM auth_users WHERE clinic_id = ? AND email = ? LIMIT 1',
      [clinicId, normalizedEmail],
    )

    if (existingRows[0]) {
      throw new Error('An account already exists for this email.')
    }

    const userId = crypto.randomUUID()
    let clinicUser = await ensureClinicUserRecord(connection, clinicId, {
      fullName: fullName.trim(),
      email: normalizedEmail,
      role: DEFAULT_ROLE,
      status: DEFAULT_STATUS,
      allowedViews: DEFAULT_ALLOWED_VIEWS,
      authUserId: userId,
    })

    clinicUser = await syncClinicUserAuthId(connection, clinicId, clinicUser, userId)

    await connection.execute(
      `
        INSERT INTO auth_users
          (user_id, clinic_id, clinic_user_record_id, full_name, email, password_hash, role, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        clinicId,
        clinicUser.id,
        fullName.trim(),
        normalizedEmail,
        hashPassword(password),
        clinicUser.role || DEFAULT_ROLE,
        clinicUser.status || DEFAULT_STATUS,
      ],
    )

    const authUser = {
      user_id: userId,
      clinic_user_record_id: clinicUser.id,
      full_name: fullName.trim(),
      email: normalizedEmail,
      role: clinicUser.role || DEFAULT_ROLE,
      status: clinicUser.status || DEFAULT_STATUS,
    }

    return {
      session: buildSession(authUser, clinicUser),
      user: {
        id: authUser.user_id,
        email: authUser.email,
        fullName: authUser.full_name,
        role: authUser.role,
        status: authUser.status,
      },
    }
  } finally {
    connection.release()
  }
}

async function listClinicUsersWithDatabase(clinicId = env.clinicId) {
  await ensureDemoAuthUsers(clinicId)

  const pool = getPool()
  const connection = await pool.getConnection()

  try {
    const [rows] = await connection.execute(
      `
        SELECT user_id, clinic_user_record_id, full_name, email, role, status, created_at
        FROM auth_users
        WHERE clinic_id = ?
        ORDER BY created_at ASC
      `,
      [clinicId],
    )

    return rows.map((row) => ({
      id: row.user_id,
      clinic_user_id: row.clinic_user_record_id,
      full_name: row.full_name,
      email: row.email,
      role: row.role,
      status: row.status,
      created_at: row.created_at,
    }))
  } finally {
    connection.release()
  }
}

export async function loginClinicUser(input) {
  try {
    return await loginClinicUserWithDatabase(input)
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error
    }

    return loginClinicUserFallback(input)
  }
}

export async function registerClinicUser(input) {
  try {
    return await registerClinicUserWithDatabase(input)
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error
    }

    return registerClinicUserFallback(input)
  }
}

export async function listClinicUsers(clinicId = env.clinicId) {
  try {
    return await listClinicUsersWithDatabase(clinicId)
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error
    }

    return listClinicUsersFallback(clinicId)
  }
}
