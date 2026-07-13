import { fallbackEmrData } from '../data/fallback'
import { CLINIC_WORKSPACE_ID, getSupabaseSessionUser, hasSupabaseConfig, supabase } from './supabaseClient'
import { cloneData, hydrateWorkspace } from './workspaceTransforms'

const TABLES = {
  clinic: 'clinic_profile',
  settings: 'system_settings',
  users: 'clinic_users',
  patients: 'patients',
  visits: 'visit_planner',
  consultations: 'opd_consultations',
  admissions: 'ipd_admissions',
  diseases: 'disease_master',
  medicines: 'medicine_catalog',
  packages: 'treatment_packages',
  suppliers: 'suppliers',
  purchases: 'purchases',
  invoices: 'invoices',
}

function throwIfError(error, label) {
  if (error) {
    throw new Error(`${label}: ${error.message}`)
  }
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : []
}

function buildClinicPayload(data) {
  return {
    id: CLINIC_WORKSPACE_ID,
    name: data.clinic.name,
    location: data.clinic.location,
    contact: data.clinic.contact,
    current_user_id: data.currentUserId || null,
  }
}

function buildSettingsPayload(data) {
  return {
    clinic_id: CLINIC_WORKSPACE_ID,
    low_stock_threshold: Number(data.systemSettings.low_stock_threshold || 0),
    near_expiry_days: Number(data.systemSettings.near_expiry_days || 45),
    clinic_hours: data.systemSettings.clinic_hours || '',
    receipt_footer: data.systemSettings.receipt_footer || '',
    backup_note: data.systemSettings.backup_note || '',
    supported_units: normalizeArray(data.systemSettings.supported_units),
  }
}

function mapRows(data) {
  return {
    users: data.users.map((user) => ({
      id: user.id,
      clinic_id: CLINIC_WORKSPACE_ID,
      auth_user_id: user.auth_user_id || null,
      name: user.name,
      email: user.email || '',
      role: user.role,
      status: user.status,
      phone: user.phone || '',
      shift: user.shift || '',
      allowed_views: normalizeArray(user.allowed_views),
    })),
    patients: data.patients.map((patient) => ({
      id: patient.id,
      clinic_id: CLINIC_WORKSPACE_ID,
      patient_id: patient.patient_id || '',
      name: patient.name,
      age: Number(patient.age || 0),
      gender: patient.gender || '',
      contact_details: patient.contact_details || '',
      email: patient.email || '',
      emergency_contact: patient.emergency_contact || '',
      address: patient.address || '',
      occupation: patient.occupation || '',
      past_illness_history: patient.past_illness_history || '',
      family_history: patient.family_history || '',
      allergy_history: patient.allergy_history || '',
      previous_ayurvedic_treatments: patient.previous_ayurvedic_treatments || '',
      current_medications: patient.current_medications || '',
      follow_up_date: patient.follow_up_date || null,
      visit_timeline: normalizeArray(patient.visit_timeline),
    })),
    visits: data.visitPlanner.map((visit) => ({
      id: visit.id,
      clinic_id: CLINIC_WORKSPACE_ID,
      patient_id: visit.patient_id || '',
      patient_name: visit.patient_name || '',
      doctor_name: visit.doctor_name || '',
      visit_type: visit.visit_type || '',
      appointment_date: visit.appointment_date || null,
      appointment_time: visit.appointment_time || '',
      status: visit.status || '',
      therapy_plan: visit.therapy_plan || '',
      queue_no: Number(visit.queue_no || 0),
      notes: visit.notes || '',
    })),
    consultations: data.opdConsultations.map((consultation) => ({
      id: consultation.id,
      clinic_id: CLINIC_WORKSPACE_ID,
      patient_id: consultation.patient_id || '',
      patient_name: consultation.patient_name || '',
      doctor_name: consultation.doctor_name || '',
      consultation_date: consultation.consultation_date || null,
      disease_template_id: consultation.disease_template_id || '',
      symptoms: consultation.symptoms || '',
      nadi_examination: consultation.nadi_examination || '',
      diagnosis: consultation.diagnosis || '',
      ayurvedic_assessment: consultation.ayurvedic_assessment || '',
      prescription: normalizeArray(consultation.prescription),
      diet_recommendations: consultation.diet_recommendations || '',
      lifestyle_recommendations: consultation.lifestyle_recommendations || '',
      panchakarma_recommendation: consultation.panchakarma_recommendation || '',
      follow_up_date: consultation.follow_up_date || null,
      consultation_notes: consultation.consultation_notes || '',
      billing: consultation.billing || {},
    })),
    admissions: data.ipdAdmissions.map((admission) => ({
      id: admission.id,
      clinic_id: CLINIC_WORKSPACE_ID,
      patient_id: admission.patient_id || '',
      patient_name: admission.patient_name || '',
      doctor_name: admission.doctor_name || '',
      admission_date: admission.admission_date || null,
      bed_allocation: admission.bed_allocation || '',
      diagnosis: admission.diagnosis || '',
      daily_treatment_chart: normalizeArray(admission.daily_treatment_chart),
      panchakarma_schedule: normalizeArray(admission.panchakarma_schedule),
      medicine_administration: normalizeArray(admission.medicine_administration),
      diet_plan: admission.diet_plan || '',
      daily_progress: admission.daily_progress || '',
      discharge_summary: admission.discharge_summary || '',
      final_invoice: Number(admission.final_invoice || 0),
      status: admission.status || '',
    })),
    diseases: data.diseaseMaster.map((disease) => ({
      id: disease.id,
      clinic_id: CLINIC_WORKSPACE_ID,
      illness: disease.illness || '',
      recommended_medicines: normalizeArray(disease.recommended_medicines),
      diet_advice: disease.diet_advice || '',
      lifestyle_advice: disease.lifestyle_advice || '',
      notes: disease.notes || '',
    })),
    medicines: data.medicineCatalog.map((medicine) => ({
      id: medicine.id,
      clinic_id: CLINIC_WORKSPACE_ID,
      medicine_name: medicine.medicine_name || '',
      category: medicine.category || '',
      purchase_unit: medicine.purchase_unit || '',
      dispensing_unit: medicine.dispensing_unit || '',
      unit_conversion: medicine.unit_conversion || '',
      batch_number: medicine.batch_number || '',
      purchase_price: Number(medicine.purchase_price || 0),
      selling_price: Number(medicine.selling_price || 0),
      current_stock: Number(medicine.current_stock || 0),
      low_stock_level: Number(medicine.low_stock_level || 0),
      expiry_date: medicine.expiry_date || null,
      manufacturer: medicine.manufacturer || '',
      supplier_id: medicine.supplier_id || '',
      monthly_movement: Number(medicine.monthly_movement || 0),
    })),
    packages: data.packages.map((item) => ({
      id: item.id,
      clinic_id: CLINIC_WORKSPACE_ID,
      name: item.name || '',
      included_medicines: normalizeArray(item.included_medicines),
      consultation_frequency: item.consultation_frequency || '',
      follow_up_schedule: item.follow_up_schedule || '',
      therapy_sessions: Number(item.therapy_sessions || 0),
      panchakarma_sessions: Number(item.panchakarma_sessions || 0),
      discount: item.discount || '',
      package_validity: item.package_validity || '',
      auto_renewal_reminder: item.auto_renewal_reminder || null,
    })),
    suppliers: data.suppliers.map((supplier) => ({
      id: supplier.id,
      clinic_id: CLINIC_WORKSPACE_ID,
      name: supplier.name || '',
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
    })),
    purchases: data.purchases.map((purchase) => ({
      id: purchase.id,
      clinic_id: CLINIC_WORKSPACE_ID,
      purchase_order_number: purchase.purchase_order_number || '',
      supplier_id: purchase.supplier_id || '',
      purchase_date: purchase.purchase_date || null,
      status: purchase.status || '',
      total_amount: Number(purchase.total_amount || 0),
      items: normalizeArray(purchase.items),
    })),
    invoices: data.invoices.map((invoice) => ({
      id: invoice.id,
      clinic_id: CLINIC_WORKSPACE_ID,
      invoice_number: invoice.invoice_number || '',
      patient_id: invoice.patient_id || '',
      patient_name: invoice.patient_name || '',
      bill_type: invoice.bill_type || '',
      consultation: Number(invoice.consultation || 0),
      medicines: Number(invoice.medicines || 0),
      treatment_packages: Number(invoice.treatment_packages || 0),
      panchakarma: Number(invoice.panchakarma || 0),
      therapies: Number(invoice.therapies || 0),
      discount: Number(invoice.discount || 0),
      total_amount: Number(invoice.total_amount || 0),
      paid_amount: Number(invoice.paid_amount || 0),
      payment_status: invoice.payment_status || '',
      created_at: invoice.created_at || null,
    })),
  }
}

function buildWorkspaceFromRows(rows, sessionUserId = null) {
  const users = rows.users.map((user) => ({
    id: user.id,
    auth_user_id: user.auth_user_id || null,
    name: user.name,
    email: user.email || '',
    role: user.role,
    status: user.status,
    phone: user.phone,
    shift: user.shift,
    allowed_views: normalizeArray(user.allowed_views),
  }))
  const sessionLinkedUser = sessionUserId
    ? users.find((user) => user.auth_user_id === sessionUserId)
    : null
  const emailLinkedUser = !sessionLinkedUser && rows.sessionEmail
    ? users.find((user) => String(user.email || '').toLowerCase() === rows.sessionEmail)
    : null

  return hydrateWorkspace({
    clinic: {
      name: rows.clinic?.name || fallbackEmrData.clinic.name,
      location: rows.clinic?.location || fallbackEmrData.clinic.location,
      contact: rows.clinic?.contact || fallbackEmrData.clinic.contact,
    },
    currentUserId:
      sessionLinkedUser?.id ||
      emailLinkedUser?.id ||
      rows.clinic?.current_user_id ||
      rows.users[0]?.id ||
      fallbackEmrData.currentUserId,
    users,
    patients: rows.patients.map((patient) => ({
      id: patient.id,
      patient_id: patient.patient_id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      contact_details: patient.contact_details,
      email: patient.email,
      emergency_contact: patient.emergency_contact,
      address: patient.address,
      occupation: patient.occupation,
      past_illness_history: patient.past_illness_history,
      family_history: patient.family_history,
      allergy_history: patient.allergy_history,
      previous_ayurvedic_treatments: patient.previous_ayurvedic_treatments,
      current_medications: patient.current_medications,
      follow_up_date: patient.follow_up_date,
      visit_timeline: normalizeArray(patient.visit_timeline),
    })),
    visitPlanner: rows.visits.map((visit) => ({
      id: visit.id,
      patient_id: visit.patient_id,
      patient_name: visit.patient_name,
      doctor_name: visit.doctor_name,
      visit_type: visit.visit_type,
      appointment_date: visit.appointment_date,
      appointment_time: visit.appointment_time,
      status: visit.status,
      therapy_plan: visit.therapy_plan,
      queue_no: visit.queue_no,
      notes: visit.notes,
    })),
    opdConsultations: rows.consultations.map((consultation) => ({
      id: consultation.id,
      patient_id: consultation.patient_id,
      patient_name: consultation.patient_name,
      doctor_name: consultation.doctor_name,
      consultation_date: consultation.consultation_date,
      disease_template_id: consultation.disease_template_id,
      symptoms: consultation.symptoms,
      nadi_examination: consultation.nadi_examination,
      diagnosis: consultation.diagnosis,
      ayurvedic_assessment: consultation.ayurvedic_assessment,
      prescription: normalizeArray(consultation.prescription),
      diet_recommendations: consultation.diet_recommendations,
      lifestyle_recommendations: consultation.lifestyle_recommendations,
      panchakarma_recommendation: consultation.panchakarma_recommendation,
      follow_up_date: consultation.follow_up_date,
      consultation_notes: consultation.consultation_notes,
      billing: consultation.billing || {},
    })),
    ipdAdmissions: rows.admissions.map((admission) => ({
      id: admission.id,
      patient_id: admission.patient_id,
      patient_name: admission.patient_name,
      doctor_name: admission.doctor_name,
      admission_date: admission.admission_date,
      bed_allocation: admission.bed_allocation,
      diagnosis: admission.diagnosis,
      daily_treatment_chart: normalizeArray(admission.daily_treatment_chart),
      panchakarma_schedule: normalizeArray(admission.panchakarma_schedule),
      medicine_administration: normalizeArray(admission.medicine_administration),
      diet_plan: admission.diet_plan,
      daily_progress: admission.daily_progress,
      discharge_summary: admission.discharge_summary,
      final_invoice: admission.final_invoice,
      status: admission.status,
    })),
    diseaseMaster: rows.diseases.map((disease) => ({
      id: disease.id,
      illness: disease.illness,
      recommended_medicines: normalizeArray(disease.recommended_medicines),
      diet_advice: disease.diet_advice,
      lifestyle_advice: disease.lifestyle_advice,
      notes: disease.notes,
    })),
    medicineCatalog: rows.medicines.map((medicine) => ({
      id: medicine.id,
      medicine_name: medicine.medicine_name,
      category: medicine.category,
      purchase_unit: medicine.purchase_unit,
      dispensing_unit: medicine.dispensing_unit,
      unit_conversion: medicine.unit_conversion,
      batch_number: medicine.batch_number,
      purchase_price: medicine.purchase_price,
      selling_price: medicine.selling_price,
      current_stock: medicine.current_stock,
      low_stock_level: medicine.low_stock_level,
      expiry_date: medicine.expiry_date,
      manufacturer: medicine.manufacturer,
      supplier_id: medicine.supplier_id,
      monthly_movement: medicine.monthly_movement,
    })),
    packages: rows.packages.map((item) => ({
      id: item.id,
      name: item.name,
      included_medicines: normalizeArray(item.included_medicines),
      consultation_frequency: item.consultation_frequency,
      follow_up_schedule: item.follow_up_schedule,
      therapy_sessions: item.therapy_sessions,
      panchakarma_sessions: item.panchakarma_sessions,
      discount: item.discount,
      package_validity: item.package_validity,
      auto_renewal_reminder: item.auto_renewal_reminder,
    })),
    suppliers: rows.suppliers.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      contact_person: supplier.contact_person,
      phone: supplier.phone,
      address: supplier.address,
    })),
    purchases: rows.purchases.map((purchase) => ({
      id: purchase.id,
      purchase_order_number: purchase.purchase_order_number,
      supplier_id: purchase.supplier_id,
      purchase_date: purchase.purchase_date,
      status: purchase.status,
      total_amount: purchase.total_amount,
      items: normalizeArray(purchase.items),
    })),
    invoices: rows.invoices.map((invoice) => ({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      patient_id: invoice.patient_id,
      patient_name: invoice.patient_name,
      bill_type: invoice.bill_type,
      consultation: invoice.consultation,
      medicines: invoice.medicines,
      treatment_packages: invoice.treatment_packages,
      panchakarma: invoice.panchakarma,
      therapies: invoice.therapies,
      discount: invoice.discount,
      total_amount: invoice.total_amount,
      paid_amount: invoice.paid_amount,
      payment_status: invoice.payment_status,
      created_at: invoice.created_at,
    })),
    systemSettings: {
      low_stock_threshold: rows.settings?.low_stock_threshold ?? fallbackEmrData.systemSettings.low_stock_threshold,
      near_expiry_days: rows.settings?.near_expiry_days ?? fallbackEmrData.systemSettings.near_expiry_days,
      clinic_hours: rows.settings?.clinic_hours || fallbackEmrData.systemSettings.clinic_hours,
      receipt_footer: rows.settings?.receipt_footer || fallbackEmrData.systemSettings.receipt_footer,
      backup_note: rows.settings?.backup_note || fallbackEmrData.systemSettings.backup_note,
      supported_units: normalizeArray(rows.settings?.supported_units),
    },
  })
}

async function replaceCollection(tableName, rows) {
  const { error: deleteError } = await supabase.from(tableName).delete().eq('clinic_id', CLINIC_WORKSPACE_ID)
  throwIfError(deleteError, `Failed clearing ${tableName}`)

  if (!rows.length) {
    return
  }

  const { error: insertError } = await supabase.from(tableName).insert(rows)
  throwIfError(insertError, `Failed saving ${tableName}`)
}

export async function saveSupabaseWorkspaceData(workspace) {
  if (!hasSupabaseConfig || !supabase) {
    return hydrateWorkspace(workspace)
  }

  const nextData = hydrateWorkspace(cloneData(workspace))
  const rows = mapRows(nextData)

  const { error: clinicError } = await supabase.from(TABLES.clinic).upsert(buildClinicPayload(nextData))
  throwIfError(clinicError, 'Failed saving clinic profile')

  const { error: settingsError } = await supabase.from(TABLES.settings).upsert(buildSettingsPayload(nextData))
  throwIfError(settingsError, 'Failed saving system settings')

  await replaceCollection(TABLES.users, rows.users)
  await replaceCollection(TABLES.patients, rows.patients)
  await replaceCollection(TABLES.visits, rows.visits)
  await replaceCollection(TABLES.consultations, rows.consultations)
  await replaceCollection(TABLES.admissions, rows.admissions)
  await replaceCollection(TABLES.diseases, rows.diseases)
  await replaceCollection(TABLES.medicines, rows.medicines)
  await replaceCollection(TABLES.packages, rows.packages)
  await replaceCollection(TABLES.suppliers, rows.suppliers)
  await replaceCollection(TABLES.purchases, rows.purchases)
  await replaceCollection(TABLES.invoices, rows.invoices)

  return nextData
}

export async function loadSupabaseWorkspaceData() {
  if (!hasSupabaseConfig || !supabase) {
    return null
  }

  const sessionUser = await getSupabaseSessionUser().catch(() => null)

  const [
    clinicResponse,
    settingsResponse,
    usersResponse,
    patientsResponse,
    visitsResponse,
    consultationsResponse,
    admissionsResponse,
    diseasesResponse,
    medicinesResponse,
    packagesResponse,
    suppliersResponse,
    purchasesResponse,
    invoicesResponse,
  ] = await Promise.all([
    supabase.from(TABLES.clinic).select('*').eq('id', CLINIC_WORKSPACE_ID).maybeSingle(),
    supabase.from(TABLES.settings).select('*').eq('clinic_id', CLINIC_WORKSPACE_ID).maybeSingle(),
    supabase.from(TABLES.users).select('*').eq('clinic_id', CLINIC_WORKSPACE_ID).order('name'),
    supabase.from(TABLES.patients).select('*').eq('clinic_id', CLINIC_WORKSPACE_ID).order('name'),
    supabase.from(TABLES.visits).select('*').eq('clinic_id', CLINIC_WORKSPACE_ID).order('appointment_date'),
    supabase.from(TABLES.consultations).select('*').eq('clinic_id', CLINIC_WORKSPACE_ID).order('consultation_date', { ascending: false }),
    supabase.from(TABLES.admissions).select('*').eq('clinic_id', CLINIC_WORKSPACE_ID).order('admission_date', { ascending: false }),
    supabase.from(TABLES.diseases).select('*').eq('clinic_id', CLINIC_WORKSPACE_ID).order('illness'),
    supabase.from(TABLES.medicines).select('*').eq('clinic_id', CLINIC_WORKSPACE_ID).order('medicine_name'),
    supabase.from(TABLES.packages).select('*').eq('clinic_id', CLINIC_WORKSPACE_ID).order('name'),
    supabase.from(TABLES.suppliers).select('*').eq('clinic_id', CLINIC_WORKSPACE_ID).order('name'),
    supabase.from(TABLES.purchases).select('*').eq('clinic_id', CLINIC_WORKSPACE_ID).order('purchase_date', { ascending: false }),
    supabase.from(TABLES.invoices).select('*').eq('clinic_id', CLINIC_WORKSPACE_ID).order('created_at', { ascending: false }),
  ])

  throwIfError(clinicResponse.error, 'Failed loading clinic profile')
  throwIfError(settingsResponse.error, 'Failed loading system settings')
  throwIfError(usersResponse.error, 'Failed loading users')
  throwIfError(patientsResponse.error, 'Failed loading patients')
  throwIfError(visitsResponse.error, 'Failed loading visits')
  throwIfError(consultationsResponse.error, 'Failed loading consultations')
  throwIfError(admissionsResponse.error, 'Failed loading admissions')
  throwIfError(diseasesResponse.error, 'Failed loading disease master')
  throwIfError(medicinesResponse.error, 'Failed loading medicine catalog')
  throwIfError(packagesResponse.error, 'Failed loading packages')
  throwIfError(suppliersResponse.error, 'Failed loading suppliers')
  throwIfError(purchasesResponse.error, 'Failed loading purchases')
  throwIfError(invoicesResponse.error, 'Failed loading invoices')

  const isEmptyWorkspace =
    !clinicResponse.data &&
    !settingsResponse.data &&
    !usersResponse.data?.length &&
    !patientsResponse.data?.length &&
    !visitsResponse.data?.length &&
    !consultationsResponse.data?.length &&
    !admissionsResponse.data?.length &&
    !diseasesResponse.data?.length &&
    !medicinesResponse.data?.length &&
    !packagesResponse.data?.length &&
    !suppliersResponse.data?.length &&
    !purchasesResponse.data?.length &&
    !invoicesResponse.data?.length

  if (isEmptyWorkspace) {
    return saveSupabaseWorkspaceData(fallbackEmrData)
  }

  return buildWorkspaceFromRows(
    {
      clinic: clinicResponse.data,
      sessionEmail: String(sessionUser?.email || '').toLowerCase(),
      settings: settingsResponse.data,
      users: usersResponse.data || [],
      patients: patientsResponse.data || [],
      visits: visitsResponse.data || [],
      consultations: consultationsResponse.data || [],
      admissions: admissionsResponse.data || [],
      diseases: diseasesResponse.data || [],
      medicines: medicinesResponse.data || [],
      packages: packagesResponse.data || [],
      suppliers: suppliersResponse.data || [],
      purchases: purchasesResponse.data || [],
      invoices: invoicesResponse.data || [],
    },
    sessionUser?.id || null,
  )
}

export async function resetSupabaseWorkspaceData() {
  if (!hasSupabaseConfig || !supabase) {
    return hydrateWorkspace(fallbackEmrData)
  }

  return saveSupabaseWorkspaceData(fallbackEmrData)
}
