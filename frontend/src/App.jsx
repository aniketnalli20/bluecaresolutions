import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadWorkspaceData, resetWorkspaceData, saveWorkspaceData } from './services/emrStore'
import {
  getSupabaseSession,
  getClinicAuthUsers,
  hasSupabaseConfig,
  onSupabaseAuthStateChange,
  sendClinicPasswordReset,
  signInWithClinicPassword,
  signOutClinicUser,
  signUpClinicUser,
  updateClinicUserPassword,
} from './services/supabaseClient'
import './App.css'

const navItems = [
  { key: 'Dashboard', label: 'Dashboard' },
  { key: 'Patients', label: 'Patients' },
  { key: 'VisitPlanner', label: 'Visit Planner' },
  { key: 'OPD', label: 'OPD' },
  { key: 'IPD', label: 'IPD' },
  { key: 'DiseaseMaster', label: 'Disease Master' },
  { key: 'Medicines', label: 'Medicine Catalog' },
  { key: 'Packages', label: 'Packages' },
  { key: 'Inventory', label: 'Inventory' },
  { key: 'Billing', label: 'Billing' },
  { key: 'Reports', label: 'Reports' },
  { key: 'Notifications', label: 'Notifications' },
  { key: 'Admin', label: 'Clinic Admin' },
]

const fullAccessKeys = navItems.map((item) => item.key)
const userAccessOptions = navItems.map(({ key, label }) => ({ key, label }))
const roleAccessDefaults = {
  'Chief Ayurvedic Physician': fullAccessKeys,
  'Ayurvedic Consultant': ['Dashboard', 'Patients', 'VisitPlanner', 'OPD', 'IPD', 'DiseaseMaster', 'Medicines', 'Packages', 'Billing', 'Reports', 'Notifications'],
  'Front Desk Coordinator': ['Dashboard', 'Patients', 'VisitPlanner', 'Billing', 'Notifications'],
  'Pharmacy Manager': ['Dashboard', 'Medicines', 'Inventory', 'Billing', 'Reports', 'Notifications'],
  'Clinic Administrator': fullAccessKeys,
}

const appointmentStatuses = ['Scheduled', 'Checked In', 'Completed', 'Cancelled']
const visitTypes = ['Appointment', 'Walk-in', 'Follow-up', 'Therapy Planning']
const genders = ['Female', 'Male', 'Other']
const inventoryActions = ['Stock In', 'Stock Out', 'Stock Adjustment', 'Physical Verification']
const complaintChecklist = [
  'Dengue',
  'Malaria',
  'Typhoid',
  'Jaundice',
  'Measles',
  'Chickenpox',
  'Piles (Hemorrhoids)',
  'Urinary Stones (Ashmari)',
  'Asthma',
  'Soil Eating Habit (Pica / Mridbhakshan)',
  'H.T. (Hypertension)',
  'D.M. (Diabetes Mellitus)',
  'T.B. (Tuberculosis)',
]
const emptyList = []
const emptyObject = {}

const initialPatientForm = {
  name: '',
  age: '',
  gender: 'Female',
  contact_details: '',
  email: '',
  emergency_contact: '',
  address: '',
  occupation: '',
  past_illness_history: '',
  family_history: '',
  allergy_history: '',
  previous_ayurvedic_treatments: '',
  current_medications: '',
  follow_up_date: '',
}

const initialVisitForm = {
  patient_id: '',
  patient_name: '',
  doctor_name: 'Dr. Kavya Iyer',
  visit_type: 'Appointment',
  appointment_date: '',
  appointment_time: '',
  status: 'Scheduled',
  therapy_plan: '',
  notes: '',
}

const initialConsultationForm = {
  patient_id: '',
  doctor_name: 'Dr. Kavya Iyer',
  consultation_date: '',
  disease_template_id: '',
  symptoms: '',
  nadi_examination: '',
  diagnosis: '',
  ayurvedic_assessment: '',
  prescription_text: '',
  diet_recommendations: '',
  lifestyle_recommendations: '',
  panchakarma_recommendation: '',
  follow_up_date: '',
  consultation_notes: '',
  consultation_charge: '',
  medicine_charge: '',
  package_charge: '',
  panchakarma_charge: '',
  therapies_charge: '',
  payment_status: 'Pending',
}

const initialAdmissionForm = {
  patient_id: '',
  record_date: '',
  patient_name: '',
  place_of_birth: '',
  age: '',
  gender: 'Female',
  date_of_birth: '',
  occupation: '',
  mobile_no: '',
  email_id: '',
  pulse_nadi: '',
  tongue_jivha: '',
  chief_complaints: '',
  complaint_flags: [],
  drug_allergy: '',
  drug_reaction: '',
  thyroid_disorder: '',
  menstrual_history: '',
  obstetric_history: '',
  weight: '',
  doctor_name: 'Dr. Rohan Sharma',
  admission_date: '',
  bed_allocation: '',
  diagnosis: '',
  treatment_notes: '',
  panchakarma_schedule: '',
  medicine_administration: '',
  diet_plan: '',
  daily_progress: '',
  discharge_summary: '',
  final_invoice: '',
  status: 'Admitted',
}

const initialMedicineForm = {
  medicine_name: '',
  category: 'Classical Medicines',
  purchase_unit: 'Bottle',
  dispensing_unit: 'Tablet',
  unit_conversion: '',
  batch_number: '',
  purchase_price: '',
  selling_price: '',
  current_stock: '',
  low_stock_level: '',
  expiry_date: '',
  manufacturer: '',
  supplier_id: '',
  monthly_movement: '',
}

const initialInvoiceForm = {
  patient_id: '',
  bill_type: 'Consultation',
  consultation: '',
  medicines: '',
  treatment_packages: '',
  panchakarma: '',
  therapies: '',
  discount: '',
  paid_amount: '',
  payment_status: 'Pending',
  created_at: '',
}

const initialInventoryForm = {
  medicine_id: '',
  action: 'Stock In',
  quantity: '',
}

const initialUserForm = {
  name: '',
  email: '',
  role: 'Front Desk Coordinator',
  status: 'Active',
  phone: '',
  shift: '',
  allowed_views: roleAccessDefaults['Front Desk Coordinator'],
}

const initialSupplierForm = {
  name: '',
  contact_person: '',
  phone: '',
  address: '',
}

const initialPurchaseForm = {
  supplier_id: '',
  purchase_date: '',
  status: 'Pending Receipt',
  total_amount: '',
  items_text: '',
}

const initialPackageForm = {
  name: '',
  included_medicines: '',
  consultation_frequency: '',
  follow_up_schedule: '',
  therapy_sessions: '',
  panchakarma_sessions: '',
  discount: '',
  package_validity: '',
  auto_renewal_reminder: '',
}

const initialDiseaseForm = {
  illness: '',
  medicines_text: '',
  diet_advice: '',
  lifestyle_advice: '',
  notes: '',
}

const initialSettingsForm = {
  clinic_name: '',
  clinic_location: '',
  clinic_contact: '',
  clinic_hours: '',
  near_expiry_days: '',
  low_stock_threshold: '',
  receipt_footer: '',
  backup_note: '',
}

const adminSections = [
  { key: 'overview', label: 'Dashboard' },
  { key: 'users', label: 'User Management' },
  { key: 'medicines', label: 'Medicine Master' },
  { key: 'diseases', label: 'Disease Master' },
  { key: 'units', label: 'Unit Management' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'suppliers', label: 'Supplier Management' },
  { key: 'purchases', label: 'Purchase Management' },
  { key: 'packages', label: 'Package Management' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'System Settings' },
  { key: 'backup', label: 'Backup & Restore' },
]

const seededAccessProfiles = [
  {
    fullName: 'Clinic Administrator',
    email: 'admin@svkini.clinic',
    role: 'Clinic Administrator',
    note: 'Use this for the first full-access admin account setup.',
  },
  {
    fullName: 'Dr. Kavya Iyer',
    email: 'kavya.iyer@svkini.clinic',
    role: 'Chief Ayurvedic Physician',
    note: 'Doctor access with clinical and admin workspace permissions.',
  },
  {
    fullName: 'Anjali Das',
    email: 'anjali.das@svkini.clinic',
    role: 'Front Desk Coordinator',
    note: 'Front desk access for patients, visits, billing, and reminders.',
  },
]

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getDefaultAccess(role) {
  return roleAccessDefaults[role] || ['Dashboard', 'Patients', 'VisitPlanner', 'OPD', 'Billing', 'Notifications']
}

function normalizeAccessList(access, role) {
  const source = Array.isArray(access) ? access : String(access || '').split(/[|,]/)
  const normalized = source
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item) => fullAccessKeys.includes(item))
  return normalized.length ? Array.from(new Set(normalized)) : getDefaultAccess(role)
}

function createRecordId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function createPatientCode(patients) {
  return `AYU-${String(1000 + patients.length + 1)}`
}

function createInvoiceNumber(invoices) {
  return `INV-AYU-${String(invoices.length + 1).padStart(3, '0')}`
}

function createPurchaseOrderNumber(purchases) {
  return `PO-AYU-${String(purchases.length + 101).padStart(3, '0')}`
}

function createQueueNumber(visits, appointmentDate) {
  return visits.filter((visit) => visit.appointment_date === appointmentDate).length + 1
}

function daysUntil(dateValue) {
  if (!dateValue) {
    return 0
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateValue)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

function getMedicineAlert(medicine, nearExpiryDays) {
  const stock = Number(medicine.current_stock || 0)
  const lowStockLevel = Number(medicine.low_stock_level || 0)
  const expiryDays = daysUntil(medicine.expiry_date)

  if (stock <= 0) return 'out'
  if (expiryDays < 0) return 'expired'
  if (expiryDays <= nearExpiryDays) return 'near-expiry'
  if (stock <= lowStockLevel) return 'low'
  if (Number(medicine.monthly_movement || 0) <= 10) return 'slow'
  return 'healthy'
}

function parsePrescription(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [medicine, dosage, schedule, foodRelation, duration, quantity] = line
        .split('|')
        .map((part) => part.trim())
      return {
        medicine: medicine || 'Ayurvedic Medicine',
        dosage: dosage || '-',
        schedule: schedule || '-',
        food_relation: foodRelation || '-',
        duration: duration || '-',
        quantity: quantity || '-',
      }
    })
}

function serializePrescription(template) {
  return template
    .map(
      (item) =>
        `${item.medicine} | ${item.dosage} | ${item.schedule} | ${item.food_relation} | ${item.duration} | ${item.quantity}`,
    )
    .join('\n')
}

function normalizeCsvHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function splitCsvRow(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

function parseCsvText(text) {
  const lines = String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return []
  }

  const headers = splitCsvRow(lines[0]).map(normalizeCsvHeader)
  return lines.slice(1).map((line) => {
    const cells = splitCsvRow(line)
    return headers.reduce((record, header, index) => {
      record[header] = cells[index] ?? ''
      return record
    }, {})
  })
}

function getCsvValue(row, keys, fallback = '') {
  for (const key of keys) {
    const value = row[normalizeCsvHeader(key)]
    if (value !== undefined && String(value).trim() !== '') {
      return String(value).trim()
    }
  }

  return fallback
}

function parseCsvNumber(value, fallback = 0) {
  const numeric = Number(String(value || '').replace(/,/g, '').trim())
  return Number.isFinite(numeric) ? numeric : fallback
}

function parseCsvList(value, separator = /[;,]/) {
  return String(value || '')
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseCsvDate(value, fallback = '') {
  const raw = String(value || '').trim()
  if (!raw) {
    return fallback
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return fallback
  }

  return parsed.toISOString().slice(0, 10)
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function getAuthFlowType() {
  const searchParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return hashParams.get('type') || searchParams.get('type') || ''
}

function App() {
  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authSession, setAuthSession] = useState(null)
  const [authReady, setAuthReady] = useState(!hasSupabaseConfig)
  const [authMode, setAuthMode] = useState('sign-in')
  const [authBusy, setAuthBusy] = useState(false)
  const [authNotice, setAuthNotice] = useState('')
  const [authError, setAuthError] = useState('')
  const [authDirectory, setAuthDirectory] = useState([])
  const [authDirectoryLoading, setAuthDirectoryLoading] = useState(true)
  const [rememberMe, setRememberMe] = useState(false)
  const [authForm, setAuthForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    resetEmail: '',
    nextPassword: '',
    confirmNextPassword: '',
  })
  const [activeView, setActiveView] = useState('Dashboard')
  const [theme, setTheme] = useState(() => localStorage.getItem('bluecare-clinic-theme') || 'light')
  const [toast, setToast] = useState(null)
  const [patientQuery, setPatientQuery] = useState('')
  const [patientFilter, setPatientFilter] = useState('All')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [selectedConsultationId, setSelectedConsultationId] = useState('')
  const [selectedAdmissionId, setSelectedAdmissionId] = useState('')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('')
  const [activeAdminSection, setActiveAdminSection] = useState('overview')
  const [backupText, setBackupText] = useState('')
  const [patientForm, setPatientForm] = useState(initialPatientForm)
  const [visitForm, setVisitForm] = useState(initialVisitForm)
  const [consultationForm, setConsultationForm] = useState(initialConsultationForm)
  const [admissionForm, setAdmissionForm] = useState(initialAdmissionForm)
  const [medicineForm, setMedicineForm] = useState(initialMedicineForm)
  const [invoiceForm, setInvoiceForm] = useState(initialInvoiceForm)
  const [inventoryForm, setInventoryForm] = useState(initialInventoryForm)
  const [userForm, setUserForm] = useState(initialUserForm)
  const [supplierForm, setSupplierForm] = useState(initialSupplierForm)
  const [purchaseForm, setPurchaseForm] = useState(initialPurchaseForm)
  const [packageForm, setPackageForm] = useState(initialPackageForm)
  const [diseaseForm, setDiseaseForm] = useState(initialDiseaseForm)
  const [settingsForm, setSettingsForm] = useState(initialSettingsForm)
  const [unitName, setUnitName] = useState('')
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setAuthReady(true)
      return undefined
    }

    let isActive = true

    async function bootstrapAuth() {
      try {
        const session = await getSupabaseSession()
        if (!isActive) {
          return
        }

        setAuthSession(session)
        if (session && getAuthFlowType() === 'recovery') {
          setAuthMode('update-password')
        }
      } catch (error) {
        if (!isActive) {
          return
        }

        setAuthError(error instanceof Error ? error.message : 'Unable to initialize authentication.')
      } finally {
        if (isActive) {
          setAuthReady(true)
        }
      }
    }

    bootstrapAuth()

    const { data } = onSupabaseAuthStateChange((session) => {
      if (!isActive) {
        return
      }

      setAuthSession(session)
      setAuthError('')

      if (session) {
        if (getAuthFlowType() === 'recovery') {
          setAuthMode('update-password')
        }
        return
      }

      setAuthMode('sign-in')
      setWorkspace(null)
      setLoading(false)
      setGlobalSearchOpen(false)
      setGlobalSearchQuery('')
      setSelectedPatientId('')
      setSelectedConsultationId('')
      setSelectedAdmissionId('')
      setSelectedInvoiceId('')
    })

    return () => {
      isActive = false
      data.subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!authReady) {
      return undefined
    }

    if (hasSupabaseConfig && !authSession) {
      setLoading(false)
      return undefined
    }

    let isCancelled = false
    setLoading(true)

    async function hydrate() {
      try {
        const data = await loadWorkspaceData()
        if (isCancelled) {
          return
        }

        setWorkspace(data)
        setSelectedPatientId(data.patients[0]?.id || '')
        setSelectedConsultationId(data.opdConsultations[0]?.id || '')
        setSelectedAdmissionId(data.ipdAdmissions[0]?.id || '')
        setSelectedInvoiceId(data.invoices[0]?.id || '')
      } catch (error) {
        if (isCancelled) {
          return
        }

        const message = error instanceof Error ? error.message : 'Workspace load failed.'
        if (hasSupabaseConfig) {
          setAuthError(message)
        } else {
          setToast({ message, tone: 'error' })
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    hydrate()

    return () => {
      isCancelled = true
    }
  }, [authReady, authSession?.user?.id])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('bluecare-clinic-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timer = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setGlobalSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const persistWorkspace = useCallback(async (nextWorkspace, message, tone = 'success') => {
    const saved = await saveWorkspaceData(nextWorkspace)
    setWorkspace(saved)
    setToast({ message, tone })
  }, [])

  const loadAuthDirectory = useCallback(async () => {
    if (!hasSupabaseConfig) {
      setAuthDirectoryLoading(false)
      return
    }

    setAuthDirectoryLoading(true)

    try {
      const users = await getClinicAuthUsers()
      setAuthDirectory(users)
    } catch (error) {
      console.error('Unable to load backend auth users.', error)
    } finally {
      setAuthDirectoryLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAuthDirectory()
  }, [loadAuthDirectory])

  const patients = workspace?.patients ?? emptyList
  const visits = workspace?.visitPlanner ?? emptyList
  const consultations = workspace?.opdConsultations ?? emptyList
  const ipdAdmissions = workspace?.ipdAdmissions ?? emptyList
  const diseaseMaster = workspace?.diseaseMaster ?? emptyList
  const medicineCatalog = workspace?.medicineCatalog ?? emptyList
  const packages = workspace?.packages ?? emptyList
  const purchases = workspace?.purchases ?? emptyList
  const suppliers = workspace?.suppliers ?? emptyList
  const users = workspace?.users ?? emptyList
  const invoices = workspace?.invoices ?? emptyList
  const notifications = workspace?.notifications ?? emptyList
  const reports = workspace?.reports ?? emptyObject
  const dashboard = workspace?.dashboard ?? emptyObject
  const clinic = workspace?.clinic ?? emptyObject
  const settings = workspace?.systemSettings ?? emptyObject
  const sessionUser = authSession?.user ?? null
  const sessionEmail = normalizeEmail(sessionUser?.email)
  const authenticatedClinicUser = useMemo(() => {
    if (!sessionUser) {
      return null
    }

    return (
      users.find((user) => user.auth_user_id === sessionUser.id) ||
      users.find((user) => normalizeEmail(user.email) === sessionEmail) ||
      null
    )
  }, [sessionEmail, sessionUser, users])
  const activeUser = useMemo(
    () =>
      hasSupabaseConfig && authSession
        ? authenticatedClinicUser
        : users.find((user) => user.id === workspace?.currentUserId) || users.find((user) => user.status === 'Active') || users[0] || null,
    [authenticatedClinicUser, authSession, users, workspace?.currentUserId],
  )
  const accessibleViewKeys = useMemo(
    () => (activeUser ? normalizeAccessList(activeUser.allowed_views, activeUser.role) : hasSupabaseConfig ? emptyList : fullAccessKeys),
    [activeUser],
  )
  const accessibleViewSet = useMemo(() => new Set(accessibleViewKeys), [accessibleViewKeys])
  const accessibleNavItems = useMemo(
    () => navItems.filter((item) => accessibleViewSet.has(item.key)),
    [accessibleViewSet],
  )
  const canSwitchUsers = !hasSupabaseConfig
  const resolvedActiveView = accessibleViewSet.has(activeView) ? activeView : accessibleNavItems[0]?.key || 'Dashboard'
  const administratorUsers = useMemo(
    () => users.filter((user) => ['Clinic Administrator', 'Chief Ayurvedic Physician'].includes(user.role)),
    [users],
  )
  const linkedAuthUsers = useMemo(() => users.filter((user) => user.auth_user_id), [users])
  const pendingAuthUsers = useMemo(
    () => users.filter((user) => user.email && !user.auth_user_id),
    [users],
  )
  const activeClinicUsers = useMemo(
    () => users.filter((user) => user.status === 'Active'),
    [users],
  )

  useEffect(() => {
    if (!hasSupabaseConfig || !workspace || !authenticatedClinicUser) {
      return
    }

    if (workspace.currentUserId === authenticatedClinicUser.id) {
      return
    }

    setWorkspace((current) =>
      current
        ? {
            ...current,
            currentUserId: authenticatedClinicUser.id,
          }
        : current,
    )
  }, [authenticatedClinicUser, workspace])

  useEffect(() => {
    if (!hasSupabaseConfig || !workspace || !sessionUser || !authenticatedClinicUser) {
      return undefined
    }

    if (authenticatedClinicUser.auth_user_id === sessionUser.id) {
      return undefined
    }

    if (normalizeEmail(authenticatedClinicUser.email) !== sessionEmail) {
      return undefined
    }

    let isCancelled = false

    async function syncAuthenticatedUser() {
      try {
        const nextWorkspace = {
          ...workspace,
          currentUserId: authenticatedClinicUser.id,
          users: workspace.users.map((user) =>
            user.id === authenticatedClinicUser.id
              ? {
                  ...user,
                  auth_user_id: sessionUser.id,
                }
              : user,
          ),
        }
        const saved = await saveWorkspaceData(nextWorkspace)
        if (!isCancelled) {
          setWorkspace(saved)
        }
      } catch (error) {
        console.error('Failed linking clinic user to authenticated account.', error)
      }
    }

    syncAuthenticatedUser()

    return () => {
      isCancelled = true
    }
  }, [authenticatedClinicUser, sessionEmail, sessionUser, workspace])

  const patientsById = useMemo(
    () => Object.fromEntries(patients.map((patient) => [patient.id, patient])),
    [patients],
  )

  const patientsByName = useMemo(
    () => Object.fromEntries(patients.map((patient) => [String(patient.name || '').trim().toLowerCase(), patient])),
    [patients],
  )

  const filteredPatients = useMemo(() => {
    const query = patientQuery.trim().toLowerCase()
    return patients.filter((patient) => {
      const matchesQuery =
        !query ||
        [patient.name, patient.patient_id, patient.contact_details, patient.occupation].some((value) =>
          String(value || '').toLowerCase().includes(query),
        )

      const matchesFilter =
        patientFilter === 'All' ||
        (patientFilter === 'Follow-up Due' && daysUntil(patient.follow_up_date) <= 7) ||
        (patientFilter === 'Allergy History' && patient.allergy_history)

      return matchesQuery && matchesFilter
    })
  }, [patientFilter, patientQuery, patients])

  const selectedPatient =
    patients.find((patient) => patient.id === selectedPatientId) || filteredPatients[0] || null
  const selectedConsultation =
    consultations.find((consultation) => consultation.id === selectedConsultationId) || consultations[0] || null
  const selectedAdmission =
    ipdAdmissions.find((admission) => admission.id === selectedAdmissionId) || ipdAdmissions[0] || null
  const selectedInvoice = invoices.find((invoice) => invoice.id === selectedInvoiceId) || invoices[0] || null

  const supplierNameById = useMemo(
    () => Object.fromEntries(suppliers.map((supplier) => [supplier.id, supplier.name])),
    [suppliers],
  )

  const clinicDoctors = useMemo(
    () =>
      users.filter((user) =>
        /physician|consultant|doctor/i.test(String(user.role || '')) || /^dr\./i.test(String(user.name || '')),
      ),
    [users],
  )

  const doctorDirectory = clinicDoctors.length ? clinicDoctors : users
  const currentImportTarget = useMemo(() => {
    if (resolvedActiveView === 'Admin') {
      const adminImports = {
        users: {
          key: 'users',
          label: 'Users',
          headers: 'name, email, role, status, phone, shift, allowed_views',
        },
        medicines: {
          key: 'medicines',
          label: 'Medicines',
          headers:
            'medicine_name, category, purchase_unit, dispensing_unit, unit_conversion, batch_number, purchase_price, selling_price, current_stock, low_stock_level, expiry_date, manufacturer, supplier_name, monthly_movement',
        },
        diseases: {
          key: 'diseases',
          label: 'Disease Templates',
          headers: 'illness, medicines_text, diet_advice, lifestyle_advice, notes',
        },
        suppliers: {
          key: 'suppliers',
          label: 'Suppliers',
          headers: 'name, contact_person, phone, address',
        },
        purchases: {
          key: 'purchases',
          label: 'Purchases',
          headers: 'supplier_name, purchase_date, status, total_amount, items_text',
        },
        packages: {
          key: 'packages',
          label: 'Packages',
          headers:
            'name, included_medicines, consultation_frequency, follow_up_schedule, therapy_sessions, panchakarma_sessions, discount, package_validity, auto_renewal_reminder',
        },
      }

      return adminImports[activeAdminSection] || null
    }

    const viewImports = {
      Patients: {
        key: 'patients',
        label: 'Patients',
        headers:
          'name, age, gender, contact_details, email, emergency_contact, address, occupation, past_illness_history, family_history, allergy_history, previous_ayurvedic_treatments, current_medications, follow_up_date',
      },
      VisitPlanner: {
        key: 'visits',
        label: 'Visit Planner',
        headers: 'patient_id, patient_name, doctor_name, visit_type, appointment_date, appointment_time, status, therapy_plan, notes',
      },
      OPD: {
        key: 'consultations',
        label: 'OPD Consultations',
        headers:
          'patient_id, patient_name, doctor_name, consultation_date, diagnosis, symptoms, nadi_examination, ayurvedic_assessment, prescription_text, diet_recommendations, lifestyle_recommendations, panchakarma_recommendation, follow_up_date, consultation_notes, consultation_charge, medicine_charge, package_charge, panchakarma_charge, therapies_charge, payment_status',
      },
      IPD: {
        key: 'admissions',
        label: 'IPD Admissions',
        headers:
          'patient_id, patient_name, doctor_name, admission_date, bed_allocation, diagnosis, treatment_notes, panchakarma_schedule, medicine_administration, diet_plan, daily_progress, discharge_summary, final_invoice, status',
      },
      DiseaseMaster: {
        key: 'diseases',
        label: 'Disease Templates',
        headers: 'illness, medicines_text, diet_advice, lifestyle_advice, notes',
      },
      Medicines: {
        key: 'medicines',
        label: 'Medicines',
        headers:
          'medicine_name, category, purchase_unit, dispensing_unit, unit_conversion, batch_number, purchase_price, selling_price, current_stock, low_stock_level, expiry_date, manufacturer, supplier_name, monthly_movement',
      },
      Packages: {
        key: 'packages',
        label: 'Packages',
        headers:
          'name, included_medicines, consultation_frequency, follow_up_schedule, therapy_sessions, panchakarma_sessions, discount, package_validity, auto_renewal_reminder',
      },
      Inventory: {
        key: 'medicines',
        label: 'Inventory Medicines',
        headers:
          'medicine_name, category, purchase_unit, dispensing_unit, unit_conversion, batch_number, purchase_price, selling_price, current_stock, low_stock_level, expiry_date, manufacturer, supplier_name, monthly_movement',
      },
      Billing: {
        key: 'invoices',
        label: 'Invoices',
        headers:
          'patient_id, patient_name, bill_type, consultation, medicines, treatment_packages, panchakarma, therapies, discount, paid_amount, payment_status, created_at',
      },
    }

    return viewImports[resolvedActiveView] || null
  }, [activeAdminSection, resolvedActiveView])

  const openView = useCallback(
    (viewKey) => {
      if (!accessibleViewSet.has(viewKey)) {
        const targetLabel = navItems.find((item) => item.key === viewKey)?.label || viewKey
        setToast({
          message: `${activeUser?.name || 'Selected user'} cannot access ${targetLabel}.`,
          tone: 'error',
        })
        return false
      }

      setActiveView(viewKey)
      return true
    },
    [accessibleViewSet, activeUser?.name],
  )

  const globalSearchResults = useMemo(() => {
    const query = globalSearchQuery.trim().toLowerCase()
    if (!query) {
      return []
    }

    const entries = [
      ...patients.map((patient) => ({
        id: `patient-${patient.id}`,
        viewKey: 'Patients',
        label: patient.name,
        subtitle: `${patient.patient_id} | ${patient.contact_details || 'No phone'} | Follow-up ${formatDate(patient.follow_up_date)}`,
        keywords: [patient.name, patient.patient_id, patient.contact_details, patient.occupation, patient.past_illness_history].join(' '),
        onSelect: () => setSelectedPatientId(patient.id),
      })),
      ...visits.map((visit) => ({
        id: `visit-${visit.id}`,
        viewKey: 'VisitPlanner',
        label: visit.patient_name,
        subtitle: `${visit.visit_type} | ${visit.appointment_date} ${visit.appointment_time} | ${visit.status}`,
        keywords: [visit.patient_name, visit.doctor_name, visit.visit_type, visit.status, visit.notes].join(' '),
      })),
      ...consultations.map((consultation) => ({
        id: `consultation-${consultation.id}`,
        viewKey: 'OPD',
        label: `${consultation.patient_name} - ${consultation.diagnosis}`,
        subtitle: `${consultation.doctor_name} | ${formatDate(consultation.consultation_date)}`,
        keywords: [
          consultation.patient_name,
          consultation.doctor_name,
          consultation.diagnosis,
          consultation.symptoms,
          consultation.consultation_notes,
        ].join(' '),
        onSelect: () => setSelectedConsultationId(consultation.id),
      })),
      ...ipdAdmissions.map((admission) => ({
        id: `admission-${admission.id}`,
        viewKey: 'IPD',
        label: `${admission.patient_name} - ${admission.bed_allocation}`,
        subtitle: `${admission.status} | ${admission.doctor_name}`,
        keywords: [admission.patient_name, admission.doctor_name, admission.diagnosis, admission.bed_allocation, admission.daily_progress].join(' '),
        onSelect: () => setSelectedAdmissionId(admission.id),
      })),
      ...diseaseMaster.map((item) => ({
        id: `disease-${item.id}`,
        viewKey: 'DiseaseMaster',
        label: item.illness,
        subtitle: item.diet_advice,
        keywords: [item.illness, item.diet_advice, item.lifestyle_advice, item.notes].join(' '),
      })),
      ...medicineCatalog.map((medicine) => ({
        id: `medicine-${medicine.id}`,
        viewKey: 'Medicines',
        label: medicine.medicine_name,
        subtitle: `${medicine.category} | Batch ${medicine.batch_number} | Stock ${medicine.current_stock}`,
        keywords: [medicine.medicine_name, medicine.category, medicine.batch_number, medicine.manufacturer].join(' '),
      })),
      ...packages.map((item) => ({
        id: `package-${item.id}`,
        viewKey: 'Packages',
        label: item.name,
        subtitle: `${item.consultation_frequency} | Validity ${item.package_validity}`,
        keywords: [item.name, item.consultation_frequency, item.follow_up_schedule, item.included_medicines.join(' ')].join(' '),
      })),
      ...invoices.map((invoice) => ({
        id: `invoice-${invoice.id}`,
        viewKey: 'Billing',
        label: invoice.invoice_number,
        subtitle: `${invoice.patient_name} | ${formatCurrency(invoice.total_amount)} | ${invoice.payment_status}`,
        keywords: [invoice.invoice_number, invoice.patient_name, invoice.bill_type, invoice.payment_status].join(' '),
        onSelect: () => setSelectedInvoiceId(invoice.id),
      })),
      ...users
        .filter(() => accessibleViewSet.has('Admin'))
        .map((user) => ({
          id: `user-${user.id}`,
          viewKey: 'Admin',
          label: user.name,
          subtitle: `${user.role} | ${user.status}`,
          keywords: [user.name, user.role, user.phone, user.shift].join(' '),
          onSelect: () => setActiveAdminSection('users'),
        })),
      ...suppliers
        .filter(() => accessibleViewSet.has('Admin'))
        .map((supplier) => ({
          id: `supplier-${supplier.id}`,
          viewKey: 'Admin',
          label: supplier.name,
          subtitle: `${supplier.contact_person} | ${supplier.phone}`,
          keywords: [supplier.name, supplier.contact_person, supplier.phone, supplier.address].join(' '),
          onSelect: () => setActiveAdminSection('suppliers'),
        })),
    ]

    return entries
      .filter((entry) => accessibleViewSet.has(entry.viewKey))
      .filter((entry) => `${entry.label} ${entry.subtitle} ${entry.keywords}`.toLowerCase().includes(query))
      .slice(0, 18)
  }, [
    accessibleViewSet,
    consultations,
    diseaseMaster,
    globalSearchQuery,
    invoices,
    ipdAdmissions,
    medicineCatalog,
    packages,
    patients,
    suppliers,
    users,
    visits,
  ])

  const selectAdminSection = useCallback(
    (sectionKey) => {
      setActiveAdminSection(sectionKey)
      if (sectionKey === 'settings') {
        setSettingsForm({
          clinic_name: clinic.name || '',
          clinic_location: clinic.location || '',
          clinic_contact: clinic.contact || '',
          clinic_hours: settings.clinic_hours || '',
          near_expiry_days: String(settings.near_expiry_days || ''),
          low_stock_threshold: String(settings.low_stock_threshold || ''),
          receipt_footer: settings.receipt_footer || '',
          backup_note: settings.backup_note || '',
        })
      }
    },
    [clinic.contact, clinic.location, clinic.name, settings],
  )

  const handleActiveUserChange = useCallback(
    (userId) => {
      if (hasSupabaseConfig) {
        setToast({
          message: 'User switching is disabled while secure sign-in is active.',
          tone: 'error',
        })
        return
      }

      persistWorkspace(
        {
          ...workspace,
          currentUserId: userId,
        },
        'Active user updated.',
      )
    },
    [persistWorkspace, workspace],
  )

  const handleUserAccessToggle = useCallback(
    (userId, viewKey) => {
      const nextUsers = users.map((user) => {
        if (user.id !== userId) {
          return user
        }

        const currentAccess = normalizeAccessList(user.allowed_views, user.role)
        const nextAccess = currentAccess.includes(viewKey)
          ? currentAccess.filter((item) => item !== viewKey)
          : [...currentAccess, viewKey]

        return {
          ...user,
          allowed_views: nextAccess.length ? nextAccess : [viewKey],
        }
      })

      persistWorkspace({ ...workspace, users: nextUsers }, 'User access updated.')
    },
    [persistWorkspace, users, workspace],
  )

  const handleAuthSignIn = useCallback(
    async (event) => {
      event.preventDefault()
      setAuthBusy(true)
      setAuthError('')
      setAuthNotice('')

      try {
        await signInWithClinicPassword(normalizeEmail(authForm.email), authForm.password)
        setAuthForm((current) => ({
          ...current,
          password: '',
        }))
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Sign-in failed.')
      } finally {
        setAuthBusy(false)
      }
    },
    [authForm.email, authForm.password],
  )

  const handleAuthSignUp = useCallback(
    async (event) => {
      event.preventDefault()
      setAuthBusy(true)
      setAuthError('')
      setAuthNotice('')

      try {
        const email = normalizeEmail(authForm.email)
        if (!authForm.fullName.trim()) {
          throw new Error('Enter the full name for this clinic account.')
        }
        if (!email) {
          throw new Error('Enter a valid email address.')
        }
        if (authForm.password.length < 8) {
          throw new Error('Password must be at least 8 characters long.')
        }
        if (authForm.password !== authForm.confirmPassword) {
          throw new Error('Password confirmation does not match.')
        }

        const { session } = await signUpClinicUser({
          email,
          password: authForm.password,
          fullName: authForm.fullName.trim(),
        })

        setAuthForm((current) => ({
          ...current,
          password: '',
          confirmPassword: '',
        }))

        await loadAuthDirectory()
        setAuthNotice('Account created successfully. You can now continue with your clinic access.')
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Account creation failed.')
      } finally {
        setAuthBusy(false)
      }
    },
    [authForm.confirmPassword, authForm.email, authForm.fullName, authForm.password, loadAuthDirectory],
  )

  const handleAuthPasswordReset = useCallback(
    async (event) => {
      event.preventDefault()
      setAuthBusy(true)
      setAuthError('')
      setAuthNotice('')

      try {
        const email = normalizeEmail(authForm.resetEmail || authForm.email)
        if (!email) {
          throw new Error('Enter the email address that should receive the reset link.')
        }

        await sendClinicPasswordReset(email)
        setAuthNotice('Password reset email sent. Open the link from your inbox to set a new password.')
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Password reset request failed.')
      } finally {
        setAuthBusy(false)
      }
    },
    [authForm.email, authForm.resetEmail],
  )

  const handleAuthPasswordUpdate = useCallback(
    async (event) => {
      event.preventDefault()
      setAuthBusy(true)
      setAuthError('')
      setAuthNotice('')

      try {
        if (authForm.nextPassword.length < 8) {
          throw new Error('New password must be at least 8 characters long.')
        }
        if (authForm.nextPassword !== authForm.confirmNextPassword) {
          throw new Error('New password confirmation does not match.')
        }

        await updateClinicUserPassword(authForm.nextPassword)
        window.history.replaceState({}, document.title, window.location.pathname)
        await signOutClinicUser()
        setAuthMode('sign-in')
        setAuthForm((current) => ({
          ...current,
          nextPassword: '',
          confirmNextPassword: '',
          password: '',
        }))
        setAuthNotice('Password updated. Sign in with your new password.')
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Password update failed.')
      } finally {
        setAuthBusy(false)
      }
    },
    [authForm.confirmNextPassword, authForm.nextPassword],
  )

  const handleSignOut = useCallback(async () => {
    setAuthBusy(true)
    setAuthError('')
    setAuthNotice('')

    try {
      await signOutClinicUser()
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Sign-out failed.')
    } finally {
      setAuthBusy(false)
    }
  }, [])

  const handlePrepareSeededAccess = useCallback((profile, mode = 'sign-up') => {
    setAuthMode(mode)
    setAuthError('')
    setAuthNotice(mode === 'sign-in' ? `Ready to sign in as ${profile.email}.` : `Ready to create access for ${profile.email}.`)
    setAuthForm((current) => ({
      ...current,
      fullName: profile.fullName,
      email: profile.email,
      resetEmail: profile.email,
      password: '',
      confirmPassword: '',
    }))
  }, [])

  const handlePrepareAdminTemplate = useCallback(() => {
    setUserForm({
      name: 'Clinic Administrator',
      email: 'admin@svkini.clinic',
      role: 'Clinic Administrator',
      status: 'Active',
      phone: '+91 ',
      shift: '08:00 - 18:00',
      allowed_views: [...fullAccessKeys],
    })
  }, [])

  const handleAdmissionPatientChange = useCallback(
    (patientId) => {
      const patient = patientsById[patientId]

      setAdmissionForm((current) => ({
        ...current,
        patient_id: patientId,
        patient_name: patient?.name || '',
        age: patient?.age || '',
        gender: patient?.gender || current.gender,
        occupation: patient?.occupation || '',
        mobile_no: patient?.contact_details || '',
        email_id: patient?.email || '',
        record_date: current.record_date || new Date().toISOString().slice(0, 10),
      }))
    },
    [patientsById],
  )

  const handleSearchSelection = useCallback(
    (entry) => {
      const opened = openView(entry.viewKey)
      if (!opened) {
        return
      }

      entry.onSelect?.()
      setGlobalSearchOpen(false)
      setGlobalSearchQuery('')
    },
    [openView],
  )

  const handleCsvImport = useCallback(() => {
    if (!currentImportTarget) {
      setToast({ message: 'CSV import is not available for this screen.', tone: 'error' })
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,text/csv'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        try {
          const rows = parseCsvText(String(reader.result || ''))
          if (!rows.length) {
            throw new Error('CSV must include a header row and at least one data row.')
          }

          const today = new Date().toISOString().slice(0, 10)
          let nextWorkspace = workspace
          let importedCount = 0

          switch (currentImportTarget.key) {
            case 'patients': {
              const importedPatients = rows.map((row, index) => ({
                id: createRecordId(`patient-import-${index}`),
                patient_id: getCsvValue(row, ['patient_id'], createPatientCode([...patients, ...Array(index).fill(null)])),
                name: getCsvValue(row, ['name', 'patient_name'], `Imported Patient ${index + 1}`),
                age: parseCsvNumber(getCsvValue(row, ['age']), 0),
                gender: getCsvValue(row, ['gender'], 'Female'),
                contact_details: getCsvValue(row, ['contact_details', 'phone', 'contact']),
                email: getCsvValue(row, ['email']),
                emergency_contact: getCsvValue(row, ['emergency_contact']),
                address: getCsvValue(row, ['address']),
                occupation: getCsvValue(row, ['occupation']),
                past_illness_history: getCsvValue(row, ['past_illness_history']),
                family_history: getCsvValue(row, ['family_history']),
                allergy_history: getCsvValue(row, ['allergy_history']),
                previous_ayurvedic_treatments: getCsvValue(row, ['previous_ayurvedic_treatments']),
                current_medications: getCsvValue(row, ['current_medications']),
                follow_up_date: parseCsvDate(getCsvValue(row, ['follow_up_date']), today),
                visit_timeline: [
                  {
                    date: today,
                    title: 'Imported from CSV',
                    detail: 'Patient profile imported into the clinic workspace.',
                  },
                ],
              }))

              nextWorkspace = { ...workspace, patients: [...importedPatients, ...patients] }
              importedCount = importedPatients.length
              if (importedPatients[0]) {
                setSelectedPatientId(importedPatients[0].id)
              }
              break
            }
            case 'visits': {
              const runningVisits = [...visits]
              const importedVisits = rows.map((row, index) => {
                const patientId = getCsvValue(row, ['patient_id'])
                const patientName = getCsvValue(row, ['patient_name', 'name'])
                const linkedPatient = patientsById[patientId] || patientsByName[patientName.toLowerCase()]
                const appointmentDate = parseCsvDate(getCsvValue(row, ['appointment_date']), today)
                const record = {
                  id: createRecordId(`visit-import-${index}`),
                  patient_id: linkedPatient?.id || patientId,
                  patient_name: linkedPatient?.name || patientName || 'Walk-in Patient',
                  doctor_name: getCsvValue(row, ['doctor_name'], doctorDirectory[0]?.name || 'Clinic Doctor'),
                  visit_type: getCsvValue(row, ['visit_type'], 'Appointment'),
                  appointment_date: appointmentDate,
                  appointment_time: getCsvValue(row, ['appointment_time'], '09:00'),
                  status: getCsvValue(row, ['status'], 'Scheduled'),
                  therapy_plan: getCsvValue(row, ['therapy_plan']),
                  queue_no: createQueueNumber(runningVisits, appointmentDate),
                  notes: getCsvValue(row, ['notes']),
                }
                runningVisits.push(record)
                return record
              })

              nextWorkspace = { ...workspace, visitPlanner: [...importedVisits, ...visits] }
              importedCount = importedVisits.length
              break
            }
            case 'consultations': {
              const importedConsultations = rows.map((row, index) => {
                const patientId = getCsvValue(row, ['patient_id'])
                const patientName = getCsvValue(row, ['patient_name', 'name'])
                const linkedPatient = patientsById[patientId] || patientsByName[patientName.toLowerCase()]
                const consultation = {
                  id: createRecordId(`opd-import-${index}`),
                  patient_id: linkedPatient?.id || patientId || createRecordId('patient-ref'),
                  patient_name: linkedPatient?.name || patientName || `Imported Patient ${index + 1}`,
                  doctor_name: getCsvValue(row, ['doctor_name'], doctorDirectory[0]?.name || 'Clinic Doctor'),
                  consultation_date: parseCsvDate(getCsvValue(row, ['consultation_date']), today),
                  disease_template_id: '',
                  symptoms: getCsvValue(row, ['symptoms']),
                  nadi_examination: getCsvValue(row, ['nadi_examination']),
                  diagnosis: getCsvValue(row, ['diagnosis'], 'Ayurvedic consultation'),
                  ayurvedic_assessment: getCsvValue(row, ['ayurvedic_assessment']),
                  prescription: parsePrescription(getCsvValue(row, ['prescription_text', 'prescription'])),
                  diet_recommendations: getCsvValue(row, ['diet_recommendations']),
                  lifestyle_recommendations: getCsvValue(row, ['lifestyle_recommendations']),
                  panchakarma_recommendation: getCsvValue(row, ['panchakarma_recommendation']),
                  follow_up_date: parseCsvDate(getCsvValue(row, ['follow_up_date']), today),
                  consultation_notes: getCsvValue(row, ['consultation_notes']),
                  billing: {
                    consultation: parseCsvNumber(getCsvValue(row, ['consultation_charge'])),
                    medicines: parseCsvNumber(getCsvValue(row, ['medicine_charge'])),
                    package: parseCsvNumber(getCsvValue(row, ['package_charge'])),
                    panchakarma: parseCsvNumber(getCsvValue(row, ['panchakarma_charge'])),
                    therapies: parseCsvNumber(getCsvValue(row, ['therapies_charge'])),
                    total:
                      parseCsvNumber(getCsvValue(row, ['consultation_charge'])) +
                      parseCsvNumber(getCsvValue(row, ['medicine_charge'])) +
                      parseCsvNumber(getCsvValue(row, ['package_charge'])) +
                      parseCsvNumber(getCsvValue(row, ['panchakarma_charge'])) +
                      parseCsvNumber(getCsvValue(row, ['therapies_charge'])),
                    payment_status: getCsvValue(row, ['payment_status'], 'Pending'),
                  },
                }
                return consultation
              })

              nextWorkspace = { ...workspace, opdConsultations: [...importedConsultations, ...consultations] }
              importedCount = importedConsultations.length
              if (importedConsultations[0]) {
                setSelectedConsultationId(importedConsultations[0].id)
              }
              break
            }
            case 'admissions': {
              const importedAdmissions = rows.map((row, index) => {
                const patientId = getCsvValue(row, ['patient_id'])
                const patientName = getCsvValue(row, ['patient_name', 'name'])
                const linkedPatient = patientsById[patientId] || patientsByName[patientName.toLowerCase()]
                return {
                  id: createRecordId(`ipd-import-${index}`),
                  patient_id: linkedPatient?.id || patientId || createRecordId('patient-ref'),
                  patient_name: linkedPatient?.name || patientName || `Imported Patient ${index + 1}`,
                  doctor_name: getCsvValue(row, ['doctor_name'], doctorDirectory[0]?.name || 'Clinic Doctor'),
                  admission_date: parseCsvDate(getCsvValue(row, ['admission_date']), today),
                  bed_allocation: getCsvValue(row, ['bed_allocation'], `Room A | Bed ${index + 1}`),
                  diagnosis: getCsvValue(row, ['diagnosis']),
                  daily_treatment_chart: [
                    {
                      day: 'Day 1',
                      treatment: getCsvValue(row, ['treatment_notes']),
                      progress: getCsvValue(row, ['daily_progress']),
                    },
                  ],
                  panchakarma_schedule: parseCsvList(getCsvValue(row, ['panchakarma_schedule']), /\|/),
                  medicine_administration: parseCsvList(getCsvValue(row, ['medicine_administration']), /\|/),
                  diet_plan: getCsvValue(row, ['diet_plan']),
                  daily_progress: getCsvValue(row, ['daily_progress']),
                  discharge_summary: getCsvValue(row, ['discharge_summary']),
                  final_invoice: parseCsvNumber(getCsvValue(row, ['final_invoice'])),
                  status: getCsvValue(row, ['status'], 'Admitted'),
                }
              })

              nextWorkspace = { ...workspace, ipdAdmissions: [...importedAdmissions, ...ipdAdmissions] }
              importedCount = importedAdmissions.length
              if (importedAdmissions[0]) {
                setSelectedAdmissionId(importedAdmissions[0].id)
              }
              break
            }
            case 'diseases': {
              const importedDiseases = rows.map((row, index) => ({
                id: createRecordId(`disease-import-${index}`),
                illness: getCsvValue(row, ['illness', 'diagnosis'], `Imported Disease ${index + 1}`),
                recommended_medicines: parsePrescription(getCsvValue(row, ['medicines_text', 'recommended_medicines', 'prescription_text'])),
                diet_advice: getCsvValue(row, ['diet_advice']),
                lifestyle_advice: getCsvValue(row, ['lifestyle_advice']),
                notes: getCsvValue(row, ['notes']),
              }))

              nextWorkspace = { ...workspace, diseaseMaster: [...importedDiseases, ...diseaseMaster] }
              importedCount = importedDiseases.length
              break
            }
            case 'medicines': {
              const importedMedicines = rows.map((row, index) => {
                const supplierName = getCsvValue(row, ['supplier_name', 'supplier'])
                const supplierId =
                  getCsvValue(row, ['supplier_id']) ||
                  suppliers.find((supplier) => supplier.name.toLowerCase() === supplierName.toLowerCase())?.id ||
                  ''

                return {
                  id: createRecordId(`medicine-import-${index}`),
                  medicine_name: getCsvValue(row, ['medicine_name', 'name'], `Imported Medicine ${index + 1}`),
                  category: getCsvValue(row, ['category'], 'Classical Medicines'),
                  purchase_unit: getCsvValue(row, ['purchase_unit'], 'Bottle'),
                  dispensing_unit: getCsvValue(row, ['dispensing_unit'], 'Tablet'),
                  unit_conversion: getCsvValue(row, ['unit_conversion']),
                  batch_number: getCsvValue(row, ['batch_number'], `IMP-${index + 1}`),
                  purchase_price: parseCsvNumber(getCsvValue(row, ['purchase_price'])),
                  selling_price: parseCsvNumber(getCsvValue(row, ['selling_price'])),
                  current_stock: parseCsvNumber(getCsvValue(row, ['current_stock'])),
                  low_stock_level: parseCsvNumber(getCsvValue(row, ['low_stock_level']), Number(settings.low_stock_threshold || 0)),
                  expiry_date: parseCsvDate(getCsvValue(row, ['expiry_date']), today),
                  manufacturer: getCsvValue(row, ['manufacturer']),
                  supplier_id: supplierId,
                  monthly_movement: parseCsvNumber(getCsvValue(row, ['monthly_movement'])),
                }
              })

              nextWorkspace = { ...workspace, medicineCatalog: [...importedMedicines, ...medicineCatalog] }
              importedCount = importedMedicines.length
              break
            }
            case 'packages': {
              const importedPackages = rows.map((row, index) => ({
                id: createRecordId(`package-import-${index}`),
                name: getCsvValue(row, ['name'], `Imported Package ${index + 1}`),
                included_medicines: parseCsvList(getCsvValue(row, ['included_medicines'])),
                consultation_frequency: getCsvValue(row, ['consultation_frequency']),
                follow_up_schedule: getCsvValue(row, ['follow_up_schedule']),
                therapy_sessions: parseCsvNumber(getCsvValue(row, ['therapy_sessions'])),
                panchakarma_sessions: parseCsvNumber(getCsvValue(row, ['panchakarma_sessions'])),
                discount: getCsvValue(row, ['discount']),
                package_validity: getCsvValue(row, ['package_validity']),
                auto_renewal_reminder: parseCsvDate(getCsvValue(row, ['auto_renewal_reminder']), today),
              }))

              nextWorkspace = { ...workspace, packages: [...importedPackages, ...packages] }
              importedCount = importedPackages.length
              break
            }
            case 'suppliers': {
              const importedSuppliers = rows.map((row, index) => ({
                id: createRecordId(`supplier-import-${index}`),
                name: getCsvValue(row, ['name', 'supplier_name'], `Imported Supplier ${index + 1}`),
                contact_person: getCsvValue(row, ['contact_person']),
                phone: getCsvValue(row, ['phone']),
                address: getCsvValue(row, ['address']),
              }))

              nextWorkspace = { ...workspace, suppliers: [...importedSuppliers, ...suppliers] }
              importedCount = importedSuppliers.length
              break
            }
            case 'purchases': {
              const runningPurchases = [...purchases]
              const importedPurchases = rows.map((row, index) => {
                const supplierName = getCsvValue(row, ['supplier_name', 'supplier'])
                const supplierId =
                  getCsvValue(row, ['supplier_id']) ||
                  suppliers.find((supplier) => supplier.name.toLowerCase() === supplierName.toLowerCase())?.id ||
                  ''

                const record = {
                  id: createRecordId(`purchase-import-${index}`),
                  purchase_order_number: getCsvValue(row, ['purchase_order_number'], createPurchaseOrderNumber(runningPurchases)),
                  supplier_id: supplierId,
                  purchase_date: parseCsvDate(getCsvValue(row, ['purchase_date']), today),
                  status: getCsvValue(row, ['status'], 'Pending Receipt'),
                  total_amount: parseCsvNumber(getCsvValue(row, ['total_amount'])),
                  items: getCsvValue(row, ['items_text', 'items'])
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line) => {
                      const [medicine_name, quantity, purchase_unit, batch_number] = line.split('|').map((part) => part.trim())
                      return {
                        medicine_name: medicine_name || 'Ayurvedic medicine',
                        quantity: Number(quantity || 0),
                        purchase_unit: purchase_unit || 'Unit',
                        batch_number: batch_number || 'NA',
                      }
                    }),
                }
                runningPurchases.push(record)
                return record
              })

              nextWorkspace = { ...workspace, purchases: [...importedPurchases, ...purchases] }
              importedCount = importedPurchases.length
              break
            }
            case 'invoices': {
              const runningInvoices = [...invoices]
              const importedInvoices = rows.map((row, index) => {
                const patientId = getCsvValue(row, ['patient_id'])
                const patientName = getCsvValue(row, ['patient_name', 'name'])
                const linkedPatient = patientsById[patientId] || patientsByName[patientName.toLowerCase()]
                const totalAmount =
                  parseCsvNumber(getCsvValue(row, ['consultation'])) +
                  parseCsvNumber(getCsvValue(row, ['medicines'])) +
                  parseCsvNumber(getCsvValue(row, ['treatment_packages'])) +
                  parseCsvNumber(getCsvValue(row, ['panchakarma'])) +
                  parseCsvNumber(getCsvValue(row, ['therapies'])) -
                  parseCsvNumber(getCsvValue(row, ['discount']))

                const record = {
                  id: createRecordId(`invoice-import-${index}`),
                  invoice_number: getCsvValue(row, ['invoice_number'], createInvoiceNumber(runningInvoices)),
                  patient_id: linkedPatient?.id || patientId || createRecordId('patient-ref'),
                  patient_name: linkedPatient?.name || patientName || `Imported Patient ${index + 1}`,
                  bill_type: getCsvValue(row, ['bill_type'], 'Consultation'),
                  consultation: parseCsvNumber(getCsvValue(row, ['consultation'])),
                  medicines: parseCsvNumber(getCsvValue(row, ['medicines'])),
                  treatment_packages: parseCsvNumber(getCsvValue(row, ['treatment_packages'])),
                  panchakarma: parseCsvNumber(getCsvValue(row, ['panchakarma'])),
                  therapies: parseCsvNumber(getCsvValue(row, ['therapies'])),
                  discount: parseCsvNumber(getCsvValue(row, ['discount'])),
                  total_amount: totalAmount,
                  paid_amount: parseCsvNumber(getCsvValue(row, ['paid_amount'])),
                  payment_status: getCsvValue(row, ['payment_status'], 'Pending'),
                  created_at: parseCsvDate(getCsvValue(row, ['created_at']), today),
                }
                runningInvoices.push(record)
                return record
              })

              nextWorkspace = { ...workspace, invoices: [...importedInvoices, ...invoices] }
              importedCount = importedInvoices.length
              if (importedInvoices[0]) {
                setSelectedInvoiceId(importedInvoices[0].id)
              }
              break
            }
            case 'users': {
              const importedUsers = rows.map((row, index) => ({
                id: createRecordId(`user-import-${index}`),
                auth_user_id: null,
                name: getCsvValue(row, ['name'], `Imported User ${index + 1}`),
                email: normalizeEmail(getCsvValue(row, ['email'])),
                role: getCsvValue(row, ['role'], 'Front Desk Coordinator'),
                status: getCsvValue(row, ['status'], 'Active'),
                phone: getCsvValue(row, ['phone']),
                shift: getCsvValue(row, ['shift']),
                allowed_views: normalizeAccessList(parseCsvList(getCsvValue(row, ['allowed_views']), /\|/), getCsvValue(row, ['role'])),
              }))

              nextWorkspace = { ...workspace, users: [...importedUsers, ...users] }
              importedCount = importedUsers.length
              break
            }
            default:
              throw new Error('Unsupported CSV import target.')
          }

          persistWorkspace(nextWorkspace, `${importedCount} ${currentImportTarget.label.toLowerCase()} imported from CSV.`)
        } catch (error) {
          setToast({
            message: error instanceof Error ? error.message : 'CSV import failed.',
            tone: 'error',
          })
        }
      }

      reader.readAsText(file)
    }

    input.click()
  }, [
    consultations,
    currentImportTarget,
    diseaseMaster,
    doctorDirectory,
    invoices,
    ipdAdmissions,
    medicineCatalog,
    packages,
    patients,
    patientsById,
    patientsByName,
    persistWorkspace,
    purchases,
    settings.low_stock_threshold,
    suppliers,
    users,
    visits,
    workspace,
  ])

  const todaysQueue = useMemo(
    () => [...(dashboard.todaysAppointments || [])].sort((left, right) => left.queue_no - right.queue_no),
    [dashboard.todaysAppointments],
  )

  const stockWarnings = useMemo(() => {
    const nearExpiryDays = Number(settings.near_expiry_days || 45)
    return medicineCatalog.map((medicine) => ({
      ...medicine,
      alert: getMedicineAlert(medicine, nearExpiryDays),
    }))
  }, [medicineCatalog, settings.near_expiry_days])

  const warningBuckets = useMemo(
    () => ({
      low: stockWarnings.filter((item) => item.alert === 'low'),
      out: stockWarnings.filter((item) => item.alert === 'out'),
      nearExpiry: stockWarnings.filter((item) => item.alert === 'near-expiry'),
      expired: stockWarnings.filter((item) => item.alert === 'expired'),
      slow: stockWarnings.filter((item) => item.alert === 'slow'),
    }),
    [stockWarnings],
  )

  const applyDiseaseTemplate = useCallback(
    (templateId) => {
      const template = diseaseMaster.find((item) => item.id === templateId)
      if (!template) {
        return
      }

      setConsultationForm((current) => ({
        ...current,
        disease_template_id: template.id,
        diagnosis: template.illness,
        prescription_text: serializePrescription(template.recommended_medicines),
        diet_recommendations: template.diet_advice,
        lifestyle_recommendations: template.lifestyle_advice,
        consultation_notes: template.notes,
      }))
      openView('OPD')
    },
    [diseaseMaster, openView],
  )

  const handlePatientSubmit = useCallback(
    (event) => {
      event.preventDefault()
      const record = {
        id: createRecordId('patient'),
        patient_id: createPatientCode(patients),
        name: patientForm.name,
        age: Number(patientForm.age || 0),
        gender: patientForm.gender,
        contact_details: patientForm.contact_details,
        email: patientForm.email,
        emergency_contact: patientForm.emergency_contact,
        address: patientForm.address,
        occupation: patientForm.occupation,
        past_illness_history: patientForm.past_illness_history,
        family_history: patientForm.family_history,
        allergy_history: patientForm.allergy_history,
        previous_ayurvedic_treatments: patientForm.previous_ayurvedic_treatments,
        current_medications: patientForm.current_medications,
        follow_up_date: patientForm.follow_up_date,
        visit_timeline: [{ date: new Date().toISOString().slice(0, 10), title: 'Patient registered', detail: 'New Ayurvedic patient profile created in the clinic workspace.' }],
      }

      persistWorkspace({ ...workspace, patients: [record, ...patients] }, 'Patient profile added.')
      setSelectedPatientId(record.id)
      setPatientForm(initialPatientForm)
    },
    [patientForm, patients, persistWorkspace, workspace],
  )

  const handleVisitSubmit = useCallback(
    (event) => {
      event.preventDefault()
      const linkedPatient = patientsById[visitForm.patient_id]
      const visitDate = visitForm.appointment_date || new Date().toISOString().slice(0, 10)
      const queueNo = createQueueNumber(visits, visitDate)
      const record = {
        id: createRecordId('visit'),
        patient_id: visitForm.patient_id,
        patient_name: linkedPatient?.name || visitForm.patient_name || 'Walk-in Patient',
        doctor_name: visitForm.doctor_name,
        visit_type: visitForm.visit_type,
        appointment_date: visitDate,
        appointment_time: visitForm.appointment_time || '09:00',
        status: visitForm.status,
        therapy_plan: visitForm.therapy_plan,
        queue_no: queueNo,
        notes: visitForm.notes,
      }

      persistWorkspace({ ...workspace, visitPlanner: [record, ...visits] }, 'Visit planner updated.')
      setVisitForm(initialVisitForm)
    },
    [patientsById, persistWorkspace, visitForm, visits, workspace],
  )

  const handleConsultationSubmit = useCallback(
    (event) => {
      event.preventDefault()
      const patient = patientsById[consultationForm.patient_id]
      if (!patient) {
        setToast({ message: 'Select a patient before saving consultation.', tone: 'error' })
        return
      }

      const consultation = {
        id: createRecordId('opd'),
        patient_id: patient.id,
        patient_name: patient.name,
        doctor_name: consultationForm.doctor_name,
        consultation_date: consultationForm.consultation_date || new Date().toISOString().slice(0, 10),
        disease_template_id: consultationForm.disease_template_id,
        symptoms: consultationForm.symptoms,
        nadi_examination: consultationForm.nadi_examination,
        diagnosis: consultationForm.diagnosis,
        ayurvedic_assessment: consultationForm.ayurvedic_assessment,
        prescription: parsePrescription(consultationForm.prescription_text),
        diet_recommendations: consultationForm.diet_recommendations,
        lifestyle_recommendations: consultationForm.lifestyle_recommendations,
        panchakarma_recommendation: consultationForm.panchakarma_recommendation,
        follow_up_date: consultationForm.follow_up_date,
        consultation_notes: consultationForm.consultation_notes,
        billing: {
          consultation: Number(consultationForm.consultation_charge || 0),
          medicines: Number(consultationForm.medicine_charge || 0),
          package: Number(consultationForm.package_charge || 0),
          panchakarma: Number(consultationForm.panchakarma_charge || 0),
          therapies: Number(consultationForm.therapies_charge || 0),
          total:
            Number(consultationForm.consultation_charge || 0) +
            Number(consultationForm.medicine_charge || 0) +
            Number(consultationForm.package_charge || 0) +
            Number(consultationForm.panchakarma_charge || 0) +
            Number(consultationForm.therapies_charge || 0),
          payment_status: consultationForm.payment_status,
        },
      }

      const updatedPatients = patients.map((item) =>
        item.id === patient.id
          ? {
              ...item,
              follow_up_date: consultationForm.follow_up_date,
              visit_timeline: [
                {
                  date: consultation.consultation_date,
                  title: `OPD consultation - ${consultation.diagnosis}`,
                  detail: consultation.consultation_notes || consultation.ayurvedic_assessment,
                },
                ...item.visit_timeline,
              ],
            }
          : item,
      )

      persistWorkspace(
        {
          ...workspace,
          patients: updatedPatients,
          opdConsultations: [consultation, ...consultations],
        },
        'OPD consultation saved.',
      )
      setSelectedConsultationId(consultation.id)
      setConsultationForm(initialConsultationForm)
    },
    [consultationForm, consultations, patients, patientsById, persistWorkspace, workspace],
  )

  const handleAdmissionSubmit = useCallback(
    (event) => {
      event.preventDefault()
      const patient = patientsById[admissionForm.patient_id]
      if (!patient) {
        setToast({ message: 'Select a patient before creating IPD admission.', tone: 'error' })
        return
      }

      const dailyTreatmentChart =
        admissionForm.treatment_notes.trim() || admissionForm.daily_progress.trim()
          ? [{ day: 'Day 1', treatment: admissionForm.treatment_notes.trim(), progress: admissionForm.daily_progress.trim() }]
          : []
      const panchakarmaSchedule = admissionForm.panchakarma_schedule
        .split('\n')
        .map((entry) => entry.trim())
        .filter(Boolean)
      const medicineAdministration = admissionForm.medicine_administration
        .split('\n')
        .map((entry) => entry.trim())
        .filter(Boolean)

      const admission = {
        id: createRecordId('ipd'),
        patient_id: patient.id,
        patient_name: admissionForm.patient_name || patient.name,
        record_date: admissionForm.record_date || new Date().toISOString().slice(0, 10),
        place_of_birth: admissionForm.place_of_birth,
        age: admissionForm.age || patient.age || '',
        gender: admissionForm.gender || patient.gender || '',
        date_of_birth: admissionForm.date_of_birth,
        occupation: admissionForm.occupation || patient.occupation || '',
        mobile_no: admissionForm.mobile_no || patient.contact_details || '',
        email_id: admissionForm.email_id || patient.email || '',
        pulse_nadi: admissionForm.pulse_nadi,
        tongue_jivha: admissionForm.tongue_jivha,
        chief_complaints: admissionForm.chief_complaints,
        complaint_flags: admissionForm.complaint_flags,
        drug_allergy: admissionForm.drug_allergy,
        drug_reaction: admissionForm.drug_reaction,
        thyroid_disorder: admissionForm.thyroid_disorder,
        menstrual_history: admissionForm.menstrual_history,
        obstetric_history: admissionForm.obstetric_history,
        weight: admissionForm.weight,
        doctor_name: admissionForm.doctor_name,
        admission_date: admissionForm.admission_date || new Date().toISOString().slice(0, 10),
        bed_allocation: admissionForm.bed_allocation,
        diagnosis: admissionForm.diagnosis,
        daily_treatment_chart: dailyTreatmentChart,
        panchakarma_schedule: panchakarmaSchedule,
        medicine_administration: medicineAdministration,
        diet_plan: admissionForm.diet_plan,
        daily_progress: admissionForm.daily_progress,
        discharge_summary: admissionForm.discharge_summary,
        final_invoice: Number(admissionForm.final_invoice || 0),
        status: admissionForm.status,
      }

      persistWorkspace({ ...workspace, ipdAdmissions: [admission, ...ipdAdmissions] }, 'IPD admission recorded.')
      setSelectedAdmissionId(admission.id)
      setAdmissionForm(initialAdmissionForm)
    },
    [admissionForm, ipdAdmissions, patientsById, persistWorkspace, workspace],
  )

  const handleMedicineSubmit = useCallback(
    (event) => {
      event.preventDefault()
      const record = {
        id: createRecordId('medicine'),
        medicine_name: medicineForm.medicine_name,
        category: medicineForm.category,
        purchase_unit: medicineForm.purchase_unit,
        dispensing_unit: medicineForm.dispensing_unit,
        unit_conversion: medicineForm.unit_conversion,
        batch_number: medicineForm.batch_number,
        purchase_price: Number(medicineForm.purchase_price || 0),
        selling_price: Number(medicineForm.selling_price || 0),
        current_stock: Number(medicineForm.current_stock || 0),
        low_stock_level: Number(medicineForm.low_stock_level || settings.low_stock_threshold || 0),
        expiry_date: medicineForm.expiry_date,
        manufacturer: medicineForm.manufacturer,
        supplier_id: medicineForm.supplier_id,
        monthly_movement: Number(medicineForm.monthly_movement || 0),
      }

      persistWorkspace(
        { ...workspace, medicineCatalog: [record, ...medicineCatalog] },
        'Medicine master updated.',
      )
      setMedicineForm(initialMedicineForm)
    },
    [medicineCatalog, medicineForm, persistWorkspace, settings.low_stock_threshold, workspace],
  )

  const handleInventorySubmit = useCallback(
    (event) => {
      event.preventDefault()
      const quantity = Number(inventoryForm.quantity || 0)
      const nextMedicines = medicineCatalog.map((medicine) => {
        if (medicine.id !== inventoryForm.medicine_id) {
          return medicine
        }

        if (inventoryForm.action === 'Stock In') {
          return { ...medicine, current_stock: Number(medicine.current_stock || 0) + quantity }
        }
        if (inventoryForm.action === 'Stock Out') {
          return { ...medicine, current_stock: Math.max(0, Number(medicine.current_stock || 0) - quantity) }
        }
        if (inventoryForm.action === 'Stock Adjustment') {
          return { ...medicine, current_stock: quantity }
        }
        return medicine
      })

      persistWorkspace({ ...workspace, medicineCatalog: nextMedicines }, `${inventoryForm.action} completed.`)
      setInventoryForm(initialInventoryForm)
    },
    [inventoryForm, medicineCatalog, persistWorkspace, workspace],
  )

  const handleInvoiceSubmit = useCallback(
    (event) => {
      event.preventDefault()
      const patient = patientsById[invoiceForm.patient_id]
      if (!patient) {
        setToast({ message: 'Select a patient before creating an invoice.', tone: 'error' })
        return
      }

      const totalAmount =
        Number(invoiceForm.consultation || 0) +
        Number(invoiceForm.medicines || 0) +
        Number(invoiceForm.treatment_packages || 0) +
        Number(invoiceForm.panchakarma || 0) +
        Number(invoiceForm.therapies || 0) -
        Number(invoiceForm.discount || 0)

      const invoice = {
        id: createRecordId('invoice'),
        invoice_number: createInvoiceNumber(invoices),
        patient_id: patient.id,
        patient_name: patient.name,
        bill_type: invoiceForm.bill_type,
        consultation: Number(invoiceForm.consultation || 0),
        medicines: Number(invoiceForm.medicines || 0),
        treatment_packages: Number(invoiceForm.treatment_packages || 0),
        panchakarma: Number(invoiceForm.panchakarma || 0),
        therapies: Number(invoiceForm.therapies || 0),
        discount: Number(invoiceForm.discount || 0),
        total_amount: totalAmount,
        paid_amount: Number(invoiceForm.paid_amount || 0),
        payment_status: invoiceForm.payment_status,
        created_at: invoiceForm.created_at || new Date().toISOString().slice(0, 10),
      }

      persistWorkspace({ ...workspace, invoices: [invoice, ...invoices] }, 'Invoice created.')
      setSelectedInvoiceId(invoice.id)
      setInvoiceForm(initialInvoiceForm)
    },
    [invoiceForm, invoices, patientsById, persistWorkspace, workspace],
  )

  const handleUserSubmit = useCallback(
    (event) => {
      event.preventDefault()
      const email = normalizeEmail(userForm.email)

      if (!email) {
        setToast({ message: 'Enter the user email for authentication mapping.', tone: 'error' })
        return
      }

      if (users.some((user) => normalizeEmail(user.email) === email)) {
        setToast({ message: 'A clinic user with this email already exists.', tone: 'error' })
        return
      }

      const record = {
        id: createRecordId('user'),
        auth_user_id: null,
        name: userForm.name,
        email,
        role: userForm.role,
        status: userForm.status,
        phone: userForm.phone,
        shift: userForm.shift,
        allowed_views: normalizeAccessList(userForm.allowed_views, userForm.role),
      }

      persistWorkspace({ ...workspace, users: [record, ...users] }, 'Clinic user added.')
      setUserForm({
        ...initialUserForm,
        email: '',
        allowed_views: [...initialUserForm.allowed_views],
      })
    },
    [persistWorkspace, userForm, users, workspace],
  )

  const handleSupplierSubmit = useCallback(
    (event) => {
      event.preventDefault()
      const record = {
        id: createRecordId('supplier'),
        name: supplierForm.name,
        contact_person: supplierForm.contact_person,
        phone: supplierForm.phone,
        address: supplierForm.address,
      }

      persistWorkspace({ ...workspace, suppliers: [record, ...suppliers] }, 'Supplier added.')
      setSupplierForm(initialSupplierForm)
    },
    [persistWorkspace, supplierForm, suppliers, workspace],
  )

  const handlePurchaseSubmit = useCallback(
    (event) => {
      event.preventDefault()
      const items = purchaseForm.items_text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [medicine_name, quantity, purchase_unit, batch_number] = line.split('|').map((part) => part.trim())
          return {
            medicine_name: medicine_name || 'Ayurvedic medicine',
            quantity: Number(quantity || 0),
            purchase_unit: purchase_unit || 'Unit',
            batch_number: batch_number || 'NA',
          }
        })

      const record = {
        id: createRecordId('purchase'),
        purchase_order_number: createPurchaseOrderNumber(purchases),
        supplier_id: purchaseForm.supplier_id,
        purchase_date: purchaseForm.purchase_date || new Date().toISOString().slice(0, 10),
        status: purchaseForm.status,
        total_amount: Number(purchaseForm.total_amount || 0),
        items,
      }

      persistWorkspace({ ...workspace, purchases: [record, ...purchases] }, 'Purchase recorded.')
      setPurchaseForm(initialPurchaseForm)
    },
    [persistWorkspace, purchaseForm, purchases, workspace],
  )

  const handlePackageSubmit = useCallback(
    (event) => {
      event.preventDefault()
      const record = {
        id: createRecordId('package'),
        name: packageForm.name,
        included_medicines: packageForm.included_medicines
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        consultation_frequency: packageForm.consultation_frequency,
        follow_up_schedule: packageForm.follow_up_schedule,
        therapy_sessions: Number(packageForm.therapy_sessions || 0),
        panchakarma_sessions: Number(packageForm.panchakarma_sessions || 0),
        discount: packageForm.discount,
        package_validity: packageForm.package_validity,
        auto_renewal_reminder: packageForm.auto_renewal_reminder,
      }

      persistWorkspace({ ...workspace, packages: [record, ...packages] }, 'Package saved.')
      setPackageForm(initialPackageForm)
    },
    [packageForm, packages, persistWorkspace, workspace],
  )

  const handleDiseaseSubmit = useCallback(
    (event) => {
      event.preventDefault()
      const record = {
        id: createRecordId('disease'),
        illness: diseaseForm.illness,
        recommended_medicines: parsePrescription(diseaseForm.medicines_text),
        diet_advice: diseaseForm.diet_advice,
        lifestyle_advice: diseaseForm.lifestyle_advice,
        notes: diseaseForm.notes,
      }

      persistWorkspace({ ...workspace, diseaseMaster: [record, ...diseaseMaster] }, 'Disease template saved.')
      setDiseaseForm(initialDiseaseForm)
    },
    [diseaseForm, diseaseMaster, persistWorkspace, workspace],
  )

  const handleUnitAdd = useCallback(() => {
    const trimmed = unitName.trim()
    if (!trimmed) {
      setToast({ message: 'Enter a unit name before adding it.', tone: 'error' })
      return
    }

    const nextUnits = Array.from(new Set([...(settings.supported_units || []), trimmed]))
    persistWorkspace(
      {
        ...workspace,
        systemSettings: {
          ...settings,
          supported_units: nextUnits,
        },
      },
      'Dispensing unit added.',
    )
    setUnitName('')
  }, [persistWorkspace, settings, unitName, workspace])

  const handleAdminSettingsSubmit = useCallback(
    (event) => {
      event.preventDefault()
      persistWorkspace(
        {
          ...workspace,
          clinic: {
            ...clinic,
            name: settingsForm.clinic_name,
            location: settingsForm.clinic_location,
            contact: settingsForm.clinic_contact,
          },
          systemSettings: {
            ...settings,
            clinic_hours: settingsForm.clinic_hours,
            near_expiry_days: Number(settingsForm.near_expiry_days || 0),
            low_stock_threshold: Number(settingsForm.low_stock_threshold || 0),
            receipt_footer: settingsForm.receipt_footer,
            backup_note: settingsForm.backup_note,
          },
        },
        'Clinic admin settings updated.',
      )
    },
    [clinic, persistWorkspace, settings, settingsForm, workspace],
  )

  const handleBackupGenerate = useCallback(() => {
    setBackupText(JSON.stringify(workspace, null, 2))
    setToast({ message: 'Backup snapshot generated locally.', tone: 'success' })
  }, [workspace])

  const handleBackupRestore = useCallback(async () => {
    try {
      const parsed = JSON.parse(backupText)
      const restored = await saveWorkspaceData(parsed)
      setWorkspace(restored)
      setToast({ message: 'Backup restored successfully.', tone: 'success' })
    } catch {
      setToast({ message: 'Backup restore failed. Use valid clinic JSON.', tone: 'error' })
    }
  }, [backupText])

  const handleResetWorkspace = useCallback(async () => {
    const data = await resetWorkspaceData()
    setWorkspace(data)
    setSelectedPatientId(data.patients[0]?.id || '')
    setSelectedConsultationId(data.opdConsultations[0]?.id || '')
    setSelectedAdmissionId(data.ipdAdmissions[0]?.id || '')
    setSelectedInvoiceId(data.invoices[0]?.id || '')
    setToast({ message: 'Clinic workspace reset.', tone: 'success' })
  }, [])

  const printCurrentView = useCallback(() => {
    window.print()
  }, [])

  if (!authReady || loading) {
    return <div className="loading-screen">{!authReady ? 'Checking authentication...' : 'Loading workspace...'}</div>
  }

  function renderDashboard() {
    return (
      <div className="view-stack">
        <SectionIntro eyebrow="Dashboard" title="Appointments, patients, revenue, stock, and follow-up overview." />
        <div className="card-grid four">
          <StatCard label="Today's Appointments" value={dashboard.todaysAppointments?.length || 0} tone="info" />
          <StatCard label="OPD Patient Count" value={dashboard.opdPatientCount || 0} tone="primary" />
          <StatCard label="IPD Patient Count" value={dashboard.ipdPatientCount || 0} tone="warning" />
          <StatCard label="Revenue Summary" value={formatCurrency(dashboard.revenueSummary?.monthly || 0)} tone="success" />
        </div>
        <div className="card-grid three">
          <StatCard label="Low Stock Medicines" value={warningBuckets.low.length + warningBuckets.out.length} tone="warning" />
          <StatCard label="Expiring Medicines" value={dashboard.expiringMedicines?.length || 0} tone="danger" />
          <StatCard label="Follow-up Patients" value={dashboard.followUpPatients?.length || 0} tone="primary" />
        </div>
        <Panel title="Quick Action Cards" subtitle="Jump directly into the tasks that drive daily clinic operations.">
          <div className="action-grid">
            {(dashboard.quickActions || [])
              .filter((item) => accessibleViewSet.has(item.key))
              .map((item) => (
              <button key={item.key} type="button" className="quick-action" onClick={() => openView(item.key)}>
                <strong>{item.label}</strong>
                <span>Open {item.label.toLowerCase()} module</span>
              </button>
            ))}
          </div>
        </Panel>
        <div className="split-grid">
          <Panel title="Today's Appointments" subtitle="Daily consultation queue with walk-ins and follow-ups.">
            <div className="list-stack">
              {todaysQueue.map((visit) => (
                <div key={visit.id} className="list-card">
                  <div className="list-card-header">
                    <strong>{visit.patient_name}</strong>
                    <StatusPill value={visit.status} />
                  </div>
                  <small>
                    Queue {visit.queue_no} | {visit.appointment_time} | {visit.doctor_name}
                  </small>
                  <p>{visit.therapy_plan || visit.notes}</p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Recent Consultations" subtitle="Latest OPD notes ready for quick review.">
            <div className="list-stack">
              {(dashboard.recentConsultations || []).map((consultation) => (
                <div key={consultation.id} className="list-card">
                  <div className="list-card-header">
                    <strong>{consultation.patient_name}</strong>
                    <small>{formatDate(consultation.consultation_date)}</small>
                  </div>
                  <p>{consultation.diagnosis}</p>
                  <small>{consultation.ayurvedic_assessment}</small>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    )
  }

  function renderPatients() {
    return (
      <div className="view-stack">
        <SectionIntro eyebrow="Patient Management" title="Detailed patient profiles with history, search, filters, visit timeline, and follow-up reminders." />
        <div className="toolbar">
          <input value={patientQuery} onChange={(event) => setPatientQuery(event.target.value)} placeholder="Search by name, patient ID, phone, or occupation" />
          <select value={patientFilter} onChange={(event) => setPatientFilter(event.target.value)}>
            <option>All</option>
            <option>Follow-up Due</option>
            <option>Allergy History</option>
          </select>
        </div>
        <div className="split-grid">
          <Panel title="Patient Directory" subtitle="Search and filter locally stored Ayurvedic patient records.">
            <div className="list-stack">
              {filteredPatients.map((patient) => (
                <button key={patient.id} type="button" className={selectedPatientId === patient.id ? 'list-card active' : 'list-card'} onClick={() => setSelectedPatientId(patient.id)}>
                  <div className="list-card-header">
                    <strong>{patient.name}</strong>
                    <small>{patient.patient_id}</small>
                  </div>
                  <small>
                    {patient.age} yrs | {patient.gender} | Follow-up {formatDate(patient.follow_up_date)}
                  </small>
                  <p>{patient.past_illness_history}</p>
                </button>
              ))}
            </div>
          </Panel>
          <Panel title="Patient Profile" subtitle="Single patient view for history, timeline, and reminder readiness.">
            {selectedPatient ? (
              <div className="detail-stack">
                <div className="pill-row">
                  <InfoPill text={selectedPatient.patient_id} />
                  <InfoPill text={`${selectedPatient.age} years`} />
                  <InfoPill text={`Follow-up ${formatDate(selectedPatient.follow_up_date)}`} />
                </div>
                <KeyValue label="Contact" value={`${selectedPatient.contact_details} | ${selectedPatient.email}`} />
                <KeyValue label="Emergency Contact" value={selectedPatient.emergency_contact} />
                <KeyValue label="Address" value={selectedPatient.address} />
                <KeyValue label="Occupation" value={selectedPatient.occupation} />
                <KeyValue label="Past Illness History" value={selectedPatient.past_illness_history} />
                <KeyValue label="Family History" value={selectedPatient.family_history} />
                <KeyValue label="Allergy History" value={selectedPatient.allergy_history} />
                <KeyValue label="Previous Ayurvedic Treatments" value={selectedPatient.previous_ayurvedic_treatments} />
                <KeyValue label="Current Medications" value={selectedPatient.current_medications} />
                <div className="timeline">
                  {selectedPatient.visit_timeline.map((entry) => (
                    <div key={`${entry.date}-${entry.title}`} className="timeline-item">
                      <strong>{entry.title}</strong>
                      <small>{formatDate(entry.date)}</small>
                      <p>{entry.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="No patient selected" text="Choose a patient from the directory to review the Ayurvedic profile." />
            )}
          </Panel>
        </div>
        <Panel title="Register Patient" subtitle="Add new locally stored demo patients for OPD and IPD planning.">
          <form className="form-grid" onSubmit={handlePatientSubmit}>
            <input value={patientForm.name} onChange={(event) => setPatientForm({ ...patientForm, name: event.target.value })} placeholder="Patient name" required />
            <input value={patientForm.age} onChange={(event) => setPatientForm({ ...patientForm, age: event.target.value })} placeholder="Age" type="number" min="0" required />
            <select value={patientForm.gender} onChange={(event) => setPatientForm({ ...patientForm, gender: event.target.value })}>{genders.map((item) => <option key={item}>{item}</option>)}</select>
            <input value={patientForm.contact_details} onChange={(event) => setPatientForm({ ...patientForm, contact_details: event.target.value })} placeholder="Contact details" required />
            <input value={patientForm.email} onChange={(event) => setPatientForm({ ...patientForm, email: event.target.value })} placeholder="Email" />
            <input value={patientForm.emergency_contact} onChange={(event) => setPatientForm({ ...patientForm, emergency_contact: event.target.value })} placeholder="Emergency contact" required />
            <input value={patientForm.address} onChange={(event) => setPatientForm({ ...patientForm, address: event.target.value })} placeholder="Address" required />
            <input value={patientForm.occupation} onChange={(event) => setPatientForm({ ...patientForm, occupation: event.target.value })} placeholder="Occupation" />
            <textarea className="full-span" value={patientForm.past_illness_history} onChange={(event) => setPatientForm({ ...patientForm, past_illness_history: event.target.value })} placeholder="Past illness history" />
            <textarea value={patientForm.family_history} onChange={(event) => setPatientForm({ ...patientForm, family_history: event.target.value })} placeholder="Family history" />
            <textarea value={patientForm.allergy_history} onChange={(event) => setPatientForm({ ...patientForm, allergy_history: event.target.value })} placeholder="Allergy history" />
            <textarea value={patientForm.previous_ayurvedic_treatments} onChange={(event) => setPatientForm({ ...patientForm, previous_ayurvedic_treatments: event.target.value })} placeholder="Previous Ayurvedic treatments" />
            <textarea value={patientForm.current_medications} onChange={(event) => setPatientForm({ ...patientForm, current_medications: event.target.value })} placeholder="Current medications" />
            <input type="date" value={patientForm.follow_up_date} onChange={(event) => setPatientForm({ ...patientForm, follow_up_date: event.target.value })} />
            <button type="submit" className="primary-button">Save Patient</button>
          </form>
        </Panel>
      </div>
    )
  }

  function renderVisitPlanner() {
    return (
      <div className="view-stack">
        <SectionIntro eyebrow="Visit Planner" title="Appointments, walk-ins, follow-up scheduling, therapy planning, doctor calendar, and the daily consultation queue." />
        <div className="card-grid four">
          <StatCard label="Scheduled" value={visits.filter((visit) => visit.status === 'Scheduled').length} tone="primary" />
          <StatCard label="Checked In" value={visits.filter((visit) => visit.status === 'Checked In').length} tone="warning" />
          <StatCard label="Completed" value={visits.filter((visit) => visit.status === 'Completed').length} tone="success" />
          <StatCard label="Cancelled" value={visits.filter((visit) => visit.status === 'Cancelled').length} tone="danger" />
        </div>
        <div className="split-grid">
          <Panel title="Daily Consultation Queue" subtitle="Fast queue visibility for the clinic front desk and doctors.">
            <SimpleTable
              columns={['Queue', 'Patient', 'Doctor', 'Type', 'Time', 'Status']}
              rows={todaysQueue.map((visit) => [visit.queue_no, visit.patient_name, visit.doctor_name, visit.visit_type, visit.appointment_time, <StatusPill key={visit.id} value={visit.status} />])}
            />
          </Panel>
          <Panel title="Doctor Calendar" subtitle="Clinic doctor schedule visibility for appointments and therapy planning.">
            <div className="list-stack">
              {doctorDirectory.map((user) => (
                <div key={user.id} className="list-card">
                  <div className="list-card-header">
                    <strong>{user.name}</strong>
                    <StatusPill value={user.status} />
                  </div>
                  <small>{user.role}</small>
                  <p>Shift: {user.shift}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <Panel title="Schedule Visit" subtitle="Use for appointment scheduling, walk-in registration, follow-ups, and therapy planning.">
          <form className="form-grid" onSubmit={handleVisitSubmit}>
            <select value={visitForm.patient_id} onChange={(event) => setVisitForm({ ...visitForm, patient_id: event.target.value })}>
              <option value="">Select existing patient</option>
              {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
            </select>
            <input value={visitForm.patient_name} onChange={(event) => setVisitForm({ ...visitForm, patient_name: event.target.value })} placeholder="Walk-in patient name" />
            <select value={visitForm.doctor_name} onChange={(event) => setVisitForm({ ...visitForm, doctor_name: event.target.value })} required>
              {doctorDirectory.map((doctor) => <option key={doctor.id} value={doctor.name}>{doctor.name}</option>)}
            </select>
            <select value={visitForm.visit_type} onChange={(event) => setVisitForm({ ...visitForm, visit_type: event.target.value })}>{visitTypes.map((item) => <option key={item}>{item}</option>)}</select>
            <input type="date" value={visitForm.appointment_date} onChange={(event) => setVisitForm({ ...visitForm, appointment_date: event.target.value })} required />
            <input type="time" value={visitForm.appointment_time} onChange={(event) => setVisitForm({ ...visitForm, appointment_time: event.target.value })} required />
            <select value={visitForm.status} onChange={(event) => setVisitForm({ ...visitForm, status: event.target.value })}>{appointmentStatuses.map((item) => <option key={item}>{item}</option>)}</select>
            <input value={visitForm.therapy_plan} onChange={(event) => setVisitForm({ ...visitForm, therapy_plan: event.target.value })} placeholder="Therapy planning / purpose" />
            <textarea className="full-span" value={visitForm.notes} onChange={(event) => setVisitForm({ ...visitForm, notes: event.target.value })} placeholder="Notes" />
            <button type="submit" className="primary-button">Save Visit</button>
          </form>
        </Panel>
      </div>
    )
  }

  function renderOPD() {
    return (
      <div className="view-stack">
        <SectionIntro eyebrow="OPD Management" title="Ayurvedic consultations with symptoms, Nadi examination, diagnosis, prescription, diet, lifestyle, Panchakarma advice, and billing." />
        <div className="split-grid">
          <Panel title="Recent Consultations" subtitle="Select any consultation to review the printable Ayurvedic prescription summary.">
            <div className="list-stack">
              {consultations.map((consultation) => (
                <button key={consultation.id} type="button" className={selectedConsultationId === consultation.id ? 'list-card active' : 'list-card'} onClick={() => setSelectedConsultationId(consultation.id)}>
                  <div className="list-card-header">
                    <strong>{consultation.patient_name}</strong>
                    <small>{formatDate(consultation.consultation_date)}</small>
                  </div>
                  <p>{consultation.diagnosis}</p>
                  <small>{consultation.doctor_name}</small>
                </button>
              ))}
            </div>
          </Panel>
          <Panel title="Printable Prescription" subtitle="Use the browser print action for prescription output.">
            {selectedConsultation ? (
              <div className="printable-card">
                <KeyValue label="Patient" value={selectedConsultation.patient_name} />
                <KeyValue label="Doctor" value={selectedConsultation.doctor_name} />
                <KeyValue label="Diagnosis" value={selectedConsultation.diagnosis} />
                <KeyValue label="Symptoms" value={selectedConsultation.symptoms} />
                <KeyValue label="Nadi Examination" value={selectedConsultation.nadi_examination} />
                <KeyValue label="Diet Instructions" value={selectedConsultation.diet_recommendations} />
                <KeyValue label="Lifestyle Advice" value={selectedConsultation.lifestyle_recommendations} />
                <KeyValue label="Panchakarma Recommendation" value={selectedConsultation.panchakarma_recommendation} />
                <div className="prescription-list">
                  {selectedConsultation.prescription.map((item) => (
                    <div key={`${item.medicine}-${item.duration}`} className="prescription-item">
                      <strong>{item.medicine}</strong>
                      <small>{item.dosage} | {item.schedule} | {item.food_relation}</small>
                      <small>{item.duration} | Qty {item.quantity}</small>
                    </div>
                  ))}
                </div>
                <button type="button" className="primary-button" onClick={printCurrentView}>Print Prescription</button>
              </div>
            ) : (
              <EmptyState title="No consultation selected" text="Select a consultation to review the prescription summary." />
            )}
          </Panel>
        </div>
        <Panel title="New OPD Consultation" subtitle="Load a disease template directly into the prescription and recommendations.">
          <div className="template-toolbar">
            {diseaseMaster.map((item) => (
              <button key={item.id} type="button" className="chip-button" onClick={() => applyDiseaseTemplate(item.id)}>
                {item.illness}
              </button>
            ))}
          </div>
          <form className="form-grid" onSubmit={handleConsultationSubmit}>
            <select value={consultationForm.patient_id} onChange={(event) => setConsultationForm({ ...consultationForm, patient_id: event.target.value })} required>
              <option value="">Patient</option>
              {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
            </select>
            <select value={consultationForm.doctor_name} onChange={(event) => setConsultationForm({ ...consultationForm, doctor_name: event.target.value })} required>
              {doctorDirectory.map((doctor) => <option key={doctor.id} value={doctor.name}>{doctor.name}</option>)}
            </select>
            <input type="date" value={consultationForm.consultation_date} onChange={(event) => setConsultationForm({ ...consultationForm, consultation_date: event.target.value })} required />
            <select value={consultationForm.disease_template_id} onChange={(event) => applyDiseaseTemplate(event.target.value)}>
              <option value="">Load disease template</option>
              {diseaseMaster.map((item) => <option key={item.id} value={item.id}>{item.illness}</option>)}
            </select>
            <textarea value={consultationForm.symptoms} onChange={(event) => setConsultationForm({ ...consultationForm, symptoms: event.target.value })} placeholder="Symptoms" />
            <textarea value={consultationForm.nadi_examination} onChange={(event) => setConsultationForm({ ...consultationForm, nadi_examination: event.target.value })} placeholder="Pulse / Nadi examination" />
            <input value={consultationForm.diagnosis} onChange={(event) => setConsultationForm({ ...consultationForm, diagnosis: event.target.value })} placeholder="Diagnosis" />
            <textarea value={consultationForm.ayurvedic_assessment} onChange={(event) => setConsultationForm({ ...consultationForm, ayurvedic_assessment: event.target.value })} placeholder="Ayurvedic assessment" />
            <textarea className="full-span" value={consultationForm.prescription_text} onChange={(event) => setConsultationForm({ ...consultationForm, prescription_text: event.target.value })} placeholder="Medicine | Dosage | Morning/Afternoon/Night | Before/After food | Duration | Quantity" />
            <textarea value={consultationForm.diet_recommendations} onChange={(event) => setConsultationForm({ ...consultationForm, diet_recommendations: event.target.value })} placeholder="Diet recommendations" />
            <textarea value={consultationForm.lifestyle_recommendations} onChange={(event) => setConsultationForm({ ...consultationForm, lifestyle_recommendations: event.target.value })} placeholder="Lifestyle recommendations" />
            <textarea value={consultationForm.panchakarma_recommendation} onChange={(event) => setConsultationForm({ ...consultationForm, panchakarma_recommendation: event.target.value })} placeholder="Panchakarma recommendation" />
            <input type="date" value={consultationForm.follow_up_date} onChange={(event) => setConsultationForm({ ...consultationForm, follow_up_date: event.target.value })} />
            <textarea value={consultationForm.consultation_notes} onChange={(event) => setConsultationForm({ ...consultationForm, consultation_notes: event.target.value })} placeholder="Consultation notes" />
            <input value={consultationForm.consultation_charge} onChange={(event) => setConsultationForm({ ...consultationForm, consultation_charge: event.target.value })} placeholder="Consultation charge" type="number" min="0" />
            <input value={consultationForm.medicine_charge} onChange={(event) => setConsultationForm({ ...consultationForm, medicine_charge: event.target.value })} placeholder="Medicine billing" type="number" min="0" />
            <input value={consultationForm.package_charge} onChange={(event) => setConsultationForm({ ...consultationForm, package_charge: event.target.value })} placeholder="Package billing" type="number" min="0" />
            <input value={consultationForm.panchakarma_charge} onChange={(event) => setConsultationForm({ ...consultationForm, panchakarma_charge: event.target.value })} placeholder="Panchakarma billing" type="number" min="0" />
            <input value={consultationForm.therapies_charge} onChange={(event) => setConsultationForm({ ...consultationForm, therapies_charge: event.target.value })} placeholder="Therapies billing" type="number" min="0" />
            <select value={consultationForm.payment_status} onChange={(event) => setConsultationForm({ ...consultationForm, payment_status: event.target.value })}>
              <option>Paid</option>
              <option>Partial</option>
              <option>Pending</option>
            </select>
            <button type="submit" className="primary-button">Save Consultation</button>
          </form>
        </Panel>
      </div>
    )
  }

  function renderIPD() {
    return (
      <div className="view-stack">
        <SectionIntro eyebrow="IPD Management" title="Indoor patient admission, bed allocation, daily treatment chart, Panchakarma schedule, medicines, diet, progress, discharge summary, and final invoice." />
        <div className="card-grid three">
          <StatCard label="Active Admissions" value={ipdAdmissions.filter((item) => item.status === 'Admitted').length} tone="warning" />
          <StatCard label="Discharged Cases" value={ipdAdmissions.filter((item) => item.status === 'Discharged').length} tone="success" />
          <StatCard label="Final Invoice Total" value={formatCurrency(ipdAdmissions.reduce((sum, item) => sum + Number(item.final_invoice || 0), 0))} tone="primary" />
        </div>
        <div className="split-grid">
          <Panel title="IPD Cases" subtitle="Indoor care summary for current Ayurvedic admissions.">
            <div className="list-stack">
              {ipdAdmissions.map((admission) => (
                <button key={admission.id} type="button" className={selectedAdmissionId === admission.id ? 'list-card active' : 'list-card'} onClick={() => setSelectedAdmissionId(admission.id)}>
                  <div className="list-card-header">
                    <strong>{admission.patient_name}</strong>
                    <StatusPill value={admission.status} />
                  </div>
                  <small>{admission.bed_allocation} | {admission.doctor_name}</small>
                  <p>{admission.diagnosis}</p>
                  <small>{admission.daily_progress}</small>
                </button>
              ))}
            </div>
          </Panel>
          <Panel title="IPD Detail" subtitle="Structured indoor care record with patient profile, complaint checklist, treatment chart, progress, and discharge overview.">
            {selectedAdmission ? (
              <div className="detail-stack">
                <div className="pill-row">
                  <InfoPill text={selectedAdmission.status} />
                  <InfoPill text={selectedAdmission.bed_allocation} />
                  <InfoPill text={`Invoice ${formatCurrency(selectedAdmission.final_invoice)}`} />
                </div>
                <div className="ipd-record-sheet">
                  <div className="ipd-sheet-markers">
                    <span>!! Om !!</span>
                    <span>!! Shri !!</span>
                    <span>!!!!</span>
                  </div>
                  <div className="ipd-sheet-header">
                    <h3>Dr. S. V. Kini Ayurvedic Clinic & Panchakarma Centre</h3>
                    <p>Patient Record</p>
                  </div>
                  <div className="ipd-record-grid">
                    <KeyValue label="Patient Name" value={selectedAdmission.patient_name} />
                    <KeyValue label="Date" value={formatDate(selectedAdmission.record_date || selectedAdmission.admission_date)} />
                    <KeyValue label="Place of Birth" value={selectedAdmission.place_of_birth} />
                    <KeyValue label="Age" value={selectedAdmission.age} />
                    <KeyValue label="Gender" value={selectedAdmission.gender} />
                    <KeyValue label="Date of Birth" value={formatDate(selectedAdmission.date_of_birth)} />
                    <KeyValue label="Occupation" value={selectedAdmission.occupation} />
                    <KeyValue label="Mobile No." value={selectedAdmission.mobile_no} />
                    <KeyValue label="Email ID" value={selectedAdmission.email_id} />
                    <KeyValue label="Pulse (Nadi)" value={selectedAdmission.pulse_nadi} />
                    <KeyValue label="Tongue (Jivha)" value={selectedAdmission.tongue_jivha} />
                    <KeyValue label="Weight (Wt.)" value={selectedAdmission.weight ? `${selectedAdmission.weight} kg` : ''} />
                  </div>
                  <div className="ipd-note-block">
                    <strong>!! Shri !!</strong>
                    <p>{selectedAdmission.chief_complaints || 'No chief complaint recorded.'}</p>
                  </div>
                  <div className="ipd-complaint-grid">
                    {complaintChecklist.map((item) => (
                      <InfoPill
                        key={`${selectedAdmission.id}-${item}`}
                        text={item}
                        tone={selectedAdmission.complaint_flags?.includes(item) ? 'primary' : 'neutral'}
                      />
                    ))}
                  </div>
                  <div className="ipd-record-grid">
                    <KeyValue label="Drug Allergy" value={selectedAdmission.drug_allergy} />
                    <KeyValue label="Drug Reaction" value={selectedAdmission.drug_reaction} />
                    <KeyValue label="Thyroid Disorder" value={selectedAdmission.thyroid_disorder} />
                    <KeyValue label="M/H - Menstrual History" value={selectedAdmission.menstrual_history} />
                    <KeyValue label="O/H - Obstetric History" value={selectedAdmission.obstetric_history} />
                    <KeyValue label="Doctor" value={selectedAdmission.doctor_name} />
                    <KeyValue label="Admission Date" value={formatDate(selectedAdmission.admission_date)} />
                    <KeyValue label="Diagnosis" value={selectedAdmission.diagnosis} />
                    <KeyValue label="Diet Plan" value={selectedAdmission.diet_plan} />
                    <KeyValue label="Daily Progress" value={selectedAdmission.daily_progress} />
                    <KeyValue label="Discharge Summary" value={selectedAdmission.discharge_summary} />
                  </div>
                </div>
                <div className="timeline">
                  {selectedAdmission.daily_treatment_chart.map((entry) => (
                    <div key={`${selectedAdmission.id}-${entry.day}`} className="timeline-item">
                      <strong>{entry.day}</strong>
                      <small>{entry.treatment}</small>
                      <p>{entry.progress}</p>
                    </div>
                  ))}
                </div>
                <KeyValue label="Panchakarma Schedule" value={selectedAdmission.panchakarma_schedule.join(', ')} />
                <KeyValue label="Medicine Administration" value={selectedAdmission.medicine_administration.join(', ')} />
              </div>
            ) : (
              <EmptyState title="No IPD case selected" text="Select an indoor case to review the treatment and discharge detail." />
            )}
          </Panel>
        </div>
        <Panel title="Admit IPD Patient" subtitle="Create a structured Ayurvedic patient record and indoor treatment workflow connected to the clinic backend.">
          <form className="form-grid ipd-form-grid" onSubmit={handleAdmissionSubmit}>
            <div className="form-banner full-span">
              <div className="ipd-sheet-markers">
                <span>!! Om !!</span>
                <span>!! Shri !!</span>
                <span>!!!!</span>
              </div>
              <strong>Dr. S. V. Kini Ayurvedic Clinic & Panchakarma Centre</strong>
              <small>Patient Record</small>
            </div>

            <div className="form-section full-span">
              <div className="form-section-head">
                <div>
                  <p className="eyebrow">Identity</p>
                  <h4>Patient record details</h4>
                </div>
                <small>Select an existing patient and complete the admission record in a clinical format.</small>
              </div>
              <div className="form-grid">
                <label className="form-field">
                  <span>Patient</span>
                  <select value={admissionForm.patient_id} onChange={(event) => handleAdmissionPatientChange(event.target.value)} required>
                    <option value="">Select patient</option>
                    {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
                  </select>
                </label>
                <label className="form-field">
                  <span>Patient Name</span>
                  <input value={admissionForm.patient_name} onChange={(event) => setAdmissionForm({ ...admissionForm, patient_name: event.target.value })} placeholder="Patient Name" required />
                </label>
                <label className="form-field">
                  <span>Date</span>
                  <input type="date" value={admissionForm.record_date} onChange={(event) => setAdmissionForm({ ...admissionForm, record_date: event.target.value })} required />
                </label>
                <label className="form-field">
                  <span>Place of Birth</span>
                  <input value={admissionForm.place_of_birth} onChange={(event) => setAdmissionForm({ ...admissionForm, place_of_birth: event.target.value })} placeholder="Place of Birth" />
                </label>
                <label className="form-field">
                  <span>Age</span>
                  <input type="number" min="0" value={admissionForm.age} onChange={(event) => setAdmissionForm({ ...admissionForm, age: event.target.value })} placeholder="Age" />
                </label>
                <label className="form-field">
                  <span>Gender</span>
                  <select value={admissionForm.gender} onChange={(event) => setAdmissionForm({ ...admissionForm, gender: event.target.value })}>
                    {genders.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label className="form-field">
                  <span>Date of Birth</span>
                  <input type="date" value={admissionForm.date_of_birth} onChange={(event) => setAdmissionForm({ ...admissionForm, date_of_birth: event.target.value })} />
                </label>
                <label className="form-field">
                  <span>Occupation</span>
                  <input value={admissionForm.occupation} onChange={(event) => setAdmissionForm({ ...admissionForm, occupation: event.target.value })} placeholder="Occupation" />
                </label>
              </div>
            </div>

            <div className="form-section full-span">
              <div className="form-section-head">
                <div>
                  <p className="eyebrow">Clinical intake</p>
                  <h4>Contact and examination</h4>
                </div>
                <small>Capture the examination and admission details used on the indoor patient record.</small>
              </div>
              <div className="form-grid">
                <label className="form-field">
                  <span>Mobile No.</span>
                  <input type="tel" value={admissionForm.mobile_no} onChange={(event) => setAdmissionForm({ ...admissionForm, mobile_no: event.target.value })} placeholder="Mobile No." />
                </label>
                <label className="form-field">
                  <span>Email ID</span>
                  <input type="email" value={admissionForm.email_id} onChange={(event) => setAdmissionForm({ ...admissionForm, email_id: event.target.value })} placeholder="Email ID" />
                </label>
                <label className="form-field">
                  <span>Pulse (Nadi)</span>
                  <input value={admissionForm.pulse_nadi} onChange={(event) => setAdmissionForm({ ...admissionForm, pulse_nadi: event.target.value })} placeholder="Pulse (Nadi)" />
                </label>
                <label className="form-field">
                  <span>Tongue (Jivha)</span>
                  <input value={admissionForm.tongue_jivha} onChange={(event) => setAdmissionForm({ ...admissionForm, tongue_jivha: event.target.value })} placeholder="Tongue (Jivha)" />
                </label>
                <label className="form-field">
                  <span>Weight (Wt.)</span>
                  <input type="number" min="0" step="0.1" value={admissionForm.weight} onChange={(event) => setAdmissionForm({ ...admissionForm, weight: event.target.value })} placeholder="Weight in kg" />
                </label>
                <label className="form-field">
                  <span>Doctor</span>
                  <select value={admissionForm.doctor_name} onChange={(event) => setAdmissionForm({ ...admissionForm, doctor_name: event.target.value })} required>
                    {doctorDirectory.map((doctor) => <option key={doctor.id} value={doctor.name}>{doctor.name}</option>)}
                  </select>
                </label>
                <label className="form-field">
                  <span>Admission Date</span>
                  <input type="date" value={admissionForm.admission_date} onChange={(event) => setAdmissionForm({ ...admissionForm, admission_date: event.target.value })} required />
                </label>
                <label className="form-field">
                  <span>Bed Allocation</span>
                  <input value={admissionForm.bed_allocation} onChange={(event) => setAdmissionForm({ ...admissionForm, bed_allocation: event.target.value })} placeholder="Bed allocation" required />
                </label>
              </div>
            </div>

            <div className="form-section full-span">
              <div className="form-section-head">
                <div>
                  <p className="eyebrow">Complaint sheet</p>
                  <h4>Chief Complaint(s)</h4>
                </div>
                <small>Record the chief complaint and tick the related history or illness markers.</small>
              </div>
              <label className="form-field full-span">
                <span>Chief Complaint(s)</span>
                <textarea value={admissionForm.chief_complaints} onChange={(event) => setAdmissionForm({ ...admissionForm, chief_complaints: event.target.value })} placeholder="Describe the patient’s primary complaints" />
              </label>
              <div className="complaint-sheet full-span">
                <div className="ipd-note-block">
                  <strong>!! Shri !!</strong>
                  <p>Complaint checklist</p>
                </div>
                <div className="complaint-checklist">
                  {complaintChecklist.map((item) => {
                    const checked = admissionForm.complaint_flags.includes(item)

                    return (
                      <label key={item} className={`complaint-chip ${checked ? 'active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setAdmissionForm((current) => ({
                              ...current,
                              complaint_flags: checked
                                ? current.complaint_flags.filter((value) => value !== item)
                                : [...current.complaint_flags, item],
                            }))
                          }
                        />
                        <span>{item}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="form-section full-span">
              <div className="form-section-head">
                <div>
                  <p className="eyebrow">History</p>
                  <h4>Clinical history and diagnosis</h4>
                </div>
                <small>Keep the additional history fields aligned with the printed patient record format.</small>
              </div>
              <div className="form-grid">
                <label className="form-field">
                  <span>Diagnosis</span>
                  <textarea value={admissionForm.diagnosis} onChange={(event) => setAdmissionForm({ ...admissionForm, diagnosis: event.target.value })} placeholder="Diagnosis" />
                </label>
                <label className="form-field">
                  <span>Drug Allergy</span>
                  <textarea value={admissionForm.drug_allergy} onChange={(event) => setAdmissionForm({ ...admissionForm, drug_allergy: event.target.value })} placeholder="Drug Allergy" />
                </label>
                <label className="form-field">
                  <span>Drug Reaction</span>
                  <textarea value={admissionForm.drug_reaction} onChange={(event) => setAdmissionForm({ ...admissionForm, drug_reaction: event.target.value })} placeholder="Drug Reaction" />
                </label>
                <label className="form-field">
                  <span>Thyroid Disorder</span>
                  <textarea value={admissionForm.thyroid_disorder} onChange={(event) => setAdmissionForm({ ...admissionForm, thyroid_disorder: event.target.value })} placeholder="Thyroid Disorder" />
                </label>
                <label className="form-field">
                  <span>M/H - Menstrual History</span>
                  <textarea value={admissionForm.menstrual_history} onChange={(event) => setAdmissionForm({ ...admissionForm, menstrual_history: event.target.value })} placeholder="Menstrual history" />
                </label>
                <label className="form-field">
                  <span>O/H - Obstetric History</span>
                  <textarea value={admissionForm.obstetric_history} onChange={(event) => setAdmissionForm({ ...admissionForm, obstetric_history: event.target.value })} placeholder="Obstetric history" />
                </label>
              </div>
            </div>

            <div className="form-section full-span">
              <div className="form-section-head">
                <div>
                  <p className="eyebrow">Treatment</p>
                  <h4>Daily workflow and discharge</h4>
                </div>
                <small>These notes sync into the shared backend so the IPD record is available beyond one browser session.</small>
              </div>
              <div className="form-grid">
                <label className="form-field">
                  <span>Daily Treatment Chart Entry</span>
                  <textarea value={admissionForm.treatment_notes} onChange={(event) => setAdmissionForm({ ...admissionForm, treatment_notes: event.target.value })} placeholder="Daily treatment chart entry" />
                </label>
                <label className="form-field">
                  <span>Panchakarma Schedule</span>
                  <textarea value={admissionForm.panchakarma_schedule} onChange={(event) => setAdmissionForm({ ...admissionForm, panchakarma_schedule: event.target.value })} placeholder="One line per Panchakarma entry" />
                </label>
                <label className="form-field">
                  <span>Medicine Administration</span>
                  <textarea value={admissionForm.medicine_administration} onChange={(event) => setAdmissionForm({ ...admissionForm, medicine_administration: event.target.value })} placeholder="One line per medicine entry" />
                </label>
                <label className="form-field">
                  <span>Diet Plan</span>
                  <textarea value={admissionForm.diet_plan} onChange={(event) => setAdmissionForm({ ...admissionForm, diet_plan: event.target.value })} placeholder="Diet plan" />
                </label>
                <label className="form-field">
                  <span>Daily Progress</span>
                  <textarea value={admissionForm.daily_progress} onChange={(event) => setAdmissionForm({ ...admissionForm, daily_progress: event.target.value })} placeholder="Daily progress" />
                </label>
                <label className="form-field">
                  <span>Discharge Summary</span>
                  <textarea value={admissionForm.discharge_summary} onChange={(event) => setAdmissionForm({ ...admissionForm, discharge_summary: event.target.value })} placeholder="Discharge summary" />
                </label>
                <label className="form-field">
                  <span>Final Invoice</span>
                  <input value={admissionForm.final_invoice} onChange={(event) => setAdmissionForm({ ...admissionForm, final_invoice: event.target.value })} placeholder="Final invoice" type="number" min="0" />
                </label>
                <label className="form-field">
                  <span>Status</span>
                  <select value={admissionForm.status} onChange={(event) => setAdmissionForm({ ...admissionForm, status: event.target.value })}>
                    <option>Admitted</option>
                    <option>Discharged</option>
                  </select>
                </label>
              </div>
            </div>

            <button type="submit" className="primary-button full-span">Save Admission</button>
          </form>
        </Panel>
      </div>
    )
  }

  function renderDiseaseMaster() {
    return (
      <div className="view-stack">
        <SectionIntro eyebrow="Disease Master" title="Illness templates with predefined medicines, dosage, duration, diet advice, lifestyle advice, and notes." />
        <div className="card-grid two">
          {diseaseMaster.map((item) => (
            <Panel key={item.id} title={item.illness} subtitle={item.notes}>
              <div className="prescription-list">
                {item.recommended_medicines.map((medicine) => (
                  <div key={`${item.id}-${medicine.medicine}`} className="prescription-item">
                    <strong>{medicine.medicine}</strong>
                    <small>{medicine.dosage} | {medicine.schedule}</small>
                    <small>{medicine.duration} | Qty {medicine.quantity}</small>
                  </div>
                ))}
              </div>
              <KeyValue label="Diet Advice" value={item.diet_advice} />
              <KeyValue label="Lifestyle Advice" value={item.lifestyle_advice} />
              <button type="button" className="primary-button" onClick={() => applyDiseaseTemplate(item.id)}>Load Into OPD</button>
            </Panel>
          ))}
        </div>
      </div>
    )
  }

  function renderMedicines() {
    return (
      <div className="view-stack">
        <SectionIntro eyebrow="Medicine Catalog" title="Unit-based Ayurvedic medicine catalog with purchase units, dispensing units, conversion, pricing, stock, batch, supplier, and expiry." />
        <Panel title="Medicine Catalog" subtitle="High-quality dummy medicine data stored locally in the browser.">
          <SimpleTable
            columns={['Medicine', 'Category', 'Purchase Unit', 'Dispensing Unit', 'Conversion', 'Batch', 'Stock', 'Expiry', 'Supplier']}
            rows={stockWarnings.map((medicine) => [
              medicine.medicine_name,
              medicine.category,
              medicine.purchase_unit,
              medicine.dispensing_unit,
              medicine.unit_conversion,
              medicine.batch_number,
              <StatusPill key={`${medicine.id}-stock`} value={`${medicine.current_stock}`} tone={medicine.alert} />,
              formatDate(medicine.expiry_date),
              supplierNameById[medicine.supplier_id] || 'Not assigned',
            ])}
          />
        </Panel>
        <Panel title="Catalog Note" subtitle="Medicine master changes are kept in Clinic Admin so the operational catalog stays focused and clean.">
          <div className="pill-row">
            {(settings.supported_units || []).map((unit) => (
              <InfoPill key={unit} text={unit} />
            ))}
          </div>
          <p>Use the Clinic Admin module for medicine master maintenance, supplier updates, unit management, and purchase setup.</p>
        </Panel>
      </div>
    )
  }

  function renderPackages() {
    return (
      <div className="view-stack">
        <SectionIntro eyebrow="Package Management" title="Default 1, 3, and 6 month treatment plans with consultations, follow-ups, therapies, Panchakarma, discounts, validity, and renewal reminders." />
        <div className="card-grid three">
          {packages.map((item) => (
            <Panel key={item.id} title={item.name} subtitle={`Validity ${item.package_validity} | Discount ${item.discount}`}>
              <KeyValue label="Included Medicines" value={item.included_medicines.join(', ')} />
              <KeyValue label="Consultation Frequency" value={item.consultation_frequency} />
              <KeyValue label="Follow-up Schedule" value={item.follow_up_schedule} />
              <KeyValue label="Therapy Sessions" value={item.therapy_sessions} />
              <KeyValue label="Panchakarma Sessions" value={item.panchakarma_sessions} />
              <KeyValue label="Auto Renewal Reminder" value={formatDate(item.auto_renewal_reminder)} />
            </Panel>
          ))}
        </div>
      </div>
    )
  }

  function renderInventory() {
    return (
      <div className="view-stack">
        <SectionIntro eyebrow="Inventory Management" title="Stock in, stock out, adjustments, physical verification, supplier tracking, purchase history, and color-coded stock warnings." />
        <div className="card-grid five">
          <StatCard label="Low Stock" value={warningBuckets.low.length} tone="warning" />
          <StatCard label="Out of Stock" value={warningBuckets.out.length} tone="danger" />
          <StatCard label="Near Expiry" value={warningBuckets.nearExpiry.length} tone="warning" />
          <StatCard label="Expired" value={warningBuckets.expired.length} tone="danger" />
          <StatCard label="Slow Moving" value={warningBuckets.slow.length} tone="primary" />
        </div>
        <div className="split-grid">
          <Panel title="Stock Warning Cards" subtitle="Automatic warning cards generated from local medicine stock and expiry values.">
            <div className="list-stack">
              {stockWarnings.map((medicine) => (
                <div key={medicine.id} className={`warning-card ${medicine.alert}`}>
                  <div className="list-card-header">
                    <strong>{medicine.medicine_name}</strong>
                    <StatusPill value={medicine.alert.replace('-', ' ')} tone={medicine.alert} />
                  </div>
                  <small>Stock {medicine.current_stock} | Expiry {formatDate(medicine.expiry_date)}</small>
                  <p>Batch {medicine.batch_number} | Supplier {supplierNameById[medicine.supplier_id] || 'Not assigned'}</p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Inventory Action" subtitle="Update stock locally for dispensing, stock adjustment, and verification workflows.">
            <form className="form-grid" onSubmit={handleInventorySubmit}>
              <select value={inventoryForm.medicine_id} onChange={(event) => setInventoryForm({ ...inventoryForm, medicine_id: event.target.value })} required>
                <option value="">Medicine</option>
                {medicineCatalog.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.medicine_name}</option>)}
              </select>
              <select value={inventoryForm.action} onChange={(event) => setInventoryForm({ ...inventoryForm, action: event.target.value })}>{inventoryActions.map((item) => <option key={item}>{item}</option>)}</select>
              <input type="number" min="0" value={inventoryForm.quantity} onChange={(event) => setInventoryForm({ ...inventoryForm, quantity: event.target.value })} placeholder="Quantity" required />
              <button type="submit" className="primary-button">{inventoryForm.action}</button>
            </form>
            <SimpleTable
              columns={['PO Number', 'Supplier', 'Date', 'Status', 'Amount']}
              rows={(workspace?.purchases || []).map((purchase) => [purchase.purchase_order_number, supplierNameById[purchase.supplier_id] || 'Unknown', formatDate(purchase.purchase_date), purchase.status, formatCurrency(purchase.total_amount)])}
            />
          </Panel>
        </div>
      </div>
    )
  }

  function renderBilling() {
    return (
      <div className="view-stack">
        <SectionIntro eyebrow="Billing" title="Invoices for consultations, medicines, packages, Panchakarma, and therapies with payment status and receipt printing." />
        <div className="split-grid">
          <Panel title="Invoice Register" subtitle="Select a bill to review the printable receipt card.">
            <div className="list-stack">
              {invoices.map((invoice) => (
                <button key={invoice.id} type="button" className={selectedInvoiceId === invoice.id ? 'list-card active' : 'list-card'} onClick={() => setSelectedInvoiceId(invoice.id)}>
                  <div className="list-card-header">
                    <strong>{invoice.invoice_number}</strong>
                    <StatusPill value={invoice.payment_status} />
                  </div>
                  <small>{invoice.patient_name}</small>
                  <p>{formatCurrency(invoice.total_amount)}</p>
                </button>
              ))}
            </div>
          </Panel>
          <Panel title="Receipt Preview" subtitle="Printable demo receipt for training and testing.">
            {selectedInvoice ? (
              <div className="printable-card">
                <KeyValue label="Invoice Number" value={selectedInvoice.invoice_number} />
                <KeyValue label="Patient" value={selectedInvoice.patient_name} />
                <KeyValue label="Bill Type" value={selectedInvoice.bill_type} />
                <KeyValue label="Consultation" value={formatCurrency(selectedInvoice.consultation)} />
                <KeyValue label="Medicines" value={formatCurrency(selectedInvoice.medicines)} />
                <KeyValue label="Packages" value={formatCurrency(selectedInvoice.treatment_packages)} />
                <KeyValue label="Panchakarma" value={formatCurrency(selectedInvoice.panchakarma)} />
                <KeyValue label="Therapies" value={formatCurrency(selectedInvoice.therapies)} />
                <KeyValue label="Discount" value={formatCurrency(selectedInvoice.discount)} />
                <KeyValue label="Total Amount" value={formatCurrency(selectedInvoice.total_amount)} />
                <KeyValue label="Paid Amount" value={formatCurrency(selectedInvoice.paid_amount)} />
                <KeyValue label="Payment Status" value={selectedInvoice.payment_status} />
                <small>{settings.receipt_footer}</small>
                <button type="button" className="primary-button" onClick={printCurrentView}>Print Receipt</button>
              </div>
            ) : (
              <EmptyState title="No invoice selected" text="Select a demo invoice to review the receipt layout." />
            )}
          </Panel>
        </div>
        <Panel title="Create Invoice" subtitle="Generate local invoices with discounts and payment tracking.">
          <form className="form-grid" onSubmit={handleInvoiceSubmit}>
            <select value={invoiceForm.patient_id} onChange={(event) => setInvoiceForm({ ...invoiceForm, patient_id: event.target.value })} required>
              <option value="">Patient</option>
              {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
            </select>
            <input value={invoiceForm.bill_type} onChange={(event) => setInvoiceForm({ ...invoiceForm, bill_type: event.target.value })} placeholder="Bill type" />
            <input type="number" min="0" value={invoiceForm.consultation} onChange={(event) => setInvoiceForm({ ...invoiceForm, consultation: event.target.value })} placeholder="Consultation" />
            <input type="number" min="0" value={invoiceForm.medicines} onChange={(event) => setInvoiceForm({ ...invoiceForm, medicines: event.target.value })} placeholder="Medicines" />
            <input type="number" min="0" value={invoiceForm.treatment_packages} onChange={(event) => setInvoiceForm({ ...invoiceForm, treatment_packages: event.target.value })} placeholder="Treatment packages" />
            <input type="number" min="0" value={invoiceForm.panchakarma} onChange={(event) => setInvoiceForm({ ...invoiceForm, panchakarma: event.target.value })} placeholder="Panchakarma" />
            <input type="number" min="0" value={invoiceForm.therapies} onChange={(event) => setInvoiceForm({ ...invoiceForm, therapies: event.target.value })} placeholder="Therapies" />
            <input type="number" min="0" value={invoiceForm.discount} onChange={(event) => setInvoiceForm({ ...invoiceForm, discount: event.target.value })} placeholder="Discount" />
            <input type="number" min="0" value={invoiceForm.paid_amount} onChange={(event) => setInvoiceForm({ ...invoiceForm, paid_amount: event.target.value })} placeholder="Paid amount" />
            <select value={invoiceForm.payment_status} onChange={(event) => setInvoiceForm({ ...invoiceForm, payment_status: event.target.value })}>
              <option>Paid</option>
              <option>Partial</option>
              <option>Pending</option>
            </select>
            <input type="date" value={invoiceForm.created_at} onChange={(event) => setInvoiceForm({ ...invoiceForm, created_at: event.target.value })} />
            <button type="submit" className="primary-button">Save Invoice</button>
          </form>
        </Panel>
      </div>
    )
  }

  function renderReports() {
    return (
      <div className="view-stack">
        <SectionIntro eyebrow="Reports" title="Daily revenue, monthly revenue, patient visits, medicine sales, inventory, low stock, expiry, package sales, OPD statistics, and IPD statistics." />
        <div className="card-grid five">
          <StatCard label="Daily Revenue" value={formatCurrency(reports.dailyRevenue || 0)} tone="success" />
          <StatCard label="Monthly Revenue" value={formatCurrency(reports.monthlyRevenue || 0)} tone="primary" />
          <StatCard label="Patient Visits" value={reports.patientVisits || 0} tone="info" />
          <StatCard label="Medicine Sales" value={formatCurrency(reports.medicineSales || 0)} tone="warning" />
          <StatCard label="Inventory Value" value={formatCurrency(reports.inventoryValue || 0)} tone="primary" />
        </div>
        <div className="card-grid five">
          <StatCard label="Low Stock" value={reports.lowStock || 0} tone="warning" />
          <StatCard label="Expiry" value={reports.expiry || 0} tone="danger" />
          <StatCard label="Package Sales" value={formatCurrency(reports.packageSales || 0)} tone="success" />
          <StatCard label="OPD Statistics" value={reports.opdStatistics || 0} tone="info" />
          <StatCard label="IPD Statistics" value={reports.ipdStatistics || 0} tone="warning" />
        </div>
      </div>
    )
  }

  function renderNotifications() {
    return (
      <div className="view-stack">
        <SectionIntro eyebrow="Notifications" title="Appointment, follow-up, package expiry, low stock, and medicine expiry reminders generated from local demo data." />
        <div className="list-stack">
          {notifications.map((item) => (
            <div key={item.id} className="list-card">
              <div className="list-card-header">
                <strong>{item.title}</strong>
                <StatusPill value={item.type} tone={item.type} />
              </div>
              <p>{item.message}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderAdmin() {
    const adminOverviewCards = [
      { label: 'Users', value: users.length, tone: 'primary' },
      { label: 'Medicines', value: medicineCatalog.length, tone: 'info' },
      { label: 'Diseases', value: diseaseMaster.length, tone: 'success' },
      { label: 'Suppliers', value: suppliers.length, tone: 'warning' },
      { label: 'Purchases', value: purchases.length, tone: 'primary' },
      { label: 'Packages', value: packages.length, tone: 'success' },
    ]

    function renderAdminContent() {
      switch (activeAdminSection) {
        case 'users':
          return (
            <div className="split-grid">
              <Panel title="User Management" subtitle="Manage clinic users, their emails, linked auth accounts, and module access.">
                <SimpleTable
                  columns={['Name', 'Email', 'Role', 'Status', 'Phone', 'Access', 'Auth Status']}
                  rows={users.map((user) => [
                    user.name,
                    user.email || '-',
                    user.role,
                    user.status,
                    user.phone,
                    `${normalizeAccessList(user.allowed_views, user.role).length} modules`,
                    activeUser?.id === user.id
                      ? 'Signed in user'
                      : user.auth_user_id
                        ? 'Linked'
                        : user.email
                          ? 'Email ready'
                          : 'No email',
                  ])}
                />
                <div className="list-stack">
                  {users.map((user) => {
                    const userAccess = normalizeAccessList(user.allowed_views, user.role)
                    const isSignedInUser = activeUser?.id === user.id
                    return (
                      <div key={user.id} className="access-card">
                        <div className="list-card-header">
                          <div>
                            <strong>{user.name}</strong>
                            <small>{user.role} | {user.status}</small>
                            <small>{user.email || 'No authentication email assigned'}</small>
                          </div>
                          {canSwitchUsers ? (
                            <button
                              type="button"
                              className={workspace?.currentUserId === user.id ? 'chip-button active-chip' : 'chip-button'}
                              onClick={() => handleActiveUserChange(user.id)}
                            >
                              {workspace?.currentUserId === user.id ? 'Active User' : 'Set Active'}
                            </button>
                          ) : (
                            <StatusPill
                              value={isSignedInUser ? 'Signed In' : user.auth_user_id ? 'Linked' : 'Pending Link'}
                              tone={isSignedInUser ? 'success' : user.auth_user_id ? 'primary' : 'warning'}
                            />
                          )}
                        </div>
                        <div className="pill-row">
                          {userAccessOptions.map((option) => (
                            <button
                              key={`${user.id}-${option.key}`}
                              type="button"
                              className={userAccess.includes(option.key) ? 'chip-button active-chip' : 'chip-button'}
                              onClick={() => handleUserAccessToggle(user.id, option.key)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Panel>
              <Panel title="Add User" subtitle="Create clinic users and assign module access at the same time.">
                <form className="form-grid" onSubmit={handleUserSubmit}>
                  <div className="full-span action-row">
                    <button type="button" className="ghost-button" onClick={handlePrepareAdminTemplate}>
                      Use Admin Template
                    </button>
                  </div>
                  <input value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} placeholder="User name" required />
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(event) => setUserForm({ ...userForm, email: event.target.value })}
                    placeholder="Email used for sign-in"
                    required
                  />
                  <select
                    value={userForm.role}
                    onChange={(event) =>
                      setUserForm({
                        ...userForm,
                        role: event.target.value,
                        allowed_views: getDefaultAccess(event.target.value),
                      })
                    }
                  >
                    {Object.keys(roleAccessDefaults).map((role) => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>
                  <select value={userForm.status} onChange={(event) => setUserForm({ ...userForm, status: event.target.value })}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                  <input value={userForm.phone} onChange={(event) => setUserForm({ ...userForm, phone: event.target.value })} placeholder="Phone" required />
                  <input value={userForm.shift} onChange={(event) => setUserForm({ ...userForm, shift: event.target.value })} placeholder="Shift" required />
                  <div className="full-span access-card">
                    <div className="list-card-header">
                      <strong>Allowed Modules</strong>
                      <button
                        type="button"
                        className="chip-button"
                        onClick={() => setUserForm({ ...userForm, allowed_views: [...fullAccessKeys] })}
                      >
                        Grant All
                      </button>
                    </div>
                    <div className="pill-row">
                      {userAccessOptions.map((option) => {
                        const enabled = normalizeAccessList(userForm.allowed_views, userForm.role).includes(option.key)
                        return (
                          <button
                            key={`new-${option.key}`}
                            type="button"
                            className={enabled ? 'chip-button active-chip' : 'chip-button'}
                            onClick={() =>
                              setUserForm((current) => {
                                const nextAccess = normalizeAccessList(current.allowed_views, current.role)
                                return {
                                  ...current,
                                  allowed_views: enabled
                                    ? nextAccess.filter((item) => item !== option.key)
                                    : [...nextAccess, option.key],
                                }
                              })
                            }
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <button type="submit" className="primary-button">Save User</button>
                </form>
              </Panel>
            </div>
          )
        case 'medicines':
          return (
            <div className="split-grid">
              <Panel title="Medicine Master" subtitle="Required medicine master content only.">
                <SimpleTable
                  columns={['Medicine', 'Category', 'Dispensing Unit', 'Stock', 'Expiry', 'Supplier']}
                  rows={medicineCatalog.map((medicine) => [
                    medicine.medicine_name,
                    medicine.category,
                    medicine.dispensing_unit,
                    medicine.current_stock,
                    formatDate(medicine.expiry_date),
                    supplierNameById[medicine.supplier_id] || 'Not assigned',
                  ])}
                />
              </Panel>
              <Panel title="Add Medicine" subtitle="Create medicine master entries from the admin module.">
                <form className="form-grid" onSubmit={handleMedicineSubmit}>
                  <input value={medicineForm.medicine_name} onChange={(event) => setMedicineForm({ ...medicineForm, medicine_name: event.target.value })} placeholder="Medicine name" required />
                  <input value={medicineForm.category} onChange={(event) => setMedicineForm({ ...medicineForm, category: event.target.value })} placeholder="Category" required />
                  <input value={medicineForm.purchase_unit} onChange={(event) => setMedicineForm({ ...medicineForm, purchase_unit: event.target.value })} placeholder="Purchase unit" required />
                  <input value={medicineForm.dispensing_unit} onChange={(event) => setMedicineForm({ ...medicineForm, dispensing_unit: event.target.value })} placeholder="Dispensing unit" required />
                  <input value={medicineForm.unit_conversion} onChange={(event) => setMedicineForm({ ...medicineForm, unit_conversion: event.target.value })} placeholder="Unit conversion" required />
                  <input value={medicineForm.batch_number} onChange={(event) => setMedicineForm({ ...medicineForm, batch_number: event.target.value })} placeholder="Batch number" required />
                  <input type="number" min="0" value={medicineForm.purchase_price} onChange={(event) => setMedicineForm({ ...medicineForm, purchase_price: event.target.value })} placeholder="Purchase price" />
                  <input type="number" min="0" value={medicineForm.selling_price} onChange={(event) => setMedicineForm({ ...medicineForm, selling_price: event.target.value })} placeholder="Selling price" />
                  <input type="number" min="0" value={medicineForm.current_stock} onChange={(event) => setMedicineForm({ ...medicineForm, current_stock: event.target.value })} placeholder="Current stock" />
                  <input type="number" min="0" value={medicineForm.low_stock_level} onChange={(event) => setMedicineForm({ ...medicineForm, low_stock_level: event.target.value })} placeholder="Low stock level" />
                  <input type="date" value={medicineForm.expiry_date} onChange={(event) => setMedicineForm({ ...medicineForm, expiry_date: event.target.value })} />
                  <input value={medicineForm.manufacturer} onChange={(event) => setMedicineForm({ ...medicineForm, manufacturer: event.target.value })} placeholder="Manufacturer" />
                  <select value={medicineForm.supplier_id} onChange={(event) => setMedicineForm({ ...medicineForm, supplier_id: event.target.value })}>
                    <option value="">Supplier</option>
                    {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                  </select>
                  <input type="number" min="0" value={medicineForm.monthly_movement} onChange={(event) => setMedicineForm({ ...medicineForm, monthly_movement: event.target.value })} placeholder="Monthly movement" />
                  <button type="submit" className="primary-button">Save Medicine</button>
                </form>
              </Panel>
            </div>
          )
        case 'diseases':
          return (
            <div className="split-grid">
              <Panel title="Disease Master" subtitle="Illness templates used for Ayurvedic prescribing.">
                <SimpleTable
                  columns={['Illness', 'Medicines', 'Diet Advice', 'Lifestyle Advice']}
                  rows={diseaseMaster.map((item) => [
                    item.illness,
                    item.recommended_medicines.map((medicine) => medicine.medicine).join(', '),
                    item.diet_advice,
                    item.lifestyle_advice,
                  ])}
                />
              </Panel>
              <Panel title="Add Disease Template" subtitle="Create reusable illness-based prescription templates.">
                <form className="form-grid" onSubmit={handleDiseaseSubmit}>
                  <input value={diseaseForm.illness} onChange={(event) => setDiseaseForm({ ...diseaseForm, illness: event.target.value })} placeholder="Illness name" required />
                  <textarea className="full-span" value={diseaseForm.medicines_text} onChange={(event) => setDiseaseForm({ ...diseaseForm, medicines_text: event.target.value })} placeholder="Medicine | Dosage | Morning/Afternoon/Night | Before/After food | Duration | Quantity" required />
                  <textarea value={diseaseForm.diet_advice} onChange={(event) => setDiseaseForm({ ...diseaseForm, diet_advice: event.target.value })} placeholder="Diet advice" required />
                  <textarea value={diseaseForm.lifestyle_advice} onChange={(event) => setDiseaseForm({ ...diseaseForm, lifestyle_advice: event.target.value })} placeholder="Lifestyle advice" required />
                  <textarea value={diseaseForm.notes} onChange={(event) => setDiseaseForm({ ...diseaseForm, notes: event.target.value })} placeholder="Notes" />
                  <button type="submit" className="primary-button">Save Disease</button>
                </form>
              </Panel>
            </div>
          )
        case 'units':
          return (
            <div className="split-grid">
              <Panel title="Unit Management" subtitle="Dispensing units supported in the clinic.">
                <div className="pill-row">
                  {(settings.supported_units || []).map((unit) => (
                    <InfoPill key={unit} text={unit} />
                  ))}
                </div>
              </Panel>
              <Panel title="Add Unit" subtitle="Add only clinic-required dispensing units.">
                <div className="form-grid">
                  <input value={unitName} onChange={(event) => setUnitName(event.target.value)} placeholder="Unit name" />
                  <button type="button" className="primary-button" onClick={handleUnitAdd}>Add Unit</button>
                </div>
              </Panel>
            </div>
          )
        case 'inventory':
          return (
            <div className="split-grid">
              <Panel title="Inventory Control" subtitle="Stock status and warning summary from the clinic inventory.">
                <SimpleTable
                  columns={['Medicine', 'Stock', 'Low Level', 'Expiry', 'Warning']}
                  rows={stockWarnings.map((medicine) => [
                    medicine.medicine_name,
                    medicine.current_stock,
                    medicine.low_stock_level,
                    formatDate(medicine.expiry_date),
                    <StatusPill key={medicine.id} value={medicine.alert.replace('-', ' ')} tone={medicine.alert} />,
                  ])}
                />
              </Panel>
              <Panel title="Stock Warning Settings" subtitle="Current thresholds used across the clinic workspace.">
                <KeyValue label="Near Expiry Days" value={settings.near_expiry_days} />
                <KeyValue label="Default Low Stock Threshold" value={settings.low_stock_threshold} />
                <KeyValue label="Low Stock Medicines" value={warningBuckets.low.length} />
                <KeyValue label="Out of Stock Medicines" value={warningBuckets.out.length} />
                <KeyValue label="Near Expiry Medicines" value={warningBuckets.nearExpiry.length} />
                <KeyValue label="Expired Medicines" value={warningBuckets.expired.length} />
              </Panel>
            </div>
          )
        case 'suppliers':
          return (
            <div className="split-grid">
              <Panel title="Supplier Management" subtitle="Required supplier records only.">
                <SimpleTable
                  columns={['Supplier', 'Contact Person', 'Phone', 'Address']}
                  rows={suppliers.map((supplier) => [supplier.name, supplier.contact_person, supplier.phone, supplier.address])}
                />
              </Panel>
              <Panel title="Add Supplier" subtitle="Create supplier records for procurement and stock intake.">
                <form className="form-grid" onSubmit={handleSupplierSubmit}>
                  <input value={supplierForm.name} onChange={(event) => setSupplierForm({ ...supplierForm, name: event.target.value })} placeholder="Supplier name" required />
                  <input value={supplierForm.contact_person} onChange={(event) => setSupplierForm({ ...supplierForm, contact_person: event.target.value })} placeholder="Contact person" required />
                  <input value={supplierForm.phone} onChange={(event) => setSupplierForm({ ...supplierForm, phone: event.target.value })} placeholder="Phone" required />
                  <textarea value={supplierForm.address} onChange={(event) => setSupplierForm({ ...supplierForm, address: event.target.value })} placeholder="Address" />
                  <button type="submit" className="primary-button">Save Supplier</button>
                </form>
              </Panel>
            </div>
          )
        case 'purchases':
          return (
            <div className="split-grid">
              <Panel title="Purchase Management" subtitle="Purchase orders, supplier linkage, and amount tracking.">
                <SimpleTable
                  columns={['PO Number', 'Supplier', 'Date', 'Status', 'Amount']}
                  rows={purchases.map((purchase) => [
                    purchase.purchase_order_number,
                    supplierNameById[purchase.supplier_id] || 'Unknown',
                    formatDate(purchase.purchase_date),
                    purchase.status,
                    formatCurrency(purchase.total_amount),
                  ])}
                />
              </Panel>
              <Panel title="Add Purchase" subtitle="Create purchase orders for local inventory intake.">
                <form className="form-grid" onSubmit={handlePurchaseSubmit}>
                  <select value={purchaseForm.supplier_id} onChange={(event) => setPurchaseForm({ ...purchaseForm, supplier_id: event.target.value })} required>
                    <option value="">Supplier</option>
                    {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                  </select>
                  <input type="date" value={purchaseForm.purchase_date} onChange={(event) => setPurchaseForm({ ...purchaseForm, purchase_date: event.target.value })} required />
                  <select value={purchaseForm.status} onChange={(event) => setPurchaseForm({ ...purchaseForm, status: event.target.value })}>
                    <option>Pending Receipt</option>
                    <option>Received</option>
                    <option>Cancelled</option>
                  </select>
                  <input type="number" min="0" value={purchaseForm.total_amount} onChange={(event) => setPurchaseForm({ ...purchaseForm, total_amount: event.target.value })} placeholder="Total amount" required />
                  <textarea className="full-span" value={purchaseForm.items_text} onChange={(event) => setPurchaseForm({ ...purchaseForm, items_text: event.target.value })} placeholder="Medicine | Quantity | Purchase unit | Batch number" required />
                  <button type="submit" className="primary-button">Save Purchase</button>
                </form>
              </Panel>
            </div>
          )
        case 'packages':
          return (
            <div className="split-grid">
              <Panel title="Package Management" subtitle="Active package plans for 1, 3, and 6 month care cycles.">
                <SimpleTable
                  columns={['Package', 'Medicines', 'Consultation Frequency', 'Therapy Sessions', 'Panchakarma Sessions', 'Renewal']}
                  rows={packages.map((item) => [
                    item.name,
                    item.included_medicines.join(', '),
                    item.consultation_frequency,
                    item.therapy_sessions,
                    item.panchakarma_sessions,
                    formatDate(item.auto_renewal_reminder),
                  ])}
                />
              </Panel>
              <Panel title="Add Package" subtitle="Create package definitions for clinic follow-up care.">
                <form className="form-grid" onSubmit={handlePackageSubmit}>
                  <input value={packageForm.name} onChange={(event) => setPackageForm({ ...packageForm, name: event.target.value })} placeholder="Package name" required />
                  <input value={packageForm.included_medicines} onChange={(event) => setPackageForm({ ...packageForm, included_medicines: event.target.value })} placeholder="Included medicines, comma separated" required />
                  <input value={packageForm.consultation_frequency} onChange={(event) => setPackageForm({ ...packageForm, consultation_frequency: event.target.value })} placeholder="Consultation frequency" required />
                  <input value={packageForm.follow_up_schedule} onChange={(event) => setPackageForm({ ...packageForm, follow_up_schedule: event.target.value })} placeholder="Follow-up schedule" required />
                  <input type="number" min="0" value={packageForm.therapy_sessions} onChange={(event) => setPackageForm({ ...packageForm, therapy_sessions: event.target.value })} placeholder="Therapy sessions" />
                  <input type="number" min="0" value={packageForm.panchakarma_sessions} onChange={(event) => setPackageForm({ ...packageForm, panchakarma_sessions: event.target.value })} placeholder="Panchakarma sessions" />
                  <input value={packageForm.discount} onChange={(event) => setPackageForm({ ...packageForm, discount: event.target.value })} placeholder="Discount" />
                  <input value={packageForm.package_validity} onChange={(event) => setPackageForm({ ...packageForm, package_validity: event.target.value })} placeholder="Package validity" required />
                  <input type="date" value={packageForm.auto_renewal_reminder} onChange={(event) => setPackageForm({ ...packageForm, auto_renewal_reminder: event.target.value })} required />
                  <button type="submit" className="primary-button">Save Package</button>
                </form>
              </Panel>
            </div>
          )
        case 'reports':
          return (
            <Panel title="Admin Reports Summary" subtitle="Required operational report metrics for the clinic.">
              <div className="card-grid five admin-compact-grid">
                <StatCard label="Daily Revenue" value={formatCurrency(reports.dailyRevenue || 0)} tone="success" />
                <StatCard label="Monthly Revenue" value={formatCurrency(reports.monthlyRevenue || 0)} tone="primary" />
                <StatCard label="Medicine Sales" value={formatCurrency(reports.medicineSales || 0)} tone="warning" />
                <StatCard label="OPD Stats" value={reports.opdStatistics || 0} tone="info" />
                <StatCard label="IPD Stats" value={reports.ipdStatistics || 0} tone="primary" />
              </div>
            </Panel>
          )
        case 'settings':
          return (
            <Panel title="System Settings" subtitle="Clinic-level settings and warning controls only.">
              <form className="form-grid" onSubmit={handleAdminSettingsSubmit}>
                <input value={settingsForm.clinic_name} onChange={(event) => setSettingsForm({ ...settingsForm, clinic_name: event.target.value })} placeholder="Clinic name" required />
                <input value={settingsForm.clinic_location} onChange={(event) => setSettingsForm({ ...settingsForm, clinic_location: event.target.value })} placeholder="Clinic location" required />
                <input value={settingsForm.clinic_contact} onChange={(event) => setSettingsForm({ ...settingsForm, clinic_contact: event.target.value })} placeholder="Clinic contact" required />
                <input value={settingsForm.clinic_hours} onChange={(event) => setSettingsForm({ ...settingsForm, clinic_hours: event.target.value })} placeholder="Clinic hours" required />
                <input type="number" min="1" value={settingsForm.near_expiry_days} onChange={(event) => setSettingsForm({ ...settingsForm, near_expiry_days: event.target.value })} placeholder="Near expiry days" required />
                <input type="number" min="1" value={settingsForm.low_stock_threshold} onChange={(event) => setSettingsForm({ ...settingsForm, low_stock_threshold: event.target.value })} placeholder="Default low stock threshold" required />
                <textarea value={settingsForm.receipt_footer} onChange={(event) => setSettingsForm({ ...settingsForm, receipt_footer: event.target.value })} placeholder="Receipt footer" />
                <textarea value={settingsForm.backup_note} onChange={(event) => setSettingsForm({ ...settingsForm, backup_note: event.target.value })} placeholder="Backup note" />
                <button type="submit" className="primary-button">Save Settings</button>
              </form>
            </Panel>
          )
        case 'backup':
          return (
            <Panel title="Backup & Restore" subtitle="Local backup actions for demo and testing use only.">
              <div className="action-row">
                <button type="button" className="primary-button" onClick={handleBackupGenerate}>Generate Backup</button>
                <button type="button" className="ghost-button" onClick={handleBackupRestore}>Restore Backup</button>
                <button type="button" className="ghost-button" onClick={handleResetWorkspace}>Reset Demo Data</button>
              </div>
              <textarea value={backupText} onChange={(event) => setBackupText(event.target.value)} placeholder="Backup JSON appears here for restore and testing." />
            </Panel>
          )
        default:
          return (
            <div className="view-stack">
              <div className="card-grid three">
                {adminOverviewCards.map((item) => (
                  <StatCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
                ))}
              </div>
              <div className="split-grid">
                <Panel title="Authentication Readiness" subtitle="Quick visibility into which clinic users are ready for secure sign-in.">
                  <div className="card-grid two admin-compact-grid">
                    <StatCard label="Administrators" value={administratorUsers.length} tone="primary" />
                    <StatCard label="Active Users" value={activeClinicUsers.length} tone="success" />
                    <StatCard label="Linked Auth Users" value={linkedAuthUsers.length} tone="info" />
                    <StatCard label="Pending Links" value={pendingAuthUsers.length} tone="warning" />
                  </div>
                </Panel>
                <Panel title="First Admin Setup" subtitle="Use the seeded admin email to create the first full-access clinic account quickly.">
                  <div className="list-stack">
                    <div className="access-card">
                      <div className="list-card-header">
                        <div>
                          <strong>Clinic Administrator</strong>
                          <small>admin@svkini.clinic</small>
                        </div>
                        <StatusPill value="Recommended" tone="primary" />
                      </div>
                      <p>Create the clinic account with this exact email, then sign in to open all clinic admin tools immediately.</p>
                    </div>
                    {administratorUsers.map((user) => (
                      <div key={user.id} className="access-card">
                        <div className="list-card-header">
                          <div>
                            <strong>{user.name}</strong>
                            <small>{user.email || 'No email assigned'}</small>
                          </div>
                          <StatusPill value={user.auth_user_id ? 'Linked' : 'Pending'} tone={user.auth_user_id ? 'success' : 'warning'} />
                        </div>
                        <p>{user.role} | {normalizeAccessList(user.allowed_views, user.role).length} modules enabled</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          )
      }
    }

    return (
      <div className="view-stack">
        <SectionIntro eyebrow="Clinic Admin" title="Clinic administration with only the required management tools for daily operations." />
        <div className="admin-tab-row">
          {adminSections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={activeAdminSection === section.key ? 'chip-button active-chip' : 'chip-button'}
              onClick={() => selectAdminSection(section.key)}
            >
              {section.label}
            </button>
          ))}
        </div>
        {renderAdminContent()}
      </div>
    )
  }

  function renderView() {
    switch (resolvedActiveView) {
      case 'Patients':
        return renderPatients()
      case 'VisitPlanner':
        return renderVisitPlanner()
      case 'OPD':
        return renderOPD()
      case 'IPD':
        return renderIPD()
      case 'DiseaseMaster':
        return renderDiseaseMaster()
      case 'Medicines':
        return renderMedicines()
      case 'Packages':
        return renderPackages()
      case 'Inventory':
        return renderInventory()
      case 'Billing':
        return renderBilling()
      case 'Reports':
        return renderReports()
      case 'Notifications':
        return renderNotifications()
      case 'Admin':
        return renderAdmin()
      default:
        return renderDashboard()
    }
  }

  function renderGlobalSearch() {
    if (!globalSearchOpen) {
      return null
    }

    return (
      <div className="modal-backdrop" onClick={() => setGlobalSearchOpen(false)}>
        <div className="search-modal" onClick={(event) => event.stopPropagation()}>
          <div className="list-card-header">
            <div>
              <strong>Global Search</strong>
              <small>Search patients, visits, consultations, medicines, invoices, suppliers, and users.</small>
            </div>
            <button type="button" className="ghost-button" onClick={() => setGlobalSearchOpen(false)}>
              Close
            </button>
          </div>
          <input
            autoFocus
            value={globalSearchQuery}
            onChange={(event) => setGlobalSearchQuery(event.target.value)}
            placeholder="Search by patient, medicine, invoice, supplier, or user"
          />
          <div className="list-stack search-results">
            {!globalSearchQuery.trim() ? (
              <EmptyState title="Start typing to search" text="Use global search to jump to records across the clinic workspace." />
            ) : globalSearchResults.length ? (
              globalSearchResults.map((entry) => (
                <button key={entry.id} type="button" className="list-card" onClick={() => handleSearchSelection(entry)}>
                  <div className="list-card-header">
                    <strong>{entry.label}</strong>
                    <StatusPill value={navItems.find((item) => item.key === entry.viewKey)?.label || entry.viewKey} tone="primary" />
                  </div>
                  <small>{entry.subtitle}</small>
                </button>
              ))
            ) : (
              <EmptyState title="No matching results" text="Try a broader patient name, medicine name, invoice number, or supplier." />
            )}
          </div>
        </div>
      </div>
    )
  }

  function renderAuthExperience() {
    const navLinks = ['Login', 'Register']
    const authStatusLabel = authError
      ? authError.toLowerCase().includes('unable to reach')
        ? 'Connection issue'
        : 'Validation issue'
      : authNotice
        ? 'Authentication status'
        : 'Secure access ready'
    const authStatusMessage =
      authError ||
      authNotice ||
      'Sign in with your clinic account or register a new staff login to continue.'
    const heading = authMode === 'sign-up' ? 'Create Your Account' : 'Welcome Back'
    const description = authMode === 'sign-up'
      ? 'Register to access the Clinic Management System.'
      : 'Sign in to access your clinic account.'

    return (
      <div className="auth-mock-page">
        <header className="auth-mock-header">
          <nav className="auth-mock-nav" aria-label="Primary">
            {navLinks.map((item) => (
              <a
                key={item}
                href="/"
                onClick={(event) => {
                  event.preventDefault()
                  setAuthMode(item === 'Login' ? 'sign-in' : 'sign-up')
                }}
                className={(item === 'Login' && authMode === 'sign-in') || (item === 'Register' && authMode === 'sign-up') ? 'active' : ''}
              >
                {item}
              </a>
            ))}
          </nav>
        </header>

        <main className="auth-mock-main">
          <section className="auth-mock-card">
            <div className="auth-mock-card-head">
              <p className="auth-mock-page-label">{authMode === 'sign-up' ? 'Register Page' : 'Login Page'}</p>
              <div className="auth-mock-clinic-name">S. V. Kini Ayurvedic Clinic & Panchakarma Centre</div>
              <h2>{heading}</h2>
              <p className="auth-mock-description">{description}</p>
            </div>

            {authError || authNotice ? (
              <div className={`auth-mock-alert ${authError ? 'error' : 'success'}`}>
                <strong>{authStatusLabel}</strong>
                <small>{authStatusMessage}</small>
              </div>
            ) : null}

            {authMode === 'sign-in' ? (
              <form className="auth-mock-form" onSubmit={handleAuthSignIn}>
                <label className="auth-mock-field">
                  <span className="auth-mock-field-label">Email Address</span>
                  <span className="auth-mock-input">
                    <span className="auth-mock-input-icon">@</span>
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                      placeholder="Email Address"
                      autoComplete="email"
                      required
                    />
                  </span>
                </label>
                <label className="auth-mock-field">
                  <span className="auth-mock-field-label">Password</span>
                  <span className="auth-mock-input">
                    <span className="auth-mock-input-icon">*</span>
                    <input
                      type="password"
                      value={authForm.password}
                      onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                      placeholder="Password"
                      autoComplete="current-password"
                      required
                    />
                  </span>
                </label>
                <div className="auth-mock-meta-row">
                  <label className="auth-mock-checkbox">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                    />
                    <span>Remember Me</span>
                  </label>
                  <button
                    type="button"
                    className="auth-mock-link"
                    onClick={() => setAuthNotice('Password reset is not enabled in the current clinic backend.')}
                  >
                    Forgot Password?
                  </button>
                </div>
                <button type="submit" className="auth-mock-submit" disabled={authBusy}>
                  {authBusy ? 'Logging In...' : 'Log In'}
                </button>
                <div className="auth-mock-switch-copy">
                  Don&apos;t have an account?{' '}
                  <button type="button" className="auth-mock-link-inline" onClick={() => setAuthMode('sign-up')}>
                    Register
                  </button>
                </div>
              </form>
            ) : null}

            {authMode === 'sign-up' ? (
              <form className="auth-mock-form" onSubmit={handleAuthSignUp}>
                <label className="auth-mock-field">
                  <span className="auth-mock-field-label">Full Name</span>
                  <span className="auth-mock-input">
                    <span className="auth-mock-input-icon">A</span>
                    <input
                      value={authForm.fullName}
                      onChange={(event) => setAuthForm({ ...authForm, fullName: event.target.value })}
                      placeholder="Full Name"
                      autoComplete="name"
                      required
                    />
                  </span>
                </label>
                <label className="auth-mock-field">
                  <span className="auth-mock-field-label">Email Address</span>
                  <span className="auth-mock-input">
                    <span className="auth-mock-input-icon">@</span>
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                      placeholder="Email Address"
                      autoComplete="email"
                      required
                    />
                  </span>
                </label>
                <label className="auth-mock-field">
                  <span className="auth-mock-field-label">Password</span>
                  <span className="auth-mock-input">
                    <span className="auth-mock-input-icon">*</span>
                    <input
                      type="password"
                      value={authForm.password}
                      onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                      placeholder="Password"
                      autoComplete="new-password"
                      required
                    />
                  </span>
                </label>
                <label className="auth-mock-field">
                  <span className="auth-mock-field-label">Confirm Password</span>
                  <span className="auth-mock-input">
                    <span className="auth-mock-input-icon">*</span>
                    <input
                      type="password"
                      value={authForm.confirmPassword}
                      onChange={(event) => setAuthForm({ ...authForm, confirmPassword: event.target.value })}
                      placeholder="Confirm Password"
                      autoComplete="new-password"
                      required
                    />
                  </span>
                </label>
                <button type="submit" className="auth-mock-submit" disabled={authBusy}>
                  {authBusy ? 'Registering...' : 'Register'}
                </button>
                <div className="auth-mock-switch-copy">
                  Already have an account?{' '}
                  <button type="button" className="auth-mock-link-inline" onClick={() => setAuthMode('sign-in')}>
                    Log In
                  </button>
                </div>
              </form>
            ) : null}
          </section>
        </main>

      </div>
    )
  }

  if (hasSupabaseConfig && !authSession) {
    return renderAuthExperience()
  }

  if (hasSupabaseConfig && authSession && !authenticatedClinicUser) {
    return (
      <div className="auth-shell">
        <section className="auth-hero">
          <p className="eyebrow">Authenticated</p>
          <h1>{clinic.name || 'S.V. Kini Ayurvedic clinic'}</h1>
          <p>{clinic.location || 'Mumbai, Maharashtra, India'}</p>
        </section>
        <section className="panel auth-card">
          <div className="section-intro">
            <p className="eyebrow">Access Pending</p>
            <h3>Clinic user link not found</h3>
            <p>This signed-in account is not mapped to any clinic user profile yet.</p>
          </div>
          {authError ? <div className="auth-banner error">{authError}</div> : null}
          <div className="auth-note">
            <strong>Signed-in email</strong>
            <small>{sessionUser?.email || 'Unknown email'}</small>
          </div>
          <div className="auth-note">
            <strong>What to do next</strong>
            <small>Add this email in Clinic Admin user management, or sign in with an already assigned clinic user email.</small>
          </div>
          <div className="auth-actions">
            <button type="button" className="ghost-button" onClick={handleSignOut} disabled={authBusy}>
              {authBusy ? 'Signing Out...' : 'Sign Out'}
            </button>
            <button type="button" className="ghost-button" onClick={() => setAuthMode('reset')}>
              Reset Password
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">Clinic Workspace</p>
          <h1>{clinic.name}</h1>
          <p>{clinic.location}</p>
        </div>
        <nav className="nav-list">
          {accessibleNavItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={resolvedActiveView === item.key ? 'nav-button active' : 'nav-button'}
              onClick={() => openView(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-card">
          <strong>Global Search</strong>
          <button type="button" className="primary-button" onClick={() => setGlobalSearchOpen(true)}>
            Open Search
          </button>
          <small>Press Ctrl+K to search across patients, visits, medicines, invoices, suppliers, and users.</small>
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <h2>{navItems.find((item) => item.key === resolvedActiveView)?.label || 'Dashboard'}</h2>
            <small>{activeUser ? `${activeUser.name} | ${activeUser.role}${sessionUser?.email ? ` | ${sessionUser.email}` : ''}` : clinic.location}</small>
          </div>
          <div className="topbar-actions">
            {canSwitchUsers ? (
              <select value={activeUser?.id || ''} onChange={(event) => handleActiveUserChange(event.target.value)}>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            ) : null}
            {currentImportTarget ? (
              <button
                type="button"
                className="ghost-button"
                onClick={handleCsvImport}
                title={`CSV headers: ${currentImportTarget.headers}`}
              >
                Import {currentImportTarget.label} CSV
              </button>
            ) : null}
            <button type="button" className="ghost-button" onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            {hasSupabaseConfig ? (
              <button type="button" className="ghost-button" onClick={handleSignOut} disabled={authBusy}>
                {authBusy ? 'Signing Out...' : 'Sign Out'}
              </button>
            ) : null}
          </div>
        </header>
        {renderView()}
      </main>
      {renderGlobalSearch()}
      {toast ? <div className={`toast ${toast.tone}`}>{toast.message}</div> : null}
    </div>
  )
}

function SectionIntro({ eyebrow, title }) {
  return (
    <div className="section-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h3>{title}</h3>
    </div>
  )
}

function Panel({ title, subtitle, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function StatCard({ label, value, tone = 'info' }) {
  return (
    <div className={`stat-card ${tone}`}>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  )
}

function InfoPill({ text }) {
  return <span className="info-pill">{text}</span>
}

function StatusPill({ value, tone }) {
  const className = String(tone || value || 'info').toLowerCase().replace(/\s+/g, '-')
  return <span className={`status-pill ${className}`}>{value}</span>
}

function KeyValue({ label, value }) {
  return (
    <div className="key-value">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function SimpleTable({ columns, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

export default App
