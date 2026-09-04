require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { splitSqlStatements } = require('./src/database/sqlSplitter');

async function findAvailablePort(host, user, password, preferredPort) {
  const portsToTry = [preferredPort, 3306, 3307].filter((v, i, a) => v && a.indexOf(v) === i);
  for (const p of portsToTry) {
    try {
      const conn = await mysql.createConnection({
        host,
        port: p,
        user,
        password,
        connectTimeout: 3000
      });
      await conn.end();
      return p;
    } catch (err) {
      // Continue to next port
    }
  }
  return null;
}

/**
 * Runs a .sql script one statement at a time so a single bad statement can be
 * reported by name instead of aborting the whole import silently.
 * Returns { executed, skipped, failures[] }.
 */
async function runSqlScript(conn, sql, { ignoreDuplicates = false } = {}) {
  const statements = splitSqlStatements(sql);
  const result = { total: statements.length, executed: 0, skipped: 0, failures: [] };

  for (const stmt of statements) {
    // `USE db` is unnecessary - the connection is already bound to the database
    if (/^USE\s+/i.test(stmt)) {
      result.skipped++;
      continue;
    }
    try {
      await conn.query(stmt);
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

async function dropAllTables(conn, dbName) {
  const [rows] = await conn.query(
    'SELECT table_name AS t FROM information_schema.tables WHERE table_schema = ?',
    [dbName]
  );
  if (!rows.length) return 0;

  await conn.query('SET FOREIGN_KEY_CHECKS = 0;');
  for (const row of rows) {
    await conn.query(`DROP TABLE IF EXISTS \`${row.t}\``);
  }
  await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
  return rows.length;
}

async function migrateToMySQL({ reset = false } = {}) {
  console.log('=======================================================');
  console.log('  CaafimaadHub — Automated MySQL Database Setup');
  console.log('=======================================================');

  const host = process.env.DB_HOST || '127.0.0.1';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'caafimaadhub';
  const preferredPort = parseInt(process.env.DB_PORT || '3306', 10);

  console.log('[1/5] Detecting running MySQL/MariaDB server...');
  const activePort = await findAvailablePort(host, user, password, preferredPort);

  if (!activePort) {
    console.error(`[ERROR] Could not connect to MySQL on host ${host} (tried ports ${preferredPort}, 3306, 3307).`);
    console.error('Please make sure MySQL/MariaDB or XAMPP/WAMP is running!');
    process.exit(1);
  }

  console.log(`      OK Connected to MySQL server at ${host}:${activePort}`);

  try {
    // 1. Connect without database to create it
    console.log(`[2/5] Creating database \`${dbName}\` if not exists...`);
    const rootConn = await mysql.createConnection({ host, port: activePort, user, password });
    await rootConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await rootConn.end();
    console.log(`      OK Database \`${dbName}\` is ready.`);

    // 2. Connect directly to target database
    const dbConn = await mysql.createConnection({
      host,
      port: activePort,
      user,
      password,
      database: dbName,
      multipleStatements: false
    });

    if (reset) {
      const dropped = await dropAllTables(dbConn, dbName);
      console.log(`      OK --reset: dropped ${dropped} existing table(s) for a clean rebuild.`);
    }

    console.log('[3/5] Importing tables and schema from database/schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');

    await dbConn.query('SET FOREIGN_KEY_CHECKS = 0;');
    const schemaResult = await runSqlScript(dbConn, schemaSql);
    console.log(`      OK Schema: ${schemaResult.executed}/${schemaResult.total} statements executed.`);
    if (schemaResult.failures.length) {
      console.error(`      ${schemaResult.failures.length} schema statement(s) failed:`);
      schemaResult.failures.forEach(f => console.error(`        [${f.code}] ${f.statement}\n          -> ${f.message}`));
    }

    // 3. Import seed data
    console.log('[4/5] Importing operational seed data from database/seeds.sql...');
    let seedsSql = fs.readFileSync(path.join(__dirname, '../database/seeds.sql'), 'utf8');

    // Replace placeholder bcrypt hashes with a real valid Password123! hash
    const validHash = bcrypt.hashSync('Password123!', 10);
    seedsSql = seedsSql.replace(/\$2a\$10\$[a-zA-Z0-9./]+/g, validHash);

    const seedResult = await runSqlScript(dbConn, seedsSql, { ignoreDuplicates: true });
    await dbConn.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log(
      `      OK Seeds: ${seedResult.executed}/${seedResult.total} statements executed` +
      (seedResult.skipped ? `, ${seedResult.skipped} skipped (already present)` : '') + '.'
    );
    if (seedResult.failures.length) {
      console.error(`      ${seedResult.failures.length} seed statement(s) failed:`);
      seedResult.failures.forEach(f => console.error(`        [${f.code}] ${f.statement}\n          -> ${f.message}`));
    }

    // 4. Verification
    const [tables] = await dbConn.query('SHOW TABLES;');
    const counts = {};
    for (const t of ['users', 'volunteers', 'campaigns', 'tasks', 'training_courses', 'training_lessons',
      'training_quizzes', 'inventory_items', 'schedules', 'field_forms']) {
      try {
        const [[row]] = await dbConn.query(`SELECT COUNT(*) AS c FROM \`${t}\``);
        counts[t] = row.c;
      } catch (err) {
        counts[t] = `ERR (${err.code})`;
      }
    }

    console.log('\n[5/5] Verification Results:');
    console.log(`      Total Tables: ${tables.length}`);
    Object.entries(counts).forEach(([t, c]) => console.log(`      ${String(c).padStart(5)}  ${t}`));

    const emptyCore = Object.entries(counts).filter(([, c]) => c === 0).map(([t]) => t);
    await dbConn.end();

    // 5. Update backend/.env file
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent
        .replace(/DB_CLIENT=.*/g, 'DB_CLIENT=mysql')
        .replace(/DB_PORT=.*/g, `DB_PORT=${activePort}`)
        .replace(/DB_NAME=.*/g, `DB_NAME=${dbName}`)
        .replace(/DB_USER=.*/g, `DB_USER=${user}`)
        .replace(/DB_PASSWORD=.*/g, `DB_PASSWORD=${password}`);
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log(`\nOK backend/.env updated (DB_CLIENT=mysql, DB_PORT=${activePort})`);
    }

    const failed = schemaResult.failures.length + seedResult.failures.length;
    console.log('=======================================================');
    if (failed === 0 && emptyCore.length === 0) {
      console.log('  MySQL Database Setup Completed Successfully!');
    } else {
      if (emptyCore.length) {
        console.log(`  WARNING: these core tables are still empty: ${emptyCore.join(', ')}`);
        console.log('  Re-run with --reset for a clean rebuild:  node migrate_to_mysql.js --reset');
      }
      if (failed) console.log(`  WARNING: ${failed} statement(s) failed - see the log above.`);
    }
    console.log('=======================================================\n');

    return { failed, emptyCore };
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  const reset = process.argv.includes('--reset');
  migrateToMySQL({ reset });
}

module.exports = { migrateToMySQL, runSqlScript, splitSqlStatements };
