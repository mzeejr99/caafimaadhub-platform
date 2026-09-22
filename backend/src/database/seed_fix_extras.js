// Fix: Add 10 more unique inventory items to reach 100 total
// And add extra task assignments for volunteers needing a second task
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

function nowMinus(days) {
  const d = new Date(); d.setDate(d.getDate() - days);
  return d.toISOString().replace('T',' ').slice(0,19);
}
function nowPlus(days) {
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.toISOString().replace('T',' ').slice(0,19);
}

const VOLS = [
  '157de702-f64c-43e8-8652-2606378fcfa2','9618fb96-aadd-422c-a729-1ced8d11c0d2',
  '708e6189-7351-4b3e-8f14-83f8a392badc','7bd7495a-3c54-49a4-85fa-0200c320280b',
  'fb9fca11-b615-4fd3-bebf-4b2f04380422','c4b06cdd-b6ac-4337-8362-57840512e5f6',
  'ace76d54-df5e-4f9a-a4c9-4b15ad2002e2','5157c766-7e37-4d92-967f-fe5beb6524fb',
  '2f9ee06a-1454-4f0c-9dac-cccc1aebcc75','001b51f6-9903-429e-9cd2-39bcd95724dc',
];

async function main() {
  db.initDb();
  await new Promise(r => setTimeout(r, 500));

  // 1. Add 10 more unique inventory items
  const locIds = ['loc-mogadishu-main','loc-hargeisa-store','loc-kismayo-depot','loc-garowe-store','loc-baidoa-store'];
  const suppliers = ['Farmadka Dowladda','UNICEF Supply Division','MSF Logistics','WHO Somalia','Crown Agents'];

  const extra10 = [
    {name:'Alginate Dressing',               cat:'MEDICAL_SUPPLIES', unit:'sanduuq (20)',  qty:80,  min:10, cost:28.00},
    {name:'Pulse Oximeter Digital',           cat:'FIELD_EQUIPMENT',  unit:'cutubyo',      qty:25,  min:5,  cost:45.00},
    {name:'Sodium Chloride 0.9% IV',          cat:'MEDICATIONS',      unit:'sanduuq (24)', qty:200, min:30, cost:22.00},
    {name:'Hydrocortisone 100mg Injection',   cat:'MEDICATIONS',      unit:'sanduuq (10)', qty:60,  min:10, cost:35.00},
    {name:'Adrenaline 1mg/ml Injection',      cat:'MEDICATIONS',      unit:'sanduuq (10)', qty:50,  min:8,  cost:18.00},
    {name:'Diphenhydramine 50mg',             cat:'MEDICATIONS',      unit:'sanduuq (100)',qty:120, min:20, cost:12.00},
    {name:'Furosemide 40mg Tablets',          cat:'MEDICATIONS',      unit:'sanduuq (100)',qty:150, min:25, cost:8.50 },
    {name:'Nifedipine 10mg',                  cat:'MEDICATIONS',      unit:'sanduuq (100)',qty:100, min:15, cost:9.00 },
    {name:'Insulin Regular (Vials)',          cat:'MEDICATIONS',      unit:'sanduuq (10)', qty:80,  min:10, cost:85.00},
    {name:'Diazepam 5mg Injection',           cat:'MEDICATIONS',      unit:'sanduuq (10)', qty:60,  min:10, cost:14.00},
  ];

  let addedItems = 0;
  const currentCount = await db.getOne('SELECT COUNT(*) AS n FROM inventory_items');
  let startIdx = parseInt(currentCount.n);

  for (let i = 0; i < extra10.length; i++) {
    const item = extra10[i];
    const id = uuidv4();
    const code = `ITEM-SOM-2026-${2000 + i}`; // unique range
    await db.query(
      `INSERT OR IGNORE INTO inventory_items
       (id,item_code,name,category,unit_of_measure,quantity_on_hand,minimum_stock_level,
        location_id,batch_number,expiry_date,supplier_name,unit_cost,notes,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, code, item.name, item.cat, item.unit,
        item.qty, item.min, locIds[i % locIds.length],
        `BATCH-EX-2026-${i}`, nowPlus(365),
        suppliers[i % suppliers.length], item.cost,
        `Agabka gaar ah - ${item.name} - Barnaamijka Caafimaadka Somalia.`,
        nowMinus(30), nowMinus(5)
      ]
    );
    addedItems++;
  }
  console.log(`✅ Added ${addedItems} extra inventory items`);

  // 2. Fix task assignments: give vols 0-9 their SECOND task using different tasks
  // Get all task IDs
  const tasks = await db.query('SELECT id FROM tasks ORDER BY created_at');
  const taskIds = tasks.map(t => t.id);

  let extraAssignments = 0;
  // Use tasks 15-29 as second assignments for vols 0-9 (different from primary)
  for (let vi = 0; vi < 10; vi++) {
    const secondTaskIdx = 15 + vi; // tasks 15-24 (all ACTIVE)
    if (secondTaskIdx < taskIds.length) {
      try {
        await db.query(
          `INSERT OR IGNORE INTO task_assignments
           (id,task_id,volunteer_id,status,assigned_at,accepted_at)
           VALUES (?,?,?,?,?,?)`,
          [uuidv4(), taskIds[secondTaskIdx], VOLS[vi], 'ACCEPTED', nowMinus(8), nowMinus(7)]
        );
        extraAssignments++;
      } catch(e) { console.log('  skip:', e.message); }
    }
  }
  console.log(`✅ Added ${extraAssignments} extra task assignments`);

  // Final counts
  const counts = await Promise.all([
    db.getOne('SELECT COUNT(*) AS n FROM inventory_items'),
    db.getOne('SELECT COUNT(*) AS n FROM task_assignments'),
  ]);
  console.log(`\n📊 Final Counts:`);
  console.log(`   Inventory Items:   ${counts[0].n}`);
  console.log(`   Task Assignments:  ${counts[1].n}`);

  process.exit(0);
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
