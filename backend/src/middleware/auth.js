const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { unauthorized, forbidden } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'caafimaadhub_super_secure_jwt_secret_key_somalia_2026_!@#';

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return unauthorized(res, 'Authentication token required');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return unauthorized(res, 'Invalid or expired authentication token', 'TOKEN_EXPIRED');
    }

    // Fetch user and verify active status
    const user = await db.getOne(
      `SELECT u.id, u.organization_id, u.region_id, u.district_id, u.full_name, u.email, u.phone, 
              u.preferred_language, u.profile_image_url, u.avatar_url, u.role, u.status, u.region, u.district,
              u.is_active, u.is_suspended, u.suspension_reason,
              v.id AS volunteer_profile_id, v.volunteer_id, v.status AS volunteer_status
       FROM users u
       LEFT JOIN volunteers v ON v.user_id = u.id
       WHERE u.id = ?`,
      [decoded.userId]
    );

    if (!user) {
      return unauthorized(res, 'User account does not exist');
    }

    if (user.is_suspended) {
      return forbidden(res, `Account has been suspended: ${user.suspension_reason || 'Please contact system administrator'}`, 'ACCOUNT_SUSPENDED');
    }

    if (!user.is_active) {
      return forbidden(res, 'Account is inactive', 'ACCOUNT_INACTIVE');
    }

    // Fetch user roles
    const userRoles = await db.query(
      `SELECT r.id, r.name, r.display_name 
       FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = ?`,
      [user.id]
    );

    const rolesList = userRoles.map(r => r.name);
    const primaryRole = rolesList[0] || user.role || 'PUBLIC_USER';

    // Fetch granular permissions
    let permissions = [];
    if (rolesList.includes('SUPER_ADMIN') || user.role === 'Superadmin') {
      // Super admin has all permissions
      const allPerms = await db.query(`SELECT code FROM permissions`);
      permissions = allPerms.map(p => p.code);
    } else {
      const permRows = await db.query(
        `SELECT DISTINCT p.code 
         FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         JOIN user_roles ur ON ur.role_id = rp.role_id
         WHERE ur.user_id = ?`,
        [user.id]
      );
      permissions = permRows.map(p => p.code);
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      profileImageUrl: user.profile_image_url || user.avatar_url,
      avatarUrl: user.avatar_url || user.profile_image_url,
      organizationId: user.organization_id,
      regionId: user.region_id,
      districtId: user.district_id,
      region: user.region || 'Banadir',
      district: user.district || 'Hodan',
      status: user.status || 'active',
      roles: rolesList,
      role: primaryRole,
      permissions,
      volunteerId: user.volunteer_profile_id,
      volunteerCode: user.volunteer_id,
      volunteerStatus: user.volunteer_status,
      preferredLanguage: user.preferred_language
    };

    next();
  } catch (err) {
    console.error('[AuthMiddleware] Error:', err);
    return unauthorized(res, 'Authentication failed');
  }
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // The volunteer profile is joined here as well, otherwise routes behind
    // optionalAuth (course list, course detail) cannot resolve the learner and
    // would never return their enrollment progress or certificate.
    const user = await db.getOne(
      `SELECT u.id, u.full_name, u.email, u.organization_id, u.region_id, u.district_id,
              v.id AS volunteer_profile_id, v.volunteer_id, v.status AS volunteer_status
       FROM users u
       LEFT JOIN volunteers v ON v.user_id = u.id
       WHERE u.id = ? AND u.is_active = 1 AND u.is_suspended = 0`,
      [decoded.userId]
    );
    if (user) {
      const userRoles = await db.query(
        `SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`,
        [user.id]
      );
      req.user = {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: userRoles[0] ? userRoles[0].name : 'PUBLIC_USER',
        roles: userRoles.map(r => r.name),
        organizationId: user.organization_id,
        regionId: user.region_id,
        districtId: user.district_id,
        volunteerId: user.volunteer_profile_id,
        volunteerCode: user.volunteer_id,
        volunteerStatus: user.volunteer_status
      };
    }
  } catch (e) {
    req.user = null;
  }
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, 'Authentication required');
    }
    const hasRole = req.user.roles && req.user.roles.some(r => allowedRoles.includes(r));
    if (!hasRole && !allowedRoles.includes(req.user.role)) {
      return forbidden(res, 'You do not have permission to perform this action');
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole
};
