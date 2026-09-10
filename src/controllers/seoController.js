'use strict';
const catchAsync = require('../utils/catchAsync');
const { ok } = require('../utils/apiResponse');
const { Seo } = require('../models');

const list = catchAsync(async (req, res) => {
  ok(res, await Seo.find().sort('routeKey'));
});

// Upsert by routeKey so fixed routes always have exactly one record.
const upsert = catchAsync(async (req, res) => {
  const { routeKey, label, path, seo } = req.body;
  const doc = await Seo.findOneAndUpdate(
    { routeKey },
    { $set: { label, path, seo } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  ok(res, doc);
});

const getByKey = catchAsync(async (req, res) => {
  const doc = await Seo.findOne({ routeKey: req.params.key });
  ok(res, doc || null);
});

module.exports = { list, upsert, getByKey };
