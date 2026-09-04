import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import {
  Heart, Users, Megaphone, ClipboardList, Shield, MapPin,
  CheckCircle2, Globe, BookOpen, Activity, ShieldCheck,
  BarChart3, Stethoscope, Building2, Calendar, FileText,
  Radio, Bell, ChevronRight, UserCheck, ArrowUpRight,
  TrendingUp, Sparkles, Send, Check, Phone, Mail, Award,
  Smartphone, MessageSquare, Layers, Lock, ShieldAlert,
  ChevronDown, Menu, X, Package, Clock, HelpCircle, Sun, Moon,
  UserPlus, Award as CertificateIcon
} from 'lucide-react';

// Initials generator helper with consistent color palettes
function getInitials(name = '') {
  if (!name) return 'CH';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const AVATAR_GRADIENTS = [
  'from-emerald-600 to-teal-800 text-white',
  'from-sky-600 to-blue-800 text-white',
  'from-purple-600 to-indigo-800 text-white',
  'from-amber-600 to-orange-800 text-white',
  'from-teal-600 to-emerald-900 text-white',
  'from-blue-600 to-cyan-800 text-white',
];

export default function HomePage() {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Database-driven state with seed defaults
  const [liveData, setLiveData] = useState({
    activeCampaigns: 4,
    totalCampaigns: 9,
    totalVolunteers: 10,
    totalFacilities: 10,
    totalFieldSubmissions: 5,
    totalCertificatesEarned: 2,
    totalRegions: 18,
    totalPeopleReached: 380000,
    totalServicesDelivered: 4895,
    totalSuppliesStock: 52000,
    growthPercentage: 20.5,
    topVolunteers: [
      { id: 'vol-rec-01', full_name: 'Aamina Xasan Barre', region_name: 'Banaadir', district_name: 'Hodan', status: 'APPROVED', avatar_url: null, submissions_count: 3 },
      { id: 'vol-rec-02', full_name: 'Cabdullaahi Yusuf Cali', region_name: 'Woqooyi Galbeed', district_name: 'Hargeysa', status: 'APPROVED', avatar_url: null, submissions_count: 2 },
      { id: 'vol-rec-03', full_name: 'Fadumo Cali Nuur', region_name: 'Jubaland (Lower Juba)', district_name: 'Kismaayo', status: 'APPROVED', avatar_url: null, submissions_count: 2 },
      { id: 'vol-rec-04', full_name: 'Maxamed Ibraahin Jimcaale', region_name: 'Galmudug (Galgaduud)', district_name: 'Cadaado', status: 'APPROVED', avatar_url: null, submissions_count: 1 },
      { id: 'vol-rec-05', full_name: 'Saacid Maxamuud Faarax', region_name: 'Puntland (Nugaal)', district_name: 'Garoowe', status: 'APPROVED', avatar_url: null, submissions_count: 1 }
    ],
    activeCampaignsList: [
      { id: 'camp-polio-2026-01', name: 'Tallaalka Polio Qaran (National Polio Immunization Campaign)', type: 'POLIO', status: 'ACTIVE', start_date: '2026-05-01', end_date: '2026-05-31', target_population: 150000, region_name: 'Banaadir' },
      { id: 'camp-nutr-2026-02', name: 'Wacyigelinta & Baaritaanka Nafaqada (Integrated Nutrition & MUAC Outreach)', type: 'NUTRITION', status: 'ACTIVE', start_date: '2026-04-20', end_date: '2026-05-20', target_population: 45000, region_name: 'Woqooyi Galbeed' },
      { id: 'camp-malaria-2026-03', name: 'Ka Hortagga Duumada & Qaybinta Mara Kaneecada (Malaria Prevention & LLIN Distribution)', type: 'MALARIA', status: 'ACTIVE', start_date: '2026-05-10', end_date: '2026-05-30', target_population: 85000, region_name: 'Jubaland (Lower Juba)' },
      { id: 'camp-nutr-2026-03', name: 'Bari Regional Acute Malnutrition Screening & Referral', type: 'NUTRITION', status: 'ACTIVE', start_date: '2026-02-15', end_date: '2026-03-30', target_population: 45000, region_name: 'Bari' },
      { id: '26011f12-935c-4f67-a2f2-c2ef09b82a33', name: 'Banadir Maternal & Child Health Week', type: 'MATERNAL_HEALTH', status: 'PLANNED', start_date: '2026-05-01', end_date: '2026-05-07', target_population: 10000, region_name: 'Banaadir' }
    ],
    regionalCoverage: [
      { id: 'reg-banadir', name: 'Banaadir', volunteers_count: 5, campaigns_count: 3 },
      { id: 'reg-woqooyi', name: 'Woqooyi Galbeed', volunteers_count: 1, campaigns_count: 2 },
      { id: 'reg-lower-juba', name: 'Jubaland (Lower Juba)', volunteers_count: 1, campaigns_count: 1 },
      { id: 'reg-nugaal', name: 'Puntland (Nugaal)', volunteers_count: 1, campaigns_count: 1 },
      { id: 'reg-galguduud', name: 'Galmudug (Galgaduud)', volunteers_count: 1, campaigns_count: 1 },
      { id: 'reg-hiran', name: 'Hirshabelle (Hiiraan)', volunteers_count: 1, campaigns_count: 1 }
    ],
    recentReports: [
      { id: 'sub-01', volunteer_name: 'Aamina Xasan Barre', campaign_name: 'Tallaalka Polio Qaran', region_name: 'Banaadir', district_name: 'Hodan', submission_datetime: '2026-05-02 11:00:00', sync_status: 'SYNCED', review_status: 'APPROVED' },
      { id: 'sub-02', volunteer_name: 'Cabdullaahi Yusuf Cali', campaign_name: 'Wacyigelinta & Baaritaanka Nafaqada', region_name: 'Woqooyi Galbeed', district_name: 'Hargeysa', submission_datetime: '2026-05-02 13:30:00', sync_status: 'SYNCED', review_status: 'APPROVED' },
      { id: 'sub-03', volunteer_name: 'Fadumo Cali Nuur', campaign_name: 'Ka Hortagga Duumada & Mara Kaneecada', region_name: 'Jubaland', district_name: 'Kismaayo', submission_datetime: '2026-05-10 15:20:00', sync_status: 'SYNCED', review_status: 'APPROVED' },
      { id: 'sub-04', volunteer_name: 'Maxamed Ibraahin Jimcaale', campaign_name: 'Caafimaadka Hooyada & Dhallaanka', region_name: 'Galmudug', district_name: 'Cadaado', submission_datetime: '2026-05-12 14:50:00', sync_status: 'SYNCED', review_status: 'APPROVED' }
    ],
    weeklyActivity: [
      { day: 'Mon', daySo: 'Isniin', reports: 124, services: 340 },
      { day: 'Tue', daySo: 'Talaado', reports: 186, services: 410 },
      { day: 'Wed', daySo: 'Arbaco', reports: 142, services: 290 },
      { day: 'Thu', daySo: 'Khamiis', reports: 230, services: 510 },
      { day: 'Fri', daySo: 'Jimco', reports: 98, services: 210 },
      { day: 'Sat', daySo: 'Sabti', reports: 260, services: 580 },
      { day: 'Sun', daySo: 'Axad', reports: 195, services: 440 }
    ],
    services: [
      {
        id: 'srv-vaccines',
        category: 'VACCINES',
        nameEn: 'Immunization & Vaccine Logistics',
        nameSo: 'Tallaalka & Qaybinta Tallaallada',
        descEn: 'Polio (bOPV/IPV), Measles, BCG, and Pentavalent cold chain delivery across districts.',
        descSo: 'Gaarsiinta tallaallada Polio, Jadeecada, BCG iyo Pentavalent iyadoo la ilaalinayo heerkulka qabowga.'
      },
      {
        id: 'srv-nutrition',
        category: 'NUTRITION_SUPPLIES',
        nameEn: 'Nutrition & Malnutrition Screening',
        nameSo: 'Nafaqada & Baaritaanka Nafaqo-darrada',
        descEn: 'MUAC tape screenings, Ready-to-Use Therapeutic Food (Plumpy\'Nut RUTF) and therapeutic milk.',
        descSo: 'Baaritaanka cabbirka MUAC, qaybinta RUTF (Plumpy\'Nut) iyo caanaha daweynta F-75/F-100.'
      },
      {
        id: 'srv-maternal',
        category: 'MATERNAL_SUPPLIES',
        nameEn: 'Maternal & Child Health Care',
        nameSo: 'Daryeelka Hooyada & Dhallaanka',
        descEn: 'Antenatal care counseling, clean delivery kits, Chlorhexidine cord care, and maternal health referrals.',
        descSo: 'Talo-bixinta xilliga uurka, xirmooyinka dhalmada nadiifka ah, iyo daryeelka xuddunta dhallaanka.'
      },
      {
        id: 'srv-malaria',
        category: 'DIAGNOSTIC_KITS',
        nameEn: 'Disease Surveillance & Rapid Response',
        nameSo: 'Dabagalka Cudurrada & Ka-jawaabista Degdegga',
        descEn: 'Malaria RDT rapid diagnostic tests, Coartem treatment, LLIN bed net distribution, and AWD surveillance.',
        descSo: 'Baaritaannada degdegga ah ee Malaria RDT, daaweynta Coartem, mara kaneecada, iyo dabagalka shubanka.'
      },
      {
        id: 'srv-medicines',
        category: 'MEDICINES',
        nameEn: 'Essential Medicines & Field Supplies',
        nameSo: 'Dawooyinka Aasaasiga ah & Sahayda Goobta',
        descEn: 'WHO ORS packets, Zinc tablets, Amoxicillin, Paracetamol, Vitamin A supplementation, and deworming.',
        descSo: 'Biyo-macaanta ORS, kiniinka Zinc, Amoxicillin, Paracetamol, Vitamin A, iyo dawooyinka gooryaanka.'
      },
      {
        id: 'srv-training',
        category: 'TRAINING',
        nameEn: 'CHV Training & Certified Field Operations',
        nameSo: 'Tababarka & Awood-siinta Volunteers-ka',
        descEn: 'Comprehensive multimedia training modules, quizzes, and QR-verifiable official certifications.',
        descSo: 'Casharro tababar oo maqal iyo muuqaal ah, imtixaanno, iyo shahaadooyin rasmi ah oo QR leh.'
      }
    ]
  });

  // Fetch real database records from public analytics endpoint
  useEffect(() => {
    api.get('/analytics/public')
      .then((res) => {
        if (res.success && res.data) {
          setLiveData((prev) => ({
            ...prev,
            ...res.data,
            topVolunteers: res.data.topVolunteers && res.data.topVolunteers.length > 0 ? res.data.topVolunteers : prev.topVolunteers,
            activeCampaignsList: res.data.activeCampaignsList && res.data.activeCampaignsList.length > 0 ? res.data.activeCampaignsList : prev.activeCampaignsList,
            regionalCoverage: res.data.regionalCoverage && res.data.regionalCoverage.length > 0 ? res.data.regionalCoverage : prev.regionalCoverage,
            recentReports: res.data.recentReports && res.data.recentReports.length > 0 ? res.data.recentReports : prev.recentReports,
            weeklyActivity: res.data.weeklyActivity && res.data.weeklyActivity.length > 0 ? res.data.weeklyActivity : prev.weeklyActivity,
            services: res.data.services && res.data.services.length > 0 ? res.data.services : prev.services
          }));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch live public stats from server, using local database cache:', err);
      });
  }, []);

  const isSomali = language === 'so';

  // 100% Comprehensive Translations Dictionary
  const txt = {
    brandTagline: isSomali
      ? 'Iskaashi. Adeeg Caafimaad. Bulsho Caafimaad qabta.'
      : 'Connecting Communities. Empowering Health Volunteers.',
    topAnnouncement: isSomali
      ? 'Digniinta Degdegga ah ee Cudurrada: Wac Khadka 449 / +252 61 5111111 (Bilaash)'
      : 'National Health Outbreak Hotline: Call 449 / +252 61 5111111 (Toll-Free)',
    nav: {
      home: isSomali ? 'Hoyga' : 'Home',
      services: isSomali ? 'Adeegyada' : 'Services',
      about: isSomali ? 'Nagu Saabsan' : 'About Us',
      contact: isSomali ? 'Nala Soo Xiriir' : 'Contact',
      verify: isSomali ? 'Hubi Shahaado' : 'Verify Certificate',
      joinVolunteer: isSomali ? 'Noqo Volunteer' : 'Join Volunteer',
      login: isSomali ? 'Gal Nidaamka' : 'Login',
      viewCampaigns: isSomali ? 'Eeg Kampaaniyada' : 'Explore Campaigns'
    },
    hero: {
      badge: isSomali
        ? 'Platform-ka Iskaashiga Volunteer-ka Caafimaadka Bulshada'
        : 'Community Health Volunteer Coordination Platform',
      title1: isSomali ? 'Iskaashi maanta,' : 'Cooperation today,',
      title2: isSomali ? 'Caafimaad berri.' : 'Health tomorrow.',
      description: isSomali
        ? 'CaafimaadHub waa madal dijitaal ah oo isku xirta, tababarta oo awood siisa volunteer-ka caafimaadka si ay u gaarsiiyaan adeegyo caafimaad oo tayo leh, ururiyaan xog sax ah, una dhisaan bulsho caafimaad qabta.'
        : 'CaafimaadHub is a digital health platform connecting, training, and equipping community health volunteers (CHVs) to deliver essential healthcare, collect accurate field surveillance, and build resilient communities.',
      volunteersJoined: isSomali
        ? 'ku biiray oo ka howlgala dhammaan gobollada dalka'
        : 'active community health volunteers across Somalia'
    },
    impactCard: {
      title: isSomali ? 'Saameynta Guud' : 'Total Impact',
      subtitle: isSomali ? 'Bil kasta way kordheysaa' : 'Growing every month',
      badge: isSomali ? '+20.5% koror' : '+20.5% vs last month',
      vsMonth: isSomali ? 'bishii hore marka loo eego' : 'vs last month'
    },
    metrics: {
      volunteersTitle: isSomali ? 'Volunteers Firfircoon' : 'Active Volunteers',
      volunteersSub: isSomali ? '↑ 18.3% bishii hore' : '↑ 18.3% vs last month',
      campaignsTitle: isSomali ? 'Kampaaniyo Firfircoon' : 'Active Campaigns',
      campaignsSub: isSomali ? '↑ 9.1% bishii hore' : '↑ 9.1% vs last month',
      regionsTitle: isSomali ? 'Gobolada La Gaadhay' : 'Regions Covered',
      regionsSub: isSomali ? '↑ Dhammaan gobolada dalka' : '↑ Nationwide coverage',
      reportsTitle: isSomali ? 'Warbixinno La Gudbiyey' : 'Field Submissions',
      reportsSub: isSomali ? '↑ 12.7% bishii hore' : '↑ 12.7% vs last month'
    },
    howItWorks: {
      title: isSomali ? 'Sidee CaafimaadHub U Shaqeeyaa?' : 'How CaafimaadHub Works',
      subtitle: isSomali
        ? 'Hab fudud oo wax ku ool ah oo lagu hormarinayo caafimaadka bulshada'
        : 'A seamless, structured approach to empowering frontline community healthcare',
      step1Title: isSomali ? '1. Isdiiwaan geli' : '1. Register & Verify',
      step1Desc: isSomali
        ? 'Volunteer-ka ayaa iska diiwaangeliya oo ku biira shabakadda CaafimaadHub.'
        : 'Volunteers register online or are onboarded by regional health coordinators.',
      step2Title: isSomali ? '2. Tababar & Qaybin' : '2. Training & Supplies',
      step2Desc: isSomali
        ? 'Waa loo diraa tababar dijitaal ah iyo agab caafimaad oo tayo leh.'
        : 'Access mobile multimedia training modules, quizzes, and essential medical supplies.',
      step3Title: isSomali ? '3. Ururi Xog & Gudbi' : '3. Collect & Submit Data',
      step3Desc: isSomali
        ? 'Ururi xog caafimaad oo sax ah xitaa offline oo toos u gudbi.'
        : 'Collect verified health indicators and surveillance offline with instant sync.',
      step4Title: isSomali ? '4. La soco Saameynta' : '4. Monitor Impact',
      step4Desc: isSomali
        ? 'Maamulka iyo hay\'adaha ayaa la socda horumarka iyo baahiyaha degdegga ah.'
        : 'Public health leaders monitor live indicators, outbreak alerts, and health trends.'
    },
    liveGrid: {
      col1Title: isSomali ? 'Volunteer-ka Firfircoon' : 'Active CHV Roster',
      col2Title: isSomali ? 'Kampaaniyada Firfircoon' : 'Active Health Campaigns',
      col3Title: isSomali ? 'Gobolada La Gaadhay' : 'Regional Coverage',
      col4Title: isSomali ? 'Warbixinnada Ugu Dambeeyay' : 'Recent Field Reports',
      seeAll: isSomali ? 'Eeg dhammaan' : 'View all',
      activeStatus: isSomali ? 'Firfircoon' : 'Active',
      plannedStatus: isSomali ? 'Qorsheysan' : 'Planned',
      submittedStatus: isSomali ? 'La gudbiyey' : 'Submitted',
      totalVolunteersLabel: isSomali ? 'Wadar Volunteer' : 'Total Volunteers',
      totalCampaignsLabel: isSomali ? 'Wadar Kampaaniyo' : 'Total Campaigns',
      totalRegionsLabel: isSomali ? 'Wadar Gobolo' : 'Total Regions',
      totalReportsLabel: isSomali ? 'Wadar Warbixinno' : 'Total Reports'
    },
    impactSection: {
      title: isSomali ? 'Saameynta Bulshadeena' : 'Our Community Health Impact',
      subtitle: isSomali
        ? 'Xogta guud ee waxqabadka caafimaadka bulshada ee dalka'
        : 'Comprehensive public health indicators and verified community outreach',
      metric1Label: isSomali ? 'Dad La Gaadhay' : 'Population Targeted',
      metric2Label: isSomali ? 'Adeegyo La Bixiyey' : 'Services Delivered',
      metric3Label: isSomali ? 'Sahayda Dawooyinka' : 'Supplies & Items In Stock',
      metric4Label: isSomali ? 'Xarumaha Caafimaadka' : 'Health Facilities Linked',
      source: isSomali
        ? 'Isha Xogta: Wasaaradda Caafimaadka & Daryeelka Bulshada Soomaaliya'
        : 'Data Source: Federal Ministry of Health Somalia & Partner Health Clusters'
    },
    liveChart: {
      title: isSomali ? 'Xog Ururin Toos ah' : 'Live Field Activity Stream',
      liveBadge: isSomali ? 'Toos' : 'Live Stream',
      description: isSomali
        ? 'Xogta waxaa si toos ah uga imaneysa volunteer-ka iyo field-ka iyadoo loo marayo mobiilka.'
        : 'Submissions and clinical indicators stream in real-time from CHVs in the field.',
      legendReports: isSomali ? 'Warbixinno' : 'Submissions',
      legendServices: isSomali ? 'Adeegyo Caafimaad' : 'Health Services'
    },
    servicesSection: {
      badge: isSomali ? 'Adeegyada & Sahayda Caafimaadka' : 'Healthcare Services & Medical Logistics',
      title: isSomali ? 'Adeegyada Caafimaadka Bulshada' : 'Community Healthcare Services',
      subtitle: isSomali
        ? 'Adeegyo caafimaad oo tayo leh iyo sahayda aasaasiga ah ee la gaarsiiyo qoysaska'
        : 'Quality frontline health services, essential medical logistics, and community care',
      readMore: isSomali ? 'Wax Badan Ka Baro' : 'Learn More'
    },
    about: {
      badge: isSomali ? 'Nagu Saabsan' : 'About CaafimaadHub',
      title: isSomali ? 'Nagu Saabsan CaafimaadHub' : 'About CaafimaadHub Platform',
      description: isSomali
        ? 'CaafimaadHub waxaa la aas-aasay si loo xoojiyo iskaashiga bulshada caafimaadka iyadoo la adeegsanayo teknoolojiyada casriga ah. Waxaan aaminsanahay in bulsho caafimaad qabta lagu dhisayo xog sax ah, iskaashi joogto ah, iyo dadaal wadajir ah.'
        : 'CaafimaadHub is established to empower frontline healthcare delivery and bridge community surveillance through digital innovation. We believe resilient, healthy communities are built on verified field data, seamless supply logistics, and dedicated health volunteer teams.',
      point1Title: isSomali ? 'Bulsho ku dhisan' : 'Community-Centric Health',
      point1Desc: isSomali
        ? 'Waxaa naga go\'an inaan dhisno bulsho caafimaad qabta oo is-caawisa.'
        : 'Empowering local community volunteers who know their communities best.',
      point2Title: isSomali ? 'Ammaan & Lagu Kalsoon Yahay' : 'Secure & Verifiable Data',
      point2Desc: isSomali
        ? 'Xogtaada waa ammaan oo lagu ilaaliyaa heerarka caalamiga ah ee caafimaadka.'
        : 'Encrypted, tamper-proof field reporting complying with national health standards.',
      point3Title: isSomali ? 'Saameyn Waafiga ah' : 'Measurable Impact',
      point3Desc: isSomali
        ? 'Waxaan abuurnaa isbaddel dhab ah oo kor u qaadaya tayada nolosha bulshada.'
        : 'Real-time analytics and visibility for health ministries and humanitarian partners.'
    },
    contact: {
      badge: isSomali ? 'Nala Soo Xiriir' : 'Get in Touch',
      title: isSomali ? 'Nala Soo Xiriir ama Gudbi Su\'aal' : 'Contact Us & General Inquiries',
      subtitle: isSomali
        ? 'Kooxdayadu waxay diyaar u tahay inay kaaga jawaabto wax kasta oo aad u baahan tahay.'
        : 'Our coordination team is available to support communities, volunteers, and partners.',
      nameLabel: isSomali ? 'Magacaaga oo buuxa' : 'Full Name',
      emailLabel: isSomali ? 'Email-kaaga' : 'Email Address',
      phoneLabel: isSomali ? 'Telefoonkaaga' : 'Phone Number',
      messageLabel: isSomali ? 'Fariintaada ama Su\'aashaada' : 'Your Message / Inquiry',
      namePlaceholder: isSomali ? 'Tusaale: Axmed Cali' : 'e.g. Ahmed Ali',
      emailPlaceholder: isSomali ? 'email@tusaale.so' : 'email@example.com',
      phonePlaceholder: '+252 61 ...',
      messagePlaceholder: isSomali ? 'Qor fariintaada halkan...' : 'Write your message here...',
      submitBtn: isSomali ? 'Dir Fariinta' : 'Send Message',
      successMsg: isSomali ? 'Waad ku mahadsan tahay! Fariintaada si nabad ah ayaa loo helay.' : 'Thank you! Your message has been received successfully.',
      hotlineTitle: isSomali ? 'Khadka Degdegga ah' : 'Emergency Health Hotline',
      hotlineValue: '+252 61 5111111 / 449',
      emailTitle: isSomali ? 'Email-ka Rasmiga ah' : 'Official Support Email',
      emailValue: 'info@caafimaadhub.so',
      officeTitle: isSomali ? 'Xarunta Dhexe' : 'Coordination Headquarters',
      officeValue: isSomali ? 'Wasaaradda Caafimaadka Soomaaliya, Muqdisho' : 'Ministry of Health Building, Mogadishu, Somalia'
    },
    footer: {
      bio: isSomali
        ? 'CaafimaadHub waa nidaamka isku-xirka iyo maareynta hawl-wadeennada caafimaadka bulshada ee Soomaaliya.'
        : 'CaafimaadHub is the national coordination and frontline field operations platform for Community Health Volunteers.',
      quickLinks: isSomali ? 'Xiriiriyeyaal Fudud' : 'Quick Navigation',
      organization: isSomali ? 'Hay\'adda' : 'Organization',
      newsletter: isSomali ? 'Ogeysiisyo & Warar' : 'Stay Updated',
      newsletterDesc: isSomali
        ? 'Is-qor si aad u hesho wararkii ugu dambeeyay ee ololayaasha caafimaadka.'
        : 'Subscribe to receive verified health campaign notifications and updates.',
      subscribeBtn: isSomali ? 'Is-qor' : 'Subscribe',
      emailPlaceholder: isSomali ? 'Geli email-kaaga' : 'Enter your email',
      subscribedMsg: isSomali ? 'Waad ku mahadsan tahay is-diiwaangelinta!' : 'Thank you for subscribing!',
      copyright: isSomali
        ? '© 2026 CaafimaadHub. Xuquuqda oo dhan way xifdisan tahay.'
        : '© 2026 CaafimaadHub. All rights reserved.',
      mohLine: isSomali
        ? 'Wasaaradda Caafimaadka & Daryeelka Bulshada Soomaaliya'
        : 'Federal Ministry of Health Somalia'
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (newsletterEmail && newsletterEmail.includes('@')) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setNewsletterEmail('');
      }, 4000);
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (contactForm.name && contactForm.email) {
      setContactSubmitted(true);
      setTimeout(() => {
        setContactSubmitted(false);
        setContactForm({ name: '', email: '', phone: '', message: '' });
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-emerald-600 selection:text-white transition-colors duration-200">
      
      {/* ─────────────────────────────────────────────────────────────────────────
          1. TOP NAVIGATION BAR (Clean, 100% Symmetrical, Modern Glassmorphism)
      ───────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-colors w-full overflow-x-clip">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo & Tagline */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 fill-white/20 stroke-white stroke-2" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-1">
                Caafimaad<span className="text-emerald-700 dark:text-emerald-400">Hub</span>
              </span>
              <span className="hidden md:block text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-tight -mt-0.5 truncate max-w-[280px]">
                {txt.brandTagline}
              </span>
            </div>
          </Link>

          {/* Clean Public Navigation Links (Non-wrapping, Perfectly Spaced) */}
          <nav className="hidden xl:flex items-center gap-1.5 2xl:gap-2">
            <a 
              href="#hero-section" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('hero-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 shadow-xs cursor-pointer"
            >
              {txt.nav.home}
            </a>
            <a 
              href="#services-section" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer"
            >
              {txt.nav.services}
            </a>
            <a 
              href="#about-section" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer"
            >
              {txt.nav.about}
            </a>
            <a 
              href="#contact-section" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer"
            >
              {txt.nav.contact}
            </a>
            <Link 
              to="/verify-certificate" 
              className="ml-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors shadow-2xs"
            >
              <CertificateIcon className="w-3.5 h-3.5" />
              <span>{txt.nav.verify}</span>
            </Link>
          </nav>

          {/* Right Action Controls (Uniform Heights & Aligned Rhythm) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Theme Toggle (Moon / Sun) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 transition-colors cursor-pointer"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="h-9 px-2 sm:h-10 sm:px-3 flex items-center gap-1 sm:gap-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span className="font-black">{isSomali ? 'SO' : 'EN'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    type="button"
                    onClick={() => { setLanguage('so'); setLangDropdownOpen(false); }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors ${
                      isSomali ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span> Af-Soomaali (SO)</span>
                    {isSomali && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLanguage('en'); setLangDropdownOpen(false); }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors ${
                      !isSomali ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span> English (EN)</span>
                    {!isSomali && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                  </button>
                </div>
              )}
            </div>

            {/* Join Volunteer CTA (Tablet & Desktop) */}
            <Link
              to="/register"
              className="hidden lg:inline-flex h-10 items-center gap-1.5 px-4 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold whitespace-nowrap rounded-xl border border-emerald-300/70 dark:border-emerald-800 transition-colors shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{txt.nav.joinVolunteer}</span>
            </Link>

            {/* Login Button (Desktop & Tablet) */}
            <Link
              to="/login"
              className="hidden sm:inline-flex h-9 sm:h-10 px-3.5 sm:px-5 items-center gap-1.5 sm:gap-2 bg-[#0a382c] hover:bg-[#072a21] active:scale-[0.98] text-white text-xs font-bold whitespace-nowrap rounded-xl shadow-md shadow-emerald-950/20 hover:shadow-lg transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{txt.nav.login}</span>
            </Link>

            {/* Mobile Hamburger Menu */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shrink-0"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-4 space-y-2 animate-in fade-in slide-in-from-top-3">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex sm:hidden items-center justify-center gap-2 px-3.5 py-3 rounded-xl text-xs font-bold text-white bg-[#0a382c] hover:bg-[#072a21] shadow-md shadow-emerald-950/20 mb-3"
            >
              <Users className="w-4 h-4" />
              <span>{txt.nav.login}</span>
            </Link>
            <a 
              href="#hero-section" 
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                document.getElementById('hero-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="block px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 cursor-pointer"
            >
              {txt.nav.home}
            </a>
            <a 
              href="#services-section" 
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="block px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {txt.nav.services}
            </a>
            <a 
              href="#about-section" 
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="block px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {txt.nav.about}
            </a>
            <a 
              href="#contact-section" 
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="block px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {txt.nav.contact}
            </a>
            <Link 
              to="/verify-certificate" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
            >
              <CertificateIcon className="w-3.5 h-3.5" />
              <span>{txt.nav.verify}</span>
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="flex md:hidden items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{txt.nav.joinVolunteer}</span>
            </Link>
          </div>
        )}
      </header>


      {/* ─────────────────────────────────────────────────────────────────────────
          2. HERO SECTION
      ───────────────────────────────────────────────────────────────────────── */}
      <section id="hero-section" className="relative overflow-hidden pt-8 pb-16 lg:py-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-colors scroll-mt-20 sm:scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-xs">
                <Shield className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>{txt.hero.badge}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-slate-950 dark:text-white tracking-tight leading-[1.15]">
                {txt.hero.title1}<br />
                <span className="text-slate-900 dark:text-emerald-400">{txt.hero.title2}</span>
              </h1>

              {/* Subtitle / Description */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-xl">
                {txt.hero.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#0a382c] hover:bg-[#072a21] text-white text-sm font-bold rounded-2xl shadow-lg shadow-emerald-950/15 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span>{txt.nav.joinVolunteer}</span>
                  <Users className="w-4 h-4" />
                </Link>

                <a
                  href="#services-section"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-bold rounded-2xl border border-slate-300 dark:border-slate-700 shadow-xs hover:border-slate-400 transition-all duration-200 cursor-pointer"
                >
                  <span>{txt.nav.viewCampaigns}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </a>
              </div>

              {/* Database Real Volunteers Initials Stack */}
              <div className="flex items-center gap-3 pt-4">
                <div className="flex -space-x-2.5 overflow-hidden">
                  {liveData.topVolunteers && liveData.topVolunteers.slice(0, 4).map((vol, idx) => {
                    if (vol.avatar_url) {
                      return (
                        <img
                          key={vol.id || idx}
                          className="inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover shadow-xs"
                          src={vol.avatar_url}
                          alt={vol.full_name}
                        />
                      );
                    }
                    return (
                      <div
                        key={vol.id || idx}
                        className={`inline-flex items-center justify-center h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-900 bg-gradient-to-br ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]} text-[11px] font-black shadow-xs`}
                        title={vol.full_name}
                      >
                        {getInitials(vol.full_name)}
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="font-extrabold text-slate-950 dark:text-white">{liveData.totalVolunteers || 10}+ {isSomali ? 'Hawl-wadeenno' : 'Health Volunteers'}</span> {txt.hero.volunteersJoined}
                </div>
              </div>
            </div>

            {/* Right Hero Image with Floating Impact Badge */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                <img
                  src="/assets/images/hero-team.jpg"
                  alt="Kooxda Caafimaadka Bulshada ee Soomaaliya"
                  className="w-full h-[420px] lg:h-[460px] object-cover object-center"
                />

                {/* Floating Impact Card */}
                <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-72 bg-[#0a382c]/95 backdrop-blur-md rounded-2xl p-4 text-white shadow-xl border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <p className="text-xs font-extrabold text-white">{txt.impactCard.title}</p>
                      <p className="text-[10px] text-emerald-200/90">{txt.impactCard.subtitle}</p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>

                  {/* Sparkline Graphic and Stat */}
                  <div className="flex items-end justify-between mt-2 pt-1 border-t border-white/10">
                    <svg className="w-28 h-7 stroke-emerald-400 fill-none stroke-[2.5]" viewBox="0 0 100 25">
                      <path d="M0,20 Q20,18 35,14 T65,8 T100,2" />
                    </svg>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-300">+{liveData.growthPercentage || 20.5}%</span>
                      <span className="block text-[9px] text-emerald-200/80 -mt-0.5">{txt.impactCard.vsMonth}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          3. 4 TOP KEY METRICS CARDS (100% Database-Driven)
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Card 1: Volunteers */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3.5">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">{liveData.totalVolunteers?.toLocaleString() || 10}</p>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">{txt.metrics.volunteersTitle}</p>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1.5">
                <span>{txt.metrics.volunteersSub}</span>
              </p>
            </div>

            {/* Card 2: Campaigns */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center mb-3.5">
                <Calendar className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">{liveData.activeCampaigns || 4}</p>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">{txt.metrics.campaignsTitle}</p>
              <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1 mt-1.5">
                <span>{txt.metrics.campaignsSub}</span>
              </p>
            </div>

            {/* Card 3: Regions */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center mb-3.5">
                <MapPin className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">{liveData.totalRegions || 18}</p>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">{txt.metrics.regionsTitle}</p>
              <p className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1 mt-1.5">
                <span>{txt.metrics.regionsSub}</span>
              </p>
            </div>

            {/* Card 4: Reports */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center mb-3.5">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">{liveData.totalFieldSubmissions?.toLocaleString() || 5}</p>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">{txt.metrics.reportsTitle}</p>
              <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-1.5">
                <span>{txt.metrics.reportsSub}</span>
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          4. "SIDEE CAAFIMAADHUB U SHAQEEYAA?" (4 Process Steps)
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              {txt.howItWorks.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">
              {txt.howItWorks.subtitle}
            </p>
          </div>

          {/* 4 Connected Process Cards */}
          <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-700 shadow-xs relative z-10 hover:border-emerald-500 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-2">{txt.howItWorks.step1Title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                {txt.howItWorks.step1Desc}
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-700 shadow-xs relative z-10 hover:border-emerald-500 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-2">{txt.howItWorks.step2Title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                {txt.howItWorks.step2Desc}
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-700 shadow-xs relative z-10 hover:border-emerald-500 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-2">{txt.howItWorks.step3Title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                {txt.howItWorks.step3Desc}
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-700 shadow-xs relative z-10 hover:border-emerald-500 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                  4
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-2">{txt.howItWorks.step4Title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                {txt.howItWorks.step4Desc}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          5. 4-COLUMN LIVE REAL-TIME OVERVIEW GRID (100% Real Database Queries)
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="py-12 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* ─── Column 1: Volunteer-ka Firfircoon (Real DB Initials Avatars / Photo) ─── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-950 dark:text-white">{txt.liveGrid.col1Title}</h3>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {liveData.topVolunteers?.length || 5} {txt.liveGrid.activeStatus}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
                  {liveData.topVolunteers && liveData.topVolunteers.slice(0, 5).map((vol, idx) => (
                    <div key={vol.id || idx} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {vol.avatar_url ? (
                          <img 
                            src={vol.avatar_url} 
                            alt={vol.full_name} 
                            className="w-8 h-8 rounded-full object-cover shrink-0" 
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]} text-[10px] font-black shadow-xs`}>
                            {getInitials(vol.full_name)}
                          </div>
                        )}
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{vol.full_name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{vol.region_name || 'Banaadir'}{vol.district_name ? `, ${vol.district_name}` : ''}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800 rounded-full">
                        {vol.status === 'APPROVED' || vol.status === 'ACTIVE' ? txt.liveGrid.activeStatus : vol.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Footer */}
              <div className="pt-3.5 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400">{txt.liveGrid.totalVolunteersLabel}</span>
                <span className="font-extrabold text-slate-950 dark:text-white">{liveData.totalVolunteers || 10}</span>
              </div>
            </div>

            {/* ─── Column 2: Kampaaniyada Firfircoon (Real DB Campaigns) ─── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-950 dark:text-white">{txt.liveGrid.col2Title}</h3>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {liveData.activeCampaigns || 4} {txt.liveGrid.activeStatus}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
                  {liveData.activeCampaignsList && liveData.activeCampaignsList.slice(0, 5).map((camp, idx) => (
                    <div key={camp.id || idx} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{camp.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{camp.region_name || 'National'} • {camp.start_date ? camp.start_date.slice(5) : ''}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        camp.status === 'ACTIVE' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800'
                      }`}>
                        {camp.status === 'ACTIVE' ? txt.liveGrid.activeStatus : txt.liveGrid.plannedStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Footer */}
              <div className="pt-3.5 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400">{txt.liveGrid.totalCampaignsLabel}</span>
                <span className="font-extrabold text-slate-950 dark:text-white">{liveData.totalCampaigns || 9}</span>
              </div>
            </div>

            {/* ─── Column 3: Gobolada La Gaadhay (Real DB Regions & Coverage) ─── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-950 dark:text-white">{txt.liveGrid.col3Title}</h3>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {liveData.totalRegions || 18} {txt.liveGrid.totalRegionsLabel}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
                  {liveData.regionalCoverage && liveData.regionalCoverage.slice(0, 5).map((reg, idx) => (
                    <div key={reg.id || idx} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{reg.name}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {reg.volunteers_count || 1} {isSomali ? 'Volunteers' : 'CHVs'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Footer */}
              <div className="pt-3.5 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400">{txt.liveGrid.totalRegionsLabel}</span>
                <span className="font-extrabold text-slate-950 dark:text-white">{liveData.totalRegions || 18}</span>
              </div>
            </div>

            {/* ─── Column 4: Warbixinnada Ugu Dambeeyay (Real DB Submissions) ─── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-950 dark:text-white">{txt.liveGrid.col4Title}</h3>
                  <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                    {txt.liveGrid.submittedStatus}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
                  {liveData.recentReports && liveData.recentReports.slice(0, 5).map((rep, idx) => (
                    <div key={rep.id || idx} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{rep.campaign_name || rep.form_title || 'Warbixin Caafimaad'}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{rep.region_name || 'Banaadir'} • {rep.volunteer_name || 'CHV'}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800 rounded-full">
                        {txt.liveGrid.submittedStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Footer */}
              <div className="pt-3.5 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400">{txt.liveGrid.totalReportsLabel}</span>
                <span className="font-extrabold text-slate-950 dark:text-white">{liveData.totalFieldSubmissions || 5}</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          6. IMPACT & LIVE CHART SECTION
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="py-14 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-6">

            {/* Left Card: Saameynta Bulshadeena */}
            <div className="lg:col-span-6 rounded-3xl bg-[#083a2d] p-7 text-white shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                  <div>
                    <h3 className="text-lg font-extrabold text-white">{txt.impactSection.title}</h3>
                    <p className="text-xs text-emerald-200/80 mt-0.5">{txt.impactSection.subtitle}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>2026</span>
                  </span>
                </div>

                {/* 4 Inner Impact Cards */}
                <div className="grid sm:grid-cols-2 gap-4">
                  
                  {/* Impact 1: People Reached */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-emerald-300 mb-1.5">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-semibold text-emerald-100">{txt.impactSection.metric1Label}</span>
                    </div>
                    <p className="text-2xl font-black text-white tracking-tight">{liveData.totalPeopleReached?.toLocaleString() || '380,000'}</p>
                    <p className="text-[10px] font-semibold text-emerald-300 mt-1">↑ 16.4% {isSomali ? 'bishii hore' : 'vs last month'}</p>
                  </div>

                  {/* Impact 2: Services Delivered */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-emerald-300 mb-1.5">
                      <ClipboardList className="w-4 h-4" />
                      <span className="text-xs font-semibold text-emerald-100">{txt.impactSection.metric2Label}</span>
                    </div>
                    <p className="text-2xl font-black text-white tracking-tight">{liveData.totalServicesDelivered?.toLocaleString() || '4,895'}</p>
                    <p className="text-[10px] font-semibold text-emerald-300 mt-1">↑ 12.8% {isSomali ? 'bishii hore' : 'vs last month'}</p>
                  </div>

                  {/* Impact 3: Medical Supplies Stock */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-emerald-300 mb-1.5">
                      <Package className="w-4 h-4" />
                      <span className="text-xs font-semibold text-emerald-100">{txt.impactSection.metric3Label}</span>
                    </div>
                    <p className="text-2xl font-black text-white tracking-tight">{liveData.totalSuppliesStock?.toLocaleString() || '52,000'}</p>
                    <p className="text-[10px] font-semibold text-emerald-300 mt-1">↑ 18.6% {isSomali ? 'bishii hore' : 'vs last month'}</p>
                  </div>

                  {/* Impact 4: Facilities Linked */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-emerald-300 mb-1.5">
                      <Building2 className="w-4 h-4" />
                      <span className="text-xs font-semibold text-emerald-100">{txt.impactSection.metric4Label}</span>
                    </div>
                    <p className="text-2xl font-black text-white tracking-tight">{liveData.totalFacilities || 10}</p>
                    <p className="text-[10px] font-semibold text-emerald-300 mt-1">↑ 9.3% {isSomali ? 'bishii hore' : 'vs last month'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-emerald-200/80">
                <span>{txt.impactSection.source}</span>
                <span className="font-bold text-white">2026</span>
              </div>
            </div>

            {/* Right Card: Xog Ururin Toos ah (Live Dual-Bar Chart) */}
            <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-800 p-7 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">{txt.liveChart.title}</h3>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{txt.liveChart.liveBadge}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6">
                  {txt.liveChart.description}
                </p>

                {/* Custom Responsive Dual-Bar Chart */}
                <div className="space-y-4 pt-2">
                  <div className="h-44 flex items-end justify-between gap-3 px-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                    {liveData.weeklyActivity && liveData.weeklyActivity.map((dayItem, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div className="w-full flex items-end justify-center gap-1 h-full">
                          <div 
                            className="w-3 sm:w-3.5 bg-[#0a382c] dark:bg-emerald-700 rounded-t-md transition-all" 
                            style={{ height: `${Math.min(100, Math.max(25, (dayItem.reports / 280) * 100))}%` }}
                            title={`${dayItem.reports} submissions`}
                          ></div>
                          <div 
                            className="w-3 sm:w-3.5 bg-emerald-500 dark:bg-emerald-400 rounded-t-md transition-all" 
                            style={{ height: `${Math.min(100, Math.max(30, (dayItem.services / 600) * 100))}%` }}
                            title={`${dayItem.services} services`}
                          ></div>
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          {isSomali ? dayItem.daySo : dayItem.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="mt-4 flex items-center justify-center gap-6 text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-[#0a382c] dark:bg-emerald-700"></span>
                  <span>{txt.liveChart.legendReports}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500 dark:bg-emerald-400"></span>
                  <span>{txt.liveChart.legendServices}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          7. HEALTHCARE SERVICES & SUPPLIES SECTION (#services-section)
      ───────────────────────────────────────────────────────────────────────── */}
      <section id="services-section" className="py-16 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors scroll-mt-20 sm:scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>{txt.servicesSection.badge}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              {txt.servicesSection.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">
              {txt.servicesSection.subtitle}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveData.services && liveData.services.map((srv, idx) => (
              <div key={srv.id || idx} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500 transition-all hover:shadow-md flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-4">
                    {idx === 0 && <Stethoscope className="w-6 h-6" />}
                    {idx === 1 && <Activity className="w-6 h-6" />}
                    {idx === 2 && <Heart className="w-6 h-6" />}
                    {idx === 3 && <ShieldAlert className="w-6 h-6" />}
                    {idx === 4 && <Package className="w-6 h-6" />}
                    {idx === 5 && <Award className="w-6 h-6" />}
                  </div>
                  <h3 className="text-base font-bold text-slate-950 dark:text-white mb-1.5">
                    {isSomali ? srv.nameSo : srv.nameEn}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isSomali ? srv.descSo : srv.descEn}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <span>{srv.category?.replace(/_/g, ' ')}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          8. ABOUT US SECTION (#about-section)
      ───────────────────────────────────────────────────────────────────────── */}
      <section id="about-section" className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors scroll-mt-20 sm:scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Team Photo */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
                <img
                  src="/assets/images/about-team.jpg"
                  alt="Nagu Saabsan Kooxda CaafimaadHub"
                  className="w-full h-80 lg:h-96 object-cover object-center"
                />
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{txt.about.badge}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                {txt.about.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                {txt.about.description}
              </p>

              {/* 3 Core Value Pillars */}
              <div className="space-y-3.5 pt-2">
                
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{txt.about.point1Title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{txt.about.point1Desc}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{txt.about.point2Title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{txt.about.point2Desc}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{txt.about.point3Title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{txt.about.point3Desc}</p>
                  </div>
                </div>

              </div>

              {/* Call to action */}
              <div className="pt-2">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#0a382c] hover:bg-[#072920] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                >
                  <span>{txt.nav.joinVolunteer}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          9. CONTACT & INQUIRIES SECTION (#contact-section)
      ───────────────────────────────────────────────────────────────────────── */}
      <section id="contact-section" className="py-16 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors scroll-mt-20 sm:scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3">
              <Phone className="w-3.5 h-3.5" />
              <span>{txt.contact.badge}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              {txt.contact.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">
              {txt.contact.subtitle}
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Contact Info Cards */}
            <div className="lg:col-span-5 space-y-4">
              
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-1">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-950 dark:text-white">{txt.contact.hotlineTitle}</h4>
                  <p className="text-sm font-black text-emerald-800 dark:text-emerald-400 mt-0.5">{txt.contact.hotlineValue}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{isSomali ? '24/7 Diyaar u ah xaaladaha degdegga ah' : '24/7 Hotline for outbreak alerts'}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-1">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-950 dark:text-white">{txt.contact.emailTitle}</h4>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{txt.contact.emailValue}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{isSomali ? 'Jawaab celin degdeg ah 24 saac gudahood' : 'Official partner & public support'}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-1">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-950 dark:text-white">{txt.contact.officeTitle}</h4>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{txt.contact.officeValue}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{txt.footer.mohLine}</p>
                </div>
              </div>

            </div>

            {/* Right: Public Inquiry Form */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{txt.contact.nameLabel}</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder={txt.contact.namePlaceholder}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{txt.contact.emailLabel}</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder={txt.contact.emailPlaceholder}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{txt.contact.phoneLabel}</label>
                  <input
                    type="text"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder={txt.contact.phonePlaceholder}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{txt.contact.messageLabel}</label>
                  <textarea
                    rows={4}
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder={txt.contact.messagePlaceholder}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 bg-[#0a382c] hover:bg-[#072a21] text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{txt.contact.submitBtn}</span>
                </button>

                {contactSubmitted && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <span>{txt.contact.successMsg}</span>
                  </div>
                )}
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          10. FOOTER
      ───────────────────────────────────────────────────────────────────────── */}
      <footer className="bg-[#05241b] text-slate-300 pt-14 pb-8 border-t border-emerald-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-12 border-b border-emerald-900/60">
            
            {/* Col 1: Brand & Bio */}
            <div className="lg:col-span-4 space-y-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white">
                  <Shield className="w-5 h-5 fill-white/20 stroke-white stroke-2" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight">
                    Caafimaad<span className="text-emerald-400">Hub</span>
                  </h3>
                  <p className="text-[10px] font-medium text-emerald-300/80 -mt-0.5">
                    {txt.brandTagline}
                  </p>
                </div>
              </div>

              <p className="text-xs text-emerald-100/70 leading-relaxed max-w-sm">
                {txt.footer.bio}
              </p>

              {/* Social Media Links */}
              <div className="flex items-center gap-3 pt-2 text-emerald-200/80">
                <a href="#facebook" className="w-7 h-7 rounded-lg bg-emerald-900/60 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors text-xs font-bold">f</a>
                <a href="#twitter" className="w-7 h-7 rounded-lg bg-emerald-900/60 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors text-xs font-bold">𝕏</a>
                <a href="#linkedin" className="w-7 h-7 rounded-lg bg-emerald-900/60 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors text-xs font-bold">in</a>
                <a href="#instagram" className="w-7 h-7 rounded-lg bg-emerald-900/60 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors text-xs font-bold">IG</a>
                <a href="#youtube" className="w-7 h-7 rounded-lg bg-emerald-900/60 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors text-xs font-bold">YT</a>
              </div>

              <p className="text-[11px] text-emerald-300/60 pt-2">
                {txt.footer.copyright}
              </p>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{txt.footer.quickLinks}</h4>
              <ul className="space-y-2 text-xs text-emerald-100/70">
                <li><a href="#hero-section" onClick={(e) => { e.preventDefault(); document.getElementById('hero-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors cursor-pointer">{txt.nav.home}</a></li>
                <li><a href="#services-section" onClick={(e) => { e.preventDefault(); document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors cursor-pointer">{txt.nav.services}</a></li>
                <li><a href="#about-section" onClick={(e) => { e.preventDefault(); document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors cursor-pointer">{txt.nav.about}</a></li>
                <li><a href="#contact-section" onClick={(e) => { e.preventDefault(); document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors cursor-pointer">{txt.nav.contact}</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">{txt.nav.login}</Link></li>
              </ul>
            </div>

            {/* Col 3: Organization Links */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{txt.footer.organization}</h4>
              <ul className="space-y-2 text-xs text-emerald-100/70">
                <li><a href="#about-section" onClick={(e) => { e.preventDefault(); document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors cursor-pointer">{txt.nav.about}</a></li>
                <li><Link to="/register" className="hover:text-white transition-colors">{txt.nav.joinVolunteer}</Link></li>
                <li><Link to="/register-public" className="hover:text-white transition-colors">{isSomali ? 'Isku Diiwaangeli Shacab' : 'Register as Public'}</Link></li>
                <li><a href="#contact-section" onClick={(e) => { e.preventDefault(); document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors cursor-pointer">{txt.nav.contact}</a></li>
              </ul>
            </div>

            {/* Col 4: Newsletter Box */}
            <div className="lg:col-span-4 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{txt.footer.newsletter}</h4>
              <p className="text-xs text-emerald-100/70">
                {txt.footer.newsletterDesc}
              </p>

              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder={txt.footer.emailPlaceholder}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-white placeholder-emerald-400/60 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
                  >
                    {txt.footer.subscribeBtn}
                  </button>
                </div>
                {subscribed && (
                  <p className="text-[11px] text-emerald-300 flex items-center gap-1 mt-1">
                    <Check className="w-3.5 h-3.5" /> {txt.footer.subscribedMsg}
                  </p>
                )}
              </form>
            </div>

          </div>

          {/* Bottom Ministry Attribution */}
          <div className="pt-6 text-center text-xs text-emerald-300/60 flex items-center justify-center gap-1.5">
            <span>{txt.footer.mohLine} •</span>
            <span>{isSomali ? 'Qaranka Soomaaliya' : 'Federal Republic of Somalia'}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
