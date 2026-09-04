const db = require('../config/db');
const { uuid, generateCertificateNumber, generateVerificationCode } = require('../utils/idGenerator');
const { logAudit } = require('../middleware/auditLogger');
const notificationService = require('./notificationService');

class TrainingService {
  /**
   * List all published training courses
   */
  async getCourses(category = null, volunteerId = null) {
    let sql = `SELECT c.*,
                      (SELECT COUNT(*) FROM training_lessons l WHERE l.course_id = c.id) AS total_lessons,
                      (SELECT COUNT(*) FROM training_quizzes q WHERE q.course_id = c.id) AS total_quizzes,
                      (SELECT COUNT(*) FROM training_enrollments e WHERE e.course_id = c.id) AS enrolled_count
               FROM training_courses c
               WHERE c.is_published = 1`;
    const params = [];

    if (category) {
      sql += ` AND c.category = ?`;
      params.push(category);
    }

    sql += ` ORDER BY c.category, c.title`;

    const courses = await db.query(sql, params);

    // If volunteerId supplied, attach enrollment status & certificate
    if (volunteerId) {
      for (const course of courses) {
        const enroll = await db.getOne(
          `SELECT * FROM training_enrollments WHERE course_id = ? AND volunteer_id = ?`,
          [course.id, volunteerId]
        );
        course.enrollment = enroll || null;

        const cert = await db.getOne(
          `SELECT * FROM certificates WHERE course_id = ? AND volunteer_id = ?`,
          [course.id, volunteerId]
        );
        course.certificate = cert || null;
      }
    }

    return courses;
  }

  /**
   * Get single course details with lessons & quiz
   */
  async getCourseById(courseId, volunteerId = null) {
    const course = await db.getOne(
      `SELECT * FROM training_courses WHERE id = ? OR code = ?`,
      [courseId, courseId]
    );

    if (!course) return null;

    // Fetch lessons in sequence
    course.lessons = await db.query(
      `SELECT * FROM training_lessons WHERE course_id = ? ORDER BY lesson_order ASC`,
      [course.id]
    );

    // Fetch quiz (without showing answers)
    const quiz = await db.getOne(`SELECT * FROM training_quizzes WHERE course_id = ?`, [course.id]);
    if (quiz) {
      const questions = await db.query(
        `SELECT id, question_text, question_type, points, order_index 
         FROM training_questions WHERE quiz_id = ? ORDER BY order_index ASC`,
        [quiz.id]
      );

      for (const q of questions) {
        // Deterministic order so the API response is stable; the client shuffles the
        // options for display so the correct answer is never always in first place.
        q.answers = await db.query(
          `SELECT id, answer_text FROM training_answers WHERE question_id = ? ORDER BY id ASC`,
          [q.id]
        );
      }
      quiz.questions = questions;
      course.quiz = quiz;
    } else {
      course.quiz = null;
    }

    if (volunteerId) {
      course.enrollment = await db.getOne(
        `SELECT * FROM training_enrollments WHERE course_id = ? AND volunteer_id = ?`,
        [course.id, volunteerId]
      );
      course.certificate = await db.getOne(
        `SELECT * FROM certificates WHERE course_id = ? AND volunteer_id = ?`,
        [course.id, volunteerId]
      );
    }

    return course;
  }

  /**
   * Get the assessment quiz of a course (answers never expose is_correct)
   */
  async getQuizForCourse(courseId, volunteerId = null) {
    const course = await this.getCourseById(courseId, volunteerId);
    if (!course) throw { status: 404, message: 'Course not found' };

    if (!course.quiz) {
      throw { status: 404, message: 'This course has no assessment quiz yet' };
    }

    return {
      course: {
        id: course.id,
        code: course.code,
        title: course.title,
        category: course.category,
        description: course.description,
        passingScore: course.passing_score_percentage || 80,
        totalLessons: (course.lessons || []).length
      },
      quiz: course.quiz,
      enrollment: course.enrollment || null,
      certificate: course.certificate || null
    };
  }

  /**
   * Enroll volunteer in course
   */
  async enrollVolunteer(courseId, volunteerId) {
    const course = await this.getCourseById(courseId);
    if (!course) throw { status: 404, message: 'Course not found' };

    const existing = await db.getOne(
      `SELECT * FROM training_enrollments WHERE course_id = ? AND volunteer_id = ?`,
      [course.id, volunteerId]
    );

    if (existing) {
      return existing;
    }

    const id = uuid();
    await db.execute(
      `INSERT INTO training_enrollments (id, course_id, volunteer_id, status, progress_percentage, enrolled_at)
       VALUES (?, ?, ?, 'IN_PROGRESS', 10, CURRENT_TIMESTAMP)`,
      [id, course.id, volunteerId]
    );

    return {
      id,
      courseId: course.id,
      volunteerId,
      status: 'IN_PROGRESS',
      progressPercentage: 10
    };
  }

  /**
   * Update lesson progress
   */
  async updateProgress(courseId, volunteerId, progressPercentage) {
    const course = await db.getOne(
      `SELECT id FROM training_courses WHERE id = ? OR code = ?`,
      [courseId, courseId]
    );
    if (!course) throw { status: 404, message: 'Course not found' };

    const pct = Math.min(100, Math.max(0, parseInt(progressPercentage, 10) || 0));

    // Auto-enroll if the volunteer opened the course without enrolling first
    const enrollment = await db.getOne(
      `SELECT * FROM training_enrollments WHERE course_id = ? AND volunteer_id = ?`,
      [course.id, volunteerId]
    );
    if (!enrollment) {
      await this.enrollVolunteer(course.id, volunteerId);
    }

    // NOTE: MAX(a, b) is a scalar function in SQLite but an aggregate in MySQL,
    // so the progress "never goes backwards" rule is expressed with a portable CASE.
    await db.execute(
      `UPDATE training_enrollments 
       SET progress_percentage = CASE WHEN progress_percentage < ? THEN ? ELSE progress_percentage END,
           status = CASE WHEN ? >= 100 THEN 'COMPLETED' ELSE status END,
           updated_at = CURRENT_TIMESTAMP
       WHERE course_id = ? AND volunteer_id = ?`,
      [pct, pct, pct, course.id, volunteerId]
    );

    const updated = await db.getOne(
      `SELECT progress_percentage, status FROM training_enrollments WHERE course_id = ? AND volunteer_id = ?`,
      [course.id, volunteerId]
    );

    return {
      success: true,
      progressPercentage: updated ? updated.progress_percentage : pct,
      status: updated ? updated.status : 'IN_PROGRESS'
    };
  }

  /**
   * Submit quiz answers and grade
   */
  async submitQuiz(courseId, volunteerId, submittedAnswers = {}) {
    const course = await this.getCourseById(courseId);
    if (!course || !course.quiz) {
      throw { status: 404, message: 'Course quiz not found' };
    }

    // Make sure an enrollment row exists so the score and completion are recorded
    const existingEnrollment = await db.getOne(
      `SELECT id FROM training_enrollments WHERE course_id = ? AND volunteer_id = ?`,
      [course.id, volunteerId]
    );
    if (!existingEnrollment) {
      await this.enrollVolunteer(course.id, volunteerId);
    }

    const quiz = course.quiz;
    let totalPossible = 0;
    let totalScore = 0;
    const questionResults = [];

    for (const q of quiz.questions) {
      totalPossible += q.points;
      const userSelectedAnswerId = submittedAnswers[q.id];

      // Fetch correct answer
      const correctAnswer = await db.getOne(
        `SELECT id, answer_text, explanation FROM training_answers WHERE question_id = ? AND is_correct = 1`,
        [q.id]
      );

      const isCorrect = correctAnswer && correctAnswer.id === userSelectedAnswerId;
      if (isCorrect) {
        totalScore += q.points;
      }

      questionResults.push({
        questionId: q.id,
        questionText: q.question_text,
        userAnswerId: userSelectedAnswerId,
        correctAnswerId: correctAnswer ? correctAnswer.id : null,
        isCorrect,
        explanation: correctAnswer ? correctAnswer.explanation : null
      });
    }

    const percentageScore = Math.round((totalScore / (totalPossible || 1)) * 100);
    const passed = percentageScore >= (course.passing_score_percentage || 80);

    let certificate = null;

    if (passed) {
      // Mark enrollment as COMPLETED
      await db.execute(
        `UPDATE training_enrollments 
         SET status = 'COMPLETED', progress_percentage = 100, quiz_score = ?, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE course_id = ? AND volunteer_id = ?`,
        [percentageScore, course.id, volunteerId]
      );

      // Issue Certificate if not already issued
      const existingCert = await db.getOne(
        `SELECT * FROM certificates WHERE course_id = ? AND volunteer_id = ?`,
        [course.id, volunteerId]
      );

      if (!existingCert) {
        const certId = uuid();
        const certNumber = generateCertificateNumber();
        const verifyCode = generateVerificationCode();
        const todayStr = new Date().toISOString().split('T')[0];

        await db.execute(
          `INSERT INTO certificates (id, certificate_number, volunteer_id, course_id, issue_date, score_achieved, verification_code, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [certId, certNumber, volunteerId, course.id, todayStr, percentageScore, verifyCode]
        );

        certificate = {
          id: certId,
          certificateNumber: certNumber,
          verificationCode: verifyCode,
          issueDate: todayStr,
          scoreAchieved: percentageScore
        };

        // Notify volunteer
        const vol = await db.getOne(`SELECT v.user_id, u.phone FROM volunteers v JOIN users u ON u.id = v.user_id WHERE v.id = ?`, [volunteerId]);
        if (vol) {
          await notificationService.createNotification({
            userId: vol.user_id,
            title: `Hambalyo! Shahaado Cusub / Certificate Unlocked!`,
            message: `Waxaad ku baastay koorsada '${course.title}' natiijo ah ${percentageScore}%. Shahaadadaadii (${certNumber}) waa diyaar. / Congratulations! You earned your certificate for ${course.title}.`,
            type: 'TRAINING_ASSIGNED',
            actionUrl: `/volunteer/certificates`
          });
        }
      } else {
        certificate = existingCert;
      }
    } else {
      await db.execute(
        `UPDATE training_enrollments 
         SET quiz_score = ?, updated_at = CURRENT_TIMESTAMP
         WHERE course_id = ? AND volunteer_id = ?`,
        [percentageScore, course.id, volunteerId]
      );
    }

    return {
      passed,
      percentageScore,
      passingScore: course.passing_score_percentage || 80,
      totalScore,
      totalPossible,
      questionResults,
      certificate
    };
  }

  /**
   * Get volunteer certificates
   */
  async getCertificates(volunteerId) {
    return await db.query(
      `SELECT cert.*, c.title AS course_title, c.category AS course_category,
              u.full_name AS volunteer_name, v.volunteer_id AS volunteer_code
       FROM certificates cert
       JOIN training_courses c ON c.id = cert.course_id
       JOIN volunteers v ON v.id = cert.volunteer_id
       JOIN users u ON u.id = v.user_id
       WHERE cert.volunteer_id = ?
       ORDER BY cert.issue_date DESC`,
      [volunteerId]
    );
  }

  /**
   * Verify certificate by verification code
   */
  async verifyCertificate(code) {
    return await db.getOne(
      `SELECT cert.*, c.title AS course_title, c.category AS course_category,
              u.full_name AS volunteer_name, v.volunteer_id AS volunteer_code,
              r.name AS region_name
       FROM certificates cert
       JOIN training_courses c ON c.id = cert.course_id
       JOIN volunteers v ON v.id = cert.volunteer_id
       JOIN users u ON u.id = v.user_id
       LEFT JOIN regions r ON r.id = v.region_id
       WHERE cert.verification_code = ? OR cert.certificate_number = ?`,
      [code, code]
    );
  }

  /**
   * Create new course (Admin)
   */
  async createCourse(data, actorId) {
    const { code, title, category, description, durationHours, estimatedHours, passingScorePercentage } = data;
    const id = uuid();
    const hours = estimatedHours || durationHours || 2;

    await db.execute(
      `INSERT INTO training_courses (id, code, title, category, description, estimated_hours, passing_score_percentage, is_published, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)`,
      [id, code || `CRS-${Date.now().toString().slice(-4)}`, title, category || 'GENERAL', description || null, hours, passingScorePercentage || 80, actorId]
    );

    logAudit({
      userId: actorId,
      action: 'COURSE_CREATED',
      module: 'TRAINING',
      entityName: 'TrainingCourse',
      entityId: id,
      newValues: { title, category }
    });

    return await this.getCourseById(id);
  }

  /**
   * Update course (Admin)
   */
  async updateCourse(id, data, actorId) {
    const course = await this.getCourseById(id);
    if (!course) throw { status: 404, message: 'Course not found' };

    const { title, category, description, durationHours, estimatedHours, passingScorePercentage, isPublished } = data;
    const hours = estimatedHours || durationHours || null;

    await db.execute(
      `UPDATE training_courses SET
        title = COALESCE(?, title),
        category = COALESCE(?, category),
        description = COALESCE(?, description),
        estimated_hours = COALESCE(?, estimated_hours),
        passing_score_percentage = COALESCE(?, passing_score_percentage),
        is_published = COALESCE(?, is_published),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title, category, description, hours, passingScorePercentage, isPublished !== undefined ? (isPublished ? 1 : 0) : null, course.id]
    );

    logAudit({
      userId: actorId,
      action: 'COURSE_UPDATED',
      module: 'TRAINING',
      entityName: 'TrainingCourse',
      entityId: course.id
    });

    return await this.getCourseById(course.id);
  }

  /**
   * Delete course (Admin)
   */
  async deleteCourse(id, actorId) {
    const course = await this.getCourseById(id);
    if (!course) throw { status: 404, message: 'Course not found' };

    await db.execute(`DELETE FROM certificates WHERE course_id = ?`, [course.id]);
    await db.execute(`DELETE FROM training_enrollments WHERE course_id = ?`, [course.id]);
    await db.execute(
      `DELETE FROM training_answers WHERE question_id IN (
        SELECT id FROM training_questions WHERE quiz_id IN (
          SELECT id FROM training_quizzes WHERE course_id = ?
        )
      )`,
      [course.id]
    );
    await db.execute(
      `DELETE FROM training_questions WHERE quiz_id IN (
        SELECT id FROM training_quizzes WHERE course_id = ?
      )`,
      [course.id]
    );
    await db.execute(`DELETE FROM training_quizzes WHERE course_id = ?`, [course.id]);
    await db.execute(`DELETE FROM training_lessons WHERE course_id = ?`, [course.id]);
    await db.execute(`DELETE FROM training_courses WHERE id = ?`, [course.id]);

    logAudit({
      userId: actorId,
      action: 'COURSE_DELETED',
      module: 'TRAINING',
      entityName: 'TrainingCourse',
      entityId: course.id
    });

    return { success: true, message: 'Course deleted successfully' };
  }

  /**
   * Get all issued certificates across all volunteers (Super Admin / Admin view)
   */
  async getAllCertificates() {
    const certs = await db.query(
      `SELECT c.id, c.certificate_number, c.issue_date, c.score_achieved, c.verification_code, c.created_at,
              v.id AS volunteer_id, v.volunteer_id AS volunteer_code, u.full_name AS volunteer_name, u.email AS volunteer_email,
              tc.id AS course_id, tc.title AS course_title, tc.code AS course_code, tc.category AS course_category
       FROM certificates c
       JOIN volunteers v ON v.id = c.volunteer_id
       JOIN users u ON u.id = v.user_id
       JOIN training_courses tc ON tc.id = c.course_id
       ORDER BY c.created_at DESC`
    );
    return certs;
  }

  /**
   * Issue a certificate to a volunteer (Super Admin / Admin action)
   */
  async issueCertificate(data, actorId) {
    const { volunteerId, courseId, score = 100, issueDate } = data;

    const vol = await db.getOne(
      `SELECT v.id, v.user_id, u.full_name, u.email, u.phone
       FROM volunteers v
       JOIN users u ON u.id = v.user_id
       WHERE v.id = ? OR v.volunteer_id = ? OR u.id = ? OR LOWER(u.email) = LOWER(?)`,
      [volunteerId, volunteerId, volunteerId, volunteerId]
    );
    if (!vol) throw { status: 404, message: 'Volunteer profile not found' };

    const course = await db.getOne(
      `SELECT id, title, code, category FROM training_courses WHERE id = ? OR code = ?`,
      [courseId, courseId]
    );
    if (!course) throw { status: 404, message: 'Training course not found' };

    // Check if certificate already exists
    const existing = await db.getOne(
      `SELECT * FROM certificates WHERE volunteer_id = ? AND course_id = ?`,
      [vol.id, course.id]
    );

    if (existing) {
      return {
        id: existing.id,
        certificateNumber: existing.certificate_number || existing.certificateNumber,
        verificationCode: existing.verification_code || existing.verificationCode,
        issueDate: existing.issue_date || existing.issueDate,
        scoreAchieved: existing.score_achieved || existing.scoreAchieved,
        volunteerName: vol.full_name,
        courseTitle: course.title,
        message: 'Certificate already issued for this course'
      };
    }

    const certId = uuid();
    const certNumber = generateCertificateNumber();
    const verifyCode = generateVerificationCode();
    const dateIssued = issueDate || new Date().toISOString().split('T')[0];

    // Ensure enrollment is marked completed
    const existingEnrollment = await db.getOne(
      `SELECT id FROM training_enrollments WHERE volunteer_id = ? AND course_id = ?`,
      [vol.id, course.id]
    );

    if (existingEnrollment) {
      await db.execute(
        `UPDATE training_enrollments SET status = 'COMPLETED', progress_percentage = 100, quiz_score = ?, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [score, existingEnrollment.id]
      );
    } else {
      await db.execute(
        `INSERT INTO training_enrollments (id, volunteer_id, course_id, status, progress_percentage, quiz_score, completed_at, enrolled_at)
         VALUES (?, ?, ?, 'COMPLETED', 100, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [uuid(), vol.id, course.id, score]
      );
    }

    // Insert Certificate record
    await db.execute(
      `INSERT INTO certificates (id, certificate_number, volunteer_id, course_id, issue_date, score_achieved, verification_code, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [certId, certNumber, vol.id, course.id, dateIssued, score, verifyCode]
    );

    // Notify Volunteer
    await notificationService.createNotification({
      userId: vol.user_id,
      title: `Shahaado Rasmi ah Ayaa Laguu Soo Saaray! / Official Certificate Issued!`,
      message: `Maamulka caafimaadka ayaa kuu soo saaray shahaadada koorsada '${course.title}' (${certNumber}). / Official certificate issued for ${course.title}.`,
      type: 'TRAINING_ASSIGNED',
      actionUrl: '/volunteer/certificates'
    });

    logAudit({
      userId: actorId,
      action: 'CERTIFICATE_ISSUED_BY_ADMIN',
      module: 'TRAINING',
      entityName: 'Certificate',
      entityId: certId,
      newValues: { certificateNumber: certNumber, volunteerId: vol.id, courseId: course.id }
    });

    return {
      id: certId,
      certificateNumber: certNumber,
      verificationCode: verifyCode,
      issueDate: dateIssued,
      scoreAchieved: score,
      volunteerName: vol.full_name,
      courseTitle: course.title
    };
  }
}

module.exports = new TrainingService();
