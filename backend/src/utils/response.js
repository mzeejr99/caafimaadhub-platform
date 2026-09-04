/**
 * Standardized API Response Helpers
 */

function success(res, data = null, message = 'Operation successful', statusCode = 200, pagination = null) {
  const payload = {
    success: true,
    message,
    data
  };

  if (pagination) {
    payload.pagination = pagination;
  }

  return res.status(statusCode).json(payload);
}

function created(res, data = null, message = 'Resource created successfully') {
  return success(res, data, message, 201);
}

function error(res, message = 'An error occurred', statusCode = 500, errorCode = 'INTERNAL_ERROR', errors = null) {
  const payload = {
    success: false,
    message,
    errorCode
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
}

function badRequest(res, message = 'Bad request', errors = null, errorCode = 'BAD_REQUEST') {
  return error(res, message, 400, errorCode, errors);
}

function unauthorized(res, message = 'Unauthorized access', errorCode = 'UNAUTHORIZED') {
  return error(res, message, 401, errorCode);
}

function forbidden(res, message = 'Forbidden. Insufficient permissions', errorCode = 'FORBIDDEN') {
  return error(res, message, 403, errorCode);
}

function notFound(res, message = 'Resource not found', errorCode = 'NOT_FOUND') {
  return error(res, message, 404, errorCode);
}

function conflict(res, message = 'Resource conflict', errorCode = 'CONFLICT') {
  return error(res, message, 409, errorCode);
}

module.exports = {
  success,
  created,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict
};
