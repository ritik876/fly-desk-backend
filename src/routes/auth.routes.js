'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const schemas = require('../validators/schemas');

router.post('/login', authLimiter, validate(schemas.login), ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me', protect, ctrl.me);
router.patch('/change-password', protect, validate(schemas.changePassword), ctrl.changePassword);

module.exports = router;
