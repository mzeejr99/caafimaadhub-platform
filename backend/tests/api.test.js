// The suite always runs against the bundled SQLite database so it never touches a
// developer's MySQL data, no matter what backend/.env says.
process.env.DB_CLIENT = 'sqlite';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');
const { initSchemaAndSeeds } = require('../src/database/schemaInit');

let adminToken = '';
let volunteerToken = '';
let superAdminToken = '';
let testVolunteerId = '';
let testCampaignId = '';
let testTaskId = '';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await initSchemaAndSeeds();
});

describe('CaafimaadHub Platform API Test Suite', () => {
  // 1. Health Check
  test('GET /api/health should return 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.platform).toBe('CaafimaadHub');
  });

  // 2. Authentication: Super Admin Login
  test('POST /api/v1/auth/login with Super Admin credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.role).toBe('SUPER_ADMIN');
    superAdminToken = res.body.data.accessToken;
  });

  // 3. Authentication: Admin Login
  test('POST /api/v1/auth/login with Admin credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.role).toBe('ADMIN');
    adminToken = res.body.data.accessToken;
  });

  // 4. Authentication: Volunteer Login
  test('POST /api/v1/auth/login with Volunteer credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'volunteer@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.role).toBe('VOLUNTEER');
    expect(res.body.data.user.volunteerId).toBeDefined();
    volunteerToken = res.body.data.accessToken;
    testVolunteerId = res.body.data.user.volunteerId;
  });

  // 5. Auth Error on Bad Password
  test('POST /api/v1/auth/login with wrong password should return 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'WrongPassword999!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 5b. Public User Registration
  test('POST /api/v1/auth/register successfully registers a volunteer applicant', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Aamina Warsame',
        email: `aamina.${Date.now()}@example.com`,
        phone: `+252 61 ${Math.floor(1000000 + Math.random() * 9000000)}`,
        password: 'Password123!',
        region_name: 'Banadir',
        district_name: 'Hodan'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBeDefined();
  });

  // 6. Public Campaigns Listing
  test('GET /api/v1/campaigns/public should return published campaigns without auth', async () => {
    const res = await request(app).get('/api/v1/campaigns/public');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 7. Public Community Feedback Submission
  test('POST /api/v1/feedback/submit allows public feedback submission', async () => {
    const res = await request(app)
      .post('/api/v1/feedback/submit')
      .send({
        category: 'HEALTH_CONCERN',
        description: 'Need more mosquito nets in Taleex block 4.',
        locationName: 'Taleex Block 4',
        reporterName: 'Ubax Ali',
        reporterPhone: '+252 61 9876543'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ticketNumber).toMatch(/^TCK-/);
  });

  // 8. Public Emergency Outbreak Report
  test('POST /api/v1/emergencies/report allows public emergency reporting', async () => {
    const res = await request(app)
      .post('/api/v1/emergencies/report')
      .send({
        emergencyType: 'DISEASE_OUTBREAK',
        severity: 'CRITICAL',
        description: 'Sudden spike of measles symptoms in 8 children.',
        suspectedCasesCount: 8,
        regionId: 'reg-banadir',
        districtId: 'dist-hodan',
        communityName: 'K5 Zoobe',
        reporterName: 'Ali Nurse',
        reporterPhone: '+252 61 7771122'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reportCode).toMatch(/^EMR-/);
  });

  // 9. Volunteers Roster & Approval
  test('GET /api/v1/volunteers should return volunteer list for Admin', async () => {
    const res = await request(app)
      .get('/api/v1/volunteers')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 10. Campaigns: Create & Read
  test('POST /api/v1/campaigns creates a new campaign', async () => {
    const res = await request(app)
      .post('/api/v1/campaigns')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Banadir Maternal & Child Health Week',
        type: 'MATERNAL_HEALTH',
        description: 'Antenatal care checkups and tetanus toxoid vaccination.',
        objective: 'Reach 10,000 pregnant and lactating mothers.',
        startDate: '2026-10-01',
        endDate: '2026-10-07',
        regionId: 'reg-banadir',
        districtId: 'dist-hodan',
        targetPopulation: 10000,
        budget: 15000,
        currency: 'USD'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    testCampaignId = res.body.data.id;
  });

  // 11. Tasks: Create & Assign Task
  test('POST /api/v1/tasks creates and assigns task to volunteer', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        campaignId: testCampaignId,
        title: 'Maternal Outreach in Taleex Ward',
        taskType: 'HEALTH_EDUCATION',
        description: 'Visit 40 households and register pregnant mothers.',
        priority: 'HIGH',
        regionId: 'reg-banadir',
        districtId: 'dist-hodan',
        startDatetime: '2026-10-02 08:00:00',
        deadlineDatetime: '2026-10-02 16:00:00',
        volunteerId: testVolunteerId,
        requiresFieldData: 1,
        fieldFormId: 'form-immu-01'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    testTaskId = res.body.data.id;
  });

  // 12. Volunteer Task Board
  test('GET /api/v1/tasks/board returns volunteer task board', async () => {
    const res = await request(app)
      .get('/api/v1/tasks/board')
      .set('Authorization', `Bearer ${volunteerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.upcoming).toBeDefined();
    expect(res.body.data.completed).toBeDefined();
  });

  // 13. Field Data Collection Submission
  test('POST /api/v1/field-data/submit records volunteer field data', async () => {
    const res = await request(app)
      .post('/api/v1/field-data/submit')
      .set('Authorization', `Bearer ${volunteerToken}`)
      .send({
        localId: 'local-test-uuid-001',
        taskId: testTaskId,
        campaignId: testCampaignId,
        fieldFormId: 'form-immu-01',
        latitude: 2.045,
        longitude: 45.315,
        accuracyMeters: 5,
        payloadData: {
          child_name: 'Farhan Mohamed',
          child_gender: 'Male',
          age_months: 18,
          vaccine_type: 'bOPV (Oral Polio)',
          dose_number: 'Dose 2',
          is_zero_dose: false,
          caregiver_name: 'Halima Nur',
          caregiver_phone: '+252 61 7001122',
          finger_marked: true
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
  });

  // 14. Inventory: List & Record Transaction
  test('GET /api/v1/inventory/items returns supply items', async () => {
    const res = await request(app)
      .get('/api/v1/inventory/items')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 15. Training & Quiz
  test('GET /api/v1/training returns published courses', async () => {
    const res = await request(app)
      .get('/api/v1/training')
      .set('Authorization', `Bearer ${volunteerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 16. RBAC Protection: Volunteers cannot access admin routes
  test('GET /api/v1/audit-logs returns 403 Forbidden for Volunteer', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${volunteerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // 17. Super Admin Audit Logs
  test('GET /api/v1/audit-logs returns 200 for Super Admin', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 18. Admin Issue Certificate to Volunteer
  test('POST /api/v1/training/certificates/issue allows Admin to issue certificate', async () => {
    // Get first course
    const courseRes = await request(app).get('/api/v1/training');
    const firstCourse = courseRes.body.data[0];

    const res = await request(app)
      .post('/api/v1/training/certificates/issue')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        volunteerId: testVolunteerId,
        courseId: firstCourse ? firstCourse.id : 'crs-som-01',
        score: 98
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data.certificateNumber).toBeDefined();
  });

  // 19. Get all certificates for Super Admin
  test('GET /api/v1/training/certificates/all returns certificates list for Admin', async () => {
    const res = await request(app)
      .get('/api/v1/training/certificates/all')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
  // 20. Course detail returns the lesson sequence (TEXT / VIDEO / PDF)
  test('GET /api/v1/training/:id returns lessons with multimedia content types', async () => {
    const listRes = await request(app).get('/api/v1/training');
    const course = listRes.body.data.find(c => c.total_lessons > 0) || listRes.body.data[0];

    const res = await request(app)
      .get(`/api/v1/training/${course.id}`)
      .set('Authorization', `Bearer ${volunteerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.lessons)).toBe(true);
    expect(res.body.data.lessons.length).toBeGreaterThan(0);

    const allLessons = [];
    for (const c of listRes.body.data) {
      const detail = await request(app)
        .get(`/api/v1/training/${c.id}`)
        .set('Authorization', `Bearer ${volunteerToken}`);
      allLessons.push(...(detail.body.data.lessons || []));
    }
    const types = allLessons.map(l => l.content_type);
    expect(types).toContain('VIDEO');
    expect(types).toContain('PDF');
    const pdfLesson = allLessons.find(l => l.content_type === 'PDF');
    expect(pdfLesson.media_url).toBeTruthy();
  });

  // 21. Lesson progress update (regression: MAX(a,b) is not portable to MySQL)
  test('PUT /api/v1/training/:id/progress records volunteer lesson progress', async () => {
    const listRes = await request(app)
      .get('/api/v1/training')
      .set('Authorization', `Bearer ${volunteerToken}`);
    const course = listRes.body.data.find(c => !c.enrollment) || listRes.body.data[0];

    // Clear any previous enrollment for this course so we can test 50% cleanly
    const db = require('../src/config/db');
    const volunteerId = (await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${volunteerToken}`)).body.data.volunteerId;
    if (volunteerId) {
      await db.execute(`DELETE FROM training_enrollments WHERE course_id = ? AND volunteer_id = ?`, [course.id, volunteerId]);
    }

    const res = await request(app)
      .put(`/api/v1/training/${course.id}/progress`)
      .set('Authorization', `Bearer ${volunteerToken}`)
      .send({ progressPercentage: 50 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.progressPercentage).toBe(50);

    // Progress must never move backwards
    const lower = await request(app)
      .put(`/api/v1/training/${course.id}/progress`)
      .set('Authorization', `Bearer ${volunteerToken}`)
      .send({ progressPercentage: 20 });

    expect(lower.status).toBe(200);
    expect(lower.body.data.progressPercentage).toBe(50);
  });

  // 22. Quiz retrieval never leaks the correct answer
  test('GET /api/v1/training/:id/quiz returns questions without exposing correct answers', async () => {
    const listRes = await request(app).get('/api/v1/training');
    const course = listRes.body.data.find(c => c.total_quizzes > 0);
    expect(course).toBeDefined();

    const res = await request(app)
      .get(`/api/v1/training/${course.id}/quiz`)
      .set('Authorization', `Bearer ${volunteerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.quiz.questions.length).toBeGreaterThan(0);

    const firstQuestion = res.body.data.quiz.questions[0];
    expect(Array.isArray(firstQuestion.answers)).toBe(true);
    expect(firstQuestion.answers[0].answer_text).toBeDefined();
    expect(firstQuestion.answers[0].is_correct).toBeUndefined();
    expect(JSON.stringify(res.body.data)).not.toContain('is_correct');
  });

  // 23. Full assessment flow: submit answers, get graded, receive a certificate
  test('POST /api/v1/training/:id/quiz/submit grades the assessment and issues a certificate', async () => {
    const listRes = await request(app).get('/api/v1/training');
    const course = listRes.body.data.find(c => c.total_quizzes > 0);

    const quizRes = await request(app)
      .get(`/api/v1/training/${course.id}/quiz`)
      .set('Authorization', `Bearer ${volunteerToken}`);

    // Seed data lists the correct option first, and the API orders answers by id
    const answers = {};
    for (const q of quizRes.body.data.quiz.questions) {
      answers[q.id] = q.answers[0].id;
    }

    const res = await request(app)
      .post(`/api/v1/training/${course.id}/quiz/submit`)
      .set('Authorization', `Bearer ${volunteerToken}`)
      .send({ answers });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.percentageScore).toBe(100);
    expect(res.body.data.passed).toBe(true);
    expect(res.body.data.questionResults.length).toBe(quizRes.body.data.quiz.questions.length);
    expect(res.body.data.certificate).toBeTruthy();
  });

  // 24. Failing the assessment does not issue a certificate
  test('POST /api/v1/training/:id/quiz/submit fails the volunteer when answers are wrong', async () => {
    const listRes = await request(app).get('/api/v1/training');
    const courses = listRes.body.data.filter(c => c.total_quizzes > 0);
    const course = courses[courses.length - 1];

    const quizRes = await request(app)
      .get(`/api/v1/training/${course.id}/quiz`)
      .set('Authorization', `Bearer ${volunteerToken}`);

    const answers = {};
    for (const q of quizRes.body.data.quiz.questions) {
      answers[q.id] = q.answers[q.answers.length - 1].id; // deliberately wrong
    }

    const res = await request(app)
      .post(`/api/v1/training/${course.id}/quiz/submit`)
      .set('Authorization', `Bearer ${volunteerToken}`)
      .send({ answers });

    expect(res.status).toBe(200);
    expect(res.body.data.passed).toBe(false);
    expect(res.body.data.certificate).toBeNull();
  });

  // 25. Scheduling calendar for administrators
  test('GET /api/v1/tasks/schedules returns the duty calendar for Admin', async () => {
    const res = await request(app)
      .get('/api/v1/tasks/schedules')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].start_time).toBeDefined();
    expect(res.body.data[0].title).toBeDefined();
  });

  // 26. A volunteer only ever sees their own schedule
  test('GET /api/v1/tasks/schedules is scoped to the logged-in volunteer', async () => {
    const meRes = await request(app)
      .get('/api/v1/tasks/schedules')
      .set('Authorization', `Bearer ${volunteerToken}`);

    expect(meRes.status).toBe(200);
    expect(Array.isArray(meRes.body.data)).toBe(true);

    const volunteerIds = [...new Set(meRes.body.data.map(s => s.volunteer_id))];
    expect(volunteerIds.length).toBeLessThanOrEqual(1);
  });

  // 27. A public account has no duty schedule at all
  test('GET /api/v1/tasks/schedules returns 403 for a public user without a volunteer profile', async () => {
    const email = `public.schedule.${Date.now()}@example.com`;
    await request(app)
      .post('/api/v1/auth/register-public')
      .send({
        fullName: 'Khadija Nuur',
        email,
        phone: '+252 61 7770001',
        password: 'Password123!',
        region_name: 'Banadir',
        district_name: 'Hodan'
      });

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'Password123!' });

    expect(login.status).toBe(200);

    const res = await request(app)
      .get('/api/v1/tasks/schedules')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
