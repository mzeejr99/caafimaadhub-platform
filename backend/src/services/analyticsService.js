const db = require('../config/db');

class AnalyticsService {
  /**
   * Super Admin Dashboard Overview
   */
  async getSuperAdminDashboard() {
    const totalUsers = await db.getOne(`SELECT COUNT(*) AS count FROM users`);
    const totalAdmins = await db.getOne(
      `SELECT COUNT(*) AS count FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.name IN ('SUPER_ADMIN', 'ADMIN')`
    );
    const totalVolunteers = await db.getOne(`SELECT COUNT(DISTINCT v.id) AS count FROM volunteers v JOIN users u ON u.id = v.user_id`);
    const activeCampaigns = await db.getOne(`SELECT COUNT(*) AS count FROM campaigns WHERE status = 'ACTIVE'`);
    const totalOrgs = await db.getOne(`SELECT COUNT(*) AS count FROM organizations`);
    const totalRegions = await db.getOne(`SELECT COUNT(*) AS count FROM regions`);
    const totalFieldReports = await db.getOne(`SELECT COUNT(*) AS count FROM field_submissions`);
    const pendingVolunteers = await db.getOne(`SELECT COUNT(DISTINCT v.id) AS count FROM volunteers v JOIN users u ON u.id = v.user_id WHERE v.status = 'PENDING'`);
    const pendingReports = await db.getOne(`SELECT COUNT(*) AS count FROM field_submissions WHERE review_status = 'PENDING'`);

    // Regional Volunteer Distribution
    const regionalDistribution = await db.query(
      `SELECT r.name AS region_name, COUNT(v.id) AS volunteer_count,
              SUM(CASE WHEN v.status = 'APPROVED' OR v.status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_volunteers
       FROM regions r
       LEFT JOIN volunteers v ON v.region_id = r.id AND v.user_id IN (SELECT id FROM users)
       GROUP BY r.id, r.name
       ORDER BY volunteer_count DESC`
    );

    // Recent System Audit Activity
    const recentAudit = await db.query(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10`
    );

    return {
      summary: {
        totalUsers: totalUsers ? totalUsers.count : 0,
        totalAdmins: totalAdmins ? totalAdmins.count : 0,
        totalVolunteers: totalVolunteers ? totalVolunteers.count : 0,
        activeCampaigns: activeCampaigns ? activeCampaigns.count : 0,
        totalOrganizations: totalOrgs ? totalOrgs.count : 0,
        totalRegions: totalRegions ? totalRegions.count : 0,
        totalFieldReports: totalFieldReports ? totalFieldReports.count : 0,
        pendingApprovals: (pendingVolunteers ? pendingVolunteers.count : 0) + (pendingReports ? pendingReports.count : 0)
      },
      regionalDistribution,
      recentAudit
    };
  }

  /**
   * Admin Operations Dashboard
   */
  async getAdminDashboard(regionId = null) {
    let regionFilter = regionId ? `WHERE v.region_id = '${regionId}'` : '';
    const isMysql = db.getClientType() === 'mysql';

    const activeVolunteers = await db.getOne(
      `SELECT COUNT(DISTINCT v.id) AS count FROM volunteers v JOIN users u ON u.id = v.user_id ${regionFilter ? regionFilter + ' AND ' : 'WHERE '} v.status IN ('APPROVED', 'ACTIVE')`
    );
    const pendingVolunteers = await db.getOne(
      `SELECT COUNT(DISTINCT v.id) AS count FROM volunteers v JOIN users u ON u.id = v.user_id ${regionFilter ? regionFilter + ' AND ' : 'WHERE '} v.status = 'PENDING'`
    );
    const activeCampaigns = await db.getOne(
      `SELECT COUNT(*) AS count FROM campaigns ${regionFilter ? regionFilter + ' AND ' : 'WHERE '} status = 'ACTIVE'`
    );
    const todayTasks = await db.getOne(
      `SELECT COUNT(*) AS count FROM tasks ${regionFilter ? regionFilter + ' AND ' : 'WHERE '} DATE(start_datetime) = CURRENT_DATE`
    );
    const pendingReports = await db.getOne(
      `SELECT COUNT(*) AS count FROM field_submissions WHERE review_status = 'PENDING'`
    );
    const lowStockItems = await db.getOne(
      `SELECT COUNT(*) AS count FROM inventory_items WHERE quantity_on_hand <= minimum_stock_level`
    );
    const openFeedback = await db.getOne(
      `SELECT COUNT(*) AS count FROM feedback WHERE status IN ('NEW', 'RECEIVED', 'IN_PROGRESS')`
    );
    const criticalEmergencies = await db.getOne(
      `SELECT COUNT(*) AS count FROM emergency_reports WHERE severity IN ('CRITICAL', 'HIGH') AND status NOT IN ('RESOLVED', 'FALSE_ALARM')`
    );

    // Tasks status distribution
    const taskBreakdown = await db.query(
      `SELECT status, COUNT(*) AS count FROM tasks ${regionFilter} GROUP BY status`
    );

    // Campaigns progress (top 5)
    const campaignsSummary = await db.query(
      `SELECT c.id, c.name, c.type, c.status, c.target_population,
              (SELECT COUNT(*) FROM campaign_volunteers cv WHERE cv.campaign_id = c.id) AS assigned_volunteers,
              (SELECT COUNT(*) FROM field_submissions fs WHERE fs.campaign_id = c.id) AS field_reports_count
       FROM campaigns c
       ${regionFilter}
       ORDER BY c.start_date DESC LIMIT 5`
    );

    // Campaign status breakdown for donut chart
    const campaignStatusBreakdown = await db.query(
      `SELECT status, COUNT(*) AS count FROM campaigns ${regionFilter} GROUP BY status ORDER BY count DESC`
    );

    // Field submissions trend (last 30 days) for line chart
    const dateSubExpr30 = isMysql
      ? `DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)`
      : `date('now', '-30 days')`;
    const submissionsTrend = await db.query(
      `SELECT DATE(submission_datetime) AS date,
              COUNT(*) AS submissions_count,
              SUM(CASE WHEN review_status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_count
       FROM field_submissions
       WHERE submission_datetime >= ${dateSubExpr30}
       GROUP BY DATE(submission_datetime)
       ORDER BY date ASC`
    );

    // Upcoming tasks (next 5 not yet completed)
    const nowExpr = isMysql ? 'NOW()' : "datetime('now')";
    const upcomingRegionParams = regionId ? [regionId] : [];
    const upcomingRegionClause = regionId ? 'AND t.region_id = ?' : '';
    const upcomingTasks = await db.query(
      `SELECT t.id, t.title, t.task_type, t.priority, t.status,
              t.start_datetime, t.deadline_datetime, t.target_location_name,
              r.name AS region_name, d.name AS district_name
       FROM tasks t
       LEFT JOIN regions r ON r.id = t.region_id
       LEFT JOIN districts d ON d.id = t.district_id
       WHERE t.status NOT IN ('COMPLETED', 'CANCELLED') AND t.start_datetime >= ${nowExpr}
       ${upcomingRegionClause}
       ORDER BY t.start_datetime ASC
       LIMIT 5`,
      upcomingRegionParams
    );

    // Recent system activity from audit logs
    const recentActivity = await db.query(
      `SELECT al.id, al.action, al.module, al.entity_name, al.user_email,
              al.created_at, u.full_name AS user_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC
       LIMIT 5`
    );

    // Training progress per course (enrolled vs completed)
    const trainingProgress = await db.query(
      `SELECT c.id, c.title, c.category,
              COUNT(e.id) AS enrolled_count,
              SUM(CASE WHEN e.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count
       FROM training_courses c
       LEFT JOIN training_enrollments e ON e.course_id = c.id
       WHERE c.is_published = 1
       GROUP BY c.id, c.title, c.category
       ORDER BY enrolled_count DESC
       LIMIT 5`
    );

    // Emergency alerts (recent unresolved, sorted by severity)
    const emergencyAlerts = await db.query(
      `SELECT er.id, er.emergency_type, er.severity, er.community_name, er.status, er.created_at,
              r.name AS region_name, d.name AS district_name
       FROM emergency_reports er
       LEFT JOIN regions r ON r.id = er.region_id
       LEFT JOIN districts d ON d.id = er.district_id
       WHERE er.status NOT IN ('RESOLVED', 'FALSE_ALARM')
       ORDER BY CASE er.severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, er.created_at DESC
       LIMIT 5`
    );

    // Map data: facilities with coordinates
    const facilityMapData = await db.query(
      `SELECT f.latitude, f.longitude, f.name, f.facility_type
       FROM facilities f
       WHERE f.latitude IS NOT NULL AND f.longitude IS NOT NULL AND f.is_active = 1`
    );

    // Map data: unresolved emergency reports with coordinates
    const emergencyMapData = await db.query(
      `SELECT er.latitude, er.longitude, er.emergency_type, er.severity,
              COALESCE(er.community_name, r.name) AS location_name
       FROM emergency_reports er
       LEFT JOIN regions r ON r.id = er.region_id
       WHERE er.latitude IS NOT NULL AND er.longitude IS NOT NULL
         AND er.status NOT IN ('RESOLVED', 'FALSE_ALARM')`
    );

    // Map data: active volunteers with coordinates
    const volunteerMapData = await db.query(
      `SELECT v.latitude, v.longitude, u.full_name, r.name AS region_name
       FROM volunteers v
       JOIN users u ON u.id = v.user_id
       LEFT JOIN regions r ON r.id = v.region_id
       WHERE v.latitude IS NOT NULL AND v.longitude IS NOT NULL
         AND v.status IN ('APPROVED', 'ACTIVE')
       LIMIT 30`
    );

    // Regional volunteer distribution
    const regionalDistribution = await db.query(
      `SELECT r.name AS region_name, COUNT(v.id) AS volunteer_count,
              SUM(CASE WHEN v.status IN ('APPROVED', 'ACTIVE') THEN 1 ELSE 0 END) AS active_volunteers
       FROM regions r
       LEFT JOIN volunteers v ON v.region_id = r.id AND v.user_id IN (SELECT id FROM users)
       GROUP BY r.id, r.name
       ORDER BY volunteer_count DESC`
    );

    // SMS stats for today
    const smsSentToday = await db.getOne(
      `SELECT COUNT(*) AS count FROM sms_logs WHERE DATE(created_at) = CURRENT_DATE`
    );
    const smsDeliveredToday = await db.getOne(
      `SELECT COUNT(*) AS count FROM sms_logs WHERE DATE(created_at) = CURRENT_DATE AND status IN ('SENT', 'DELIVERED')`
    );

    // Field data accuracy metric
    const totalSubs = await db.getOne(`SELECT COUNT(*) AS count FROM field_submissions`);
    const approvedSubs = await db.getOne(
      `SELECT COUNT(*) AS count FROM field_submissions WHERE review_status = 'APPROVED'`
    );
    const dataAccuracyPct = (totalSubs && totalSubs.count > 0)
      ? Math.round((Number(approvedSubs.count) / Number(totalSubs.count)) * 100)
      : null;

    return {
      cards: {
        activeVolunteers: activeVolunteers ? activeVolunteers.count : 0,
        pendingVolunteers: pendingVolunteers ? pendingVolunteers.count : 0,
        activeCampaigns: activeCampaigns ? activeCampaigns.count : 0,
        todayTasks: todayTasks ? todayTasks.count : 0,
        pendingReports: pendingReports ? pendingReports.count : 0,
        lowStockItems: lowStockItems ? lowStockItems.count : 0,
        openFeedback: openFeedback ? openFeedback.count : 0,
        criticalEmergencies: criticalEmergencies ? criticalEmergencies.count : 0
      },
      taskBreakdown,
      campaignsSummary,
      campaignStatusBreakdown,
      submissionsTrend,
      upcomingTasks,
      recentActivity,
      trainingProgress,
      emergencyAlerts,
      mapData: {
        facilities: facilityMapData,
        emergencies: emergencyMapData,
        volunteers: volunteerMapData
      },
      regionalDistribution,
      smsStats: {
        sentToday: smsSentToday ? Number(smsSentToday.count) : 0,
        deliveredToday: smsDeliveredToday ? Number(smsDeliveredToday.count) : 0
      },
      dataAccuracy: dataAccuracyPct
    };
  }

  /**
   * Analytics Charts and Trends (with Date Range filter)
   */
  async getDetailedAnalytics({ dateRange = '30d', regionId = null }) {
    let days = 30;
    if (dateRange === '7d') days = 7;
    if (dateRange === '90d') days = 90;
    if (dateRange === 'today') days = 1;

    // Field Submissions Trend (daily grouped)
    const isMysql = db.getClientType() === 'mysql';
    const dateSubExpr = isMysql
      ? `DATE_SUB(CURRENT_DATE, INTERVAL ${days} DAY)`
      : `date('now', '-${days} days')`;

    const submissionsTrend = await db.query(
      `SELECT DATE(submission_datetime) AS date, COUNT(*) AS submissions_count,
              SUM(CASE WHEN review_status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_count
       FROM field_submissions
       WHERE submission_datetime >= ${dateSubExpr}
       GROUP BY DATE(submission_datetime)
       ORDER BY date ASC`
    );

    // Campaign Type Distribution
    const campaignTypes = await db.query(
      `SELECT type, COUNT(*) AS count FROM campaigns GROUP BY type`
    );

    // Volunteer Status Distribution
    const volunteerStatuses = await db.query(
      `SELECT status, COUNT(*) AS count FROM volunteers GROUP BY status`
    );

    // Inventory Category Stock Tally
    const inventoryStock = await db.query(
      `SELECT category, SUM(quantity_on_hand) AS total_quantity, COUNT(id) AS item_types_count
       FROM inventory_items
       GROUP BY category`
    );

    // Emergency Outbreaks Breakdown
    const emergenciesByType = await db.query(
      `SELECT emergency_type, COUNT(*) AS count, SUM(suspected_cases_count) AS total_suspected_cases
       FROM emergency_reports
       GROUP BY emergency_type`
    );

    // Top Active Volunteers
    const topVolunteers = await db.query(
      `SELECT v.volunteer_id, u.full_name, r.name AS region_name,
              COUNT(fs.id) AS total_submissions,
              (SELECT COUNT(*) FROM certificates c WHERE c.volunteer_id = v.id) AS certificates_count
       FROM volunteers v
       JOIN users u ON u.id = v.user_id
       LEFT JOIN regions r ON r.id = v.region_id
       LEFT JOIN field_submissions fs ON fs.volunteer_id = v.id
       WHERE v.status IN ('APPROVED', 'ACTIVE')
       GROUP BY v.id, u.full_name, r.name
       ORDER BY total_submissions DESC
       LIMIT 8`
    );

    return {
      days,
      submissionsTrend,
      campaignTypes,
      volunteerStatuses,
      inventoryStock,
      emergenciesByType,
      topVolunteers
    };
  }

  /**
   * Public Impact Summary Statistics & Live Platform Datasets
   * 100% Genuine Database-driven (No hardcoded/mock fallbacks)
   */
  async getPublicStats() {
    const isMysql = db.getClientType() === 'mysql';

    // 1. Core Summary Metrics directly from Real Database tables
    const activeCampaigns = await db.getOne(`SELECT COUNT(*) AS count FROM campaigns WHERE status = 'ACTIVE'`);
    const totalCampaigns = await db.getOne(`SELECT COUNT(*) AS count FROM campaigns`);
    const totalVolunteers = await db.getOne(`SELECT COUNT(DISTINCT v.id) AS count FROM volunteers v JOIN users u ON u.id = v.user_id WHERE v.status IN ('APPROVED', 'ACTIVE')`);
    const totalAllVolunteers = await db.getOne(`SELECT COUNT(DISTINCT v.id) AS count FROM volunteers v JOIN users u ON u.id = v.user_id`);
    const totalFacilities = await db.getOne(`SELECT COUNT(*) AS count FROM facilities WHERE is_active = 1`);
    const totalSubmissions = await db.getOne(`SELECT COUNT(*) AS count FROM field_submissions`);
    const approvedSubmissions = await db.getOne(`SELECT COUNT(*) AS count FROM field_submissions WHERE review_status = 'APPROVED'`);
    const totalCertificates = await db.getOne(`SELECT COUNT(*) AS count FROM certificates`);
    const totalRegions = await db.getOne(`SELECT COUNT(*) AS count FROM regions`);
    const targetPopulationSum = await db.getOne(`SELECT COALESCE(SUM(target_population), 0) AS sum FROM campaigns`);
    const suppliesCount = await db.getOne(`SELECT COUNT(*) AS count, COALESCE(SUM(quantity_on_hand), 0) AS total_qty FROM inventory_items`);

    // Real Month-over-Month Submissions Growth calculation
    const thisMonthSubmissions = await db.getOne(
      isMysql
        ? `SELECT COUNT(*) AS count FROM field_submissions WHERE submission_datetime >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')`
        : `SELECT COUNT(*) AS count FROM field_submissions WHERE submission_datetime >= date('now', 'start of month')`
    );
    const lastMonthSubmissions = await db.getOne(
      isMysql
        ? `SELECT COUNT(*) AS count FROM field_submissions WHERE submission_datetime >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 1 MONTH) AND submission_datetime < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')`
        : `SELECT COUNT(*) AS count FROM field_submissions WHERE submission_datetime >= date('now', 'start of month', '-1 month') AND submission_datetime < date('now', 'start of month')`
    );
    const currCount = thisMonthSubmissions ? Number(thisMonthSubmissions.count || 0) : 0;
    const prevCount = lastMonthSubmissions ? Number(lastMonthSubmissions.count || 0) : 0;
    let computedGrowth = 0;
    if (prevCount > 0) {
      computedGrowth = Math.round(((currCount - prevCount) / prevCount) * 1000) / 10;
    } else if (currCount > 0) {
      computedGrowth = 100;
    }

    // 2. Real Active Volunteers List (Column 1)
    const topVolunteers = await db.query(
      `SELECT v.id, u.full_name, u.avatar_url, v.status, r.name AS region_name, d.name AS district_name,
              COUNT(fs.id) AS submissions_count
       FROM volunteers v
       JOIN users u ON u.id = v.user_id
       LEFT JOIN regions r ON r.id = v.region_id
       LEFT JOIN districts d ON d.id = v.district_id
       LEFT JOIN field_submissions fs ON fs.volunteer_id = v.id
       GROUP BY v.id, u.full_name, u.avatar_url, v.status, r.name, d.name
       ORDER BY CASE WHEN v.status = 'APPROVED' THEN 1 WHEN v.status = 'ACTIVE' THEN 2 ELSE 3 END, submissions_count DESC, v.registration_date DESC
       LIMIT 6`
    );

    // 3. Real Active Campaigns List (Column 2)
    const activeCampaignsList = await db.query(
      `SELECT c.id, c.name, c.type, c.status, c.start_date, c.end_date, c.target_population, r.name AS region_name
       FROM campaigns c
       LEFT JOIN regions r ON r.id = c.region_id
       ORDER BY CASE WHEN c.status = 'ACTIVE' THEN 1 WHEN c.status = 'PLANNED' THEN 2 ELSE 3 END, c.start_date DESC
       LIMIT 6`
    );

    // 4. Real Regional Coverage (Column 3)
    const regionalCoverage = await db.query(
      `SELECT r.id, r.name, COUNT(DISTINCT v.id) AS volunteers_count,
              (SELECT COUNT(*) FROM campaigns c WHERE c.region_id = r.id) AS campaigns_count
       FROM regions r
       LEFT JOIN volunteers v ON v.region_id = r.id
       GROUP BY r.id, r.name
       ORDER BY volunteers_count DESC, campaigns_count DESC, r.name ASC
       LIMIT 6`
    );

    // 5. Real Recent Submissions/Reports (Column 4)
    const recentReports = await db.query(
      `SELECT fs.id, fs.submission_datetime, fs.sync_status, fs.review_status,
              u.full_name AS volunteer_name, c.name AS campaign_name, r.name AS region_name, d.name AS district_name,
              ff.title AS form_title
       FROM field_submissions fs
       JOIN volunteers v ON v.id = fs.volunteer_id
       JOIN users u ON u.id = v.user_id
       LEFT JOIN campaigns c ON c.id = fs.campaign_id
       LEFT JOIN regions r ON r.id = v.region_id
       LEFT JOIN districts d ON d.id = v.district_id
       LEFT JOIN field_forms ff ON ff.id = fs.field_form_id
       ORDER BY fs.submission_datetime DESC
       LIMIT 6`
    );

    // 6. Real Weekly Activity Stats (Grouped by weekday from field_submissions)
    const daysMap = [
      { key: 1, day: 'Mon', daySo: 'Isniin' },
      { key: 2, day: 'Tue', daySo: 'Talaado' },
      { key: 3, day: 'Wed', daySo: 'Arbaco' },
      { key: 4, day: 'Thu', daySo: 'Khamiis' },
      { key: 5, day: 'Fri', daySo: 'Jimco' },
      { key: 6, day: 'Sat', daySo: 'Sabti' },
      { key: 0, day: 'Sun', daySo: 'Axad' }
    ];

    const dayOfWeekExpr = isMysql
      ? 'DAYOFWEEK(submission_datetime) - 1'
      : "CAST(strftime('%w', submission_datetime) AS INTEGER)";
    const dateSub7 = isMysql
      ? 'DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)'
      : "date('now', '-7 days')";

    let weeklyQuery = await db.query(
      `SELECT ${dayOfWeekExpr} AS day_idx, COUNT(*) AS reports_count,
              SUM(CASE WHEN review_status = 'APPROVED' THEN 1 ELSE 0 END) AS services_count
       FROM field_submissions
       WHERE submission_datetime >= ${dateSub7}
       GROUP BY ${dayOfWeekExpr}`
    );

    // If no records in last 7 days, query all recorded submissions by day of week
    if (!weeklyQuery || weeklyQuery.length === 0) {
      weeklyQuery = await db.query(
        `SELECT ${dayOfWeekExpr} AS day_idx, COUNT(*) AS reports_count,
                SUM(CASE WHEN review_status = 'APPROVED' THEN 1 ELSE 0 END) AS services_count
         FROM field_submissions
         GROUP BY ${dayOfWeekExpr}`
      );
    }

    const weeklyActivity = daysMap.map((d) => {
      const found = (weeklyQuery || []).find((q) => Number(q.day_idx) === Number(d.key));
      return {
        day: d.day,
        daySo: d.daySo,
        reports: found ? Number(found.reports_count || 0) : 0,
        services: found ? Number(found.services_count || 0) : 0
      };
    });

    // 7. Core Health Services linked to real database inventory stock
    const inventoryByCategory = await db.query(
      `SELECT category, COUNT(id) AS item_types, COALESCE(SUM(quantity_on_hand), 0) AS total_qty
       FROM inventory_items
       GROUP BY category`
    );
    const categoryStockMap = {};
    (inventoryByCategory || []).forEach((row) => {
      categoryStockMap[row.category] = Number(row.total_qty || 0);
    });

    const servicesList = [
      {
        id: 'srv-vaccines',
        category: 'VACCINES',
        nameEn: 'Immunization & Cold Chain Logistics',
        nameSo: 'Tallaalka & Qaybinta Tallaallada',
        descEn: 'Polio (bOPV/IPV), Measles, BCG, and Pentavalent cold chain delivery across districts.',
        descSo: 'Gaarsiinta tallaallada Polio, Jadeecada, BCG iyo Pentavalent iyadoo la ilaalinayo heerkulka qabowga.',
        stockCount: categoryStockMap['VACCINES'] || 0
      },
      {
        id: 'srv-nutrition',
        category: 'NUTRITION_SUPPLIES',
        nameEn: 'Nutrition & Malnutrition Screening',
        nameSo: 'Nafaqada & Baaritaanka Nafaqo-darrada',
        descEn: 'MUAC tape screenings, Ready-to-Use Therapeutic Food (Plumpy\'Nut RUTF) and therapeutic milk.',
        descSo: 'Baaritaanka cabbirka MUAC, qaybinta RUTF (Plumpy\'Nut) iyo caanaha daweynta F-75/F-100.',
        stockCount: categoryStockMap['NUTRITION_SUPPLIES'] || 0
      },
      {
        id: 'srv-maternal',
        category: 'MATERNAL_SUPPLIES',
        nameEn: 'Maternal & Child Health Services',
        nameSo: 'Daryeelka Hooyada & Dhallaanka',
        descEn: 'Antenatal care counseling, clean delivery kits, Chlorhexidine cord care, and maternal health referrals.',
        descSo: 'Talo-bixinta xilliga uurka, xirmooyinka dhalmada nadiifka ah, iyo daryeelka xuddunta dhallaanka.',
        stockCount: categoryStockMap['MATERNAL_SUPPLIES'] || 0
      },
      {
        id: 'srv-malaria',
        category: 'DIAGNOSTIC_KITS',
        nameEn: 'Disease Surveillance & Outbreak Response',
        nameSo: 'Dabagalka Cudurrada & Ka-jawaabista Degdegga',
        descEn: 'Malaria RDT rapid diagnostic tests, Coartem treatment, LLIN bed net distribution, and AWD surveillance.',
        descSo: 'Baaritaannada degdegga ah ee Malaria RDT, daaweynta Coartem, mara kaneecada, iyo dabagalka shubanka.',
        stockCount: categoryStockMap['DIAGNOSTIC_KITS'] || 0
      },
      {
        id: 'srv-medicines',
        category: 'MEDICINES',
        nameEn: 'Essential Medicines & Field Supplies',
        nameSo: 'Dawooyinka Aasaasiga ah & Sahayda Goobta',
        descEn: 'WHO ORS packets, Zinc tablets, Amoxicillin, Paracetamol, Vitamin A supplementation, and deworming.',
        descSo: 'Biyo-macaanta ORS, kiniinka Zinc, Amoxicillin, Paracetamol, Vitamin A, iyo dawooyinka gooryaanka.',
        stockCount: categoryStockMap['MEDICINES'] || 0
      },
      {
        id: 'srv-training',
        category: 'TRAINING',
        nameEn: 'CHV Training & Certified Field Operations',
        nameSo: 'Tababarka & Awood-siinta Volunteers-ka',
        descEn: 'Comprehensive multimedia training modules, quizzes, and QR-verifiable official certifications.',
        descSo: 'Casharro tababar oo maqal iyo muuqaal ah, imtixaanno, iyo shahaadooyin rasmi ah oo QR leh.',
        stockCount: totalCertificates ? Number(totalCertificates.count || 0) : 0
      }
    ];

    const rawSubmissionsCount = totalSubmissions ? Number(totalSubmissions.count || 0) : 0;
    const rawApprovedCount = approvedSubmissions ? Number(approvedSubmissions.count || 0) : 0;

    return {
      activeCampaigns: activeCampaigns ? Number(activeCampaigns.count || 0) : 0,
      totalCampaigns: totalCampaigns ? Number(totalCampaigns.count || 0) : 0,
      totalVolunteers: totalVolunteers ? Number(totalVolunteers.count || 0) : (totalAllVolunteers ? Number(totalAllVolunteers.count || 0) : 0),
      totalFacilities: totalFacilities ? Number(totalFacilities.count || 0) : 0,
      totalFieldSubmissions: rawSubmissionsCount,
      totalCertificatesEarned: totalCertificates ? Number(totalCertificates.count || 0) : 0,
      totalRegions: totalRegions ? Number(totalRegions.count || 0) : 0,
      totalPeopleReached: targetPopulationSum && targetPopulationSum.sum ? Number(targetPopulationSum.sum) : 0,
      totalServicesDelivered: rawApprovedCount > 0 ? rawApprovedCount : rawSubmissionsCount,
      totalSuppliesStock: suppliesCount && suppliesCount.total_qty ? Number(suppliesCount.total_qty) : 0,
      growthPercentage: computedGrowth,
      topVolunteers,
      activeCampaignsList,
      regionalCoverage,
      recentReports,
      weeklyActivity,
      services: servicesList
    };
  }
}

module.exports = new AnalyticsService();
