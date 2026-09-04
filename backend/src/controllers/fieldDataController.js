const fieldDataService = require('../services/fieldDataService');
const { success, created, notFound, badRequest } = require('../utils/response');

class FieldDataController {
  async getForms(req, res, next) {
    try {
      const forms = await fieldDataService.getForms(req.query.category);
      return success(res, forms, 'Field forms retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getFormById(req, res, next) {
    try {
      const form = await fieldDataService.getFormById(req.params.id);
      if (!form) return notFound(res, 'Field form not found');
      return success(res, form, 'Field form details');
    } catch (err) {
      next(err);
    }
  }

  async createForm(req, res, next) {
    try {
      const form = await fieldDataService.createForm(req.body, req.user.id);
      return created(res, form, 'Field form created successfully');
    } catch (err) {
      next(err);
    }
  }

  async submitFieldData(req, res, next) {
    try {
      const volId = req.user.volunteerId;
      if (!volId) return badRequest(res, 'Only registered community health volunteers can submit field data');
      const result = await fieldDataService.submitFieldData(req.body, volId);
      return created(res, result, 'Field data submitted successfully');
    } catch (err) {
      next(err);
    }
  }

  async syncOfflineBatch(req, res, next) {
    try {
      const volId = req.user.volunteerId;
      if (!volId) return badRequest(res, 'Volunteer profile required for synchronization');
      const { submissions } = req.body;
      if (!Array.isArray(submissions)) {
        return badRequest(res, 'Submissions array is required');
      }
      const result = await fieldDataService.syncOfflineBatch(submissions, volId);
      return success(res, result, 'Batch synchronization processed');
    } catch (err) {
      next(err);
    }
  }

  async getSubmissions(req, res, next) {
    try {
      const { campaignId, taskId, volunteerId, formId, reviewStatus, startDate, endDate, limit, offset } = req.query;
      const targetVolId = req.user.role === 'VOLUNTEER' ? req.user.volunteerId : volunteerId;

      const result = await fieldDataService.getSubmissions({
        campaignId,
        taskId,
        volunteerId: targetVolId,
        formId,
        reviewStatus,
        startDate,
        endDate,
        limit,
        offset
      });

      return success(res, result.submissions, 'Submissions retrieved', 200, {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      });
    } catch (err) {
      next(err);
    }
  }

  async getSubmissionById(req, res, next) {
    try {
      const sub = await fieldDataService.getSubmissionById(req.params.id);
      if (!sub) return notFound(res, 'Submission not found');
      return success(res, sub, 'Submission details');
    } catch (err) {
      next(err);
    }
  }

  async reviewSubmission(req, res, next) {
    try {
      const { reviewStatus, reviewComments } = req.body;
      if (!reviewStatus) return badRequest(res, 'Review status is required');
      const result = await fieldDataService.reviewSubmission(req.params.id, req.user.id, reviewStatus, reviewComments);
      return success(res, result, 'Submission reviewed');
    } catch (err) {
      next(err);
    }
  }

  async deleteSubmission(req, res, next) {
    try {
      const result = await fieldDataService.deleteSubmission(req.params.id, req.user.id);
      return success(res, result, 'Field submission deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FieldDataController();
