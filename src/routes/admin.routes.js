'use strict';
const express = require('express');
const router = express.Router();

const { protect, restrictTo } = require('../middleware/auth');
const crudFactory = require('../controllers/crudFactory');
const { Service, Page, Testimonial, Faq, Achievement, Article } = require('../models');

const settingCtrl = require('../controllers/settingController');
const mediaCtrl = require('../controllers/mediaController');
const seoCtrl = require('../controllers/seoController');
const userCtrl = require('../controllers/userController');
const { upload } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const schemas = require('../validators/schemas');

// Everything under /api/admin requires authentication.
router.use(protect);

// Build a standard CRUD sub-router from a factory controller.
function crudRouter(ctrl, { reorder = false } = {}) {
  const r = express.Router();
  r.get('/', ctrl.list);
  if (reorder) r.patch('/reorder', ctrl.reorder);
  r.post('/', ctrl.create);
  r.get('/:id', ctrl.getOne);
  r.put('/:id', ctrl.update);
  r.patch('/:id', ctrl.update);
  r.delete('/:id', ctrl.remove);
  return r;
}

// ── Services ──
router.use(
  '/services',
  crudRouter(
    crudFactory(Service, {
      slugFrom: 'name',
      searchFields: ['name', 'slug', 'shortDescription'],
      allowedFilters: ['published'],
      defaultSort: 'order',
      stringFields: ['name', 'shortDescription', 'intro'],
      richFields: ['content'],
    }),
    { reorder: true }
  )
);

// ── Pages (dynamic + system) ──
router.use(
  '/pages',
  crudRouter(
    crudFactory(Page, {
      slugFrom: 'title',
      searchFields: ['title', 'slug'],
      allowedFilters: ['published', 'showInFooter'],
      stringFields: ['title', 'excerpt'],
      richFields: ['content'],
      protectDelete: (doc) => doc.system === true,
    })
  )
);

// ── Testimonials ──
router.use(
  '/testimonials',
  crudRouter(
    crudFactory(Testimonial, {
      searchFields: ['name', 'company', 'content'],
      allowedFilters: ['published'],
      defaultSort: 'order',
      stringFields: ['name', 'designation', 'company', 'content'],
    }),
    { reorder: true }
  )
);

// ── FAQs ──
router.use(
  '/faqs',
  crudRouter(
    crudFactory(Faq, {
      searchFields: ['question', 'answer', 'category'],
      allowedFilters: ['published', 'category', 'showOnHome'],
      defaultSort: 'order',
      stringFields: ['question', 'answer', 'category'],
    }),
    { reorder: true }
  )
);

// ── Achievements ──
router.use(
  '/achievements',
  crudRouter(
    crudFactory(Achievement, {
      searchFields: ['label', 'number'],
      allowedFilters: ['published'],
      defaultSort: 'order',
      stringFields: ['number', 'label', 'description'],
    }),
    { reorder: true }
  )
);

// ── Articles ──
router.use(
  '/articles',
  crudRouter(
    crudFactory(Article, {
      slugFrom: 'title',
      searchFields: ['title', 'slug', 'category', 'author'],
      allowedFilters: ['status', 'category'],
      defaultSort: '-createdAt',
      stringFields: ['title', 'excerpt', 'author', 'category'],
      richFields: ['content'],
    })
  )
);

// ── Media manager ──
router.get('/media', mediaCtrl.list);
router.post('/media', upload.single('file'), mediaCtrl.upload);
router.patch('/media/:id', mediaCtrl.update);
router.delete('/media/:id', mediaCtrl.remove);

// ── Settings (global) ──
router.get('/settings', settingCtrl.get);
router.put('/settings', restrictTo('admin'), settingCtrl.update);

// ── SEO for fixed routes ──
router.get('/seo', seoCtrl.list);
router.get('/seo/:key', seoCtrl.getByKey);
router.put('/seo', restrictTo('admin'), seoCtrl.upsert);

// ── Admin users (admin role only) ──
router.get('/users', restrictTo('admin'), userCtrl.list);
router.post('/users', restrictTo('admin'), validate(schemas.createUser), userCtrl.create);
router.patch('/users/:id', restrictTo('admin'), userCtrl.update);
router.delete('/users/:id', restrictTo('admin'), userCtrl.remove);

module.exports = router;
