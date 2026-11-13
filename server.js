import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const HOST = '0.0.0.0';

const app = express();

// .htaccess rule: deleted paths redirect 301 to /
app.use((req, res, next) => {
  if (/^\/(products|pages|locations|reference|testing)(\/.*)?$/i.test(req.path)) {
    return res.redirect(301, '/');
  }
  next();
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
      res.setHeader('Cache-Control', ext === '.html' ? 'no-cache' : 'public, max-age=3600');
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
