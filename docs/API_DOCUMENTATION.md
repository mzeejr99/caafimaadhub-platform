# CaafimaadHub — RESTful API Specification (v1)

Base URL: `http://localhost:5000/api/v1` (or `https://caafimaadhub.so/api/v1`)

---

## 1. Authentication & Session Management

### `POST /auth/login`
Authenticates a user account and returns JWT access + refresh tokens.
- **Request Body**:
  ```json
  {
    "email": "superadmin@example.com",
    "password": "Password123!"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "user": {
        "id": 1,
        "fullName": "Eng. Abdullahi Warsame",
        "email": "superadmin@example.com",
        "role": "SUPER_ADMIN",
        "permissions": ["users.create", "volunteers.approve", "..."]
      }
    }
  }
  ```

### `POST /auth/register`
Public registration endpoint for Community Health Volunteers (CHVs).

### `GET /auth/me`
Fetches authenticated user context, permissions, and active regional scope.

---

## 2. Volunteer Management (`/volunteers`)

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/volunteers` | `ADMIN`, `SUPER_ADMIN` | List volunteers with pagination and filtering |
| `GET` | `/volunteers/:id` | `ADMIN`, `SUPER_ADMIN` | Get volunteer profile details |
| `PUT` | `/volunteers/:id/approve` | `ADMIN`, `SUPER_ADMIN` | Approve volunteer registration |
| `PUT` | `/volunteers/:id/suspend` | `SUPER_ADMIN` | Suspend volunteer account |

---

## 3. Campaigns & Task Assignment (`/campaigns`, `/tasks`)

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/campaigns/public` | Public | List published health campaigns |
| `GET` | `/campaigns` | `ADMIN`, `SUPER_ADMIN` | List campaigns with target metrics |
| `POST` | `/campaigns` | `ADMIN`, `SUPER_ADMIN` | Create and launch new campaign |
| `GET` | `/tasks` | `ADMIN`, `SUPER_ADMIN` | List all scheduled tasks |
| `POST` | `/tasks` | `ADMIN`, `SUPER_ADMIN` | Assign and dispatch task to CHV |
| `GET` | `/tasks/board` | `VOLUNTEER` | Get CHV task board (Today, Upcoming, Completed) |
| `GET` | `/tasks/schedules` | All Authenticated | Duty calendar. Admins may filter with `volunteerId`, `campaignId`, `startDate`, `endDate`; a volunteer always receives only their own shifts |
| `PUT` | `/tasks/:id/accept` | `VOLUNTEER` | Accept assigned task |
| `PUT` | `/tasks/:id/start` | `VOLUNTEER` | Start active field work |
| `PUT` | `/tasks/:id/complete` | `VOLUNTEER` | Mark task completed |

---

## 4. Field Data Collection & Offline Batch Sync (`/field-data`)

### `POST /field-data/submit`
Submit real-time GPS-tagged household health screening.
- **Request Body**:
  ```json
  {
    "campaignId": 1,
    "fieldFormId": 1,
    "latitude": 2.0469,
    "longitude": 45.3182,
    "accuracy": 12.5,
    "data": {
      "householdHead": "Maryan Nuur Cilmi",
      "familyMembersCount": 6,
      "underFiveChildren": 2,
      "vaccinatedUnderFive": "YES",
      "suspectedIllness": "NONE",
      "cleanWaterSource": "YES"
    }
  }
  ```

### `POST /field-data/sync-batch`
Synchronizes bulk records collected offline on mobile devices.

---

## 5. Training Academy, Assessments & Certificates (`/training`)

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/training` | Public / All | List published courses with lesson counts, and — for a signed-in volunteer — their enrollment progress and certificate |
| `GET` | `/training/:id` | Public / All | Course detail with the ordered lesson sequence (`TEXT`, `VIDEO`, `PDF`, `IMAGE`) and its assessment quiz |
| `POST` | `/training/:id/enroll` | `VOLUNTEER` | Enroll the volunteer in a course |
| `PUT` | `/training/:id/progress` | `VOLUNTEER` | Update lesson progress (`progressPercentage`); progress never moves backwards and auto-enrolls if needed |
| `GET` | `/training/:id/quiz` | All Authenticated | Fetch the assessment quiz. Answer options never include `is_correct` |
| `POST` | `/training/:id/quiz/submit` | `VOLUNTEER` | Grade the assessment, record the score, and auto-issue a certificate on a pass |
| `GET` | `/training/certificates/me` | `VOLUNTEER` | Certificates held by the signed-in volunteer |
| `GET` | `/training/certificates/all` | `ADMIN`, `SUPER_ADMIN` | All certificates issued nationally |
| `POST` | `/training/certificates/issue` | `ADMIN`, `SUPER_ADMIN` | Manually issue a certificate to a volunteer |
| `GET` | `/training/verify/:code` | Public | Public verification of a certificate code (`CERT-SOM-YYYY-XXXXXX`) |

### Lesson media
A lesson carries `content_type` and `media_url`. `media_url` may be a file uploaded to the
platform (`/uploads/training/<file>.pdf`), a direct `.mp4` URL, or a YouTube/Vimeo link — the
lesson viewer renders each of them natively.

### `POST /training/:id/quiz/submit`
- **Request Body** — a map of question id to the chosen answer id:
  ```json
  {
    "answers": {
      "qq-n-01": "ans-n-01-a",
      "qq-n-02": "ans-n-02-a"
    }
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Quiz Passed! Certificate Issued.",
    "data": {
      "passed": true,
      "percentageScore": 100,
      "passingScore": 80,
      "totalScore": 100,
      "totalPossible": 100,
      "questionResults": [
        { "questionId": "qq-n-01", "isCorrect": true, "explanation": "Any MUAC below 11.5 cm is SAM." }
      ],
      "certificate": {
        "certificateNumber": "CERT-SOM-2026-U3FA1L",
        "verificationCode": "…",
        "scoreAchieved": 100
      }
    }
  }
  ```

---

## 6. Medical Inventory & Warehouse Supplies (`/inventory`)

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/inventory/items` | All Authenticated | Get supply list & stock balances |
| `POST` | `/inventory/items` | `ADMIN`, `SUPER_ADMIN` | Register new inventory asset |
| `POST` | `/inventory/movements` | `ADMIN`, `SUPER_ADMIN` | Record Stock In / Stock Out |
| `GET` | `/inventory/requests` | `ADMIN`, `SUPER_ADMIN` | List CHV supply requisitions |
| `POST` | `/inventory/requests` | `VOLUNTEER` | Submit supply requisition |
| `PUT` | `/inventory/requests/:id/approve` | `ADMIN`, `SUPER_ADMIN` | Approve supply requisition |
| `PUT` | `/inventory/requests/:id/issue` | `ADMIN`, `SUPER_ADMIN` | Issue stock and deduct warehouse balance |

---

## 7. Disease Outbreak Surveillance (`/emergencies`)

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/emergencies/report` | Public / All | Report disease outbreak or emergency |
| `GET` | `/emergencies` | `ADMIN`, `SUPER_ADMIN` | List outbreak reports & triage status |
| `PUT` | `/emergencies/:id/status` | `ADMIN`, `SUPER_ADMIN` | Update status & dispatch response team |

---

## 8. Community Feedback & Complaints (`/feedback`)

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/feedback/submit` | Public / All | Submit community grievance or suggestion |
| `GET` | `/feedback` | `ADMIN`, `SUPER_ADMIN` | List feedback tickets |
| `PUT` | `/feedback/:id/status` | `ADMIN`, `SUPER_ADMIN` | Resolve ticket & log official response |

---

## 9. Reports & Analytics (`/analytics`, `/reports`, `/maps`)

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/analytics/dashboard` | `ADMIN`, `SUPER_ADMIN` | Aggregated command center KPIs |
| `GET` | `/reports/export` | `ADMIN`, `SUPER_ADMIN` | Download CSV / JSON report datasets |
| `GET` | `/maps/layers` | `ADMIN`, `SUPER_ADMIN` | GeoJSON layers for volunteers, tasks, cases |
| `GET` | `/audit-logs` | `SUPER_ADMIN` | Security and administrative audit trail |
