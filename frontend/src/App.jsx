import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createRecord,
  loadWorkspaceData,
  resetWorkspaceData,
  updateRecord,
} from './services/emrStore'
import './App.css'

const clinicalNavItems = [
  { key: 'Dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'Patients', label: 'Patients', icon: 'patients' },
  { key: 'Appointments', label: 'Appointments', icon: 'calendar' },
  { key: 'Doctors', label: 'Doctors', icon: 'stethoscope' },
  { key: 'Consultations', label: 'Consultations', icon: 'clipboard' },
  { key: 'Prescriptions', label: 'Prescriptions', icon: 'capsule' },
  { key: 'Billing', label: 'Billing', icon: 'wallet' },
  { key: 'Reports', label: 'Reports', icon: 'chart' },
  { key: 'Notifications', label: 'Notifications', icon: 'bell' },
]

const appointmentStatuses = ['Scheduled', 'Checked In', 'Completed', 'Cancelled']
const emptyList = []
const emptyObject = {}
const refreshSoundPath = '/sounds/soft-success_HGK0kiS.mp3'
const themeStorageKey = 'bluecare-theme'
const skeletonDelayMs = 320
const toastDurationMs = 3200
const compactLayoutQuery = '(max-width: 1240px)'
const authStorageKey = 'bluecare-auth'
const sessionStorageKey = 'bluecare-session'
const accountScopeStorageKey = 'bluecare-account-scope'
const profileStorageKey = 'bluecare-profile'
const rememberMeStorageKey = 'bluecare-remember-me'

const defaultAuthData = {
  username: 'dr.sarah',
  password: 'BlueCare@123',
}

const platformAdminAccount = {
  username: 'platform.superadmin',
  password: 'BlueCareSuper@123',
}

const platformAdminNavItems = [{ key: 'PlatformAdmin', label: 'Platform Admin', icon: 'shield' }]

const defaultUserProfile = {
  memberSince: 'January 2025',
  bio:
    'Dedicated healthcare professional committed to delivering quality patient care and supporting efficient healthcare operations through modern digital solutions.',
  personal: {
    fullName: 'Dr. Sarah Johnson',
    employeeId: 'BCS-EMP-014',
    role: 'Doctor',
    department: 'Cardiology Department',
    gender: 'Female',
    dateOfBirth: '1988-09-12',
    bloodGroup: 'A+',
    contactNumber: '+91 98765 43210',
    emailAddress: 'sarah.johnson@bluecare.health',
    residentialAddress: '45 Lakeview Residency, Bengaluru, Karnataka',
    emergencyContact: 'James Johnson • +91 99887 77665',
  },
  professional: {
    designation: 'Senior Cardiologist',
    specialization: 'Cardiology',
    licenseNumber: 'KMC-2016-4431',
    experience: '11 years',
    joiningDate: '2025-01-15',
    reportingManager: 'Dr. Amelia Ross',
    facility: 'Main Healthcare Center',
  },
  account: {
    username: 'dr.sarah',
    userRole: 'Administrator',
    accountStatus: 'Active',
    lastLogin: 'Today, 09:15 AM',
    twoFactorStatus: 'Enabled',
  },
  schedule: {
    workingHours: '09:00 AM - 05:30 PM',
    shiftInformation: 'Day shift',
    weeklySchedule: 'Monday to Friday',
    leaveBalance: '12 days',
    upcomingLeaves: '24 Jun 2026 • 25 Jun 2026',
  },
  performance: {
    patientsAttended: 124,
    appointmentsManaged: 186,
    tasksCompleted: 42,
    attendanceSummary: '96% attendance this month',
    monthlyActivity: 'Strong month with consistent consult flow and timely documentation.',
  },
  preferences: {
    language: 'English (India)',
    notifications: 'Email and in-app updates',
    themeSetting: 'Dark mode',
    timeZone: 'Asia/Kolkata',
  },
  security: {
    loginHistory: [
      { label: 'Today, 09:15 AM', detail: 'Main Healthcare Center • Current browser' },
      { label: 'Yesterday, 08:20 PM', detail: 'Doctor station • Evening review' },
      { label: '18 Jun 2026, 07:40 AM', detail: 'Main Healthcare Center • Morning rounds' },
    ],
    activeSessions: [
      { label: 'Current workspace', detail: 'Windows desktop • Active now' },
      { label: 'Mobile review session', detail: 'Android device • Synced last night' },
    ],
    alerts: [
      'Password was updated on 01 Jun 2026.',
      'No unusual sign-in activity detected in the last 30 days.',
    ],
  },
  documents: [
    { name: 'Identification Proof', status: 'Verified', updatedOn: '04 Jun 2026' },
    { name: 'Professional Certificates', status: '2 files available', updatedOn: '11 Jun 2026' },
    { name: 'Medical License Documents', status: 'Verified', updatedOn: '08 Jun 2026' },
    { name: 'Employment Documents', status: 'Latest contract uploaded', updatedOn: '02 Jun 2026' },
    { name: 'Other Attachments', status: '3 supporting files', updatedOn: '29 May 2026' },
  ],
}

const roleOptions = ['Doctor', 'Nurse', 'Receptionist', 'Administrator', 'Lab Technician']

function readStoredJson(key, fallbackValue) {
  try {
    const storedValue = localStorage.getItem(key)
    return storedValue ? JSON.parse(storedValue) : fallbackValue
  } catch {
    return fallbackValue
  }
}

function readStoredSessionFlag() {
  return localStorage.getItem(sessionStorageKey) === 'true' || sessionStorage.getItem(sessionStorageKey) === 'true'
}

function readStoredAccountScope() {
  return (
    localStorage.getItem(accountScopeStorageKey) ||
    sessionStorage.getItem(accountScopeStorageKey) ||
    'clinical'
  )
}

const initialPatientForm = {
  full_name: '',
  gender: 'Female',
  date_of_birth: '',
  phone: '',
  email: '',
  blood_group: '',
  address: '',
  emergency_contact: '',
  allergies: '',
  conditions: '',
  medical_history: '',
}

const initialAppointmentForm = {
  patient_id: '',
  doctor_id: '',
  appointment_date: '',
  appointment_time: '',
  reason: '',
  status: 'Scheduled',
  notes: '',
}

const initialDoctorForm = {
  full_name: '',
  specialization: '',
  phone: '',
  email: '',
  availability: '',
  status: 'Active',
  consultation_history: '',
}

const initialConsultationForm = {
  appointment_id: '',
  patient_id: '',
  doctor_id: '',
  consultation_date: '',
  clinical_notes: '',
  diagnosis: '',
  treatment_plan: '',
  supporting_document: '',
}

const initialPrescriptionForm = {
  consultation_id: '',
  patient_name: '',
  doctor_name: '',
  issued_on: '',
  notes: '',
  medicines_text: 'Medicine Name | Dosage | Instructions',
}

const initialInvoiceForm = {
  patient_name: '',
  consultation_charge: '',
  additional_services: '',
  paid_amount: '',
  payment_status: 'Pending',
}

function App() {
  const [activeView, setActiveView] = useState('Dashboard')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCompactLayout, setIsCompactLayout] = useState(() =>
    window.matchMedia(compactLayoutQuery).matches,
  )
  const [isAuthenticated, setIsAuthenticated] = useState(readStoredSessionFlag)
  const [currentUserScope, setCurrentUserScope] = useState(readStoredAccountScope)
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem(rememberMeStorageKey) === 'true')
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(themeStorageKey)
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [workspace, setWorkspace] = useState(null)
  const [isHydrating, setIsHydrating] = useState(true)
  const [statusMessage, setStatusMessage] = useState('Preparing your care workspace...')
  const [authStatusMessage, setAuthStatusMessage] = useState('Sign in to continue to your workspace.')
  const [authMode, setAuthMode] = useState('login')
  const [authData, setAuthData] = useState(() => readStoredJson(authStorageKey, defaultAuthData))
  const [profileData, setProfileData] = useState(() =>
    readStoredJson(profileStorageKey, defaultUserProfile),
  )
  const [loginForm, setLoginForm] = useState(() => ({
    username: readStoredJson(authStorageKey, defaultAuthData).username,
    password: '',
  }))
  const [forgotForm, setForgotForm] = useState({
    username: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [patientSearch, setPatientSearch] = useState('')
  const [patientFilter, setPatientFilter] = useState('All')
  const [globalQuery, setGlobalQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeSearchCursor, setActiveSearchCursor] = useState(0)
  const [toasts, setToasts] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [patientForm, setPatientForm] = useState(initialPatientForm)
  const [appointmentForm, setAppointmentForm] = useState(initialAppointmentForm)
  const [doctorForm, setDoctorForm] = useState(initialDoctorForm)
  const [consultationForm, setConsultationForm] = useState(initialConsultationForm)
  const [prescriptionForm, setPrescriptionForm] = useState(initialPrescriptionForm)
  const [invoiceForm, setInvoiceForm] = useState(initialInvoiceForm)
  const refreshSoundRef = useRef(null)
  const searchRef = useRef(null)
  const lastScrollYRef = useRef(window.scrollY)
  const toastTimersRef = useRef([])
  const isPlatformAdmin = currentUserScope === 'platform-admin'

  const playMajorActionSound = useCallback(() => {
    if (!refreshSoundRef.current) {
      refreshSoundRef.current = new Audio(refreshSoundPath)
      refreshSoundRef.current.volume = 0.38
      refreshSoundRef.current.preload = 'auto'
    }

    refreshSoundRef.current.currentTime = 0
    void refreshSoundRef.current.play().catch(() => {
      // Some browsers defer audible playback until the page receives an allowed event.
    })
  }, [])

  const pushToast = useCallback((message, tone = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts((current) => [...current.slice(-2), { id, message, tone }])

    const timerId = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
      toastTimersRef.current = toastTimersRef.current.filter((timer) => timer !== timerId)
    }, toastDurationMs)

    toastTimersRef.current.push(timerId)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(themeStorageKey, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(rememberMeStorageKey, rememberMe ? 'true' : 'false')
  }, [rememberMe])

  useEffect(() => {
    const persistentStorage = rememberMe ? localStorage : sessionStorage
    const temporaryStorage = rememberMe ? sessionStorage : localStorage

    if (isAuthenticated) {
      persistentStorage.setItem(sessionStorageKey, 'true')
      persistentStorage.setItem(accountScopeStorageKey, currentUserScope)
    } else {
      persistentStorage.removeItem(sessionStorageKey)
      persistentStorage.removeItem(accountScopeStorageKey)
    }

    temporaryStorage.removeItem(sessionStorageKey)
    temporaryStorage.removeItem(accountScopeStorageKey)
  }, [currentUserScope, isAuthenticated, rememberMe])

  useEffect(() => {
    localStorage.setItem(authStorageKey, JSON.stringify(authData))
  }, [authData])

  useEffect(() => {
    localStorage.setItem(profileStorageKey, JSON.stringify(profileData))
  }, [profileData])

  useEffect(() => {
    let isCancelled = false

    async function loadWorkspace() {
      try {
        const data = await loadWorkspaceData()
        await new Promise((resolve) => window.setTimeout(resolve, skeletonDelayMs))
        if (isCancelled) {
          return
        }
        setWorkspace(data)
        setSelectedPatientId(data.patients[0]?.id || null)
        setStatusMessage('Everything is ready. Your updates stay saved on this device.')
      } catch {
        if (isCancelled) {
          return
        }
        setStatusMessage('We could not prepare the workspace. Please refresh and try again.')
        pushToast('Could not prepare the workspace.', 'error')
      } finally {
        if (!isCancelled) {
          setIsHydrating(false)
        }
      }
    }

    loadWorkspace()

    return () => {
      isCancelled = true
    }
  }, [pushToast])

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  useEffect(() => {
    const mediaQuery = window.matchMedia(compactLayoutQuery)

    function syncCompactLayout(event) {
      setIsCompactLayout(event.matches)
      if (!event.matches) {
        setIsMenuOpen(false)
      }
    }

    syncCompactLayout(mediaQuery)
    mediaQuery.addEventListener('change', syncCompactLayout)

    return () => mediaQuery.removeEventListener('change', syncCompactLayout)
  }, [])

  useEffect(() => {
    function handleOutsideSearchClick(event) {
      if (!searchRef.current?.contains(event.target)) {
        setIsSearchOpen(false)
        setActiveSearchCursor(0)
      }
    }

    document.addEventListener('pointerdown', handleOutsideSearchClick)
    return () => document.removeEventListener('pointerdown', handleOutsideSearchClick)
  }, [])

  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY
      const hasMeaningfulMovement = Math.abs(currentScrollY - lastScrollYRef.current) > 8

      if (isSearchOpen && hasMeaningfulMovement) {
        setIsSearchOpen(false)
        setActiveSearchCursor(0)
      }

      lastScrollYRef.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [isSearchOpen])

  useEffect(
    () => () => {
      refreshSoundRef.current?.pause()
      if (refreshSoundRef.current) {
        refreshSoundRef.current.currentTime = 0
      }

      toastTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    },
    [],
  )

  const patients = workspace?.patients ?? emptyList
  const doctors = workspace?.doctors ?? emptyList
  const appointments = workspace?.appointments ?? emptyList
  const consultations = workspace?.consultations ?? emptyList
  const prescriptions = workspace?.prescriptions ?? emptyList
  const invoices = workspace?.invoices ?? emptyList
  const notifications = workspace?.notifications ?? emptyList
  const reports = workspace?.reports ?? emptyObject
  const dashboard = workspace?.dashboard ?? emptyObject

  const filteredPatients = useMemo(() => {
    const query = patientSearch.trim().toLowerCase()

    return patients.filter((patient) => {
      const matchesSearch =
        !query ||
        patient.full_name.toLowerCase().includes(query) ||
        patient.patient_code?.toLowerCase().includes(query) ||
        patient.phone?.toLowerCase().includes(query)

      const matchesFilter =
        patientFilter === 'All' ||
        (patient.allergies && patient.allergies !== 'None' && patientFilter === 'Has Allergies') ||
        (patient.conditions && patientFilter === 'Has Conditions')

      return matchesSearch && matchesFilter
    })
  }, [patientFilter, patientSearch, patients])

  const selectedPatient =
    patients.find((patient) => patient.id === selectedPatientId) || filteredPatients[0] || null

  const patientTimeline = useMemo(() => {
    if (!selectedPatient) {
      return []
    }

    const patientAppointments = appointments
      .filter((appointment) => appointment.patient_id === selectedPatient.id)
      .map((appointment) => ({
        id: `appointment-${appointment.id}`,
        date: `${appointment.appointment_date} ${appointment.appointment_time || ''}`.trim(),
        title: `${appointment.status} visit`,
        detail: `${appointment.reason || 'Routine review'} with ${appointment.doctor_name || 'assigned doctor'}`,
      }))

    const patientConsultations = consultations
      .filter((consultation) => consultation.patient_id === selectedPatient.id)
      .map((consultation) => ({
        id: `consultation-${consultation.id}`,
        date: consultation.consultation_date,
        title: consultation.diagnosis || 'Consultation note',
        detail: consultation.treatment_plan || consultation.clinical_notes,
      }))

    return [...patientConsultations, ...patientAppointments].sort((left, right) =>
      String(right.date).localeCompare(String(left.date)),
    )
  }, [appointments, consultations, selectedPatient])

  const doctorSummary = useMemo(
    () =>
      doctors.map((doctor) => ({
        ...doctor,
        assigned_appointments: appointments.filter(
          (appointment) => appointment.doctor_id === doctor.id && appointment.status !== 'Cancelled',
        ).length,
      })),
    [appointments, doctors],
  )

  const todayFocus = useMemo(
    () =>
      [
        {
          label: 'Visit flow',
          value: dashboard.todaysAppointments || 0,
          format: 'count',
          suffix: 'planned',
          caption: 'Keep today moving smoothly',
        },
        {
          label: 'Care team',
          value: dashboard.activeDoctors || 0,
          format: 'count',
          suffix: 'active',
          caption: 'Doctors ready for consultations',
        },
        {
          label: 'Collection',
          value: dashboard.monthlyRevenue || 0,
          format: 'currency',
          caption: 'Strong month-to-date progress',
        },
      ],
    [dashboard],
  )

  const currentViewMeta = useMemo(
    () => ({
      PlatformAdmin: {
        eyebrow: 'Platform Control',
        title: 'BlueCare Solutions Platform Administration',
        text: 'Manage organizations, subscriptions, contracts, billing, compliance, and platform-wide operations from a protected super-administrator workspace.',
      },
      Patients: {
        eyebrow: 'Patient Care',
        title: 'Patient Management',
        text: 'Search records, review profiles, and update details without returning to the dashboard.',
      },
      Appointments: {
        eyebrow: 'Visit Planning',
        title: 'Appointment Management',
        text: 'Schedule, reschedule, and track every visit from a clearer daily workspace.',
      },
      Doctors: {
        eyebrow: 'Care Team',
        title: 'Doctor Management',
        text: 'Review specialties, availability, and active consultation load in one place.',
      },
      Consultations: {
        eyebrow: 'Clinical Notes',
        title: 'Consultations And EMR',
        text: 'Capture clinical notes, diagnoses, treatment plans, and supporting documents.',
      },
      Prescriptions: {
        eyebrow: 'Medication Desk',
        title: 'Prescriptions',
        text: 'Prepare medicines, dosage instructions, and patient-ready prescription summaries.',
      },
      Billing: {
        eyebrow: 'Billing Desk',
        title: 'Billing',
        text: 'Create invoices, track collections, and keep receipts and balances organized.',
      },
      Reports: {
        eyebrow: 'Insights',
        title: 'Reports',
        text: 'Review patient, appointment, revenue, and doctor activity reports with export options.',
      },
      Notifications: {
        eyebrow: 'Reminders',
        title: 'Notifications',
        text: 'Stay on top of follow-ups, upcoming visits, and billing reminders.',
      },
      Profile: {
        eyebrow: 'Workspace',
        title: 'User Profile',
        text: 'Review the current progress of your upcoming profile and account tools.',
      },
    })[activeView] || null,
    [activeView],
  )

  const workspaceNavItems = useMemo(
    () => (isPlatformAdmin ? platformAdminNavItems : clinicalNavItems),
    [isPlatformAdmin],
  )

  const pageSearchItems = useMemo(
    () =>
      isPlatformAdmin
        ? platformAdminNavItems
        : [...clinicalNavItems, { key: 'Profile', label: 'Profile', icon: 'user' }],
    [isPlatformAdmin],
  )

  const globalSearchResults = useMemo(() => {
    const query = globalQuery.trim().toLowerCase()
    if (!query) {
      return []
    }

    const pageResults = pageSearchItems
      .filter((item) => item.label.toLowerCase().includes(query))
      .map((item) => ({
        id: `page-${item.key}`,
        kind: 'page',
        icon: item.icon,
        title: item.label,
        subtitle: 'Open workspace section',
        view: item.key,
      }))

    if (isPlatformAdmin) {
      return pageResults.slice(0, 10)
    }

    const patientResults = patients
      .filter((patient) =>
        [patient.full_name, patient.patient_code, patient.phone].some((value) =>
          String(value || '').toLowerCase().includes(query),
        ),
      )
      .map((patient) => ({
        id: `patient-${patient.id}`,
        kind: 'patient',
        icon: 'patients',
        title: patient.full_name,
        subtitle: `${patient.patient_code || 'Patient'} • ${patient.phone || 'No phone'}`,
        view: 'Patients',
        recordId: patient.id,
      }))

    const doctorResults = doctors
      .filter((doctor) =>
        [doctor.full_name, doctor.specialization, doctor.availability].some((value) =>
          String(value || '').toLowerCase().includes(query),
        ),
      )
      .map((doctor) => ({
        id: `doctor-${doctor.id}`,
        kind: 'doctor',
        icon: 'stethoscope',
        title: doctor.full_name,
        subtitle: `${doctor.specialization || 'General care'} • ${doctor.availability || 'Schedule pending'}`,
        view: 'Doctors',
      }))

    const appointmentResults = appointments
      .filter((appointment) =>
        [
          appointment.patient_name,
          appointment.doctor_name,
          appointment.appointment_date,
          appointment.reason,
        ].some((value) => String(value || '').toLowerCase().includes(query)),
      )
      .map((appointment) => ({
        id: `appointment-${appointment.id}`,
        kind: 'appointment',
        icon: 'calendar',
        title: `${appointment.patient_name} • ${appointment.appointment_date}`,
        subtitle: `${appointment.doctor_name || 'No doctor'} • ${appointment.status}`,
        view: 'Appointments',
      }))

    const invoiceResults = invoices
      .filter((invoice) =>
        [invoice.invoice_number, invoice.patient_name, invoice.payment_status].some((value) =>
          String(value || '').toLowerCase().includes(query),
        ),
      )
      .map((invoice) => ({
        id: `invoice-${invoice.id}`,
        kind: 'invoice',
        icon: 'wallet',
        title: `${invoice.invoice_number} • ${invoice.patient_name}`,
        subtitle: `${invoice.payment_status} • ${formatCurrency(invoice.total_amount)}`,
        view: 'Billing',
      }))

    const notificationResults = notifications
      .filter((notification) =>
        [notification.title, notification.message, notification.type].some((value) =>
          String(value || '').toLowerCase().includes(query),
        ),
      )
      .map((notification) => ({
        id: `notification-${notification.id}`,
        kind: 'notification',
        icon: notification.type === 'billing' ? 'wallet' : notification.type === 'follow-up' ? 'clipboard' : 'bell',
        title: notification.title,
        subtitle: notification.message,
        view: 'Notifications',
      }))

    return [
      ...pageResults,
      ...patientResults,
      ...doctorResults,
      ...appointmentResults,
      ...invoiceResults,
      ...notificationResults,
    ].slice(0, 10)
  }, [appointments, doctors, globalQuery, invoices, isPlatformAdmin, notifications, pageSearchItems, patients])

  const searchSuggestions = useMemo(
    () =>
      (isPlatformAdmin
        ? platformAdminNavItems
        : [...clinicalNavItems.slice(0, 4), { key: 'Profile', label: 'Profile', icon: 'user' }]
      ).map((item) => ({
        id: `suggestion-${item.key}`,
        kind: 'page',
        icon: item.icon,
        title: item.label,
        subtitle: 'Open workspace section',
        view: item.key,
      })),
    [isPlatformAdmin],
  )

  const visibleSearchItems = globalQuery.trim() ? globalSearchResults : searchSuggestions
  const activeSearchIndex = visibleSearchItems.length
    ? Math.min(activeSearchCursor, visibleSearchItems.length - 1)
    : -1

  const profileOverviewCards = useMemo(
    () => [
      {
        icon: 'patients',
        label: 'Patients Attended',
        value: Number(profileData.performance.patientsAttended || 0).toLocaleString('en-IN'),
      },
      {
        icon: 'calendar',
        label: 'Appointments Managed',
        value: Number(profileData.performance.appointmentsManaged || 0).toLocaleString('en-IN'),
      },
      {
        icon: 'chart',
        label: 'Tasks Completed',
        value: Number(profileData.performance.tasksCompleted || 0).toLocaleString('en-IN'),
      },
      {
        icon: 'pulse',
        label: 'Attendance Summary',
        value: profileData.performance.attendanceSummary,
      },
    ],
    [profileData.performance],
  )

  const platformAdminWidgets = useMemo(
    () => [
      { icon: 'building', label: 'Total Organizations', value: 48, format: 'count' },
      { icon: 'wallet', label: 'Active Subscriptions', value: 41, format: 'count' },
      { icon: 'file', label: 'Expiring Contracts', value: 6, format: 'count' },
      { icon: 'chart', label: 'Monthly Revenue', value: 845000, format: 'currency' },
      { icon: 'patients', label: 'Active Users', value: 1284, format: 'count' },
      { icon: 'pulse', label: 'Platform Health', value: 99, format: 'count' },
      { icon: 'grid', label: 'Storage Utilization', value: 72, format: 'count' },
      { icon: 'bell', label: 'Pending Renewals', value: 9, format: 'count' },
    ],
    [],
  )

  const platformAdminSections = useMemo(
    () => [
      'Organizations',
      'Subscriptions',
      'Contracts',
      'Billing & Payments',
      'Plan Management',
      'Feature Controls',
      'Platform Analytics',
      'User Management',
      'Audit Logs',
      'Security Center',
      'System Settings',
      'Support & Tickets',
    ],
    [],
  )

  const platformAdminResponsibilities = useMemo(
    () => [
      'Manage healthcare organizations and clinic onboarding.',
      'Create and manage subscription plans.',
      'Configure plan limits, storage quotas, and user capacities.',
      'Monitor subscription status, renewals, expirations, and payment history.',
      'Manage service contracts and agreement records.',
      'Enable or disable modules for specific organizations.',
      'Review platform usage statistics and operational metrics.',
      'Monitor active tenants, users, and system health.',
      'Access audit logs and security reports.',
      'Manage platform administrators and role permissions.',
      'Handle billing, invoicing, and revenue tracking.',
      'Maintain compliance and administrative records.',
    ],
    [],
  )

  const platformAdminActivities = useMemo(
    () => [
      { title: 'New clinic onboarded', detail: 'North Axis Diagnostics was provisioned with Advanced Care plan.' },
      { title: 'Renewal confirmed', detail: 'Metro Heart Centre completed annual subscription renewal.' },
      { title: 'Feature update applied', detail: 'ePrescription module enabled for Sunrise MultiCare.' },
      { title: 'Billing review completed', detail: 'Three pending invoices were reconciled this morning.' },
    ],
    [],
  )

  const platformAdminAlerts = useMemo(
    () => [
      { title: 'Contract expiring soon', detail: '6 tenant contracts require renewal review within 14 days.' },
      { title: 'Storage threshold reached', detail: '2 organizations have crossed 85% of their storage quota.' },
      { title: 'Audit review pending', detail: 'Security report verification is due for the latest access logs.' },
    ],
    [],
  )

  const profileQuickActions = useMemo(
    () => [
      { label: 'Edit Profile', icon: 'user', target: 'profile-information' },
      { label: 'Update Contact Information', icon: 'phone', target: 'profile-information' },
      { label: 'Change Password', icon: 'lock', target: 'profile-security' },
      { label: 'View Schedule', icon: 'clock', target: 'profile-schedule' },
      { label: 'Download Documents', icon: 'file', target: 'profile-documents' },
      { label: 'Manage Notifications', icon: 'bell', target: 'profile-preferences' },
    ],
    [],
  )

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
      setProfileData((currentProfile) => ({
        ...currentProfile,
        preferences: {
          ...currentProfile.preferences,
          themeSetting: nextTheme === 'dark' ? 'Dark mode' : 'Light mode',
        },
      }))
      return nextTheme
    })
  }, [])

  const handleProfileFieldChange = useCallback((section, field, value) => {
    setProfileData((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }))
  }, [])

  const handleProfileInputChange = useCallback(
    (section, field) => (event) => handleProfileFieldChange(section, field, event.target.value),
    [handleProfileFieldChange],
  )

  const changeView = useCallback((view) => {
    setActiveView(view)
    setIsMenuOpen(false)
    setIsSearchOpen(false)
    setActiveSearchCursor(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleProfileSave = useCallback(
    (message = 'Profile details updated.') => {
      setStatusMessage(message)
      pushToast(message, 'success')
      playMajorActionSound()
    },
    [playMajorActionSound, pushToast],
  )

  const handleProfileJump = useCallback((sectionId, label) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setStatusMessage(`${label} is ready to review.`)
  }, [])

  const handleDocumentDownload = useCallback(
    (documentItem) => {
      downloadTextFile(
        `${documentItem.name.toLowerCase().replaceAll(' ', '-')}.txt`,
        [
          `Document: ${documentItem.name}`,
          `Status: ${documentItem.status}`,
          `Last Updated: ${documentItem.updatedOn}`,
          `Employee: ${profileData.personal.fullName}`,
          `Department: ${profileData.personal.department}`,
        ].join('\n'),
      )
      pushToast(`${documentItem.name} summary downloaded.`, 'success')
    },
    [profileData.personal.department, profileData.personal.fullName, pushToast],
  )

  const handleToggleTwoFactor = useCallback(() => {
    const nextStatus =
      profileData.account.twoFactorStatus === 'Enabled' ? 'Disabled' : 'Enabled'
    setProfileData((current) => ({
      ...current,
      account: {
        ...current.account,
        twoFactorStatus: nextStatus,
      },
      security: {
        ...current.security,
        alerts: [
          `Two-factor authentication was ${nextStatus.toLowerCase()} on ${formatDateTimeLabel(new Date())}.`,
          ...current.security.alerts,
        ].slice(0, 4),
      },
    }))
    handleProfileSave(`Two-factor authentication ${nextStatus.toLowerCase()}.`)
  }, [handleProfileSave, profileData.account.twoFactorStatus])

  const handleLoginSubmit = useCallback(
    (event) => {
      event.preventDefault()

      const username = loginForm.username.trim().toLowerCase()
      const loginStamp = formatDateTimeLabel(new Date())

      if (
        username === platformAdminAccount.username.toLowerCase() &&
        loginForm.password === platformAdminAccount.password
      ) {
        setCurrentUserScope('platform-admin')
        setIsAuthenticated(true)
        setAuthMode('login')
        setLoginForm((current) => ({ ...current, password: '' }))
        setAuthStatusMessage('Welcome back. Your platform administration console is ready.')
        setStatusMessage('Platform administration console opened.')
        pushToast('Signed in successfully.', 'success')
        playMajorActionSound()
        changeView('PlatformAdmin')
        return
      }

      if (
        username !== authData.username.toLowerCase() ||
        loginForm.password !== authData.password
      ) {
        setAuthStatusMessage('Incorrect username or password. Please try again.')
        return
      }

      setProfileData((current) => ({
        ...current,
        account: {
          ...current.account,
          lastLogin: loginStamp,
        },
        security: {
          ...current.security,
          loginHistory: [
            { label: loginStamp, detail: 'Main Healthcare Center • Current browser' },
            ...current.security.loginHistory,
          ].slice(0, 5),
          activeSessions: [
            { label: 'Current workspace', detail: `${loginStamp} • Active now` },
            ...current.security.activeSessions.filter((session) => session.label !== 'Current workspace'),
          ].slice(0, 3),
        },
      }))
      setCurrentUserScope('clinical')
      setIsAuthenticated(true)
      setAuthMode('login')
      setLoginForm((current) => ({ ...current, password: '' }))
      setAuthStatusMessage('Welcome back. Your workspace is ready.')
      setStatusMessage('Signed in successfully.')
      pushToast('Signed in successfully.', 'success')
      playMajorActionSound()
      changeView('Dashboard')
    },
    [authData.password, authData.username, changeView, loginForm.password, loginForm.username, playMajorActionSound, pushToast],
  )

  const handleForgotPasswordSubmit = useCallback(
    (event) => {
      event.preventDefault()

      if (forgotForm.username.trim().toLowerCase() !== authData.username.toLowerCase()) {
        setAuthStatusMessage('We could not match that username to this profile.')
        return
      }

      if (!forgotForm.newPassword || forgotForm.newPassword.length < 8) {
        setAuthStatusMessage('Use a password with at least 8 characters.')
        return
      }

      if (forgotForm.newPassword !== forgotForm.confirmPassword) {
        setAuthStatusMessage('The new password and confirmation do not match.')
        return
      }

      setAuthData((current) => ({
        ...current,
        password: forgotForm.newPassword,
      }))
      setProfileData((current) => ({
        ...current,
        security: {
          ...current.security,
          alerts: [
            `Password was reset from the recovery flow on ${formatDateTimeLabel(new Date())}.`,
            ...current.security.alerts,
          ].slice(0, 4),
        },
      }))
      setLoginForm({
        username: forgotForm.username.trim(),
        password: '',
      })
      setForgotForm({
        username: '',
        newPassword: '',
        confirmPassword: '',
      })
      setAuthMode('login')
      setAuthStatusMessage('Password updated. Sign in with your new password.')
    },
    [authData.username, forgotForm.confirmPassword, forgotForm.newPassword, forgotForm.username],
  )

  const handlePasswordChange = useCallback(
    (event) => {
      event.preventDefault()

      if (passwordForm.currentPassword !== authData.password) {
        pushToast('Current password is incorrect.', 'error')
        return
      }

      if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
        pushToast('Use a new password with at least 8 characters.', 'error')
        return
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        pushToast('New password and confirmation do not match.', 'error')
        return
      }

      setAuthData((current) => ({
        ...current,
        password: passwordForm.newPassword,
      }))
      setProfileData((current) => ({
        ...current,
        security: {
          ...current.security,
          alerts: [
            `Password was changed on ${formatDateTimeLabel(new Date())}.`,
            ...current.security.alerts,
          ].slice(0, 4),
        },
      }))
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      handleProfileSave('Password updated successfully.')
    },
    [authData.password, handleProfileSave, passwordForm.confirmPassword, passwordForm.currentPassword, passwordForm.newPassword, pushToast],
  )

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false)
    setCurrentUserScope('clinical')
    setIsMenuOpen(false)
    setActiveView('Dashboard')
    setGlobalQuery('')
    setIsSearchOpen(false)
    setActiveSearchCursor(0)
    setLoginForm((current) => ({
      ...current,
      username: authData.username,
      password: '',
    }))
    setAuthMode('login')
    setAuthStatusMessage('You have been signed out. Sign in again to continue.')
  }, [authData.username])

  const handleGlobalResultSelect = useCallback(
    (result) => {
      setGlobalQuery('')
      setIsSearchOpen(false)
      setActiveSearchCursor(0)

      if (result.kind === 'patient' && result.recordId) {
        setSelectedPatientId(result.recordId)
        setStatusMessage(`${result.title} is ready to review.`)
      } else {
        setStatusMessage(`${result.title} opened.`)
      }

      changeView(result.view)
    },
    [changeView],
  )

  const handleGlobalSearchKeyDown = useCallback(
    (event) => {
      if (!isSearchOpen || !visibleSearchItems.length) {
        if (event.key === 'ArrowDown' && visibleSearchItems.length) {
          setIsSearchOpen(true)
          setActiveSearchCursor(0)
        }
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveSearchCursor((current) => (current + 1) % visibleSearchItems.length)
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveSearchCursor((current) =>
          current <= 0 ? visibleSearchItems.length - 1 : current - 1,
        )
      }

      if (event.key === 'Enter' && activeSearchIndex >= 0) {
        event.preventDefault()
        handleGlobalResultSelect(visibleSearchItems[activeSearchIndex])
      }

      if (event.key === 'Escape') {
        setIsSearchOpen(false)
        setActiveSearchCursor(0)
      }
    },
    [activeSearchIndex, handleGlobalResultSelect, isSearchOpen, visibleSearchItems],
  )

  const handleReportExport = useCallback(
    (filename, rows, label) => {
      if (!rows.length) {
        pushToast(`${label} has no data to export.`, 'error')
        return
      }

      exportCsv(filename, rows)
      pushToast(`${label} exported.`, 'success')
    },
    [pushToast],
  )

  const handlePrescriptionDownload = useCallback(
    (prescription) => {
      downloadTextFile(
        `prescription-${prescription.id}.txt`,
        [
          `Prescription for ${prescription.patient_name}`,
          `Doctor: ${prescription.doctor_name}`,
          `Issued On: ${prescription.issued_on}`,
          `Notes: ${prescription.notes || 'None'}`,
          '',
          'Medicines:',
          ...(prescription.medicines || []).map(
            (medicine) => `- ${medicine.name} | ${medicine.dosage} | ${medicine.instructions}`,
          ),
        ].join('\n'),
      )
      pushToast('Prescription downloaded.', 'success')
    },
    [pushToast],
  )

  const handleReceiptDownload = useCallback(
    (invoice) => {
      downloadTextFile(
        `receipt-${invoice.id}.txt`,
        [
          `Receipt for ${invoice.patient_name}`,
          `Invoice: ${invoice.invoice_number}`,
          `Consultation: ${formatCurrency(invoice.consultation_charge || 0)}`,
          `Additional Services: ${formatCurrency(invoice.additional_services || 0)}`,
          `Total: ${formatCurrency(invoice.total_amount || 0)}`,
          `Paid: ${formatCurrency(invoice.paid_amount || 0)}`,
          `Status: ${invoice.payment_status}`,
        ].join('\n'),
      )
      pushToast('Receipt downloaded.', 'success')
    },
    [pushToast],
  )

  async function saveRecord({
    mode = 'create',
    collection,
    id,
    payload,
    successMessage,
    resetForm,
    afterSave,
  }) {
    try {
      const result =
        mode === 'create'
          ? await createRecord(collection, payload)
          : await updateRecord(collection, id, payload)

      setWorkspace(result.data)
      setStatusMessage(successMessage)
      pushToast(successMessage, 'success')
      playMajorActionSound()
      resetForm?.()
      afterSave?.(result.record)
    } catch {
      setStatusMessage('We could not save that update. Please try again.')
      pushToast('We could not save that update. Please try again.', 'error')
    }
  }

  async function handlePatientSubmit(event) {
    event.preventDefault()

    const isEdit = Boolean(selectedPatient?.id && selectedPatient.full_name === patientForm.full_name)
    const payload = {
      ...patientForm,
      patient_code:
        patientForm.patient_code || selectedPatient?.patient_code || `PT-${String(patients.length + 1001)}`,
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      last_visit_at: selectedPatient?.last_visit_at || '',
    }

    await saveRecord({
      mode: isEdit ? 'update' : 'create',
      collection: 'patients',
      id: selectedPatient?.id,
      payload,
      successMessage: isEdit ? 'Patient profile refreshed.' : 'New patient added.',
      resetForm: () => setPatientForm(initialPatientForm),
      afterSave: (record) => setSelectedPatientId(record.id),
    })
  }

  async function handleAppointmentSubmit(event) {
    event.preventDefault()

    const patient = patients.find((item) => item.id === Number(appointmentForm.patient_id))
    const doctor = doctors.find((item) => item.id === Number(appointmentForm.doctor_id))

    await saveRecord({
      collection: 'appointments',
      payload: {
        ...appointmentForm,
        patient_id: Number(appointmentForm.patient_id),
        doctor_id: Number(appointmentForm.doctor_id),
        patient_name: patient?.full_name || '',
        doctor_name: doctor?.full_name || '',
      },
      successMessage: 'Appointment saved to the day plan.',
      resetForm: () => setAppointmentForm(initialAppointmentForm),
    })
  }

  async function handleAppointmentStatusChange(appointmentId, status) {
    const existing = appointments.find((appointment) => appointment.id === appointmentId)
    if (!existing) {
      return
    }

    await saveRecord({
      mode: 'update',
      collection: 'appointments',
      id: appointmentId,
      payload: { ...existing, status },
      successMessage: `Visit updated to ${status.toLowerCase()}.`,
    })
  }

  async function handleDoctorSubmit(event) {
    event.preventDefault()

    await saveRecord({
      collection: 'doctors',
      payload: doctorForm,
      successMessage: 'Doctor profile added.',
      resetForm: () => setDoctorForm(initialDoctorForm),
    })
  }

  async function handleConsultationSubmit(event) {
    event.preventDefault()

    const patient = patients.find((item) => item.id === Number(consultationForm.patient_id))
    const doctor = doctors.find((item) => item.id === Number(consultationForm.doctor_id))

    await saveRecord({
      collection: 'consultations',
      payload: {
        ...consultationForm,
        appointment_id: Number(consultationForm.appointment_id),
        patient_id: Number(consultationForm.patient_id),
        doctor_id: Number(consultationForm.doctor_id),
        patient_name: patient?.full_name || '',
        doctor_name: doctor?.full_name || '',
      },
      successMessage: 'Consultation note saved.',
      resetForm: () => setConsultationForm(initialConsultationForm),
    })
  }

  async function handlePrescriptionSubmit(event) {
    event.preventDefault()

    const medicines = prescriptionForm.medicines_text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name = '', dosage = '', instructions = ''] = line
          .split('|')
          .map((part) => part.trim())
        return { name, dosage, instructions }
      })

    await saveRecord({
      collection: 'prescriptions',
      payload: {
        consultation_id: Number(prescriptionForm.consultation_id),
        patient_name: prescriptionForm.patient_name,
        doctor_name: prescriptionForm.doctor_name,
        issued_on: prescriptionForm.issued_on,
        notes: prescriptionForm.notes,
        medicines,
      },
      successMessage: 'Prescription prepared.',
      resetForm: () => setPrescriptionForm(initialPrescriptionForm),
    })
  }

  async function handleInvoiceSubmit(event) {
    event.preventDefault()

    const consultationCharge = Number(invoiceForm.consultation_charge || 0)
    const additionalServices = Number(invoiceForm.additional_services || 0)
    const paidAmount = Number(invoiceForm.paid_amount || 0)

    await saveRecord({
      collection: 'invoices',
      payload: {
        invoice_number: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
        patient_name: invoiceForm.patient_name,
        consultation_charge: consultationCharge,
        additional_services: additionalServices,
        total_amount: consultationCharge + additionalServices,
        paid_amount: paidAmount,
        payment_status: invoiceForm.payment_status,
        created_at: new Date().toISOString().slice(0, 10),
      },
      successMessage: 'Invoice created.',
      resetForm: () => setInvoiceForm(initialInvoiceForm),
    })
  }

  function loadPatientIntoForm(patient) {
    setSelectedPatientId(patient.id)
    setPatientForm({
      full_name: patient.full_name || '',
      gender: patient.gender || 'Female',
      date_of_birth: patient.date_of_birth || '',
      phone: patient.phone || '',
      email: patient.email || '',
      blood_group: patient.blood_group || '',
      address: patient.address || '',
      emergency_contact: patient.emergency_contact || '',
      allergies: patient.allergies || '',
      conditions: patient.conditions || '',
      medical_history: patient.medical_history || '',
    })
    setActiveView('Patients')
    setStatusMessage(`${patient.full_name} is ready to review.`)
  }

  async function handleResetWorkspace() {
    const data = await resetWorkspaceData()
    setWorkspace(data)
    setSelectedPatientId(data.patients[0]?.id || null)
    setStatusMessage('Starter records have been refreshed.')
    pushToast('Starter records have been refreshed.', 'success')
    playMajorActionSound()
  }

  if (!workspace || isHydrating) {
    return <LoadingSkeletonScreen />
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-shell">
        <div className="disclaimer-marquee" role="note" aria-label="Demonstration disclaimer">
          <div className="disclaimer-track">
            <span>
              WARNING DISCLAIMER: This software is for demonstration, testing, and development
              purposes only. It is NOT intended for live clinical, hospital-floor, patient-care, or
              production use. All records, patient information, reports, schedules, and datasets
              displayed within this application are artificial, fictional, and generated solely for
              testing purposes.
            </span>
            <span aria-hidden="true">
              WARNING DISCLAIMER: This software is for demonstration, testing, and development
              purposes only. It is NOT intended for live clinical, hospital-floor, patient-care, or
              production use. All records, patient information, reports, schedules, and datasets
              displayed within this application are artificial, fictional, and generated solely for
              testing purposes.
            </span>
          </div>
        </div>

        <section className="auth-layout">
          <article className="auth-preview-card">
            <div className="auth-preview-header">
              <img src="/android-chrome-192x192.png" alt="BlueCare icon" className="auth-brand-image" />
              <div>
                <p className="eyebrow">BlueCare Access</p>
                <h1>Secure staff workspace sign in</h1>
              </div>
            </div>
            <p className="auth-preview-copy">
              A sharper, calmer login flow for staff accounts, schedules, profile management,
              document access, and secure password updates.
            </p>

            <div className="auth-preview-grid">
              <article className="auth-preview-tile">
                <small>Profile Preview</small>
                <strong>{profileData.personal.fullName}</strong>
                <span>{profileData.professional.designation}</span>
              </article>
              <article className="auth-preview-tile">
                <small>Department</small>
                <strong>{profileData.personal.department}</strong>
                <span>{profileData.professional.facility}</span>
              </article>
              <article className="auth-preview-tile">
                <small>Account Status</small>
                <strong>{profileData.account.accountStatus}</strong>
                <span>2FA {profileData.account.twoFactorStatus}</span>
              </article>
            </div>

            <div className="auth-preview-meta">
              <div className="auth-inline-item">
                <span className="summary-tile-icon">
                  <Icon name="email" />
                </span>
                <span>{profileData.personal.emailAddress}</span>
              </div>
              <div className="auth-inline-item">
                <span className="summary-tile-icon">
                  <Icon name="phone" />
                </span>
                <span>{profileData.personal.contactNumber}</span>
              </div>
              <div className="auth-inline-item">
                <span className="summary-tile-icon">
                  <Icon name="building" />
                </span>
                <span>{profileData.professional.facility}</span>
              </div>
            </div>
          </article>

          <article className="auth-card">
            <div className="auth-card-top">
              <div>
                <p className="eyebrow">{authMode === 'login' ? 'Sign In' : 'Password Recovery'}</p>
                <h2>{authMode === 'login' ? 'Welcome back to BlueCare' : 'Reset your password'}</h2>
                <p>
                  {authMode === 'login'
                    ? 'Use your username and password to open the healthcare workspace.'
                    : 'Confirm your username and choose a new password to restore access.'}
                </p>
              </div>
              <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Switch theme">
                <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
              </button>
            </div>

            <div className="auth-credentials-card">
              <small>Starter credentials</small>
              <strong>Username: {authData.username}</strong>
              <span>Password: {authData.password}</span>
            </div>

            <form className="auth-form" onSubmit={authMode === 'login' ? handleLoginSubmit : handleForgotPasswordSubmit}>
              {authMode === 'login' ? (
                <>
                  <input
                    value={loginForm.username}
                    onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })}
                    placeholder="Username"
                    autoComplete="username"
                    required
                  />
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                    placeholder="Password"
                    autoComplete="current-password"
                    required
                  />
                  <button type="submit" className="primary-button auth-submit">
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  <input
                    value={forgotForm.username}
                    onChange={(event) => setForgotForm({ ...forgotForm, username: event.target.value })}
                    placeholder="Username"
                    autoComplete="username"
                    required
                  />
                  <input
                    type="password"
                    value={forgotForm.newPassword}
                    onChange={(event) => setForgotForm({ ...forgotForm, newPassword: event.target.value })}
                    placeholder="New password"
                    autoComplete="new-password"
                    required
                  />
                  <input
                    type="password"
                    value={forgotForm.confirmPassword}
                    onChange={(event) => setForgotForm({ ...forgotForm, confirmPassword: event.target.value })}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    required
                  />
                  <button type="submit" className="primary-button auth-submit">
                    Update password
                  </button>
                </>
              )}
            </form>

            <div className="auth-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'forgot' : 'login')
                  setAuthStatusMessage(
                    authMode === 'login'
                      ? 'Use your username and choose a fresh password.'
                      : 'Sign in to continue to your workspace.',
                  )
                }}
              >
                {authMode === 'login' ? 'Forgot password?' : 'Back to sign in'}
              </button>
            </div>

            <p className="auth-status-message">{authStatusMessage}</p>
          </article>
        </section>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="disclaimer-marquee" role="note" aria-label="Demonstration disclaimer">
        <div className="disclaimer-track">
          <span>
            WARNING DISCLAIMER: This software is for demonstration, testing, and development
            purposes only. It is NOT intended for live clinical, hospital-floor, patient-care, or
            production use. All records, patient information, reports, schedules, and datasets
            displayed within this application are artificial, fictional, and generated solely for
            testing purposes.
          </span>
          <span aria-hidden="true">
            WARNING DISCLAIMER: This software is for demonstration, testing, and development
            purposes only. It is NOT intended for live clinical, hospital-floor, patient-care, or
            production use. All records, patient information, reports, schedules, and datasets
            displayed within this application are artificial, fictional, and generated solely for
            testing purposes.
          </span>
        </div>
      </div>

      <div
        className={isMenuOpen ? 'sidebar-overlay visible' : 'sidebar-overlay'}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden={!isMenuOpen}
      />

      <aside className={isMenuOpen ? 'sidebar open' : 'sidebar'}>
        <div className="sidebar-top">
          <div className="brand-mark">
            <Icon name="pulse" />
          </div>
          <div className="brand-copy">
            <p className="eyebrow">EMR Suite</p>
            <h1>BlueCare solutions</h1>
            <p className="sidebar-copy">A calmer, clearer workspace for daily patient care.</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={activeView === item.key ? 'nav-button active' : 'nav-button'}
              onClick={() => changeView(item.key)}
            >
              <span className="nav-icon">
                <Icon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-status">
          <p className="eyebrow">Workspace Note</p>
          <p>{statusMessage}</p>
          <button type="button" className="ghost-button light" onClick={toggleTheme}>
            Switch to {theme === 'dark' ? 'light' : 'dark'} mode
          </button>
          <button type="button" className="ghost-button light" onClick={handleResetWorkspace}>
            Refresh Starter Records
          </button>
          <button type="button" className="ghost-button light" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="workspace">
        <header className="workspace-topbar">
          <div className="topbar-leading">
            {isCompactLayout ? (
              <button
                type="button"
                className={isMenuOpen ? 'menu-toggle mobile-only active' : 'menu-toggle mobile-only'}
                onClick={() => setIsMenuOpen((current) => !current)}
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
              >
                <span className="menu-toggle-bars" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </button>
            ) : null}

            <button type="button" className="brand-chip" onClick={() => changeView('Dashboard')}>
              <span className="brand-chip-mark">
                <Icon name="pulse" />
              </span>
              <span className="brand-chip-copy">
                <small>BlueCare</small>
                <strong>solutions</strong>
              </span>
            </button>
          </div>

          <div className="global-search-shell" ref={searchRef}>
            <span className="global-search-icon">
              <Icon name="search" />
            </span>
            <input
              value={globalQuery}
              onChange={(event) => {
                setGlobalQuery(event.target.value)
                setIsSearchOpen(true)
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleGlobalSearchKeyDown}
              placeholder="Search patients, doctors, visits, invoices, and pages"
              aria-label="Global search"
              role="combobox"
              aria-expanded={isSearchOpen}
              aria-controls="global-search-results"
              aria-activedescendant={activeSearchIndex >= 0 ? visibleSearchItems[activeSearchIndex]?.id : undefined}
            />

            {isSearchOpen ? (
              <div className="global-search-panel" id="global-search-results" role="listbox">
                {globalQuery.trim() ? (
                  globalSearchResults.length ? (
                    <div className="global-search-results">
                      {globalSearchResults.map((result, index) => (
                        <button
                          key={result.id}
                          type="button"
                          id={result.id}
                          role="option"
                          aria-selected={index === activeSearchIndex}
                          className={index === activeSearchIndex ? 'search-result active' : 'search-result'}
                          onClick={() => handleGlobalResultSelect(result)}
                        >
                          <span className="search-result-icon">
                            <Icon name={result.icon} />
                          </span>
                          <span className="search-result-copy">
                            <strong>{result.title}</strong>
                            <small>{result.subtitle}</small>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="search-panel-note">
                      <strong>No matches yet</strong>
                      <p>Try a patient name, doctor specialty, invoice number, or page name.</p>
                    </div>
                  )
                ) : (
                  <div className="search-suggestions">
                    <small>Quick jump</small>
                    <div className="search-suggestion-list">
                      {searchSuggestions.map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          id={item.id}
                          role="option"
                          aria-selected={index === activeSearchIndex}
                          className={index === activeSearchIndex ? 'search-suggestion active' : 'search-suggestion'}
                          onClick={() => handleGlobalResultSelect(item)}
                        >
                          <Icon name={item.icon} />
                          <span>{item.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="theme-toggle desktop-only"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <button
              type="button"
              className={activeView === 'Profile' ? 'profile-shortcut active' : 'profile-shortcut'}
              onClick={() => changeView('Profile')}
              aria-label="Open profile section"
            >
              <Icon name="user" />
            </button>
          </div>
        </header>

        <div key={activeView} className="view-transition">
          {activeView === 'Dashboard' ? (
            <>
            <header className="hero-banner">
              <div className="hero-copy">
                <p className="eyebrow">Care Overview</p>
                <h2>Everything you need for the day is in one place.</h2>
                <p>
                  Review visits, update records, prepare prescriptions, and keep billing on track
                  without leaving the workspace.
                </p>
                <div className="hero-actions">
                  <button type="button" className="primary-button" onClick={() => changeView('Appointments')}>
                    Open Today&apos;s Visits
                  </button>
                  <button type="button" className="ghost-button" onClick={() => changeView('Patients')}>
                    Review Patients
                  </button>
                </div>
              </div>

              <div className="hero-focus">
                {todayFocus.map((item) => (
                  <article key={item.label} className="focus-card">
                    <small>{item.label}</small>
                    <strong>
                      <AnimatedMetric
                        key={`${item.label}-${item.value}-${item.suffix || ''}`}
                        value={item.value}
                        format={item.format}
                        suffix={item.suffix}
                      />
                    </strong>
                    <span>{item.caption}</span>
                  </article>
                ))}
              </div>
            </header>

            <section className="top-strip">
              <StatCard
                icon="patients"
                label="Patients"
                value={dashboard.totalPatients || patients.length}
                format="count"
              />
              <StatCard
                icon="calendar"
                label="Today&apos;s Visits"
                value={dashboard.todaysAppointments || 0}
                format="count"
              />
              <StatCard
                icon="stethoscope"
                label="Active Doctors"
                value={dashboard.activeDoctors || 0}
                format="count"
              />
              <StatCard
                icon="wallet"
                label="Monthly Revenue"
                value={dashboard.monthlyRevenue || 0}
                format="currency"
              />
            </section>
            </>
          ) : currentViewMeta ? (
            <section className="page-intro panel">
              <p className="eyebrow">{currentViewMeta.eyebrow}</p>
              <h2>{currentViewMeta.title}</h2>
              <p>{currentViewMeta.text}</p>
            </section>
          ) : null}

          {activeView === 'Dashboard' && (
          <section className="content-grid">
            <Panel
              title="Upcoming Appointments"
              subtitle="The next few visits at a glance"
              actionLabel="Open schedule"
              onAction={() => changeView('Appointments')}
            >
              {(dashboard.upcomingAppointments || []).length ? (
                <DataTable
                  columns={['Patient', 'Doctor', 'Date', 'Status']}
                  rows={(dashboard.upcomingAppointments || []).map((appointment) => [
                    appointment.patient_name,
                    appointment.doctor_name,
                    `${appointment.appointment_date} ${appointment.appointment_time}`,
                    appointment.status,
                  ])}
                />
              ) : (
                <EmptyState
                  title="No upcoming appointments"
                  text="Fresh bookings and rescheduled visits will appear here."
                  icon="calendar"
                  eyebrow="Schedule"
                  compact
                />
              )}
            </Panel>

            <div className="dual-grid">
              <Panel title="Recent Patient Activity" subtitle="Fresh changes across the clinic">
                {(dashboard.recentPatients || []).length ? (
                  <div className="timeline-list">
                    {(dashboard.recentPatients || []).map((patient) => (
                      <article key={patient.id} className="timeline-item">
                        <div className="timeline-icon">
                          <Icon name="patients" />
                        </div>
                        <div>
                          <strong>{patient.full_name}</strong>
                          <p>{patient.activity}</p>
                          <small>{patient.updated_at}</small>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No recent activity"
                    text="Patient updates will appear here after records are changed."
                    icon="patients"
                    eyebrow="Activity"
                    compact
                  />
                )}
              </Panel>

              <Panel title="Quick Actions" subtitle="Jump into the most common tasks">
                <div className="quick-grid">
                  <QuickActionCard
                    icon="patients"
                    title="Add patient"
                    text="Open a new profile and capture care details."
                    onClick={() => changeView('Patients')}
                  />
                  <QuickActionCard
                    icon="calendar"
                    title="Book visit"
                    text="Set the next appointment and keep the day moving."
                    onClick={() => changeView('Appointments')}
                  />
                  <QuickActionCard
                    icon="clipboard"
                    title="Write note"
                    text="Create a consultation record with a treatment plan."
                    onClick={() => changeView('Consultations')}
                  />
                  <QuickActionCard
                    icon="wallet"
                    title="Create invoice"
                    text="Record charges, payments, and balances."
                    onClick={() => changeView('Billing')}
                  />
                </div>
              </Panel>
            </div>
          </section>
          )}

          {activeView === 'Patients' && (
          <section className="content-grid">
            <Panel title="Patient Management" subtitle="Search, filter, review, and refine every profile">
              <div className="toolbar">
                <div className="field with-icon">
                  <span className="field-icon">
                    <Icon name="search" />
                  </span>
                  <input
                    value={patientSearch}
                    onChange={(event) => setPatientSearch(event.target.value)}
                    placeholder="Search by name, code, or phone"
                  />
                </div>
                <select value={patientFilter} onChange={(event) => setPatientFilter(event.target.value)}>
                  <option value="All">All patients</option>
                  <option value="Has Allergies">Has allergies</option>
                  <option value="Has Conditions">Has conditions</option>
                </select>
              </div>

              <div className="split-grid">
                <div className="list-panel">
                  {filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      className={selectedPatient?.id === patient.id ? 'list-card active' : 'list-card'}
                      onClick={() => setSelectedPatientId(patient.id)}
                    >
                      <div className="list-card-top">
                        <strong>{patient.full_name}</strong>
                        <span className="soft-pill">{patient.patient_code}</span>
                      </div>
                      <span>{patient.conditions || 'General review'}</span>
                      <small>{patient.phone}</small>
                    </button>
                  ))}
                </div>

                <div className="profile-panel">
                  {selectedPatient ? (
                    <>
                      <div className="profile-header">
                        <div>
                          <p className="eyebrow">Patient Profile</p>
                          <h3>{selectedPatient.full_name}</h3>
                          <div className="patient-profile-meta">
                            <span className="meta-pill">{selectedPatient.gender}</span>
                            <span className="meta-pill">{selectedPatient.date_of_birth}</span>
                            <span className="meta-pill">
                              {selectedPatient.blood_group || 'Blood group not added'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => loadPatientIntoForm(selectedPatient)}
                        >
                          Edit profile
                        </button>
                      </div>

                      <div className="patient-summary-grid">
                        <SummaryTile
                          icon="alert"
                          label="Allergies"
                          value={selectedPatient.allergies || 'None noted'}
                        />
                        <SummaryTile
                          icon="clipboard"
                          label="Conditions"
                          value={selectedPatient.conditions || 'No long-term condition'}
                        />
                        <SummaryTile
                          icon="phone"
                          label="Emergency Contact"
                          value={selectedPatient.emergency_contact || 'Not added yet'}
                        />
                        <SummaryTile
                          icon="calendar"
                          label="Last Visit"
                          value={selectedPatient.last_visit_at || 'No visit yet'}
                        />
                      </div>

                      <div className="detail-card">
                        <h4>Medical History</h4>
                        <p>{selectedPatient.medical_history || 'History has not been written yet.'}</p>
                      </div>

                      <div className="detail-card">
                        <h4>Visit Timeline</h4>
                        <div className="timeline-list compact">
                          {patientTimeline.map((item) => (
                            <article key={item.id} className="timeline-item">
                              <div className="timeline-icon">
                                <Icon name="clipboard" />
                              </div>
                              <div>
                                <strong>{item.title}</strong>
                                <p>{item.detail}</p>
                                <small>{item.date}</small>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <EmptyState
                      title="No patient selected"
                      text="Choose a patient to review the full profile."
                      icon="patients"
                      eyebrow="Patient Desk"
                    />
                  )}
                </div>
              </div>
            </Panel>

            <Panel title="Add Or Refresh Patient" subtitle="Capture demographics, contact details, and history">
              <form className="form-grid" onSubmit={handlePatientSubmit}>
                <input
                  value={patientForm.full_name}
                  onChange={(event) => setPatientForm({ ...patientForm, full_name: event.target.value })}
                  placeholder="Full name"
                  required
                />
                <select
                  value={patientForm.gender}
                  onChange={(event) => setPatientForm({ ...patientForm, gender: event.target.value })}
                >
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
                <input
                  type="date"
                  value={patientForm.date_of_birth}
                  onChange={(event) =>
                    setPatientForm({ ...patientForm, date_of_birth: event.target.value })
                  }
                  required
                />
                <input
                  value={patientForm.phone}
                  onChange={(event) => setPatientForm({ ...patientForm, phone: event.target.value })}
                  placeholder="Phone"
                  required
                />
                <input
                  value={patientForm.email}
                  onChange={(event) => setPatientForm({ ...patientForm, email: event.target.value })}
                  placeholder="Email"
                />
                <input
                  value={patientForm.blood_group}
                  onChange={(event) => setPatientForm({ ...patientForm, blood_group: event.target.value })}
                  placeholder="Blood group"
                />
                <input
                  className="full-span"
                  value={patientForm.address}
                  onChange={(event) => setPatientForm({ ...patientForm, address: event.target.value })}
                  placeholder="Address"
                />
                <input
                  className="full-span"
                  value={patientForm.emergency_contact}
                  onChange={(event) =>
                    setPatientForm({ ...patientForm, emergency_contact: event.target.value })
                  }
                  placeholder="Emergency contact"
                />
                <textarea
                  value={patientForm.allergies}
                  onChange={(event) => setPatientForm({ ...patientForm, allergies: event.target.value })}
                  placeholder="Allergies"
                />
                <textarea
                  value={patientForm.conditions}
                  onChange={(event) => setPatientForm({ ...patientForm, conditions: event.target.value })}
                  placeholder="Conditions"
                />
                <textarea
                  className="full-span"
                  value={patientForm.medical_history}
                  onChange={(event) =>
                    setPatientForm({ ...patientForm, medical_history: event.target.value })
                  }
                  placeholder="Medical history"
                />
                <button type="submit" className="primary-button">
                  Save patient
                </button>
              </form>
            </Panel>
          </section>
          )}

          {activeView === 'Appointments' && (
          <section className="content-grid">
            <Panel title="Schedule Appointments" subtitle="Plan visits, adjust timing, and guide patient flow">
              <form className="form-grid" onSubmit={handleAppointmentSubmit}>
                <select
                  value={appointmentForm.patient_id}
                  onChange={(event) =>
                    setAppointmentForm({ ...appointmentForm, patient_id: event.target.value })
                  }
                  required
                >
                  <option value="">Select patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </option>
                  ))}
                </select>
                <select
                  value={appointmentForm.doctor_id}
                  onChange={(event) =>
                    setAppointmentForm({ ...appointmentForm, doctor_id: event.target.value })
                  }
                  required
                >
                  <option value="">Select doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.full_name} • {doctor.specialization}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={appointmentForm.appointment_date}
                  onChange={(event) =>
                    setAppointmentForm({ ...appointmentForm, appointment_date: event.target.value })
                  }
                  required
                />
                <input
                  type="time"
                  value={appointmentForm.appointment_time}
                  onChange={(event) =>
                    setAppointmentForm({ ...appointmentForm, appointment_time: event.target.value })
                  }
                  required
                />
                <input
                  className="full-span"
                  value={appointmentForm.reason}
                  onChange={(event) => setAppointmentForm({ ...appointmentForm, reason: event.target.value })}
                  placeholder="Reason for visit"
                  required
                />
                <textarea
                  className="full-span"
                  value={appointmentForm.notes}
                  onChange={(event) => setAppointmentForm({ ...appointmentForm, notes: event.target.value })}
                  placeholder="Notes for the care team"
                />
                <button type="submit" className="primary-button">
                  Save appointment
                </button>
              </form>
            </Panel>

            <Panel title="Daily Schedule" subtitle="Keep each visit moving from arrival to completion">
              {appointments.length ? (
                <div className="appointment-list">
                  {appointments.map((appointment) => (
                    <article key={appointment.id} className="appointment-card">
                      <div className="appointment-main">
                        <div className="appointment-icon">
                          <Icon name="calendar" />
                        </div>
                        <div>
                          <strong>{appointment.patient_name}</strong>
                          <p>
                            {appointment.doctor_name} • {appointment.appointment_date} •{' '}
                            {appointment.appointment_time}
                          </p>
                          <small>{appointment.reason}</small>
                        </div>
                      </div>
                      <div className="status-stack">
                        <span className={`status-badge ${appointment.status.toLowerCase().replaceAll(' ', '-')}`}>
                          {appointment.status}
                        </span>
                        <select
                          value={appointment.status}
                          onChange={(event) =>
                            handleAppointmentStatusChange(appointment.id, event.target.value)
                          }
                        >
                          {appointmentStatuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No appointments scheduled"
                  text="Newly booked visits will appear here once the day plan is prepared."
                  icon="calendar"
                  eyebrow="Visit Planning"
                />
              )}
            </Panel>
          </section>
          )}

          {activeView === 'Doctors' && (
          <section className="content-grid">
            <Panel title="Doctor Profiles" subtitle="Track specialties, availability, and current appointment load">
              <div className="card-grid">
                {doctorSummary.map((doctor) => (
                  <article key={doctor.id} className="doctor-card">
                    <div className="doctor-card-top">
                      <div className="doctor-avatar">
                        <Icon name="stethoscope" />
                      </div>
                      <div className="doctor-heading">
                        <span className="soft-pill">{doctor.specialization}</span>
                        <h3>{doctor.full_name}</h3>
                        <p>{doctor.availability}</p>
                      </div>
                    </div>

                    <div className="doctor-stats">
                      <div className="doctor-stat">
                        <small>Status</small>
                        <strong>{doctor.status}</strong>
                      </div>
                      <div className="doctor-stat">
                        <small>Visits</small>
                        <strong>{doctor.assigned_appointments}</strong>
                      </div>
                    </div>

                    <div className="doctor-highlight">
                      <span className="doctor-highlight-icon">
                        <Icon name="chart" />
                      </span>
                      <small>{doctor.consultation_history}</small>
                    </div>
                  </article>
                ))}
              </div>
            </Panel>

            <Panel title="Add Doctor" subtitle="Expand the care team and keep schedules visible">
              <form className="form-grid" onSubmit={handleDoctorSubmit}>
                <input
                  value={doctorForm.full_name}
                  onChange={(event) => setDoctorForm({ ...doctorForm, full_name: event.target.value })}
                  placeholder="Doctor name"
                  required
                />
                <input
                  value={doctorForm.specialization}
                  onChange={(event) =>
                    setDoctorForm({ ...doctorForm, specialization: event.target.value })
                  }
                  placeholder="Specialization"
                  required
                />
                <input
                  value={doctorForm.phone}
                  onChange={(event) => setDoctorForm({ ...doctorForm, phone: event.target.value })}
                  placeholder="Phone"
                />
                <input
                  value={doctorForm.email}
                  onChange={(event) => setDoctorForm({ ...doctorForm, email: event.target.value })}
                  placeholder="Email"
                />
                <input
                  className="full-span"
                  value={doctorForm.availability}
                  onChange={(event) =>
                    setDoctorForm({ ...doctorForm, availability: event.target.value })
                  }
                  placeholder="Availability"
                />
                <textarea
                  className="full-span"
                  value={doctorForm.consultation_history}
                  onChange={(event) =>
                    setDoctorForm({ ...doctorForm, consultation_history: event.target.value })
                  }
                  placeholder="Care history summary"
                />
                <button type="submit" className="primary-button">
                  Save doctor
                </button>
              </form>
            </Panel>
          </section>
          )}

          {activeView === 'Consultations' && (
          <section className="content-grid">
            <Panel title="Consultation Records" subtitle="Capture notes, diagnoses, plans, and supporting files">
              <form className="form-grid" onSubmit={handleConsultationSubmit}>
                <select
                  value={consultationForm.appointment_id}
                  onChange={(event) =>
                    setConsultationForm({ ...consultationForm, appointment_id: event.target.value })
                  }
                  required
                >
                  <option value="">Appointment</option>
                  {appointments.map((appointment) => (
                    <option key={appointment.id} value={appointment.id}>
                      {appointment.patient_name} • {appointment.appointment_date}
                    </option>
                  ))}
                </select>
                <select
                  value={consultationForm.patient_id}
                  onChange={(event) =>
                    setConsultationForm({ ...consultationForm, patient_id: event.target.value })
                  }
                  required
                >
                  <option value="">Patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </option>
                  ))}
                </select>
                <select
                  value={consultationForm.doctor_id}
                  onChange={(event) =>
                    setConsultationForm({ ...consultationForm, doctor_id: event.target.value })
                  }
                  required
                >
                  <option value="">Doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.full_name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={consultationForm.consultation_date}
                  onChange={(event) =>
                    setConsultationForm({ ...consultationForm, consultation_date: event.target.value })
                  }
                  required
                />
                <textarea
                  className="full-span"
                  value={consultationForm.clinical_notes}
                  onChange={(event) =>
                    setConsultationForm({ ...consultationForm, clinical_notes: event.target.value })
                  }
                  placeholder="Clinical notes"
                  required
                />
                <textarea
                  value={consultationForm.diagnosis}
                  onChange={(event) =>
                    setConsultationForm({ ...consultationForm, diagnosis: event.target.value })
                  }
                  placeholder="Diagnosis"
                  required
                />
                <textarea
                  value={consultationForm.treatment_plan}
                  onChange={(event) =>
                    setConsultationForm({ ...consultationForm, treatment_plan: event.target.value })
                  }
                  placeholder="Treatment plan"
                  required
                />
                <input
                  className="full-span"
                  value={consultationForm.supporting_document}
                  onChange={(event) =>
                    setConsultationForm({
                      ...consultationForm,
                      supporting_document: event.target.value,
                    })
                  }
                  placeholder="Supporting document name"
                />
                <button type="submit" className="primary-button">
                  Save consultation
                </button>
              </form>
            </Panel>

            <Panel title="Previous Visits" subtitle="A clean view of recent consultation history">
              {consultations.length ? (
                <div className="timeline-list">
                  {consultations.map((consultation) => (
                    <article key={consultation.id} className="timeline-item">
                      <div className="timeline-icon">
                        <Icon name="clipboard" />
                      </div>
                      <div>
                        <strong>
                          {consultation.patient_name} • {consultation.doctor_name}
                        </strong>
                        <p>{consultation.diagnosis}</p>
                        <small>
                          {consultation.consultation_date} •{' '}
                          {consultation.supporting_document || 'No file attached'}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No consultation history"
                  text="Saved consultation notes and visit records will appear here."
                  icon="clipboard"
                  eyebrow="Clinical Notes"
                />
              )}
            </Panel>
          </section>
          )}

          {activeView === 'Prescriptions' && (
          <section className="content-grid">
            <Panel title="Prescription Management" subtitle="Prepare medicine lists with clear dosage guidance">
              <form className="form-grid" onSubmit={handlePrescriptionSubmit}>
                <select
                  value={prescriptionForm.consultation_id}
                  onChange={(event) =>
                    setPrescriptionForm({ ...prescriptionForm, consultation_id: event.target.value })
                  }
                  required
                >
                  <option value="">Consultation</option>
                  {consultations.map((consultation) => (
                    <option key={consultation.id} value={consultation.id}>
                      {consultation.patient_name} • {consultation.consultation_date}
                    </option>
                  ))}
                </select>
                <input
                  value={prescriptionForm.patient_name}
                  onChange={(event) =>
                    setPrescriptionForm({ ...prescriptionForm, patient_name: event.target.value })
                  }
                  placeholder="Patient name"
                  required
                />
                <input
                  value={prescriptionForm.doctor_name}
                  onChange={(event) =>
                    setPrescriptionForm({ ...prescriptionForm, doctor_name: event.target.value })
                  }
                  placeholder="Doctor name"
                  required
                />
                <input
                  type="date"
                  value={prescriptionForm.issued_on}
                  onChange={(event) =>
                    setPrescriptionForm({ ...prescriptionForm, issued_on: event.target.value })
                  }
                  required
                />
                <textarea
                  className="full-span"
                  value={prescriptionForm.medicines_text}
                  onChange={(event) =>
                    setPrescriptionForm({ ...prescriptionForm, medicines_text: event.target.value })
                  }
                  placeholder="Medicine | Dosage | Instructions"
                  required
                />
                <textarea
                  className="full-span"
                  value={prescriptionForm.notes}
                  onChange={(event) => setPrescriptionForm({ ...prescriptionForm, notes: event.target.value })}
                  placeholder="Prescription notes"
                />
                <button type="submit" className="primary-button">
                  Save prescription
                </button>
              </form>
            </Panel>

            <Panel title="Ready To Share" subtitle="Download printable prescription summaries">
              {prescriptions.length ? (
                <div className="card-grid">
                  {prescriptions.map((prescription) => (
                    <article key={prescription.id} className="info-panel emphasis">
                      <div className="panel-icon-row">
                        <span className="panel-icon">
                          <Icon name="capsule" />
                        </span>
                        <span className="soft-pill">{prescription.issued_on}</span>
                      </div>
                      <h3>{prescription.patient_name}</h3>
                      <p>{prescription.doctor_name}</p>
                      <ul className="plain-list">
                        {prescription.medicines.map((medicine, index) => (
                          <li key={`${prescription.id}-${index}`}>
                            {medicine.name} • {medicine.dosage} • {medicine.instructions}
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => handlePrescriptionDownload(prescription)}
                      >
                        Download summary
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No prescriptions ready"
                  text="Prepared prescriptions will appear here for quick download."
                  icon="capsule"
                  eyebrow="Medication Desk"
                />
              )}
            </Panel>
          </section>
          )}

          {activeView === 'Billing' && (
          <section className="content-grid">
            <Panel title="Billing" subtitle="Create invoices, log payments, and keep balances visible">
              <form className="form-grid" onSubmit={handleInvoiceSubmit}>
                <input
                  value={invoiceForm.patient_name}
                  onChange={(event) => setInvoiceForm({ ...invoiceForm, patient_name: event.target.value })}
                  placeholder="Patient name"
                  required
                />
                <input
                  type="number"
                  min="0"
                  value={invoiceForm.consultation_charge}
                  onChange={(event) =>
                    setInvoiceForm({ ...invoiceForm, consultation_charge: event.target.value })
                  }
                  placeholder="Consultation charge"
                  required
                />
                <input
                  type="number"
                  min="0"
                  value={invoiceForm.additional_services}
                  onChange={(event) =>
                    setInvoiceForm({ ...invoiceForm, additional_services: event.target.value })
                  }
                  placeholder="Additional services"
                />
                <input
                  type="number"
                  min="0"
                  value={invoiceForm.paid_amount}
                  onChange={(event) => setInvoiceForm({ ...invoiceForm, paid_amount: event.target.value })}
                  placeholder="Paid amount"
                />
                <select
                  value={invoiceForm.payment_status}
                  onChange={(event) => setInvoiceForm({ ...invoiceForm, payment_status: event.target.value })}
                >
                  <option>Pending</option>
                  <option>Partial</option>
                  <option>Paid</option>
                </select>
                <button type="submit" className="primary-button">
                  Save invoice
                </button>
              </form>
            </Panel>

            <Panel title="Revenue Snapshot" subtitle="See what has been billed, collected, and left outstanding">
              <div className="top-strip compact">
                <StatCard
                  icon="wallet"
                  label="Total Invoiced"
                  value={formatCurrency(
                    invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0),
                  )}
                />
                <StatCard
                  icon="chart"
                  label="Collected"
                  value={formatCurrency(
                    invoices.reduce((sum, invoice) => sum + Number(invoice.paid_amount || 0), 0),
                  )}
                />
                <StatCard
                  icon="bell"
                  label="Outstanding"
                  value={formatCurrency(
                    invoices.reduce(
                      (sum, invoice) =>
                        sum +
                        (Number(invoice.total_amount || 0) - Number(invoice.paid_amount || 0)),
                      0,
                    ),
                  )}
                />
              </div>

              {invoices.length ? (
                <div className="appointment-list">
                  {invoices.map((invoice) => (
                    <article key={invoice.id} className="appointment-card">
                      <div className="appointment-main">
                        <div className="appointment-icon">
                          <Icon name="wallet" />
                        </div>
                        <div>
                          <strong>
                            {invoice.invoice_number} • {invoice.patient_name}
                          </strong>
                          <p>
                            Total {formatCurrency(invoice.total_amount)} • Paid{' '}
                            {formatCurrency(invoice.paid_amount)}
                          </p>
                          <small>{invoice.payment_status}</small>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => handleReceiptDownload(invoice)}
                      >
                        Download receipt
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No invoices yet"
                  text="Saved invoices and receipts will appear here after billing is created."
                  icon="wallet"
                  eyebrow="Billing Desk"
                />
              )}
            </Panel>
          </section>
          )}

          {activeView === 'Reports' && (
          <section className="content-grid">
            <Panel title="Reports" subtitle="Export clear summaries for patients, visits, revenue, and care activity">
              <div className="card-grid">
                <ReportCard
                  title="Patient Report"
                  icon="patients"
                  items={reports.patientReport || []}
                  onExport={() =>
                    handleReportExport('patient-report.csv', reports.patientReport || [], 'Patient Report')
                  }
                />
                <ReportCard
                  title="Appointment Report"
                  icon="calendar"
                  items={reports.appointmentReport || []}
                  onExport={() =>
                    handleReportExport(
                      'appointment-report.csv',
                      reports.appointmentReport || [],
                      'Appointment Report',
                    )
                  }
                />
                <ReportCard
                  title="Revenue Report"
                  icon="wallet"
                  items={reports.revenueReport || []}
                  onExport={() =>
                    handleReportExport('revenue-report.csv', reports.revenueReport || [], 'Revenue Report')
                  }
                />
                <ReportCard
                  title="Doctor Activity"
                  icon="stethoscope"
                  items={reports.doctorActivityReport || []}
                  onExport={() =>
                    handleReportExport(
                      'doctor-activity-report.csv',
                      reports.doctorActivityReport || [],
                      'Doctor Activity Report',
                    )
                  }
                />
              </div>
            </Panel>
          </section>
          )}

          {activeView === 'Notifications' && (
          <section className="content-grid">
            <Panel title="Notifications" subtitle="Stay ahead of visits, follow-ups, and pending balances">
              {notifications.length ? (
                <div className="timeline-list">
                  {notifications.map((notification) => (
                    <article key={notification.id} className="timeline-item">
                      <div className="timeline-icon">
                        <Icon
                          name={
                            notification.type === 'billing'
                              ? 'wallet'
                              : notification.type === 'follow-up'
                                ? 'clipboard'
                                : 'bell'
                          }
                        />
                      </div>
                      <div>
                        <strong>{notification.title}</strong>
                        <p>{notification.message}</p>
                        <small>{notification.type}</small>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No notifications yet"
                  text="Upcoming visits, follow-ups, and billing reminders will appear here."
                  icon="bell"
                  eyebrow="Reminder Center"
                />
              )}
            </Panel>
          </section>
          )}

          {activeView === 'Profile' && (
          <section className="content-grid">
            <Panel
              title="User Profile"
              subtitle="Manage your healthcare profile, credentials, schedule, and security settings from one sharper workspace."
            >
              <div className="profile-hero-card">
                <div className="profile-hero-main">
                  <img src="/android-chrome-192x192.png" alt="BlueCare icon" className="profile-hero-avatar" />
                  <div className="profile-hero-copy">
                    <h3>{profileData.personal.fullName}</h3>
                    <p>{profileData.professional.designation}</p>
                    <div className="profile-inline-pills">
                      <span className="meta-pill">{profileData.personal.department}</span>
                      <span className="meta-pill">{profileData.professional.facility}</span>
                      <span className="meta-pill">Member Since: {profileData.memberSince}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-hero-meta">
                  <div className="auth-inline-item">
                    <span className="summary-tile-icon">
                      <Icon name="email" />
                    </span>
                    <span>{profileData.personal.emailAddress}</span>
                  </div>
                  <div className="auth-inline-item">
                    <span className="summary-tile-icon">
                      <Icon name="phone" />
                    </span>
                    <span>{profileData.personal.contactNumber}</span>
                  </div>
                  <div className="auth-inline-item">
                    <span className="summary-tile-icon">
                      <Icon name="building" />
                    </span>
                    <span>{profileData.professional.facility}</span>
                  </div>
                  <div className="auth-inline-item">
                    <span className="summary-tile-icon">
                      <Icon name="clock" />
                    </span>
                    <span>Last Login: {profileData.account.lastLogin}</span>
                  </div>
                </div>

                <div className="profile-status-row">
                  <span className="soft-pill">Status: {profileData.account.accountStatus}</span>
                  <span className="soft-pill">Role: {profileData.personal.role}</span>
                  <span className="soft-pill">Username: {profileData.account.username}</span>
                </div>

                <p className="profile-bio-copy">{profileData.bio}</p>
              </div>
            </Panel>

            <div className="profile-overview-grid">
              {profileOverviewCards.map((card) => (
                <SummaryTile key={card.label} icon={card.icon} label={card.label} value={card.value} />
              ))}
            </div>

            <Panel title="Quick Actions" subtitle="Move quickly through the most common profile tasks.">
              <div className="profile-actions-grid">
                {profileQuickActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    className="profile-action-card"
                    onClick={() => handleProfileJump(action.target, action.label)}
                  >
                    <span className="summary-tile-icon">
                      <Icon name={action.icon} />
                    </span>
                    <strong>{action.label}</strong>
                  </button>
                ))}
              </div>
            </Panel>

            <div id="profile-information">
              <Panel title="Personal Information" subtitle="Keep identity, contact, and care profile details current.">
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault()
                    handleProfileSave('Personal information updated.')
                  }}
                >
                  <input
                    value={profileData.personal.fullName}
                    onChange={handleProfileInputChange('personal', 'fullName')}
                    placeholder="Full Name"
                    required
                  />
                  <input
                    value={profileData.personal.employeeId}
                    onChange={handleProfileInputChange('personal', 'employeeId')}
                    placeholder="Employee ID"
                    required
                  />
                  <select
                    value={profileData.personal.role}
                    onChange={handleProfileInputChange('personal', 'role')}
                  >
                    {roleOptions.map((role) => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>
                  <input
                    value={profileData.personal.department}
                    onChange={handleProfileInputChange('personal', 'department')}
                    placeholder="Department"
                    required
                  />
                  <select
                    value={profileData.personal.gender}
                    onChange={handleProfileInputChange('personal', 'gender')}
                  >
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                  <input
                    type="date"
                    value={profileData.personal.dateOfBirth}
                    onChange={handleProfileInputChange('personal', 'dateOfBirth')}
                  />
                  <input
                    value={profileData.personal.bloodGroup}
                    onChange={handleProfileInputChange('personal', 'bloodGroup')}
                    placeholder="Blood Group"
                  />
                  <input
                    value={profileData.personal.contactNumber}
                    onChange={handleProfileInputChange('personal', 'contactNumber')}
                    placeholder="Contact Number"
                    required
                  />
                  <input
                    value={profileData.personal.emailAddress}
                    onChange={handleProfileInputChange('personal', 'emailAddress')}
                    placeholder="Email Address"
                    required
                  />
                  <input
                    value={profileData.personal.emergencyContact}
                    onChange={handleProfileInputChange('personal', 'emergencyContact')}
                    placeholder="Emergency Contact"
                  />
                  <textarea
                    className="full-span"
                    value={profileData.personal.residentialAddress}
                    onChange={handleProfileInputChange('personal', 'residentialAddress')}
                    placeholder="Residential Address"
                  />
                  <button type="submit" className="primary-button">
                    Save personal information
                  </button>
                </form>
              </Panel>
            </div>

            <div className="dual-grid">
              <div id="profile-professional">
                <Panel title="Professional Information" subtitle="Maintain role, experience, reporting, and license records.">
                  <form
                    className="form-grid"
                    onSubmit={(event) => {
                      event.preventDefault()
                      handleProfileSave('Professional information updated.')
                    }}
                  >
                    <input
                      value={profileData.professional.designation}
                      onChange={handleProfileInputChange('professional', 'designation')}
                      placeholder="Designation"
                      required
                    />
                    <input
                      value={profileData.professional.specialization}
                      onChange={handleProfileInputChange('professional', 'specialization')}
                      placeholder="Specialization"
                    />
                    <input
                      value={profileData.professional.licenseNumber}
                      onChange={handleProfileInputChange('professional', 'licenseNumber')}
                      placeholder="License / Registration Number"
                    />
                    <input
                      value={profileData.professional.experience}
                      onChange={handleProfileInputChange('professional', 'experience')}
                      placeholder="Years of Experience"
                    />
                    <input
                      type="date"
                      value={profileData.professional.joiningDate}
                      onChange={handleProfileInputChange('professional', 'joiningDate')}
                    />
                    <input
                      value={profileData.professional.reportingManager}
                      onChange={handleProfileInputChange('professional', 'reportingManager')}
                      placeholder="Reporting Manager"
                    />
                    <input
                      className="full-span"
                      value={profileData.professional.facility}
                      onChange={handleProfileInputChange('professional', 'facility')}
                      placeholder="Assigned Branch / Facility"
                    />
                    <button type="submit" className="primary-button">
                      Save professional details
                    </button>
                  </form>
                </Panel>
              </div>

              <Panel title="Account Information" subtitle="Review role access, status, and sign-in settings.">
                <div className="profile-data-list">
                  <ProfileDataRow icon="user" label="Username" value={profileData.account.username} />
                  <ProfileDataRow icon="briefcase" label="User Role" value={profileData.account.userRole} />
                  <ProfileDataRow icon="pulse" label="Account Status" value={profileData.account.accountStatus} />
                  <ProfileDataRow icon="clock" label="Last Login" value={profileData.account.lastLogin} />
                  <ProfileDataRow icon="shield" label="Two-Factor Authentication" value={profileData.account.twoFactorStatus} />
                </div>
                <div className="profile-inline-actions">
                  <button type="button" className="ghost-button" onClick={handleToggleTwoFactor}>
                    {profileData.account.twoFactorStatus === 'Enabled' ? 'Disable' : 'Enable'} two-factor authentication
                  </button>
                </div>
              </Panel>
            </div>

            <div id="profile-schedule">
              <Panel title="Availability And Schedule" subtitle="Keep working hours, shift details, and leave planning visible.">
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault()
                    handleProfileSave('Availability and schedule updated.')
                  }}
                >
                  <input
                    value={profileData.schedule.workingHours}
                    onChange={handleProfileInputChange('schedule', 'workingHours')}
                    placeholder="Working Hours"
                  />
                  <input
                    value={profileData.schedule.shiftInformation}
                    onChange={handleProfileInputChange('schedule', 'shiftInformation')}
                    placeholder="Shift Information"
                  />
                  <input
                    value={profileData.schedule.weeklySchedule}
                    onChange={handleProfileInputChange('schedule', 'weeklySchedule')}
                    placeholder="Weekly Schedule"
                  />
                  <input
                    value={profileData.schedule.leaveBalance}
                    onChange={handleProfileInputChange('schedule', 'leaveBalance')}
                    placeholder="Leave Balance"
                  />
                  <input
                    className="full-span"
                    value={profileData.schedule.upcomingLeaves}
                    onChange={handleProfileInputChange('schedule', 'upcomingLeaves')}
                    placeholder="Upcoming Leaves"
                  />
                  <button type="submit" className="primary-button">
                    Save schedule
                  </button>
                </form>
              </Panel>
            </div>

            <Panel title="Performance Overview" subtitle="Track attendance, appointments, tasks, and monthly activity.">
              <div className="profile-overview-grid">
                {profileOverviewCards.map((card) => (
                  <SummaryTile key={`performance-${card.label}`} icon={card.icon} label={card.label} value={card.value} />
                ))}
              </div>
              <div className="detail-card">
                <h4>Monthly Activity Statistics</h4>
                <p>{profileData.performance.monthlyActivity}</p>
              </div>
            </Panel>

            <div id="profile-documents">
              <Panel title="Documents" subtitle="Keep identification, certificates, licenses, and other files ready.">
                <div className="card-grid">
                  {profileData.documents.map((documentItem) => (
                    <article key={documentItem.name} className="info-panel emphasis profile-document-card">
                      <div className="panel-icon-row">
                        <span className="panel-icon">
                          <Icon name="file" />
                        </span>
                        <span className="soft-pill">{documentItem.updatedOn}</span>
                      </div>
                      <h3>{documentItem.name}</h3>
                      <p>{documentItem.status}</p>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => handleDocumentDownload(documentItem)}
                      >
                        Download summary
                      </button>
                    </article>
                  ))}
                </div>
              </Panel>
            </div>

            <div id="profile-preferences" className="dual-grid">
              <Panel title="Preferences" subtitle="Adjust language, notifications, theme, and time zone.">
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault()
                    handleProfileSave('Preferences updated.')
                  }}
                >
                  <input
                    value={profileData.preferences.language}
                    onChange={handleProfileInputChange('preferences', 'language')}
                    placeholder="Language Preference"
                  />
                  <input
                    value={profileData.preferences.notifications}
                    onChange={handleProfileInputChange('preferences', 'notifications')}
                    placeholder="Notification Settings"
                  />
                  <select
                    value={profileData.preferences.themeSetting}
                    onChange={(event) => {
                      handleProfileFieldChange('preferences', 'themeSetting', event.target.value)
                      if (event.target.value === 'Dark mode') {
                        setTheme('dark')
                      }
                      if (event.target.value === 'Light mode') {
                        setTheme('light')
                      }
                    }}
                  >
                    <option>Dark mode</option>
                    <option>Light mode</option>
                    <option>Follow current workspace</option>
                  </select>
                  <input
                    value={profileData.preferences.timeZone}
                    onChange={handleProfileInputChange('preferences', 'timeZone')}
                    placeholder="Time Zone"
                  />
                  <button type="submit" className="primary-button">
                    Save preferences
                  </button>
                </form>
              </Panel>

              <Panel title="Theme Control" subtitle="Switch theme directly from the profile area whenever needed.">
                <div className="profile-data-list">
                  <ProfileDataRow icon="moon" label="Current Theme" value={theme === 'dark' ? 'Dark mode' : 'Light mode'} />
                  <ProfileDataRow icon="settings" label="Theme Preference" value={profileData.preferences.themeSetting} />
                </div>
                <button type="button" className="ghost-button profile-theme-toggle" onClick={toggleTheme}>
                  Turn on {theme === 'dark' ? 'light' : 'dark'} mode from profile
                </button>
              </Panel>
            </div>

            <div id="profile-security" className="dual-grid">
              <Panel title="Security" subtitle="Change passwords, review history, and monitor active sessions.">
                <form className="form-grid" onSubmit={handlePasswordChange}>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      setPasswordForm({ ...passwordForm, currentPassword: event.target.value })
                    }
                    placeholder="Current password"
                    autoComplete="current-password"
                    required
                  />
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm({ ...passwordForm, newPassword: event.target.value })
                    }
                    placeholder="New password"
                    autoComplete="new-password"
                    required
                  />
                  <input
                    className="full-span"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })
                    }
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    required
                  />
                  <button type="submit" className="primary-button">
                    Change password
                  </button>
                </form>

                <div className="detail-card">
                  <h4>Security Alerts</h4>
                  <ul className="plain-list">
                    {profileData.security.alerts.map((alert) => (
                      <li key={alert}>{alert}</li>
                    ))}
                  </ul>
                </div>
              </Panel>

              <Panel title="Login History And Sessions" subtitle="Review recent sign-ins and currently active devices.">
                <div className="detail-card">
                  <h4>Login History</h4>
                  <div className="timeline-list compact">
                    {profileData.security.loginHistory.map((entry) => (
                      <article key={`${entry.label}-${entry.detail}`} className="timeline-item">
                        <div className="timeline-icon">
                          <Icon name="clock" />
                        </div>
                        <div>
                          <strong>{entry.label}</strong>
                          <p>{entry.detail}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="detail-card">
                  <h4>Active Sessions</h4>
                  <div className="timeline-list compact">
                    {profileData.security.activeSessions.map((entry) => (
                      <article key={`${entry.label}-${entry.detail}`} className="timeline-item">
                        <div className="timeline-icon">
                          <Icon name="shield" />
                        </div>
                        <div>
                          <strong>{entry.label}</strong>
                          <p>{entry.detail}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </Panel>
            </div>

            <Panel title="Bio" subtitle="A professional summary used across the workspace profile.">
              <form
                className="form-grid"
                onSubmit={(event) => {
                  event.preventDefault()
                  handleProfileSave('Profile bio updated.')
                }}
              >
                <textarea
                  className="full-span"
                  value={profileData.bio}
                  onChange={(event) => setProfileData((current) => ({ ...current, bio: event.target.value }))}
                  placeholder="Bio"
                />
                <button type="submit" className="primary-button">
                  Save bio
                </button>
              </form>
            </Panel>
          </section>
          )}
        </div>

        <div className="toast-stack" aria-live="polite" aria-atomic="true">
          {toasts.map((toast) => (
            <Toast key={toast.id} tone={toast.tone} message={toast.message} />
          ))}
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value, format = 'count' }) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <span className="panel-icon">
          <Icon name={icon} />
        </span>
        <p>{label}</p>
      </div>
      <strong>
        <AnimatedMetric key={`${label}-${value}-${format}`} value={value} format={format} />
      </strong>
    </article>
  )
}

function AnimatedMetric({ value, format = 'count', suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const targetValue = Number(value || 0)
    const duration = 900
    let frameId = 0
    let startTime = 0

    function animateFrame(timestamp) {
      if (!startTime) {
        startTime = timestamp
      }

      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easedProgress = 1 - (1 - progress) * (1 - progress)
      setDisplayValue(Math.round(targetValue * easedProgress))

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animateFrame)
      }
    }

    frameId = window.requestAnimationFrame(animateFrame)

    return () => window.cancelAnimationFrame(frameId)
  }, [value])

  const formattedValue =
    format === 'currency'
      ? formatCurrency(displayValue)
      : displayValue.toLocaleString('en-IN')

  return (
    <>
      {formattedValue}
      {suffix ? ` ${suffix}` : ''}
    </>
  )
}

function Panel({ title, subtitle, children, actionLabel, onAction }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        {actionLabel ? (
          <button type="button" className="ghost-button" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function QuickActionCard({ icon, title, text, onClick }) {
  return (
    <button type="button" className="quick-card" onClick={onClick}>
      <span className="panel-icon">
        <Icon name={icon} />
      </span>
      <strong>{title}</strong>
      <span>{text}</span>
    </button>
  )
}

function EmptyState({ title, text, compact = false, icon = 'grid', eyebrow = 'Clear Space' }) {
  return (
    <div className={compact ? 'empty-state compact' : 'empty-state'}>
      <div className="empty-state-visual" aria-hidden="true">
        <span className="empty-state-orb orb-one"></span>
        <span className="empty-state-orb orb-two"></span>
        <span className="panel-icon empty-state-icon">
          <Icon name={icon} />
        </span>
      </div>
      <small className="empty-state-eyebrow">{eyebrow}</small>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

function SummaryTile({ icon, label, value }) {
  return (
    <article className="summary-tile">
      <div className="summary-tile-top">
        <span className="summary-tile-icon">
          <Icon name={icon} />
        </span>
        <small>{label}</small>
      </div>
      <strong>{value}</strong>
    </article>
  )
}

function ProfileDataRow({ icon, label, value }) {
  return (
    <div className="profile-data-row">
      <span className="summary-tile-icon">
        <Icon name={icon} />
      </span>
      <div className="profile-data-copy">
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

function DataTable({ columns, rows }) {
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

function ReportCard({ title, icon, items, onExport }) {
  return (
    <article className="info-panel emphasis">
      <div className="panel-icon-row">
        <span className="panel-icon">
          <Icon name={icon} />
        </span>
      </div>
      <h3>{title}</h3>
      {items.length ? (
        <ul className="plain-list report-list">
          {items.map((item) => (
            <li key={item.label}>
              <div className="report-row">
                <span>{item.label}</span>
                <strong>{formatReportValue(title, item.value)}</strong>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          compact
          title="No report data"
          text="This report will populate when records are available."
          icon={icon}
          eyebrow="Insights"
        />
      )}
      <button type="button" className="ghost-button" onClick={onExport}>
        Export CSV
      </button>
    </article>
  )
}

function Toast({ tone, message }) {
  return (
    <div className={`toast ${tone}`}>
      <span className="toast-icon">
        <Icon name={tone === 'error' ? 'alert' : 'pulse'} />
      </span>
      <span className="toast-message">{message}</span>
    </div>
  )
}

function LoadingSkeletonScreen() {
  return (
    <div className="loading-screen loading-shell">
      <div className="skeleton-topbar">
        <span className="skeleton-block icon"></span>
        <span className="skeleton-block brand"></span>
        <span className="skeleton-block search"></span>
        <span className="skeleton-block icon"></span>
      </div>

      <div className="skeleton-hero">
        <span className="skeleton-block eyebrow"></span>
        <span className="skeleton-block title"></span>
        <span className="skeleton-block line"></span>
        <span className="skeleton-block line short"></span>
      </div>

      <div className="skeleton-card-grid">
        <span className="skeleton-card"></span>
        <span className="skeleton-card"></span>
        <span className="skeleton-card"></span>
        <span className="skeleton-card"></span>
      </div>

      <div className="skeleton-panel-grid">
        <span className="skeleton-panel"></span>
        <span className="skeleton-panel"></span>
      </div>
    </div>
  )
}

function Icon({ name }) {
  const paths = {
    alert:
      'M12 5.5 19 18H5l7-12.5Zm0 4.2v3.6m0 2.4h.01',
    bell: 'M12 4a4 4 0 0 1 4 4v1.2c0 .9.3 1.8.9 2.5l.8.9c.7.8.1 2.1-1 2.1H7.3c-1.1 0-1.7-1.3-1-2.1l.8-.9c.6-.7.9-1.6.9-2.5V8a4 4 0 0 1 4-4Zm0 14a2.2 2.2 0 0 0 2.1-1.5H9.9A2.2 2.2 0 0 0 12 18Z',
    briefcase: 'M9 6V4.8A1.8 1.8 0 0 1 10.8 3h2.4A1.8 1.8 0 0 1 15 4.8V6m-11 3h16m-14 9h12A2 2 0 0 0 20 16V8a2 2 0 0 0-2-2H6A2 2 0 0 0 4 8v8a2 2 0 0 0 2 2Z',
    building: 'M5 20V6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5V20M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01M3 20h18',
    calendar:
      'M7 3v2M17 3v2M4 8h16M5.5 5h13A1.5 1.5 0 0 1 20 6.5v10A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5v-10A1.5 1.5 0 0 1 5.5 5Z',
    capsule: 'M8.5 6.5a3.5 3.5 0 0 1 5 0l3 3a3.5 3.5 0 1 1-5 5l-3-3a3.5 3.5 0 0 1 0-5Zm1.2 1.2 4.6 4.6',
    chart: 'M5 18V9M12 18V5M19 18v-7M3 19h18',
    clipboard:
      'M9 4h6a1 1 0 0 1 1 1v1h1.5A1.5 1.5 0 0 1 19 7.5v11A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-11A1.5 1.5 0 0 1 6.5 6H8V5a1 1 0 0 1 1-1Zm0 3h6V6H9v1Z',
    close: 'M6 6 18 18M18 6 6 18',
    clock: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    email: 'M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-11ZM5.5 7l6.5 5L18.5 7',
    file: 'M8 3h6l4 4v12.5A1.5 1.5 0 0 1 16.5 21h-9A1.5 1.5 0 0 1 6 19.5v-15A1.5 1.5 0 0 1 7.5 3H8Zm5 1.5V8h3.5',
    grid: 'M5 5h5v5H5V5Zm9 0h5v5h-5V5ZM5 14h5v5H5v-5Zm9 0h5v5h-5v-5Z',
    lock: 'M8 10V7.8A4 4 0 0 1 12 4a4 4 0 0 1 4 3.8V10m-7.5 0h7A1.5 1.5 0 0 1 17 11.5v6A1.5 1.5 0 0 1 15.5 19h-7A1.5 1.5 0 0 1 7 17.5v-6A1.5 1.5 0 0 1 8.5 10Z',
    patients:
      'M8 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8-1a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 16 11Zm-8 2c-2.8 0-5 1.4-5 3v1h10v-1c0-1.6-2.2-3-5-3Zm8 .5c-1 0-1.9.2-2.7.6.8.7 1.2 1.5 1.2 2.4v.5H20v-.4c0-1.6-1.8-3.1-4-3.1Z',
    moon: 'M19 14.8A7 7 0 1 1 9.2 5 5.8 5.8 0 0 0 19 14.8Z',
    phone:
      'M6.8 4.5h2.1l1.1 3.2-1.3 1.2a13 13 0 0 0 6.3 6.3l1.2-1.3 3.2 1.1v2.1a1.5 1.5 0 0 1-1.7 1.5A16.8 16.8 0 0 1 5.3 6.2 1.5 1.5 0 0 1 6.8 4.5Z',
    pulse: 'M3 13h4l2.2-5.2L13 16l2.4-5H21',
    menu: 'M4 7h16M4 12h16M4 17h16',
    search: 'm19 19-3.5-3.5M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z',
    settings: 'M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Zm7 3.5-.9-.3a7.6 7.6 0 0 0-.4-1l.5-.8a1 1 0 0 0-.1-1.2l-1.1-1.1a1 1 0 0 0-1.2-.1l-.8.5a7.6 7.6 0 0 0-1-.4L14 5a1 1 0 0 0-1-.8h-2a1 1 0 0 0-1 .8l-.3.9a7.6 7.6 0 0 0-1 .4l-.8-.5a1 1 0 0 0-1.2.1L5.6 7a1 1 0 0 0-.1 1.2l.5.8a7.6 7.6 0 0 0-.4 1L4.7 12a1 1 0 0 0-.7 1v2a1 1 0 0 0 .7 1l.9.3c.1.3.2.7.4 1l-.5.8a1 1 0 0 0 .1 1.2l1.1 1.1a1 1 0 0 0 1.2.1l.8-.5c.3.1.7.2 1 .4l.3.9a1 1 0 0 0 1 .7h2a1 1 0 0 0 1-.7l.3-.9c.3-.1.7-.2 1-.4l.8.5a1 1 0 0 0 1.2-.1l1.1-1.1a1 1 0 0 0 .1-1.2l-.5-.8c.1-.3.2-.7.4-1l.9-.3a1 1 0 0 0 .7-1v-2a1 1 0 0 0-.7-1Z',
    shield: 'M12 3 18.5 5.4v5.2c0 4.2-2.7 7.9-6.5 9.4-3.8-1.5-6.5-5.2-6.5-9.4V5.4L12 3Zm-2.1 8.9 1.5 1.5 3.2-3.4',
    stethoscope:
      'M8 4v5a4 4 0 1 0 8 0V4M8 7H6m10 0h2M12 13v3a3 3 0 1 0 6 0v-1.5a1.5 1.5 0 1 0-1.5-1.5',
    sun: 'M12 3v2.2M12 18.8V21M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M3 12h2.2M18.8 12H21M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    user: 'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.2 0-6 1.6-6 3.6V19h12v-1.4c0-2-2.8-3.6-6-3.6Z',
    wallet:
      'M4 7.5A2.5 2.5 0 0 1 6.5 5h10A1.5 1.5 0 0 1 18 6.5V7h1a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a.5.5 0 0 1 .5-.5H18M16 12h3',
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name] || paths.grid} />
    </svg>
  )
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function exportCsv(filename, rows) {
  if (!rows.length) {
    return
  }

  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((header) => `"${String(row[header] ?? '').replaceAll('"', '""')}"`).join(','),
    ),
  ].join('\n')

  downloadTextFile(filename, csv)
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))
}

function formatReportValue(title, value) {
  return title === 'Revenue Report'
    ? formatCurrency(value)
    : Number(value || 0).toLocaleString('en-IN')
}

function formatDateTimeLabel(value) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
}

export default App
