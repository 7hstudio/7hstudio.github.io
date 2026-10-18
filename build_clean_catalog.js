const fs = require('fs');

const rawItems = JSON.parse(fs.readFileSync('C:/Users/Administrator/.gemini/antigravity-ide/scratch/7h-studios-web/discord_store_items.json', 'utf8'));

const categoryImages = {
  'Scripts': 'assets/images/scripts.jpg',
  'Maps': 'assets/images/maps.jpg',
  'Lobbies': 'assets/images/lobbies.jpg',
  'Guns': 'assets/images/weapons.jpg',
  'Free': 'assets/images/lobbies.jpg'
};

const cleaned = [];

rawItems.forEach((item, index) => {
  let content = item.content || '';
  // Clean discord emojis & mentions
  content = content.replace(/<a?:[\w_]+:\d+>/g, '');
  content = content.replace(/<@&?\d+>/g, '');
  content = content.replace(/@everyone|@here/g, '');
  content = content.replace(/[\u2800]/g, ' '); // braille spaces
  content = content.trim();

  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  let rawTitle = lines[0] || `${item.category} Item #${index + 1}`;
  rawTitle = rawTitle.replace(/^[丨\s\-]+/, '').replace(/^丨/, '').replace(/^[*\s]+/, '').replace(/[*]+$/, '').trim();

  // Price extraction
  let price = "Contact Support";
  let isFree = item.category === 'Free' || rawTitle.toLowerCase().includes('free');

  const priceMatch = content.match(/(?:ᴘʀɪX丨|ᴘʀɪx丨|prix\s*:?|price\s*:?)\s*([0-9.,]+)\s*[\$€]/i) ||
                     content.match(/([0-9.,]+)\s*[\$€]/) ||
                     content.match(/€\s*([0-9.,]+)/);

  if (priceMatch) {
    const symbol = content.includes('€') ? '€' : '$';
    price = `${symbol}${priceMatch[1]}`;
  } else if (isFree) {
    price = "FREE";
  }

  // Refined title formatting
  let cleanName = rawTitle;
  if (cleanName.includes('Sign Creator')) cleanName = 'Sign Creator 3D Text';
  else if (cleanName.includes('RENT CAR')) cleanName = 'Rent Car System V1';
  else if (cleanName.includes('Loading Screen')) cleanName = 'Cyberpunk Loading Screen V1';
  else if (cleanName.includes('Teleport Menu')) cleanName = 'Teleport Menu Pro V1';
  else if (cleanName.includes('ANTI DUMP')) cleanName = '7H Anti-Dump Protection V1';
  else if (cleanName.includes('7H RENTAL')) cleanName = '7H Vehicle Rental Script';
  else if (cleanName.includes('RECOIL CONTROL')) cleanName = '7H Recoil Control Script V1';
  else if (cleanName.includes('ANTI AIMBOT')) cleanName = '7H Anti-Aimbot & Magic Bullet V1';
  else if (cleanName.includes('100 Weapons Pack')) cleanName = '100 Weapons Pack Guns V1';
  else if (cleanName.includes('ARENA AND ROOF  V6')) cleanName = 'Pack Maps Arena & Roof V6 (9 Arenas)';
  else if (cleanName.includes('ARENA AND ROOF  V5')) cleanName = 'Pack 25 Maps Arena & Roof V5';
  else if (cleanName.includes('ARENA  V1')) cleanName = 'Pack Maps Arena V1';
  else if (cleanName.includes('PACK  MAPS  ARENA')) cleanName = 'Pack Maps PvP Arena MLO';
  else if (cleanName.includes('ROOF  ARENA')) cleanName = 'Roof Arena V1';
  else if (cleanName.includes('ARENA SPECIAL')) cleanName = 'Maps Arena Special V1';
  else if (cleanName.includes('MAPS  ARENA V1')) cleanName = 'Maps Arena Classic V1';
  else if (cleanName.includes('Spawn Lobby   V10')) cleanName = 'New Spawn Lobby V10 (Ghost Theme)';
  else if (cleanName.includes('Spawn Lobby Hallowin  V9')) cleanName = 'Spawn Lobby Halloween V9';
  else if (cleanName.includes('Spawn Lobby  V8')) cleanName = 'New Spawn Lobby V8';
  else if (cleanName.includes('Spawn Lobby  V6')) cleanName = 'Spawn Lobby V6';
  else if (cleanName.includes('Spawn Lobby  V5')) cleanName = 'Spawn Lobby V5';
  else if (cleanName.includes('Spawn Lobby  V4')) cleanName = 'Spawn Lobby V4';
  else if (cleanName.includes('Spawn Lobby  V3')) cleanName = 'Spawn Lobby V3 (Cyber Edition)';
  else if (cleanName.includes('Spawn Lobby  V2')) cleanName = 'Spawn Lobby V2';
  else if (cleanName.includes('Spawn Lobby')) cleanName = 'Spawn Lobby V1';
  else if (cleanName.includes('Leaderborad')) cleanName = 'Leaderboard Standalone Map MLO';
  else if (cleanName.includes('free Lobby  and pack map')) cleanName = 'Free Lobby & Pack Map Bundle';
  else if (cleanName.toLowerCase().includes('free lobby') || cleanName.toLowerCase().includes('free')) {
    cleanName = `Free Community Lobby #${index + 1}`;
  }

  // Description cleanup
  let desc = lines.slice(1).join(' ').replace(/ᴘʀɪX丨.*$/i, '').trim();
  if (desc.length < 20) {
    if (item.category === 'Scripts') {
      desc = "High-performance FiveM resource engineered for seamless gameplay. Ultra-optimized 0.00ms resmon, full framework support (ESX / QBCore / Qbox / Standalone), with clean configuration.";
    } else if (item.category === 'Maps') {
      desc = "Custom FiveM MLO Arena & Roof map designed for intense PvP and competitive roleplay. Features high FPS optimization, custom textures, occlusions, and dynamic lighting.";
    } else if (item.category === 'Lobbies') {
      desc = "Exclusive FiveM spawn lobby with luxury architectural design, custom animations, teleport markers, and seamless streaming optimization.";
    } else if (item.category === 'Guns') {
      desc = "Custom HD weapon pack for FiveM servers with optimized textures, custom fire sounds, balanced recoil animations, and animated skin options.";
    } else {
      desc = "Official free community resource from 7H STUDIOS. High performance, plug-and-play installation for any FiveM server.";
    }
  }

  // Tags
  let tags = [];
  if (item.category === 'Scripts') tags = ['0.00ms Resmon', 'ESX / QBCore', 'Open Config'];
  else if (item.category === 'Maps') tags = ['Custom MLO', 'High FPS', 'PvP Arena'];
  else if (item.category === 'Lobbies') tags = ['VIP Spawn', 'Ultra MLO', 'Custom Lighting'];
  else if (item.category === 'Guns') tags = ['100+ Models', 'Custom Audio', 'HD Textures'];
  else tags = ['Free Download', 'Plug & Play', 'Community'];

  let catKey = item.category === 'Lobby' ? 'Lobbies' : item.category;
  let fallback = categoryImages[catKey] || 'assets/images/scripts.jpg';

  let attachments = item.attachments || [];
  let mainThumb = attachments.length > 0 ? attachments[0] : fallback;

  // Skip placeholder text messages like "soooooon" or empty
  if (cleanName.toLowerCase() === 'soooooon' || cleanName.length < 3) return;

  cleaned.push({
    id: `prod_${cleaned.length + 1}`,
    name: cleanName,
    category: catKey,
    price: price,
    isFree: isFree,
    description: desc,
    tags: tags,
    thumbnail: mainThumb,
    fallbackImage: fallback,
    gallery: attachments,
    featured: cleaned.length < 10
  });
});

fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity-ide/scratch/7h-studios-web/products.js', 'const PRODUCTS = ' + JSON.stringify(cleaned, null, 2) + ';\nif (typeof module !== "undefined") module.exports = PRODUCTS;\n');
console.log(`✅ Cleaned and generated ${cleaned.length} products in products.js!`);
