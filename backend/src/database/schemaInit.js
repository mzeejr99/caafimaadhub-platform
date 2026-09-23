const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { splitSqlStatements } = require('./sqlSplitter');

/**
 * Executes a .sql script against MySQL one statement at a time.
 * Returns { executed, skipped, failures[] } instead of throwing on the first error.
 */
async function runMysqlScript(sql, { ignoreDuplicates = false } = {}) {
  const statements = splitSqlStatements(sql);
  const result = { executed: 0, skipped: 0, failures: [] };

  for (const stmt of statements) {
    if (/^USE\s+/i.test(stmt)) {
      result.skipped++;
      continue;
    }
    try {
      await db.query(stmt);
      result.executed++;
    } catch (err) {
      if (ignoreDuplicates && err.code === 'ER_DUP_ENTRY') {
        result.skipped++;
        continue;
      }
      result.failures.push({
        statement: stmt.replace(/\s+/g, ' ').slice(0, 120),
        code: err.code,
        message: err.message
      });
    }
  }

  return result;
}

async function initSchemaAndSeeds() {
  db.initDb();
  const clientType = db.getClientType();

  console.log(`[SchemaInit] Checking database structure (${clientType})...`);

  if (clientType === 'sqlite') {
    const sqliteDb = db.getSqliteDb();

    // Check if tables already exist
    const tables = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").all();

    if (tables.length === 0) {
      console.log('[SchemaInit] SQLite tables not found. Initializing schema and seed data...');

      const schemaPath = path.join(__dirname, 'sqliteSchema.sql');
      let schemaSql = fs.readFileSync(schemaPath, 'utf8');

      sqliteDb.pragma('foreign_keys = OFF');
      sqliteDb.exec(schemaSql);
      sqliteDb.pragma('foreign_keys = ON');
    }

    // Check if any users already exist
    const hasUsers = sqliteDb.prepare("SELECT id FROM users LIMIT 1").get();
    if (!hasUsers) {
      console.log('[SchemaInit] Seeding SQLite database with initial operational data...');
      const seedsPath = path.join(__dirname, '../../../database/seeds.sql');
      let seedsSql = fs.readFileSync(seedsPath, 'utf8');

      const passwordHash = bcrypt.hashSync('Password123!', 10);
      const statements = splitSqlStatements(seedsSql);

      sqliteDb.pragma('foreign_keys = OFF');
      for (const stmt of statements) {
        if (/^USE\s+/i.test(stmt)) continue;
        const procStmt = stmt.replace(/\$2a\$10\$[a-zA-Z0-9./]+/g, passwordHash);
        try {
          sqliteDb.exec(procStmt);
        } catch (err) {
          const isDuplicate = /UNIQUE constraint failed/i.test(err.message || '');
          if (!isDuplicate) {
            console.error(`[SchemaInit] SQLite seed statement warning: ${err.message}`);
          }
        }
      }
      sqliteDb.pragma('foreign_keys = ON');
      console.log('[SchemaInit] SQLite Database schema and initial seeds created successfully!');
    } else {
      console.log('[SchemaInit] Database tables already present.');
    }

    // Ensure superadmin@caafimaadhub.so exists in SQLite with Superadmin role
    try {
      const hash = bcrypt.hashSync('super#123', 10);
      const existing = await db.getOne('SELECT id FROM users WHERE LOWER(email) = ?', ['superadmin@caafimaadhub.so']);
      if (existing) {
        await db.execute("UPDATE users SET password_hash = ?, is_active = 1, is_suspended = 0, role = 'Superadmin' WHERE id = ?", [hash, existing.id]);
        await db.execute('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [existing.id, 'role-super-admin']);
      } else {
        const userId = 'usr-superadmin-01';
        await db.execute(
          'INSERT INTO users (id, organization_id, region_id, district_id, full_name, email, password_hash, preferred_language, role, status, is_active, is_suspended, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, CURRENT_TIMESTAMP)',
          [userId, 'org-fmoh-001', 'reg-banadir', 'dist-hodan', 'Super Administrator', 'superadmin@caafimaadhub.so', hash, 'so', 'Superadmin', 'active']
        );
        await db.execute('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, 'role-super-admin']);
      }

      // Self-healing role sync: Sync users.role with user_roles
      try {
        await db.execute("UPDATE users SET role = 'Superadmin' WHERE id IN (SELECT user_id FROM user_roles WHERE role_id = 'role-super-admin')");
        await db.execute("UPDATE users SET role = 'Admin' WHERE id IN (SELECT user_id FROM user_roles WHERE role_id IN ('role-admin', 'role-operational')) AND role NOT IN ('Superadmin')");
        await db.execute("UPDATE users SET role = 'DataAnalyst' WHERE id IN (SELECT user_id FROM user_roles WHERE role_id = 'role-analyst') AND role NOT IN ('Superadmin', 'Admin')");
        await db.execute("UPDATE users SET role = 'Volunteer' WHERE id IN (SELECT user_id FROM user_roles WHERE role_id = 'role-volunteer') AND role NOT IN ('Superadmin', 'Admin', 'DataAnalyst')");
      } catch (syncErr) {
        console.warn('[SchemaInit] User roles self-healing sync warning:', syncErr.message);
      }

      // Self-healing: Clean up orphaned volunteers and dummy demo data
      try {
        if (clientType === 'sqlite') {
          sqliteDb.pragma('foreign_keys = OFF');
        } else {
          await db.execute('SET FOREIGN_KEY_CHECKS = 0;').catch(() => {});
        }

        await db.execute("DELETE FROM volunteer_skills WHERE volunteer_id NOT IN (SELECT v.id FROM volunteers v JOIN users u ON u.id = v.user_id)");
        await db.execute("DELETE FROM volunteer_languages WHERE volunteer_id NOT IN (SELECT v.id FROM volunteers v JOIN users u ON u.id = v.user_id)");
        await db.execute("DELETE FROM volunteers WHERE user_id NOT IN (SELECT id FROM users)");
        
        // Clean up orphaned records only (do not delete valid operational data)
        await db.execute("DELETE FROM field_submissions WHERE volunteer_id NOT IN (SELECT v.id FROM volunteers v JOIN users u ON u.id = v.user_id)").catch(() => {});
        await db.execute("DELETE FROM campaigns WHERE created_by IS NOT NULL AND created_by NOT IN (SELECT id FROM users)").catch(() => {});
        await db.execute("DELETE FROM campaign_volunteers WHERE campaign_id NOT IN (SELECT id FROM campaigns)").catch(() => {});
        await db.execute("DELETE FROM tasks WHERE created_by IS NOT NULL AND created_by NOT IN (SELECT id FROM users)").catch(() => {});
        await db.execute("DELETE FROM task_assignments WHERE task_id NOT IN (SELECT id FROM tasks)").catch(() => {});

        if (clientType === 'sqlite') {
          sqliteDb.pragma('foreign_keys = ON');
        } else {
          await db.execute('SET FOREIGN_KEY_CHECKS = 1;').catch(() => {});
        }
      } catch (cleanErr) {
        console.warn('[SchemaInit] Orphan and dummy cleanup warning:', cleanErr.message);
      }
    } catch (err) {
      console.error('[SchemaInit] Error ensuring superadmin@caafimaadhub.so:', err.message);
    }

    // Ensure training courses, lessons, quizzes, questions and answers exist
    try {
      const courseCount = await db.getOne('SELECT COUNT(*) AS total FROM training_courses');
      if (!courseCount || courseCount.total < 5) {
        console.log('[SchemaInit] Ensuring full Ministry training curriculum & quizzes in SQLite...');
        const seedsPath = path.join(__dirname, '../../../database/seeds.sql');
        let seedsSql = fs.readFileSync(seedsPath, 'utf8');
        const statements = splitSqlStatements(seedsSql);
        sqliteDb.pragma('foreign_keys = OFF');
        for (const stmt of statements) {
          if (/INSERT INTO (training_courses|training_lessons|training_quizzes|training_questions|training_answers)/i.test(stmt)) {
            try {
              sqliteDb.exec(stmt);
            } catch (err) {
              // Ignore duplicate entries
            }
          }
        }
        sqliteDb.pragma('foreign_keys = ON');
      }
    } catch (err) {
      console.warn('[SchemaInit] Training curriculum check warning:', err.message);
    }
    // Ensure created_by column exists in certificates table
    try {
      const certCols = sqliteDb.prepare("PRAGMA table_info(certificates)").all();
      if (!certCols.some(c => c.name === 'created_by')) {
        sqliteDb.exec("ALTER TABLE certificates ADD COLUMN created_by TEXT");
        console.log('[SchemaInit] Added missing created_by column to certificates table.');
      }
    } catch (colErr) {
      // Ignore if table doesn't exist yet or already added
    }
  } else {
    // MySQL mode
    try {
      const rows = await db.query("SHOW TABLES LIKE 'users'");
      if (!rows || rows.length === 0) {
        console.log('[SchemaInit] MySQL tables not found. Automatically initializing schema and seed data...');
        const schemaPath = path.join(__dirname, '../../../database/schema.sql');
        const seedsPath = path.join(__dirname, '../../../database/seeds.sql');

        let schemaSql = fs.readFileSync(schemaPath, 'utf8');
        let seedsSql = fs.readFileSync(seedsPath, 'utf8');

        const passwordHash = bcrypt.hashSync('super#123', 10);
        seedsSql = seedsSql.replace(/\$2a\$10\$[a-zA-Z0-9.\/]+/g, passwordHash);

        await db.execute('SET FOREIGN_KEY_CHECKS = 0;');
        const schemaResult = await runMysqlScript(schemaSql);
        const seedResult = await runMysqlScript(seedsSql, { ignoreDuplicates: true });
        await db.execute('SET FOREIGN_KEY_CHECKS = 1;');

        const failures = schemaResult.failures.concat(seedResult.failures);
        if (failures.length > 0) {
          console.error(`[SchemaInit] ${failures.length} statement(s) failed during MySQL import:`);
          failures.forEach(f => console.error(`  [${f.code}] ${f.statement}\n    -> ${f.message}`));
        } else {
          console.log('[SchemaInit] MySQL Database schema and initial seeds created successfully!');
        }
      } else {
        console.log('[SchemaInit] MySQL database tables verified.');
      }

      // Ensure superadmin@caafimaadhub.so in MySQL
      const hash = bcrypt.hashSync('super#123', 10);
      const existing = await db.getOne('SELECT id FROM users WHERE LOWER(email) = ?', ['superadmin@caafimaadhub.so']);
      if (existing) {
        await db.execute("UPDATE users SET password_hash = ?, is_active = 1, is_suspended = 0, role = 'Superadmin' WHERE id = ?", [hash, existing.id]);
        await db.execute('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [existing.id, 'role-super-admin']);
      } else {
        const userId = 'usr-superadmin-01';
        await db.execute(
          'INSERT INTO users (id, organization_id, region_id, district_id, full_name, email, password_hash, preferred_language, role, status, is_active, is_suspended, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, CURRENT_TIMESTAMP)',
          [userId, 'org-fmoh-001', 'reg-banadir', 'dist-hodan', 'Super Administrator', 'superadmin@caafimaadhub.so', hash, 'so', 'Superadmin', 'active']
        );
        await db.execute('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, 'role-super-admin']);
      }

      // Self-healing role sync in MySQL
      try {
        await db.execute("UPDATE users SET role = 'Superadmin' WHERE id IN (SELECT user_id FROM user_roles WHERE role_id = 'role-super-admin')");
        await db.execute("UPDATE users SET role = 'Admin' WHERE id IN (SELECT user_id FROM user_roles WHERE role_id IN ('role-admin', 'role-operational')) AND role NOT IN ('Superadmin')");
        await db.execute("UPDATE users SET role = 'DataAnalyst' WHERE id IN (SELECT user_id FROM user_roles WHERE role_id = 'role-analyst') AND role NOT IN ('Superadmin', 'Admin')");
        await db.execute("UPDATE users SET role = 'Volunteer' WHERE id IN (SELECT user_id FROM user_roles WHERE role_id = 'role-volunteer') AND role NOT IN ('Superadmin', 'Admin', 'DataAnalyst')");
      } catch (syncErr) {
        console.warn('[SchemaInit] MySQL User roles self-healing sync warning:', syncErr.message);
      }

      // Ensure created_by column exists in certificates table in MySQL
      try {
        await db.execute("ALTER TABLE `certificates` ADD COLUMN `created_by` VARCHAR(36) NULL");
      } catch (colErr) {
        // Ignore if column already exists
      }
    } catch (e) {
      console.error('[SchemaInit] MySQL check error:', e.message);
    }
  }
}

module.exports = {
  initSchemaAndSeeds,
  runMysqlScript
};
