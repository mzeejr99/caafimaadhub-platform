const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { requirePermission, requireScopeAccess } = require('../middleware/rbac');

router.get('/public', (req, res, next) => campaignController.getPublicCampaigns(req, res, next));

router.use(authenticateToken);

router.get('/', requirePermission('campaigns.view'), requireScopeAccess, (req, res, next) => campaignController.getCampaigns(req, res, next));
router.get('/:id', requirePermission('campaigns.view'), (req, res, next) => campaignController.getCampaignById(req, res, next));
router.post('/', requirePermission('campaigns.create'), (req, res, next) => campaignController.createCampaign(req, res, next));
router.put('/:id', requirePermission('campaigns.update'), (req, res, next) => campaignController.updateCampaign(req, res, next));
router.delete('/:id', requirePermission('campaigns.delete'), (req, res, next) => campaignController.deleteCampaign(req, res, next));
router.post('/:id/assign', requirePermission('campaigns.update'), (req, res, next) => campaignController.assignVolunteer(req, res, next));

module.exports = router;
