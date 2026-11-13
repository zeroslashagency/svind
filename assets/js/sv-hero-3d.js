import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const THEME_META = {
  'raw-steel': {
    label: 'Raw Steel \u00b7 Overhead Girder Bay',
    surface: 'light'
  },
  'molten-heat': {
    label: 'Molten Heat \u00b7 Foundry Ladle Duty',
    surface: 'dark'
  },
  enamel: {
    label: 'Enamel \u00b7 Proof-Test Bay',
    surface: 'light'
  },
  cad: {
    label: 'CAD \u00b7 IS 807 Blueprint',
    surface: 'light'
  },
  galvanized: {
    label: 'Galvanized \u00b7 Goliath Runway Yard',
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
            <stop offset="52%" stop-color="#8A97A8"/>
            <stop offset="100%" stop-color="#4A5668"/>
          </linearGradient>
          <pattern id="svf-molten" patternUnits="userSpaceOnUse" width="180" height="220">
            <rect width="180" height="220" fill="#232026"/>
            <path d="M-20,60 C45,18 115,105 200,52" fill="none" stroke="#FF6A1A" stroke-width="10"/>
            <path d="M-15,165 C60,120 130,205 200,155" fill="none" stroke="#FFB84D" stroke-width="6"/>
          </pattern>
          <pattern id="svf-blueprint" patternUnits="userSpaceOnUse" width="32" height="32">
            <rect width="32" height="32" fill="#D4E8FA"/>
            <path d="M32 0H0v32" fill="none" stroke="#1E4C9A" stroke-opacity="0.28" stroke-width="1"/>
          </pattern>
          <linearGradient id="svf-galv" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#DCE4EC"/>
            <stop offset="45%" stop-color="#9BA8B7"/>
            <stop offset="100%" stop-color="#CFD9E2"/>
          </linearGradient>
        </defs>
        <g class="sv-hero3d__fallback-letter" data-idx="0" transform="translate(26,34)">
          <path d="M168,46 C140,18 62,16 32,46 C8,70 10,114 48,136 L122,164 C150,176 154,206 130,224 C100,246 42,240 16,214 L0,256 C36,288 124,292 164,258 C200,226 196,158 148,134 L74,104 C50,94 50,68 74,56 C100,44 134,54 152,72 Z" transform="translate(10,16)" fill="#222B38"/>
          <path d="M168,46 C140,18 62,16 32,46 C8,70 10,114 48,136 L122,164 C150,176 154,206 130,224 C100,246 42,240 16,214 L0,256 C36,288 124,292 164,258 C200,226 196,158 148,134 L74,104 C50,94 50,68 74,56 C100,44 134,54 152,72 Z" fill="url(#svf-steel)" stroke="rgba(255,255,255,0.34)" stroke-width="4"/>
        </g>
        <g class="sv-hero3d__fallback-letter" data-idx="1" transform="translate(232,32)">
          <polygon points="10,14 78,14 108,148 138,14 206,14 148,266 68,266" transform="translate(10,16)" fill="#222B38" stroke="#222B38" stroke-width="26" stroke-linejoin="round"/>
          <polygon points="10,14 78,14 108,148 138,14 206,14 148,266 68,266" fill="url(#svf-steel)" stroke="url(#svf-steel)" stroke-width="26" stroke-linejoin="round"/>
        </g>
        <g class="sv-hero3d__fallback-letter" data-idx="2" transform="translate(468,32)">
          <path d="M12,98 A74,74 0 0 1 160,98 L160,268 L12,268 Z" transform="translate(10,16)" fill="#222B38" stroke="#222B38" stroke-width="18" stroke-linejoin="round"/>
          <path d="M12,98 A74,74 0 0 1 160,98 L160,268 L12,268 Z" fill="url(#svf-steel)" stroke="rgba(255,255,255,0.28)" stroke-width="6" stroke-linejoin="round"/>
        </g>
        <g class="sv-hero3d__fallback-letter" data-idx="3" transform="translate(664,32)">
          <polygon points="10,266 10,14 76,14 138,136 138,14 202,14 202,266 138,266 74,142 74,266" transform="translate(10,16)" fill="#182C4A" stroke="#182C4A" stroke-width="24" stroke-linejoin="round"/>
          <polygon points="10,266 10,14 76,14 138,136 138,14 202,14 202,266 138,266 74,142 74,266" fill="url(#svf-steel)" stroke="rgba(255,255,255,0.24)" stroke-width="20" stroke-linejoin="round"/>
        </g>
        <g class="sv-hero3d__fallback-letter" data-idx="4" transform="translate(894,32)">
          <path d="M14,14 L104,14 C178,14 206,68 206,140 C206,212 178,266 104,266 L14,266 Z M76,84 L76,196 L102,196 C132,196 142,174 142,140 C142,106 132,84 102,84 Z" fill-rule="evenodd" transform="translate(10,16)" fill="#222B38" stroke="#222B38" stroke-width="20" stroke-linejoin="round"/>
          <path d="M14,14 L104,14 C178,14 206,68 206,140 C206,212 178,266 104,266 L14,266 Z M76,84 L76,196 L102,196 C132,196 142,174 142,140 C142,106 132,84 102,84 Z" fill-rule="evenodd" fill="url(#svf-steel)" stroke="rgba(255,255,255,0.28)" stroke-width="14" stroke-linejoin="round"/>
        </g>
      </svg>
    </div>
  `;

  const letters = Array.from(mount.querySelectorAll('.sv-hero3d__fallback-letter'));
  const enamelPalette = ['#F2B705', '#1E3A6B', '#DF6426', '#2B3544', '#F2B705'];

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
        if (back) back.setAttribute('fill', '#142644');
      } else if (preset === 'cad') {
        front.setAttribute('fill', 'url(#svf-blueprint)');
        front.setAttribute('stroke', '#1E4C9A');
        if (back) back.setAttribute('fill', '#1E4C9A');
      } else if (preset === 'galvanized') {
        front.setAttribute('fill', 'url(#svf-galv)');
        front.setAttribute('stroke', 'rgba(255,255,255,0.4)');
        if (back) back.setAttribute('fill', '#526071');
      } else {
        front.setAttribute('fill', idx === 3 ? '#39557E' : 'url(#svf-steel)');
        front.setAttribute('stroke', 'rgba(255,255,255,0.32)');
        if (back) back.setAttribute('fill', '#222B38');
      }
    });
  };

  return { setPreset, wave };
}

/* ==========================================================================
   PROCEDURAL INDUSTRIAL TEXTURE GENERATORS (Zero external assets)
   ========================================================================== */
function makeSteelPlateTexture(maxAnisotropy) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#B8C4D2');
  grad.addColorStop(0.45, '#7E8C9E');
  grad.addColorStop(1, '#526072');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Horizontal rolled-mill brush grain
  for (let y = 0; y < 512; y += 2) {
    const alpha = 0.08 + ((y * 19) % 13) * 0.015;
    ctx.strokeStyle = y % 4 === 0 ? `rgba(255,255,255,${alpha})` : `rgba(14,22,32,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Subtle welded plate seam lines & corner rivets
  ctx.strokeStyle = 'rgba(26, 35, 48, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, 464, 464);
  ctx.beginPath();
  ctx.moveTo(24, 256);
  ctx.lineTo(488, 256);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.34)';
  [46, 256, 466].forEach((x) => {
    [46, 236, 276, 466].forEach((y) => {
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function makeSteelBumpTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    const shade = 114 + ((y * 23) % 28);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(0, y, 256, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function makeMoltenAlbedoTexture(maxAnisotropy) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1E1B1F';
  ctx.fillRect(0, 0, 512, 512);

  // Dark forged iron slag grain
  for (let i = 0; i < 1600; i += 1) {
    const x = (i * 173) % 512;
    const y = (i * 311) % 512;
    const v = 22 + (i % 24);
    ctx.fillStyle = `rgb(${v + 4},${v},${v})`;
    ctx.fillRect(x, y, 4, 3);
  }

  // Glowing thermal fissure veins matching forge ladle crust
  const drawCrack = (pts, width, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i += 1) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.stroke();
  };

  const cracks = [
    [[20, 140], [115, 165], [190, 120], [285, 178], [380, 132], [495, 175]],
    [[45, 360], [140, 320], [225, 382], [320, 336], [425, 378], [495, 340]],
    [[185, 25], [210, 125], [175, 240], [235, 355], [205, 485]],
    [[350, 40], [315, 145], [365, 260], [322, 375], [358, 490]]
  ];

  cracks.forEach((c) => {
    drawCrack(c, 16, 'rgba(180, 42, 8, 0.55)');
    drawCrack(c, 8, '#FF5C12');
    drawCrack(c, 3, '#FFD166');
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function makeMoltenEmissiveTexture(maxAnisotropy) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#070302';
  ctx.fillRect(0, 0, 512, 512);

  const drawGlow = (pts, width, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i += 1) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.stroke();
  };

  const cracks = [
    [[20, 140], [115, 165], [190, 120], [285, 178], [380, 132], [495, 175]],
    [[45, 360], [140, 320], [225, 382], [320, 336], [425, 378], [495, 340]],
    [[185, 25], [210, 125], [175, 240], [235, 355], [205, 485]],
    [[350, 40], [315, 145], [365, 260], [322, 375], [358, 490]]
  ];

  cracks.forEach((c) => {
    drawGlow(c, 18, 'rgba(255, 72, 14, 0.42)');
    drawGlow(c, 8, '#FF6A14');
    drawGlow(c, 3, '#FFE08A');
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function makeEnamelStencilTexture(maxAnisotropy) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1E3A6B';
  ctx.fillRect(0, 0, 512, 512);

  // Clean OEM safety yellow diagonal corner band & IS 807 spec marks
  ctx.fillStyle = '#F2B705';
  ctx.fillRect(0, 390, 512, 42);

  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = '700 44px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('IS 807', 256, 210);
  ctx.font = '600 30px "IBM Plex Mono", monospace';
  ctx.fillText('CLASS M8', 256, 265);
  ctx.fillStyle = '#141B24';
  ctx.font = '700 24px "IBM Plex Mono", monospace';
  ctx.fillText('PROOF TESTED', 256, 419);

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

  ctx.fillStyle = '#F2B705';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#1D222B';
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
  tex.repeat.set(4, 1);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function makeBlueprintScriptTexture(maxAnisotropy) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Authentic deep cyanotype CAD blueprint background
  ctx.fillStyle = '#173A73';
  ctx.fillRect(0, 0, 512, 512);

  // Fine technical drafting millimeter grid in crisp blueprint white/cyan
  ctx.strokeStyle = 'rgba(186, 224, 255, 0.24)';
  ctx.lineWidth = 1.5;
  for (let g = 32; g < 512; g += 32) {
    ctx.beginPath();
    ctx.moveTo(g, 0);
    ctx.lineTo(g, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, g);
    ctx.lineTo(512, g);
    ctx.stroke();
  }

  // Major engineering section lines & crosshairs
  ctx.strokeStyle = 'rgba(220, 240, 255, 0.48)';
  ctx.lineWidth = 2.5;
  for (let g = 128; g < 512; g += 128) {
    ctx.beginPath();
    ctx.moveTo(g, 0);
    ctx.lineTo(g, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, g);
    ctx.lineTo(512, g);
    ctx.stroke();
  }

  // Crisp CAD spec callouts
  ctx.fillStyle = 'rgba(232, 245, 255, 0.85)';
  ctx.font = '600 22px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('IS 807 · FEM 4M · 36m SPAN', 256, 108);
  ctx.fillText('125% PROOF LOAD · EOT BAY', 256, 404);

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

  ctx.fillStyle = '#B8C4D1';
  ctx.fillRect(0, 0, 512, 512);

  // Hot-dip crystalline zinc spangle facets
  const shades = ['#D7E0E8', '#9BA8B8', '#E5ECF3', '#8796A8', '#C6D1DD', '#AEBCCA'];
  for (let i = 0; i < 220; i += 1) {
    const cx = ((i * 197) % 512);
    const cy = ((i * 293) % 512);
    const r = 18 + (i % 34);
    const sides = 5 + (i % 3);
    ctx.fillStyle = shades[i % shades.length];
    ctx.globalAlpha = 0.62;
    ctx.beginPath();
    for (let s = 0; s < sides; s += 1) {
      const a = (s / sides) * Math.PI * 2 + (i * 0.4);
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r * (0.75 + (i % 4) * 0.12);
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

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

  for (let i = 0; i < 140; i += 1) {
    const cx = (i * 97) % 256;
    const cy = (i * 151) % 256;
    const r = 12 + (i % 20);
    const shade = 98 + (i % 56);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.beginPath();
    ctx.moveTo(cx + r, cy);
    for (let s = 1; s < 5; s += 1) {
      const a = (s / 5) * Math.PI * 2 + i;
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
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
  grad.addColorStop(0, 'rgba(14, 20, 30, 0.38)');
  grad.addColorStop(0.55, 'rgba(14, 20, 30, 0.14)');
  grad.addColorStop(1, 'rgba(14, 20, 30, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 128);
  return new THREE.CanvasTexture(canvas);
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
   5 INDUSTRIAL CINEMATOGRAPHY DIRECTORS
   ========================================================================== */
const THEME_DIRECTORS = {
  'raw-steel': {
    camX: -1.75,
    camYOffset: 0.55,
    camZBoost: 0.95,
    lookX: 0.05,
    lookYOffset: -0.18,
    fov: 34,
    exposure: 1.12,
    fogColor: 0xCBD6E2,
    fogDensity: 0.012,
    hemiSky: 0xEFF5FB,
    hemiGround: 0x4A5564,
    hemiInt: 0.62,
    keyColor: 0xFFF7EC,
    keyInt: 1.95,
    keyPos: [-4.8, 8.2, 5.8],
    rimColor: 0xC6DDF5,
    rimInt: 0.88,
    rimPos: [6.0, 2.8, -4.6],
    underColor: 0x4A6382,
    underInt: 0.0,
    shadowOpacity: 0.26,
    rig: 'girders'
  },
  'molten-heat': {
    camX: 2.95,
    camYOffset: -0.88,
    camZBoost: 1.05,
    lookX: -0.18,
    lookYOffset: -0.16,
    fov: 37,
    exposure: 1.2,
    fogColor: 0x160C08,
    fogDensity: 0.022,
    hemiSky: 0x3D2620,
    hemiGround: 0xFF5A14,
    hemiInt: 0.45,
    keyColor: 0xFFBA7A,
    keyInt: 1.18,
    keyPos: [3.2, 5.4, 5.2],
    rimColor: 0xFF4D0A,
    rimInt: 1.85,
    rimPos: [-5.5, 2.4, -4.2],
    underColor: 0xFF5A14,
    underInt: 3.8,
    shadowOpacity: 0.34,
    rig: 'sparks'
  },
  enamel: {
    camX: -2.35,
    camYOffset: 1.18,
    camZBoost: 1.05,
    lookX: 0.1,
    lookYOffset: -0.34,
    fov: 33,
    exposure: 1.08,
    fogColor: 0xDCE4ED,
    fogDensity: 0.01,
    hemiSky: 0xFFFFFF,
    hemiGround: 0x7A8798,
    hemiInt: 0.78,
    keyColor: 0xFFFDF8,
    keyInt: 1.85,
    keyPos: [-3.2, 8.6, 6.4],
    rimColor: 0xDFECFA,
    rimInt: 0.72,
    rimPos: [5.2, 3.6, -3.8],
    underColor: 0xFFFFFF,
    underInt: 0.0,
    shadowOpacity: 0.22,
    rig: 'hazard'
  },
  cad: {
    camX: 1.15,
    camYOffset: 2.25,
    camZBoost: 1.0,
    lookX: -0.05,
    lookYOffset: -0.34,
    fov: 32,
    exposure: 1.06,
    fogColor: 0xD5E5F4,
    fogDensity: 0.008,
    hemiSky: 0xF2F8FF,
    hemiGround: 0x8CA6C2,
    hemiInt: 0.92,
    keyColor: 0xFFFFFF,
    keyInt: 1.35,
    keyPos: [1.5, 9.5, 6.0],
    rimColor: 0x74A7E2,
    rimInt: 0.65,
    rimPos: [-5.0, 4.0, -4.0],
    underColor: 0x4A7EC7,
    underInt: 0.0,
    shadowOpacity: 0.14,
    rig: 'cad'
  },
  galvanized: {
    camX: 2.75,
    camYOffset: 0.92,
    camZBoost: 1.05,
    lookX: -0.12,
    lookYOffset: -0.26,
    fov: 35,
    exposure: 1.12,
    fogColor: 0xC8DDF0,
    fogDensity: 0.011,
    hemiSky: 0xE6F3FF,
    hemiGround: 0x6B7988,
    hemiInt: 0.76,
    keyColor: 0xFFFBF2,
    keyInt: 1.85,
    keyPos: [-5.4, 7.2, 5.2],
    rimColor: 0xB8D8F5,
    rimInt: 0.92,
    rimPos: [5.5, 3.0, -4.5],
    underColor: 0x99B4CC,
    underInt: 0.0,
    shadowOpacity: 0.25,
    rig: 'rails'
  }
};

/* ==========================================================================
   MODULAR STRUCTURAL CRANE & WORKSHOP PROP RIGS
   ========================================================================== */
function buildWorkshopRigs(scene, disposables, hazardTex, maxAniso) {
  const rigs = {};

  // 1. RAW STEEL: Overhead Twin Box/I-Beam Bridge Girders + Traversing Crab Trolley + Hoist Hook
  const girderRoot = new THREE.Group();
  const beamMat = new THREE.MeshStandardMaterial({
    color: 0x354354,
    roughness: 0.36,
    metalness: 0.84
  });
  const endCarriageMat = new THREE.MeshStandardMaterial({
    color: 0xF2B705,
    roughness: 0.32,
    metalness: 0.25
  });
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0xAEB8C4,
    roughness: 0.28,
    metalness: 0.9
  });
  disposables.push(beamMat, endCarriageMat, cableMat);

  const webGeo = new THREE.BoxGeometry(11.6, 0.24, 0.10);
  const flangeGeo = new THREE.BoxGeometry(11.6, 0.06, 0.28);
  const endPlateGeo = new THREE.BoxGeometry(0.32, 0.42, 1.38);
  disposables.push(webGeo, flangeGeo, endPlateGeo);

  [-0.44, 0.44].forEach((zOff) => {
    const web = new THREE.Mesh(webGeo, beamMat);
    web.position.set(0, 2.48, zOff);
    girderRoot.add(web);

    const topF = new THREE.Mesh(flangeGeo, beamMat);
    topF.position.set(0, 2.61, zOff);
    girderRoot.add(topF);

    const botF = new THREE.Mesh(flangeGeo, beamMat);
    botF.position.set(0, 2.35, zOff);
    girderRoot.add(botF);
  });

  [-5.65, 5.65].forEach((xEnd) => {
    const truck = new THREE.Mesh(endPlateGeo, endCarriageMat);
    truck.position.set(xEnd, 2.48, 0);
    girderRoot.add(truck);
  });

  // Traversing Hoist Crab Trolley + Wire Rope + Hook Block
  const crabGroup = new THREE.Group();
  crabGroup.position.set(0.2, 0, 0);
  const crabFrameGeo = new THREE.BoxGeometry(1.18, 0.28, 0.96);
  const drumGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.62, 16);
  const ropeGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.78, 8);
  const blockGeo = new THREE.BoxGeometry(0.34, 0.28, 0.22);
  const hookGeo = new THREE.TorusGeometry(0.11, 0.036, 10, 18, Math.PI * 1.42);
  disposables.push(crabFrameGeo, drumGeo, ropeGeo, blockGeo, hookGeo);

  const crabFrame = new THREE.Mesh(crabFrameGeo, endCarriageMat);
  crabFrame.position.set(0, 2.74, 0);
  crabGroup.add(crabFrame);

  const drum = new THREE.Mesh(drumGeo, beamMat);
  drum.rotation.z = Math.PI * 0.5;
  drum.position.set(0, 2.86, 0);
  crabGroup.add(drum);

  [-0.12, 0.12].forEach((rx) => {
    const rope = new THREE.Mesh(ropeGeo, cableMat);
    rope.position.set(rx, 2.15, 0);
    crabGroup.add(rope);
  });

  const block = new THREE.Mesh(blockGeo, endCarriageMat);
  block.position.set(0, 1.74, 0);
  crabGroup.add(block);

  const hook = new THREE.Mesh(hookGeo, cableMat);
  hook.position.set(0, 1.50, 0);
  hook.rotation.z = Math.PI * 0.85;
  crabGroup.add(hook);

  girderRoot.add(crabGroup);
  scene.add(girderRoot);
  rigs.girders = { root: girderRoot, crabGroup, restY: 0, hideY: 3.4 };

  // 2. MOLTEN HEAT: Refractory Hearth Slab + Glowing Seam + 64 Rising Instanced Sparks
  const sparksRoot = new THREE.Group();
  const hearthMat = new THREE.MeshStandardMaterial({
    color: 0x171418,
    roughness: 0.9,
    metalness: 0.35
  });
  const seamMat = new THREE.MeshBasicMaterial({
    color: 0xFF6A14,
    transparent: true,
    opacity: 0.86
  });
  const hearthGeo = new THREE.BoxGeometry(9.8, 0.14, 1.75);
  const seamGeo = new THREE.PlaneGeometry(8.8, 0.22);
  disposables.push(hearthMat, seamMat, hearthGeo, seamGeo);

  const hearth = new THREE.Mesh(hearthGeo, hearthMat);
  hearth.position.set(0, -1.53, 0);
  hearth.receiveShadow = true;
  sparksRoot.add(hearth);

  const seam = new THREE.Mesh(seamGeo, seamMat);
  seam.rotation.x = -Math.PI / 2;
  seam.position.set(0, -1.45, 0.28);
  sparksRoot.add(seam);

  const SPARK_COUNT = 64;
  const sparkGeo = new THREE.BoxGeometry(0.055, 0.09, 0.055);
  const sparkMat = new THREE.MeshBasicMaterial({
    color: 0xFF9F33,
    transparent: true,
    opacity: 0.92
  });
  disposables.push(sparkGeo, sparkMat);

  const sparkMesh = new THREE.InstancedMesh(sparkGeo, sparkMat, SPARK_COUNT);
  sparkMesh.frustumCulled = false;

  const sparkData = [];
  const tmpColor = new THREE.Color();
  for (let i = 0; i < SPARK_COUNT; i += 1) {
    const seedX = ((Math.sin(i * 19.31) * 43758.54) % 1 + 1) % 1;
    const seedY = ((Math.sin(i * 47.17) * 19341.21) % 1 + 1) % 1;
    const seedZ = ((Math.sin(i * 91.73) * 28411.77) % 1 + 1) % 1;
    sparkData.push({
      x: (seedX - 0.5) * 9.8,
      yOffset: seedY * 4.2,
      z: (seedZ - 0.5) * 2.2,
      speed: 0.7 + (i % 7) * 0.22,
      drift: (seedZ - 0.5) * 0.6,
      scale: 0.55 + (i % 5) * 0.25
    });
    tmpColor.setHex(i % 3 === 0 ? 0xFFE07D : (i % 2 === 0 ? 0xFF6A14 : 0xFFA23A));
    sparkMesh.setColorAt(i, tmpColor);
  }
  if (sparkMesh.instanceColor) sparkMesh.instanceColor.needsUpdate = true;
  sparksRoot.add(sparkMesh);

  scene.add(sparksRoot);
  rigs.sparks = { root: sparksRoot, sparkMesh, sparkData, restY: 0, hideY: -3.2 };

  // 3. ENAMEL: Harohalli Proof-Test Plinth + Yellow/Charcoal Chevron Hazard Stripe Apron
  const hazardRoot = new THREE.Group();
  const plinthGeo = new THREE.BoxGeometry(9.6, 0.14, 1.58);
  const apronGeo = new THREE.BoxGeometry(9.6, 0.10, 0.26);
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x242C37,
    roughness: 0.5,
    metalness: 0.38
  });
  const apronMat = new THREE.MeshStandardMaterial({
    map: hazardTex,
    roughness: 0.34,
    metalness: 0.12
  });
  disposables.push(plinthGeo, apronGeo, plinthMat, apronMat);

  const plinth = new THREE.Mesh(plinthGeo, plinthMat);
  plinth.position.set(0, -1.52, 0);
  plinth.receiveShadow = true;
  hazardRoot.add(plinth);

  const apron = new THREE.Mesh(apronGeo, apronMat);
  apron.position.set(0, -1.49, 0.88);
  hazardRoot.add(apron);

  scene.add(hazardRoot);
  rigs.hazard = { root: hazardRoot, restY: 0, hideY: -2.4 };

  // 4. CAD: Calibrated Floor GridHelper + Span Datum Dimension Frame
  const cadRoot = new THREE.Group();
  const grid = new THREE.GridHelper(24, 34, 0x1E4C9A, 0x8BB2DB);
  grid.position.set(0, -1.48, 0);
  if (Array.isArray(grid.material)) {
    grid.material.forEach((m) => {
      m.transparent = true;
      m.opacity = 0.55;
      disposables.push(m);
    });
  } else {
    grid.material.transparent = true;
    grid.material.opacity = 0.55;
    disposables.push(grid.material);
  }
  disposables.push(grid.geometry);
  cadRoot.add(grid);

  const datumPts = new Float32Array([
    -4.85, -1.35, 1.35,   4.85, -1.35, 1.35,
    -4.85, -1.52, 1.35,  -4.85, -1.16, 1.35,
     4.85, -1.52, 1.35,   4.85, -1.16, 1.35,
    -4.85,  1.62, -0.7,   4.85,  1.62, -0.7,
    -4.85,  1.45, -0.7,  -4.85,  1.78, -0.7,
     4.85,  1.45, -0.7,   4.85,  1.78, -0.7
  ]);
  const datumGeo = new THREE.BufferGeometry();
  datumGeo.setAttribute('position', new THREE.BufferAttribute(datumPts, 3));
  const datumMat = new THREE.LineBasicMaterial({ color: 0x1E4C9A, transparent: true, opacity: 0.72 });
  disposables.push(datumGeo, datumMat);
  const datumLines = new THREE.LineSegments(datumGeo, datumMat);
  cadRoot.add(datumLines);

  scene.add(cadRoot);
  rigs.cad = { root: cadRoot, restY: 0, hideY: -2.8 };

  // 5. GALVANIZED: Goliath Yard Twin Crane Runway Rails + Instanced Bolted Sleeper Ties
  const railsRoot = new THREE.Group();
  const railGeo = new THREE.BoxGeometry(13.2, 0.11, 0.14);
  const railMat = new THREE.MeshStandardMaterial({
    color: 0xB8C5D4,
    roughness: 0.28,
    metalness: 0.88
  });
  const sleeperGeo = new THREE.BoxGeometry(0.24, 0.10, 2.25);
  const sleeperMat = new THREE.MeshStandardMaterial({
    color: 0x3D4958,
    roughness: 0.72,
    metalness: 0.35
  });
  disposables.push(railGeo, railMat, sleeperGeo, sleeperMat);

  [-0.78, 0.78].forEach((rz) => {
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.set(0, -1.43, rz);
    rail.castShadow = !isSoftwareGl;
    rail.receiveShadow = true;
    railsRoot.add(rail);
  });

  const SLEEPER_COUNT = 18;
  const sleepers = new THREE.InstancedMesh(sleeperGeo, sleeperMat, SLEEPER_COUNT);
  const mat4 = new THREE.Matrix4();
  for (let i = 0; i < SLEEPER_COUNT; i += 1) {
    const sx = -5.95 + i * 0.70;
    mat4.makeTranslation(sx, -1.52, 0);
    sleepers.setMatrixAt(i, mat4);
  }
  sleepers.instanceMatrix.needsUpdate = true;
  sleepers.computeBoundingSphere();
  sleepers.receiveShadow = true;
  railsRoot.add(sleepers);

  scene.add(railsRoot);
  rigs.rails = { root: railsRoot, restY: 0, hideY: -2.5 };

  // Hide inactive rigs initially at off-stage Y
  Object.values(rigs).forEach((rig) => {
    rig.root.visible = false;
    rig.root.position.y = rig.hideY;
    rig.mix = 0;
  });

  // Unused param lint guard if maxAniso passed
  void maxAniso;
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
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mount.innerHTML = '';
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xCBD6E2, 0.012);

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
  camera.position.set(-0.55, 1.05, 11.4);
  camera.lookAt(0, 0.08, 0);

  // Studio + Industrial Bay Lighting Rig (damped per-theme)
  const hemiLight = new THREE.HemisphereLight(0xEFF5FB, 0x5C6674, 0.65);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xFFF7EC, 1.72);
  keyLight.position.set(-4.2, 8.2, 5.8);
  keyLight.castShadow = !isSoftwareGl;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 26;
  keyLight.shadow.camera.left = -7.8;
  keyLight.shadow.camera.right = 7.8;
  keyLight.shadow.camera.top = 5.0;
  keyLight.shadow.camera.bottom = -5.0;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xC6DDF5, 0.72);
  rimLight.position.set(6.0, 2.8, -4.6);
  scene.add(rimLight);

  const underGlowLight = new THREE.PointLight(0xFF5A14, 0, 14, 1.6);
  underGlowLight.position.set(0, -1.65, 1.4);
  scene.add(underGlowLight);

  const shadowMat = new THREE.ShadowMaterial({ opacity: 0.24 });
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(28, 16), shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -1.49;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1);
  const steelTex = makeSteelPlateTexture(maxAniso);
  const steelBumpTex = makeSteelBumpTexture();
  const moltenAlbedoTex = makeMoltenAlbedoTexture(maxAniso);
  const moltenEmissiveTex = makeMoltenEmissiveTexture(maxAniso);
  const enamelStencilTex = makeEnamelStencilTexture(maxAniso);
  const hazardTex = makeHazardStripeTexture(maxAniso);
  const blueprintTex = makeBlueprintScriptTexture(maxAniso);
  const galvTex = makeGalvanizedTexture(maxAniso);
  const galvBumpTex = makeGalvanizedBumpTexture();
  const contactTex = makeContactShadowTexture();

  const disposables = [
    shadowMat,
    shadowPlane.geometry,
    steelTex,
    steelBumpTex,
    moltenAlbedoTex,
    moltenEmissiveTex,
    enamelStencilTex,
    hazardTex,
    blueprintTex,
    galvTex,
    galvBumpTex,
    contactTex
  ];

  // Build 5 live industrial workshop prop rigs
  const propRigs = buildWorkshopRigs(scene, disposables, hazardTex, maxAniso);

  // Build 5 multi-part sculpted letter groups ("S V I N D")
  const svindGroup = new THREE.Group();
  svindGroup.rotation.x = -0.06;
  scene.add(svindGroup);

  const ENAMEL_PALETTE = ['#F2B705', '#1E3A6B', '#DF6426', '#1E3A6B', '#F2B705'];
  const LETTER_CONFIGS = [
    { char: 'S', x: -3.72, y: 0.0, rotY: 0.15, rotZ: 0.025 },
    { char: 'V', x: -1.88, y: 0.0, rotY: 0.08, rotZ: -0.015 },
    { char: 'I', x: -0.14, y: 0.0, rotY: 0.0, rotZ: 0.0 },
    { char: 'N', x: 1.58, y: 0.0, rotY: -0.08, rotZ: 0.012 },
    { char: 'D', x: 3.52, y: 0.0, rotY: -0.15, rotZ: -0.02 }
  ];

  const extrudeSettings = {
    depth: 0.78,
    bevelEnabled: true,
    bevelThickness: 0.17,
    bevelSize: 0.13,
    bevelSegments: 8,
    curveSegments: 22
  };

  const backExtrudeSettings = {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 4,
    curveSegments: 14
  };

  const letterStates = [];
  const raycastTargets = [];

  LETTER_CONFIGS.forEach((cfg, idx) => {
    const group = new THREE.Group();
    group.position.set(cfg.x, cfg.y, 0);
    group.rotation.set(0, cfg.rotY, cfg.rotZ);

    const shape = createLetterShape(cfg.char);

    const mainGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    mainGeom.center();
    normalizeExtrudeUVs(mainGeom);
    mainGeom.computeVertexNormals();
    disposables.push(mainGeom);

    const mainMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      map: steelTex,
      bumpMap: steelBumpTex,
      bumpScale: 0.018,
      roughness: 0.28,
      metalness: 0.88,
      clearcoat: 0.25,
      clearcoatRoughness: 0.35,
      envMapIntensity: 0.95
    });
    disposables.push(mainMat);

    const mainMesh = new THREE.Mesh(mainGeom, mainMat);
    mainMesh.castShadow = !isSoftwareGl;
    mainMesh.receiveShadow = true;
    mainMesh.userData.letterIndex = idx;
    group.add(mainMesh);
    raycastTargets.push(mainMesh);

    const backGeom = new THREE.ExtrudeGeometry(shape, backExtrudeSettings);
    backGeom.center();
    backGeom.computeVertexNormals();
    disposables.push(backGeom);

    const backMat = new THREE.MeshStandardMaterial({
      color: 0x1E2631,
      roughness: 0.88,
      metalness: 0.24
    });
    disposables.push(backMat);

    const backMesh = new THREE.Mesh(backGeom, backMat);
    backMesh.scale.set(0.95, 0.95, 1);
    backMesh.position.z = -0.46;
    backMesh.castShadow = !isSoftwareGl;
    group.add(backMesh);

    const contactGeom = new THREE.PlaneGeometry(2.35, 1.45);
    const contactMat = new THREE.MeshBasicMaterial({
      map: contactTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.72
    });
    disposables.push(contactGeom, contactMat);
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
      pos: new THREE.Vector3(cfg.x, cfg.y + (prefersReducedMotion() ? 0 : 0.35 + idx * 0.1), 0),
      vel: new THREE.Vector3(),
      target: new THREE.Vector3(cfg.x, cfg.y, 0),
      rot: new THREE.Vector3(0, cfg.rotY, cfg.rotZ),
      rotVel: new THREE.Vector3(),
      targetRot: new THREE.Vector3(0, cfg.rotY, cfg.rotZ)
    });

    group.position.copy(letterStates[idx].pos);
  });

  // Technical CAD edge overlay lines (visible on CAD theme)
  const blueprintLines = letterStates.map((st) => {
    const edges = new THREE.EdgesGeometry(st.mainMesh.geometry, 24);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x9EE0FF, transparent: true, opacity: 0.82 });
    disposables.push(edges, lineMat);
    const seg = new THREE.LineSegments(edges, lineMat);
    seg.visible = false;
    st.group.add(seg);
    return seg;
  });

  /* ==========================================================================
     CINEMATOGRAPHY TARGET STATE (Damped smoothly per theme)
     ========================================================================== */
  const camCurrentPos = new THREE.Vector3(-0.55, 1.05, 11.4);
  const camTargetPos = new THREE.Vector3(-0.55, 1.05, 11.4);
  const camCurrentLook = new THREE.Vector3(0, 0.08, 0);
  const camTargetLook = new THREE.Vector3(0, 0.08, 0);
  let targetFov = 34;

  const targetFogColor = new THREE.Color(0xCBD6E2);
  let targetFogDensity = 0.012;
  let targetExposure = 1.08;
  const targetHemiSky = new THREE.Color(0xEFF5FB);
  const targetHemiGround = new THREE.Color(0x5C6674);
  let targetHemiInt = 0.65;
  const targetKeyColor = new THREE.Color(0xFFF7EC);
  let targetKeyInt = 1.72;
  const targetKeyPos = new THREE.Vector3(-4.2, 8.2, 5.8);
  const targetRimColor = new THREE.Color(0xC6DDF5);
  let targetRimInt = 0.72;
  const targetRimPos = new THREE.Vector3(6.0, 2.8, -4.6);
  const targetUnderColor = new THREE.Color(0xFF5A14);
  let targetUnderInt = 0;
  let targetShadowOpacity = 0.24;

  function computeResponsiveCamTargets(dir) {
    const rect = mount.getBoundingClientRect();
    const w = Math.max(2, rect.width || window.innerWidth || 1280);
    const h = Math.max(2, rect.height || 680);
    const aspect = w / h;
    const compact = w < 1024;
    const mobileScale = compact ? 0.45 : 1;

    const halfV = Math.tan(THREE.MathUtils.degToRad(dir.fov * 0.5));
    const safeHalfWidth = 5.2 + Math.abs(dir.camX * mobileScale) * 0.28;
    const minZForWidth = safeHalfWidth / (halfV * Math.max(0.44, aspect));
    const camZ = Math.max(10.8 + dir.camZBoost, minZForWidth);

    const camX = dir.camX * mobileScale;
    const camY = (compact ? 0.32 : 0.78) + dir.camYOffset * (compact ? 0.55 : 1);
    const lookX = dir.lookX * mobileScale;
    const lookY = (compact ? -0.95 : -0.1) + dir.lookYOffset * (compact ? 0.45 : 1);

    camTargetPos.set(camX, camY, camZ);
    camTargetLook.set(lookX, lookY, 0);
    targetFov = dir.fov;
  }

  function applyThemeMaterials(preset) {
    letterStates.forEach((st, idx) => {
      const mat = st.mainMat;
      const bpLine = blueprintLines[idx];
      bpLine.visible = false;
      mat.emissive.setHex(0x000000);
      mat.emissiveMap = null;
      mat.emissiveIntensity = 0;

      if (preset === 'raw-steel') {
        mat.map = steelTex;
        mat.color.set(idx === 3 ? '#5E7DA6' : '#DCE4EE');
        mat.bumpMap = steelBumpTex;
        mat.bumpScale = 0.024;
        mat.roughness = 0.22;
        mat.metalness = 0.92;
        mat.clearcoat = 0.28;
        mat.clearcoatRoughness = 0.32;
        mat.envMapIntensity = 1.15;
        st.backMat.color.set('#19212C');
      } else if (preset === 'molten-heat') {
        mat.map = moltenAlbedoTex;
        mat.color.set('#FFFFFF');
        mat.emissive.setHex(0xFF5A14);
        mat.emissiveMap = moltenEmissiveTex;
        mat.emissiveIntensity = 1.65;
        mat.bumpMap = galvBumpTex;
        mat.bumpScale = 0.028;
        mat.roughness = 0.62;
        mat.metalness = 0.48;
        mat.clearcoat = 0.08;
        mat.envMapIntensity = 0.35;
        st.backMat.color.set('#140C0A');
      } else if (preset === 'enamel') {
        mat.map = idx === 3 ? enamelStencilTex : null;
        mat.color.set(idx === 3 ? '#FFFFFF' : ENAMEL_PALETTE[idx]);
        mat.bumpMap = null;
        mat.roughness = 0.14;
        mat.metalness = 0.08;
        mat.clearcoat = 0.94;
        mat.clearcoatRoughness = 0.08;
        mat.envMapIntensity = 0.78;
        st.backMat.color.set(idx === 0 || idx === 4 ? '#8A6304' : '#142644');
      } else if (preset === 'cad') {
        mat.map = blueprintTex;
        mat.color.set('#FFFFFF');
        mat.bumpMap = null;
        mat.roughness = 0.72;
        mat.metalness = 0.1;
        mat.clearcoat = 0.0;
        mat.envMapIntensity = 0.38;
        bpLine.visible = true;
        st.backMat.color.set('#0E254D');
      } else if (preset === 'galvanized') {
        mat.map = galvTex;
        mat.color.set('#EAEFF5');
        mat.bumpMap = galvBumpTex;
        mat.bumpScale = 0.022;
        mat.roughness = 0.26;
        mat.metalness = 0.84;
        mat.clearcoat = 0.24;
        mat.clearcoatRoughness = 0.28;
        mat.envMapIntensity = 1.05;
        st.backMat.color.set('#4D5B6B');
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
    targetShadowOpacity = dir.shadowOpacity;

    // Immediately clear outgoing workshop rigs so no girders/sparks/plinths bleed between themes
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
      const boost = focusIdx === -1 ? 2.1 + i * 0.28 : (i === focusIdx ? 3.8 : 1.0);
      st.vel.y += boost;
      st.rotVel.y += (i % 2 === 0 ? 1 : -1) * (i === focusIdx ? 2.8 : 0.75);
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
     RENDER LOOP (SPRING PHYSICS + CINEMATOGRAPHY + WORKSHOP MOTION)
     ========================================================================== */
  let frameId = 0;
  let running = false;
  let prevTime = performance.now();
  let elapsedSim = 0;

  // Reusable zero-alloc objects for InstancedMesh spark loop
  const _sparkPos = new THREE.Vector3();
  const _sparkQuat = new THREE.Quaternion();
  const _sparkScale = new THREE.Vector3();
  const _sparkMat4 = new THREE.Matrix4();

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

  function stepScene(dt) {
    const clampedDt = Math.min(dt, 0.045);
    elapsedSim += clampedDt;
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
      st.contactMesh.material.opacity = Math.max(0.16, 0.62 - lift * 0.22);

      if (
        st.vel.lengthSq() > 1e-4 ||
        st.rotVel.lengthSq() > 1e-4 ||
        st.pos.distanceToSquared(st.target) > 1e-5
      ) {
        moving = true;
      }
    }

    // 2. Camera Cinematography & Parallax Damping
    const camSpeed = 6.2;
    camCurrentPos.x = THREE.MathUtils.damp(camCurrentPos.x, camTargetPos.x, camSpeed, clampedDt);
    camCurrentPos.y = THREE.MathUtils.damp(camCurrentPos.y, camTargetPos.y, camSpeed, clampedDt);
    camCurrentPos.z = THREE.MathUtils.damp(camCurrentPos.z, camTargetPos.z, camSpeed, clampedDt);
    camCurrentLook.x = THREE.MathUtils.damp(camCurrentLook.x, camTargetLook.x, camSpeed, clampedDt);
    camCurrentLook.y = THREE.MathUtils.damp(camCurrentLook.y, camTargetLook.y, camSpeed, clampedDt);
    camCurrentLook.z = THREE.MathUtils.damp(camCurrentLook.z, camTargetLook.z, camSpeed, clampedDt);

    if (
      camCurrentPos.distanceToSquared(camTargetPos) > 1e-4 ||
      camCurrentLook.distanceToSquared(camTargetLook) > 1e-4 ||
      Math.abs(camera.fov - targetFov) > 0.04
    ) {
      moving = true;
    }

    camera.position.copy(camCurrentPos);
    camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, camSpeed, clampedDt);
    camera.lookAt(camCurrentLook);
    camera.updateProjectionMatrix();

    // 3. Lighting & Atmospheric Fog Transitions
    const lightSpeed = 6.5;
    const lerpFactor = 1 - Math.exp(-lightSpeed * clampedDt);
    scene.fog.color.lerp(targetFogColor, lerpFactor);
    scene.fog.density = THREE.MathUtils.damp(scene.fog.density, targetFogDensity, lightSpeed, clampedDt);
    renderer.toneMappingExposure = THREE.MathUtils.damp(renderer.toneMappingExposure, targetExposure, lightSpeed, clampedDt);

    hemiLight.color.lerp(targetHemiSky, lerpFactor);
    hemiLight.groundColor.lerp(targetHemiGround, lerpFactor);
    hemiLight.intensity = THREE.MathUtils.damp(hemiLight.intensity, targetHemiInt, lightSpeed, clampedDt);

    keyLight.color.lerp(targetKeyColor, lerpFactor);
    keyLight.intensity = THREE.MathUtils.damp(keyLight.intensity, targetKeyInt, lightSpeed, clampedDt);
    keyLight.position.lerp(targetKeyPos, lerpFactor);

    rimLight.color.lerp(targetRimColor, lerpFactor);
    rimLight.intensity = THREE.MathUtils.damp(rimLight.intensity, targetRimInt, lightSpeed, clampedDt);
    rimLight.position.lerp(targetRimPos, lerpFactor);

    underGlowLight.color.lerp(targetUnderColor, lerpFactor);
    const furnaceFlicker = activePreset === 'molten-heat' && !prefersReducedMotion()
      ? 0.25 * Math.sin(elapsedSim * 5.2)
      : 0;
    underGlowLight.intensity = THREE.MathUtils.damp(
      underGlowLight.intensity,
      Math.max(0, targetUnderInt + furnaceFlicker),
      lightSpeed,
      clampedDt
    );

    shadowMat.opacity = THREE.MathUtils.damp(shadowMat.opacity, targetShadowOpacity, lightSpeed, clampedDt);

    // 4. Live Workshop Structural Prop Rigs Transition & Idle Motion
    Object.entries(propRigs).forEach(([key, rig]) => {
      const targetMix = key === dir.rig ? 1 : 0;
      rig.mix = THREE.MathUtils.damp(rig.mix, targetMix, 7.5, clampedDt);
      if (Math.abs(rig.mix - targetMix) > 0.006) {
        moving = true;
      }
      rig.root.visible = rig.mix > 0.015;
      rig.root.position.y = THREE.MathUtils.lerp(rig.hideY, rig.restY, rig.mix);
    });

    if (!prefersReducedMotion()) {
      // Gentle pointer parallax tilt of wordmark
      const targetGroupRotY = pointerHoverX * 0.05;
      const targetGroupRotX = pointerHoverY * -0.035;
      const nextY = THREE.MathUtils.damp(svindGroup.rotation.y, targetGroupRotY, 6, clampedDt);
      const nextX = THREE.MathUtils.damp(svindGroup.rotation.x, targetGroupRotX, 6, clampedDt);
      if (Math.abs(nextY - svindGroup.rotation.y) > 1e-4 || Math.abs(nextX - svindGroup.rotation.x) > 1e-4) {
        moving = true;
      }
      svindGroup.rotation.y = nextY;
      svindGroup.rotation.x = nextX;

      // Overhead EOT crane crab traverse on Raw Steel theme
      if (activePreset === 'raw-steel' && propRigs.girders.root.visible) {
        propRigs.girders.crabGroup.position.x = Math.sin(elapsedSim * 0.42) * 1.85;
        moving = true;
      }

      // Rising molten forge sparks on Molten Heat theme
      if (activePreset === 'molten-heat' && propRigs.sparks.root.visible) {
        const { sparkMesh, sparkData } = propRigs.sparks;
        for (let i = 0; i < sparkData.length; i += 1) {
          const sp = sparkData[i];
          const cyc = (sp.yOffset + elapsedSim * sp.speed) % 4.4;
          const fade = cyc < 3.4 ? 1 : Math.max(0, 1 - (cyc - 3.4));
          _sparkPos.set(
            sp.x + Math.sin(elapsedSim * 1.8 + i) * 0.14 * sp.drift,
            -1.42 + cyc,
            sp.z
          );
          const sc = sp.scale * fade;
          _sparkScale.set(sc, sc * 1.35, sc);
          _sparkMat4.compose(_sparkPos, _sparkQuat, _sparkScale);
          sparkMesh.setMatrixAt(i, _sparkMat4);
        }
        sparkMesh.instanceMatrix.needsUpdate = true;
        moving = true;
      }
    }

    return moving;
  }

  function renderFrame() {
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

  // Initialize starting theme immediately
  selectPreset('raw-steel');
  applyTheme('raw-steel', true);

  if (!isSoftwareGl) {
    try {
      renderer.compile(scene, camera);
    } catch {
      // Non-fatal on restricted GPU drivers; draw proceeds on render
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
