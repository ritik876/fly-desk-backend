'use strict';
// Turns req.query into a paginated/filtered/sorted Mongoose query.
// Usage: const { query, page, limit } = buildQuery(Model, req.query, { searchFields, allowedFilters });
function buildQuery(Model, q = {}, opts = {}) {
  const { searchFields = [], allowedFilters = [], defaultSort = '-createdAt' } = opts;

  const filter = {};
  for (const key of allowedFilters) {
    if (q[key] !== undefined && q[key] !== '') filter[key] = q[key];
  }

  if (q.search && searchFields.length) {
    const rx = new RegExp(String(q.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = searchFields.map((f) => ({ [f]: rx }));
  }

  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const sort = (q.sort || defaultSort).replace(/,/g, ' ');

  const query = Model.find(filter).sort(sort).skip(skip).limit(limit);
  return { query, filter, page, limit, skip };
}

async function paginate(Model, q, opts) {
  const { query, filter, page, limit } = buildQuery(Model, q, opts);
  const [items, total] = await Promise.all([query.exec(), Model.countDocuments(filter)]);
  return {
    items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
}

module.exports = { buildQuery, paginate };
