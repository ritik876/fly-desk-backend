'use strict';
const env = require('../config/env');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

// 404 for unmatched routes.
function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Central error handler — never leaks stack traces or secrets in production.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  // Normalize common Mongoose / driver errors into operational ApiErrors.
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    error = ApiError.badRequest('Validation failed', details);
  } else if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid ${err.path}`);
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || { value: '' })[0];
    error = ApiError.conflict(`Duplicate value for "${field}"`);
  } else if (err.type === 'entity.too.large') {
    error = ApiError.badRequest('Request payload too large');
  }

  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational === true;

  if (statusCode >= 500 || !isOperational) {
    logger.error(err.message, { stack: env.isProd ? undefined : err.stack });
  }

  const body = {
    success: false,
    error: {
      message: isOperational ? error.message : 'Something went wrong. Please try again.',
      ...(error.details ? { details: error.details } : {}),
    },
  };
  if (!env.isProd && !isOperational) body.error.stack = err.stack;

  res.status(statusCode).json(body);
}

module.exports = { notFound, errorHandler };
