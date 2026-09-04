require('dotenv').config();
const authService = require('./src/services/authService');
const db = require('./src/config/db');

async function testBackend() {
  try {
    console.log('Testing MySQL Backend Integration...');
    console.log(`DB Client: ${db.getClientType()}`);
    console.log(`DB Port: ${process.env.DB_PORT}`);

    // Test Login with Super Admin in MySQL
    console.log('\n[1] Testing Super Admin Login against MySQL...');
    const adminLogin = await authService.login('superadmin@example.com', 'Password123!');
    console.log(`  -> SUCCESS! Logged in as: ${adminLogin.user.fullName} (${adminLogin.user.role})`);
    console.log(`  -> Permissions Count: ${adminLogin.user.permissions.length}`);

    // Test Volunteer Login in MySQL
    console.log('\n[2] Testing Volunteer Login against MySQL...');
    const volLogin = await authService.login('volunteer@example.com', 'Password123!');
    console.log(`  -> SUCCESS! Logged in as: ${volLogin.user.fullName} (${volLogin.user.role})`);

    // Test Query Campaigns from MySQL
    console.log('\n[3] Testing Campaigns query in MySQL...');
    const campaigns = await db.query('SELECT code, name, status FROM campaigns');
    console.log(`  -> Found ${campaigns.length} campaigns in MySQL database:`);
    campaigns.forEach(c => console.log(`     - [${c.code}] ${c.name} (${c.status})`));

    // Test Query Volunteers from MySQL
    console.log('\n[4] Testing Volunteers query in MySQL...');
    const volunteers = await db.query('SELECT v.volunteer_id, u.full_name, u.email, v.status FROM volunteers v JOIN users u ON u.id = v.user_id');
    console.log(`  -> Found ${volunteers.length} volunteers in MySQL database:`);
    volunteers.forEach(v => console.log(`     - [${v.volunteer_id}] ${v.full_name} (${v.status})`));

    // Test Query Inventory Items from MySQL
    console.log('\n[5] Testing Inventory query in MySQL...');
    const items = await db.query('SELECT item_code, name, quantity_on_hand, minimum_stock_level FROM inventory_items');
    console.log(`  -> Found ${items.length} inventory items in MySQL:`);
    items.forEach(i => console.log(`     - [${i.item_code}] ${i.name} (Stock: ${i.quantity_on_hand}, Min: ${i.minimum_stock_level})`));

    console.log('\n=== ALL MYSQL TESTS PASSED 100% SUCCESSFULLY! ===\n');
  } catch (err) {
    console.error('Backend MySQL test error:', err);
  }
}

testBackend();
