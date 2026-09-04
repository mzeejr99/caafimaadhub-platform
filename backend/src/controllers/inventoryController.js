const inventoryService = require('../services/inventoryService');
const { success, created, notFound, badRequest } = require('../utils/response');

class InventoryController {
  async getItems(req, res, next) {
    try {
      const { search, category, locationId, isLowStock, isExpiringSoon, limit, offset } = req.query;
      const result = await inventoryService.getItems({
        search,
        category,
        locationId,
        isLowStock,
        isExpiringSoon,
        limit,
        offset
      });
      return success(res, result.items, 'Inventory items retrieved', 200, {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      });
    } catch (err) {
      next(err);
    }
  }

  async getItemById(req, res, next) {
    try {
      const item = await inventoryService.getItemById(req.params.id);
      if (!item) return notFound(res, 'Item not found');
      return success(res, item, 'Item details');
    } catch (err) {
      next(err);
    }
  }

  async createItem(req, res, next) {
    try {
      const item = await inventoryService.createItem(req.body, req.user.id);
      return created(res, item, 'Item created successfully');
    } catch (err) {
      next(err);
    }
  }

  async recordTransaction(req, res, next) {
    try {
      const result = await inventoryService.recordTransaction({
        ...req.body,
        performedBy: req.user.id
      });
      return success(res, result, 'Inventory transaction recorded');
    } catch (err) {
      next(err);
    }
  }

  async createSupplyRequest(req, res, next) {
    try {
      const volId = req.user.volunteerId;
      if (!volId) return badRequest(res, 'Volunteer profile required to request supplies');
      const result = await inventoryService.createSupplyRequest(req.body, volId);
      return created(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  async getSupplyRequests(req, res, next) {
    try {
      const { volunteerId, status, urgency, limit, offset } = req.query;
      const targetVolId = req.user.role === 'VOLUNTEER' ? req.user.volunteerId : volunteerId;
      const requests = await inventoryService.getSupplyRequests({
        volunteerId: targetVolId,
        status,
        urgency,
        limit,
        offset
      });
      return success(res, requests, 'Supply requests retrieved');
    } catch (err) {
      next(err);
    }
  }

  async reviewSupplyRequest(req, res, next) {
    try {
      const { status, approvedQuantity, adminRemarks } = req.body;
      if (!status) return badRequest(res, 'Status is required');
      const result = await inventoryService.reviewSupplyRequest(req.params.id, req.user.id, status, approvedQuantity, adminRemarks);
      return success(res, result, 'Supply request reviewed');
    } catch (err) {
      next(err);
    }
  }

  async updateItem(req, res, next) {
    try {
      const item = await inventoryService.updateItem(req.params.id, req.body, req.user.id);
      return success(res, item, 'Inventory item updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteItem(req, res, next) {
    try {
      const result = await inventoryService.deleteItem(req.params.id, req.user.id);
      return success(res, result, 'Inventory item deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteSupplyRequest(req, res, next) {
    try {
      const result = await inventoryService.deleteSupplyRequest(req.params.id, req.user.id);
      return success(res, result, 'Supply request deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new InventoryController();
