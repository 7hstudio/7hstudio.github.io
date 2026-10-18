module.exports = (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!DOCTYPE html>
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
};
