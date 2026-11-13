import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const isSoftwareGl = (() => {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
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

function mountSvgFallbackWordmark(mount, section) {
  if (!mount || mount.querySelector('.sv-hero3d__fallback')) return { setPreset: () => {}, wave: () => {} };
  mount.innerHTML = `
    <div class="sv-hero3d__fallback" aria-hidden="true">
      <svg viewBox="0 0 1120 340" role="presentation" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="svf-swirl" patternUnits="userSpaceOnUse" width="180" height="220">
            <rect width="180" height="220" fill="#DC6E37"/>
            <path d="M-20,60 C45,10 115,110 200,50 L200,110 C115,160 45,65 -20,120 Z" fill="#F2B182"/>
            <path d="M-20,160 C55,115 125,215 200,155 L200,210 C120,255 45,170 -20,215 Z" fill="#F2B182"/>
          </pattern>
          <pattern id="svf-blueprint" patternUnits="userSpaceOnUse" width="32" height="32">
            <rect width="32" height="32" fill="#4B88A6"/>
            <path d="M32 0H0v32" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1"/>
          </pattern>
        </defs>
        <g class="sv-hero3d__fallback-letter" data-idx="0" transform="translate(26,34)">
          <path d="M168,46 C140,18 62,16 32,46 C8,70 10,114 48,136 L122,164 C150,176 154,206 130,224 C100,246 42,240 16,214 L0,256 C36,288 124,292 164,258 C200,226 196,158 148,134 L74,104 C50,94 50,68 74,56 C100,44 134,54 152,72 Z" transform="translate(10,16)" fill="#2D6125"/>
          <path d="M168,46 C140,18 62,16 32,46 C8,70 10,114 48,136 L122,164 C150,176 154,206 130,224 C100,246 42,240 16,214 L0,256 C36,288 124,292 164,258 C200,226 196,158 148,134 L74,104 C50,94 50,68 74,56 C100,44 134,54 152,72 Z" fill="#468E3B" stroke="rgba(255,255,255,0.28)" stroke-width="4"/>
        </g>
        <g class="sv-hero3d__fallback-letter" data-idx="1" transform="translate(232,32)">
          <polygon points="10,14 78,14 108,148 138,14 206,14 148,266 68,266" transform="translate(10,16)" fill="#A64D21" stroke="#A64D21" stroke-width="26" stroke-linejoin="round"/>
          <polygon points="10,14 78,14 108,148 138,14 206,14 148,266 68,266" fill="url(#svf-swirl)" stroke="url(#svf-swirl)" stroke-width="26" stroke-linejoin="round"/>
        </g>
        <g class="sv-hero3d__fallback-letter" data-idx="2" transform="translate(468,32)">
          <path d="M12,98 A74,74 0 0 1 160,98 L160,268 L12,268 Z" transform="translate(10,16)" fill="#B4638E" stroke="#B4638E" stroke-width="18" stroke-linejoin="round"/>
          <path d="M12,98 A74,74 0 0 1 160,98 L160,268 L12,268 Z" fill="#DE90B8" stroke="rgba(255,255,255,0.26)" stroke-width="6" stroke-linejoin="round"/>
        </g>
        <g class="sv-hero3d__fallback-letter" data-idx="3" transform="translate(664,32)">
          <polygon points="10,266 10,14 76,14 138,136 138,14 202,14 202,266 138,266 74,142 74,266" transform="translate(10,16)" fill="#2E5B72" stroke="#2E5B72" stroke-width="24" stroke-linejoin="round"/>
          <polygon points="10,266 10,14 76,14 138,136 138,14 202,14 202,266 138,266 74,142 74,266" fill="url(#svf-blueprint)" stroke="rgba(255,255,255,0.22)" stroke-width="20" stroke-linejoin="round"/>
        </g>
        <g class="sv-hero3d__fallback-letter" data-idx="4" transform="translate(894,32)">
          <path d="M14,14 L104,14 C178,14 206,68 206,140 C206,212 178,266 104,266 L14,266 Z M76,84 L76,196 L102,196 C132,196 142,174 142,140 C142,106 132,84 102,84 Z" fill-rule="evenodd" transform="translate(10,16)" fill="#BD8F28" stroke="#BD8F28" stroke-width="20" stroke-linejoin="round"/>
          <path d="M14,14 L104,14 C178,14 206,68 206,140 C206,212 178,266 104,266 L14,266 Z M76,84 L76,196 L102,196 C132,196 142,174 142,140 C142,106 132,84 102,84 Z" fill-rule="evenodd" fill="#F0C04E" stroke="rgba(255,255,255,0.26)" stroke-width="14" stroke-linejoin="round"/>
        </g>
      </svg>
    </div>
  `;
  const letters = Array.from(mount.querySelectorAll('.sv-hero3d__fallback-letter'));
  const clayPalette = ['#468E3B', 'url(#svf-swirl)', '#DE90B8', 'url(#svf-blueprint)', '#F0C04E'];
  const wave = (focusIdx = -1) => {
    letters.forEach((el, idx) => {
      const dy = focusIdx === -1 ? -12 : (idx === focusIdx ? -18 : -5);
      el.style.transform = `translateY(${dy}px)`;
      window.setTimeout(() => { el.style.transform = ''; }, 280 + idx * 40);
    });
  };
  const setPreset = (preset) => {
    letters.forEach((el, idx) => {
      const shape = el.children[1];
      if (!shape) return;
      if (preset === 'blueprint') shape.setAttribute('fill', '#CBE3F4');
      else if (preset === 'steel') shape.setAttribute('fill', idx === 3 ? '#466796' : '#AEB8C6');
      else if (preset === 'terracotta') shape.setAttribute('fill', 'url(#svf-swirl)');
      else shape.setAttribute('fill', clayPalette[idx]);
    });
  };
  return { setPreset, wave, section };
}

/* ==========================================================================
   PROCEDURAL TEXTURE GENERATORS (Zero external assets, SRGBColorSpace)
   ========================================================================== */
function makeClayBumpTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle organic clay stipple & sculpted thumb-press grain
  for (let i = 0; i < 4200; i += 1) {
    const x = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * 256;
    const y = (Math.sin(i * 78.233) * 19341.123 % 1 + 1) % 1 * 256;
    const shade = 112 + (i % 34);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(x, y, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function makeSwirlTexture(baseHex, bandHex, maxAnisotropy) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  // Flowing organic terracotta / peach contour waves matching IMG_8030 'R' block
  ctx.fillStyle = bandHex;
  ctx.beginPath();
  ctx.moveTo(-40, 140);
  ctx.bezierCurveTo(130, 50, 260, 250, 410, 150);
  ctx.bezierCurveTo(490, 95, 540, 175, 560, 250);
  ctx.bezierCurveTo(430, 290, 310, 190, 180, 285);
  ctx.bezierCurveTo(80, 355, -20, 240, -40, 220);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-40, 360);
  ctx.bezierCurveTo(140, 295, 290, 445, 455, 345);
  ctx.bezierCurveTo(510, 312, 545, 385, 560, 465);
  ctx.bezierCurveTo(400, 495, 250, 390, 100, 470);
  ctx.bezierCurveTo(20, 510, -25, 445, -40, 425);
  ctx.closePath();
  ctx.fill();

  // Soft painterly speckling
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i < 600; i += 1) {
    const x = (i * 73) % 512;
    const y = (i * 137) % 512;
    ctx.fillRect(x, y, 3, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function makeBlueprintScriptTexture(bgHex, inkHex, maxAnisotropy) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle architectural grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1.5;
  for (let g = 32; g < 512; g += 48) {
    ctx.beginPath();
    ctx.moveTo(g, 0);
    ctx.lineTo(g, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, g);
    ctx.lineTo(512, g);
    ctx.stroke();
  }

  // Flowing dark cursive engineering notes matching IMG_8030 blue 'F' block
  ctx.save();
  ctx.translate(256, 256);
  ctx.rotate(-0.14);
  ctx.fillStyle = inkHex;
  ctx.font = 'italic 600 62px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  const notes = ['IS 807', 'Hoist', 'Girder', '100+ T', 'Load'];
  notes.forEach((word, idx) => {
    ctx.globalAlpha = idx % 2 === 0 ? 0.56 : 0.36;
    ctx.fillText(word, (idx % 2 === 0 ? -18 : 24), -145 + idx * 78);
  });
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function makeBrushedMetalTexture(baseHex, streakHex, maxAnisotropy) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = streakHex;
  ctx.lineWidth = 1;
  for (let y = 0; y < 256; y += 2) {
    ctx.globalAlpha = 0.08 + ((y * 17) % 10) * 0.015;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function makeContactShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(128, 64, 12, 128, 64, 118);
  grad.addColorStop(0, 'rgba(18, 28, 42, 0.36)');
  grad.addColorStop(0.55, 'rgba(18, 28, 42, 0.14)');
  grad.addColorStop(1, 'rgba(18, 28, 42, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 128);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

/* ==========================================================================
   SCULPTED CHUNKY LETTER SILHOUETTES ("S V I N D")
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

  // Round caps at start and end of ribbon
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
  // Ensure CCW orientation cleanly via Three Shape
  shape.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i += 1) {
    shape.lineTo(poly[i].x, poly[i].y);
  }
  shape.closePath();
  return shape;
}

function buildRoundedPolygonShape(pts, cornerRadius = 0.12) {
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

    const r = Math.min(cornerRadius, l1 * 0.42, l2 * 0.42);
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
      ], 0.31, 56);

    case 'V':
      return buildRoundedPolygonShape([
        [-0.84, 1.14],
        [-0.22, 1.14],
        [0.00, 0.14],
        [0.22, 1.14],
        [0.84, 1.14],
        [0.30, -1.12],
        [-0.30, -1.12]
      ], 0.22);

    case 'I': {
      // Sculpted rounded arch monolith matching the lush central pink 'A' presence
      const shape = new THREE.Shape();
      const w = 0.56;
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
      ], 0.18);

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

      // Clean CW/CCW inner cutout hole for unmistakable D silhouette
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
   SPEC METADATA FOR FLOATING CORNER TILES
   ========================================================================== */
const TILE_SPECS = {
  is807: {
    title: 'IS 807 & IS 3177 Duty Class',
    text: 'Engineered from Class II (M5) workshop cranes to Class IV (M8) continuous steel-mill duty.',
    letterIndex: 0
  },
  girder: {
    title: '100+ T Double-Girder Box',
    text: 'In-house submerged-arc welded box girders up to 36 m span at Harohalli KIADB.',
    letterIndex: 1
  },
  fat: {
    title: 'Witnessed Factory Load Test',
    text: '125% proof-load, deflection & brake verification completed before bay dispatch.',
    letterIndex: 3
  },
  amc: {
    title: '24/7 OEM Service & Spares',
    text: 'Direct Bengaluru field engineers with serialized hoists, brakes and gearbox assemblies.',
    letterIndex: 4
  }
};

/* ==========================================================================
   MAIN HERO CONTROLLER
   ========================================================================== */
export function initHero3D() {
  const section = document.querySelector('#hero-3d');
  const mount = document.querySelector('#sv-hero3d-mount');
  if (!section || !mount) return;

  // Bind UI controls first so swatch presets, inspector card & spec tiles work in both WebGL and SVG fallback
  let onPresetChanged = null;
  let onCoverChanged = null;
  let onWaveRequested = null;
  let onResetRequested = null;
  let activePreset = 'clay';
  let coverEnabled = true;

  const swatchBtns = Array.from(section.querySelectorAll('.sv-hero3d__swatch[data-preset]'));
  const specTiles = Array.from(section.querySelectorAll('.sv-hero3d__tile[data-spec]'));
  const specPop = section.querySelector('#sv-hero3d-spec-pop');
  const specTitleEl = section.querySelector('#sv-hero3d-spec-title');
  const specBodyEl = section.querySelector('#sv-hero3d-spec-body');

  function selectPreset(preset) {
    activePreset = preset;
    swatchBtns.forEach((btn) => {
      const isActive = btn.dataset.preset === preset;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    onPresetChanged?.(preset);
  }

  swatchBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      selectPreset(btn.dataset.preset || 'clay');
      onWaveRequested?.(-1);
    });
  });

  const presetsOrder = ['clay', 'blueprint', 'steel', 'enamel', 'terracotta'];
  const backdropsOrder = ['sky', 'paper', 'mist', 'blush'];
  const typefacesOrder = ['display', 'mono', 'editorial'];

  const paletteBtn = section.querySelector('[data-hero-action="palette"]');
  const backdropBtn = section.querySelector('[data-hero-action="backdrop"]');
  const coverBtn = section.querySelector('[data-hero-action="cover"]');
  const typeBtn = section.querySelector('[data-hero-action="typeface"]');
  const cloudsBtn = section.querySelector('[data-hero-action="clouds"]');
  const resetBtn = section.querySelector('[data-hero-action="reset"]');

  paletteBtn?.addEventListener('click', () => {
    const next = presetsOrder[(presetsOrder.indexOf(activePreset) + 1) % presetsOrder.length];
    selectPreset(next);
    const valEl = paletteBtn.querySelector('.sv-hero3d__bento-sample');
    if (valEl) valEl.textContent = next.charAt(0).toUpperCase() + next.slice(1);
    onWaveRequested?.(-1);
  });

  backdropBtn?.addEventListener('click', () => {
    const curr = section.dataset.backdrop || 'sky';
    const next = backdropsOrder[(backdropsOrder.indexOf(curr) + 1) % backdropsOrder.length];
    section.dataset.backdrop = next;
    const valEl = backdropBtn.querySelector('.sv-hero3d__bento-sample');
    if (valEl) valEl.textContent = next.charAt(0).toUpperCase() + next.slice(1);
  });

  coverBtn?.addEventListener('click', () => {
    coverEnabled = !coverEnabled;
    coverBtn.classList.toggle('is-active', coverEnabled);
    coverBtn.setAttribute('aria-pressed', coverEnabled ? 'true' : 'false');
    const valEl = coverBtn.querySelector('.sv-hero3d__bento-sample');
    if (valEl) valEl.textContent = coverEnabled ? 'Pattern' : 'Solid';
    onCoverChanged?.(activePreset);
  });

  typeBtn?.addEventListener('click', () => {
    const curr = section.dataset.typeface || 'display';
    const next = typefacesOrder[(typefacesOrder.indexOf(curr) + 1) % typefacesOrder.length];
    section.dataset.typeface = next;
    const valEl = typeBtn.querySelector('.sv-hero3d__bento-sample');
    if (valEl) valEl.textContent = next === 'mono' ? 'Mono' : next === 'editorial' ? 'Serif' : 'Sans';
  });

  cloudsBtn?.addEventListener('click', () => {
    const isOff = section.dataset.clouds === 'off';
    section.dataset.clouds = isOff ? 'on' : 'off';
    cloudsBtn.classList.toggle('is-active', isOff);
    cloudsBtn.setAttribute('aria-pressed', isOff ? 'true' : 'false');
    const valEl = cloudsBtn.querySelector('.sv-hero3d__bento-sample');
    if (valEl) valEl.textContent = isOff ? 'Mist On' : 'Mist Off';
  });

  resetBtn?.addEventListener('click', () => {
    onResetRequested?.();
  });

  specTiles.forEach((tile) => {
    tile.addEventListener('click', () => {
      const key = tile.dataset.spec;
      const spec = TILE_SPECS[key];
      if (!spec) return;
      const wasActive = tile.classList.contains('is-active');
      specTiles.forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-pressed', 'false');
      });
      if (wasActive) {
        if (specPop) specPop.hidden = true;
        return;
      }
      tile.classList.add('is-active');
      tile.setAttribute('aria-pressed', 'true');
      if (specTitleEl) specTitleEl.textContent = spec.title;
      if (specBodyEl) specBodyEl.textContent = spec.text;
      if (specPop) specPop.hidden = false;
      onWaveRequested?.(spec.letterIndex);
    });
  });

  const activateFallback = () => {
    const fb = mountSvgFallbackWordmark(mount, section);
    onPresetChanged = (preset) => fb.setPreset(preset);
    onCoverChanged = (preset) => fb.setPreset(preset);
    onWaveRequested = (idx) => fb.wave(idx);
    onResetRequested = () => fb.wave(-1);
    fb.setPreset(activePreset);
  };

  // WebGL initialization with automatic fallback if unavailable
  const renderer = createWebGLRendererSafely();
  if (!renderer) {
    activateFallback();
    return;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mount.innerHTML = '';
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  // Studio environment reflections (PMREM RoomEnvironment guarded so fallback lighting always holds)
  let envTarget = null;
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();
  } catch {
    envTarget = null;
  }

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
  camera.position.set(-0.25, 1.35, 11.2);
  camera.lookAt(0, -0.08, 0);

  // Warm / Cool Studio Lighting Rig (sculpted 3/4 depth shadows matching reference)
  const hemiLight = new THREE.HemisphereLight(0xEDF5FC, 0x7A8490, 0.62);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xFFF6E8, 1.55);
  keyLight.position.set(-3.8, 7.6, 5.6);
  keyLight.castShadow = !isSoftwareGl;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 24;
  keyLight.shadow.camera.left = -7.5;
  keyLight.shadow.camera.right = 7.5;
  keyLight.shadow.camera.top = 4.5;
  keyLight.shadow.camera.bottom = -4.5;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xCFE4F7, 0.48);
  rimLight.position.set(5.5, 2.5, -4.5);
  scene.add(rimLight);

  // Ground shadow receiver plane
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 14),
    new THREE.ShadowMaterial({ opacity: 0.22 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -1.48;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  // Shared procedural textures
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1);
  const clayBumpTex = makeClayBumpTexture();
  const swirlTex = makeSwirlTexture('#DC6E37', '#F2B182', maxAniso);
  const blueprintTex = makeBlueprintScriptTexture('#4B88A6', '#102030', maxAniso);
  const steelTex = makeBrushedMetalTexture('#C8D0DC', '#707E92', maxAniso);
  const contactTex = makeContactShadowTexture();

  // Build 5 multi-part sculpted letter groups ("S V I N D")
  const svindGroup = new THREE.Group();
  svindGroup.rotation.x = -0.08;
  scene.add(svindGroup);

  const LETTER_CONFIGS = [
    { char: 'S', x: -3.72, y: 0.0, rotY: 0.16, rotZ: 0.03, color: '#468E3B', accent: '#2D6125', bumpScale: 0.032 },
    { char: 'V', x: -1.88, y: 0.0, rotY: 0.09, rotZ: -0.015, color: '#DC6E37', accent: '#A64D21', tex: swirlTex, bumpScale: 0.026 },
    { char: 'I', x: -0.14, y: 0.0, rotY: 0.0, rotZ: 0.0, color: '#DE90B8', accent: '#B4638E', bumpScale: 0.028 },
    { char: 'N', x: 1.58, y: 0.0, rotY: -0.09, rotZ: 0.012, color: '#4B88A6', accent: '#2E5B72', tex: blueprintTex, bumpScale: 0.022 },
    { char: 'D', x: 3.52, y: 0.0, rotY: -0.16, rotZ: -0.02, color: '#F0C04E', accent: '#BD8F28', bumpScale: 0.028 }
  ];

  const extrudeSettings = {
    depth: 0.78,
    bevelEnabled: true,
    bevelThickness: 0.17,
    bevelSize: 0.13,
    bevelSegments: 9,
    curveSegments: 22
  };

  const backExtrudeSettings = {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 4,
    curveSegments: 16
  };

  const letterStates = [];
  const raycastTargets = [];
  const disposables = [clayBumpTex, swirlTex, blueprintTex, steelTex, contactTex];

  LETTER_CONFIGS.forEach((cfg, idx) => {
    const group = new THREE.Group();
    group.position.set(cfg.x, cfg.y, 0);
    group.rotation.set(0, cfg.rotY, cfg.rotZ);

    const shape = createLetterShape(cfg.char);

    // Part 1: Main sculpted front body
    const mainGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    mainGeom.center();
    normalizeExtrudeUVs(mainGeom);
    mainGeom.computeVertexNormals();
    disposables.push(mainGeom);

    const mainMat = new THREE.MeshPhysicalMaterial({
      color: cfg.tex ? 0xFFFFFF : new THREE.Color(cfg.color),
      map: cfg.tex || null,
      bumpMap: clayBumpTex,
      bumpScale: cfg.bumpScale,
      roughness: 0.74,
      metalness: 0.03,
      clearcoat: 0.05,
      clearcoatRoughness: 0.7,
      envMapIntensity: 0.42
    });
    disposables.push(mainMat);

    const mainMesh = new THREE.Mesh(mainGeom, mainMat);
    mainMesh.castShadow = !isSoftwareGl;
    mainMesh.receiveShadow = true;
    mainMesh.userData.letterIndex = idx;
    group.add(mainMesh);
    raycastTargets.push(mainMesh);

    // Part 2: Contrasting stepped rear backing slab (multi-part roughness variation >= 0.25)
    const backGeom = new THREE.ExtrudeGeometry(shape, backExtrudeSettings);
    backGeom.center();
    backGeom.computeVertexNormals();
    disposables.push(backGeom);

    const backMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cfg.accent),
      roughness: 0.96,
      metalness: 0.08
    });
    disposables.push(backMat);

    const backMesh = new THREE.Mesh(backGeom, backMat);
    backMesh.scale.set(0.95, 0.95, 1);
    backMesh.position.z = -0.46;
    backMesh.castShadow = !isSoftwareGl;
    group.add(backMesh);

    // Part 3: Grounded soft contact shadow plane beneath letter
    const contactGeom = new THREE.PlaneGeometry(2.35, 1.45);
    disposables.push(contactGeom);
    const contactMat = new THREE.MeshBasicMaterial({
      map: contactTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.76
    });
    disposables.push(contactMat);
    const contactMesh = new THREE.Mesh(contactGeom, contactMat);
    contactMesh.rotation.x = -Math.PI / 2;
    contactMesh.position.set(cfg.x, -1.46, 0);
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
      pos: new THREE.Vector3(cfg.x, cfg.y + (prefersReducedMotion() ? 0 : 0.45 + idx * 0.12), 0),
      vel: new THREE.Vector3(),
      target: new THREE.Vector3(cfg.x, cfg.y, 0),
      rot: new THREE.Vector3(0, cfg.rotY, cfg.rotZ),
      rotVel: new THREE.Vector3(),
      targetRot: new THREE.Vector3(0, cfg.rotY, cfg.rotZ),
      scale: 1
    });

    if (prefersReducedMotion()) {
      group.position.set(cfg.x, cfg.y, 0);
    } else {
      group.position.copy(letterStates[idx].pos);
    }
  });

  // Wireframe blueprint overlay lines (shown only during "blueprint" preset)
  const blueprintLines = letterStates.map((st) => {
    const edges = new THREE.EdgesGeometry(st.mainGeom || st.mainMesh.geometry, 26);
    disposables.push(edges);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x1E3A6B, transparent: true, opacity: 0.55 });
    disposables.push(lineMat);
    const seg = new THREE.LineSegments(edges, lineMat);
    seg.visible = false;
    st.group.add(seg);
    return seg;
  });

  /* ==========================================================================
     FINISH PRESETS & LIVE UI CONTROLS
     ========================================================================== */
  function applyFinishPreset(preset) {
    letterStates.forEach((st, idx) => {
      const mat = st.mainMat;
      const bpLine = blueprintLines[idx];
      bpLine.visible = false;

      if (preset === 'clay') {
        mat.map = coverEnabled ? (st.cfg.tex || null) : null;
        mat.color.set(mat.map ? '#FFFFFF' : st.cfg.color);
        mat.bumpMap = clayBumpTex;
        mat.bumpScale = st.cfg.bumpScale;
        mat.roughness = 0.74;
        mat.metalness = 0.03;
        mat.clearcoat = 0.05;
        mat.wireframe = false;
        st.backMat.color.set(st.cfg.accent);
      } else if (preset === 'blueprint') {
        mat.map = blueprintTex;
        mat.color.set('#EBF5FC');
        mat.bumpMap = null;
        mat.roughness = 0.86;
        mat.metalness = 0.02;
        mat.clearcoat = 0.0;
        bpLine.visible = true;
        st.backMat.color.set('#1E3A6B');
      } else if (preset === 'steel') {
        mat.map = steelTex;
        mat.color.set(idx === 3 ? '#3A5C91' : '#D5DCE6');
        mat.bumpMap = clayBumpTex;
        mat.bumpScale = 0.008;
        mat.roughness = 0.24;
        mat.metalness = 0.88;
        mat.clearcoat = 0.35;
        st.backMat.color.set('#1E2631');
      } else if (preset === 'enamel') {
        mat.map = coverEnabled ? (st.cfg.tex || null) : null;
        mat.color.set(mat.map ? '#FFFFFF' : st.cfg.color);
        mat.bumpMap = null;
        mat.roughness = 0.16;
        mat.metalness = 0.08;
        mat.clearcoat = 0.92;
        mat.clearcoatRoughness = 0.1;
        st.backMat.color.set(st.cfg.accent);
      } else if (preset === 'terracotta') {
        mat.map = swirlTex;
        mat.color.set(idx % 2 === 0 ? '#F4D8C8' : '#FFFFFF');
        mat.bumpMap = clayBumpTex;
        mat.bumpScale = 0.032;
        mat.roughness = 0.78;
        mat.metalness = 0.02;
        mat.clearcoat = 0.05;
        st.backMat.color.set('#8F4322');
      }
      mat.needsUpdate = true;
    });
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
    const aspect = w / h;
    const compact = w < 1024;
    camera.aspect = aspect;
    const halfV = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const minZForWidth = 5.15 / (halfV * Math.max(0.45, aspect));
    camera.position.z = Math.max(11.0, minZForWidth);
    camera.position.y = compact ? 0.45 : 1.35;
    camera.position.x = compact ? 0 : -0.25;
    camera.lookAt(0, compact ? -1.1 : -0.08, 0);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
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
    dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(groupOrigin).negate(), st.group.getWorldPosition(hitWorld));

    if (raycaster.ray.intersectPlane(dragPlane, hitWorld)) {
      dragOffset.copy(st.group.position).sub(hitWorld);
    }

    mount.classList.add('is-dragging');
    renderer.domElement.setPointerCapture?.(ev.pointerId);
    startLoop();
  }

  function onPointerMove(ev) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointerHoverX = ((ev.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
    pointerHoverY = ((ev.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;

    if (dragIndex >= 0) {
      updateNdc(ev);
      raycaster.setFromCamera(pointerNdc, camera);
      if (raycaster.ray.intersectPlane(dragPlane, hitWorld)) {
        const st = letterStates[dragIndex];
        const nextX = THREE.MathUtils.clamp(hitWorld.x + dragOffset.x, st.cfg.x - 1.9, st.cfg.x + 1.9);
        const nextY = THREE.MathUtils.clamp(hitWorld.y + dragOffset.y, -0.75, 1.85);
        st.target.set(nextX, nextY, 0.75);
        st.targetRot.set(
          THREE.MathUtils.clamp((nextY - st.cfg.y) * -0.25, -0.45, 0.45),
          st.cfg.rotY + (nextX - st.cfg.x) * 0.28,
          st.cfg.rotZ + (nextX - st.cfg.x) * -0.14
        );

        // Soft neighbor proximity nudge
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

    // Subtle pointer hover cursor feedback (throttled)
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
    letterStates.forEach((st, i) => {
      const boost = focusIdx === -1 ? 2.4 + i * 0.35 : (i === focusIdx ? 4.4 : 1.1);
      st.vel.y += boost;
      st.rotVel.y += (i % 2 === 0 ? 1 : -1) * (i === focusIdx ? 3.2 : 0.9);
      st.target.set(st.cfg.x, st.cfg.y, 0);
      st.targetRot.set(0, st.cfg.rotY, st.cfg.rotZ);
    });
    startLoop();
  }

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', releaseDrag);
  window.addEventListener('pointercancel', releaseDrag);

  onPresetChanged = (preset) => applyFinishPreset(preset);
  onCoverChanged = (preset) => applyFinishPreset(preset);
  onWaveRequested = (idx) => triggerLetterWave(idx);
  onResetRequested = () => {
    letterStates.forEach((st) => {
      st.target.set(st.cfg.x, st.cfg.y, 0);
      st.targetRot.set(0, st.cfg.rotY, st.cfg.rotZ);
    });
    triggerLetterWave(-1);
  };

  /* ==========================================================================
     RENDER LOOP (SPRING PHYSICS + SOFTWARE-WEBGL SAFE PACING)
     ========================================================================== */
  let frameId = 0;
  let running = false;
  let prevTime = performance.now();

  function afterDraw(cb) {
    const gl = renderer.getContext();
    if (!gl || typeof gl.fenceSync !== 'function') {
      frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    let polls = 0;
    const poll = () => {
      polls += 1;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED && polls < 4) {
        frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 80);
      }
    };
    frameId = window.setTimeout(poll, 5);
  }

  function stepPhysics(dt) {
    const clampedDt = Math.min(dt, 0.045);
    const stiffness = 135;
    const damping = 16;
    const rotStiffness = 120;
    const rotDamping = 14;
    let moving = dragIndex >= 0;

    for (let i = 0; i < letterStates.length; i += 1) {
      const st = letterStates[i];
      // Position spring
      const fx = (st.target.x - st.pos.x) * stiffness - st.vel.x * damping;
      const fy = (st.target.y - st.pos.y) * stiffness - st.vel.y * damping;
      const fz = (st.target.z - st.pos.z) * stiffness - st.vel.z * damping;

      st.vel.x += fx * clampedDt;
      st.vel.y += fy * clampedDt;
      st.vel.z += fz * clampedDt;

      st.pos.x += st.vel.x * clampedDt;
      st.pos.y += st.vel.y * clampedDt;
      st.pos.z += st.vel.z * clampedDt;

      // Rotation spring
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

      // Update contact shadow beneath each block
      const lift = Math.max(0, st.pos.y - st.cfg.y);
      st.contactMesh.position.x = st.pos.x;
      st.contactMesh.position.z = st.pos.z;
      const shadowScale = Math.max(0.45, 1 - lift * 0.25);
      st.contactMesh.scale.set(shadowScale, shadowScale, 1);
      st.contactMesh.material.opacity = Math.max(0.18, 0.62 - lift * 0.22);

      if (
        st.vel.lengthSq() > 1e-4 ||
        st.rotVel.lengthSq() > 1e-4 ||
        st.pos.distanceToSquared(st.target) > 1e-5
      ) {
        moving = true;
      }
    }

    // Gentle parallax tilt of entire wordmark toward cursor
    if (!prefersReducedMotion()) {
      const targetGroupRotY = pointerHoverX * 0.055;
      const targetGroupRotX = pointerHoverY * -0.04;
      const nextY = THREE.MathUtils.damp(svindGroup.rotation.y, targetGroupRotY, 6, clampedDt);
      const nextX = THREE.MathUtils.damp(svindGroup.rotation.x, targetGroupRotX, 6, clampedDt);
      if (Math.abs(nextY - svindGroup.rotation.y) > 1e-4 || Math.abs(nextX - svindGroup.rotation.x) > 1e-4) {
        moving = true;
      }
      svindGroup.rotation.y = nextY;
      svindGroup.rotation.x = nextX;
    }

    return moving;
  }

  function renderFrame() {
    const now = performance.now();
    const dt = (now - prevTime) / 1000;
    prevTime = now;

    const keepRunning = stepPhysics(dt);
    renderer.render(scene, camera);

    if (keepRunning && running) {
      if (isSoftwareGl) afterDraw(renderFrame);
      else frameId = window.requestAnimationFrame(renderFrame);
    } else {
      running = false;
    }
  }

  function startLoop() {
    if (running) return;
    running = true;
    prevTime = performance.now();
    if (isSoftwareGl) afterDraw(renderFrame);
    else frameId = window.requestAnimationFrame(renderFrame);
  }

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

  if (!isSoftwareGl) {
    try {
      renderer.compile(scene, camera);
    } catch {
      // Non-fatal on restricted GPU drivers; draw proceeds on render
    }
  }

  // Render first frame immediately & trigger subtle entrance wave if motion allowed
  renderer.render(scene, camera);
  if (!prefersReducedMotion()) {
    startLoop();
  }

  // Cleanup hook for page unload
  window.addEventListener('pagehide', () => {
    running = false;
    window.cancelAnimationFrame(frameId);
    window.clearTimeout(frameId);
    ro.disconnect();
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
