const analyticsService = require('../services/analyticsService');
const { success } = require('../utils/response');

class AnalyticsController {
  async getSuperAdminDashboard(req, res, next) {
    try {
      const data = await analyticsService.getSuperAdminDashboard();
      return success(res, data, 'Super Admin metrics');
    } catch (err) {
      next(err);
    }
  }

  async getAdminDashboard(req, res, next) {
    try {
      const data = await analyticsService.getAdminDashboard(req.scopedRegionId || req.query.regionId);
      return success(res, data, 'Admin operations metrics');
    } catch (err) {
      next(err);
    }
  }

  async getDetailedAnalytics(req, res, next) {
    try {
      const { dateRange, regionId } = req.query;
      const data = await analyticsService.getDetailedAnalytics({
        dateRange,
        regionId: req.scopedRegionId || regionId
      });
      return success(res, data, 'Detailed analytics trends');
    } catch (err) {
      next(err);
    }
  }

  async getPublicStats(req, res, next) {
    try {
      const stats = await analyticsService.getPublicStats();
      return success(res, stats, 'Public health statistics');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AnalyticsController();
