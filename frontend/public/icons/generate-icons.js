#!/usr/bin/env node

/**
 * PWA Icon Generator
 *
 * Generates all required PWA icon sizes from icon.svg
 *
 * Usage:
 *   npm install sharp (if not already installed)
 *   node generate-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = path.join(__dirname, 'icon.svg');

async function generateIcons() {
  try {
    // Try to import sharp
    const sharp = (await import('sharp')).default;

    console.log('🎨 Generating PWA icons from icon.svg...\n');

    for (const size of sizes) {
      const outputPath = path.join(__dirname, `icon-${size}x${size}.png`);

      await sharp(inputSvg)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated: icon-${size}x${size}.png`);
    }

    console.log('\n✨ All icons generated successfully!');
    console.log('🚀 Your PWA is ready to be installed!\n');

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('❌ Error: sharp package not found');
      console.error('\nPlease install sharp first:');
      console.error('  npm install sharp\n');
      console.error('Or use one of the alternative methods in GENERATE_ICONS.md\n');
    } else {
      console.error('❌ Error generating icons:', error.message);
    }
    process.exit(1);
  }
}

// Check if icon.svg exists
if (!fs.existsSync(inputSvg)) {
  console.error('❌ Error: icon.svg not found in', __dirname);
  process.exit(1);
}

generateIcons();
