const db = require('../config/db');

class AuditService {
  /**
   * Query immutable audit trail
   */
  async getAuditLogs({ module, action, userId, startDate, endDate, limit = 50, offset = 0 }) {
    let whereClauses = [];
    let params = [];

    if (module) {
      whereClauses.push('module = ?');
      params.push(module);
    }

    if (action) {
      whereClauses.push('action = ?');
      params.push(action);
    }

    if (userId) {
      whereClauses.push('user_id = ?');
      params.push(userId);
    }

    if (startDate) {
      whereClauses.push('created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push('created_at <= ?');
      params.push(endDate);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = await db.getOne(
      `SELECT COUNT(*) AS total FROM audit_logs ${whereStr}`,
      params
    );

    const rows = await db.query(
      `SELECT * FROM audit_logs ${whereStr} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    const parsed = rows.map(r => ({
      ...r,
      old_values: typeof r.old_values === 'string' ? JSON.parse(r.old_values) : r.old_values,
      new_values: typeof r.new_values === 'string' ? JSON.parse(r.new_values) : r.new_values
    }));

    return {
      logs: parsed,
      total: countRow ? countRow.total : 0,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    };
  }
}

module.exports = new AuditService();
