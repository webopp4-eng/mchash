// Generates a professional landscape Open Graph preview banner (1200x630) for MC HASH.
// Uses the platform's existing brand logo mark, accent colors and fonts — NOT a screenshot.
import sharp from '../frontend/node_modules/sharp/dist/index.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const WIDTH = 1200;
const HEIGHT = 630;
const FONT_REG = 'C:/Windows/Fonts/segoeui.ttf';
const FONT_BOLD = 'C:/Windows/Fonts/segoeuib.ttf';

const regB64 = readFileSync(FONT_REG).toString('base64');
const boldB64 = readFileSync(FONT_BOLD).toString('base64');

// Inline brand logo mark — identical paths/gradient to components/Logo.tsx (48x48 icon viewbox).
const logoMark = `
  <g transform="translate(80 84) scale(4.5)">
    <path d="M4 10 L14 5 L24 20 L34 5 L44 10 L34 41 L24 27 L14 41 Z" fill="url(#logoGrad)"/>
    <path d="M14 5 L24 20 L24 27 L14 41 Z" fill="#0b77e8" opacity="0.88"/>
    <path d="M34 5 L24 20 L24 27 L34 41 Z" fill="#1fc7ff" opacity="0.92"/>
    <path d="M7 12 L14 8 L14 34 L7 27 Z" fill="#0582ff"/>
    <path d="M41 12 L34 8 L34 34 L41 27 Z" fill="#0098ff"/>
    <path d="M14 5 L24 20 L34 5 L24 12 Z" fill="#8ee7ff" opacity="0.85"/>
  </g>`;

// NOTE: avoid raw ampersands in SVG text (XML parse error). Use words instead.
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <style>
      @font-face { font-family: 'BrandBold'; src: url(data:font/ttf;base64,${boldB64}); font-weight: 700; }
      @font-face { font-family: 'BrandReg'; src: url(data:font/ttf;base64,${regB64}); font-weight: 400; }
    </style>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1" gradientUnits="userSpaceOnUse">
      <stop stop-color="#071430"/>
      <stop offset="0.45" stop-color="#0a2a64"/>
      <stop offset="1" stop-color="#030712"/>
    </linearGradient>
    <linearGradient id="logoGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
      <stop stop-color="#36d9ff"/>
      <stop offset="0.52" stop-color="#008cff"/>
      <stop offset="1" stop-color="#005ed2"/>
    </linearGradient>
    <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
      <stop stop-color="#36d9ff"/>
      <stop offset="0.55" stop-color="#1fc7ff"/>
      <stop offset="1" stop-color="#008cff"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%" filterUnits="objectBoundingBox">
      <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#1fc7ff" flood-opacity="0.55"/>
    </filter>
    <filter id="blueGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="12"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.12 0 0 0 0 0.8 0 0 0 0 1 0 0 0 0.5 0"/>
      <feBlend in="SourceGraphic"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad)"/>

  <!-- Subtle abstract hashrate-inspired shapes -->
  <circle cx="960" cy="170" r="150" fill="#4a9dff" opacity="0.06"/>
  <circle cx="1020" cy="470" r="120" fill="#36d9ff" opacity="0.05"/>
  <circle cx="300" cy="560" r="110" fill="#008cff" opacity="0.07"/>
  <polygon points="1040,560 1100,540 1100,500 1040,520" fill="#1fc7ff" opacity="0.06"/>
  <polygon points="920,170 970,160 970,130 920,140" fill="#36d9ff" opacity="0.06"/>
  <path d="M780 120 L860 100 L920 150 L840 170 Z" fill="#0098ff" opacity="0.07"/>
  <path d="M720 500 L790 480 L850 540 L780 560 Z" fill="#1fc7ff" opacity="0.05"/>

  <!-- Hexaon grid motif -->
  <g stroke="#36d9ff" stroke-width="1.2" fill="none" opacity="0.11">
    <polygon points="720,130 760,110 800,130 800,170 760,190 720,170"/>
    <polygon points="820,160 860,140 900,160 900,200 860,220 820,200"/>
    <polygon points="680,340 720,320 760,340 760,380 720,400 680,380"/>
  </g>

  <!-- Faint dashboard card silhouette (reinforces platform feel) -->
  <rect x="700" y="320" width="430" height="260" rx="20" fill="#0b1228" stroke="#1fc7ff" stroke-width="1" opacity="0.35"/>
  <rect x="720" y="340" width="120" height="24" rx="6" fill="#4a9dff" opacity="0.18"/>
  <rect x="860" y="340" width="120" height="24" rx="6" fill="#36d9ff" opacity="0.15"/>
  <rect x="720" y="380" width="150" height="8" rx="4" fill="#b3d9ff" opacity="0.12"/>
  <rect x="720" y="400" width="190" height="8" rx="4" fill="#7dbdff" opacity="0.1"/>
  <circle cx="730" cy="460" r="6" fill="#36d9ff" opacity="0.35"/>
  <rect x="746" y="454" width="100" height="6" rx="3" fill="#b3d9ff" opacity="0.12"/>

  <!-- Brand logo mark -->
  ${logoMark}

  <!-- Accent bar -->
  <rect x="80" y="440" width="330" height="6" rx="3" fill="url(#barGrad)"/>

  <!-- Headline -->
  <text x="80" y="328" font-family="BrandBold" font-size="92" fill="#ffffff" filter="url(#glow)">MC HASH</text>

  <!-- Tagline -->
  <text x="80" y="408" font-family="BrandReg" font-size="34" fill="#7dbdff">Cloud Mining on Solana, Ethereum and BNB</text>

  <!-- Sub -->
  <text x="80" y="464" font-family="BrandReg" font-size="24" fill="#b3d9ff" opacity="0.85">Connect your wallet to start earning from day one.</text>

  <!-- Domain / URL -->
  <text x="80" y="596" font-family="BrandReg" font-size="24" fill="#4a9dff" opacity="0.9">mchash.site</text>
</svg>`;

const out = 'frontend/public/mchash-og.png';
const png = await sharp(Buffer.from(svg), { density: 2 })
  .resize(WIDTH, HEIGHT)
  .png({ quality: 90 })
  .toBuffer();
writeFileSync(out, png);
console.log(`Generated ${out} (${WIDTH}x${HEIGHT})`);

// Verify
const meta = await sharp(png).metadata();
console.log('Dimensions:', meta.width + 'x' + meta.height);
