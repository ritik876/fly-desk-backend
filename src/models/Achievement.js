'use strict';
const { Schema, model } = require('mongoose');

// Numerical highlights (stats strip). Values are CMS-editable placeholders —
// never seed fabricated figures.
const achievementSchema = new Schema(
  {
    number: { type: String, required: true, trim: true }, // string to allow "500+", "12k", "—"
    label: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    icon: { type: String, trim: true },
    order: { type: Number, default: 0, index: true },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = model('Achievement', achievementSchema);
