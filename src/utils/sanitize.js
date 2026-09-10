'use strict';
const xss = require('xss');

// Strict: strip ALL HTML (names, emails, single-line fields).
const clean = (v) =>
  typeof v === 'string' ? xss(v, { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script'] }).trim() : v;

// Rich: allow a safe subset for CMS body content (articles, page bodies).
const richWhiteList = {
  p: [], br: [], b: [], strong: [], i: [], em: [], u: [], s: [],
  h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
  ul: [], ol: [], li: [], blockquote: [], hr: [],
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  figure: [], figcaption: [], table: [], thead: [], tbody: [], tr: [], th: [], td: [],
  code: [], pre: [], span: [],
};
const cleanRich = (v) =>
  typeof v === 'string'
    ? xss(v, {
        whiteList: richWhiteList,
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script', 'style'],
        onTagAttr: (tag, name, value) => {
          if (name === 'href' || name === 'src') {
            if (/^\s*javascript:/i.test(value)) return `${name}=""`;
          }
          return undefined;
        },
      })
    : v;

module.exports = { clean, cleanRich };
