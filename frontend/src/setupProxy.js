const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy /health to backend for deployment health checks
  // Uses environment variable in production, falls back to localhost in development
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
  
  app.use(
    '/health',
    createProxyMiddleware({
      target: backendUrl,
      changeOrigin: true,
    })
  );
};
