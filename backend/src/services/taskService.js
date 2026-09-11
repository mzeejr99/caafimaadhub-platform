const db = require('../config/db');
const { uuid } = require('../utils/idGenerator');
const { logAudit } = require('../middleware/auditLogger');
const notificationService = require('./notificationService');

class TaskService {
  /**
   * List tasks with filters & pagination
   */
  async getTasks({ search, status, priority, taskType, campaignId, volunteerId, regionId, districtId, limit = 20, offset = 0 }) {
    let whereClauses = [];
    let params = [];

    if (search && search.trim()) {
      whereClauses.push('(t.title LIKE ? OR t.description LIKE ? OR t.target_location_name LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (status) {
      whereClauses.push('t.status = ?');
      params.push(status);
    }

    if (priority) {
      whereClauses.push('t.priority = ?');
      params.push(priority);
    }

    if (taskType) {
      whereClauses.push('t.task_type = ?');
      params.push(taskType);
    }

    if (campaignId) {
      whereClauses.push('t.campaign_id = ?');
      params.push(campaignId);
    }

    if (regionId) {
      whereClauses.push('t.region_id = ?');
      params.push(regionId);
    }

    if (districtId) {
      whereClauses.push('t.district_id = ?');
      params.push(districtId);
    }

    if (volunteerId) {
      whereClauses.push('EXISTS (SELECT 1 FROM task_assignments ta WHERE ta.task_id = t.id AND ta.volunteer_id = ?)');
      params.push(volunteerId);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = await db.getOne(
      `SELECT COUNT(*) AS total FROM tasks t ${whereStr}`,
      params
    );

    const rows = await db.query(
      `SELECT t.*, c.name AS campaign_name, c.code AS campaign_code,
              r.name AS region_name, d.name AS district_name, ff.title AS field_form_title,
              (SELECT u.full_name FROM task_assignments ta JOIN volunteers v ON v.id = ta.volunteer_id JOIN users u ON u.id = v.user_id WHERE ta.task_id = t.id LIMIT 1) AS assigned_volunteer_name,
              (SELECT ta.volunteer_id FROM task_assignments ta WHERE ta.task_id = t.id LIMIT 1) AS assigned_volunteer_id,
              (SELECT ta.status FROM task_assignments ta WHERE ta.task_id = t.id LIMIT 1) AS assignment_status,
              (SELECT COUNT(*) FROM field_submissions fs WHERE fs.task_id = t.id) AS field_submissions_count
       FROM tasks t
       LEFT JOIN campaigns c ON c.id = t.campaign_id
       LEFT JOIN regions r ON r.id = t.region_id
       LEFT JOIN districts d ON d.id = t.district_id
       LEFT JOIN field_forms ff ON ff.id = t.field_form_id
       ${whereStr}
       ORDER BY t.start_datetime DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    return {
      tasks: rows,
      total: countRow ? countRow.total : 0,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    };
  }

  /**
   * Get single task with assignments, form schema, and submissions
   */
  async getTaskById(id) {
    const task = await db.getOne(
      `SELECT t.*, c.name AS campaign_name, c.code AS campaign_code, c.type AS campaign_type,
              r.name AS region_name, d.name AS district_name, com.name AS community_name,
              ff.title AS field_form_title, ff.schema_json AS field_form_schema,
              cr.full_name AS created_by_name
       FROM tasks t
       LEFT JOIN campaigns c ON c.id = t.campaign_id
       LEFT JOIN regions r ON r.id = t.region_id
       LEFT JOIN districts d ON d.id = t.district_id
       LEFT JOIN communities com ON com.id = t.community_id
       LEFT JOIN field_forms ff ON ff.id = t.field_form_id
       LEFT JOIN users cr ON cr.id = t.created_by
       WHERE t.id = ?`,
      [id]
    );

    if (!task) return null;

    // Fetch assignments
    task.assignments = await db.query(
      `SELECT ta.*, v.volunteer_id AS volunteer_code, v.gender, v.availability_status,
              u.id AS user_id, u.full_name, u.email, u.phone, u.avatar_url
       FROM task_assignments ta
       JOIN volunteers v ON v.id = ta.volunteer_id
       JOIN users u ON u.id = v.user_id
       WHERE ta.task_id = ?`,
      [task.id]
    );

    // Fetch submissions
    task.submissions = await db.query(
      `SELECT fs.id, fs.submission_datetime, fs.latitude, fs.longitude, fs.sync_status,
              fs.review_status, fs.payload_data, fs.summary_metrics, u.full_name AS volunteer_name
       FROM field_submissions fs
       JOIN volunteers v ON v.id = fs.volunteer_id
       JOIN users u ON u.id = v.user_id
       WHERE fs.task_id = ?
       ORDER BY fs.submission_datetime DESC`,
      [task.id]
    );

    return task;
  }

  /**
   * Create task with volunteer assignment & conflict check
   */
  async createTask(data, creatorId) {
    const {
      campaignId, organizationId, title, taskType, description, instructions,
      priority = 'MEDIUM', regionId, region_id, regionName, districtId, district_id, districtName, communityId, targetLocationName,
      latitude, longitude, startDatetime, deadlineDatetime, requiresFieldData = 1,
      fieldFormId, requiredTrainingId, requiredSupplies, volunteerId
    } = data;

    const { resolveLocation } = require('../utils/locationResolver');
    const { regionId: resolvedRegionId, districtId: resolvedDistrictId } = await resolveLocation({
      regionId: regionId || region_id,
      regionName,
      districtId: districtId || district_id,
      districtName: districtName || targetLocationName
    });

    if (!title || !taskType || !startDatetime || !deadlineDatetime) {
      throw { status: 400, message: 'Title, task type, start datetime, and deadline are required' };
    }

    if (new Date(deadlineDatetime) < new Date(startDatetime)) {
      throw { status: 400, message: 'Deadline datetime cannot be earlier than start datetime' };
    }

    // Check volunteer eligibility & status
    if (volunteerId) {
      const vol = await db.getOne(
        `SELECT v.*, u.id AS user_id, u.full_name, u.phone FROM volunteers v JOIN users u ON u.id = v.user_id WHERE v.id = ?`,
        [volunteerId]
      );

      if (!vol) throw { status: 404, message: 'Assigned volunteer not found' };

      if (vol.status !== 'APPROVED' && vol.status !== 'ACTIVE') {
        throw { status: 400, message: `Volunteer must be approved to receive tasks. Current status: ${vol.status}` };
      }

      // Check schedule conflict
      const conflict = await db.getOne(
        `SELECT t.title, t.start_datetime, t.deadline_datetime 
         FROM task_assignments ta
         JOIN tasks t ON t.id = ta.task_id
         WHERE ta.volunteer_id = ?
           AND ta.status NOT IN ('COMPLETED', 'CANCELLED', 'REJECTED')
           AND ((t.start_datetime <= ? AND t.deadline_datetime >= ?)
             OR (t.start_datetime <= ? AND t.deadline_datetime >= ?)
             OR (t.start_datetime >= ? AND t.deadline_datetime <= ?))`,
        [volunteerId, startDatetime, startDatetime, deadlineDatetime, deadlineDatetime, startDatetime, deadlineDatetime]
      );

      if (conflict) {
        console.warn(`[TaskService] Schedule conflict warning for volunteer: ${conflict.title}`);
      }
    }

    const taskId = uuid();
    const initialStatus = volunteerId ? 'ASSIGNED' : 'ASSIGNED';

    await db.execute(
      `INSERT INTO tasks (
        id, campaign_id, organization_id, title, task_type, description, instructions,
        priority, status, region_id, district_id, community_id, target_location_name,
        latitude, longitude, start_datetime, deadline_datetime, requires_field_data,
        field_form_id, required_training_id, required_supplies, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        taskId, campaignId || null, organizationId || null, title, taskType, description || null,
        instructions || null, priority, initialStatus, resolvedRegionId, resolvedDistrictId, communityId || null,
        targetLocationName || null, latitude || null, longitude || null, startDatetime,
        deadlineDatetime, requiresFieldData ? 1 : 0, fieldFormId || null,
        requiredTrainingId || null, requiredSupplies || null, creatorId
      ]
    );

    // Create assignment if volunteer specified
    if (volunteerId) {
      const assignmentId = uuid();
      await db.execute(
        `INSERT INTO task_assignments (id, task_id, volunteer_id, status, assigned_at)
         VALUES (?, ?, ?, 'ASSIGNED', CURRENT_TIMESTAMP)`,
        [assignmentId, taskId, volunteerId]
      );

      // Create schedule record
      const scheduleId = uuid();
      await db.execute(
        `INSERT INTO schedules (id, volunteer_id, task_id, campaign_id, title, start_time, end_time, is_available)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [scheduleId, volunteerId, taskId, campaignId || null, title, startDatetime, deadlineDatetime]
      );

      // Notify volunteer
      const volUser = await db.getOne(`SELECT user_id, phone FROM volunteers v JOIN users u ON u.id = v.user_id WHERE v.id = ?`, [volunteerId]);
      if (volUser) {
        await notificationService.createNotification({
          userId: volUser.user_id,
          title: `Hawl Cusub / New Task: ${title}`,
          message: `Waxaa laguu xilsaaray hawl: ${title}. Taariikhda: ${startDatetime}. / You have been assigned task: ${title}.`,
          type: 'TASK_ASSIGNED',
          actionUrl: `/volunteer/tasks/${taskId}`,
          sendSms: true,
          phone: volUser.phone
        });
      }
    }

    logAudit({
      userId: creatorId,
      action: 'TASK_CREATED',
      module: 'TASKS',
      entityName: 'Task',
      entityId: taskId,
      newValues: { title, taskType, priority, startDatetime, deadlineDatetime, volunteerId }
    });

    return await this.getTaskById(taskId);
  }

  /**
   * Helper to resolve volunteer ID from volunteer_id, user_id, or auto-provisioning
   */
  async resolveVolunteerId(identifier) {
    if (!identifier) return null;
    let vol = await db.getOne(`SELECT id FROM volunteers WHERE id = ? OR user_id = ?`, [identifier, identifier]);
    if (vol) return vol.id;

    // Check if user exists and create volunteer record
    const user = await db.getOne(`SELECT * FROM users WHERE id = ?`, [identifier]);
    if (user) {
      const volId = 'vol-' + user.id.slice(0, 18);
      const volCode = `VOL-${Date.now().toString().slice(-5)}`;
      try {
        await db.execute(
          `INSERT INTO volunteers (id, user_id, organization_id, region_id, district_id, volunteer_id, status, availability_status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'APPROVED', 'AVAILABLE', CURRENT_TIMESTAMP)`,
          [volId, user.id, user.organization_id || 'org-fmoh-001', user.region_id || 'reg-banadir', user.district_id || 'dist-hodan', volCode]
        );
      } catch (e) {
        // ignore duplicate
      }
      vol = await db.getOne(`SELECT id FROM volunteers WHERE id = ? OR user_id = ?`, [volId, user.id]);
      if (vol) return vol.id;
    }

    const firstVol = await db.getOne(`SELECT id FROM volunteers LIMIT 1`);
    if (firstVol) return firstVol.id;

    return identifier;
  }

  /**
   * Update task status by volunteer (Accept, Reject, Start, Complete)
   */
  async updateStatusByVolunteer(taskId, volunteerIdentifier, newStatus, reason = null, actor = null) {
    const task = await this.getTaskById(taskId);
    if (!task) throw { status: 404, message: 'Task not found' };

    const effectiveVolunteerId = await this.resolveVolunteerId(volunteerIdentifier || actor?.volunteerId || actor?.id);

    let assignment = await db.getOne(
      `SELECT * FROM task_assignments WHERE task_id = ? AND (volunteer_id = ? OR volunteer_id = ?)`,
      [task.id, effectiveVolunteerId, volunteerIdentifier]
    );

    // If assignment doesn't exist yet, auto-create it for the volunteer
    if (!assignment && effectiveVolunteerId) {
      const assignmentId = uuid();
      await db.execute(
        `INSERT INTO task_assignments (id, task_id, volunteer_id, status, assigned_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [assignmentId, task.id, effectiveVolunteerId, newStatus]
      );
      assignment = await db.getOne(`SELECT * FROM task_assignments WHERE id = ?`, [assignmentId]);
    }

    let acceptedAt = assignment?.accepted_at;
    let completedAt = assignment?.completed_at;

    if (newStatus === 'ACCEPTED' || newStatus === 'IN_PROGRESS') {
      if (!acceptedAt) acceptedAt = new Date().toISOString();
    }

    if (newStatus === 'COMPLETED' || newStatus === 'SUBMITTED') {
      completedAt = new Date().toISOString();

      // Check if field data was required
      if (task.requires_field_data && effectiveVolunteerId) {
        const subCount = await db.getOne(
          `SELECT COUNT(*) AS count FROM field_submissions WHERE task_id = ? AND volunteer_id = ?`,
          [task.id, effectiveVolunteerId]
        );
        if (!subCount || subCount.count === 0) {
          console.log(`[TaskService] Task ${task.id} completed with data flag`);
        }
      }
    }

    if (assignment) {
      await db.execute(
        `UPDATE task_assignments 
         SET status = ?, rejection_reason = ?, accepted_at = ?, completed_at = ?
         WHERE id = ?`,
        [newStatus, reason || null, acceptedAt, completedAt, assignment.id]
      );
    }

    await db.execute(
      `UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newStatus, task.id]
    );

    // Real-time admin notification
    try {
      const adminUsers = await db.query(
        `SELECT DISTINCT u.id FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id
         WHERE r.name IN ('SUPER_ADMIN', 'ADMIN') OR u.role IN ('Superadmin', 'Admin')`
      );
      const actorName = actor?.fullName || actor?.full_name || 'Volunteer';
      for (const adm of adminUsers) {
        await notificationService.createNotification({
          userId: adm.id,
          title: `Hawl Caafimaad La Cusboonaysiiyay (${newStatus})`,
          message: `${actorName} ayaa hawsha "${task.title}" ka dhigay xaalad cusub: ${newStatus}.`,
          type: 'TASK_STATUS_UPDATED',
          actionUrl: `/admin/tasks`
        });
      }
    } catch (notifErr) {
      console.warn('[TaskService] Notification warning:', notifErr.message);
    }

    return { success: true, taskId: task.id, status: newStatus };
  }

  /**
   * Get Tasks for Volunteer Dashboard (categorized)
   */
  async getVolunteerTaskBoard(volunteerIdentifier) {
    const effectiveVolunteerId = await this.resolveVolunteerId(volunteerIdentifier);

    const allAssignments = await db.query(
      `SELECT t.*, ta.status AS assignment_status, ta.assigned_at, ta.accepted_at, ta.completed_at,
              c.name AS campaign_name, c.code AS campaign_code, ff.title AS form_title,
              d.name AS district_name, r.name AS region_name
       FROM task_assignments ta
       JOIN tasks t ON t.id = ta.task_id
       LEFT JOIN campaigns c ON c.id = t.campaign_id
       LEFT JOIN field_forms ff ON ff.id = t.field_form_id
       LEFT JOIN districts d ON d.id = t.district_id
       LEFT JOIN regions r ON r.id = t.region_id
       WHERE ta.volunteer_id = ? OR ta.volunteer_id = ?
       ORDER BY t.start_datetime ASC`,
      [effectiveVolunteerId, volunteerIdentifier]
    );

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const todayTasks = [];
    const upcomingTasks = [];
    const overdueTasks = [];
    const completedTasks = [];
    const pendingReviewTasks = [];

    for (const t of allAssignments) {
      const rawStart = t.start_datetime ? (typeof t.start_datetime === 'string' ? t.start_datetime : new Date(t.start_datetime).toISOString()) : '';
      const startDay = rawStart.split('T')[0] || rawStart.split(' ')[0];
      const deadline = new Date(t.deadline_datetime);

      if (t.assignment_status === 'COMPLETED' || t.status === 'COMPLETED') {
        completedTasks.push(t);
      } else if (t.assignment_status === 'SUBMITTED' || t.status === 'UNDER_REVIEW' || t.status === 'SUBMITTED') {
        pendingReviewTasks.push(t);
      } else if (deadline < now && t.assignment_status !== 'COMPLETED' && t.status !== 'COMPLETED') {
        overdueTasks.push(t);
      } else if (startDay === todayStr) {
        todayTasks.push(t);
      } else {
        upcomingTasks.push(t);
      }
    }

    return {
      today: todayTasks,
      upcoming: upcomingTasks,
      overdue: overdueTasks,
      completed: completedTasks,
      pendingReview: pendingReviewTasks,
      totalCount: allAssignments.length
    };
  }

  /**
   * Calendar schedule events aggregation
   */
  async getSchedules({ volunteerId, campaignId, startDate, endDate }) {
    let whereClauses = [];
    let params = [];

    if (volunteerId) {
      whereClauses.push('s.volunteer_id = ?');
      params.push(volunteerId);
    }

    if (campaignId) {
      whereClauses.push('s.campaign_id = ?');
      params.push(campaignId);
    }

    if (startDate) {
      whereClauses.push('s.start_time >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push('s.end_time <= ?');
      params.push(endDate);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    return await db.query(
      `SELECT s.*, t.priority, t.task_type, t.status AS task_status,
              c.name AS campaign_name, u.full_name AS volunteer_name
       FROM schedules s
       LEFT JOIN tasks t ON t.id = s.task_id
       LEFT JOIN campaigns c ON c.id = s.campaign_id
       LEFT JOIN volunteers v ON v.id = s.volunteer_id
       LEFT JOIN users u ON u.id = v.user_id
       ${whereStr}
       ORDER BY s.start_time ASC`,
      params
    );
  }

  /**
   * Update task details
   */
  async updateTask(id, data, actorId) {
    const task = await this.getTaskById(id);
    if (!task) throw { status: 404, message: 'Task not found' };

    const {
      title, taskType, description, instructions, priority, status,
      regionId, districtId, communityId, targetLocationName,
      latitude, longitude, startDatetime, deadlineDatetime, fieldFormId
    } = data;

    await db.execute(
      `UPDATE tasks SET
        title = COALESCE(?, title),
        task_type = COALESCE(?, task_type),
        description = COALESCE(?, description),
        instructions = COALESCE(?, instructions),
        priority = COALESCE(?, priority),
        status = COALESCE(?, status),
        region_id = COALESCE(?, region_id),
        district_id = COALESCE(?, district_id),
        community_id = COALESCE(?, community_id),
        target_location_name = COALESCE(?, target_location_name),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        start_datetime = COALESCE(?, start_datetime),
        deadline_datetime = COALESCE(?, deadline_datetime),
        field_form_id = COALESCE(?, field_form_id),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title, taskType, description, instructions, priority, status,
        regionId, districtId, communityId, targetLocationName,
        latitude, longitude, startDatetime, deadlineDatetime, fieldFormId, task.id
      ]
    );

    logAudit({
      userId: actorId,
      action: 'TASK_UPDATED',
      module: 'TASKS',
      entityName: 'Task',
      entityId: task.id,
      newValues: { title, priority, status }
    });

    return await this.getTaskById(task.id);
  }

  /**
   * Delete task
   */
  async deleteTask(id, actorId) {
    const task = await this.getTaskById(id);
    if (!task) throw { status: 404, message: 'Task not found' };

    await db.execute(`DELETE FROM field_submissions WHERE task_id = ?`, [task.id]);
    await db.execute(`DELETE FROM schedules WHERE task_id = ?`, [task.id]);
    await db.execute(`DELETE FROM task_assignments WHERE task_id = ?`, [task.id]);
    await db.execute(`DELETE FROM tasks WHERE id = ?`, [task.id]);

    logAudit({
      userId: actorId,
      action: 'TASK_DELETED',
      module: 'TASKS',
      entityName: 'Task',
      entityId: task.id
    });

    return { success: true, message: 'Task deleted successfully' };
  }
}

module.exports = new TaskService();
