'use strict';
// Operational (expected) errors carry an HTTP status and are safe to surface.
class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    if (details) this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
  static badRequest(m, d) { return new ApiError(400, m || 'Bad request', d); }
  static unauthorized(m) { return new ApiError(401, m || 'Not authenticated'); }
  static forbidden(m) { return new ApiError(403, m || 'Not authorized'); }
  static notFound(m) { return new ApiError(404, m || 'Resource not found'); }
  static conflict(m) { return new ApiError(409, m || 'Conflict'); }
  static tooMany(m) { return new ApiError(429, m || 'Too many requests'); }
}
module.exports = ApiError;
