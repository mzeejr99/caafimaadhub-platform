const db = require('../config/db');
const { uuid, generateRequestCode } = require('../utils/idGenerator');
const { logAudit } = require('../middleware/auditLogger');
const notificationService = require('./notificationService');

class InventoryService {
  /**
   * List inventory items with stock status
   */
  async getItems({ search, category, locationId, isLowStock, isExpiringSoon, limit = 50, offset = 0 }) {
    let whereClauses = [];
    let params = [];

    if (search && search.trim()) {
      whereClauses.push('(i.name LIKE ? OR i.item_code LIKE ? OR i.batch_number LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (category) {
      whereClauses.push('i.category = ?');
      params.push(category);
    }

    if (locationId) {
      whereClauses.push('i.location_id = ?');
      params.push(locationId);
    }

    const isMysql = db.getClientType() === 'mysql';
    const expiryExpr = isMysql ? "DATE_ADD(CURRENT_DATE, INTERVAL 90 DAY)" : "date('now', '+90 days')";

    if (isLowStock === 'true' || isLowStock === true) {
      whereClauses.push('i.quantity_on_hand <= i.minimum_stock_level');
    }

    if (isExpiringSoon === 'true' || isExpiringSoon === true) {
      whereClauses.push(`i.expiry_date IS NOT NULL AND i.expiry_date <= ${expiryExpr}`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = await db.getOne(
      `SELECT COUNT(*) AS total FROM inventory_items i ${whereStr}`,
      params
    );

    const rows = await db.query(
      `SELECT i.*, loc.name AS location_name, loc.code AS location_code,
              (CASE WHEN i.quantity_on_hand <= i.minimum_stock_level THEN 1 ELSE 0 END) AS is_low_stock,
              (CASE WHEN i.expiry_date IS NOT NULL AND i.expiry_date <= ${expiryExpr} THEN 1 ELSE 0 END) AS is_expiring_soon
       FROM inventory_items i
       LEFT JOIN inventory_locations loc ON loc.id = i.location_id
       ${whereStr}
       ORDER BY i.category, i.name
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    return {
      items: rows,
      total: countRow ? countRow.total : 0,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    };
  }

  /**
   * Get item by ID with transaction history
   */
  async getItemById(id) {
    const item = await db.getOne(
      `SELECT i.*, loc.name AS location_name, loc.code AS location_code
       FROM inventory_items i
       LEFT JOIN inventory_locations loc ON loc.id = i.location_id
       WHERE i.id = ? OR i.item_code = ?`,
      [id, id]
    );

    if (!item) return null;

    item.transactions = await db.query(
      `SELECT tx.*, u.full_name AS performed_by_name
       FROM inventory_transactions tx
       LEFT JOIN users u ON u.id = tx.performed_by
       WHERE tx.item_id = ?
       ORDER BY tx.transaction_datetime DESC
       LIMIT 30`,
      [item.id]
    );

    return item;
  }

  /**
   * Create inventory item
   */
  async createItem(data, creatorId) {
    const {
      itemCode, name, category, unitOfMeasure = 'units', quantityOnHand = 0,
      minimumStockLevel = 10, locationId, batchNumber, expiryDate, supplierName, unitCost = 0
    } = data;

    if (!name || !category) {
      throw { status: 400, message: 'Item name and category are required' };
    }

    const id = uuid();
    const code = itemCode || `MED-${category.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    await db.execute(
      `INSERT INTO inventory_items (
        id, item_code, name, category, unit_of_measure, quantity_on_hand, minimum_stock_level,
        location_id, batch_number, expiry_date, supplier_name, unit_cost, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        id, code, name, category, unitOfMeasure, quantityOnHand, minimumStockLevel,
        locationId || null, batchNumber || null, expiryDate || null, supplierName || null, unitCost
      ]
    );

    // If initial quantity > 0, record initial stock in transaction
    if (quantityOnHand > 0) {
      await db.execute(
        `INSERT INTO inventory_transactions (
          id, item_id, transaction_type, quantity, balance_after, to_location_id,
          reference_number, performed_by, notes, transaction_datetime
        ) VALUES (?, ?, 'STOCK_IN', ?, ?, ?, 'INITIAL-STOCK', ?, 'Initial inventory stock receipt', CURRENT_TIMESTAMP)`,
        [uuid(), id, quantityOnHand, quantityOnHand, locationId || null, creatorId]
      );
    }

    logAudit({
      userId: creatorId,
      action: 'INVENTORY_ITEM_CREATED',
      module: 'INVENTORY',
      entityName: 'InventoryItem',
      entityId: id,
      newValues: { name, code, category, quantityOnHand }
    });

    return await this.getItemById(id);
  }

  /**
   * Record inventory transaction (Stock In, Stock Out, Volunteer Issue, Adjustment)
   */
  async recordTransaction({ itemId, transactionType, quantity, fromLocationId, toLocationId, referenceNumber, notes, performedBy }) {
    const item = await db.getOne(`SELECT * FROM inventory_items WHERE id = ?`, [itemId]);
    if (!item) throw { status: 404, message: 'Inventory item not found' };

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty === 0) {
      throw { status: 400, message: 'Valid non-zero quantity is required' };
    }

    let delta = 0;
    if (['STOCK_IN', 'RETURN'].includes(transactionType)) {
      delta = Math.abs(qty);
    } else if (['STOCK_OUT', 'VOLUNTEER_ISSUE', 'DAMAGED_EXPIRED'].includes(transactionType)) {
      delta = -Math.abs(qty);
    } else if (transactionType === 'ADJUSTMENT') {
      delta = qty; // can be positive or negative
    }

    const newBalance = item.quantity_on_hand + delta;

    // Strict Rule: Stock cannot become negative
    if (newBalance < 0) {
      throw {
        status: 400,
        message: `Insufficient inventory balance. Current stock: ${item.quantity_on_hand} ${item.unit_of_measure}, attempted deduction: ${Math.abs(delta)}`,
        errorCode: 'INSUFFICIENT_STOCK'
      };
    }

    const txId = uuid();

    // Update item stock
    await db.execute(
      `UPDATE inventory_items SET quantity_on_hand = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newBalance, item.id]
    );

    // Record transaction
    await db.execute(
      `INSERT INTO inventory_transactions (
        id, item_id, transaction_type, quantity, balance_after, from_location_id,
        to_location_id, reference_number, performed_by, notes, transaction_datetime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        txId, item.id, transactionType, delta, newBalance, fromLocationId || null,
        toLocationId || null, referenceNumber || null, performedBy, notes || null
      ]
    );

    // Low-stock alert check
    if (newBalance <= item.minimum_stock_level) {
      console.warn(`[Inventory] LOW STOCK ALERT: ${item.name} (${item.item_code}) is now ${newBalance} ${item.unit_of_measure}`);
    }

    logAudit({
      userId: performedBy,
      action: `INVENTORY_${transactionType}`,
      module: 'INVENTORY',
      entityName: 'InventoryItem',
      entityId: item.id,
      oldValues: { quantityOnHand: item.quantity_on_hand },
      newValues: { quantityOnHand: newBalance, delta, transactionType }
    });

    return {
      success: true,
      transactionId: txId,
      itemId: item.id,
      previousBalance: item.quantity_on_hand,
      newBalance,
      delta
    };
  }

  /**
   * Volunteer creates supply request
   */
  async createSupplyRequest(data, volunteerId) {
    const rawItemId = data.itemId || data.item_id || data.id;
    const qty = Number(data.requestedQuantity || data.quantityRequested || data.quantity_requested || data.quantity);
    const urgency = data.urgency || 'MEDIUM';
    const reason = data.reason || null;
    const taskId = data.taskId || data.task_id || null;
    const campaignId = data.campaignId || data.campaign_id || null;

    if (!rawItemId || isNaN(qty) || qty <= 0) {
      throw { status: 400, message: 'Valid item and requested quantity are required' };
    }

    const item = await db.getOne(
      `SELECT * FROM inventory_items WHERE id = ? OR item_code = ?`,
      [rawItemId, rawItemId]
    );
    if (!item) throw { status: 404, message: 'Inventory item not found' };

    // Resolve volunteer profile ID
    let effectiveVolunteerId = volunteerId;
    let vol = await db.getOne('SELECT id FROM volunteers WHERE id = ? OR user_id = ?', [volunteerId, volunteerId]);
    if (!vol && volunteerId) {
      const volId = uuid();
      const volCode = `VOL-${Date.now().toString().slice(-6)}`;
      await db.execute(
        `INSERT INTO volunteers (
          id, user_id, volunteer_id, gender, region_id, district_id,
          availability_status, status, profile_completed, registration_date
        ) VALUES (?, ?, ?, 'OTHER', 'reg-banadir', 'dist-hodan', 'AVAILABLE', 'ACTIVE', 1, CURRENT_TIMESTAMP)`,
        [volId, volunteerId, volCode]
      ).catch(() => {});
      vol = await db.getOne('SELECT id FROM volunteers WHERE id = ? OR user_id = ?', [volunteerId, volunteerId]);
    }
    if (vol) {
      effectiveVolunteerId = vol.id;
    }

    // Resolve campaign ID if provided
    let effectiveCampaignId = campaignId;
    if (campaignId) {
      const camp = await db.getOne('SELECT id FROM campaigns WHERE id = ? OR code = ?', [campaignId, campaignId]);
      effectiveCampaignId = camp ? camp.id : null;
    }

    // Resolve task ID if provided
    let effectiveTaskId = taskId;
    if (taskId) {
      const t = await db.getOne('SELECT id FROM tasks WHERE id = ?', [taskId]);
      effectiveTaskId = t ? t.id : null;
    }

    const reqId = uuid();
    const reqCode = generateRequestCode();

    await db.execute(
      `INSERT INTO supply_requests (
        id, request_code, volunteer_id, task_id, campaign_id, item_id,
        requested_quantity, approved_quantity, status, urgency, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'REQUESTED', ?, ?, CURRENT_TIMESTAMP)`,
      [reqId, reqCode, effectiveVolunteerId, effectiveTaskId, effectiveCampaignId, item.id, qty, urgency, reason || null]
    );

    return {
      id: reqId,
      requestId: reqId,
      requestCode: reqCode,
      status: 'REQUESTED',
      message: 'Supply request submitted successfully'
    };
  }

  /**
   * List supply requests
   */
  async getSupplyRequests({ volunteerId, status, urgency, limit = 30, offset = 0 }) {
    let whereClauses = [];
    let params = [];

    if (volunteerId) {
      whereClauses.push('sr.volunteer_id = ?');
      params.push(volunteerId);
    }

    if (status) {
      whereClauses.push('sr.status = ?');
      params.push(status);
    }

    if (urgency) {
      whereClauses.push('sr.urgency = ?');
      params.push(urgency);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    return await db.query(
      `SELECT sr.*, i.name AS item_name, i.item_code, i.unit_of_measure, i.quantity_on_hand,
              COALESCE(v.volunteer_id, 'CHV-BAN-2026') AS volunteer_code,
              COALESCE(u.full_name, 'Frontline Volunteer') AS volunteer_name,
              u.phone AS volunteer_phone,
              c.name AS campaign_name, t.title AS task_title, rev.full_name AS reviewer_name
       FROM supply_requests sr
       LEFT JOIN inventory_items i ON i.id = sr.item_id
       LEFT JOIN volunteers v ON (v.id = sr.volunteer_id OR v.user_id = sr.volunteer_id)
       LEFT JOIN users u ON (u.id = v.user_id OR u.id = sr.volunteer_id)
       LEFT JOIN campaigns c ON c.id = sr.campaign_id
       LEFT JOIN tasks t ON t.id = sr.task_id
       LEFT JOIN users rev ON rev.id = sr.reviewed_by
       ${whereStr}
       ORDER BY sr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );
  }

  /**
   * Review supply request (Approve, Issue, Reject)
   */
  async reviewSupplyRequest(id, reviewerId, status, approvedQuantity = null, adminRemarks = null) {
    const req = await db.getOne(`SELECT * FROM supply_requests WHERE id = ?`, [id]);
    if (!req) throw { status: 404, message: 'Supply request not found' };

    const appQty = approvedQuantity !== null ? parseInt(approvedQuantity, 10) : req.requested_quantity;

    // If status is ISSUED, perform inventory deduction
    if (status === 'ISSUED') {
      await this.recordTransaction({
        itemId: req.item_id,
        transactionType: 'VOLUNTEER_ISSUE',
        quantity: appQty,
        referenceNumber: req.request_code,
        performedBy: reviewerId,
        notes: `Supply issue for request ${req.request_code}`
      });
    }

    await db.execute(
      `UPDATE supply_requests 
       SET status = ?, approved_quantity = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, admin_remarks = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, appQty, reviewerId, adminRemarks, req.id]
    );

    // Notify volunteer
    const vol = await db.getOne(`SELECT v.user_id, u.phone FROM volunteers v JOIN users u ON u.id = v.user_id WHERE v.id = ?`, [req.volunteer_id]);
    if (vol) {
      await notificationService.createNotification({
        userId: vol.user_id,
        title: `Codsiga Qalabka / Supply Request: ${status}`,
        message: `Codsigaagii qalabka (${req.request_code}) xaaladdiisu waa: ${status}.`,
        type: 'SYSTEM',
        actionUrl: `/volunteer/supplies`
      });
    }

    return { success: true, requestId: req.id, status };
  }

  /**
   * Update Inventory Item details
   */
  async updateItem(id, data, actorId) {
    const item = await this.getItemById(id);
    if (!item) throw { status: 404, message: 'Inventory item not found' };

    const { name, category, unitOfMeasure, minimumStockLevel, locationId, batchNumber, expiryDate, supplierName, unitCost } = data;

    await db.execute(
      `UPDATE inventory_items SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        unit_of_measure = COALESCE(?, unit_of_measure),
        minimum_stock_level = COALESCE(?, minimum_stock_level),
        location_id = COALESCE(?, location_id),
        batch_number = COALESCE(?, batch_number),
        expiry_date = COALESCE(?, expiry_date),
        supplier_name = COALESCE(?, supplier_name),
        unit_cost = COALESCE(?, unit_cost),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, category, unitOfMeasure, minimumStockLevel, locationId, batchNumber, expiryDate, supplierName, unitCost, item.id]
    );

    logAudit({
      userId: actorId,
      action: 'INVENTORY_ITEM_UPDATED',
      module: 'INVENTORY',
      entityName: 'InventoryItem',
      entityId: item.id,
      newValues: { name, category, minimumStockLevel }
    });

    return await this.getItemById(item.id);
  }

  /**
   * Delete Inventory Item
   */
  async deleteItem(id, actorId) {
    const item = await this.getItemById(id);
    if (!item) throw { status: 404, message: 'Inventory item not found' };

    await db.execute(`DELETE FROM inventory_transactions WHERE item_id = ?`, [item.id]);
    await db.execute(`DELETE FROM supply_requests WHERE item_id = ?`, [item.id]);
    await db.execute(`DELETE FROM inventory_items WHERE id = ?`, [item.id]);

    logAudit({
      userId: actorId,
      action: 'INVENTORY_ITEM_DELETED',
      module: 'INVENTORY',
      entityName: 'InventoryItem',
      entityId: item.id
    });

    return { success: true, message: 'Item deleted successfully' };
  }

  /**
   * Delete Supply Request
   */
  async deleteSupplyRequest(id, actorId) {
    const req = await db.getOne(`SELECT * FROM supply_requests WHERE id = ?`, [id]);
    if (!req) throw { status: 404, message: 'Supply request not found' };

    await db.execute(`DELETE FROM supply_requests WHERE id = ?`, [req.id]);

    logAudit({
      userId: actorId,
      action: 'SUPPLY_REQUEST_DELETED',
      module: 'INVENTORY',
      entityName: 'SupplyRequest',
      entityId: req.id
    });

    return { success: true, message: 'Supply request deleted successfully' };
  }
}

module.exports = new InventoryService();
