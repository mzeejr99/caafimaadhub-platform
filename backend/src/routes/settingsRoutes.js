const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.get('/', optionalAuth, (req, res, next) => settingsController.getSettings(req, res, next));
router.put('/', authenticateToken, requirePermission('settings.manage'), (req, res, next) => settingsController.updateSetting(req, res, next));

module.exports = router;
