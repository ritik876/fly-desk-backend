'use strict';
const { Schema, model } = require('mongoose');

const mediaSchema = new Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, trim: true },
    url: { type: String, required: true }, // public URL (local /uploads/.. or S3)
    key: { type: String }, // storage key/path for deletion
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }, // bytes
    altText: { type: String, trim: true, default: '' },
    width: { type: Number },
    height: { type: Number },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = model('Media', mediaSchema);
