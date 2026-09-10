'use strict';
const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const logger = require('../utils/logger');

// Local disk storage by default; S3 is stubbed behind the same interface so the
// media controller never changes when you switch STORAGE_DRIVER=s3.
const uploadDir = path.resolve(process.cwd(), env.storage.uploadDir);

function publicUrl(filename) {
  if (env.storage.driver === 's3' && env.storage.aws.bucket) {
    return `https://${env.storage.aws.bucket}.s3.${env.storage.aws.region}.amazonaws.com/${filename}`;
  }
  return `${env.apiUrl.replace(/\/$/, '')}/uploads/${filename}`;
}

async function remove(key) {
  if (!key) return;
  if (env.storage.driver === 's3') {
    // Implement S3 deletion here when enabling S3 (kept dependency-free by default).
    logger.info('S3 delete requested (implement with @aws-sdk/client-s3)', { key });
    return;
  }
  const filePath = path.join(uploadDir, path.basename(key));
  fs.promises.unlink(filePath).catch((e) => logger.warn('Media delete failed', { error: e.message }));
}

module.exports = { publicUrl, remove, uploadDir };
