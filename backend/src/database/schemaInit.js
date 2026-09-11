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

    // Check if seed users exist
    const hasCoreSeed = sqliteDb.prepare("SELECT id FROM users WHERE LOWER(email) = 'superadmin@example.com'").get();
    if (!hasCoreSeed) {
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

    // Ensure superadmin@caafimaadhub.so exists in SQLite
    try {
      const hash = bcrypt.hashSync('super#123', 10);
      const existing = await db.getOne('SELECT id FROM users WHERE LOWER(email) = ?', ['superadmin@caafimaadhub.so']);
      if (existing) {
        await db.execute('UPDATE users SET password_hash = ?, is_active = 1, is_suspended = 0 WHERE id = ?', [hash, existing.id]);
      } else {
        const userId = 'usr-superadmin-01';
        await db.execute(
          'INSERT INTO users (id, organization_id, region_id, district_id, full_name, email, password_hash, preferred_language, role, status, is_active, is_suspended, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, CURRENT_TIMESTAMP)',
          [userId, 'org-fmoh-001', 'reg-banadir', 'dist-hodan', 'Eng. Rooble', 'superadmin@caafimaadhub.so', hash, 'so', 'Superadmin', 'active']
        );
        await db.execute('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, 'role-super-admin']);
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
        await db.execute('UPDATE users SET password_hash = ?, is_active = 1, is_suspended = 0 WHERE id = ?', [hash, existing.id]);
      } else {
        const userId = 'usr-superadmin-01';
        await db.execute(
          'INSERT INTO users (id, organization_id, region_id, district_id, full_name, email, password_hash, preferred_language, role, status, is_active, is_suspended, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, CURRENT_TIMESTAMP)',
          [userId, 'org-fmoh-001', 'reg-banadir', 'dist-hodan', 'Eng. Rooble', 'superadmin@caafimaadhub.so', hash, 'so', 'Superadmin', 'active']
        );
        await db.execute('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, 'role-super-admin']);
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
