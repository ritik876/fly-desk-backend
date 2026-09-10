'use strict';
/**
 * Seeds the database with the REAL FlyDesk business content extracted from
 * https://www.flydesk.in/. Values that are not publicly verifiable (stats,
 * testimonials) are left empty or marked as CMS placeholders — never fabricated.
 *
 * Run: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');
const { make } = require('./slug');
const { Setting, Service, Faq, Achievement, Page, Seo, User } = require('../models');
const logger = require('./logger');

const SERVICES = [
  {
    name: 'Compliance-First Operations',
    shortDescription: 'GST structuring, documentation readiness, and marketplace alignment so every sale is traceable and clean.',
    intro: 'We build a compliant operating base first — so growth never gets blocked by paperwork.',
    features: ['GST structuring & registration guidance', 'Invoice & documentation readiness', 'Marketplace-aligned SOPs', 'Traceable, clean sales records'],
    benefits: ['Fewer operational delays', 'Marketplace credibility', 'Audit-ready documentation'],
    suitableFor: ['D2C brands', 'Marketplace sellers', 'Export-ready MSMEs'],
    order: 1,
  },
  {
    name: 'Cross-Border Seller Setup',
    shortDescription: 'Export documentation and global marketplace preparation for sellers going international.',
    intro: 'From export documentation to marketplace-ready operations, we prepare you to sell across borders.',
    features: ['Export documentation readiness', 'Global marketplace preparation', 'International trade workflows', 'Operational alignment'],
    benefits: ['Faster international launch', 'Reduced compliance risk', 'Structured cross-border processes'],
    suitableFor: ['Manufacturers', 'Export-ready MSMEs', 'D2C brands scaling globally'],
    order: 2,
  },
  {
    name: 'Marketplace Onboarding Support',
    shortDescription: 'Catalog readiness and seller activation guidance for Amazon, Flipkart, Noon and Alibaba.',
    intro: 'We guide you through onboarding checklists, catalog hygiene and seller activation across marketplaces.',
    features: ['Amazon (FBA readiness)', 'Flipkart (FBF & marketplace logistics)', 'Noon (GCC expansion)', 'Alibaba (B2B export)', 'Catalog hygiene guidance'],
    benefits: ['Smooth seller activation', 'Clean, compliant catalogs', 'Multi-marketplace reach'],
    suitableFor: ['New marketplace sellers', 'Brands expanding to new platforms'],
    order: 3,
  },
  {
    name: 'Warehousing & Fulfilment Support',
    shortDescription: 'Inventory preparation, dispatch workflows and warehouse readiness for marketplace fulfilment.',
    intro: 'We help you prepare inventory for marketplace fulfilment with the right warehouse readiness and dispatch discipline.',
    features: ['Warehouse readiness guidance', 'Dispatch workflow setup', 'Packaging standards', 'Inventory preparation'],
    benefits: ['Fulfilment-ready inventory', 'Fewer dispatch errors', 'Operational discipline'],
    suitableFor: ['FBA / FBF sellers', 'High-volume marketplace sellers'],
    order: 4,
  },
  {
    name: 'Multi-State APOB Services',
    shortDescription: 'Additional Place of Business (GST) registration across states so you can stock in marketplace warehouses nationwide.',
    intro: 'Selling through Amazon/Flipkart fulfilment centres in multiple states requires an Additional Place of Business (APOB) on your GST. We handle multi-state APOB so your inventory can go where your customers are.',
    features: ['Multi-state APOB registration guidance', 'Warehouse address addition on GST', 'Documentation support', 'Marketplace warehouse alignment'],
    benefits: ['Stock closer to buyers', 'Faster deliveries', 'Compliant multi-state operations'],
    suitableFor: ['FBA / FBF sellers', 'Sellers scaling to multiple states'],
    order: 5,
  },
  {
    name: 'Seller Growth Guidance',
    shortDescription: 'Operational scaling and international expansion support for growing sellers.',
    intro: 'Once the base is compliant and operational, we help you scale — operationally and across geographies.',
    features: ['Operational scaling support', 'International expansion guidance', 'Process optimisation', 'Reconciliation discipline'],
    benefits: ['Structured growth', 'Sustainable scaling', 'Long-term marketplace credibility'],
    suitableFor: ['Growing D2C brands', 'Export-ready MSMEs'],
    order: 6,
  },
];

const FAQS = [
  { question: 'What is FlyDesk Marketplace Fulfilment Integration?', answer: 'FlyDesk provides infrastructure and operational support that helps Indian sellers connect with marketplaces such as Amazon, Flipkart, Alibaba, and Noon.', showOnHome: true, order: 1 },
  { question: 'How does FlyDesk help sellers expand internationally?', answer: 'FlyDesk prepares sellers for cross-border marketplaces by ensuring documentation readiness, export compliance, warehouse preparation, and marketplace-aligned operational processes.', showOnHome: true, order: 2 },
  { question: 'Which marketplaces does FlyDesk support?', answer: 'FlyDesk supports Amazon (FBA readiness), Flipkart (FBF and marketplace logistics), Noon (GCC / partner fulfilment), and Alibaba (B2B export).', showOnHome: true, order: 3 },
  { question: 'What role does FlyDesk play in the fulfilment ecosystem?', answer: 'FlyDesk acts as a seller infrastructure partner, preparing documentation, warehouse readiness, inventory handling, and operational discipline.', showOnHome: true, order: 4 },
  { question: 'Does FlyDesk handle warehousing?', answer: 'FlyDesk helps sellers prepare inventory for marketplace fulfilment by guiding warehouse readiness, dispatch workflows, and packaging standards.', order: 5 },
  { question: 'How does FlyDesk support Flipkart & Amazon sellers?', answer: 'Assistance covers seller onboarding, warehouse readiness, inventory preparation, and operational processes for FBF and FBA logistics requirements.', order: 6 },
  { question: 'How does FlyDesk support Noon marketplace sellers?', answer: 'FlyDesk prepares Indian sellers for GCC expansion by ensuring export documentation readiness, warehouse processes, and operational alignment.', order: 7 },
  { question: 'How does FlyDesk support Alibaba sellers?', answer: 'Support includes export documentation readiness, operational workflows, and international trade preparation for B2B selling.', order: 8 },
];

// Placeholders — REPLACE with verified figures in the CMS. Not fabricated claims.
const ACHIEVEMENTS = [
  { number: '—', label: 'Sellers supported', description: 'Placeholder — update in CMS with a verified figure.', order: 1 },
  { number: '4', label: 'Marketplaces', description: 'Amazon, Flipkart, Noon, Alibaba.', order: 2 },
  { number: '—', label: 'States (APOB)', description: 'Placeholder — update in CMS.', order: 3 },
  { number: '—', label: 'Shipments enabled', description: 'Placeholder — update in CMS.', order: 4 },
];

const PLACEHOLDER_LEGAL = (title) =>
  `<p><em>This ${title} is a placeholder. Replace it with FlyDesk's reviewed legal text before going live.</em></p>` +
  `<h2>Overview</h2><p>FlyDesk eCom Ifra Solutions provides compliance and fulfilment support services for sellers.</p>` +
  `<h2>Contact</h2><p>For questions about this policy, email hello@flydeskprojects.com.</p>`;

async function run() {
  await mongoose.connect(env.mongoUri);
  logger.info('Connected — seeding…');

  // Settings (real contact + social from the live site).
  const settings = await Setting.getGlobal();
  settings.siteName = 'FlyDesk';
  settings.tagline = 'Go Global, Stay Compliant.';
  settings.subTagline = 'Powering cross-border selling.';
  settings.description = "India's Compliance & Fulfilment Infrastructure for SMEs. FlyDesk prepares Indian sellers for domestic and cross-border marketplaces through compliance, documentation and operational readiness.";
  settings.contact = {
    phone: '7012306640',
    email: 'hello@flydeskprojects.com',
    whatsapp: '918893955755',
    address: '', // not published on the live site — add in CMS
    mapEmbedUrl: '',
    businessHours: 'Mon–Sat, 09:00 am – 05:00 pm',
  };
  settings.social = {
    instagram: 'https://instagram.com/seller_gst',
    linkedin: 'https://www.linkedin.com/company/flydesk-projects-private-limited',
    youtube: 'https://www.youtube.com/@SellerGST',
    facebook: '',
    twitter: '',
  };
  settings.whatsappPrefill = 'Hi FlyDesk, I would like to know more about cross-border seller setup.';
  settings.defaultSeo = {
    metaTitle: 'FlyDesk — Go Global, Stay Compliant | Cross-border seller setup',
    metaDescription: "India's compliance & fulfilment infrastructure for SMEs. GST, export documentation, Amazon/Flipkart/Noon/Alibaba onboarding, multi-state APOB and warehousing readiness.",
    ogImage: '',
  };
  await settings.save();
  logger.info('✓ settings');

  // Services (upsert by slug so re-seeding is safe).
  for (const s of SERVICES) {
    const slug = make(s.name);
    await Service.findOneAndUpdate(
      { slug },
      {
        $set: {
          ...s,
          slug,
          published: true,
          seo: {
            metaTitle: `${s.name} | FlyDesk`,
            metaDescription: s.shortDescription,
            robots: 'index,follow',
          },
        },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
  logger.info(`✓ ${SERVICES.length} services`);

  // FAQs.
  await Faq.deleteMany({});
  await Faq.insertMany(FAQS.map((f) => ({ ...f, category: 'General', published: true })));
  logger.info(`✓ ${FAQS.length} FAQs`);

  // Achievements (placeholders).
  await Achievement.deleteMany({});
  await Achievement.insertMany(ACHIEVEMENTS.map((a) => ({ ...a, published: true })));
  logger.info(`✓ ${ACHIEVEMENTS.length} achievements (placeholders)`);

  // System pages: privacy + terms.
  for (const [slug, title] of [['privacy-policy', 'Privacy Policy'], ['terms-and-conditions', 'Terms & Conditions']]) {
    await Page.findOneAndUpdate(
      { slug },
      { $set: { title, slug, content: PLACEHOLDER_LEGAL(title), system: true, showInFooter: true, published: true } },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
  logger.info('✓ system pages (privacy, terms — placeholder legal text)');

  // SEO for fixed routes.
  const routes = [
    { routeKey: 'home', label: 'Home', path: '/' },
    { routeKey: 'about', label: 'About Us', path: '/about' },
    { routeKey: 'why-choose-us', label: 'Why Choose Us', path: '/why-choose-us' },
    { routeKey: 'services', label: 'Services', path: '/services' },
    { routeKey: 'contact', label: 'Contact', path: '/contact' },
    { routeKey: 'articles', label: 'Articles', path: '/articles' },
  ];
  for (const r of routes) {
    await Seo.findOneAndUpdate(
      { routeKey: r.routeKey },
      { $set: { label: r.label, path: r.path, seo: { metaTitle: `${r.label} | FlyDesk`, robots: 'index,follow' } } },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
  logger.info(`✓ ${routes.length} SEO route records`);

  const admins = await User.countDocuments({ role: 'admin' });
  if (!admins) logger.warn('No admin user yet — run `npm run create-admin`.');

  logger.info('Seed complete.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (e) => {
  logger.error('Seed failed', { error: e.message });
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
