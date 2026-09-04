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
}

module.exports = new ReportController();
