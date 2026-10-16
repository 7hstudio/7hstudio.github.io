require('dotenv').config({ path: 'C:/Users/Administrator/.gemini/antigravity-ide/scratch/discord-bot/.env' });
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const token = process.env.DISCORD_TOKEN;
const rest = new REST({ version: '10' }).setToken(token);

const targetDir = 'C:/Users/Administrator/.gemini/antigravity-ide/scratch/7h-studios-web';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function exportCatalog() {
  const channelIds = [
    { cat: 'Scripts', id: '1549470040913477644' },
    { cat: 'Maps', id: '1549470060790157452' },
    { cat: 'Guns', id: '1549470043845165189' },
    { cat: 'Free', id: '1549470058164654192' }
  ];

  const rawProducts = [];

  for (const c of channelIds) {
    try {
      const msgs = await rest.get(Routes.channelMessages(c.id) + '?limit=30');
      msgs.forEach(m => {
        const text = m.content.trim();
        if (!text && (!m.attachments || !m.attachments.length)) return;

        const attachments = (m.attachments || []).map(a => a.url);
        rawProducts.push({
          category: c.cat,
          id: m.id,
          content: text,
          attachments,
          timestamp: m.timestamp
        });
      });
    } catch (e) {
      console.error(`Error reading ${c.cat}:`, e.message);
    }
  }

  fs.writeFileSync(path.join(targetDir, 'raw_products.json'), JSON.stringify(rawProducts, null, 2));
  console.log(`Saved ${rawProducts.length} raw products to raw_products.json`);
}

exportCatalog();
