const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');
const { authenticateToken } = require('../middleware/auth');
const { requireScopeAccess } = require('../middleware/rbac');

// All authenticated users with map access: admin, operational, data analyst, superadmin
function requireMapAccess(req, res, next) {
  if (!req.user) {
    return res.status(403).json({ success: false, message: 'Authentication required' });
  }
  const role = (req.user.role || '').toUpperCase().replace(/[_\s-]/g, '');
  const allowed = ['SUPERADMIN', 'ADMIN', 'DATAANALYST', 'ANALYST'];
  if (allowed.includes(role)) return next();
  // Also check permissions array
  if (req.user.permissions && req.user.permissions.includes('maps.view')) return next();
  return res.status(403).json({ success: false, message: 'Access denied. Maps require admin or analyst role.', errorCode: 'PERMISSION_DENIED' });
}

router.use(authenticateToken);
router.get('/', requireMapAccess, requireScopeAccess, (req, res, next) => mapController.getMapData(req, res, next));
router.get('/layers', requireMapAccess, requireScopeAccess, (req, res, next) => mapController.getMapData(req, res, next));

module.exports = router;
