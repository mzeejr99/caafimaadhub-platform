const campaignService = require('../services/campaignService');
const { success, created, notFound, badRequest } = require('../utils/response');

class CampaignController {
  async getCampaigns(req, res, next) {
    try {
      const { search, type, status, regionId, districtId, managerId, limit, offset } = req.query;
      const isSuperOrVolunteer = req.user?.role === 'Superadmin' || req.user?.role === 'Volunteer' || req.user?.roles?.includes('SUPER_ADMIN') || req.user?.roles?.includes('VOLUNTEER');
      const targetRegionId = isSuperOrVolunteer ? regionId : (req.scopedRegionId || regionId);
      const targetDistrictId = isSuperOrVolunteer ? districtId : (req.scopedDistrictId || districtId);

      const result = await campaignService.getCampaigns({
        search,
        type,
        status,
        regionId: targetRegionId,
        districtId: targetDistrictId,
        managerId,
        limit,
        offset
      });
      return success(res, result.campaigns, 'Campaigns retrieved', 200, {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      });
    } catch (err) {
      next(err);
    }
  }

  async getCampaignById(req, res, next) {
    try {
      const campaign = await campaignService.getCampaignById(req.params.id);
      if (!campaign) return notFound(res, 'Campaign not found');
      return success(res, campaign, 'Campaign details');
    } catch (err) {
      next(err);
    }
  }

  async createCampaign(req, res, next) {
    try {
      const campaign = await campaignService.createCampaign(req.body, req.user.id);
      return created(res, campaign, 'Campaign created successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateCampaign(req, res, next) {
    try {
      const campaign = await campaignService.updateCampaign(req.params.id, req.body, req.user.id);
      return success(res, campaign, 'Campaign updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async assignVolunteer(req, res, next) {
    try {
      const { volunteerId } = req.body;
      if (!volunteerId) return badRequest(res, 'Volunteer ID is required');
      const result = await campaignService.assignVolunteer(req.params.id, volunteerId, req.user.id);
      return success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  async deleteCampaign(req, res, next) {
    try {
      const result = await campaignService.deleteCampaign(req.params.id, req.user.id);
      return success(res, result, 'Campaign deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  async getPublicCampaigns(req, res, next) {
    try {
      const campaigns = await campaignService.getPublicCampaigns();
      return success(res, campaigns, 'Public campaigns retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CampaignController();
