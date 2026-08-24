// Verifies the production OG/Twitter/favicon meta tags in the static export.
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'frontend', 'out');
const tags = [
  'og:image',
  'og:title',
  'og:description',
  'og:site_name',
  'og:url',
  'og:type',
  'twitter:card',
  'twitter:title',
  'twitter:description',
  'twitter:image',
  'apple-touch-icon',
  'favicon.ico',
  'mask-icon',
  'robots',
];

function checkFile(file) {
  const full = path.join(outDir, file);
  if (!fs.existsSync(full)) {
    console.log(`[${file}] (missing file)`);
    return;
  }
  const html = fs.readFileSync(full, 'utf8');
  console.log(`\n=== ${file} ===`);
  for (const t of tags) {
    const found = html.includes(t);
    let detail = '';
    if (found) {
      const idx = html.indexOf(t);
      // show a window around the match for context
      const start = Math.max(0, idx - 8);
      const end = Math.min(html.length, idx + 120);
      detail = '  -> ' + html.slice(start, end).replace(/\s+/g, ' ').trim();
    }
    console.log((found ? 'FOUND  ' : 'MISSING') + ' : ' + t + detail);
  }
}

const candidates = ['index.html', '404.html'];
for (const c of candidates) checkFile(c);

// Also confirm the OG image asset exists and its dimensions
const imgPath = path.join(__dirname, '..', 'frontend', 'public', 'mchash-og.png');
if (fs.existsSync(imgPath)) {
  const sharp = require('../frontend/node_modules/sharp/dist/index.cjs');
  sharp(imgPath)
    .metadata()
    .then((m) => console.log(`\nOG image ${imgPath}: ${m.width}x${m.height} (${m.channels}ch)`))
    .catch((e) => console.log('OG image metadata error:', e.message));
} else {
  console.log('\nOG image MISSING at', imgPath);
}
