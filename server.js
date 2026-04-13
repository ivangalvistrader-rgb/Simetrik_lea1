/**
 * server.js — Local HTTPS server for iPhone PWA testing
 *
 * WHY HTTPS?
 *   Service Workers + Web Speech API require HTTPS on iOS Safari.
 *   This server uses a self-signed certificate for local network access.
 *
 * SETUP:
 *   1. Generate self-signed cert (one time):
 *      openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes \
 *        -subj "/CN=localhost"
 *
 *   2. Start server:
 *      node server.js
 *
 *   3. Find your local IP:
 *      Mac:   ipconfig getifaddr en0
 *      Linux: hostname -I | awk '{print $1}'
 *
 *   4. On iPhone (same WiFi):
 *      Open Safari → https://YOUR_LOCAL_IP:3000
 *      Accept the "Not Secure" warning (self-signed cert)
 *      Share → Add to Home Screen
 *
 * REQUIREMENTS: Node.js 16+ (no npm packages needed)
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const os    = require('os');

const PORT      = process.env.PORT || 3000;
const HTTP_PORT = process.env.HTTP_PORT || 3001;
const ROOT_DIR  = __dirname;

// MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.txt':  'text/plain; charset=utf-8',
};

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function requestHandler(req, res) {
  // Security: prevent directory traversal
  const urlPath   = req.url.split('?')[0];
  const safeUrl   = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const filePath  = path.join(ROOT_DIR, safeUrl === '/' ? 'index.html' : safeUrl);

  // Check file exists
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // SPA fallback: serve index.html for any unknown path
    const indexPath = path.join(ROOT_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      const data = fs.readFileSync(indexPath);
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
      res.end(data);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
    return;
  }

  const ext      = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

  // Cache headers: no-cache for HTML/JS/CSS (dev mode), aggressive for images
  const isAsset = ['.png','.jpg','.jpeg','.ico','.woff','.woff2'].includes(ext);
  const cacheControl = isAsset
    ? 'public, max-age=86400'      // 1 day for images/fonts
    : 'no-cache, no-store, must-revalidate'; // no cache for code files

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type':  mimeType,
      'Cache-Control': cacheControl,
      // Required for service worker scope
      'Service-Worker-Allowed': '/',
    });
    res.end(data);
  } catch (err) {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
}

// ── Try HTTPS first, fall back to HTTP ────────────────────────
const certPath = path.join(ROOT_DIR, 'cert.pem');
const keyPath  = path.join(ROOT_DIR, 'key.pem');

const localIP = getLocalIP();

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const options = {
    cert: fs.readFileSync(certPath),
    key:  fs.readFileSync(keyPath),
  };

  https.createServer(options, requestHandler).listen(PORT, '0.0.0.0', () => {
    console.log('\n🚀 JobRadar HTTPS Server iniciado\n');
    console.log(`  Local:   https://localhost:${PORT}`);
    console.log(`  Red:     https://${localIP}:${PORT}  ← Usa esta en iPhone\n`);
    console.log('📱 Instrucciones iPhone:');
    console.log('  1. iPhone y Mac/PC en la misma red WiFi');
    console.log(`  2. Abre Safari → https://${localIP}:${PORT}`);
    console.log('  3. Acepta la advertencia del certificado');
    console.log('  4. Compartir → "Añadir a pantalla de inicio"');
    console.log('\n✅ PWA lista para instalar en iPhone\n');
  });

} else {
  // HTTP fallback (no SW / voice on iOS, but useful for desktop testing)
  http.createServer(requestHandler).listen(HTTP_PORT, '0.0.0.0', () => {
    console.log('\n⚠️  Certificado SSL no encontrado — modo HTTP (solo para desktop)\n');
    console.log(`  Local: http://localhost:${HTTP_PORT}\n`);
    console.log('Para activar HTTPS (requerido para iPhone):');
    console.log('  openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"');
    console.log('  Luego: node server.js\n');
  });
}
