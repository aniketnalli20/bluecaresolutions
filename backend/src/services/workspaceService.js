import { env } from '../config/env.js'
import { getPool } from '../db/pool.js'
import { parseJsonField, toJsonString } from '../utils/json.js'

const COLLECTION_TABLES = {
  users: 'clinic_users',
  patients: 'patients',
  visitPlanner: 'visit_planner',
  opdConsultations: 'opd_consultations',
  ipdAdmissions: 'ipd_admissions',
  diseaseMaster: 'disease_master',
  medicineCatalog: 'medicine_catalog',
  packages: 'treatment_packages',
  suppliers: 'suppliers',
  purchases: 'purchases',
  invoices: 'invoices',
}

function ensureArray(value) {
  return Array.isArray(value) ? value : []
}

function buildDefaultWorkspace(clinicId = env.clinicId) {
  return {
    clinic: {
      name: 'S.V. Kini Ayurvedic clinic',
      location: 'Mumbai, Maharashtra, India',
      contact: '+91 80000 12211',
    },
    currentUserId: '',
    users: [],
    patients: [],
    visitPlanner: [],
    opdConsultations: [],
    ipdAdmissions: [],
    diseaseMaster: [],
    medicineCatalog: [],
    packages: [],
    suppliers: [],
    purchases: [],
    invoices: [],
    systemSettings: {
      low_stock_threshold: 25,
      near_expiry_days: 45,
      clinic_hours: '08:30 - 18:30',
      receipt_footer: 'S.V. Kini Ayurvedic clinic, Mumbai, Maharashtra, India',
      backup_note: 'Clinic workspace backup.',
      supported_units: [],
    },
    clinicId,
  }
}

async function loadCollection(connection, tableName, clinicId) {
  const [rows] = await connection.execute(
    `SELECT record_id, payload FROM ${tableName} WHERE clinic_id = ? ORDER BY created_at ASC, id ASC`,
    [clinicId],
  )

  return rows.map((row) => ({
    id: row.record_id,
    ...parseJsonField(row.payload, {}),
  }))
}

async function replaceCollection(connection, tableName, clinicId, items) {
  await connection.execute(`DELETE FROM ${tableName} WHERE clinic_id = ?`, [clinicId])

  if (!items.length) {
    return
  }

  for (const item of items) {
    const recordId = String(item.id || crypto.randomUUID())
    const payload = { ...item, id: recordId }

    await connection.execute(
      `INSERT INTO ${tableName} (clinic_id, record_id, payload) VALUES (?, ?, ?)`,
      [clinicId, recordId, toJsonString(payload)],
    )
  }
}

export async function getWorkspace(clinicId = env.clinicId) {
  const pool = getPool()
  const connection = await pool.getConnection()

  try {
    const [clinicRows] = await connection.execute(
      'SELECT name, location, contact FROM clinics WHERE clinic_id = ? LIMIT 1',
      [clinicId],
    )
    const [settingsRows] = await connection.execute(
      'SELECT settings_json FROM clinic_settings WHERE clinic_id = ? LIMIT 1',
      [clinicId],
    )
    const [stateRows] = await connection.execute(
      'SELECT current_user_id FROM workspace_state WHERE clinic_id = ? LIMIT 1',
      [clinicId],
    )

    const workspace = buildDefaultWorkspace(clinicId)
    const clinic = clinicRows[0]

    if (clinic) {
      workspace.clinic = {
        name: clinic.name,
        location: clinic.location,
        contact: clinic.contact,
      }
    }

    if (settingsRows[0]?.settings_json) {
      workspace.systemSettings = parseJsonField(settingsRows[0].settings_json, workspace.systemSettings)
    }

    if (stateRows[0]?.current_user_id) {
      workspace.currentUserId = stateRows[0].current_user_id
    }

    for (const [key, tableName] of Object.entries(COLLECTION_TABLES)) {
      workspace[key] = await loadCollection(connection, tableName, clinicId)
    }

    return workspace
  } finally {
    connection.release()
  }
}

export async function saveWorkspace(workspacePayload, clinicId = env.clinicId) {
  const pool = getPool()
  const connection = await pool.getConnection()
  const workspace = {
    ...buildDefaultWorkspace(clinicId),
    ...workspacePayload,
    clinic: {
      ...buildDefaultWorkspace(clinicId).clinic,
      ...(workspacePayload?.clinic || {}),
    },
    systemSettings: {
      ...buildDefaultWorkspace(clinicId).systemSettings,
      ...(workspacePayload?.systemSettings || {}),
    },
  }

  try {
    await connection.beginTransaction()

    await connection.execute(
      `
        INSERT INTO clinics (clinic_id, name, location, contact)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          location = VALUES(location),
          contact = VALUES(contact),
          updated_at = CURRENT_TIMESTAMP
      `,
      [clinicId, workspace.clinic.name, workspace.clinic.location, workspace.clinic.contact],
    )

    await connection.execute(
      `
        INSERT INTO clinic_settings (clinic_id, settings_json)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
          settings_json = VALUES(settings_json),
          updated_at = CURRENT_TIMESTAMP
      `,
      [clinicId, toJsonString(workspace.systemSettings)],
    )

    await connection.execute(
      `
        INSERT INTO workspace_state (clinic_id, current_user_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
          current_user_id = VALUES(current_user_id),
          updated_at = CURRENT_TIMESTAMP
      `,
      [clinicId, workspace.currentUserId || null],
    )

    for (const [key, tableName] of Object.entries(COLLECTION_TABLES)) {
      await replaceCollection(connection, tableName, clinicId, ensureArray(workspace[key]))
    }

    await connection.commit()
    return getWorkspace(clinicId)
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}
