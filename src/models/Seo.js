'use strict';
const { Schema, model } = require('mongoose');
const { seoSchema } = require('./_shared');

// SEO overrides for fixed/static routes that aren't CMS Pages
// (e.g. 'home', 'about', 'services', 'contact', 'articles').
const seoRouteSchema = new Schema(
  {
    routeKey: { type: String, required: true, unique: true, index: true },
    label: { type: String, trim: true },
    path: { type: String, trim: true }, // e.g. '/', '/about'
    seo: { type: seoSchema, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = model('Seo', seoRouteSchema);
