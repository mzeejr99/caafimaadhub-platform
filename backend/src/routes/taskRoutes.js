const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, requireScopeAccess } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/board', (req, res, next) => taskController.getVolunteerTaskBoard(req, res, next));
router.get('/schedules', (req, res, next) => taskController.getSchedules(req, res, next));
router.get('/', requirePermission('tasks.view'), requireScopeAccess, (req, res, next) => taskController.getTasks(req, res, next));
router.get('/:id', requirePermission('tasks.view'), (req, res, next) => taskController.getTaskById(req, res, next));
router.post('/', requirePermission('tasks.create'), (req, res, next) => taskController.createTask(req, res, next));
router.put('/:id/status', (req, res, next) => taskController.updateTaskStatus(req, res, next));
router.put('/:id', requirePermission('tasks.update'), (req, res, next) => taskController.updateTask(req, res, next));
router.delete('/:id', requirePermission('tasks.delete'), (req, res, next) => taskController.deleteTask(req, res, next));

module.exports = router;
