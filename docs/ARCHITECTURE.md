# CaafimaadHub — Technical Architecture & System Design Document

**Product Name**: CaafimaadHub  
**Subtitle**: Community Health Volunteer Coordination & Field Operations Platform  
**Target Domain**: Federal Republic of Somalia — Public Health & Community Outbreak Surveillance  

---

## 1. Executive Summary & Problem Domain

Community Health Volunteers (CHVs) form the primary frontline healthcare delivery network across Somalia, bridging nomadic pastoralist communities, internally displaced person (IDP) settlements, and rural villages with district Maternal & Child Health (MCH) clinics and primary healthcare units.

Before CaafimaadHub, volunteer coordination faced several challenges:
- Paper-based survey delay and loss
- Inability to collect data in areas with intermittent or zero cellular connectivity
- Fragmented supply chain tracking for essential oral rehydration salts, vaccines, and diagnostic test kits
- Delayed disease outbreak reporting (cholera, measles, malaria)
- Lack of centralized volunteer accreditation and competency verification

**CaafimaadHub** solves these challenges through an end-to-end web platform and Offline-First Progressive Web App (PWA) with GPS mapping, automated sync, inventory replenishment, and multilingual (Somali/English) interfaces.

---

## 2. Architectural Blueprint

```
+-------------------------------------------------------------------------------+
|                             CLIENT-SIDE LAYER                                 |
|                                                                               |
|   [ Public Portal ]        [ Volunteer PWA ]         [ Admin Command Center ] |
|   - Outbreak reporting     - Offline Field Forms     - National Dashboard     |
|   - Feedback ticketing     - Task Boards             - GIS Map Explorer       |
|   - Public Campaigns       - Training & Quizzes      - Inventory Management   |
|   - Cert Verification      - IndexedDB Offline Sync  - Analytics & Reports    |
+---------------------------------------+---------------------------------------+
                                        | (HTTPS / REST API / PWA Sync)
+---------------------------------------v---------------------------------------+
|                            BACKEND API GATEWAY (Node.js/Express)              |
|                                                                               |
|  [ Security & Middleware ]                                                    |
|  - JWT Bearer Authentication & Refresh Tokens                                 |
|  - Granular RBAC Permissions Engine & Regional Scope Enforcer                 |
|  - Rate Limiting, Helmet Security Headers, XSS & Injection Sanitization       |
|  - Immutable Audit Trail Logger                                               |
|                                                                               |
|  [ Domain Services ]                                                          |
|  - AuthService         - VolunteerService     - CampaignService               |
|  - TaskService        - FieldDataService     - TrainingQuizService           |
|  - InventoryService    - EmergencyService     - FeedbackService               |
|  - MapGisService       - AnalyticsService     - SmsDispatcherService          |
+---------------------------------------+---------------------------------------+
                                        | (SQL Query / Connection Pool)
+---------------------------------------v---------------------------------------+
|                            RELATIONAL DATA LAYER                              |
|                                                                               |
|  - Primary Production Engine: MySQL 8.0 / MariaDB (InnoDB, UTF8MB4, Spatial)  |
|  - Zero-Config Local Engine:  SQLite 3 (WAL Mode, Foreign Keys Enforced)      |
|  - IndexedDB (Client):        Dexie.js Offline Cache & Mutation Sync Queue    |
+-------------------------------------------------------------------------------+
```

---

## 3. Security Architecture & RBAC Permissions Matrix

CaafimaadHub implements true granular Role-Based Access Control across 4 primary roles:

| Module / Scope | Super Admin | Operational Admin | Field Volunteer | Public Community User |
| :--- | :---: | :---: | :---: | :---: |
| **System Settings & SMS Gateway** | Read / Write | Denied | Denied | Denied |
| **User Management & Role Assignment** | Read / Write | Read (Scoped) | Denied | Denied |
| **Audit Logs & Security Trails** | Read Only | Denied | Denied | Denied |
| **Volunteer Roster & Approvals** | Full Access | Full Access (Region) | Own Profile Only | Denied |
| **Campaigns & Task Dispatch** | Full Access | Full Access | Read Assigned Tasks | Public Campaigns Only |
| **Duty Scheduling Calendar** | Full Access | Full Access (Region) | Own Shifts Only | Denied |
| **Field Data Collection & Offline Sync** | Full Audit | Full Audit | Create / Submit / Sync | Denied |
| **Curriculum, Quizzes & Certs** | Full Access | Full Access | Learn / Quiz / Certs | Verify Certs Only |
| **Medical Supplies & Inventory** | Full Access | Stock Movement / Issue | Submit Requisitions | Denied |
| **Disease Outbreak Surveillance** | Full Access | Triage & Dispatch | Report Incident | Report Incident |
| **Community Grievance Feedback** | Full Access | Investigate / Resolve | Denied | Submit Feedback |

---

## 4. Offline-First PWA Synchronization Engine

```
[ CHV In Remote Field ] ---> [ Enters Household Assessment ]
                                     |
                         [ Navigator.onLine Check ]
                                /          \
                            [ ONLINE ]    [ OFFLINE ]
                               |               |
                    [ Direct REST API POST ]   [ Write to Dexie IndexedDB ]
                               |               [ (Status: PENDING_SYNC) ]
                               |                       |
                               |          [ Device Re-enters Cell Coverage ]
                               |                       |
                               |               [ Window 'online' Event ]
                               |                       |
                               +<------- [ SyncManager.syncAll() Batch Sync ]
                               |
                   [ Central Database Commit ]
                               |
             [ Return Synced Confirmation + SMS Alerts ]
```

---

## 5. Telecommunications & SMS Gateway Integration

CaafimaadHub provides an SMS dispatch abstraction layer supporting:
1. **Mock Gateway**: Instant in-memory simulation for development and testing.
2. **Hormuud Telecom API**: High-deliverability Somali local mobile networks.
3. **Africa's Talking API**: Pan-African SMS aggregation.
4. **Twilio Cloud SMS**: Global fallback.
