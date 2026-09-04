const auditService = require('../services/auditService');
const { success } = require('../utils/response');

class AuditController {
  async getAuditLogs(req, res, next) {
    try {
      const { module, action, userId, startDate, endDate, limit, offset } = req.query;
      const result = await auditService.getAuditLogs({
        module,
        action,
        userId,
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
}

module.exports = new AuditController();
