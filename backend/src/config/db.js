const fs = require('fs');
const path = require('path');

function getClientType() {
  return process.env.DB_CLIENT || 'sqlite';
}

let pool = null;
let sqliteDb = null;

// Ensure data directory exists for SQLite
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function initDb() {
  const dbClient = getClientType();
  if (dbClient === 'mysql') {
    const mysql = require('mysql2/promise');
    if (!pool) {
      pool = mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'caafimaadhub',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4',
        dateStrings: true,
        decimalNumbers: true
      });
      console.log(`[Database] Initialized MySQL Connection Pool on port ${process.env.DB_PORT || '3306'}.`);
    }
  } else {
    if (!sqliteDb) {
      const Database = require('better-sqlite3');
      const dbPath = path.join(dataDir, 'caafimaadhub.sqlite');
      sqliteDb = new Database(dbPath);
      sqliteDb.pragma('journal_mode = WAL');
      sqliteDb.pragma('foreign_keys = ON');
      console.log(`[Database] Initialized SQLite Database at: ${dbPath}`);
    }
  }
}

function sanitizeParams(params) {
  if (!Array.isArray(params)) return params;
  return params.map(p => (p === undefined ? null : p));
}

async function query(sql, params = []) {
  if (!pool && !sqliteDb) initDb();
  const safeParams = sanitizeParams(params);

  if (getClientType() === 'mysql') {
    const [rows] = await pool.query(sql, safeParams);
    return rows;
  } else {
    const stmt = sqliteDb.prepare(sql);
    if (sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('PRAGMA') || sql.trim().toUpperCase().startsWith('SHOW')) {
      return stmt.all(safeParams);
    } else {
      const result = stmt.run(safeParams);
      return {
        insertId: result.lastInsertRowid,
        affectedRows: result.changes
      };
    }
  }
}

async function getOne(sql, params = []) {
  if (!pool && !sqliteDb) initDb();
  const safeParams = sanitizeParams(params);

  if (getClientType() === 'mysql') {
    const [rows] = await pool.query(sql, safeParams);
    return rows && rows.length > 0 ? rows[0] : null;
  } else {
    const stmt = sqliteDb.prepare(sql);
    return stmt.get(safeParams) || null;
  }
}

async function execute(sql, params = []) {
  if (!pool && !sqliteDb) initDb();
  const safeParams = sanitizeParams(params);

  if (getClientType() === 'mysql') {
    const [result] = await pool.execute(sql, safeParams);
    return result;
  } else {
    const stmt = sqliteDb.prepare(sql);
    const result = stmt.run(safeParams);
    return {
      insertId: result.lastInsertRowid,
      affectedRows: result.changes
    };
  }
}

async function runTransaction(callback) {
  if (!pool && !sqliteDb) initDb();

  if (getClientType() === 'mysql') {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } else {
    const txn = sqliteDb.transaction(callback);
    return txn();
  }
}

module.exports = {
  initDb,
  query,
  getOne,
  execute,
  runTransaction,
  getClientType,
  getSqliteDb: () => sqliteDb,
  getPool: () => pool
};
