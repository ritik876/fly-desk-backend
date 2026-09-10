'use strict';
const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;
function getTransporter() {
  if (!env.email.enabled || !env.email.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.secure,
      auth: env.email.user ? { user: env.email.user, pass: env.email.pass } : undefined,
    });
  }
  return transporter;
}

// Returns 'sent' | 'failed' | 'skipped' — NEVER throws to the caller.
async function notifyNewInquiry(inquiry) {
  const t = getTransporter();
  if (!t) return 'skipped';

  const rows = [
    ['Inquiry ID', inquiry.inquiryId],
    ['Name', inquiry.name],
    ['Email', inquiry.email],
    ['Phone', inquiry.phone],
    ['Company', inquiry.company || '—'],
    ['Service', inquiry.service || '—'],
    ['Message', inquiry.message || '—'],
    ['Source page', inquiry.sourcePage || '—'],
    ['Received', new Date(inquiry.createdAt || Date.now()).toLocaleString('en-IN')],
  ];
  const html =
    `<h2>New FlyDesk inquiry</h2><table cellpadding="6" style="border-collapse:collapse">` +
    rows
      .map(
        ([k, v]) =>
          `<tr><td style="border:1px solid #eee"><b>${k}</b></td><td style="border:1px solid #eee">${String(v)
            .replace(/</g, '&lt;')}</td></tr>`
      )
      .join('') +
    `</table>`;

  try {
    await t.sendMail({
      from: env.email.from,
      to: env.email.notifyTo,
      replyTo: inquiry.email,
      subject: `New lead ${inquiry.inquiryId} — ${inquiry.name}`,
      html,
    });
    return 'sent';
  } catch (e) {
    logger.warn('Email notify error', { error: e.message });
    return 'failed';
  }
}

module.exports = { notifyNewInquiry };
