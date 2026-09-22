// Temporary script to check reference data
const db = require('../config/db');

async function main() {
  db.initDb();
  await new Promise(r => setTimeout(r, 500));

  const regions = await db.query('SELECT id, name FROM regions');
  const districts = await db.query('SELECT id, name, region_id FROM districts LIMIT 30');
  const admins = await db.query(`SELECT u.id, u.full_name FROM users u 
    WHERE u.id IN (SELECT user_id FROM user_roles WHERE role_id IN (SELECT id FROM roles WHERE name IN ('ADMIN','SUPER_ADMIN')))`);
  const users = await db.query(`SELECT id, full_name, role FROM users WHERE role IN ('Admin','SuperAdmin') LIMIT 5`);
  const volunteers = await db.query('SELECT id, user_id, volunteer_id FROM volunteers ORDER BY registration_date');
  const orgs = await db.query('SELECT id, name FROM organizations LIMIT 5');

  console.log('REGIONS:', JSON.stringify(regions));
  console.log('DISTRICTS:', JSON.stringify(districts));
  console.log('ADMINS_ROLES:', JSON.stringify(admins));
  console.log('USERS_ROLE:', JSON.stringify(users));
  console.log('VOLUNTEERS:', JSON.stringify(volunteers));
  console.log('ORGS:', JSON.stringify(orgs));

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
