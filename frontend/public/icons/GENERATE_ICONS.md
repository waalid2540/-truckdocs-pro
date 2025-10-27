# PWA Icon Generation Guide

## Quick Method (Recommended)

Use an online PWA icon generator:

1. Visit: https://www.pwabuilder.com/imageGenerator
2. Upload the `icon.svg` file from this directory
3. Download all generated icon sizes
4. Replace the files in this directory

## Required Icon Sizes

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Alternative: Using ImageMagick

If you have ImageMagick installed:

```bash
# From the frontend/public/icons directory
magick icon.svg -resize 72x72 icon-72x72.png
magick icon.svg -resize 96x96 icon-96x96.png
magick icon.svg -resize 128x128 icon-128x128.png
magick icon.svg -resize 144x144 icon-144x144.png
magick icon.svg -resize 152x152 icon-152x152.png
magick icon.svg -resize 192x192 icon-192x192.png
magick icon.svg -resize 384x384 icon-384x384.png
magick icon.svg -resize 512x512 icon-512x512.png
```

## Alternative: Using Node.js Script

```bash
npm install sharp
node generate-icons.js
```
