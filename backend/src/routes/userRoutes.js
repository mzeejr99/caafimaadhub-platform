const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole, requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);

// User self-profile endpoints: GET /api/users/profile, PUT /api/users/profile
router.get('/profile', (req, res, next) => userController.getProfile(req, res, next));
router.put('/profile', (req, res, next) => userController.updateProfile(req, res, next));

// User management endpoints
router.get('/roles-permissions', requirePermission('users.view'), (req, res, next) => userController.getRolesAndPermissions(req, res, next));
router.get('/', requirePermission('users.view'), (req, res, next) => userController.getUsers(req, res, next));
router.get('/:id', requirePermission('users.view'), (req, res, next) => userController.getUserById(req, res, next));
router.post('/', requirePermission('users.create'), (req, res, next) => userController.createUser(req, res, next));
router.put('/:id', requirePermission('users.update'), (req, res, next) => userController.updateUser(req, res, next));
router.patch('/:id/status', requirePermission('users.update'), (req, res, next) => userController.updateUserStatus(req, res, next));
router.put('/:id/suspension', requirePermission('users.suspend'), (req, res, next) => userController.toggleSuspension(req, res, next));
router.post('/:id/reset-password', requirePermission('users.update'), (req, res, next) => userController.resetPassword(req, res, next));
router.delete('/:id', requirePermission('users.delete'), (req, res, next) => userController.deleteUser(req, res, next));

module.exports = router;
