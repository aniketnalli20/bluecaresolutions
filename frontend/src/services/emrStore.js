import { fallbackEmrData } from '../data/fallback'

const STORAGE_KEY = 'bluecare-emr-workspace'

function cloneData(data) {
  return JSON.parse(JSON.stringify(data))
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function getMonthPrefix(dateString) {
  return String(dateString || getToday()).slice(0, 7)
}

function sortByNewest(left, right, field) {
  return String(right[field] || '').localeCompare(String(left[field] || ''))
}

function buildDashboard(data) {
  const today = getToday()
  const monthPrefix = getMonthPrefix(today)

  const todaysAppointments = data.appointments.filter(
    (appointment) => appointment.appointment_date === today,
  )

  const upcomingAppointments = [...data.appointments]
    .filter((appointment) => appointment.appointment_date >= today)
    .sort((left, right) =>
      `${left.appointment_date} ${left.appointment_time}`.localeCompare(
        `${right.appointment_date} ${right.appointment_time}`,
      ),
    )
    .slice(0, 5)

  const recentPatients = [...data.patients]
    .sort((left, right) => sortByNewest(left, right, 'updated_at'))
    .slice(0, 5)
    .map((patient) => ({
      id: patient.id,
      full_name: patient.full_name,
      activity:
        patient.conditions?.trim() ||
        patient.medical_history?.trim() ||
        'Profile reviewed and ready for the next visit.',
      updated_at: patient.updated_at || today,
    }))

  const monthlyRevenue = data.invoices
    .filter((invoice) => getMonthPrefix(invoice.created_at) === monthPrefix)
    .reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0)

  return {
    totalPatients: data.patients.length,
    todaysAppointments: todaysAppointments.length,
    activeDoctors: data.doctors.filter((doctor) => doctor.status === 'Active').length,
    monthlyRevenue,
    upcomingAppointments,
    recentPatients,
  }
}

function buildReports(data) {
  const totalCollected = data.invoices.reduce(
    (sum, invoice) => sum + Number(invoice.paid_amount || 0),
    0,
  )
  const outstanding = data.invoices.reduce(
    (sum, invoice) =>
      sum + (Number(invoice.total_amount || 0) - Number(invoice.paid_amount || 0)),
    0,
  )
  const averageInvoice = data.invoices.length
    ? Math.round(
        data.invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0) /
          data.invoices.length,
      )
    : 0

  return {
    patientReport: [
      { label: 'New patients this month', value: data.patients.length },
      {
        label: 'Patients with follow-up due',
        value: data.appointments.filter((appointment) => appointment.status === 'Scheduled').length,
      },
      {
        label: 'Patients with allergies recorded',
        value: data.patients.filter((patient) => patient.allergies && patient.allergies !== 'None').length,
      },
    ],
    appointmentReport: [
      {
        label: 'Completed appointments',
        value: data.appointments.filter((appointment) => appointment.status === 'Completed').length,
      },
      {
        label: 'Cancelled appointments',
        value: data.appointments.filter((appointment) => appointment.status === 'Cancelled').length,
      },
      {
        label: 'Checked in today',
        value: data.appointments.filter((appointment) => appointment.status === 'Checked In').length,
      },
    ],
    revenueReport: [
      { label: 'Collected revenue', value: totalCollected },
      { label: 'Outstanding balance', value: outstanding },
      { label: 'Average invoice value', value: averageInvoice },
    ],
    doctorActivityReport: data.doctors.map((doctor) => ({
      label: doctor.full_name,
      value: data.consultations.filter((consultation) => consultation.doctor_id === doctor.id).length,
    })),
  }
}

function buildNotifications(data) {
  const today = getToday()
  const items = []

  const upcoming = data.appointments
    .filter((appointment) => appointment.appointment_date >= today)
    .sort((left, right) =>
      `${left.appointment_date} ${left.appointment_time}`.localeCompare(
        `${right.appointment_date} ${right.appointment_time}`,
      ),
    )
    .slice(0, 2)

  upcoming.forEach((appointment, index) => {
    items.push({
      id: index + 1,
      title: 'Upcoming visit',
      message: `${appointment.patient_name} is booked with ${appointment.doctor_name} at ${appointment.appointment_time}.`,
      type: 'appointment',
    })
  })

  const followUp = data.patients.find((patient) => patient.conditions)
  if (followUp) {
    items.push({
      id: items.length + 1,
      title: 'Follow-up reminder',
      message: `${followUp.full_name} needs a review for ${followUp.conditions}.`,
      type: 'follow-up',
    })
  }

  const pendingInvoice = data.invoices.find(
    (invoice) => Number(invoice.total_amount || 0) > Number(invoice.paid_amount || 0),
  )
  if (pendingInvoice) {
    items.push({
      id: items.length + 1,
      title: 'Payment reminder',
      message: `${pendingInvoice.patient_name} still has a balance on ${pendingInvoice.invoice_number}.`,
      type: 'billing',
    })
  }

  return items
}

function hydrateWorkspace(rawData) {
  const data = cloneData(rawData)

  return {
    ...data,
    dashboard: buildDashboard(data),
    reports: buildReports(data),
    notifications: buildNotifications(data),
  }
}

function saveWorkspace(data) {
  const hydrated = hydrateWorkspace(data)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(hydrated))
  return hydrated
}

export async function loadWorkspaceData() {
  const saved = localStorage.getItem(STORAGE_KEY)

  if (!saved) {
    return saveWorkspace(fallbackEmrData)
  }

  try {
    return hydrateWorkspace(JSON.parse(saved))
  } catch {
    return saveWorkspace(fallbackEmrData)
  }
}

export async function createRecord(collection, payload) {
  const workspace = await loadWorkspaceData()
  const items = workspace[collection] || []
  const record = { id: nextId(items), ...payload }

  return {
    record,
    data: saveWorkspace({
      ...workspace,
      [collection]: [record, ...items],
    }),
  }
}

export async function updateRecord(collection, id, payload) {
  const workspace = await loadWorkspaceData()
  const items = workspace[collection] || []
  const updatedItems = items.map((item) => (item.id === id ? { ...item, ...payload } : item))

  return {
    record: updatedItems.find((item) => item.id === id),
    data: saveWorkspace({
      ...workspace,
      [collection]: updatedItems,
    }),
  }
}

export async function resetWorkspaceData() {
  localStorage.removeItem(STORAGE_KEY)
  return saveWorkspace(fallbackEmrData)
}

function nextId(items) {
  return items.reduce((maxId, item) => Math.max(maxId, Number(item.id || 0)), 0) + 1
}
