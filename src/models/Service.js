'use strict';
const { Schema, model } = require('mongoose');
const { seoSchema } = require('./_shared');

const faqItem = new Schema(
  { question: { type: String, trim: true }, answer: { type: String, trim: true } },
  { _id: false }
);

const serviceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    shortDescription: { type: String, trim: true, maxlength: 400 },
    intro: { type: String, trim: true }, // hero/intro paragraph
    content: { type: String }, // sanitized rich HTML body
    image: { type: String, trim: true }, // media URL
    icon: { type: String, trim: true },
    features: [{ type: String, trim: true }],
    benefits: [{ type: String, trim: true }],
    facilities: [{ type: String, trim: true }],
    suitableFor: [{ type: String, trim: true }],
    gallery: [{ type: String, trim: true }],
    faqs: [faqItem],
    order: { type: Number, default: 0, index: true },
    published: { type: Boolean, default: true, index: true },
    seo: { type: seoSchema, default: () => ({}) },
  },
  { timestamps: true }
);

serviceSchema.index({ published: 1, order: 1 });

module.exports = model('Service', serviceSchema);
