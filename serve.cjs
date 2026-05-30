const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5173;
const ROOT = path.join(__dirname, 'dist');
const EXPORTS_DIR = path.join(__dirname, 'exports');

// Ensure exports directory exists
if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : null);
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0].split('#')[0];

  if (!path.extname(urlPath) || urlPath === '/') {
    urlPath = '/index.html';
  }

  const filePath = path.join(ROOT, urlPath);

  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    res.end(data);
    return true;
  } catch (e) {
    try {
      const indexData = fs.readFileSync(path.join(ROOT, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(indexData);
      return true;
    } catch {
      return false;
    }
  }
}

const server = http.createServer(async (req, res) => {
  // CORS headers for API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API endpoint: export data to file
  if (req.method === 'POST' && req.url.startsWith('/api/export')) {
    try {
      const data = await readBody(req);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = 'novel-data-' + timestamp + '.json';
      const filepath = path.join(EXPORTS_DIR, filename);

      fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');

      // Also write a latest.json for easy access
      const latestPath = path.join(EXPORTS_DIR, 'latest.json');
      fs.writeFileSync(latestPath, JSON.stringify(data, null, 2), 'utf-8');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, file: filename, path: filepath }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // Serve static files
  if (!serveStatic(req, res)) {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Server running at http://localhost:' + PORT + '/');
  console.log('API: POST /api/export -> writes to exports/');
});
