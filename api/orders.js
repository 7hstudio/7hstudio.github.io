const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (req.body && typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch(e) { return {}; }
  }
  return new Promise(resolve => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch(e) { resolve({}); }
    });
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  try {
    const payload = await parseBody(req);
    const { productId, productName, price, customer, paymentMethod, reference } = payload;
    const orderId = '7H-ORD-' + Math.floor(1000 + Math.random() * 9000);

    if (DISCORD_TOKEN) {
      try {
        const targetChannel = '1549470009439420447';
        const custTag = (customer && customer.id) 
          ? `<@${customer.id}> (${customer.username})` 
          : (customer && customer.username ? customer.username : 'Guest');

        const embed = {
          title: `🛒 NEW ORDER: #${orderId}`,
          description: `An order has been placed on the **7H STUDIO** official store!`,
          color: 0x10b981,
          fields: [
            { name: '📦 Asset Ordered', value: `${productName || 'FiveM Asset'}`, inline: true },
            { name: '💰 Price', value: `${price || 'N/A'}`, inline: true },
            { name: '💳 Payment Method', value: `${paymentMethod || 'Selected'}`, inline: true },
            { name: '👤 Customer', value: `${custTag}`, inline: true },
            { name: '📝 Ref / Note', value: `${reference || 'None'}`, inline: true },
            { name: '⚡ Status', value: '⏳ Awaiting Payment / Ticket Verification', inline: true }
          ],
          footer: { text: '7H STUDIO • Executive Order Dispatch' },
          timestamp: new Date().toISOString()
        };

        await fetch(`https://discord.com/api/v10/channels/${targetChannel}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bot ${DISCORD_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🚨 **NEW ORDER NOTIFICATION** — ${custTag} ordered **${productName}**!`,
            embeds: [embed]
          })
        });
      } catch(e) {
        console.warn('Discord order dispatch error:', e);
      }
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: true, orderId }));
  } catch(err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: false, message: err.message }));
  }
};
