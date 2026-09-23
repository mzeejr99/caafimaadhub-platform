const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/items', (req, res, next) => {
  const isSuper = req.user?.role === 'Superadmin' || req.user?.roles?.includes('SUPER_ADMIN');
  const isAdmin = req.user?.role === 'Admin' || req.user?.roles?.includes('ADMIN');
  const hasPerm = req.user?.permissions?.includes('inventory.view') || req.user?.permissions?.includes('supply_requests.create') || req.user?.permissions?.includes('supply_requests.view');
  const isVol = req.user?.role === 'Volunteer' || req.user?.roles?.includes('VOLUNTEER');
  if (isSuper || isAdmin || hasPerm || isVol) {
    return inventoryController.getItems(req, res, next);
  }
  return requirePermission('inventory.view')(req, res, next);
});
router.get('/items/:id', (req, res, next) => {
  const isSuper = req.user?.role === 'Superadmin' || req.user?.roles?.includes('SUPER_ADMIN');
  const isAdmin = req.user?.role === 'Admin' || req.user?.roles?.includes('ADMIN');
  const hasPerm = req.user?.permissions?.includes('inventory.view') || req.user?.permissions?.includes('supply_requests.create') || req.user?.permissions?.includes('supply_requests.view');
  const isVol = req.user?.role === 'Volunteer' || req.user?.roles?.includes('VOLUNTEER');
  if (isSuper || isAdmin || hasPerm || isVol) {
    return inventoryController.getItemById(req, res, next);
  }
  return requirePermission('inventory.view')(req, res, next);
});
router.post('/items', requirePermission('inventory.create'), (req, res, next) => inventoryController.createItem(req, res, next));
router.put('/items/:id', requirePermission('inventory.update'), (req, res, next) => inventoryController.updateItem(req, res, next));
router.delete('/items/:id', requirePermission('inventory.delete'), (req, res, next) => inventoryController.deleteItem(req, res, next));
router.post('/transactions', requirePermission('inventory.update'), (req, res, next) => inventoryController.recordTransaction(req, res, next));

router.get('/requests', (req, res, next) => inventoryController.getSupplyRequests(req, res, next));
router.get('/requests/me', (req, res, next) => inventoryController.getSupplyRequests(req, res, next));
router.post('/requests', (req, res, next) => inventoryController.createSupplyRequest(req, res, next));
router.post('/requests/:id/review', requirePermission('inventory.issue'), (req, res, next) => inventoryController.reviewSupplyRequest(req, res, next));
router.delete('/requests/:id', requirePermission('inventory.delete'), (req, res, next) => inventoryController.deleteSupplyRequest(req, res, next));

module.exports = router;
