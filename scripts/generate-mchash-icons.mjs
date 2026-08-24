// Generates MC HASH favicon & app icon PNGs from the existing brand logo
import sharp from '../frontend/node_modules/sharp/dist/index.mjs';

const SIZES = {
  'favicon-16x16.png': 16,
  'favicon-32x32.png': 32,
  'apple-touch-icon.png': 180,
  'android-chrome-192x192.png': 192,
  'android-chrome-512x512.png': 512,
  'mchash-og.png': 1200,
};

// Brand SVG — same mark as components/Logo.tsx, drawn on the brand's dark-blue
// surface with a centered logo so it reads well on tabs, bookmarks, homescreens
// and iOS/Safari (apple-touch-icon).
const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="75%">
      <stop offset="0%" stop-color="#103a63"/>
      <stop offset="100%" stop-color="#07101e"/>
    </radialGradient>
    <linearGradient id="cmhash-gradient" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#36d9ff"/>
      <stop offset="0.52" stop-color="#008cff"/>
      <stop offset="1" stop-color="#005ed2"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="512" height="512" rx="96" fill="url(#bg)"/>
  <g transform="translate(96 86) scale(6.667)">
    <path d="M4 10 L14 5 L24 20 L34 5 L44 10 L34 41 L24 27 L14 41 Z" fill="url(#cmhash-gradient)"/>
    <path d="M14 5 L24 20 L24 27 L14 41 Z" fill="#0b77e8" opacity="0.88"/>
    <path d="M34 5 L24 20 L24 27 L34 41 Z" fill="#1fc7ff" opacity="0.92"/>
    <path d="M7 12 L14 8 L14 34 L7 27 Z" fill="#0582ff"/>
    <path d="M41 12 L34 8 L34 34 L41 27 Z" fill="#0098ff"/>
    <path d="M14 5 L24 20 L34 5 L24 12 Z" fill="#8ee7ff" opacity="0.85"/>
  </g>
</svg>`;

const outDir = 'frontend/public';

for (const [file, size] of Object.entries(SIZES)) {
  await sharp(Buffer.from(svg(size)))
    .png()
    .toFile(`${outDir}/${file}`);
  console.log(`Generated ${file} (${size}x${size})`);
}
console.log('Done.');