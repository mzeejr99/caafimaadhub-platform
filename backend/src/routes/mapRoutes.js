const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, requireScopeAccess } = require('../middleware/rbac');

router.use(authenticateToken);
router.get('/', requirePermission('maps.view'), requireScopeAccess, (req, res, next) => mapController.getMapData(req, res, next));

module.exports = router;
