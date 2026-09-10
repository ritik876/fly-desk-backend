'use strict';
const slugify = require('slugify');

const make = (str) =>
  slugify(String(str || ''), { lower: true, strict: true, trim: true });

// Ensure a unique slug within a collection. `Model` must have a `slug` field.
// `ignoreId` lets an update keep its own slug.
async function uniqueSlug(Model, base, ignoreId = null) {
  let slug = make(base) || 'item';
  let candidate = slug;
  let n = 1;
  /* eslint-disable no-await-in-loop */
  while (true) {
    const query = { slug: candidate };
    if (ignoreId) query._id = { $ne: ignoreId };
    const exists = await Model.exists(query);
    if (!exists) return candidate;
    candidate = `${slug}-${++n}`;
  }
}

module.exports = { make, uniqueSlug };
