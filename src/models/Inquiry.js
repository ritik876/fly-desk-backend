'use strict';
const { Schema, model } = require('mongoose');

const STATUSES = ['NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'CLOSED'];

const noteSchema = new Schema(
  {
    body: { type: String, required: true, trim: true },
    author: { type: String, trim: true }, // admin name
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const historySchema = new Schema(
  {
    type: { type: String, required: true }, // e.g. 'created', 'status_changed', 'note_added'
    message: { type: String, trim: true },
    from: { type: String },
    to: { type: String },
    by: { type: String },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const inquirySchema = new Schema(
  {
    inquiryId: { type: String, required: true, unique: true, index: true }, // e.g. FD-20260909-AB12
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    company: { type: String, trim: true },
    service: { type: String, trim: true }, // service name or slug (free text — services are CMS-managed)
    message: { type: String, trim: true },
    preferredDate: { type: Date }, // for "Book a Consultation" flow

    sourcePage: { type: String, trim: true }, // URL/path the inquiry came from
    type: { type: String, enum: ['inquiry', 'consultation', 'contact'], default: 'inquiry' },
    utm: {
      source: { type: String, trim: true },
      medium: { type: String, trim: true },
      campaign: { type: String, trim: true },
      term: { type: String, trim: true },
      content: { type: String, trim: true },
    },
    ip: { type: String },
    userAgent: { type: String },

    status: { type: String, enum: STATUSES, default: 'NEW', index: true },
    notes: [noteSchema],
    history: [historySchema],

    // Notification delivery is tracked but NEVER blocks lead persistence.
    notifications: {
      whatsapp: { type: String, enum: ['pending', 'sent', 'failed', 'skipped'], default: 'pending' },
      email: { type: String, enum: ['pending', 'sent', 'failed', 'skipped'], default: 'pending' },
    },
  },
  { timestamps: true }
);

inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.statics.STATUSES = STATUSES;

module.exports = model('Inquiry', inquirySchema);
module.exports.STATUSES = STATUSES;
