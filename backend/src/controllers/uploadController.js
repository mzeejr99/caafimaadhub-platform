const db = require('../config/db');
const { uuid } = require('../utils/idGenerator');
const { success, badRequest } = require('../utils/response');

class UploadController {
  async handleFileUpload(req, res, next) {
    try {
      if (!req.file) {
        return badRequest(res, 'No file uploaded or file rejected by validator');
      }

      const fileId = uuid();
      const relativePath = `/uploads/${req.file.filename}`;

      await db.execute(
        `INSERT INTO attachments (id, entity_type, entity_id, file_name, file_path, file_size_bytes, mime_type, uploaded_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          fileId,
          req.body.entityType || 'GENERAL',
          req.body.entityId || fileId,
          req.file.originalname,
          relativePath,
          req.file.size,
          req.file.mimetype,
          req.user ? req.user.id : null
        ]
      );

      return success(res, {
        id: fileId,
        fileName: req.file.originalname,
        filePath: relativePath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        url: `${process.env.APP_URL || 'http://localhost:5000'}${relativePath}`
      }, 'File uploaded successfully', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UploadController();
