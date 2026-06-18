import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL, createResource, fetchEmrData, updateResource } from './services/api'
import './App.css'

const navItems = [
  'Dashboard',
  'Patients',
  'Appointments',
  'Doctors',
  'Consultations',
  'Prescriptions',
  'Billing',
  'Reports',
  'Notifications',
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
  const [emrData, setEmrData] = useState(null)
  const [localIdSeed, setLocalIdSeed] = useState(10000)
  const [statusMessage, setStatusMessage] = useState('Loading EMR workspace...')
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
    async function loadData() {
      const data = await fetchEmrData()
      setEmrData(data)
      setSelectedPatientId(data.patients[0]?.id || null)
      setStatusMessage(
        data.source === 'api'
          ? 'Connected to PHP API.'
          : `Using demo data because the API is unavailable. ${data.error || ''}`.trim(),
      )
    }

    loadData()
  }, [])

  const patients = emrData?.patients ?? emptyList
  const doctors = emrData?.doctors ?? emptyList
  const appointments = emrData?.appointments ?? emptyList
  const consultations = emrData?.consultations ?? emptyList
  const prescriptions = emrData?.prescriptions ?? emptyList
  const invoices = emrData?.invoices ?? emptyList
  const notifications = emrData?.notifications ?? emptyList
  const reports = emrData?.reports ?? emptyObject
  const dashboard = emrData?.dashboard

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
        (patient.allergies && patientFilter === 'Has Allergies') ||
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
        title: `${appointment.status} appointment`,
        detail: `${appointment.reason || 'General visit'} with ${appointment.doctor_name || 'Assigned doctor'}`,
      }))

    const patientConsultations = consultations
      .filter((consultation) => consultation.patient_id === selectedPatient.id)
      .map((consultation) => ({
        id: `consultation-${consultation.id}`,
        date: consultation.consultation_date,
        title: consultation.diagnosis || 'Consultation recorded',
        detail: consultation.treatment_plan || consultation.clinical_notes,
      }))

    return [...patientConsultations, ...patientAppointments].sort((left, right) =>
      String(right.date).localeCompare(String(left.date)),
    )
  }, [appointments, consultations, selectedPatient])

  const doctorSchedule = useMemo(() => {
    return doctors.map((doctor) => ({
      ...doctor,
      assigned_appointments: appointments.filter(
        (appointment) => appointment.doctor_id === doctor.id && appointment.status !== 'Cancelled',
      ).length,
    }))
  }, [appointments, doctors])

  async function saveRecord({
    mode = 'create',
    resourcePath,
    payload,
    onLocalApply,
    successMessage,
  }) {
    try {
      let record

      if (emrData?.source === 'api') {
        record =
          mode === 'create'
            ? await createResource(resourcePath, payload)
            : await updateResource(resourcePath, payload)
      } else {
        record = {
          id: payload.id || localIdSeed,
          ...payload,
        }
        setLocalIdSeed((current) => current + 1)
      }

      onLocalApply(record)
      setStatusMessage(successMessage)
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  async function handlePatientSubmit(event) {
    event.preventDefault()

    const payload = {
      ...patientForm,
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      last_visit_at: patientForm.last_visit_at || '',
    }

    const isEdit = Boolean(selectedPatient?.id && selectedPatient.full_name === patientForm.full_name)

    if (isEdit) {
      await saveRecord({
        mode: 'update',
        resourcePath: `/patients/${selectedPatient.id}`,
        payload: { ...payload, id: selectedPatient.id },
        successMessage: 'Patient details updated.',
        onLocalApply: (record) => {
          setEmrData((current) => ({
            ...current,
            patients: current.patients.map((patient) =>
              patient.id === selectedPatient.id ? { ...patient, ...record } : patient,
            ),
          }))
        },
      })
    } else {
      await saveRecord({
        resourcePath: '/patients',
        payload,
        successMessage: 'New patient added.',
        onLocalApply: (record) => {
          setEmrData((current) => ({
            ...current,
            patients: [
              {
                patient_code:
                  record.patient_code || `PT-${String(current.patients.length + 1001).padStart(4, '0')}`,
                ...record,
              },
              ...current.patients,
            ],
          }))
          setSelectedPatientId(record.id)
        },
      })
    }

    setPatientForm(initialPatientForm)
  }

  async function handleAppointmentSubmit(event) {
    event.preventDefault()

    const selectedPatientRecord = patients.find(
      (patient) => patient.id === Number(appointmentForm.patient_id),
    )
    const selectedDoctorRecord = doctors.find((doctor) => doctor.id === Number(appointmentForm.doctor_id))

    const payload = {
      ...appointmentForm,
      patient_id: Number(appointmentForm.patient_id),
      doctor_id: Number(appointmentForm.doctor_id),
      patient_name: selectedPatientRecord?.full_name || '',
      doctor_name: selectedDoctorRecord?.full_name || '',
    }

    await saveRecord({
      resourcePath: '/appointments',
      payload,
      successMessage: 'Appointment scheduled.',
      onLocalApply: (record) => {
        setEmrData((current) => ({
          ...current,
          appointments: [record, ...current.appointments],
        }))
      },
    })

    setAppointmentForm(initialAppointmentForm)
  }

  async function handleAppointmentStatusChange(appointmentId, status) {
    const existing = appointments.find((appointment) => appointment.id === appointmentId)

    if (!existing) {
      return
    }

    await saveRecord({
      mode: 'update',
      resourcePath: `/appointments/${appointmentId}`,
      payload: { ...existing, status },
      successMessage: `Appointment marked as ${status}.`,
      onLocalApply: (record) => {
        setEmrData((current) => ({
          ...current,
          appointments: current.appointments.map((appointment) =>
            appointment.id === appointmentId ? { ...appointment, ...record, status } : appointment,
          ),
        }))
      },
    })
  }

  async function handleDoctorSubmit(event) {
    event.preventDefault()

    await saveRecord({
      resourcePath: '/doctors',
      payload: doctorForm,
      successMessage: 'Doctor profile created.',
      onLocalApply: (record) => {
        setEmrData((current) => ({
          ...current,
          doctors: [record, ...current.doctors],
        }))
      },
    })

    setDoctorForm(initialDoctorForm)
  }

  async function handleConsultationSubmit(event) {
    event.preventDefault()

    const patient = patients.find((record) => record.id === Number(consultationForm.patient_id))
    const doctor = doctors.find((record) => record.id === Number(consultationForm.doctor_id))

    const payload = {
      ...consultationForm,
      appointment_id: Number(consultationForm.appointment_id),
      patient_id: Number(consultationForm.patient_id),
      doctor_id: Number(consultationForm.doctor_id),
      patient_name: patient?.full_name || '',
      doctor_name: doctor?.full_name || '',
    }

    await saveRecord({
      resourcePath: '/consultations',
      payload,
      successMessage: 'Consultation record created.',
      onLocalApply: (record) => {
        setEmrData((current) => ({
          ...current,
          consultations: [record, ...current.consultations],
        }))
      },
    })

    setConsultationForm(initialConsultationForm)
  }

  async function handlePrescriptionSubmit(event) {
    event.preventDefault()

    const medicines = prescriptionForm.medicines_text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name = '', dosage = '', instructions = ''] = line.split('|').map((part) => part.trim())

        return { name, dosage, instructions }
      })

    const payload = {
      consultation_id: Number(prescriptionForm.consultation_id),
      patient_name: prescriptionForm.patient_name,
      doctor_name: prescriptionForm.doctor_name,
      issued_on: prescriptionForm.issued_on,
      notes: prescriptionForm.notes,
      medicines,
    }

    await saveRecord({
      resourcePath: '/prescriptions',
      payload,
      successMessage: 'Prescription saved.',
      onLocalApply: (record) => {
        setEmrData((current) => ({
          ...current,
          prescriptions: [record, ...current.prescriptions],
        }))
      },
    })

    setPrescriptionForm(initialPrescriptionForm)
  }

  async function handleInvoiceSubmit(event) {
    event.preventDefault()

    const consultationCharge = Number(invoiceForm.consultation_charge || 0)
    const additionalServices = Number(invoiceForm.additional_services || 0)
    const paidAmount = Number(invoiceForm.paid_amount || 0)

    const payload = {
      patient_name: invoiceForm.patient_name,
      consultation_charge: consultationCharge,
      additional_services: additionalServices,
      total_amount: consultationCharge + additionalServices,
      paid_amount: paidAmount,
      payment_status: invoiceForm.payment_status,
    }

    await saveRecord({
      resourcePath: '/billing/invoices',
      payload,
      successMessage: 'Invoice generated.',
      onLocalApply: (record) => {
        setEmrData((current) => ({
          ...current,
          invoices: [record, ...current.invoices],
        }))
      },
    })

    setInvoiceForm(initialInvoiceForm)
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
    setStatusMessage(`Loaded ${patient.full_name} into the patient form.`)
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
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((header) => `"${String(row[header] ?? '').replaceAll('"', '""')}"`)
          .join(','),
      ),
    ].join('\n')

    downloadTextFile(filename, csvContent)
  }

  if (!emrData) {
    return <div className="loading-screen">Loading BlueCare EMR...</div>
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">BlueCare Solutions</p>
          <h1>EMR Suite</h1>
          <p className="sidebar-copy">
            React frontend with PHP 8 and MySQL-ready REST modules for clinic operations.
          </p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              className={activeView === item ? 'nav-button active' : 'nav-button'}
              onClick={() => setActiveView(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-status">
          <p className="eyebrow">Connection</p>
          <p>{statusMessage}</p>
          <small>API base: {API_BASE_URL}</small>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Clinical operations</p>
            <h2>{activeView}</h2>
          </div>
          <div className="pill-row">
            <span className="pill">{emrData.source === 'api' ? 'Live API' : 'Demo mode'}</span>
            <span className="pill">REST JSON</span>
            <span className="pill">PHP 8 / MySQL</span>
          </div>
        </header>

        {activeView === 'Dashboard' && (
          <section className="content-grid">
            <div className="stat-grid">
              <StatCard label="Total Patients" value={dashboard?.totalPatients || patients.length} />
              <StatCard
                label="Today's Appointments"
                value={dashboard?.todaysAppointments || appointments.length}
              />
              <StatCard label="Active Doctors" value={dashboard?.activeDoctors || doctors.length} />
              <StatCard
                label="Monthly Revenue"
                value={formatCurrency(dashboard?.monthlyRevenue || 0)}
              />
            </div>

            <Panel title="Upcoming Appointments" subtitle="Calendar-ready schedule overview">
              <DataTable
                columns={['Patient', 'Doctor', 'Date', 'Status']}
                rows={(dashboard?.upcomingAppointments || []).map((appointment) => [
                  appointment.patient_name,
                  appointment.doctor_name,
                  `${appointment.appointment_date} ${appointment.appointment_time}`,
                  appointment.status,
                ])}
              />
            </Panel>

            <Panel title="Recent Patient Activity" subtitle="Latest profile and visit changes">
              <div className="timeline-list">
                {(dashboard?.recentPatients || []).map((patient) => (
                  <article key={patient.id} className="timeline-item">
                    <strong>{patient.full_name}</strong>
                    <p>{patient.activity}</p>
                    <small>{patient.updated_at}</small>
                  </article>
                ))}
              </div>
            </Panel>
          </section>
        )}

        {activeView === 'Patients' && (
          <section className="content-grid">
            <Panel title="Patient Management" subtitle="Add, edit, search, and review full profiles">
              <div className="toolbar">
                <input
                  value={patientSearch}
                  onChange={(event) => setPatientSearch(event.target.value)}
                  placeholder="Search by name, code, or phone"
                />
                <select value={patientFilter} onChange={(event) => setPatientFilter(event.target.value)}>
                  <option value="All">All Patients</option>
                  <option value="Has Allergies">Has Allergies</option>
                  <option value="Has Conditions">Has Conditions</option>
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
                      <strong>{patient.full_name}</strong>
                      <span>{patient.patient_code}</span>
                      <span>{patient.conditions || 'No major condition recorded'}</span>
                    </button>
                  ))}
                </div>

                <div className="profile-panel">
                  {selectedPatient && (
                    <>
                      <div className="profile-header">
                        <div>
                          <h3>{selectedPatient.full_name}</h3>
                          <p>
                            {selectedPatient.gender} | DOB: {selectedPatient.date_of_birth} | Blood Group:{' '}
                            {selectedPatient.blood_group || 'N/A'}
                          </p>
                        </div>
                        <button type="button" onClick={() => loadPatientIntoForm(selectedPatient)}>
                          Edit Details
                        </button>
                      </div>

                      <div className="mini-grid">
                        <InfoCard label="Allergies" value={selectedPatient.allergies || 'None recorded'} />
                        <InfoCard
                          label="Conditions"
                          value={selectedPatient.conditions || 'No chronic conditions recorded'}
                        />
                        <InfoCard label="Emergency" value={selectedPatient.emergency_contact || 'Not set'} />
                        <InfoCard label="Last Visit" value={selectedPatient.last_visit_at || 'No visits yet'} />
                      </div>

                      <div className="detail-card">
                        <h4>Medical History</h4>
                        <p>{selectedPatient.medical_history || 'Medical history has not been documented.'}</p>
                      </div>

                      <div className="detail-card">
                        <h4>Visit Timeline</h4>
                        <div className="timeline-list compact">
                          {patientTimeline.map((item) => (
                            <article key={item.id} className="timeline-item">
                              <strong>{item.title}</strong>
                              <p>{item.detail}</p>
                              <small>{item.date}</small>
                            </article>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Panel>

            <Panel title="Add Or Edit Patient" subtitle="Structured demographics and medical record entry">
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
                  Save Patient
                </button>
              </form>
            </Panel>
          </section>
        )}

        {activeView === 'Appointments' && (
          <section className="content-grid">
            <Panel title="Schedule Appointment" subtitle="Doctor-wise booking with status tracking">
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
                      {doctor.full_name} - {doctor.specialization}
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
                  placeholder="Scheduling notes"
                />
                <button type="submit" className="primary-button">
                  Save Appointment
                </button>
              </form>
            </Panel>

            <Panel title="Calendar And Queue" subtitle="Reschedule, cancel, or progress appointments">
              <div className="appointment-list">
                {appointments.map((appointment) => (
                  <article key={appointment.id} className="appointment-card">
                    <div>
                      <strong>{appointment.patient_name}</strong>
                      <p>
                        {appointment.doctor_name} | {appointment.appointment_date} {appointment.appointment_time}
                      </p>
                      <small>{appointment.reason}</small>
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
            <Panel title="Doctor Profiles" subtitle="Specialization, availability, and assignment overview">
              <div className="card-grid">
                {doctorSchedule.map((doctor) => (
                  <article key={doctor.id} className="info-panel">
                    <h3>{doctor.full_name}</h3>
                    <p>{doctor.specialization}</p>
                    <small>{doctor.availability}</small>
                    <div className="mini-grid narrow">
                      <InfoCard label="Status" value={doctor.status} />
                      <InfoCard label="Appointments" value={doctor.assigned_appointments} />
                    </div>
                    <p>{doctor.consultation_history}</p>
                  </article>
                ))}
              </div>
            </Panel>

            <Panel title="Add Doctor" subtitle="Maintain roster and schedule visibility">
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
                  placeholder="Availability schedule"
                />
                <textarea
                  className="full-span"
                  value={doctorForm.consultation_history}
                  onChange={(event) =>
                    setDoctorForm({ ...doctorForm, consultation_history: event.target.value })
                  }
                  placeholder="Consultation history summary"
                />
                <button type="submit" className="primary-button">
                  Save Doctor
                </button>
              </form>
            </Panel>
          </section>
        )}

        {activeView === 'Consultations' && (
          <section className="content-grid">
            <Panel title="Create Consultation Record" subtitle="Clinical notes, diagnosis, plans, and documents">
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
                      {appointment.patient_name} - {appointment.appointment_date}
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
                  placeholder="Supporting document filename"
                />
                <button type="submit" className="primary-button">
                  Save Consultation
                </button>
              </form>
            </Panel>

            <Panel title="Previous Visit History" subtitle="Chronological consultation review">
              <div className="timeline-list">
                {consultations.map((consultation) => (
                  <article key={consultation.id} className="timeline-item">
                    <strong>
                      {consultation.patient_name} with {consultation.doctor_name}
                    </strong>
                    <p>{consultation.diagnosis}</p>
                    <small>
                      {consultation.consultation_date} | {consultation.supporting_document || 'No file attached'}
                    </small>
                  </article>
                ))}
              </div>
            </Panel>
          </section>
        )}

        {activeView === 'Prescriptions' && (
          <section className="content-grid">
            <Panel title="Prescription Management" subtitle="Add medicines, instructions, and exports">
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
                      {consultation.patient_name} - {consultation.consultation_date}
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
                  Save Prescription
                </button>
              </form>
            </Panel>

            <Panel title="Issued Prescriptions" subtitle="Downloadable medication summaries">
              <div className="card-grid">
                {prescriptions.map((prescription) => (
                  <article key={prescription.id} className="info-panel">
                    <h3>{prescription.patient_name}</h3>
                    <p>{prescription.doctor_name}</p>
                    <small>{prescription.issued_on}</small>
                    <ul className="plain-list">
                      {prescription.medicines.map((medicine, index) => (
                        <li key={`${prescription.id}-${index}`}>
                          {medicine.name} - {medicine.dosage} - {medicine.instructions}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
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
                      Download Prescription
                    </button>
                  </article>
                ))}
              </div>
            </Panel>
          </section>
        )}

        {activeView === 'Billing' && (
          <section className="content-grid">
            <Panel title="Generate Invoice" subtitle="Consultation charges, services, payments, and receipts">
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
                  Save Invoice
                </button>
              </form>
            </Panel>

            <Panel title="Revenue Summary" subtitle="Payment tracking and receipt generation">
              <div className="stat-grid">
                <StatCard
                  label="Total Invoiced"
                  value={formatCurrency(
                    invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0),
                  )}
                />
                <StatCard
                  label="Collected"
                  value={formatCurrency(
                    invoices.reduce((sum, invoice) => sum + Number(invoice.paid_amount || 0), 0),
                  )}
                />
                <StatCard
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
                    <div>
                      <strong>
                        {invoice.invoice_number || `INV-${invoice.id}`} - {invoice.patient_name}
                      </strong>
                      <p>
                        Total {formatCurrency(invoice.total_amount)} | Paid{' '}
                        {formatCurrency(invoice.paid_amount)}
                      </p>
                      <small>Status: {invoice.payment_status}</small>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        downloadTextFile(
                          `receipt-${invoice.id}.txt`,
                          [
                            `Receipt for ${invoice.patient_name}`,
                            `Invoice: ${invoice.invoice_number || `INV-${invoice.id}`}`,
                            `Consultation: ${formatCurrency(invoice.consultation_charge || 0)}`,
                            `Additional Services: ${formatCurrency(invoice.additional_services || 0)}`,
                            `Total: ${formatCurrency(invoice.total_amount || 0)}`,
                            `Paid: ${formatCurrency(invoice.paid_amount || 0)}`,
                            `Status: ${invoice.payment_status}`,
                          ].join('\n'),
                        )
                      }
                    >
                      Generate Receipt
                    </button>
                  </article>
                ))}
              </div>
            </Panel>
          </section>
        )}

        {activeView === 'Reports' && (
          <section className="content-grid">
            <Panel title="Operational Reports" subtitle="Patient, appointment, revenue, and doctor analytics">
              <div className="card-grid">
                <ReportCard
                  title="Patient Report"
                  items={reports.patientReport || []}
                  onExport={() => exportCsv('patient-report.csv', reports.patientReport || [])}
                />
                <ReportCard
                  title="Appointment Report"
                  items={reports.appointmentReport || []}
                  onExport={() => exportCsv('appointment-report.csv', reports.appointmentReport || [])}
                />
                <ReportCard
                  title="Revenue Report"
                  items={reports.revenueReport || []}
                  onExport={() => exportCsv('revenue-report.csv', reports.revenueReport || [])}
                />
                <ReportCard
                  title="Doctor Activity"
                  items={reports.doctorActivityReport || []}
                  onExport={() => exportCsv('doctor-activity-report.csv', reports.doctorActivityReport || [])}
                />
              </div>
            </Panel>
          </section>
        )}

        {activeView === 'Notifications' && (
          <section className="content-grid">
            <Panel title="Basic Notifications" subtitle="Upcoming appointments, reminders, and billing alerts">
              <div className="timeline-list">
                {notifications.map((notification) => (
                  <article key={notification.id} className="timeline-item">
                    <strong>{notification.title}</strong>
                    <p>{notification.message}</p>
                    <small>{notification.type}</small>
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

function StatCard({ label, value }) {
  return (
    <article className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  )
}

function InfoCard({ label, value }) {
  return (
    <article className="info-card">
      <small>{label}</small>
      <strong>{value}</strong>
    </article>
  )
}

function Panel({ title, subtitle, children }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
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

function ReportCard({ title, items, onExport }) {
  return (
    <article className="info-panel">
      <h3>{title}</h3>
      <ul className="plain-list">
        {items.map((item) => (
          <li key={item.label}>
            {item.label}: {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
          </li>
        ))}
      </ul>
      <button type="button" onClick={onExport}>
        Export CSV
      </button>
    </article>
  )
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))
}

export default App
