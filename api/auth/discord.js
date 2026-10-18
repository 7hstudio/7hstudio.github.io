module.exports = (req, res) => {
  const CLIENT_ID = process.env.CLIENT_ID || '1560743842775568504';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '7hstudio.loca.lt';
  const base = `${proto}://${host}`;
  const redirectUri = encodeURIComponent(`${base}/api/auth/callback`);

  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=identify%20guilds`;

  res.statusCode = 302;
  res.setHeader('Location', discordAuthUrl);
  res.end();
};
