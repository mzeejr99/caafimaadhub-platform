const userService = require('../services/userService');
const authService = require('../services/authService');
const { success, created, notFound, badRequest } = require('../utils/response');

class UserController {
  async getUsers(req, res, next) {
    try {
      const { search, role, status, organizationId, regionId, limit, offset } = req.query;
      const result = await userService.getUsers({
        search,
        role,
        status,
        organizationId,
        regionId,
        limit,
        offset
      }, req.user);

      return success(res, result.users, 'Users retrieved successfully', 200, {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      });
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) return notFound(res, 'User not found');
      return success(res, user, 'User details');
    } catch (err) {
      next(err);
    }
  }

  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body, req.user);
      return created(res, user, 'User created successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body, req.user);
      return success(res, user, 'User updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const { status, reason } = req.body;
      if (!status) return badRequest(res, 'Status is required (active, pending, or deactivated)');
      const result = await userService.updateUserStatus(req.params.id, status, reason, req.user);
      return success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  async toggleSuspension(req, res, next) {
    try {
      const { isSuspended, reason } = req.body;
      const status = isSuspended ? 'deactivated' : 'active';
      const result = await userService.updateUserStatus(req.params.id, status, reason, req.user);
      return success(res, result, isSuspended ? 'User suspended' : 'User activated');
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { newPassword, password } = req.body;
      const pwd = newPassword || password;
      if (!pwd) return badRequest(res, 'New password is required');
      const user = await userService.updateUser(req.params.id, { password: pwd }, req.user);
      return success(res, user, 'Password updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await userService.deleteUser(req.params.id, req.user);
      return success(res, result, 'User deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await authService.getMe(req.user.id);
      return success(res, user, 'Current user profile');
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user.id, req.body);
      return success(res, user, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async getRolesAndPermissions(req, res, next) {
    try {
      const roles = [
        { id: 'role-super-admin', name: 'Superadmin', display_name: 'Super Administrator' },
        { id: 'role-admin', name: 'Admin', display_name: 'Administrator' },
        { id: 'role-analyst', name: 'DataAnalyst', display_name: 'Data Analyst' },
        { id: 'role-volunteer', name: 'Volunteer', display_name: 'Community Health Volunteer' },
        { id: 'role-public', name: 'Public', display_name: 'Public User' }
      ];
      return success(res, { roles }, 'Roles and permissions');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
