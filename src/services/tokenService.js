'use strict';
const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signAuthToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

// Cookie options for the auth token (httpOnly, secure in prod, sameSite).
function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    maxAge: env.jwt.cookieExpiresDays * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

module.exports = { signAuthToken, cookieOptions };
