const db = require('../config/db');
const { uuid, generateReportCode } = require('../utils/idGenerator');
const { logAudit } = require('../middleware/auditLogger');
const notificationService = require('./notificationService');

const { resolveLocation } = require('../utils/locationResolver');

class EmergencyService {
  /**
   * Submit emergency disease outbreak or severe health incident report
   */
  async reportEmergency(data, reporterUser = null) {
    const {
      emergencyType, emergency_type, severity = 'HIGH', description, suspectedCasesCount = 0, suspected_cases,
      regionId, region_id, regionName, region_name, districtId, district_id, districtName, district_name,
      location_name, locationName, communityName, community_name, latitude, longitude,
      reporterType = 'VOLUNTEER', reporter_type, reporterName, reporter_name, reporterPhone, reporter_phone
    } = data;

    const finalEmergencyType = emergencyType || emergency_type;
    const finalDescription = description;
    const finalSuspectedCases = suspectedCasesCount || suspected_cases || 0;
    const finalLocation = location_name || locationName || communityName || community_name || '';

    if (!finalEmergencyType || !finalDescription) {
      throw { status: 400, message: 'Emergency type and description are required' };
    }

    const { regionId: resolvedRegionId, districtId: resolvedDistrictId } = await resolveLocation({
      regionId: regionId || region_id,
      regionName: regionName || region_name,
      districtId: districtId || district_id,
      districtName: districtName || district_name || finalLocation
    });

    const id = uuid();
    const reportCode = generateReportCode('EMR');
    const reporterUserId = reporterUser ? reporterUser.id : null;
    const finalReporterName = reporterName || reporter_name || (reporterUser ? reporterUser.fullName : 'Anonymous Reporter');
    const finalReporterPhone = reporterPhone || reporter_phone || (reporterUser ? reporterUser.phone : null);
    const finalReporterType = reporterType || reporter_type || (reporterUser ? 'VOLUNTEER' : 'CITIZEN');

    await db.execute(
      `INSERT INTO emergency_reports (
        id, report_code, emergency_type, severity, description, suspected_cases_count,
        region_id, district_id, community_name, latitude, longitude, reporter_type,
        reporter_user_id, reporter_name, reporter_phone, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REPORTED', CURRENT_TIMESTAMP)`,
      [
        id, reportCode, finalEmergencyType, severity, finalDescription, parseInt(finalSuspectedCases, 10) || 0,
        resolvedRegionId, resolvedDistrictId, finalLocation || null, latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null,
        finalReporterType, reporterUserId, finalReporterName, finalReporterPhone
      ]
    );

    // If severity is CRITICAL or HIGH, notify all administrators immediately
    if (['CRITICAL', 'HIGH'].includes(severity)) {
      const admins = await db.query(
        `SELECT u.id, u.phone FROM users u 
         JOIN user_roles ur ON ur.user_id = u.id 
         JOIN roles r ON r.id = ur.role_id 
         WHERE r.name IN ('SUPER_ADMIN', 'ADMIN')`
      );

      for (const admin of admins) {
        await notificationService.createNotification({
          userId: admin.id,
          title: `DIGNIIN DEG DEG AH / CRITICAL OUTBREAK ALERT [${severity}]`,
          message: `Warbixin deg deg ah (${reportCode}): ${emergencyType} oo laga soo sheegay ${communityName || 'degmada'}. Kiisaska: ${suspectedCasesCount}.`,
          type: 'EMERGENCY_ALERT',
          actionUrl: `/admin/emergencies/${id}`,
          sendSms: severity === 'CRITICAL',
          phone: admin.phone
        });
      }
    }

    logAudit({
      userId: reporterUserId,
      userEmail: reporterUser ? reporterUser.email : null,
      action: 'EMERGENCY_REPORTED',
      module: 'EMERGENCIES',
      entityName: 'EmergencyReport',
      entityId: id,
      newValues: { reportCode, emergencyType, severity, suspectedCasesCount, regionId, districtId }
    });

    return {
      id,
      reportCode,
      severity,
      status: 'REPORTED',
      message: 'Emergency report logged. Regional response team alerted.'
    };
  }

  /**
   * List emergency reports
   */
  async getEmergencyReports({ severity, emergencyType, status, regionId, limit = 30, offset = 0 }) {
    let whereClauses = [];
    let params = [];

    if (severity) {
      whereClauses.push('e.severity = ?');
      params.push(severity);
    }

    if (emergencyType) {
      whereClauses.push('e.emergency_type = ?');
      params.push(emergencyType);
    }

    if (status) {
      whereClauses.push('e.status = ?');
      params.push(status);
    }

    if (regionId) {
      whereClauses.push('e.region_id = ?');
      params.push(regionId);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = await db.getOne(
      `SELECT COUNT(*) AS total FROM emergency_reports e ${whereStr}`,
      params
    );

    const rows = await db.query(
      `SELECT e.*, r.name AS region_name, d.name AS district_name, res.full_name AS resolved_by_name
       FROM emergency_reports e
       LEFT JOIN regions r ON r.id = e.region_id
       LEFT JOIN districts d ON d.id = e.district_id
       LEFT JOIN users res ON res.id = e.resolved_by
       ${whereStr}
       ORDER BY CASE e.severity 
                  WHEN 'CRITICAL' THEN 1 
                  WHEN 'HIGH' THEN 2 
                  WHEN 'MEDIUM' THEN 3 
                  ELSE 4 
                END, e.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    return {
      emergencies: rows,
      total: countRow ? countRow.total : 0,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    };
  }

  /**
   * Get emergency by ID
   */
  async getEmergencyById(id) {
    return await db.getOne(
      `SELECT e.*, r.name AS region_name, d.name AS district_name, res.full_name AS resolved_by_name
       FROM emergency_reports e
       LEFT JOIN regions r ON r.id = e.region_id
       LEFT JOIN districts d ON d.id = e.district_id
       LEFT JOIN users res ON res.id = e.resolved_by
       WHERE e.id = ? OR e.report_code = ?`,
      [id, id]
    );
  }

  /**
   * Update investigation status and actions taken
   */
  async updateEmergencyAction(id, actorId, { status, investigationNotes, actionTaken }) {
    const report = await this.getEmergencyById(id);
    if (!report) throw { status: 404, message: 'Emergency report not found' };

    let resolvedAt = null;
    let resolvedBy = null;
    if (['RESOLVED', 'FALSE_ALARM'].includes(status)) {
      resolvedAt = new Date().toISOString();
      resolvedBy = actorId;
    }

    await db.execute(
      `UPDATE emergency_reports 
       SET status = ?, investigation_notes = COALESCE(?, investigation_notes),
           action_taken = COALESCE(?, action_taken), resolved_by = COALESCE(?, resolved_by),
           resolved_at = COALESCE(?, resolved_at), updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, investigationNotes || null, actionTaken || null, resolvedBy, resolvedAt, report.id]
    );

    logAudit({
      userId: actorId,
      action: 'EMERGENCY_STATUS_UPDATED',
      module: 'EMERGENCIES',
      entityName: 'EmergencyReport',
      entityId: report.id,
      newValues: { status, investigationNotes, actionTaken }
    });

    return await this.getEmergencyById(report.id);
  }

  /**
   * Delete emergency report
   */
  async deleteEmergency(id, actorId) {
    const report = await this.getEmergencyById(id);
    if (!report) throw { status: 404, message: 'Emergency report not found' };

    await db.execute(`DELETE FROM emergency_reports WHERE id = ?`, [report.id]);

    logAudit({
      userId: actorId,
      action: 'EMERGENCY_DELETED',
      module: 'EMERGENCIES',
      entityName: 'EmergencyReport',
      entityId: report.id
    });

    return { success: true, message: 'Emergency report deleted successfully' };
  }
}

module.exports = new EmergencyService();
