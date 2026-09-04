const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, requireScopeAccess } = require('../middleware/rbac');

router.get('/public', (req, res, next) => analyticsController.getPublicStats(req, res, next));

router.use(authenticateToken);
router.get('/dashboard', (req, res, next) => analyticsController.getAdminDashboard(req, res, next));
router.get('/super-admin', requirePermission('settings.manage'), (req, res, next) => analyticsController.getSuperAdminDashboard(req, res, next));
router.get('/admin', requirePermission('analytics.view'), requireScopeAccess, (req, res, next) => analyticsController.getAdminDashboard(req, res, next));
router.get('/trends', requirePermission('analytics.view'), requireScopeAccess, (req, res, next) => analyticsController.getDetailedAnalytics(req, res, next));

module.exports = router;
