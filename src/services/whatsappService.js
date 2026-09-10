'use strict';
const env = require('../config/env');
const logger = require('../utils/logger');

// Meta WhatsApp Cloud API notification. BASIC scope only:
// a single outbound alert to the FlyDesk team when a lead arrives.
// No chatbot, no drip, no two-way automation.
// Returns 'sent' | 'failed' | 'skipped' — NEVER throws to the caller.
async function notifyNewInquiry(inquiry) {
  if (!env.whatsapp.enabled || !env.whatsapp.phoneNumberId || !env.whatsapp.accessToken || !env.whatsapp.notifyTo) {
    return 'skipped';
  }

  const url = `https://graph.facebook.com/${env.whatsapp.apiVersion}/${env.whatsapp.phoneNumberId}/messages`;
  const text =
    `🟢 New FlyDesk lead\n` +
    `ID: ${inquiry.inquiryId}\n` +
    `Name: ${inquiry.name}\n` +
    `Phone: ${inquiry.phone}\n` +
    `Email: ${inquiry.email}\n` +
    (inquiry.company ? `Company: ${inquiry.company}\n` : '') +
    (inquiry.service ? `Service: ${inquiry.service}\n` : '') +
    (inquiry.message ? `Message: ${inquiry.message}\n` : '') +
    (inquiry.sourcePage ? `Source: ${inquiry.sourcePage}` : '');

  // Free-form text works only inside a 24h session window; a pre-approved
  // template is used when configured (recommended for reliable delivery).
  const payload = env.whatsapp.templateName
    ? {
        messaging_product: 'whatsapp',
        to: env.whatsapp.notifyTo,
        type: 'template',
        template: {
          name: env.whatsapp.templateName,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: inquiry.inquiryId },
                { type: 'text', text: inquiry.name },
                { type: 'text', text: inquiry.phone },
              ],
            },
          ],
        },
      }
    : {
        messaging_product: 'whatsapp',
        to: env.whatsapp.notifyTo,
        type: 'text',
        text: { body: text },
      };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.whatsapp.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logger.warn('WhatsApp notify failed', { status: res.status, body: body.slice(0, 300) });
      return 'failed';
    }
    return 'sent';
  } catch (e) {
    logger.warn('WhatsApp notify error', { error: e.message });
    return 'failed';
  }
}

// Build a click-to-chat link for the public site (no API needed).
function clickToChatLink(number, prefill) {
  const digits = String(number || '').replace(/\D/g, '');
  const q = prefill ? `?text=${encodeURIComponent(prefill)}` : '';
  return `https://wa.me/${digits}${q}`;
}

module.exports = { notifyNewInquiry, clickToChatLink };
