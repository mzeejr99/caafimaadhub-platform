const db = require('../config/db');

function formatAuditDetails(row, newVals, oldVals) {
  const action = row.action || '';
  const entity = row.entity_name || 'Record';

  if (action === 'USER_LOGIN') {
    return `User logged into system portal (${row.user_email || row.user_name || 'Active session'})`;
  }
  if (action === 'USER_LOGOUT') {
    return `User logged out of system session`;
  }
  if (action === 'VOLUNTEER_REGISTERED' || action === 'PUBLIC_USER_REGISTERED') {
    return `New volunteer account registered (${row.user_email || 'Pending review'})`;
  }
  if (action === 'USER_APPROVED') {
    return `Volunteer or staff account approved for field operations`;
  }
  if (action === 'USER_CREATED') {
    const email = newVals?.email ? ` (${newVals.email})` : '';
    return `Created new user account${email}`;
  }
  if (action === 'USER_UPDATED') {
    const keys = newVals ? Object.keys(newVals).filter(k => !['password', 'password_hash'].includes(k)).join(', ') : '';
    return `Updated user profile attributes${keys ? `: ${keys}` : ''}`;
  }
  if (action === 'USER_DELETED') {
    return `Permanently removed user account (#${row.entity_id})`;
  }
  if (action === 'EMERGENCY_REPORTED') {
    const type = newVals?.emergencyType || newVals?.type || 'Outbreak';
    const cases = newVals?.suspectedCasesCount ? ` with ${newVals.suspectedCasesCount} suspected cases` : '';
    return `Reported emergency alert: ${type}${cases}`;
  }
  if (action === 'EMERGENCY_DELETED') {
    return `Removed emergency incident report (#${row.entity_id})`;
  }
  if (action === 'CAMPAIGN_CREATED') {
    const name = newVals?.name || newVals?.title || row.entity_id;
    return `Created health campaign: "${name}"`;
  }
  if (action === 'CAMPAIGN_DELETED') {
    return `Removed health campaign (#${row.entity_id})`;
  }
  if (action === 'TASK_CREATED') {
    const title = newVals?.title ? ` "${newVals.title}"` : '';
    return `Assigned community health task${title}`;
  }
  if (action === 'TASK_UPDATED') {
    return `Updated field task progress or details (#${row.entity_id})`;
  }
  if (action === 'CERTIFICATE_ISSUED_BY_ADMIN') {
    return `Issued accredited training completion certificate (#${row.entity_id})`;
  }
  if (action === 'INVENTORY_VOLUNTEER_ISSUE') {
    const qty = newVals?.quantity ? ` (${newVals.quantity} units)` : '';
    return `Dispatched medical supply to field volunteer${qty}`;
  }

  if (newVals && typeof newVals === 'object' && Object.keys(newVals).length > 0) {
    const summary = Object.entries(newVals)
      .filter(([k]) => !['password', 'password_hash', 'token'].includes(k))
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    return summary ? `${action}: ${summary}` : `${action} on ${entity}`;
  }

  return `${action} performed on ${entity}`;
}

class AuditService {
  /**
   * Query immutable audit trail with actor details, role info, and human-readable context
   */
  async getAuditLogs({ module, action, userId, search, startDate, endDate, limit = 100, offset = 0 }) {
    let whereClauses = [];
    let params = [];

    if (module && module !== 'ALL') {
      whereClauses.push('al.module = ?');
      params.push(module);
    }

    if (action && action !== 'ALL') {
      whereClauses.push('al.action = ?');
      params.push(action);
    }

    if (userId) {
      whereClauses.push('al.user_id = ?');
      params.push(userId);
    }

    if (startDate) {
      whereClauses.push('al.created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push('al.created_at <= ?');
      params.push(endDate);
    }

    if (search && search.trim()) {
      whereClauses.push('(al.action LIKE ? OR al.module LIKE ? OR al.user_email LIKE ? OR u.full_name LIKE ? OR al.entity_id LIKE ? OR al.entity_name LIKE ?)');
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s, s, s);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = await db.getOne(
      `SELECT COUNT(*) AS total 
       FROM audit_logs al 
       LEFT JOIN users u ON al.user_id = u.id 
       ${whereStr}`,
      params
    );

    const rows = await db.query(
      `SELECT 
        al.*,
        COALESCE(u.full_name, al.user_email, 'System') AS user_name,
        COALESCE(al.user_email, u.email) AS user_email,
        r.display_name AS user_role,
        al.entity_name AS entity_type
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       ${whereStr} 
       ORDER BY al.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    const parsed = rows.map(r => {
      let parsedOld = null;
      let parsedNew = null;
      try {
        parsedOld = typeof r.old_values === 'string' ? JSON.parse(r.old_values) : r.old_values;
      } catch (e) {
        parsedOld = r.old_values;
      }
      try {
        parsedNew = typeof r.new_values === 'string' ? JSON.parse(r.new_values) : r.new_values;
      } catch (e) {
        parsedNew = r.new_values;
      }

      return {
        ...r,
        old_values: parsedOld,
        new_values: parsedNew,
        details: formatAuditDetails(r, parsedNew, parsedOld),
        ip_address: r.ip_address === '::1' ? '127.0.0.1 (Localhost)' : r.ip_address
      };
    });

    return {
      logs: parsed,
      total: countRow ? countRow.total : 0,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    };
  }

  async clearAuditLogs() {
    await db.execute('DELETE FROM audit_logs');
    return { cleared: true };
  }
}

module.exports = new AuditService();
