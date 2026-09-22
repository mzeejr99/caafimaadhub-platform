const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

async function seed30Users() {
  console.log('--- Starting Registration of 30 System Users ---');
  db.initDb();

  const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);

  // 1. Data Analysts (2 users: analy2, analy3)
  const analysts = [
    {
      name: 'Maryan Cabdi Cilmi',
      email: 'analy2@caafimaadhub.so',
      phone: '0615000007',
      gender: 'FEMALE',
      dob: '1996-08-14'
    },
    {
      name: 'Khaalid Maxamuud Cali',
      email: 'analy3@caafimaadhub.so',
      phone: '0615000008',
      gender: 'MALE',
      dob: '1995-12-03'
    }
  ];

  // 2. Volunteers (19 users: vol2 - vol20)
  const volunteers = [
    { name: 'Faadumo Axmed Jaamac', email: 'vol2@caafimaadhub.so', phone: '0615000009', gender: 'FEMALE', dob: '1999-03-14', dist: 'dist-hodan', village: 'KPP', volId: 'CHV-SOM-2026-1663', edu: 'SECONDARY' },
    { name: 'Xasan Nuur Cabdulle', email: 'vol3@caafimaadhub.so', phone: '0615000010', gender: 'MALE', dob: '1997-07-22', dist: 'dist-waberi', village: 'Ceel Gaab', volId: 'CHV-SOM-2026-1664', edu: 'DIPLOMA_NURSING' },
    { name: 'Hani Cumar Guuleed', email: 'vol4@caafimaadhub.so', phone: '0615000011', gender: 'FEMALE', dob: '2001-11-05', dist: 'dist-yaqshid', village: 'Suuq Bacaad', volId: 'CHV-SOM-2026-1665', edu: 'SECONDARY' },
    { name: 'Cabdixaafid Shiikh Maxamed', email: 'vol5@caafimaadhub.so', phone: '0615000012', gender: 'MALE', dob: '1996-01-19', dist: 'dist-daynile', village: 'Buulasho', volId: 'CHV-SOM-2026-1666', edu: 'BACHELORS_PUBLIC_HEALTH' },
    { name: 'Nasro Yuusuf Aadan', email: 'vol6@caafimaadhub.so', phone: '0615000013', gender: 'FEMALE', dob: '2000-09-30', dist: 'dist-hodan', village: 'Tarabuunka', volId: 'CHV-SOM-2026-1667', edu: 'SECONDARY' },
    { name: 'Maxamed Isaaq Cismaan', email: 'vol7@caafimaadhub.so', phone: '0615000014', gender: 'MALE', dob: '1998-04-12', dist: 'dist-waberi', village: 'Dabka', volId: 'CHV-SOM-2026-1668', edu: 'COMMUNITY_HEALTH_CERT' },
    { name: 'Zahra Maxamuud Xuseen', email: 'vol8@caafimaadhub.so', phone: '0615000015', gender: 'FEMALE', dob: '2002-02-18', dist: 'dist-yaqshid', village: 'Fagax', volId: 'CHV-SOM-2026-1669', edu: 'SECONDARY' },
    { name: 'Ibraahim Cabdiraxmaan Saalax', email: 'vol9@caafimaadhub.so', phone: '0615000016', gender: 'MALE', dob: '1995-08-25', dist: 'dist-hodan', village: 'Banaadir', volId: 'CHV-SOM-2026-1670', edu: 'DIPLOMA_NURSING' },
    { name: 'Raxmo Cali Warsame', email: 'vol10@caafimaadhub.so', phone: '0615000017', gender: 'FEMALE', dob: '1999-12-03', dist: 'dist-daynile', village: 'Siigaale', volId: 'CHV-SOM-2026-1671', edu: 'SECONDARY' },
    { name: 'Liibaan Shire Guure', email: 'vol11@caafimaadhub.so', phone: '0615000018', gender: 'MALE', dob: '1997-06-17', dist: 'dist-waberi', village: 'Al-baraka', volId: 'CHV-SOM-2026-1672', edu: 'SECONDARY' },
    { name: 'Deeqa Maxamed Samatar', email: 'vol12@caafimaadhub.so', phone: '0615000019', gender: 'FEMALE', dob: '2001-08-09', dist: 'dist-hodan', village: 'Talex', volId: 'CHV-SOM-2026-1673', edu: 'BACHELORS_PUBLIC_HEALTH' },
    { name: 'Cabdirisaaq Faarax Cilmi', email: 'vol13@caafimaadhub.so', phone: '0615000020', gender: 'MALE', dob: '1996-10-27', dist: 'dist-yaqshid', village: 'Cali Kamin', volId: 'CHV-SOM-2026-1674', edu: 'SECONDARY' },
    { name: 'Fartuun Cabdullaahi Nuur', email: 'vol14@caafimaadhub.so', phone: '0615000021', gender: 'FEMALE', dob: '2000-05-15', dist: 'dist-daynile', village: 'Zone 4', volId: 'CHV-SOM-2026-1675', edu: 'DIPLOMA_NURSING' },
    { name: 'Yaxye Cali Dhuxul', email: 'vol15@caafimaadhub.so', phone: '0615000022', gender: 'MALE', dob: '1998-11-11', dist: 'dist-hodan', village: 'Sayidka', volId: 'CHV-SOM-2026-1676', edu: 'SECONDARY' },
    { name: 'Sahra Cabdi Rooble', email: 'vol16@caafimaadhub.so', phone: '0615000023', gender: 'FEMALE', dob: '2003-01-20', dist: 'dist-waberi', village: 'Geed Jaceyl', volId: 'CHV-SOM-2026-1677', edu: 'SECONDARY' },
    { name: 'Bashiir Maxamed Jaamac', email: 'vol17@caafimaadhub.so', phone: '0615000024', gender: 'MALE', dob: '1994-07-08', dist: 'dist-yaqshid', village: 'Beexaani', volId: 'CHV-SOM-2026-1678', edu: 'COMMUNITY_HEALTH_CERT' },
    { name: 'Khadro Xasan Geedi', email: 'vol18@caafimaadhub.so', phone: '0615000025', gender: 'FEMALE', dob: '2002-04-04', dist: 'dist-hodan', village: 'KPP', volId: 'CHV-SOM-2026-1679', edu: 'SECONDARY' },
    { name: 'Mustaf Cabdi Shire', email: 'vol19@caafimaadhub.so', phone: '0615000026', gender: 'MALE', dob: '1997-12-29', dist: 'dist-daynile', village: 'Kaxda', volId: 'CHV-SOM-2026-1680', edu: 'DIPLOMA_NURSING' },
    { name: 'Leyla Cismaan Nuur', email: 'vol20@caafimaadhub.so', phone: '0615000027', gender: 'FEMALE', dob: '2001-03-23', dist: 'dist-waberi', village: 'Ceel Gaab', volId: 'CHV-SOM-2026-1681', edu: 'SECONDARY' }
  ];

  // 3. Public Users (9 users: pub2 - pub10)
  const publicUsers = [
    { name: 'Farxaan Maxamed Cabdulle', email: 'pub2@caafimaadhub.so', phone: '0615000028', gender: 'MALE', dob: '1995-04-10' },
    { name: 'Idil Xasan Cilmi', email: 'pub3@caafimaadhub.so', phone: '0615000029', gender: 'FEMALE', dob: '1998-09-18' },
    { name: 'Mukhtaar Cali Guuleed', email: 'pub4@caafimaadhub.so', phone: '0615000030', gender: 'MALE', dob: '1993-02-27' },
    { name: 'Nimco Cabdi Warsame', email: 'pub5@caafimaadhub.so', phone: '0615000031', gender: 'FEMALE', dob: '2000-06-12' },
    { name: 'Cabdisalaan Nuur Maxamuud', email: 'pub6@caafimaadhub.so', phone: '0615000032', gender: 'MALE', dob: '1996-11-04' },
    { name: 'Shukri Axmed Isaaq', email: 'pub7@caafimaadhub.so', phone: '0615000033', gender: 'FEMALE', dob: '1997-03-08' },
    { name: 'Guuleed Cismaan Cali', email: 'pub8@caafimaadhub.so', phone: '0615000034', gender: 'MALE', dob: '1994-10-15' },
    { name: 'Samira Xuseen Jaamac', email: 'pub9@caafimaadhub.so', phone: '0615000035', gender: 'FEMALE', dob: '2001-07-21' },
    { name: 'Cabdiqani Shire Maxamed', email: 'pub10@caafimaadhub.so', phone: '0615000036', gender: 'MALE', dob: '1992-05-30' }
  ];

  // Insert Analysts
  for (const a of analysts) {
    const userId = uuidv4();
    await db.execute(
      `INSERT INTO users (
        id, email, password_hash, full_name, phone, gender, date_of_birth,
        role, status, region, district, preferred_language, is_active, is_suspended, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'DataAnalyst', 'active', 'Banadir', 'Hodan', 'so', 1, 0, CURRENT_TIMESTAMP)`,
      [userId, a.email, defaultPasswordHash, a.name, a.phone, a.gender, a.dob]
    );

    await db.execute(`INSERT INTO user_roles (user_id, role_id) VALUES (?, 'role-analyst')`, [userId]);
    console.log(`[+] Created Data Analyst: ${a.email} (${a.name})`);
  }

  // Insert Volunteers
  for (const v of volunteers) {
    const userId = uuidv4();
    const volId = uuidv4();
    const languages = JSON.stringify(['Somali', 'English']);

    await db.execute(
      `INSERT INTO users (
        id, email, password_hash, full_name, phone, gender, date_of_birth,
        role, status, region, district, village_neighbourhood, education_level,
        languages_spoken, motivation_background, emergency_contact_name, emergency_contact_phone,
        preferred_language, is_active, is_suspended, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Volunteer', 'active', 'Banadir', 'Hodan', ?, ?, ?, 'Dedicated to community health outreach', 'Qoyska / Ehelka', '0612000099', 'so', 1, 0, CURRENT_TIMESTAMP)`,
      [userId, v.email, defaultPasswordHash, v.name, v.phone, v.gender, v.dob, v.village, v.edu, languages]
    );

    await db.execute(`INSERT INTO user_roles (user_id, role_id) VALUES (?, 'role-volunteer')`, [userId]);

    await db.execute(
      `INSERT INTO volunteers (
        id, user_id, volunteer_id, gender, date_of_birth, region_id, district_id,
        village_name, education_level, emergency_contact_name, emergency_contact_phone,
        availability_status, status, profile_completed, registration_date
      ) VALUES (?, ?, ?, ?, ?, 'reg-banadir', ?, ?, ?, 'Qoyska / Ehelka', '0612000099', 'AVAILABLE', 'ACTIVE', 1, CURRENT_TIMESTAMP)`,
      [volId, userId, v.volId, v.gender, v.dob, v.dist, v.village, v.edu]
    );

    console.log(`[+] Created Volunteer: ${v.email} (${v.name}) - ${v.volId}`);
  }

  // Insert Public Users
  for (const p of publicUsers) {
    const userId = uuidv4();
    await db.execute(
      `INSERT INTO users (
        id, email, password_hash, full_name, phone, gender, date_of_birth,
        role, status, region, district, preferred_language, is_active, is_suspended, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Public', 'active', 'Banadir', 'Hodan', 'so', 1, 0, CURRENT_TIMESTAMP)`,
      [userId, p.email, defaultPasswordHash, p.name, p.phone, p.gender, p.dob]
    );

    await db.execute(`INSERT INTO user_roles (user_id, role_id) VALUES (?, 'role-public')`, [userId]);
    console.log(`[+] Created Public User: ${p.email} (${p.name})`);
  }

  console.log('\n--- SUCCESS: 30 users created seamlessly! ---');
  process.exit(0);
}

seed30Users().catch(err => {
  console.error('Failed to seed users:', err);
  process.exit(1);
});
