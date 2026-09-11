require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./src/config/db');
const { splitSqlStatements } = require('./src/database/sqlSplitter');

async function reseedAll() {
  console.log('=== CaafimaadHub Re-Seeding Fresh Real Data ===');
  db.initDb();
  const clientType = db.getClientType();
  console.log(`Database Client: ${clientType}`);

  const schemaPath = path.join(__dirname, '../database/schema.sql');
  const sqliteSchemaPath = path.join(__dirname, 'src/database/sqliteSchema.sql');
  const seedsPath = path.join(__dirname, '../database/seeds.sql');

  const passwordHash = bcrypt.hashSync('super#123', 10);
  let seedsSql = fs.readFileSync(seedsPath, 'utf8');
  let processedSeeds = seedsSql.replace(/\$2a\$10\$[a-zA-Z0-9.\/]+/g, passwordHash);

  if (clientType === 'sqlite') {
    const sqliteDb = db.getSqliteDb();
    sqliteDb.pragma('foreign_keys = OFF');

    let schemaSql = fs.readFileSync(sqliteSchemaPath, 'utf8');
    sqliteDb.exec(schemaSql);

    let cleanSeeds = processedSeeds.replace(/USE `?caafimaadhub`?;/gi, '');
    sqliteDb.exec(cleanSeeds);

    sqliteDb.pragma('foreign_keys = ON');
    console.log('-> SQLite database successfully reseeded with authentic real data!');
  } else {
    // MySQL
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await db.execute('SET FOREIGN_KEY_CHECKS = 0;');
    
    // Execute schema statements
    const schemaStmts = splitSqlStatements(schemaSql);
    for (const stmt of schemaStmts) {
      if (/^USE\s+/i.test(stmt) || /^CREATE DATABASE/i.test(stmt)) continue;
      try {
        await db.query(stmt);
      } catch (err) {
        console.error('Schema stmt error:', stmt.slice(0, 60), err.message);
      }
    }

    // Execute seed statements
    const seedStmts = splitSqlStatements(processedSeeds);
    for (const stmt of seedStmts) {
      if (/^USE\s+/i.test(stmt)) continue;
      try {
        await db.query(stmt);
      } catch (err) {
        console.error('Seed stmt error:', stmt.slice(0, 60), err.message);
      }
    }

    await db.execute('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('-> MySQL database successfully reseeded with authentic real data!');
  }

  // Ensure ONLY superadmin@caafimaadhub.so is active and present
  try {
    const hash = bcrypt.hashSync('super#123', 10);
    // Remove any legacy users except superadmin
    await db.execute("DELETE FROM users WHERE email != 'superadmin@caafimaadhub.so'");
    await db.execute("DELETE FROM user_roles WHERE user_id NOT IN (SELECT id FROM users)");

    const existing = await db.getOne('SELECT id FROM users WHERE LOWER(email) = ?', ['superadmin@caafimaadhub.so']);
    if (existing) {
      await db.execute('UPDATE users SET password_hash = ?, is_active = 1, is_suspended = 0 WHERE id = ?', [hash, existing.id]);
    } else {
      const userId = 'usr-superadmin-01';
      await db.execute(
        'INSERT INTO users (id, organization_id, region_id, district_id, full_name, email, password_hash, preferred_language, is_active, is_suspended, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, CURRENT_TIMESTAMP)',
        [userId, 'org-fmoh-001', 'reg-banadir', 'dist-hodan', 'Super Administrator', 'superadmin@caafimaadhub.so', hash, 'so']
      );
      if (clientType === 'sqlite') {
        await db.execute('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, 'role-super-admin']);
      } else {
        await db.execute('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, 'role-super-admin']);
      }
    }
    console.log('-> Only superadmin@caafimaadhub.so ensured in database with password super#123!');
  } catch (err) {
    console.error('Error ensuring superadmin@caafimaadhub.so:', err.message);
  }

  // Verify inventory items
  const items = await db.query('SELECT COUNT(*) as count FROM inventory_items');
  const campaigns = await db.query('SELECT COUNT(*) as count FROM campaigns');
  const users = await db.query('SELECT COUNT(*) as count FROM users');
  console.log(`\nVerification:`);
  console.log(`  - Users: ${users[0].count}`);
  console.log(`  - Campaigns: ${campaigns[0].count}`);
  console.log(`  - Medical Inventory Items: ${items[0].count}`);
  console.log('\n=== RESEED COMPLETE 100% ===\n');
}

reseedAll().catch(console.error);
