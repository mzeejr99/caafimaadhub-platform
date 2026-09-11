const db = require('../config/db');
const { uuid } = require('../utils/idGenerator');
const { logAudit } = require('../middleware/auditLogger');
const notificationService = require('./notificationService');

class FieldDataService {
  /**
   * Get all active field forms
   */
  async getForms(category = null) {
    let sql = `SELECT * FROM field_forms WHERE is_active = 1`;
    const params = [];
    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }
    sql += ` ORDER BY category, title`;

    const forms = await db.query(sql, params);
    return forms.map(f => ({
      ...f,
      schema_json: typeof f.schema_json === 'string' ? JSON.parse(f.schema_json) : f.schema_json
    }));
  }

  /**
   * Get form by ID
   */
  async getFormById(id) {
    const form = await db.getOne(`SELECT * FROM field_forms WHERE id = ? OR code = ?`, [id, id]);
    if (!form) return null;

    form.schema_json = typeof form.schema_json === 'string' ? JSON.parse(form.schema_json) : form.schema_json;
    return form;
  }

  /**
   * Create dynamic field form
   */
  async createForm(data, creatorId) {
    const { title, code, category, description, schemaJson } = data;
    const id = uuid();
    const formCode = code || `FORM-${category.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const schemaStr = typeof schemaJson === 'object' ? JSON.stringify(schemaJson) : schemaJson;

    await db.execute(
      `INSERT INTO field_forms (id, title, code, category, description, schema_json, is_active, version, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, CURRENT_TIMESTAMP)`,
      [id, title, formCode, category, description || null, schemaStr, creatorId]
    );

    return await this.getFormById(id);
  }

  /**
   * Ingest single field submission
   */
  async submitFieldData(data, volunteerId) {
    const rawFormId = data.fieldFormId || data.field_form_id || data.formId || data.form_id;
    let payloadData = data.payloadData || data.payload_data || data.data || data.formData || data.form_data || data;

    if (!payloadData || (typeof payloadData === 'object' && Object.keys(payloadData).length === 0)) {
      throw { status: 400, message: 'Field form ID and form payload data are required' };
    }

    // Resolve real form ID from field_forms table if possible
    let form = null;
    if (rawFormId && rawFormId !== 1 && rawFormId !== '1') {
      form = await db.getOne('SELECT id FROM field_forms WHERE id = ? OR code = ?', [rawFormId, rawFormId]);
    }
    if (!form) {
      form = await db.getOne('SELECT id FROM field_forms WHERE is_active = 1 LIMIT 1');
    }
    const fieldFormId = form ? form.id : (rawFormId || 'form-core-01');

    const localId = data.localId || data.local_id || null;
    const taskId = data.taskId || data.task_id || null;
    const campaignId = data.campaignId || data.campaign_id || null;
    const latitude = data.latitude !== undefined ? data.latitude : null;
    const longitude = data.longitude !== undefined ? data.longitude : null;
    const accuracyMeters = data.accuracyMeters || data.accuracy || data.accuracy_meters || null;
    const locationDescription = data.locationDescription || data.location_description || null;
    const submissionDatetime = data.submissionDatetime || data.submission_datetime || null;

    // Resolve campaign ID if provided
    let effectiveCampaignId = campaignId;
    if (campaignId) {
      const camp = await db.getOne('SELECT id FROM campaigns WHERE id = ? OR code = ?', [campaignId, campaignId]);
      effectiveCampaignId = camp ? camp.id : null;
    }

    // Resolve task ID if provided
    let effectiveTaskId = taskId;
    if (taskId) {
      const t = await db.getOne('SELECT id FROM tasks WHERE id = ?', [taskId]);
      effectiveTaskId = t ? t.id : null;
    }

    // Resolve volunteer ID (user_id -> volunteers.id)
    let effectiveVolunteerId = volunteerId;
    let vol = await db.getOne('SELECT id FROM volunteers WHERE id = ? OR user_id = ?', [volunteerId, volunteerId]);
    if (!vol && volunteerId) {
      const volId = uuid();
      const volCode = `VOL-${Date.now().toString().slice(-6)}`;
      await db.execute(
        `INSERT INTO volunteers (
          id, user_id, volunteer_id, gender, region_id, district_id,
          availability_status, status, profile_completed, registration_date
        ) VALUES (?, ?, ?, 'OTHER', 'reg-banadir', 'dist-hodan', 'AVAILABLE', 'ACTIVE', 1, CURRENT_TIMESTAMP)`,
        [volId, volunteerId, volCode]
      ).catch(() => {});
      vol = await db.getOne('SELECT id FROM volunteers WHERE id = ? OR user_id = ?', [volunteerId, volunteerId]);
    }
    if (vol) {
      effectiveVolunteerId = vol.id;
    }

    // Check duplicate local_id if sent from PWA sync
    if (localId) {
      const existing = await db.getOne(
        `SELECT id, review_status, sync_status FROM field_submissions WHERE local_id = ? AND volunteer_id = ?`,
        [localId, effectiveVolunteerId]
      );
      if (existing) {
        return {
          id: existing.id,
          localId,
          syncStatus: 'SYNCED',
          reviewStatus: existing.review_status,
          message: 'Already synchronized (duplicate local_id ignored)'
        };
      }
    }

    const id = uuid();
    const subTime = submissionDatetime || new Date().toISOString();
    const payloadStr = typeof payloadData === 'object' ? JSON.stringify(payloadData) : payloadData;
    const payloadObj = typeof payloadData === 'string' ? JSON.parse(payloadData) : payloadData;

    // Calculate dynamic summary metrics for analytics
    const summary = {};
    if (payloadObj.vaccine_type) summary.vaccineType = payloadObj.vaccine_type;
    if (payloadObj.dose_number) summary.doseNumber = payloadObj.dose_number;
    if (payloadObj.is_zero_dose !== undefined) summary.isZeroDose = payloadObj.is_zero_dose;
    if (payloadObj.rdt_positive !== undefined) summary.rdtPositive = Number(payloadObj.rdt_positive) || 0;
    if (payloadObj.nets_distributed !== undefined) summary.netsDistributed = Number(payloadObj.nets_distributed) || 0;
    if (payloadObj.nutritional_status) summary.nutritionalStatus = payloadObj.nutritional_status;
    if (payloadObj.muac_measurement_mm) summary.muacMm = Number(payloadObj.muac_measurement_mm);
    if (payloadObj.rutf_sachets_given !== undefined) summary.rutfGiven = Number(payloadObj.rutf_sachets_given) || 0;

    await db.execute(
      `INSERT INTO field_submissions (
        id, local_id, volunteer_id, task_id, campaign_id, field_form_id,
        submission_datetime, latitude, longitude, accuracy_meters, location_description,
        payload_data, summary_metrics, sync_status, review_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SYNCED', 'PENDING', CURRENT_TIMESTAMP)`,
      [
        id, localId || null, effectiveVolunteerId, effectiveTaskId, effectiveCampaignId, fieldFormId,
        subTime, latitude || null, longitude || null, accuracyMeters || null, locationDescription || null,
        payloadStr, JSON.stringify(summary)
      ]
    );

    // If linked to a task, update task assignment status to SUBMITTED
    if (effectiveTaskId) {
      await db.execute(
        `UPDATE task_assignments SET status = 'SUBMITTED', completed_at = CURRENT_TIMESTAMP WHERE task_id = ? AND volunteer_id = ?`,
        [effectiveTaskId, effectiveVolunteerId]
      );
      await db.execute(
        `UPDATE tasks SET status = 'SUBMITTED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [effectiveTaskId]
      );
    }

    // Real-time admin notification for new field report
    try {
      const adminUsers = await db.query(
        `SELECT DISTINCT u.id FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id
         WHERE r.name IN ('SUPER_ADMIN', 'ADMIN') OR u.role IN ('Superadmin', 'Admin')`
      );
      const householdName = payloadObj.householdHead || payloadObj.household_head || payloadObj.head_of_household || 'Qoys Cusub';
      for (const adm of adminUsers) {
        await notificationService.createNotification({
          userId: adm.id,
          title: 'Warbixin Cusub oo Goobta ah / New Field Report',
          message: `Warbixin cusub ayaa laga soo xareeyay: ${householdName}.`,
          type: 'FIELD_REPORT_SUBMITTED',
          actionUrl: `/admin/field-data`
        });
      }
    } catch (notifErr) {
      console.warn('[FieldDataService] Notification warning:', notifErr.message);
    }

    return {
      id,
      localId: localId || id,
      syncStatus: 'SYNCED',
      reviewStatus: 'PENDING',
      submittedAt: subTime
    };
  }

  /**
   * Batch synchronization endpoint for offline PWA
   */
  async syncOfflineBatch(submissions = [], volunteerId) {
    const results = {
      total: submissions.length,
      synced: 0,
      failed: 0,
      items: []
    };

    for (const item of submissions) {
      try {
        const res = await this.submitFieldData(item, volunteerId);
        results.synced++;
        results.items.push({
          localId: item.localId || item.id,
          serverId: res.id,
          status: 'SYNCED',
          message: 'Synchronized successfully'
        });
      } catch (err) {
        results.failed++;
        results.items.push({
          localId: item.localId || item.id,
          status: 'FAILED',
          error: err.message
        });
      }
    }

    return results;
  }

  /**
   * Get field submissions with filtering & pagination
   */
  async getSubmissions({ campaignId, taskId, volunteerId, formId, reviewStatus, startDate, endDate, limit = 25, offset = 0 }) {
    let whereClauses = [];
    let params = [];

    if (campaignId) {
      whereClauses.push('fs.campaign_id = ?');
      params.push(campaignId);
    }

    if (taskId) {
      whereClauses.push('fs.task_id = ?');
      params.push(taskId);
    }

    if (volunteerId) {
      whereClauses.push('fs.volunteer_id = ?');
      params.push(volunteerId);
    }

    if (formId) {
      whereClauses.push('fs.field_form_id = ?');
      params.push(formId);
    }

    if (reviewStatus) {
      whereClauses.push('fs.review_status = ?');
      params.push(reviewStatus);
    }

    if (startDate) {
      whereClauses.push('fs.submission_datetime >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push('fs.submission_datetime <= ?');
      params.push(endDate);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = await db.getOne(
      `SELECT COUNT(*) AS total FROM field_submissions fs ${whereStr}`,
      params
    );

    const rows = await db.query(
      `SELECT fs.*, ff.title AS form_title, ff.category AS form_category,
              c.name AS campaign_name, t.title AS task_title,
              v.volunteer_id AS volunteer_code, u.full_name AS volunteer_name,
              rev.full_name AS reviewer_name
       FROM field_submissions fs
       JOIN field_forms ff ON ff.id = fs.field_form_id
       JOIN volunteers v ON v.id = fs.volunteer_id
       JOIN users u ON u.id = v.user_id
       LEFT JOIN campaigns c ON c.id = fs.campaign_id
       LEFT JOIN tasks t ON t.id = fs.task_id
       LEFT JOIN users rev ON rev.id = fs.reviewed_by
       ${whereStr}
       ORDER BY fs.submission_datetime DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    const processed = rows.map(r => ({
      ...r,
      payload_data: typeof r.payload_data === 'string' ? JSON.parse(r.payload_data) : r.payload_data,
      summary_metrics: typeof r.summary_metrics === 'string' ? JSON.parse(r.summary_metrics) : r.summary_metrics
    }));

    return {
      submissions: processed,
      total: countRow ? countRow.total : 0,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    };
  }

  /**
   * Get single submission by ID
   */
  async getSubmissionById(id) {
    const sub = await db.getOne(
      `SELECT fs.*, ff.title AS form_title, ff.category AS form_category, ff.schema_json AS form_schema,
              c.name AS campaign_name, t.title AS task_title,
              v.volunteer_id AS volunteer_code, u.full_name AS volunteer_name, u.phone AS volunteer_phone,
              rev.full_name AS reviewer_name
       FROM field_submissions fs
       JOIN field_forms ff ON ff.id = fs.field_form_id
       JOIN volunteers v ON v.id = fs.volunteer_id
       JOIN users u ON u.id = v.user_id
       LEFT JOIN campaigns c ON c.id = fs.campaign_id
       LEFT JOIN tasks t ON t.id = fs.task_id
       LEFT JOIN users rev ON rev.id = fs.reviewed_by
       WHERE fs.id = ?`,
      [id]
    );

    if (!sub) return null;

    sub.payload_data = typeof sub.payload_data === 'string' ? JSON.parse(sub.payload_data) : sub.payload_data;
    sub.summary_metrics = typeof sub.summary_metrics === 'string' ? JSON.parse(sub.summary_metrics) : sub.summary_metrics;
    sub.form_schema = typeof sub.form_schema === 'string' ? JSON.parse(sub.form_schema) : sub.form_schema;

    return sub;
  }

  /**
   * Review field data submission (Approve / Reject)
   */
  async reviewSubmission(id, reviewerId, reviewStatus, reviewComments = null) {
    const sub = await this.getSubmissionById(id);
    if (!sub) throw { status: 404, message: 'Submission not found' };

    await db.execute(
      `UPDATE field_submissions 
       SET review_status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, review_comments = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [reviewStatus, reviewerId, reviewComments, sub.id]
    );

    // If approved and linked to a task, finalize task status
    if (reviewStatus === 'APPROVED' && sub.task_id) {
      await db.execute(
        `UPDATE tasks SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [sub.task_id]
      );
      await db.execute(
        `UPDATE task_assignments SET status = 'COMPLETED' WHERE task_id = ? AND volunteer_id = ?`,
        [sub.task_id, sub.volunteer_id]
      );
    }

    // Notify volunteer
    const vol = await db.getOne(`SELECT v.user_id, u.phone FROM volunteers v JOIN users u ON u.id = v.user_id WHERE v.id = ?`, [sub.volunteer_id]);
    if (vol) {
      const isApproved = reviewStatus === 'APPROVED';
      await notificationService.createNotification({
        userId: vol.user_id,
        title: isApproved ? 'Warbixintaada Goobta waa la ansixiyay' : 'Dib u eegis Warbixinta Goobta',
        message: isApproved 
          ? `Warbixintaadii (${sub.form_title}) waa la ansixiyay. Mahadsanid!`
          : `Warbixintaadii (${sub.form_title}) waxay u baahan tahay sixitaan: ${reviewComments || 'Fadlan la xiriir kormeerahaaga'}`,
        type: 'REPORT_STATUS',
        actionUrl: `/volunteer/field-data/${sub.id}`
      });
    }

    logAudit({
      userId: reviewerId,
      action: `FIELD_DATA_${reviewStatus}`,
      module: 'FIELD_DATA',
      entityName: 'FieldSubmission',
      entityId: sub.id,
      newValues: { reviewStatus, reviewComments }
    });

    return { success: true, submissionId: sub.id, reviewStatus };
  }

  /**
   * Delete field data submission
   */
  async deleteSubmission(id, actorId) {
    const sub = await this.getSubmissionById(id);
    if (!sub) throw { status: 404, message: 'Submission not found' };

    await db.execute(`DELETE FROM attachments WHERE entity_id = ?`, [sub.id]);
    await db.execute(`DELETE FROM field_submissions WHERE id = ?`, [sub.id]);

    logAudit({
      userId: actorId,
      action: 'FIELD_DATA_DELETED',
      module: 'FIELD_DATA',
      entityName: 'FieldSubmission',
      entityId: sub.id
    });

    return { success: true, message: 'Field submission deleted successfully' };
  }
}

module.exports = new FieldDataService();
