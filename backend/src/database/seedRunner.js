const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { splitSqlStatements } = require('./sqlSplitter');

async function runSeeds() {
  require('dotenv').config();
  db.initDb();
  const clientType = db.getClientType();
  console.log(`[SeedRunner] Running seed scripts on ${clientType}...`);

  const seedsPath = path.join(__dirname, '../../../database/seeds.sql');
  let seedsSql = fs.readFileSync(seedsPath, 'utf8');

  // Remove the MySQL-only USE statement and inject a real bcrypt hash
  seedsSql = seedsSql.replace(/USE `?caafimaadhub`?;/gi, '');
  const passwordHash = bcrypt.hashSync('Password123!', 10);
  seedsSql = seedsSql.replace(/\$2a\$10\$[a-zA-Z0-9./]+/g, passwordHash);

  // Seed rows contain semicolons inside text (lesson bodies, answer explanations),
  // so statements are separated with a quote-aware splitter, never a plain split(';').
  const statements = splitSqlStatements(seedsSql);
  let inserted = 0;
  let skipped = 0;
  const failures = [];

  if (clientType === 'mysql') {
    await db.execute('SET FOREIGN_KEY_CHECKS = 0;');
  }

  for (const stmt of statements) {
    try {
      await db.query(stmt);
      inserted++;
    } catch (err) {
      const isDuplicate = err.code === 'ER_DUP_ENTRY' || /UNIQUE constraint failed/i.test(err.message || '');
      if (isDuplicate) {
        skipped++;
      } else {
        failures.push({ statement: stmt.replace(/\s+/g, ' ').slice(0, 120), message: err.message });
      }
    }
  }

  if (clientType === 'mysql') {
    await db.execute('SET FOREIGN_KEY_CHECKS = 1;');
  }

  console.log(`[SeedRunner] ${inserted} statement(s) executed, ${skipped} skipped (already present).`);
  if (failures.length > 0) {
    console.error(`[SeedRunner] ${failures.length} statement(s) failed:`);
    failures.forEach(f => console.error(`  ${f.statement}\n    -> ${f.message}`));
  } else {
    console.log('[SeedRunner] Seeding completed successfully.');
  }

  return { inserted, skipped, failures };
}

if (require.main === module) {
  runSeeds().then((r) => process.exit(r.failures.length ? 1 : 0)).catch(err => {
    console.error('[SeedRunner] Error:', err);
    process.exit(1);
  });
}

module.exports = { runSeeds };
