'use strict';
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/apiResponse');
const { paginate } = require('../utils/queryFeatures');
const { uniqueSlug } = require('../utils/slug');
const { clean, cleanRich } = require('../utils/sanitize');

/**
 * Generic admin CRUD controller for CMS models.
 * opts:
 *  - searchFields, allowedFilters, defaultSort  (list query)
 *  - slugFrom: field name to derive slug from (enables slug uniqueness)
 *  - richFields: fields sanitized as rich HTML (content bodies)
 *  - stringFields: fields sanitized as plain text
 *  - protectDelete: (doc) => boolean  — throw if true (e.g. system pages)
 */
function crudFactory(Model, opts = {}) {
  const {
    searchFields = [],
    allowedFilters = [],
    defaultSort = '-createdAt',
    slugFrom = null,
    richFields = [],
    stringFields = [],
    protectDelete = null,
  } = opts;

  const sanitizeBody = (body) => {
    const b = { ...body };
    for (const f of stringFields) if (typeof b[f] === 'string') b[f] = clean(b[f]);
    for (const f of richFields) if (typeof b[f] === 'string') b[f] = cleanRich(b[f]);
    return b;
  };

  return {
    list: catchAsync(async (req, res) => {
      const { items, meta } = await paginate(Model, req.query, {
        searchFields,
        allowedFilters,
        defaultSort,
      });
      ok(res, items, meta);
    }),

    getOne: catchAsync(async (req, res) => {
      const doc = await Model.findById(req.params.id);
      if (!doc) throw ApiError.notFound();
      ok(res, doc);
    }),

    create: catchAsync(async (req, res) => {
      const body = sanitizeBody(req.body);
      if (slugFrom) {
        body.slug = await uniqueSlug(Model, body.slug || body[slugFrom]);
      }
      const doc = await Model.create(body);
      created(res, doc);
    }),

    update: catchAsync(async (req, res) => {
      const doc = await Model.findById(req.params.id);
      if (!doc) throw ApiError.notFound();
      const body = sanitizeBody(req.body);
      if (slugFrom && (body.slug || body[slugFrom])) {
        body.slug = await uniqueSlug(Model, body.slug || body[slugFrom], doc._id);
      }
      Object.assign(doc, body);
      await doc.save();
      ok(res, doc);
    }),

    remove: catchAsync(async (req, res) => {
      const doc = await Model.findById(req.params.id);
      if (!doc) throw ApiError.notFound();
      if (protectDelete && protectDelete(doc)) {
        throw ApiError.forbidden('This item is protected and cannot be deleted.');
      }
      await doc.deleteOne();
      ok(res, { id: doc._id, deleted: true });
    }),

    // Bulk reorder: body = [{ id, order }, ...]
    reorder: catchAsync(async (req, res) => {
      const items = Array.isArray(req.body.items) ? req.body.items : [];
      await Promise.all(
        items.map((it) => Model.updateOne({ _id: it.id }, { $set: { order: Number(it.order) || 0 } }))
      );
      ok(res, { updated: items.length });
    }),
  };
}

module.exports = crudFactory;
