import { buildFallbackClinicData } from '../data/fallback'

export function cloneData(data) {
  return JSON.parse(JSON.stringify(data))
}

export function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function getMonthPrefix(dateString) {
  return String(dateString || getToday()).slice(0, 7)
}

function daysUntil(dateString) {
  const today = new Date(getToday())
  const target = new Date(dateString)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

function sumInvoices(invoices, filterFn) {
  return invoices
    .filter(filterFn)
    .reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0)
}

function buildDashboard(data) {
  const today = getToday()
  const todaysAppointments = data.visitPlanner
    .filter((visit) => visit.appointment_date === today)
    .sort((left, right) =>
      `${left.appointment_date} ${left.appointment_time}`.localeCompare(
        `${right.appointment_date} ${right.appointment_time}`,
      ),
    )

  const admittedPatients = data.ipdAdmissions.filter((admission) => admission.status === 'Admitted')
  const lowStockMedicines = data.medicineCatalog.filter(
    (medicine) =>
      Number(medicine.current_stock || 0) > 0 &&
      Number(medicine.current_stock || 0) <= Number(medicine.low_stock_level || 0),
  )
  const expiringMedicines = data.medicineCatalog.filter((medicine) => {
    const remainingDays = daysUntil(medicine.expiry_date)
    return remainingDays >= 0 && remainingDays <= Number(data.systemSettings.near_expiry_days || 45)
  })
  const followUpPatients = data.patients
    .filter((patient) => patient.follow_up_date >= today)
    .sort((left, right) => String(left.follow_up_date).localeCompare(String(right.follow_up_date)))
    .slice(0, 6)
  const recentConsultations = [...data.opdConsultations]
    .sort((left, right) => String(right.consultation_date).localeCompare(String(left.consultation_date)))
    .slice(0, 5)

  return {
    todaysAppointments,
    opdPatientCount: todaysAppointments.filter((visit) => visit.visit_type !== 'Therapy Planning').length,
    ipdPatientCount: admittedPatients.length,
    revenueSummary: {
      today: sumInvoices(data.invoices, (invoice) => invoice.created_at === today),
      monthly: sumInvoices(
        data.invoices,
        (invoice) => getMonthPrefix(invoice.created_at) === getMonthPrefix(today),
      ),
      outstanding: data.invoices.reduce(
        (sum, invoice) =>
          sum + Math.max(0, Number(invoice.total_amount || 0) - Number(invoice.paid_amount || 0)),
        0,
      ),
    },
    lowStockMedicines,
    expiringMedicines,
    followUpPatients,
    recentConsultations,
    quickActions: [
      { key: 'VisitPlanner', label: 'Schedule Visit' },
      { key: 'OPD', label: 'New Consultation' },
      { key: 'Inventory', label: 'Stock Adjustment' },
      { key: 'Billing', label: 'Create Invoice' },
    ],
  }
}

function buildReports(data) {
  const today = getToday()
  const monthPrefix = getMonthPrefix(today)
  const lowStockCount = data.medicineCatalog.filter(
    (medicine) => Number(medicine.current_stock || 0) <= Number(medicine.low_stock_level || 0),
  ).length
  const expiryCount = data.medicineCatalog.filter((medicine) => daysUntil(medicine.expiry_date) <= 45).length

  return {
    dailyRevenue: sumInvoices(data.invoices, (invoice) => invoice.created_at === today),
    monthlyRevenue: sumInvoices(
      data.invoices,
      (invoice) => getMonthPrefix(invoice.created_at) === monthPrefix,
    ),
    patientVisits: data.visitPlanner.length,
    medicineSales: data.invoices.reduce((sum, invoice) => sum + Number(invoice.medicines || 0), 0),
    inventoryValue: data.medicineCatalog.reduce(
      (sum, medicine) => sum + Number(medicine.current_stock || 0) * Number(medicine.purchase_price || 0),
      0,
    ),
    lowStock: lowStockCount,
    expiry: expiryCount,
    packageSales: data.invoices.reduce((sum, invoice) => sum + Number(invoice.treatment_packages || 0), 0),
    opdStatistics: data.opdConsultations.length,
    ipdStatistics: data.ipdAdmissions.length,
  }
}

function buildNotifications(data) {
  const today = getToday()
  const upcomingAppointments = data.visitPlanner
    .filter((visit) => visit.appointment_date >= today && visit.status !== 'Cancelled')
    .sort((left, right) =>
      `${left.appointment_date} ${left.appointment_time}`.localeCompare(
        `${right.appointment_date} ${right.appointment_time}`,
      ),
    )
    .slice(0, 3)
    .map((visit) => ({
      id: `appointment-${visit.id}`,
      title: 'Upcoming appointment',
      message: `${visit.patient_name} is booked with ${visit.doctor_name} on ${visit.appointment_date} at ${visit.appointment_time}.`,
      type: 'appointment',
    }))

  const followUps = data.patients
    .filter((patient) => {
      const remainingDays = daysUntil(patient.follow_up_date)
      return remainingDays >= 0 && remainingDays <= 7
    })
    .slice(0, 3)
    .map((patient) => ({
      id: `followup-${patient.id}`,
      title: 'Follow-up reminder',
      message: `${patient.name} has follow-up due on ${patient.follow_up_date}.`,
      type: 'follow-up',
    }))

  const packageExpiry = data.packages
    .filter((item) => {
      const remainingDays = daysUntil(item.auto_renewal_reminder)
      return remainingDays >= 0 && remainingDays <= 21
    })
    .map((item) => ({
      id: `package-${item.id}`,
      title: 'Package expiry reminder',
      message: `${item.name} package renewal reminder is scheduled for ${item.auto_renewal_reminder}.`,
      type: 'package',
    }))

  const stockAlerts = data.medicineCatalog
    .filter(
      (medicine) =>
        Number(medicine.current_stock || 0) <= Number(medicine.low_stock_level || 0) ||
        daysUntil(medicine.expiry_date) <= Number(data.systemSettings.near_expiry_days || 45),
    )
    .slice(0, 4)
    .map((medicine) => ({
      id: `stock-${medicine.id}`,
      title: 'Stock warning',
      message: `${medicine.medicine_name} has stock ${medicine.current_stock} and expiry ${medicine.expiry_date}.`,
      type: 'inventory',
    }))

  return [...upcomingAppointments, ...followUps, ...packageExpiry, ...stockAlerts]
}

const fullAccess = [
  'Dashboard',
  'Patients',
  'VisitPlanner',
  'OPD',
  'IPD',
  'DiseaseMaster',
  'Medicines',
  'Packages',
  'Inventory',
  'Billing',
  'Reports',
  'Notifications',
  'Admin',
]

const roleAccessDefaults = {
  'Chief Ayurvedic Physician': fullAccess,
  'Ayurvedic Consultant': [
    'Dashboard',
    'Patients',
    'VisitPlanner',
    'OPD',
    'IPD',
    'DiseaseMaster',
    'Medicines',
    'Packages',
    'Billing',
    'Reports',
    'Notifications',
  ],
  'Front Desk Coordinator': ['Dashboard', 'Patients', 'VisitPlanner', 'Billing', 'Notifications'],
  'Pharmacy Manager': ['Dashboard', 'Medicines', 'Inventory', 'Billing', 'Reports', 'Notifications'],
  'Clinic Administrator': fullAccess,
}

export function hydrateWorkspace(rawData) {
  const baseData = cloneData(rawData)
  const normalizedData = {
    ...baseData,
    clinic: {
      ...baseData.clinic,
      name: 'S.V. Kini Ayurvedic clinic',
      location: 'Mumbai, Maharashtra, India',
    },
    currentUserId: baseData.currentUserId || baseData.users?.[0]?.id || '',
    users: (baseData.users || []).map((user) => ({
      ...user,
      allowed_views:
        Array.isArray(user.allowed_views) && user.allowed_views.length
          ? user.allowed_views
          : roleAccessDefaults[user.role] || roleAccessDefaults['Front Desk Coordinator'],
    })),
    systemSettings: {
      ...baseData.systemSettings,
      receipt_footer: 'S.V. Kini Ayurvedic clinic, Mumbai, Maharashtra, India',
      backup_note: 'Local workspace backup for S.V. Kini Ayurvedic clinic.',
    },
  }

  return {
    ...normalizedData,
    dashboard: buildDashboard(normalizedData),
    reports: buildReports(normalizedData),
    notifications: buildNotifications(normalizedData),
  }
}

export function isClinicWorkspace(data) {
  return Boolean(
    data &&
      Array.isArray(data.patients) &&
      Array.isArray(data.visitPlanner) &&
      Array.isArray(data.opdConsultations) &&
      Array.isArray(data.ipdAdmissions) &&
      Array.isArray(data.medicineCatalog) &&
      Array.isArray(data.packages),
  )
}

export function buildHydratedFallbackWorkspace() {
  return hydrateWorkspace(buildFallbackClinicData())
}
