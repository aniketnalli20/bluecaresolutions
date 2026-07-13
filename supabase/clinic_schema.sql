create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.clinic_profile (
  id text primary key,
  name text not null,
  location text not null,
  contact text not null default '',
  current_user_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.system_settings (
  clinic_id text primary key references public.clinic_profile(id) on delete cascade,
  low_stock_threshold integer not null default 25,
  near_expiry_days integer not null default 45,
  clinic_hours text not null default '',
  receipt_footer text not null default '',
  backup_note text not null default '',
  supported_units text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.clinic_users (
  id text primary key,
  clinic_id text not null references public.clinic_profile(id) on delete cascade,
  auth_user_id uuid unique,
  name text not null,
  email text not null default '',
  role text not null,
  status text not null,
  phone text not null default '',
  shift text not null default '',
  allowed_views text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.patients (
  id text primary key,
  clinic_id text not null references public.clinic_profile(id) on delete cascade,
  patient_id text not null,
  name text not null,
  age integer not null default 0,
  gender text not null default '',
  contact_details text not null default '',
  email text not null default '',
  emergency_contact text not null default '',
  address text not null default '',
  occupation text not null default '',
  past_illness_history text not null default '',
  family_history text not null default '',
  allergy_history text not null default '',
  previous_ayurvedic_treatments text not null default '',
  current_medications text not null default '',
  follow_up_date date,
  visit_timeline jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.visit_planner (
  id text primary key,
  clinic_id text not null references public.clinic_profile(id) on delete cascade,
  patient_id text not null default '',
  patient_name text not null,
  doctor_name text not null,
  visit_type text not null,
  appointment_date date,
  appointment_time text not null default '',
  status text not null,
  therapy_plan text not null default '',
  queue_no integer not null default 0,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.opd_consultations (
  id text primary key,
  clinic_id text not null references public.clinic_profile(id) on delete cascade,
  patient_id text not null default '',
  patient_name text not null,
  doctor_name text not null,
  consultation_date date,
  disease_template_id text not null default '',
  symptoms text not null default '',
  nadi_examination text not null default '',
  diagnosis text not null default '',
  ayurvedic_assessment text not null default '',
  prescription jsonb not null default '[]'::jsonb,
  diet_recommendations text not null default '',
  lifestyle_recommendations text not null default '',
  panchakarma_recommendation text not null default '',
  follow_up_date date,
  consultation_notes text not null default '',
  billing jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ipd_admissions (
  id text primary key,
  clinic_id text not null references public.clinic_profile(id) on delete cascade,
  patient_id text not null default '',
  patient_name text not null,
  doctor_name text not null,
  admission_date date,
  bed_allocation text not null default '',
  diagnosis text not null default '',
  daily_treatment_chart jsonb not null default '[]'::jsonb,
  panchakarma_schedule text[] not null default '{}',
  medicine_administration text[] not null default '{}',
  diet_plan text not null default '',
  daily_progress text not null default '',
  discharge_summary text not null default '',
  final_invoice numeric(12,2) not null default 0,
  status text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.disease_master (
  id text primary key,
  clinic_id text not null references public.clinic_profile(id) on delete cascade,
  illness text not null,
  recommended_medicines jsonb not null default '[]'::jsonb,
  diet_advice text not null default '',
  lifestyle_advice text not null default '',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.suppliers (
  id text primary key,
  clinic_id text not null references public.clinic_profile(id) on delete cascade,
  name text not null,
  contact_person text not null default '',
  phone text not null default '',
  address text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.medicine_catalog (
  id text primary key,
  clinic_id text not null references public.clinic_profile(id) on delete cascade,
  medicine_name text not null,
  category text not null default '',
  purchase_unit text not null default '',
  dispensing_unit text not null default '',
  unit_conversion text not null default '',
  batch_number text not null default '',
  purchase_price numeric(12,2) not null default 0,
  selling_price numeric(12,2) not null default 0,
  current_stock numeric(12,2) not null default 0,
  low_stock_level numeric(12,2) not null default 0,
  expiry_date date,
  manufacturer text not null default '',
  supplier_id text not null default '',
  monthly_movement numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.treatment_packages (
  id text primary key,
  clinic_id text not null references public.clinic_profile(id) on delete cascade,
  name text not null,
  included_medicines text[] not null default '{}',
  consultation_frequency text not null default '',
  follow_up_schedule text not null default '',
  therapy_sessions integer not null default 0,
  panchakarma_sessions integer not null default 0,
  discount text not null default '',
  package_validity text not null default '',
  auto_renewal_reminder date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.purchases (
  id text primary key,
  clinic_id text not null references public.clinic_profile(id) on delete cascade,
  purchase_order_number text not null,
  supplier_id text not null default '',
  purchase_date date,
  status text not null default '',
  total_amount numeric(12,2) not null default 0,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.invoices (
  id text primary key,
  clinic_id text not null references public.clinic_profile(id) on delete cascade,
  invoice_number text not null,
  patient_id text not null default '',
  patient_name text not null,
  bill_type text not null default '',
  consultation numeric(12,2) not null default 0,
  medicines numeric(12,2) not null default 0,
  treatment_packages numeric(12,2) not null default 0,
  panchakarma numeric(12,2) not null default 0,
  therapies numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  payment_status text not null default '',
  created_at date,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_clinic_users_clinic_role on public.clinic_users (clinic_id, role);
create index if not exists idx_clinic_users_clinic_email on public.clinic_users (clinic_id, email);
create index if not exists idx_patients_clinic_name on public.patients (clinic_id, name);
create index if not exists idx_patients_follow_up_date on public.patients (clinic_id, follow_up_date);
create index if not exists idx_visit_planner_clinic_date on public.visit_planner (clinic_id, appointment_date, status);
create index if not exists idx_opd_consultations_clinic_date on public.opd_consultations (clinic_id, consultation_date desc);
create index if not exists idx_ipd_admissions_clinic_date on public.ipd_admissions (clinic_id, admission_date desc);
create index if not exists idx_disease_master_clinic_illness on public.disease_master (clinic_id, illness);
create index if not exists idx_suppliers_clinic_name on public.suppliers (clinic_id, name);
create index if not exists idx_medicine_catalog_clinic_name on public.medicine_catalog (clinic_id, medicine_name);
create index if not exists idx_medicine_catalog_expiry on public.medicine_catalog (clinic_id, expiry_date);
create index if not exists idx_treatment_packages_clinic_name on public.treatment_packages (clinic_id, name);
create index if not exists idx_purchases_clinic_date on public.purchases (clinic_id, purchase_date desc);
create index if not exists idx_invoices_clinic_date on public.invoices (clinic_id, created_at desc);

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_seeded_bootstrap_email()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = any (
    array[
      'admin@svkini.clinic',
      'kavya.iyer@svkini.clinic',
      'rohan.sharma@svkini.clinic',
      'anjali.das@svkini.clinic'
    ]
  );
$$;

create or replace function private.is_current_clinic_member(target_clinic_id text)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.clinic_users as clinic_user
    where clinic_user.clinic_id = target_clinic_id
      and clinic_user.status = 'Active'
      and (
        clinic_user.auth_user_id = (select auth.uid())
        or lower(clinic_user.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$;

create or replace function private.is_current_clinic_admin(target_clinic_id text)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.clinic_users as clinic_user
    where clinic_user.clinic_id = target_clinic_id
      and clinic_user.status = 'Active'
      and clinic_user.role in ('Clinic Administrator', 'Chief Ayurvedic Physician')
      and (
        clinic_user.auth_user_id = (select auth.uid())
        or lower(clinic_user.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$;

create or replace function private.is_clinic_bootstrap_open(target_clinic_id text)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select
    (select auth.uid()) is not null
    and private.is_seeded_bootstrap_email()
    and not exists (
      select 1
      from public.clinic_users as clinic_user
      where clinic_user.clinic_id = target_clinic_id
    );
$$;

revoke all on function private.is_seeded_bootstrap_email() from public;
revoke all on function private.is_current_clinic_member(text) from public;
revoke all on function private.is_current_clinic_admin(text) from public;
revoke all on function private.is_clinic_bootstrap_open(text) from public;

grant execute on function private.is_seeded_bootstrap_email() to authenticated, service_role;
grant execute on function private.is_current_clinic_member(text) to authenticated, service_role;
grant execute on function private.is_current_clinic_admin(text) to authenticated, service_role;
grant execute on function private.is_clinic_bootstrap_open(text) to authenticated, service_role;

do $$
declare
  table_name text;
begin
  for table_name in
    select unnest(array[
      'clinic_profile',
      'system_settings',
      'clinic_users',
      'patients',
      'visit_planner',
      'opd_consultations',
      'ipd_admissions',
      'disease_master',
      'suppliers',
      'medicine_catalog',
      'treatment_packages',
      'purchases',
      'invoices'
    ])
  loop
    execute format('revoke all on public.%I from anon', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('grant select, insert, update, delete on public.%I to service_role', table_name);
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_select', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete', table_name);
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end
$$;

drop policy if exists clinic_profile_member_select on public.clinic_profile;
drop policy if exists clinic_profile_bootstrap_insert on public.clinic_profile;
drop policy if exists clinic_profile_admin_update on public.clinic_profile;
drop policy if exists clinic_profile_admin_delete on public.clinic_profile;

create policy clinic_profile_member_select
on public.clinic_profile
for select
to authenticated
using (
  private.is_current_clinic_member(id)
  or private.is_clinic_bootstrap_open(id)
);

create policy clinic_profile_bootstrap_insert
on public.clinic_profile
for insert
to authenticated
with check (private.is_clinic_bootstrap_open(id));

create policy clinic_profile_admin_update
on public.clinic_profile
for update
to authenticated
using (private.is_current_clinic_admin(id))
with check (private.is_current_clinic_admin(id));

create policy clinic_profile_admin_delete
on public.clinic_profile
for delete
to authenticated
using (private.is_current_clinic_admin(id));

drop policy if exists system_settings_member_select on public.system_settings;
drop policy if exists system_settings_bootstrap_insert on public.system_settings;
drop policy if exists system_settings_admin_update on public.system_settings;
drop policy if exists system_settings_admin_delete on public.system_settings;

create policy system_settings_member_select
on public.system_settings
for select
to authenticated
using (
  private.is_current_clinic_member(clinic_id)
  or private.is_clinic_bootstrap_open(clinic_id)
);

create policy system_settings_bootstrap_insert
on public.system_settings
for insert
to authenticated
with check (
  private.is_clinic_bootstrap_open(clinic_id)
  or private.is_current_clinic_admin(clinic_id)
);

create policy system_settings_admin_update
on public.system_settings
for update
to authenticated
using (private.is_current_clinic_admin(clinic_id))
with check (private.is_current_clinic_admin(clinic_id));

create policy system_settings_admin_delete
on public.system_settings
for delete
to authenticated
using (private.is_current_clinic_admin(clinic_id));

drop policy if exists clinic_users_member_select on public.clinic_users;
drop policy if exists clinic_users_bootstrap_or_admin_insert on public.clinic_users;
drop policy if exists clinic_users_admin_update on public.clinic_users;
drop policy if exists clinic_users_admin_delete on public.clinic_users;

create policy clinic_users_member_select
on public.clinic_users
for select
to authenticated
using (
  private.is_current_clinic_member(clinic_id)
  or private.is_clinic_bootstrap_open(clinic_id)
);

create policy clinic_users_bootstrap_or_admin_insert
on public.clinic_users
for insert
to authenticated
with check (
  private.is_clinic_bootstrap_open(clinic_id)
  or private.is_current_clinic_admin(clinic_id)
);

create policy clinic_users_admin_update
on public.clinic_users
for update
to authenticated
using (private.is_current_clinic_admin(clinic_id))
with check (private.is_current_clinic_admin(clinic_id));

create policy clinic_users_admin_delete
on public.clinic_users
for delete
to authenticated
using (private.is_current_clinic_admin(clinic_id));

drop policy if exists patients_member_select on public.patients;
drop policy if exists patients_member_insert on public.patients;
drop policy if exists patients_member_update on public.patients;
drop policy if exists patients_member_delete on public.patients;

create policy patients_member_select
on public.patients
for select
to authenticated
using (private.is_current_clinic_member(clinic_id));

create policy patients_member_insert
on public.patients
for insert
to authenticated
with check (private.is_current_clinic_member(clinic_id));

create policy patients_member_update
on public.patients
for update
to authenticated
using (private.is_current_clinic_member(clinic_id))
with check (private.is_current_clinic_member(clinic_id));

create policy patients_member_delete
on public.patients
for delete
to authenticated
using (private.is_current_clinic_member(clinic_id));

drop policy if exists visit_planner_member_select on public.visit_planner;
drop policy if exists visit_planner_member_insert on public.visit_planner;
drop policy if exists visit_planner_member_update on public.visit_planner;
drop policy if exists visit_planner_member_delete on public.visit_planner;

create policy visit_planner_member_select
on public.visit_planner
for select
to authenticated
using (private.is_current_clinic_member(clinic_id));

create policy visit_planner_member_insert
on public.visit_planner
for insert
to authenticated
with check (private.is_current_clinic_member(clinic_id));

create policy visit_planner_member_update
on public.visit_planner
for update
to authenticated
using (private.is_current_clinic_member(clinic_id))
with check (private.is_current_clinic_member(clinic_id));

create policy visit_planner_member_delete
on public.visit_planner
for delete
to authenticated
using (private.is_current_clinic_member(clinic_id));

drop policy if exists opd_consultations_member_select on public.opd_consultations;
drop policy if exists opd_consultations_member_insert on public.opd_consultations;
drop policy if exists opd_consultations_member_update on public.opd_consultations;
drop policy if exists opd_consultations_member_delete on public.opd_consultations;

create policy opd_consultations_member_select
on public.opd_consultations
for select
to authenticated
using (private.is_current_clinic_member(clinic_id));

create policy opd_consultations_member_insert
on public.opd_consultations
for insert
to authenticated
with check (private.is_current_clinic_member(clinic_id));

create policy opd_consultations_member_update
on public.opd_consultations
for update
to authenticated
using (private.is_current_clinic_member(clinic_id))
with check (private.is_current_clinic_member(clinic_id));

create policy opd_consultations_member_delete
on public.opd_consultations
for delete
to authenticated
using (private.is_current_clinic_member(clinic_id));

drop policy if exists ipd_admissions_member_select on public.ipd_admissions;
drop policy if exists ipd_admissions_member_insert on public.ipd_admissions;
drop policy if exists ipd_admissions_member_update on public.ipd_admissions;
drop policy if exists ipd_admissions_member_delete on public.ipd_admissions;

create policy ipd_admissions_member_select
on public.ipd_admissions
for select
to authenticated
using (private.is_current_clinic_member(clinic_id));

create policy ipd_admissions_member_insert
on public.ipd_admissions
for insert
to authenticated
with check (private.is_current_clinic_member(clinic_id));

create policy ipd_admissions_member_update
on public.ipd_admissions
for update
to authenticated
using (private.is_current_clinic_member(clinic_id))
with check (private.is_current_clinic_member(clinic_id));

create policy ipd_admissions_member_delete
on public.ipd_admissions
for delete
to authenticated
using (private.is_current_clinic_member(clinic_id));

drop policy if exists invoices_member_select on public.invoices;
drop policy if exists invoices_member_insert on public.invoices;
drop policy if exists invoices_member_update on public.invoices;
drop policy if exists invoices_member_delete on public.invoices;

create policy invoices_member_select
on public.invoices
for select
to authenticated
using (private.is_current_clinic_member(clinic_id));

create policy invoices_member_insert
on public.invoices
for insert
to authenticated
with check (private.is_current_clinic_member(clinic_id));

create policy invoices_member_update
on public.invoices
for update
to authenticated
using (private.is_current_clinic_member(clinic_id))
with check (private.is_current_clinic_member(clinic_id));

create policy invoices_member_delete
on public.invoices
for delete
to authenticated
using (private.is_current_clinic_member(clinic_id));

drop policy if exists disease_master_member_select on public.disease_master;
drop policy if exists disease_master_admin_insert on public.disease_master;
drop policy if exists disease_master_admin_update on public.disease_master;
drop policy if exists disease_master_admin_delete on public.disease_master;

create policy disease_master_member_select
on public.disease_master
for select
to authenticated
using (private.is_current_clinic_member(clinic_id));

create policy disease_master_admin_insert
on public.disease_master
for insert
to authenticated
with check (private.is_current_clinic_admin(clinic_id));

create policy disease_master_admin_update
on public.disease_master
for update
to authenticated
using (private.is_current_clinic_admin(clinic_id))
with check (private.is_current_clinic_admin(clinic_id));

create policy disease_master_admin_delete
on public.disease_master
for delete
to authenticated
using (private.is_current_clinic_admin(clinic_id));

drop policy if exists suppliers_member_select on public.suppliers;
drop policy if exists suppliers_admin_insert on public.suppliers;
drop policy if exists suppliers_admin_update on public.suppliers;
drop policy if exists suppliers_admin_delete on public.suppliers;

create policy suppliers_member_select
on public.suppliers
for select
to authenticated
using (private.is_current_clinic_member(clinic_id));

create policy suppliers_admin_insert
on public.suppliers
for insert
to authenticated
with check (private.is_current_clinic_admin(clinic_id));

create policy suppliers_admin_update
on public.suppliers
for update
to authenticated
using (private.is_current_clinic_admin(clinic_id))
with check (private.is_current_clinic_admin(clinic_id));

create policy suppliers_admin_delete
on public.suppliers
for delete
to authenticated
using (private.is_current_clinic_admin(clinic_id));

drop policy if exists medicine_catalog_member_select on public.medicine_catalog;
drop policy if exists medicine_catalog_admin_insert on public.medicine_catalog;
drop policy if exists medicine_catalog_admin_update on public.medicine_catalog;
drop policy if exists medicine_catalog_admin_delete on public.medicine_catalog;

create policy medicine_catalog_member_select
on public.medicine_catalog
for select
to authenticated
using (private.is_current_clinic_member(clinic_id));

create policy medicine_catalog_admin_insert
on public.medicine_catalog
for insert
to authenticated
with check (private.is_current_clinic_admin(clinic_id));

create policy medicine_catalog_admin_update
on public.medicine_catalog
for update
to authenticated
using (private.is_current_clinic_admin(clinic_id))
with check (private.is_current_clinic_admin(clinic_id));

create policy medicine_catalog_admin_delete
on public.medicine_catalog
for delete
to authenticated
using (private.is_current_clinic_admin(clinic_id));

drop policy if exists treatment_packages_member_select on public.treatment_packages;
drop policy if exists treatment_packages_admin_insert on public.treatment_packages;
drop policy if exists treatment_packages_admin_update on public.treatment_packages;
drop policy if exists treatment_packages_admin_delete on public.treatment_packages;

create policy treatment_packages_member_select
on public.treatment_packages
for select
to authenticated
using (private.is_current_clinic_member(clinic_id));

create policy treatment_packages_admin_insert
on public.treatment_packages
for insert
to authenticated
with check (private.is_current_clinic_admin(clinic_id));

create policy treatment_packages_admin_update
on public.treatment_packages
for update
to authenticated
using (private.is_current_clinic_admin(clinic_id))
with check (private.is_current_clinic_admin(clinic_id));

create policy treatment_packages_admin_delete
on public.treatment_packages
for delete
to authenticated
using (private.is_current_clinic_admin(clinic_id));

drop policy if exists purchases_member_select on public.purchases;
drop policy if exists purchases_admin_insert on public.purchases;
drop policy if exists purchases_admin_update on public.purchases;
drop policy if exists purchases_admin_delete on public.purchases;

create policy purchases_member_select
on public.purchases
for select
to authenticated
using (private.is_current_clinic_member(clinic_id));

create policy purchases_admin_insert
on public.purchases
for insert
to authenticated
with check (private.is_current_clinic_admin(clinic_id));

create policy purchases_admin_update
on public.purchases
for update
to authenticated
using (private.is_current_clinic_admin(clinic_id))
with check (private.is_current_clinic_admin(clinic_id));

create policy purchases_admin_delete
on public.purchases
for delete
to authenticated
using (private.is_current_clinic_admin(clinic_id));

comment on table public.clinic_profile is
'Single-clinic profile table for the S.V. Kini Ayurvedic clinic workspace.';

comment on table public.clinic_users is
'Clinic user table. auth_user_id can be linked to a Supabase auth user for session-based role mapping.';

comment on schema public is
'Single-clinic schema for the S.V. Kini Ayurvedic clinic workspace. RLS now allows authenticated clinic members only, with admin-only mutation on admin-managed tables.';
