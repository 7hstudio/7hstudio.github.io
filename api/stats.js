module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const GUILD_ID = process.env.GUILD_ID || '1418023065560023052';
  const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

  try {
    if (!DISCORD_TOKEN) {
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

    const discordRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}?with_counts=true`, {
      headers: { Authorization: `Bot ${DISCORD_TOKEN}` }
    });

    if (!discordRes.ok) {
      throw new Error(`Discord API status ${discordRes.status}`);
    }

    const guild = await discordRes.json();
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
  } catch (err) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: true,
      guildId: GUILD_ID,
      name: '7H STUDIO',
      totalMembers: 708,
      onlineMembers: 77,
      iconUrl: 'assets/images/logo.png',
      fallback: true
    }));
  }
};
