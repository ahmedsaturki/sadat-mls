import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  const iconsDir = path.join(__dirname, "..", "public", "icons");
  fs.mkdirSync(iconsDir, { recursive: true });

  // Create SVG icon
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="64" fill="#2563eb"/>
    <circle cx="256" cy="256" r="160" fill="white"/>
    <text x="256" y="280" font-family="Arial, sans-serif" font-size="180" font-weight="bold" fill="#2563eb" text-anchor="middle">S</text>
  </svg>`;

  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}.png`);
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Created: icon-${size}.png`);
  }

  // Also create favicon
  const faviconPath = path.join(__dirname, "..", "public", "favicon.ico");
  await sharp(Buffer.from(svgIcon))
    .resize(32, 32)
    .png()
    .toFile(faviconPath.replace(".ico", ".png"));
  console.log("Created: favicon.png");
}

generateIcons().catch(console.error);
