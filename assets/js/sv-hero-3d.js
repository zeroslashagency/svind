import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  FLOOR_Y,
  GANTRY_DIMS,
  LETTER_SPECS,
  computeFestoonGeometryData,
  computeDinHookProfile
} from './sv-hero-specs.js';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const THEME_META = {
  'raw-steel': {
    label: 'Raw Steel \u00b7 Double-Girder EOT Bay',
    surface: 'light'
  },
  'molten-heat': {
    label: 'Molten Heat \u00b7 Foundry Ladle Bay',
    surface: 'dark'
  },
  enamel: {
    label: 'Enamel \u00b7 125% Proof-Load Test Bed',
    surface: 'light'
  },
  cad: {
    label: 'CAD \u00b7 IS 807 Structural Assembly',
    surface: 'light'
  },
  galvanized: {
    label: 'Galvanized \u00b7 Goliath Portal Quay',
    surface: 'light'
  }
};

const isSoftwareGl = (() => {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
})();

function prefersReducedMotion() {
  return Boolean(window.matchMedia && window.matchMedia(REDUCED_MOTION_QUERY).matches);
}

function createWebGLRendererSafely() {
  const attempts = [
    { antialias: !isSoftwareGl, alpha: true, powerPreference: 'default' },
    { antialias: false, alpha: true }
  ];
  for (let i = 0; i < attempts.length; i += 1) {
    try {
      const r = new THREE.WebGLRenderer(attempts[i]);
      if (r && r.getContext()) return r;
      r?.dispose?.();
    } catch {
      // Try next fallback flags
    }
  }
  return null;
}

function mountSvgFallbackWordmark(mount, section, modeLabelEl) {
  if (!mount || mount.querySelector('.sv-hero3d__fallback')) {
    return { setPreset: () => {}, wave: () => {} };
  }
  mount.innerHTML = `
    <div class="sv-hero3d__fallback" aria-hidden="true">
      <svg viewBox="0 0 1120 340" role="presentation" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="svf-steel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#CFD8E3"/>
            <stop offset="52%" stop-color="#7B8898"/>
            <stop offset="100%" stop-color="#3E4958"/>
          </linearGradient>
          <pattern id="svf-molten" patternUnits="userSpaceOnUse" width="180" height="220">
            <rect width="180" height="220" fill="#1C191E"/>
            <path d="M-20,60 C45,18 115,105 200,52" fill="none" stroke="#FF6A1A" stroke-width="10"/>
            <path d="M-15,165 C60,120 130,205 200,155" fill="none" stroke="#FFB84D" stroke-width="6"/>
          </pattern>
          <pattern id="svf-blueprint" patternUnits="userSpaceOnUse" width="32" height="32">
            <rect width="32" height="32" fill="#173A73"/>
            <path d="M32 0H0v32" fill="none" stroke="#9EE0FF" stroke-opacity="0.32" stroke-width="1"/>
          </pattern>
          <linearGradient id="svf-galv" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#DCE4EC"/>
            <stop offset="45%" stop-color="#9BA8B7"/>
            <stop offset="100%" stop-color="#CFD9E2"/>
          </linearGradient>
        </defs>
        <g class="sv-hero3d__fallback-letter" data-idx="0" transform="translate(26,34)">
          <path d="M168,46 C140,18 62,16 32,46 C8,70 10,114 48,136 L122,164 C150,176 154,206 130,224 C100,246 42,240 16,214 L0,256 C36,288 124,292 164,258 C200,226 196,158 148,134 L74,104 C50,94 50,68 74,56 C100,44 134,54 152,72 Z" transform="translate(10,16)" fill="#18202A"/>
          <path d="M168,46 C140,18 62,16 32,46 C8,70 10,114 48,136 L122,164 C150,176 154,206 130,224 C100,246 42,240 16,214 L0,256 C36,288 124,292 164,258 C200,226 196,158 148,134 L74,104 C50,94 50,68 74,56 C100,44 134,54 152,72 Z" fill="url(#svf-steel)" stroke="rgba(255,255,255,0.34)" stroke-width="4"/>
        </g>
        <g class="sv-hero3d__fallback-letter" data-idx="1" transform="translate(232,32)">
          <polygon points="10,14 78,14 108,148 138,14 206,14 148,266 68,266" transform="translate(10,16)" fill="#18202A" stroke="#18202A" stroke-width="26" stroke-linejoin="round"/>
          <polygon points="10,14 78,14 108,148 138,14 206,14 148,266 68,266" fill="url(#svf-steel)" stroke="url(#svf-steel)" stroke-width="26" stroke-linejoin="round"/>
        </g>
        <g class="sv-hero3d__fallback-letter" data-idx="2" transform="translate(468,32)">
          <path d="M12,98 A74,74 0 0 1 160,98 L160,268 L12,268 Z" transform="translate(10,16)" fill="#18202A" stroke="#18202A" stroke-width="18" stroke-linejoin="round"/>
          <path d="M12,98 A74,74 0 0 1 160,98 L160,268 L12,268 Z" fill="url(#svf-steel)" stroke="rgba(255,255,255,0.28)" stroke-width="6" stroke-linejoin="round"/>
        </g>
        <g class="sv-hero3d__fallback-letter" data-idx="3" transform="translate(664,32)">
          <polygon points="10,266 10,14 76,14 138,136 138,14 202,14 202,266 138,266 74,142 74,266" transform="translate(10,16)" fill="#122138" stroke="#122138" stroke-width="24" stroke-linejoin="round"/>
          <polygon points="10,266 10,14 76,14 138,136 138,14 202,14 202,266 138,266 74,142 74,266" fill="url(#svf-steel)" stroke="rgba(255,255,255,0.24)" stroke-width="20" stroke-linejoin="round"/>
        </g>
        <g class="sv-hero3d__fallback-letter" data-idx="4" transform="translate(894,32)">
          <path d="M14,14 L104,14 C178,14 206,68 206,140 C206,212 178,266 104,266 L14,266 Z M76,84 L76,196 L102,196 C132,196 142,174 142,140 C142,106 132,84 102,84 Z" fill-rule="evenodd" transform="translate(10,16)" fill="#18202A" stroke="#18202A" stroke-width="20" stroke-linejoin="round"/>
          <path d="M14,14 L104,14 C178,14 206,68 206,140 C206,212 178,266 104,266 L14,266 Z M76,84 L76,196 L102,196 C132,196 142,174 142,140 C142,106 132,84 102,84 Z" fill-rule="evenodd" fill="url(#svf-steel)" stroke="rgba(255,255,255,0.28)" stroke-width="14" stroke-linejoin="round"/>
        </g>
      </svg>
    </div>
  `;

  const letters = Array.from(mount.querySelectorAll('.sv-hero3d__fallback-letter'));
  const enamelPalette = ['#D99B08', '#162C52', '#C84B1F', '#162C52', '#D99B08'];

  const wave = (focusIdx = -1) => {
    letters.forEach((el, idx) => {
      const dy = focusIdx === -1 ? -12 : (idx === focusIdx ? -18 : -5);
      el.style.transform = `translateY(${dy}px)`;
      window.setTimeout(() => { el.style.transform = ''; }, 280 + idx * 40);
    });
  };

  const setPreset = (preset) => {
    const meta = THEME_META[preset] || THEME_META['raw-steel'];
    section.dataset.theme = preset;
    section.dataset.heroSurface = meta.surface;
    if (modeLabelEl) modeLabelEl.textContent = meta.label;

    letters.forEach((el, idx) => {
      const back = el.children[0];
      const front = el.children[1];
      if (!front) return;
      if (preset === 'molten-heat') {
        front.setAttribute('fill', 'url(#svf-molten)');
        front.setAttribute('stroke', '#FF7B29');
        if (back) back.setAttribute('fill', '#110B0A');
      } else if (preset === 'enamel') {
        front.setAttribute('fill', enamelPalette[idx]);
        front.setAttribute('stroke', 'rgba(255,255,255,0.45)');
        if (back) back.setAttribute('fill', '#101F3A');
      } else if (preset === 'cad') {
        front.setAttribute('fill', 'url(#svf-blueprint)');
        front.setAttribute('stroke', '#9EE0FF');
        if (back) back.setAttribute('fill', '#0D234A');
      } else if (preset === 'galvanized') {
        front.setAttribute('fill', 'url(#svf-galv)');
        front.setAttribute('stroke', 'rgba(255,255,255,0.4)');
        if (back) back.setAttribute('fill', '#44505E');
      } else {
        front.setAttribute('fill', idx === 3 ? '#2B4263' : 'url(#svf-steel)');
        front.setAttribute('stroke', 'rgba(255,255,255,0.32)');
        if (back) back.setAttribute('fill', '#18202A');
      }
    });
  };

  return { setPreset, wave };
}

/* ==========================================================================
   INDUSTRIAL HIGH-BAY STUDIO ENVIRONMENT REFLECTIONS
   ========================================================================== */
function createIndustrialEnvTarget(renderer) {
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    const room = new RoomEnvironment();
    envScene.add(room);

    // High-contrast overhead high-bay LED strip emitters so brushed metals gleam realistically
    const stripGeo = new THREE.PlaneGeometry(18, 1.4);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
    const warmMat = new THREE.MeshBasicMaterial({ color: 0xFFE3C2, side: THREE.DoubleSide });

    const stripA = new THREE.Mesh(stripGeo, stripMat);
    stripA.position.set(0, 7.5, 4.5);
    stripA.rotation.x = Math.PI * 0.42;
    envScene.add(stripA);

    const stripB = new THREE.Mesh(stripGeo, warmMat);
    stripB.position.set(-7.5, 5.0, -3.5);
    stripB.rotation.y = Math.PI * 0.35;
    envScene.add(stripB);

    const stripC = new THREE.Mesh(stripGeo, stripMat);
    stripC.position.set(7.5, 4.5, -2.5);
    stripC.rotation.y = -Math.PI * 0.35;
    envScene.add(stripC);

    const target = pmrem.fromScene(envScene, 0.035);
    stripGeo.dispose();
    stripMat.dispose();
    warmMat.dispose();
    room.dispose();
    pmrem.dispose();
    return target;
  } catch {
    return null;
  }
}

/* ==========================================================================
   PROCEDURAL INDUSTRIAL TEXTURE & PBR MAP GENERATORS
   ========================================================================== */
function makeSteelPlateTexture(maxAnisotropy) {
  const S = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');

  // High-resolution cold-rolled brushed mill steel base with subtle studio tonal variation
  const grad = ctx.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, '#B9C4D0');
  grad.addColorStop(0.28, '#8E9AA8');
  grad.addColorStop(0.54, '#A4B0BD');
  grad.addColorStop(0.82, '#788494');
  grad.addColorStop(1, '#596575');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  // Subtle multi-frequency brushed metal horizontal grain streaks
  for (let y = 0; y < S; y += 2) {
    const wave = Math.sin(y * 0.19) * 0.5 + 0.5;
    const alpha = 0.035 + ((y * 17) % 11) * 0.008 + wave * 0.025;
    ctx.strokeStyle = y % 4 === 0 ? `rgba(255,255,255,${alpha})` : `rgba(14,20,28,${alpha})`;
    ctx.lineWidth = y % 6 === 0 ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(S, y);
    ctx.stroke();
  }

  // Subtle rolled steel mottling & patina spots (low opacity so brushing stays sharp)
  for (let i = 0; i < 620; i += 1) {
    const px = (i * 211) % S;
    const py = (i * 389) % S;
    const rw = 22 + (i % 68);
    const rh = 6 + (i % 18);
    const dark = i % 3 === 0;
    ctx.fillStyle = dark ? 'rgba(28, 36, 46, 0.055)' : 'rgba(230, 238, 246, 0.05)';
    ctx.fillRect(px, py, rw, rh);
  }

  // Subtle thermal TIG/MIG heat-affected zone patina above & below the mid-height welded seam (v = 0.5)
  const hazGrad = ctx.createLinearGradient(0, S * 0.41, 0, S * 0.59);
  hazGrad.addColorStop(0, 'rgba(65, 52, 42, 0)');
  hazGrad.addColorStop(0.26, 'rgba(132, 96, 62, 0.16)');
  hazGrad.addColorStop(0.42, 'rgba(72, 78, 108, 0.24)');
  hazGrad.addColorStop(0.50, 'rgba(20, 24, 30, 0.72)');
  hazGrad.addColorStop(0.58, 'rgba(72, 78, 108, 0.24)');
  hazGrad.addColorStop(0.74, 'rgba(132, 96, 62, 0.16)');
  hazGrad.addColorStop(1, 'rgba(65, 52, 42, 0)');
  ctx.fillStyle = hazGrad;
  ctx.fillRect(0, S * 0.40, S, S * 0.20);

  // Mid-height welded butt seam trench + specular weld bead hatch scallops
  ctx.strokeStyle = 'rgba(14, 18, 24, 0.78)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, S * 0.5);
  ctx.lineTo(S, S * 0.5);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(226, 234, 242, 0.42)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, S * 0.5 - 3);
  ctx.lineTo(S, S * 0.5 - 3);
  ctx.stroke();

  for (let wx = 4; wx < S; wx += 14) {
    ctx.strokeStyle = wx % 28 === 4 ? 'rgba(240, 246, 255, 0.28)' : 'rgba(24, 30, 38, 0.34)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(wx, S * 0.5, 4.5, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();
  }

  // Subtle darkened perimeter plate edge patina
  ctx.strokeStyle = 'rgba(18, 24, 32, 0.28)';
  ctx.lineWidth = 14;
  ctx.strokeRect(4, 4, S - 8, S - 8);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function makeSteelRoughnessAndBump() {
  const S = 512;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#5C5C5C';
  ctx.fillRect(0, 0, S, S);

  for (let y = 0; y < S; y += 2) {
    const shade = 74 + ((y * 23) % 58);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(0, y, S, 1);
  }

  for (let i = 0; i < 680; i += 1) {
    const x = (i * 113) % S;
    const y = (i * 211) % S;
    const v = 54 + (i % 78);
    ctx.fillStyle = `rgba(${v},${v},${v},0.32)`;
    ctx.fillRect(x, y, 16, 4);
  }

  // Rough matte weld bead along horizontal center seam (v = 0.5)
  ctx.fillStyle = '#A8A8A8';
  ctx.fillRect(0, S * 0.5 - 5, S, 10);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function makeSteelNormalMap(maxAnisotropy) {
  const S = 512;
  const hCanvas = document.createElement('canvas');
  hCanvas.width = S;
  hCanvas.height = S;
  const hctx = hCanvas.getContext('2d');
  hctx.fillStyle = '#808080';
  hctx.fillRect(0, 0, S, S);

  for (let y = 0; y < S; y += 2) {
    const v = 122 + ((y * 19) % 14);
    hctx.fillStyle = `rgb(${v},${v},${v})`;
    hctx.fillRect(0, y, S, 1);
  }

  // Raised welded seam bead + recessed groove along center Y
  hctx.fillStyle = '#484848';
  hctx.fillRect(0, S * 0.5 - 5, S, 10);
  hctx.fillStyle = '#BDBDBD';
  hctx.fillRect(0, S * 0.5 - 2, S, 4);
  for (let wx = 4; wx < S; wx += 10) {
    hctx.fillStyle = wx % 20 === 4 ? '#DADADA' : '#6A6A6A';
    hctx.fillRect(wx, S * 0.5 - 3, 4, 6);
  }

  const srcData = hctx.getImageData(0, 0, S, S).data;
  const nCanvas = document.createElement('canvas');
  nCanvas.width = S;
  nCanvas.height = S;
  const nctx = nCanvas.getContext('2d');
  const outImg = nctx.createImageData(S, S);
  const out = outImg.data;
  const strength = 2.6;

  for (let y = 0; y < S; y += 1) {
    const ym = (y - 1 + S) % S;
    const yp = (y + 1) % S;
    for (let x = 0; x < S; x += 1) {
      const xm = (x - 1 + S) % S;
      const xp = (x + 1) % S;
      const hL = srcData[(y * S + xm) * 4] / 255;
      const hR = srcData[(y * S + xp) * 4] / 255;
      const hU = srcData[(ym * S + x) * 4] / 255;
      const hD = srcData[(yp * S + x) * 4] / 255;
      const dx = (hL - hR) * strength;
      const dy = (hU - hD) * strength;
      const nz = 1.0;
      const len = Math.hypot(dx, dy, nz) || 1;
      const idx = (y * S + x) * 4;
      out[idx] = Math.round(((dx / len) * 0.5 + 0.5) * 255);
      out[idx + 1] = Math.round(((dy / len) * 0.5 + 0.5) * 255);
      out[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      out[idx + 3] = 255;
    }
  }
  nctx.putImageData(outImg, 0, 0);

  const tex = new THREE.CanvasTexture(nCanvas);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function makeOchreEndTruckTexture(maxAnisotropy) {
  const S = 512;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');

  // Weathered industrial crane ochre enamel with subtle oil/scuff wear & welded panel lines
  const grad = ctx.createLinearGradient(0, 0, 0, S);
  grad.addColorStop(0, '#E3AE28');
  grad.addColorStop(0.55, '#CFA017');
  grad.addColorStop(1, '#AE7F0D');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  for (let i = 0; i < 900; i += 1) {
    const x = (i * 179) % S;
    const y = (i * 293) % S;
    const dark = i % 4 !== 0;
    ctx.fillStyle = dark ? 'rgba(42, 34, 18, 0.11)' : 'rgba(255, 240, 190, 0.09)';
    ctx.fillRect(x, y, 4 + (i % 12), 2 + (i % 6));
  }

  // Welded inspection cover seams & scuffed metallic corner wear
  ctx.strokeStyle = 'rgba(34, 26, 12, 0.42)';
  ctx.lineWidth = 4;
  ctx.strokeRect(22, 22, S - 44, S - 44);

  ctx.strokeStyle = 'rgba(255, 232, 168, 0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(25, 25, S - 50, S - 50);

  // Corner metal scuff marks revealing dark primer steel underneath
  [[14, 14], [S - 36, 14], [14, S - 36], [S - 36, S - 36]].forEach(([cx, cy]) => {
    ctx.fillStyle = 'rgba(54, 58, 66, 0.42)';
    ctx.fillRect(cx, cy, 22, 12);
    ctx.fillRect(cx, cy, 12, 22);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function makeWireRopeDrumTexture(maxAnisotropy) {
  const W = 512;
  const H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#4B5562';
  ctx.fillRect(0, 0, W, H);

  // Tight helical grooved steel wire-rope cable turns across hoist drum barrel
  for (let x = 0; x < W; x += 10) {
    ctx.fillStyle = '#202630';
    ctx.fillRect(x, 0, 3, H);
    ctx.fillStyle = '#9AA6B4';
    ctx.fillRect(x + 3, 0, 4, H);
    ctx.fillStyle = '#C7D1DC';
    ctx.fillRect(x + 4, 0, 2, H);
  }
  for (let y = 0; y < H; y += 8) {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y + 6);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function makeConcreteFloorTextures(maxAnisotropy) {
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = 512;
  albedoCanvas.height = 512;
  const actx = albedoCanvas.getContext('2d');

  // Pale brushed studio concrete slab (matches reference floor lightness while taking clean shadows)
  actx.fillStyle = '#DCE2E9';
  actx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 3200; i += 1) {
    const x = (i * 139) % 512;
    const y = (i * 257) % 512;
    const w = 6 + (i % 18);
    const v = 202 + (i % 42);
    actx.fillStyle = `rgba(${v},${v + 2},${v + 5},0.20)`;
    actx.fillRect(x, y, w, w * 0.5);
  }
  actx.strokeStyle = 'rgba(28, 36, 48, 0.11)';
  actx.lineWidth = 1.5;
  for (let g = 0; g < 512; g += 128) {
    actx.beginPath();
    actx.moveTo(g, 0);
    actx.lineTo(g, 512);
    actx.stroke();
    actx.beginPath();
    actx.moveTo(0, g);
    actx.lineTo(512, g);
    actx.stroke();
  }

  const albedoTex = new THREE.CanvasTexture(albedoCanvas);
  albedoTex.colorSpace = THREE.SRGBColorSpace;
  albedoTex.wrapS = THREE.RepeatWrapping;
  albedoTex.wrapT = THREE.RepeatWrapping;
  albedoTex.repeat.set(8, 6);
  albedoTex.anisotropy = maxAnisotropy;

  // Tight radial vignette alpha map so floor fades invisibly with zero rectangular borders on desktop or mobile
  const alphaCanvas = document.createElement('canvas');
  alphaCanvas.width = 256;
  alphaCanvas.height = 256;
  const lctx = alphaCanvas.getContext('2d');
  lctx.fillStyle = '#000000';
  lctx.fillRect(0, 0, 256, 256);
  const grad = lctx.createRadialGradient(128, 128, 24, 128, 128, 120);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.48, '#D2D2D2');
  grad.addColorStop(0.76, '#484848');
  grad.addColorStop(0.94, '#0A0A0A');
  grad.addColorStop(1, '#000000');
  lctx.fillStyle = grad;
  lctx.fillRect(0, 0, 256, 256);
  const alphaTex = new THREE.CanvasTexture(alphaCanvas);

  return { albedoTex, alphaTex };
}

function makeMoltenAlbedoAndEmissive(maxAnisotropy) {
  const aCanvas = document.createElement('canvas');
  aCanvas.width = 512;
  aCanvas.height = 512;
  const actx = aCanvas.getContext('2d');

  const eCanvas = document.createElement('canvas');
  eCanvas.width = 512;
  eCanvas.height = 512;
  const ectx = eCanvas.getContext('2d');

  // Dark pitted forge cast-iron crust
  actx.fillStyle = '#151114';
  actx.fillRect(0, 0, 512, 512);
  ectx.fillStyle = '#020000';
  ectx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 3200; i += 1) {
    const x = (i * 173) % 512;
    const y = (i * 311) % 512;
    const v = 14 + (i % 24);
    actx.fillStyle = `rgb(${v + 5},${v + 1},${v})`;
    actx.fillRect(x, y, 3 + (i % 3), 2 + (i % 3));
  }

  // Natural irregular heat-check fractures (low-frequency curve walk — never sawtooth zig-zag)
  const traceOrganicFissure = (ctx, x0, y0, x1, y1, seed, width, color) => {
    const steps = 12;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    let drift = 0;
    for (let s = 1; s < steps; s += 1) {
      const t = s / steps;
      const nx = -(y1 - y0);
      const ny = x1 - x0;
      const nlen = Math.hypot(nx, ny) || 1;
      drift += Math.sin(seed * 11.7 + s * 1.35) * 12 + Math.cos(seed * 4.3 + s * 0.85) * 7;
      const env = Math.sin(t * Math.PI);
      const offset = drift * env;
      ctx.lineTo(
        x0 + (x1 - x0) * t + (nx / nlen) * offset,
        y0 + (y1 - y0) * t + (ny / nlen) * offset
      );
    }
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };

  const cracks = [
    [16, 128, 496, 162, 1.1, 1],
    [12, 344, 502, 318, 2.4, 1],
    [144, 14, 198, 498, 3.7, 0.9],
    [348, 12, 306, 504, 4.9, 0.9],
    [98, 134, 212, 48, 5.5, 0.65],
    [252, 336, 372, 464, 6.2, 0.65],
    [186, 224, 324, 268, 7.8, 0.7]
  ];

  cracks.forEach(([x0, y0, x1, y1, seed, scale]) => {
    traceOrganicFissure(actx, x0, y0, x1, y1, seed, 16 * scale, 'rgba(6, 2, 2, 0.85)');
    traceOrganicFissure(actx, x0, y0, x1, y1, seed, 7.5 * scale, '#A82605');
    traceOrganicFissure(actx, x0, y0, x1, y1, seed, 3.4 * scale, '#FF5C12');
    traceOrganicFissure(actx, x0, y0, x1, y1, seed, 1.4 * scale, '#FFE68A');

    traceOrganicFissure(ectx, x0, y0, x1, y1, seed, 20 * scale, 'rgba(255, 58, 8, 0.34)');
    traceOrganicFissure(ectx, x0, y0, x1, y1, seed, 6.5 * scale, '#FF5A10');
    traceOrganicFissure(ectx, x0, y0, x1, y1, seed, 2.0 * scale, '#FFF3B0');
  });

  const albedoTex = new THREE.CanvasTexture(aCanvas);
  albedoTex.colorSpace = THREE.SRGBColorSpace;
  albedoTex.anisotropy = maxAnisotropy;

  const emissiveTex = new THREE.CanvasTexture(eCanvas);
  emissiveTex.colorSpace = THREE.SRGBColorSpace;
  emissiveTex.anisotropy = maxAnisotropy;

  return { albedoTex, emissiveTex };
}

function makeSoftEmberGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 250, 220, 1)');
  grad.addColorStop(0.24, 'rgba(255, 138, 38, 0.85)');
  grad.addColorStop(0.62, 'rgba(255, 62, 10, 0.25)');
  grad.addColorStop(1, 'rgba(255, 40, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

function makeBackdropHaloTexture(innerRgba, midRgba) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(256, 256, 12, 256, 256, 240);
  grad.addColorStop(0, innerRgba);
  grad.addColorStop(0.38, midRgba);
  grad.addColorStop(0.75, 'rgba(120, 24, 4, 0.08)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeEnamelStencilTexture(maxAnisotropy) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Rich industrial signal vermilion housing with riveted IS 807 specification badge centered cleanly on 'I'
  ctx.fillStyle = '#B83B18';
  ctx.fillRect(0, 0, 512, 512);

  // Spec plaque panel centered inside solid 'I' arch bounds
  ctx.fillStyle = '#132648';
  ctx.fillRect(36, 152, 440, 214);
  ctx.strokeStyle = '#C98C07';
  ctx.lineWidth = 5;
  ctx.strokeRect(38, 154, 436, 210);

  ctx.fillStyle = '#C98C07';
  ctx.fillRect(38, 306, 436, 56);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 48px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('IS 807', 256, 224);
  ctx.font = '600 26px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#D8E5F5';
  ctx.fillText('FEM 4M · 100 T', 256, 272);
  ctx.fillStyle = '#111620';
  ctx.font = '700 24px "IBM Plex Mono", monospace';
  ctx.fillText('125% PROOF LOAD', 256, 342);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function makeHazardStripeTexture(maxAnisotropy) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#C98C07';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#151920';
  for (let x = -128; x < 640; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 128);
    ctx.lineTo(x + 32, 128);
    ctx.lineTo(x + 96, 0);
    ctx.lineTo(x + 64, 0);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(5, 1);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function makeBlueprintScriptTexture(maxAnisotropy) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#133266';
  ctx.fillRect(0, 0, 512, 512);

  // Fine technical millimeter grid + crisp major section lines + registration crosshairs (zero clipped text)
  ctx.strokeStyle = 'rgba(158, 214, 255, 0.18)';
  ctx.lineWidth = 1;
  for (let g = 16; g < 512; g += 16) {
    ctx.beginPath();
    ctx.moveTo(g, 0);
    ctx.lineTo(g, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, g);
    ctx.lineTo(512, g);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(198, 232, 255, 0.36)';
  ctx.lineWidth = 2;
  for (let g = 64; g < 512; g += 64) {
    ctx.beginPath();
    ctx.moveTo(g, 0);
    ctx.lineTo(g, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, g);
    ctx.lineTo(512, g);
    ctx.stroke();
  }

  // Subtle diagonal structural section hatch
  ctx.strokeStyle = 'rgba(140, 205, 255, 0.09)';
  ctx.lineWidth = 1.5;
  for (let d = -512; d < 512; d += 24) {
    ctx.beginPath();
    ctx.moveTo(d, 0);
    ctx.lineTo(d + 512, 512);
    ctx.stroke();
  }

  // Precision CAD center crosshair marks
  ctx.strokeStyle = 'rgba(232, 246, 255, 0.55)';
  ctx.lineWidth = 2;
  for (let x = 128; x < 512; x += 128) {
    for (let y = 128; y < 512; y += 128) {
      ctx.beginPath();
      ctx.moveTo(x - 8, y);
      ctx.lineTo(x + 8, y);
      ctx.moveTo(x, y - 8);
      ctx.lineTo(x, y + 8);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function makeGalvanizedTexture(maxAnisotropy) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#B2BECB';
  ctx.fillRect(0, 0, 512, 512);

  // Authentic sharp crystalline zinc spangle facets (IS 2629 hot-dip galvanizing)
  const shades = ['#DCE4ED', '#8F9EAD', '#EDF3F8', '#7D8D9E', '#C3CFD9', '#A0AEBE'];
  for (let i = 0; i < 480; i += 1) {
    const cx = ((i * 197 + (i % 7) * 31) % 512);
    const cy = ((i * 293 + (i % 11) * 23) % 512);
    const len = 10 + (i % 24);
    const a = (i * 1.37) % (Math.PI * 2);
    const spread = 0.35 + (i % 5) * 0.14;
    ctx.fillStyle = shades[i % shades.length];
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    ctx.lineTo(cx + Math.cos(a + spread) * (len * 0.85), cy + Math.sin(a + spread) * (len * 0.85));
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Fine brushed zinc sheen
  for (let y = 0; y < 512; y += 3) {
    ctx.fillStyle = y % 6 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(18,24,32,0.05)';
    ctx.fillRect(0, y, 512, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function makeGalvanizedBumpTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 280; i += 1) {
    const cx = (i * 97) % 256;
    const cy = (i * 151) % 256;
    const len = 8 + (i % 16);
    const a = (i * 1.41) % (Math.PI * 2);
    const shade = 75 + (i % 105);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    ctx.lineTo(cx + Math.cos(a + 0.52) * len, cy + Math.sin(a + 0.52) * len);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeContactShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(128, 64, 12, 128, 64, 118);
  grad.addColorStop(0, 'rgba(10, 14, 22, 0.48)');
  grad.addColorStop(0.55, 'rgba(10, 14, 22, 0.16)');
  grad.addColorStop(1, 'rgba(10, 14, 22, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 128);
  return new THREE.CanvasTexture(canvas);
}

/* ==========================================================================
   MACHINED HEAVY INDUSTRIAL LETTER SILHOUETTES ("S V I N D")
   ========================================================================== */
function buildRoundedContourFromSpine(spinePoints, halfWidth, segmentsPerSide = 44) {
  const curve = new THREE.CatmullRomCurve3(
    spinePoints.map(([x, y]) => new THREE.Vector3(x, y, 0)),
    false,
    'centripetal',
    0.5
  );
  const pts = curve.getSpacedPoints(segmentsPerSide);
  const left = [];
  const right = [];

  for (let i = 0; i < pts.length; i += 1) {
    const p = pts[i];
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const len = Math.hypot(tx, ty) || 1;
    const nx = -ty / len;
    const ny = tx / len;
    left.push(new THREE.Vector2(p.x + nx * halfWidth, p.y + ny * halfWidth));
    right.push(new THREE.Vector2(p.x - nx * halfWidth, p.y - ny * halfWidth));
  }

  const startP = pts[0];
  const startNext = pts[1];
  const startAng = Math.atan2(startP.y - startNext.y, startP.x - startNext.x);
  const startCap = [];
  for (let k = 1; k < 10; k += 1) {
    const a = startAng - Math.PI * 0.5 + (Math.PI * k) / 10;
    startCap.push(new THREE.Vector2(
      startP.x + Math.cos(a) * halfWidth,
      startP.y + Math.sin(a) * halfWidth
    ));
  }

  const endP = pts[pts.length - 1];
  const endPrev = pts[pts.length - 2];
  const endAng = Math.atan2(endP.y - endPrev.y, endP.x - endPrev.x);
  const endCap = [];
  for (let k = 1; k < 10; k += 1) {
    const a = endAng - Math.PI * 0.5 + (Math.PI * k) / 10;
    endCap.push(new THREE.Vector2(
      endP.x + Math.cos(a) * halfWidth,
      endP.y + Math.sin(a) * halfWidth
    ));
  }

  const shape = new THREE.Shape();
  const poly = [...left, ...endCap.reverse(), ...right.reverse(), ...startCap.reverse()];
  shape.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i += 1) {
    shape.lineTo(poly[i].x, poly[i].y);
  }
  shape.closePath();
  return shape;
}

function buildRoundedPolygonShape(pts, cornerRadius = 0.1) {
  const shape = new THREE.Shape();
  const count = pts.length;
  for (let i = 0; i < count; i += 1) {
    const prev = pts[(i - 1 + count) % count];
    const curr = pts[i];
    const next = pts[(i + 1) % count];

    const v1x = prev[0] - curr[0];
    const v1y = prev[1] - curr[1];
    const l1 = Math.hypot(v1x, v1y) || 1;
    const v2x = next[0] - curr[0];
    const v2y = next[1] - curr[1];
    const l2 = Math.hypot(v2x, v2y) || 1;

    const r = Math.min(cornerRadius, l1 * 0.4, l2 * 0.4);
    const p1x = curr[0] + (v1x / l1) * r;
    const p1y = curr[1] + (v1y / l1) * r;
    const p2x = curr[0] + (v2x / l2) * r;
    const p2y = curr[1] + (v2y / l2) * r;

    if (i === 0) shape.moveTo(p1x, p1y);
    else shape.lineTo(p1x, p1y);
    shape.quadraticCurveTo(curr[0], curr[1], p2x, p2y);
  }
  shape.closePath();
  return shape;
}

function createLetterShape(char) {
  switch (char) {
    case 'S':
      return buildRoundedContourFromSpine([
        [0.54, 0.72],
        [0.14, 0.92],
        [-0.44, 0.80],
        [-0.56, 0.36],
        [0.02, 0.04],
        [0.56, -0.32],
        [0.44, -0.82],
        [-0.14, -0.92],
        [-0.56, -0.68]
      ], 0.30, 56);

    case 'V':
      return buildRoundedPolygonShape([
        [-0.84, 1.14],
        [-0.22, 1.14],
        [0.00, 0.14],
        [0.22, 1.14],
        [0.84, 1.14],
        [0.30, -1.12],
        [-0.30, -1.12]
      ], 0.16);

    case 'I': {
      const shape = new THREE.Shape();
      const w = 0.54;
      const hBottom = -1.10;
      const hArch = 0.48;
      shape.moveTo(-w, hBottom);
      shape.lineTo(w, hBottom);
      shape.lineTo(w, hArch);
      shape.absarc(0, hArch, w, 0, Math.PI, false);
      shape.lineTo(-w, hBottom);
      shape.closePath();
      return shape;
    }

    case 'N':
      return buildRoundedPolygonShape([
        [-0.84, -1.14],
        [-0.84, 1.14],
        [-0.24, 1.14],
        [0.26, -0.02],
        [0.26, 1.14],
        [0.84, 1.14],
        [0.84, -1.14],
        [0.26, -1.14],
        [-0.26, 0.02],
        [-0.26, -1.14]
      ], 0.13);

    case 'D':
    default: {
      const shape = new THREE.Shape();
      shape.moveTo(-0.78, -1.12);
      shape.lineTo(-0.04, -1.12);
      shape.bezierCurveTo(0.84, -1.12, 0.94, -0.52, 0.94, 0.0);
      shape.bezierCurveTo(0.94, 0.52, 0.84, 1.12, -0.04, 1.12);
      shape.lineTo(-0.78, 1.12);
      shape.quadraticCurveTo(-0.92, 1.12, -0.92, 0.94);
      shape.lineTo(-0.92, -0.94);
      shape.quadraticCurveTo(-0.92, -1.12, -0.78, -1.12);
      shape.closePath();

      const hole = new THREE.Path();
      hole.moveTo(-0.24, -0.44);
      hole.lineTo(-0.04, -0.44);
      hole.bezierCurveTo(0.28, -0.44, 0.34, -0.22, 0.34, 0.0);
      hole.bezierCurveTo(0.34, 0.22, 0.28, 0.44, -0.04, 0.44);
      hole.lineTo(-0.24, 0.44);
      hole.closePath();
      shape.holes.push(hole);
      return shape;
    }
  }
}

function normalizeExtrudeUVs(geometry) {
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  const minX = bb.min.x;
  const spanX = bb.max.x - bb.min.x || 1;
  const minY = bb.min.y;
  const spanY = bb.max.y - bb.min.y || 1;

  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  if (pos && uv) {
    for (let i = 0; i < pos.count; i += 1) {
      const u = (pos.getX(i) - minX) / spanX;
      const v = (pos.getY(i) - minY) / spanY;
      uv.setXY(i, u, v);
    }
    uv.needsUpdate = true;
  }
}

/* ==========================================================================
   5 INDUSTRIAL ENVIRONMENT DIRECTORS (Locked camera; complete world shift)
   ========================================================================== */
const LOCKED_CAMERA = {
  camX: 0.0,
  camYOffset: 0.18,
  camZBoost: 2.35,
  lookX: 0.0,
  lookYOffset: 0.24,
  fov: 31
};

const THEME_DIRECTORS = {
  'raw-steel': {
    ...LOCKED_CAMERA,
    exposure: 1.14,
    fogColor: 0xD0DAE4,
    fogDensity: 0.011,
    hemiSky: 0xF5F8FC,
    hemiGround: 0x45505E,
    hemiInt: 0.66,
    keyColor: 0xFFFBF2,
    keyInt: 2.25,
    keyPos: [-4.6, 8.8, 6.8],
    rimColor: 0xB8D8F8,
    rimInt: 1.15,
    rimPos: [6.4, 3.2, -4.6],
    underColor: 0x4A6382,
    underInt: 0.0,
    floorColor: 0xCBD4DE,
    floorRoughness: 0.68,
    floorMetalness: 0.10,
    floorOpacity: 0.78,
    floorEnvInt: 0.14,
    shadowOpacity: 0.34,
    rig: 'girders'
  },
  'molten-heat': {
    ...LOCKED_CAMERA,
    exposure: 1.24,
    fogColor: 0x130806,
    fogDensity: 0.026,
    hemiSky: 0x361E18,
    hemiGround: 0xFF5A14,
    hemiInt: 0.40,
    keyColor: 0xFFA458,
    keyInt: 1.05,
    keyPos: [3.2, 5.4, 5.2],
    rimColor: 0xFF4508,
    rimInt: 2.2,
    rimPos: [-5.8, 2.4, -4.2],
    underColor: 0xFF5A14,
    underInt: 4.8,
    floorColor: 0x160E0D,
    floorRoughness: 0.88,
    floorMetalness: 0.08,
    floorOpacity: 0.92,
    floorEnvInt: 0.04,
    shadowOpacity: 0.36,
    rig: 'sparks'
  },
  enamel: {
    ...LOCKED_CAMERA,
    exposure: 1.06,
    fogColor: 0xDAE3ED,
    fogDensity: 0.012,
    hemiSky: 0xFFFFFF,
    hemiGround: 0x627080,
    hemiInt: 0.72,
    keyColor: 0xFFFDF8,
    keyInt: 1.95,
    keyPos: [-3.5, 8.8, 6.4],
    rimColor: 0xDFECFA,
    rimInt: 0.84,
    rimPos: [5.4, 3.6, -3.8],
    underColor: 0xFFFFFF,
    underInt: 0.0,
    floorColor: 0xB8C3D0,
    floorRoughness: 0.56,
    floorMetalness: 0.12,
    floorOpacity: 0.72,
    floorEnvInt: 0.16,
    shadowOpacity: 0.28,
    rig: 'hazard'
  },
  cad: {
    ...LOCKED_CAMERA,
    exposure: 1.06,
    fogColor: 0xD3E4F4,
    fogDensity: 0.01,
    hemiSky: 0xF2F8FF,
    hemiGround: 0x7A98BC,
    hemiInt: 0.88,
    keyColor: 0xFFFFFF,
    keyInt: 1.4,
    keyPos: [1.5, 9.5, 6.0],
    rimColor: 0x74A7E2,
    rimInt: 0.75,
    rimPos: [-5.0, 4.0, -4.0],
    underColor: 0x4A7EC7,
    underInt: 0.0,
    floorColor: 0xD0E1F2,
    floorRoughness: 0.92,
    floorMetalness: 0.02,
    floorOpacity: 0.26,
    floorEnvInt: 0.03,
    shadowOpacity: 0.16,
    rig: 'cad'
  },
  galvanized: {
    ...LOCKED_CAMERA,
    exposure: 1.12,
    fogColor: 0xC6DCF0,
    fogDensity: 0.013,
    hemiSky: 0xEAF5FF,
    hemiGround: 0x5A6878,
    hemiInt: 0.72,
    keyColor: 0xFFFBF2,
    keyInt: 2.0,
    keyPos: [-5.6, 7.6, 5.2],
    rimColor: 0xB8D8F5,
    rimInt: 1.0,
    rimPos: [5.8, 3.2, -4.5],
    underColor: 0x99B4CC,
    underInt: 0.0,
    floorColor: 0xB0BECB,
    floorRoughness: 0.70,
    floorMetalness: 0.12,
    floorOpacity: 0.76,
    floorEnvInt: 0.12,
    shadowOpacity: 0.30,
    rig: 'rails'
  }
};

/* ==========================================================================
   DETAILED HEAVY CRANE & INDUSTRIAL WORKSHOP RIGS (5 Distinct Environments)
   ========================================================================== */
function buildWorkshopRigs(scene, disposables, {
  hazardTex,
  emberTex,
  haloTex,
  ochreTex,
  drumTex,
  steelNormalTex
}) {
  const rigs = {};

  const structuralSteelMat = new THREE.MeshStandardMaterial({
    color: 0x333F4F,
    normalMap: steelNormalTex,
    normalScale: new THREE.Vector2(0.32, 0.32),
    roughness: 0.38,
    metalness: 0.84
  });
  const darkCastMat = new THREE.MeshStandardMaterial({
    color: 0x1A2029,
    roughness: 0.56,
    metalness: 0.62
  });
  const safetyOchreMat = new THREE.MeshStandardMaterial({
    color: 0xEEB626,
    map: ochreTex,
    roughness: 0.40,
    metalness: 0.20
  });
  const forgedHookMat = new THREE.MeshStandardMaterial({
    color: 0x3A434F,
    roughness: 0.34,
    metalness: 0.88
  });
  const wireRopeMat = new THREE.MeshStandardMaterial({
    color: 0xCFD8E2,
    roughness: 0.22,
    metalness: 0.94
  });
  const hoistDrumMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    map: drumTex,
    bumpMap: drumTex,
    bumpScale: 0.024,
    roughness: 0.28,
    metalness: 0.86
  });
  const hazardStripeMat = new THREE.MeshStandardMaterial({
    map: hazardTex,
    roughness: 0.36,
    metalness: 0.14
  });
  disposables.push(
    structuralSteelMat,
    darkCastMat,
    safetyOchreMat,
    forgedHookMat,
    wireRopeMat,
    hoistDrumMat,
    hazardStripeMat
  );

  /* ------------------------------------------------------------------------
     1. RAW STEEL: Detailed Double-Girder EOT Bay, H-Columns w/ Anchor Baseplates,
        Weathered End-Trucks, C-Track Festoon Clamps & Forged DIN Sheave Hook
     ------------------------------------------------------------------------ */
  const girderRoot = new THREE.Group();

  const webGeo = new THREE.BoxGeometry(GANTRY_DIMS.girderSpan, 0.32, 0.11);
  const flangeGeo = new THREE.BoxGeometry(GANTRY_DIMS.girderSpan, 0.055, 0.28);
  const railBarGeo = new THREE.BoxGeometry(GANTRY_DIMS.girderSpan - 0.8, 0.045, 0.055);
  const ribGeo = new THREE.BoxGeometry(0.045, 0.30, 0.25);
  const splicePlateGeo = new THREE.BoxGeometry(0.28, 0.26, 0.15);

  const endTruckGeo = new THREE.BoxGeometry(0.54, 0.44, 1.18);
  const endPlateGeo = new THREE.BoxGeometry(0.56, 0.46, 0.05);
  const bumperGeo = new THREE.CylinderGeometry(0.06, 0.075, 0.10, 12);
  const wheelGeo = new THREE.CylinderGeometry(0.125, 0.125, 0.14, 16);

  const colHeight = GANTRY_DIMS.columnTopY - (FLOOR_Y + 0.06);
  const colCenterY = (FLOOR_Y + 0.06 + GANTRY_DIMS.columnTopY) * 0.5;
  const colWebGeo = new THREE.BoxGeometry(0.11, colHeight, 0.30);
  const colFlangeGeo = new THREE.BoxGeometry(0.32, colHeight, 0.06);
  const basePlateGeo = new THREE.BoxGeometry(0.68, 0.06, 0.74);
  const anchorBoltGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.045, 6);
  const capSaddleGeo = new THREE.BoxGeometry(0.64, 0.15, 0.96);

  // Gusset knee bracket at column cap & baseplate
  const gussetShape = new THREE.Shape();
  gussetShape.moveTo(0, 0);
  gussetShape.lineTo(0.22, 0);
  gussetShape.lineTo(0, 0.28);
  gussetShape.closePath();
  const gussetGeo = new THREE.ExtrudeGeometry(gussetShape, {
    depth: 0.04,
    bevelEnabled: false
  });
  gussetGeo.translate(0, 0, -0.02);

  disposables.push(
    webGeo, flangeGeo, railBarGeo, ribGeo, splicePlateGeo,
    endTruckGeo, endPlateGeo, bumperGeo, wheelGeo,
    colWebGeo, colFlangeGeo, basePlateGeo, anchorBoltGeo, capSaddleGeo, gussetGeo
  );

  // Twin fabricated I/box bridge girders + top rail bars
  [-GANTRY_DIMS.girderZOffset, GANTRY_DIMS.girderZOffset].forEach((zOff) => {
    const web = new THREE.Mesh(webGeo, structuralSteelMat);
    web.position.set(0, GANTRY_DIMS.girderY, zOff);
    web.castShadow = !isSoftwareGl;
    girderRoot.add(web);

    const topF = new THREE.Mesh(flangeGeo, structuralSteelMat);
    topF.position.set(0, GANTRY_DIMS.girderY + 0.185, zOff);
    topF.castShadow = !isSoftwareGl;
    girderRoot.add(topF);

    const botF = new THREE.Mesh(flangeGeo, structuralSteelMat);
    botF.position.set(0, GANTRY_DIMS.girderY - 0.185, zOff);
    girderRoot.add(botF);

    const rail = new THREE.Mesh(railBarGeo, wireRopeMat);
    rail.position.set(0, GANTRY_DIMS.girderY + 0.23, zOff);
    girderRoot.add(rail);

    // Mid-span bolted web splice plates
    [-2.4, 2.4].forEach((sx) => {
      const sp = new THREE.Mesh(splicePlateGeo, darkCastMat);
      sp.position.set(sx, GANTRY_DIMS.girderY, zOff);
      girderRoot.add(sp);
    });
  });

  // 22 Instanced vertical web stiffener T-ribs across front & rear girders
  const ribInst = new THREE.InstancedMesh(ribGeo, structuralSteelMat, 22);
  const tmpM = new THREE.Matrix4();
  for (let i = 0; i < 11; i += 1) {
    const rx = -4.5 + i * 0.9;
    tmpM.makeTranslation(rx, GANTRY_DIMS.girderY, -GANTRY_DIMS.girderZOffset);
    ribInst.setMatrixAt(i * 2, tmpM);
    tmpM.makeTranslation(rx, GANTRY_DIMS.girderY, GANTRY_DIMS.girderZOffset);
    ribInst.setMatrixAt(i * 2 + 1, tmpM);
  }
  ribInst.instanceMatrix.needsUpdate = true;
  ribInst.computeBoundingSphere();
  girderRoot.add(ribInst);

  // Smooth 5-span festoon power cable + C-track carrier clamp hangers under front bottom flange
  const festoonData = computeFestoonGeometryData({
    xMin: -4.45,
    xMax: 4.45,
    railY: GANTRY_DIMS.girderY - 0.215,
    zOffset: GANTRY_DIMS.girderZOffset + 0.14,
    spanCount: 5,
    sagDepth: 0.20,
    stepsPerSpan: 12
  });
  const festoonVecs = festoonData.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
  const festoonGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(festoonVecs), 96, 0.025, 8, false);
  const clampGeo = new THREE.BoxGeometry(0.06, 0.06, 0.07);
  disposables.push(festoonGeo, clampGeo);
  girderRoot.add(new THREE.Mesh(festoonGeo, darkCastMat));

  const clampInst = new THREE.InstancedMesh(clampGeo, safetyOchreMat, festoonData.clampXs.length);
  festoonData.clampXs.forEach((cx, idx) => {
    tmpM.makeTranslation(cx, GANTRY_DIMS.girderY - 0.20, GANTRY_DIMS.girderZOffset + 0.14);
    clampInst.setMatrixAt(idx, tmpM);
  });
  clampInst.instanceMatrix.needsUpdate = true;
  clampInst.computeBoundingSphere();
  girderRoot.add(clampInst);

  // Left & Right End-Trucks (clear yellow side & front housings) + Wheels + Columns on Bolted Baseplates
  [-1, 1].forEach((side) => {
    const xEnd = side * GANTRY_DIMS.endTruckX;
    const xCol = side * GANTRY_DIMS.columnX;

    // Weathered yellow boxed crane end-truck clearly visible at outer bridge ends
    const truck = new THREE.Mesh(endTruckGeo, safetyOchreMat);
    truck.position.set(xEnd, GANTRY_DIMS.girderY, 0.04);
    truck.castShadow = !isSoftwareGl;
    girderRoot.add(truck);

    // Compact dark steel end-caps & bumpers strictly on outer X faces (never blocking front yellow box)
    const sideCap = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.36, 0.88), darkCastMat);
    sideCap.position.set(xEnd + side * 0.285, GANTRY_DIMS.girderY, 0.04);
    girderRoot.add(sideCap);
    disposables.push(sideCap.geometry);

    [-0.36, 0.36].forEach((ez) => {
      const bumper = new THREE.Mesh(bumperGeo, darkCastMat);
      bumper.rotation.x = Math.PI * 0.5;
      bumper.position.set(xEnd, GANTRY_DIMS.girderY - 0.12, 0.04 + (ez > 0 ? 0.58 : -0.58));
      girderRoot.add(bumper);
    });

    // Exposed double-flanged dark bridge wheels riding column runway saddle
    [-0.42, 0.42].forEach((wz) => {
      const wheel = new THREE.Mesh(wheelGeo, darkCastMat);
      wheel.rotation.z = Math.PI * 0.5;
      wheel.position.set(xEnd, GANTRY_DIMS.girderY - 0.22, wz);
      girderRoot.add(wheel);
    });

    // H-section vertical bay stanchion anchored cleanly onto bolted concrete floor baseplate
    const cWeb = new THREE.Mesh(colWebGeo, structuralSteelMat);
    cWeb.position.set(xCol, colCenterY, GANTRY_DIMS.columnZ);
    cWeb.castShadow = !isSoftwareGl;
    girderRoot.add(cWeb);

    [-0.14, 0.14].forEach((fz) => {
      const cFlange = new THREE.Mesh(colFlangeGeo, structuralSteelMat);
      cFlange.position.set(xCol, colCenterY, GANTRY_DIMS.columnZ + fz);
      cFlange.castShadow = !isSoftwareGl;
      girderRoot.add(cFlange);
    });

    // Heavy floor baseplate flush on FLOOR_Y + 4 hex anchor bolts + side gusset brackets
    const basePlate = new THREE.Mesh(basePlateGeo, structuralSteelMat);
    basePlate.position.set(xCol, FLOOR_Y + 0.03, GANTRY_DIMS.columnZ);
    basePlate.receiveShadow = true;
    girderRoot.add(basePlate);

    [[-0.24, -0.26], [0.24, -0.26], [-0.24, 0.26], [0.24, 0.26]].forEach(([bx, bz]) => {
      const bolt = new THREE.Mesh(anchorBoltGeo, wireRopeMat);
      bolt.position.set(xCol + bx, FLOOR_Y + 0.075, GANTRY_DIMS.columnZ + bz);
      girderRoot.add(bolt);
    });

    const gInner = new THREE.Mesh(gussetGeo, darkCastMat);
    gInner.position.set(xCol - side * 0.16, FLOOR_Y + 0.06, GANTRY_DIMS.columnZ);
    if (side > 0) gInner.rotation.y = Math.PI;
    girderRoot.add(gInner);

    // Capital runway saddle & upper gusset haunches supporting end-truck
    const saddle = new THREE.Mesh(capSaddleGeo, darkCastMat);
    saddle.position.set(xCol, GANTRY_DIMS.columnTopY - 0.06, -0.10);
    girderRoot.add(saddle);

    const capGusset = new THREE.Mesh(gussetGeo, structuralSteelMat);
    capGusset.position.set(xCol - side * 0.16, GANTRY_DIMS.columnTopY - 0.42, GANTRY_DIMS.columnZ);
    if (side > 0) capGusset.rotation.y = Math.PI;
    girderRoot.add(capGusset);
  });

  // Heavy 4-Fall Wire Rope Hoist Crab Trolley + Helical Gearbox + Sheave Block & Forged DIN Hook
  const crabGroup = new THREE.Group();
  crabGroup.position.set(GANTRY_DIMS.hookRestX, 0, 0);

  const crabDeckGeo = new THREE.BoxGeometry(1.38, 0.14, 0.92);
  const crabWheelGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.09, 14);
  const crabFrameArchGeo = new THREE.BoxGeometry(0.10, 0.34, 0.84);
  const hoistDrumGeo = new THREE.CylinderGeometry(0.155, 0.155, 0.64, 24);
  const drumFlangeGeo = new THREE.CylinderGeometry(0.195, 0.195, 0.03, 24);
  const gearboxGeo = new THREE.BoxGeometry(0.24, 0.30, 0.28);
  const motorGeo = new THREE.CylinderGeometry(0.115, 0.115, 0.36, 16);
  const brakeCapGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.08, 14);
  const ropeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.64, 8);

  const cheekPlateGeo = new THREE.BoxGeometry(0.36, 0.28, 0.045);
  const sheaveCoreGeo = new THREE.BoxGeometry(0.32, 0.24, 0.14);
  const sheaveWheelGeo = new THREE.CylinderGeometry(0.105, 0.105, 0.16, 18);
  const axlePinGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.26, 12);
  const collarGeo = new THREE.CylinderGeometry(0.048, 0.056, 0.06, 14);

  const hookPts = computeDinHookProfile(0.88);
  const hookShape = new THREE.Shape();
  hookShape.moveTo(hookPts[0][0], hookPts[0][1]);
  for (let i = 1; i < hookPts.length; i += 1) {
    hookShape.lineTo(hookPts[i][0], hookPts[i][1]);
  }
  hookShape.closePath();
  const forgedHookGeo = new THREE.ExtrudeGeometry(hookShape, {
    depth: 0.036,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.012,
    bevelSegments: 3
  });
  forgedHookGeo.translate(0, 0, -0.018);

  const latchGeo = new THREE.BoxGeometry(0.016, 0.135, 0.024);

  disposables.push(
    crabDeckGeo, crabWheelGeo, crabFrameArchGeo, hoistDrumGeo, drumFlangeGeo,
    gearboxGeo, motorGeo, brakeCapGeo, ropeGeo,
    cheekPlateGeo, sheaveCoreGeo, sheaveWheelGeo, axlePinGeo, collarGeo,
    forgedHookGeo, latchGeo
  );

  const crabDeck = new THREE.Mesh(crabDeckGeo, safetyOchreMat);
  crabDeck.position.set(0, GANTRY_DIMS.trolleyBaseY, 0);
  crabDeck.castShadow = !isSoftwareGl;
  crabGroup.add(crabDeck);

  // 4 machined trolley rail wheels
  [[-0.52, -GANTRY_DIMS.girderZOffset], [0.52, -GANTRY_DIMS.girderZOffset], [-0.52, GANTRY_DIMS.girderZOffset], [0.52, GANTRY_DIMS.girderZOffset]].forEach(([wx, wz]) => {
    const cw = new THREE.Mesh(crabWheelGeo, darkCastMat);
    cw.rotation.x = Math.PI * 0.5;
    cw.position.set(wx, GANTRY_DIMS.trolleyBaseY - 0.02, wz);
    crabGroup.add(cw);
  });

  // Side hoist support pedestals on trolley deck
  [-0.44, 0.24].forEach((fx) => {
    const frame = new THREE.Mesh(crabFrameArchGeo, darkCastMat);
    frame.position.set(fx, GANTRY_DIMS.trolleyBaseY + 0.18, 0);
    crabGroup.add(frame);
  });

  // Grooved steel wire-rope hoist drum + side flanges
  const drum = new THREE.Mesh(hoistDrumGeo, hoistDrumMat);
  drum.rotation.z = Math.PI * 0.5;
  drum.position.set(-0.10, GANTRY_DIMS.trolleyBaseY + 0.19, 0);
  crabGroup.add(drum);

  [-0.41, 0.21].forEach((dfx) => {
    const df = new THREE.Mesh(drumFlangeGeo, structuralSteelMat);
    df.rotation.z = Math.PI * 0.5;
    df.position.set(dfx, GANTRY_DIMS.trolleyBaseY + 0.19, 0);
    crabGroup.add(df);
  });

  // Helical reduction gearbox + finned motor + rear brake bell
  const gearbox = new THREE.Mesh(gearboxGeo, darkCastMat);
  gearbox.position.set(0.32, GANTRY_DIMS.trolleyBaseY + 0.18, 0);
  crabGroup.add(gearbox);

  const motor = new THREE.Mesh(motorGeo, structuralSteelMat);
  motor.rotation.z = Math.PI * 0.5;
  motor.position.set(0.56, GANTRY_DIMS.trolleyBaseY + 0.19, 0);
  crabGroup.add(motor);

  const brakeCap = new THREE.Mesh(brakeCapGeo, darkCastMat);
  brakeCap.rotation.z = Math.PI * 0.5;
  brakeCap.position.set(0.76, GANTRY_DIMS.trolleyBaseY + 0.19, 0);
  crabGroup.add(brakeCap);

  // 4-Fall steel wire ropes
  [[-0.10, -0.055], [0.10, -0.055], [-0.10, 0.055], [0.10, 0.055]].forEach(([rx, rz]) => {
    const rope = new THREE.Mesh(ropeGeo, wireRopeMat);
    rope.position.set(rx, GANTRY_DIMS.sheaveCenterY + 0.36, rz);
    crabGroup.add(rope);
  });

  // Twin yellow cheek-plate bottom sheave pulley block
  const sheaveCore = new THREE.Mesh(sheaveCoreGeo, darkCastMat);
  sheaveCore.position.set(0, GANTRY_DIMS.sheaveCenterY, 0);
  crabGroup.add(sheaveCore);

  [-0.092, 0.092].forEach((cz) => {
    const cheek = new THREE.Mesh(cheekPlateGeo, safetyOchreMat);
    cheek.position.set(0, GANTRY_DIMS.sheaveCenterY, cz);
    crabGroup.add(cheek);
  });

  const sheaveWheel = new THREE.Mesh(sheaveWheelGeo, darkCastMat);
  sheaveWheel.rotation.x = Math.PI * 0.5;
  sheaveWheel.position.set(0, GANTRY_DIMS.sheaveCenterY + 0.02, 0);
  crabGroup.add(sheaveWheel);

  const axlePin = new THREE.Mesh(axlePinGeo, wireRopeMat);
  axlePin.rotation.x = Math.PI * 0.5;
  axlePin.position.set(0, GANTRY_DIMS.sheaveCenterY + 0.02, 0);
  crabGroup.add(axlePin);

  const collar = new THREE.Mesh(collarGeo, forgedHookMat);
  collar.position.set(0, GANTRY_DIMS.sheaveCenterY - 0.145, 0);
  crabGroup.add(collar);

  const hook = new THREE.Mesh(forgedHookGeo, forgedHookMat);
  hook.position.set(0, GANTRY_DIMS.sheaveCenterY - 0.165, 0);
  crabGroup.add(hook);

  const safetyLatch = new THREE.Mesh(latchGeo, structuralSteelMat);
  safetyLatch.position.set(0.072, GANTRY_DIMS.sheaveCenterY - 0.295, 0);
  safetyLatch.rotation.z = 0.62;
  crabGroup.add(safetyLatch);

  girderRoot.add(crabGroup);
  scene.add(girderRoot);
  rigs.girders = { root: girderRoot, crabGroup, restY: 0, hideY: 0.65 };

  /* ------------------------------------------------------------------------
     2. MOLTEN HEAT: Foundry Ladle Overhead Crane + Refractory Hearth + Additive Embers
     ------------------------------------------------------------------------ */
  const sparksRoot = new THREE.Group();
  const hearthMat = new THREE.MeshStandardMaterial({
    color: 0x1A1315,
    roughness: 0.88,
    metalness: 0.36
  });
  const ladleShieldMat = new THREE.MeshStandardMaterial({
    color: 0x261D20,
    roughness: 0.62,
    metalness: 0.68
  });
  const emberGlowMat = new THREE.MeshBasicMaterial({
    color: 0xFF6A14,
    transparent: true,
    opacity: 0.92
  });
  const haloMat = new THREE.MeshBasicMaterial({
    map: haloTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.85
  });

  const slagPitGeo = new THREE.BoxGeometry(9.6, 0.14, 1.65);
  const slagChannelGeo = new THREE.PlaneGeometry(8.4, 0.26);
  const ladleBeamGeo = new THREE.BoxGeometry(11.4, 0.28, 0.68);
  const heatShieldGeo = new THREE.BoxGeometry(10.8, 0.08, 0.92);
  const ladleHookArmGeo = new THREE.BoxGeometry(0.18, 0.95, 0.22);
  const trunnionColGeo = new THREE.BoxGeometry(0.46, 3.72, 0.52);
  const haloGeo = new THREE.PlaneGeometry(24, 16);
  disposables.push(
    hearthMat, ladleShieldMat, emberGlowMat, haloMat,
    slagPitGeo, slagChannelGeo, ladleBeamGeo, heatShieldGeo, ladleHookArmGeo, trunnionColGeo, haloGeo
  );

  // Seamless wide radial furnace glow behind the bay (fades cleanly to zero before bounds)
  const furnaceHalo = new THREE.Mesh(haloGeo, haloMat);
  furnaceHalo.position.set(0, 0.1, -4.4);
  sparksRoot.add(furnaceHalo);

  // Overhead hot-metal ladle crane beam + thermal heat-shield plate cleanly below swatch label
  const ladleBeam = new THREE.Mesh(ladleBeamGeo, ladleShieldMat);
  ladleBeam.position.set(0, 2.22, -0.35);
  sparksRoot.add(ladleBeam);

  const heatShield = new THREE.Mesh(heatShieldGeo, darkCastMat);
  heatShield.position.set(0, 2.04, -0.35);
  sparksRoot.add(heatShield);

  [-4.6, 4.6].forEach((hx) => {
    const arm = new THREE.Mesh(ladleHookArmGeo, darkCastMat);
    arm.position.set(hx, 1.56, -0.35);
    sparksRoot.add(arm);
  });

  const pitSlab = new THREE.Mesh(slagPitGeo, hearthMat);
  pitSlab.position.set(0, -1.52, 0);
  pitSlab.receiveShadow = true;
  sparksRoot.add(pitSlab);

  const slagChannel = new THREE.Mesh(slagChannelGeo, emberGlowMat);
  slagChannel.rotation.x = -Math.PI / 2;
  slagChannel.position.set(0, -1.44, 0.18);
  sparksRoot.add(slagChannel);

  [-5.35, 5.35].forEach((fx) => {
    const pil = new THREE.Mesh(trunnionColGeo, hearthMat);
    pil.position.set(fx, 0.30, -0.58);
    sparksRoot.add(pil);
  });

  const SPARK_COUNT = 140;
  const sparkPosArray = new Float32Array(SPARK_COUNT * 3);
  const sparkMeta = [];
  for (let i = 0; i < SPARK_COUNT; i += 1) {
    const sx = (((Math.sin(i * 19.31) * 43758.54) % 1 + 1) % 1 - 0.5) * 10.8;
    const sy = (((Math.sin(i * 47.17) * 19341.21) % 1 + 1) % 1) * 4.4;
    const sz = (((Math.sin(i * 91.73) * 28411.77) % 1 + 1) % 1 - 0.5) * 2.4;
    sparkMeta.push({
      x: sx,
      yOffset: sy,
      z: sz,
      speed: 0.55 + (i % 9) * 0.16,
      sway: 0.12 + (i % 5) * 0.04
    });
    sparkPosArray[i * 3] = sx;
    sparkPosArray[i * 3 + 1] = -1.4 + sy;
    sparkPosArray[i * 3 + 2] = sz;
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPosArray, 3));
  const sparkPointsMat = new THREE.PointsMaterial({
    map: emberTex,
    size: isSoftwareGl ? 0.24 : 0.28,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: 0xFFAE52
  });
  disposables.push(sparkGeo, sparkPointsMat);
  const sparkPoints = new THREE.Points(sparkGeo, sparkPointsMat);
  sparkPoints.frustumCulled = false;
  sparksRoot.add(sparkPoints);

  scene.add(sparksRoot);
  rigs.sparks = { root: sparksRoot, sparkPoints, sparkGeo, sparkMeta, restY: 0, hideY: -0.65 };

  /* ------------------------------------------------------------------------
     3. ENAMEL: Harohalli 125% Proof-Load Test Bed + Supported Gantry & Test Weights
     ------------------------------------------------------------------------ */
  const hazardRoot = new THREE.Group();
  const testBedGeo = new THREE.BoxGeometry(9.6, 0.16, 1.72);
  const apronGeo = new THREE.BoxGeometry(9.6, 0.10, 0.24);
  const weightBlockGeo = new THREE.BoxGeometry(1.05, 0.30, 0.66);
  const lugGeo = new THREE.TorusGeometry(0.09, 0.028, 8, 14, Math.PI);
  const testBeamGeo = new THREE.BoxGeometry(11.0, 0.24, 0.42);
  const testPostGeo = new THREE.BoxGeometry(0.24, 3.65, 0.28);
  const dynaBodyGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.32, 16);
  const dynaCableGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.52, 8);
  disposables.push(testBedGeo, apronGeo, weightBlockGeo, lugGeo, testBeamGeo, testPostGeo, dynaBodyGeo, dynaCableGeo);

  // Overhead Yellow Proof-Test Monorail supported by side steel gantry legs
  const testBeam = new THREE.Mesh(testBeamGeo, safetyOchreMat);
  testBeam.position.set(0, 2.22, -0.25);
  hazardRoot.add(testBeam);

  [-5.15, 5.15].forEach((tx) => {
    const tPost = new THREE.Mesh(testPostGeo, structuralSteelMat);
    tPost.position.set(tx, 0.36, -0.35);
    hazardRoot.add(tPost);
  });

  const dynaCable = new THREE.Mesh(dynaCableGeo, wireRopeMat);
  dynaCable.position.set(-0.14, 1.88, -0.1);
  hazardRoot.add(dynaCable);

  const dynaBody = new THREE.Mesh(dynaBodyGeo, darkCastMat);
  dynaBody.position.set(-0.14, 1.60, -0.1);
  hazardRoot.add(dynaBody);

  const testBed = new THREE.Mesh(testBedGeo, darkCastMat);
  testBed.position.set(0, -1.52, 0);
  testBed.receiveShadow = true;
  hazardRoot.add(testBed);

  const apron = new THREE.Mesh(apronGeo, hazardStripeMat);
  apron.position.set(0, -1.49, 0.94);
  hazardRoot.add(apron);

  [-5.15, 5.15].forEach((wx) => {
    for (let tier = 0; tier < 3; tier += 1) {
      const wBlock = new THREE.Mesh(weightBlockGeo, tier === 2 ? safetyOchreMat : structuralSteelMat);
      wBlock.position.set(wx, -1.34 + tier * 0.32, -0.15);
      wBlock.castShadow = !isSoftwareGl;
      wBlock.receiveShadow = true;
      hazardRoot.add(wBlock);
    }
    const lug = new THREE.Mesh(lugGeo, wireRopeMat);
    lug.position.set(wx, -0.52, -0.15);
    hazardRoot.add(lug);
  });

  scene.add(hazardRoot);
  rigs.hazard = { root: hazardRoot, restY: 0, hideY: -0.65 };

  /* ------------------------------------------------------------------------
     4. CAD: Calibrated Drafting Grid + Rich 3D Wireframe Double-Girder Crane Assembly
     ------------------------------------------------------------------------ */
  const cadRoot = new THREE.Group();
  const grid = new THREE.GridHelper(24, 34, 0x1E4C9A, 0x8EB4DC);
  grid.position.set(0, -1.48, 0);
  if (Array.isArray(grid.material)) {
    grid.material.forEach((m) => {
      m.transparent = true;
      m.opacity = 0.56;
      disposables.push(m);
    });
  } else {
    grid.material.transparent = true;
    grid.material.opacity = 0.56;
    disposables.push(grid.material);
  }
  disposables.push(grid.geometry);
  cadRoot.add(grid);

  const cadPts = new Float32Array([
    -4.85, -1.36, 1.32,   4.85, -1.36, 1.32,
    -4.85, -1.52, 1.32,  -4.85, -1.18, 1.32,
     4.85, -1.52, 1.32,   4.85, -1.18, 1.32,
    // Overhead CAD wireframe box-girder bridge + truss cleanly below swatch label
    -5.30,  1.96, -0.50,  5.30,  1.96, -0.50,
    -5.30,  2.30, -0.50,  5.30,  2.30, -0.50,
    -5.30,  1.96, -0.50, -5.30,  2.30, -0.50,
     5.30,  1.96, -0.50,  5.30,  2.30, -0.50,
    -4.00,  1.96, -0.50, -3.20,  2.30, -0.50,
    -3.20,  1.96, -0.50, -2.40,  2.30, -0.50,
    -2.40,  1.96, -0.50, -1.60,  2.30, -0.50,
     1.60,  1.96, -0.50,  2.40,  2.30, -0.50,
     2.40,  1.96, -0.50,  3.20,  2.30, -0.50,
     3.20,  1.96, -0.50,  4.00,  2.30, -0.50,
    -0.55,  2.30, -0.50,  0.55,  2.30, -0.50,
    -0.55,  2.48, -0.50,  0.55,  2.48, -0.50,
    -0.55,  2.30, -0.50, -0.55,  2.48, -0.50,
     0.55,  2.30, -0.50,  0.55,  2.48, -0.50,
    -0.14,  1.96, -0.50, -0.14,  1.45, -0.50,
     0.14,  1.96, -0.50,  0.14,  1.45, -0.50,
    -5.15, -1.30, -0.50, -5.15,  1.96, -0.50,
     5.15, -1.30, -0.50,  5.15,  1.96, -0.50
  ]);
  const cadGeo = new THREE.BufferGeometry();
  cadGeo.setAttribute('position', new THREE.BufferAttribute(cadPts, 3));
  const cadMat = new THREE.LineBasicMaterial({ color: 0x133B7E, transparent: true, opacity: 0.78 });
  disposables.push(cadGeo, cadMat);
  cadRoot.add(new THREE.LineSegments(cadGeo, cadMat));

  scene.add(cadRoot);
  rigs.cad = { root: cadRoot, restY: 0, hideY: -0.65 };

  /* ------------------------------------------------------------------------
     5. GALVANIZED: Goliath Portal Quay Crane — Flush Concrete Quay, Travel Bogies & A-Frame Legs
     ------------------------------------------------------------------------ */
  const railsRoot = new THREE.Group();
  const galvSteelMat = new THREE.MeshStandardMaterial({
    color: 0xB8C5D4,
    roughness: 0.28,
    metalness: 0.88
  });
  const quayDeckGeo = new THREE.BoxGeometry(11.8, 0.14, 2.1);
  const quayChannelGeo = new THREE.BoxGeometry(11.8, 0.05, 0.10);
  const portalLegGeo = new THREE.BoxGeometry(0.24, 3.72, 0.24);
  const braceGeo = new THREE.BoxGeometry(0.11, 1.32, 0.11);
  const sillBeamGeo = new THREE.BoxGeometry(0.36, 0.32, 1.92);
  const bogieWheelGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.12, 14);
  const topBoxBeamGeo = new THREE.BoxGeometry(11.4, 0.30, 0.64);
  const handrailGeo = new THREE.BoxGeometry(11.2, 0.04, 0.04);
  disposables.push(
    galvSteelMat, quayDeckGeo, quayChannelGeo, portalLegGeo, braceGeo,
    sillBeamGeo, bogieWheelGeo, topBoxBeamGeo, handrailGeo
  );

  const quayDeck = new THREE.Mesh(quayDeckGeo, darkCastMat);
  quayDeck.position.set(0, -1.55, 0);
  quayDeck.receiveShadow = true;
  railsRoot.add(quayDeck);

  [-0.72, 0.72].forEach((cz) => {
    const channel = new THREE.Mesh(quayChannelGeo, galvSteelMat);
    channel.position.set(0, -1.46, cz);
    railsRoot.add(channel);
  });

  // Overhead galvanized goliath box beam + handrail cleanly below top swatch label
  const topBox = new THREE.Mesh(topBoxBeamGeo, galvSteelMat);
  topBox.position.set(0, 2.22, 0);
  railsRoot.add(topBox);

  const railTop = new THREE.Mesh(handrailGeo, galvSteelMat);
  railTop.position.set(0, 2.46, 0.30);
  railsRoot.add(railTop);

  [-5.15, 5.15].forEach((px) => {
    const legF = new THREE.Mesh(portalLegGeo, galvSteelMat);
    legF.position.set(px, 0.42, 0.38);
    legF.rotation.x = 0.10;
    railsRoot.add(legF);

    const legR = new THREE.Mesh(portalLegGeo, galvSteelMat);
    legR.position.set(px, 0.42, -0.38);
    legR.rotation.x = -0.10;
    railsRoot.add(legR);

    const sill = new THREE.Mesh(sillBeamGeo, safetyOchreMat);
    sill.position.set(px, -1.28, 0);
    railsRoot.add(sill);

    [-0.72, 0.72].forEach((wz) => {
      const wheel = new THREE.Mesh(bogieWheelGeo, darkCastMat);
      wheel.rotation.z = Math.PI * 0.5;
      wheel.position.set(px, -1.41, wz);
      railsRoot.add(wheel);
    });

    const braceA = new THREE.Mesh(braceGeo, galvSteelMat);
    braceA.position.set(px, 0.34, 0);
    braceA.rotation.x = Math.PI * 0.25;
    railsRoot.add(braceA);

    const braceB = new THREE.Mesh(braceGeo, galvSteelMat);
    braceB.position.set(px, 0.34, 0);
    braceB.rotation.x = -Math.PI * 0.25;
    railsRoot.add(braceB);
  });

  scene.add(railsRoot);
  rigs.rails = { root: railsRoot, restY: 0, hideY: -0.65 };

  Object.values(rigs).forEach((rig) => {
    rig.root.visible = false;
    rig.root.position.y = rig.hideY;
    rig.mix = 0;
  });

  return rigs;
}

/* ==========================================================================
   MAIN HERO CONTROLLER
   ========================================================================== */
export function initHero3D() {
  const section = document.querySelector('#hero-3d');
  const mount = document.querySelector('#sv-hero3d-mount');
  if (!section || !mount) return;

  const modeLabelEl = document.querySelector('#sv-hero3d-mode-label');
  const swatchBtns = Array.from(section.querySelectorAll('.sv-hero3d__swatch[data-preset]'));

  let onPresetChanged = null;
  let onWaveRequested = null;
  let activePreset = 'raw-steel';

  function selectPreset(preset) {
    const validPreset = THEME_DIRECTORS[preset] ? preset : 'raw-steel';
    activePreset = validPreset;
    const meta = THEME_META[validPreset];
    section.dataset.theme = validPreset;
    section.dataset.heroSurface = meta.surface;
    if (modeLabelEl) modeLabelEl.textContent = meta.label;

    swatchBtns.forEach((btn) => {
      const isActive = btn.dataset.preset === validPreset;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    onPresetChanged?.(validPreset);
  }

  swatchBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      selectPreset(btn.dataset.preset || 'raw-steel');
      onWaveRequested?.(-1);
    });
  });

  const activateFallback = () => {
    const fb = mountSvgFallbackWordmark(mount, section, modeLabelEl);
    onPresetChanged = (preset) => fb.setPreset(preset);
    onWaveRequested = (idx) => fb.wave(idx);
    fb.setPreset(activePreset);
  };

  const renderer = createWebGLRendererSafely();
  if (!renderer) {
    activateFallback();
    return;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const heroDprCap = window.innerWidth < 600 ? 1.5 : 2;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, heroDprCap));
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mount.innerHTML = '';
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xC6D1DE, 0.015);

  const envTarget = createIndustrialEnvTarget(renderer);
  if (envTarget) scene.environment = envTarget.texture;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
  camera.position.set(-0.35, 0.85, 11.6);
  camera.lookAt(0, -0.22, 0);

  const hemiLight = new THREE.HemisphereLight(0xEEF4FB, 0x3D4754, 0.58);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xFFF7EC, 2.1);
  keyLight.position.set(-5.2, 8.6, 5.8);
  keyLight.castShadow = !isSoftwareGl;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 26;
  keyLight.shadow.camera.left = -8.2;
  keyLight.shadow.camera.right = 8.2;
  keyLight.shadow.camera.top = 5.2;
  keyLight.shadow.camera.bottom = -5.2;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xB8D8F8, 1.05);
  rimLight.position.set(6.4, 3.0, -4.6);
  scene.add(rimLight);

  const underGlowLight = new THREE.PointLight(0xFF5A14, 0, 14, 1.6);
  underGlowLight.position.set(0, -1.65, 1.4);
  scene.add(underGlowLight);

  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1);
  const steelTex = makeSteelPlateTexture(maxAniso);
  const steelRoughBumpTex = makeSteelRoughnessAndBump();
  const steelNormalTex = makeSteelNormalMap(maxAniso);
  const ochreTex = makeOchreEndTruckTexture(maxAniso);
  const drumTex = makeWireRopeDrumTexture(maxAniso);
  const { albedoTex: floorAlbedoTex, alphaTex: floorAlphaTex } = makeConcreteFloorTextures(maxAniso);
  const { albedoTex: moltenAlbedoTex, emissiveTex: moltenEmissiveTex } = makeMoltenAlbedoAndEmissive(maxAniso);
  const emberTex = makeSoftEmberGlowTexture();
  const haloTex = makeBackdropHaloTexture('rgba(255, 92, 22, 0.72)', 'rgba(180, 42, 10, 0.25)');
  const enamelStencilTex = makeEnamelStencilTexture(maxAniso);
  const hazardTex = makeHazardStripeTexture(maxAniso);
  const blueprintTex = makeBlueprintScriptTexture(maxAniso);
  const galvTex = makeGalvanizedTexture(maxAniso);
  const galvBumpTex = makeGalvanizedBumpTexture();
  const contactTex = makeContactShadowTexture();

  // Grounded Industrial Concrete / Epoxy Floor (wide elliptical fade — zero hard edges)
  const floorGeo = new THREE.PlaneGeometry(34, 24);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xCBD4DE,
    map: floorAlbedoTex,
    alphaMap: floorAlphaTex,
    transparent: true,
    opacity: 0.78,
    roughness: 0.68,
    metalness: 0.10,
    envMapIntensity: 0.14
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(0, FLOOR_Y, -1.0);
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  const shadowMat = new THREE.ShadowMaterial({ opacity: 0.34 });
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(24, 12), shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = FLOOR_Y + 0.015;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  const disposables = [
    floorGeo,
    floorMat,
    shadowMat,
    shadowPlane.geometry,
    steelTex,
    steelRoughBumpTex,
    steelNormalTex,
    ochreTex,
    drumTex,
    floorAlbedoTex,
    floorAlphaTex,
    moltenAlbedoTex,
    moltenEmissiveTex,
    emberTex,
    haloTex,
    enamelStencilTex,
    hazardTex,
    blueprintTex,
    galvTex,
    galvBumpTex,
    contactTex
  ];

  // Build 5 high-detail industrial machinery environments
  const propRigs = buildWorkshopRigs(scene, disposables, {
    hazardTex,
    emberTex,
    haloTex,
    ochreTex,
    drumTex,
    steelNormalTex
  });

  // Build 5 heavy machined letter blocks ("S V I N D") with physical 3D hex rivet studs
  const svindGroup = new THREE.Group();
  svindGroup.rotation.x = -0.025;
  scene.add(svindGroup);

  const ENAMEL_PALETTE = ['#C98C07', '#13284D', '#B83B18', '#13284D', '#C98C07'];

  const extrudeSettings = {
    depth: 0.80,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.09,
    bevelSegments: 10,
    curveSegments: 28
  };

  const backExtrudeSettings = {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 4,
    curveSegments: 16
  };

  const rivetHeadGeo = new THREE.CylinderGeometry(0.022, 0.030, 0.026, 8);
  rivetHeadGeo.rotateX(Math.PI * 0.5);
  const rivetMat = new THREE.MeshStandardMaterial({
    color: 0x7A8694,
    roughness: 0.30,
    metalness: 0.92
  });
  disposables.push(rivetHeadGeo, rivetMat);

  const letterStates = [];
  const raycastTargets = [];
  const rivetGroups = [];
  const rivetMat4 = new THREE.Matrix4();

  LETTER_SPECS.forEach((cfg, idx) => {
    const group = new THREE.Group();
    group.position.set(cfg.x, cfg.y, 0);
    group.rotation.set(0, cfg.rotY, cfg.rotZ);

    const shape = createLetterShape(cfg.char);

    const mainGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    mainGeom.center();
    normalizeExtrudeUVs(mainGeom);
    mainGeom.computeVertexNormals();
    if (mainGeom.index && typeof mainGeom.computeTangents === 'function') {
      mainGeom.computeTangents();
    }
    disposables.push(mainGeom);

    const mainMat = new THREE.MeshPhysicalMaterial({
      color: cfg.rawColor,
      map: steelTex,
      normalMap: steelNormalTex,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughnessMap: steelRoughBumpTex,
      roughness: cfg.rawRoughness,
      metalness: cfg.rawMetalness,
      anisotropy: 0.68,
      clearcoat: 0.26,
      clearcoatRoughness: 0.30,
      envMapIntensity: 1.32
    });
    disposables.push(mainMat);

    const mainMesh = new THREE.Mesh(mainGeom, mainMat);
    mainMesh.castShadow = !isSoftwareGl;
    mainMesh.receiveShadow = true;
    mainMesh.userData.letterIndex = idx;
    group.add(mainMesh);
    raycastTargets.push(mainMesh);

    // Physical 3D machined rivet studs mounted flush onto front steel plate face
    const frontFaceZ = (mainGeom.boundingBox ? mainGeom.boundingBox.max.z : 0.54) + 0.008;
    const rivetsInst = new THREE.InstancedMesh(rivetHeadGeo, rivetMat, cfg.rivets.length);
    cfg.rivets.forEach(([rx, ry], rIdx) => {
      rivetMat4.makeTranslation(rx, ry, frontFaceZ);
      rivetsInst.setMatrixAt(rIdx, rivetMat4);
    });
    rivetsInst.instanceMatrix.needsUpdate = true;
    rivetsInst.computeBoundingSphere();
    group.add(rivetsInst);
    rivetGroups.push(rivetsInst);

    const backGeom = new THREE.ExtrudeGeometry(shape, backExtrudeSettings);
    backGeom.center();
    backGeom.computeVertexNormals();
    disposables.push(backGeom);

    const backMat = new THREE.MeshStandardMaterial({
      color: 0x161D26,
      roughness: 0.82,
      metalness: 0.35
    });
    disposables.push(backMat);

    const backMesh = new THREE.Mesh(backGeom, backMat);
    backMesh.scale.set(0.96, 0.96, 1);
    backMesh.position.z = -0.46;
    backMesh.castShadow = !isSoftwareGl;
    group.add(backMesh);

    const contactGeom = new THREE.PlaneGeometry(2.35, 1.45);
    const contactMat = new THREE.MeshBasicMaterial({
      map: contactTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.82
    });
    disposables.push(contactGeom, contactMat);
    const contactMesh = new THREE.Mesh(contactGeom, contactMat);
    contactMesh.rotation.x = -Math.PI / 2;
    contactMesh.position.set(cfg.x, FLOOR_Y + 0.025, 0);
    scene.add(contactMesh);

    svindGroup.add(group);

    letterStates.push({
      cfg,
      group,
      mainMesh,
      mainMat,
      backMesh,
      backMat,
      contactMesh,
      pos: new THREE.Vector3(cfg.x, cfg.y + (prefersReducedMotion() ? 0 : 0.22 + idx * 0.08), 0),
      vel: new THREE.Vector3(),
      target: new THREE.Vector3(cfg.x, cfg.y, 0),
      rot: new THREE.Vector3(0, cfg.rotY, cfg.rotZ),
      rotVel: new THREE.Vector3(),
      targetRot: new THREE.Vector3(0, cfg.rotY, cfg.rotZ)
    });

    group.position.copy(letterStates[idx].pos);
  });

  // Crisp CAD wireframe edges (shown on CAD theme)
  const blueprintLines = letterStates.map((st) => {
    const edges = new THREE.EdgesGeometry(st.mainMesh.geometry, 24);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x9EE0FF, transparent: true, opacity: 0.85 });
    disposables.push(edges, lineMat);
    const seg = new THREE.LineSegments(edges, lineMat);
    seg.visible = false;
    st.group.add(seg);
    return seg;
  });

  /* ==========================================================================
     LOCKED CAMERA + DAMPED ENVIRONMENT LIGHTING STATE
     ========================================================================== */
  const camCurrentPos = new THREE.Vector3(-0.35, 0.85, 11.6);
  const camTargetPos = new THREE.Vector3(-0.35, 0.85, 11.6);
  const camCurrentLook = new THREE.Vector3(0, -0.22, 0);
  const camTargetLook = new THREE.Vector3(0, -0.22, 0);
  let targetFov = 34;

  const targetFogColor = new THREE.Color(0xC6D1DE);
  let targetFogDensity = 0.015;
  let targetExposure = 1.12;
  const targetHemiSky = new THREE.Color(0xEEF4FB);
  const targetHemiGround = new THREE.Color(0x3D4754);
  let targetHemiInt = 0.58;
  const targetKeyColor = new THREE.Color(0xFFF7EC);
  let targetKeyInt = 2.1;
  const targetKeyPos = new THREE.Vector3(-5.2, 8.6, 5.8);
  const targetRimColor = new THREE.Color(0xB8D8F8);
  let targetRimInt = 1.05;
  const targetRimPos = new THREE.Vector3(6.4, 3.0, -4.6);
  const targetUnderColor = new THREE.Color(0xFF5A14);
  let targetUnderInt = 0;
  const targetFloorColor = new THREE.Color(0xA8B5C4);
  let targetFloorRoughness = 0.62;
  let targetFloorMetalness = 0.16;
  let targetFloorOpacity = 0.68;
  let targetFloorEnvInt = 0.18;
  let targetShadowOpacity = 0.30;

  function computeResponsiveCamTargets(dir) {
    const rect = mount.getBoundingClientRect();
    const w = Math.max(2, rect.width || window.innerWidth || 1280);
    const h = Math.max(2, rect.height || 680);
    const aspect = w / h;
    const compact = w < 1024;
    const phone = w < 600;
    const mobileScale = compact ? 0.45 : 1;

    const halfV = Math.tan(THREE.MathUtils.degToRad(dir.fov * 0.5));
    const safeHalfWidth = (compact ? 5.95 : 5.65) + Math.abs(dir.camX * mobileScale) * 0.25;
    const minZForWidth = safeHalfWidth / (halfV * Math.max(0.44, aspect));
    const camZ = Math.max(10.8 + dir.camZBoost, minZForWidth);

    const camX = dir.camX * mobileScale;
    const camY = (phone ? 0.42 : compact ? 0.30 : 0.72) + dir.camYOffset * (compact ? 0.55 : 1);
    const lookX = dir.lookX * mobileScale;
    const lookY = (phone ? -0.62 : compact ? -0.95 : -0.10) + dir.lookYOffset * (compact ? 0.45 : 1);

    camTargetPos.set(camX, camY, camZ);
    camTargetLook.set(lookX, lookY, 0);
    targetFov = dir.fov;
  }

  function applyThemeMaterials(preset) {
    rivetGroups.forEach((rg) => {
      rg.visible = preset !== 'cad';
    });
    if (preset === 'molten-heat') {
      rivetMat.color.set('#3A2520');
      rivetMat.roughness = 0.68;
      rivetMat.metalness = 0.65;
    } else if (preset === 'enamel') {
      rivetMat.color.set('#E2E8F0');
      rivetMat.roughness = 0.20;
      rivetMat.metalness = 0.92;
    } else {
      rivetMat.color.set('#7A8694');
      rivetMat.roughness = 0.30;
      rivetMat.metalness = 0.92;
    }

    letterStates.forEach((st, idx) => {
      const mat = st.mainMat;
      const bpLine = blueprintLines[idx];
      bpLine.visible = false;
      mat.emissive.setHex(0x000000);
      mat.emissiveMap = null;
      mat.emissiveIntensity = 0;
      mat.roughnessMap = null;
      mat.normalMap = null;
      mat.bumpMap = null;
      mat.anisotropy = 0.0;

      if (preset === 'raw-steel') {
        mat.map = steelTex;
        mat.color.set(st.cfg.rawColor);
        mat.normalMap = steelNormalTex;
        mat.normalScale.set(0.55, 0.55);
        mat.roughnessMap = steelRoughBumpTex;
        mat.roughness = st.cfg.rawRoughness;
        mat.metalness = st.cfg.rawMetalness;
        mat.anisotropy = 0.68;
        mat.clearcoat = 0.26;
        mat.clearcoatRoughness = 0.30;
        mat.envMapIntensity = 1.34;
        st.backMat.color.set(idx === 3 ? '#111F36' : '#141A22');
      } else if (preset === 'molten-heat') {
        mat.map = moltenAlbedoTex;
        mat.color.set('#FFFFFF');
        mat.emissive.setHex(0xFF5A14);
        mat.emissiveMap = moltenEmissiveTex;
        mat.emissiveIntensity = 1.85;
        mat.roughnessMap = steelRoughBumpTex;
        mat.bumpMap = galvBumpTex;
        mat.bumpScale = 0.036;
        mat.roughness = 0.72;
        mat.metalness = 0.42;
        mat.clearcoat = 0.05;
        mat.envMapIntensity = 0.24;
        st.backMat.color.set('#120B09');
      } else if (preset === 'enamel') {
        // Put the crisp riveted IS 807 specification badge cleanly on solid 'I' (idx === 2)
        mat.map = idx === 2 ? enamelStencilTex : null;
        mat.color.set(idx === 2 ? '#FFFFFF' : ENAMEL_PALETTE[idx]);
        mat.bumpMap = steelRoughBumpTex;
        mat.bumpScale = 0.004;
        mat.roughness = 0.16;
        mat.metalness = 0.14;
        mat.clearcoat = 0.92;
        mat.clearcoatRoughness = 0.10;
        mat.envMapIntensity = 0.96;
        st.backMat.color.set(idx === 0 || idx === 4 ? '#755303' : '#101F3A');
      } else if (preset === 'cad') {
        mat.map = blueprintTex;
        mat.color.set('#FFFFFF');
        mat.roughness = 0.72;
        mat.metalness = 0.12;
        mat.clearcoat = 0.0;
        mat.envMapIntensity = 0.36;
        bpLine.visible = true;
        st.backMat.color.set('#0D234A');
      } else if (preset === 'galvanized') {
        mat.map = galvTex;
        mat.color.set('#EDF2F7');
        mat.roughnessMap = galvBumpTex;
        mat.bumpMap = galvBumpTex;
        mat.bumpScale = 0.028;
        mat.roughness = 0.32;
        mat.metalness = 0.90;
        mat.clearcoat = 0.22;
        mat.clearcoatRoughness = 0.30;
        mat.envMapIntensity = 1.28;
        st.backMat.color.set('#404D5C');
      }
      mat.needsUpdate = true;
    });
  }

  function applyTheme(preset, immediate = false) {
    const dir = THEME_DIRECTORS[preset] || THEME_DIRECTORS['raw-steel'];
    applyThemeMaterials(preset);
    computeResponsiveCamTargets(dir);

    targetFogColor.setHex(dir.fogColor);
    targetFogDensity = dir.fogDensity;
    targetExposure = dir.exposure;
    targetHemiSky.setHex(dir.hemiSky);
    targetHemiGround.setHex(dir.hemiGround);
    targetHemiInt = dir.hemiInt;
    targetKeyColor.setHex(dir.keyColor);
    targetKeyInt = dir.keyInt;
    targetKeyPos.set(dir.keyPos[0], dir.keyPos[1], dir.keyPos[2]);
    targetRimColor.setHex(dir.rimColor);
    targetRimInt = dir.rimInt;
    targetRimPos.set(dir.rimPos[0], dir.rimPos[1], dir.rimPos[2]);
    targetUnderColor.setHex(dir.underColor);
    targetUnderInt = dir.underInt;
    targetFloorColor.setHex(dir.floorColor);
    targetFloorRoughness = dir.floorRoughness;
    targetFloorMetalness = dir.floorMetalness;
    targetFloorOpacity = dir.floorOpacity;
    targetFloorEnvInt = dir.floorEnvInt;
    targetShadowOpacity = dir.shadowOpacity;

    // Immediately hide inactive rigs so no props bleed between switches
    Object.entries(propRigs).forEach(([key, rig]) => {
      const active = key === dir.rig;
      if (!active) {
        rig.mix = 0;
        rig.root.visible = false;
        rig.root.position.y = rig.hideY;
      } else if (immediate) {
        rig.mix = 1;
        rig.root.visible = true;
        rig.root.position.y = rig.restY;
      }
    });

    if (immediate) {
      camCurrentPos.copy(camTargetPos);
      camCurrentLook.copy(camTargetLook);
      camera.position.copy(camCurrentPos);
      camera.fov = targetFov;
      camera.lookAt(camCurrentLook);
      camera.updateProjectionMatrix();

      scene.fog.color.copy(targetFogColor);
      scene.fog.density = targetFogDensity;
      renderer.toneMappingExposure = targetExposure;
      hemiLight.color.copy(targetHemiSky);
      hemiLight.groundColor.copy(targetHemiGround);
      hemiLight.intensity = targetHemiInt;
      keyLight.color.copy(targetKeyColor);
      keyLight.intensity = targetKeyInt;
      keyLight.position.copy(targetKeyPos);
      rimLight.color.copy(targetRimColor);
      rimLight.intensity = targetRimInt;
      rimLight.position.copy(targetRimPos);
      underGlowLight.color.copy(targetUnderColor);
      underGlowLight.intensity = targetUnderInt;
      floorMat.color.copy(targetFloorColor);
      floorMat.roughness = targetFloorRoughness;
      floorMat.metalness = targetFloorMetalness;
      floorMat.opacity = targetFloorOpacity;
      floorMat.envMapIntensity = targetFloorEnvInt;
      shadowMat.opacity = targetShadowOpacity;
    }

    renderer.render(scene, camera);
    startLoop();
  }

  /* ==========================================================================
     RESIZE & CAMERA FRAMING
     ========================================================================== */
  function resizeScene() {
    const rect = mount.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    camera.aspect = w / h;

    const dir = THEME_DIRECTORS[activePreset] || THEME_DIRECTORS['raw-steel'];
    computeResponsiveCamTargets(dir);
    camCurrentPos.copy(camTargetPos);
    camCurrentLook.copy(camTargetLook);
    camera.position.copy(camCurrentPos);
    camera.fov = targetFov;
    camera.lookAt(camCurrentLook);
    camera.updateProjectionMatrix();

    const heroDprCap = window.innerWidth < 600 ? 1.5 : 2;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, heroDprCap));
    renderer.setSize(w, h, false);
    renderer.render(scene, camera);
  }

  /* ==========================================================================
     INTERACTION: RAYCAST POINTER DRAG + SPRING PHYSICS + PARALLAX
     ========================================================================== */
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hitWorld = new THREE.Vector3();
  const dragOffset = new THREE.Vector3();
  const groupOrigin = new THREE.Vector3();

  let dragIndex = -1;
  let pointerHoverX = 0;
  let pointerHoverY = 0;

  function updateNdc(ev) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointerNdc.x = ((ev.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    pointerNdc.y = -((ev.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
  }

  function onPointerDown(ev) {
    updateNdc(ev);
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(raycastTargets, false);
    if (!hits.length) return;

    dragIndex = hits[0].object.userData.letterIndex;
    const st = letterStates[dragIndex];
    dragPlane.setFromNormalAndCoplanarPoint(
      camera.getWorldDirection(groupOrigin).negate(),
      st.group.getWorldPosition(hitWorld)
    );

    if (raycaster.ray.intersectPlane(dragPlane, hitWorld)) {
      dragOffset.copy(st.group.position).sub(hitWorld);
    }

    mount.classList.add('is-dragging');
    renderer.domElement.setPointerCapture?.(ev.pointerId);
    startLoop();
  }

  function onPointerMove(ev) {
    if (!heroInView && dragIndex < 0) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointerHoverX = ((ev.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
    pointerHoverY = ((ev.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;

    if (dragIndex >= 0) {
      updateNdc(ev);
      raycaster.setFromCamera(pointerNdc, camera);
      if (raycaster.ray.intersectPlane(dragPlane, hitWorld)) {
        const st = letterStates[dragIndex];
        const nextX = THREE.MathUtils.clamp(hitWorld.x + dragOffset.x, st.cfg.x - 1.85, st.cfg.x + 1.85);
        const nextY = THREE.MathUtils.clamp(hitWorld.y + dragOffset.y, -0.72, 1.75);
        st.target.set(nextX, nextY, 0.72);
        st.targetRot.set(
          THREE.MathUtils.clamp((nextY - st.cfg.y) * -0.25, -0.45, 0.45),
          st.cfg.rotY + (nextX - st.cfg.x) * 0.28,
          st.cfg.rotZ + (nextX - st.cfg.x) * -0.14
        );

        letterStates.forEach((other, j) => {
          if (j === dragIndex) return;
          const dist = Math.abs(other.cfg.x - st.cfg.x);
          if (dist < 2.2) {
            const sign = other.cfg.x < st.cfg.x ? -1 : 1;
            const push = (1 - dist / 2.2) * 0.22;
            other.target.set(other.cfg.x + sign * push, other.cfg.y, -0.12);
            other.targetRot.z = other.cfg.rotZ - sign * 0.08;
          }
        });
      }
      startLoop();
      return;
    }

    updateNdc(ev);
    raycaster.setFromCamera(pointerNdc, camera);
    const hoverHits = raycaster.intersectObjects(raycastTargets, false);
    mount.classList.toggle('is-hovering', hoverHits.length > 0);
    if (!prefersReducedMotion()) startLoop();
  }

  function releaseDrag(ev) {
    if (dragIndex < 0) return;
    letterStates.forEach((st) => {
      st.target.set(st.cfg.x, st.cfg.y, 0);
      st.targetRot.set(0, st.cfg.rotY, st.cfg.rotZ);
    });
    dragIndex = -1;
    mount.classList.remove('is-dragging');
    renderer.domElement.releasePointerCapture?.(ev.pointerId);
    startLoop();
  }

  function triggerLetterWave(focusIdx = -1) {
    if (prefersReducedMotion()) return;
    letterStates.forEach((st, i) => {
      const boost = focusIdx === -1 ? 1.8 + i * 0.24 : (i === focusIdx ? 3.4 : 0.9);
      st.vel.y += boost;
      st.rotVel.y += (i % 2 === 0 ? 1 : -1) * (i === focusIdx ? 2.4 : 0.65);
      st.target.set(st.cfg.x, st.cfg.y, 0);
      st.targetRot.set(0, st.cfg.rotY, st.cfg.rotZ);
    });
    startLoop();
  }

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', releaseDrag);
  window.addEventListener('pointercancel', releaseDrag);

  onPresetChanged = (preset) => applyTheme(preset, prefersReducedMotion());
  onWaveRequested = (idx) => triggerLetterWave(idx);

  /* ==========================================================================
     RENDER LOOP (SPRING PHYSICS + REALISTIC WORKSHOP ENVIRONMENT MOTION)
     ========================================================================== */
  let frameId = 0;
  let running = false;
  let prevTime = performance.now();
  let elapsedSim = 0;

  let heroInView = true;

  function afterDraw(cb) {
    const gl = renderer.getContext();
    if (!gl || typeof gl.fenceSync !== 'function') {
      frameId = window.setTimeout(cb, 100);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    let polls = 0;
    const poll = () => {
      polls += 1;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED && polls < 200) {
        frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 95);
      }
    };
    frameId = window.setTimeout(poll, 5);
  }

  function stepScene(dt) {
    const clampedDt = Math.min(dt, 0.045);
    const uiDt = Math.min(Math.max(dt, 0.016), 0.35);
    elapsedSim += uiDt;
    const dir = THEME_DIRECTORS[activePreset] || THEME_DIRECTORS['raw-steel'];

    const stiffness = 135;
    const damping = 16;
    const rotStiffness = 120;
    const rotDamping = 14;
    let moving = dragIndex >= 0;

    // 1. Letter Spring Physics
    for (let i = 0; i < letterStates.length; i += 1) {
      const st = letterStates[i];
      const fx = (st.target.x - st.pos.x) * stiffness - st.vel.x * damping;
      const fy = (st.target.y - st.pos.y) * stiffness - st.vel.y * damping;
      const fz = (st.target.z - st.pos.z) * stiffness - st.vel.z * damping;

      st.vel.x += fx * clampedDt;
      st.vel.y += fy * clampedDt;
      st.vel.z += fz * clampedDt;

      st.pos.x += st.vel.x * clampedDt;
      st.pos.y += st.vel.y * clampedDt;
      st.pos.z += st.vel.z * clampedDt;

      const rfx = (st.targetRot.x - st.rot.x) * rotStiffness - st.rotVel.x * rotDamping;
      const rfy = (st.targetRot.y - st.rot.y) * rotStiffness - st.rotVel.y * rotDamping;
      const rfz = (st.targetRot.z - st.rot.z) * rotStiffness - st.rotVel.z * rotDamping;

      st.rotVel.x += rfx * clampedDt;
      st.rotVel.y += rfy * clampedDt;
      st.rotVel.z += rfz * clampedDt;

      st.rot.x += st.rotVel.x * clampedDt;
      st.rot.y += st.rotVel.y * clampedDt;
      st.rot.z += st.rotVel.z * clampedDt;

      st.group.position.copy(st.pos);
      st.group.rotation.set(st.rot.x, st.rot.y, st.rot.z);

      const lift = Math.max(0, st.pos.y - st.cfg.y);
      st.contactMesh.position.x = st.pos.x;
      st.contactMesh.position.z = st.pos.z;
      const shadowScale = Math.max(0.45, 1 - lift * 0.25);
      st.contactMesh.scale.set(shadowScale, shadowScale, 1);
      st.contactMesh.material.opacity = Math.max(0.16, 0.65 - lift * 0.22);

      if (
        st.vel.lengthSq() > 1e-4 ||
        st.rotVel.lengthSq() > 1e-4 ||
        st.pos.distanceToSquared(st.target) > 1e-5
      ) {
        moving = true;
      }
    }

    // 2. Camera keeps steady locked pose across all themes
    const camSpeed = 8.5;
    camCurrentPos.x = THREE.MathUtils.damp(camCurrentPos.x, camTargetPos.x, camSpeed, uiDt);
    camCurrentPos.y = THREE.MathUtils.damp(camCurrentPos.y, camTargetPos.y, camSpeed, uiDt);
    camCurrentPos.z = THREE.MathUtils.damp(camCurrentPos.z, camTargetPos.z, camSpeed, uiDt);
    camCurrentLook.x = THREE.MathUtils.damp(camCurrentLook.x, camTargetLook.x, camSpeed, uiDt);
    camCurrentLook.y = THREE.MathUtils.damp(camCurrentLook.y, camTargetLook.y, camSpeed, uiDt);
    camCurrentLook.z = THREE.MathUtils.damp(camCurrentLook.z, camTargetLook.z, camSpeed, uiDt);
    camera.position.copy(camCurrentPos);
    camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, camSpeed, uiDt);
    camera.lookAt(camCurrentLook);
    camera.updateProjectionMatrix();

    // 3. Lighting, Floor & Fog Transitions (real wall-clock uiDt so SwiftShader & GPU stay crisp)
    const lightSpeed = 9.5;
    const lerpFactor = 1 - Math.exp(-lightSpeed * uiDt);
    scene.fog.color.lerp(targetFogColor, lerpFactor);
    scene.fog.density = THREE.MathUtils.damp(scene.fog.density, targetFogDensity, lightSpeed, uiDt);
    renderer.toneMappingExposure = THREE.MathUtils.damp(renderer.toneMappingExposure, targetExposure, lightSpeed, uiDt);

    hemiLight.color.lerp(targetHemiSky, lerpFactor);
    hemiLight.groundColor.lerp(targetHemiGround, lerpFactor);
    hemiLight.intensity = THREE.MathUtils.damp(hemiLight.intensity, targetHemiInt, lightSpeed, uiDt);

    keyLight.color.lerp(targetKeyColor, lerpFactor);
    keyLight.intensity = THREE.MathUtils.damp(keyLight.intensity, targetKeyInt, lightSpeed, uiDt);
    keyLight.position.lerp(targetKeyPos, lerpFactor);

    rimLight.color.lerp(targetRimColor, lerpFactor);
    rimLight.intensity = THREE.MathUtils.damp(rimLight.intensity, targetRimInt, lightSpeed, uiDt);
    rimLight.position.lerp(targetRimPos, lerpFactor);

    underGlowLight.color.lerp(targetUnderColor, lerpFactor);
    const furnaceFlicker = activePreset === 'molten-heat' && !prefersReducedMotion()
      ? 0.35 * Math.sin(elapsedSim * 4.8)
      : 0;
    underGlowLight.intensity = THREE.MathUtils.damp(
      underGlowLight.intensity,
      Math.max(0, targetUnderInt + furnaceFlicker),
      lightSpeed,
      uiDt
    );

    floorMat.color.lerp(targetFloorColor, lerpFactor);
    floorMat.roughness = THREE.MathUtils.damp(floorMat.roughness, targetFloorRoughness, lightSpeed, uiDt);
    floorMat.metalness = THREE.MathUtils.damp(floorMat.metalness, targetFloorMetalness, lightSpeed, uiDt);
    floorMat.opacity = THREE.MathUtils.damp(floorMat.opacity, targetFloorOpacity, lightSpeed, uiDt);
    floorMat.envMapIntensity = THREE.MathUtils.damp(floorMat.envMapIntensity, targetFloorEnvInt, lightSpeed, uiDt);
    shadowMat.opacity = THREE.MathUtils.damp(shadowMat.opacity, targetShadowOpacity, lightSpeed, uiDt);

    // 4. Environment Rig Entrance & Subtle Industrial Motion
    Object.entries(propRigs).forEach(([key, rig]) => {
      const targetMix = key === dir.rig ? 1 : 0;
      rig.mix = THREE.MathUtils.damp(rig.mix, targetMix, 12.0, uiDt);
      if (Math.abs(rig.mix - targetMix) > 0.004) {
        moving = true;
      }
      rig.root.visible = rig.mix > 0.015;
      rig.root.position.y = THREE.MathUtils.lerp(rig.hideY, rig.restY, rig.mix);
    });

    if (!prefersReducedMotion()) {
      const targetGroupRotY = pointerHoverX * 0.045;
      const targetGroupRotX = pointerHoverY * -0.03;
      const nextY = THREE.MathUtils.damp(svindGroup.rotation.y, targetGroupRotY, 6, clampedDt);
      const nextX = THREE.MathUtils.damp(svindGroup.rotation.x, targetGroupRotX, 6, clampedDt);
      if (Math.abs(nextY - svindGroup.rotation.y) > 1e-4 || Math.abs(nextX - svindGroup.rotation.x) > 1e-4) {
        moving = true;
      }
      svindGroup.rotation.y = nextY;
      svindGroup.rotation.x = nextX;

      // Gentle balanced hoist crab traverse centered near the I-monolith
      if (activePreset === 'raw-steel' && propRigs.girders.root.visible) {
        propRigs.girders.crabGroup.position.x = GANTRY_DIMS.hookRestX + Math.sin(elapsedSim * 0.26) * 0.42;
        moving = true;
      }

      // Soft buoyant thermal convection sparks in Molten Heat bay
      if (activePreset === 'molten-heat' && propRigs.sparks.root.visible) {
        const { sparkGeo, sparkMeta } = propRigs.sparks;
        const posAttr = sparkGeo.attributes.position;
        for (let i = 0; i < sparkMeta.length; i += 1) {
          const sm = sparkMeta[i];
          const cyc = (sm.yOffset + elapsedSim * sm.speed) % 4.5;
          posAttr.setXYZ(
            i,
            sm.x + Math.sin(elapsedSim * 1.6 + i) * sm.sway,
            -1.42 + cyc,
            sm.z + Math.cos(elapsedSim * 1.2 + i) * 0.08
          );
        }
        posAttr.needsUpdate = true;
        moving = true;
      }
    }

    return moving;
  }

  function renderFrame() {
    if (!heroInView && dragIndex < 0) {
      running = false;
      return;
    }
    const now = performance.now();
    const dt = (now - prevTime) / 1000;
    prevTime = now;

    const keepRunning = stepScene(dt);
    renderer.render(scene, camera);

    if (keepRunning && running) {
      if (isSoftwareGl) afterDraw(renderFrame);
      else frameId = window.requestAnimationFrame(renderFrame);
    } else {
      running = false;
    }
  }

  function startLoop() {
    if (running || (!heroInView && dragIndex < 0)) return;
    running = true;
    prevTime = performance.now();
    if (isSoftwareGl) afterDraw(renderFrame);
    else frameId = window.requestAnimationFrame(renderFrame);
  }

  const io = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        heroInView = entry.isIntersecting;
        if (!heroInView && dragIndex < 0) {
          running = false;
          window.cancelAnimationFrame(frameId);
          window.clearTimeout(frameId);
          return;
        }
        if (heroInView && !prefersReducedMotion()) {
          startLoop();
        }
      }, { rootMargin: '120px 0px', threshold: 0.01 })
    : null;
  io?.observe(section);

  function onContextLost(ev) {
    ev.preventDefault();
    running = false;
    window.cancelAnimationFrame(frameId);
    window.clearTimeout(frameId);
    activateFallback();
  }
  renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);

  const ro = new ResizeObserver(resizeScene);
  ro.observe(mount);
  window.addEventListener('resize', resizeScene, { passive: true });
  resizeScene();
  window.requestAnimationFrame(resizeScene);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(resizeScene);
  }

  selectPreset('raw-steel');
  applyTheme('raw-steel', true);

  if (!isSoftwareGl) {
    try {
      renderer.compile(scene, camera);
    } catch {
      // Non-fatal on restricted GPU drivers
    }
  }

  renderer.render(scene, camera);
  if (!prefersReducedMotion()) {
    startLoop();
  }

  window.addEventListener('pagehide', () => {
    running = false;
    window.cancelAnimationFrame(frameId);
    window.clearTimeout(frameId);
    ro.disconnect();
    io?.disconnect();
    window.removeEventListener('resize', resizeScene);
    renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
    renderer.domElement.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', releaseDrag);
    window.removeEventListener('pointercancel', releaseDrag);
    disposables.forEach((d) => d.dispose?.());
    envTarget?.dispose?.();
    renderer.dispose();
  }, { once: true });
}
