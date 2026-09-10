'use strict';
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const env = require('../config/env');
const { Service, Page, Testimonial, Faq, Achievement, Article, Setting, Seo } = require('../models');
const { clickToChatLink } = require('../services/whatsappService');

const PUBLISHED = { published: true };

// One call the frontend makes on load: settings + nav essentials.
const bootstrap = catchAsync(async (req, res) => {
  const [settings, services, footerPages] = await Promise.all([
    Setting.getGlobal(),
    Service.find(PUBLISHED).select('name slug shortDescription icon order').sort('order name'),
    Page.find({ published: true, showInFooter: true }).select('title slug'),
  ]);
  const waLink = settings.contact.whatsapp
    ? clickToChatLink(settings.contact.whatsapp, settings.whatsappPrefill)
    : '';
  ok(res, { settings, services, footerPages, whatsappLink: waLink });
});

// ── Services ──
const listServices = catchAsync(async (req, res) => {
  ok(res, await Service.find(PUBLISHED).sort('order name'));
});
const getService = catchAsync(async (req, res) => {
  const doc = await Service.findOne({ slug: req.params.slug, published: true });
  if (!doc) throw ApiError.notFound('Service not found');
  ok(res, doc);
});

// ── Pages (dynamic + system) ──
const getPage = catchAsync(async (req, res) => {
  const doc = await Page.findOne({ slug: req.params.slug, published: true });
  if (!doc) throw ApiError.notFound('Page not found');
  ok(res, doc);
});

// ── Testimonials / FAQs / Achievements ──
const listTestimonials = catchAsync(async (req, res) => {
  ok(res, await Testimonial.find(PUBLISHED).sort('order -createdAt'));
});
const listFaqs = catchAsync(async (req, res) => {
  const filter = { ...PUBLISHED };
  if (req.query.home === 'true') filter.showOnHome = true;
  if (req.query.category) filter.category = req.query.category;
  ok(res, await Faq.find(filter).sort('order'));
});
const listAchievements = catchAsync(async (req, res) => {
  ok(res, await Achievement.find(PUBLISHED).sort('order'));
});

// ── Articles ──
const listArticles = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(24, parseInt(req.query.limit, 10) || 9);
  const filter = { status: 'published', publishedAt: { $lte: new Date() } };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.tag) filter.tags = req.query.tag;
  const [items, total] = await Promise.all([
    Article.find(filter).select('-content').sort('-publishedAt').skip((page - 1) * limit).limit(limit),
    Article.countDocuments(filter),
  ]);
  ok(res, items, { page, limit, total, pages: Math.ceil(total / limit) || 1 });
});
const getArticle = catchAsync(async (req, res) => {
  const doc = await Article.findOne({ slug: req.params.slug, status: 'published', publishedAt: { $lte: new Date() } });
  if (!doc) throw ApiError.notFound('Article not found');
  const related = await Article.find({
    _id: { $ne: doc._id },
    status: 'published',
    category: doc.category,
    publishedAt: { $lte: new Date() },
  })
    .select('title slug excerpt featuredImage publishedAt')
    .sort('-publishedAt')
    .limit(3);
  ok(res, { article: doc, related });
});

// ── SEO for a fixed route ──
const getRouteSeo = catchAsync(async (req, res) => {
  const doc = await Seo.findOne({ routeKey: req.params.key });
  ok(res, doc ? doc.seo : null);
});

// ── sitemap.xml ──
const sitemap = catchAsync(async (req, res) => {
  const base = env.appUrl.replace(/\/$/, '');
  const staticPaths = ['/', '/about', '/why-choose-us', '/services', '/achievements', '/testimonials', '/faq', '/contact', '/articles'];
  const [services, pages, articles] = await Promise.all([
    Service.find(PUBLISHED).select('slug updatedAt'),
    Page.find({ published: true }).select('slug updatedAt'),
    Article.find({ status: 'published', publishedAt: { $lte: new Date() } }).select('slug updatedAt'),
  ]);

  const url = (loc, lastmod) =>
    `  <url><loc>${base}${loc}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}</url>`;
  const urls = [
    ...staticPaths.map((p) => url(p)),
    ...services.map((s) => url(`/services/${s.slug}`, s.updatedAt)),
    ...pages.map((p) => url(`/${p.slug}`, p.updatedAt)),
    ...articles.map((a) => url(`/articles/${a.slug}`, a.updatedAt)),
  ].join('\n');

  res.header('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);
});

// ── robots.txt ──
const robots = (req, res) => {
  const base = env.appUrl.replace(/\/$/, '');
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${base}/sitemap.xml\n`);
};

module.exports = {
  bootstrap,
  listServices,
  getService,
  getPage,
  listTestimonials,
  listFaqs,
  listAchievements,
  listArticles,
  getArticle,
  getRouteSeo,
  sitemap,
  robots,
};
