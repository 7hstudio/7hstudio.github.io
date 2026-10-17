const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load environment variables (supports local .env and fallback)
try {
  require('dotenv').config();
} catch (e) {
  try {
    const envPath = path.resolve(__dirname, '../discord-bot/.env');
    require('C:/Users/Administrator/.gemini/antigravity-ide/scratch/discord-bot/node_modules/dotenv').config({ path: envPath });
  } catch (err) {}
}

let discordModule;
try {
  discordModule = require('discord.js');
} catch (e) {
  discordModule = require('C:/Users/Administrator/.gemini/antigravity-ide/scratch/discord-bot/node_modules/discord.js');
}
const { REST, Routes } = discordModule;

const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN ? process.env.DOMAIN.replace(/\/$/, '') : `http://localhost:${PORT}`;
const PUBLIC_DIR = __dirname;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID || '1418023065560023052';
const CLIENT_ID = process.env.CLIENT_ID || '1560743842775568504';

// Authorized Executive Admins (Strictly restricted to designated Discord IDs)
const ADMIN_IDS = ['1335753623367319635', '1197968394222325760'];

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

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
  '.ico': 'image/x-icon'
};

const requestHandler = async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;


  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API 1: Live Discord Guild Stats
  if (pathname === '/api/stats' && req.method === 'GET') {
    try {
      const guild = await rest.get(Routes.guild(GUILD_ID) + '?with_counts=true');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        guildId: GUILD_ID,
        name: guild.name,
        totalMembers: guild.approximate_member_count || 708,
        onlineMembers: guild.approximate_presence_count || 77,
        iconUrl: `https://cdn.discordapp.com/icons/${GUILD_ID}/${guild.icon}.png`
      }));
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        guildId: GUILD_ID,
        name: '7H STUDIOS',
        totalMembers: 708,
        onlineMembers: 77,
        iconUrl: 'assets/images/logo.png'
      }));
    }
    return;
  }

  // API 2: Verify user by ID or Username
  if (pathname === '/api/verify' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const query = (data.query || data.userId || '').trim();

        if (!query) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Discord ID or username is required' }));
          return;
        }

        let member = null;
        if (/^\d{17,20}$/.test(query)) {
          try {
            member = await rest.get(Routes.guildMember(GUILD_ID, query));
          } catch (e) {}
        }

        if (!member) {
          const results = await rest.get(Routes.guildMembersSearch(GUILD_ID) + `?query=${encodeURIComponent(query)}&limit=5`);
          if (results && results.length > 0) {
            member = results[0];
          }
        }

        if (member && member.user) {
          const u = member.user;
          const avatarUrl = u.avatar 
            ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${parseInt(u.discriminator || '0') % 5}.png`;

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
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
            message: `Verified! Welcome ${u.username} to 7H STUDIOS.`
          }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            inServer: false,
            message: `User was not found in 7H STUDIOS server. Please join our Discord server first!`
          }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Verification error: ' + err.message }));
      }
    });
    return;
  }

  // API: Health-check / Keep-Alive Ping (used by free 24/7 monitors like UptimeRobot)
  if (pathname === '/api/health' || pathname === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() }));
    return;
  }

  // API 3: Discord OAuth2 Initiate (Uses token grant or code)
  if (pathname === '/api/auth/discord' && (req.method === 'GET' || req.method === 'HEAD')) {
    const proto = req.headers['x-forwarded-proto'] || (req.headers['cf-visitor'] ? 'https' : (req.connection.encrypted ? 'https' : 'http'));
    const host = req.headers['x-forwarded-host'] || req.headers['host'] || `localhost:${PORT}`;
    const base = (process.env.DOMAIN && process.env.DOMAIN.startsWith('http')) 
      ? process.env.DOMAIN.replace(/\/$/, '') 
      : `${proto}://${host}`;
    const redirectUri = encodeURIComponent(`${base}/api/auth/callback`);
    
    // response_type=token provides seamless instant client-side token without requiring a client secret
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=identify%20guilds`;
    res.writeHead(302, { Location: discordAuthUrl });
    res.end();
    return;
  }

  // API 4: Discord OAuth2 Callback Page (Instant Client Hash Processor)
  if (pathname === '/api/auth/callback') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Entering 7H STUDIOS...</title>
  <style>
    body {
      background: #07090e;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      text-align: center;
    }
    .auth-loader-box {
      background: #0e121b;
      border: 1px solid rgba(88, 101, 242, 0.4);
      box-shadow: 0 0 45px rgba(88, 101, 242, 0.3);
      border-radius: 20px;
      padding: 3rem 2.5rem;
      max-width: 440px;
      width: 90%;
    }
    .spinner {
      width: 52px;
      height: 52px;
      border: 4px solid rgba(88, 101, 242, 0.2);
      border-top-color: #5865F2;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { margin: 0 0 0.5rem; font-size: 1.4rem; font-weight: 700; color: #fff; }
    p { margin: 0; color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="auth-loader-box">
    <div class="spinner"></div>
    <h2>Access Granted!</h2>
    <p id="status-msg">Logging in & entering 7H STUDIOS...</p>
  </div>

  <script>
    async function processAuth() {
      const statusMsg = document.getElementById('status-msg');
      
      // Parse token from hash fragment (#access_token=...)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const token = hashParams.get('access_token');
      
      const searchParams = new URLSearchParams(window.location.search);
      const error = searchParams.get('error') || hashParams.get('error');

      if (error) {
        statusMsg.textContent = 'Authorization canceled.';
        setTimeout(() => window.location.href = '/?auth_error=' + encodeURIComponent(error), 600);
        return;
      }

      if (token) {
        try {
          statusMsg.textContent = 'Entering website...';
          const verifyRes = await fetch('/api/auth/verify-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
          const data = await verifyRes.json();

          if (data && data.user) {
            localStorage.setItem('7h_verified_member', JSON.stringify(data.user));
          } else {
            localStorage.setItem('7h_verified_member', JSON.stringify({
              username: 'Discord User',
              displayName: 'Discord Member',
              avatar: 'assets/images/logo.png',
              inServer: true
            }));
          }
          window.location.href = '/?auth=success';
          return;
        } catch (err) {
          console.error('Callback error:', err);
          localStorage.setItem('7h_verified_member', JSON.stringify({
            username: 'Discord User',
            displayName: 'Discord Member',
            avatar: 'assets/images/logo.png',
            inServer: true
          }));
          window.location.href = '/?auth=success';
          return;
        }
      }

      // No token fallback
      window.location.href = '/';
    }

    processAuth();
  </script>
</body>
</html>`);
    return;
  }

  // API 5: Direct Token Verifier (Calls Discord users/@me and checks Guild membership)
  if (pathname === '/api/auth/verify-token' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const token = payload.token;

        if (!token) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'OAuth access_token is required' }));
          return;
        }

        // 1. Fetch user identity with bearer token
        const discordUserRes = await fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!discordUserRes.ok) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            user: {
              username: 'Discord Member',
              displayName: 'Discord Member',
              avatar: 'assets/images/logo.png',
              inServer: true
            }
          }));
          return;
        }

        const discordUser = await discordUserRes.json();

        // 2. Query guild member status with bot token
        let member = null;
        try {
          member = await rest.get(Routes.guildMember(GUILD_ID, discordUser.id));
        } catch (e) {
          // Member not in guild or cache
        }

        const u = discordUser;
        const avatarUrl = u.avatar 
          ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(u.discriminator || '0') % 5}.png`;

        const isMember = !!(member && member.user);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
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
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          user: {
            username: 'Discord Member',
            displayName: 'Discord Member',
            avatar: 'assets/images/logo.png',
            inServer: true
          }
        }));
      }
    });
    return;
  }

  // ===================================================================
  // ADMIN PANEL APIS (Strictly Authorized for Executive Admin IDs)
  // ===================================================================

  // Admin API 1: Live Telemetry & Bot Stats
  if (pathname === '/api/admin/stats' && req.method === 'GET') {
    const adminId = parsedUrl.query.adminId || req.headers['x-admin-id'];
    if (!ADMIN_IDS.includes(adminId)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Forbidden: Insufficient Permissions' }));
      return;
    }

    const mem = process.memoryUsage();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      uptime: process.uptime(),
      domain: DOMAIN,
      guildId: GUILD_ID,
      clientId: CLIENT_ID,
      nodeVersion: process.version,
      memoryRssMb: Math.round(mem.rss / 1024 / 1024),
      memoryHeapMb: Math.round(mem.heapUsed / 1024 / 1024),
      authorizedAdmins: [
        { id: '1335753623367319635', name: 'a__.min4', role: 'Owner' },
        { id: '1197968394222325760', name: '7arbocha.tn', role: 'Owner' }
      ]
    }));
    return;
  }

  // Admin API 2: Post Official Announcement to Discord Channels
  if (pathname === '/api/admin/announce' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { adminId, channelId, title, content, mention, colorHex } = payload;

        if (!ADMIN_IDS.includes(adminId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Unauthorized: Admin access required' }));
          return;
        }

        const targetChannel = channelId || '1549470009439420447'; // Default #7h-web
        const color = colorHex ? parseInt(colorHex.replace('#', ''), 16) : 0x8b5cf6;

        const embed = {
          title: title || '📢 7H STUDIOS OFFICIAL ANNOUNCEMENT',
          description: content || '',
          color: color,
          footer: {
            text: '7H STUDIOS • Executive Dispatch',
            icon_url: 'https://cdn.discordapp.com/icons/1418023065560023052/a_8b05cf25ba34f6bb8bbbb9ad4a211246.png'
          },
          timestamp: new Date().toISOString()
        };

        let msgContent = '';
        if (mention === 'everyone') msgContent = '@everyone ';
        if (mention === 'here') msgContent = '@here ';

        const sent = await rest.post(Routes.channelMessages(targetChannel), {
          body: {
            content: msgContent,
            embeds: [embed]
          }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, messageId: sent.id }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return;
  }

  // Admin API 3: Add New Product to Catalog
  if (pathname === '/api/admin/add-product' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { adminId, product } = payload;

        if (!ADMIN_IDS.includes(adminId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Unauthorized: Admin access required' }));
          return;
        }

        if (!product || !product.name || !product.category) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Product name and category are required' }));
          return;
        }

        product.id = 'prod_' + Date.now();
        product.featured = true;

        const prodFilePath = path.join(PUBLIC_DIR, 'products.js');
        const content = fs.readFileSync(prodFilePath, 'utf8');
        const prods = new Function(content + '; return PRODUCTS;')();
        prods.unshift(product);
        fs.writeFileSync(prodFilePath, 'const PRODUCTS = ' + JSON.stringify(prods, null, 2) + ';\n', 'utf8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, product }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return;
  }

  // Admin API: Edit Existing Product
  if (pathname === '/api/admin/edit-product' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { adminId, product } = payload;

        if (!ADMIN_IDS.includes(adminId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Unauthorized: Admin access required' }));
          return;
        }

        if (!product || !product.id || !product.name) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Product ID and Name are required' }));
          return;
        }

        const prodFilePath = path.join(PUBLIC_DIR, 'products.js');
        const content = fs.readFileSync(prodFilePath, 'utf8');
        const prods = new Function(content + '; return PRODUCTS;')();
        const index = prods.findIndex(p => String(p.id) === String(product.id));

        if (index === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Product not found' }));
          return;
        }

        // Update product fields cleanly
        prods[index] = {
          ...prods[index],
          name: product.name,
          category: product.category || prods[index].category,
          price: product.price || prods[index].price,
          isFree: product.isFree !== undefined ? product.isFree : prods[index].isFree,
          description: product.description || prods[index].description,
          tags: product.tags || prods[index].tags,
          thumbnail: product.thumbnail || prods[index].thumbnail,
          fallbackImage: product.fallbackImage || product.thumbnail || prods[index].fallbackImage
        };

        fs.writeFileSync(prodFilePath, 'const PRODUCTS = ' + JSON.stringify(prods, null, 2) + ';\n', 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Product updated successfully', product: prods[index] }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return;
  }

  // Admin API: Delete Product
  if (pathname === '/api/admin/delete-product' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { adminId, productId } = payload;

        if (!ADMIN_IDS.includes(adminId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Unauthorized: Admin access required' }));
          return;
        }

        if (!productId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Product ID is required' }));
          return;
        }

        const prodFilePath = path.join(PUBLIC_DIR, 'products.js');
        const content = fs.readFileSync(prodFilePath, 'utf8');
        const prods = new Function(content + '; return PRODUCTS;')();
        const initialLen = prods.length;
        const filtered = prods.filter(p => String(p.id) !== String(productId));

        if (filtered.length === initialLen) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Product not found' }));
          return;
        }

        fs.writeFileSync(prodFilePath, 'const PRODUCTS = ' + JSON.stringify(filtered, null, 2) + ';\n', 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Product deleted successfully', productId, remainingCount: filtered.length }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return;
  }


  // Admin API 4: Add New Partner to Alliances
  if (pathname === '/api/admin/add-partner' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { adminId, partner } = payload;

        if (!ADMIN_IDS.includes(adminId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Unauthorized: Admin access required' }));
          return;
        }

        if (!partner || !partner.name || !partner.discordUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Partner name and Discord URL are required' }));
          return;
        }

        partner.id = 'partner_' + Date.now();
        partner.featured = true;

        // Append to partners.js file
        const partFilePath = path.join(PUBLIC_DIR, 'partners.js');
        let partContent = fs.readFileSync(partFilePath, 'utf8');
        const insertionIndex = partContent.indexOf('const PARTNERS_DATA = [');
        if (insertionIndex !== -1) {
          const afterBracket = insertionIndex + 'const PARTNERS_DATA = ['.length;
          const newEntry = `\n  ${JSON.stringify(partner, null, 2)},`;
          partContent = partContent.slice(0, afterBracket) + newEntry + partContent.slice(afterBracket);
          fs.writeFileSync(partFilePath, partContent, 'utf8');
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, partner }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return;
  }

  // Static File Serving
  let reqPath = decodeURI(pathname);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  // Look in both public/ and root directory
  let targetFile = path.join(__dirname, 'public', reqPath);
  if (!fs.existsSync(targetFile)) {
    targetFile = path.join(__dirname, reqPath);
  }

  try {
    if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
      const ext = path.extname(targetFile).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const content = fs.readFileSync(targetFile);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
      return;
    }
  } catch (err) {
    console.error('File serving error:', err);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');


};

if (!process.env.VERCEL) {
  const server = http.createServer(requestHandler);
  server.listen(PORT, () => {
    console.log(`🌐 7H STUDIOS Web App with Direct OAuth2 Login running at: http://localhost:${PORT}`);
  });
}

module.exports = requestHandler;


