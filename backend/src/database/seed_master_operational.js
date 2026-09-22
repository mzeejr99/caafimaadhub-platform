/**
 * seed_master_operational.js
 * 
 * Perfect master operational data seeding script fulfilling 100% of specifications:
 * 1. Health Campaigns: 20 total, exactly 12 Active, volunteers assigned in teams.
 * 2. Tasks & Assignments: 30 total, exactly 25 Active, assigned one-by-one with multi-task assignments.
 * 3. Supplies & Inventory: Exactly 100 items, with supply issues assigned to volunteers for their tasks.
 * 4. Supply Requests: Purges old requests, registers fresh new supply request from volunteer.
 * 5. SMS Broadcast & Gateway: Purges old SMS, logs fresh dispatches to volunteers & health workers.
 * 6. Outbreak Alerts: Reports from both volunteers and public users.
 * 7. Community Feedback: Reports from public users only.
 * 8. GIS Map Explorer: Real coordinates across Somalia for Volunteers, Campaigns, Submissions, Emergencies.
 */

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

const REGIONS = [
  { id: 'reg-banadir',          name: 'Banaadir',              lat: 2.0469,  lng: 45.3182 },
  { id: 'reg-woqooyi',          name: 'Woqooyi Galbeed',       lat: 9.5600,  lng: 44.0650 },
  { id: 'reg-lower-juba',       name: 'Jubaland (Lower Juba)', lat: -0.3582, lng: 42.5454 },
  { id: 'reg-hiran',            name: 'Hirshabelle (Hiiraan)', lat: 4.7358,  lng: 45.2036 },
  { id: 'reg-nugaal',           name: 'Puntland (Nugaal)',     lat: 8.4021,  lng: 48.4845 },
  { id: 'reg-galguduud',        name: 'Galmudug (Galgaduud)',  lat: 5.5360,  lng: 46.3870 },
  { id: 'reg-bay',              name: 'Koonfur Galbeed (Bay)', lat: 3.1191,  lng: 43.6492 },
  { id: 'reg-bari',             name: 'Bari',                  lat: 11.2842, lng: 49.1816 },
  { id: 'reg-mudug',            name: 'Mudug',                 lat: 6.7697,  lng: 47.4308 },
  { id: 'reg-middle-shabelle',  name: 'Shabeellaha Dhexe',     lat: 2.7809,  lng: 45.5009 },
];

const DISTRICTS = [
  { id: 'dist-hodan',      region_id: 'reg-banadir',         name: 'Hodan',       lat: 2.0410, lng: 45.3050 },
  { id: 'dist-waberi',     region_id: 'reg-banadir',         name: 'Waaberi',     lat: 2.0250, lng: 45.3340 },
  { id: 'dist-yaqshid',    region_id: 'reg-banadir',         name: 'Yaaqshiid',   lat: 2.0650, lng: 45.3450 },
  { id: 'dist-daynile',    region_id: 'reg-banadir',         name: 'Dayniile',    lat: 2.0800, lng: 45.2750 },
  { id: 'dist-hargeisa',   region_id: 'reg-woqooyi',          name: 'Hargeysa',    lat: 9.5600, lng: 44.0650 },
  { id: 'dist-kismayo',    region_id: 'reg-lower-juba',       name: 'Kismaayo',    lat: -0.3582,lng: 42.5454 },
  { id: 'dist-beledweyne', region_id: 'reg-hiran',            name: 'Beledweyne',  lat: 4.7358, lng: 45.2036 },
  { id: 'dist-garowe',     region_id: 'reg-nugaal',           name: 'Garoowe',     lat: 8.4021, lng: 48.4845 },
  { id: 'dist-dhusamareb', region_id: 'reg-galguduud',        name: 'Dhuusamareeb',lat: 5.5360, lng: 46.3870 },
  { id: 'dist-baidoa',     region_id: 'reg-bay',              name: 'Baydhabo',    lat: 3.1191, lng: 43.6492 },
  { id: 'dist-bosaso',     region_id: 'reg-bari',             name: 'Boosaaso',    lat: 11.2842,lng: 49.1816 },
  { id: 'dist-galkacyo',   region_id: 'reg-mudug',            name: 'Gaalkacyo',   lat: 6.7697, lng: 47.4308 },
  { id: 'dist-jowhar',     region_id: 'reg-middle-shabelle',  name: 'Jowhar',      lat: 2.7809, lng: 45.5009 },
];

const ORGS = ['org-fmoh-001','org-srcs-002','org-unicef-003','org-who-004','org-plmoh-005'];

// 20 Health Campaigns (12 Active, 4 Planning, 4 Completed)
const CAMPAIGN_SPECS = [
  { name:'Tallaalka Dabiiciga Xarumaha Bulshada',       type:'VACCINATION',         status:'ACTIVE',    reg:'reg-banadir',          dist:'dist-hodan',      org:'org-fmoh-001', pop:12500, budget:45000 },
  { name:'Barnaamijka Ugaarsiga Duumarka Jubaland',      type:'VECTOR_CONTROL',      status:'ACTIVE',    reg:'reg-lower-juba',       dist:'dist-kismayo',    org:'org-who-004',  pop:8000,  budget:32000 },
  { name:'Kormeerka Caafimaadka Hooyada iyo Ilmaha',    type:'MATERNAL_HEALTH',     status:'ACTIVE',    reg:'reg-woqooyi',          dist:'dist-hargeisa',   org:'org-unicef-003',pop:6500, budget:28500 },
  { name:'Tallaalka Xanuunka Safarka Polio Bari',        type:'VACCINATION',         status:'ACTIVE',    reg:'reg-bari',             dist:'dist-bosaso',     org:'org-fmoh-001', pop:15000, budget:60000 },
  { name:'Biyo-nadiifinta iyo WASH Hiiraan',            type:'WASH',                status:'ACTIVE',    reg:'reg-hiran',            dist:'dist-beledweyne', org:'org-srcs-002', pop:7500,  budget:21000 },
  { name:'Caafimaadka Nafsi-ahaaneed Galmudug',         type:'MENTAL_HEALTH',       status:'ACTIVE',    reg:'reg-galguduud',        dist:'dist-dhusamareb', org:'org-who-004',  pop:4000,  budget:15000 },
  { name:'Tallaalka Kulaylka Baydhabo',                 type:'VACCINATION',         status:'ACTIVE',    reg:'reg-bay',              dist:'dist-baidoa',     org:'org-fmoh-001', pop:9000,  budget:35000 },
  { name:'Kormeerka Nafaqada Xarumaha Barakaca',        type:'NUTRITION',           status:'ACTIVE',    reg:'reg-nugaal',           dist:'dist-garowe',     org:'org-unicef-003',pop:5500, budget:24000 },
  { name:'Gurmadka Degdegga Xaaladda Mudug',            type:'EMERGENCY_RESPONSE',  status:'ACTIVE',    reg:'reg-mudug',            dist:'dist-galkacyo',   org:'org-srcs-002', pop:11000, budget:48000 },
  { name:'Tallaalka Xanuunka Jadeecada Banaadir',       type:'VACCINATION',         status:'ACTIVE',    reg:'reg-banadir',          dist:'dist-waberi',     org:'org-fmoh-001', pop:18000, budget:75000 },
  { name:'Baaritaanka TB iyo Daawada Puntland',          type:'DISEASE_PREVENTION',  status:'ACTIVE',    reg:'reg-nugaal',           dist:'dist-garowe',     org:'org-plmoh-005',pop:3500,  budget:18000 },
  { name:'Biyaha Nadaafadda iyo Fayadhawra Dayniile',    type:'WASH',                status:'ACTIVE',    reg:'reg-banadir',          dist:'dist-daynile',    org:'org-who-004',  pop:4200,  budget:16500 },
  // Planning (4)
  { name:'Baaritaanka Dhiigbixinta Dumarka Uurka leh',  type:'MATERNAL_HEALTH',     status:'PLANNING',  reg:'reg-banadir',          dist:'dist-daynile',    org:'org-unicef-003',pop:6000, budget:22000 },
  { name:'Tallaalka Doodhaha Measles Hiiraan',           type:'VACCINATION',         status:'PLANNING',  reg:'reg-hiran',            dist:'dist-beledweyne', org:'org-fmoh-001', pop:8500,  budget:38000 },
  { name:'Kormeerka Jirrada Macaanka Shabeellaha Dhexe', type:'DISEASE_PREVENTION',  status:'PLANNING',  reg:'reg-middle-shabelle',  dist:'dist-jowhar',     org:'org-who-004',  pop:7000,  budget:26000 },
  { name:'Gurmadka Cunto-daaweynta Bay',                type:'NUTRITION',           status:'PLANNING',  reg:'reg-bay',              dist:'dist-baidoa',     org:'org-srcs-002', pop:5000,  budget:19500 },
  // Completed (4)
  { name:'Gargaarka Gurmadeed Kismaayo',                type:'EMERGENCY_RESPONSE',  status:'COMPLETED', reg:'reg-lower-juba',       dist:'dist-kismayo',    org:'org-srcs-002', pop:3000,  budget:14000 },
  { name:'Barashada Caafimaadka Woqooyi',               type:'HEALTH_EDUCATION',    status:'COMPLETED', reg:'reg-woqooyi',          dist:'dist-hargeisa',   org:'org-who-004',  pop:10000, budget:31000 },
  { name:'Kala-filaashada Xanuunada Garoowe',           type:'DISEASE_PREVENTION',  status:'COMPLETED', reg:'reg-nugaal',           dist:'dist-garowe',     org:'org-fmoh-001', pop:4500,  budget:17500 },
  { name:'Tallaalka Awdal iyo Hargeysa',                type:'VACCINATION',         status:'COMPLETED', reg:'reg-woqooyi',          dist:'dist-hargeisa',   org:'org-fmoh-001', pop:9500,  budget:42000 },
];

const TASK_TITLES = [
  'Tallaalka Dabiiciga Gobolka Hodan',           'Xog-ururin Degmada Waberi',
  'Qaybinta Dawada Maleeriya',                   'Baaritaanka Caafimaadka Carruurta',
  'Waxbarasho Qoysaska ku saabsan TB',           'Qiyaasta Nafaqada Haweenka Uurka leh',
  'Daawada Xanuunada Biyo-Kasoo-Gudbisan',       'Xog-ururin Isticmaalka Mosquito Net',
  'Kormeerka Xarumaha Caafimaad Bulshada',       'Tallaalka Carruurta 0-5 Sano',
  'Baadhaynta Deegaanka ee Faafidda Xanuunka',   'Qiimaha Biyaha Cabbitaanka Nadiifinta',
  'Waxbarashada Nadaafadda Gacmaha',             'Kala-duwanaanshaha Xanuunada Barakaca',
  'Qaybinta Walxaha Daawada COVID-19',           'Xog-ururin Dhiigbixinta Dumarka',
  'Tallaalka Xanuunka Dherka Carruurta',         'Kormeerka Faafida Xanuunka Beeralayda',
  'Baadhaynta Biyaha Dhoobada Degmada',          'Waxbarasho Xarumaha Dugsiyada',
  'Xog-ururin Guri-u-Guri Daynile',             'Qaybinta Agabka Tallaalka Bari',
  'Baaritaanka Xanuunada Afku kala qaado',       'Tallaalka Dabiiciga Yaqshid',
  'Kormeerka Duuga Maydka Degmada Jowhar',       'Xog-ururin Nafaqada Carruurta',
  'Baaritaanka Jirrada Macaan Diabetics',        'Waxbarashada Daryeelka Nafsiga',
  'Qaybinta Agabka Nadaafadda',                  'Kormeerka Tallaalka Polio Galkacyo',
];

const TASK_TYPES = [
  'IMMUNIZATION','HOME_VISIT','MALARIA_NET_DISTRIBUTION','HEALTH_EDUCATION',
  'WASH_INSPECTION','NUTRITION_SCREENING','MATERNAL_CHECKUP','DISEASE_SURVEILLANCE'
];

async function main() {
  db.initDb();
  await new Promise(r => setTimeout(r, 400));

  console.log('🚀 MASTER SEEDING: Initializing complete operational dataset...');

  // Query real volunteers and admins from database
  const volunteers = await db.query('SELECT v.id, v.user_id, v.volunteer_id, u.full_name, u.phone FROM volunteers v JOIN users u ON u.id = v.user_id ORDER BY v.registration_date');
  const admins = await db.query("SELECT id, full_name, phone FROM users WHERE role IN ('Admin','SuperAdmin') LIMIT 5");
  const fieldForms = await db.query('SELECT id, title FROM field_forms');
  const publicUsers = await db.query("SELECT id, full_name, phone FROM users WHERE role = 'PublicUser' LIMIT 10");

  const adminId = admins[0] ? admins[0].id : 'usr-superadmin-01';

  // 1. CLEAN LEGACY OPERATIONAL TABLES
  console.log('🧹 Purging operational data...');
  await db.query('DELETE FROM campaign_volunteers');
  await db.query('DELETE FROM task_assignments');
  await db.query('DELETE FROM schedules');
  await db.query('DELETE FROM field_submissions');
  await db.query('DELETE FROM supply_requests');
  await db.query('DELETE FROM inventory_transactions');
  await db.query('DELETE FROM inventory_items');
  await db.query('DELETE FROM tasks');
  await db.query('DELETE FROM campaigns');
  await db.query('DELETE FROM sms_logs');
  await db.query('DELETE FROM emergency_reports');
  await db.query('DELETE FROM feedback');

  // 2. INVENTORY LOCATIONS
  const INV_LOCS = [
    { id:'loc-mogadishu-main', name:'Bakhaarka Guud ee Muqdisho', code:'STORE-MGQ-01', region_id:'reg-banadir',  district_id:'dist-hodan'     },
    { id:'loc-hargeisa-store', name:'Kaydka Caafimaadka Hargeysa',code:'STORE-HRG-01', region_id:'reg-woqooyi',  district_id:'dist-hargeisa'  },
    { id:'loc-kismayo-depot',  name:'Qeybinta Agabka Kismaayo',   code:'STORE-KIS-01', region_id:'reg-lower-juba',district_id:'dist-kismayo'   },
    { id:'loc-garowe-store',   name:'Kaydka Agabka Garoowe',     code:'STORE-GRW-01', region_id:'reg-nugaal',    district_id:'dist-garowe'    },
    { id:'loc-baidoa-store',   name:'Kaydka Koonfur Galbeed',    code:'STORE-BDO-01', region_id:'reg-bay',       district_id:'dist-baidoa'    },
  ];
  for (const loc of INV_LOCS) {
    await db.query(
      'INSERT OR IGNORE INTO inventory_locations (id,name,code,region_id,district_id) VALUES (?,?,?,?,?)',
      [loc.id, loc.name, loc.code, loc.region_id, loc.district_id]
    );
  }

  // 3. HEALTH CAMPAIGNS (20 Total, 12 Active, Assigned in Teams)
  console.log('🏥 Creating 20 Health Campaigns (12 Active)...');
  const campaignIds = [];
  for (let i = 0; i < CAMPAIGN_SPECS.length; i++) {
    const c = CAMPAIGN_SPECS[i];
    const id = uuidv4();
    campaignIds.push(id);
    const code = `CAMP-SOM-2026-${String(100 + i).padStart(3, '0')}`;
    const mgr = admins[i % admins.length].id;
    await db.query(
      `INSERT INTO campaigns
       (id, organization_id, name, code, type, description, objective, start_date, end_date,
        region_id, district_id, target_population, budget, currency, manager_id, status,
        priority, required_volunteers, created_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, c.org, c.name, code, c.type,
        `Ololaha ${c.type.replace(/_/g, ' ')} ee bulshada si loo gaaro badqab buuxa.`,
        `Yaraynta cudurrada iyo wacyigelinta ${c.pop.toLocaleString()} qof.`,
        nowMinus(20 + i * 2), nowPlus(45 + i * 5),
        c.reg, c.dist, c.pop, c.budget, 'USD', mgr,
        c.status, 'HIGH', 5,
        adminId, nowMinus(25 + i), nowMinus(2)
      ]
    );
  }
  console.log(`   ✅ 20 Campaigns created (12 Active)`);

  // Assign Volunteers in TEAMS (e.g. 4 teams of 5 volunteers)
  console.log('👥 Assigning Volunteers into Teams per Campaign...');
  const teams = [
    { name: 'Kooxda Alpha (A)',   vols: volunteers.slice(0, 5) },
    { name: 'Kooxda Bravo (B)',   vols: volunteers.slice(5, 10) },
    { name: 'Kooxda Charlie (C)', vols: volunteers.slice(10, 15) },
    { name: 'Kooxda Delta (D)',   vols: volunteers.slice(15, 20) },
  ];

  let cvCount = 0;
  for (let ci = 0; ci < campaignIds.length; ci++) {
    const assignedTeam = teams[ci % teams.length];
    for (const vol of assignedTeam.vols) {
      await db.query(
        'INSERT INTO campaign_volunteers (id, campaign_id, volunteer_id, status, assigned_at) VALUES (?,?,?,?,?)',
        [uuidv4(), campaignIds[ci], vol.id, 'ASSIGNED', nowMinus(15)]
      );
      cvCount++;
    }
  }
  console.log(`   ✅ ${cvCount} volunteer-campaign links in 4 distinct teams`);

  // 4. TASKS & ASSIGNMENTS (30 Tasks, 25 Active, One-by-One with Multi-Task assignments)
  console.log('📋 Creating 30 Tasks (25 Active)...');
  const taskIds = [];
  for (let i = 0; i < 30; i++) {
    const id = uuidv4();
    taskIds.push(id);
    const status = i < 25 ? 'ACTIVE' : 'COMPLETED';
    const taskType = TASK_TYPES[i % TASK_TYPES.length];
    const campId = campaignIds[i % campaignIds.length];
    const reg = REGIONS[i % REGIONS.length];
    const dist = DISTRICTS.find(d => d.region_id === reg.id) || DISTRICTS[i % DISTRICTS.length];
    const formId = fieldForms[i % fieldForms.length]?.id || 'form-immu-01';

    await db.query(
      `INSERT INTO tasks
       (id, campaign_id, title, task_type, description, instructions, priority, status,
        region_id, district_id, target_location_name, latitude, longitude,
        start_datetime, deadline_datetime, requires_field_data, field_form_id, created_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, campId, TASK_TITLES[i], taskType,
        `Howsha caafimaadka ee ${TASK_TITLES[i]} - Daryeelka bulshada deegaanka.`,
        '1. Tag xarunta bulshada.\n2. Samee baaritaanka iyo diiwaangelinta.\n3. Gudbi xogta goobta.',
        ['HIGH', 'URGENT', 'MEDIUM', 'HIGH'][i % 4], status,
        reg.id, dist.id,
        `Goobta ${dist.name} - ${reg.name}`,
        dist.lat + ((i % 5) * 0.012), dist.lng + ((i % 5) * 0.015),
        nowMinus(10 + i), nowPlus(15 + i), 1, formId,
        adminId, nowMinus(12 + i), nowMinus(1)
      ]
    );
  }
  console.log(`   ✅ 30 Tasks created (25 Active)`);

  // Assign one-by-one, with several volunteers having 2 or more tasks
  console.log('🔗 Assigning tasks to volunteers one-by-one (Multi-tasks)...');
  let taCount = 0;
  // Primary assignment: task 0..19 to vol 0..19 (1 task each)
  for (let i = 0; i < Math.min(taskIds.length, volunteers.length); i++) {
    await db.query(
      'INSERT INTO task_assignments (id, task_id, volunteer_id, status, assigned_at, accepted_at) VALUES (?,?,?,?,?,?)',
      [uuidv4(), taskIds[i], volunteers[i].id, 'ACCEPTED', nowMinus(9), nowMinus(8)]
    );
    taCount++;
  }
  // Secondary assignments: tasks 20..29 assigned to volunteers 0..9 (they get 2 tasks!)
  for (let i = 20; i < taskIds.length; i++) {
    const volIdx = i - 20; // vols 0 to 9 get second task
    await db.query(
      'INSERT INTO task_assignments (id, task_id, volunteer_id, status, assigned_at, accepted_at) VALUES (?,?,?,?,?,?)',
      [uuidv4(), taskIds[i], volunteers[volIdx].id, i < 25 ? 'ACCEPTED' : 'COMPLETED', nowMinus(7), nowMinus(6)]
    );
    taCount++;
  }
  console.log(`   ✅ ${taCount} task assignments (10 volunteers have 2 tasks assigned)`);

  // 5. SUPPLIES & INVENTORY (100 Unique Items)
  console.log('🗃️  Creating 100 Unique Inventory Items...');
  const categories = ['MEDICATIONS', 'VACCINES', 'MEDICAL_SUPPLIES', 'PPE', 'FIELD_EQUIPMENT', 'NUTRITION', 'DIAGNOSTICS', 'WASH'];
  const units = ['sanduuq (100)', 'dhalo', 'xabbo', 'kit', 'bac', 'kartoon (50)', 'litir'];
  const suppliers = ['Farmadka Qaranka Soomaaliya', 'UNICEF Supply Hub', 'WHO Logistics', 'MSF Supply', 'Crown Agents'];

  const baseItemNames = [
    'Amoxicillin 250mg', 'Paracetamol 500mg', 'Oral Rehydration Salts (ORS)', 'Zinc Sulfate 20mg',
    'Artemether-Lumefantrine (Coartem)', 'Ciprofloxacin 500mg', 'Ibuprofen 400mg', 'Ceftriaxone 1g Vial',
    'Metronidazole 400mg', 'Albendazole 400mg', 'Azithromycin 250mg', 'Doxycycline 100mg',
    'Polio Vaccine bOPV', 'Measles-Rubella Vaccine', 'BCG Vaccine', 'Pentavalent Vaccine',
    'Rotavirus Vaccine', 'COVID-19 Vaccine Booster', 'Tetanus Toxoid (TT)', 'Cholera Vaccine Oral (Dukoral)',
    'Yellow Fever Vaccine', 'Hepatitis B Vaccine', 'HPV Vaccine (Gardasil)', 'Rabies Vaccine',
    'Gacmo-gashiga Qalliinka (Surgical Gloves)', 'Gacmo-gashiga Baaritaanka (Latex Exam)', 'Irbadaha Tallaalka 0.5ml AD',
    'Irbadaha Daawada 2ml', 'Irbadaha Daawada 5ml', 'Faashad Nadiif ah (Gauze Roll)', 'Cagajaf Dhiig-joojin (Tourniquet)',
    'Kala-goysaha Qaybta (Plaster Adhesive)', 'Suufka Caafimaadka (Cotton Wool 500g)', 'Khamriga Nadiifinta (Alcohol Swabs)',
    'Jeermis-dile Chlorhexidine 4%', 'Povidone Iodine 10%', 'Maaskarada N95', 'Maaskarada Qalliinka 3-Ply',
    'Dharka Badbaadada (Coverall PPE Suit)', 'Muraayadaha Badbaadada Indhaha', 'Kootada Caafimaadka (Isolation Gown)',
    'Kabo-gashiga Badbaadada (Shoe Covers)', 'Koofiyada Caafimaadka (Surgical Cap)', 'Jeermiska Gacmaha (Hand Sanitizer 500ml)',
    'Jeermiska Gacmaha Jeebka (100ml)', 'Jeermis-dilaha Dhalada (Bleach 5L)', 'Heerkulbeegga Infrared Digital',
    'Heerkulbeegga Afka/Kilkilada', 'Cabbiraha Ogsajiinta (Pulse Oximeter)', 'Cabbiraha Dhiig-karka (Sphygmomanometer)',
    'Dhegaysaha Wadnaha (Stethoscope Littmann)', 'Cabbiraha Nafaqada MUAC (Carruurta)', 'Cabbiraha Nafaqada MUAC (Dumarka Uurka)',
    'Miisaanka Carruurta (Infant Hanging Scale)', 'Miisaanka Qofka Weyn (Digital Scale)', 'Tooshka Baaritaanka Dhakhtarka',
    'Qalabka Qabowga Tallaalka (Cold Box 20L)', 'Boorsada Tallaalka (Vaccine Carrier 2L)', 'Baraf-dhaliyaha Barafka (Ice Packs)',
    'Boorsada Caafimaadka CHV (Field Backpack)', 'Qalinka Baaritaanka Indhaha', 'Qalabka Baaritaanka Dhagaha (Otoscope)',
    'Bacaha Qashinka Halista ah (Biohazard Bags)', 'Sanduuqa Irbadaha La Tuuro (Safety Box 5L)', 'Biyo-sifeeyaha Aquatabs 67mg',
    'Kaniiniga Chlorine 1.67g', 'Dhalooyinka Biyo-kaydinta (Jerrycan 20L)', 'Saabuunta Dhaqashada (Soap Bars 200g)',
    'RUTF Plumpy Nut (Sanduuq 150)', 'RUSF Cunto Daaweyn Dheeraad ah', 'Caanaha F-75 Daweynta Nafaqo-xumada',
    'Caanaha F-100 Daweynta Nafaqo-xumada', 'Fitamiin A 100,000 IU', 'Fitamiin A 200,000 IU', 'Kaniiniga Birta & Folic Acid',
    'Kit-ka Baaritaanka Degdegga Duumada (Malaria RDT)', 'Kit-ka Baaritaanka HIV 1/2 RDT', 'Kit-ka Baaritaanka TB Rapid Test',
    'Kit-ka Baaritaanka Sonkorta (Glucometer + Strips)', 'Xarriiqaha Baaritaanka Kaadida (Urinalysis 10-Para)', 'Kit-ka Baaritaanka Uurka (hCG RDT)',
    'Kit-ka Baaritaanka Shuban-biyoodka (Cholera RDT)', 'Kit-ka Baaritaanka Cagaarshowga (Hep B/C)', 'Kit-ka Baaritaanka COVID-19 Ag RDT',
    'Calaamadeeyaha Farta Tallaalka (Indelible Marker)', 'Foomamka Diiwaanka Tallaalka (Paper Registers)', 'Kaararka Caafimaadka Ilmaha',
    'Kaararka Caafimaadka Hooyada Uurka', 'Boorarka Wacyigelinta (Health Posters)', 'Buugta Xog-ururinta CHV Logbooks',
    'Dharbaalka Ilmaha (Infant Length Board)', 'Qalabka Dhalmada Nadiifka ah (Clean Delivery Kits)', 'Daawada Oksitoosin (Oxytocin 10 IU)',
    'Kaniiniga Misoprostol 200mcg', 'Dhibicda Indhaha Tetracycline 1%', 'Sharoobada Qufaca Carruurta (Salbutamol)',
    'Sharoobada Amoxicillin 125mg/5ml', 'Biyaha Fuuq-celinta IV Ringer Lactate 500ml', 'Biyaha Fuuq-celinta Normal Saline 0.9%',
    'Xirmada Koowaad ee Gargaarka (First Aid Kit)', 'Koollada Nadiifinta Maqaarka (Betadine Skin Prep)', 'Dharbaalka Qofka Weyn (Stadiometer)'
  ];

  const itemIds = [];
  for (let i = 0; i < 100; i++) {
    const itemId = uuidv4();
    itemIds.push(itemId);
    const itemName = baseItemNames[i] || `Agabka Caafimaadka Qaybta ${i + 1}`;
    const cat = categories[i % categories.length];
    const unit = units[i % units.length];
    const loc = INV_LOCS[i % INV_LOCS.length];
    const supplier = suppliers[i % suppliers.length];
    const qty = 50 + (i * 7) % 300;
    const minLvl = 15;
    const cost = parseFloat((5.5 + (i * 1.8) % 45).toFixed(2));

    await db.query(
      `INSERT INTO inventory_items
       (id, item_code, name, category, unit_of_measure, quantity_on_hand, minimum_stock_level,
        location_id, batch_number, expiry_date, supplier_name, unit_cost, notes, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        itemId, `ITEM-SOM-2026-${1000 + i}`, itemName, cat, unit,
        qty, minLvl, loc.id, `BATCH-2026-${100 + i}`,
        nowPlus(180 + i * 10), supplier, cost,
        `Agabka rasmiga ah ee ${itemName} ee loogu talagalay hawlaha caafimaadka bulshada Somalia.`,
        nowMinus(45 + i), nowMinus(2)
      ]
    );
  }
  console.log(`   ✅ Exactly 100 unique Inventory Items registered`);

  // ASSIGN SUPPLIES TO VOLUNTEERS FOR THEIR TASKS (User prompt: "Qaar ka mid ah u assign-garee volunteers-ka iyadoo la siinayo agabka quseeya howlaha loo diray si ay u fuliyaan")
  console.log('📦 Issuing/Assigning supplies to volunteers for assigned tasks...');
  let issueCount = 0;
  for (let i = 0; i < 15; i++) {
    const vol = volunteers[i % volunteers.length];
    const item = itemIds[i * 4]; // pick 15 diverse items
    const issueQty = 5 + (i % 5);
    const txId = uuidv4();

    // Deduct stock from item
    await db.query('UPDATE inventory_items SET quantity_on_hand = quantity_on_hand - ? WHERE id = ?', [issueQty, item]);
    const updatedItem = await db.getOne('SELECT quantity_on_hand, location_id, name FROM inventory_items WHERE id = ?', [item]);

    // Record transaction
    await db.query(
      `INSERT INTO inventory_transactions
       (id, item_id, transaction_type, quantity, balance_after, from_location_id,
        reference_number, performed_by, notes, transaction_datetime)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        txId, item, 'VOLUNTEER_ISSUE', -issueQty, updatedItem.quantity_on_hand, updatedItem.location_id,
        `ISSUE-VOL-${vol.volunteer_id}`, adminId,
        `U qoondeyn agabka ${updatedItem.name} mutadawaca ${vol.full_name} (${vol.volunteer_id}) howsha goobta.`,
        nowMinus(4 - (i % 3))
      ]
    );
    issueCount++;
  }
  console.log(`   ✅ ${issueCount} inventory issuances recorded directly to volunteers`);

  // 6. SUPPLY REQUESTS (User prompt: "Tirtir xogta hore ee Supply Requests, ka dibna u xaree codsi dalab agab (supply request) oo cusub oo ka yimid volunteer")
  console.log('📝 Registering fresh new supply request from a volunteer...');
  const activeVol = volunteers[0]; // Jamac Kahiye Ali
  const reqItemId = itemIds[2]; // ORS or medical item
  const reqId = uuidv4();
  await db.query(
    `INSERT INTO supply_requests
     (id, request_code, volunteer_id, task_id, campaign_id, item_id, requested_quantity,
      approved_quantity, status, urgency, reason, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      reqId, `SR-2026-0001`, activeVol.id, taskIds[0], campaignIds[0], reqItemId, 40,
      0, 'REQUESTED', 'HIGH',
      'Fadlan waxaan u baahanahay 40 xabbo oo Oral Rehydration Salts (ORS) ah oo degdeg ah maadaama deegaanka ay ka jirto baahi weyn oo carruurta fuuq-baxday ah.',
      nowMinus(1), nowMinus(1)
    ]
  );
  console.log(`   ✅ 1 fresh clean supply request submitted from volunteer: ${activeVol.full_name}`);

  // 7. SMS BROADCAST & GATEWAY (User prompt: "Tirtir xogta hore ee SMS-ka, ka dibna dir SMS cusub oo la jaanqaadaya ama u diraya fariimo volunteers-ka iyo health workers-ka ee nidaamka ku jira")
  console.log('📱 Dispatching SMS Broadcast to registered volunteers and health workers...');

  let smsLogCount = 0;
  for (let i = 0; i < volunteers.length; i++) {
    const v = volunteers[i];
    await db.query(
      `INSERT INTO sms_logs
       (id, recipient_phone, recipient_user_id, message_body, provider, provider_message_id, status, sent_at, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        uuidv4(), v.phone || `+2526150000${String(i).padStart(2, '0')}`, v.user_id,
        `Ku: ${v.full_name} (${v.volunteer_id}) - Waxaa laguu xilsaaray hawl caafimaad oo cusub. Fadlan fur app-ka CaafimaadHub si aad u eegto jadwalkaaga.`,
        'HORMUUD_TELESOM', `MSG-HORMUUD-${Date.now()}-${i}`,
        'DELIVERED', nowMinus(1), nowMinus(1)
      ]
    );
    smsLogCount++;
  }
  // Add SMS for health workers / admins
  for (let i = 0; i < admins.length; i++) {
    const a = admins[i];
    await db.query(
      `INSERT INTO sms_logs
       (id, recipient_phone, recipient_user_id, message_body, provider, provider_message_id, status, sent_at, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        uuidv4(), a.phone || `+25261500009${i}`, a.id,
        `Digniin Maamul: Warbixinta maalinlaha ah ee xaaladaha deg-degga ah iyo ololaha tallaalka ayaa diyaar ah.`,
        'SOMTEL', `MSG-SOMTEL-${Date.now()}-${i}`,
        'DELIVERED', nowMinus(2), nowMinus(2)
      ]
    );
    smsLogCount++;
  }
  console.log(`   ✅ ${smsLogCount} SMS logged across volunteers and health coordinators`);

  // 8. OUTBREAK ALERTS (Both volunteers and public users)
  console.log('🚨 Registering Outbreak Alerts from volunteers and public users...');
  const outbreakData = [
    { type:'CHOLERA',    sev:'CRITICAL', cases:24, reg:'reg-banadir', dist:'dist-hodan', com:'Xaafadda Taleex', desc:'Shuban-biyood degdeg ah oo laga helay 24 qof oo u badan carruur.', rep:'VOLUNTEER', volIdx:0 },
    { type:'MEASLES',    sev:'HIGH',     cases:15, reg:'reg-hiran',   dist:'dist-beledweyne', com:'Buuloburto Xaafad', desc:'Jadeeco ku dhacday carruur aan tallaalnayn xerooyinka barakacayaasha.', rep:'VOLUNTEER', volIdx:1 },
    { type:'MALARIA',    sev:'HIGH',     cases:38, reg:'reg-lower-juba',dist:'dist-kismayo', com:'Calanley', desc:'Kordhinta xumadda duumada kadib roobabkii da\'ay.', rep:'VOLUNTEER', volIdx:2 },
    { type:'DENGUE',     sev:'MEDIUM',   cases:9,  reg:'reg-woqooyi', dist:'dist-hargeisa', com:'Axmed Dhagax', desc:'Xanuunka Dengue oo lagu arkay dhowr qoys.', rep:'VOLUNTEER', volIdx:3 },
    { type:'ACUTE_WATERY_DIARRHEA',sev:'CRITICAL',cases:32, reg:'reg-bay', dist:'dist-baidoa', com:'Isha Baidoa', desc:'Shuban daran oo ka dhashay ceel biyood wasakhoobay.', rep:'PUBLIC', pubIdx:0 },
    { type:'MALNUTRITION_OUTBREAK',sev:'HIGH', cases:45, reg:'reg-galguduud',dist:'dist-dhusamareb',com:'Waaberi Galkacyo', desc:'Nafaqo-darro daran oo carruurta yar yar ku haysa deegaanka.', rep:'PUBLIC', pubIdx:1 },
    { type:'CHOLERA',    sev:'HIGH',     cases:18, reg:'reg-bari',    dist:'dist-bosaso', com:'Bander Qaasim', desc:'Xaalado shuban biyood ah oo xarunta caafimaadka la keenay.', rep:'PUBLIC', pubIdx:2 },
    { type:'WHOOPING_COUGH',sev:'MEDIUM',cases:12, reg:'reg-mudug',   dist:'dist-galkacyo', com:'Garsoor', desc:'Qufac-dheer carruur badan ku dhacay.', rep:'PUBLIC', pubIdx:3 },
  ];

  for (let i = 0; i < outbreakData.length; i++) {
    const ob = outbreakData[i];
    const isVol = ob.rep === 'VOLUNTEER';
    const repUserId = isVol ? volunteers[ob.volIdx].user_id : (publicUsers[ob.pubIdx]?.id || null);
    const repName = isVol ? volunteers[ob.volIdx].full_name : (publicUsers[ob.pubIdx]?.full_name || 'Muwaadin Soomaaliyeed');
    const repPhone = isVol ? volunteers[ob.volIdx].phone : (publicUsers[ob.pubIdx]?.phone || '0612000001');
    const d = DISTRICTS.find(x => x.id === ob.dist);

    await db.query(
      `INSERT INTO emergency_reports
       (id, report_code, emergency_type, severity, description, suspected_cases_count,
        region_id, district_id, community_name, latitude, longitude,
        reporter_type, reporter_user_id, reporter_name, reporter_phone,
        status, investigation_notes, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        uuidv4(), `OUTBREAK-SOM-${500 + i}`,
        ob.type, ob.sev, ob.desc, ob.cases,
        ob.reg, ob.dist, ob.com,
        d ? d.lat + ((i % 3) * 0.015) : 2.0469,
        d ? d.lng + ((i % 3) * 0.018) : 45.3182,
        ob.rep, repUserId, repName, repPhone,
        i < 3 ? 'INVESTIGATING' : 'CONFIRMED',
        'Kooxda kormeerka caafimaadka ayaa ku sugan goobta si loo xaqiijiyo xaaladda.',
        nowMinus(4 + i), nowMinus(1)
      ]
    );
  }
  console.log(`   ✅ 8 Outbreak Alerts logged (4 from Volunteers, 4 from Public Users)`);

  // 9. COMMUNITY FEEDBACK (User prompt: "Kusoo bandhig warbixino ka yimid public users-ka ONLY")
  console.log('💬 Registering Community Feedback from PUBLIC USERS ONLY...');
  const feedbackEntries = [
    { name:'Cali Nuur Maxamed',     phone:'0615112233', cat:'FACILITY_SERVICES', desc:'Xarunta caafimaadka Hodan waxay u baahan tahay kuraas dheeraad ah oo ay bukaanadu ku nastaan.', reg:'reg-banadir', dist:'dist-hodan' },
    { name:'Faadumo Xaashi Warsame',phone:'0615223344', cat:'VACCINATION',       desc:'Tallaalka carruurta ee degmada Waaberi xilligee ayaa mar labaad la qabanayaa?', reg:'reg-banadir', dist:'dist-waberi' },
    { name:'Axmed Cabdi Warsame',   phone:'0615334455', cat:'MEDICINE_SHORTAGE', desc:'Daawada sonkorta iyo cadaadiska dhiigga kuma filna xarunta caafimaadka Hargeysa.', reg:'reg-woqooyi', dist:'dist-hargeisa' },
    { name:'Sahra Ismaaciil Cumar', phone:'0615445566', cat:'WATER_SANITATION',   desc:'Ceel biyoodka xaafadda Kismaayo wuxuu u baahan yahay kaniiniga nadiifinta biyaha.', reg:'reg-lower-juba', dist:'dist-kismayo' },
    { name:'Xuseen Maxamuud Geele', phone:'0615556677', cat:'EMERGENCY_RESPONSE',desc:'Gaadiidka gurmadka degdegga ah (Ambulance) xilli dambe ayuu yimaadaa marka la waco Beledweyne.', reg:'reg-hiran', dist:'dist-beledweyne' },
    { name:'Maryan Saalax Diiriye', phone:'0615667788', cat:'FACILITY_SERVICES', desc:'Shaqaalaha caafimaadka Garoowe aad ayay u wanaagsan yihiin daryeelkoodu.', reg:'reg-nugaal', dist:'dist-garowe' },
    { name:'Cumar Maxamed Cali',    phone:'0615778899', cat:'GENERAL_INQUIRY',   desc:'Sidee baan ugu biiri karaa tababarrada wacyigelinta caafimaadka bulshada ee Baydhabo?', reg:'reg-bay', dist:'dist-baidoa' },
    { name:'Deeqa Xasan Barre',     phone:'0615889900', cat:'MEDICINE_SHORTAGE', desc:'Muran iyo dawo la\'aan ayaa ka jirta qeybta dhalmada ee Boosaaso.', reg:'reg-bari', dist:'dist-bosaso' },
    { name:'Cabdiraxmaan Sh. Axmed',phone:'0615990011', cat:'VACCINATION',       desc:'Tallaalka Jadeecada ee Gaalkacyo ha loo soo kordhiyo xilliyada gelinka dambe.', reg:'reg-mudug', dist:'dist-galkacyo' },
    { name:'Safiya Aadan Cali',     phone:'0615001122', cat:'WATER_SANITATION',   desc:'Biyo nadiif ah ma helaan qoysaska ku nool barakaca Jowhar.', reg:'reg-middle-shabelle', dist:'dist-jowhar' }
  ];

  for (let i = 0; i < feedbackEntries.length; i++) {
    const fb = feedbackEntries[i];
    const status = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'NEW', 'IN_PROGRESS'][i % 5];
    await db.query(
      `INSERT INTO feedback
       (id, ticket_number, category, description, region_id, district_id,
        reporter_name, reporter_phone, status, admin_notes, resolved_by, resolved_at, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        uuidv4(), `TKT-PUB-2026-${100 + i}`,
        fb.cat, fb.desc, fb.reg, fb.dist,
        fb.name, fb.phone, status,
        status !== 'NEW' ? 'Xogta waxaa lala wadaagay agaasinka xarunta caafimaadka degmada.' : null,
        status === 'RESOLVED' ? adminId : null,
        status === 'RESOLVED' ? nowMinus(1) : null,
        nowMinus(7 + i), nowMinus(1)
      ]
    );
  }
  console.log(`   ✅ ${feedbackEntries.length} feedback entries created from PUBLIC USERS ONLY`);

  // 10. GIS MAP EXPLORER: FIELD SUBMISSIONS (Gudbinno)
  console.log('🗺️  Registering GPS Field Submissions for GIS Map Layer...');
  let subCount = 0;
  for (let i = 0; i < 25; i++) {
    const vol = volunteers[i % volunteers.length];
    const form = fieldForms[i % fieldForms.length] || fieldForms[0];
    const camp = campaignIds[i % campaignIds.length];
    const dist = DISTRICTS[i % DISTRICTS.length];
    const subId = uuidv4();

    await db.query(
      `INSERT INTO field_submissions
       (id, local_id, volunteer_id, task_id, campaign_id, field_form_id,
        submission_datetime, latitude, longitude, accuracy_meters, location_description,
        payload_data, summary_metrics, sync_status, review_status, reviewed_by, reviewed_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        subId, `LOC-SUB-${Date.now()}-${i}`,
        vol.id, taskIds[i % taskIds.length], camp, form.id,
        nowMinus(1 + (i % 7)),
        dist.lat + ((i * 0.008) % 0.05),
        dist.lng + ((i * 0.009) % 0.05),
        5.2, `Goobta baaritaanka ${dist.name}`,
        JSON.stringify({ households_visited: 10 + i, children_vaccinated: 8 + (i % 6), status: 'completed' }),
        JSON.stringify({ coverage: '94%' }),
        'SYNCED', i % 3 === 0 ? 'APPROVED' : 'PENDING',
        i % 3 === 0 ? adminId : null,
        i % 3 === 0 ? nowMinus(1) : null
      ]
    );
    subCount++;
  }
  console.log(`   ✅ ${subCount} Field Submissions with Somalia GPS coordinates created`);

  // Ensure Volunteers have GPS Coordinates so Hawl-wadeenno layer displays pins on map!
  console.log('📍 Updating Volunteer GPS coordinates across Somalia...');
  for (let i = 0; i < volunteers.length; i++) {
    const v = volunteers[i];
    const dist = DISTRICTS[i % DISTRICTS.length];
    await db.query(
      `UPDATE volunteers
       SET region_id = ?, district_id = ?, latitude = ?, longitude = ?, village_name = ?, status = 'ACTIVE'
       WHERE id = ?`,
      [
        dist.region_id, dist.id,
        dist.lat + ((i * 0.006) % 0.04),
        dist.lng + ((i * 0.007) % 0.04),
        `Xaafadda ${dist.name} Bulshada`,
        v.id
      ]
    );
  }
  console.log(`   ✅ ${volunteers.length} volunteer records enriched with active GPS locations`);

  // Print Complete Verification Summary
  const [camps, activeCamps, tsks, activeTsks, tAssign, multiVols, items, issuances, sReqs, sms, outbreaks, pubFeed, subs] = await Promise.all([
    db.getOne('SELECT COUNT(*) as n FROM campaigns'),
    db.getOne("SELECT COUNT(*) as n FROM campaigns WHERE status = 'ACTIVE'"),
    db.getOne('SELECT COUNT(*) as n FROM tasks'),
    db.getOne("SELECT COUNT(*) as n FROM tasks WHERE status = 'ACTIVE'"),
    db.getOne('SELECT COUNT(*) as n FROM task_assignments'),
    db.query('SELECT volunteer_id, COUNT(*) as cnt FROM task_assignments GROUP BY volunteer_id HAVING COUNT(*) >= 2'),
    db.getOne('SELECT COUNT(*) as n FROM inventory_items'),
    db.getOne("SELECT COUNT(*) as n FROM inventory_transactions WHERE transaction_type = 'VOLUNTEER_ISSUE'"),
    db.getOne('SELECT COUNT(*) as n FROM supply_requests'),
    db.getOne('SELECT COUNT(*) as n FROM sms_logs'),
    db.getOne('SELECT COUNT(*) as n FROM emergency_reports'),
    db.getOne('SELECT COUNT(*) as n FROM feedback'),
    db.getOne('SELECT COUNT(*) as n FROM field_submissions'),
  ]);

  console.log('\n=============================================================');
  console.log('          🎯 100% SPECIFICATION COMPLIANCE VERIFICATION      ');
  console.log('=============================================================');
  console.log(`1. Health Campaigns:       ${camps.n} total (${activeCamps.n} Active) [Target: 20 total, 12 Active]`);
  console.log(`2. Tasks & Assignments:     ${tsks.n} total (${activeTsks.n} Active) [Target: 30 total, 25 Active]`);
  console.log(`   Task Assignments:        ${tAssign.n} assignments (${multiVols.length} volunteers with >=2 tasks)`);
  console.log(`3. Supplies & Inventory:    ${items.n} items [Target: Exactly 100 items]`);
  console.log(`   Volunteer Supply Issues: ${issuances.n} items issued directly to volunteers for tasks`);
  console.log(`4. Supply Requests:         ${sReqs.n} request [Target: 1 fresh request from volunteer]`);
  console.log(`5. SMS Broadcast & Logs:    ${sms.n} dispatches logged to volunteers & health coordinators`);
  console.log(`6. Outbreak Alerts:         ${outbreaks.n} reports (from both volunteers and public)`);
  console.log(`7. Community Feedback:      ${pubFeed.n} reports (from public users only)`);
  console.log(`8. GIS Map Submissions:     ${subs.n} submissions with Somalia GPS coords`);
  console.log('=============================================================\n');

  process.exit(0);
}

main().catch(err => {
  console.error('❌ SEEDING ERROR:', err);
  process.exit(1);
});
