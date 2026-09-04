const db = require('../config/db');
const { logAudit } = require('../middleware/auditLogger');

class SettingsService {
  /**
   * Get all settings (or public settings only)
   */
  async getSettings(isPublicOnly = false) {
    let sql = `SELECT * FROM system_settings`;
    if (isPublicOnly) {
      sql += ` WHERE is_public = 1`;
    }
    const rows = await db.query(sql);
    const settingsMap = {};
    for (const r of rows) {
      try {
        settingsMap[r.setting_key] = JSON.parse(r.setting_value);
      } catch (e) {
        settingsMap[r.setting_key] = r.setting_value;
      }
    }
    return settingsMap;
  }

  /**
   * Update setting value
   */
  async updateSetting(key, value, actorId) {
    const valStr = typeof value === 'object' ? JSON.stringify(value) : '' + value;
    const existing = await db.getOne(`SELECT * FROM system_settings WHERE setting_key = ?`, [key]);

    if (existing) {
      await db.execute(
        `UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?`,
        [valStr, key]
      );
    } else {
      await db.execute(
        `INSERT INTO system_settings (setting_key, setting_value, category, is_public) VALUES (?, ?, 'GENERAL', 0)`,
        [key, valStr]
      );
    }

    logAudit({
      userId: actorId,
      action: 'SETTING_UPDATED',
      module: 'SETTINGS',
      entityName: 'SystemSetting',
      entityId: key,
      newValues: { key, value }
    });

    return { key, value };
  }
}

module.exports = new SettingsService();
