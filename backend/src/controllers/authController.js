const authService = require('../services/authService');
const { success, created, badRequest } = require('../utils/response');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, phone, identifier, username, password } = req.body;
      const effectiveIdentifier = email || phone || identifier || username;
      if (!effectiveIdentifier || !password) {
        return badRequest(res, 'Email/Phone and password are required');
      }
      const result = await authService.login(effectiveIdentifier, password, req.ip, req.headers['user-agent']);
      return success(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  async registerVolunteer(req, res, next) {
    try {
      const { fullName, full_name, email, password, phone, regionId, region_name, districtId, district_name, gender } = req.body;
      const name = fullName || full_name;
      const region = regionId || region_name;
      const district = districtId || district_name;
      if (!name || !email || !password || !region || !district) {
        return badRequest(res, 'Full name, email, password, region, and district are required');
      }
      const result = await authService.registerVolunteer(req.body, req.ip);
      return created(res, result, result.message || 'Volunteer registration successful');
    } catch (err) {
      next(err);
    }
  }

  async registerPublicUser(req, res, next) {
    try {
      const { fullName, full_name, email, password } = req.body;
      const name = fullName || full_name;
      if (!name || !email || !password) {
        return badRequest(res, 'Full name, email, and password are required');
      }
      const result = await authService.registerPublicUser(req.body, req.ip);
      return created(res, result, result.message || 'Registration successful. You can now log in.');
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      return success(res, result, 'Token refreshed');
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return badRequest(res, 'Current password and new password are required');
      }
      const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
      return success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user.id);
      return success(res, user, 'Current user profile');
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const result = await authService.updateProfile(req.user.id, req.body);
      return success(res, result, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
