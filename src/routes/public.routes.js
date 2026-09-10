'use strict';
const router = require('express').Router();
const pub = require('../controllers/publicController');

router.get('/bootstrap', pub.bootstrap);
router.get('/services', pub.listServices);
router.get('/services/:slug', pub.getService);
router.get('/testimonials', pub.listTestimonials);
router.get('/faqs', pub.listFaqs);
router.get('/achievements', pub.listAchievements);
router.get('/articles', pub.listArticles);
router.get('/articles/:slug', pub.getArticle);
router.get('/seo/:key', pub.getRouteSeo);
router.get('/pages/:slug', pub.getPage);

module.exports = router;
