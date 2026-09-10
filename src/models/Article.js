'use strict';
const { Schema, model } = require('mongoose');
const { seoSchema } = require('./_shared');

const articleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    excerpt: { type: String, trim: true, maxlength: 400 },
    content: { type: String }, // sanitized rich HTML
    featuredImage: { type: String, trim: true },
    author: { type: String, trim: true, default: 'FlyDesk' },
    category: { type: String, trim: true, default: 'General', index: true },
    tags: [{ type: String, trim: true }],
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    publishedAt: { type: Date }, // set when status -> published; schedule-ready (future dates)
    seo: { type: seoSchema, default: () => ({}) },
  },
  { timestamps: true }
);

articleSchema.index({ status: 1, publishedAt: -1 });

module.exports = model('Article', articleSchema);
