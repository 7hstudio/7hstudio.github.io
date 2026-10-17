module.exports = (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
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

      window.location.href = '/';
    }

    processAuth();
  </script>
</body>
</html>`);
};
