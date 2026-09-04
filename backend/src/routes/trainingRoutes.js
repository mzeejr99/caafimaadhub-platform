const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');

router.get('/verify/:code', (req, res, next) => trainingController.verifyCertificate(req, res, next));
router.get('/certificates/me', authenticateToken, (req, res, next) => trainingController.getCertificates(req, res, next));
router.get('/me', authenticateToken, (req, res, next) => trainingController.getCertificates(req, res, next));
router.get('/certificates/all', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), (req, res, next) => trainingController.getAllCertificates(req, res, next));
router.get('/all', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), (req, res, next) => trainingController.getAllCertificates(req, res, next));
router.post('/certificates/issue', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), (req, res, next) => trainingController.issueCertificate(req, res, next));
router.post('/issue', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), (req, res, next) => trainingController.issueCertificate(req, res, next));
router.get('/', optionalAuth, (req, res, next) => trainingController.getCourses(req, res, next));
router.get('/:id/quiz', authenticateToken, (req, res, next) => trainingController.getQuiz(req, res, next));
router.get('/:id', optionalAuth, (req, res, next) => trainingController.getCourseById(req, res, next));
router.post('/', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), (req, res, next) => trainingController.createCourse(req, res, next));
router.put('/:id', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), (req, res, next) => trainingController.updateCourse(req, res, next));
router.delete('/:id', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), (req, res, next) => trainingController.deleteCourse(req, res, next));
router.post('/:id/enroll', authenticateToken, (req, res, next) => trainingController.enrollVolunteer(req, res, next));
router.put('/:id/progress', authenticateToken, (req, res, next) => trainingController.updateProgress(req, res, next));
router.post('/:id/quiz', authenticateToken, (req, res, next) => trainingController.submitQuiz(req, res, next));
router.post('/:id/quiz/submit', authenticateToken, (req, res, next) => trainingController.submitQuiz(req, res, next));

module.exports = router;
