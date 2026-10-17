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
    const token = payload.token;

    if (!token) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, message: 'OAuth access_token is required' }));
    }

    const discordUserRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!discordUserRes.ok) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        user: {
          username: 'Discord Member',
          displayName: 'Discord Member',
          avatar: 'assets/images/logo.png',
          inServer: true
        }
      }));
    }

    const discordUser = await discordUserRes.json();
    let member = null;

    if (DISCORD_TOKEN) {
      try {
        const memberRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordUser.id}`, {
          headers: { Authorization: `Bot ${DISCORD_TOKEN}` }
        });
        if (memberRes.ok) {
          member = await memberRes.json();
        }
      } catch (e) {}
    }

    const u = discordUser;
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
  } catch (err) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: true,
      user: {
        username: 'Discord Member',
        displayName: 'Discord Member',
        avatar: 'assets/images/logo.png',
        inServer: true
      }
    }));
  }
};
