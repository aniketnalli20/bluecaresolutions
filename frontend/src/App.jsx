import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadWorkspaceData, resetWorkspaceData, saveWorkspaceData } from './services/emrStore'
import './App.css'

const DEMO_DISCLAIMER =
  'This software is for demonstration, testing, and development purposes only. It is NOT intended for live clinical, hospital-floor, patient-care, or production use. All records, patient information, reports, schedules, inventory, prescriptions, invoices, and datasets displayed within this application are artificial, fictional, and generated solely for testing purposes.'

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

const appointmentStatuses = ['Scheduled', 'Checked In', 'Completed', 'Cancelled']
const visitTypes = ['Appointment', 'Walk-in', 'Follow-up', 'Therapy Planning']
const genders = ['Female', 'Male', 'Other']
const inventoryActions = ['Stock In', 'Stock Out', 'Stock Adjustment', 'Physical Verification']

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

function createRecordId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function createPatientCode(patients) {
  return `AYU-${String(1000 + patients.length + 1)}`
}

function createInvoiceNumber(invoices) {
  return `INV-AYU-${String(invoices.length + 1).padStart(3, '0')}`
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

function App() {
  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('Dashboard')
  const [theme, setTheme] = useState(() => localStorage.getItem('bluecare-clinic-theme') || 'light')
  const [toast, setToast] = useState(null)
  const [patientQuery, setPatientQuery] = useState('')
  const [patientFilter, setPatientFilter] = useState('All')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [selectedConsultationId, setSelectedConsultationId] = useState('')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('')
  const [backupText, setBackupText] = useState('')
  const [patientForm, setPatientForm] = useState(initialPatientForm)
  const [visitForm, setVisitForm] = useState(initialVisitForm)
  const [consultationForm, setConsultationForm] = useState(initialConsultationForm)
  const [admissionForm, setAdmissionForm] = useState(initialAdmissionForm)
  const [medicineForm, setMedicineForm] = useState(initialMedicineForm)
  const [invoiceForm, setInvoiceForm] = useState(initialInvoiceForm)
  const [inventoryForm, setInventoryForm] = useState(initialInventoryForm)

  useEffect(() => {
    let isCancelled = false

    async function hydrate() {
      const data = await loadWorkspaceData()
      if (isCancelled) {
        return
      }
      setWorkspace(data)
      setSelectedPatientId(data.patients[0]?.id || '')
      setSelectedConsultationId(data.opdConsultations[0]?.id || '')
      setSelectedInvoiceId(data.invoices[0]?.id || '')
      setLoading(false)
    }

    hydrate()

    return () => {
      isCancelled = true
    }
  }, [])

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

  const persistWorkspace = useCallback((nextWorkspace, message, tone = 'success') => {
    const saved = saveWorkspaceData(nextWorkspace)
    setWorkspace(saved)
    setToast({ message, tone })
  }, [])

  const patients = workspace?.patients || []
  const visits = workspace?.visitPlanner || []
  const consultations = workspace?.opdConsultations || []
  const ipdAdmissions = workspace?.ipdAdmissions || []
  const diseaseMaster = workspace?.diseaseMaster || []
  const medicineCatalog = workspace?.medicineCatalog || []
  const packages = workspace?.packages || []
  const suppliers = workspace?.suppliers || []
  const invoices = workspace?.invoices || []
  const notifications = workspace?.notifications || []
  const reports = workspace?.reports || {}
  const dashboard = workspace?.dashboard || {}
  const clinic = workspace?.clinic || {}
  const settings = workspace?.systemSettings || {}

  const patientsById = useMemo(
    () => Object.fromEntries(patients.map((patient) => [patient.id, patient])),
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
  const selectedInvoice = invoices.find((invoice) => invoice.id === selectedInvoiceId) || invoices[0] || null

  const supplierNameById = useMemo(
    () => Object.fromEntries(suppliers.map((supplier) => [supplier.id, supplier.name])),
    [suppliers],
  )

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
      setActiveView('OPD')
    },
    [diseaseMaster],
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
      const queueNo = visits.filter((visit) => visit.appointment_date === visitDate).length + 1
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

      const admission = {
        id: createRecordId('ipd'),
        patient_id: patient.id,
        patient_name: patient.name,
        doctor_name: admissionForm.doctor_name,
        admission_date: admissionForm.admission_date || new Date().toISOString().slice(0, 10),
        bed_allocation: admissionForm.bed_allocation,
        diagnosis: admissionForm.diagnosis,
        daily_treatment_chart: [{ day: 'Day 1', treatment: admissionForm.treatment_notes, progress: admissionForm.daily_progress }],
        panchakarma_schedule: admissionForm.panchakarma_schedule.split('\n').filter(Boolean),
        medicine_administration: admissionForm.medicine_administration.split('\n').filter(Boolean),
        diet_plan: admissionForm.diet_plan,
        daily_progress: admissionForm.daily_progress,
        discharge_summary: admissionForm.discharge_summary,
        final_invoice: Number(admissionForm.final_invoice || 0),
        status: admissionForm.status,
      }

      persistWorkspace({ ...workspace, ipdAdmissions: [admission, ...ipdAdmissions] }, 'IPD admission recorded.')
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
        low_stock_level: Number(medicineForm.low_stock_level || 0),
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
    [medicineCatalog, medicineForm, persistWorkspace, workspace],
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

  const handleBackupGenerate = useCallback(() => {
    setBackupText(JSON.stringify(workspace, null, 2))
    setToast({ message: 'Backup snapshot generated locally.', tone: 'success' })
  }, [workspace])

  const handleBackupRestore = useCallback(() => {
    try {
      const parsed = JSON.parse(backupText)
      const restored = saveWorkspaceData(parsed)
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
    setSelectedInvoiceId(data.invoices[0]?.id || '')
    setToast({ message: 'Clinic workspace reset to Ayurvedic demo data.', tone: 'success' })
  }, [])

  const printCurrentView = useCallback(() => {
    window.print()
  }, [])

  if (loading) {
    return <div className="loading-screen">Preparing BlueCare Ayurvedic Clinic workspace...</div>
  }

  function renderDashboard() {
    return (
      <div className="view-stack">
        <HeroCard
          eyebrow="BlueCare Ayurvedic Clinic"
          title="Single-clinic operations for OPD, IPD, prescriptions, inventory, billing, and follow-up care."
          description={clinic.tagline}
        />
        <ModuleNotice label="Workspace warning" text={DEMO_DISCLAIMER} />
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
            {(dashboard.quickActions || []).map((item) => (
              <button key={item.key} type="button" className="quick-action" onClick={() => setActiveView(item.key)}>
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
          <Panel title="Doctor Calendar" subtitle="Consultation slots and therapy planning readiness.">
            <div className="list-stack">
              {(workspace?.users || []).map((user) => (
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
            <input value={visitForm.doctor_name} onChange={(event) => setVisitForm({ ...visitForm, doctor_name: event.target.value })} placeholder="Doctor name" required />
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
        <ModuleNotice label="Prescription warning" text={DEMO_DISCLAIMER} />
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
                <ModuleNotice label="Demo prescription" text={DEMO_DISCLAIMER} />
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
            <input value={consultationForm.doctor_name} onChange={(event) => setConsultationForm({ ...consultationForm, doctor_name: event.target.value })} placeholder="Doctor name" required />
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
                <div key={admission.id} className="list-card">
                  <div className="list-card-header">
                    <strong>{admission.patient_name}</strong>
                    <StatusPill value={admission.status} />
                  </div>
                  <small>{admission.bed_allocation} | {admission.doctor_name}</small>
                  <p>{admission.diagnosis}</p>
                  <small>{admission.daily_progress}</small>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Admit IPD Patient" subtitle="Create a new indoor management record for Panchakarma and supervised care.">
            <form className="form-grid" onSubmit={handleAdmissionSubmit}>
              <select value={admissionForm.patient_id} onChange={(event) => setAdmissionForm({ ...admissionForm, patient_id: event.target.value })} required>
                <option value="">Patient</option>
                {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
              </select>
              <input value={admissionForm.doctor_name} onChange={(event) => setAdmissionForm({ ...admissionForm, doctor_name: event.target.value })} placeholder="Doctor name" required />
              <input type="date" value={admissionForm.admission_date} onChange={(event) => setAdmissionForm({ ...admissionForm, admission_date: event.target.value })} required />
              <input value={admissionForm.bed_allocation} onChange={(event) => setAdmissionForm({ ...admissionForm, bed_allocation: event.target.value })} placeholder="Bed allocation" required />
              <textarea value={admissionForm.diagnosis} onChange={(event) => setAdmissionForm({ ...admissionForm, diagnosis: event.target.value })} placeholder="Diagnosis" />
              <textarea value={admissionForm.treatment_notes} onChange={(event) => setAdmissionForm({ ...admissionForm, treatment_notes: event.target.value })} placeholder="Daily treatment chart entry" />
              <textarea value={admissionForm.panchakarma_schedule} onChange={(event) => setAdmissionForm({ ...admissionForm, panchakarma_schedule: event.target.value })} placeholder="Panchakarma schedule, one line per entry" />
              <textarea value={admissionForm.medicine_administration} onChange={(event) => setAdmissionForm({ ...admissionForm, medicine_administration: event.target.value })} placeholder="Medicine administration, one line per entry" />
              <textarea value={admissionForm.diet_plan} onChange={(event) => setAdmissionForm({ ...admissionForm, diet_plan: event.target.value })} placeholder="Diet plan" />
              <textarea value={admissionForm.daily_progress} onChange={(event) => setAdmissionForm({ ...admissionForm, daily_progress: event.target.value })} placeholder="Daily progress" />
              <textarea value={admissionForm.discharge_summary} onChange={(event) => setAdmissionForm({ ...admissionForm, discharge_summary: event.target.value })} placeholder="Discharge summary" />
              <input value={admissionForm.final_invoice} onChange={(event) => setAdmissionForm({ ...admissionForm, final_invoice: event.target.value })} placeholder="Final invoice" type="number" min="0" />
              <select value={admissionForm.status} onChange={(event) => setAdmissionForm({ ...admissionForm, status: event.target.value })}>
                <option>Admitted</option>
                <option>Discharged</option>
              </select>
              <button type="submit" className="primary-button">Save Admission</button>
            </form>
          </Panel>
        </div>
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
        <Panel title="Add Medicine" subtitle="Create new demo medicine master entries without backend dependency.">
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
            <input type="number" min="0" value={medicineForm.low_stock_level} onChange={(event) => setMedicineForm({ ...medicineForm, low_stock_level: event.target.value })} placeholder="Low stock threshold" />
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
        <ModuleNotice label="Invoice warning" text={DEMO_DISCLAIMER} />
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
                <ModuleNotice label="Demo billing" text={DEMO_DISCLAIMER} />
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
    return (
      <div className="view-stack">
        <SectionIntro eyebrow="Clinic Admin" title="Simple clinic administration for users, medicine master, disease master, units, inventory settings, reports, system settings, and backup/restore." />
        <ModuleNotice label="Admin warning" text={DEMO_DISCLAIMER} />
        <div className="split-grid">
          <Panel title="User Management" subtitle="Single-clinic staff list without platform hierarchy or enterprise SaaS roles.">
            <SimpleTable
              columns={['Name', 'Role', 'Status', 'Phone', 'Shift']}
              rows={(workspace?.users || []).map((user) => [user.name, user.role, user.status, user.phone, user.shift])}
            />
          </Panel>
          <Panel title="System Settings" subtitle="Local warning thresholds, clinic hours, supported units, backup, and restore.">
            <KeyValue label="Clinic Hours" value={settings.clinic_hours} />
            <KeyValue label="Stock Warning Days" value={settings.near_expiry_days} />
            <KeyValue label="Supported Units" value={(settings.supported_units || []).join(', ')} />
            <KeyValue label="Modules" value="Dashboard, User Management, Medicine Master, Disease Master, Unit Management, Inventory, Supplier Management, Purchase Management, Package Management, Reports, System Settings, Backup and Restore" />
            <div className="action-row">
              <button type="button" className="primary-button" onClick={handleBackupGenerate}>Generate Backup</button>
              <button type="button" className="ghost-button" onClick={handleBackupRestore}>Restore Backup</button>
              <button type="button" className="ghost-button" onClick={handleResetWorkspace}>Reset Demo Data</button>
            </div>
            <textarea value={backupText} onChange={(event) => setBackupText(event.target.value)} placeholder="Backup JSON appears here for restore and testing." />
          </Panel>
        </div>
      </div>
    )
  }

  function renderView() {
    switch (activeView) {
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

  return (
    <div className="app-shell">
      <DisclaimerBar text={DEMO_DISCLAIMER} />
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">BlueCare</p>
          <h1>{clinic.name}</h1>
          <p>{clinic.location} | {clinic.contact}</p>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => (
            <button key={item.key} type="button" className={activeView === item.key ? 'nav-button active' : 'nav-button'} onClick={() => setActiveView(item.key)}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-card">
          <strong>Theme</strong>
          <button type="button" className="ghost-button" onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}>
            Switch to {theme === 'dark' ? 'light' : 'dark'} mode
          </button>
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Ayurvedic Clinic Management System</p>
            <h2>{navItems.find((item) => item.key === activeView)?.label || 'Dashboard'}</h2>
          </div>
          <div className="topbar-meta">
            <InfoPill text={`${patients.length} patients`} />
            <InfoPill text={`${medicineCatalog.length} medicines`} />
            <InfoPill text={`${notifications.length} reminders`} />
          </div>
        </header>
        {renderView()}
      </main>
      {toast ? <div className={`toast ${toast.tone}`}>{toast.message}</div> : null}
    </div>
  )
}

function DisclaimerBar({ text }) {
  return (
    <div className="disclaimer-bar">
      <div className="disclaimer-track">
        <span>{text}</span>
        <span>{text}</span>
      </div>
    </div>
  )
}

function HeroCard({ eyebrow, title, description }) {
  return (
    <section className="hero-card">
      <p className="eyebrow">{eyebrow}</p>
      <h3>{title}</h3>
      <p>{description}</p>
    </section>
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

function ModuleNotice({ label, text }) {
  return (
    <div className="module-notice">
      <strong>{label}</strong>
      <p>{text}</p>
    </div>
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
