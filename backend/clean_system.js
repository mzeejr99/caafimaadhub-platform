require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./src/config/db');

async function runCleanReset() {
  console.log('=== CaafimaadHub Clean Fresh System Initialization ===');
  db.initDb();
  const clientType = db.getClientType();
  console.log(`Database Client: ${clientType}`);

  const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);
  const superPasswordHash = bcrypt.hashSync('super#123', 10);
  const adminPasswordHash = bcrypt.hashSync('Admin123!', 10);
  const opPasswordHash = bcrypt.hashSync('Operational123!', 10);
  const analystPasswordHash = bcrypt.hashSync('Analyst123!', 10);
  const volPasswordHash = bcrypt.hashSync('Volunteer123!', 10);

  // 1. Wipe all data completely
  const tables = [
    'audit_logs', 'attachments', 'sms_logs', 'notifications', 'notification_templates',
    'supply_requests', 'inventory_transactions', 'inventory_locations', 'inventory_items',
    'certificates', 'training_answers', 'training_questions', 'training_quizzes',
    'training_enrollments', 'training_materials', 'training_lessons', 'training_courses',
    'field_submission_values', 'field_submissions', 'field_form_fields', 'field_forms',
    'schedules', 'task_assignments', 'tasks', 'campaign_volunteers', 'campaigns',
    'volunteer_languages', 'volunteer_skills', 'volunteers', 'emergency_reports',
    'feedback', 'facilities', 'communities', 'districts', 'regions',
    'user_roles', 'role_permissions', 'permissions', 'roles', 'users', 'organizations',
    'system_settings'
  ];

  if (clientType === 'sqlite') {
    const sqliteDb = db.getSqliteDb();
    sqliteDb.pragma('foreign_keys = OFF');
    for (const t of tables) {
      try { sqliteDb.exec(`DROP TABLE IF EXISTS ${t};`); } catch (e) {}
    }
    const schemaSql = fs.readFileSync(path.join(__dirname, 'src/database/sqliteSchema.sql'), 'utf8');
    sqliteDb.exec(schemaSql);
  } else {
    await db.execute('SET FOREIGN_KEY_CHECKS = 0;');
    for (const t of tables) {
      try { await db.execute(`DELETE FROM ${t};`); } catch (e) {}
    }
  }

  console.log('-> Cleared all existing database tables.');

  // 2. Insert Organizations
  const orgs = [
    ['org-fmoh-001', 'Federal Ministry of Health Somalia', 'FMOH', 'MOH', 'info@moh.gov.so', '+252 61 5000001', 'Corso Somalia, Shangani, Mogadishu, Somalia'],
    ['org-srcs-002', 'Somali Red Crescent Society', 'SRCS', 'NGO', 'contact@srcs.so', '+252 61 5000002', 'KM4 Area, Wadajir, Mogadishu, Somalia'],
    ['org-unicef-003', 'UNICEF Somalia Health Field Mission', 'UNICEF-SOM', 'UN_AGENCY', 'somalia@unicef.org', '+252 61 5000003', 'MIA Compound, Mogadishu, Somalia'],
    ['org-who-004', 'World Health Organization Somalia', 'WHO-SOM', 'UN_AGENCY', 'who-som@who.int', '+252 61 5000004', 'MIA Compound, Mogadishu, Somalia']
  ];
  for (const o of orgs) {
    await db.execute(
      `INSERT INTO organizations (id, name, code, type, contact_email, contact_phone, address, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
      o
    );
  }

  // 3. Insert Regions
  const regions = [
    ['reg-banadir', 'Banaadir', 'SOM-BAN', 'Somalia', 2.046934, 45.318162],
    ['reg-hiran', 'Hirshabelle (Hiiraan)', 'SOM-HIR', 'Somalia', 4.743825, 45.343750],
    ['reg-bay', 'Koonfur Galbeed (Bay)', 'SOM-BAY', 'Somalia', 3.119100, 43.649200],
    ['reg-gedo', 'Gedo', 'SOM-GED', 'Somalia', 3.784200, 42.348600],
    ['reg-bari', 'Bari', 'SOM-BAR', 'Somalia', 10.416667, 49.750000],
    ['reg-mudug', 'Mudug', 'SOM-MUD', 'Somalia', 6.769700, 47.430800]
  ];
  for (const r of regions) {
    await db.execute(
      `INSERT INTO regions (id, name, code, country, latitude, longitude, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      r
    );
  }

  // 4. Insert Districts
  const districts = [
    ['dist-hodan', 'reg-banadir', 'Hodan', 'BAN-HOD', 2.0438, 45.3121],
    ['dist-waberi', 'reg-banadir', 'Waberi', 'BAN-WAB', 2.0295, 45.3347],
    ['dist-yaqshid', 'reg-banadir', 'Yaqshid', 'BAN-YAQ', 2.0673, 45.3475],
    ['dist-beledweyne', 'reg-hiran', 'Beledweyne', 'HIR-BEL', 4.7358, 45.2036],
    ['dist-baidoa', 'reg-bay', 'Baydhabo', 'BAY-BAI', 3.1138, 43.6500]
  ];
  for (const d of districts) {
    await db.execute(
      `INSERT INTO districts (id, region_id, name, code, latitude, longitude, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      d
    );
  }

  // 5. Insert Facilities
  const facilities = [
    ['fac-banadir-hosp', 'org-fmoh-001', 'dist-hodan', 'Banadir Mother & Child Hospital', 'FAC-BND-01', 'HOSPITAL', 'Dr. Maryan Qasim', '+252 61 5551101', 2.0455, 45.3135],
    ['fac-madina-hosp', 'org-fmoh-001', 'dist-hodan', 'Madina Referral Hospital', 'FAC-MDN-02', 'HOSPITAL', 'Dr. Mohamed Yusuf', '+252 61 5551102', 2.0390, 45.3080],
    ['fac-beledweyne-gh', 'org-fmoh-001', 'dist-beledweyne', 'Beledweyne Regional General Hospital', 'FAC-BWN-05', 'HOSPITAL', 'Dr. Ahmed Diriye', '+252 61 5551105', 4.7360, 45.2040],
    ['fac-baidoa-rh', 'org-fmoh-001', 'dist-baidoa', 'Baidoa Regional Hospital', 'FAC-BAI-07', 'HOSPITAL', 'Dr. Hassan Ali', '+252 61 5551107', 3.1150, 43.6510]
  ];
  for (const f of facilities) {
    await db.execute(
      `INSERT INTO facilities (id, organization_id, district_id, name, code, facility_type, contact_person, phone, latitude, longitude, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
      f
    );
  }

  // 6. Insert Roles
  const roles = [
    ['role-super-admin', 'SUPER_ADMIN', 'Super Administrator', 'Full unrestricted platform administration and configuration.', 1],
    ['role-admin', 'ADMIN', 'Operational Administrator', 'Management of users, audit trails, campaigns, volunteers, and settings.', 1],
    ['role-operational', 'OPERATIONAL', 'Operations & Logistics Manager', 'Field campaigns coordination, volunteer rosters, task dispatch, inventory.', 1],
    ['role-analyst', 'DATA_ANALYST', 'Data & Health Analyst', 'Epidemiological surveillance, field data analysis, DHIS2 reporting, GIS maps.', 1],
    ['role-volunteer', 'VOLUNTEER', 'Community Health Volunteer', 'Field volunteer executing assigned tasks, patient screening, supply requests.', 1],
    ['role-public', 'PUBLIC_USER', 'Public Community User', 'Access public health campaigns, certificates, submit feedback and emergency alerts.', 1]
  ];
  for (const r of roles) {
    await db.execute(
      `INSERT INTO roles (id, name, display_name, description, is_system_role, created_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      r
    );
  }

  // 7. Insert Permissions
  const permissions = [
    ['p-01', 'users.view', 'USERS', 'View user accounts'],
    ['p-02', 'users.create', 'USERS', 'Create user accounts'],
    ['p-03', 'users.update', 'USERS', 'Update user profiles and roles'],
    ['p-04', 'users.delete', 'USERS', 'Delete user accounts'],
    ['p-05', 'volunteers.view', 'VOLUNTEERS', 'View volunteer directory'],
    ['p-06', 'volunteers.create', 'VOLUNTEERS', 'Register volunteers'],
    ['p-07', 'volunteers.update', 'VOLUNTEERS', 'Edit volunteer profiles'],
    ['p-08', 'volunteers.delete', 'VOLUNTEERS', 'Delete volunteers'],
    ['p-09', 'campaigns.manage', 'CAMPAIGNS', 'Manage health campaigns'],
    ['p-10', 'tasks.manage', 'TASKS', 'Dispatch and assign field tasks'],
    ['p-11', 'inventory.manage', 'INVENTORY', 'Manage medical supplies depot'],
    ['p-12', 'emergencies.manage', 'EMERGENCIES', 'Investigate disease outbreaks'],
    ['p-13', 'feedback.manage', 'FEEDBACK', 'Manage community feedback'],
    ['p-14', 'notifications.send', 'NOTIFICATIONS', 'Send SMS broadcasts and notifications'],
    ['p-15', 'analytics.view', 'ANALYTICS', 'Access analytics and reports']
  ];
  for (const p of permissions) {
    await db.execute(
      `INSERT INTO permissions (id, code, module, description, created_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      p
    );
  }

  // Link all permissions to super-admin & admin
  for (const p of permissions) {
    await db.execute(`INSERT INTO role_permissions (role_id, permission_id) VALUES ('role-super-admin', ?)`, [p[0]]);
    await db.execute(`INSERT INTO role_permissions (role_id, permission_id) VALUES ('role-admin', ?)`, [p[0]]);
  }
  // Operational permissions
  const opPerms = ['p-05', 'p-06', 'p-07', 'p-09', 'p-10', 'p-11', 'p-12', 'p-13', 'p-14', 'p-15'];
  for (const pid of opPerms) {
    await db.execute(`INSERT INTO role_permissions (role_id, permission_id) VALUES ('role-operational', ?)`, [pid]);
  }
  // Analyst permissions
  const analystPerms = ['p-05', 'p-09', 'p-12', 'p-13', 'p-15'];
  for (const pid of analystPerms) {
    await db.execute(`INSERT INTO role_permissions (role_id, permission_id) VALUES ('role-analyst', ?)`, [pid]);
  }

  // 8. Insert Clean Users (5 official production roles)
  const users = [
    {
      id: 'usr-superadmin',
      orgId: 'org-fmoh-001',
      regionId: 'reg-banadir',
      districtId: 'dist-hodan',
      fullName: 'Super Administrator',
      email: 'superadmin@gmail.com',
      phone: '+252615000001',
      hash: superPasswordHash,
      role: 'Superadmin',
      status: 'active',
      roleId: 'role-super-admin'
    },
    {
      id: 'usr-admin',
      orgId: 'org-fmoh-001',
      regionId: 'reg-banadir',
      districtId: 'dist-hodan',
      fullName: 'Eng. Abdullahi Warsame',
      email: 'admin@caafimaadhub.so',
      phone: '+252615000002',
      hash: adminPasswordHash,
      role: 'Admin',
      status: 'active',
      roleId: 'role-admin'
    },
    {
      id: 'usr-operational',
      orgId: 'org-fmoh-001',
      regionId: 'reg-banadir',
      districtId: 'dist-hodan',
      fullName: 'Eng. Ahmed Nor Osman',
      email: 'operational@caafimaadhub.so',
      phone: '+252615000003',
      hash: opPasswordHash,
      role: 'Admin',
      status: 'active',
      roleId: 'role-operational'
    },
    {
      id: 'usr-analyst',
      orgId: 'org-fmoh-001',
      regionId: 'reg-banadir',
      districtId: 'dist-hodan',
      fullName: 'Dr. Fartuun Salad',
      email: 'analyst@caafimaadhub.so',
      phone: '+252615000004',
      hash: analystPasswordHash,
      role: 'DataAnalyst',
      status: 'active',
      roleId: 'role-analyst'
    },
    {
      id: 'usr-volunteer',
      orgId: 'org-fmoh-001',
      regionId: 'reg-banadir',
      districtId: 'dist-hodan',
      fullName: 'Amina Hassan Ali',
      email: 'volunteer@caafimaadhub.so',
      phone: '+252615000005',
      hash: volPasswordHash,
      role: 'Volunteer',
      status: 'active',
      roleId: 'role-volunteer'
    }
  ];

  for (const u of users) {
    await db.execute(
      `INSERT INTO users (id, organization_id, region_id, district_id, email, password_hash, full_name, phone, role, status, region, district, is_active, is_suspended, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Banadir', 'Hodan', 1, 0, CURRENT_TIMESTAMP)`,
      [u.id, u.orgId, u.regionId, u.districtId, u.email, u.hash, u.fullName, u.phone, u.role, u.status]
    );
    await db.execute(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [u.id, u.roleId]);
  }

  // 9. Insert 1 Verified Volunteer Profile
  await db.execute(
    `INSERT INTO volunteers (id, user_id, volunteer_id, organization_id, gender, date_of_birth, region_id, district_id, village_name, address, latitude, longitude, education_level, health_qualifications, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, availability_status, status, profile_completed, registration_date)
     VALUES ('vol-amina', 'usr-volunteer', 'CHV-BAN-001', 'org-fmoh-001', 'FEMALE', '1998-04-12', 'reg-banadir', 'dist-hodan', 'KPP Village', 'Hodan District, Sector 4', 2.0440, 45.3125, 'DIPLOMA', 'Community Health Nursing Diploma (Somalia National University)', 'Hassan Ali Warsame', '+252615000099', 'Father', 'AVAILABLE', 'ACTIVE', 1, CURRENT_TIMESTAMP)`
  );

  // 10. Insert 1 Active Health Campaign
  await db.execute(
    `INSERT INTO campaigns (id, organization_id, name, code, type, description, objective, start_date, end_date, region_id, district_id, target_population, budget, manager_id, status, priority, created_by, created_at)
     VALUES ('cmp-polio-2026', 'org-fmoh-001', 'National Polio & Child Immunization Campaign 2026', 'CMP-POL-26', 'IMMUNIZATION', 'Targeted door-to-door oral polio vaccination (OPV) and Vitamin A supplementation for children under 5 across urban and peri-urban districts.', 'Immunize 25,000 children in Banadir region.', '2026-09-01', '2026-10-31', 'reg-banadir', 'dist-hodan', 25000, 15000.00, 'usr-operational', 'ACTIVE', 'HIGH', 'usr-admin', CURRENT_TIMESTAMP)`
  );

  await db.execute(
    `INSERT INTO campaign_volunteers (id, campaign_id, volunteer_id, status, assigned_at)
     VALUES ('cv-polio-amina', 'cmp-polio-2026', 'vol-amina', 'ACTIVE', CURRENT_TIMESTAMP)`
  );

  // 11. Insert Inventory Locations and Clean Supplies
  await db.execute(
    `INSERT INTO inventory_locations (id, facility_id, name, code, region_id, district_id, address)
     VALUES ('loc-depot-01', 'fac-banadir-hosp', 'Mogadishu Central Medical Depot', 'DEP-MOG-01', 'reg-banadir', 'dist-hodan', 'Hodan Central Supply Annex')`
  );

  const inventory = [
    ['item-ors', 'ORS-205G', 'Oral Rehydration Salts (ORS 20.5g)', 'MEDICINES', 'sachets', 150, 30, 'loc-depot-01'],
    ['item-zinc', 'ZINC-20MG', 'Zinc Sulfate Tablets 20mg', 'MEDICINES', 'strips (10 tabs)', 120, 25, 'loc-depot-01'],
    ['item-amox', 'AMOX-125', 'Amoxicillin Suspension 125mg/5ml', 'MEDICINES', 'bottles (100ml)', 80, 20, 'loc-depot-01'],
    ['item-para', 'PARA-500MG', 'Paracetamol Tablets 500mg', 'MEDICINES', 'boxes (100 tabs)', 160, 30, 'loc-depot-01'],
    ['item-rdt-cholera', 'RDT-CHOLERA', 'Cholera Rapid Diagnostic Test (RDT)', 'DIAGNOSTIC_KITS', 'kits (25 tests)', 40, 10, 'loc-depot-01'],
    ['item-muac', 'MUAC-CHILD', 'MUAC Tapes (Mid-Upper Arm Circumference)', 'OTHER', 'pieces', 90, 20, 'loc-depot-01'],
    ['item-vit-a', 'VITA-200K', 'Vitamin A Capsules 200,000 IU', 'NUTRITION_SUPPLIES', 'bottles (500 caps)', 60, 15, 'loc-depot-01'],
    ['item-delivery-kit', 'MAMA-KIT-01', 'Clean Delivery Kits (Maama Kits)', 'PPE', 'kits', 35, 10, 'loc-depot-01']
  ];

  for (const itm of inventory) {
    await db.execute(
      `INSERT INTO inventory_items (id, item_code, name, category, unit_of_measure, quantity_on_hand, minimum_stock_level, location_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      itm
    );
  }

  // 12. Default System Settings
  const settings = [
    ['sms_provider', 'MOCK'],
    ['sms_sender_id', 'CaafimaadHub'],
    ['auto_outbreak_sms', '1'],
    ['auto_low_stock_sms', '1'],
    ['system_name', 'CaafimaadHub'],
    ['pwa_sync_interval_mins', '15']
  ];
  for (const s of settings) {
    await db.execute(
      `INSERT INTO system_settings (setting_key, setting_value, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
      s
    ).catch(() => {});
  }

  if (clientType === 'sqlite') {
    const sqliteDb = db.getSqliteDb();
    sqliteDb.pragma('foreign_keys = ON');
  } else {
    await db.execute('SET FOREIGN_KEY_CHECKS = 1;');
  }

  console.log('\n=======================================================');
  console.log('  SUCCESS: Fresh clean system database created!        ');
  console.log('=======================================================');
  console.log('  Clean Production User Accounts:                     ');
  console.log('  1. Super Admin: superadmin@gmail.com   | super#123   ');
  console.log('  2. Admin:       admin@caafimaadhub.so  | Admin123!   ');
  console.log('  3. Operational: operational@caafimaadhub.so | Operational123!');
  console.log('  4. Analyst:     analyst@caafimaadhub.so | Analyst123! ');
  console.log('  5. Volunteer:   volunteer@caafimaadhub.so | Volunteer123!');
  console.log('=======================================================\n');
}

runCleanReset().then(() => process.exit(0)).catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
