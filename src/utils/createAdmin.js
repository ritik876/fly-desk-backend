'use strict';
/**
 * Creates (or resets) the first admin user from env vars ADMIN_NAME/EMAIL/PASSWORD.
 * Run: npm run create-admin
 */
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');
const { User } = require('../models');
const logger = require('./logger');

async function run() {
  await mongoose.connect(env.mongoUri);
  const { name, email, password } = env.admin;

  if (password === 'ChangeMe123!' || !password) {
    logger.warn('Set a strong ADMIN_PASSWORD in .env before creating the admin.');
  }

  let user = await User.findOne({ email });
  if (user) {
    await user.setPassword(password);
    user.name = name;
    user.role = 'admin';
    user.active = true;
    await user.save();
    logger.info(`Admin updated: ${email}`);
  } else {
    user = new User({ name, email, role: 'admin' });
    await user.setPassword(password);
    await user.save();
    logger.info(`Admin created: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  logger.error('create-admin failed', { error: e.message });
  process.exit(1);
});
