'use strict';
const { Schema } = require('mongoose');

// Reusable SEO block embedded on every public-facing content model.
const seoSchema = new Schema(
  {
    metaTitle: { type: String, trim: true, maxlength: 160 },
    metaDescription: { type: String, trim: true, maxlength: 320 },
    canonicalUrl: { type: String, trim: true },
    ogTitle: { type: String, trim: true, maxlength: 160 },
    ogDescription: { type: String, trim: true, maxlength: 320 },
    ogImage: { type: String, trim: true },
    robots: { type: String, trim: true, default: 'index,follow' },
    keywords: [{ type: String, trim: true }],
  },
  { _id: false }
);

module.exports = { seoSchema };
