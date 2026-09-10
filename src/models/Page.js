'use strict';
const { Schema, model } = require('mongoose');
const { seoSchema } = require('./_shared');

// Generic CMS page — powers dynamic informational pages, Privacy, Terms, etc.
const pageSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    excerpt: { type: String, trim: true, maxlength: 400 },
    content: { type: String }, // sanitized rich HTML
    featuredImage: { type: String, trim: true },
    // `system` pages (privacy, terms) cannot be deleted via the API to avoid broken footer links.
    system: { type: Boolean, default: false },
    showInFooter: { type: Boolean, default: false },
    published: { type: Boolean, default: false, index: true },
    seo: { type: seoSchema, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = model('Page', pageSchema);
