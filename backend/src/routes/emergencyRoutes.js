const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// Emergency reporting (public or volunteer or health worker)
router.post('/report', optionalAuth, (req, res, next) => emergencyController.reportEmergency(req, res, next));

// Authenticated management
router.use(authenticateToken);
router.get('/', requirePermission('emergencies.view'), (req, res, next) => emergencyController.getEmergencyReports(req, res, next));
router.get('/:id', requirePermission('emergencies.view'), (req, res, next) => emergencyController.getEmergencyById(req, res, next));
router.put('/:id/action', requirePermission('emergencies.manage'), (req, res, next) => emergencyController.updateEmergencyAction(req, res, next));
router.delete('/:id', requirePermission('emergencies.manage'), (req, res, next) => emergencyController.deleteEmergency(req, res, next));

module.exports = router;
