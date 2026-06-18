<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

loadEnv(__DIR__ . '/.env');
sendCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$pdo = getPdo();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$segments = getRouteSegments();
$resource = $segments[0] ?? 'dashboard';
$resourceId = isset($segments[1]) ? (int) $segments[1] : null;

try {
    switch ($resource) {
        case 'dashboard':
            jsonResponse(['status' => 'success', 'data' => getDashboardData($pdo)]);
        case 'patients':
            handlePatients($pdo, $method, $resourceId);
            break;
        case 'doctors':
            handleDoctors($pdo, $method, $resourceId);
            break;
        case 'appointments':
            handleAppointments($pdo, $method, $resourceId);
            break;
        case 'consultations':
            handleConsultations($pdo, $method);
            break;
        case 'prescriptions':
            handlePrescriptions($pdo, $method);
            break;
        case 'billing':
            handleBilling($pdo, $method, $segments);
            break;
        case 'reports':
            handleReports($pdo, $segments);
            break;
        case 'notifications':
            jsonResponse(['status' => 'success', 'data' => getNotifications($pdo)]);
        default:
            jsonResponse([
                'status' => 'error',
                'message' => 'Resource not found.',
            ], 404);
    }
} catch (Throwable $exception) {
    error_log($exception->getMessage());

    jsonResponse([
        'status' => 'error',
        'message' => 'The EMR API could not complete the request safely.',
    ], 500);
}

function getDashboardData(PDO $pdo): array
{
    $totalPatients = (int) $pdo->query('SELECT COUNT(*) FROM patients')->fetchColumn();
    $activeDoctors = (int) $pdo->query("SELECT COUNT(*) FROM doctors WHERE status = 'Active'")->fetchColumn();

    $appointmentStatement = $pdo->prepare('SELECT COUNT(*) FROM appointments WHERE appointment_date = :today');
    $appointmentStatement->execute(['today' => currentDate()]);
    $todaysAppointments = (int) $appointmentStatement->fetchColumn();

    $revenueStatement = $pdo->prepare(
        'SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE created_at >= :month_start'
    );
    $revenueStatement->execute(['month_start' => currentMonthStart()]);
    $monthlyRevenue = (float) $revenueStatement->fetchColumn();

    $upcomingStatement = $pdo->prepare(
        "SELECT a.id, p.full_name AS patient_name, d.full_name AS doctor_name, a.appointment_date,
                a.appointment_time, a.status
         FROM appointments a
         INNER JOIN patients p ON p.id = a.patient_id
         INNER JOIN doctors d ON d.id = a.doctor_id
         WHERE a.appointment_date >= :today
         ORDER BY a.appointment_date ASC, a.appointment_time ASC
         LIMIT 5"
    );
    $upcomingStatement->execute(['today' => currentDate()]);

    $recentPatients = fetchAllAssoc(
        $pdo->query(
            "SELECT id, full_name,
                    CONCAT('Profile updated. Conditions: ', COALESCE(NULLIF(conditions, ''), 'none')) AS activity,
                    updated_at
             FROM patients
             ORDER BY updated_at DESC
             LIMIT 5"
        )
    );

    return [
        'totalPatients' => $totalPatients,
        'todaysAppointments' => $todaysAppointments,
        'activeDoctors' => $activeDoctors,
        'monthlyRevenue' => $monthlyRevenue,
        'upcomingAppointments' => fetchAllAssoc($upcomingStatement),
        'recentPatients' => $recentPatients,
    ];
}

function handlePatients(PDO $pdo, string $method, ?int $resourceId): void
{
    if ($method === 'GET' && $resourceId === null) {
        $rows = fetchAllAssoc(
            $pdo->query('SELECT * FROM patients ORDER BY updated_at DESC, id DESC')
        );
        jsonResponse(['status' => 'success', 'data' => $rows]);
    }

    if ($method === 'GET' && $resourceId !== null) {
        $statement = $pdo->prepare('SELECT * FROM patients WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $resourceId]);
        jsonResponse(['status' => 'success', 'data' => fetchOneAssoc($statement)]);
    }

    $payload = readJsonBody();

    if ($method === 'POST') {
        requireFields($payload, ['full_name', 'date_of_birth', 'phone']);
        $patientCode = 'PT-' . str_pad((string) random_int(1000, 9999), 4, '0', STR_PAD_LEFT);

        $statement = $pdo->prepare(
            'INSERT INTO patients (
                patient_code, full_name, gender, date_of_birth, phone, email, blood_group,
                address, emergency_contact, allergies, conditions, medical_history, last_visit_at
             ) VALUES (
                :patient_code, :full_name, :gender, :date_of_birth, :phone, :email, :blood_group,
                :address, :emergency_contact, :allergies, :conditions, :medical_history, :last_visit_at
             )'
        );

        $statement->execute([
            'patient_code' => $patientCode,
            'full_name' => $payload['full_name'],
            'gender' => $payload['gender'] ?? 'Other',
            'date_of_birth' => $payload['date_of_birth'],
            'phone' => $payload['phone'],
            'email' => $payload['email'] ?? null,
            'blood_group' => $payload['blood_group'] ?? null,
            'address' => $payload['address'] ?? null,
            'emergency_contact' => $payload['emergency_contact'] ?? null,
            'allergies' => $payload['allergies'] ?? null,
            'conditions' => $payload['conditions'] ?? null,
            'medical_history' => $payload['medical_history'] ?? null,
            'last_visit_at' => $payload['last_visit_at'] ?: null,
        ]);

        $createdId = (int) $pdo->lastInsertId();
        $fetchStatement = $pdo->prepare('SELECT * FROM patients WHERE id = :id LIMIT 1');
        $fetchStatement->execute(['id' => $createdId]);

        jsonResponse(['status' => 'success', 'data' => fetchOneAssoc($fetchStatement)], 201);
    }

    if ($method === 'PUT' && $resourceId !== null) {
        requireFields($payload, ['full_name', 'date_of_birth', 'phone']);

        $statement = $pdo->prepare(
            'UPDATE patients SET
                full_name = :full_name,
                gender = :gender,
                date_of_birth = :date_of_birth,
                phone = :phone,
                email = :email,
                blood_group = :blood_group,
                address = :address,
                emergency_contact = :emergency_contact,
                allergies = :allergies,
                conditions = :conditions,
                medical_history = :medical_history,
                last_visit_at = :last_visit_at,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );

        $statement->execute([
            'id' => $resourceId,
            'full_name' => $payload['full_name'],
            'gender' => $payload['gender'] ?? 'Other',
            'date_of_birth' => $payload['date_of_birth'],
            'phone' => $payload['phone'],
            'email' => $payload['email'] ?? null,
            'blood_group' => $payload['blood_group'] ?? null,
            'address' => $payload['address'] ?? null,
            'emergency_contact' => $payload['emergency_contact'] ?? null,
            'allergies' => $payload['allergies'] ?? null,
            'conditions' => $payload['conditions'] ?? null,
            'medical_history' => $payload['medical_history'] ?? null,
            'last_visit_at' => $payload['last_visit_at'] ?: null,
        ]);

        $fetchStatement = $pdo->prepare('SELECT * FROM patients WHERE id = :id LIMIT 1');
        $fetchStatement->execute(['id' => $resourceId]);

        jsonResponse(['status' => 'success', 'data' => fetchOneAssoc($fetchStatement)]);
    }

    jsonResponse(['status' => 'error', 'message' => 'Unsupported patient action.'], 405);
}

function handleDoctors(PDO $pdo, string $method, ?int $resourceId): void
{
    if ($method === 'GET') {
        $rows = fetchAllAssoc(
            $pdo->query('SELECT * FROM doctors ORDER BY full_name ASC')
        );
        jsonResponse(['status' => 'success', 'data' => $rows]);
    }

    if ($method === 'POST') {
        $payload = readJsonBody();
        requireFields($payload, ['full_name', 'specialization']);

        $statement = $pdo->prepare(
            'INSERT INTO doctors (full_name, specialization, phone, email, availability, status, consultation_history)
             VALUES (:full_name, :specialization, :phone, :email, :availability, :status, :consultation_history)'
        );
        $statement->execute([
            'full_name' => $payload['full_name'],
            'specialization' => $payload['specialization'],
            'phone' => $payload['phone'] ?? null,
            'email' => $payload['email'] ?? null,
            'availability' => $payload['availability'] ?? null,
            'status' => $payload['status'] ?? 'Active',
            'consultation_history' => $payload['consultation_history'] ?? null,
        ]);

        $createdId = (int) $pdo->lastInsertId();
        $fetchStatement = $pdo->prepare('SELECT * FROM doctors WHERE id = :id LIMIT 1');
        $fetchStatement->execute(['id' => $createdId]);

        jsonResponse(['status' => 'success', 'data' => fetchOneAssoc($fetchStatement)], 201);
    }

    jsonResponse(['status' => 'error', 'message' => 'Unsupported doctor action.'], 405);
}

function handleAppointments(PDO $pdo, string $method, ?int $resourceId): void
{
    if ($method === 'GET') {
        $statement = $pdo->query(
            "SELECT a.*, p.full_name AS patient_name, d.full_name AS doctor_name
             FROM appointments a
             INNER JOIN patients p ON p.id = a.patient_id
             INNER JOIN doctors d ON d.id = a.doctor_id
             ORDER BY a.appointment_date DESC, a.appointment_time DESC"
        );

        jsonResponse(['status' => 'success', 'data' => fetchAllAssoc($statement)]);
    }

    $payload = readJsonBody();

    if ($method === 'POST') {
        requireFields($payload, ['patient_id', 'doctor_id', 'appointment_date', 'appointment_time']);

        $statement = $pdo->prepare(
            'INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status, notes)
             VALUES (:patient_id, :doctor_id, :appointment_date, :appointment_time, :reason, :status, :notes)'
        );
        $statement->execute([
            'patient_id' => $payload['patient_id'],
            'doctor_id' => $payload['doctor_id'],
            'appointment_date' => $payload['appointment_date'],
            'appointment_time' => $payload['appointment_time'],
            'reason' => $payload['reason'] ?? null,
            'status' => $payload['status'] ?? 'Scheduled',
            'notes' => $payload['notes'] ?? null,
        ]);

        $createdId = (int) $pdo->lastInsertId();
        $fetchStatement = $pdo->prepare(
            "SELECT a.*, p.full_name AS patient_name, d.full_name AS doctor_name
             FROM appointments a
             INNER JOIN patients p ON p.id = a.patient_id
             INNER JOIN doctors d ON d.id = a.doctor_id
             WHERE a.id = :id LIMIT 1"
        );
        $fetchStatement->execute(['id' => $createdId]);

        jsonResponse(['status' => 'success', 'data' => fetchOneAssoc($fetchStatement)], 201);
    }

    if ($method === 'PUT' && $resourceId !== null) {
        requireFields($payload, ['patient_id', 'doctor_id', 'appointment_date', 'appointment_time']);

        $statement = $pdo->prepare(
            'UPDATE appointments SET
                patient_id = :patient_id,
                doctor_id = :doctor_id,
                appointment_date = :appointment_date,
                appointment_time = :appointment_time,
                reason = :reason,
                status = :status,
                notes = :notes,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );
        $statement->execute([
            'id' => $resourceId,
            'patient_id' => $payload['patient_id'],
            'doctor_id' => $payload['doctor_id'],
            'appointment_date' => $payload['appointment_date'],
            'appointment_time' => $payload['appointment_time'],
            'reason' => $payload['reason'] ?? null,
            'status' => $payload['status'] ?? 'Scheduled',
            'notes' => $payload['notes'] ?? null,
        ]);

        $fetchStatement = $pdo->prepare(
            "SELECT a.*, p.full_name AS patient_name, d.full_name AS doctor_name
             FROM appointments a
             INNER JOIN patients p ON p.id = a.patient_id
             INNER JOIN doctors d ON d.id = a.doctor_id
             WHERE a.id = :id LIMIT 1"
        );
        $fetchStatement->execute(['id' => $resourceId]);

        jsonResponse(['status' => 'success', 'data' => fetchOneAssoc($fetchStatement)]);
    }

    jsonResponse(['status' => 'error', 'message' => 'Unsupported appointment action.'], 405);
}

function handleConsultations(PDO $pdo, string $method): void
{
    if ($method === 'GET') {
        $statement = $pdo->query(
            "SELECT c.*, p.full_name AS patient_name, d.full_name AS doctor_name
             FROM consultations c
             INNER JOIN patients p ON p.id = c.patient_id
             INNER JOIN doctors d ON d.id = c.doctor_id
             ORDER BY c.consultation_date DESC, c.id DESC"
        );
        jsonResponse(['status' => 'success', 'data' => fetchAllAssoc($statement)]);
    }

    if ($method === 'POST') {
        $payload = readJsonBody();
        requireFields($payload, [
            'appointment_id',
            'patient_id',
            'doctor_id',
            'consultation_date',
            'clinical_notes',
            'diagnosis',
            'treatment_plan',
        ]);

        $statement = $pdo->prepare(
            'INSERT INTO consultations (
                appointment_id, patient_id, doctor_id, consultation_date, clinical_notes,
                diagnosis, treatment_plan, supporting_document
             ) VALUES (
                :appointment_id, :patient_id, :doctor_id, :consultation_date, :clinical_notes,
                :diagnosis, :treatment_plan, :supporting_document
             )'
        );
        $statement->execute([
            'appointment_id' => $payload['appointment_id'],
            'patient_id' => $payload['patient_id'],
            'doctor_id' => $payload['doctor_id'],
            'consultation_date' => $payload['consultation_date'],
            'clinical_notes' => $payload['clinical_notes'],
            'diagnosis' => $payload['diagnosis'],
            'treatment_plan' => $payload['treatment_plan'],
            'supporting_document' => $payload['supporting_document'] ?? null,
        ]);

        $createdId = (int) $pdo->lastInsertId();
        $fetchStatement = $pdo->prepare(
            "SELECT c.*, p.full_name AS patient_name, d.full_name AS doctor_name
             FROM consultations c
             INNER JOIN patients p ON p.id = c.patient_id
             INNER JOIN doctors d ON d.id = c.doctor_id
             WHERE c.id = :id LIMIT 1"
        );
        $fetchStatement->execute(['id' => $createdId]);

        jsonResponse(['status' => 'success', 'data' => fetchOneAssoc($fetchStatement)], 201);
    }

    jsonResponse(['status' => 'error', 'message' => 'Unsupported consultation action.'], 405);
}

function handlePrescriptions(PDO $pdo, string $method): void
{
    if ($method === 'GET') {
        $prescriptions = fetchAllAssoc(
            $pdo->query('SELECT * FROM prescriptions ORDER BY issued_on DESC, id DESC')
        );

        foreach ($prescriptions as &$prescription) {
            $itemsStatement = $pdo->prepare(
                'SELECT medicine_name AS name, dosage, instructions
                 FROM prescription_items
                 WHERE prescription_id = :prescription_id
                 ORDER BY id ASC'
            );
            $itemsStatement->execute(['prescription_id' => $prescription['id']]);
            $prescription['medicines'] = fetchAllAssoc($itemsStatement);
        }
        unset($prescription);

        jsonResponse(['status' => 'success', 'data' => $prescriptions]);
    }

    if ($method === 'POST') {
        $payload = readJsonBody();
        requireFields($payload, ['consultation_id', 'patient_name', 'doctor_name', 'issued_on']);

        $statement = $pdo->prepare(
            'INSERT INTO prescriptions (consultation_id, patient_name, doctor_name, issued_on, notes)
             VALUES (:consultation_id, :patient_name, :doctor_name, :issued_on, :notes)'
        );
        $statement->execute([
            'consultation_id' => $payload['consultation_id'],
            'patient_name' => $payload['patient_name'],
            'doctor_name' => $payload['doctor_name'],
            'issued_on' => $payload['issued_on'],
            'notes' => $payload['notes'] ?? null,
        ]);

        $prescriptionId = (int) $pdo->lastInsertId();
        $items = is_array($payload['medicines'] ?? null) ? $payload['medicines'] : [];
        $itemStatement = $pdo->prepare(
            'INSERT INTO prescription_items (prescription_id, medicine_name, dosage, instructions)
             VALUES (:prescription_id, :medicine_name, :dosage, :instructions)'
        );

        foreach ($items as $item) {
            $itemStatement->execute([
                'prescription_id' => $prescriptionId,
                'medicine_name' => $item['name'] ?? '',
                'dosage' => $item['dosage'] ?? '',
                'instructions' => $item['instructions'] ?? '',
            ]);
        }

        $fetchStatement = $pdo->prepare('SELECT * FROM prescriptions WHERE id = :id LIMIT 1');
        $fetchStatement->execute(['id' => $prescriptionId]);
        $prescription = fetchOneAssoc($fetchStatement);
        $prescription['medicines'] = $items;

        jsonResponse(['status' => 'success', 'data' => $prescription], 201);
    }

    jsonResponse(['status' => 'error', 'message' => 'Unsupported prescription action.'], 405);
}

function handleBilling(PDO $pdo, string $method, array $segments): void
{
    $subResource = $segments[1] ?? '';

    if ($subResource !== 'invoices') {
        jsonResponse(['status' => 'error', 'message' => 'Billing resource not found.'], 404);
    }

    if ($method === 'GET') {
        $statement = $pdo->query('SELECT * FROM invoices ORDER BY created_at DESC, id DESC');
        jsonResponse(['status' => 'success', 'data' => fetchAllAssoc($statement)]);
    }

    if ($method === 'POST') {
        $payload = readJsonBody();
        requireFields($payload, ['patient_name', 'consultation_charge']);

        $invoiceNumber = 'INV-' . date('Y') . '-' . str_pad((string) random_int(1, 999), 3, '0', STR_PAD_LEFT);
        $statement = $pdo->prepare(
            'INSERT INTO invoices (
                invoice_number, patient_name, consultation_charge, additional_services,
                total_amount, paid_amount, payment_status
             ) VALUES (
                :invoice_number, :patient_name, :consultation_charge, :additional_services,
                :total_amount, :paid_amount, :payment_status
             )'
        );
        $statement->execute([
            'invoice_number' => $invoiceNumber,
            'patient_name' => $payload['patient_name'],
            'consultation_charge' => $payload['consultation_charge'],
            'additional_services' => $payload['additional_services'] ?? 0,
            'total_amount' => $payload['total_amount'] ?? $payload['consultation_charge'],
            'paid_amount' => $payload['paid_amount'] ?? 0,
            'payment_status' => $payload['payment_status'] ?? 'Pending',
        ]);

        $createdId = (int) $pdo->lastInsertId();
        $fetchStatement = $pdo->prepare('SELECT * FROM invoices WHERE id = :id LIMIT 1');
        $fetchStatement->execute(['id' => $createdId]);

        jsonResponse(['status' => 'success', 'data' => fetchOneAssoc($fetchStatement)], 201);
    }

    jsonResponse(['status' => 'error', 'message' => 'Unsupported billing action.'], 405);
}

function handleReports(PDO $pdo, array $segments): void
{
    $subResource = $segments[1] ?? '';

    if ($subResource !== 'summary') {
        jsonResponse(['status' => 'error', 'message' => 'Report resource not found.'], 404);
    }

    $newPatients = (int) $pdo->query(
        "SELECT COUNT(*) FROM patients WHERE DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')"
    )->fetchColumn();
    $followUps = (int) $pdo->query(
        "SELECT COUNT(*) FROM appointments WHERE appointment_date >= CURRENT_DATE() AND status = 'Scheduled'"
    )->fetchColumn();
    $allergyCount = (int) $pdo->query(
        "SELECT COUNT(*) FROM patients WHERE allergies IS NOT NULL AND allergies <> ''"
    )->fetchColumn();

    $completedAppointments = (int) $pdo->query(
        "SELECT COUNT(*) FROM appointments WHERE status = 'Completed'"
    )->fetchColumn();
    $cancelledAppointments = (int) $pdo->query(
        "SELECT COUNT(*) FROM appointments WHERE status = 'Cancelled'"
    )->fetchColumn();
    $checkedInToday = (int) $pdo->query(
        "SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE() AND status = 'Checked In'"
    )->fetchColumn();

    $collectedRevenue = (float) $pdo->query('SELECT COALESCE(SUM(paid_amount), 0) FROM invoices')->fetchColumn();
    $outstandingBalance = (float) $pdo->query(
        'SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM invoices'
    )->fetchColumn();
    $averageInvoice = (float) $pdo->query('SELECT COALESCE(AVG(total_amount), 0) FROM invoices')->fetchColumn();

    $doctorActivity = fetchAllAssoc(
        $pdo->query(
            "SELECT d.full_name AS label, COUNT(c.id) AS value
             FROM doctors d
             LEFT JOIN consultations c ON c.doctor_id = d.id
             GROUP BY d.id, d.full_name
             ORDER BY value DESC, d.full_name ASC"
        )
    );

    jsonResponse([
        'status' => 'success',
        'data' => [
            'patientReport' => [
                ['label' => 'New patients this month', 'value' => $newPatients],
                ['label' => 'Patients with follow-up due', 'value' => $followUps],
                ['label' => 'Patients with allergies recorded', 'value' => $allergyCount],
            ],
            'appointmentReport' => [
                ['label' => 'Completed appointments', 'value' => $completedAppointments],
                ['label' => 'Cancelled appointments', 'value' => $cancelledAppointments],
                ['label' => 'Checked in today', 'value' => $checkedInToday],
            ],
            'revenueReport' => [
                ['label' => 'Collected revenue', 'value' => $collectedRevenue],
                ['label' => 'Outstanding balance', 'value' => $outstandingBalance],
                ['label' => 'Average invoice value', 'value' => round($averageInvoice, 2)],
            ],
            'doctorActivityReport' => $doctorActivity,
        ],
    ]);
}

function getNotifications(PDO $pdo): array
{
    $notifications = [];

    $appointmentStatement = $pdo->prepare(
        "SELECT p.full_name AS patient_name, d.full_name AS doctor_name, a.appointment_time
         FROM appointments a
         INNER JOIN patients p ON p.id = a.patient_id
         INNER JOIN doctors d ON d.id = a.doctor_id
         WHERE a.appointment_date = :today
         ORDER BY a.appointment_time ASC
         LIMIT 3"
    );
    $appointmentStatement->execute(['today' => currentDate()]);

    foreach (fetchAllAssoc($appointmentStatement) as $index => $appointment) {
        $notifications[] = [
            'id' => $index + 1,
            'title' => 'Upcoming appointment',
            'message' => sprintf(
                '%s has an appointment with %s at %s today.',
                $appointment['patient_name'],
                $appointment['doctor_name'],
                $appointment['appointment_time']
            ),
            'type' => 'appointment',
        ];
    }

    $followUpStatement = $pdo->query(
        "SELECT full_name, conditions FROM patients
         WHERE conditions IS NOT NULL AND conditions <> ''
         ORDER BY updated_at DESC
         LIMIT 1"
    );
    $followUp = fetchOneAssoc($followUpStatement);

    if ($followUp !== []) {
        $notifications[] = [
            'id' => count($notifications) + 1,
            'title' => 'Follow-up reminder',
            'message' => sprintf('%s should be reviewed for %s.', $followUp['full_name'], $followUp['conditions']),
            'type' => 'follow-up',
        ];
    }

    $billingStatement = $pdo->query(
        "SELECT invoice_number, total_amount, paid_amount FROM invoices
         WHERE paid_amount < total_amount
         ORDER BY created_at DESC
         LIMIT 1"
    );
    $invoice = fetchOneAssoc($billingStatement);

    if ($invoice !== []) {
        $notifications[] = [
            'id' => count($notifications) + 1,
            'title' => 'Billing reminder',
            'message' => sprintf(
                '%s has an outstanding balance of %.2f.',
                $invoice['invoice_number'],
                (float) $invoice['total_amount'] - (float) $invoice['paid_amount']
            ),
            'type' => 'billing',
        ];
    }

    return $notifications;
}
