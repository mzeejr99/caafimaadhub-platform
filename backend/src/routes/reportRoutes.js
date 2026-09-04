const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, requireScopeAccess } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/volunteers', requirePermission('reports.view'), requireScopeAccess, (req, res, next) => reportController.getVolunteersReport(req, res, next));
router.get('/campaigns', requirePermission('reports.view'), (req, res, next) => reportController.getCampaignsReport(req, res, next));
router.get('/field-activity', requirePermission('reports.view'), (req, res, next) => reportController.getFieldActivityReport(req, res, next));
router.get('/inventory', requirePermission('reports.view'), (req, res, next) => reportController.getInventoryReport(req, res, next));

module.exports = router;
