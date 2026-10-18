const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Environment variables
const PORT = process.env.PORT || 3000;
const GUILD_ID = process.env.GUILD_ID || '1418023065560023052';
const CLIENT_ID = process.env.CLIENT_ID || '1560743842775568504';
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const ADMIN_IDS = ['1335753623367319635', '1197968394222325760'];

// Pre-load core frontend assets into memory (NFT static bundling for Vercel Serverless)
let INDEX_HTML = '';
let STYLE_CSS = '';
let APP_JS = '';
let PRODUCTS_JS = '';
let PARTNERS_JS = '';

try { INDEX_HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'); } catch (e) {}
try { STYLE_CSS = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8'); } catch (e) {}
try { APP_JS = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8'); } catch (e) {}
try { PRODUCTS_JS = fs.readFileSync(path.join(__dirname, 'products.js'), 'utf8'); } catch (e) {}
try { PARTNERS_JS = fs.readFileSync(path.join(__dirname, 'partners.js'), 'utf8'); } catch (e) {}

// Fallback search in public/ if root was empty
if (!INDEX_HTML) { try { INDEX_HTML = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8'); } catch (e) {} }
if (!STYLE_CSS) { try { STYLE_CSS = fs.readFileSync(path.join(__dirname, 'public', 'style.css'), 'utf8'); } catch (e) {} }
if (!APP_JS) { try { APP_JS = fs.readFileSync(path.join(__dirname, 'public', 'app.js'), 'utf8'); } catch (e) {} }
if (!PRODUCTS_JS) { try { PRODUCTS_JS = fs.readFileSync(path.join(__dirname, 'public', 'products.js'), 'utf8'); } catch (e) {} }
if (!PARTNERS_JS) { try { PARTNERS_JS = fs.readFileSync(path.join(__dirname, 'public', 'partners.js'), 'utf8'); } catch (e) {} }

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

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.zip': 'application/zip'
};

const requestHandler = async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname || '/';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  // --- STATIC FRONTEND ROUTES ---
  if (pathname === '/' || pathname === '/index.html' || pathname === '') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const p = path.join(__dirname, 'index.html');
    return res.end(fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : INDEX_HTML);
  }

  if (pathname === '/style.css') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
    const p = path.join(__dirname, 'style.css');
    return res.end(fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : STYLE_CSS);
  }

  if (pathname === '/app.js') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    const p = path.join(__dirname, 'app.js');
    return res.end(fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : APP_JS);
  }

  if (pathname === '/products.js') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    const p = path.join(__dirname, 'products.js');
    return res.end(fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : PRODUCTS_JS);
  }

  if (pathname === '/partners.js') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    const p = path.join(__dirname, 'partners.js');
    return res.end(fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : PARTNERS_JS);
  }

  // Live Products API
  if (pathname === '/api/products' && req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const p = path.join(__dirname, 'products.js');
    try {
      delete require.cache[require.resolve('./products.js')];
      const prods = require('./products.js');
      return res.end(JSON.stringify(prods));
    } catch (e) {
      return res.end(JSON.stringify([]));
    }
  }

  // --- API ROUTES ---

  // Health / Ping
  if (pathname === '/api/health' || pathname === '/ping' || pathname === '/api/hello') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ status: 'ok', platform: '7H STUDIO', timestamp: Date.now() }));
  }

  // Stats
  if (pathname === '/api/stats' && req.method === 'GET') {
    try {
      if (DISCORD_TOKEN) {
        const dRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}?with_counts=true`, {
          headers: { Authorization: `Bot ${DISCORD_TOKEN}` }
        });
        if (dRes.ok) {
          const guild = await dRes.json();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            success: true,
            guildId: GUILD_ID,
            name: guild.name || '7H STUDIO',
            totalMembers: guild.approximate_member_count || 708,
            onlineMembers: guild.approximate_presence_count || 77,
            iconUrl: guild.icon ? `https://cdn.discordapp.com/icons/${GUILD_ID}/${guild.icon}.png` : 'assets/images/logo.png'
          }));
        }
      }
    } catch (e) {}

    // Graceful fallback
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: true,
      guildId: GUILD_ID,
      name: '7H STUDIO',
      totalMembers: 708,
      onlineMembers: 77,
      iconUrl: 'assets/images/logo.png'
    }));
  }

  // Discord OAuth2 Redirect
  if (pathname === '/api/auth/discord') {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || '7h-studios-web.vercel.app';
    const base = `${proto}://${host}`;
    const redirectUri = encodeURIComponent(`${base}/api/auth/callback`);
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=identify%20guilds`;

    res.statusCode = 302;
    res.setHeader('Location', discordAuthUrl);
    return res.end();
  }

  // Discord OAuth2 Callback Page
  if (pathname === '/api/auth/callback') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Entering 7H STUDIO...</title>
  <style>
    body { background: #07090e; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }
    .box { background: #0e121b; border: 1px solid rgba(88, 101, 242, 0.4); box-shadow: 0 0 45px rgba(88, 101, 242, 0.3); border-radius: 20px; padding: 3rem 2.5rem; max-width: 440px; width: 90%; }
    .spinner { width: 52px; height: 52px; border: 4px solid rgba(88, 101, 242, 0.2); border-top-color: #5865F2; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { margin: 0 0 0.5rem; font-size: 1.4rem; font-weight: 700; color: #fff; }
    p { margin: 0; color: #94a3b8; font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="box">
    <div class="spinner"></div>
    <h2>Access Granted!</h2>
    <p id="msg">Entering 7H STUDIO Store...</p>
  </div>
  <script>
    async function init() {
      var hash = window.location.hash.substring(1);
      var hashParams = new URLSearchParams(hash);
      var searchParams = new URLSearchParams(window.location.search);
      var token = hashParams.get('access_token') || searchParams.get('access_token') || searchParams.get('token');

      var user = {
        username: 'Discord Member',
        displayName: 'Verified 7H Member',
        avatar: 'assets/images/logo.png',
        inServer: true,
        isAdmin: false
      };

      if (token) {
        try {
          var uRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: 'Bearer ' + token }
          });
          if (uRes.ok) {
            var u = await uRes.json();
            var avatarUrl = u.avatar 
              ? 'https://cdn.discordapp.com/avatars/' + u.id + '/' + u.avatar + '.png'
              : 'https://cdn.discordapp.com/embed/avatars/' + (parseInt(u.discriminator || '0') % 5) + '.png';
            user = {
              id: u.id,
              username: u.username,
              displayName: u.global_name || u.username,
              avatar: avatarUrl,
              inServer: true,
              isAdmin: ['1335753623367319635', '1197968394222325760'].includes(u.id)
            };
          }
        } catch(e) {}
      }

      try {
        localStorage.setItem('7h_verified_member', JSON.stringify(user));
        if (token) localStorage.setItem('7h_auth_token', token);
      } catch(e) {}

      // Instant redirect to site with auth=success and user payload
      window.location.replace('/?auth=success&user=' + encodeURIComponent(JSON.stringify(user)));
    }
    init();
  </script>
</body>
</html>`);
  }

  // Token Verification
  if (pathname === '/api/auth/verify-token' && req.method === 'POST') {
    try {
      const payload = await parseBody(req);
      const token = payload.token;
      if (!token) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: false, message: 'Token required' }));
      }

      const uRes = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!uRes.ok) throw new Error('Invalid token');
      const u = await uRes.json();

      let member = null;
      if (DISCORD_TOKEN) {
        try {
          const mRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${u.id}`, {
            headers: { Authorization: `Bot ${DISCORD_TOKEN}` }
          });
          if (mRes.ok) member = await mRes.json();
        } catch(e) {}
      }

      const avatarUrl = u.avatar 
        ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(u.discriminator || '0') % 5}.png`;

      const isMember = !!(member && (member.user || member.roles));

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        inServer: isMember,
        user: {
          id: u.id,
          username: u.username,
          discriminator: u.discriminator,
          displayName: (member && member.nick) || u.global_name || u.username,
          avatar: avatarUrl,
          inServer: isMember,
          isAdmin: ADMIN_IDS.includes(u.id),
          rolesCount: member ? (member.roles || []).length : 0,
          joinedAt: member ? member.joined_at : null
        }
      }));
    } catch(err) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        user: { username: 'Discord Member', displayName: 'Discord Member', avatar: 'assets/images/logo.png', inServer: true }
      }));
    }
  }

  // Username Search Verification
  if (pathname === '/api/verify' && req.method === 'POST') {
    try {
      const payload = await parseBody(req);
      const query = (payload.username || payload.query || '').trim();

      if (!query) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: false, message: 'Query required' }));
      }

      if (DISCORD_TOKEN) {
        let member = null;
        if (/^\d{17,20}$/.test(query)) {
          const idRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${query}`, {
            headers: { Authorization: `Bot ${DISCORD_TOKEN}` }
          });
          if (idRes.ok) member = await idRes.json();
        }
        if (!member) {
          const sRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/search?query=${encodeURIComponent(query)}&limit=5`, {
            headers: { Authorization: `Bot ${DISCORD_TOKEN}` }
          });
          if (sRes.ok) {
            const list = await sRes.json();
            if (list && list.length > 0) member = list[0];
          }
        }
        if (member && member.user) {
          const u = member.user;
          const avatarUrl = u.avatar 
            ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${parseInt(u.discriminator || '0') % 5}.png`;

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            success: true,
            inServer: true,
            user: {
              id: u.id,
              username: u.username,
              discriminator: u.discriminator,
              displayName: member.nick || u.global_name || u.username,
              avatar: avatarUrl,
              inServer: true,
              isAdmin: ADMIN_IDS.includes(u.id),
              rolesCount: (member.roles || []).length,
              joinedAt: member.joined_at
            },
            message: `Verified! Welcome ${u.username} to 7H STUDIO.`
          }));
        }
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        inServer: false,
        message: 'User was not found in 7H STUDIO server. Please join our Discord server first!'
      }));
    } catch(err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, message: err.message }));
    }
  }

  // Create / Record Order and Notify Staff on Discord
  if (pathname === '/api/orders/create' && req.method === 'POST') {
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
            description: `An order has been placed on the **7H STUDIO** web store!`,
            color: 0x10b981,
            fields: [
              { name: '📦 Asset Ordered', value: `${productName || 'FiveM Asset'}`, inline: true },
              { name: '💰 Price', value: `${price || 'N/A'}`, inline: true },
              { name: '💳 Payment Method', value: `${paymentMethod || 'Selected'}`, inline: true },
              { name: '👤 Customer', value: `${custTag}`, inline: true },
              { name: '📝 Ref / Note', value: `${reference || 'None'}`, inline: true },
              { name: '⚡ Status', value: '⏳ Awaiting Payment / Ticket Verification', inline: true }
            ],
            footer: { text: '7H STUDIO • Order Dispatch Engine' },
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
  }

  // Admin APIs
  if (pathname.startsWith('/api/admin/')) {
    const action = pathname.replace('/api/admin/', '');

    if (action === 'stats') {
      const adminId = parsedUrl.query && parsedUrl.query.adminId;
      if (!ADMIN_IDS.includes(adminId)) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        stats: {
          serverName: '7H STUDIO',
          memberCount: 708,
          presenceCount: 77,
          channelsCount: 24,
          rolesCount: 38,
          productsCount: 16,
          partnersCount: 4,
          channelsList: []
        }
      }));
    }

    if (action === 'announce') {
      const payload = await parseBody(req);
      const { adminId, channelId, title, message: annMsg, color } = payload;
      if (!ADMIN_IDS.includes(adminId)) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
      }
      if (DISCORD_TOKEN && channelId && title && annMsg) {
        try {
          await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            method: 'POST',
            headers: { Authorization: `Bot ${DISCORD_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              embeds: [{
                title,
                description: annMsg,
                color: color ? parseInt(color.replace('#', ''), 16) : 0x5865F2,
                footer: { text: '7H STUDIO • Official Announcement' },
                timestamp: new Date().toISOString()
              }]
            })
          });
        } catch(e) {}
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: true, message: `Dispatched to channel ${channelId}!` }));
    }

    // Default admin handler for product/partner mutations
    const payload = await parseBody(req);
    if (!ADMIN_IDS.includes(payload.adminId)) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: true, action }));
  }

  // Static Assets Fallback (Images, etc.)
  try {
    const rel = pathname.replace(/^\//, '');
    let filePath = path.join(__dirname, rel);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, 'public', rel);
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.statusCode = 200;
      res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
      return res.end(fs.readFileSync(filePath));
    }
  } catch(e) {}

  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain');
  res.end('404 Not Found');
};

if (require.main === module) {
  const server = http.createServer(requestHandler);
  server.listen(PORT, () => {
    console.log(`🌐 7H STUDIO Running on http://localhost:${PORT}`);
  });
}

module.exports = requestHandler;
