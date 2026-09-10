'use strict';
const { STATUSES } = require('../models/Inquiry');

// Schemas consumed by the `validate` middleware.
const login = {
  email: { type: 'string', isEmail: true, required: true, max: 200 },
  password: { type: 'string', required: true, min: 6, max: 200, sanitize: false },
};

const changePassword = {
  currentPassword: { type: 'string', required: true, sanitize: false },
  newPassword: { type: 'string', required: true, min: 8, max: 200, sanitize: false },
};

const createUser = {
  name: { type: 'string', required: true, min: 2, max: 120 },
  email: { type: 'string', isEmail: true, required: true, max: 200 },
  password: { type: 'string', required: true, min: 8, max: 200, sanitize: false },
  role: { type: 'string', enum: ['admin', 'editor'] },
};

const submitInquiry = {
  name: { type: 'string', required: true, min: 2, max: 120 },
  email: { type: 'string', isEmail: true, required: true, max: 200 },
  phone: { type: 'string', required: true, min: 6, max: 30 },
  company: { type: 'string', max: 200 },
  service: { type: 'string', max: 200 },
  message: { type: 'string', max: 3000 },
  preferredDate: { type: 'date' },
  type: { type: 'string', enum: ['inquiry', 'consultation', 'contact'] },
  sourcePage: { type: 'string', max: 500 },
  utm_source: { type: 'string', max: 200 },
  utm_medium: { type: 'string', max: 200 },
  utm_campaign: { type: 'string', max: 200 },
  utm_term: { type: 'string', max: 200 },
  utm_content: { type: 'string', max: 200 },
};

const updateStatus = {
  status: { type: 'string', required: true, enum: STATUSES },
};

const addNote = {
  body: { type: 'string', required: true, min: 1, max: 3000 },
};

module.exports = { login, changePassword, createUser, submitInquiry, updateStatus, addNote };
