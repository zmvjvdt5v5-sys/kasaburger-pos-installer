const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy /health to backend /health endpoint for deployment health checks
  app.use(
    '/health',
    createProxyMiddleware({
      target: 'http://localhost:8001',
      changeOrigin: true,
      pathRewrite: {
        '^/health': '/health'
      },
      logLevel: 'debug'
    })
  );
};
