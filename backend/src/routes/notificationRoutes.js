const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/me', (req, res, next) => notificationController.getMyNotifications(req, res, next));
router.put('/:id/read', (req, res, next) => notificationController.markAsRead(req, res, next));
router.put('/read-all', (req, res, next) => notificationController.markAllAsRead(req, res, next));
router.post('/broadcast', requirePermission('notifications.send'), (req, res, next) => notificationController.broadcast(req, res, next));
router.get('/sms-logs', requireRole('ADMIN', 'SUPER_ADMIN', 'OPERATIONAL'), (req, res, next) => notificationController.getSmsLogs(req, res, next));
router.post('/sms-broadcast', requireRole('ADMIN', 'SUPER_ADMIN', 'OPERATIONAL'), (req, res, next) => notificationController.sendSmsBroadcast(req, res, next));
router.get('/sms-stats', requireRole('ADMIN', 'SUPER_ADMIN', 'OPERATIONAL'), (req, res, next) => notificationController.getSmsStats(req, res, next));

module.exports = router;
