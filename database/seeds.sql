-- ==============================================================================
-- CaafimaadHub — Comprehensive Authentic Somali Health Seed Data
-- ==============================================================================

USE `caafimaadhub`;

-- 1. Organizations
INSERT INTO `organizations` (`id`, `name`, `code`, `type`, `contact_email`, `contact_phone`, `address`) VALUES
('org-fmoh-001', 'Federal Ministry of Health Somalia', 'FMOH', 'MOH', 'info@moh.gov.so', '+252 61 5000001', 'Corso Somalia, Shangani, Mogadishu, Somalia'),
('org-srcs-002', 'Somali Red Crescent Society', 'SRCS', 'NGO', 'contact@srcs.so', '+252 61 5000002', 'KM4 Area, Wadajir, Mogadishu, Somalia'),
('org-unicef-003', 'UNICEF Somalia Health Field Mission', 'UNICEF-SOM', 'UN_AGENCY', 'somalia@unicef.org', '+252 61 5000003', 'MIA Compound, Mogadishu, Somalia'),
('org-who-004', 'World Health Organization Somalia', 'WHO-SOM', 'UN_AGENCY', 'who-som@who.int', '+252 61 5000004', 'MIA Compound, Mogadishu, Somalia'),
('org-plmoh-005', 'Puntland Ministry of Health', 'PL-MOH', 'MOH', 'health@puntlandmoh.org', '+252 90 7000005', 'Main Office, Garowe, Puntland, Somalia'),
('org-slmoh-006', 'Somaliland Ministry of Health Development', 'SL-MOHD', 'MOH', 'contact@somalilandhealth.org', '+252 63 4000006', 'Shaab Area, Hargeisa, Somalia');

-- 2. Regions (All 18 Somali Regions)
INSERT INTO `regions` (`id`, `name`, `code`, `country`, `latitude`, `longitude`) VALUES
('reg-banadir', 'Banaadir', 'SOM-BAN', 'Somalia', 2.046934, 45.318162),
('reg-woqooyi', 'Woqooyi Galbeed', 'SOM-WQG', 'Somalia', 9.562389, 44.077013),
('reg-lower-juba', 'Jubaland (Lower Juba)', 'SOM-LJB', 'Somalia', -0.358169, 42.545367),
('reg-hiran', 'Hirshabelle (Hiiraan)', 'SOM-HIR', 'Somalia', 4.743825, 45.343750),
('reg-nugaal', 'Puntland (Nugaal)', 'SOM-NUG', 'Somalia', 8.402100, 48.484500),
('reg-galguduud', 'Galmudug (Galgaduud)', 'SOM-GLG', 'Somalia', 5.340000, 46.600000),
('reg-bay', 'Koonfur Galbeed (Bay)', 'SOM-BAY', 'Somalia', 3.119100, 43.649200),
('reg-bari', 'Bari', 'SOM-BAR', 'Somalia', 10.416667, 49.750000),
('reg-mudug', 'Mudug', 'SOM-MUD', 'Somalia', 6.769700, 47.430800),
('reg-middle-shabelle', 'Shabeellaha Dhexe', 'SOM-MSH', 'Somalia', 2.753400, 45.501500),
('reg-lower-shabelle', 'Shabeellaha Hoose', 'SOM-LSH', 'Somalia', 1.621200, 44.526400),
('reg-gedo', 'Gedo', 'SOM-GED', 'Somalia', 3.784200, 42.348600),
('reg-bakool', 'Bakool', 'SOM-BAK', 'Somalia', 4.120000, 43.880000),
('reg-middle-juba', 'Jubbada Dhexe', 'SOM-MJB', 'Somalia', 1.083300, 42.583300),
('reg-awdal', 'Awdal', 'SOM-AWD', 'Somalia', 10.250000, 43.250000),
('reg-togdheer', 'Togdheer', 'SOM-TOG', 'Somalia', 9.500000, 45.500000),
('reg-sool', 'Sool', 'SOM-SOL', 'Somalia', 8.480000, 47.350000),
('reg-sanaag', 'Sanaag', 'SOM-SAN', 'Somalia', 10.616700, 47.183300);

-- 3. Districts
INSERT INTO `districts` (`id`, `region_id`, `name`, `code`, `latitude`, `longitude`) VALUES
('dist-hodan', 'reg-banadir', 'Hodan', 'BAN-HOD', 2.0438, 45.3121),
('dist-waberi', 'reg-banadir', 'Waberi', 'BAN-WAB', 2.0295, 45.3347),
('dist-yaqshid', 'reg-banadir', 'Yaqshid', 'BAN-YAQ', 2.0673, 45.3475),
('dist-daynile', 'reg-banadir', 'Daynile', 'BAN-DAY', 2.0820, 45.2750),
('dist-hargeisa', 'reg-woqooyi', 'Hargeysa', 'WQG-HAR', 9.5600, 44.0650),
('dist-kismayo', 'reg-lower-juba', 'Kismaayo', 'LJB-KIS', -0.3582, 42.5454),
('dist-beledweyne', 'reg-hiran', 'Beledweyne', 'HIR-BEL', 4.7358, 45.2036),
('dist-garowe', 'reg-nugaal', 'Garoowe', 'NUG-GAR', 8.4021, 48.4845),
('dist-dhusamareb', 'reg-galguduud', 'Dhusamareeb', 'GLG-DHU', 5.5358, 46.3869),
('dist-cadaado', 'reg-galguduud', 'Cadaado', 'GLG-CAD', 6.1360, 46.6340),
('dist-baidoa', 'reg-bay', 'Baydhabo', 'BAY-BAI', 3.1138, 43.6500),
('dist-bosaso', 'reg-bari', 'Boosaaso', 'BAR-BOS', 11.2842, 49.1816),
('dist-galkacyo', 'reg-mudug', 'Gaalkacyo', 'MUD-GLK', 6.7697, 47.4308),
('dist-jowhar', 'reg-middle-shabelle', 'Jowhar', 'MSH-JOW', 2.7809, 45.5006),
('dist-merca', 'reg-lower-shabelle', 'Marka', 'LSH-MER', 1.7100, 44.7700),
('dist-luuq', 'reg-gedo', 'Luuq', 'GED-LUQ', 3.7960, 42.5450);

-- 4. Communities / Villages
INSERT INTO `communities` (`id`, `district_id`, `name`, `code`, `population_estimate`, `latitude`, `longitude`) VALUES
('com-tlg-01', 'dist-hodan', 'Taleex Village', 'COM-TLX', 14500, 2.0450, 45.3150),
('com-k5-02', 'dist-hodan', 'K5 Zoobe Community', 'COM-K5Z', 19800, 2.0410, 45.3100),
('com-wb-03', 'dist-waberi', '21st October Village', 'COM-OCT', 15200, 2.0310, 45.3360),
('com-yq-04', 'dist-yaqshid', 'Towfiiq Community', 'COM-TWF', 23000, 2.0690, 45.3490),
('com-hg-05', 'dist-hargeisa', 'Axmed Dhagax Section', 'COM-ADH', 31000, 9.5520, 44.0580),
('com-ks-06', 'dist-kismayo', 'Calanley Community', 'COM-CLN', 24000, -0.3550, 42.5410),
('com-bl-07', 'dist-beledweyne', 'Koshin Village', 'COM-KSH', 17800, 4.7380, 45.2050),
('com-gr-08', 'dist-garowe', 'Hodman Section', 'COM-HDM', 18500, 8.4050, 48.4820),
('com-cd-09', 'dist-cadaado', 'Waaberi Village', 'COM-WBR', 12000, 6.1340, 46.6310),
('com-bd-10', 'dist-baidoa', 'Isha Village', 'COM-ISH', 27000, 3.1180, 43.6530);

-- 5. Facilities / Health Centers
INSERT INTO `facilities` (`id`, `organization_id`, `district_id`, `name`, `code`, `facility_type`, `contact_person`, `phone`, `latitude`, `longitude`) VALUES
('fac-banadir-hosp', 'org-fmoh-001', 'dist-hodan', 'Banadir Mother & Child Hospital', 'FAC-BND-01', 'HOSPITAL', 'Dr. Maryan Qasim', '+252 61 5551101', 2.0455, 45.3135),
('fac-madina-hosp', 'org-fmoh-001', 'dist-hodan', 'Madina Referral Hospital', 'FAC-MDN-02', 'HOSPITAL', 'Dr. Mohamed Yusuf', '+252 61 5551102', 2.0390, 45.3080),
('fac-hargeisa-gh', 'org-slmoh-006', 'dist-hargeisa', 'Hargeisa Group Hospital', 'FAC-HGH-03', 'HOSPITAL', 'Dr. Axmed Cabdi', '+252 63 5551103', 9.5610, 44.0670),
('fac-kismayo-gh', 'org-fmoh-001', 'dist-kismayo', 'Kismayo General Hospital', 'FAC-KIS-04', 'HOSPITAL', 'Dr. Abdirashid Muse', '+252 61 5551104', -0.3570, 42.5460),
('fac-beledweyne-gh', 'org-fmoh-001', 'dist-beledweyne', 'Beledweyne Regional General Hospital', 'FAC-BWN-05', 'HOSPITAL', 'Dr. Ahmed Diriye', '+252 61 5551105', 4.7360, 45.2040),
('fac-garowe-gh', 'org-plmoh-005', 'dist-garowe', 'Garowe General Hospital', 'FAC-GAR-06', 'HOSPITAL', 'Dr. Faadumo Jaamac', '+252 90 5551106', 8.4030, 48.4860),
('fac-baidoa-rh', 'org-fmoh-001', 'dist-baidoa', 'Baidoa Regional Hospital', 'FAC-BAI-07', 'HOSPITAL', 'Dr. Hassan Ali', '+252 61 5551107', 3.1150, 43.6510),
('fac-bosaso-mch', 'org-srcs-002', 'dist-bosaso', 'Bosaso Central MCH & Nutrition Center', 'FAC-BOS-08', 'MCH', 'Sister Halima Farah', '+252 61 5551108', 11.2850, 49.1820);

-- 6. System Roles
INSERT INTO `roles` (`id`, `name`, `display_name`, `description`, `is_system_role`) VALUES
('role-super-admin', 'SUPER_ADMIN', 'Super Administrator', 'Full unrestricted platform administration, security management, and global system configuration.', 1),
('role-admin', 'ADMIN', 'Operational Administrator', 'Management of system users, audit trails, campaigns, volunteers, settings, and countrywide reporting.', 1),
('role-operational', 'OPERATIONAL', 'Operations & Logistics Manager', 'Coordination of field campaigns, volunteer roster dispatch, task assignments, and medical supply inventory dispatch.', 1),
('role-analyst', 'DATA_ANALYST', 'Data & Health Analyst', 'Epidemiological surveillance, field data analysis, disease trend forecasting, DHIS2 reporting, and GIS maps.', 1),
('role-volunteer', 'VOLUNTEER', 'Community Health Volunteer', 'Field volunteer executing assigned tasks, reporting patient/household data, taking training, and requesting supplies.', 1),
('role-public', 'PUBLIC_USER', 'Public Community User', 'Access public health campaigns, verified certifications, submit feedback, and report disease outbreak emergencies.', 1);

-- 7. Permissions Matrix
INSERT INTO `permissions` (`id`, `code`, `module`, `description`) VALUES
('p-01', 'users.view', 'USERS', 'View user accounts'),
('p-02', 'users.create', 'USERS', 'Create administrative, operational, and analyst accounts'),
('p-03', 'users.update', 'USERS', 'Update user profiles, credentials, and role assignments'),
('p-04', 'users.delete', 'USERS', 'Delete or remove user accounts'),
('p-05', 'users.approve', 'USERS', 'Approve pending user accounts'),
('p-06', 'users.suspend', 'USERS', 'Suspend or activate user accounts'),
('p-07', 'volunteers.view', 'VOLUNTEERS', 'View volunteer profiles and roster directories'),
('p-08', 'volunteers.create', 'VOLUNTEERS', 'Register new community health volunteers'),
('p-09', 'volunteers.update', 'VOLUNTEERS', 'Edit volunteer details and qualifications'),
('p-10', 'volunteers.delete', 'VOLUNTEERS', 'Remove volunteer accounts'),
('p-11', 'volunteers.approve', 'VOLUNTEERS', 'Approve/reject volunteer applications'),
('p-12', 'campaigns.view', 'CAMPAIGNS', 'View public and internal health campaigns'),
('p-13', 'campaigns.create', 'CAMPAIGNS', 'Create new public health campaigns'),
('p-14', 'campaigns.update', 'CAMPAIGNS', 'Edit campaign targets, schedules, and budgets'),
('p-15', 'campaigns.delete', 'CAMPAIGNS', 'Cancel or remove campaigns'),
('p-16', 'campaigns.publish', 'CAMPAIGNS', 'Publish campaigns to public portal'),
('p-17', 'tasks.view', 'TASKS', 'View field tasks'),
('p-18', 'tasks.create', 'TASKS', 'Create and configure field tasks'),
('p-19', 'tasks.assign', 'TASKS', 'Assign tasks to community health volunteers'),
('p-20', 'tasks.update', 'TASKS', 'Update task status and instructions'),
('p-21', 'tasks.complete', 'TASKS', 'Complete assigned tasks'),
('p-22', 'field_data.view', 'FIELD_DATA', 'View collected field data submissions'),
('p-23', 'field_data.create', 'FIELD_DATA', 'Submit digital field reports and forms'),
('p-24', 'field_data.review', 'FIELD_DATA', 'Review submitted field data'),
('p-25', 'field_data.approve', 'FIELD_DATA', 'Approve field data submissions'),
('p-26', 'field_data.reject', 'FIELD_DATA', 'Reject or flag incorrect field submissions'),
('p-27', 'training.view', 'TRAINING', 'View courses and training modules'),
('p-28', 'training.create', 'TRAINING', 'Create courses, lessons, and quizzes'),
('p-29', 'training.update', 'TRAINING', 'Edit course contents'),
('p-30', 'training.delete', 'TRAINING', 'Delete training materials'),
('p-31', 'training.complete', 'TRAINING', 'Enroll, take quizzes, and earn certificates'),
('p-32', 'inventory.view', 'INVENTORY', 'View medical supplies and inventory levels'),
('p-33', 'inventory.create', 'INVENTORY', 'Add new inventory items'),
('p-34', 'inventory.update', 'INVENTORY', 'Adjust stock, record transactions'),
('p-35', 'inventory.delete', 'INVENTORY', 'Remove obsolete inventory items'),
('p-36', 'supply_requests.view', 'SUPPLY_REQUESTS', 'View medical supply requests'),
('p-37', 'supply_requests.create', 'SUPPLY_REQUESTS', 'Submit medical supply requests'),
('p-38', 'supply_requests.approve', 'SUPPLY_REQUESTS', 'Approve and issue supply orders'),
('p-39', 'supply_requests.reject', 'SUPPLY_REQUESTS', 'Reject medical supply requests'),
('p-40', 'emergencies.view', 'EMERGENCIES', 'View emergency outbreak alerts'),
('p-41', 'emergencies.create', 'EMERGENCIES', 'Report emergency health hazards / outbreaks'),
('p-42', 'emergencies.investigate', 'EMERGENCIES', 'Update emergency investigation notes'),
('p-43', 'emergencies.resolve', 'EMERGENCIES', 'Mark emergency incidents as resolved'),
('p-44', 'feedback.view', 'FEEDBACK', 'View public feedback tickets'),
('p-45', 'feedback.create', 'FEEDBACK', 'Submit feedback from community'),
('p-46', 'feedback.respond', 'FEEDBACK', 'Respond and update feedback status'),
('p-47', 'analytics.view', 'ANALYTICS', 'View operational analytics and dashboards'),
('p-48', 'analytics.export', 'ANALYTICS', 'Export health indicator data and DHIS2 files'),
('p-49', 'audit.view', 'AUDIT', 'View system security audit trail'),
('p-50', 'settings.manage', 'SETTINGS', 'Configure platform settings and SMS gateway');

-- Assign Super Admin Permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 'role-super-admin', `id` FROM `permissions`;

-- Assign Admin Permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 'role-admin', `id` FROM `permissions`
WHERE `code` NOT IN ('audit.delete');

-- Assign Operational Permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 'role-operational', `id` FROM `permissions`
WHERE `code` IN (
  'volunteers.view', 'volunteers.create', 'volunteers.update', 'volunteers.approve',
  'campaigns.view', 'campaigns.create', 'campaigns.update', 'campaigns.publish',
  'tasks.view', 'tasks.create', 'tasks.assign', 'tasks.update',
  'field_data.view', 'field_data.review', 'field_data.approve', 'field_data.reject',
  'training.view', 'training.create', 'training.update',
  'inventory.view', 'inventory.create', 'inventory.update',
  'supply_requests.view', 'supply_requests.approve', 'supply_requests.reject',
  'emergencies.view', 'emergencies.investigate', 'emergencies.resolve',
  'feedback.view', 'feedback.respond', 'analytics.view', 'users.view'
);

-- Assign Data Analyst Permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 'role-analyst', `id` FROM `permissions`
WHERE `code` IN (
  'analytics.view', 'analytics.export', 'campaigns.view', 'field_data.view',
  'volunteers.view', 'emergencies.view', 'feedback.view', 'training.view',
  'inventory.view', 'users.view'
);

-- Assign Volunteer Permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 'role-volunteer', `id` FROM `permissions`
WHERE `code` IN (
  'tasks.view', 'tasks.complete', 'field_data.create', 'field_data.view',
  'training.view', 'training.complete', 'supply_requests.create', 'supply_requests.view',
  'emergencies.create', 'campaigns.view'
);

-- Assign Public User Permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 'role-public', `id` FROM `permissions`
WHERE `code` IN ('campaigns.view', 'feedback.create', 'emergencies.create');

-- 8. Authentic Users (Only Superadmin: superadmin@caafimaadhub.so / super#123)
INSERT INTO `users` (`id`, `organization_id`, `region_id`, `district_id`, `full_name`, `email`, `phone`, `password_hash`, `preferred_language`, `role`, `status`, `is_active`, `is_suspended`) VALUES
('usr-superadmin-01', 'org-fmoh-001', 'reg-banadir', 'dist-hodan', 'Super Administrator', 'superadmin@caafimaadhub.so', '+252 61 5111111', '$2a$10$w8mS8U5e8Y6bE6dZtJ8u1O9hI.1kRz0F1mG2n3p4q5r6s7t8u9v0w', 'so', 'Superadmin', 'active', 1, 0);

-- Role Assignments
INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
('usr-superadmin-01', 'role-super-admin');

-- 9. Campaigns
INSERT INTO `campaigns` (`id`, `organization_id`, `name`, `code`, `type`, `description`, `objective`, `start_date`, `end_date`, `region_id`, `district_id`, `target_communities`, `target_population`, `budget`, `currency`, `manager_id`, `status`, `priority`, `required_volunteers`, `created_by`) VALUES
('camp-polio-2026-01', 'org-fmoh-001', 'Tallaalka Polio Qaran (National Polio Immunization Campaign)', 'CAMP-POLIO-01', 'POLIO', 'Door-to-door oral polio vaccination (bOPV) targeting under-5 children across high-density urban districts in Banadir and surrounding zones.', 'Vaccinate 150,000 under-5 children with bOPV and conduct acute flaccid paralysis (AFP) zero-dose tracking.', '2026-05-01', '2026-05-31', 'reg-banadir', 'dist-hodan', 'Taleex, K5 Zoobe, 21st October, Towfiiq', 150000, 48000.00, 'USD', 'usr-superadmin-01', 'ACTIVE', 'HIGH', 120, 'usr-superadmin-01'),
('camp-nutr-2026-02', 'org-unicef-003', 'Wacyigelinta & Baaritaanka Nafaqada (Integrated Nutrition & MUAC Outreach)', 'CAMP-NUTR-02', 'NUTRITION', 'Comprehensive MUAC nutritional screening and direct therapeutic feeding distribution for SAM and MAM children.', 'Screen 35,000 children aged 6-59 months and provide PlumpyNut RUTF to malnourished children in Woqooyi Galbeed.', '2026-04-20', '2026-05-20', 'reg-woqooyi', 'dist-hargeisa', 'Axmed Dhagax, Maxamuud Haybe, Gacan Libaax', 45000, 32000.00, 'USD', 'usr-superadmin-01', 'ACTIVE', 'HIGH', 80, 'usr-superadmin-01'),
('camp-malaria-2026-03', 'org-fmoh-001', 'Ka Hortagga Duumada & Qaybinta Mara Kaneecada (Malaria Prevention & LLIN Distribution)', 'CAMP-MALARIA-03', 'MALARIA', 'Mass Long-Lasting Insecticidal Net (LLIN) distribution, fever rapid screening, and indoor residual prevention in riverine communities.', 'Distribute 40,000 mosquito nets and screen 15,000 febrile patients across Jubaland riverine corridors.', '2026-05-10', '2026-05-30', 'reg-lower-juba', 'dist-kismayo', 'Calanley, Farjano, Fanole, Shaqaalaha', 85000, 36000.00, 'USD', 'usr-superadmin-01', 'ACTIVE', 'HIGH', 90, 'usr-superadmin-01'),
('camp-mch-2026-04', 'org-srcs-002', 'Caafimaadka Hooyada & Dhallaanka (Maternal & Child Health Outreach)', 'CAMP-MCH-04', 'MATERNAL_HEALTH', 'Mobile antenatal screening, distribution of Clean Delivery Kits, tetanus vaccination, and postnatal newborn checkups.', 'Reach 12,000 pregnant and lactating mothers with prenatal screening and safe delivery supplies.', '2026-05-05', '2026-05-25', 'reg-galguduud', 'dist-cadaado', 'Waaberi, Dayax, Hantiwadaag', 25000, 24000.00, 'USD', 'usr-superadmin-01', 'PLANNED', 'MEDIUM', 50, 'usr-superadmin-01'),
('camp-awd-2026-05', 'org-who-004', 'Ka Jawaabista Degdegga ah ee Daacuunka (AWD / Cholera Outbreak Control)', 'CAMP-AWD-05', 'EMERGENCY_RESPONSE', 'Rapid emergency response team deployment for chlorination, ORS corner setup, and active case tracing in flood-affected districts.', 'Establish 10 community rehydration points and distribute 50,000 Aquatabs in Hiran.', '2026-05-01', '2026-06-15', 'reg-hiran', 'dist-beledweyne', 'Koshin, Hawo Tako, Buundaweyn', 60000, 42000.00, 'USD', 'usr-superadmin-01', 'ACTIVE', 'CRITICAL', 65, 'usr-superadmin-01');

-- 10. Field Forms Definitions
INSERT INTO `field_forms` (`id`, `title`, `code`, `category`, `description`, `schema_json`, `is_active`, `version`, `created_by`) VALUES
('form-immu-01', 'Warbixinta Tallaalka Polio & Ilmaha', 'FORM-IMMU-V1', 'IMMUNIZATION', 'Standard digital tally form for tracking vaccinated under-5 children, doses administered, zero-dose tracking, and indelible finger marking.',
'{"fields":[{"name":"child_name","label":"Magaca Ilmaha (Child Name)","type":"TEXT","required":true},{"name":"child_gender","label":"Jinsiga (Gender)","type":"SELECT","options":["Lab (Male)","Dhedig (Female)"],"required":true},{"name":"age_months","label":"Da''da Bilaha (Age in Months)","type":"NUMBER","required":true},{"name":"vaccine_type","label":"Nooca Tallaalka","type":"SELECT","options":["bOPV (Oral Polio)","IPV (Inactivated Polio)","Pentavalent","Measles-Rubella","BCG"],"required":true},{"name":"dose_number","label":"Xaddiga Qiyaasta (Dose Number)","type":"SELECT","options":["Qiyaasta 1aad","Qiyaasta 2aad","Qiyaasta 3aad","Booster"],"required":true},{"name":"is_zero_dose","label":"Ilmo Waligii Aan Tallaal Qaadan (Zero-Dose)","type":"BOOLEAN","required":true},{"name":"caregiver_name","label":"Magaca Waalidka / Qofka Masuulka ah","type":"TEXT","required":true},{"name":"caregiver_phone","label":"Telefoonka Waalidka","type":"TEXT","required":false},{"name":"finger_marked","label":"Farta Ma Lagu Calaamadeeyay Qalinka Indelible?","type":"BOOLEAN","required":true},{"name":"notes","label":"Faallooyin Dheeraad ah","type":"TEXTAREA","required":false}]}',
1, 1, 'usr-superadmin-01'),

('form-nutr-02', 'Warbixinta Nafaqada & Cabirka MUAC', 'FORM-NUTR-V1', 'NUTRITION', 'Nutrition assessment for children 6-59 months measuring mid-upper arm circumference (MUAC) and bilateral pitting edema.',
'{"fields":[{"name":"child_name","label":"Magaca Ilmaha","type":"TEXT","required":true},{"name":"age_months","label":"Da''da (Bilood)","type":"NUMBER","required":true},{"name":"gender","label":"Jinsiga","type":"SELECT","options":["Lab","Dhedig"],"required":true},{"name":"muac_measurement_mm","label":"Cabirka MUAC (Millimeter)","type":"NUMBER","required":true},{"name":"nutritional_status","label":"Heerka Nafaqada","type":"SELECT","options":["Caadi / Cagaar (Normal > 125mm)","MAM / Jaalle (Moderate Acute Malnutrition 115-124mm)","SAM / Casan (Severe Acute Malnutrition < 115mm)"],"required":true},{"name":"bilateral_edema","label":"Biyo Barar Labada Lugood (Bilateral Edema)","type":"BOOLEAN","required":true},{"name":"rutf_sachets_given","label":"Tirada Baakadaha PlumpyNut ee La Siiyay","type":"NUMBER","required":false},{"name":"referred_to_otp","label":"Loo Gudbiyey Xarunta Daaweynta OTP","type":"BOOLEAN","required":true}]}',
1, 1, 'usr-superadmin-01'),

('form-malaria-03', 'Warbixinta Duumada & Baaritaanka RDT', 'FORM-MAL-V1', 'MALARIA', 'Malaria household screening, rapid diagnostic test recording, and LLIN net distribution.',
'{"fields":[{"name":"household_head","label":"Madaxa Qoyska","type":"TEXT","required":true},{"name":"total_occupants","label":"Wadarta Dadka Qoyska","type":"NUMBER","required":true},{"name":"suspected_cases","label":"Dadka Qandhada / Qarqaryada Leh","type":"NUMBER","required":true},{"name":"rdt_performed","label":"Tirada Baaritaannada RDT ee La Sameeyay","type":"NUMBER","required":true},{"name":"rdt_positive","label":"Kiisaska RDT Positive Noqday","type":"NUMBER","required":true},{"name":"treatment_administered","label":"Tirada Daawada Coartem ee Goobta Lagu Siiyay","type":"NUMBER","required":false},{"name":"severe_referrals","label":"Kiisaska Halista ah ee Cisbitaalka Loo Gudbiyey","type":"NUMBER","required":false},{"name":"nets_distributed","label":"Tirada Mara Kaneecada (LLIN) ee La Siiyay","type":"NUMBER","required":true}]}',
1, 1, 'usr-superadmin-01'),

('form-mch-04', 'Warbixinta Caafimaadka Hooyada & Uurka', 'FORM-MCH-V1', 'MATERNAL_HEALTH', 'Maternal antenatal screening, gestational age tracking, tetanus vaccination, and clean delivery kit issue.',
'{"fields":[{"name":"mother_name","label":"Magaca Hooyada","type":"TEXT","required":true},{"name":"age_years","label":"Da''da Hooyada (Sanad)","type":"NUMBER","required":true},{"name":"gestational_months","label":"Muddada Uurka (Bilood)","type":"NUMBER","required":true},{"name":"gravida_parity","label":"Uurka Immisaad (Gravida/Para)","type":"TEXT","required":true},{"name":"blood_pressure","label":"Dhiig-karka (BP mmHg)","type":"TEXT","required":false},{"name":"tetanus_given","label":"Tallaalka Teetada (Td) Ma La Siiyay?","type":"BOOLEAN","required":true},{"name":"delivery_kit_given","label":"Xirmada Dhalmada Nadiifta ah Ma La Siiyay?","type":"BOOLEAN","required":true},{"name":"iron_folic_given","label":"Kaniiniga Dhiig-dhiska (Iron-Folic) Ma La Siiyay?","type":"BOOLEAN","required":true},{"name":"referral_needed","label":"U Baahan Tahay Gudbin Cisbitaal Degdeg ah","type":"BOOLEAN","required":true}]}',
1, 1, 'usr-superadmin-01');

-- 11. Tasks
INSERT INTO `tasks` (`id`, `campaign_id`, `organization_id`, `title`, `task_type`, `description`, `instructions`, `priority`, `status`, `region_id`, `district_id`, `community_id`, `target_location_name`, `latitude`, `longitude`, `start_datetime`, `deadline_datetime`, `requires_field_data`, `field_form_id`, `created_by`) VALUES
('task-polio-01', 'camp-polio-2026-01', 'org-fmoh-001', 'Taleex Zone A Polio Vaccination Sweep', 'VACCINATION', 'Door-to-door child polio vaccination across Taleex Zone A covering 80 target households.', 'Visit every household, administer 2 drops of bOPV to under-5 children, check finger marks, record zero-dose children.', 'HIGH', 'IN_PROGRESS', 'reg-banadir', 'dist-hodan', 'com-tlg-01', 'Taleex Zone A, Hodan', 2.0445, 45.3140, '2026-05-02 08:00:00', '2026-05-15 17:00:00', 1, 'form-immu-01', 'usr-superadmin-01'),
('task-nutr-02', 'camp-nutr-2026-02', 'org-unicef-003', 'Axmed Dhagax MUAC Mass Screening', 'NUTRITION_SCREENING', 'Measure mid-upper arm circumference of all children aged 6-59 months in Axmed Dhagax village.', 'Use color-coded MUAC tape. If Red (<115mm) or bilateral edema, initiate PlumpyNut and refer to OTP clinic.', 'HIGH', 'IN_PROGRESS', 'reg-woqooyi', 'dist-hargeisa', 'com-hg-05', 'Axmed Dhagax Community', 9.5530, 44.0590, '2026-05-02 08:30:00', '2026-05-18 16:30:00', 1, 'form-nutr-02', 'usr-superadmin-01'),
('task-mal-03', 'camp-malaria-2026-03', 'org-fmoh-001', 'Calanley Malaria Rapid Test & Bednet Distribution', 'MALARIA_SURVEILLANCE', 'Conduct rapid diagnostic testing for febrile cases and distribute LLIN mosquito nets to families with pregnant women/infants.', 'Test suspected cases with Pf/Pv RDT. Issue Coartem for positive cases, record in form.', 'MEDIUM', 'IN_PROGRESS', 'reg-lower-juba', 'dist-kismayo', 'com-ks-06', 'Calanley Sector 4', -0.3540, 42.5420, '2026-05-10 08:00:00', '2026-05-28 17:00:00', 1, 'form-malaria-03', 'usr-superadmin-01'),
('task-mch-04', 'camp-mch-2026-04', 'org-srcs-002', 'Cadaado Maternal Antenatal Outreach', 'MATERNAL_CARE', 'Provide home-based antenatal checks, check blood pressure, provide iron supplements and Clean Delivery Kits.', 'Identify 3rd trimester mothers, review danger signs, give birth preparedness education.', 'MEDIUM', 'ASSIGNED', 'reg-galguduud', 'dist-cadaado', 'com-cd-09', 'Waaberi Section, Cadaado', 6.1350, 46.6320, '2026-05-12 08:30:00', '2026-05-24 16:00:00', 1, 'form-mch-04', 'usr-superadmin-01');

-- 14. Inventory Locations & Health Depots
INSERT INTO `inventory_locations` (`id`, `facility_id`, `name`, `code`, `region_id`, `district_id`, `address`) VALUES
('loc-bnd-central', 'fac-banadir-hosp', 'Banadir Central Cold Chain & Vaccine Depot', 'LOC-BND-DEP', 'reg-banadir', 'dist-hodan', 'Banadir Hospital Logistics Wing, Hodan'),
('loc-srcs-wh', 'fac-madina-hosp', 'SRCS Mogadishu Regional Field Warehouse', 'LOC-SRCS-MOG', 'reg-banadir', 'dist-hodan', 'KM4 Logistics Center, Wadajir'),
('loc-hgh-store', 'fac-hargeisa-gh', 'Hargeisa Regional Medical Supply Store', 'LOC-WQG-HGH', 'reg-woqooyi', 'dist-hargeisa', 'Shaab Hospital Road, Hargeisa'),
('loc-kis-store', 'fac-kismayo-gh', 'Jubaland Central Medical Depot', 'LOC-LJB-KIS', 'reg-lower-juba', 'dist-kismayo', 'Port Road, Kismayo'),
('loc-bwn-store', 'fac-beledweyne-gh', 'Hiiraan Regional Emergency Medical Store', 'LOC-HIR-BWN', 'reg-hiran', 'dist-beledweyne', 'Hospital Road, Beledweyne'),
('loc-gar-store', 'fac-garowe-gh', 'Puntland Central Pharmaceutical Store', 'LOC-NUG-GAR', 'reg-nugaal', 'dist-garowe', 'Airport Road Medical Hub, Garowe');

-- 15. Comprehensive Medical Supplies & Inventory (24+ Healthcare Items)
INSERT INTO `inventory_items` (`id`, `item_code`, `name`, `category`, `unit_of_measure`, `quantity_on_hand`, `minimum_stock_level`, `location_id`, `batch_number`, `expiry_date`, `supplier_name`, `unit_cost`) VALUES
-- Vaccines & Cold Chain
('item-opv-01', 'MED-VAC-bOPV-01', 'Bivalent Oral Polio Vaccine (bOPV 20-dose with VVM)', 'VACCINES', 'vials', 3500, 300, 'loc-bnd-central', 'B-OPV-2026-08', '2027-12-31', 'UNICEF Supply Division Copenhagen', 3.20),
('item-ipv-02', 'MED-VAC-IPV-02', 'Inactivated Polio Vaccine (IPV 10-dose vial)', 'VACCINES', 'vials', 1800, 200, 'loc-bnd-central', 'IPV-2026-44', '2027-09-30', 'Sanofi Pasteur', 4.50),
('item-mr-03', 'MED-VAC-MR-03', 'Measles & Rubella Live Vaccine (10-dose + Diluent)', 'VACCINES', 'vials', 2200, 250, 'loc-hgh-store', 'MR-2026-112', '2027-11-30', 'Serum Institute of India', 2.90),
('item-bcg-04', 'MED-VAC-BCG-04', 'BCG Tuberculosis Vaccine (20-dose ampoules + diluent)', 'VACCINES', 'vials', 1400, 150, 'loc-gar-store', 'BCG-2026-55', '2027-08-31', 'BB-NCIPD Ltd', 1.80),
('item-penta-05', 'MED-VAC-PENTA-05', 'Pentavalent Vaccine DTP-HepB-Hib (10-dose vial)', 'VACCINES', 'vials', 2100, 200, 'loc-kis-store', 'PNT-2026-90', '2027-10-31', 'Serum Institute of India', 5.10),
('item-coldbox-06', 'EQP-COLD-CARRIER-06', 'Vaccine Carrier Cold Box (Awal 2.6L with 4 Icepacks, 44h)', 'COLD_CHAIN', 'pieces', 120, 20, 'loc-bnd-central', 'CC-AWAL-2026', '2032-01-01', 'Blowkings Cold Chain Solutions', 34.00),

-- Nutrition & SAM/MAM Therapeutics
('item-rutf-07', 'MED-NUT-RUTF-07', 'PlumpyNut Ready-to-Use Therapeutic Food (92g sachet)', 'NUTRITION_SUPPLIES', 'cartons_150pcs', 450, 50, 'loc-srcs-wh', 'NUT-PLMP-2026-88', '2027-10-31', 'Nutriset France / UNICEF', 46.50),
('item-rusf-08', 'MED-NUT-RUSF-08', 'PlumpySup Supplementary Food for MAM (100g sachet)', 'NUTRITION_SUPPLIES', 'cartons_150pcs', 380, 40, 'loc-srcs-wh', 'SUP-RUSF-2026-12', '2027-09-30', 'Nutriset France', 42.00),
('item-f75-09', 'MED-NUT-F75-09', 'F-75 Therapeutic Diet Milk Powder for SAM (400g tin)', 'NUTRITION_SUPPLIES', 'tins', 320, 30, 'loc-bwn-store', 'F75-MLK-2026-03', '2027-08-31', 'Lactalis International', 7.80),
('item-muac-chd-10', 'EQP-MUAC-CHD-10', 'Child Mid-Upper Arm Circumference (MUAC) Tapes (115/125mm)', 'NUTRITION_SUPPLIES', 'pieces', 850, 100, 'loc-srcs-wh', 'MUAC-CHD-2026', '2031-01-01', 'UNICEF Supply Division', 0.85),
('item-muac-mom-11', 'EQP-MUAC-MOM-11', 'Maternal / Adult MUAC Screening Tapes', 'NUTRITION_SUPPLIES', 'pieces', 400, 50, 'loc-hgh-store', 'MUAC-MOM-2026', '2031-01-01', 'UNICEF Supply Division', 0.95),
('item-scale-12', 'EQP-SCALE-SLT-12', 'Salter 25kg Hanging Spring Weighing Scale with Pants', 'EQUIPMENT', 'pieces', 95, 15, 'loc-srcs-wh', 'SLT-25KG-2026', '2035-01-01', 'Salter Brecknell UK', 28.00),

-- Essential Primary Care Medicines
('item-coartem-13', 'MED-ACT-COA-13', 'Artemether-Lumefantrine 20/120mg (Coartem Dispersible 6x1)', 'MEDICINES', 'blister_packs', 1600, 200, 'loc-kis-store', 'ACT-COA-2026-44', '2028-02-28', 'Novartis Pharma AG', 2.60),
('item-amox-14', 'MED-ANT-AMX-14', 'Amoxicillin 250mg Dispersible Pediatric Tablets (100 tabs)', 'MEDICINES', 'bottles', 1100, 120, 'loc-bwn-store', 'AMX-250-2026-78', '2028-04-30', 'Medopharm Global', 3.40),
('item-pcm-syr-15', 'MED-ANT-PCM-15', 'Paracetamol 120mg/5ml Pediatric Syrup (100ml bottle)', 'MEDICINES', 'bottles', 1900, 200, 'loc-bnd-central', 'PCM-SYR-2026-09', '2028-06-30', 'Universal Corporation Ltd', 1.10),
('item-ors-16', 'MED-ORS-ZNC-16', 'WHO Low-Osmolarity Oral Rehydration Salts (ORS 1L Sachet)', 'MEDICINES', 'sachets', 6500, 600, 'loc-bwn-store', 'ORS-WHO-2026-55', '2028-11-30', 'FDC Limited International', 0.25),
('item-zinc-17', 'MED-ZNC-SUL-17', 'Zinc Sulfate 20mg Dispersible Tablets for Diarrhea (100 tabs)', 'MEDICINES', 'boxes', 1250, 150, 'loc-bwn-store', 'ZNC-20-2026-31', '2028-08-31', 'Nutriset / Strides Pharma', 2.10),
('item-alben-18', 'MED-ALB-TAB-18', 'Albendazole 400mg Deworming Chewable Tablets (100 tabs)', 'MEDICINES', 'bottles', 800, 100, 'loc-hgh-store', 'ALB-400-2026-19', '2028-10-31', 'Cipla Global', 4.20),
('item-vita-19', 'MED-VITA-CAP-19', 'Vitamin A 200,000 IU Red Capsules (Bottle of 500)', 'MEDICINES', 'bottles', 600, 80, 'loc-bnd-central', 'VITA-200K-2026', '2028-05-31', 'UNICEF Supply Division', 6.50),
('item-chx-20', 'MED-CHX-GEL-20', 'Chlorhexidine Digluconate 7.1% Umbilical Cord Care Gel (20g)', 'MEDICINES', 'tubes', 1400, 150, 'loc-gar-store', 'CHX-GEL-2026-80', '2028-03-31', 'Galentic Pharma', 1.40),

-- Diagnostics, PPE & Field Delivery Kits
('item-rdt-mal-21', 'MED-RDT-MAL-21', 'Malaria Pf/Pv Antigen Rapid Diagnostic Test Kit (25 tests)', 'DIAGNOSTIC_KITS', 'boxes', 750, 80, 'loc-kis-store', 'RDT-MAL-2026-99', '2027-12-31', 'Standard Diagnostics Global', 18.50),
('item-therm-22', 'EQP-DIG-THM-22', 'Non-Contact Infrared Forehead Digital Thermometer', 'EQUIPMENT', 'pieces', 160, 25, 'loc-bnd-central', 'THM-IR-2026', '2032-01-01', 'Berrcom Medical Instruments', 14.00),
('item-bpcuff-23', 'EQP-BP-CUFF-23', 'Aneroid Sphygmomanometer BP Cuff & Stethoscope Kit', 'EQUIPMENT', 'sets', 110, 15, 'loc-hgh-store', 'BPM-PRO-2026', '2034-01-01', 'Omron Healthcare / ADC', 24.50),
('item-gloves-24', 'PPE-GLV-NIT-24', 'Nitrile Medical Examination Gloves Medium (Box of 100)', 'PPE', 'boxes', 1200, 150, 'loc-bnd-central', 'GLV-NIT-2026-M', '2029-06-30', 'SafeTouch Healthcare', 7.50),
('item-masks-25', 'PPE-MSK-SRG-25', '3-Ply Disposable Surgical Face Masks (Box of 50)', 'PPE', 'boxes', 1500, 200, 'loc-srcs-wh', 'MSK-3PLY-2026', '2029-04-30', 'HygieneFirst Med', 4.20),
('item-aquatabs-26', 'WSH-AQT-TAB-26', 'Aquatabs Water Purification Chlorine Tablets 67mg (50 tabs)', 'WASH_SUPPLIES', 'packs', 3500, 400, 'loc-bwn-store', 'AQT-67MG-2026', '2029-08-31', 'Medentech Ltd Ireland', 2.80),
('item-bednet-27', 'WSH-NET-LLIN-27', 'Long-Lasting Insecticidal Mosquito Bed Nets (LLIN XL)', 'MALARIA_NETS', 'pieces', 5200, 500, 'loc-kis-store', 'NET-OLYSET-2026', '2030-01-01', 'Sumitomo Chemical', 4.60),
('item-cleandel-28', 'KIT-CLN-DEL-28', 'Sterile Clean Delivery Kit for Home Births (Full Pack)', 'MATERNAL_SUPPLIES', 'kits', 650, 80, 'loc-gar-store', 'CDK-SOM-2026', '2028-12-31', 'UNFPA Supply Division', 8.90),
('item-marker-29', 'MAT-IND-MRK-29', 'Indelible Purple Marker Pens for Child Vaccination Marking', 'SUPPLIES', 'pens', 1800, 200, 'loc-bnd-central', 'MRK-IND-2026-V', '2028-09-30', 'Global Ink Healthcare', 1.05);

-- 16. Inventory Transactions (Stock Movement Logs)
INSERT INTO `inventory_transactions` (`id`, `item_id`, `transaction_type`, `quantity`, `balance_after`, `from_location_id`, `to_location_id`, `reference_number`, `performed_by`, `notes`) VALUES
('tx-01', 'item-opv-01', 'STOCK_IN', 3550, 3550, NULL, 'loc-bnd-central', 'PO-FMOH-2026-001', 'usr-superadmin-01', 'Initial shipment receipt from UNICEF cold chain depot'),
('tx-02', 'item-opv-01', 'ADJUSTMENT', 50, 3500, 'loc-bnd-central', NULL, 'ADJ-2026-01', 'usr-superadmin-01', 'Initial inventory baseline adjustment'),
('tx-03', 'item-rutf-07', 'STOCK_IN', 500, 500, NULL, 'loc-srcs-wh', 'PO-UNICEF-NUT-2026', 'usr-superadmin-01', 'Consignment of PlumpyNut received for malnutrition outreach'),
('tx-04', 'item-coartem-13', 'STOCK_IN', 1650, 1650, NULL, 'loc-kis-store', 'PO-MOH-MAL-2026', 'usr-superadmin-01', 'Stock in of Coartem pediatric dispersible blisters');

-- 17. Supply Requests (Initial clean state for new volunteer submissions)
-- No dummy volunteer requests until superadmin approves new volunteers

-- 18. Emergency Outbreak Reports
INSERT INTO `emergency_reports` (`id`, `report_code`, `emergency_type`, `severity`, `description`, `suspected_cases_count`, `region_id`, `district_id`, `community_name`, `latitude`, `longitude`, `reporter_type`, `reporter_user_id`, `reporter_name`, `reporter_phone`, `status`, `investigation_notes`) VALUES
('em-01', 'EMR-2026-0001', 'DISEASE_OUTBREAK', 'CRITICAL', 'Cluster of 14 children presenting with acute watery diarrhea (AWD) and rapid dehydration following heavy seasonal flooding.', 14, 'reg-hiran', 'dist-beledweyne', 'Koshin Village riverside', 4.7380, 45.2050, 'SUPER_ADMIN', 'usr-superadmin-01', 'Hassan Omar Geedi', '+252 61 5666666', 'INVESTIGATING', 'Rapid response cholera/AWD team dispatched with ORS kits, zinc, and Aquatabs from Beledweyne Hospital.'),
('em-02', 'EMR-2026-0002', 'DISEASE_OUTBREAK', 'HIGH', 'Suspected measles cluster with fever and maculopapular rash among 9 un-vaccinated children in IDP settlement.', 9, 'reg-banadir', 'dist-daynile', 'Daynile IDP Section 3', 2.0820, 45.2750, 'SUPER_ADMIN', 'usr-superadmin-01', 'Asha Mohamed Weheliye', '+252 61 5777771', 'INVESTIGATING', 'Mobile immunization team queued for supplementary measles-rubella ring vaccination.');

-- 19. Community Feedback
INSERT INTO `feedback` (`id`, `ticket_number`, `category`, `description`, `region_id`, `district_id`, `location_name`, `reporter_name`, `reporter_phone`, `status`, `admin_notes`) VALUES
('fb-01', 'TCK-2026-1001', 'SERVICE_REQUEST', 'Requesting our local MCH in Taleex to extend polio vaccination team hours past 4:00 PM for working mothers.', 'reg-banadir', 'dist-hodan', 'Taleex Junction', 'Asha Mohamed Weheliye', '+252 61 5777771', 'IN_PROGRESS', 'Forwarded to District Health Officer to schedule late afternoon mobile team visits.'),
('fb-02', 'TCK-2026-1002', 'APPRECIATION', 'The community volunteers were very polite and fast when testing for malaria and providing bed nets.', 'reg-lower-juba', 'dist-kismayo', 'Calanley Sector 4', 'Cumar Cabdullaahi Shire', '+252 61 5777773', 'RESOLVED', 'Feedback shared with Kismayo volunteer field team.');

-- 20. Comprehensive In-App Training Courses
INSERT INTO `training_courses` (`id`, `title`, `code`, `category`, `description`, `estimated_hours`, `passing_score_percentage`, `is_published`, `created_by`) VALUES
('course-coldchain-03', 'EPI Vaccine Handling & Cold Chain Integrity in Somalia', 'CRS-EPI-03', 'IMMUNIZATION', 'Proper usage of vaccine carriers, icepack conditioning, Vaccine Vial Monitors (VVM), and zero-dose tracking.', 2.0, 80, 1, 'usr-superadmin-01'),
('course-iccm-01', 'Integrated Community Case Management (iCCM Somalia)', 'CRS-ICCM-01', 'DISEASE_PREVENTION', 'Comprehensive WHO/UNICEF protocol for community health workers assessing diarrhea, pneumonia, and malaria in children under 5.', 2.0, 80, 1, 'usr-superadmin-01'),
('course-muac-02', 'Mid-Upper Arm Circumference (MUAC) Child Nutrition Screening', 'CRS-MUAC-02', 'NUTRITION', 'Step-by-step masterclass on using color-coded MUAC tapes, identifying SAM with bilateral edema, and OTP referral.', 1.5, 80, 1, 'usr-superadmin-01'),
('course-mch-04', 'Maternal Health & Safe Clean Delivery Outreach in Somalia', 'CRS-MCH-04', 'MATERNAL_HEALTH', 'Antenatal care (ANC) screening, danger signs during pregnancy, Clean Delivery Kit usage, and newborn cord care.', 2.0, 80, 1, 'usr-superadmin-01'),
('course-wash-05', 'Community WASH, Water Chlorination & Cholera / AWD Control', 'CRS-WASH-05', 'EMERGENCY_RESPONSE', 'Rapid response protocols for chlorination of household water sources, ORS corner setup, and acute watery diarrhea prevention.', 1.5, 80, 1, 'usr-superadmin-01');

-- 20.1 Training Lessons
INSERT INTO `training_lessons` (`id`, `course_id`, `title`, `lesson_order`, `content_type`, `body_content`, `duration_minutes`) VALUES
-- EPI Cold Chain Lessons
('les-epi-01', 'course-coldchain-03', '1. Hordhaca Silsiladda Qabowga (Cold Chain Basics & Temperature Ranges)', 1, 'TEXT', '## Silsiladda Qabowga ee Tallaalka (Cold Chain System)\n\nSilsiladda qabowgu waa nidaamka isku xiran ee lagu keydiyo, laguna qaado tallaallada laga bilaabo goobta wax soo saarka ilaa laga gaarsiiyo ilmaha ama hooyada, iyadoo heerkulka lagu hayo inta u dhaxeysa **+2°C ilaa +8°C**.\n\n### Maxaa Dhacaya Haddii Heerkulku Xumaado?\n- Tallaalka haddii uu baraf fariisto (freeze) wuxuu luminayaa awoodda difaaca gaar ahaan tallaallada ay ka mid yihiin Pentavalent, Td, iyo IPV.\n- Tallaalka haddii kuleyl soo gaaro wuxuu ku xumaanayaa muddo kooban.\n\n### Tilmaamaha Muhiimka ah ee CHV-ga:\n1. Hubi in heerkulbeeggu (thermometer) uu mar walba ku jiro sanduuqa tallaalka.\n2. Ha dhigin tallaalka meel qorraxdu toos ugu dhaceyso.\n3. Mar walba isticmaal xirmooyinka barafka ee si sax ah loo qaboojiyey (conditioned icepacks).', 20),
('les-epi-02', 'course-coldchain-03', '2. Diyaarinta Barafka & Sanduuqa Qaadista (Icepack Conditioning & Carrier Packing)', 2, 'TEXT', '## Habka Saxda ah ee Loo Diyaariyo Barafka (Conditioning Icepacks)\n\nMarka barafka laga soo saaro qaboojiyaha (freezer), barafku wuxuu heerkulkiisu noqon karaa -15°C ilaa -20°C. Haddii tallaalka toos loo ag dhigo, wuxuu ku fariisanayaa baraf (freezing damage).\n\n### Talaabooyinka Conditioning:\n1. Dhig xirmooyinka barafka (icepacks) miis ama oog fidsan heerkulka caadiga ah.\n2. Sug ilaa inta dhibco biyo ah ay ka soo muuqanayaan dusha barafka oo aad maqasho biyo dhex socda marka aad ruxdo.\n3. Marka ay biyuhu dhex socdaan, geli 4-ta xirmo baraf ee sanduuqa tallaalka (vaccine carrier).\n4. Dhig tallaalka dhexda adigoo ku xiraya bac caag ah si biyuhu aysan u tirtirin sumadda dhalada (label).', 20),
('les-epi-03', 'course-coldchain-03', '3. Akhrinta Kormeeraha Dhalada Tallaalka (Vaccine Vial Monitor - VVM Stages)', 3, 'TEXT', '## Akhrinta VVM (Vaccine Vial Monitor)\n\nVVM waa calaamad wareeg ah oo ku dhegan dhalada tallaalka dhexdeedana uu ku jiro labajibbaaran (square) yar oo midabkiisu isbeddelo haddii kuleyl uu saameeyo.\n\n### Heerarka VVM:\n- **Heerka 1aad (Stage 1):** Labajibbaaranka guduhu waa caddaan saafi ah. -> **Tallaalka waa la isticmaali karaa (USE).**\n- **Heerka 2aad (Stage 2):** Labajibbaaranka guduhu wuu ka khafiifsan yahay goobada bannaanka. -> **Tallaalka waa la isticmaali karaa (USE).**\n- **Heerka 3aad (Stage 3):** Labajibbaaranka guduhu wuxuu le''eg yahay ama la mid yahay midabka goobada bannaanka. -> **HA ISTICMAALIN (DO NOT USE) - Tuur dhalada.**\n- **Heerka 4aad (Stage 4):** Labajibbaaranka guduhu wuxuu ka madow yahay goobada bannaanka. -> **HA ISTICMAALIN (DO NOT USE) - Tallaalku wuu xumaaday.**\n\n> Digniin: Haddii dhalada tallaalka calaamaddu gaarto Stage 3 ama 4, marna ha siin ilmo, durbadiiba ku wargeli kormeerahaaga goobta.', 25),
('les-epi-04', 'course-coldchain-03', '4. Diiwaangelinta & Dabagalka Carruurta Zero-Dose (Defaulter Tracing)', 4, 'TEXT', '## Aqoonsiga & Raadinta Carruurta Zero-Dose\n\n**Ilmaha Zero-Dose** waa ilmo aan weligiis qaadan xitaa hal dose oo tallaalka aasaasiga ah (sida Penta-1 ama bOPV-0).\n\n### Doorka Hawl-wadeenka CHV:\n1. Booqo guri-ka-guri xaafadda aad mas''uulka ka tahay.\n2. Weydii kaarka tallaalka ilmaha (Child Immunization Card).\n3. Haddii aysan haysan kaar, hubi faraha ilmaha iyo taariikhda tallaalka.\n4. Qor magaca waalidka, telefoonka, iyo goobta saxda ah ee guriga.\n5. U sharax waalidka faa''iidada tallaalku u leeyahay ka-hortagga curyaanka carruurta (Polio) iyo jadeecada (Measles).', 20),

-- iCCM Protocol Lessons
('les-iccm-01', 'course-iccm-01', '1. Aqoonsiga Calaamadaha Halista Guud (General Danger Signs)', 1, 'TEXT', '## Calaamadaha Halista Guud ee Ilmaha ka Yar 5 Sano\n\nMarka aad booqato ilmo xanuunsan, talaabada koowaad waa inaad hubiso **Calaamadaha Halista Guud (General Danger Signs)**:\n\n1. **Ilmuhu wax ma cabbi karo ama ma nuugi karo naaska.**\n2. **Ilmuhu wuxuu mantagaa wax walba oo uu cuno ama cabo.**\n3. **Ilmuhu wuxuu leeyahay gariir (convulsions / fits).**\n4. **Ilmuhu waa miyir-la''aan, aad ayuu u hurdo-badan yahay ama ma soo toosayo (lethargic/unconscious).**\n\n> Haddii ilmaha lagu arko mid ka mid ah calaamadahan, durbadiiba u gudbi cisbitaalka ama xarunta MCH ee kuugu dhow.', 20),
('les-iccm-02', 'course-iccm-01', '2. Maareynta & Dawaynta Shuban-biyoodka / Daacuunka (AWD, ORS & Zinc)', 2, 'TEXT', '## Daaweynta Shubanka ee Heerka Bulshada\n\nShubanka wuxuu carruurta ku keenaa fuuqbax degdeg ah oo keeni kara dhimasho haddii aan si degdeg ah loo daweyn.\n\n### Habka Daaweynta:\n1. **ORS (Oral Rehydration Salts):** Ku qas 1 baakad oo ORS ah 1 litir oo biyo nadiif ah ama la karkariyey. Sii ilmaha kabasho-kabasho.\n2. **Kaniiniga Zinc (Zinc Sulfate 20mg):**\n   - Carruurta 2-6 bilood: 10mg maalintii (barkeed) muddo 10-14 maalmood ah.\n   - Carruurta 6 bilood ilaa 5 sano: 20mg maalintii muddo 10-14 maalmood ah.\n3. **Sii wad naasnuujinta** iyo cuntada si joogto ah.', 25),
('les-iccm-03', 'course-iccm-01', '3. Baaritaanka Oof-wareenka & Tirinta Neefsashada (Pneumonia Assessment)', 3, 'TEXT', '## Baaritaanka Oof-wareenka (Pneumonia)\n\nOof-wareenku waa caabuqa sambabada ee ku dhaca carruurta. Waxaa lagu gartaa qufac iyo neef-degdeg ah.\n\n### Tirinta Neefsashada 1 Daqiiqo (Fast Breathing):\n- **2 ilaa 11 bilood:** 50 neef ama ka badan daqiiqaddii.\n- **12 bilood ilaa 5 sano:** 40 neef ama ka badan daqiiqaddii.\n\n### Daaweynta:\n- Haddii ilmaha lagu arko neef-degdeg laakiin uusan lahayn laab-soo-jiidasho daran (chest indrawing), sii daawada **Amoxicillin DT (Dispersible Tablets 250mg)** laba jeer maalintii muddo 5 maalmood ah.', 25),
('les-iccm-04', 'course-iccm-01', '4. Baaritaanka & Daaweynta Duumada (Malaria RDT & Coartem)', 4, 'TEXT', '## Baaritaanka Duumada (Malaria Rapid Diagnostic Test - RDT)\n\nQandhada carruurta ee deegaannada duumadu ka jirto waa in marka hore lagu baaro qalabka RDT ka hor inta aan daawo la siin.\n\n### Tallaabooyinka RDT:\n1. Gasho galoofyada nadiifka ah (gloves).\n2. Ku nadiifi farta ilmaha suufka aalkolada leh (alcohol swab).\n3. Ku mud irbadda lancet-ka, qaad dhibic dhiig ah adigoo isticmaalaya capillary tube.\n4. Ku shub dhiigga ceelka baaritaanka, ku dar 4 dhibcood oo buffer ah.\n5. Akhri natiijada 15-20 daqiiqo ka dib:\n   - **Labo xariiq (Control + Test):** Positive -> Sii **Coartem (Artemether-Lumefantrine)** iyadoo la eegayo miisaanka ilmaha.\n   - **Hal xariiq (Control kaliya):** Negative -> Ha siin daawada duumada, baadh xanuun kale.', 20),

-- MUAC Nutrition Lessons
('les-muac-01', 'course-muac-02', '1. Fahamka Heerarka Nafaqo-xumada (SAM vs MAM)', 1, 'TEXT', '## Heerarka Nafaqo-xumada Carruurta (Child Malnutrition)\n\nNafaqo-xumadu waxay u kala baxdaa laba heer oo muhiim ah:\n\n1. **Nafaqo-darro Daran (Severe Acute Malnutrition - SAM):**\n   - Cabirka MUAC ka yar **115 mm (< 11.5 cm)** ama ilmaha oo leh biyo-barar labada lugood (bilateral edema).\n   - Khatar sare oo dhimasho haddii aan degdeg loo daweyn.\n2. **Nafaqo-darro Dhexdhexaad ah (Moderate Acute Malnutrition - MAM):**\n   - Cabirka MUAC u dhaxeeya **115 mm ilaa 124 mm (11.5 - 12.4 cm)**.\n3. **Xaalad Caadi ah (Normal):**\n   - Cabirka MUAC wuxuu ka weyn yahay **125 mm (> 12.5 cm)**.', 20),
('les-muac-02', 'course-muac-02', '2. Habka Saxda ah ee loo Cabbiro MUAC (Step-by-Step Measurement)', 2, 'TEXT', '## Tallaabooyinka Cabirka MUAC ee Saxda ah\n\n1. Isticmaal cududda bidix ee ilmaha.\n2. Laab suxulka ilmaha si uu u sameeyo xagal 90-degree ah.\n3. Raadi barta dhexe ee u dhaxeysa caarada garabka (acromion) iyo cidhifka suxulka (olecranon).\n4. Ku calaamadee barta dhexe qalin.\n5. Toosi gacanta ilmaha, ku duub teebka MUAC barta dhexe iyadoo aan aad loo adkeyn oo aan aad loo dabcin.\n6. Akhri daaqadda calaamadda oo qor cabirka millimeter-ka saxda ah.', 25),
('les-muac-03', 'course-muac-02', '3. Baaritaanka Biyo-bararka Labada Lugood (Bilateral Pitting Edema)', 3, 'TEXT', '## Baaritaanka Bararka Lugaha (Bilateral Pitting Edema)\n\nBararka nafaqo-xumadu keento mar walba wuxuu ka bilaabmaa labada cagood isku mar.\n\n### Sida Loo Baaro:\n1. Ku qabo labada suul dusha sare ee labada cagood ee ilmaha.\n2. Si tartiib ah u cadaadi adigoo tirinaya 1, 2, 3 (3 ilbiriqsi).\n3. Qaad suulashaada. Haddii uu haro god/godad labada cagood ah (pitting indentation), ilmuhu wuxuu leeyahay Edema.\n\n> Digniin: Ilmo kasta oo leh Bilateral Edema waa SAM (Nafaqo-darro Daran) xitaa haddii cabirka MUAC uu cagaar yahay!', 20),
('les-muac-04', 'course-muac-02', '4. Qaybinta PlumpyNut & Gudbinta Xarumaha OTP (Referral Pathways)', 4, 'TEXT', '## Maareynta & Qaybinta RUTF (PlumpyNut)\n\n### Shuruudaha Helitaanka PlumpyNut:\n- Ilmo da''diisu tahay 6-59 bilood oo cabirkiisu yahay MUAC < 115mm.\n- Ilmuhu waa inuu leeyahay rabitaanka cuntada (Appetite Test Pass).\n\n### Tilmaamaha Waalidka:\n1. PlumpyNut waa daawo, ma aha cunto qoyska lala wadaago.\n2. Ha ku qasin biyo, toos ha u cuno ilmuhu.\n3. Sii biyo nadiif ah marka uu cuno ka dib.\n4. U gudbi xarunta OTP (Outpatient Therapeutic Program) si loo siiyo daawada buuxda.', 20),

-- Maternal Health Lessons
('les-mch-01', 'course-mch-04', '1. Daryeelka Uurka ee Xilliga Hore (Antenatal Care - ANC)', 1, 'TEXT', '## Daryeelka Hooyada Uurka leh (ANC Visits)\n\nHooyo kasta oo uur leh waa inay heshaa ugu yaraan **4 booqasho oo ANC ah** inta ay uurka leedahay.\n\n### Waxyaabaha Muhiimka ah:\n- Tallaalka Teetada (Td Vaccine) si looga hortago cudurka dabeysha dhalmada.\n- Kaniiniga Dhiig-dhiska & Folic Acid (Iron-Folic Acid) maalin kasta.\n- Isticmaalka mara-kaneecada tuman (LLIN bednet) habeen kasta si looga badbaado duumada.', 20),
('les-mch-02', 'course-mch-04', '2. Calaamadaha Digniinta ee Xilliga Uurka & Dhalmada', 2, 'TEXT', '## Calaamadaha Halista ee Uurka\n\nHaddii hooyadu isku aragto mid ka mid ah kuwan, waa in degdeg loo geeyaa cisbitaal:\n\n1. **Dhiig-bax xubinta taranka ah.**\n2. **Madax-xanuun daran iyo aragga oo caadaqda (Severe headache & blurred vision).**\n3. **Qandho daran iyo gariir.**\n4. **Kacsanaanta dhiigga iyo wejiga/gacmaha oo barara.**\n5. **Dhaqdhaqaaqa ilmaha oo yaraada ama joogsada.**', 25),
('les-mch-03', 'course-mch-04', '3. Isticmaalka Xirmada Dhalmada Nadiifta ah (Clean Delivery Kit)', 3, 'TEXT', '## Xirmada Dhalmada Nadiifta ah (Clean Delivery Kit)\n\nXirmada dhalmada waxay ka kooban tahay:\n- Caag nadiif ah oo lagu dul dhalo (plastic sheet).\n- Daab cusub oo nadiif ah (sterile blade) oo lagu gooyo xuddunta.\n- Xadhko nadiif ah oo lagu xidho xuddunta (cord ties).\n- Saabuun lagu dhaqo gacmaha.\n- Jelka Chlorhexidine (7.1% CHX Gel) oo la marinayo xuddunta ilmaha dhashay.', 20),
('les-mch-04', 'course-mch-04', '4. Naasnuujinta Gaarka ah & Daryeelka Ilmaha Cusub', 4, 'TEXT', '## Saacadaha Koowaad ee Ilmaha Dhashay\n\n1. **Bilaabista Naasnuujinta 1 saac gudaheed** marka ilmuhu dhasho.\n2. **Sii caanaha ugu horreeya (Dambar / Colostrum):** Waa tallaalka koowaad ee ilmaha, wuxuu leeyahay difaac sare.\n3. **Naasnuujin Gaar ah (Exclusive Breastfeeding):** 6-da bilood ee ugu horreysa, ilmaha ha siin biyo, caano kale, ama shaah.', 20),

-- WASH & Outbreak Lessons
('les-wash-01', 'course-wash-05', '1. Nadiifinta Biyaha Guriga & Isticmaalka Aquatabs', 1, 'TEXT', '## Daweynta & Kalooriyeynta Biyaha Guriga\n\nBiyaha aan nadiifka ahayn waa sababta ugu weyn ee keenta cudurrada shuban-biyoodka iyo daacuunka.\n\n### Isticmaalka Kaniiniga Aquatabs:\n- Ku rid **1 kaniini oo Aquatabs 67mg ah** jirkaan 20 litir ah oo biyo ah.\n- Rux jirkaanka ama ku qas qori nadiif ah.\n- **Sug 30 daqiiqo** ka hor inta aan la cabin si jeermiska oo dhami u dhinto.', 20),
('les-wash-02', 'course-wash-05', '2. Xakameynta & Joojinta Faafitaanka Daacuunka (AWD / Cholera)', 2, 'TEXT', '## Xakameynta Cudurka Daacuunka ee Xaafadda\n\n1. **Dhisidda Baraha ORS (ORS Corners):** Dhig goobo dadweynuhu si fudud uga heli karaan ORS.\n2. **Kalooriyeynta Ilaha Biyaha (Well Chlorination):** Ceelasha biyaha iyo berkadaha ku dawee chlorine.\n3. **Aasidda ama gubidda qashinka:** Nadaafadda musqulaha iyo deegaanka ku xeeran.', 20),
('les-wash-03', 'course-wash-05', '3. Wacyigelinta Bulshada & Dhaqista Gacmaha', 3, 'TEXT', '## 5-ta Waqti ee Muhiimka ah ee Gacmaha la Dhaqo\n\n1. Musqusha ka dib.\n2. Ka hor inta aan cunto la diyaarin ama la cunin.\n3. Ka dib marka ilmaha xaaranka laga dhaqo.\n4. Ka hor inta aan ilmaha la nuujin ama la quudin.\n5. Ka dib marka la taabto qof xanuunsan.\n\n> Mar walba isticmaal saabuun iyo biyo socda ugu yaraan 20 ilbiriqsi.', 15);

-- 20.2 Training Quizzes
INSERT INTO `training_quizzes` (`id`, `course_id`, `title`, `description`, `time_limit_minutes`, `passing_score`) VALUES
('quiz-epi-03', 'course-coldchain-03', 'Imtixaanka Qiimeynta: Silsiladda Qabowga ee Tallaalka (EPI Cold Chain)', 'Qiimee fahamkaaga ku saabsan heerkulka tallaalka, diyaarinta barafka, iyo akhrinta VVM.', 20, 80),
('quiz-iccm-01', 'course-iccm-01', 'Imtixaanka Qiimeynta: Protocol-ka iCCM Somalia', 'Imtixaan ku saabsan aqoonsiga calaamadaha halista, daaweynta shubanka, oof-wareenka, iyo duumada.', 20, 80),
('quiz-muac-02', 'course-muac-02', 'Imtixaanka Qiimeynta: Baaritaanka Nafaqada & Cabirka MUAC', 'Imtixaan ku saabsan cabirka cududda MUAC, ogaanshaha Edema, iyo qaybinta PlumpyNut.', 20, 80),
('quiz-mch-04', 'course-mch-04', 'Imtixaanka Qiimeynta: Caafimaadka Hooyada & Dhalmada Badbaadada leh', 'Imtixaan ku saabsan daryeelka uurka ANC, calaamadaha halista dhalmada, iyo xirmada dhalmada.', 20, 80),
('quiz-wash-05', 'course-wash-05', 'Imtixaanka Qiimeynta: Nadaafadda Biyaha & Ka-hortagga Daacuunka', 'Imtixaan ku saabsan kalooriyeynta biyaha, isticmaalka Aquatabs, iyo xakameynta cudurrada faafa.', 20, 80);

-- 20.3 Training Questions & Answers
-- Quiz 1: EPI Cold Chain Questions
INSERT INTO `training_questions` (`id`, `quiz_id`, `question_text`, `question_type`, `points`, `order_index`) VALUES
('q-epi-01', 'quiz-epi-03', 'Waa maxay heerkulka saxda ah ee lagu keydiyo tallaallada silsiladda qabowga?', 'SINGLE_CHOICE', 25, 1),
('q-epi-02', 'quiz-epi-03', 'Goorma ayaa la tuurayaa dhalada tallaalka marka la eego kormeeraha VVM?', 'SINGLE_CHOICE', 25, 2),
('q-epi-03', 'quiz-epi-03', 'Maxaa looga baahan yahay in barafka la "condition" gareeyo ka hor inta aan tallaalka la gelin?', 'SINGLE_CHOICE', 25, 3),
('q-epi-04', 'quiz-epi-03', 'Waa kuma ilmaha loo yaqaanno "Zero-Dose"?', 'SINGLE_CHOICE', 25, 4);

INSERT INTO `training_answers` (`id`, `question_id`, `answer_text`, `is_correct`, `explanation`) VALUES
('ans-epi-01a', 'q-epi-01', '+2°C ilaa +8°C', 1, 'Heerkulka caadiga ah ee silsiladda qabowga WHO/UNICEF waa inta u dhaxeysa +2°C ilaa +8°C.'),
('ans-epi-01b', 'q-epi-01', '-10°C ilaa 0°C', 0, 'Heerkulkan wuxuu qaboojinayaa tallaalka taasoo xumeyn karta tallaallada dareenka u leh barafka.'),
('ans-epi-01c', 'q-epi-01', '+15°C ilaa +25°C', 0, 'Heerkulkan waa heerkul qol oo tallaalku wuu ku xumaanayaa.'),
('ans-epi-01d', 'q-epi-01', '0°C ilaa +1°C', 0, 'Heerkulka saxda ah ee la oggol yahay waa +2°C ilaa +8°C.'),
('ans-epi-02a', 'q-epi-02', 'Marka labajibbaaranka guduhu uu la mid noqdo ama ka madoobaado goobada bannaanka (Stage 3 & 4)', 1, 'Marka VVM uu gaaro Stage 3 ama 4, tallaalka kuleyl ayaa saameeyay oo waa in durbadiiba la tuuraa.'),
('ans-epi-02b', 'q-epi-02', 'Marka labajibbaaranka guduhu uu caddaan saafi ah yahay (Stage 1)', 0, 'Stage 1 wuxuu muujinayaa in tallaalku yahay mid aad u wanaagsan oo la isticmaali karo.'),
('ans-epi-02c', 'q-epi-02', 'Marka labajibbaaranka guduhu uu ka khafiifsan yahay goobada bannaanka (Stage 2)', 0, 'Stage 2 tallaalka waa la isticmaali karaa marka hore.'),
('ans-epi-02d', 'q-epi-02', 'Marna lama tuuro ilaa taariikhda dhicitaanku ka gaarto', 0, 'Haddii VVM xumaado, tallaalka lama isticmaali karo xitaa haddii taariikhdu uusan dhicin.'),
('ans-epi-03a', 'q-epi-03', 'Si looga hortago in tallaalku uu baraf fariisto (freezing) oo uu xumaado', 1, 'Barafka tooska ah ee qaboojiyaha ka yimaada wuxuu qaboojin karaa tallaalka, sidaas darteed waa in la sugaa inta uu qoyaan ka yeelanayo.'),
('ans-epi-03b', 'q-epi-03', 'Si sanduuqa miisaankiisu u fududaado', 0, 'Conditioning ujeeddadeedu waa badbaadinta tayada tallaalka heerkul ahaan.'),
('ans-epi-03c', 'q-epi-03', 'Si biyaha looga daadiyo barafka', 0, 'Barafka lama furo, kaliya dusha ayaa laga sugaa inta uu dhalaalayo.'),
('ans-epi-03d', 'q-epi-03', 'Wax macno ah ma sameyso conditioning-ku', 0, 'Conditioning waa tallaabo qasab ah oo muhiim u ah ilaalinta tallaalka.'),
('ans-epi-04a', 'q-epi-04', 'Ilmaha aan weligiis qaadan xitaa hal qiyaas oo tallaalka aasaasiga ah (sida Penta-1 ama bOPV)', 1, 'Zero-Dose waxaa loogu yeeraa ilmaha aan weligood helin wax tallaal ah noloshooda.'),
('ans-epi-04b', 'q-epi-04', 'Ilmaha dhammeystay dhammaan tallaallada', 0, 'Kaasi waa fully immunized child.'),
('ans-epi-04c', 'q-epi-04', 'Ilmaha qaatay tallaalka dhalashada kaliya', 0, 'Zero-dose waa ilmaha aan helin wax tallaal ah.'),
('ans-epi-04d', 'q-epi-04', 'Ilmaha ka weyn 5 sano', 0, 'Zero-dose waxay qeexaysaa xaaladda tallaal la''aanta ilmaha.');

-- Quiz 2: iCCM Protocol Questions
INSERT INTO `training_questions` (`id`, `quiz_id`, `question_text`, `question_type`, `points`, `order_index`) VALUES
('q-iccm-01', 'quiz-iccm-01', 'Maxaad sameyneysaa haddii ilmo yar lagu arko calaamadaha halista guud (sida gariir ama miyir-beel)?', 'SINGLE_CHOICE', 25, 1),
('q-iccm-02', 'quiz-iccm-01', 'Immisa maalmood ayaa la siinayaa kaniiniga Zinc ilmaha qaba shuban-biyoodka?', 'SINGLE_CHOICE', 25, 2),
('q-iccm-03', 'quiz-iccm-01', 'Immisa neef daqiiqaddii ayaa loo tixgeliyaa neef-degdeg (Fast Breathing) ilmaha jira 12 bilood ilaa 5 sano?', 'SINGLE_CHOICE', 25, 3),
('q-iccm-04', 'quiz-iccm-01', 'Haddii baaritaanka duumada RDT uu noqdo Positive, daawadee ayaa ilmaha la siinayaa?', 'SINGLE_CHOICE', 25, 4);

INSERT INTO `training_answers` (`id`, `question_id`, `answer_text`, `is_correct`, `explanation`) VALUES
('ans-iccm-01a', 'q-iccm-01', 'Durbadiiba u gudbi cisbitaalka ama xarunta MCH ee ku dhow', 1, 'Calaamadaha halista guud waxay u baahan yihiin daryeel caafimaad oo degdeg ah cisbitaalka.'),
('ans-iccm-01b', 'q-iccm-01', 'Guriga ku sii kaniini paracetamol ah oo sug 3 maalmood', 0, 'Ilmaha halista qaba waa in aan guriga lagu haynin.'),
('ans-iccm-01c', 'q-iccm-01', 'Sii cunto adag oo ha u oggolaan inuu seexdo', 0, 'Tani waxay sii xumeyn kartaa xaaladda ilmaha.'),
('ans-iccm-01d', 'q-iccm-01', 'Kaliya u sheeg waalidka inuu caadi yahay', 0, 'Gariirka iyo miyir-beelku waa xaalad degdeg ah.'),
('ans-iccm-02a', 'q-iccm-02', 'Muddo 10 ilaa 14 maalmood ah oo xiriir ah', 1, 'Zinc-ka waa in la siiyaa 10-14 maalmood oo buuxa xitaa haddii shubanku joogsado ka hor.'),
('ans-iccm-02b', 'q-iccm-02', 'Hal maalin kaliya', 0, 'Hal maalin kuma filna in mindhicirradu dib u soo kabtaan.'),
('ans-iccm-02c', 'q-iccm-02', '3 maalmood kaliya', 0, 'WHO protocol wuxuu farayaa 10-14 maalmood.'),
('ans-iccm-02d', 'q-iccm-02', 'Ilaa shubanku ka joogsado oo kaliya (1 maalin)', 0, 'Zinc-ku wuxuu ka hortagaa in shubanku dib ugu soo laabto ilmaha 2-3 bilood ee soo socda.'),
('ans-iccm-03a', 'q-iccm-03', '40 neef ama ka badan daqiiqaddii', 1, 'Carruurta 12 bilood ilaa 5 sano, 40+ neef daqiiqaddii waa neef-degdeg (Fast Breathing).'),
('ans-iccm-03b', 'q-iccm-03', '20 neef daqiiqaddii', 0, '20 neef waa heerka caadiga ah ee qofka weyn.'),
('ans-iccm-03c', 'q-iccm-03', '10 neef daqiiqaddii', 0, '10 neef waa neefsasho aad u hooseysa.'),
('ans-iccm-03d', 'q-iccm-03', '100 neef daqiiqaddii', 0, '100 waa xaalad aad u daran oo aan caadi ahayn.'),
('ans-iccm-04a', 'q-iccm-04', 'Coartem (Artemether-Lumefantrine)', 1, 'Coartem waa daawada koowaad ee loo doortay duumada Plasmodium falciparum ee Soomaaliya.'),
('ans-iccm-04b', 'q-iccm-04', 'Amoxicillin', 0, 'Amoxicillin waa antibiotic loo isticmaalo oof-wareenka ma aha daawada duumada.'),
('ans-iccm-04c', 'q-iccm-04', 'Paracetamol kaliya', 0, 'Paracetamol-ku qandhada ayuu dejiyaa laakiin ma dilo dulinka duumada.'),
('ans-iccm-04d', 'q-iccm-04', 'ORS', 0, 'ORS waa daaweynta fuuqbaxa shubanka.');

-- Quiz 3: MUAC Nutrition Questions
INSERT INTO `training_questions` (`id`, `quiz_id`, `question_text`, `question_type`, `points`, `order_index`) VALUES
('q-muac-01', 'quiz-muac-02', 'Cabirka MUAC ee ka yar 115mm (< 11.5cm) wuxuu muujinayaa maxay?', 'SINGLE_CHOICE', 25, 1),
('q-muac-02', 'quiz-muac-02', 'Gacantee ayaa sida caadiga ah loo isticmaalaa marka ilmaha laga cabbirayo MUAC?', 'SINGLE_CHOICE', 25, 2),
('q-muac-03', 'quiz-muac-02', 'Haddii ilmo uu leeyahay Biyo-barar labada lugood ah (Bilateral Edema), heerkee ayuu ku jiraa?', 'SINGLE_CHOICE', 25, 3),
('q-muac-04', 'quiz-muac-02', 'Waa maxay ujeeddada daawada PlumpyNut (RUTF)?', 'SINGLE_CHOICE', 25, 4);

INSERT INTO `training_answers` (`id`, `question_id`, `answer_text`, `is_correct`, `explanation`) VALUES
('ans-muac-01a', 'q-muac-01', 'Nafaqo-darro Daran (Severe Acute Malnutrition - SAM / Casan)', 1, 'MUAC < 115mm waa calaamadda cas ee nafaqo-xumada daran ee degdegga ah.'),
('ans-muac-01b', 'q-muac-01', 'Nafaqo-darro Dhexdhexaad ah (MAM / Jaalle)', 0, 'MAM waa 115mm ilaa 124mm.'),
('ans-muac-01c', 'q-muac-01', 'Xaalad Caafimaad oo Caadi ah (Cagaar)', 0, 'Xaaladda caadiga ah waa > 125mm.'),
('ans-muac-01d', 'q-muac-01', 'Ilmo cayilan', 0, '< 115mm waa dhuubnaan iyo nafaqo-darro halis ah.'),
('ans-muac-02a', 'q-muac-02', 'Cududda Bidix ee Ilmaha', 1, 'Habka caalamiga ah ee WHO/UNICEF wuxuu dhigayaa in mar walba la isticmaalo cududda bidix.'),
('ans-muac-02b', 'q-muac-02', 'Cududda Midig', 0, 'Bidixda ayaa ah heerka cabbirka caadiga ah.'),
('ans-muac-02c', 'q-muac-02', 'Lugta midig', 0, 'MUAC waxaa lagu cabbiraa cududda dhexdeeda.'),
('ans-muac-02d', 'q-muac-02', 'Koonka gacanta', 0, 'MUAC waa Mid-Upper Arm Circumference.'),
('ans-muac-03a', 'q-muac-03', 'SAM (Nafaqo-darro Daran) - xitaa haddii cabirka MUAC uu cagaar yahay', 1, 'Bilateral Edema waa calaamad toos ah oo muujinaysa SAM (Kwashiorkor).'),
('ans-muac-03b', 'q-muac-03', 'MAM (Nafaqo-darro Dhexdhexaad ah)', 0, 'Edema kama tirsana MAM, waa SAM toos ah.'),
('ans-muac-03c', 'q-muac-03', 'Xaalad caadi ah', 0, 'Bararka caguhu waa xaalad caafimaad darro oo halis ah.'),
('ans-muac-03d', 'q-muac-03', 'Cudurka kelyaha oo kaliya', 0, 'Carruurta nafaqo-daran bararku wuxuu muujinayaa Kwashiorkor.'),
('ans-muac-04a', 'q-muac-04', 'Daaweynta iyo dib-u-soo-kabashada carruurta qaba Nafaqo-darrada Daran (SAM)', 1, 'PlumpyNut waa RUTF si gaar ah loogu habeeyay daaweynta SAM.'),
('ans-muac-04b', 'q-muac-04', 'Cunto quraac oo qoyska oo dhami wada cuno', 0, 'PlumpyNut waa daawo loogu talagalay ilmaha nafaqo-daran oo kaliya.'),
('ans-muac-04c', 'q-muac-04', 'Daawada qandhada', 0, 'PlumpyNut waa therapeutic paste qani ku ah fiitamiinno iyo borotiin.'),
('ans-muac-04d', 'q-muac-04', 'Caanaha carruurta dhasha', 0, 'PlumpyNut waxaa la siiyaa carruurta 6 bilood ka weyn ee SAM qaba.');

-- Quiz 4: Maternal Health Questions
INSERT INTO `training_questions` (`id`, `quiz_id`, `question_text`, `question_type`, `points`, `order_index`) VALUES
('q-mch-01', 'quiz-mch-04', 'Immisa jeer ugu yaraan ayay tahay in hooyada uurka leh ay booqato xarunta ANC?', 'SINGLE_CHOICE', 25, 1),
('q-mch-02', 'quiz-mch-04', 'Waa maxay daawada xuddunta la mariyo ilmaha dhashay si looga hortago caabuqa?', 'SINGLE_CHOICE', 25, 2),
('q-mch-03', 'quiz-mch-04', 'Maxay tahay sababta caanaha ugu horreeya ee naaska (Dambar/Colostrum) muhiimka u yihiin?', 'SINGLE_CHOICE', 25, 3),
('q-mch-04', 'quiz-mch-04', 'Midkee ka mid ah kuwan ayaa ah calaamad halis ah oo u baahan in hooyada uurka leh degdeg cisbitaal loo geeyo?', 'SINGLE_CHOICE', 25, 4);

INSERT INTO `training_answers` (`id`, `question_id`, `answer_text`, `is_correct`, `explanation`) VALUES
('ans-mch-01a', 'q-mch-01', 'Ugu yaraan 4 booqasho oo ANC ah', 1, '4 booqasho oo ANC ah ayaa ah heerka aasaasiga ah ee daryeelka uurka.'),
('ans-mch-01b', 'q-mch-01', 'Hal mar marka ay dhalayso oo kaliya', 0, 'Booqashooyinka hore waxay furaan baaritaanka dhiig-karka iyo xaaladaha halista ah.'),
('ans-mch-01c', 'q-mch-01', 'Marna looma baahna', 0, 'ANC waxay badbaadisaa nolosha hooyada iyo ilmaha.'),
('ans-mch-01d', 'q-mch-01', '10 booqasho bishii', 0, '4 booqasho oo xilliyo kala duwan ah ayaa ugu yaraan qasab ah.'),
('ans-mch-02a', 'q-mch-02', 'Chlorhexidine Digluconate 7.1% (CHX Gel)', 1, 'CHX Gel wuxuu ka hortagaa caabuqa xuddunta ilmaha dhashay (neonatal sepsis).'),
('ans-mch-02b', 'q-mch-02', 'Dambas ama carro', 0, 'Dambaska iyo carrada waxay keenaan teetano halis ah (tetanus).'),
('ans-mch-02c', 'q-mch-02', 'Subag ama saliid macsar', 0, 'Walxaha dabiiciga ah ee aan nadiifka ahayn waxay kicin karaan caabuq.'),
('ans-mch-02d', 'q-mch-02', 'Biyo kulul', 0, 'Chlorhexidine gel ayaa ah heerka caalamiga ah ee daryeelka xuddunta.'),
('ans-mch-03a', 'q-mch-03', 'Waxay hodan ku yihiin unugyada difaaca jirka (Antibodies) oo ilmaha ka ilaaliya xanuunnada', 1, 'Dambarku waa tallaalka ugu horreeya ee dabiiciga ah ee ilmaha.'),
('ans-mch-03b', 'q-mch-03', 'Waa caano xun oo waa in la daadiyaa', 0, 'Aaminsanaanta in dambarka la daadiyo waa qalad khatar ah; waa caanaha ugu qiimaha badan.'),
('ans-mch-03c', 'q-mch-03', 'Wax nafaqo ah ma laha', 0, 'Dambarku wuxuu leeyahay nafaqo iyo difaac aad u sarreeya.'),
('ans-mch-03d', 'q-mch-03', 'Kaliya waxay baabi''iyaan harraadka', 0, 'Dambarku wuxuu dhisaa difaaca caloosha iyo mindhicirrada ilmaha.'),
('ans-mch-04a', 'q-mch-04', 'Dhiig-bax xubinta taranka ah ama madax-xanuun daran iyo indhaha oo caadaqda', 1, 'Dhiig-baxa iyo madax-xanuunka daran waa calaamado halis ah (Preeclampsia / Hemorrhage).'),
('ans-mch-04b', 'q-mch-04', 'Ilmaha oo caloosha ka haraatiyaya', 0, 'Haraatida ilmaha waa calaamad muujinaysa in ilmuhu nool yahay oo firfircoon yahay.'),
('ans-mch-04c', 'q-mch-04', 'Hurdo badan oo caadi ah', 0, 'Hurdada xilliga uurka waa caadi.'),
('ans-mch-04d', 'q-mch-04', 'Cunto doonis kordhay', 0, 'Cunto doonistu waa wax caadi ah.');

-- Quiz 5: WASH & Outbreak Questions
INSERT INTO `training_questions` (`id`, `quiz_id`, `question_text`, `question_type`, `points`, `order_index`) VALUES
('q-wash-01', 'quiz-wash-05', 'Immisa daqiiqo ayaa loo baahan yahay in la sugo marka kaniiniga Aquatabs lagu daro biyaha ka hor inta aan la cabin?', 'SINGLE_CHOICE', 25, 1),
('q-wash-02', 'quiz-wash-05', 'Immisa litir oo biyo ah ayaa lagu daweeyaa 1 kaniini oo Aquatabs 67mg ah?', 'SINGLE_CHOICE', 25, 2),
('q-wash-03', 'quiz-wash-05', 'Immisa ilbiriqsi ugu yaraan ayaa lagu talinayaa in gacmaha lagu dhaqo saabuun iyo biyo socda?', 'SINGLE_CHOICE', 25, 3),
('q-wash-04', 'quiz-wash-05', 'Waa maxay tallaabada koowaad ee lagu joojinayo faafitaanka daacuunka ee xaafadda?', 'SINGLE_CHOICE', 25, 4);

INSERT INTO `training_answers` (`id`, `question_id`, `answer_text`, `is_correct`, `explanation`) VALUES
('ans-wash-01a', 'q-wash-01', '30 daqiiqo', 1, 'Chlorine-ku wuxuu u baahan yahay 30 daqiiqo si uu u dilo bakteeriyada iyo fayrasyada biyaha ku jira.'),
('ans-wash-01b', 'q-wash-01', '1 ilbiriqsi oo kaliya', 0, 'Jeermisku durbadiiba ma dhinto, wuxuu u baahan yahay wakhti uu kula falgalo biyaha.'),
('ans-wash-01c', 'q-wash-01', '24 saacadood', 0, '30 daqiiqo ka dib biyuhu waa diyaar.'),
('ans-wash-01d', 'q-wash-01', 'Uma baahna wax sugid ah', 0, 'Sugitaanka 30 daqiiqo waa muhiim si loo hubiyo badbaadada.'),
('ans-wash-02a', 'q-wash-02', '20 Litir oo biyo ah (1 Jirkaan)', 1, 'Aquatabs 67mg waxaa loogu talagalay jirkaanka caadiga ah ee 20-ka litir.'),
('ans-wash-02b', 'q-wash-02', '1 Litir kaliya', 0, '1 Litir waxay keeneysaa in chlorine-ku aad u bato oo biyuhu qadhaadhaadaan.'),
('ans-wash-02c', 'q-wash-02', '200 Litir', 0, '200 Litir hal kaniini kuma filna inuu jeermiska dilo.'),
('ans-wash-02d', 'q-wash-02', '5 Litir', 0, 'Heerka saxda ah waa 20 Litir.'),
('ans-wash-03a', 'q-wash-03', 'Ugu yaraan 20 ilbiriqsi', 1, '20 ilbiriqsi oo saabuun iyo biyo lagu xoqo gacmaha waxay dilaan 99% jeermiska.'),
('ans-wash-03b', 'q-wash-03', '2 ilbiriqsi', 0, '2 ilbiriqsi kuma filna in jeermisku ka go''o faraha iyo cidiyaha.'),
('ans-wash-03c', 'q-wash-03', '10 daqiiqo', 0, '20 ilbiriqsi ayaa ah heerka caafimaad ee lagula taliyay.'),
('ans-wash-03d', 'q-wash-03', 'Uma baahna saabuun', 0, 'Saabuuntu waa aasaaska nadaafadda gacmaha.'),
('ans-wash-04a', 'q-wash-04', 'Kalooriyeynta ilaha biyaha, diyaarinta ORS, iyo wacyigelinta dhaqista gacmaha', 1, 'Isku-darka biyaha nadiifka ah, ORS, iyo nadaafaddu waxay si degdeg ah u xakameeyaan daacuunka.'),
('ans-wash-04b', 'q-wash-04', 'In dadka xaafadda oo dhami laga raro goobta', 0, 'Xakameynta goobta ayaa ah habka saxda ah ee caafimaadka bulshada.'),
('ans-wash-04c', 'q-wash-04', 'In la xiro dhammaan xarumaha caafimaadka', 0, 'Xarumaha caafimaadka waa in la xoojiyo.'),
('ans-wash-04d', 'q-wash-04', 'In la sugo inta daacuunku iskiis u joogsanayo', 0, 'Ka-jawaabista degdegga ah waxay badbaadisaa nolosha boqolaal carruur iyo dad waaweyn ah.');

-- 21. System Notifications
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `action_url`, `is_read`) VALUES
('notif-01', 'usr-superadmin-01', 'Hawl Cusub: Tallaalka Polio ee Taleex', 'Waxaa laguu xilsaaray inaad tallaalka bOPV ka fuliso Taleex Zone A.', 'TASK_ASSIGNED', '/admin/dashboard', 0),
('notif-02', 'usr-superadmin-01', 'Digniin Degdeg ah: Beledweyne AWD Outbreak', 'CHV Hassan Omar wuxuu soo gudbiyey 14 kiis oo looga shakisan yahay AWD Koshin Village.', 'EMERGENCY_ALERT', '/admin/emergencies', 0),
('notif-03', 'usr-superadmin-01', 'Dalab Sahay: 50 Vials bOPV Taleex', 'CHV Aamina Xasan waxay soo codsatay 50 vials oo tallaal ah.', 'LOW_INVENTORY', '/admin/supply-requests', 0);

-- 22. System Settings
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `category`, `description`, `is_public`) VALUES
('platform_name', 'CaafimaadHub', 'GENERAL', 'Public Health Volunteer Coordination System Name', 1),
('platform_subtitle', 'Community Health Volunteer Coordination & Field Operations Platform', 'GENERAL', 'Platform subtitle', 1),
('default_language', 'so', 'LOCALIZATION', 'Default platform language (so / en)', 1),
('supported_languages', '["so", "en"]', 'LOCALIZATION', 'JSON list of supported languages', 1),
('default_timezone', 'Africa/Mogadishu', 'LOCALIZATION', 'Platform standard timezone', 1),
('sms_provider', 'MOCK_GATEWAY', 'SMS', 'Active SMS delivery gateway provider', 0),
('emergency_hotline', '+252 61 9990000', 'GENERAL', '24/7 Public Health Emergency Hotline', 1),
('enable_offline_sync', 'true', 'PWA', 'Enable IndexedDB background field data synchronization', 1);
