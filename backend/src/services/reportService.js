const db = require('../config/db');

class ReportService {
  /**
   * Convert array of JSON objects to CSV string
   */
  jsonToCsv(data) {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) return '""';
        if (typeof val === 'object') val = JSON.stringify(val);
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\r\n');
  }

  /**
   * Generate Volunteer Report
   */
  async getVolunteersReport({ regionId, status }) {
    let whereClauses = [];
    let params = [];
    if (regionId) {
      whereClauses.push('v.region_id = ?');
      params.push(regionId);
    }
    if (status) {
      whereClauses.push('v.status = ?');
      params.push(status);
    }
    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    return await db.query(
      `SELECT v.volunteer_id, u.full_name, u.email, u.phone, v.gender,
              v.date_of_birth, r.name AS region, d.name AS district, v.village_name,
              v.education_level, v.availability_status, v.status, v.registration_date,
              (SELECT COUNT(*) FROM task_assignments ta WHERE ta.volunteer_id = v.id AND ta.status = 'COMPLETED') AS completed_tasks_count,
              (SELECT COUNT(*) FROM field_submissions fs WHERE fs.volunteer_id = v.id) AS field_submissions_count,
              (SELECT COUNT(*) FROM certificates c WHERE c.volunteer_id = v.id) AS certificates_count
       FROM volunteers v
       JOIN users u ON u.id = v.user_id
       LEFT JOIN regions r ON r.id = v.region_id
       LEFT JOIN districts d ON d.id = v.district_id
       ${whereStr}
       ORDER BY v.registration_date DESC`,
      params
    );
  }

  /**
   * Generate Campaign Report
   */
  async getCampaignsReport({ type, status }) {
    let whereClauses = [];
    let params = [];
    if (type) {
      whereClauses.push('c.type = ?');
      params.push(type);
    }
    if (status) {
      whereClauses.push('c.status = ?');
      params.push(status);
    }
    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    return await db.query(
      `SELECT c.code, c.name, c.type, c.status, c.priority, c.start_date, c.end_date,
              r.name AS region, d.name AS district, c.target_population, c.budget, c.currency,
              (SELECT COUNT(*) FROM campaign_volunteers cv WHERE cv.campaign_id = c.id) AS assigned_volunteers,
              (SELECT COUNT(*) FROM tasks t WHERE t.campaign_id = c.id) AS total_tasks,
              (SELECT COUNT(*) FROM tasks t WHERE t.campaign_id = c.id AND t.status = 'COMPLETED') AS completed_tasks,
              (SELECT COUNT(*) FROM field_submissions fs WHERE fs.campaign_id = c.id) AS total_field_reports
       FROM campaigns c
       LEFT JOIN regions r ON r.id = c.region_id
       LEFT JOIN districts d ON d.id = c.district_id
       ${whereStr}
       ORDER BY c.start_date DESC`,
      params
    );
  }

  /**
   * Generate Field Activity & Submissions Report
   */
  async getFieldActivityReport({ campaignId, formId, startDate, endDate }) {
    let whereClauses = [];
    let params = [];
    if (campaignId) {
      whereClauses.push('fs.campaign_id = ?');
      params.push(campaignId);
    }
    if (formId) {
      whereClauses.push('fs.field_form_id = ?');
      params.push(formId);
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

    return await db.query(
      `SELECT fs.id, fs.submission_datetime, ff.title AS form_type, ff.category,
              c.name AS campaign, t.title AS task_title, v.volunteer_id AS chv_id,
              u.full_name AS chv_name, fs.latitude, fs.longitude, fs.accuracy_meters,
              fs.review_status, fs.sync_status, fs.payload_data
       FROM field_submissions fs
       JOIN field_forms ff ON ff.id = fs.field_form_id
       JOIN volunteers v ON v.id = fs.volunteer_id
       JOIN users u ON u.id = v.user_id
       LEFT JOIN campaigns c ON c.id = fs.campaign_id
       LEFT JOIN tasks t ON t.id = fs.task_id
       ${whereStr}
       ORDER BY fs.submission_datetime DESC`,
      params
    );
  }

  /**
   * Generate Inventory Stock Report
   */
  async getInventoryReport({ category, isLowStock }) {
    let whereClauses = [];
    let params = [];
    if (category) {
      whereClauses.push('i.category = ?');
      params.push(category);
    }
    if (isLowStock) {
      whereClauses.push('i.quantity_on_hand <= i.minimum_stock_level');
    }
    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    return await db.query(
      `SELECT i.item_code, i.name, i.category, i.unit_of_measure, i.quantity_on_hand,
              i.minimum_stock_level, i.batch_number, i.expiry_date, i.supplier_name,
              i.unit_cost, loc.name AS storage_location
       FROM inventory_items i
       LEFT JOIN inventory_locations loc ON loc.id = i.location_id
       ${whereStr}
       ORDER BY i.category, i.name`,
      params
    );
  }
}

module.exports = new ReportService();
