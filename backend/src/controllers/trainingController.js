const trainingService = require('../services/trainingService');
const { success, created, notFound, badRequest } = require('../utils/response');

class TrainingController {
  async getCourses(req, res, next) {
    try {
      const volId = req.user ? req.user.volunteerId : null;
      const courses = await trainingService.getCourses(req.query.category, volId);
      return success(res, courses, 'Training courses retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getCourseById(req, res, next) {
    try {
      const volId = req.user ? req.user.volunteerId : null;
      const course = await trainingService.getCourseById(req.params.id, volId);
      if (!course) return notFound(res, 'Course not found');
      return success(res, course, 'Course details');
    } catch (err) {
      next(err);
    }
  }

  async getQuiz(req, res, next) {
    try {
      const volId = req.user ? req.user.volunteerId : null;
      const data = await trainingService.getQuizForCourse(req.params.id, volId);
      return success(res, data, 'Course assessment quiz');
    } catch (err) {
      next(err);
    }
  }

  async enrollVolunteer(req, res, next) {
    try {
      const volId = req.user.volunteerId;
      if (!volId) return badRequest(res, 'Only registered volunteers can enroll in courses');
      const result = await trainingService.enrollVolunteer(req.params.id, volId);
      return success(res, result, 'Enrolled successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateProgress(req, res, next) {
    try {
      const volId = req.user.volunteerId;
      const { progressPercentage } = req.body;
      const result = await trainingService.updateProgress(req.params.id, volId, progressPercentage);
      return success(res, result, 'Progress updated');
    } catch (err) {
      next(err);
    }
  }

  async submitQuiz(req, res, next) {
    try {
      const volId = req.user.volunteerId;
      if (!volId) return badRequest(res, 'Volunteer profile required to submit quiz');
      const { answers } = req.body;
      const result = await trainingService.submitQuiz(req.params.id, volId, answers || {});
      return success(res, result, result.passed ? 'Quiz Passed! Certificate Issued.' : 'Quiz completed. Passing score not reached.');
    } catch (err) {
      next(err);
    }
  }

  async getCertificates(req, res, next) {
    try {
      const volId = req.user.volunteerId;
      if (!volId) return badRequest(res, 'Volunteer profile required');
      const certs = await trainingService.getCertificates(volId);
      return success(res, certs, 'Volunteer certificates');
    } catch (err) {
      next(err);
    }
  }

  async verifyCertificate(req, res, next) {
    try {
      const cert = await trainingService.verifyCertificate(req.params.code);
      if (!cert) return notFound(res, 'Certificate not found or verification code is invalid');
      return success(res, cert, 'Certificate verified successfully');
    } catch (err) {
      next(err);
    }
  }

  async createCourse(req, res, next) {
    try {
      const course = await trainingService.createCourse(req.body, req.user.id);
      return created(res, course, 'Course created successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateCourse(req, res, next) {
    try {
      const course = await trainingService.updateCourse(req.params.id, req.body, req.user.id);
      return success(res, course, 'Course updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteCourse(req, res, next) {
    try {
      const result = await trainingService.deleteCourse(req.params.id, req.user.id);
      return success(res, result, 'Course deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  async getAllCertificates(req, res, next) {
    try {
      const certs = await trainingService.getAllCertificates();
      return success(res, certs, 'All issued certificates');
    } catch (err) {
      next(err);
    }
  }

  async issueCertificate(req, res, next) {
    try {
      const { volunteerId, courseId } = req.body;
      if (!volunteerId || !courseId) {
        return badRequest(res, 'Volunteer ID and Course ID are required');
      }
      const cert = await trainingService.issueCertificate(req.body, req.user.id);
      return created(res, cert, 'Certificate issued successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TrainingController();
