const notificationService = require('../services/notificationService');
const smsService = require('../services/smsService');
const { success, badRequest } = require('../utils/response');

class NotificationController {
  async getMyNotifications(req, res, next) {
    try {
      const { limit, offset } = req.query;
      const result = await notificationService.getUserNotifications(req.user.id, limit, offset);
      return success(res, result.notifications, 'Notifications retrieved', 200, {
        unreadCount: result.unreadCount
      });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      await notificationService.markAsRead(req.params.id, req.user.id);
      return success(res, { id: req.params.id }, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.user.id);
      return success(res, { success: true }, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  }

  async broadcast(req, res, next) {
    try {
      const { userIds, title, message, sendSms, type } = req.body;
      if (!title || !message) return badRequest(res, 'Title and message are required');
      await notificationService.notifyUsers(userIds || [], { title, message, sendSms, type });
      return success(res, { success: true }, 'Broadcast notifications dispatched');
    } catch (err) {
      next(err);
    }
  }

  async getSmsLogs(req, res, next) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const logs = await smsService.getLogs(parseInt(limit, 10), parseInt(offset, 10));
      return success(res, logs, 'SMS logs');
    } catch (err) {
      next(err);
    }
  }

  async sendSmsBroadcast(req, res, next) {
    try {
      const { audience, targetRegion, customNumbers, message, senderId } = req.body;
      if (!message || !message.trim()) {
        return badRequest(res, 'Fariinta SMS-ka waa qasab (Message body is required)');
      }

      const result = await smsService.sendDirectBroadcast({
        audience,
        targetRegion,
        customNumbers,
        message: message.trim(),
        senderId,
        userId: req.user.id
      });

      return success(res, result, 'SMS Broadcast dispatched successfully');
    } catch (err) {
      next(err);
    }
  }

  async getSmsStats(req, res, next) {
    try {
      const stats = await smsService.getStats();
      return success(res, stats, 'SMS dispatch stats');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationController();
