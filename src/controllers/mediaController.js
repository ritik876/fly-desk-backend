'use strict';
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/apiResponse');
const { paginate } = require('../utils/queryFeatures');
const { Media } = require('../models');
const storage = require('../services/storageService');

const list = catchAsync(async (req, res) => {
  const { items, meta } = await paginate(Media, req.query, {
    searchFields: ['originalName', 'altText', 'filename'],
    defaultSort: '-createdAt',
  });
  ok(res, items, meta);
});

const upload = catchAsync(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const media = await Media.create({
    filename: req.file.filename,
    originalName: req.file.originalname,
    url: storage.publicUrl(req.file.filename),
    key: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    altText: req.body.altText || '',
    uploadedBy: req.user._id,
  });
  created(res, media);
});

const update = catchAsync(async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) throw ApiError.notFound();
  if (req.body.altText !== undefined) media.altText = String(req.body.altText).slice(0, 300);
  await media.save();
  ok(res, media);
});

const remove = catchAsync(async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) throw ApiError.notFound();
  await storage.remove(media.key);
  await media.deleteOne();
  ok(res, { id: media._id, deleted: true });
});

module.exports = { list, upload, update, remove };
