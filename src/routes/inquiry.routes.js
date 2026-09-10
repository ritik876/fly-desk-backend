'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/inquiryController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { inquiryLimiter } = require('../middleware/rateLimit');
const schemas = require('../validators/schemas');

// PUBLIC — lead submission (rate-limited, validated, sanitized).
router.post('/', inquiryLimiter, validate(schemas.submitInquiry), ctrl.submit);

// ADMIN — everything below requires auth.
router.use(protect);
router.get('/stats', ctrl.stats);
router.get('/export', ctrl.exportCsv);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.patch('/:id/status', validate(schemas.updateStatus), ctrl.updateStatus);
router.post('/:id/notes', validate(schemas.addNote), ctrl.addNote);
router.delete('/:id', restrictTo('admin'), ctrl.remove);

module.exports = router;
