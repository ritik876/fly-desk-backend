'use strict';
const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/inquiries', require('./inquiry.routes'));
router.use('/public', require('./public.routes'));
router.use('/admin', require('./admin.routes'));

router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } }));

module.exports = router;
