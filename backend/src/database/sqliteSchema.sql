-- ==============================================================================
-- CaafimaadHub — SQLite Compatible DDL Schema
-- ==============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'NGO',
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  country TEXT DEFAULT 'Somalia',
  latitude REAL,
  longitude REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS districts (
  id TEXT PRIMARY KEY,
  region_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS communities (
  id TEXT PRIMARY KEY,
  district_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  population_estimate INTEGER DEFAULT 0,
  latitude REAL,
  longitude REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  district_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  facility_type TEXT DEFAULT 'HEALTH_CENTER',
  contact_person TEXT,
  phone TEXT,
  latitude REAL,
  longitude REAL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  region_id TEXT,
  district_id TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  gender TEXT DEFAULT 'OTHER',
  date_of_birth TEXT,
  profile_image_url TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'Public',
  status TEXT DEFAULT 'active',
  region TEXT DEFAULT 'Banadir',
  district TEXT DEFAULT 'Hodan',
  village_neighbourhood TEXT,
  latitude REAL,
  longitude REAL,
  education_level TEXT,
  languages_spoken TEXT,
  motivation_background TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  preferred_language TEXT DEFAULT 'so',
  is_active INTEGER NOT NULL DEFAULT 1,
  is_suspended INTEGER NOT NULL DEFAULT 0,
  suspension_reason TEXT,
  last_login TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_system_role INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  module TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS volunteers (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  volunteer_id TEXT UNIQUE NOT NULL,
  organization_id TEXT,
  gender TEXT NOT NULL,
  date_of_birth TEXT,
  region_id TEXT NOT NULL,
  district_id TEXT NOT NULL,
  community_id TEXT,
  village_name TEXT,
  address TEXT,
  latitude REAL,
  longitude REAL,
  education_level TEXT,
  health_qualifications TEXT,
  previous_experience TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  availability_status TEXT DEFAULT 'AVAILABLE',
  status TEXT DEFAULT 'PENDING',
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_notes TEXT,
  profile_completed INTEGER DEFAULT 0,
  registration_date TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE RESTRICT,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE RESTRICT,
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS volunteer_skills (
  id TEXT PRIMARY KEY,
  volunteer_id TEXT NOT NULL,
  skill TEXT NOT NULL,
  FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS volunteer_languages (
  id TEXT PRIMARY KEY,
  volunteer_id TEXT NOT NULL,
  language TEXT NOT NULL,
  proficiency TEXT DEFAULT 'FLUENT',
  FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  objective TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  region_id TEXT NOT NULL,
  district_id TEXT,
  target_communities TEXT,
  target_population INTEGER DEFAULT 0,
  budget REAL DEFAULT 0.0,
  currency TEXT DEFAULT 'USD',
  manager_id TEXT,
  status TEXT DEFAULT 'DRAFT',
  priority TEXT DEFAULT 'MEDIUM',
  required_volunteers INTEGER DEFAULT 0,
  required_supplies TEXT,
  training_requirements TEXT,
  attachments TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE RESTRICT,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS campaign_volunteers (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  volunteer_id TEXT NOT NULL,
  status TEXT DEFAULT 'ASSIGNED',
  assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (campaign_id, volunteer_id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  campaign_id TEXT,
  organization_id TEXT,
  title TEXT NOT NULL,
  task_type TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  priority TEXT DEFAULT 'MEDIUM',
  status TEXT DEFAULT 'ASSIGNED',
  region_id TEXT NOT NULL,
  district_id TEXT NOT NULL,
  community_id TEXT,
  target_location_name TEXT,
  latitude REAL,
  longitude REAL,
  start_datetime TEXT NOT NULL,
  deadline_datetime TEXT NOT NULL,
  requires_field_data INTEGER DEFAULT 1,
  field_form_id TEXT,
  required_training_id TEXT,
  required_supplies TEXT,
  is_recurring INTEGER DEFAULT 0,
  recurrence_pattern TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE RESTRICT,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE RESTRICT,
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS task_assignments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  volunteer_id TEXT NOT NULL,
  status TEXT DEFAULT 'ASSIGNED',
  rejection_reason TEXT,
  assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
  accepted_at TEXT,
  completed_at TEXT,
  UNIQUE (task_id, volunteer_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  volunteer_id TEXT NOT NULL,
  task_id TEXT,
  campaign_id TEXT,
  title TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_available INTEGER DEFAULT 1,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS field_forms (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  schema_json TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  version INTEGER DEFAULT 1,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS field_form_fields (
  id TEXT PRIMARY KEY,
  field_form_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL,
  options_json TEXT,
  is_required INTEGER DEFAULT 0,
  validation_rules TEXT,
  order_index INTEGER DEFAULT 0,
  FOREIGN KEY (field_form_id) REFERENCES field_forms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS field_submissions (
  id TEXT PRIMARY KEY,
  local_id TEXT,
  volunteer_id TEXT NOT NULL,
  task_id TEXT,
  campaign_id TEXT,
  field_form_id TEXT NOT NULL,
  submission_datetime TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  accuracy_meters REAL,
  location_description TEXT,
  payload_data TEXT NOT NULL,
  summary_metrics TEXT,
  sync_status TEXT DEFAULT 'SYNCED',
  sync_attempts INTEGER DEFAULT 1,
  last_sync_time TEXT DEFAULT CURRENT_TIMESTAMP,
  review_status TEXT DEFAULT 'PENDING',
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_comments TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE RESTRICT,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (field_form_id) REFERENCES field_forms(id) ON DELETE RESTRICT,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS training_courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  estimated_hours REAL DEFAULT 1.0,
  passing_score_percentage INTEGER DEFAULT 80,
  is_published INTEGER DEFAULT 1,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS training_lessons (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  lesson_order INTEGER NOT NULL DEFAULT 1,
  content_type TEXT NOT NULL DEFAULT 'TEXT',
  body_content TEXT,
  media_url TEXT,
  duration_minutes INTEGER DEFAULT 15,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES training_courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS training_enrollments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  volunteer_id TEXT NOT NULL,
  status TEXT DEFAULT 'ENROLLED',
  progress_percentage INTEGER DEFAULT 0,
  quiz_score INTEGER DEFAULT NULL,
  completed_at TEXT NULL,
  enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (course_id, volunteer_id),
  FOREIGN KEY (course_id) REFERENCES training_courses(id) ON DELETE CASCADE,
  FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS training_quizzes (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER DEFAULT 20,
  passing_score INTEGER DEFAULT 80,
  FOREIGN KEY (course_id) REFERENCES training_courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS training_questions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'SINGLE_CHOICE',
  points INTEGER DEFAULT 10,
  order_index INTEGER DEFAULT 0,
  FOREIGN KEY (quiz_id) REFERENCES training_quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS training_answers (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  is_correct INTEGER DEFAULT 0,
  explanation TEXT,
  FOREIGN KEY (question_id) REFERENCES training_questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  certificate_number TEXT UNIQUE NOT NULL,
  volunteer_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  expiry_date TEXT,
  score_achieved INTEGER NOT NULL,
  verification_code TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES training_courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory_locations (
  id TEXT PRIMARY KEY,
  facility_id TEXT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  region_id TEXT NOT NULL,
  district_id TEXT NOT NULL,
  address TEXT,
  FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE SET NULL,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE RESTRICT,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  item_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit_of_measure TEXT NOT NULL DEFAULT 'units',
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  minimum_stock_level INTEGER NOT NULL DEFAULT 10,
  location_id TEXT,
  batch_number TEXT,
  expiry_date TEXT,
  supplier_name TEXT,
  unit_cost REAL DEFAULT 0.00,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES inventory_locations(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  from_location_id TEXT,
  to_location_id TEXT,
  reference_number TEXT,
  performed_by TEXT NOT NULL,
  notes TEXT,
  transaction_datetime TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT,
  FOREIGN KEY (from_location_id) REFERENCES inventory_locations(id) ON DELETE SET NULL,
  FOREIGN KEY (to_location_id) REFERENCES inventory_locations(id) ON DELETE SET NULL,
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS supply_requests (
  id TEXT PRIMARY KEY,
  request_code TEXT UNIQUE NOT NULL,
  volunteer_id TEXT NOT NULL,
  task_id TEXT,
  campaign_id TEXT,
  item_id TEXT NOT NULL,
  requested_quantity INTEGER NOT NULL,
  approved_quantity INTEGER DEFAULT 0,
  status TEXT DEFAULT 'REQUESTED',
  urgency TEXT DEFAULT 'MEDIUM',
  reason TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  admin_remarks TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE RESTRICT,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  action_url TEXT,
  is_read INTEGER DEFAULT 0,
  read_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notification_templates (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  channel TEXT DEFAULT 'IN_APP',
  title_template_en TEXT,
  title_template_so TEXT,
  body_template_en TEXT NOT NULL,
  body_template_so TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sms_logs (
  id TEXT PRIMARY KEY,
  recipient_phone TEXT NOT NULL,
  recipient_user_id TEXT,
  message_body TEXT NOT NULL,
  provider TEXT DEFAULT 'MOCK_PROVIDER',
  provider_message_id TEXT,
  status TEXT DEFAULT 'QUEUED',
  error_details TEXT,
  retry_count INTEGER DEFAULT 0,
  sent_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  region_id TEXT,
  district_id TEXT,
  location_name TEXT,
  reporter_name TEXT,
  reporter_phone TEXT,
  reporter_email TEXT,
  status TEXT DEFAULT 'NEW',
  admin_notes TEXT,
  resolved_by TEXT,
  resolved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS emergency_reports (
  id TEXT PRIMARY KEY,
  report_code TEXT UNIQUE NOT NULL,
  emergency_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'HIGH',
  description TEXT NOT NULL,
  suspected_cases_count INTEGER DEFAULT 0,
  region_id TEXT NOT NULL,
  district_id TEXT NOT NULL,
  community_name TEXT,
  latitude REAL,
  longitude REAL,
  reporter_type TEXT NOT NULL DEFAULT 'VOLUNTEER',
  reporter_user_id TEXT,
  reporter_name TEXT,
  reporter_phone TEXT,
  status TEXT DEFAULT 'REPORTED',
  investigation_notes TEXT,
  action_taken TEXT,
  resolved_by TEXT,
  resolved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE RESTRICT,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE RESTRICT,
  FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_email TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_id TEXT,
  old_values TEXT,
  new_values TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS system_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  category TEXT DEFAULT 'GENERAL',
  description TEXT,
  is_public INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
