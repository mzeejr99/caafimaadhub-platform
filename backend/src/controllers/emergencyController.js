const emergencyService = require('../services/emergencyService');
const { success, created, notFound, badRequest } = require('../utils/response');

class EmergencyController {
  async reportEmergency(req, res, next) {
    try {
      const result = await emergencyService.reportEmergency(req.body, req.user);
      return created(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  async getEmergencyReports(req, res, next) {
    try {
      const { severity, emergencyType, status, regionId, limit, offset } = req.query;
      const result = await emergencyService.getEmergencyReports({
        severity,
        emergencyType,
        status,
        regionId,
        limit,
        offset
      });
      return success(res, result.emergencies, 'Emergency reports retrieved', 200, {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      });
    } catch (err) {
      next(err);
    }
  }

  async getEmergencyById(req, res, next) {
    try {
      const report = await emergencyService.getEmergencyById(req.params.id);
      if (!report) return notFound(res, 'Emergency report not found');
      return success(res, report, 'Emergency report details');
    } catch (err) {
      next(err);
    }
  }

  async updateEmergencyAction(req, res, next) {
    try {
      const result = await emergencyService.updateEmergencyAction(req.params.id, req.user.id, req.body);
      return success(res, result, 'Emergency action updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteEmergency(req, res, next) {
    try {
      const result = await emergencyService.deleteEmergency(req.params.id, req.user.id);
      return success(res, result, 'Emergency report deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new EmergencyController();
