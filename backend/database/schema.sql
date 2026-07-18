CREATE TABLE IF NOT EXISTS clinics (
  clinic_id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  location VARCHAR(255) NOT NULL,
  contact VARCHAR(40) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clinic_settings (
  clinic_id VARCHAR(64) PRIMARY KEY,
  settings_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_clinic_settings_clinic
    FOREIGN KEY (clinic_id) REFERENCES clinics(clinic_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workspace_state (
  clinic_id VARCHAR(64) PRIMARY KEY,
  current_user_id VARCHAR(64) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_workspace_state_clinic
    FOREIGN KEY (clinic_id) REFERENCES clinics(clinic_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auth_users (
  user_id VARCHAR(64) PRIMARY KEY,
  clinic_id VARCHAR(64) NOT NULL,
  clinic_user_record_id VARCHAR(64) DEFAULT NULL,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(120) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_auth_users_email (clinic_id, email),
  KEY idx_auth_users_clinic (clinic_id),
  CONSTRAINT fk_auth_users_clinic
    FOREIGN KEY (clinic_id) REFERENCES clinics(clinic_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clinic_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(64) NOT NULL,
  record_id VARCHAR(64) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_clinic_users_record (clinic_id, record_id),
  KEY idx_clinic_users_clinic (clinic_id),
  CONSTRAINT fk_clinic_users_clinic
    FOREIGN KEY (clinic_id) REFERENCES clinics(clinic_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS patients (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(64) NOT NULL,
  record_id VARCHAR(64) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_patients_record (clinic_id, record_id),
  KEY idx_patients_clinic (clinic_id),
  CONSTRAINT fk_patients_clinic
    FOREIGN KEY (clinic_id) REFERENCES clinics(clinic_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS visit_planner (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(64) NOT NULL,
  record_id VARCHAR(64) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_visit_planner_record (clinic_id, record_id),
  KEY idx_visit_planner_clinic (clinic_id),
  CONSTRAINT fk_visit_planner_clinic
    FOREIGN KEY (clinic_id) REFERENCES clinics(clinic_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS opd_consultations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(64) NOT NULL,
  record_id VARCHAR(64) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_opd_consultations_record (clinic_id, record_id),
  KEY idx_opd_consultations_clinic (clinic_id),
  CONSTRAINT fk_opd_consultations_clinic
    FOREIGN KEY (clinic_id) REFERENCES clinics(clinic_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ipd_admissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(64) NOT NULL,
  record_id VARCHAR(64) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ipd_admissions_record (clinic_id, record_id),
  KEY idx_ipd_admissions_clinic (clinic_id),
  CONSTRAINT fk_ipd_admissions_clinic
    FOREIGN KEY (clinic_id) REFERENCES clinics(clinic_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS disease_master (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(64) NOT NULL,
  record_id VARCHAR(64) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_disease_master_record (clinic_id, record_id),
  KEY idx_disease_master_clinic (clinic_id),
  CONSTRAINT fk_disease_master_clinic
    FOREIGN KEY (clinic_id) REFERENCES clinics(clinic_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medicine_catalog (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(64) NOT NULL,
  record_id VARCHAR(64) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_medicine_catalog_record (clinic_id, record_id),
  KEY idx_medicine_catalog_clinic (clinic_id),
  CONSTRAINT fk_medicine_catalog_clinic
    FOREIGN KEY (clinic_id) REFERENCES clinics(clinic_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS treatment_packages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(64) NOT NULL,
  record_id VARCHAR(64) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_treatment_packages_record (clinic_id, record_id),
  KEY idx_treatment_packages_clinic (clinic_id),
  CONSTRAINT fk_treatment_packages_clinic
    FOREIGN KEY (clinic_id) REFERENCES clinics(clinic_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS suppliers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(64) NOT NULL,
  record_id VARCHAR(64) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_suppliers_record (clinic_id, record_id),
  KEY idx_suppliers_clinic (clinic_id),
  CONSTRAINT fk_suppliers_clinic
    FOREIGN KEY (clinic_id) REFERENCES clinics(clinic_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchases (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(64) NOT NULL,
  record_id VARCHAR(64) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_purchases_record (clinic_id, record_id),
  KEY idx_purchases_clinic (clinic_id),
  CONSTRAINT fk_purchases_clinic
    FOREIGN KEY (clinic_id) REFERENCES clinics(clinic_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(64) NOT NULL,
  record_id VARCHAR(64) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_invoices_record (clinic_id, record_id),
  KEY idx_invoices_clinic (clinic_id),
  CONSTRAINT fk_invoices_clinic
    FOREIGN KEY (clinic_id) REFERENCES clinics(clinic_id)
    ON DELETE CASCADE
);
