'use strict';
const { Schema, model } = require('mongoose');

const faqSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: 'General', index: true },
    order: { type: Number, default: 0, index: true },
    showOnHome: { type: Boolean, default: false },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = model('Faq', faqSchema);
