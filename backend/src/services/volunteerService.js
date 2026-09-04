const db = require('../config/db');
const { uuid, generateVolunteerId } = require('../utils/idGenerator');
const { logAudit } = require('../middleware/auditLogger');
const notificationService = require('./notificationService');

class VolunteerService {
  /**
   * Register or Create new volunteer
   */
  async registerVolunteer(data) {
    const authService = require('./authService');
    return await authService.registerVolunteer(data);
  }

  /**
   * List volunteers with search, filtering, pagination and scoping
   */
  async getVolunteers({ search, status, regionId, districtId, organizationId, skill, limit = 20, offset = 0 }) {
    let whereClauses = [];
    let params = [];

    if (search && search.trim()) {
      whereClauses.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR v.volunteer_id LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (status) {
      whereClauses.push('v.status = ?');
      params.push(status);
    }

    if (regionId) {
      whereClauses.push('v.region_id = ?');
      params.push(regionId);
    }

    if (districtId) {
      whereClauses.push('v.district_id = ?');
      params.push(districtId);
    }

    if (organizationId) {
      whereClauses.push('v.organization_id = ?');
      params.push(organizationId);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = await db.getOne(
      `SELECT COUNT(DISTINCT v.id) AS total
       FROM volunteers v
       JOIN users u ON u.id = v.user_id
       ${whereStr}`,
      params
    );

    const rows = await db.query(
      `SELECT v.*, u.full_name, u.email, u.phone, u.avatar_url, u.profile_image_url, u.is_active, u.is_suspended,
              r.name AS region_name, d.name AS district_name, o.name AS organization_name
       FROM volunteers v
       JOIN users u ON u.id = v.user_id
       LEFT JOIN regions r ON r.id = v.region_id
       LEFT JOIN districts d ON d.id = v.district_id
       LEFT JOIN organizations o ON o.id = v.organization_id
       ${whereStr}
       ORDER BY (CASE WHEN v.status = 'PENDING' THEN 0 ELSE 1 END), v.registration_date DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    // Fetch skills and languages for each volunteer
    for (const vol of rows) {
      vol.avatar_url = vol.avatar_url || vol.profile_image_url || null;
      vol.profile_image_url = vol.profile_image_url || vol.avatar_url || null;
      const skills = await db.query(`SELECT skill FROM volunteer_skills WHERE volunteer_id = ?`, [vol.id]);
      const languages = await db.query(`SELECT language, proficiency FROM volunteer_languages WHERE volunteer_id = ?`, [vol.id]);
      vol.skills = skills.map(s => s.skill);
      vol.languages = languages;
    }

    return {
      volunteers: rows,
      total: countRow ? countRow.total : 0,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    };
  }

  /**
   * Get volunteer by ID (UUID or volunteer code)
   */
  async getVolunteerById(id) {
    const vol = await db.getOne(
      `SELECT v.*, u.full_name, u.email, u.phone, u.avatar_url, u.profile_image_url, u.is_active, u.is_suspended, u.last_login,
              r.name AS region_name, d.name AS district_name, c.name AS community_name, o.name AS organization_name,
              rev.full_name AS reviewed_by_name
       FROM volunteers v
       JOIN users u ON u.id = v.user_id
       LEFT JOIN regions r ON r.id = v.region_id
       LEFT JOIN districts d ON d.id = v.district_id
       LEFT JOIN communities c ON c.id = v.community_id
       LEFT JOIN organizations o ON o.id = v.organization_id
       LEFT JOIN users rev ON rev.id = v.reviewed_by
       WHERE v.id = ? OR v.volunteer_id = ? OR v.user_id = ?`,
      [id, id, id]
    );

    if (!vol) return null;

    vol.avatar_url = vol.avatar_url || vol.profile_image_url || null;
    vol.profile_image_url = vol.profile_image_url || vol.avatar_url || null;
    vol.skills = (await db.query(`SELECT skill FROM volunteer_skills WHERE volunteer_id = ?`, [vol.id])).map(s => s.skill);
    vol.languages = await db.query(`SELECT language, proficiency FROM volunteer_languages WHERE volunteer_id = ?`, [vol.id]);

    // Summary metrics
    const tasksCount = await db.getOne(
      `SELECT 
        COUNT(*) AS total_assigned,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_tasks
       FROM task_assignments WHERE volunteer_id = ?`,
      [vol.id]
    );

    const submissionsCount = await db.getOne(
      `SELECT COUNT(*) AS total_submissions FROM field_submissions WHERE volunteer_id = ?`,
      [vol.id]
    );

    const certCount = await db.getOne(
      `SELECT COUNT(*) AS total_certificates FROM certificates WHERE volunteer_id = ?`,
      [vol.id]
    );

    vol.stats = {
      totalTasksAssigned: tasksCount ? tasksCount.total_assigned : 0,
      completedTasks: tasksCount ? tasksCount.completed_tasks : 0,
      totalFieldSubmissions: submissionsCount ? submissionsCount.total_submissions : 0,
      totalCertificates: certCount ? certCount.total_certificates : 0
    };

    return vol;
  }

  /**
   * Approve volunteer
   */
  async approveVolunteer(volunteerId, reviewerId, reviewNotes = null) {
    const vol = await this.getVolunteerById(volunteerId);
    if (!vol) throw { status: 404, message: 'Volunteer profile not found' };

    // Update volunteers table
    await db.execute(
      `UPDATE volunteers 
       SET status = 'ACTIVE', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, review_notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [reviewerId, reviewNotes, vol.id]
    );

    // Sync users table to active
    if (vol.user_id) {
      await db.execute(
        `UPDATE users 
         SET status = 'active', is_active = 1, is_suspended = 0, suspension_reason = NULL, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [vol.user_id]
      );
    }

    // Notify volunteer
    await notificationService.createNotification({
      userId: vol.user_id,
      title: 'Xubinnimadaada waa la ansixiyay! / Volunteer Application Approved!',
      message: `Hambalyo! Codsigaagii CHV (${vol.volunteer_id}) waa la ansixiyay. Hadda waxaad qaadan kartaa hawlo iyo tababaro. / Congratulations! Your volunteer status is approved. You can now receive tasks and training.`,
      type: 'SYSTEM',
      actionUrl: '/volunteer/dashboard',
      sendSms: true
    });

    logAudit({
      userId: reviewerId,
      action: 'VOLUNTEER_APPROVED',
      module: 'VOLUNTEERS',
      entityName: 'Volunteer',
      entityId: vol.id,
      oldValues: { status: vol.status },
      newValues: { status: 'ACTIVE', reviewNotes }
    });

    return { success: true, message: 'Volunteer approved successfully', volunteerId: vol.id, status: 'ACTIVE' };
  }

  /**
   * Reject volunteer
   */
  async rejectVolunteer(volunteerId, reviewerId, reason = null) {
    const vol = await this.getVolunteerById(volunteerId);
    if (!vol) throw { status: 404, message: 'Volunteer profile not found' };

    // Update volunteers table
    await db.execute(
      `UPDATE volunteers 
       SET status = 'REJECTED', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, review_notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [reviewerId, reason, vol.id]
    );

    // Sync users table to deactivated
    if (vol.user_id) {
      await db.execute(
        `UPDATE users 
         SET status = 'deactivated', is_suspended = 1, suspension_reason = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [reason || 'Application rejected by Admin', vol.user_id]
      );
    }

    await notificationService.createNotification({
      userId: vol.user_id,
      title: 'Xaaladda Codsiga CHV / CHV Application Status',
      message: `Waan ka xunnahay, codsigaagii ma helin ansixin xilligan. Sabab: ${reason || 'Shuruudaha oo aan buuxsamin'}.`,
      type: 'SYSTEM'
    });

    logAudit({
      userId: reviewerId,
      action: 'VOLUNTEER_REJECTED',
      module: 'VOLUNTEERS',
      entityName: 'Volunteer',
      entityId: vol.id,
      oldValues: { status: vol.status },
      newValues: { status: 'REJECTED', reason }
    });

    return { success: true, message: 'Volunteer rejected', status: 'REJECTED' };
  }

  /**
   * Update Volunteer Status (Active, Inactive, Suspended)
   */
  async updateStatus(volunteerId, status, actorId, notes = null) {
    const vol = await this.getVolunteerById(volunteerId);
    if (!vol) throw { status: 404, message: 'Volunteer profile not found' };

    const cleanStatus = (status || 'ACTIVE').toUpperCase();
    await db.execute(
      `UPDATE volunteers SET status = ?, review_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [cleanStatus, notes, vol.id]
    );

    // Sync users table
    if (vol.user_id) {
      const userStatus = (cleanStatus === 'ACTIVE' || cleanStatus === 'APPROVED') ? 'active' : (cleanStatus === 'PENDING' ? 'pending' : 'deactivated');
      const isActive = userStatus === 'active' ? 1 : (userStatus === 'pending' ? 1 : 0);
      const isSuspended = userStatus === 'deactivated' ? 1 : 0;
      await db.execute(
        `UPDATE users SET status = ?, is_active = ?, is_suspended = ?, suspension_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [userStatus, isActive, isSuspended, notes || null, vol.user_id]
      );
    }

    logAudit({
      userId: actorId,
      action: 'VOLUNTEER_STATUS_UPDATED',
      module: 'VOLUNTEERS',
      entityName: 'Volunteer',
      entityId: vol.id,
      oldValues: { status: vol.status },
      newValues: { status: cleanStatus, notes }
    });

    return { success: true, status: cleanStatus };
  }

  /**
   * Update volunteer profile info
   */
  async updateVolunteerProfile(volunteerId, data, actorId) {
    const vol = await this.getVolunteerById(volunteerId);
    if (!vol) throw { status: 404, message: 'Volunteer not found' };

    const {
      fullName, phone, gender, dateOfBirth, regionId, districtId, communityId,
      villageName, address, latitude, longitude, educationLevel, healthQualifications,
      previousExperience, emergencyContactName, emergencyContactPhone,
      emergencyContactRelationship, availabilityStatus, skills, languages
    } = data;

    // Update user info
    if (fullName || phone) {
      await db.execute(
        `UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [fullName, phone, vol.user_id]
      );
    }

    const { resolveLocation } = require('../utils/locationResolver');
    let finalRegionId = regionId || null;
    let finalDistrictId = districtId || null;
    if (regionId || districtId || data.region_name || data.regionName || data.district_name || data.districtName) {
      const loc = await resolveLocation({
        regionId,
        regionName: data.region_name || data.regionName,
        districtId,
        districtName: data.district_name || data.districtName
      });
      if (regionId || data.region_name || data.regionName) finalRegionId = loc.regionId;
      if (districtId || data.district_name || data.districtName) finalDistrictId = loc.districtId;
    }

    // Update volunteer info
    await db.execute(
      `UPDATE volunteers SET
        gender = COALESCE(?, gender),
        date_of_birth = COALESCE(?, date_of_birth),
        region_id = COALESCE(?, region_id),
        district_id = COALESCE(?, district_id),
        community_id = COALESCE(?, community_id),
        village_name = COALESCE(?, village_name),
        address = COALESCE(?, address),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        education_level = COALESCE(?, education_level),
        health_qualifications = COALESCE(?, health_qualifications),
        previous_experience = COALESCE(?, previous_experience),
        emergency_contact_name = COALESCE(?, emergency_contact_name),
        emergency_contact_phone = COALESCE(?, emergency_contact_phone),
        emergency_contact_relationship = COALESCE(?, emergency_contact_relationship),
        availability_status = COALESCE(?, availability_status),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        gender, dateOfBirth, finalRegionId, finalDistrictId, communityId, villageName, address,
        latitude, longitude, educationLevel, healthQualifications, previousExperience,
        emergencyContactName, emergencyContactPhone, emergencyContactRelationship,
        availabilityStatus, vol.id
      ]
    );

    // Update skills if provided
    if (Array.isArray(skills)) {
      await db.execute(`DELETE FROM volunteer_skills WHERE volunteer_id = ?`, [vol.id]);
      for (const skill of skills) {
        if (skill && skill.trim()) {
          await db.execute(`INSERT INTO volunteer_skills (id, volunteer_id, skill) VALUES (?, ?, ?)`, [uuid(), vol.id, skill.trim()]);
        }
      }
    }

    // Update languages if provided
    if (Array.isArray(languages)) {
      await db.execute(`DELETE FROM volunteer_languages WHERE volunteer_id = ?`, [vol.id]);
      for (const lang of languages) {
        const langName = typeof lang === 'string' ? lang : lang.language;
        const prof = typeof lang === 'object' && lang.proficiency ? lang.proficiency : 'FLUENT';
        if (langName && langName.trim()) {
          await db.execute(`INSERT INTO volunteer_languages (id, volunteer_id, language, proficiency) VALUES (?, ?, ?, ?)`, [uuid(), vol.id, langName.trim(), prof]);
        }
      }
    }

    return await this.getVolunteerById(vol.id);
  }

  /**
   * Delete volunteer
   */
  async deleteVolunteer(id, actorId) {
    const vol = await this.getVolunteerById(id);
    if (!vol) throw { status: 404, message: 'Volunteer not found' };

    await db.execute(`DELETE FROM certificates WHERE volunteer_id = ?`, [vol.id]);
    await db.execute(`DELETE FROM training_enrollments WHERE volunteer_id = ?`, [vol.id]);
    await db.execute(`DELETE FROM schedules WHERE volunteer_id = ?`, [vol.id]);
    await db.execute(`DELETE FROM field_submissions WHERE volunteer_id = ?`, [vol.id]);
    await db.execute(`DELETE FROM volunteer_skills WHERE volunteer_id = ?`, [vol.id]);
    await db.execute(`DELETE FROM volunteer_languages WHERE volunteer_id = ?`, [vol.id]);
    await db.execute(`DELETE FROM campaign_volunteers WHERE volunteer_id = ?`, [vol.id]);
    await db.execute(`DELETE FROM task_assignments WHERE volunteer_id = ?`, [vol.id]);
    await db.execute(`DELETE FROM supply_requests WHERE volunteer_id = ?`, [vol.id]);
    await db.execute(`DELETE FROM volunteers WHERE id = ?`, [vol.id]);
    if (vol.user_id) {
      await db.execute(`DELETE FROM notifications WHERE user_id = ?`, [vol.user_id]);
      await db.execute(`DELETE FROM user_roles WHERE user_id = ?`, [vol.user_id]);
      await db.execute(`DELETE FROM users WHERE id = ?`, [vol.user_id]);
    }

    logAudit({
      userId: actorId,
      action: 'VOLUNTEER_DELETED',
      module: 'VOLUNTEERS',
      entityName: 'Volunteer',
      entityId: vol.id
    });

    return { success: true, message: 'Volunteer deleted successfully' };
  }
}

module.exports = new VolunteerService();
