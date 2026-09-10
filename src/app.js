'use strict';
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const env = require('./config/env');
const logger = require('./utils/logger');
const routes = require('./routes');
const publicCtrl = require('./controllers/publicController');
const { notFound, errorHandler } = require('./middleware/error');
const { apiLimiter } = require('./middleware/rateLimit');

const app = express();

// Behind a reverse proxy (Nginx / AWS ALB) — needed for correct req.ip & secure cookies.
app.set('trust proxy', 1);

// Security headers. crossOriginResourcePolicy relaxed so the separate frontend
// origin can load uploaded images.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // CSP is applied at the frontend host / CDN layer
  })
);

// CORS — the known frontend + admin origins, with credentials for cookie auth.
// APP_URL / ADMIN_URL cover the primary origins; CORS_ORIGINS (comma-separated)
// adds any extras (custom domains, staging) without a code change.
const normalizeOrigin = (o) => String(o || '').trim().replace(/\/+$/, '').toLowerCase();

const allowedOrigins = [
  env.appUrl,
  env.adminUrl,
  ...String(process.env.CORS_ORIGINS || '').split(','),
]
  .map(normalizeOrigin)
  .filter(Boolean);

// Vercel mints a unique hostname for every deployment (previews and rollbacks),
// so match this project's deployments by pattern instead of listing each one.
const allowedOriginPatterns = [
  /^https:\/\/fly-desk-(frontend|admin|backend)(-[a-z0-9-]+)?\.vercel\.app$/i,
];

// CORS_ORIGINS=* opens the API to every origin. The caller's own origin is always
// reflected back — never the literal '*' — because browsers refuse a wildcard
// Access-Control-Allow-Origin on credentialed requests, which would break cookie auth.
const allowAllOrigins = allowedOrigins.includes('*');

if (allowAllOrigins && env.isProd) {
  logger.warn(
    'CORS: all origins allowed (CORS_ORIGINS=*) — any website can send credentialed ' +
      'requests to this API. Set CORS_ORIGINS to an explicit list to lock it down.'
  );
}

function isAllowedOrigin(origin) {
  if (allowAllOrigins) return true;
  const o = normalizeOrigin(origin);
  return allowedOrigins.includes(o) || allowedOriginPatterns.some((re) => re.test(o));
}

app.use(
  cors({
    origin(origin, cb) {
      // No Origin header: same-origin, curl, health checks, server-to-server.
      if (!origin) return cb(null, true);
      if (isAllowedOrigin(origin)) return cb(null, true);
      // Do NOT pass an Error here. cors() would hand it to the error handler,
      // which answers 500 *without* CORS headers — the browser then reports an
      // opaque 500 and the real cause is invisible. Returning false simply omits
      // the Access-Control-Allow-Origin header, which is the correct rejection.
      logger.warn(`CORS: rejected origin ${origin}`);
      return cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  })
);

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());

if (!env.isProd) app.use(morgan('dev'));
else app.use(morgan('combined'));

// Serve uploaded media (local storage driver).
app.use(
  '/uploads',
  express.static(path.resolve(process.cwd(), env.storage.uploadDir), {
    maxAge: '7d',
    setHeaders: (res) => res.set('Cross-Origin-Resource-Policy', 'cross-origin'),
  })
);

// SEO files at the API root (proxy /sitemap.xml & /robots.txt here in production,
// or generate them at the frontend host — both are provided).
app.get('/sitemap.xml', publicCtrl.sitemap);
app.get('/robots.txt', publicCtrl.robots);

// API.
app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
