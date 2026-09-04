const db = require('../config/db');
const { success, badRequest } = require('../utils/response');

class SearchController {
  async globalSearch(req, res, next) {
    try {
      const { q } = req.query;
      if (!q || !q.trim() || q.trim().length < 2) {
        return badRequest(res, 'Search query must be at least 2 characters');
      }

      const term = `%${q.trim()}%`;

      // 1. Search Volunteers
      const volunteers = await db.query(
        `SELECT v.id, v.volunteer_id, u.full_name, u.email, u.phone, v.status, r.name AS region_name
         FROM volunteers v
         JOIN users u ON u.id = v.user_id
         LEFT JOIN regions r ON r.id = v.region_id
         WHERE u.full_name LIKE ? OR u.email LIKE ? OR v.volunteer_id LIKE ?
         LIMIT 5`,
        [term, term, term]
      );

      // 2. Search Campaigns
      const campaigns = await db.query(
        `SELECT c.id, c.code, c.name, c.type, c.status, r.name AS region_name
         FROM campaigns c
         LEFT JOIN regions r ON r.id = c.region_id
         WHERE c.name LIKE ? OR c.code LIKE ? OR c.description LIKE ?
         LIMIT 5`,
        [term, term, term]
      );

      // 3. Search Tasks
      const tasks = await db.query(
        `SELECT t.id, t.title, t.task_type, t.priority, t.status, t.target_location_name
         FROM tasks t
         WHERE t.title LIKE ? OR t.description LIKE ? OR t.target_location_name LIKE ?
         LIMIT 5`,
        [term, term, term]
      );

      // 4. Search Inventory
      const inventory = await db.query(
        `SELECT i.id, i.item_code, i.name, i.category, i.quantity_on_hand, i.unit_of_measure
         FROM inventory_items i
         WHERE i.name LIKE ? OR i.item_code LIKE ? OR i.batch_number LIKE ?
         LIMIT 5`,
        [term, term, term]
      );

      // 5. Search Training
      const training = await db.query(
        `SELECT c.id, c.code, c.title, c.category, c.estimated_hours
         FROM training_courses c
         WHERE c.title LIKE ? OR c.code LIKE ? OR c.description LIKE ?
         LIMIT 5`,
        [term, term, term]
      );

      // 6. Search Emergencies
      const emergencies = await db.query(
        `SELECT e.id, e.report_code, e.emergency_type, e.severity, e.community_name, e.status
         FROM emergency_reports e
         WHERE e.report_code LIKE ? OR e.description LIKE ? OR e.community_name LIKE ?
         LIMIT 5`,
        [term, term, term]
      );

      return success(res, {
        query: q.trim(),
        results: {
          volunteers,
          campaigns,
          tasks,
          inventory,
          training,
          emergencies
        }
      }, 'Global search results');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SearchController();
