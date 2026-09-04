const settingsService = require('../services/settingsService');
const { success } = require('../utils/response');

class SettingsController {
  async getSettings(req, res, next) {
    try {
      const isPublic = !req.user || !req.user.permissions || !req.user.permissions.includes('settings.manage');
      const settings = await settingsService.getSettings(isPublic);
      return success(res, settings, 'Settings retrieved');
    } catch (err) {
      next(err);
    }
  }

  async updateSetting(req, res, next) {
    try {
      const { key, value } = req.body;
      const result = await settingsService.updateSetting(key, value, req.user.id);
      return success(res, result, 'Setting updated');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SettingsController();
