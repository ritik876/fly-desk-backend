'use strict';
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/apiResponse');
const { paginate } = require('../utils/queryFeatures');
const { Inquiry } = require('../models');
const inquiryService = require('../services/inquiryService');

// ── PUBLIC: submit a lead ─────────────────────────────────────────────
const submit = catchAsync(async (req, res) => {
  const v = req.validated;
  const inquiry = await inquiryService.createInquiry({
    name: v.name,
    email: v.email,
    phone: v.phone,
    company: v.company,
    service: v.service,
    message: v.message,
    preferredDate: v.preferredDate,
    type: v.type || 'inquiry',
    sourcePage: v.sourcePage || req.get('referer') || '',
    utm: {
      source: v.utm_source,
      medium: v.utm_medium,
      campaign: v.utm_campaign,
      term: v.utm_term,
      content: v.utm_content,
    },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Respond to the visitor immediately; notifications run afterwards and can
  // fail without affecting the saved lead.
  created(res, {
    inquiryId: inquiry.inquiryId,
    message: 'Thank you. Your inquiry has been received.',
  });

  setImmediate(() => inquiryService.dispatchNotifications(inquiry.inquiryId));
});

// ── ADMIN: list with search/filter/sort/pagination ───────────────────
const list = catchAsync(async (req, res) => {
  const { items, meta } = await paginate(Inquiry, req.query, {
    searchFields: ['name', 'email', 'phone', 'company', 'inquiryId', 'service'],
    allowedFilters: ['status', 'type', 'service'],
    defaultSort: '-createdAt',
  });
  ok(res, items, meta);
});

const getOne = catchAsync(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) throw ApiError.notFound();
  ok(res, inquiry);
});

const updateStatus = catchAsync(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) throw ApiError.notFound();
  const { status } = req.validated;
  if (status === inquiry.status) return ok(res, inquiry);
  const from = inquiry.status;
  inquiry.status = status;
  inquiry.history.push({
    type: 'status_changed',
    message: `Status ${from} → ${status}`,
    from,
    to: status,
    by: req.user.name,
    at: new Date(),
  });
  await inquiry.save();
  ok(res, inquiry);
});

const addNote = catchAsync(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) throw ApiError.notFound();
  const { body } = req.validated;
  inquiry.notes.push({ body, author: req.user.name, createdAt: new Date() });
  inquiry.history.push({ type: 'note_added', message: 'Internal note added', by: req.user.name, at: new Date() });
  await inquiry.save();
  created(res, inquiry);
});

const remove = catchAsync(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) throw ApiError.notFound();
  await inquiry.deleteOne();
  ok(res, { id: inquiry._id, deleted: true });
});

// ── ADMIN: dashboard stats ───────────────────────────────────────────
const stats = catchAsync(async (req, res) => {
  const byStatus = await Inquiry.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const counts = { NEW: 0, CONTACTED: 0, IN_PROGRESS: 0, CONVERTED: 0, CLOSED: 0 };
  byStatus.forEach((r) => { counts[r._id] = r.count; });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const last30 = await Inquiry.countDocuments({ createdAt: { $gte: since } });
  const recent = await Inquiry.find().sort('-createdAt').limit(8);
  const conversionRate = total ? Math.round((counts.CONVERTED / total) * 1000) / 10 : 0;

  ok(res, { total, counts, last30, conversionRate, recent });
});

// ── ADMIN: CSV export (respects the same filters as list) ────────────
const exportCsv = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.service) filter.service = req.query.service;
  const rows = await Inquiry.find(filter).sort('-createdAt').limit(10000).lean();

  const headers = ['inquiryId', 'name', 'email', 'phone', 'company', 'service', 'status', 'type', 'sourcePage', 'message', 'createdAt'];
  const esc = (v) => {
    const s = v === undefined || v === null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => esc(h === 'createdAt' ? new Date(r.createdAt).toISOString() : r[h])).join(',')),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="flydesk-inquiries-${Date.now()}.csv"`);
  res.send('﻿' + csv); // BOM for Excel
});

module.exports = { submit, list, getOne, updateStatus, addNote, remove, stats, exportCsv };
