const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('Testing connection to XAMPP MariaDB on port 3307...');
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3307,
      user: 'root',
      password: ''
    });
    console.log('SUCCESS! Connected to XAMPP MySQL/MariaDB on port 3307 with user root (no password)!');
    const [dbs] = await conn.query('SHOW DATABASES;');
    console.log('Existing Databases in XAMPP:', dbs.map(d => d.Database));
    
    // Create database caafimaadhub if not exists
    console.log('Creating database "caafimaadhub" in MySQL...');
    await conn.query('CREATE DATABASE IF NOT EXISTS caafimaadhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    console.log('Database "caafimaadhub" is ready!');

    await conn.end();
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

testConnection();
