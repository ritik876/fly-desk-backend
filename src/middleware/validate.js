'use strict';
const validator = require('validator');
const ApiError = require('../utils/ApiError');
const { clean } = require('../utils/sanitize');

// Lightweight schema validator — no heavyweight dependency.
// Rule shape: { type, required, min, max, isEmail, isSlug, enum, sanitize, default, arrayOf }
function runRule(field, value, rule) {
  const errors = [];

  if (value === undefined || value === null || value === '') {
    if (rule.required) errors.push({ field, message: `${field} is required` });
    return { value: rule.default !== undefined ? rule.default : value, errors };
  }

  let v = value;

  if (rule.type === 'string' || rule.isEmail || rule.isSlug) {
    v = String(v);
    if (rule.sanitize !== false) v = clean(v);
    if (rule.min && v.length < rule.min) errors.push({ field, message: `${field} must be at least ${rule.min} characters` });
    if (rule.max && v.length > rule.max) errors.push({ field, message: `${field} must be at most ${rule.max} characters` });
    if (rule.isEmail && !validator.isEmail(v)) errors.push({ field, message: `${field} must be a valid email` });
    if (rule.isPhone && !validator.isMobilePhone(v, 'any', { strictMode: false })) errors.push({ field, message: `${field} must be a valid phone number` });
    if (rule.enum && !rule.enum.includes(v)) errors.push({ field, message: `${field} must be one of: ${rule.enum.join(', ')}` });
  } else if (rule.type === 'boolean') {
    v = v === true || v === 'true' || v === 1 || v === '1';
  } else if (rule.type === 'number') {
    v = Number(v);
    if (Number.isNaN(v)) errors.push({ field, message: `${field} must be a number` });
  } else if (rule.type === 'array') {
    if (!Array.isArray(v)) v = [v];
    if (rule.arrayOf === 'string') v = v.map((x) => clean(String(x))).filter(Boolean);
  } else if (rule.type === 'date') {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) errors.push({ field, message: `${field} must be a valid date` });
    else v = d;
  }

  return { value: v, errors };
}

// Returns middleware. `where` = 'body' | 'query'.
function validate(schema, where = 'body') {
  return (req, res, next) => {
    const src = req[where] || {};
    const out = {};
    let errors = [];
    for (const [field, rule] of Object.entries(schema)) {
      const { value, errors: e } = runRule(field, src[field], rule);
      if (value !== undefined) out[field] = value;
      errors = errors.concat(e);
    }
    if (errors.length) return next(ApiError.badRequest('Validation failed', errors));
    req.validated = { ...(req.validated || {}), ...out };
    next();
  };
}

module.exports = { validate };
