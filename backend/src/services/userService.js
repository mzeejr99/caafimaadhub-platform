const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { uuid, generateVolunteerId } = require('../utils/idGenerator');
const { logAudit } = require('../middleware/auditLogger');
const { resolveLocation } = require('../utils/locationResolver');

const normalizeRole = (roleStr) => {
  if (!roleStr) return 'Public';
  const clean = String(roleStr).toUpperCase().replace(/[\s-_]/g, '');
  if (['SUPERADMIN', 'SUPER', 'ROLESUPERADMIN', 'SUPER_ADMIN'].includes(clean)) return 'Superadmin';
  if (['ADMIN', 'OPERATIONAL', 'OPERATIONS', 'ROLEADMIN', 'ROLEOPERATIONAL'].includes(clean)) return 'Admin';
  if (['DATAANALYST', 'ANALYST', 'ROLEDATAANALYST', 'DATA_ANALYST'].includes(clean)) return 'DataAnalyst';
  if (['VOLUNTEER', 'ROLEVOLUNTEER', 'CHV', 'COMMUNITYHEALTHVOLUNTEER'].includes(clean)) return 'Volunteer';
  return 'Public';
};

const getRoleDbCode = (normalizedRole) => {
  switch (normalizedRole) {
    case 'Superadmin': return 'SUPER_ADMIN';
    case 'Admin': return 'ADMIN';
    case 'DataAnalyst': return 'DATA_ANALYST';
    case 'Volunteer': return 'VOLUNTEER';
    default: return 'PUBLIC_USER';
  }
};

const isSuperAdminActor = (actor) => {
  if (!actor) return false;
  return actor.role === 'Superadmin' ||
    actor.role === 'SUPER_ADMIN' ||
    actor.roles?.includes('SUPER_ADMIN') ||
    actor.roles?.includes('Superadmin');
};

class UserService {
  /**
   * List users with search, role filter, status filter, and caller RBAC scoping
   */
  async getUsers({ search, role, status, organizationId, regionId, limit = 50, offset = 0 }, requesterUser = null) {
    let whereClauses = [];
    let params = [];

    // RBAC Scoping: If requester is Admin (and not Superadmin), restrict to Volunteer & Public
    const isSuperAdmin = requesterUser?.role === 'Superadmin' ||
      requesterUser?.role === 'SUPER_ADMIN' ||
      requesterUser?.roles?.includes('SUPER_ADMIN');

    if (!isSuperAdmin) {
      whereClauses.push("(u.role IN ('Volunteer', 'Public', 'VOLUNTEER', 'PUBLIC_USER') OR EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name IN ('VOLUNTEER', 'PUBLIC_USER')))");
    }

    if (search && search.trim()) {
      whereClauses.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.district LIKE ? OR u.village_neighbourhood LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (role && role !== 'ALL') {
      const cleanRole = String(role).toUpperCase().replace(/[\s-_]/g, '');
      let variants = [role, role.toUpperCase()];
      if (cleanRole === 'SUPERADMIN' || cleanRole === 'SUPER_ADMIN') {
        variants.push('Superadmin', 'SUPER_ADMIN', 'SUPERADMIN', 'role-super-admin');
      } else if (cleanRole === 'ADMIN' || cleanRole === 'OPERATIONAL') {
        variants.push('Admin', 'ADMIN', 'Operational', 'OPERATIONAL', 'role-admin', 'role-operational');
      } else if (cleanRole === 'DATAANALYST' || cleanRole === 'DATA_ANALYST' || cleanRole === 'ANALYST') {
        variants.push('DataAnalyst', 'DATA_ANALYST', 'DATAANALYST', 'ANALYST', 'role-analyst');
      } else if (cleanRole === 'VOLUNTEER' || cleanRole === 'CHV') {
        variants.push('Volunteer', 'VOLUNTEER', 'CHV', 'role-volunteer');
      } else if (cleanRole === 'PUBLIC' || cleanRole === 'PUBLICUSER' || cleanRole === 'PUBLIC_USER') {
        variants.push('Public', 'PUBLIC', 'PUBLIC_USER', 'Public User', 'role-public');
      }

      const placeholders = variants.map(() => '?').join(',');
      whereClauses.push(`(u.role IN (${placeholders}) OR EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND (r.name IN (${placeholders}) OR r.id IN (${placeholders}))))`);
      params.push(...variants, ...variants, ...variants);
    }

    if (status && status !== 'ALL') {
      whereClauses.push('u.status = ?');
      params.push(status.toLowerCase());
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = await db.getOne(
      `SELECT COUNT(*) AS total FROM users u ${whereStr}`,
      params
    );

    const rows = await db.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.gender, u.date_of_birth,
              u.profile_image_url, u.avatar_url, u.role, u.status, u.region, u.district,
              u.village_neighbourhood, u.latitude, u.longitude, u.education_level,
              u.languages_spoken, u.motivation_background, u.emergency_contact_name,
              u.emergency_contact_phone, u.preferred_language, u.is_active, u.is_suspended,
              u.suspension_reason, u.last_login, u.created_at, u.updated_at,
              v.id AS volunteer_profile_id, v.volunteer_id AS volunteer_code, v.status AS volunteer_status
       FROM users u
       LEFT JOIN volunteers v ON v.user_id = u.id
       ${whereStr}
       ORDER BY (CASE WHEN u.status = 'pending' THEN 0 ELSE 1 END), u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    for (const user of rows) {
      const roles = await db.query(
        `SELECT r.id, r.name, r.display_name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`,
        [user.id]
      );
      user.roles = roles;
      const rawRole = user.role || (roles[0] ? roles[0].name : 'Public');
      user.role = normalizeRole(rawRole);
      user.profile_image_url = user.profile_image_url || user.avatar_url;
      user.avatar_url = user.avatar_url || user.profile_image_url;
      if (user.languages_spoken && typeof user.languages_spoken === 'string') {
        try {
          user.languages_spoken = JSON.parse(user.languages_spoken);
        } catch (e) {
          user.languages_spoken = [user.languages_spoken];
        }
      }
    }

    return {
      users: rows,
      total: countRow ? countRow.total : 0,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    const user = await db.getOne(
      `SELECT u.*, v.id AS volunteer_profile_id, v.volunteer_id AS volunteer_code, v.status AS volunteer_status
       FROM users u
       LEFT JOIN volunteers v ON v.user_id = u.id
       WHERE u.id = ?`,
      [id]
    );

    if (!user) return null;

    const roles = await db.query(
      `SELECT r.id, r.name, r.display_name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`,
      [user.id]
    );
    user.roles = roles;
    const rawRole = user.role || (roles[0] ? roles[0].name : 'Public');
    user.role = normalizeRole(rawRole);
    user.profile_image_url = user.profile_image_url || user.avatar_url;
    user.avatar_url = user.avatar_url || user.profile_image_url;

    if (user.languages_spoken && typeof user.languages_spoken === 'string') {
      try {
        user.languages_spoken = JSON.parse(user.languages_spoken);
      } catch (e) {
        user.languages_spoken = [user.languages_spoken];
      }
    }

    return user;
  }

  /**
   * Create user account (Admin, Data Analyst, Volunteer, Public)
   */
  async createUser(data, creator) {
    const {
      fullName, full_name, email, phone, password, role, roleId, status,
      gender, dateOfBirth, date_of_birth, profileImageUrl, profile_image_url, avatarUrl, avatar_url,
      region, district, villageNeighbourhood, village_neighbourhood,
      educationLevel, education_level, languagesSpoken, languages_spoken,
      motivationBackground, motivation_background,
      emergencyContactName, emergency_contact_name,
      emergencyContactPhone, emergency_contact_phone
    } = data;

    const effectiveName = (fullName || full_name || '').trim();
    const effectiveEmail = (email || '').trim().toLowerCase();
    const effectivePhone = (phone || '').trim();
    const effectiveRole = role || 'Volunteer';
    const effectiveStatus = status || 'active';
    const effectiveAvatar = profileImageUrl || profile_image_url || avatarUrl || avatar_url || null;

    if (!effectiveName || !effectiveEmail || !password) {
      throw { status: 400, message: 'Full name, email, and password are required' };
    }

    const effectiveDOB = dateOfBirth || date_of_birth || null;
    if (effectiveDOB) {
      const dobDate = new Date(effectiveDOB);
      if (!isNaN(dobDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - dobDate.getFullYear();
        const monthDiff = today.getMonth() - dobDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
          age--;
        }
        if (age < 18) {
          throw {
            status: 400,
            message: `Da'daadu waa ${age} sano. Waa in aad jirtaa ugu yaraan 18 sano (Must be at least 18 years old to register).`,
            errorCode: 'UNDERAGE_USER'
          };
        }
      }
    }

    const normalizedRole = normalizeRole(effectiveRole);

    // RBAC: Non-superadmin cannot create Superadmin, Admin, or Data Analyst
    const isSuperAdmin = isSuperAdminActor(creator);
    if (!isSuperAdmin && ['Superadmin', 'Admin', 'DataAnalyst'].includes(normalizedRole)) {
      throw { status: 403, message: 'Admins can only register Volunteer and Public user accounts.' };
    }

    const existing = await db.getOne(`SELECT id FROM users WHERE LOWER(email) = LOWER(?)`, [effectiveEmail]);
    if (existing) {
      throw { status: 409, message: 'A user with this email already exists / Email-kan horay ayaa loo isticmaalay' };
    }

    if (effectivePhone) {
      const cleanPhone = effectivePhone.replace(/[^0-9]/g, '');
      const existingPhone = await db.getOne(
        `SELECT id FROM users WHERE phone = ? OR (LENGTH(?) >= 7 AND REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', ''), '(', '') = ?)`,
        [effectivePhone, cleanPhone, cleanPhone]
      );
      if (existingPhone) {
        throw { status: 409, message: 'This phone number is already taken. Please use a different phone number / Lambarkan telefoonka horay ayaa loo isticmaalay.' };
      }
    }

    const userId = uuid();
    const passwordHash = await bcrypt.hash(password, 10);

    let effectiveLanguages = languagesSpoken || languages_spoken || ['Somali'];
    if (typeof effectiveLanguages === 'string') {
      try { effectiveLanguages = JSON.parse(effectiveLanguages); } catch (e) { effectiveLanguages = [effectiveLanguages]; }
    }

    const normalizedGender = String(gender || '').toUpperCase() === 'MALE' ? 'MALE' : 'FEMALE';

    await db.execute(
      `INSERT INTO users (
        id, email, password_hash, full_name, phone, gender, date_of_birth,
        profile_image_url, avatar_url, role, status, region, district,
        village_neighbourhood, education_level, languages_spoken,
        motivation_background, emergency_contact_name, emergency_contact_phone,
        preferred_language, is_active, is_suspended, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'so', 1, 0, CURRENT_TIMESTAMP)`,
      [
        userId, effectiveEmail, passwordHash, effectiveName, effectivePhone,
        normalizedGender, dateOfBirth || date_of_birth || null,
        effectiveAvatar, effectiveAvatar, normalizedRole, effectiveStatus,
        region || 'Banadir', district || 'Hodan',
        villageNeighbourhood || village_neighbourhood || null,
        educationLevel || education_level || null,
        JSON.stringify(effectiveLanguages),
        motivationBackground || motivation_background || null,
        emergencyContactName || emergency_contact_name || null,
        emergencyContactPhone || emergency_contact_phone || null
      ]
    );

    // Link in user_roles
    const roleCode = getRoleDbCode(normalizedRole);
    const roleRow = await db.getOne(
      `SELECT id FROM roles WHERE UPPER(name) = ? OR UPPER(name) = ? OR id = ?`,
      [roleCode, normalizedRole.toUpperCase(), `role-${roleCode.toLowerCase().replace(/_/g, '-')}`]
    );
    if (roleRow) {
      await db.execute(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [userId, roleRow.id]);
    }

    // If volunteer role, ensure volunteers table record
    if (normalizedRole === 'Volunteer') {
      const volId = uuid();
      const volCode = generateVolunteerId();
      await db.execute(
        `INSERT INTO volunteers (
          id, user_id, volunteer_id, gender, date_of_birth, region_id, district_id,
          village_name, education_level, emergency_contact_name, emergency_contact_phone,
          availability_status, status, profile_completed, registration_date
        ) VALUES (?, ?, ?, ?, ?, 'reg-banadir', 'dist-hodan', ?, ?, ?, ?, 'AVAILABLE', ?, 1, CURRENT_TIMESTAMP)`,
        [
          volId, userId, volCode, normalizedGender, dateOfBirth || date_of_birth || null,
          villageNeighbourhood || village_neighbourhood || null,
          educationLevel || education_level || null,
          emergencyContactName || emergency_contact_name || null,
          emergencyContactPhone || emergency_contact_phone || null,
          effectiveStatus === 'active' ? 'ACTIVE' : 'PENDING'
        ]
      ).catch(() => {});
    }

    logAudit({
      userId: creator?.id || 'system',
      action: 'USER_CREATED',
      module: 'USERS',
      entityName: 'User',
      entityId: userId,
      newValues: { fullName: effectiveName, email: effectiveEmail, role: normalizedRole, status: effectiveStatus }
    });

    return await this.getUserById(userId);
  }

  /**
   * Update user details
   */
  async updateUser(id, data, actor) {
    const user = await this.getUserById(id);
    if (!user) throw { status: 404, message: 'User not found' };

    const isSuperAdmin = isSuperAdminActor(actor);

    // Admin cannot edit Superadmin or other Admins
    if (!isSuperAdmin && (user.role === 'Superadmin' || user.role === 'Admin' || user.role === 'DataAnalyst')) {
      throw { status: 403, message: 'Admins can only edit Volunteer and Public user accounts.' };
    }

    const {
      fullName, full_name, email, phone, role, status, password,
      gender, dateOfBirth, date_of_birth, profileImageUrl, profile_image_url, avatarUrl, avatar_url,
      region, district, villageNeighbourhood, village_neighbourhood,
      educationLevel, education_level, languagesSpoken, languages_spoken,
      motivationBackground, motivation_background,
      emergencyContactName, emergency_contact_name,
      emergencyContactPhone, emergency_contact_phone
    } = data;

    if (email && email.trim() && email.toLowerCase().trim() !== user.email.toLowerCase()) {
      const existing = await db.getOne(`SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?`, [email.trim(), id]);
      if (existing) {
        throw { status: 409, message: 'A user with this email already exists / Email-kan horay ayaa loo isticmaalay' };
      }
    }

    if (phone && phone.trim() && (!user.phone || phone.trim() !== user.phone.trim())) {
      const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
      const existingPhone = await db.getOne(
        `SELECT id FROM users WHERE (phone = ? OR (LENGTH(?) >= 7 AND REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', ''), '(', '') = ?)) AND id != ?`,
        [phone.trim(), cleanPhone, cleanPhone, id]
      );
      if (existingPhone) {
        throw { status: 409, message: 'This phone number is already taken. Please use a different phone number / Lambarkan telefoonka horay ayaa loo isticmaalay.' };
      }
    }

    if (password && password.trim()) {
      const passwordHash = await bcrypt.hash(password.trim(), 10);
      await db.execute(`UPDATE users SET password_hash = ? WHERE id = ?`, [passwordHash, id]);
    }

    const updates = [];
    const params = [];

    if (fullName !== undefined || full_name !== undefined) {
      updates.push('full_name = ?');
      params.push((fullName || full_name).trim());
    }
    if (email !== undefined && email.trim()) {
      updates.push('email = ?');
      params.push(email.toLowerCase().trim());
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone ? phone.trim() : null);
    }
    if (gender !== undefined) {
      const g = String(gender).toUpperCase();
      updates.push('gender = ?');
      params.push(g === 'MALE' ? 'MALE' : 'FEMALE');
    }
    if (dateOfBirth !== undefined || date_of_birth !== undefined) {
      updates.push('date_of_birth = ?');
      params.push(dateOfBirth || date_of_birth || null);
    }
    const effectiveAvatar = profileImageUrl || profile_image_url || avatarUrl || avatar_url;
    if (effectiveAvatar !== undefined) {
      updates.push('profile_image_url = ?');
      updates.push('avatar_url = ?');
      params.push(effectiveAvatar || null);
      params.push(effectiveAvatar || null);
    }
    if (role !== undefined && isSuperAdmin) {
      const normalizedRole = normalizeRole(role);
      updates.push('role = ?');
      params.push(normalizedRole);

      // Also update user_roles
      const rCode = getRoleDbCode(normalizedRole);
      const rRow = await db.getOne(
        `SELECT id FROM roles WHERE UPPER(name) = ? OR UPPER(name) = ? OR id = ?`,
        [rCode, normalizedRole.toUpperCase(), `role-${rCode.toLowerCase().replace(/_/g, '-')}`]
      );
      if (rRow) {
        await db.execute(`DELETE FROM user_roles WHERE user_id = ?`, [id]);
        await db.execute(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [id, rRow.id]);
      }
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status.toLowerCase());
      if (status.toLowerCase() === 'active') {
        updates.push('is_active = 1', 'is_suspended = 0');
      } else if (status.toLowerCase() === 'deactivated') {
        updates.push('is_suspended = 1');
      }
    }
    if (region !== undefined) {
      updates.push('region = ?');
      params.push(region);
    }
    if (district !== undefined) {
      updates.push('district = ?');
      params.push(district);
    }
    if (villageNeighbourhood !== undefined || village_neighbourhood !== undefined) {
      updates.push('village_neighbourhood = ?');
      params.push(villageNeighbourhood || village_neighbourhood || null);
    }
    if (educationLevel !== undefined || education_level !== undefined) {
      updates.push('education_level = ?');
      params.push(educationLevel || education_level || null);
    }
    if (languagesSpoken !== undefined || languages_spoken !== undefined) {
      const langs = languagesSpoken || languages_spoken;
      updates.push('languages_spoken = ?');
      params.push(JSON.stringify(Array.isArray(langs) ? langs : [langs]));
    }
    if (motivationBackground !== undefined || motivation_background !== undefined) {
      updates.push('motivation_background = ?');
      params.push(motivationBackground || motivation_background || null);
    }
    if (emergencyContactName !== undefined || emergency_contact_name !== undefined) {
      updates.push('emergency_contact_name = ?');
      params.push(emergencyContactName || emergency_contact_name || null);
    }
    if (emergencyContactPhone !== undefined || emergency_contact_phone !== undefined) {
      updates.push('emergency_contact_phone = ?');
      params.push(emergencyContactPhone || emergency_contact_phone || null);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);
      await db.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Sync volunteer profile table if exists
    try {
      const volunteerRow = await db.getOne('SELECT id FROM volunteers WHERE user_id = ?', [id]);
      if (volunteerRow) {
        const vUpdates = [];
        const vParams = [];
        if (status !== undefined) {
          vUpdates.push('status = ?');
          vParams.push(status.toLowerCase() === 'active' ? 'ACTIVE' : (status.toLowerCase() === 'deactivated' ? 'SUSPENDED' : 'PENDING'));
        }
        if (gender !== undefined) {
          const g = String(gender).toUpperCase();
          vUpdates.push('gender = ?');
          vParams.push(g === 'MALE' ? 'MALE' : 'FEMALE');
        }
        if (effectiveAvatar !== undefined) {
          vUpdates.push('avatar_url = ?');
          vParams.push(effectiveAvatar || null);
        }
        if (emergencyContactName || emergency_contact_name) {
          vUpdates.push('emergency_contact_name = ?');
          vParams.push(emergencyContactName || emergency_contact_name);
        }
        if (emergencyContactPhone || emergency_contact_phone) {
          vUpdates.push('emergency_contact_phone = ?');
          vParams.push(emergencyContactPhone || emergency_contact_phone);
        }
        if (vUpdates.length > 0) {
          vParams.push(volunteerRow.id);
          await db.execute(`UPDATE volunteers SET ${vUpdates.join(', ')} WHERE id = ?`, vParams);
        }
      }
    } catch (vErr) {}

    logAudit({
      userId: actor?.id || 'system',
      action: 'USER_UPDATED',
      module: 'USERS',
      entityName: 'User',
      entityId: id,
      newValues: data
    });

    return await this.getUserById(id);
  }

  /**
   * Quick status change (Approval, Rejection, Activation, Deactivation)
   */
  async updateUserStatus(id, newStatus, reason = null, actor = null) {
    const user = await this.getUserById(id);
    if (!user) throw { status: 404, message: 'User not found' };

    const isSuperAdmin = isSuperAdminActor(actor);
    if (!isSuperAdmin && (user.role === 'Superadmin' || user.role === 'Admin' || user.role === 'DataAnalyst')) {
      throw { status: 403, message: 'Admins can only change status for Volunteer and Public accounts.' };
    }

    const cleanStatus = (newStatus || 'active').toLowerCase();
    const isActive = cleanStatus === 'active' ? 1 : (cleanStatus === 'pending' ? 1 : 0);
    const isSuspended = cleanStatus === 'deactivated' ? 1 : 0;

    await db.execute(
      `UPDATE users SET status = ?, is_active = ?, is_suspended = ?, suspension_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [cleanStatus, isActive, isSuspended, reason || null, id]
    );

    // Sync volunteer profile
    const volStatus = cleanStatus === 'active' ? 'ACTIVE' : (cleanStatus === 'deactivated' ? 'SUSPENDED' : 'PENDING');
    await db.execute(
      `UPDATE volunteers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
      [volStatus, id]
    ).catch(() => {});

    logAudit({
      userId: actor?.id || 'system',
      action: cleanStatus === 'active' ? 'USER_APPROVED' : 'USER_STATUS_CHANGED',
      module: 'USERS',
      entityName: 'User',
      entityId: id,
      newValues: { status: cleanStatus, reason }
    });

    return { success: true, id, status: cleanStatus, message: `User status changed to ${cleanStatus}` };
  }

  /**
   * Delete User safely with multi-table dependency cleanup
   */
  async deleteUser(id, actor = null) {
    const user = await this.getUserById(id);
    if (!user) throw { status: 404, message: 'User not found' };

    if (user.id === actor?.id) {
      throw { status: 400, message: 'You cannot delete your own active account.' };
    }

    const isSuperAdmin = isSuperAdminActor(actor);
    if (!isSuperAdmin && (user.role === 'Superadmin' || user.role === 'Admin' || user.role === 'DataAnalyst')) {
      throw { status: 403, message: 'Admins can only delete Volunteer and Public accounts.' };
    }

    // 1. If volunteer record exists, clean up related volunteer sub-tables
    try {
      const vol = await db.getOne('SELECT id FROM volunteers WHERE user_id = ?', [id]);
      if (vol) {
        await db.execute('DELETE FROM training_enrollments WHERE volunteer_id = ?', [vol.id]).catch(() => {});
        await db.execute('DELETE FROM certificates WHERE volunteer_id = ?', [vol.id]).catch(() => {});
        await db.execute('DELETE FROM task_assignments WHERE volunteer_id = ?', [vol.id]).catch(() => {});
        await db.execute('DELETE FROM campaign_volunteers WHERE volunteer_id = ?', [vol.id]).catch(() => {});
        await db.execute('DELETE FROM schedules WHERE volunteer_id = ?', [vol.id]).catch(() => {});
        await db.execute('DELETE FROM volunteer_skills WHERE volunteer_id = ?', [vol.id]).catch(() => {});
        await db.execute('DELETE FROM volunteer_languages WHERE volunteer_id = ?', [vol.id]).catch(() => {});
        await db.execute('DELETE FROM field_submissions WHERE volunteer_id = ?', [vol.id]).catch(() => {});
        await db.execute('DELETE FROM supply_requests WHERE volunteer_id = ?', [vol.id]).catch(() => {});
        await db.execute('DELETE FROM volunteers WHERE id = ?', [vol.id]).catch(() => {});
      }
    } catch (e) {}

    // 2. Reassign / nullify inventory transactions performed by this user
    try {
      const fallbackActorId = actor?.id && actor.id !== id ? actor.id : 'usr-superadmin-01';
      await db.execute('UPDATE inventory_transactions SET performed_by = ? WHERE performed_by = ?', [fallbackActorId, id]).catch(() => {});
    } catch (e) {}

    // 3. Nullify audit & creator & reviewer references
    await db.execute('UPDATE campaigns SET manager_id = NULL WHERE manager_id = ?', [id]).catch(() => {});
    await db.execute('UPDATE campaigns SET created_by = NULL WHERE created_by = ?', [id]).catch(() => {});
    await db.execute('UPDATE tasks SET created_by = NULL WHERE created_by = ?', [id]).catch(() => {});
    await db.execute('UPDATE field_forms SET created_by = NULL WHERE created_by = ?', [id]).catch(() => {});
    await db.execute('UPDATE field_submissions SET reviewed_by = NULL WHERE reviewed_by = ?', [id]).catch(() => {});
    await db.execute('UPDATE supply_requests SET reviewed_by = NULL WHERE reviewed_by = ?', [id]).catch(() => {});
    await db.execute('UPDATE emergency_reports SET reporter_user_id = NULL WHERE reporter_user_id = ?', [id]).catch(() => {});
    await db.execute('UPDATE emergency_reports SET resolved_by = NULL WHERE resolved_by = ?', [id]).catch(() => {});
    await db.execute('UPDATE feedback SET resolved_by = NULL WHERE resolved_by = ?', [id]).catch(() => {});
    await db.execute('UPDATE attachments SET uploaded_by = NULL WHERE uploaded_by = ?', [id]).catch(() => {});
    await db.execute('UPDATE training_courses SET created_by = NULL WHERE created_by = ?', [id]).catch(() => {});
    await db.execute('UPDATE sms_logs SET recipient_user_id = NULL WHERE recipient_user_id = ?', [id]).catch(() => {});
    await db.execute('UPDATE volunteers SET reviewed_by = NULL WHERE reviewed_by = ?', [id]).catch(() => {});
    await db.execute('UPDATE audit_logs SET user_id = NULL WHERE user_id = ?', [id]).catch(() => {});

    // 4. Delete user roles and notifications
    await db.execute('DELETE FROM user_roles WHERE user_id = ?', [id]).catch(() => {});
    await db.execute('DELETE FROM notifications WHERE user_id = ?', [id]).catch(() => {});

    // 5. Delete the user
    await db.execute('DELETE FROM users WHERE id = ?', [id]);

    logAudit({
      userId: actor?.id || 'system',
      action: 'USER_DELETED',
      module: 'USERS',
      entityName: 'User',
      entityId: id,
      oldValues: { email: user.email, fullName: user.full_name, role: user.role }
    });

    return { success: true, message: 'User deleted successfully' };
  }
}

module.exports = new UserService();
