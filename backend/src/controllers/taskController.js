const taskService = require('../services/taskService');
const { success, created, notFound, badRequest, forbidden } = require('../utils/response');

class TaskController {
  async getTasks(req, res, next) {
    try {
      const { search, status, priority, taskType, campaignId, volunteerId, regionId, districtId, limit, offset } = req.query;
      const targetVolId = req.user.role === 'VOLUNTEER' ? req.user.volunteerId : volunteerId;

      const result = await taskService.getTasks({
        search,
        status,
        priority,
        taskType,
        campaignId,
        volunteerId: targetVolId,
        regionId: req.scopedRegionId || regionId,
        districtId: req.scopedDistrictId || districtId,
        limit,
        offset
      });
      return success(res, result.tasks, 'Tasks retrieved', 200, {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      });
    } catch (err) {
      next(err);
    }
  }

  async getTaskById(req, res, next) {
    try {
      const task = await taskService.getTaskById(req.params.id);
      if (!task) return notFound(res, 'Task not found');
      return success(res, task, 'Task details');
    } catch (err) {
      next(err);
    }
  }

  async createTask(req, res, next) {
    try {
      const task = await taskService.createTask(req.body, req.user.id);
      return created(res, task, 'Task created successfully');
    } catch (err) {
      next(err);
    }
  }

  async acceptTask(req, res, next) {
    try {
      const volIdentifier = req.user.volunteerId || req.user.id;
      const result = await taskService.updateStatusByVolunteer(req.params.id, volIdentifier, 'ACCEPTED', req.body?.reason, req.user);
      return success(res, result, 'Task accepted successfully');
    } catch (err) {
      next(err);
    }
  }

  async startTask(req, res, next) {
    try {
      const volIdentifier = req.user.volunteerId || req.user.id;
      const result = await taskService.updateStatusByVolunteer(req.params.id, volIdentifier, 'IN_PROGRESS', req.body?.reason, req.user);
      return success(res, result, 'Task started successfully');
    } catch (err) {
      next(err);
    }
  }

  async completeTask(req, res, next) {
    try {
      const volIdentifier = req.user.volunteerId || req.user.id;
      const result = await taskService.updateStatusByVolunteer(req.params.id, volIdentifier, 'COMPLETED', req.body?.reason, req.user);
      return success(res, result, 'Task completed successfully');
    } catch (err) {
      next(err);
    }
  }

  async rejectTask(req, res, next) {
    try {
      const volIdentifier = req.user.volunteerId || req.user.id;
      const result = await taskService.updateStatusByVolunteer(req.params.id, volIdentifier, 'REJECTED', req.body?.reason, req.user);
      return success(res, result, 'Task rejected');
    } catch (err) {
      next(err);
    }
  }

  async updateTaskStatus(req, res, next) {
    try {
      const { status, reason } = req.body;
      if (!status) return badRequest(res, 'Status is required');
      const volIdentifier = req.user.volunteerId || req.user.id;
      const result = await taskService.updateStatusByVolunteer(req.params.id, volIdentifier, status, reason, req.user);
      return success(res, result, 'Task status updated');
    } catch (err) {
      next(err);
    }
  }

  async getVolunteerTaskBoard(req, res, next) {
    try {
      const volId = req.user.volunteerId || req.user.id;
      const board = await taskService.getVolunteerTaskBoard(volId);
      return success(res, board || {
        today: [],
        upcoming: [],
        overdue: [],
        completed: [],
        pendingReview: [],
        assigned: [],
        accepted: [],
        in_progress: [],
        rejected: [],
        all: [],
        counts: { total: 0, today: 0, upcoming: 0, completed: 0 }
      }, 'Volunteer task board');
    } catch (err) {
      next(err);
    }
  }

  async getSchedules(req, res, next) {
    try {
      const { volunteerId, campaignId, startDate, endDate } = req.query;
      const roles = req.user.roles || [req.user.role];
      const isManager = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');

      // Only programme managers may read the full calendar. Everyone else is
      // restricted to their own volunteer profile; accounts without one get nothing.
      if (!isManager && !req.user.volunteerId) {
        return forbidden(res, 'You do not have access to the duty schedule');
      }
      const targetVolId = isManager ? volunteerId : req.user.volunteerId;
      const schedules = await taskService.getSchedules({
        volunteerId: targetVolId,
        campaignId,
        startDate,
        endDate
      });
      return success(res, schedules, 'Schedules retrieved');
    } catch (err) {
      next(err);
    }
  }

  async updateTask(req, res, next) {
    try {
      const task = await taskService.updateTask(req.params.id, req.body, req.user.id);
      return success(res, task, 'Task updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteTask(req, res, next) {
    try {
      const result = await taskService.deleteTask(req.params.id, req.user.id);
      return success(res, result, 'Task deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TaskController();
