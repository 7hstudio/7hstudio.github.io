let handler = null;
let initError = null;

try {
  handler = require('../server.js');
} catch (err) {
  initError = err;
  console.error('Failed to load server.js:', err);
}

module.exports = async (req, res) => {
  if (initError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: 'SERVERLESS_INIT_ERROR',
      message: initError.message,
      stack: initError.stack
    }, null, 2));
  }

  try {
    return await handler(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: 'SERVERLESS_RUNTIME_ERROR',
      message: err.message,
      stack: err.stack
    }, null, 2));
  }
};
