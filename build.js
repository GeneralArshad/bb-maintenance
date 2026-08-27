// Builds public/index.html from src/page.html, inlining the webfont as woff2 data URIs.
// Also emits artifact.html (a preview build with the assets inlined) when assets exist.
const fs = require('fs');
const path = require('path');

const FACES = [
  ['Instrument Sans', 400, 'fonts/instrument-sans-latin-400-normal.woff2'],
  ['Instrument Sans', 500, 'fonts/instrument-sans-latin-500-normal.woff2'],
  ['Instrument Sans', 600, 'fonts/instrument-sans-latin-600-normal.woff2'],
];
const RANGE = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

const fontCss = FACES.map(([fam, w, p]) =>
  `@font-face{font-family:"${fam}";font-style:normal;font-weight:${w};font-display:swap;` +
  `src:url(data:font/woff2;base64,${fs.readFileSync(p).toString('base64')}) format("woff2");` +
  `unicode-range:${RANGE};}`
).join('\n');

const src = fs.readFileSync('src/page.html', 'utf8');
const html = src.replace(/<style id="fonts">[\s\S]*?<\/style>/, `<style id="fonts">\n${fontCss}\n</style>`);

fs.mkdirSync('public/assets', { recursive: true });
fs.writeFileSync('public/index.html', html);
console.log('public/index.html  ' + (Buffer.byteLength(html) / 1024).toFixed(0) + ' KB');

// --- preview build: same page with the assets inlined, body-only ---------
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
function inline(doc, srcAttr) {
  const rel = srcAttr.replace(/^\//, '');
  for (const ext of ['', '.jpg', '.jpeg', '.png', '.webp', '.svg']) {
    const guess = ext ? rel.replace(/\.[^.]+$/, ext) : rel;
    const file = path.join('public', guess);
    if (fs.existsSync(file)) {
      const mime = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
      const data = `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
      return doc.split(`src="${srcAttr}"`).join(`src="${data}"`);
    }
  }
  return doc;
}
let art = html;
art = inline(art, '/assets/facility.jpg');
art = inline(art, '/assets/logo.png');
const styles = [...art.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map(m => m[0]).join('\n');
const body = art.match(/<body>([\s\S]*?)<\/body>/)[1];
fs.writeFileSync('artifact.html', `<title>British Biologicals Maintenance</title>\n${styles}\n${body.trim()}\n`);
console.log('artifact.html     ' + (fs.statSync('artifact.html').size / 1024).toFixed(0) + ' KB');
