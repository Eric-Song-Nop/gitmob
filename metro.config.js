const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Zustand ESM files use import.meta.env which Metro web doesn't transform.
// Force zustand to resolve to CJS entry points on all platforms.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect zustand ESM (.mjs) imports to CJS (.js)
  if (moduleName.startsWith('zustand')) {
    const parts = moduleName.split('/');
    // e.g. 'zustand' -> 'zustand/index.js', 'zustand/middleware' -> 'zustand/middleware.js'
    const subpath = parts.length > 1 ? parts.slice(1).join('/') : 'index';
    const cjsPath = path.resolve(__dirname, 'node_modules', 'zustand', `${subpath}.js`);
    return { type: 'sourceFile', filePath: cjsPath };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Dev proxy: forward /proxy/github/* to https://github.com/* to bypass CORS
// Only active during development (Metro dev server)
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    const proxy = createProxyMiddleware({
      target: 'https://github.com',
      changeOrigin: true,
      pathRewrite: { '^/proxy/github': '' },
      headers: {
        Accept: 'application/json',
      },
    });

    return (req, res, next) => {
      if (req.url?.startsWith('/proxy/github')) {
        return proxy(req, res, next);
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
