const db = require('../config/db');
const { uuid } = require('../utils/idGenerator');
const smsService = require('./smsService');

class NotificationService {
  /**
   * Create an in-app notification
   */
  async createNotification({ userId, title, message, type = 'SYSTEM', actionUrl = null, sendSms = false, phone = null }) {
    const id = uuid();

    await db.execute(
      `INSERT INTO notifications (id, user_id, title, message, type, action_url, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
      [id, userId, title, message, type, actionUrl]
    );

    if (sendSms) {
      let targetPhone = phone;
      if (!targetPhone) {
        const user = await db.getOne(`SELECT phone FROM users WHERE id = ?`, [userId]);
        if (user) targetPhone = user.phone;
      }

      if (targetPhone) {
        await smsService.sendSms({
          to: targetPhone,
          message: `${title}: ${message}`,
          userId
        });
      }
    }

    return { id, userId, title, message, type, actionUrl };
  }

  /**
   * Notify multiple users (e.g. all volunteers in a campaign)
   */
  async notifyUsers(userIds, { title, message, type = 'SYSTEM', actionUrl = null, sendSms = false }) {
    for (const userId of userIds) {
      await this.createNotification({
        userId,
        title,
        message,
        type,
        actionUrl,
        sendSms
      });
    }
  }

  /**
   * Get user notifications with unread count
   */
  async getUserNotifications(userId, limit = 30, offset = 0) {
    const notifications = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const unreadCountRow = await db.getOne(
      `SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    return {
      notifications,
      unreadCount: unreadCountRow ? unreadCountRow.unread_count : 0
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    await db.execute(
      `UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );
    return true;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    await db.execute(
      `UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    return true;
  }
}

module.exports = new NotificationService();
