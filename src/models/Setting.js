'use strict';
const { Schema, model } = require('mongoose');

// Single-document collection holding global site settings & contact info.
// Never hardcode contact details in the frontend — read them from here.
const settingSchema = new Schema(
  {
    key: { type: String, default: 'global', unique: true, index: true },

    siteName: { type: String, default: 'FlyDesk' },
    tagline: { type: String, default: 'Go Global, Stay Compliant.' },
    subTagline: { type: String, default: 'Powering cross-border selling.' },
    description: { type: String, default: '' },
    logo: { type: String, default: '' },

    contact: {
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      whatsapp: { type: String, default: '' }, // digits only, e.g. 918893955755
      address: { type: String, default: '' },
      mapEmbedUrl: { type: String, default: '' },
      businessHours: { type: String, default: '' },
    },

    social: {
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      youtube: { type: String, default: '' },
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },

    // Default WhatsApp click-to-chat prefill message.
    whatsappPrefill: {
      type: String,
      default: 'Hi FlyDesk, I would like to know more about cross-border seller setup.',
    },

    // Default SEO applied when a page has no per-page override.
    defaultSeo: {
      metaTitle: { type: String, default: 'FlyDesk — Go Global, Stay Compliant' },
      metaDescription: { type: String, default: '' },
      ogImage: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

settingSchema.statics.getGlobal = async function () {
  let doc = await this.findOne({ key: 'global' });
  if (!doc) doc = await this.create({ key: 'global' });
  return doc;
};

module.exports = model('Setting', settingSchema);
