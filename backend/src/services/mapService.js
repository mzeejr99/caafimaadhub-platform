const db = require('../config/db');

class MapService {
  /**
   * Get all GIS markers and layers for interactive dashboard map
   */
  async getMapData({ regionId, districtId, campaignId, layer = 'ALL' }) {
    let whereRegion = regionId ? `WHERE region_id = '${regionId}'` : '';
    let whereRegionAnd = regionId ? `AND region_id = '${regionId}'` : '';

    const results = {
      volunteers: [],
      tasks: [],
      facilities: [],
      emergencies: [],
      fieldSubmissions: [],
      regions: []
    };

    // 1. Regions coordinates
    results.regions = await db.query(`SELECT id, name, code, latitude, longitude FROM regions WHERE latitude IS NOT NULL`);

    // 2. Facilities
    if (['ALL', 'FACILITIES'].includes(layer.toUpperCase())) {
      results.facilities = await db.query(
        `SELECT f.id, f.name, f.code, f.facility_type, f.contact_person, f.phone,
                f.latitude, f.longitude, r.name AS region_name, d.name AS district_name
         FROM facilities f
         JOIN districts d ON d.id = f.district_id
         JOIN regions r ON r.id = d.region_id
         WHERE f.latitude IS NOT NULL ${regionId ? `AND r.id = '${regionId}'` : ''}`
      );
    }

    // 3. Active Tasks
    if (['ALL', 'TASKS'].includes(layer.toUpperCase())) {
      results.tasks = await db.query(
        `SELECT t.id, t.title, t.task_type, t.priority, t.status, t.target_location_name,
                t.latitude, t.longitude, t.start_datetime, t.deadline_datetime,
                c.name AS campaign_name, r.name AS region_name, d.name AS district_name
         FROM tasks t
         LEFT JOIN campaigns c ON c.id = t.campaign_id
         LEFT JOIN regions r ON r.id = t.region_id
         LEFT JOIN districts d ON d.id = t.district_id
         WHERE t.latitude IS NOT NULL ${whereRegionAnd} ${campaignId ? `AND t.campaign_id = '${campaignId}'` : ''}`
      );
    }

    // 4. Volunteers (aggregated / non-sensitive coordinates for field admin)
    if (['ALL', 'VOLUNTEERS'].includes(layer.toUpperCase())) {
      results.volunteers = await db.query(
        `SELECT v.id, v.volunteer_id, v.gender, v.availability_status, v.status,
                v.village_name, v.latitude, v.longitude, u.full_name, u.phone,
                r.name AS region_name, d.name AS district_name
         FROM volunteers v
         JOIN users u ON u.id = v.user_id
         LEFT JOIN regions r ON r.id = v.region_id
         LEFT JOIN districts d ON d.id = v.district_id
         WHERE v.latitude IS NOT NULL AND v.status IN ('APPROVED', 'ACTIVE') ${whereRegionAnd}`
      );
    }

    // 5. Emergency Outbreak Reports
    if (['ALL', 'EMERGENCIES'].includes(layer.toUpperCase())) {
      results.emergencies = await db.query(
        `SELECT e.id, e.report_code, e.emergency_type, e.severity, e.description,
                e.suspected_cases_count, e.community_name, e.latitude, e.longitude,
                e.status, e.created_at, r.name AS region_name, d.name AS district_name
         FROM emergency_reports e
         LEFT JOIN regions r ON r.id = e.region_id
         LEFT JOIN districts d ON d.id = e.district_id
         WHERE e.latitude IS NOT NULL ${whereRegionAnd}`
      );
    }

    // 6. Recent Field Submissions GPS pins
    if (['ALL', 'FIELD_DATA'].includes(layer.toUpperCase())) {
      results.fieldSubmissions = await db.query(
        `SELECT fs.id, fs.submission_datetime, fs.latitude, fs.longitude,
                fs.review_status, ff.title AS form_title, ff.category AS form_category,
                u.full_name AS volunteer_name, c.name AS campaign_name
         FROM field_submissions fs
         JOIN field_forms ff ON ff.id = fs.field_form_id
         JOIN volunteers v ON v.id = fs.volunteer_id
         JOIN users u ON u.id = v.user_id
         LEFT JOIN campaigns c ON c.id = fs.campaign_id
         WHERE fs.latitude IS NOT NULL ${campaignId ? `AND fs.campaign_id = '${campaignId}'` : ''}
         ORDER BY fs.submission_datetime DESC
         LIMIT 100`
      );
    }

    return results;
  }
}

module.exports = new MapService();
