// Local staging server. Zero dependencies — just Node.
//   node dev.js            → http://localhost:4173
//   node dev.js --watch    → rebuilds public/index.html when src/ changes
// Serves public/ and returns 503 for unknown paths, exactly like production.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT) || 4173;
const WATCH = process.argv.includes('--watch');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json',
};

function build() {
  try {
    execFileSync(process.execPath, [path.join(__dirname, 'build.js')], { cwd: __dirname, stdio: 'inherit' });
  } catch {
    console.error('build failed — serving the last good output');
  }
}

build();

if (WATCH) {
  let timer = null;
  fs.watch(path.join(__dirname, 'src'), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => { console.log('\nchange detected — rebuilding'); build(); }, 120);
  });
  console.log('watching src/ for changes');
}

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const rel = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
  const file = path.join(ROOT, rel);

  // never serve outside public/
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('Forbidden'); return; }

  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
    return;
  }

  // production parity: every unknown path returns the page with a 503
  const page = fs.readFileSync(path.join(ROOT, 'index.html'));
  res.writeHead(503, {
    'Content-Type': 'text/html; charset=utf-8',
    'Retry-After': '604800',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex',
  });
  res.end(page);
}).listen(PORT, () => {
  console.log(`\n  staging  →  http://localhost:${PORT}\n`);
});
