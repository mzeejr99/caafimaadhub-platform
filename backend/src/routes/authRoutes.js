const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/register', (req, res, next) => authController.registerVolunteer(req, res, next));
router.post('/register-volunteer', (req, res, next) => authController.registerVolunteer(req, res, next));
router.post('/register-public', (req, res, next) => authController.registerPublicUser(req, res, next));
router.post('/refresh', (req, res, next) => authController.refreshToken(req, res, next));
router.post('/change-password', authenticateToken, (req, res, next) => authController.changePassword(req, res, next));
router.get('/me', authenticateToken, (req, res, next) => authController.getMe(req, res, next));
router.put('/profile', authenticateToken, (req, res, next) => authController.updateProfile(req, res, next));

module.exports = router;
