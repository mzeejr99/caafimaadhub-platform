require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function initializeCleanSystem() {
  console.log('=======================================================');
  console.log('  CaafimaadHub — Initializing Fresh Production System  ');
  console.log('=======================================================');

  db.initDb();
  const clientType = db.getClientType();
  console.log(`[CleanSystem] Target Database Client: ${clientType}`);

  const sqliteSchemaPath = path.join(__dirname, 'sqliteSchema.sql');

  const tablesToClear = [
    'audit_logs', 'attachments', 'sms_logs', 'notifications',
    'supply_requests', 'inventory_transactions', 'inventory_locations', 'certificates',
    'training_answers', 'training_quizzes', 'training_enrollments',
    'field_submission_values', 'field_submissions',
    'task_assignments', 'tasks', 'campaign_volunteers',
    'volunteer_languages', 'volunteer_skills', 'volunteers',
    'emergency_reports', 'feedback', 'user_roles', 'users',
    'inventory_items', 'campaigns', 'training_courses', 'training_lessons'
  ];

  if (clientType === 'sqlite') {
    const sqliteDb = db.getSqliteDb();
    sqliteDb.pragma('foreign_keys = OFF');
    console.log('[CleanSystem] Applying fresh SQLite schema structure...');
    const schemaSql = fs.readFileSync(sqliteSchemaPath, 'utf8');
    sqliteDb.exec(schemaSql);

    for (const tbl of tablesToClear) {
      try { sqliteDb.exec(`DELETE FROM ${tbl};`); } catch (err) {}
    }
  } else {
    // MySQL
    await db.execute('SET FOREIGN_KEY_CHECKS = 0;');
    for (const tbl of tablesToClear) {
      try { await db.execute(`DELETE FROM ${tbl};`); } catch (err) {}
    }
    console.log('[CleanSystem] MySQL Database successfully cleared.');
  }

  // Common Passwords
  const superHash = bcrypt.hashSync('super#123', 10);
  const adminHash = bcrypt.hashSync('Admin123!', 10);
  const opHash = bcrypt.hashSync('Operational123!', 10);
  const analystHash = bcrypt.hashSync('Analyst123!', 10);
  const volHash = bcrypt.hashSync('Volunteer123!', 10);

  console.log('[CleanSystem] Seeding clean core metadata (Roles, Regions, Facilities, Depots)...');

  // Insert Core Roles
  const roles = [
    ['role-super-admin', 'SUPER_ADMIN', 'Super Administrator', 'Full unrestricted platform management'],
    ['role-admin', 'ADMIN', 'Administrator', 'General administration and user management'],
    ['role-operational', 'OPERATIONAL', 'Operations Manager', 'Field coordination, campaign management, supplies'],
    ['role-analyst', 'DATA_ANALYST', 'Data Analyst', 'Data reporting, DHIS2 analytics, trend visualization'],
    ['role-volunteer', 'VOLUNTEER', 'Community Health Volunteer', 'Frontline field data collection, immunization, screening'],
    ['role-public', 'PUBLIC_USER', 'Public User', 'Public citizen reporting, feedback, and verification']
  ];

  for (const [id, name, display_name, desc] of roles) {
    await db.execute(
      `REPLACE INTO roles (id, name, display_name, description, is_system_role, created_at) 
       VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
      [id, name, display_name, desc]
    );
  }

  // Insert Regions
  const regions = [
    ['reg-banadir', 'Banaadir', 'BAN', 'Somalia', 2.0469, 45.3182],
    ['reg-hiran', 'Hiiraan', 'HIR', 'Somalia', 4.7360, 45.2040],
    ['reg-bay', 'Baay', 'BAY', 'Somalia', 3.1191, 43.6503],
    ['reg-gedo', 'Gedo', 'GED', 'Somalia', 3.7915, 42.5462],
    ['reg-bari', 'Bari', 'BAR', 'Somalia', 11.2842, 49.1813],
    ['reg-mudug', 'Mudug', 'MUD', 'Somalia', 6.7697, 47.4308]
  ];

  for (const [id, name, code, country, lat, lon] of regions) {
    await db.execute(
      `REPLACE INTO regions (id, name, code, country, latitude, longitude, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [id, name, code, country, lat, lon]
    );
  }

  // Insert Core Districts
  const districts = [
    ['dist-hodan', 'reg-banadir', 'Hodan', 'HOD', 2.0400, 45.3100],
    ['dist-wadajir', 'reg-banadir', 'Wadajir', 'WDJ', 2.0200, 45.2900],
    ['dist-yaqshid', 'reg-banadir', 'Yaqshid', 'YQD', 2.0700, 45.3400],
    ['dist-holwadag', 'reg-banadir', 'Howlwadaag', 'HLW', 2.0450, 45.3250],
    ['dist-waberi', 'reg-banadir', 'Waberi', 'WBR', 2.0300, 45.3300],
    ['dist-beledweyne', 'reg-hiran', 'Beledweyne', 'BDW', 4.7400, 45.2100],
    ['dist-baidoa', 'reg-bay', 'Baidoa', 'BDA', 3.1200, 43.6500]
  ];

  for (const [id, regId, name, code, lat, lon] of districts) {
    await db.execute(
      `REPLACE INTO districts (id, region_id, name, code, latitude, longitude, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [id, regId, name, code, lat, lon]
    );
  }

  // Insert Core Healthcare Depots & Facilities
  const facilities = [
    ['fac-depot-central', 'reg-banadir', 'dist-hodan', 'Mogadishu Central Medical Depot', 'CENTRAL_DEPOT', 'PRIMARY_HOSPITAL', '+252615000111', 2.0420, 45.3120],
    ['fac-banadir-hosp', 'reg-banadir', 'dist-wadajir', 'Banadir Mother & Child Hospital', 'HOSPITAL', 'SECONDARY_HOSPITAL', '+252615000222', 2.0250, 45.2980],
    ['fac-hodan-mch', 'reg-banadir', 'dist-hodan', 'Hodan Maternal & Child Health Clinic', 'MCH_CLINIC', 'HEALTH_CENTER', '+252615000333', 2.0410, 45.3150],
    ['fac-medina-hc', 'reg-banadir', 'dist-wadajir', 'Medina Community Health Center', 'HEALTH_CENTER', 'HEALTH_POST', '+252615000444', 2.0310, 45.3020]
  ];

  for (const [id, regId, distId, name, type, level, phone, lat, lon] of facilities) {
    await db.execute(
      `REPLACE INTO facilities (id, region_id, district_id, name, facility_type, operational_level, phone, latitude, longitude, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
      [id, regId, distId, name, type, level, phone, lat, lon]
    );
  }

  // Insert Clean Medical Inventory Items
  const inventoryItems = [
    ['item-ors', 'Oral Rehydration Salts (ORS 20.5g)', 'ORS-205G', 'MEDICINE', 'WHO standard low-osmolarity sachet for acute dehydration and diarrhea treatment', 'Sachet', 100, 25, 1, 1],
    ['item-zinc', 'Zinc Sulfate Tablets 20mg', 'ZINC-20MG', 'MEDICINE', 'Essential dispersible micronutrient tablets for pediatric diarrhea management', 'Strip (10 tabs)', 80, 20, 1, 1],
    ['item-amox', 'Amoxicillin Suspension 125mg/5ml', 'AMOX-125', 'MEDICINE', 'Oral antibiotic for community-acquired acute respiratory infections in children', 'Bottle (100ml)', 50, 15, 1, 1],
    ['item-para', 'Paracetamol Tablets 500mg', 'PARA-500MG', 'MEDICINE', 'Analgesic and antipyretic for fever and pain management', 'Box (100 tabs)', 120, 30, 0, 1],
    ['item-rdt-cholera', 'Cholera Rapid Diagnostic Test (RDT)', 'RDT-CHOLERA', 'DIAGNOSTIC', 'Field dipstick test for rapid detection of Vibrio cholerae O1/O139', 'Kit (25 tests)', 30, 10, 0, 1],
    ['item-muac', 'MUAC Tapes (Mid-Upper Arm Circumference)', 'MUAC-CHILD', 'EQUIPMENT', 'Tri-colored nutritional screening tape for children aged 6-59 months', 'Piece', 60, 15, 0, 1],
    ['item-vit-a', 'Vitamin A Capsules 200,000 IU', 'VITA-200K', 'NUTRITION', 'High-dose Vitamin A capsules for child immune enhancement and blindness prevention', 'Bottle (500 caps)', 40, 10, 0, 1],
    ['item-delivery-kit', 'Clean Delivery Kits (Maama Kits)', 'MAMA-KIT-01', 'EQUIPMENT', 'Sterile field kit for emergency home deliveries (plastic sheet, blade, cord ties, soap)', 'Kit', 25, 8, 0, 1]
  ];

  for (const [id, name, sku, cat, desc, unit, stock, reorder, cold, active] of inventoryItems) {
    await db.execute(
      `REPLACE INTO inventory_items (id, name, sku, category, description, unit_of_measure, quantity_on_hand, reorder_level, is_cold_chain, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [id, name, sku, cat, desc, unit, stock, reorder, cold, active]
    );
  }

  // Insert Clean Production Accounts
  console.log('[CleanSystem] Creating clean verified staff & volunteer accounts...');

  const cleanUsers = [
    {
      id: 'usr-superadmin',
      fullName: 'Super Administrator',
      email: 'superadmin@gmail.com',
      phone: '+252615000001',
      hash: superHash,
      roleId: 'role-super-admin',
      regionId: 'reg-banadir',
      districtId: 'dist-hodan'
    },
    {
      id: 'usr-admin',
      fullName: 'Eng. Abdullahi Warsame',
      email: 'admin@caafimaadhub.so',
      phone: '+252615000002',
      hash: adminHash,
      roleId: 'role-admin',
      regionId: 'reg-banadir',
      districtId: 'dist-hodan'
    },
    {
      id: 'usr-operational',
      fullName: 'Eng. Ahmed Nor Osman',
      email: 'operational@caafimaadhub.so',
      phone: '+252615000003',
      hash: opHash,
      roleId: 'role-operational',
      regionId: 'reg-banadir',
      districtId: 'dist-hodan'
    },
    {
      id: 'usr-analyst',
      fullName: 'Dr. Fartuun Salad',
      email: 'analyst@caafimaadhub.so',
      phone: '+252615000004',
      hash: analystHash,
      roleId: 'role-analyst',
      regionId: 'reg-banadir',
      districtId: 'dist-hodan'
    },
    {
      id: 'usr-volunteer',
      fullName: 'Amina Hassan Ali',
      email: 'volunteer@caafimaadhub.so',
      phone: '+252615000005',
      hash: volHash,
      roleId: 'role-volunteer',
      regionId: 'reg-banadir',
      districtId: 'dist-hodan'
    }
  ];

  for (const u of cleanUsers) {
    await db.execute(
      `REPLACE INTO users (id, full_name, email, phone, password_hash, is_active, is_suspended, region_id, district_id, created_at)
       VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?, CURRENT_TIMESTAMP)`,
      [u.id, u.fullName, u.email, u.phone, u.hash, u.regionId, u.districtId]
    );

    await db.execute(
      `REPLACE INTO user_roles (user_id, role_id) VALUES (?, ?)`,
      [u.id, u.roleId]
    );

    // If volunteer, create verified volunteer profile
    if (u.roleId === 'role-volunteer') {
      await db.execute(
        `REPLACE INTO volunteers (id, user_id, volunteer_id, status, is_accredited, national_id, region_name, district_name, village, house_number, phone, emergency_contact_name, emergency_contact_phone, created_at)
         VALUES ('vol-amina', ?, 'CHV-BAN-001', 'ACTIVE', 1, 'NID-8849102', 'Banaadir', 'Hodan', 'KPP Village', 'H-104', ?, 'Hassan Ali Warsame', '+252615000099', CURRENT_TIMESTAMP)`,
        [u.id, u.phone]
      );
    }
  }

  // Insert 1 Clean Active Campaign
  await db.execute(
    `REPLACE INTO campaigns (id, title, code, description, campaign_type, status, target_region_id, target_population, start_date, end_date, budget_allocated, is_active, created_at)
     VALUES ('cmp-polio-2026', 'National Polio & Child Immunization Campaign 2026', 'CMP-POL-26', 'Targeted door-to-door oral polio vaccination (OPV) and Vitamin A supplementation for children under 5 across urban and peri-urban districts.', 'IMMUNIZATION', 'ACTIVE', 'reg-banadir', 25000, '2026-09-01', '2026-10-31', 15000, 1, CURRENT_TIMESTAMP)`
  );

  // Link volunteer to campaign
  await db.execute(
    `REPLACE INTO campaign_volunteers (campaign_id, volunteer_id, assigned_role, is_confirmed, created_at)
     VALUES ('cmp-polio-2026', 'vol-amina', 'Field Vaccinator', 1, CURRENT_TIMESTAMP)`
  );

  // Insert default system settings
  const defaultSettings = [
    ['sms_provider', 'MOCK'],
    ['sms_sender_id', 'CaafimaadHub'],
    ['auto_outbreak_sms', '1'],
    ['auto_low_stock_sms', '1'],
    ['system_name', 'CaafimaadHub'],
    ['pwa_sync_interval_mins', '15']
  ];

  for (const [key, val] of defaultSettings) {
    await db.execute(
      `REPLACE INTO system_settings (setting_key, setting_value, created_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [key, val]
    ).catch(() => {});
  }

  if (clientType === 'sqlite') {
    const sqliteDb = db.getSqliteDb();
    sqliteDb.pragma('foreign_keys = ON');
  } else {
    await db.execute('SET FOREIGN_KEY_CHECKS = 1;');
  }

  console.log('\n=======================================================');
  console.log('  SUCCESS: System is now 100% clean and ready!         ');
  console.log('=======================================================');
  console.log('  Verified Clean Login Accounts:                      ');
  console.log('  1. Super Administrator: superadmin@gmail.com / super#123');
  console.log('  2. Administrator:       admin@caafimaadhub.so / Admin123!');
  console.log('  3. Operations Manager:  operational@caafimaadhub.so / Operational123!');
  console.log('  4. Data Analyst:        analyst@caafimaadhub.so / Analyst123!');
  console.log('  5. Field Volunteer:     volunteer@caafimaadhub.so / Volunteer123!');
  console.log('=======================================================\n');
}

initializeCleanSystem()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to clean system:', err);
    process.exit(1);
  });
