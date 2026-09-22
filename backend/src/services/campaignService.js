const db = require('../config/db');
const { uuid } = require('../utils/idGenerator');
const { logAudit } = require('../middleware/auditLogger');
const notificationService = require('./notificationService');

class CampaignService {
  /**
   * Get campaigns with search, filtering and pagination
   */
  async getCampaigns({ search, type, status, regionId, districtId, managerId, limit = 20, offset = 0 }) {
    let whereClauses = [];
    let params = [];

    if (search && search.trim()) {
      whereClauses.push('(c.name LIKE ? OR c.code LIKE ? OR c.description LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (type) {
      whereClauses.push('c.type = ?');
      params.push(type);
    }

    if (status) {
      whereClauses.push('c.status = ?');
      params.push(status);
    }

    if (regionId) {
      whereClauses.push('c.region_id = ?');
      params.push(regionId);
    }

    if (districtId) {
      whereClauses.push('c.district_id = ?');
      params.push(districtId);
    }

    if (managerId) {
      whereClauses.push('c.manager_id = ?');
      params.push(managerId);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = await db.getOne(
      `SELECT COUNT(*) AS total FROM campaigns c ${whereStr}`,
      params
    );

    const rows = await db.query(
      `SELECT c.*, r.name AS region_name, d.name AS district_name, o.name AS organization_name,
              mgr.full_name AS manager_name,
              (SELECT COUNT(*) FROM campaign_volunteers cv WHERE cv.campaign_id = c.id) AS assigned_volunteers_count,
              (SELECT COUNT(*) FROM tasks t WHERE t.campaign_id = c.id) AS total_tasks,
              (SELECT COUNT(*) FROM tasks t WHERE t.campaign_id = c.id AND t.status = 'COMPLETED') AS completed_tasks,
              (SELECT COUNT(*) FROM field_submissions fs WHERE fs.campaign_id = c.id) AS total_field_submissions
       FROM campaigns c
       LEFT JOIN regions r ON r.id = c.region_id
       LEFT JOIN districts d ON d.id = c.district_id
       LEFT JOIN organizations o ON o.id = c.organization_id
       LEFT JOIN users mgr ON mgr.id = c.manager_id
       ${whereStr}
       ORDER BY c.start_date DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    return {
      campaigns: rows,
      total: countRow ? countRow.total : 0,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    };
  }

  /**
   * Get single campaign with assigned volunteers and tasks
   */
  async getCampaignById(id) {
    const campaign = await db.getOne(
      `SELECT c.*, r.name AS region_name, d.name AS district_name, o.name AS organization_name,
              mgr.full_name AS manager_name, mgr.email AS manager_email, mgr.phone AS manager_phone
       FROM campaigns c
       LEFT JOIN regions r ON r.id = c.region_id
       LEFT JOIN districts d ON d.id = c.district_id
       LEFT JOIN organizations o ON o.id = c.organization_id
       LEFT JOIN users mgr ON mgr.id = c.manager_id
       WHERE c.id = ? OR c.code = ?`,
      [id, id]
    );

    if (!campaign) return null;

    // Fetch assigned volunteers
    campaign.volunteers = await db.query(
      `SELECT cv.id AS assignment_id, cv.status AS assignment_status, cv.assigned_at,
              v.id AS volunteer_id, v.volunteer_id AS volunteer_code, v.gender, v.availability_status,
              u.full_name, u.email, u.phone, u.avatar_url,
              (SELECT COUNT(*) FROM field_submissions fs WHERE fs.campaign_id = ? AND fs.volunteer_id = v.id) AS submissions_count
       FROM campaign_volunteers cv
       JOIN volunteers v ON v.id = cv.volunteer_id
       JOIN users u ON u.id = v.user_id
       WHERE cv.campaign_id = ?`,
      [campaign.id, campaign.id]
    );

    // Fetch associated tasks
    campaign.tasks = await db.query(
      `SELECT t.*, d.name AS district_name
       FROM tasks t
       LEFT JOIN districts d ON d.id = t.district_id
       WHERE t.campaign_id = ?
       ORDER BY t.start_datetime ASC`,
      [campaign.id]
    );

    // Fetch submission summary metrics
    const statsRow = await db.getOne(
      `SELECT COUNT(*) AS total_submissions,
              SUM(CASE WHEN review_status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_submissions
       FROM field_submissions WHERE campaign_id = ?`,
      [campaign.id]
    );

    campaign.stats = {
      totalSubmissions: statsRow ? statsRow.total_submissions : 0,
      approvedSubmissions: statsRow ? statsRow.approved_submissions : 0,
      assignedVolunteersCount: campaign.volunteers.length,
      totalTasksCount: campaign.tasks.length,
      completedTasksCount: campaign.tasks.filter(t => t.status === 'COMPLETED').length
    };

    return campaign;
  }

  /**
   * Create campaign
   */
  async createCampaign(data, creatorId) {
    const name = data.name;
    const type = data.type;
    const description = data.description || null;
    const objective = data.objective || null;
    const startDate = data.startDate || data.start_date;
    const endDate = data.endDate || data.end_date;
    const targetCommunities = data.targetCommunities || data.target_communities || null;
    const targetPopulation = parseInt(data.targetPopulation || data.target_population || data.target_beneficiaries || '0', 10);
    const budget = parseFloat(data.budget || data.target_budget || '0');
    const currency = data.currency || 'USD';
    const managerId = data.managerId || data.manager_id || creatorId;
    const status = data.status || 'PLANNED';
    const priority = data.priority || 'MEDIUM';
    const requiredVolunteers = parseInt(data.requiredVolunteers || data.required_volunteers || '0', 10);
    const requiredSupplies = data.requiredSupplies || data.required_supplies || null;
    const trainingRequirements = data.trainingRequirements || data.training_requirements || null;
    const organizationId = data.organizationId || data.organization_id || null;

    if (!name || !type || !startDate || !endDate) {
      throw { status: 400, message: 'Name, type, start date, and end date are required' };
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const startStr = String(startDate).split('T')[0].split(' ')[0];
    if (startStr < todayStr) {
      throw { status: 400, message: 'Taariikhda bilaabashada ololaha ma noqon karto mid hore u soo dhaaftay (Campaign start date cannot be in the past)' };
    }

    if (new Date(endDate) < new Date(startDate)) {
      throw { status: 400, message: 'Campaign end date cannot be earlier than start date' };
    }

    const { resolveLocation } = require('../utils/locationResolver');
    const loc = await resolveLocation({
      regionId: data.regionId || data.region_id,
      regionName: data.target_region || data.region_name || data.regionName,
      districtId: data.districtId || data.district_id,
      districtName: data.district_name || data.districtName
    });
    const resolvedRegionId = loc.regionId;
    const resolvedDistrictId = loc.districtId;

    const id = uuid();
    const code = data.code || `CAMP-${type.substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    await db.execute(
      `INSERT INTO campaigns (
        id, organization_id, name, code, type, description, objective, start_date, end_date,
        region_id, district_id, target_communities, target_population, budget, currency,
        manager_id, status, priority, required_volunteers, required_supplies, training_requirements,
        created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        id, organizationId, name, code, type, description, objective,
        startDate, endDate, resolvedRegionId, resolvedDistrictId, targetCommunities,
        targetPopulation, budget, currency, managerId,
        status, priority, requiredVolunteers, requiredSupplies,
        trainingRequirements, creatorId
      ]
    );

    logAudit({
      userId: creatorId,
      action: 'CAMPAIGN_CREATED',
      module: 'CAMPAIGNS',
      entityName: 'Campaign',
      entityId: id,
      newValues: { name, code, type, status, startDate, endDate }
    });

    return await this.getCampaignById(id);
  }

  /**
   * Update campaign
   */
  async updateCampaign(id, data, actorId) {
    const campaign = await this.getCampaignById(id);
    if (!campaign) throw { status: 404, message: 'Campaign not found' };

    const {
      name, type, description, objective, startDate, endDate, regionId, districtId,
      targetCommunities, targetPopulation, budget, currency, managerId, status,
      priority, requiredVolunteers, requiredSupplies, trainingRequirements
    } = data;

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      throw { status: 400, message: 'Campaign end date cannot be earlier than start date' };
    }

    await db.execute(
      `UPDATE campaigns SET
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        description = COALESCE(?, description),
        objective = COALESCE(?, objective),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        region_id = COALESCE(?, region_id),
        district_id = COALESCE(?, district_id),
        target_communities = COALESCE(?, target_communities),
        target_population = COALESCE(?, target_population),
        budget = COALESCE(?, budget),
        currency = COALESCE(?, currency),
        manager_id = COALESCE(?, manager_id),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        required_volunteers = COALESCE(?, required_volunteers),
        required_supplies = COALESCE(?, required_supplies),
        training_requirements = COALESCE(?, training_requirements),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name, type, description, objective, startDate, endDate, regionId, districtId,
        targetCommunities, targetPopulation, budget, currency, managerId, status,
        priority, requiredVolunteers, requiredSupplies, trainingRequirements, campaign.id
      ]
    );

    logAudit({
      userId: actorId,
      action: 'CAMPAIGN_UPDATED',
      module: 'CAMPAIGNS',
      entityName: 'Campaign',
      entityId: campaign.id,
      oldValues: { name: campaign.name, status: campaign.status },
      newValues: data
    });

    return await this.getCampaignById(campaign.id);
  }

  /**
   * Assign volunteer to campaign
   */
  async assignVolunteer(campaignId, volunteerId, actorId) {
    const campaign = await this.getCampaignById(campaignId);
    if (!campaign) throw { status: 404, message: 'Campaign not found' };

    const volunteer = await db.getOne(
      `SELECT v.*, u.full_name, u.id AS user_id, u.phone 
       FROM volunteers v JOIN users u ON u.id = v.user_id WHERE v.id = ?`,
      [volunteerId]
    );
    if (!volunteer) throw { status: 404, message: 'Volunteer not found' };

    if (volunteer.status !== 'APPROVED' && volunteer.status !== 'ACTIVE') {
      throw { status: 400, message: 'Volunteer must be approved before assignment to a campaign' };
    }

    const existing = await db.getOne(
      `SELECT id FROM campaign_volunteers WHERE campaign_id = ? AND volunteer_id = ?`,
      [campaign.id, volunteer.id]
    );

    if (existing) {
      return { message: 'Volunteer is already assigned to this campaign' };
    }

    const assignmentId = uuid();
    await db.execute(
      `INSERT INTO campaign_volunteers (id, campaign_id, volunteer_id, status, assigned_at)
       VALUES (?, ?, ?, 'ASSIGNED', CURRENT_TIMESTAMP)`,
      [assignmentId, campaign.id, volunteer.id]
    );

    // Notify volunteer
    await notificationService.createNotification({
      userId: volunteer.user_id,
      title: `Ololaha Caafimaadka: ${campaign.name}`,
      message: `Waxaa lagugu daray ololaha ${campaign.name}. Fadlan ka eeg faahfaahinta dashboard-kaaga. / You have been assigned to campaign: ${campaign.name}.`,
      type: 'CAMPAIGN_ANNOUNCEMENT',
      actionUrl: `/volunteer/campaigns/${campaign.id}`,
      sendSms: true,
      phone: volunteer.phone
    });

    logAudit({
      userId: actorId,
      action: 'VOLUNTEER_ASSIGNED_TO_CAMPAIGN',
      module: 'CAMPAIGNS',
      entityName: 'CampaignVolunteer',
      entityId: assignmentId
    });

    return { success: true, assignmentId, message: 'Volunteer assigned successfully' };
  }

  /**
   * Update campaign details
   */
  async updateCampaign(id, data, actorId) {
    const campaign = await this.getCampaignById(id);
    if (!campaign) throw { status: 404, message: 'Campaign not found' };

    const { name, type, description, objective, startDate, endDate, targetPopulation, targetBudget, status, regionId, districtId } = data;

    await db.execute(
      `UPDATE campaigns SET
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        description = COALESCE(?, description),
        objective = COALESCE(?, objective),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        target_population = COALESCE(?, target_population),
        budget = COALESCE(?, budget),
        status = COALESCE(?, status),
        region_id = COALESCE(?, region_id),
        district_id = COALESCE(?, district_id),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, type, description, objective, startDate, endDate, targetPopulation, targetBudget, status, regionId, districtId, campaign.id]
    );

    logAudit({
      userId: actorId,
      action: 'CAMPAIGN_UPDATED',
      module: 'CAMPAIGNS',
      entityName: 'Campaign',
      entityId: campaign.id,
      newValues: { name, type, status }
    });

    return await this.getCampaignById(campaign.id);
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(id, actorId) {
    const campaign = await this.getCampaignById(id);
    if (!campaign) throw { status: 404, message: 'Campaign not found' };

    await db.execute(`DELETE FROM field_submissions WHERE campaign_id = ?`, [campaign.id]);
    await db.execute(`DELETE FROM task_assignments WHERE task_id IN (SELECT id FROM tasks WHERE campaign_id = ?)`, [campaign.id]);
    await db.execute(`DELETE FROM schedules WHERE campaign_id = ?`, [campaign.id]);
    await db.execute(`DELETE FROM tasks WHERE campaign_id = ?`, [campaign.id]);
    await db.execute(`DELETE FROM campaign_volunteers WHERE campaign_id = ?`, [campaign.id]);
    await db.execute(`DELETE FROM campaigns WHERE id = ?`, [campaign.id]);

    logAudit({
      userId: actorId,
      action: 'CAMPAIGN_DELETED',
      module: 'CAMPAIGNS',
      entityName: 'Campaign',
      entityId: campaign.id
    });

    return { success: true, message: 'Campaign deleted successfully' };
  }

  /**
   * Public campaigns listing (safe data only)
   */
  async getPublicCampaigns() {
    return await db.query(
      `SELECT c.id, c.name, c.code, c.type, c.description, c.objective, c.start_date, c.end_date,
              c.target_population, c.status, r.name AS region_name, d.name AS district_name,
              o.name AS organization_name
       FROM campaigns c
       LEFT JOIN regions r ON r.id = c.region_id
       LEFT JOIN districts d ON d.id = c.district_id
       LEFT JOIN organizations o ON o.id = c.organization_id
       WHERE c.status IN ('ACTIVE', 'PLANNED')
       ORDER BY c.start_date ASC`
    );
  }
}

module.exports = new CampaignService();
