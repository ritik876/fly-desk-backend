'use strict';
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const { User } = require('../models');
const { signAuthToken, cookieOptions } = require('../services/tokenService');

const login = catchAsync(async (req, res) => {
  const { email, password } = req.validated;
  const user = await User.findOne({ email }).select('+passwordHash');
  // Constant-ish response — do not reveal whether the email exists.
  if (!user || !user.active || !(await user.verifyPassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  user.lastLoginAt = new Date();
  await user.save();

  const token = signAuthToken(user);
  res.cookie('token', token, cookieOptions());
  ok(res, { user: user.toSafeJSON(), token });
});

const logout = catchAsync(async (req, res) => {
  res.clearCookie('token', { ...cookieOptions(), maxAge: 0 });
  ok(res, { loggedOut: true });
});

const me = catchAsync(async (req, res) => {
  ok(res, { user: req.user.toSafeJSON() });
});

const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.validated;
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await user.verifyPassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  await user.setPassword(newPassword);
  await user.save();
  ok(res, { updated: true });
});

module.exports = { login, logout, me, changePassword };
