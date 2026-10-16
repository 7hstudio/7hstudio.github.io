const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const webDir = 'C:/Users/Administrator/.gemini/antigravity-ide/scratch/7h-studios-web';
const imgDir = path.join(webDir, 'assets', 'images');

if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

// Copy generated images
const brainDir = 'C:/Users/Administrator/.gemini/antigravity-ide/brain/bb111dfc-5994-4fb6-875b-036572eea9e2';
const files = fs.readdirSync(brainDir);

const mappings = [
  { prefix: 'hero_banner', dest: 'hero_banner.jpg' },
  { prefix: 'category_scripts', dest: 'scripts.jpg' },
  { prefix: 'category_maps', dest: 'maps.jpg' },
  { prefix: 'category_weapons', dest: 'weapons.jpg' }
];

mappings.forEach(m => {
  const match = files.find(f => f.startsWith(m.prefix) && (f.endsWith('.jpg') || f.endsWith('.png')));
  if (match) {
    fs.copyFileSync(path.join(brainDir, match), path.join(imgDir, m.dest));
    console.log(`Copied ${match} to ${m.dest}`);
  }
});

// Download Discord logo
const logoUrl = 'https://cdn.discordapp.com/icons/1418023065560023052/25928d432364d26f5f68fdf8bd44cbaf.png';
const logoPath = path.join(imgDir, 'logo.png');

https.get(logoUrl, { rejectUnauthorized: false }, (res) => {
  const fileStream = fs.createWriteStream(logoPath);
  res.pipe(fileStream);
  fileStream.on('finish', () => {
    console.log('Saved logo.png successfully!');
  });
}).on('error', (err) => {
  console.error('Error fetching logo:', err.message);
});
