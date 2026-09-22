/**
 * seed_operational_data.js
 * Seeds: 20 Health Campaigns, 30 Tasks, 100 Inventory Items,
 *        Supply Requests, SMS Broadcast, Emergency Reports, Community Feedback
 */

const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const ADMIN_ID  = 'usr-superadmin-01';
const ADMIN2_ID = 'c2edb82e-7b2c-4d98-a500-10fc87639bbe';
const ADMIN3_ID = 'ce76908d-c64f-4c0e-aa17-839ba8948630';

const REGIONS = [
  { id: 'reg-banadir',          name: 'Banaadir'              },
  { id: 'reg-woqooyi',          name: 'Woqooyi Galbeed'       },
  { id: 'reg-lower-juba',       name: 'Jubaland (Lower Juba)' },
  { id: 'reg-hiran',            name: 'Hirshabelle (Hiiraan)' },
  { id: 'reg-nugaal',           name: 'Puntland (Nugaal)'     },
  { id: 'reg-galguduud',        name: 'Galmudug (Galgaduud)'  },
  { id: 'reg-bay',              name: 'Koonfur Galbeed (Bay)' },
  { id: 'reg-bari',             name: 'Bari'                  },
  { id: 'reg-mudug',            name: 'Mudug'                 },
  { id: 'reg-middle-shabelle',  name: 'Shabeellaha Dhexe'     },
];

const DISTRICTS = [
  { id: 'dist-hodan',      region_id: 'reg-banadir'         },
  { id: 'dist-waberi',     region_id: 'reg-banadir'         },
  { id: 'dist-yaqshid',    region_id: 'reg-banadir'         },
  { id: 'dist-daynile',    region_id: 'reg-banadir'         },
  { id: 'dist-hargeisa',   region_id: 'reg-woqooyi'         },
  { id: 'dist-kismayo',    region_id: 'reg-lower-juba'      },
  { id: 'dist-beledweyne', region_id: 'reg-hiran'           },
  { id: 'dist-garowe',     region_id: 'reg-nugaal'          },
  { id: 'dist-dhusamareb', region_id: 'reg-galguduud'       },
  { id: 'dist-baidoa',     region_id: 'reg-bay'             },
  { id: 'dist-bosaso',     region_id: 'reg-bari'            },
  { id: 'dist-galkacyo',   region_id: 'reg-mudug'           },
  { id: 'dist-jowhar',     region_id: 'reg-middle-shabelle' },
];

const ORGS = ['org-fmoh-001','org-srcs-002','org-unicef-003','org-who-004','org-plmoh-005'];

const VOLS = [
  '157de702-f64c-43e8-8652-2606378fcfa2',
  '9618fb96-aadd-422c-a729-1ced8d11c0d2',
  '708e6189-7351-4b3e-8f14-83f8a392badc',
  '7bd7495a-3c54-49a4-85fa-0200c320280b',
  'fb9fca11-b615-4fd3-bebf-4b2f04380422',
  'c4b06cdd-b6ac-4337-8362-57840512e5f6',
  'ace76d54-df5e-4f9a-a4c9-4b15ad2002e2',
  '5157c766-7e37-4d92-967f-fe5beb6524fb',
  '2f9ee06a-1454-4f0c-9dac-cccc1aebcc75',
  '001b51f6-9903-429e-9cd2-39bcd95724dc',
  'cabd3068-50d9-4822-944b-86c3cee17171',
  'e50232a1-71a8-45de-ab90-fb54604243f2',
  '3d3ad74a-df9f-479b-8a48-1d42b68eb645',
  '00a03df3-56d0-4bca-bb76-28dbe81fb93c',
  '85cb3774-2cd0-4e84-ab56-8b7545f896cd',
  'a035b051-573b-4874-8fa3-b45aac624008',
  'ddfa27a2-9658-47e2-87af-96d1c0613ea8',
  'abd5055e-9d22-4ccb-9bc8-f3c5a59a1682',
  'b4e6a632-efe4-4f7c-93dd-186bff4ab50b',
  '7e6e2dae-fc48-4bf8-aa3d-2ce8a4b251e2',
];

const VOL_USER_IDS = [
  '9323143b-07a2-4761-b929-9cba48665441',
  'cb568b11-b58e-47cf-888a-c6e360663b4d',
  '1017981e-9e54-467b-b965-956846b41048',
  '790b566a-9dd9-416b-bfe8-60c7446f2f7b',
  'cc4ae5b3-a035-4c2d-8dea-44fbf5a27cb7',
  'f7490b6e-02ef-4cc2-a711-b8e2856339b6',
  '93950f36-7b6d-4ab8-9cc9-592518ebb78d',
  '320284b3-1361-446a-9742-a390c15276b6',
  'ab1419d3-e2a6-4430-8ed8-cb14b9f2c55a',
  'e8ca3897-c4c9-4306-80e3-1d0f2c028f41',
  'f8879c8d-2d84-4c98-921b-599942771dbe',
  '469d4ef4-84a1-451c-ae42-edaf0f45a7e2',
  '7976792b-6fec-4b5e-97a1-13d838c7272b',
  'c01ecca8-6ed8-4180-a82e-bbe21d7664fd',
  '3a2f44f9-20c1-4bd5-b1aa-43c6c0285678',
  '95b4710d-032c-41d8-ad7c-e9505bc2c030',
  'e9f9611c-bfb1-448e-ba28-ad1f5d2c9112',
  'd07ef826-71ba-4925-bbc7-3e8ba994e997',
  'c71ba460-e0c7-4da1-96d3-3f6a6d442c14',
  'da3805f1-1afd-43c0-a103-ac6e6037747e',
];

function nowMinus(days) {
  const d = new Date(); d.setDate(d.getDate() - days);
  return d.toISOString().replace('T',' ').slice(0,19);
}
function nowPlus(days) {
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.toISOString().replace('T',' ').slice(0,19);
}

const CAMPAIGN_DATA = [
  { name:'Tallaalka Dabiiciga Xarumaha Bulshada',       type:'VACCINATION',         status:'ACTIVE',    reg:'reg-banadir',          dist:'dist-hodan',      org:'org-fmoh-001', pop:12500, budget:45000 },
  { name:'Barnaamijka Ugaarsiga Duumarka Jubaland',      type:'VECTOR_CONTROL',      status:'ACTIVE',    reg:'reg-lower-juba',       dist:'dist-kismayo',    org:'org-who-004',  pop:8000,  budget:32000 },
  { name:'Kormeerka Caafimaadka Hooyada iyo Ilmaha',    type:'MATERNAL_HEALTH',     status:'ACTIVE',    reg:'reg-woqooyi',          dist:'dist-hargeisa',   org:'org-unicef-003',pop:6500, budget:28500 },
  { name:'Tallaalka Xanuunka Safarka Polio Bari',        type:'VACCINATION',         status:'ACTIVE',    reg:'reg-bari',             dist:'dist-bosaso',     org:'org-fmoh-001', pop:15000, budget:60000 },
  { name:'Biyo-nadiifinta iyo WASH Hiiraan',            type:'WASH',                status:'ACTIVE',    reg:'reg-hiran',            dist:'dist-beledweyne', org:'org-srcs-002', pop:7500,  budget:21000 },
  { name:'Caafimaadka Nafsi-ahaaneed Galmudug',         type:'MENTAL_HEALTH',       status:'ACTIVE',    reg:'reg-galguduud',        dist:'dist-dhusamareb', org:'org-who-004',  pop:4000,  budget:15000 },
  { name:'Tallaalka Kulaylka Bay',                       type:'VACCINATION',         status:'ACTIVE',    reg:'reg-bay',              dist:'dist-baidoa',     org:'org-fmoh-001', pop:9000,  budget:35000 },
  { name:'Kormeerka Nafaqada Xarumaha Barakaca',        type:'NUTRITION',           status:'ACTIVE',    reg:'reg-nugaal',           dist:'dist-garowe',     org:'org-unicef-003',pop:5500, budget:24000 },
  { name:'Gurmadka Degdegga Xaaladda Mudug',            type:'EMERGENCY_RESPONSE',  status:'ACTIVE',    reg:'reg-mudug',            dist:'dist-galkacyo',   org:'org-srcs-002', pop:11000, budget:48000 },
  { name:'Tallaalka Xanuunka Jeerarka Banaadir',         type:'VACCINATION',         status:'ACTIVE',    reg:'reg-banadir',          dist:'dist-waberi',     org:'org-fmoh-001', pop:18000, budget:75000 },
  { name:'Baaritaanka TB iyo Daawada Puntland',          type:'DISEASE_PREVENTION',  status:'ACTIVE',    reg:'reg-nugaal',           dist:'dist-garowe',     org:'org-plmoh-005',pop:3500,  budget:18000 },
  { name:'Biyaha Nadaafadda Sanaag',                    type:'WASH',                status:'ACTIVE',    reg:'reg-banadir',          dist:'dist-daynile',    org:'org-who-004',  pop:4200,  budget:16500 },
  { name:'Baaritaanka Dhiigbixinta Dumarka',             type:'MATERNAL_HEALTH',     status:'PLANNING',  reg:'reg-banadir',          dist:'dist-daynile',    org:'org-unicef-003',pop:6000, budget:22000 },
  { name:'Tallaalka Doodhaha Measles Hiiraan',           type:'VACCINATION',         status:'PLANNING',  reg:'reg-hiran',            dist:'dist-beledweyne', org:'org-fmoh-001', pop:8500,  budget:38000 },
  { name:'Kormeerka Jirrada Macaan Shabeellaha Dhexe',  type:'DISEASE_PREVENTION',  status:'PLANNING',  reg:'reg-middle-shabelle',  dist:'dist-jowhar',     org:'org-who-004',  pop:7000,  budget:26000 },
  { name:'Gurmadka Cunto-daaweynta Bay',                type:'NUTRITION',           status:'PLANNING',  reg:'reg-bay',              dist:'dist-baidoa',     org:'org-srcs-002', pop:5000,  budget:19500 },
  { name:'Gargaarka Gurmadeed Gedo',                    type:'EMERGENCY_RESPONSE',  status:'COMPLETED', reg:'reg-lower-juba',       dist:'dist-kismayo',    org:'org-srcs-002', pop:3000,  budget:14000 },
  { name:'Barashada Caafimaadka Woqooyi',               type:'HEALTH_EDUCATION',    status:'COMPLETED', reg:'reg-woqooyi',          dist:'dist-hargeisa',   org:'org-who-004',  pop:10000, budget:31000 },
  { name:'Kala-filaashada Xanuunada Togdheer',          type:'DISEASE_PREVENTION',  status:'COMPLETED', reg:'reg-nugaal',           dist:'dist-garowe',     org:'org-fmoh-001', pop:4500,  budget:17500 },
  { name:'Tallaalka Awdal Gobolka',                     type:'VACCINATION',         status:'COMPLETED', reg:'reg-woqooyi',          dist:'dist-hargeisa',   org:'org-fmoh-001', pop:9500,  budget:42000 },
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

const TASK_TYPES = ['VACCINATION','SURVEY','DATA_COLLECTION','DISTRIBUTION','MONITORING','EDUCATION','INVESTIGATION','SAMPLE_COLLECTION'];

const INV_ITEMS_DATA = [
  // PPE (10)
  {name:'Gacmo-xidhe Latex',                    cat:'PPE',             unit:'xirmo (100)',   qty:500,  min:50,  cost:8.50  },
  {name:'Maaskaro N95 Takoorka',                 cat:'PPE',             unit:'cutubyo',       qty:1200, min:100, cost:2.20  },
  {name:'Dharbaaxada Difaaca Qabyaalada',        cat:'PPE',             unit:'dharbaaxo',     qty:350,  min:50,  cost:15.00 },
  {name:'Maaskaro Wajiga Buuxda',                cat:'PPE',             unit:'cutubyo',       qty:180,  min:20,  cost:45.00 },
  {name:'Dhar-gacmeed Dheeraadka Daawada',       cat:'PPE',             unit:'xirmo',         qty:250,  min:30,  cost:12.00 },
  {name:'Sirfays Difaaca Jirka',                 cat:'PPE',             unit:'cutubyo',       qty:400,  min:40,  cost:18.50 },
  {name:'Saanduqa Dharka Lagu tuurto Bio',       cat:'PPE',             unit:'saanduq',       qty:90,   min:10,  cost:25.00 },
  {name:'Goofsiga Koonfur Caafimaadka',          cat:'PPE',             unit:'cutubyo',       qty:700,  min:80,  cost:3.50  },
  {name:'Gacmaha Nitrile',                       cat:'PPE',             unit:'xirmo (100)',   qty:300,  min:40,  cost:9.80  },
  {name:'Astaan Caafimaadeed',                   cat:'PPE',             unit:'cutubyo',       qty:150,  min:20,  cost:5.00  },
  // VACCINES (10)
  {name:'Tallaala OPV Polio Afka',               cat:'VACCINES',        unit:'doos (20xal)',  qty:800,  min:100, cost:4.50  },
  {name:'Tallaala BCG TB',                       cat:'VACCINES',        unit:'doos (20xal)',  qty:500,  min:80,  cost:6.00  },
  {name:'Tallaala Doodhaha Measles',             cat:'VACCINES',        unit:'doos (10xal)',  qty:600,  min:100, cost:9.00  },
  {name:'Tallaala Pentavalent DPT',              cat:'VACCINES',        unit:'doos (10xal)',  qty:450,  min:75,  cost:15.50 },
  {name:'Tallaala COVID-19 AstraZeneca',         cat:'VACCINES',        unit:'doos (10xal)',  qty:1200, min:150, cost:3.00  },
  {name:'Tallaala Cholera OCV',                  cat:'VACCINES',        unit:'doos (10xal)',  qty:350,  min:60,  cost:8.00  },
  {name:'Tallaala Xanuunka Meningitis',          cat:'VACCINES',        unit:'doos (10xal)',  qty:200,  min:40,  cost:12.00 },
  {name:'Tallaala HPV Gabdho',                   cat:'VACCINES',        unit:'doos (10xal)',  qty:180,  min:30,  cost:18.00 },
  {name:'Tallaala Jaundice Hepatitis B',         cat:'VACCINES',        unit:'doos (10xal)',  qty:400,  min:60,  cost:7.50  },
  {name:'Tallaala Yellow Fever',                 cat:'VACCINES',        unit:'doos (10xal)',  qty:250,  min:40,  cost:11.00 },
  // MEDICATIONS (12)
  {name:'Amoxicillin 500mg',                     cat:'MEDICATIONS',     unit:'sanduuq (500)', qty:200,  min:30,  cost:22.00 },
  {name:'Paracetamol 500mg',                     cat:'MEDICATIONS',     unit:'sanduuq (1000)',qty:300,  min:50,  cost:12.00 },
  {name:'Metronidazole 250mg',                   cat:'MEDICATIONS',     unit:'sanduuq (500)', qty:150,  min:25,  cost:18.50 },
  {name:'ORS Dareer Caafimaadka',                cat:'MEDICATIONS',     unit:'saanduq (100)', qty:500,  min:80,  cost:5.50  },
  {name:'Artemether-Lumefantrine Maleeriya',     cat:'MEDICATIONS',     unit:'sanduuq (100)', qty:300,  min:50,  cost:35.00 },
  {name:'Cotrimoxazole 960mg',                   cat:'MEDICATIONS',     unit:'sanduuq (500)', qty:180,  min:30,  cost:14.00 },
  {name:'Zinc 20mg Xabbadaha Carruurta',         cat:'MEDICATIONS',     unit:'sanduuq (200)', qty:400,  min:60,  cost:8.00  },
  {name:'Vitamin A Capsules',                    cat:'MEDICATIONS',     unit:'sanduuq (100)', qty:600,  min:80,  cost:4.50  },
  {name:'Iron Folic Acid Xabbadaha',             cat:'MEDICATIONS',     unit:'sanduuq (1000)',qty:250,  min:40,  cost:10.00 },
  {name:'Albendazole 400mg Cayayaanka',          cat:'MEDICATIONS',     unit:'sanduuq (500)', qty:350,  min:50,  cost:7.00  },
  {name:'Ciprofloxacin 500mg',                   cat:'MEDICATIONS',     unit:'sanduuq (100)', qty:120,  min:20,  cost:28.00 },
  {name:'Ranitidine 150mg',                      cat:'MEDICATIONS',     unit:'sanduuq (500)', qty:200,  min:30,  cost:9.50  },
  // MEDICAL_SUPPLIES (12)
  {name:'Irbado Tallaalka Sharinga',             cat:'MEDICAL_SUPPLIES',unit:'sanduuq (100)', qty:2000, min:200, cost:18.00 },
  {name:'Gaadiidka Dareeraha Veynada',           cat:'MEDICAL_SUPPLIES',unit:'sanduuq (50)',  qty:300,  min:50,  cost:25.00 },
  {name:'Xidmada Dhiigga Bandage',               cat:'MEDICAL_SUPPLIES',unit:'sanduuq (100)', qty:500,  min:80,  cost:12.00 },
  {name:'Madaxa Irbada Tallaalka',               cat:'MEDICAL_SUPPLIES',unit:'sanduuq (100)', qty:1500, min:150, cost:8.50  },
  {name:'Qasabka Dhiigga Gauze Roll',            cat:'MEDICAL_SUPPLIES',unit:'sanduuq (24)',  qty:400,  min:60,  cost:14.00 },
  {name:'Nalaynta Caafimaad Suture Kit',         cat:'MEDICAL_SUPPLIES',unit:'kit',           qty:150,  min:20,  cost:35.00 },
  {name:'Miski Carafka',                         cat:'MEDICAL_SUPPLIES',unit:'cutubyo',       qty:80,   min:10,  cost:120.00},
  {name:'Xidmada Barafka Cold Pack',             cat:'MEDICAL_SUPPLIES',unit:'cutubyo',       qty:200,  min:30,  cost:6.50  },
  {name:'Qaboojiyaha Dhiigga Lancet',            cat:'MEDICAL_SUPPLIES',unit:'sanduuq (200)', qty:600,  min:80,  cost:5.00  },
  {name:'Xirmada Dhaawacaan Wound Dressing',     cat:'MEDICAL_SUPPLIES',unit:'sanduuq (50)',  qty:350,  min:50,  cost:18.00 },
  {name:'Cajaladda IV Drip Set',                 cat:'MEDICAL_SUPPLIES',unit:'cutubyo',       qty:250,  min:40,  cost:3.50  },
  {name:'Tuubada Uruurinta Dhiigga Vacutainer',  cat:'MEDICAL_SUPPLIES',unit:'sanduuq (100)', qty:400,  min:60,  cost:22.00 },
  // DIAGNOSTICS (8)
  {name:'Kit-ka Baaritaanka Maleeriya RDT',      cat:'DIAGNOSTICS',     unit:'sanduuq (25)',  qty:800,  min:100, cost:28.00 },
  {name:'Baaritaanka TB GeneXpert',              cat:'DIAGNOSTICS',     unit:'cutubyo',       qty:200,  min:30,  cost:45.00 },
  {name:'Kit-ka Baaritaanka Caloolaha',          cat:'DIAGNOSTICS',     unit:'sanduuq (50)',  qty:300,  min:40,  cost:15.00 },
  {name:'Qalabka Cabbira Dhiigga Glucometer',    cat:'DIAGNOSTICS',     unit:'cutubyo',       qty:50,   min:5,   cost:85.00 },
  {name:'Uruurinta Caloolaha Stool Test',        cat:'DIAGNOSTICS',     unit:'sanduuq (50)',  qty:200,  min:30,  cost:12.00 },
  {name:'Kit-ka HIV Rapid Test',                 cat:'DIAGNOSTICS',     unit:'sanduuq (25)',  qty:350,  min:50,  cost:32.00 },
  {name:'Qaabka Baaritaanka Uurka',              cat:'DIAGNOSTICS',     unit:'cutubyo',       qty:180,  min:25,  cost:4.50  },
  {name:'Hemoglobinometer Dhiigga Caliber',      cat:'DIAGNOSTICS',     unit:'cutubyo',       qty:35,   min:5,   cost:150.00},
  // NUTRITION (8)
  {name:'RUTF Daaweynta Nafaqada Daran',         cat:'NUTRITION',       unit:'sanduuq (150)', qty:400,  min:60,  cost:42.00 },
  {name:'RUSF Cuntada Nafaqada Dhexdhexaadka',   cat:'NUTRITION',       unit:'sanduuq (80)',  qty:300,  min:50,  cost:28.00 },
  {name:'Powdered Milk WFP',                     cat:'NUTRITION',       unit:'sanduuq (25kg)',qty:250,  min:40,  cost:75.00 },
  {name:'Micronutrient Powder Sprinkles',        cat:'NUTRITION',       unit:'saanduuq (500)',qty:600,  min:80,  cost:8.50  },
  {name:'Bitaamiinka A Drops Carruurta',         cat:'NUTRITION',       unit:'sanduuq (100)', qty:500,  min:70,  cost:5.00  },
  {name:'Sanka Nafaqada Caruurta',               cat:'NUTRITION',       unit:'sanduuq (50)',  qty:180,  min:30,  cost:18.00 },
  {name:'High Energy Biscuit',                   cat:'NUTRITION',       unit:'sanduuq (200)', qty:350,  min:50,  cost:22.00 },
  {name:'Daaweynta Nafaqada Dumarka Uurka leh',  cat:'NUTRITION',       unit:'sanduuq (100)', qty:220,  min:35,  cost:35.00 },
  // WASH_SUPPLIES (10)
  {name:'Chlorine Tablets Biyaha Nadiifinta',    cat:'WASH_SUPPLIES',   unit:'sanduuq (100)', qty:600,  min:80,  cost:5.50  },
  {name:'Saabuunta Gacmaha Dhaqista',            cat:'WASH_SUPPLIES',   unit:'liitar',        qty:1200, min:150, cost:2.50  },
  {name:'Jeericaanada Biyaha Jerry Can 20L',     cat:'WASH_SUPPLIES',   unit:'cutubyo',       qty:200,  min:30,  cost:12.00 },
  {name:'Filter-ka Biyaha Lifestraw',            cat:'WASH_SUPPLIES',   unit:'cutubyo',       qty:300,  min:40,  cost:8.00  },
  {name:'Jabitaanka Biyaha Purification',        cat:'WASH_SUPPLIES',   unit:'cutubyo',       qty:25,   min:5,   cost:220.00},
  {name:'Marada Nadiifinta Disinfectant Wipes',  cat:'WASH_SUPPLIES',   unit:'sanduuq (50)',  qty:400,  min:60,  cost:15.00 },
  {name:'Koobka Dhaqista Biyaha',                cat:'WASH_SUPPLIES',   unit:'cutubyo',       qty:500,  min:60,  cost:3.00  },
  {name:'Bucket 15L Gacmaha Dhaqista',           cat:'WASH_SUPPLIES',   unit:'cutubyo',       qty:150,  min:20,  cost:7.00  },
  {name:'Aquatabs Dhoofinta Biyaha',             cat:'WASH_SUPPLIES',   unit:'sanduuq (500)', qty:350,  min:50,  cost:9.50  },
  {name:'Bleach Clorox Nadiifinta',              cat:'WASH_SUPPLIES',   unit:'liitar',        qty:800,  min:100, cost:3.50  },
  // COLD_CHAIN (5)
  {name:'Baraf-dilaac Qaboojiyaha Vaccine Cooler',cat:'COLD_CHAIN',    unit:'cutubyo',       qty:45,   min:5,   cost:180.00},
  {name:'Ice Pack Gel Qaboojiyaha',              cat:'COLD_CHAIN',      unit:'cutubyo',       qty:300,  min:40,  cost:4.50  },
  {name:'Thermometer Data Logger',               cat:'COLD_CHAIN',      unit:'cutubyo',       qty:30,   min:5,   cost:95.00 },
  {name:'Portable Fridge Qaboojiyaha',           cat:'COLD_CHAIN',      unit:'cutubyo',       qty:15,   min:3,   cost:450.00},
  {name:'Fridge Tags Xigashada Xawaarta',        cat:'COLD_CHAIN',      unit:'sanduuq (50)',  qty:100,  min:15,  cost:22.00 },
  // DOCUMENTATION (5)
  {name:'Diiwaangelinta Tallaalka Tally Sheet',  cat:'DOCUMENTATION',   unit:'ream (500)',    qty:150,  min:20,  cost:6.00  },
  {name:'Foomka Baaritaanka Bulshada',           cat:'DOCUMENTATION',   unit:'xirmo (100)',  qty:500,  min:60,  cost:4.00  },
  {name:'Gad-hayeedka Ciwaannada Register Book', cat:'DOCUMENTATION',   unit:'buug',          qty:80,   min:10,  cost:3.50  },
  {name:'Qalinkii Ku-qorka Ball Pen',            cat:'DOCUMENTATION',   unit:'sanduuq (50)', qty:200,  min:30,  cost:8.00  },
  {name:'Baariga Goobta Clipboard',              cat:'DOCUMENTATION',   unit:'cutubyo',       qty:60,   min:10,  cost:5.50  },
  // FIELD_EQUIPMENT (10)
  {name:'Qalabka Cabbira Cududda MUAC',          cat:'FIELD_EQUIPMENT', unit:'cutubyo',       qty:150,  min:20,  cost:2.00  },
  {name:'Miisaanka Jimiciga Carruurta',          cat:'FIELD_EQUIPMENT', unit:'cutubyo',       qty:40,   min:5,   cost:85.00 },
  {name:'Qalabka Cabbira Dhererka',             cat:'FIELD_EQUIPMENT', unit:'cutubyo',       qty:35,   min:5,   cost:45.00 },
  {name:'Stethoscope Maqlaha Wadnaha',           cat:'FIELD_EQUIPMENT', unit:'cutubyo',       qty:60,   min:10,  cost:25.00 },
  {name:'Sphygmomanometer Dhiigga',              cat:'FIELD_EQUIPMENT', unit:'cutubyo',       qty:40,   min:5,   cost:55.00 },
  {name:'Thermometer Infrared',                  cat:'FIELD_EQUIPMENT', unit:'cutubyo',       qty:50,   min:8,   cost:32.00 },
  {name:'Torch LED Nalka Goobta',                cat:'FIELD_EQUIPMENT', unit:'cutubyo',       qty:100,  min:15,  cost:12.00 },
  {name:'Power Bank 20000mAh',                   cat:'FIELD_EQUIPMENT', unit:'cutubyo',       qty:60,   min:10,  cost:28.00 },
  {name:'Backpack Caafimaadka Goobta',           cat:'FIELD_EQUIPMENT', unit:'cutubyo',       qty:80,   min:10,  cost:35.00 },
  {name:'Walkie-Talkie Degmada',                 cat:'FIELD_EQUIPMENT', unit:'laba (pair)',   qty:25,   min:5,   cost:95.00 },
];

const SMS_MESSAGES = [
  'Nabadgelyo, Barnaamijka Tallaalka Polio ayaa bilaabmaya. Fadlan soo joog goobta tallaalka manta 8:00 subax.',
  'Volunteers-ka kaalay xarunta kuu sheegtay. Waxaad heli doontaa agabka aad u baahan tahay berri 9:00 subax.',
  'Ogeysiis: Baaritaanka caafimaadka xarunta gobolka wuxuu dhacayaa Jimce. Nagala soo xiriir: 0611234567.',
  'Tallaalka Xanuunka Doodhaha wuxuu bilaabmayaa todobaadka soo socda. Abuuraya go\'aanka si deg-deg ah.',
  'Wargelin: Xaaladda COVID-19 ayaa sii kordha. Isticmaal PPE si buuxda oo raac tilmaamaha caafimaadka.',
  'Baahida agabka ah ee volunteers ayaa la ogolaanayaa. Codso agabka adoo adeegsanaya app-ka rasmi ah.',
  'Dhamaan volunteers-ka ee Banaadir, fadlan soo diyaara qalabka tallaalka. Shaqadu bilaabaysaa Isniinta.',
  'Ogeysiis Degdeg ah: Faafida Kolera ayaa la sheegay. Waxaad u baahan tahay inaad soo xidhiidho maamulka.',
  'Barnaamijka TB Detection wuxuu u baahan yahay xoghayaha inay yimaadaan kursiga tababarka.',
  'Warqadda Aqoonsiga Volunteer ID ayaa diyaar. Kaalay oo qaado maktabada xarunta caafimaadka.',
  'Xarumaha Baaritaanka ayaa furan Sabti iyo Axad. Fadlan u sheeg bulshada inay faa\'iideysan karaan.',
  'ORS iyo Zinc-ka ayaa ku heli karaa xarunta. Sidoo kale baaritaanka bilaash ah ayaa jira.',
  'Volunteers-ka kooxda koowaad, fadlan raac wareegyada manta. Xafiiska ayaa soo diray jadwalka.',
  'Tababarka Emergency Response ayaa bilaabmaya Isniinta 7:30 subax. Jiid waa waajib.',
  'Wargelin: Koobka Dhaqista Gacmaha ayaa loo baahan yahay dhammaan goobaha kiniiniyaha.',
];

const PHONES = [
  '+252611000001','+252611000002','+252611000003','+252611000004','+252611000005',
  '+252617000006','+252617000007','+252617000008','+252617000009','+252617000010',
  '+252615000011','+252615000012','+252615000013','+252615000014','+252615000015',
  '+252618000016','+252618000017','+252618000018','+252618000019','+252618000020',
];

const EMERGENCY_DATA = [
  { type:'CHOLERA',            sev:'CRITICAL', desc:'Xaalada kolera ayaa hore loogu warbixiyay xarunta Daynile. Qiyaastii 15 kiis.',  cases:15, reg:'reg-banadir',         dist:'dist-daynile',    community:'Daynile Koonfur' },
  { type:'MEASLES',            sev:'HIGH',     desc:'Doodhaha ayaa faafay degmada Waberi. Caruurta 0-5 gaar ahaan u nugul.',           cases:8,  reg:'reg-banadir',         dist:'dist-waberi',     community:'Waberi Dhexe'    },
  { type:'MALARIA_OUTBREAK',   sev:'HIGH',     desc:'Maleeriya Guud ee Xilliga Roobka sii kordhaysa Kismayo. Degdeg u baahan.',        cases:22, reg:'reg-lower-juba',      dist:'dist-kismayo',    community:'Kismayo Koonfur' },
  { type:'FOOD_POISONING',     sev:'MEDIUM',   desc:'Caloosha xanuun ka dib cunto. 7 qof ayaa dhacay guryaha ay wadaagaan.',          cases:7,  reg:'reg-hiran',            dist:'dist-beledweyne', community:'Beledweyne Dhexe'},
  { type:'UNKNOWN_DISEASE',    sev:'HIGH',     desc:'Cudur aan la garanayn ee dadka ku dhacaya Garoowe. Astaamo: Xummad, Matag.',      cases:12, reg:'reg-nugaal',           dist:'dist-garowe',     community:'Garoowe Waqooyi' },
  { type:'DENGUE_FEVER',       sev:'MEDIUM',   desc:'Xummada Dengue ayaa la sheegay 3 kiis ee xarunta caafimaadka Bosaso.',           cases:3,  reg:'reg-bari',             dist:'dist-bosaso',     community:'Bosaso Dhexe'    },
  { type:'CHOLERA',            sev:'CRITICAL', desc:'Kolera ayaa dib u soo noqday degmada Jowhar ka dib roobka.',                     cases:18, reg:'reg-middle-shabelle',  dist:'dist-jowhar',     community:'Jowhar Koonfur'  },
  { type:'MALARIA_OUTBREAK',   sev:'MEDIUM',   desc:'Maleeriya ayaa sii kordhaysa Baydhabo. Duumarka mugga badan la sheegay.',         cases:9,  reg:'reg-bay',              dist:'dist-baidoa',     community:'Baydhabo Koonfur'},
  { type:'ACUTE_MALNUTRITION', sev:'HIGH',     desc:'Nafaqada daran ayaa haysata 34 carruurta 0-5 xarunta gargaarka Galkacyo.',       cases:34, reg:'reg-mudug',            dist:'dist-galkacyo',   community:'Galkacyo Koonfur'},
  { type:'MEASLES',            sev:'MEDIUM',   desc:'Kiisas cusub oo doodhaha ah ee Hargeysa, dugsiyada hoose gaar ahaan.',           cases:5,  reg:'reg-woqooyi',          dist:'dist-hargeisa',   community:'Hargeysa Dhexe'  },
];

const FEEDBACK_DATA = [
  { cat:'SERVICE_QUALITY',   desc:'Xarunta caafimaadka Hodan waxaa ka jira dawadii aad ugu baahan nahay. Shukran!',                       reg:'reg-banadir',    dist:'dist-hodan',      name:'Caisha Omar',    phone:'+252611100101' },
  { cat:'VOLUNTEER_CONDUCT', desc:'Volunteer-ka noo yimid ayaa si fiican u daryeelay carruurteenna.',                                     reg:'reg-banadir',    dist:'dist-waberi',     name:'Ahmed Farah',    phone:'+252617100102' },
  { cat:'SUPPLY_REQUEST',    desc:'Tallaalka ayaa ku dhamaaday. Waxaan u baahanahay dib u buuxinta degdeg ah.',                           reg:'reg-lower-juba', dist:'dist-kismayo',    name:'Faadumo Hassan', phone:'+252615100103' },
  { cat:'HEALTH_CONCERN',    desc:'Biyaha cabbitaanka ee degmadeenna waa wasaq. Waxaan u baahanahay gargaar.',                             reg:'reg-hiran',      dist:'dist-beledweyne', name:'Mohamed Ali',    phone:'+252618100104' },
  { cat:'INFRASTRUCTURE',    desc:'Xarunta caafimaadka xaafadeenna ayaa baabi\'iyeen. Waxaa loo baahan yahay dib u dhisid.',              reg:'reg-nugaal',     dist:'dist-garowe',     name:'Hodan Abdi',     phone:'+252611100105' },
  { cat:'SERVICE_QUALITY',   desc:'Wakhtiga sugida xarunta caafimaadka Bosaso waa dheer yahay. Fadlan xal u helo.',                       reg:'reg-bari',       dist:'dist-bosaso',     name:'Omar Sheikh',    phone:'+252617100106' },
  { cat:'VOLUNTEER_CONDUCT', desc:'Volunteer-ka ayaa soo yimid iyo agab badan oo tallaalka ah. Si fiican buu u qaybiyay.',                reg:'reg-galguduud',  dist:'dist-dhusamareb', name:'Ayan Hussein',   phone:'+252615100107' },
  { cat:'DISEASE_REPORT',    desc:'Nabarrada caloosha ah ayaa ku batay xaafaddeenna. Fadlan soo dir caawin caafimaad ah.',                reg:'reg-bay',        dist:'dist-baidoa',     name:'Ibrahiim Noor',  phone:'+252618100108' },
  { cat:'HEALTH_CONCERN',    desc:'Carruurta naanay xummada ayaa batay. Daaweynta ORS ayaa la dhammeeyay xarunta.',                       reg:'reg-mudug',      dist:'dist-galkacyo',   name:'Mana Jama',      phone:'+252611100109' },
  { cat:'SERVICE_QUALITY',   desc:'Volunteer-yaddu waa ka imaan waayeen maanta. Waxaan baahanahay fasir.',                                reg:'reg-woqooyi',    dist:'dist-hargeisa',   name:'Sagal Osman',    phone:'+252617100110' },
  { cat:'SUPPLY_REQUEST',    desc:'Biaashaha tallaalka ayaa ku dhamaaday xaruntii. Waa in degdeg loo soo diro.',                          reg:'reg-banadir',    dist:'dist-yaqshid',    name:'Luul Warsame',   phone:'+252615100111' },
  { cat:'INFRASTRUCTURE',    desc:'Jidka xarunta caafimaadka waa xun. Baabuurta caafimaadku ma dhicisan karaan.',                         reg:'reg-hiran',      dist:'dist-beledweyne', name:'Daud Hassan',    phone:'+252618100112' },
  { cat:'DISEASE_REPORT',    desc:'Waxaa jira cudur cusub oo aan la aqoon ee dadka weeraya. Astaamo: Madax xanuun, xummad dheer.',        reg:'reg-nugaal',     dist:'dist-garowe',     name:'Amina Ahmed',    phone:'+252611100113' },
  { cat:'VOLUNTEER_CONDUCT', desc:'Volunteers-ka team-ga Bari waa shaqeeyeen si aad ah. Mashkuur!',                                       reg:'reg-bari',       dist:'dist-bosaso',     name:'Hassan Ali',     phone:'+252617100114' },
  { cat:'SERVICE_QUALITY',   desc:'Xarunta caafimaadka Daynile waa u xidantahay weekendka. Fadlan fur ama wakhtiga kordhii.',             reg:'reg-banadir',    dist:'dist-daynile',    name:'Caasha Duale',   phone:'+252615100115' },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  db.initDb();
  await new Promise(r => setTimeout(r, 800));

  console.log('\n🌱 STARTING OPERATIONAL DATA SEEDING...\n');

  // 0. Clean legacy data
  console.log('🧹 Cleaning legacy data...');
  await db.query('DELETE FROM supply_requests');
  await db.query('DELETE FROM sms_logs');
  await db.query('DELETE FROM task_assignments');
  await db.query('DELETE FROM campaign_volunteers');
  await db.query('DELETE FROM tasks');
  await db.query('DELETE FROM campaigns');
  await db.query('DELETE FROM inventory_transactions');
  await db.query('DELETE FROM inventory_items');
  await db.query('DELETE FROM inventory_locations');
  await db.query('DELETE FROM emergency_reports');
  await db.query('DELETE FROM feedback');
  console.log('   ✅ Done\n');

  // 1. Inventory Locations
  console.log('📦 Creating Inventory Locations...');
  const INV_LOCS = [
    { id:'loc-mogadishu-main', name:'Xarunta Agabka Muqdisho',   code:'STORE-MGQ-01', region_id:'reg-banadir',   district_id:'dist-hodan'     },
    { id:'loc-hargeisa-store', name:'Kaydka Agabka Hargeysa',    code:'STORE-HGA-01', region_id:'reg-woqooyi',   district_id:'dist-hargeisa'  },
    { id:'loc-kismayo-depot',  name:'Kaydka Gargaarka Kismaayo', code:'STORE-KMU-01', region_id:'reg-lower-juba',district_id:'dist-kismayo'   },
    { id:'loc-garowe-store',   name:'Kaydka Agabka Garoowe',     code:'STORE-GRW-01', region_id:'reg-nugaal',    district_id:'dist-garowe'    },
    { id:'loc-baidoa-store',   name:'Kaydka Koonfur Galbeed',    code:'STORE-BDO-01', region_id:'reg-bay',       district_id:'dist-baidoa'    },
  ];
  for (const loc of INV_LOCS) {
    await db.query(
      'INSERT OR IGNORE INTO inventory_locations (id,name,code,region_id,district_id) VALUES (?,?,?,?,?)',
      [loc.id, loc.name, loc.code, loc.region_id, loc.district_id]
    );
  }
  console.log(`   ✅ ${INV_LOCS.length} locations\n`);

  // 2. Campaigns
  console.log('🏥 Creating 20 Health Campaigns...');
  const campaignIds = [];
  for (let i = 0; i < CAMPAIGN_DATA.length; i++) {
    const c = CAMPAIGN_DATA[i];
    const id = uuidv4();
    campaignIds.push(id);
    const code = `CAMP-SOM-2026-${String(100 + i).padStart(3,'0')}`;
    const manager = [ADMIN_ID, ADMIN2_ID, ADMIN3_ID][i % 3];
    await db.query(
      `INSERT INTO campaigns
       (id,organization_id,name,code,type,description,objective,start_date,end_date,
        region_id,district_id,target_population,budget,currency,manager_id,status,
        priority,required_volunteers,created_by,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, c.org, c.name, code, c.type,
        `Barnaamijka ${c.type.replace(/_/g,' ')} ee deegaanka si loo hagaajiyo caafimaadka bulshada.`,
        `Yaraynta xanuunka iyo barashada caafimaadka ee ${c.pop.toLocaleString()} qof.`,
        nowMinus(30 + i * 5), nowPlus(60 + i * 10),
        c.reg, c.dist, c.pop, c.budget, 'USD', manager,
        c.status, 'HIGH', [3,4,5,6,2,3,4,5,6,2,3,4][i % 12],
        ADMIN_ID, nowMinus(30 + i * 5), nowMinus(5)
      ]
    );
  }
  console.log(`   ✅ ${campaignIds.length} campaigns\n`);

  // 3. Campaign-Volunteer Team Assignments
  console.log('👥 Assigning volunteers to campaigns in teams...');
  let cvCount = 0;
  const teamMap = [
    [0,1,2,3,4],   [0,1,2,3,4],   [0,1,2,3,4],   [0,1,2,3,4],
    [5,6,7,8,9],   [5,6,7,8,9],   [5,6,7,8,9],   [5,6,7,8,9],
    [10,11,12,13,14],[10,11,12,13,14],[10,11,12,13,14],[10,11,12,13,14],
    [15,16,17,18,19],[15,16,17,18,19],[15,16,17,18,19],[15,16,17,18,19],
    [0,1,5,6,10],  [2,3,7,8,11],  [4,9,12,13,14],[15,16,17,18,19],
  ];
  for (let ci = 0; ci < campaignIds.length; ci++) {
    for (const vi of (teamMap[ci] || [])) {
      try {
        await db.query(
          'INSERT OR IGNORE INTO campaign_volunteers (id,campaign_id,volunteer_id,status,assigned_at) VALUES (?,?,?,?,?)',
          [uuidv4(), campaignIds[ci], VOLS[vi], 'ASSIGNED', nowMinus(25)]
        );
        cvCount++;
      } catch(e) {}
    }
  }
  console.log(`   ✅ ${cvCount} campaign-volunteer links\n`);

  // 4. Tasks (30 tasks, 25 Active)
  console.log('📋 Creating 30 Tasks...');
  const taskIds = [];
  for (let i = 0; i < 30; i++) {
    const id = uuidv4();
    taskIds.push(id);
    const status = i < 25 ? 'ACTIVE' : 'COMPLETED';
    const taskType = TASK_TYPES[i % TASK_TYPES.length];
    const campId = campaignIds[i % campaignIds.length];
    const reg = REGIONS[i % REGIONS.length];
    const dist = DISTRICTS.find(d => d.region_id === reg.id) || DISTRICTS[i % DISTRICTS.length];
    await db.query(
      `INSERT INTO tasks
       (id,campaign_id,title,task_type,description,instructions,priority,status,
        region_id,district_id,target_location_name,latitude,longitude,
        start_datetime,deadline_datetime,requires_field_data,created_by,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, campId, TASK_TITLES[i], taskType,
        `Howsha ${taskType.replace(/_/g,' ')} - Barnaamijka Caafimaadka Bulshada Somalia.`,
        '1. Soo dir warqadda aqoonsiga.\n2. Shaqeey la wadaag kooxda.\n3. Diiwaangeli natiijooyinka.\n4. Soo gudbi warbixinta.',
        ['HIGH','MEDIUM','URGENT','LOW'][i % 4], status,
        reg.id, dist.id,
        `Xaafadda ${['Koonfur','Dhexe','Waqooyi','Galbeed','Bari'][i % 5]} - ${reg.name}`,
        2.05 + (i * 0.15), 44.06 + (i * 0.12),
        nowMinus(15 + i), nowPlus(20 + i), 1,
        ADMIN_ID, nowMinus(15 + i), nowMinus(2)
      ]
    );
  }
  console.log(`   ✅ ${taskIds.length} tasks\n`);

  // 5. Task Assignments (one-by-one, vols 0-9 get 2 tasks each)
  console.log('🔗 Assigning tasks to volunteers...');
  let taCount = 0;
  for (let i = 0; i < taskIds.length; i++) {
    const volIdx = i % VOLS.length;
    const status = i < 25 ? 'ACCEPTED' : 'COMPLETED';
    try {
      await db.query(
        `INSERT OR IGNORE INTO task_assignments
         (id,task_id,volunteer_id,status,assigned_at,accepted_at,completed_at)
         VALUES (?,?,?,?,?,?,?)`,
        [uuidv4(), taskIds[i], VOLS[volIdx], status,
         nowMinus(14 + i), status !== 'COMPLETED' ? nowMinus(13 + i) : null,
         status === 'COMPLETED' ? nowMinus(2) : null]
      );
      taCount++;
    } catch(e) {}
  }
  // Extra: volunteers 0-9 get a second task
  for (let vi = 0; vi < 10; vi++) {
    const extraTaskId = taskIds[(vi + 20) % taskIds.length];
    try {
      await db.query(
        `INSERT OR IGNORE INTO task_assignments
         (id,task_id,volunteer_id,status,assigned_at)
         VALUES (?,?,?,?,?)`,
        [uuidv4(), extraTaskId, VOLS[vi], 'ASSIGNED', nowMinus(5)]
      );
      taCount++;
    } catch(e) {}
  }
  console.log(`   ✅ ${taCount} task assignments\n`);

  // 6. Inventory Items (100 items)
  console.log('🗃️  Creating 100 Inventory Items...');
  const itemIds = [];
  const locIds = INV_LOCS.map(l => l.id);
  const suppliers = ['Farmadka Dowladda','UNICEF Supply Division','MSF Logistics','WHO Somalia','Crown Agents','IDA Foundation','Farmadka Gacan-siis'];
  for (let i = 0; i < INV_ITEMS_DATA.length; i++) {
    const item = INV_ITEMS_DATA[i];
    const id = uuidv4();
    itemIds.push(id);
    await db.query(
      `INSERT INTO inventory_items
       (id,item_code,name,category,unit_of_measure,quantity_on_hand,minimum_stock_level,
        location_id,batch_number,expiry_date,supplier_name,unit_cost,notes,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, `ITEM-SOM-2026-${1000 + i}`, item.name, item.cat, item.unit,
        item.qty, item.min, locIds[i % locIds.length],
        `BATCH-2026-${100 + i}`,
        nowPlus(180 + i * 10),
        suppliers[i % suppliers.length],
        item.cost,
        `Agabka ${item.cat.replace(/_/g,' ')} - Barnaamijka Caafimaadka Somalia 2026.`,
        nowMinus(60 + i * 2), nowMinus(5)
      ]
    );
  }
  console.log(`   ✅ ${itemIds.length} inventory items\n`);

  // 7. Supply Requests
  console.log('📝 Creating Supply Requests...');
  const supplyReqs = [
    { vi:0,  ii:0,  qty:50,  urgency:'HIGH',   reason:'Gacmo-xidhe ayaa dhamaaday, tallaalku wuu socday.',            status:'APPROVED',  aqty:50  },
    { vi:1,  ii:10, qty:100, urgency:'HIGH',   reason:'Tallaalka OPV la baahanyahay xarunta baaritaanka.',             status:'APPROVED',  aqty:100 },
    { vi:2,  ii:20, qty:30,  urgency:'MEDIUM', reason:'Amoxicillin la dhammaanayaa. Daryeelka carruurta waa u baahan.',status:'APPROVED',  aqty:30  },
    { vi:3,  ii:30, qty:200, urgency:'HIGH',   reason:'Irbado tallaalka dheeraad ah loo baahan yahay koox cusub.',     status:'APPROVED',  aqty:200 },
    { vi:4,  ii:42, qty:5,   urgency:'HIGH',   reason:'Kit-ka Maleeriya la baahanyahay goob cusub.',                   status:'PENDING',   aqty:0   },
    { vi:5,  ii:48, qty:10,  urgency:'MEDIUM', reason:'RUTF la baahanyahay xarunta nafaqada.',                         status:'PENDING',   aqty:0   },
    { vi:6,  ii:57, qty:100, urgency:'LOW',    reason:'Chlorine tablets dheeraad ah loo baahan yahay WASH.',           status:'PENDING',   aqty:0   },
    { vi:7,  ii:3,  qty:10,  urgency:'HIGH',   reason:'Maaskaro buuxda loo baahan yahay shaqaalaha caafimaadka.',     status:'REQUESTED', aqty:0   },
    { vi:8,  ii:41, qty:5,   urgency:'URGENT', reason:'Glucometer dheeraad ah baaritaanka jirrada.',                   status:'REQUESTED', aqty:0   },
    { vi:9,  ii:60, qty:20,  urgency:'MEDIUM', reason:'Jeericaanada biyaha la baahanyahay xarunta WASH.',             status:'REQUESTED', aqty:0   },
    { vi:10, ii:77, qty:15,  urgency:'HIGH',   reason:'Backpack caafimaadka goobta loo baahan yahay koox cusub.',     status:'REQUESTED', aqty:0   },
    { vi:11, ii:21, qty:50,  urgency:'MEDIUM', reason:'Paracetamol dhammaaday. Xarunta caafimaadka waa u baahan.',    status:'REQUESTED', aqty:0   },
  ];
  let srCount = 0;
  for (const req of supplyReqs) {
    const itemId = itemIds[req.ii % itemIds.length];
    const reviewedBy = req.status === 'APPROVED' ? ADMIN_ID : null;
    const reviewedAt = req.status === 'APPROVED' ? nowMinus(3) : null;
    await db.query(
      `INSERT INTO supply_requests
       (id,request_code,volunteer_id,task_id,campaign_id,item_id,requested_quantity,
        approved_quantity,status,urgency,reason,reviewed_by,reviewed_at,admin_remarks,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        uuidv4(), `SR-2026-${1000 + srCount}`, VOLS[req.vi],
        taskIds[req.vi % taskIds.length], campaignIds[req.vi % campaignIds.length],
        itemId, req.qty, req.aqty, req.status, req.urgency, req.reason,
        reviewedBy, reviewedAt,
        req.status === 'APPROVED' ? 'Codsigu waa la ogolaaday. Agabka waa la soo diri doonaa.' : null,
        nowMinus(7 - (srCount % 5)), nowMinus(2)
      ]
    );
    srCount++;
  }
  console.log(`   ✅ ${srCount} supply requests\n`);

  // 8. SMS Broadcast
  console.log('📱 Creating SMS Broadcast Logs...');
  let smsCount = 0;
  for (let i = 0; i < VOL_USER_IDS.length; i++) {
    await db.query(
      `INSERT INTO sms_logs
       (id,recipient_phone,recipient_user_id,message_body,provider,provider_message_id,status,sent_at,created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        uuidv4(), PHONES[i % PHONES.length], VOL_USER_IDS[i],
        SMS_MESSAGES[i % SMS_MESSAGES.length],
        'HORMUUD_TELESOM', `MSG-${Date.now()}-${i}`,
        i < 15 ? 'DELIVERED' : 'SENT',
        nowMinus(1 + (i % 5)), nowMinus(1 + (i % 5))
      ]
    );
    smsCount++;
  }
  // Extra 10 broadcasts to general public
  for (let i = 0; i < 10; i++) {
    await db.query(
      `INSERT INTO sms_logs
       (id,recipient_phone,recipient_user_id,message_body,provider,provider_message_id,status,sent_at,created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        uuidv4(), `+25261${2000000 + i}`, null,
        SMS_MESSAGES[i % SMS_MESSAGES.length],
        'SOMTEL', `MSG-BROAD-${Date.now()}-${i}`,
        i < 8 ? 'DELIVERED' : 'FAILED',
        nowMinus(2), nowMinus(2)
      ]
    );
    smsCount++;
  }
  console.log(`   ✅ ${smsCount} SMS logs\n`);

  // 9. Emergency Reports
  console.log('🚨 Creating Emergency/Outbreak Reports...');
  let erCount = 0;
  for (let i = 0; i < EMERGENCY_DATA.length; i++) {
    const e = EMERGENCY_DATA[i];
    const rType = i % 3 === 0 ? 'PUBLIC' : 'VOLUNTEER';
    const rUserId = rType === 'VOLUNTEER' ? VOL_USER_IDS[i % VOL_USER_IDS.length] : null;
    const rName  = rType === 'PUBLIC' ? ['Xasan Ali','Faadumo Omar','Ahmed Jama'][i % 3] : null;
    const status = i < 3 ? 'INVESTIGATING' : (i < 7 ? 'REPORTED' : 'CONFIRMED');
    await db.query(
      `INSERT INTO emergency_reports
       (id,report_code,emergency_type,severity,description,suspected_cases_count,
        region_id,district_id,community_name,latitude,longitude,
        reporter_type,reporter_user_id,reporter_name,reporter_phone,
        status,investigation_notes,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        uuidv4(), `RPT-SOM-2026-${500 + i}`,
        e.type, e.sev, e.desc, e.cases,
        e.reg, e.dist, e.community,
        2.05 + (i * 0.2), 44.06 + (i * 0.3),
        rType, rUserId, rName, PHONES[i % PHONES.length],
        status,
        status === 'INVESTIGATING' ? 'Baaritaanku waa socda. Koox xarunta ayaa u dirtay.' : null,
        nowMinus(5 + i * 2), nowMinus(1 + i)
      ]
    );
    erCount++;
  }
  console.log(`   ✅ ${erCount} emergency reports\n`);

  // 10. Community Feedback
  console.log('💬 Creating Community Feedback...');
  const fbStatuses = ['NEW','IN_PROGRESS','RESOLVED','NEW','IN_PROGRESS','NEW','RESOLVED','NEW','IN_PROGRESS','NEW','NEW','IN_PROGRESS','NEW','RESOLVED','NEW'];
  let fbCount = 0;
  for (let i = 0; i < FEEDBACK_DATA.length; i++) {
    const f = FEEDBACK_DATA[i];
    const status = fbStatuses[i];
    const resolvedBy = status === 'RESOLVED' ? ADMIN_ID : null;
    const resolvedAt = status === 'RESOLVED' ? nowMinus(1 + i) : null;
    await db.query(
      `INSERT INTO feedback
       (id,ticket_number,category,description,region_id,district_id,
        reporter_name,reporter_phone,status,admin_notes,resolved_by,resolved_at,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        uuidv4(), `TKT-SOM-2026-${1000 + i}`,
        f.cat, f.desc, f.reg, f.dist, f.name, f.phone, status,
        status !== 'NEW' ? 'Xaaladda ayaa la diiwaangeliyay. Waxaan u shaqeyneynaa xalka.' : null,
        resolvedBy, resolvedAt,
        nowMinus(8 + i * 2), nowMinus(1 + i)
      ]
    );
    fbCount++;
  }
  console.log(`   ✅ ${fbCount} feedback records\n`);

  // Final Summary
  const c = await Promise.all([
    db.getOne('SELECT COUNT(*) AS n FROM campaigns'),
    db.getOne("SELECT COUNT(*) AS n FROM campaigns WHERE status='ACTIVE'"),
    db.getOne('SELECT COUNT(*) AS n FROM tasks'),
    db.getOne("SELECT COUNT(*) AS n FROM tasks WHERE status='ACTIVE'"),
    db.getOne('SELECT COUNT(*) AS n FROM task_assignments'),
    db.getOne('SELECT COUNT(*) AS n FROM campaign_volunteers'),
    db.getOne('SELECT COUNT(*) AS n FROM inventory_items'),
    db.getOne('SELECT COUNT(*) AS n FROM supply_requests'),
    db.getOne('SELECT COUNT(*) AS n FROM sms_logs'),
    db.getOne('SELECT COUNT(*) AS n FROM emergency_reports'),
    db.getOne('SELECT COUNT(*) AS n FROM feedback'),
  ]);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                📊 SEEDING SUMMARY                        ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  🏥 Campaigns:            ${c[0].n} total (${c[1].n} Active)`);
  console.log(`  📋 Tasks:                ${c[2].n} total (${c[3].n} Active)`);
  console.log(`  🔗 Task Assignments:     ${c[4].n}`);
  console.log(`  👥 Campaign-Volunteers:  ${c[5].n}`);
  console.log(`  🗃️  Inventory Items:      ${c[6].n}`);
  console.log(`  📝 Supply Requests:      ${c[7].n}`);
  console.log(`  📱 SMS Logs:             ${c[8].n}`);
  console.log(`  🚨 Emergency Reports:    ${c[9].n}`);
  console.log(`  💬 Community Feedback:   ${c[10].n}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n✅ ALL OPERATIONAL DATA SEEDED SUCCESSFULLY!\n');
  process.exit(0);
}

main().catch(e => {
  console.error('\n❌ SEEDING FAILED:', e.message, '\n', e.stack);
  process.exit(1);
});
