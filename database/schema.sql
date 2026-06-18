CREATE DATABASE IF NOT EXISTS bluecare_emr
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bluecare_emr;

CREATE TABLE IF NOT EXISTS patients (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_code VARCHAR(30) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  gender VARCHAR(20) NOT NULL DEFAULT 'Other',
  date_of_birth DATE NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(150) NULL,
  blood_group VARCHAR(10) NULL,
  address TEXT NULL,
  emergency_contact VARCHAR(150) NULL,
  allergies TEXT NULL,
  conditions TEXT NULL,
  medical_history TEXT NULL,
  last_visit_at DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  specialization VARCHAR(150) NOT NULL,
  phone VARCHAR(40) NULL,
  email VARCHAR(150) NULL,
  availability VARCHAR(255) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Active',
  consultation_history TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  doctor_id INT UNSIGNED NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  reason VARCHAR(255) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Scheduled',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointments_patient
    FOREIGN KEY (patient_id) REFERENCES patients(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_appointments_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS consultations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT UNSIGNED NOT NULL,
  patient_id INT UNSIGNED NOT NULL,
  doctor_id INT UNSIGNED NOT NULL,
  consultation_date DATE NOT NULL,
  clinical_notes TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  treatment_plan TEXT NOT NULL,
  supporting_document VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_consultations_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_consultations_patient
    FOREIGN KEY (patient_id) REFERENCES patients(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_consultations_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  consultation_id INT UNSIGNED NOT NULL,
  patient_name VARCHAR(150) NOT NULL,
  doctor_name VARCHAR(150) NOT NULL,
  issued_on DATE NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_prescriptions_consultation
    FOREIGN KEY (consultation_id) REFERENCES consultations(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prescription_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  prescription_id INT UNSIGNED NOT NULL,
  medicine_name VARCHAR(150) NOT NULL,
  dosage VARCHAR(80) NOT NULL,
  instructions TEXT NOT NULL,
  CONSTRAINT fk_prescription_items_prescription
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  patient_name VARCHAR(150) NOT NULL,
  consultation_charge DECIMAL(12,2) NOT NULL DEFAULT 0,
  additional_services DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO doctors (full_name, specialization, phone, email, availability, status, consultation_history)
SELECT * FROM (
  SELECT 'Dr. Sarah Johnson', 'General Medicine', '555-300-1101', 'sarah.johnson@bluecare.test', 'Mon-Fri, 09:00-15:00', 'Active', '124 completed consultations this quarter.'
) AS seed
WHERE NOT EXISTS (
  SELECT 1 FROM doctors WHERE full_name = 'Dr. Sarah Johnson'
);

INSERT INTO doctors (full_name, specialization, phone, email, availability, status, consultation_history)
SELECT * FROM (
  SELECT 'Dr. Robert Lee', 'Cardiology', '555-300-1102', 'robert.lee@bluecare.test', 'Mon, Wed, Fri, 10:00-18:00', 'Active', '82 cardiology consultations this quarter.'
) AS seed
WHERE NOT EXISTS (
  SELECT 1 FROM doctors WHERE full_name = 'Dr. Robert Lee'
);

INSERT INTO doctors (full_name, specialization, phone, email, availability, status, consultation_history)
SELECT * FROM (
  SELECT 'Dr. Emily Carter', 'Endocrinology', '555-300-1103', 'emily.carter@bluecare.test', 'Tue-Thu, 08:30-16:30', 'Active', '61 endocrine reviews this quarter.'
) AS seed
WHERE NOT EXISTS (
  SELECT 1 FROM doctors WHERE full_name = 'Dr. Emily Carter'
);
