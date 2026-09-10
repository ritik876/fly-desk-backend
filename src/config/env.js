'use strict';
require('dotenv').config();

const bool = (v, d = false) =>
  v === undefined ? d : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
const num = (v, d) => (v === undefined || v === '' ? d : Number(v));

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: num(process.env.PORT, 5000),
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:5174',
  apiUrl: process.env.API_URL || 'http://localhost:5000',

  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/flydesk',

  jwt: {
    secret: process.env.JWT_SECRET || 'insecure_dev_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieExpiresDays: num(process.env.JWT_COOKIE_EXPIRES_DAYS, 7),
  },

  admin: {
    name: process.env.ADMIN_NAME || 'FlyDesk Admin',
    email: process.env.ADMIN_EMAIL || 'admin@flydesk.in',
    password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
  },

  whatsapp: {
    enabled: bool(process.env.WHATSAPP_ENABLED),
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    notifyTo: process.env.WHATSAPP_NOTIFY_TO || '',
    templateName: process.env.WHATSAPP_TEMPLATE_NAME || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v20.0',
  },

  email: {
    enabled: bool(process.env.EMAIL_ENABLED),
    host: process.env.SMTP_HOST || '',
    port: num(process.env.SMTP_PORT, 587),
    secure: bool(process.env.SMTP_SECURE),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'FlyDesk <hello@flydeskprojects.com>',
    notifyTo: process.env.EMAIL_NOTIFY_TO || 'hello@flydeskprojects.com',
  },

  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    maxUploadMb: num(process.env.MAX_UPLOAD_MB, 5),
    aws: {
      region: process.env.AWS_REGION || 'ap-south-1',
      bucket: process.env.AWS_S3_BUCKET || '',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  },

  rateLimit: {
    windowMin: num(process.env.RATE_LIMIT_WINDOW_MIN, 15),
    max: num(process.env.RATE_LIMIT_MAX, 300),
    inquiryMax: num(process.env.INQUIRY_RATE_LIMIT_MAX, 10),
  },
};

env.isProd = env.nodeEnv === 'production';

// Fail fast in production if critical secrets are left at defaults.
if (env.isProd) {
  const problems = [];
  if (env.jwt.secret === 'insecure_dev_secret_change_me') problems.push('JWT_SECRET');
  if (!process.env.MONGODB_URI) problems.push('MONGODB_URI');
  if (problems.length) {
    // eslint-disable-next-line no-console
    console.error(`[FATAL] Missing/insecure production config: ${problems.join(', ')}`);
    process.exit(1);
  }
}

module.exports = env;
