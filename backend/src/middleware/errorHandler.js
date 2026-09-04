const { error } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // Handle Multer upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return error(res, 'Uploaded file exceeds maximum allowed size (15MB)', 400, 'FILE_TOO_LARGE');
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return error(res, 'Malformed JSON payload in request', 400, 'INVALID_JSON');
  }

  // SQLite / MySQL foreign key error handling
  if (err.message && (err.message.includes('FOREIGN KEY constraint failed') || err.message.includes('foreign key constraint fails'))) {
    return error(res, 'Referenced record does not exist or has active dependencies', 400, 'FOREIGN_KEY_VIOLATION');
  }

  // Unique constraint error handling
  if (err.message && (err.message.includes('UNIQUE constraint failed') || err.code === 'ER_DUP_ENTRY')) {
    return error(res, 'A record with this identifier or unique field already exists', 409, 'DUPLICATE_ENTRY');
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error. Please contact support.' 
    : err.message || 'Internal Server Error';

  return error(res, message, statusCode, err.errorCode || 'INTERNAL_ERROR');
}

module.exports = errorHandler;
