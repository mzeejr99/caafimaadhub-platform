const feedbackService = require('../services/feedbackService');
const { success, created, badRequest } = require('../utils/response');

class FeedbackController {
  async submitFeedback(req, res, next) {
    try {
      const result = await feedbackService.submitFeedback(req.body);
      return created(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  async getFeedbackList(req, res, next) {
    try {
      const { category, status, regionId, districtId, limit, offset } = req.query;
      const result = await feedbackService.getFeedbackList({
        category,
        status,
        regionId,
        districtId,
        limit,
        offset
      });
      return success(res, result.feedback, 'Feedback retrieved', 200, {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      });
    } catch (err) {
      next(err);
    }
  }

  async updateFeedbackStatus(req, res, next) {
    try {
      const { status, adminNotes } = req.body;
      if (!status) return badRequest(res, 'Status is required');
      const result = await feedbackService.updateFeedbackStatus(req.params.id, req.user.id, status, adminNotes);
      return success(res, result, 'Feedback updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteFeedback(req, res, next) {
    try {
      const result = await feedbackService.deleteFeedback(req.params.id, req.user.id);
      return success(res, result, 'Feedback deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FeedbackController();
