const db = require('../config/db');
const { uuid, generateTicketNumber } = require('../utils/idGenerator');
const { logAudit } = require('../middleware/auditLogger');

const { resolveLocation } = require('../utils/locationResolver');

class FeedbackService {
  /**
   * Submit community feedback (public or authenticated)
   */
  async submitFeedback(data) {
    const {
      category = 'FEEDBACK', description, regionId, region_id, regionName, region_name,
      districtId, district_id, districtName, district_name,
      locationName, location_name, reporterName, reporter_name, reporterPhone, reporter_phone, reporterEmail, reporter_email
    } = data;

    if (!description || !description.trim()) {
      throw { status: 400, message: 'Feedback description is required' };
    }

    let resolvedRegionId = null;
    let resolvedDistrictId = null;

    if (regionId || region_id || regionName || region_name || districtId || district_id || districtName || district_name) {
      const loc = await resolveLocation({
        regionId: regionId || region_id,
        regionName: regionName || region_name,
        districtId: districtId || district_id,
        districtName: districtName || district_name || locationName || location_name
      });
      resolvedRegionId = loc.regionId;
      resolvedDistrictId = loc.districtId;
    }

    const id = uuid();
    const ticketNumber = generateTicketNumber('TCK');

    await db.execute(
      `INSERT INTO feedback (
        id, ticket_number, category, description, region_id, district_id,
        location_name, reporter_name, reporter_phone, reporter_email, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', CURRENT_TIMESTAMP)`,
      [
        id, ticketNumber, category, description.trim(), resolvedRegionId,
        resolvedDistrictId, locationName || location_name || null, reporterName || reporter_name || 'Anonymous',
        reporterPhone || reporter_phone || null, reporterEmail || reporter_email || null
      ]
    );

    return {
      id,
      ticketNumber,
      status: 'NEW',
      message: 'Mahadsanid! Aragtidaada waa la helay. / Thank you! Your feedback has been received.'
    };
  }

  /**
   * List feedback tickets for administration
   */
  async getFeedbackList({ category, status, regionId, districtId, limit = 30, offset = 0 }) {
    let whereClauses = [];
    let params = [];

    if (category) {
      whereClauses.push('f.category = ?');
      params.push(category);
    }

    if (status) {
      whereClauses.push('f.status = ?');
      params.push(status);
    }

    if (regionId) {
      whereClauses.push('f.region_id = ?');
      params.push(regionId);
    }

    if (districtId) {
      whereClauses.push('f.district_id = ?');
      params.push(districtId);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = await db.getOne(
      `SELECT COUNT(*) AS total FROM feedback f ${whereStr}`,
      params
    );

    const rows = await db.query(
      `SELECT f.*, r.name AS region_name, d.name AS district_name, res.full_name AS resolved_by_name
       FROM feedback f
       LEFT JOIN regions r ON r.id = f.region_id
       LEFT JOIN districts d ON d.id = f.district_id
       LEFT JOIN users res ON res.id = f.resolved_by
       ${whereStr}
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    return {
      feedback: rows,
      total: countRow ? countRow.total : 0,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    };
  }

  /**
   * Update feedback ticket status & admin notes
   */
  async updateFeedbackStatus(id, reviewerId, status, adminNotes = null) {
    const item = await db.getOne(`SELECT * FROM feedback WHERE id = ?`, [id]);
    if (!item) throw { status: 404, message: 'Feedback ticket not found' };

    let resolvedAt = null;
    let resolvedBy = null;
    if (['RESOLVED', 'CLOSED', 'REJECTED'].includes(status)) {
      resolvedAt = new Date().toISOString();
      resolvedBy = reviewerId;
    }

    await db.execute(
      `UPDATE feedback 
       SET status = ?, admin_notes = ?, resolved_by = COALESCE(?, resolved_by),
           resolved_at = COALESCE(?, resolved_at), updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, adminNotes, resolvedBy, resolvedAt, item.id]
    );

    logAudit({
      userId: reviewerId,
      action: 'FEEDBACK_STATUS_UPDATED',
      module: 'FEEDBACK',
      entityName: 'Feedback',
      entityId: item.id,
      newValues: { status, adminNotes }
    });

    return { success: true, ticketId: item.id, status };
  }

  /**
   * Delete feedback ticket
   */
  async deleteFeedback(id, actorId) {
    const item = await db.getOne(`SELECT * FROM feedback WHERE id = ?`, [id]);
    if (!item) throw { status: 404, message: 'Feedback ticket not found' };

    await db.execute(`DELETE FROM feedback WHERE id = ?`, [item.id]);

    logAudit({
      userId: actorId,
      action: 'FEEDBACK_DELETED',
      module: 'FEEDBACK',
      entityName: 'Feedback',
      entityId: item.id
    });

    return { success: true, message: 'Feedback ticket deleted successfully' };
  }
}

module.exports = new FeedbackService();
