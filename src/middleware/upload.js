'use strict';
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

// Secure image upload: whitelist real image MIME types + extensions, cap size,
// randomize filenames, and reject anything executable.
const ALLOWED = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
};

const uploadDir = path.resolve(process.cwd(), env.storage.uploadDir);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = ALLOWED[file.mimetype] || path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED[file.mimetype]) {
    return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}. Images only.`));
  }
  // Extension must also be an image extension — blocks double-extension tricks.
  const ext = path.extname(file.originalname).toLowerCase();
  const okExt = Object.values(ALLOWED).concat(['.jpeg']);
  if (!okExt.includes(ext)) {
    return cb(ApiError.badRequest('File extension not allowed.'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.storage.maxUploadMb * 1024 * 1024, files: 1 },
});

module.exports = { upload, uploadDir, ALLOWED };
