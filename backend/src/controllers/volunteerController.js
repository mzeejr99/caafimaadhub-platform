const volunteerService = require('../services/volunteerService');
const { success, created, notFound, badRequest } = require('../utils/response');

class VolunteerController {
  async getVolunteers(req, res, next) {
    try {
      const { search, status, regionId, districtId, organizationId, skill, limit, offset } = req.query;
      const result = await volunteerService.getVolunteers({
        search,
        status,
        regionId: req.scopedRegionId || regionId,
        districtId: req.scopedDistrictId || districtId,
        organizationId: req.scopedOrgId || organizationId,
        skill,
        limit,
        offset
      });
      return success(res, result.volunteers, 'Volunteers retrieved', 200, {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      });
    } catch (err) {
      next(err);
    }
  }

  async getVolunteerById(req, res, next) {
    try {
      const vol = await volunteerService.getVolunteerById(req.params.id);
      if (!vol) return notFound(res, 'Volunteer not found');
      return success(res, vol, 'Volunteer details');
    } catch (err) {
      next(err);
    }
  }

  async approveVolunteer(req, res, next) {
    try {
      const { reviewNotes } = req.body;
      const result = await volunteerService.approveVolunteer(req.params.id, req.user.id, reviewNotes);
      return success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  async rejectVolunteer(req, res, next) {
    try {
      const { reason } = req.body;
      const result = await volunteerService.rejectVolunteer(req.params.id, req.user.id, reason);
      return success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status, notes } = req.body;
      if (!status) return badRequest(res, 'Status is required');
      const result = await volunteerService.updateStatus(req.params.id, status, req.user.id, notes);
      return success(res, result, 'Volunteer status updated');
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const volId = req.user.role === 'VOLUNTEER' ? req.user.volunteerId : req.params.id;
      const result = await volunteerService.updateVolunteerProfile(volId, req.body, req.user.id);
      return success(res, result, 'Volunteer profile updated');
    } catch (err) {
      next(err);
    }
  }

  async createVolunteer(req, res, next) {
    try {
      const payload = {
        ...req.body,
        status: req.body.status || 'active'
      };
      const result = await volunteerService.registerVolunteer(payload);
      return created(res, result, 'Volunteer created successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteVolunteer(req, res, next) {
    try {
      const result = await volunteerService.deleteVolunteer(req.params.id, req.user.id);
      return success(res, result, 'Volunteer deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new VolunteerController();
