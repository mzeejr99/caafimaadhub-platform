const reportService = require('../services/reportService');
const { success } = require('../utils/response');

class ReportController {
  async getVolunteersReport(req, res, next) {
    try {
      const { regionId, status, format } = req.query;
      const data = await reportService.getVolunteersReport({
        regionId: req.scopedRegionId || regionId,
        status
      });

      if (format === 'csv') {
        const csv = reportService.jsonToCsv(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=volunteers-report.csv');
        return res.send(csv);
      }

      return success(res, data, 'Volunteers report data');
    } catch (err) {
      next(err);
    }
  }

  async getCampaignsReport(req, res, next) {
    try {
      const { type, status, format } = req.query;
      const data = await reportService.getCampaignsReport({ type, status });

      if (format === 'csv') {
        const csv = reportService.jsonToCsv(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=campaigns-report.csv');
        return res.send(csv);
      }

      return success(res, data, 'Campaigns report data');
    } catch (err) {
      next(err);
    }
  }

  async getFieldActivityReport(req, res, next) {
    try {
      const { campaignId, formId, startDate, endDate, format } = req.query;
      const data = await reportService.getFieldActivityReport({ campaignId, formId, startDate, endDate });

      if (format === 'csv') {
        const csv = reportService.jsonToCsv(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=field-activity-report.csv');
        return res.send(csv);
      }

      return success(res, data, 'Field activity report data');
    } catch (err) {
      next(err);
    }
  }

  async getInventoryReport(req, res, next) {
    try {
      const { category, isLowStock, format } = req.query;
      const data = await reportService.getInventoryReport({ category, isLowStock: isLowStock === 'true' });

      if (format === 'csv') {
        const csv = reportService.jsonToCsv(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.csv');
        return res.send(csv);
      }

      return success(res, data, 'Inventory report data');
    } catch (err) {
      next(err);
    }
  }

  async exportReport(req, res, next) {
    try {
      const { type, format = 'csv', startDate, endDate } = req.query;
      let data = [];

      switch (type) {
        case 'volunteers':
          data = await reportService.getVolunteersReport({
            regionId: req.scopedRegionId,
            startDate,
            endDate
          });
          break;
        case 'campaigns':
          data = await reportService.getCampaignsReport({
            startDate,
            endDate
          });
          break;
        case 'field-data':
        case 'field-activity':
          data = await reportService.getFieldActivityReport({
            startDate,
            endDate
          });
          break;
        case 'inventory':
          data = await reportService.getInventoryReport({});
          break;
        case 'emergencies':
          data = await reportService.getEmergenciesReport({
            startDate,
            endDate
          });
          break;
        case 'feedback':
          data = await reportService.getFeedbackReport({
            startDate,
            endDate
          });
          break;
        default:
          data = await reportService.getVolunteersReport({
            regionId: req.scopedRegionId,
            startDate,
            endDate
          });
          break;
      }

      if (format === 'csv') {
        const csv = reportService.jsonToCsv(data);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=caafimaadhub-${type || 'export'}-report-${new Date().toISOString().slice(0, 10)}.csv`);
        return res.send(csv);
      }

      return res.json(data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportController();
