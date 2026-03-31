const sharp = require('sharp');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

async function createFavicon() {
  const svgIcon = `
    <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6"/>
          <stop offset="100%" style="stop-color:#8b5cf6"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="6" fill="url(#bg)"/>
      <text x="16" y="24" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">M</text>
    </svg>
  `;

  // Create favicon.ico (32x32)
  await sharp(Buffer.from(svgIcon))
    .resize(32, 32)
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Created favicon.ico');

  // Also create favicon-16x16.png and favicon-32x32.png for better compatibility
  await sharp(Buffer.from(svgIcon))
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('Created favicon-16x16.png');

  await sharp(Buffer.from(svgIcon))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('Created favicon-32x32.png');
}

createFavicon().catch(console.error);
