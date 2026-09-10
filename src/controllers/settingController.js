'use strict';
const catchAsync = require('../utils/catchAsync');
const { ok } = require('../utils/apiResponse');
const { Setting } = require('../models');
const { clean } = require('../utils/sanitize');

const get = catchAsync(async (req, res) => {
  const doc = await Setting.getGlobal();
  ok(res, doc);
});

// Deep-merge only known top-level groups to avoid clobbering with unknown keys.
const update = catchAsync(async (req, res) => {
  const doc = await Setting.getGlobal();
  const b = req.body || {};
  const scalar = ['siteName', 'tagline', 'subTagline', 'description', 'logo', 'whatsappPrefill'];
  scalar.forEach((k) => { if (b[k] !== undefined) doc[k] = clean(b[k]); });
  if (b.contact) Object.assign(doc.contact, b.contact);
  if (b.social) Object.assign(doc.social, b.social);
  if (b.defaultSeo) Object.assign(doc.defaultSeo, b.defaultSeo);
  await doc.save();
  ok(res, doc);
});

module.exports = { get, update };
