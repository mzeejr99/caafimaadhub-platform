const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, requireRole } = require('../middleware/rbac');

router.use(authenticateToken);
router.get('/', requirePermission('audit_logs.view'), (req, res, next) => auditController.getAuditLogs(req, res, next));
router.delete('/', requireRole('SUPER_ADMIN'), (req, res, next) => auditController.clearAuditLogs(req, res, next));

module.exports = router;
