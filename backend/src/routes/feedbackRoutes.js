const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// Public feedback submission
router.post('/submit', (req, res, next) => feedbackController.submitFeedback(req, res, next));

// Authenticated administration
router.get('/', authenticateToken, requirePermission('feedback.view'), (req, res, next) => feedbackController.getFeedbackList(req, res, next));
router.put('/:id/status', authenticateToken, requirePermission('feedback.respond'), (req, res, next) => feedbackController.updateFeedbackStatus(req, res, next));
router.delete('/:id', authenticateToken, requirePermission('feedback.respond'), (req, res, next) => feedbackController.deleteFeedback(req, res, next));

module.exports = router;
