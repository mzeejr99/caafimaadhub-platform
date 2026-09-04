const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'caafimaadhub'
  });

  const alterQueries = [
    "ALTER TABLE users ADD COLUMN role ENUM('Superadmin', 'Admin', 'DataAnalyst', 'Volunteer', 'Public') NOT NULL DEFAULT 'Public';",
    "ALTER TABLE users ADD COLUMN status ENUM('pending', 'active', 'deactivated') NOT NULL DEFAULT 'active';",
    "ALTER TABLE users ADD COLUMN gender ENUM('MALE', 'FEMALE', 'OTHER') DEFAULT 'OTHER';",
    "ALTER TABLE users ADD COLUMN date_of_birth DATE NULL;",
    "ALTER TABLE users ADD COLUMN profile_image_url LONGTEXT NULL;",
    "ALTER TABLE users ADD COLUMN region VARCHAR(100) DEFAULT 'Banadir';",
    "ALTER TABLE users ADD COLUMN district VARCHAR(100) DEFAULT 'Hodan';",
    "ALTER TABLE users ADD COLUMN village_neighbourhood VARCHAR(150) NULL;",
    "ALTER TABLE users ADD COLUMN latitude DECIMAL(10, 8) NULL;",
    "ALTER TABLE users ADD COLUMN longitude DECIMAL(11, 8) NULL;",
    "ALTER TABLE users ADD COLUMN education_level VARCHAR(100) NULL;",
    "ALTER TABLE users ADD COLUMN languages_spoken JSON NULL;",
    "ALTER TABLE users ADD COLUMN motivation_background TEXT NULL;",
    "ALTER TABLE users ADD COLUMN emergency_contact_name VARCHAR(120) NULL;",
    "ALTER TABLE users ADD COLUMN emergency_contact_phone VARCHAR(30) NULL;"
  ];

  for (const q of alterQueries) {
    try {
      await conn.execute(q);
      console.log('[OK]', q.slice(0, 50));
    } catch (err) {
      console.log('[Ignored/Exists]', err.sqlMessage || err.message);
    }
  }

  await conn.end();
  console.log('Migration completed successfully!');
}

migrate().catch(console.error);
