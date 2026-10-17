const ADMIN_IDS = ['1335753623367319635', '1197968394222325760'];
const GUILD_ID = process.env.GUILD_ID || '1418023065560023052';
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  try {
    const payload = await parseBody(req);
    const query = (payload.username || payload.query || '').trim();

    if (!query) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, message: 'Username or Discord ID is required' }));
    }

    if (!DISCORD_TOKEN) {
      // Demo fallback if token not configured yet
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        inServer: true,
        user: {
          id: 'demo_user',
          username: query,
          discriminator: '0',
          displayName: query,
          avatar: 'assets/images/logo.png',
          inServer: true,
          isAdmin: false,
          rolesCount: 1,
          joinedAt: new Date().toISOString()
        },
        message: `Verified! Welcome ${query} to 7H STUDIOS.`
      }));
    }

    let member = null;

    // Check if query is numeric ID
    if (/^\d{17,20}$/.test(query)) {
      try {
        const idRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${query}`, {
          headers: { Authorization: `Bot ${DISCORD_TOKEN}` }
        });
        if (idRes.ok) {
          member = await idRes.json();
        }
      } catch (e) {}
    }

    if (!member) {
      const searchRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/search?query=${encodeURIComponent(query)}&limit=5`, {
        headers: { Authorization: `Bot ${DISCORD_TOKEN}` }
      });
      if (searchRes.ok) {
        const results = await searchRes.json();
        if (results && results.length > 0) {
          member = results[0];
        }
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
        message: `Verified! Welcome ${u.username} to 7H STUDIOS.`
      }));
    } else {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        inServer: false,
        message: 'User was not found in 7H STUDIOS server. Please join our Discord server first!'
      }));
    }
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: false, message: 'Verification error: ' + err.message }));
  }
};
