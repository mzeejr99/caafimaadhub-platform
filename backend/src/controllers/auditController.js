const auditService = require('../services/auditService');
const { success } = require('../utils/response');

class AuditController {
  async getAuditLogs(req, res, next) {
    try {
      const { module, action, userId, search, startDate, endDate, limit, offset } = req.query;
      const result = await auditService.getAuditLogs({
        module,
        action,
        userId,
        search,
        startDate,
        endDate,
        limit,
        offset
      });
      return success(res, result.logs, 'Audit logs retrieved', 200, {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      });
    } catch (err) {
      next(err);
    }
  }

  async clearAuditLogs(req, res, next) {
    try {
      await auditService.clearAuditLogs();
      return success(res, { cleared: true }, 'All audit logs have been successfully cleared');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuditController();
