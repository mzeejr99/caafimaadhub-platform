const mapService = require('../services/mapService');
const { success } = require('../utils/response');

class MapController {
  async getMapData(req, res, next) {
    try {
      const { regionId, districtId, campaignId, layer } = req.query;
      const data = await mapService.getMapData({
        regionId: req.scopedRegionId || regionId,
        districtId: req.scopedDistrictId || districtId,
        campaignId,
        layer: layer || 'ALL'
      });
      return success(res, data, 'GIS Map data');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MapController();
