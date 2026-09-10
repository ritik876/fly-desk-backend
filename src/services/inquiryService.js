'use strict';
const crypto = require('crypto');
const { Inquiry } = require('../models');
const whatsapp = require('./whatsappService');
const email = require('./emailService');
const logger = require('../utils/logger');

// FD-YYYYMMDD-XXXX (last part random, collision-checked).
function generateInquiryId() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  return `FD-${ymd}-${rand}`;
}

async function uniqueInquiryId() {
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < 5; i++) {
    const id = generateInquiryId();
    if (!(await Inquiry.exists({ inquiryId: id }))) return id;
  }
  return `FD-${Date.now()}`;
}

/**
 * Create a lead. CRITICAL: persistence happens first and is fully committed
 * before any notification is attempted, so a failed WhatsApp/email never loses
 * the lead. Notifications run after the response is sent (fire-and-forget).
 */
async function createInquiry(data) {
  const inquiryId = await uniqueInquiryId();

  const inquiry = await Inquiry.create({
    ...data,
    inquiryId,
    status: 'NEW',
    history: [{ type: 'created', message: 'Inquiry submitted', by: 'system', at: new Date() }],
    notifications: { whatsapp: 'pending', email: 'pending' },
  });

  return inquiry; // caller responds to the visitor immediately after this resolves
}

// Runs AFTER the visitor has been given a success response.
async function dispatchNotifications(inquiryId) {
  try {
    const inquiry = await Inquiry.findOne({ inquiryId });
    if (!inquiry) return;

    const [waResult, emailResult] = await Promise.allSettled([
      whatsapp.notifyNewInquiry(inquiry),
      email.notifyNewInquiry(inquiry),
    ]);

    inquiry.notifications.whatsapp =
      waResult.status === 'fulfilled' ? waResult.value : 'failed';
    inquiry.notifications.email =
      emailResult.status === 'fulfilled' ? emailResult.value : 'failed';

    await inquiry.save();
  } catch (e) {
    // Swallow — notifications are best-effort and must not affect the lead.
    logger.warn('dispatchNotifications error', { inquiryId, error: e.message });
  }
}

module.exports = { createInquiry, dispatchNotifications, generateInquiryId };
