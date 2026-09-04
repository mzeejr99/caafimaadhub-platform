const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.get('/organizations', optionalAuth, (req, res, next) => locationController.getOrganizations(req, res, next));
router.get('/regions', optionalAuth, (req, res, next) => locationController.getRegions(req, res, next));
router.get('/districts', optionalAuth, (req, res, next) => locationController.getDistricts(req, res, next));
router.get('/communities', optionalAuth, (req, res, next) => locationController.getCommunities(req, res, next));
router.get('/facilities', optionalAuth, (req, res, next) => locationController.getFacilities(req, res, next));
router.post('/facilities', authenticateToken, requirePermission('settings.manage'), (req, res, next) => locationController.createFacility(req, res, next));

module.exports = router;
