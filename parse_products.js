const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('C:/Users/Administrator/.gemini/antigravity-ide/scratch/7h-studios-web/raw_products.json', 'utf8'));

const cleanCatalog = [];

const categoryImages = {
  'Scripts': 'assets/images/scripts.jpg',
  'Maps': 'assets/images/maps.jpg',
  'Guns': 'assets/images/weapons.jpg',
  'Free': 'assets/images/maps.jpg'
};

raw.forEach((item, index) => {
  let content = item.content;
  content = content.replace(/<a?:[\w_]+:\d+>/g, '').trim();
  content = content.replace(/<@&?\d+>/g, '').trim();
  content = content.replace(/@everyone|@here/g, '').trim();

  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  let title = lines[0] || `${item.category} Item #${index + 1}`;
  title = title.replace(/^[丨\s\-]+/, '').replace(/^丨/, '').trim();

  let price = "Contact Support";
  let isFree = item.category === 'Free' || title.toLowerCase().includes('free');

  const priceMatch = content.match(/(?:ᴘʀɪX丨|ᴘʀɪx丨|prix\s*:?|price\s*:?)\s*([0-9.,]+)\s*\$/i) || 
                     content.match(/([0-9.,]+)\s*\$/);
  if (priceMatch) {
    price = `$${priceMatch[1]}`;
  } else if (isFree) {
    price = "FREE";
  }

  let desc = lines.slice(1).join(' ').trim();
  if (!desc || desc.length < 15) {
    if (item.category === 'Scripts') desc = "High-performance FiveM script, optimized 0.00ms resmon, full standalone & framework support.";
    else if (item.category === 'Maps') desc = "Custom FiveM MLO Arena & Roof map, high FPS optimization, custom textures and lighting.";
    else if (item.category === 'Guns') desc = "Exclusive HD weapons pack for FiveM PvP servers with custom sounds, recoil, and animated skins.";
    else desc = "Free community resource for FiveM developers and server owners.";
  }

  // Fallback / main image
  let mainImage = item.attachments && item.attachments.length > 0 ? item.attachments[0] : categoryImages[item.category];

  let tags = [];
  if (item.category === 'Scripts') tags = ['FiveM Script', '0.00ms Resmon', 'ESX / QBCore'];
  else if (item.category === 'Maps') tags = ['Custom MLO', 'PvP Arena', 'High FPS'];
  else if (item.category === 'Guns') tags = ['Weapons Pack', 'Custom Audio', 'HD Textures'];
  else tags = ['Free Download', 'Ready to Use', 'Community'];

  cleanCatalog.push({
    id: `prod_${index + 1}`,
    name: title,
    category: item.category,
    price: price,
    isFree: isFree,
    description: desc,
    tags: tags,
    thumbnail: mainImage,
    fallbackImage: categoryImages[item.category],
    gallery: item.attachments || [],
    featured: index < 8
  });
});

fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity-ide/scratch/7h-studios-web/products.js', 'const PRODUCTS = ' + JSON.stringify(cleanCatalog, null, 2) + ';\nif (typeof module !== "undefined") module.exports = PRODUCTS;');
console.log(`Updated products.js successfully with ${cleanCatalog.length} products.`);
