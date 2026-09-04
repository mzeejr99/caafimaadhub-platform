# CaafimaadHub — Community Health Volunteer Coordination & Field Operations Platform

> **Federal Republic of Somalia — Ministry of Health & Human Services**  
> An enterprise-grade, full-stack, offline-first digital public health information system designed for community health volunteer (CHV) management, campaign orchestration, disease outbreak surveillance, and field data collection.

---

## 🌟 Key Platform Features

- 🏥 **Complete Public Health Operations**: Manage volunteer onboarding, vaccination sweeps, maternal health outreach, and emergency outbreak rapid responses.
- 📱 **Offline-First PWA for Field CHVs**: Mobile-first interface with IndexedDB local caching (Dexie.js), background sync, and GPS location tagging that works seamlessly without internet.
- 🗺️ **Interactive GIS Map Explorer**: Leaflet-powered geospatial visualization of volunteer locations, campaign zones, health facilities, and outbreak hotspots across Somalia's regions.
- 🔐 **Enterprise Role-Based Access Control (RBAC)**: 4 exact roles (`SUPER_ADMIN`, `ADMIN`, `VOLUNTEER`, `PUBLIC_USER`) with a 49+ permission matrix and regional scope isolation.
- 🌐 **100% Bilingual Interface**: Instant toggle between natural **Somali (`Af-Soomaali`)** and **English** across every screen — 1,129 translated keys covering labels, buttons, table headers, form hints, toasts, status badges, and Somali long-date formatting.
- 🎓 **Health Training Academy & Verifiable Credentials**: Modular courses with a full lesson viewer (rich text, **video**, and downloadable **PDF** job aids), automated quiz assessments with celebration confetti, and verifiable certificate codes (`CERT-SOM-YYYY-XXXX`).
- 🗓️ **Duty Scheduling Calendar**: Month calendar of volunteer duty shifts, campaign activities, and availability blocks — programme-wide for admins, personal for each CHV.
- 📦 **Supply Chain & Medical Inventory**: Automated stock tracking (Stock In, Stock Out, Adjustments), minimum threshold alerts, and volunteer requisition workflows.
- 🚨 **Disease Outbreak Surveillance & Rapid Dispatch**: Public & CHV outbreak reporting with automated triage, severity tagging, and SMS alert dispatch.
- 📊 **Business Intelligence & Analytics**: Interactive Chart.js trend charts, regional distribution metrics, and one-click CSV / JSON report exports.
- 🛡️ **Zero-Config Dual Database Engine**: Built-in SQLite for zero-setup local deployment alongside production MySQL 8.0 / MariaDB DDL and seed scripts.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v22.19.0)
- **npm**: v9+

### 2. Installation
```bash
# Clone or navigate to the project directory
cd "CHV Platform"

# Install root, backend, and frontend dependencies
npm run install:all
```

### 3. Initialize Database & Run Automated Tests
```bash
cd backend
npm test
```
*All 28 integration tests run against the bundled SQLite database and pass automatically — your MySQL data is never touched.*

### 4. Start Development Servers
From the root directory:
```bash
# In Terminal 1: Start Backend API (Port 5000)
npm run dev:backend

# In Terminal 2: Start Frontend Vite Dev Server (Port 5173)
npm run dev:frontend
```

Open your browser at `http://localhost:5173` to access CaafimaadHub!

---

## 👥 Default Demo Credentials

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@example.com` | `Password123!` | Full National System Authority, Audit Logs, Settings, Users |
| **Operational Admin** | `admin@example.com` | `Password123!` | Regional Campaigns, Volunteer Approvals, Tasks, Inventory |
| **Volunteer (CHV)** | `volunteer@example.com` | `Password123!` | Task Boards, Field Data PWA, Training Academy, Supplies |
| **Public User** | *No login needed* | *Open Access* | Public Campaigns, Feedback Tickets, Emergency Outbreak Reports, Cert Verification |

*Tip: On the `/login` page, you can also use the one-click demo buttons to switch between roles instantly!*

---

## 📂 Project Structure

```
CHV Platform/
├── backend/
│   ├── src/
│   │   ├── config/          # Hybrid DB adapter (MySQL + SQLite), Constants
│   │   ├── controllers/     # Express REST controllers (Auth, Volunteers, Tasks, etc.)
│   │   ├── database/        # SQLite schema & auto-seed bootloader
│   │   ├── middleware/      # JWT Auth, RBAC, AuditLogger, ErrorHandler, Multer
│   │   ├── routes/          # Express API route modules (/api/v1/*)
│   │   ├── services/        # 12 core domain services
│   │   ├── utils/           # Standard response envelope, ID generators
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Server listener
│   ├── tests/               # Jest & Supertest integration suite
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/      # UI kit (Buttons, Badges, Modals, DataTables, Leaflet GIS, Charts)
│   │   ├── contexts/        # Auth, Language (i18n), Offline PWA, Notifications
│   │   ├── i18n/            # Somali (so.json) & English (en.json) dictionaries
│   │   ├── offline/         # Dexie.js IndexedDB schema & SyncManager
│   │   ├── pages/
│   │   │   ├── admin/       # 18 Admin management & analytics pages
│   │   │   ├── auth/        # Login & Volunteer registration
│   │   │   ├── public/      # Landing page, Feedback, Emergency, Cert verification
│   │   │   ├── schedule/    # Duty calendar (shared by admin & volunteer)
│   │   │   └── volunteer/   # CHV PWA dashboard, Task boards, Field forms, Lesson viewer, Quizzes
│   │   ├── services/        # Centralized API client
│   │   ├── App.jsx          # Protected route hierarchy
│   │   ├── main.jsx         # App bootstrap & ServiceWorker registration
│   │   └── index.css        # Tailwind CSS
│   ├── vite.config.js
│   └── package.json
├── database/
│   ├── schema.sql           # Complete MySQL 8.0 / MariaDB production DDL
│   └── seeds.sql            # Rich Somali public health initial operational seed data
├── docs/
│   ├── ARCHITECTURE.md      # System design, data flow, and security matrix
│   ├── DEPLOYMENT_GUIDE.md  # Ubuntu, Nginx, PM2, Docker deployment
│   └── API_DOCUMENTATION.md # Complete REST API specifications
├── package.json             # Root monorepo scripts
└── README.md
```

---

## 🌍 Bilingual Interface (Somali / English)

Every user-facing string lives in `frontend/src/i18n/en.json` and `so.json` (same key set,
1,129 keys each) and is rendered through the `t('namespace.key')` helper from
`LanguageContext`. Two helpers cover what a plain dictionary cannot:

- `i18n/enums.js` — `enumLabel(t, code)` renders database enum codes (`DISEASE_OUTBREAK`,
  `VACCINES`, `USER_LOGIN`, …) in the active language, falling back to a prettified version
  of the code when a value has no translation yet.
- `i18n/dates.js` — `formatLongDate` / `formatShortDate`. Browsers ship no Somali locale
  data, so the Somali day and month names are supplied by these helpers.

Adding a language means adding a third dictionary with the same keys and registering it in
`LanguageContext`. To check the dictionaries stay in sync, every `t()` key used in the code
must exist in `en.json`, and `so.json` must carry the same key set.

> Note: course titles, campaign names, and lesson bodies are **content stored in the
> database**, not interface strings, so they display exactly as they were entered. Seeded
> lesson bodies are written in Somali; the seeded course titles are in English.

---

## 🗄️ Using MySQL Instead of SQLite

SQLite needs no setup at all. To run on MySQL / MariaDB (XAMPP, WAMP, or a server), start the
database engine and run:

```bash
npm run migrate:mysql
```

This creates the database, imports `database/schema.sql` and `database/seeds.sql` **one statement at
a time** (so a single bad row is reported by name instead of silently aborting the import), and
points `backend/.env` at the detected port. If an earlier import left the database half-populated,
rebuild it cleanly with:

```bash
npm run migrate:mysql -- --reset
```

To top up an existing database with newly added seed rows without dropping anything:

```bash
npm run seed
```

---

## 🧪 Running Automated Tests

```bash
# Run backend integration tests (28 tests, always on SQLite)
cd backend
npm test

# Build frontend production bundle
cd ../frontend
npm run build
```

---

## 📜 License & Attribution

Designed and built for the **Federal Ministry of Health & Human Services, Somalia**.  
Free and Open-Source Software under the MIT License.
