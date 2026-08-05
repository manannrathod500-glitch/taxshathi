/* eslint-disable */
/*
 * Prerender public marketing routes to static HTML for SEO.
 *
 * Runs after `craco build` (wired via the "postbuild" script in package.json).
 * It serves the production build locally, renders each public route in headless
 * Chromium, and writes the fully-rendered HTML back into build/<route>/index.html
 * so crawlers (Bing, GPTBot, PerplexityBot, social cards, and Googlebot) receive
 * real content instead of an empty <div id="root">.
 *
 * src/index.js uses ReactDOM.createRoot(), which REPLACES #root's children on
 * load — so JS visitors get a fresh, identical render and there is no
 * hydration-mismatch risk from the prerendered markup.
 *
 * Designed to fail SAFELY: if Chromium can't launch (e.g. a CI host without a
 * browser), it logs a warning and exits 0, leaving the normal SPA build intact
 * rather than breaking the deploy. Set SKIP_PRERENDER=1 to opt out entirely.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const PORT = 4123;

// Public routes to seed from. Auth-gated routes (/dashboard, /invoice,
// /gst-assistant) are intentionally excluded and never crawled.
const SEED_ROUTES = ['/', '/blog', '/demo', '/login', '/register'];
const ALLOW_PREFIXES = ['/', '/blog', '/demo', '/login', '/register'];
const MAX_PAGES = 60;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.map': 'application/json',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      let filePath = path.join(BUILD_DIR, urlPath);
      // SPA fallback: anything without a real file extension (a client route)
      // is served the root index.html so the React router can take over.
      if (!path.extname(filePath) || !fs.existsSync(filePath)) {
        filePath = path.join(BUILD_DIR, 'index.html');
      }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.statusCode = 404; res.end('Not found'); return; }
        res.setHeader('Content-Type', MIME[path.extname(filePath)] || 'application/octet-stream');
        res.end(data);
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

const isAllowed = (route) =>
  ALLOW_PREFIXES.some((p) => (p === '/' ? route === '/' : route === p || route.startsWith(p + '/')));

const routeToFile = (route) =>
  route === '/' ? path.join(BUILD_DIR, 'index.html') : path.join(BUILD_DIR, route, 'index.html');

(async () => {
  if (process.env.SKIP_PRERENDER) {
    console.log('[prerender] SKIP_PRERENDER set — skipping.');
    return;
  }
  if (!fs.existsSync(path.join(BUILD_DIR, 'index.html'))) {
    console.warn('[prerender] build/index.html not found — skipping.');
    return;
  }

  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    console.warn('[prerender] puppeteer not installed — skipping (SPA build left intact).');
    return;
  }

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  } catch (e) {
    console.warn(`[prerender] could not launch Chromium — skipping. (${e.message})`);
    return;
  }

  const server = await startServer();
  const queue = [...SEED_ROUTES];
  const seen = new Set();
  let count = 0;

  try {
    while (queue.length && count < MAX_PAGES) {
      const route = queue.shift();
      if (seen.has(route) || !isAllowed(route)) continue;
      seen.add(route);

      const page = await browser.newPage();
      try {
        await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle0', timeout: 30000 });
        await page.waitForSelector('#root *', { timeout: 8000 }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600)); // let route-level <head> SEO effects settle

        // discover internal links (e.g. blog posts) to crawl next
        const links = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')).filter(Boolean));
        for (const href of links) {
          if (href.startsWith('/') && !href.startsWith('//')) {
            const clean = href.split('#')[0].split('?')[0];
            if (clean && isAllowed(clean) && !seen.has(clean)) queue.push(clean);
          }
        }

        // Guard: if the app rendered (nearly) nothing — e.g. a build missing
        // REACT_APP_SUPABASE_ANON_KEY so the root module throws — DON'T overwrite
        // the working SPA shell with a blank page. Keep the original index.html.
        const rootLen = await page.$eval('#root', (el) => el.textContent.trim().length).catch(() => 0);
        if (rootLen < 80) {
          console.warn(`[prerender] skipped ${route}: rendered empty (#root content ${rootLen} chars) — leaving SPA shell intact.`);
          continue;
        }

        const html = '<!DOCTYPE html>\n' + (await page.content()).replace(/^<!DOCTYPE html>/i, '');
        const outFile = routeToFile(route);
        fs.mkdirSync(path.dirname(outFile), { recursive: true });
        fs.writeFileSync(outFile, html, 'utf-8');
        count++;
        console.log(`[prerender] ${route}  ->  build/${path.relative(BUILD_DIR, outFile).replace(/\\/g, '/')}`);
      } catch (e) {
        console.warn(`[prerender] skipped ${route}: ${e.message}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.log(`[prerender] done — ${count} route(s) prerendered.`);
})().catch((e) => {
  console.warn(`[prerender] non-fatal error — SPA build left intact. (${e && e.message})`);
});
