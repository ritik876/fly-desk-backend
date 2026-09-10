'use strict';
const { Schema, model } = require('mongoose');

const testimonialSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, trim: true },
    company: { type: String, trim: true },
    content: { type: String, required: true, trim: true },
    avatar: { type: String, trim: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    order: { type: Number, default: 0, index: true },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = model('Testimonial', testimonialSchema);
