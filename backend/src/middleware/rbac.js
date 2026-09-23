const { forbidden } = require('../utils/response');

function isSuperAdminUser(user) {
  if (!user) return false;
  const roleUpper = (user.role || '').toUpperCase();
  const rolesUpper = Array.isArray(user.roles) ? user.roles.map(r => String(r).toUpperCase()) : [];
  return roleUpper === 'SUPER_ADMIN' || roleUpper === 'SUPERADMIN' || rolesUpper.includes('SUPER_ADMIN') || rolesUpper.includes('SUPERADMIN');
}

/**
 * Require one or more roles
 */
function requireRole(...allowedRoles) {
  const normalizedAllowed = allowedRoles.map(r => String(r).toUpperCase().replace(/_/g, ''));
  return (req, res, next) => {
    if (!req.user) {
      return forbidden(res, 'Authentication required');
    }

    if (isSuperAdminUser(req.user)) {
      return next();
    }

    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles.map(r => String(r).toUpperCase().replace(/_/g, ''))
      : [];
    
    if (req.user.role) {
      userRoles.push(String(req.user.role).toUpperCase().replace(/_/g, ''));
    }

    const hasRole = userRoles.some(role => normalizedAllowed.includes(role));
    if (!hasRole) {
      return forbidden(res, `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`);
    }

    next();
  };
}

/**
 * Require a granular permission
 */
function requirePermission(permissionCode) {
  return (req, res, next) => {
    if (!req.user) {
      return forbidden(res, 'Authentication required');
    }

    if (isSuperAdminUser(req.user)) {
      return next();
    }

    const roleUpper = (req.user.role || '').toUpperCase().replace(/_/g, '');
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles.map(r => String(r).toUpperCase().replace(/_/g, '')) : [];
    const isAdmin = roleUpper === 'ADMIN' || userRoles.includes('ADMIN');

    if (isAdmin) {
      return next();
    }

    if (!req.user.permissions || !req.user.permissions.includes(permissionCode)) {
      return forbidden(res, `Access denied. Missing required permission: ${permissionCode}`, 'PERMISSION_DENIED');
    }

    next();
  };
}

/**
 * Verify organization or regional scoping for operational admins
 */
function requireScopeAccess(req, res, next) {
  if (!req.user) return forbidden(res, 'Authentication required');

  if (isSuperAdminUser(req.user)) {
    return next();
  }

  // Attach scope filtering params for controllers
  req.scopedOrgId = req.user.organizationId;
  req.scopedRegionId = req.user.regionId;
  req.scopedDistrictId = req.user.districtId;

  next();
}

module.exports = {
  requireRole,
  requirePermission,
  requireScopeAccess
};
