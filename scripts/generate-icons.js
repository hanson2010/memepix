const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');

async function createIcons() {
  // Create a simple gradient icon with "M" letter
  const svgIcon = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6"/>
          <stop offset="100%" style="stop-color:#8b5cf6"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="80" fill="url(#bg)"/>
      <text x="256" y="380" font-family="Arial, sans-serif" font-size="320" font-weight="bold" fill="white" text-anchor="middle">M</text>
    </svg>
  `;

  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  for (const { name, size } of sizes) {
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, name));
    console.log(`Created ${name}`);
  }
}

createIcons().catch(console.error);
