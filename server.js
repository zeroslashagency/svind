import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const HOST = '0.0.0.0';

const app = express();

const PORTFOLIO_SLUGS = new Set([
  'industrial-cranes',
  'spare-parts',
  'maintenance-services',
  'scaffolding-rental'
]);

// Smart legacy redirects so bookmarked or older links land on their true destination
app.use((req, res, next) => {
  const p = req.path.replace(/\/+$/, '') || '/';
  if (/^\/(pages\/services\/request-a-quote(\.html)?|request-a-quote)$/i.test(p)) {
    return res.redirect(301, '/contact#enquiry');
  }
  if (/^\/pages\/company\/contact(\.html)?$/i.test(p)) {
    return res.redirect(301, '/contact');
  }
  if (/^\/(pages\/company\/about(\.html)?|about\.html)$/i.test(p)) {
    return res.redirect(301, '/about');
  }
  if (/^\/(services(\.html)?|services\/.+|service-and-spares)$/i.test(p)) {
    return res.redirect(301, '/products/maintenance-services');
  }
  if (/^\/industries(\/.*)?$/i.test(p)) {
    return res.redirect(301, '/clients');
  }
  if (/^\/(resources(\.html)?|downloads|pages\/resources\/.+)$/i.test(p)) {
    return res.redirect(301, '/products');
  }
  if (/^\/(products\/(eot-cranes|gantry-cranes|jib-cranes|hoists)|eot-cranes|gantry-cranes|jib-cranes|hoists)(\/.*)?$/i.test(p)) {
    return res.redirect(301, '/products/industrial-cranes');
  }
  if (/^\/crane-spare-parts$/i.test(p)) {
    return res.redirect(301, '/products/spare-parts');
  }
  if (/^\/locations\/bangalore(\.html)?$/i.test(p)) {
    return res.redirect(301, '/about#bengaluru-works');
  }
  if (/^\/(reference|testing)(\/.*)?$/i.test(p)) {
    return res.redirect(301, '/');
  }
  next();
});

// Clean canonical multi-page routes
app.get('/products', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  res.sendFile(path.join(__dirname, 'products.html'));
});

app.get('/products/:category', (req, res, next) => {
  if (PORTFOLIO_SLUGS.has(String(req.params.category || '').toLowerCase())) {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    return res.sendFile(path.join(__dirname, 'products.html'));
  }
  next();
});

app.get('/clients', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  res.sendFile(path.join(__dirname, 'clients.html'));
});

app.get('/about', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/contact', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  res.sendFile(path.join(__dirname, 'contact.html'));
});

// Expose browser ESM vendor modules cleanly for <script type="importmap">
app.use(
  '/vendor/three',
  express.static(path.join(__dirname, 'node_modules/three'), {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  })
);

app.use(
  '/vendor/gsap',
  express.static(path.join(__dirname, 'node_modules/gsap'), {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  })
);

app.use(
  express.static(__dirname, {
    extensions: ['html'],
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const isDynamicAsset = ext === '.html' || ext === '.js' || ext === '.css' || ext === '.mjs';
      res.setHeader('Cache-Control', isDynamicAsset ? 'no-cache, must-revalidate' : 'public, max-age=3600');
    }
  })
);

app.use((_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
