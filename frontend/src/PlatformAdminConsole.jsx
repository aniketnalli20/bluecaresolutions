import { useCallback, useEffect, useMemo, useState } from 'react'
import './PlatformAdminConsole.css'

const platformAdminStorageKey = 'bluecare-platform-admin-console'

const featureKeys = [
  'Patients',
  'Doctors',
  'Appointments',
  'Billing',
  'Inventory',
  'Pharmacy',
  'Laboratory',
  'Reports',
  'EMR',
  'Telemedicine',
]

const organizationFeatureKeys = [
  'Patients',
  'Appointments',
  'Doctors',
  'Billing',
  'Inventory',
  'Pharmacy',
  'Laboratory',
  'Reports',
  'EMR',
]

const adminSections = [
  { key: 'organizations', label: 'Organizations' },
  { key: 'subscriptions', label: 'Subscriptions' },
  { key: 'plans', label: 'Plans' },
  { key: 'contracts', label: 'Contracts' },
  { key: 'medicines', label: 'Medicines' },
  { key: 'imports', label: 'Bulk Import' },
  { key: 'stock', label: 'Stock' },
  { key: 'batches', label: 'Batches' },
  { key: 'expiry', label: 'Expiry' },
  { key: 'suppliers', label: 'Suppliers' },
  { key: 'purchases', label: 'Purchases' },
  { key: 'prescriptions', label: 'Prescriptions' },
  { key: 'dispensing', label: 'Dispensing' },
  { key: 'features', label: 'Feature Controls' },
  { key: 'users', label: 'Users' },
  { key: 'audit', label: 'Audit Logs' },
  { key: 'settings', label: 'Settings' },
]

const baseOrganizationFeatures = {
  Patients: true,
  Appointments: true,
  Doctors: true,
  Billing: true,
  Inventory: true,
  Pharmacy: true,
  Laboratory: false,
  Reports: true,
  EMR: true,
}

const basePlanFeatures = {
  Patients: true,
  Doctors: true,
  Appointments: true,
  Billing: true,
  Inventory: true,
  Pharmacy: false,
  Laboratory: false,
  Reports: true,
  EMR: true,
  Telemedicine: false,
}

const initialOrganizationForm = {
  id: '',
  organizationName: '',
  organizationCode: '',
  contactPerson: '',
  email: '',
  phone: '',
  subscriptionPlan: '',
  contractStatus: 'Active',
  activeUsers: '',
  status: 'Active',
}

const initialSubscriptionForm = {
  id: '',
  organizationId: '',
  plan: '',
  userLimit: '',
  storageLimit: '',
  monthlyPrice: '',
  renewalDate: '',
  status: 'Active',
}

const initialPlanForm = {
  id: '',
  planName: '',
  monthlyPrice: '',
  annualPrice: '',
  userLimit: '',
  storageLimit: '',
  clinicLimit: '',
  features: { ...basePlanFeatures },
}

const initialContractForm = {
  id: '',
  organizationId: '',
  contractNumber: '',
  startDate: '',
  endDate: '',
  contractValue: '',
  status: 'Active',
  uploadName: '',
}

const initialMedicineForm = {
  id: '',
  medicineName: '',
  genericName: '',
  brandName: '',
  category: '',
  dosageForm: '',
  strength: '',
  unit: '',
  manufacturer: '',
  supplierId: '',
  purchasePrice: '',
  sellingPrice: '',
  reorderLevel: '',
  minimumStockLevel: '',
  storageLocation: '',
  barcode: '',
  qrCode: '',
  archived: false,
}

const initialBatchForm = {
  id: '',
  medicineId: '',
  batchNumber: '',
  manufacturingDate: '',
  expiryDate: '',
  purchaseCost: '',
  quantityReceived: '',
  quantityAvailable: '',
}

const initialSupplierForm = {
  id: '',
  supplierName: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
}

const initialPurchaseForm = {
  id: '',
  purchaseOrderNumber: '',
  supplierId: '',
  purchaseDate: '',
  totalAmount: '',
  status: 'Draft',
  itemsText: '',
}

const initialUserForm = {
  id: '',
  name: '',
  email: '',
  role: '',
  status: 'Active',
}

const initialPrescriptionForm = {
  id: '',
  patientName: '',
  doctorName: '',
  medicineId: '',
  dosage: '',
  frequency: '',
  duration: '',
  quantity: '',
  route: '',
  instructions: '',
}

const initialDispenseForm = {
  prescriptionId: '',
  quantity: '',
  action: 'Dispense Medicine',
}

const initialStockActionForm = {
  medicineId: '',
  action: 'Add Stock',
  quantity: '',
  batchNumber: '',
  expiryDate: '',
  note: '',
}

const defaultPlatformAdminState = {
  organizations: [
    {
      id: 'org-1',
      organizationName: 'Aarogya Clinic',
      organizationCode: 'ORG-001',
      contactPerson: 'Neha Verma',
      email: 'ops@aarogya.health',
      phone: '+91 9876500011',
      subscriptionPlan: 'Enterprise',
      contractStatus: 'Active',
      activeUsers: 42,
      status: 'Active',
      featureToggles: { ...baseOrganizationFeatures },
      settingsResetAt: '',
    },
    {
      id: 'org-2',
      organizationName: 'Blue River Hospital',
      organizationCode: 'ORG-002',
      contactPerson: 'Rahul Mehta',
      email: 'admin@blueriver.health',
      phone: '+91 9876500022',
      subscriptionPlan: 'Growth',
      contractStatus: 'Renewal Due',
      activeUsers: 26,
      status: 'Suspended',
      featureToggles: { ...baseOrganizationFeatures, Laboratory: true },
      settingsResetAt: '',
    },
  ],
  subscriptions: [
    {
      id: 'sub-1',
      organizationId: 'org-1',
      plan: 'Enterprise',
      userLimit: 150,
      storageLimit: 500,
      monthlyPrice: 78000,
      renewalDate: '2026-12-31',
      status: 'Active',
    },
    {
      id: 'sub-2',
      organizationId: 'org-2',
      plan: 'Growth',
      userLimit: 75,
      storageLimit: 250,
      monthlyPrice: 42000,
      renewalDate: '2026-08-15',
      status: 'Trial',
    },
  ],
  plans: [
    {
      id: 'plan-1',
      planName: 'Starter',
      monthlyPrice: 12000,
      annualPrice: 120000,
      userLimit: 20,
      storageLimit: 50,
      clinicLimit: 1,
      features: { ...basePlanFeatures, Inventory: false, Pharmacy: false, Laboratory: false },
    },
    {
      id: 'plan-2',
      planName: 'Growth',
      monthlyPrice: 42000,
      annualPrice: 420000,
      userLimit: 75,
      storageLimit: 250,
      clinicLimit: 3,
      features: { ...basePlanFeatures, Pharmacy: true },
    },
    {
      id: 'plan-3',
      planName: 'Enterprise',
      monthlyPrice: 78000,
      annualPrice: 780000,
      userLimit: 150,
      storageLimit: 500,
      clinicLimit: 8,
      features: { ...basePlanFeatures, Pharmacy: true, Laboratory: true, Telemedicine: true },
    },
  ],
  contracts: [
    {
      id: 'contract-1',
      organizationId: 'org-1',
      contractNumber: 'CNT-2026-001',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      contractValue: 936000,
      status: 'Active',
      uploadName: 'aarogya-clinic-master-agreement.pdf',
    },
    {
      id: 'contract-2',
      organizationId: 'org-2',
      contractNumber: 'CNT-2026-002',
      startDate: '2026-02-15',
      endDate: '2026-08-15',
      contractValue: 252000,
      status: 'Expiring',
      uploadName: 'blue-river-hospital-trial-contract.pdf',
    },
  ],
  suppliers: [
    {
      id: 'supplier-1',
      supplierName: 'Medistar Wholesale',
      contactPerson: 'Kiran Shah',
      email: 'orders@medistar.in',
      phone: '+91 9988776600',
      address: 'Plot 18, Pharma Industrial Estate, Ahmedabad',
    },
    {
      id: 'supplier-2',
      supplierName: 'Prime Pharma Trade',
      contactPerson: 'Sonal Jain',
      email: 'supply@primepharma.in',
      phone: '+91 9898987700',
      address: 'Block B, Medical Supply Park, Pune',
    },
  ],
  medicines: [
    {
      id: 'medicine-1',
      medicineName: 'Paracetamol',
      genericName: 'Acetaminophen',
      brandName: 'Pacimol',
      category: 'Analgesic',
      dosageForm: 'Tablet',
      strength: '500mg',
      unit: 'Strip',
      manufacturer: 'Blue Labs',
      supplierId: 'supplier-1',
      purchasePrice: 12,
      sellingPrice: 18,
      reorderLevel: 500,
      minimumStockLevel: 200,
      storageLocation: 'Rack A1',
      barcode: '890123456001',
      qrCode: 'QR-PARA-500',
      archived: false,
    },
    {
      id: 'medicine-2',
      medicineName: 'Amoxicillin',
      genericName: 'Amoxicillin',
      brandName: 'Moxigen',
      category: 'Antibiotic',
      dosageForm: 'Capsule',
      strength: '250mg',
      unit: 'Strip',
      manufacturer: 'Healgenix',
      supplierId: 'supplier-2',
      purchasePrice: 28,
      sellingPrice: 40,
      reorderLevel: 300,
      minimumStockLevel: 120,
      storageLocation: 'Rack B2',
      barcode: '890123456002',
      qrCode: 'QR-AMOX-250',
      archived: false,
    },
    {
      id: 'medicine-3',
      medicineName: 'Azithromycin',
      genericName: 'Azithromycin',
      brandName: 'Azifast',
      category: 'Antibiotic',
      dosageForm: 'Tablet',
      strength: '500mg',
      unit: 'Strip',
      manufacturer: 'Blue Labs',
      supplierId: 'supplier-1',
      purchasePrice: 62,
      sellingPrice: 85,
      reorderLevel: 150,
      minimumStockLevel: 80,
      storageLocation: 'Rack B4',
      barcode: '890123456003',
      qrCode: 'QR-AZI-500',
      archived: false,
    },
  ],
  batches: [
    {
      id: 'batch-1',
      medicineId: 'medicine-1',
      batchNumber: 'PARA-0626-A',
      manufacturingDate: '2026-01-10',
      expiryDate: '2027-01-09',
      purchaseCost: 12,
      quantityReceived: 1500,
      quantityAvailable: 1320,
      history: ['Batch created with 1500 units', 'Adjusted by -180 units after manual reconciliation'],
      archived: false,
      disposed: false,
    },
    {
      id: 'batch-2',
      medicineId: 'medicine-2',
      batchNumber: 'AMOX-0526-B',
      manufacturingDate: '2026-02-15',
      expiryDate: '2026-12-30',
      purchaseCost: 28,
      quantityReceived: 850,
      quantityAvailable: 620,
      history: ['Batch created with 850 units', 'Received into central inventory'],
      archived: false,
      disposed: false,
    },
    {
      id: 'batch-3',
      medicineId: 'medicine-3',
      batchNumber: 'AZI-0426-C',
      manufacturingDate: '2026-03-11',
      expiryDate: '2026-08-05',
      purchaseCost: 62,
      quantityReceived: 400,
      quantityAvailable: 215,
      history: ['Batch created with 400 units'],
      archived: false,
      disposed: false,
    },
  ],
  purchases: [
    {
      id: 'purchase-1',
      purchaseOrderNumber: 'PO-2026-001',
      supplierId: 'supplier-1',
      purchaseDate: '2026-06-02',
      totalAmount: 48000,
      status: 'Received',
      itemsText: 'Paracetamol|500mg|Tablet|1500|12\nAzithromycin|500mg|Tablet|400|62',
    },
  ],
  prescriptions: [],
  dispenses: [],
  users: [
    { id: 'user-1', name: 'Aniket', email: 'admin@bluecare.solutions', role: 'Super Admin', status: 'Active' },
    { id: 'user-2', name: 'Platform Ops', email: 'ops@bluecare.solutions', role: 'Administrator', status: 'Active' },
  ],
  auditLogs: [
    {
      id: 'audit-1',
      user: 'Aniket',
      action: 'Signed into super admin console',
      module: 'Authentication',
      timestamp: '2026-06-19T09:30:00',
      ipAddress: '10.20.10.4',
    },
  ],
  settings: {
    platformName: 'BlueCare Solutions',
    supportEmail: 'support@bluecare.solutions',
    trialDuration: 14,
    defaultUserLimit: 25,
    defaultStorageLimit: 100,
  },
  importSummary: {
    totalImported: 0,
    updatedRecords: 0,
    newMedicines: 0,
    duplicateRecords: 0,
    failedRecords: 0,
    failedLines: [],
  },
}

function readStoredAdminState() {
  try {
    const storedValue = localStorage.getItem(platformAdminStorageKey)
    return storedValue ? JSON.parse(storedValue) : defaultPlatformAdminState
  } catch {
    return defaultPlatformAdminState
  }
}

function createRecordId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function toNumber(value) {
  return Number(value || 0)
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function addDays(dateValue, daysToAdd) {
  const nextDate = new Date(dateValue || Date.now())
  nextDate.setDate(nextDate.getDate() + daysToAdd)
  return nextDate.toISOString().slice(0, 10)
}

function addMonths(dateValue, monthsToAdd) {
  const nextDate = new Date(dateValue || Date.now())
  nextDate.setMonth(nextDate.getMonth() + monthsToAdd)
  return nextDate.toISOString().slice(0, 10)
}

function getDaysUntil(dateValue) {
  const target = new Date(dateValue)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

function getCurrentStock(medicineId, batches) {
  return batches
    .filter((batch) => batch.medicineId === medicineId && !batch.archived && !batch.disposed)
    .reduce((sum, batch) => sum + Number(batch.quantityAvailable || 0), 0)
}

function getReservedQuantity(medicineId, prescriptions) {
  return prescriptions
    .filter(
      (prescription) =>
        prescription.medicineId === medicineId &&
        prescription.status !== 'Cancelled' &&
        prescription.status !== 'Completed',
    )
    .reduce(
      (sum, prescription) =>
        sum + Math.max(0, Number(prescription.quantity || 0) - Number(prescription.dispensedQuantity || 0)),
      0,
    )
}

function getAvailableStock(medicineId, batches, prescriptions) {
  return Math.max(0, getCurrentStock(medicineId, batches) - getReservedQuantity(medicineId, prescriptions))
}

function getActiveBatches(medicineId, batches) {
  return batches.filter((batch) => batch.medicineId === medicineId && !batch.archived && !batch.disposed)
}

function getDispensableBatches(medicineId, batches) {
  return getActiveBatches(medicineId, batches)
    .filter((batch) => getDaysUntil(batch.expiryDate) >= 0 && Number(batch.quantityAvailable || 0) > 0)
    .sort((left, right) => String(left.expiryDate).localeCompare(String(right.expiryDate)))
}

function getExpiryStatus(medicineId, batches) {
  const medicineBatches = getActiveBatches(medicineId, batches)
  if (!medicineBatches.length) {
    return 'No Batch'
  }

  const nearestBatch = [...medicineBatches].sort((left, right) =>
    String(left.expiryDate).localeCompare(String(right.expiryDate)),
  )[0]
  const daysRemaining = getDaysUntil(nearestBatch.expiryDate)

  if (daysRemaining < 0) {
    return 'Expired'
  }
  if (daysRemaining <= 30) {
    return 'Expiring in 30 Days'
  }
  if (daysRemaining <= 60) {
    return 'Expiring in 60 Days'
  }
  if (daysRemaining <= 90) {
    return 'Expiring in 90 Days'
  }
  return 'In Date'
}

function getStockStatus(currentStock, reorderLevel, minimumStockLevel) {
  if (currentStock <= 0) {
    return 'Out of Stock'
  }
  if (currentStock <= minimumStockLevel) {
    return 'Critical'
  }
  if (currentStock <= reorderLevel) {
    return 'Reorder'
  }
  return 'Available'
}

function appendAuditLog(state, action, module) {
  const auditRecord = {
    id: createRecordId('audit'),
    user: 'Aniket',
    action,
    module,
    timestamp: new Date().toISOString(),
    ipAddress: '10.20.10.4',
  }

  return {
    ...state,
    auditLogs: [auditRecord, ...state.auditLogs].slice(0, 300),
  }
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

function PlatformAdminConsole({ onActionFeedback }) {
  const [adminState, setAdminState] = useState(readStoredAdminState)
  const [activeSection, setActiveSection] = useState('organizations')
  const [organizationForm, setOrganizationForm] = useState(initialOrganizationForm)
  const [subscriptionForm, setSubscriptionForm] = useState(initialSubscriptionForm)
  const [planForm, setPlanForm] = useState(initialPlanForm)
  const [contractForm, setContractForm] = useState(initialContractForm)
  const [medicineForm, setMedicineForm] = useState(initialMedicineForm)
  const [batchForm, setBatchForm] = useState(initialBatchForm)
  const [supplierForm, setSupplierForm] = useState(initialSupplierForm)
  const [purchaseForm, setPurchaseForm] = useState(initialPurchaseForm)
  const [userForm, setUserForm] = useState(initialUserForm)
  const [prescriptionForm, setPrescriptionForm] = useState(initialPrescriptionForm)
  const [dispenseForm, setDispenseForm] = useState(initialDispenseForm)
  const [stockActionForm, setStockActionForm] = useState(initialStockActionForm)
  const [settingsForm, setSettingsForm] = useState(readStoredAdminState().settings)
  const [bulkImportText, setBulkImportText] = useState('')
  const [organizationQuery, setOrganizationQuery] = useState('')
  const [medicineQuery, setMedicineQuery] = useState('')
  const [prescriptionQuery, setPrescriptionQuery] = useState('')
  const [auditFilters, setAuditFilters] = useState({ user: '', module: '', from: '', to: '' })
  const [expiryView, setExpiryView] = useState('30')
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('')
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [selectedBatchId, setSelectedBatchId] = useState('')

  useEffect(() => {
    localStorage.setItem(platformAdminStorageKey, JSON.stringify(adminState))
  }, [adminState])

  useEffect(() => {
    setSettingsForm(adminState.settings)
  }, [adminState.settings])

  const notify = useCallback(
    (message, tone = 'success', playSound = true) => {
      onActionFeedback?.(message, tone, playSound)
    },
    [onActionFeedback],
  )

  const updateAdminState = useCallback(
    (updater, actionLabel, moduleName, successMessage, options = {}) => {
      setAdminState((current) => appendAuditLog(updater(current), actionLabel, moduleName))
      notify(successMessage, options.tone || 'success', options.playSound ?? true)
    },
    [notify],
  )

  const organizationsById = useMemo(
    () => Object.fromEntries(adminState.organizations.map((organization) => [organization.id, organization])),
    [adminState.organizations],
  )

  const plansByName = useMemo(
    () => Object.fromEntries(adminState.plans.map((plan) => [plan.planName, plan])),
    [adminState.plans],
  )

  const suppliersById = useMemo(
    () => Object.fromEntries(adminState.suppliers.map((supplier) => [supplier.id, supplier])),
    [adminState.suppliers],
  )

  const medicinesById = useMemo(
    () => Object.fromEntries(adminState.medicines.map((medicine) => [medicine.id, medicine])),
    [adminState.medicines],
  )

  const organizationRows = useMemo(
    () =>
      adminState.organizations.filter((organization) =>
        [
          organization.organizationName,
          organization.organizationCode,
          organization.contactPerson,
          organization.email,
          organization.phone,
          organization.subscriptionPlan,
          organization.status,
        ].some((value) => String(value || '').toLowerCase().includes(organizationQuery.toLowerCase())),
      ),
    [adminState.organizations, organizationQuery],
  )

  const medicineRows = useMemo(
    () =>
      adminState.medicines.filter((medicine) =>
        [
          medicine.medicineName,
          medicine.genericName,
          medicine.brandName,
          medicine.category,
          medicine.dosageForm,
          medicine.strength,
        ].some((value) => String(value || '').toLowerCase().includes(medicineQuery.toLowerCase())),
      ),
    [adminState.medicines, medicineQuery],
  )

  const searchablePrescriptionMedicines = useMemo(
    () =>
      adminState.medicines.filter((medicine) =>
        [
          medicine.medicineName,
          medicine.genericName,
          medicine.brandName,
          medicine.dosageForm,
          medicine.strength,
        ].some((value) => String(value || '').toLowerCase().includes(prescriptionQuery.toLowerCase())),
      ),
    [adminState.medicines, prescriptionQuery],
  )

  const filteredAuditLogs = useMemo(
    () =>
      adminState.auditLogs.filter((log) => {
        const matchesUser =
          !auditFilters.user || log.user.toLowerCase().includes(auditFilters.user.toLowerCase())
        const matchesModule =
          !auditFilters.module || log.module.toLowerCase().includes(auditFilters.module.toLowerCase())
        const matchesFrom = !auditFilters.from || log.timestamp.slice(0, 10) >= auditFilters.from
        const matchesTo = !auditFilters.to || log.timestamp.slice(0, 10) <= auditFilters.to
        return matchesUser && matchesModule && matchesFrom && matchesTo
      }),
    [adminState.auditLogs, auditFilters.from, auditFilters.module, auditFilters.to, auditFilters.user],
  )

  const filteredExpiryBatches = useMemo(
    () =>
      adminState.batches.filter((batch) => {
        if (batch.archived || batch.disposed) {
          return false
        }
        const daysUntil = getDaysUntil(batch.expiryDate)
        if (expiryView === 'expired') {
          return daysUntil < 0
        }
        return daysUntil >= 0 && daysUntil <= Number(expiryView)
      }),
    [adminState.batches, expiryView],
  )

  const selectedOrganization = adminState.organizations.find(
    (organization) => organization.id === selectedOrganizationId,
  )
  const selectedSupplier = adminState.suppliers.find((supplier) => supplier.id === selectedSupplierId)
  const selectedBatch = adminState.batches.find((batch) => batch.id === selectedBatchId)

  function getPlanDefaults(planName) {
    const selectedPlan = plansByName[planName]
    if (!selectedPlan) {
      return { userLimit: '', storageLimit: '', monthlyPrice: '' }
    }
    return {
      userLimit: selectedPlan.userLimit,
      storageLimit: selectedPlan.storageLimit,
      monthlyPrice: selectedPlan.monthlyPrice,
    }
  }

  function resetOrganizationForm() {
    setOrganizationForm(initialOrganizationForm)
  }

  function resetSubscriptionForm() {
    setSubscriptionForm(initialSubscriptionForm)
  }

  function resetPlanForm() {
    setPlanForm(initialPlanForm)
  }

  function resetContractForm() {
    setContractForm(initialContractForm)
  }

  function resetMedicineForm() {
    setMedicineForm(initialMedicineForm)
  }

  function resetBatchForm() {
    setBatchForm(initialBatchForm)
  }

  function resetSupplierForm() {
    setSupplierForm(initialSupplierForm)
  }

  function resetPurchaseForm() {
    setPurchaseForm(initialPurchaseForm)
  }

  function resetUserForm() {
    setUserForm(initialUserForm)
  }

  function resetPrescriptionForm() {
    setPrescriptionForm(initialPrescriptionForm)
  }

  function resetStockActionForm() {
    setStockActionForm(initialStockActionForm)
  }

  function editRow(setter, values, sectionKey) {
    setter(values)
    setActiveSection(sectionKey)
  }

  function handleOrganizationSubmit(event) {
    event.preventDefault()
    const existingRecord = adminState.organizations.find((organization) => organization.id === organizationForm.id)
    const payload = {
      ...organizationForm,
      id: organizationForm.id || createRecordId('org'),
      activeUsers: toNumber(organizationForm.activeUsers),
      featureToggles: existingRecord?.featureToggles || { ...baseOrganizationFeatures },
      settingsResetAt: existingRecord?.settingsResetAt || '',
    }

    updateAdminState(
      (current) => ({
        ...current,
        organizations: organizationForm.id
          ? current.organizations.map((organization) =>
              organization.id === organizationForm.id ? payload : organization,
            )
          : [payload, ...current.organizations],
      }),
      organizationForm.id ? 'Edited organization' : 'Created organization',
      'Organizations',
      organizationForm.id ? 'Organization updated.' : 'Organization created.',
    )
    setSelectedOrganizationId(payload.id)
    resetOrganizationForm()
  }

  function handleSubscriptionSubmit(event) {
    event.preventDefault()
    const payload = {
      ...subscriptionForm,
      id: subscriptionForm.id || createRecordId('sub'),
      userLimit: toNumber(subscriptionForm.userLimit),
      storageLimit: toNumber(subscriptionForm.storageLimit),
      monthlyPrice: toNumber(subscriptionForm.monthlyPrice),
    }

    updateAdminState(
      (current) => ({
        ...current,
        subscriptions: subscriptionForm.id
          ? current.subscriptions.map((subscription) =>
              subscription.id === subscriptionForm.id ? payload : subscription,
            )
          : [payload, ...current.subscriptions],
        organizations: current.organizations.map((organization) =>
          organization.id === payload.organizationId
            ? { ...organization, subscriptionPlan: payload.plan }
            : organization,
        ),
      }),
      subscriptionForm.id ? 'Edited subscription' : 'Created subscription',
      'Subscriptions',
      subscriptionForm.id ? 'Subscription updated.' : 'Subscription created.',
    )
    resetSubscriptionForm()
  }

  function handlePlanSubmit(event) {
    event.preventDefault()
    const payload = {
      ...planForm,
      id: planForm.id || createRecordId('plan'),
      monthlyPrice: toNumber(planForm.monthlyPrice),
      annualPrice: toNumber(planForm.annualPrice),
      userLimit: toNumber(planForm.userLimit),
      storageLimit: toNumber(planForm.storageLimit),
      clinicLimit: toNumber(planForm.clinicLimit),
    }

    updateAdminState(
      (current) => ({
        ...current,
        plans: planForm.id
          ? current.plans.map((plan) => (plan.id === planForm.id ? payload : plan))
          : [payload, ...current.plans],
      }),
      planForm.id ? 'Edited plan' : 'Created plan',
      'Plans',
      planForm.id ? 'Plan updated.' : 'Plan created.',
    )
    resetPlanForm()
  }

  function handleContractSubmit(event) {
    event.preventDefault()
    const payload = {
      ...contractForm,
      id: contractForm.id || createRecordId('contract'),
      contractValue: toNumber(contractForm.contractValue),
    }

    updateAdminState(
      (current) => ({
        ...current,
        contracts: contractForm.id
          ? current.contracts.map((contract) => (contract.id === contractForm.id ? payload : contract))
          : [payload, ...current.contracts],
      }),
      contractForm.id ? 'Edited contract' : 'Created contract',
      'Contracts',
      contractForm.id ? 'Contract updated.' : 'Contract created.',
    )
    resetContractForm()
  }

  function handleMedicineSubmit(event) {
    event.preventDefault()
    const payload = {
      ...medicineForm,
      id: medicineForm.id || createRecordId('medicine'),
      purchasePrice: toNumber(medicineForm.purchasePrice),
      sellingPrice: toNumber(medicineForm.sellingPrice),
      reorderLevel: toNumber(medicineForm.reorderLevel),
      minimumStockLevel: toNumber(medicineForm.minimumStockLevel),
    }

    updateAdminState(
      (current) => ({
        ...current,
        medicines: medicineForm.id
          ? current.medicines.map((medicine) => (medicine.id === medicineForm.id ? payload : medicine))
          : [payload, ...current.medicines],
      }),
      medicineForm.id ? 'Edited medicine' : 'Added medicine',
      'Medicine Master',
      medicineForm.id ? 'Medicine updated.' : 'Medicine added.',
    )
    resetMedicineForm()
  }

  function handleBatchSubmit(event) {
    event.preventDefault()
    const existingRecord = adminState.batches.find((batch) => batch.id === batchForm.id)
    const payload = {
      ...batchForm,
      id: batchForm.id || createRecordId('batch'),
      purchaseCost: toNumber(batchForm.purchaseCost),
      quantityReceived: toNumber(batchForm.quantityReceived),
      quantityAvailable: toNumber(batchForm.quantityAvailable),
      history:
        existingRecord?.history || [`Batch created with ${batchForm.quantityReceived || batchForm.quantityAvailable || 0} units`],
      archived: existingRecord?.archived || false,
      disposed: existingRecord?.disposed || false,
    }

    updateAdminState(
      (current) => ({
        ...current,
        batches: batchForm.id
          ? current.batches.map((batch) => (batch.id === batchForm.id ? payload : batch))
          : [payload, ...current.batches],
      }),
      batchForm.id ? 'Edited batch' : 'Added batch',
      'Batch Management',
      batchForm.id ? 'Batch updated.' : 'Batch added.',
    )
    setSelectedBatchId(payload.id)
    resetBatchForm()
  }

  function handleSupplierSubmit(event) {
    event.preventDefault()
    const payload = { ...supplierForm, id: supplierForm.id || createRecordId('supplier') }

    updateAdminState(
      (current) => ({
        ...current,
        suppliers: supplierForm.id
          ? current.suppliers.map((supplier) => (supplier.id === supplierForm.id ? payload : supplier))
          : [payload, ...current.suppliers],
      }),
      supplierForm.id ? 'Edited supplier' : 'Added supplier',
      'Suppliers',
      supplierForm.id ? 'Supplier updated.' : 'Supplier added.',
    )
    setSelectedSupplierId(payload.id)
    resetSupplierForm()
  }

  function handlePurchaseSubmit(event) {
    event.preventDefault()
    const payload = {
      ...purchaseForm,
      id: purchaseForm.id || createRecordId('purchase'),
      totalAmount: toNumber(purchaseForm.totalAmount),
    }

    updateAdminState(
      (current) => ({
        ...current,
        purchases: purchaseForm.id
          ? current.purchases.map((purchase) => (purchase.id === purchaseForm.id ? payload : purchase))
          : [payload, ...current.purchases],
      }),
      purchaseForm.id ? 'Edited purchase order' : 'Created purchase order',
      'Purchases',
      purchaseForm.id ? 'Purchase order updated.' : 'Purchase order created.',
    )
    resetPurchaseForm()
  }

  function handleUserSubmit(event) {
    event.preventDefault()
    const payload = { ...userForm, id: userForm.id || createRecordId('user') }

    updateAdminState(
      (current) => ({
        ...current,
        users: userForm.id
          ? current.users.map((user) => (user.id === userForm.id ? payload : user))
          : [payload, ...current.users],
      }),
      userForm.id ? 'Edited user' : 'Created user',
      'User Management',
      userForm.id ? 'User updated.' : 'User created.',
    )
    resetUserForm()
  }

  function handleSettingsSubmit(event) {
    event.preventDefault()
    updateAdminState(
      (current) => ({
        ...current,
        settings: {
          platformName: settingsForm.platformName,
          supportEmail: settingsForm.supportEmail,
          trialDuration: toNumber(settingsForm.trialDuration),
          defaultUserLimit: toNumber(settingsForm.defaultUserLimit),
          defaultStorageLimit: toNumber(settingsForm.defaultStorageLimit),
        },
      }),
      'Updated system settings',
      'System Settings',
      'System settings updated.',
    )
  }

  function handleBulkImport() {
    const lines = bulkImportText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (!lines.length) {
      notify('Enter import records before running the import.', 'error', false)
      return
    }

    const seenKeys = new Set()
    const failedLines = []
    let updatedRecords = 0
    let newMedicines = 0
    let duplicateRecords = 0

    updateAdminState(
      (current) => {
        let nextState = { ...current, medicines: [...current.medicines], batches: [...current.batches] }

        lines.forEach((line) => {
          const [nameStrength, dosageForm, quantityText] = line.split('|').map((part) => part.trim())
          const quantity = toNumber(quantityText)
          const nameParts = String(nameStrength || '').split(' ')
          const strength = nameParts.pop() || ''
          const medicineName = nameParts.join(' ').trim()

          if (!medicineName || !strength || !dosageForm || quantity <= 0) {
            failedLines.push(line)
            return
          }

          const importKey = `${medicineName.toLowerCase()}-${strength.toLowerCase()}-${dosageForm.toLowerCase()}`
          if (seenKeys.has(importKey)) {
            duplicateRecords += 1
            return
          }
          seenKeys.add(importKey)

          const existingMedicine = nextState.medicines.find(
            (medicine) =>
              medicine.medicineName.toLowerCase() === medicineName.toLowerCase() &&
              medicine.strength.toLowerCase() === strength.toLowerCase() &&
              medicine.dosageForm.toLowerCase() === dosageForm.toLowerCase(),
          )

          if (existingMedicine) {
            updatedRecords += 1
            nextState.batches = [
              {
                id: createRecordId('batch'),
                medicineId: existingMedicine.id,
                batchNumber: `IMPORT-${Date.now().toString().slice(-6)}`,
                manufacturingDate: new Date().toISOString().slice(0, 10),
                expiryDate: addMonths(new Date().toISOString().slice(0, 10), 12),
                purchaseCost: existingMedicine.purchasePrice,
                quantityReceived: quantity,
                quantityAvailable: quantity,
                history: [`Bulk import added ${quantity} units`],
                archived: false,
                disposed: false,
              },
              ...nextState.batches,
            ]
            return
          }

          const medicineId = createRecordId('medicine')
          newMedicines += 1
          nextState.medicines = [
            {
              id: medicineId,
              medicineName,
              genericName: medicineName,
              brandName: medicineName,
              category: 'Imported',
              dosageForm,
              strength,
              unit: 'Unit',
              manufacturer: 'Not Set',
              supplierId: '',
              purchasePrice: 0,
              sellingPrice: 0,
              reorderLevel: 100,
              minimumStockLevel: 25,
              storageLocation: 'Import Bay',
              barcode: '',
              qrCode: '',
              archived: false,
            },
            ...nextState.medicines,
          ]
          nextState.batches = [
            {
              id: createRecordId('batch'),
              medicineId,
              batchNumber: `IMPORT-${Date.now().toString().slice(-6)}`,
              manufacturingDate: new Date().toISOString().slice(0, 10),
              expiryDate: addMonths(new Date().toISOString().slice(0, 10), 12),
              purchaseCost: 0,
              quantityReceived: quantity,
              quantityAvailable: quantity,
              history: [`Bulk import created medicine with ${quantity} units`],
              archived: false,
              disposed: false,
            },
            ...nextState.batches,
          ]
        })

        return {
          ...nextState,
          importSummary: {
            totalImported: lines.length,
            updatedRecords,
            newMedicines,
            duplicateRecords,
            failedRecords: failedLines.length,
            failedLines,
          },
        }
      },
      'Ran bulk inventory import',
      'Bulk Import',
      'Bulk import completed.',
    )
  }

  function applyStockAction() {
    const quantity = toNumber(stockActionForm.quantity)
    if (!stockActionForm.medicineId || quantity <= 0) {
      notify('Select a medicine and quantity for the stock action.', 'error', false)
      return
    }

    const actionType = stockActionForm.action
    updateAdminState(
      (current) => {
        const nextBatches = current.batches.map((batch) => ({ ...batch, history: [...(batch.history || [])] }))
        const targetBatch = nextBatches.find(
          (batch) =>
            batch.medicineId === stockActionForm.medicineId &&
            !batch.archived &&
            !batch.disposed &&
            getDaysUntil(batch.expiryDate) >= 0,
        )

        if (actionType === 'Add Stock') {
          nextBatches.unshift({
            id: createRecordId('batch'),
            medicineId: stockActionForm.medicineId,
            batchNumber: stockActionForm.batchNumber || `STOCK-${Date.now().toString().slice(-6)}`,
            manufacturingDate: new Date().toISOString().slice(0, 10),
            expiryDate: stockActionForm.expiryDate || addMonths(new Date().toISOString().slice(0, 10), 12),
            purchaseCost: 0,
            quantityReceived: quantity,
            quantityAvailable: quantity,
            history: [`Stock action added ${quantity} units`],
            archived: false,
            disposed: false,
          })
        }

        if (targetBatch && ['Remove Stock', 'Adjust Stock', 'Update Stock', 'Reconcile Stock'].includes(actionType)) {
          if (actionType === 'Remove Stock') {
            targetBatch.quantityAvailable = Math.max(0, Number(targetBatch.quantityAvailable || 0) - quantity)
          }
          if (actionType === 'Adjust Stock') {
            targetBatch.quantityAvailable = Math.max(0, Number(targetBatch.quantityAvailable || 0) + quantity)
          }
          if (actionType === 'Update Stock' || actionType === 'Reconcile Stock') {
            targetBatch.quantityAvailable = quantity
          }
          targetBatch.history.unshift(`${actionType} processed with quantity ${quantity}`)
        }

        if (actionType === 'Transfer Stock') {
          return {
            ...current,
            medicines: current.medicines.map((item) =>
              item.id === stockActionForm.medicineId
                ? { ...item, storageLocation: stockActionForm.note || item.storageLocation }
                : item,
            ),
            batches: nextBatches,
          }
        }

        return { ...current, batches: nextBatches }
      },
      `${stockActionForm.action} executed`,
      'Stock Management',
      `${stockActionForm.action} completed.`,
    )
    resetStockActionForm()
  }

  function handlePrescriptionSubmit(event) {
    event.preventDefault()

    const medicine = medicinesById[prescriptionForm.medicineId]
    if (!medicine) {
      notify('Select a medicine before creating a prescription record.', 'error', false)
      return
    }

    const quantity = toNumber(prescriptionForm.quantity)
    const availableStock = getAvailableStock(
      prescriptionForm.medicineId,
      adminState.batches,
      adminState.prescriptions,
    )
    const expiryStatus = getExpiryStatus(prescriptionForm.medicineId, adminState.batches)

    if (expiryStatus === 'Expired' || expiryStatus === 'No Batch') {
      notify('Expired or unavailable stock cannot be selected for prescriptions.', 'error', false)
      return
    }

    if (quantity <= 0 || quantity > availableStock) {
      notify('Prescription quantity exceeds available stock.', 'error', false)
      return
    }

    updateAdminState(
      (current) => ({
        ...current,
        prescriptions: [
          {
            ...prescriptionForm,
            id: createRecordId('rx'),
            quantity,
            dispensedQuantity: 0,
            status: 'Reserved',
            medicineName: medicine.medicineName,
            strength: medicine.strength,
            form: medicine.dosageForm,
            createdAt: new Date().toISOString(),
          },
          ...current.prescriptions,
        ],
      }),
      'Created inventory-linked prescription',
      'Prescription Integration',
      availableStock <= medicine.reorderLevel
        ? 'Prescription linked. Low stock warning applied.'
        : 'Prescription linked to inventory.',
    )
    resetPrescriptionForm()
  }

  function handleDispenseSubmit(event) {
    event.preventDefault()
    const prescription = adminState.prescriptions.find((item) => item.id === dispenseForm.prescriptionId)

    if (!prescription) {
      notify('Select a prescription before dispensing.', 'error', false)
      return
    }

    if (dispenseForm.action === 'Cancel Dispense') {
      updateAdminState(
        (current) => ({
          ...current,
          prescriptions: current.prescriptions.map((item) =>
            item.id === prescription.id ? { ...item, status: 'Cancelled' } : item,
          ),
          dispenses: [
            {
              id: createRecordId('dispense'),
              prescriptionId: prescription.id,
              medicineId: prescription.medicineId,
              quantity: 0,
              status: 'Cancelled',
              timestamp: new Date().toISOString(),
            },
            ...current.dispenses,
          ],
        }),
        'Cancelled dispense',
        'Dispensing',
        'Dispense cancelled.',
      )
      setDispenseForm(initialDispenseForm)
      return
    }

    const remainingQuantity = Number(prescription.quantity || 0) - Number(prescription.dispensedQuantity || 0)
    const requestedQuantity =
      dispenseForm.action === 'Complete Dispense' ? remainingQuantity : toNumber(dispenseForm.quantity)

    if (requestedQuantity <= 0 || requestedQuantity > remainingQuantity) {
      notify('Dispense quantity is invalid.', 'error', false)
      return
    }

    const validBatches = getDispensableBatches(prescription.medicineId, adminState.batches)
    const totalAvailable = validBatches.reduce((sum, batch) => sum + Number(batch.quantityAvailable || 0), 0)

    if (requestedQuantity > totalAvailable) {
      notify('Not enough valid stock is available for dispensing.', 'error', false)
      return
    }

    updateAdminState(
      (current) => {
        let quantityToDeduct = requestedQuantity
        const nextBatches = current.batches.map((batch) => ({ ...batch, history: [...(batch.history || [])] }))

        getDispensableBatches(prescription.medicineId, nextBatches).forEach((batch) => {
          if (!quantityToDeduct) {
            return
          }
          const available = Number(batch.quantityAvailable || 0)
          const used = Math.min(available, quantityToDeduct)
          batch.quantityAvailable = available - used
          batch.history.unshift(`Dispensed ${used} units against prescription ${prescription.id}`)
          quantityToDeduct -= used
        })

        return {
          ...current,
          batches: nextBatches,
          prescriptions: current.prescriptions.map((item) =>
            item.id === prescription.id
              ? {
                  ...item,
                  dispensedQuantity: Number(item.dispensedQuantity || 0) + requestedQuantity,
                  status:
                    Number(item.dispensedQuantity || 0) + requestedQuantity >= Number(item.quantity || 0)
                      ? 'Completed'
                      : 'Partially Dispensed',
                }
              : item,
          ),
          dispenses: [
            {
              id: createRecordId('dispense'),
              prescriptionId: prescription.id,
              medicineId: prescription.medicineId,
              quantity: requestedQuantity,
              status: dispenseForm.action,
              timestamp: new Date().toISOString(),
            },
            ...current.dispenses,
          ],
        }
      },
      dispenseForm.action,
      'Dispensing',
      `${dispenseForm.action} completed.`,
    )
    setDispenseForm(initialDispenseForm)
  }

  function handleReceivePurchase(purchaseId) {
    const purchase = adminState.purchases.find((item) => item.id === purchaseId)
    if (!purchase) {
      return
    }

    const parsedItems = purchase.itemsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    updateAdminState(
      (current) => {
        let nextMedicines = [...current.medicines]
        let nextBatches = [...current.batches]

        parsedItems.forEach((line) => {
          const [name, strength, form, quantityText, costText] = line.split('|').map((item) => item.trim())
          const quantity = toNumber(quantityText)
          const cost = toNumber(costText)
          if (!name || !strength || !form || quantity <= 0) {
            return
          }

          let medicine = nextMedicines.find(
            (item) =>
              item.medicineName.toLowerCase() === name.toLowerCase() &&
              item.strength.toLowerCase() === strength.toLowerCase() &&
              item.dosageForm.toLowerCase() === form.toLowerCase(),
          )

          if (!medicine) {
            medicine = {
              id: createRecordId('medicine'),
              medicineName: name,
              genericName: name,
              brandName: name,
              category: 'Purchase Intake',
              dosageForm: form,
              strength,
              unit: 'Unit',
              manufacturer: 'Not Set',
              supplierId: purchase.supplierId,
              purchasePrice: cost,
              sellingPrice: cost,
              reorderLevel: 100,
              minimumStockLevel: 25,
              storageLocation: 'Receiving Dock',
              barcode: '',
              qrCode: '',
              archived: false,
            }
            nextMedicines = [medicine, ...nextMedicines]
          }

          nextBatches = [
            {
              id: createRecordId('batch'),
              medicineId: medicine.id,
              batchNumber: `PO-${purchase.purchaseOrderNumber}-${Date.now().toString().slice(-4)}`,
              manufacturingDate: new Date().toISOString().slice(0, 10),
              expiryDate: addMonths(new Date().toISOString().slice(0, 10), 12),
              purchaseCost: cost,
              quantityReceived: quantity,
              quantityAvailable: quantity,
              history: [`Received from purchase order ${purchase.purchaseOrderNumber}`],
              archived: false,
              disposed: false,
            },
            ...nextBatches,
          ]
        })

        return {
          ...current,
          medicines: nextMedicines,
          batches: nextBatches,
          purchases: current.purchases.map((item) =>
            item.id === purchaseId ? { ...item, status: 'Received' } : item,
          ),
        }
      },
      'Received purchase order',
      'Purchases',
      'Purchase order received into stock.',
    )
  }

  function setFeatureToggle(organizationId, featureName, enabled) {
    updateAdminState(
      (current) => ({
        ...current,
        organizations: current.organizations.map((organization) =>
          organization.id === organizationId
            ? {
                ...organization,
                featureToggles: {
                  ...organization.featureToggles,
                  [featureName]: enabled,
                },
              }
            : organization,
        ),
      }),
      `${enabled ? 'Enabled' : 'Disabled'} module ${featureName}`,
      'Feature Controls',
      `${featureName} ${enabled ? 'enabled' : 'disabled'}.`,
    )
  }

  function renderOrganizationsSection() {
    return (
      <div className="admin-section-shell">
        <PanelBlock title="Organizations">
          <div className="admin-filter-row">
            <input
              value={organizationQuery}
              onChange={(event) => setOrganizationQuery(event.target.value)}
              placeholder="Search organizations"
            />
          </div>
          <AdminTable
            columns={['Organization Name', 'Organization Code', 'Contact Person', 'Email', 'Phone', 'Subscription Plan', 'Contract Status', 'Active Users', 'Status', 'Actions']}
            rows={organizationRows.map((organization) => [
              organization.organizationName,
              organization.organizationCode,
              organization.contactPerson,
              organization.email,
              organization.phone,
              organization.subscriptionPlan,
              organization.contractStatus,
              Number(organization.activeUsers || 0).toLocaleString('en-IN'),
              organization.status,
              <ActionCell
                key={organization.id}
                actions={[
                  { label: 'View Details', onClick: () => setSelectedOrganizationId(organization.id) },
                  { label: 'Edit', onClick: () => editRow(setOrganizationForm, { ...organization }, 'organizations') },
                  {
                    label: organization.status === 'Active' ? 'Suspend' : 'Activate',
                    onClick: () =>
                      updateAdminState(
                        (current) => ({
                          ...current,
                          organizations: current.organizations.map((item) =>
                            item.id === organization.id
                              ? { ...item, status: item.status === 'Active' ? 'Suspended' : 'Active' }
                              : item,
                          ),
                        }),
                        organization.status === 'Active' ? 'Suspended organization' : 'Activated organization',
                        'Organizations',
                        organization.status === 'Active' ? 'Organization suspended.' : 'Organization activated.',
                      ),
                  },
                  {
                    label: 'Delete',
                    onClick: () =>
                      updateAdminState(
                        (current) => ({
                          ...current,
                          organizations: current.organizations.filter((item) => item.id !== organization.id),
                          subscriptions: current.subscriptions.filter((item) => item.organizationId !== organization.id),
                          contracts: current.contracts.filter((item) => item.organizationId !== organization.id),
                        }),
                        'Deleted organization',
                        'Organizations',
                        'Organization deleted.',
                      ),
                  },
                  {
                    label: 'Reset Organization Settings',
                    onClick: () =>
                      updateAdminState(
                        (current) => ({
                          ...current,
                          organizations: current.organizations.map((item) =>
                            item.id === organization.id ? { ...item, settingsResetAt: new Date().toISOString() } : item,
                          ),
                        }),
                        'Reset organization settings',
                        'Organizations',
                        'Organization settings reset.',
                      ),
                  },
                ]}
              />,
            ])}
          />
        </PanelBlock>

        <div className="admin-grid two-column">
          <PanelBlock title={organizationForm.id ? 'Edit Organization' : 'Create Organization'}>
            <form className="admin-form-grid" onSubmit={handleOrganizationSubmit}>
              <input value={organizationForm.organizationName} onChange={(event) => setOrganizationForm({ ...organizationForm, organizationName: event.target.value })} placeholder="Organization Name" required />
              <input value={organizationForm.organizationCode} onChange={(event) => setOrganizationForm({ ...organizationForm, organizationCode: event.target.value })} placeholder="Organization Code" required />
              <input value={organizationForm.contactPerson} onChange={(event) => setOrganizationForm({ ...organizationForm, contactPerson: event.target.value })} placeholder="Contact Person" required />
              <input value={organizationForm.email} onChange={(event) => setOrganizationForm({ ...organizationForm, email: event.target.value })} placeholder="Email" required />
              <input value={organizationForm.phone} onChange={(event) => setOrganizationForm({ ...organizationForm, phone: event.target.value })} placeholder="Phone" required />
              <input value={organizationForm.subscriptionPlan} onChange={(event) => setOrganizationForm({ ...organizationForm, subscriptionPlan: event.target.value })} placeholder="Subscription Plan" required />
              <select value={organizationForm.contractStatus} onChange={(event) => setOrganizationForm({ ...organizationForm, contractStatus: event.target.value })}>
                <option>Active</option>
                <option>Renewal Due</option>
                <option>Expired</option>
              </select>
              <input type="number" min="0" value={organizationForm.activeUsers} onChange={(event) => setOrganizationForm({ ...organizationForm, activeUsers: event.target.value })} placeholder="Active Users" />
              <select value={organizationForm.status} onChange={(event) => setOrganizationForm({ ...organizationForm, status: event.target.value })}>
                <option>Active</option>
                <option>Suspended</option>
                <option>Inactive</option>
              </select>
              <div className="admin-actions">
                <button type="submit" className="primary-button">{organizationForm.id ? 'Edit Organization' : 'Create Organization'}</button>
                <button type="button" className="ghost-button" onClick={resetOrganizationForm}>Reset</button>
              </div>
            </form>
          </PanelBlock>
          <PanelBlock title="Organization Details">
            {selectedOrganization ? (
              <div className="admin-detail-grid">
                <DetailRow label="Organization Name" value={selectedOrganization.organizationName} />
                <DetailRow label="Organization Code" value={selectedOrganization.organizationCode} />
                <DetailRow label="Contact Person" value={selectedOrganization.contactPerson} />
                <DetailRow label="Email" value={selectedOrganization.email} />
                <DetailRow label="Phone" value={selectedOrganization.phone} />
                <DetailRow label="Subscription Plan" value={selectedOrganization.subscriptionPlan} />
                <DetailRow label="Contract Status" value={selectedOrganization.contractStatus} />
                <DetailRow label="Status" value={selectedOrganization.status} />
                <DetailRow label="Reset Settings" value={selectedOrganization.settingsResetAt ? formatDateTime(selectedOrganization.settingsResetAt) : 'Not Reset'} />
              </div>
            ) : (
              <div className="admin-placeholder-text">Select an organization from the table.</div>
            )}
          </PanelBlock>
        </div>
      </div>
    )
  }

  function renderSubscriptionsSection() {
    return (
      <div className="admin-section-shell">
        <PanelBlock title="Subscriptions">
          <AdminTable
            columns={['Organization', 'Plan', 'User Limit', 'Storage Limit', 'Monthly Price', 'Renewal Date', 'Status', 'Actions']}
            rows={adminState.subscriptions.map((subscription) => [
              organizationsById[subscription.organizationId]?.organizationName || 'Unassigned',
              subscription.plan,
              Number(subscription.userLimit || 0).toLocaleString('en-IN'),
              `${Number(subscription.storageLimit || 0).toLocaleString('en-IN')} GB`,
              formatCurrency(subscription.monthlyPrice),
              subscription.renewalDate,
              subscription.status,
              <ActionCell
                key={subscription.id}
                actions={[
                  { label: 'Edit', onClick: () => editRow(setSubscriptionForm, { ...subscription }, 'subscriptions') },
                  {
                    label: 'Upgrade Plan',
                    onClick: () => {
                      const planNames = adminState.plans.map((plan) => plan.planName)
                      const currentIndex = Math.max(0, planNames.indexOf(subscription.plan))
                      const nextPlan = adminState.plans[Math.min(planNames.length - 1, currentIndex + 1)]
                      if (!nextPlan) return
                      updateAdminState(
                        (current) => ({
                          ...current,
                          subscriptions: current.subscriptions.map((item) =>
                            item.id === subscription.id
                              ? { ...item, plan: nextPlan.planName, userLimit: nextPlan.userLimit, storageLimit: nextPlan.storageLimit, monthlyPrice: nextPlan.monthlyPrice }
                              : item,
                          ),
                        }),
                        'Upgraded subscription',
                        'Subscriptions',
                        'Subscription upgraded.',
                      )
                    },
                  },
                  {
                    label: 'Downgrade Plan',
                    onClick: () => {
                      const planNames = adminState.plans.map((plan) => plan.planName)
                      const currentIndex = Math.max(0, planNames.indexOf(subscription.plan))
                      const nextPlan = adminState.plans[Math.max(0, currentIndex - 1)]
                      if (!nextPlan) return
                      updateAdminState(
                        (current) => ({
                          ...current,
                          subscriptions: current.subscriptions.map((item) =>
                            item.id === subscription.id
                              ? { ...item, plan: nextPlan.planName, userLimit: nextPlan.userLimit, storageLimit: nextPlan.storageLimit, monthlyPrice: nextPlan.monthlyPrice }
                              : item,
                          ),
                        }),
                        'Downgraded subscription',
                        'Subscriptions',
                        'Subscription downgraded.',
                      )
                    },
                  },
                  {
                    label: 'Renew Subscription',
                    onClick: () =>
                      updateAdminState(
                        (current) => ({
                          ...current,
                          subscriptions: current.subscriptions.map((item) =>
                            item.id === subscription.id ? { ...item, renewalDate: addMonths(item.renewalDate, 1), status: 'Active' } : item,
                          ),
                        }),
                        'Renewed subscription',
                        'Subscriptions',
                        'Subscription renewed.',
                      ),
                  },
                  {
                    label: 'Extend Trial',
                    onClick: () =>
                      updateAdminState(
                        (current) => ({
                          ...current,
                          subscriptions: current.subscriptions.map((item) =>
                            item.id === subscription.id ? { ...item, renewalDate: addDays(item.renewalDate, 14), status: 'Trial Extended' } : item,
                          ),
                        }),
                        'Extended trial',
                        'Subscriptions',
                        'Trial extended.',
                      ),
                  },
                  {
                    label: 'Cancel Subscription',
                    onClick: () =>
                      updateAdminState(
                        (current) => ({
                          ...current,
                          subscriptions: current.subscriptions.map((item) =>
                            item.id === subscription.id ? { ...item, status: 'Cancelled' } : item,
                          ),
                        }),
                        'Cancelled subscription',
                        'Subscriptions',
                        'Subscription cancelled.',
                      ),
                  },
                ]}
              />,
            ])}
          />
        </PanelBlock>
        <PanelBlock title={subscriptionForm.id ? 'Edit Subscription' : 'Create Subscription'}>
          <form className="admin-form-grid" onSubmit={handleSubscriptionSubmit}>
            <select value={subscriptionForm.organizationId} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, organizationId: event.target.value })} required>
              <option value="">Organization</option>
              {adminState.organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.organizationName}</option>)}
            </select>
            <select
              value={subscriptionForm.plan}
              onChange={(event) => {
                const defaults = getPlanDefaults(event.target.value)
                setSubscriptionForm({ ...subscriptionForm, plan: event.target.value, userLimit: defaults.userLimit, storageLimit: defaults.storageLimit, monthlyPrice: defaults.monthlyPrice })
              }}
              required
            >
              <option value="">Plan</option>
              {adminState.plans.map((plan) => <option key={plan.id} value={plan.planName}>{plan.planName}</option>)}
            </select>
            <input type="number" min="0" value={subscriptionForm.userLimit} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, userLimit: event.target.value })} placeholder="User Limit" required />
            <input type="number" min="0" value={subscriptionForm.storageLimit} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, storageLimit: event.target.value })} placeholder="Storage Limit" required />
            <input type="number" min="0" value={subscriptionForm.monthlyPrice} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, monthlyPrice: event.target.value })} placeholder="Monthly Price" required />
            <input type="date" value={subscriptionForm.renewalDate} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, renewalDate: event.target.value })} required />
            <select value={subscriptionForm.status} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, status: event.target.value })}>
              <option>Active</option>
              <option>Trial</option>
              <option>Trial Extended</option>
              <option>Cancelled</option>
            </select>
            <div className="admin-actions">
              <button type="submit" className="primary-button">{subscriptionForm.id ? 'Edit Subscription' : 'Create Subscription'}</button>
              <button type="button" className="ghost-button" onClick={resetSubscriptionForm}>Reset</button>
            </div>
          </form>
        </PanelBlock>
      </div>
    )
  }

  function renderPlansSection() {
    return (
      <div className="admin-section-shell">
        <div className="admin-grid two-column">
          <PanelBlock title="Plan Builder">
            <form className="admin-form-grid" onSubmit={handlePlanSubmit}>
              <input value={planForm.planName} onChange={(event) => setPlanForm({ ...planForm, planName: event.target.value })} placeholder="Plan Name" required />
              <input type="number" min="0" value={planForm.monthlyPrice} onChange={(event) => setPlanForm({ ...planForm, monthlyPrice: event.target.value })} placeholder="Monthly Price" required />
              <input type="number" min="0" value={planForm.annualPrice} onChange={(event) => setPlanForm({ ...planForm, annualPrice: event.target.value })} placeholder="Annual Price" required />
              <input type="number" min="0" value={planForm.userLimit} onChange={(event) => setPlanForm({ ...planForm, userLimit: event.target.value })} placeholder="User Limit" required />
              <input type="number" min="0" value={planForm.storageLimit} onChange={(event) => setPlanForm({ ...planForm, storageLimit: event.target.value })} placeholder="Storage Limit" required />
              <input type="number" min="0" value={planForm.clinicLimit} onChange={(event) => setPlanForm({ ...planForm, clinicLimit: event.target.value })} placeholder="Clinic Limit" required />
              <div className="admin-toggle-grid">
                {featureKeys.map((feature) => (
                  <label key={feature} className="admin-toggle-item">
                    <input type="checkbox" checked={Boolean(planForm.features[feature])} onChange={(event) => setPlanForm({ ...planForm, features: { ...planForm.features, [feature]: event.target.checked } })} />
                    <span>{feature}</span>
                  </label>
                ))}
              </div>
              <div className="admin-actions">
                <button type="submit" className="primary-button">{planForm.id ? 'Edit Plan' : 'Create Plan'}</button>
                <button type="button" className="ghost-button" onClick={resetPlanForm}>Reset</button>
              </div>
            </form>
          </PanelBlock>
          <PanelBlock title="Plan Records">
            <AdminTable
              columns={['Plan Name', 'Monthly Price', 'Annual Price', 'User Limit', 'Storage Limit', 'Clinic Limit', 'Actions']}
              rows={adminState.plans.map((plan) => [
                plan.planName,
                formatCurrency(plan.monthlyPrice),
                formatCurrency(plan.annualPrice),
                Number(plan.userLimit || 0).toLocaleString('en-IN'),
                `${Number(plan.storageLimit || 0).toLocaleString('en-IN')} GB`,
                Number(plan.clinicLimit || 0).toLocaleString('en-IN'),
                <ActionCell
                  key={plan.id}
                  actions={[
                    { label: 'Edit', onClick: () => editRow(setPlanForm, { ...plan, features: { ...plan.features } }, 'plans') },
                    {
                      label: 'Clone Plan',
                      onClick: () =>
                        updateAdminState(
                          (current) => ({
                            ...current,
                            plans: [{ ...plan, id: createRecordId('plan'), planName: `${plan.planName} Copy` }, ...current.plans],
                          }),
                          'Cloned plan',
                          'Plans',
                          'Plan cloned.',
                        ),
                    },
                    {
                      label: 'Delete Plan',
                      onClick: () =>
                        updateAdminState(
                          (current) => ({ ...current, plans: current.plans.filter((item) => item.id !== plan.id) }),
                          'Deleted plan',
                          'Plans',
                          'Plan deleted.',
                        ),
                    },
                  ]}
                />,
              ])}
            />
          </PanelBlock>
        </div>
      </div>
    )
  }

  function renderContractsSection() {
    return (
      <div className="admin-section-shell">
        <PanelBlock title="Contracts">
          <AdminTable
            columns={['Organization', 'Contract Number', 'Start Date', 'End Date', 'Contract Value', 'Status', 'Actions']}
            rows={adminState.contracts.map((contract) => [
              organizationsById[contract.organizationId]?.organizationName || 'Unassigned',
              contract.contractNumber,
              contract.startDate,
              contract.endDate,
              formatCurrency(contract.contractValue),
              contract.status,
              <ActionCell
                key={contract.id}
                actions={[
                  { label: 'Edit', onClick: () => editRow(setContractForm, { ...contract }, 'contracts') },
                  {
                    label: 'Upload Contract',
                    onClick: () =>
                      updateAdminState(
                        (current) => ({
                          ...current,
                          contracts: current.contracts.map((item) => item.id === contract.id ? { ...item, uploadName: item.uploadName || `${item.contractNumber}.pdf` } : item),
                        }),
                        'Uploaded contract',
                        'Contracts',
                        'Contract upload recorded.',
                      ),
                  },
                  {
                    label: 'Renew Contract',
                    onClick: () =>
                      updateAdminState(
                        (current) => ({
                          ...current,
                          contracts: current.contracts.map((item) => item.id === contract.id ? { ...item, endDate: addMonths(item.endDate, 12), status: 'Active' } : item),
                        }),
                        'Renewed contract',
                        'Contracts',
                        'Contract renewed.',
                      ),
                  },
                  {
                    label: 'Archive Contract',
                    onClick: () =>
                      updateAdminState(
                        (current) => ({
                          ...current,
                          contracts: current.contracts.map((item) => item.id === contract.id ? { ...item, status: 'Archived' } : item),
                        }),
                        'Archived contract',
                        'Contracts',
                        'Contract archived.',
                      ),
                  },
                  {
                    label: 'Mark Expired',
                    onClick: () =>
                      updateAdminState(
                        (current) => ({
                          ...current,
                          contracts: current.contracts.map((item) => item.id === contract.id ? { ...item, status: 'Expired' } : item),
                        }),
                        'Marked contract expired',
                        'Contracts',
                        'Contract marked expired.',
                      ),
                  },
                ]}
              />,
            ])}
          />
        </PanelBlock>
        <PanelBlock title={contractForm.id ? 'Edit Contract' : 'Create Contract'}>
          <form className="admin-form-grid" onSubmit={handleContractSubmit}>
            <select value={contractForm.organizationId} onChange={(event) => setContractForm({ ...contractForm, organizationId: event.target.value })} required>
              <option value="">Organization</option>
              {adminState.organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.organizationName}</option>)}
            </select>
            <input value={contractForm.contractNumber} onChange={(event) => setContractForm({ ...contractForm, contractNumber: event.target.value })} placeholder="Contract Number" required />
            <input type="date" value={contractForm.startDate} onChange={(event) => setContractForm({ ...contractForm, startDate: event.target.value })} required />
            <input type="date" value={contractForm.endDate} onChange={(event) => setContractForm({ ...contractForm, endDate: event.target.value })} required />
            <input type="number" min="0" value={contractForm.contractValue} onChange={(event) => setContractForm({ ...contractForm, contractValue: event.target.value })} placeholder="Contract Value" required />
            <select value={contractForm.status} onChange={(event) => setContractForm({ ...contractForm, status: event.target.value })}>
              <option>Active</option>
              <option>Expiring</option>
              <option>Expired</option>
              <option>Archived</option>
            </select>
            <input value={contractForm.uploadName} onChange={(event) => setContractForm({ ...contractForm, uploadName: event.target.value })} placeholder="Upload Contract" />
            <div className="admin-actions">
              <button type="submit" className="primary-button">{contractForm.id ? 'Edit Contract' : 'Create Contract'}</button>
              <button type="button" className="ghost-button" onClick={resetContractForm}>Reset</button>
            </div>
          </form>
        </PanelBlock>
      </div>
    )
  }
  return (
    <div className="admin-console">
      <div className="admin-section-tabs">
        {adminSections.map((section) => (
          <button
            key={section.key}
            type="button"
            className={activeSection === section.key ? 'admin-section-tab active' : 'admin-section-tab'}
            onClick={() => setActiveSection(section.key)}
          >
            {section.label}
          </button>
        ))}
      </div>
      <div className="panel">
        <div className="admin-placeholder-text">
          Platform admin operational sections are being mounted.
        </div>
      </div>
    </div>
  )
}

export default PlatformAdminConsole
