require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { splitSqlStatements } = require('./sqlSplitter');

async function seedFullProductionData() {
  console.log('================================================================');
  console.log('  CaafimaadHub — Seeding Comprehensive Authentic Somali Data   ');
  console.log('================================================================');

  db.initDb();
  const clientType = db.getClientType();
  console.log(`[SeedMaster] Database Client: ${clientType}`);

  const seedsPath = path.join(__dirname, '../../../database/seeds.sql');
  if (!fs.existsSync(seedsPath)) {
    console.error(`Seeds file not found at: ${seedsPath}`);
    process.exit(1);
  }

  const seedsSql = fs.readFileSync(seedsPath, 'utf8');
  const commonPasswordHash = bcrypt.hashSync('Password123!', 10);
  const superadminHash = bcrypt.hashSync('super#123', 10);
  const adminHash = bcrypt.hashSync('Admin123!', 10);

  // Common statements splitter
  const statements = splitSqlStatements(seedsSql);

  if (clientType === 'sqlite') {
    const sqliteDb = db.getSqliteDb();
    sqliteDb.pragma('foreign_keys = OFF');

    console.log(`[SeedMaster] Executing ${statements.length} seed statements into SQLite...`);
    let executed = 0;
    let errors = 0;

    for (const rawStmt of statements) {
      if (/^USE\s+/i.test(rawStmt)) continue;

      // Replace generic password hash with fresh bcrypt hash
      const procStmt = rawStmt.replace(/\$2a\$10\$[a-zA-Z0-9./]+/g, commonPasswordHash);
      try {
        sqliteDb.exec(procStmt);
        executed++;
      } catch (err) {
        errors++;
      }
    }

    sqliteDb.pragma('foreign_keys = ON');
    console.log(`[SeedMaster] SQLite Seed Finished. Executed: ${executed}, Ignored/Replaced: ${errors}`);
  } else {
    // MySQL
    await db.execute('SET FOREIGN_KEY_CHECKS = 0;');
    console.log(`[SeedMaster] Executing ${statements.length} seed statements into MySQL...`);
    let executed = 0;

    for (const rawStmt of statements) {
      if (/^USE\s+/i.test(rawStmt)) continue;
      const procStmt = rawStmt.replace(/\$2a\$10\$[a-zA-Z0-9./]+/g, commonPasswordHash);
      try {
        await db.execute(procStmt);
        executed++;
      } catch (err) {
        // Continue on duplicates
      }
    }

    await db.execute('SET FOREIGN_KEY_CHECKS = 1;');
    console.log(`[SeedMaster] MySQL Seed Finished. Executed: ${executed}`);
  }

  // Ensure default login accounts are verified and accessible
  const verifiedUsers = [
    {
      id: 'usr-superadmin-01',
      name: 'Eng. Abdullahi Warsame',
      email: 'superadmin@example.com',
      hash: commonPasswordHash,
      role: 'Superadmin',
      roleId: 'role-super-admin',
      region: 'Banadir',
      district: 'Hodan',
      status: 'active'
    },
    {
      id: 'usr-superadmin-gmail',
      name: 'Eng. Rooble',
      email: 'superadmin@gmail.com',
      hash: superadminHash,
      role: 'Superadmin',
      roleId: 'role-super-admin',
      region: 'Banadir',
      district: 'Hodan',
      status: 'active'
    },
    {
      id: 'usr-admin-02',
      name: 'Dr. Sahra Nur Hassan',
      email: 'admin@caafimaadhub.so',
      hash: adminHash,
      role: 'Admin',
      roleId: 'role-admin',
      region: 'Banadir',
      district: 'Hodan',
      status: 'active'
    },
    {
      id: 'usr-admin-ex',
      name: 'Dr. Sahra Nur Hassan',
      email: 'admin@example.com',
      hash: commonPasswordHash,
      role: 'Admin',
      roleId: 'role-admin',
      region: 'Banadir',
      district: 'Hodan',
      status: 'active'
    },
    {
      id: 'usr-op-03',
      name: 'Mohamed Cabdi Guuleed',
      email: 'operational@caafimaadhub.so',
      hash: bcrypt.hashSync('Operational123!', 10),
      role: 'Admin',
      roleId: 'role-operational',
      region: 'Banadir',
      district: 'Hodan',
      status: 'active'
    },
    {
      id: 'usr-analyst-05',
      name: 'Dr. Leyla Abdi Warsame',
      email: 'analyst@caafimaadhub.so',
      hash: bcrypt.hashSync('Analyst123!', 10),
      role: 'DataAnalyst',
      roleId: 'role-analyst',
      region: 'Banadir',
      district: 'Hodan',
      status: 'active'
    },
    {
      id: 'usr-vol-07',
      name: 'Aamina Xasan Barre',
      email: 'volunteer@example.com',
      hash: commonPasswordHash,
      role: 'Volunteer',
      roleId: 'role-volunteer',
      region: 'Banadir',
      district: 'Hodan',
      status: 'active'
    },
    {
      id: 'usr-vol-07-so',
      name: 'Aamina Xasan Barre',
      email: 'volunteer@caafimaadhub.so',
      hash: bcrypt.hashSync('Volunteer123!', 10),
      role: 'Volunteer',
      roleId: 'role-volunteer',
      region: 'Banadir',
      district: 'Hodan',
      status: 'active'
    },
    {
      id: 'usr-vol-pending-01',
      name: 'Khadar Maxamed Nuur',
      email: 'khadar.volunteer@example.com',
      phone: '+252615999111',
      hash: commonPasswordHash,
      role: 'Volunteer',
      roleId: 'role-volunteer',
      region: 'Hiran',
      district: 'Beledweyne',
      status: 'pending'
    },
    {
      id: 'usr-vol-pending-02',
      name: 'Ubax Cali Jaamac',
      email: 'ubax.volunteer@example.com',
      phone: '+252615999222',
      hash: commonPasswordHash,
      role: 'Volunteer',
      roleId: 'role-volunteer',
      region: 'Bay',
      district: 'Baidoa',
      status: 'pending'
    },
    {
      id: 'usr-pub-13',
      name: 'Asha Mohamed Weheliye',
      email: 'public@example.com',
      phone: '+252615777771',
      hash: commonPasswordHash,
      role: 'Public',
      roleId: 'role-public',
      region: 'Banadir',
      district: 'Hodan',
      status: 'active'
    }
  ];

  if (clientType === 'sqlite') {
    db.getSqliteDb().pragma('foreign_keys = OFF');
  } else {
    await db.execute('SET FOREIGN_KEY_CHECKS = 0;').catch(() => {});
  }

  for (const u of verifiedUsers) {
    if (clientType === 'sqlite') {
      await db.execute(
        `INSERT OR REPLACE INTO users (id, full_name, email, phone, password_hash, role, status, region, district, is_active, is_suspended, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, CURRENT_TIMESTAMP)`,
        [u.id, u.name, u.email, u.phone || '+252 61 5000000', u.hash, u.role, u.status, u.region, u.district]
      );
    } else {
      await db.execute(
        `INSERT INTO users (id, full_name, email, phone, password_hash, role, status, region, district, is_active, is_suspended, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), phone = VALUES(phone), role = VALUES(role), status = VALUES(status), region = VALUES(region), district = VALUES(district)`,
        [u.id, u.name, u.email, u.phone || '+252 61 5000000', u.hash, u.role, u.status, u.region, u.district]
      );
    }

    if (clientType === 'sqlite') {
      await db.execute(
        `INSERT OR REPLACE INTO user_roles (user_id, role_id) VALUES (?, ?)`,
        [u.id, u.roleId]
      ).catch(() => {});
    } else {
      await db.execute(
        `INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`,
        [u.id, u.roleId]
      ).catch(() => {});
    }
  }

  // Insert pending volunteers into volunteers table
  await db.execute(
    `REPLACE INTO volunteers (id, user_id, volunteer_id, status, region_id, district_id, gender, village_name, phone, availability_status, registration_date)
     VALUES ('vol-khadar', 'usr-vol-pending-01', 'CHV-HIR-2026-99', 'PENDING', 'reg-hiran', 'dist-beledweyne', 'MALE', 'Koshin Village', '+252615999111', 'AVAILABLE', CURRENT_TIMESTAMP)`
  ).catch(() => {});

  await db.execute(
    `REPLACE INTO volunteers (id, user_id, volunteer_id, status, region_id, district_id, gender, village_name, phone, availability_status, registration_date)
     VALUES ('vol-ubax', 'usr-vol-pending-02', 'CHV-BAY-2026-98', 'PENDING', 'reg-bay', 'dist-baidoa', 'FEMALE', 'Isha Village', '+252615999222', 'AVAILABLE', CURRENT_TIMESTAMP)`
  ).catch(() => {});

  await db.execute(
    `REPLACE INTO volunteers (id, user_id, volunteer_id, status, region_id, district_id, gender, village_name, phone, availability_status, registration_date)
     VALUES ('vol-rec-01-so', 'usr-vol-07-so', 'CHV-BAN-2026-0007', 'APPROVED', 'reg-banadir', 'dist-hodan', 'FEMALE', 'Taleex Village', '+252615000005', 'AVAILABLE', CURRENT_TIMESTAMP)`
  ).catch(() => {});

  console.log('================================================================');
  console.log('  SUCCESS: Full authentic health data successfully seeded!     ');
  console.log('================================================================\n');
}

seedFullProductionData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
