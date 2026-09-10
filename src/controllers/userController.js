'use strict';
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/apiResponse');
const { User } = require('../models');

const list = catchAsync(async (req, res) => {
  const users = await User.find().sort('-createdAt');
  ok(res, users.map((u) => u.toSafeJSON()));
});

const create = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.validated;
  if (await User.exists({ email })) throw ApiError.conflict('Email already in use');
  const user = new User({ name, email, role: role || 'editor' });
  await user.setPassword(password);
  await user.save();
  created(res, user.toSafeJSON());
});

const update = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound();
  const { name, role, active, password } = req.body;
  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (active !== undefined) user.active = active;
  if (password) await user.setPassword(password);
  await user.save();
  ok(res, user.toSafeJSON());
});

const remove = catchAsync(async (req, res) => {
  if (String(req.user._id) === req.params.id) throw ApiError.badRequest('You cannot delete your own account');
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound();
  const adminCount = await User.countDocuments({ role: 'admin', active: true });
  if (user.role === 'admin' && adminCount <= 1) throw ApiError.badRequest('Cannot delete the last active admin');
  await user.deleteOne();
  ok(res, { id: user._id, deleted: true });
});

module.exports = { list, create, update, remove };
