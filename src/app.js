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

// CORS — only the known frontend + admin origins, with credentials for cookie auth.
const allowedOrigins = [env.appUrl, env.adminUrl].filter(Boolean);
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
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
