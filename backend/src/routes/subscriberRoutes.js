const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriberController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// Public: anyone can subscribe
router.post('/', (req, res, next) => subscriberController.subscribe(req, res, next));

// Admin: view, unsubscribe, delete
router.get('/', authenticateToken, requirePermission('feedback.view'), (req, res, next) => subscriberController.getSubscribers(req, res, next));
router.put('/:id/unsubscribe', authenticateToken, requirePermission('feedback.respond'), (req, res, next) => subscriberController.unsubscribe(req, res, next));
router.delete('/:id', authenticateToken, requirePermission('feedback.respond'), (req, res, next) => subscriberController.deleteSubscriber(req, res, next));

module.exports = router;
