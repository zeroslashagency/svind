import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, { recursive: true, force: true });
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

// Core static pages & site assets
for (const page of ['index.html', 'products.html', 'clients.html', 'about.html', 'contact.html']) {
  copyFile(path.join(rootDir, page), path.join(distDir, page));
}
copyFile(path.join(rootDir, 'sitemap.xml'), path.join(distDir, 'sitemap.xml'));
copyDir(path.join(rootDir, 'assets'), path.join(distDir, 'assets'));

// Vendor browser ESM modules matching <script type="importmap"> in index.html
copyDir(
  path.join(rootDir, 'node_modules/three/build'),
  path.join(distDir, 'vendor/three/build')
);
copyDir(
  path.join(rootDir, 'node_modules/three/examples/jsm'),
  path.join(distDir, 'vendor/three/examples/jsm')
);

const gsapSrc = path.join(rootDir, 'node_modules/gsap');
const gsapDest = path.join(distDir, 'vendor/gsap');
fs.mkdirSync(gsapDest, { recursive: true });
for (const entry of fs.readdirSync(gsapSrc, { withFileTypes: true })) {
  if (entry.isFile() && (entry.name.endsWith('.js') || entry.name === 'package.json')) {
    copyFile(path.join(gsapSrc, entry.name), path.join(gsapDest, entry.name));
  }
}
copyDir(path.join(gsapSrc, 'utils'), path.join(gsapDest, 'utils'));

console.log('Built static production bundle in dist/');
