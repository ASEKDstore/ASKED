// Script to convert SVG to PNG using sharp
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the project root (apps/web)
const projectRoot = path.resolve(__dirname, '..');
const placementsDir = path.join(projectRoot, 'public/assets/placements');
const files = ['front', 'back', 'sleeve', 'individual'];

async function convertSvgToPng() {
  console.log('Converting SVG to PNG...\n');
  
  for (const file of files) {
    const svgPath = path.join(placementsDir, `${file}.svg`);
    const pngPath = path.join(placementsDir, `${file}.png`);
    
    if (!fs.existsSync(svgPath)) {
      console.log(`⚠️  ${file}.svg not found, skipping...`);
      continue;
    }
    
    try {
      await sharp(svgPath)
        .resize(120, 120)
        .png()
        .toFile(pngPath);
      console.log(`✅ Converted ${file}.svg → ${file}.png`);
    } catch (error) {
      console.error(`❌ Error converting ${file}.svg:`, error.message);
    }
  }
  
  console.log('\n✨ Conversion complete!');
}

convertSvgToPng();

