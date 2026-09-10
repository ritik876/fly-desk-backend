'use strict';
const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const windowMs = env.rateLimit.windowMin * 60 * 1000;

const jsonMsg = (msg) => ({ success: false, error: { message: msg } });

// Global API limiter.
const apiLimiter = rateLimit({
  windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMsg('Too many requests, please try again later.'),
});

// Stricter limiter for public lead submission (anti-spam).
const inquiryLimiter = rateLimit({
  windowMs,
  max: env.rateLimit.inquiryMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMsg('Too many submissions from this network. Please try again later.'),
});

// Very strict limiter for auth (anti brute-force).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMsg('Too many login attempts. Please try again in 15 minutes.'),
});

module.exports = { apiLimiter, inquiryLimiter, authLimiter };
