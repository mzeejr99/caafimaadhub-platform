const express = require('express');
const router = express.Router();
const fieldDataController = require('../controllers/fieldDataController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/forms', (req, res, next) => fieldDataController.getForms(req, res, next));
router.get('/forms/:id', (req, res, next) => fieldDataController.getFormById(req, res, next));
router.post('/forms', requirePermission('field_data.create'), (req, res, next) => fieldDataController.createForm(req, res, next));
router.post('/submit', requirePermission('field_data.create'), (req, res, next) => fieldDataController.submitFieldData(req, res, next));
router.post('/sync-batch', requirePermission('field_data.create'), (req, res, next) => fieldDataController.syncOfflineBatch(req, res, next));
router.get('/', (req, res, next) => fieldDataController.getSubmissions(req, res, next));
router.get('/submissions', (req, res, next) => fieldDataController.getSubmissions(req, res, next));
router.get('/submissions/:id', (req, res, next) => fieldDataController.getSubmissionById(req, res, next));
router.post('/submissions/:id/review', requirePermission('field_data.approve'), (req, res, next) => fieldDataController.reviewSubmission(req, res, next));
router.delete('/submissions/:id', requirePermission('field_data.delete'), (req, res, next) => fieldDataController.deleteSubmission(req, res, next));

module.exports = router;
