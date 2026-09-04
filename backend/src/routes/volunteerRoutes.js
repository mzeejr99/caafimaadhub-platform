const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, requireScopeAccess } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', requirePermission('volunteers.view'), requireScopeAccess, (req, res, next) => volunteerController.getVolunteers(req, res, next));
router.post('/', requirePermission('volunteers.create'), (req, res, next) => volunteerController.createVolunteer(req, res, next));
router.get('/:id', requirePermission('volunteers.view'), (req, res, next) => volunteerController.getVolunteerById(req, res, next));
router.post('/:id/approve', requirePermission('volunteers.approve'), (req, res, next) => volunteerController.approveVolunteer(req, res, next));
router.post('/:id/reject', requirePermission('volunteers.approve'), (req, res, next) => volunteerController.rejectVolunteer(req, res, next));
router.put('/:id/status', requirePermission('volunteers.update'), (req, res, next) => volunteerController.updateStatus(req, res, next));
router.put('/:id/profile', (req, res, next) => volunteerController.updateProfile(req, res, next));
router.delete('/:id', requirePermission('volunteers.delete'), (req, res, next) => volunteerController.deleteVolunteer(req, res, next));

module.exports = router;
