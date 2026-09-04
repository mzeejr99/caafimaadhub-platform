const db = require('../config/db');
const { uuid } = require('../utils/idGenerator');
const { success, created, notFound, badRequest } = require('../utils/response');

class LocationController {
  async getOrganizations(req, res, next) {
    try {
      const orgs = await db.query(`SELECT * FROM organizations WHERE is_active = 1 ORDER BY name ASC`);
      return success(res, orgs, 'Organizations retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getRegions(req, res, next) {
    try {
      const regions = await db.query(`SELECT * FROM regions ORDER BY name ASC`);
      return success(res, regions, 'Regions retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getDistricts(req, res, next) {
    try {
      const { regionId, regionName } = req.query;
      let sql = `SELECT d.*, r.name AS region_name FROM districts d JOIN regions r ON r.id = d.region_id`;
      const params = [];
      if (regionId) {
        sql += ` WHERE d.region_id = ?`;
        params.push(regionId);
      } else if (regionName) {
        sql += ` WHERE LOWER(TRIM(r.name)) = LOWER(TRIM(?))`;
        params.push(regionName.trim());
      }
      sql += ` ORDER BY d.name ASC`;
      const districts = await db.query(sql, params);
      return success(res, districts, 'Districts retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getCommunities(req, res, next) {
    try {
      const { districtId } = req.query;
      let sql = `SELECT c.*, d.name AS district_name FROM communities c JOIN districts d ON d.id = c.district_id`;
      const params = [];
      if (districtId) {
        sql += ` WHERE c.district_id = ?`;
        params.push(districtId);
      }
      sql += ` ORDER BY c.name ASC`;
      const communities = await db.query(sql, params);
      return success(res, communities, 'Communities retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getFacilities(req, res, next) {
    try {
      const { districtId, regionId } = req.query;
      let sql = `SELECT f.*, d.name AS district_name, r.name AS region_name, o.name AS organization_name
                 FROM facilities f
                 JOIN districts d ON d.id = f.district_id
                 JOIN regions r ON r.id = d.region_id
                 LEFT JOIN organizations o ON o.id = f.organization_id
                 WHERE f.is_active = 1`;
      const params = [];
      if (districtId) {
        sql += ` AND f.district_id = ?`;
        params.push(districtId);
      }
      if (regionId) {
        sql += ` AND r.id = ?`;
        params.push(regionId);
      }
      sql += ` ORDER BY f.name ASC`;
      const facilities = await db.query(sql, params);
      return success(res, facilities, 'Health facilities retrieved');
    } catch (err) {
      next(err);
    }
  }

  async createFacility(req, res, next) {
    try {
      const { name, code, organizationId, districtId, facilityType, contactPerson, phone, latitude, longitude } = req.body;
      if (!name || !districtId) return badRequest(res, 'Facility name and district are required');
      const id = uuid();
      await db.execute(
        `INSERT INTO facilities (id, organization_id, district_id, name, code, facility_type, contact_person, phone, latitude, longitude, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
        [id, organizationId || null, districtId, name, code || `FAC-${Date.now().toString().slice(-4)}`, facilityType || 'HEALTH_CENTER', contactPerson || null, phone || null, latitude || null, longitude || null]
      );
      const createdFac = await db.getOne(`SELECT * FROM facilities WHERE id = ?`, [id]);
      return created(res, createdFac, 'Facility created successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new LocationController();
