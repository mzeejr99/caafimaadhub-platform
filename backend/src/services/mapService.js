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
      campaigns: [],
      tasks: [],
      facilities: [],
      emergencies: [],
      submissions: [],
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

    // 3. Campaigns Layer (with coordinates from region/district)
    if (['ALL', 'CAMPAIGNS'].includes(layer.toUpperCase())) {
      results.campaigns = await db.query(
        `SELECT c.id, c.name, c.code, c.type, c.status,
                r.name AS target_region, d.name AS district_name,
                COALESCE(d.latitude, r.latitude, 2.0469) AS latitude,
                COALESCE(d.longitude, r.longitude, 45.3182) AS longitude
         FROM campaigns c
         LEFT JOIN regions r ON r.id = c.region_id
         LEFT JOIN districts d ON d.id = c.district_id
         ${whereRegion ? `WHERE ${whereRegion.replace('WHERE ', '')}` : ''}`
      );
    }

    // 4. Active Tasks
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

    // 5. Volunteers (with coordinates)
    if (['ALL', 'VOLUNTEERS'].includes(layer.toUpperCase())) {
      results.volunteers = await db.query(
        `SELECT v.id, v.volunteer_id, v.gender, v.availability_status, v.status,
                v.village_name, 
                COALESCE(v.latitude, d.latitude, r.latitude, 2.0469) AS latitude,
                COALESCE(v.longitude, d.longitude, r.longitude, 45.3182) AS longitude,
                u.full_name, u.phone,
                r.name AS region_name, d.name AS district_name
         FROM volunteers v
         JOIN users u ON u.id = v.user_id
         LEFT JOIN regions r ON r.id = v.region_id
         LEFT JOIN districts d ON d.id = v.district_id
         WHERE v.status IN ('APPROVED', 'ACTIVE') ${whereRegionAnd}`
      );
    }

    // 6. Emergency Outbreak Reports
    if (['ALL', 'EMERGENCIES'].includes(layer.toUpperCase())) {
      results.emergencies = await db.query(
        `SELECT e.id, e.report_code, e.emergency_type, e.severity, e.description,
                e.suspected_cases_count AS suspected_cases, 
                COALESCE(e.community_name, d.name, r.name, 'Soomaaliya') AS location_name,
                COALESCE(e.latitude, d.latitude, r.latitude, 2.0469) AS latitude,
                COALESCE(e.longitude, d.longitude, r.longitude, 45.3182) AS longitude,
                e.status, e.created_at, r.name AS region_name, d.name AS district_name
         FROM emergency_reports e
         LEFT JOIN regions r ON r.id = e.region_id
         LEFT JOIN districts d ON d.id = e.district_id
         ${whereRegion ? `WHERE ${whereRegion.replace('WHERE ', '')}` : ''}`
      );
    }

    // 7. Recent Field Submissions (Submissions layer for map)
    if (['ALL', 'FIELD_DATA', 'SUBMISSIONS'].includes(layer.toUpperCase())) {
      const subs = await db.query(
        `SELECT fs.id, fs.submission_datetime AS created_at, fs.latitude, fs.longitude,
                fs.review_status, ff.title AS form_name, ff.category AS form_category,
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
      results.submissions = subs;
      results.fieldSubmissions = subs;
    }

    return results;
  }
}

module.exports = new MapService();
