'use strict';
// Minimal structured logger — no external dependency, JSON in production.
const env = require('../config/env');

function log(level, msg, meta) {
  const time = new Date().toISOString();
  if (env.isProd) {
    // eslint-disable-next-line no-console
    console[level === 'error' ? 'error' : 'log'](
      JSON.stringify({ time, level, msg, ...(meta ? { meta } : {}) })
    );
  } else {
    // eslint-disable-next-line no-console
    console[level === 'error' ? 'error' : 'log'](
      `${time} [${level.toUpperCase()}] ${msg}${meta ? ' ' + JSON.stringify(meta) : ''}`
    );
  }
}

module.exports = {
  info: (m, meta) => log('info', m, meta),
  warn: (m, meta) => log('warn', m, meta),
  error: (m, meta) => log('error', m, meta),
};
