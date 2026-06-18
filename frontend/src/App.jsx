import { useEffect, useMemo, useState } from 'react'
import {
  createRecord,
  loadWorkspaceData,
  resetWorkspaceData,
  updateRecord,
} from './services/emrStore'
import './App.css'

const navItems = [
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
  const [workspace, setWorkspace] = useState(null)
  const [statusMessage, setStatusMessage] = useState('Preparing your care workspace...')
  const [patientSearch, setPatientSearch] = useState('')
  const [patientFilter, setPatientFilter] = useState('All')
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [patientForm, setPatientForm] = useState(initialPatientForm)
  const [appointmentForm, setAppointmentForm] = useState(initialAppointmentForm)
  const [doctorForm, setDoctorForm] = useState(initialDoctorForm)
  const [consultationForm, setConsultationForm] = useState(initialConsultationForm)
  const [prescriptionForm, setPrescriptionForm] = useState(initialPrescriptionForm)
  const [invoiceForm, setInvoiceForm] = useState(initialInvoiceForm)

  useEffect(() => {
    async function loadWorkspace() {
      const data = await loadWorkspaceData()
      setWorkspace(data)
      setSelectedPatientId(data.patients[0]?.id || null)
      setStatusMessage('Everything is ready. Your updates stay saved on this device.')
    }

    loadWorkspace()
  }, [])

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

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
          value: `${dashboard.todaysAppointments || 0} planned`,
          caption: 'Keep today moving smoothly',
        },
        {
          label: 'Care team',
          value: `${dashboard.activeDoctors || 0} active`,
          caption: 'Doctors ready for consultations',
        },
        {
          label: 'Collection',
          value: formatCurrency(dashboard.monthlyRevenue || 0),
          caption: 'Strong month-to-date progress',
        },
      ],
    [dashboard],
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
      resetForm?.()
      afterSave?.(result.record)
    } catch {
      setStatusMessage('We could not save that update. Please try again.')
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
  }

  function changeView(view) {
    setActiveView(view)
    setIsMenuOpen(false)
  }

  if (!workspace) {
    return <div className="loading-screen">Preparing BlueCare EMR...</div>
  }

  return (
    <div className="app-shell">
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
          <div>
            <p className="eyebrow">EMR Suite </p>
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
          <button type="button" className="ghost-button light" onClick={handleResetWorkspace}>
            Refresh Starter Records
          </button>
        </div>
      </aside>

      <main className="workspace">
        <header className="mobile-topbar">
          <button
            type="button"
            className={isMenuOpen ? 'menu-toggle active' : 'menu-toggle'}
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
          <div className="mobile-brand">
            <span className="mobile-brand-mark">
              <Icon name="pulse" />
            </span>
            <div>
              <small>BlueCare Solutions</small>
              <strong>{activeView}</strong>
            </div>
          </div>
        </header>

        <header className="hero-banner">
          <div className="hero-copy">
            <p className="eyebrow">Care Overview</p>
            <h2>Everything you need for the day is in one place.</h2>
            <p>
              Review visits, update records, prepare prescriptions, and keep billing on track
              without leaving the workspace.
            </p>
            <div className="hero-actions">
              <button type="button" className="primary-button" onClick={() => setActiveView('Appointments')}>
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
                <strong>{item.value}</strong>
                <span>{item.caption}</span>
              </article>
            ))}
          </div>
        </header>

        <section className="top-strip">
          <StatCard icon="patients" label="Patients" value={dashboard.totalPatients || patients.length} />
          <StatCard
            icon="calendar"
            label="Today&apos;s Visits"
            value={dashboard.todaysAppointments || 0}
          />
          <StatCard icon="stethoscope" label="Active Doctors" value={dashboard.activeDoctors || 0} />
          <StatCard
            icon="wallet"
            label="Monthly Revenue"
            value={formatCurrency(dashboard.monthlyRevenue || 0)}
          />
        </section>

        {activeView === 'Dashboard' && (
          <section className="content-grid">
            <Panel
              title="Upcoming Appointments"
              subtitle="The next few visits at a glance"
              actionLabel="Open schedule"
              onAction={() => changeView('Appointments')}
            >
              <DataTable
                columns={['Patient', 'Doctor', 'Date', 'Status']}
                rows={(dashboard.upcomingAppointments || []).map((appointment) => [
                  appointment.patient_name,
                  appointment.doctor_name,
                  `${appointment.appointment_date} ${appointment.appointment_time}`,
                  appointment.status,
                ])}
              />
            </Panel>

            <div className="dual-grid">
              <Panel title="Recent Patient Activity" subtitle="Fresh changes across the clinic">
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
                    <EmptyState title="No patient selected" text="Choose a patient to review the full profile." />
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
                      onClick={() =>
                        downloadTextFile(
                          `prescription-${prescription.id}.txt`,
                          [
                            `Patient: ${prescription.patient_name}`,
                            `Doctor: ${prescription.doctor_name}`,
                            `Issued On: ${prescription.issued_on}`,
                            '',
                            ...prescription.medicines.map(
                              (medicine) =>
                                `${medicine.name} | ${medicine.dosage} | ${medicine.instructions}`,
                            ),
                            '',
                            `Notes: ${prescription.notes || ''}`,
                          ].join('\n'),
                        )
                      }
                    >
                      Download summary
                    </button>
                  </article>
                ))}
              </div>
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
                      onClick={() =>
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
                      }
                    >
                      Download receipt
                    </button>
                  </article>
                ))}
              </div>
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
                  onExport={() => exportCsv('patient-report.csv', reports.patientReport || [])}
                />
                <ReportCard
                  title="Appointment Report"
                  icon="calendar"
                  items={reports.appointmentReport || []}
                  onExport={() => exportCsv('appointment-report.csv', reports.appointmentReport || [])}
                />
                <ReportCard
                  title="Revenue Report"
                  icon="wallet"
                  items={reports.revenueReport || []}
                  onExport={() => exportCsv('revenue-report.csv', reports.revenueReport || [])}
                />
                <ReportCard
                  title="Doctor Activity"
                  icon="stethoscope"
                  items={reports.doctorActivityReport || []}
                  onExport={() => exportCsv('doctor-activity-report.csv', reports.doctorActivityReport || [])}
                />
              </div>
            </Panel>
          </section>
        )}

        {activeView === 'Notifications' && (
          <section className="content-grid">
            <Panel title="Notifications" subtitle="Stay ahead of visits, follow-ups, and pending balances">
              <div className="timeline-list">
                {notifications.map((notification) => (
                  <article key={notification.id} className="timeline-item">
                    <div className="timeline-icon">
                      <Icon name={notification.type === 'billing' ? 'wallet' : notification.type === 'follow-up' ? 'clipboard' : 'bell'} />
                    </div>
                    <div>
                      <strong>{notification.title}</strong>
                      <p>{notification.message}</p>
                      <small>{notification.type}</small>
                    </div>
                  </article>
                ))}
              </div>
            </Panel>
          </section>
        )}
      </main>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <span className="panel-icon">
          <Icon name={icon} />
        </span>
        <p>{label}</p>
      </div>
      <strong>{value}</strong>
    </article>
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

function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <span className="panel-icon">
        <Icon name="grid" />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

function SummaryTile({ icon, label, value }) {
  return (
    <article className="summary-tile">
      <span className="summary-tile-icon">
        <Icon name={icon} />
      </span>
      <small>{label}</small>
      <strong>{value}</strong>
    </article>
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
      <button type="button" className="ghost-button" onClick={onExport}>
        Export CSV
      </button>
    </article>
  )
}

function Icon({ name }) {
  const paths = {
    alert:
      'M12 5.5 19 18H5l7-12.5Zm0 4.2v3.6m0 2.4h.01',
    bell: 'M12 4a4 4 0 0 1 4 4v1.2c0 .9.3 1.8.9 2.5l.8.9c.7.8.1 2.1-1 2.1H7.3c-1.1 0-1.7-1.3-1-2.1l.8-.9c.6-.7.9-1.6.9-2.5V8a4 4 0 0 1 4-4Zm0 14a2.2 2.2 0 0 0 2.1-1.5H9.9A2.2 2.2 0 0 0 12 18Z',
    calendar:
      'M7 3v2M17 3v2M4 8h16M5.5 5h13A1.5 1.5 0 0 1 20 6.5v10A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5v-10A1.5 1.5 0 0 1 5.5 5Z',
    capsule: 'M8.5 6.5a3.5 3.5 0 0 1 5 0l3 3a3.5 3.5 0 1 1-5 5l-3-3a3.5 3.5 0 0 1 0-5Zm1.2 1.2 4.6 4.6',
    chart: 'M5 18V9M12 18V5M19 18v-7M3 19h18',
    clipboard:
      'M9 4h6a1 1 0 0 1 1 1v1h1.5A1.5 1.5 0 0 1 19 7.5v11A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-11A1.5 1.5 0 0 1 6.5 6H8V5a1 1 0 0 1 1-1Zm0 3h6V6H9v1Z',
    close: 'M6 6 18 18M18 6 6 18',
    grid: 'M5 5h5v5H5V5Zm9 0h5v5h-5V5ZM5 14h5v5H5v-5Zm9 0h5v5h-5v-5Z',
    patients:
      'M8 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8-1a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 16 11Zm-8 2c-2.8 0-5 1.4-5 3v1h10v-1c0-1.6-2.2-3-5-3Zm8 .5c-1 0-1.9.2-2.7.6.8.7 1.2 1.5 1.2 2.4v.5H20v-.4c0-1.6-1.8-3.1-4-3.1Z',
    phone:
      'M6.8 4.5h2.1l1.1 3.2-1.3 1.2a13 13 0 0 0 6.3 6.3l1.2-1.3 3.2 1.1v2.1a1.5 1.5 0 0 1-1.7 1.5A16.8 16.8 0 0 1 5.3 6.2 1.5 1.5 0 0 1 6.8 4.5Z',
    pulse: 'M3 13h4l2.2-5.2L13 16l2.4-5H21',
    menu: 'M4 7h16M4 12h16M4 17h16',
    search: 'm19 19-3.5-3.5M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z',
    stethoscope:
      'M8 4v5a4 4 0 1 0 8 0V4M8 7H6m10 0h2M12 13v3a3 3 0 1 0 6 0v-1.5a1.5 1.5 0 1 0-1.5-1.5',
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

export default App
