const db = require('../config/db');
const { uuid } = require('../utils/idGenerator');

async function logAudit({
  userId = null,
  userEmail = null,
  action,
  module,
  entityName,
  entityId = null,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null
}) {
  try {
    const id = uuid();
    const oldValJson = oldValues ? (typeof oldValues === 'string' ? oldValues : JSON.stringify(oldValues)) : null;
    const newValJson = newValues ? (typeof newValues === 'string' ? newValues : JSON.stringify(newValues)) : null;

    await db.execute(
      `INSERT INTO audit_logs (id, user_id, user_email, action, module, entity_name, entity_id, old_values, new_values, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [id, userId, userEmail, action, module, entityName, entityId, oldValJson, newValJson, ipAddress, userAgent]
    );
  } catch (err) {
    console.error('[AuditLogger] Failed to write audit record:', err.message);
  }
}

function auditMiddleware(action, module, entityName) {
  return (req, res, next) => {
    // Intercept response finish to log successful operations
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logAudit({
          userId: req.user ? req.user.id : null,
          userEmail: req.user ? req.user.email : 'system/anonymous',
          action,
          module,
          entityName,
          entityId: req.params.id || (req.body && req.body.id) || null,
          newValues: req.body ? req.body : null,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      }
    });
    next();
  };
}

module.exports = {
  logAudit,
  auditMiddleware
};
