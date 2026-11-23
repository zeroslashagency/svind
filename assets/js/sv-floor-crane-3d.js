import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

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
    { antialias: !isSoftwareGl, alpha: false, powerPreference: 'high-performance' },
    { antialias: false, alpha: false }
  ];
  for (let i = 0; i < attempts.length; i += 1) {
    try {
      const r = new THREE.WebGLRenderer(attempts[i]);
      if (r && r.getContext()) return r;
      r?.dispose?.();
    } catch {
      // Try fallback renderer flags
    }
  }
  return null;
}

function smoothstep(edge0, edge1, x) {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function smoothBell(start, peakStart, peakEnd, end, x) {
  if (x <= start || x >= end) return 0;
  if (x < peakStart) return smoothstep(start, peakStart, x);
  if (x > peakEnd) return 1 - smoothstep(peakEnd, end, x);
  return 1;
}

// 6 Scroll-Choreographed Cinematic Acts (A-to-Z: CAD Engineering -> Live Sweep -> Macro Subsystems -> Harohalli Steel Finale)
const SCROLL_ACTS = [
  {
    id: 'cad',
    index: '01 / 06',
    code: '01 · IS 807 CAD Engineering',
    title: 'Cantilever Geometry',
    meta: '1.0–3.0 T SWL · IS 807 Box-Section',
    start: 0.0,
    end: 0.16
  },
  {
    id: 'boom',
    index: '02 / 06',
    code: '02 · Drawing to Real Steel',
    title: 'Boom & Hydraulic Luffing',
    meta: '3-Stage Reach · 210 Bar Luffing Ram',
    start: 0.16,
    end: 0.34
  },
  {
    id: 'hook',
    index: '03 / 06',
    code: '03 · Exploded Macro',
    title: 'Twin-Sheave Block & Hook',
    meta: '2-Fall Reeving · 360° Forged DIN Hook',
    start: 0.34,
    end: 0.54
  },
  {
    id: 'drive',
    index: '04 / 06',
    code: '04 · Exploded Macro',
    title: 'Hoist Drive & Ballast Deck',
    meta: '11-Fin 415V Motor · 1.5 T Cast-Iron Ballast',
    start: 0.54,
    end: 0.72
  },
  {
    id: 'chassis',
    index: '05 / 06',
    code: '05 · Floor Stabilization',
    title: 'Outrigger Chassis & Jacks',
    meta: '4× Acme Screw Jacks · Swivel Lock Casters',
    start: 0.72,
    end: 0.86
  },
  {
    id: 'finale',
    index: '06 / 06',
    code: '06 · Harohalli Steel',
    title: 'Assembled Workshop Crane',
    meta: 'Witnessed Proof Load · Harohalli KIADB',
    start: 0.86,
    end: 1.01
  }
];

// Time-keyed Catmull-Rom camera waypoints (smoothly arcing around the -Z front hemisphere, generous gallery margins)
const CAMERA_KEYFRAMES = [
  { p: 0.00, camPos: [-1.38, 2.62, -7.15], target: [-0.52, 1.32, 0.00] },
  { p: 0.14, camPos: [-0.88, 2.54, -6.55], target: [-0.58, 1.35, 0.00] },
  { p: 0.24, camPos: [-1.25, 2.52, -3.55], target: [-0.88, 2.02, 0.00] },
  { p: 0.33, camPos: [-1.65, 2.40, -3.30], target: [-1.16, 1.94, 0.00] },
  { p: 0.44, camPos: [-3.98, 1.98, -2.55], target: [-2.74, 1.60, 0.00] },
  { p: 0.52, camPos: [-3.32, 2.12, -3.05], target: [-2.18, 1.60, 0.00] },
  { p: 0.57, camPos: [0.45, 2.44, -4.65], target: [0.22, 1.48, 0.00] },
  { p: 0.64, camPos: [2.95, 2.38, -2.55], target: [1.10, 1.24, 0.00] },
  { p: 0.71, camPos: [2.05, 1.92, -3.35], target: [0.65, 1.02, 0.00] },
  { p: 0.75, camPos: [-0.40, 1.40, -4.25], target: [-0.14, 0.64, -0.06] },
  { p: 0.80, camPos: [-2.22, 1.15, -3.58], target: [-0.36, 0.48, -0.10] },
  { p: 0.89, camPos: [-1.45, 2.18, -5.75], target: [-0.54, 1.12, 0.00] },
  { p: 1.00, camPos: [-1.12, 2.52, -7.05], target: [-0.60, 1.32, 0.00] }
];

// 3D-Anchored Part Callout Definitions (projected onto live moving/exploding parts; Act 06 stays 100% uncluttered)
const PART_TAGS = [
  // Act 01: CAD Engineering (0.00 - 0.16)
  {
    id: 'mast',
    label: 'IS 807 Box-Section Mast',
    sub: '2.0 m welded column',
    dx: -92,
    dy: -54,
    win: [0.01, 0.035, 0.125, 0.155],
    mobile: true
  },
  {
    id: 'jib-cad',
    label: 'Cantilever Jib Geometry',
    sub: '3-stage telescopic profile',
    dx: 76,
    dy: 58,
    win: [0.015, 0.045, 0.125, 0.155],
    mobile: false
  },

  // Act 02: Boom & Hydraulic Luffing (0.16 - 0.34)
  {
    id: 'jib-ext',
    label: '3-Stage Telescoping Jib',
    sub: 'Safety-yellow inner arm',
    dx: 54,
    dy: 68,
    win: [0.18, 0.21, 0.305, 0.335],
    mobile: true
  },
  {
    id: 'luff-ram',
    label: '210 Bar Luffing Ram',
    sub: 'Hard-chrome piston rod',
    dx: 84,
    dy: 52,
    win: [0.185, 0.215, 0.305, 0.335],
    mobile: true
  },
  {
    id: 'load-chart',
    label: 'IS 807 Load Chart',
    sub: '1.0–3.0 T SWL rated',
    dx: -84,
    dy: -56,
    win: [0.19, 0.22, 0.305, 0.335],
    mobile: false
  },

  // Act 03: Twin-Sheave Block & Forged Hook (0.34 - 0.54)
  {
    id: 'cheeks',
    label: 'Beveled Cheek Plates',
    sub: 'Bolted hazard shroud',
    dx: -96,
    dy: -44,
    win: [0.37, 0.40, 0.495, 0.525],
    mobile: false
  },
  {
    id: 'sheaves',
    label: 'Twin Grooved Sheaves',
    sub: '2-fall steel wire reeving',
    dx: 88,
    dy: -54,
    win: [0.375, 0.405, 0.495, 0.525],
    mobile: true
  },
  {
    id: 'din-hook',
    label: '360° Forged DIN Hook',
    sub: 'Brass thrust swivel & latch',
    dx: 86,
    dy: 38,
    win: [0.38, 0.41, 0.495, 0.525],
    mobile: true
  },

  // Act 04: Hoist Drive & Ballast Deck (0.54 - 0.72)
  {
    id: 'motor',
    label: '11-Fin 415V Hoist Motor',
    sub: 'TEFC cooled fan cowl',
    dx: -92,
    dy: -54,
    win: [0.58, 0.61, 0.682, 0.710],
    mobile: true
  },
  {
    id: 'gearbox',
    label: 'Helical Gearbox & Handwheel',
    sub: 'Oil sight glass & manual lower',
    dx: 88,
    dy: -58,
    win: [0.585, 0.615, 0.682, 0.710],
    mobile: false
  },
  {
    id: 'ballast',
    label: '1.5 T Cast-Iron Ballast',
    sub: '4× stacked counterweight slabs',
    dx: -90,
    dy: 54,
    win: [0.59, 0.62, 0.682, 0.710],
    mobile: true
  },

  // Act 05: Outrigger Chassis & Screw Jacks (0.72 - 0.86)
  {
    id: 'forks',
    label: 'Gusseted Outrigger Forks',
    sub: 'Welded box-section base',
    dx: -68,
    dy: 78,
    win: [0.745, 0.772, 0.825, 0.852],
    mobile: false
  },
  {
    id: 'jacks',
    label: '4× Acme Leveling Jacks',
    sub: 'Handwheel screw floor locks',
    dx: 88,
    dy: -48,
    win: [0.748, 0.775, 0.825, 0.852],
    mobile: true
  },
  {
    id: 'casters',
    label: 'Swivel Lock Casters',
    sub: 'Double-plate PU treads',
    dx: 84,
    dy: 38,
    win: [0.752, 0.780, 0.825, 0.852],
    mobile: false
  }
];

/* ==========================================================================
   PROCEDURAL PBR WEATHERING & TECHNICAL TEXTURE GENERATORS (ZERO 404s)
   ========================================================================== */

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createWeatheredPaintTextures(baseHex, edgeWearHex, seed = 42, maxAniso = 4) {
  const size = 512;
  const rand = mulberry32(seed);

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const actx = albedoCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rctx = roughCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d');

  if (!actx || !rctx || !bctx) return { map: null, roughnessMap: null, bumpMap: null };

  // Base industrial enamel coat
  actx.fillStyle = baseHex;
  actx.fillRect(0, 0, size, size);

  rctx.fillStyle = '#747474'; // ~0.45 base roughness
  rctx.fillRect(0, 0, size, size);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);

  // Subtle powder-coat mottled tonal variation & oil grime clouds
  for (let i = 0; i < 160; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 18 + rand() * 72;
    const dark = rand() > 0.45;
    const g = actx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, dark ? 'rgba(8, 12, 18, 0.14)' : 'rgba(255, 255, 255, 0.06)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    actx.fillStyle = g;
    actx.beginPath();
    actx.arc(x, y, r, 0, Math.PI * 2);
    actx.fill();

    rctx.fillStyle = dark ? 'rgba(215, 215, 215, 0.18)' : 'rgba(65, 65, 65, 0.16)';
    rctx.beginPath();
    rctx.arc(x, y, r * 0.85, 0, Math.PI * 2);
    rctx.fill();
  }

  // Fine hammered grain & workshop micro-speckle
  for (let i = 0; i < 2200; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 1 + rand() * 2.2;
    const light = rand() > 0.5;
    actx.fillStyle = light ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.06)';
    actx.fillRect(x, y, w, w);

    bctx.fillStyle = light ? 'rgba(168,168,168,0.28)' : 'rgba(90,90,90,0.28)';
    bctx.fillRect(x, y, w, w);
  }

  // Scratches & realistic chipped paint edge wear (inspired by workshop machine reference)
  for (let i = 0; i < 65; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 8 + rand() * 34;
    const ang = (rand() - 0.5) * 1.4;
    const x2 = x + Math.cos(ang) * len;
    const y2 = y + Math.sin(ang) * len;

    actx.strokeStyle = rand() > 0.35 ? 'rgba(168, 178, 192, 0.28)' : 'rgba(16, 18, 22, 0.26)';
    actx.lineWidth = 0.8 + rand() * 1.4;
    actx.beginPath();
    actx.moveTo(x, y);
    actx.lineTo(x2, y2);
    actx.stroke();

    rctx.strokeStyle = 'rgba(42, 42, 42, 0.45)';
    rctx.lineWidth = 1.4;
    rctx.beginPath();
    rctx.moveTo(x, y);
    rctx.lineTo(x2, y2);
    rctx.stroke();

    bctx.strokeStyle = 'rgba(54, 54, 54, 0.5)';
    bctx.lineWidth = 1.3;
    bctx.beginPath();
    bctx.moveTo(x, y);
    bctx.lineTo(x2, y2);
    bctx.stroke();
  }

  // Perimeter worn bare-steel edge border chips
  actx.strokeStyle = edgeWearHex;
  actx.lineWidth = 8;
  actx.globalAlpha = 0.26;
  actx.strokeRect(4, 4, size - 8, size - 8);
  actx.globalAlpha = 1;

  for (let i = 0; i < 90; i += 1) {
    const onHoriz = rand() > 0.5;
    const px = onHoriz ? rand() * size : (rand() > 0.5 ? rand() * 14 : size - rand() * 14);
    const py = onHoriz ? (rand() > 0.5 ? rand() * 14 : size - rand() * 14) : rand() * size;
    const rw = 3 + rand() * 10;
    const rh = 2 + rand() * 6;
    actx.fillStyle = edgeWearHex;
    actx.globalAlpha = 0.25 + rand() * 0.25;
    actx.fillRect(px, py, rw, rh);
    rctx.fillStyle = '#363636';
    rctx.fillRect(px, py, rw, rh);
  }
  actx.globalAlpha = 1;

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAniso;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = maxAniso;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = maxAniso;

  return { map, roughnessMap, bumpMap };
}

function createCastIronBumpTexture(maxAniso = 4) {
  const size = 256;
  const rand = mulberry32(99);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#7c7c7c';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 3600; i += 1) {
    const v = 86 + Math.floor(rand() * 88);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(rand() * size, rand() * size, 1.8, 1.8);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = maxAniso;
  return tex;
}

function createHazardStripeTexture(maxAniso = 4) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#E5AA1E';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#191D23';
  for (let i = -256; i < 512; i += 48) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 24, 0);
    ctx.lineTo(i + 24 + 256, 256);
    ctx.lineTo(i + 256, 256);
    ctx.closePath();
    ctx.fill();
  }

  // Subtle grime veil
  ctx.fillStyle = 'rgba(20, 22, 26, 0.14)';
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function createLoadChartPlateTexture(maxAniso = 4) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#E6AD22';
  ctx.fillRect(0, 0, 640, 192);

  // Dark inner border frame + rivet corners
  ctx.strokeStyle = '#141921';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 620, 172);

  ctx.fillStyle = '#141921';
  ctx.fillRect(10, 10, 620, 52);

  ctx.fillStyle = '#F5F7FA';
  ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('SVIND  ·  CANTILEVER FLOOR CRANE', 28, 37);

  ctx.fillStyle = '#E6AD22';
  ctx.font = '600 18px "IBM Plex Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('IS 807', 610, 37);

  // 3-column capacity chart
  const cols = [
    ['POS 1 · 1.4m', '3.0 TON'],
    ['POS 2 · 2.1m', '2.0 TON'],
    ['POS 3 · 2.8m', '1.0 TON']
  ];
  cols.forEach(([pos, ton], idx) => {
    const cx = 112 + idx * 208;
    if (idx > 0) {
      ctx.strokeStyle = 'rgba(20, 25, 33, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 104, 72);
      ctx.lineTo(cx - 104, 170);
      ctx.stroke();
    }
    ctx.fillStyle = '#141921';
    ctx.textAlign = 'center';
    ctx.font = '600 18px "IBM Plex Mono", monospace';
    ctx.fillText(pos, cx, 96);
    ctx.font = '700 34px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(ton, cx, 140);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function createBallastPlateTexture(maxAniso = 4) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#1C222B';
  ctx.fillRect(0, 0, 512, 192);

  ctx.strokeStyle = '#E6AD22';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 492, 172);

  ctx.fillStyle = '#E6AD22';
  ctx.font = '700 46px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('1.5 TON BALLAST', 256, 76);

  ctx.fillStyle = '#CBD3DF';
  ctx.font = '600 21px "IBM Plex Mono", monospace';
  ctx.fillText('SVIND HAROHALLI · IS 3177', 256, 134);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function createControlPanelTexture(maxAniso = 4) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#D7DCE2';
  ctx.fillRect(0, 0, 256, 384);

  ctx.strokeStyle = '#39424E';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 240, 368);

  // Header strip
  ctx.fillStyle = '#1E3A6B';
  ctx.fillRect(20, 22, 216, 46);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SVIND 415V', 128, 52);

  // Warning triangle
  ctx.fillStyle = '#E6AD22';
  ctx.beginPath();
  ctx.moveTo(128, 232);
  ctx.lineTo(176, 312);
  ctx.lineTo(80, 312);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#15181E';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = '#15181E';
  ctx.font = '700 42px sans-serif';
  ctx.fillText('!', 128, 298);

  // Serial spec
  ctx.font = '600 15px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#2B333E';
  ctx.fillText('IP55 · HOIST CTRL', 128, 348);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function createGaugeDialTexture(maxAniso = 4) {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#F6F7F9';
  ctx.beginPath();
  ctx.arc(96, 96, 90, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#1C222B';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Scale ticks
  for (let i = 0; i <= 12; i += 1) {
    const a = Math.PI * 0.75 + (i / 12) * Math.PI * 1.5;
    const inner = i % 3 === 0 ? 58 : 68;
    ctx.strokeStyle = i >= 10 ? '#C43628' : '#1C222B';
    ctx.lineWidth = i % 3 === 0 ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(96 + Math.cos(a) * inner, 96 + Math.sin(a) * inner);
    ctx.lineTo(96 + Math.cos(a) * 80, 96 + Math.sin(a) * 80);
    ctx.stroke();
  }

  // Needle at ~170 bar
  const na = Math.PI * 0.75 + 0.68 * Math.PI * 1.5;
  ctx.strokeStyle = '#C43628';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(96, 96);
  ctx.lineTo(96 + Math.cos(na) * 64, 96 + Math.sin(na) * 64);
  ctx.stroke();

  ctx.fillStyle = '#1C222B';
  ctx.beginPath();
  ctx.arc(96, 96, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '700 16px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BAR', 96, 146);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function createGroovedDrumTexture(maxAniso = 4) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#4B535E';
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 8) {
    ctx.fillStyle = '#8993A0';
    ctx.fillRect(0, y, 256, 3.5);
    ctx.fillStyle = '#252B33';
    ctx.fillRect(0, y + 4, 256, 2.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function createAcmeThreadTexture(maxAniso = 4) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#8E98A6';
  ctx.fillRect(0, 0, 128, 256);

  for (let y = -16; y < 272; y += 10) {
    ctx.strokeStyle = '#333A44';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y + 6);
    ctx.stroke();

    ctx.strokeStyle = '#CFD7E2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y + 4);
    ctx.lineTo(128, y + 10);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function createCadGridTexture(maxAniso = 4) {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);

  const stepFine = size / 32;
  ctx.strokeStyle = 'rgba(30, 58, 107, 0.085)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 32; i += 1) {
    const p = i * stepFine;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  const stepMajor = size / 8;
  ctx.strokeStyle = 'rgba(30, 58, 107, 0.22)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i <= 8; i += 1) {
    const p = i * stepMajor;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  // Radial alpha fade at edges
  ctx.globalCompositeOperation = 'destination-in';
  const fade = ctx.createRadialGradient(size / 2, size / 2, size * 0.14, size / 2, size / 2, size * 0.49);
  fade.addColorStop(0, 'rgba(0,0,0,1)');
  fade.addColorStop(0.7, 'rgba(0,0,0,0.75)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function createContactShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, 512, 512);
  const grad = ctx.createRadialGradient(256, 256, 28, 256, 256, 244);
  grad.addColorStop(0, 'rgba(6, 8, 12, 0.62)');
  grad.addColorStop(0.45, 'rgba(8, 10, 14, 0.34)');
  grad.addColorStop(0.76, 'rgba(10, 12, 16, 0.10)');
  grad.addColorStop(1, 'rgba(10, 12, 16, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ==========================================================================
   PROCEDURAL COMPOSITE MECHANICAL SHAPES
   ========================================================================== */

function createForgedHookMesh(steelMat, latchMat, trackGeo) {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-0.044, 0.145);
  shape.lineTo(0.044, 0.145);
  shape.lineTo(0.044, 0.02);
  shape.bezierCurveTo(0.152, -0.025, 0.168, -0.182, 0.015, -0.222);
  shape.bezierCurveTo(-0.12, -0.246, -0.172, -0.138, -0.118, -0.056);
  shape.lineTo(-0.068, -0.08);
  shape.bezierCurveTo(-0.105, -0.136, -0.054, -0.184, 0.014, -0.17);
  shape.bezierCurveTo(0.102, -0.146, 0.096, -0.042, -0.012, -0.012);
  shape.lineTo(-0.044, 0.02);
  shape.closePath();

  const geo = trackGeo(new THREE.ExtrudeGeometry(shape, {
    depth: 0.062,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2
  }));
  geo.center();
  const hook = new THREE.Mesh(geo, steelMat);
  hook.castShadow = true;
  hook.receiveShadow = true;
  hook.userData.cadEdgeAngle = 22;
  group.add(hook);

  // Spring-loaded forged safety latch across throat
  const latch = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.105, 0.016, 0.022)), latchMat);
  latch.position.set(-0.044, 0.004, 0);
  latch.rotation.z = 0.72;
  latch.castShadow = true;
  group.add(latch);

  const latchPin = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 10)), latchMat);
  latchPin.rotation.x = Math.PI / 2;
  latchPin.position.set(-0.006, 0.042, 0);
  group.add(latchPin);

  return group;
}

function createGroovedSheaveMesh(radius, thickness, steelMat, darkMat, trackGeo) {
  const pts = [
    new THREE.Vector2(0.018, -thickness * 0.5),
    new THREE.Vector2(radius, -thickness * 0.5),
    new THREE.Vector2(radius * 0.94, -thickness * 0.34),
    new THREE.Vector2(radius * 0.82, -thickness * 0.14),
    new THREE.Vector2(radius * 0.82, thickness * 0.14),
    new THREE.Vector2(radius * 0.94, thickness * 0.34),
    new THREE.Vector2(radius, thickness * 0.5),
    new THREE.Vector2(0.018, thickness * 0.5)
  ];
  const geo = trackGeo(new THREE.LatheGeometry(pts, 28));
  geo.rotateX(Math.PI / 2);
  const group = new THREE.Group();
  const wheel = new THREE.Mesh(geo, steelMat);
  wheel.castShadow = true;
  wheel.userData.cadWire = true;
  group.add(wheel);

  const hub = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(radius * 0.36, radius * 0.36, thickness * 1.24, 16)),
    darkMat
  );
  hub.rotation.x = Math.PI / 2;
  group.add(hub);

  const pin = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(radius * 0.17, radius * 0.17, thickness * 1.5, 12)),
    steelMat
  );
  pin.rotation.x = Math.PI / 2;
  group.add(pin);

  return group;
}

function createHandwheelMesh(radius, rimMat, hubMat, trackGeo) {
  const group = new THREE.Group();
  const rim = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(radius, radius * 0.13, 12, 24)), rimMat);
  rim.castShadow = true;
  rim.userData.cadEdgeAngle = 28;
  group.add(rim);

  const hub = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(radius * 0.24, radius * 0.28, radius * 0.34, 14)), hubMat);
  hub.rotation.x = Math.PI / 2;
  group.add(hub);

  for (let i = 0; i < 3; i += 1) {
    const a = (i / 3) * Math.PI * 2;
    const spoke = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(radius * 0.08, radius * 0.09, radius * 0.95, 8)), rimMat);
    spoke.position.set(Math.cos(a) * radius * 0.48, Math.sin(a) * radius * 0.48, 0);
    spoke.rotation.z = a - Math.PI / 2;
    group.add(spoke);
  }

  // Offset grip handle (like the workshop machine handwheel reference)
  const knobStem = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(radius * 0.08, radius * 0.08, radius * 0.56, 10)), hubMat);
  knobStem.rotation.x = Math.PI / 2;
  knobStem.position.set(radius * 0.88, 0, radius * 0.32);
  group.add(knobStem);

  const knobGrip = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(radius * 0.12, radius * 0.1, radius * 0.34, 10)), hubMat);
  knobGrip.rotation.x = Math.PI / 2;
  knobGrip.position.set(radius * 0.88, 0, radius * 0.52);
  group.add(knobGrip);

  return group;
}

function createBeveledCheekGeo(w, h, d, trackGeo) {
  const hw = w * 0.5;
  const hh = h * 0.5;
  const ch = Math.min(w, h) * 0.16;
  const s = new THREE.Shape();
  s.moveTo(-hw + ch, -hh);
  s.lineTo(hw - ch, -hh);
  s.lineTo(hw, -hh + ch);
  s.lineTo(hw, hh - ch);
  s.lineTo(hw - ch, hh);
  s.lineTo(-hw + ch, hh);
  s.lineTo(-hw, hh - ch);
  s.lineTo(-hw, -hh + ch);
  s.closePath();

  const geo = trackGeo(new THREE.ExtrudeGeometry(s, {
    depth: d,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 1
  }));
  geo.center();
  return geo;
}

function createGussetGeo(w, h, d, trackGeo) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(w, 0);
  s.lineTo(0, h);
  s.closePath();
  const geo = trackGeo(new THREE.ExtrudeGeometry(s, {
    depth: d,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 1
  }));
  geo.translate(-w * 0.5, -h * 0.5, -d * 0.5);
  return geo;
}

/* ==========================================================================
   MAIN CINEMATIC FLOOR CRANE ENGINE
   ========================================================================== */

class SVFloorCraneEngine {
  constructor(dom) {
    this.dom = dom;
    this.section = dom.section;
    this.runway = dom.runway;
    this.sticky = dom.sticky;
    this.mount = dom.mount;
    this.tagsLayer = dom.tagsLayer;
    this.fallbackEl = dom.fallbackEl;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.pmremGenerator = null;
    this.envRenderTarget = null;
    this.disposables = { geometries: [], materials: [], textures: [] };

    // Clipping planes (updated every frame in exact screen-frustum space so CAD -> Real sweeps cleanly at any camera angle)
    this.clipPlaneReal = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
    this.clipPlaneCad = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);

    // Master scroll-driven progress (0.0 -> 1.0)
    this.scrollTarget = 0.0;
    this.scrollCurrent = 0.0;
    this.activeActIdx = -1;
    this.reducedStatic = prefersReducedMotion();

    // Evaluated real-time state from scroll timeline
    this.transformCurrent = this.reducedStatic ? 0.52 : 0.0;
    this.explodeGroups = { hook: 0, drive: 0, boom: 0, chassis: 0 };

    this.state = {
      boomPitch: 0.20,
      boomExt: 0.08,
      hookDrop: 0.86,
      jackDrop: 0.15,
      hookSwivel: 0.10,
      winchSpin: -0.60
    };

    // Dual-root mirror tracking
    this.realCraneRoot = null;
    this.cadCraneRoot = null;
    this.syncPairs = []; // [realObj, cadObj]
    this.explodeParts = []; // { obj, basePos, offset, group }
    this.boltTransforms = [];

    // 3D-anchored part tag instances
    this.tagAnchors = new Map(); // id -> THREE.Object3D
    this.tagNodes = []; // { def, anchor, el, lineEl, dotEl, labelEl }
    this.viewportW = 1080;
    this.viewportH = 640;

    // Lights & atmosphere refs (pure clean white daylight studio throughout)
    this.bgColorLight = new THREE.Color(0xffffff);
    this.bgColorCurrent = new THREE.Color(0xffffff);

    // Pre-allocated scratch math helpers (zero GC in loop)
    this._pTop = new THREE.Vector3();
    this._pBot = new THREE.Vector3();
    this._pTest = new THREE.Vector3();
    this._tmpA = new THREE.Vector3();
    this._tmpB = new THREE.Vector3();
    this._tmpMid = new THREE.Vector3();
    this._ropeP0 = new THREE.Vector3();
    this._ropeP1 = new THREE.Vector3();
    this._ropeP2 = new THREE.Vector3();
    this._camPosVec = new THREE.Vector3();
    this._camTgtVec = new THREE.Vector3();
    this._projVec = new THREE.Vector3();
    this._upAxis = new THREE.Vector3(0, 1, 0);
    this._dirVec = new THREE.Vector3();
    this._boltDummy = new THREE.Object3D();

    // Pre-allocated camera keyframe vectors
    this._kfPos = CAMERA_KEYFRAMES.map((k) => new THREE.Vector3(...k.camPos));
    this._kfTgt = CAMERA_KEYFRAMES.map((k) => new THREE.Vector3(...k.target));

    this.lastTickTs = 0;
    this.frameId = 0;
    this.renderBusy = false;
    this.renderDirty = false;
    this.loopActive = false;
    this.inView = true;
    this.io = null;
    this.resizeObserver = null;
    this.destroyed = false;
    this.contextLost = false;
  }

  trackGeo(g) {
    this.disposables.geometries.push(g);
    return g;
  }

  trackMat(m) {
    this.disposables.materials.push(m);
    return m;
  }

  trackTex(t) {
    if (t) this.disposables.textures.push(t);
    return t;
  }

  init() {
    const renderer = createWebGLRendererSafely();
    if (!renderer) {
      if (this.fallbackEl) this.fallbackEl.hidden = false;
      return false;
    }

    this.renderer = renderer;
    const width = Math.max(this.mount.clientWidth || 1080, 320);
    const height = Math.max(this.mount.clientHeight || 600, 320);
    this.viewportW = width;
    this.viewportH = height;

    const dprCap = window.innerWidth < 600 ? 1.5 : 2;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.localClippingEnabled = true;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.mount.textContent = '';
    this.mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = this.bgColorCurrent.copy(this.bgColorLight);
    scene.fog = new THREE.FogExp2(0xffffff, 0.02);
    this.scene = scene;

    // Studio environment map via RoomEnvironment on all devices
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new RoomEnvironment();
    this.envRenderTarget = pmrem.fromScene(envScene, 0.04);
    scene.environment = this.envRenderTarget.texture;
    scene.environmentIntensity = 0.9;
    envScene.dispose();
    this.pmremGenerator = pmrem;

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 80);
    this.camera = camera;

    this.buildEnvironment();
    this.buildMaterials();
    this.buildRealFloorCrane();
    this.buildCadMirrorFromReal();
    this.buildPartTagDOM();

    // Render initial scroll frame immediately
    this.applyScrollFrame(this.scrollCurrent, true);

    renderer.domElement.addEventListener('webglcontextlost', (ev) => {
      ev.preventDefault();
      this.contextLost = true;
      this.stopPendingFrame();
      if (this.fallbackEl) this.fallbackEl.hidden = false;
    });

    renderer.domElement.addEventListener('webglcontextrestored', () => {
      this.contextLost = false;
      if (this.fallbackEl) this.fallbackEl.hidden = true;
      this.requestRender();
    });

    if (!isSoftwareGl && typeof renderer.compile === 'function') {
      renderer.compile(scene, camera);
    }

    this.boundResize = () => this.resize();
    window.addEventListener('resize', this.boundResize, { passive: true });
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.mount);
    }
    if ('IntersectionObserver' in window && this.section) {
      this.io = new IntersectionObserver((entries) => {
        this.setInView(entries[0]?.isIntersecting);
      }, { rootMargin: '220px 0px', threshold: 0.01 });
      this.io.observe(this.section);
    }

    this.requestRender();
    return true;
  }

  buildEnvironment() {
    const scene = this.scene;
    const maxAniso = Math.min(this.renderer.capabilities.getMaxAnisotropy() || 4, 8);

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 1.08);
    scene.add(this.hemiLight);

    // Warm daylight studio key light
    this.keyLight = new THREE.DirectionalLight(0xfffaf2, 2.15);
    this.keyLight.position.set(4.5, 7.6, -5.8);
    this.keyLight.castShadow = !isSoftwareGl;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 22;
    this.keyLight.shadow.camera.left = -4.5;
    this.keyLight.shadow.camera.right = 4.5;
    this.keyLight.shadow.camera.top = 4.5;
    this.keyLight.shadow.camera.bottom = -4.5;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    scene.add(this.keyLight);

    // Clean cool steel edge rim light
    this.rimLight = new THREE.DirectionalLight(0xd6e6ff, 0.95);
    this.rimLight.position.set(-5.6, 4.4, 5.4);
    scene.add(this.rimLight);

    // Soft bright bounce fill for underside mechanical details
    this.fillLight = new THREE.DirectionalLight(0xf8fafc, 0.52);
    this.fillLight.position.set(-3.2, 1.5, -4.4);
    scene.add(this.fillLight);

    // Subtle CAD drafting grid on white paper (fades gently as Real steel reveals)
    const gridTex = this.trackTex(createCadGridTexture(maxAniso));
    if (gridTex) {
      this.cadGridMat = this.trackMat(new THREE.MeshBasicMaterial({
        map: gridTex,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
      }));
      const gridPlane = new THREE.Mesh(this.trackGeo(new THREE.PlaneGeometry(14, 14)), this.cadGridMat);
      gridPlane.rotation.x = -Math.PI / 2;
      gridPlane.position.set(-0.2, 0.002, 0);
      scene.add(gridPlane);
    }

    // Soft elliptical product contact shadow grounding the wheels & jacks on white
    const contactTex = this.trackTex(createContactShadowTexture());
    if (contactTex) {
      this.contactMat = this.trackMat(new THREE.MeshBasicMaterial({
        map: contactTex,
        transparent: true,
        opacity: 0.3,
        depthWrite: false
      }));
      const contactPlane = new THREE.Mesh(this.trackGeo(new THREE.PlaneGeometry(5.6, 3.9)), this.contactMat);
      contactPlane.rotation.x = -Math.PI / 2;
      contactPlane.position.set(-0.18, 0.007, 0);
      scene.add(contactPlane);
    }
  }

  buildMaterials() {
    const maxAniso = Math.min(this.renderer.capabilities.getMaxAnisotropy() || 4, 8);
    const realClips = [this.clipPlaneReal];
    const cadClips = [this.clipPlaneCad];

    const navyTex = createWeatheredPaintTextures('#1E3A6B', '#B8C4D4', 42, maxAniso);
    this.trackTex(navyTex.map);
    this.trackTex(navyTex.roughnessMap);
    this.trackTex(navyTex.bumpMap);

    const navyDarkTex = createWeatheredPaintTextures('#152A4E', '#9BA8BA', 57, maxAniso);
    this.trackTex(navyDarkTex.map);
    this.trackTex(navyDarkTex.roughnessMap);
    this.trackTex(navyDarkTex.bumpMap);

    const yellowTex = createWeatheredPaintTextures('#E8AD1E', '#C9B58C', 73, maxAniso);
    this.trackTex(yellowTex.map);
    this.trackTex(yellowTex.roughnessMap);
    this.trackTex(yellowTex.bumpMap);

    const ironBump = this.trackTex(createCastIronBumpTexture(maxAniso));
    const hazardTex = this.trackTex(createHazardStripeTexture(maxAniso));
    const loadChartTex = this.trackTex(createLoadChartPlateTexture(maxAniso));
    const ballastTex = this.trackTex(createBallastPlateTexture(maxAniso));
    const panelTex = this.trackTex(createControlPanelTexture(maxAniso));
    const gaugeTex = this.trackTex(createGaugeDialTexture(maxAniso));
    const drumTex = this.trackTex(createGroovedDrumTexture(maxAniso));
    const acmeTex = this.trackTex(createAcmeThreadTexture(maxAniso));

    // REAL WEATHERED INDUSTRIAL PBR MATERIAL SET (clipped by clipPlaneReal)
    this.mats = {
      svindNavy: this.trackMat(new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: navyTex.map,
        roughnessMap: navyTex.roughnessMap,
        bumpMap: navyTex.bumpMap,
        bumpScale: 0.012,
        roughness: 0.52,
        metalness: 0.28,
        clearcoat: 0.22,
        clearcoatRoughness: 0.44,
        clippingPlanes: realClips,
        clipShadows: true
      })),
      svindNavyDark: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: navyDarkTex.map,
        roughnessMap: navyDarkTex.roughnessMap,
        bumpMap: navyDarkTex.bumpMap,
        bumpScale: 0.014,
        roughness: 0.56,
        metalness: 0.34,
        clippingPlanes: realClips,
        clipShadows: true
      })),
      safetyYellow: this.trackMat(new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: yellowTex.map,
        roughnessMap: yellowTex.roughnessMap,
        bumpMap: yellowTex.bumpMap,
        bumpScale: 0.011,
        roughness: 0.46,
        metalness: 0.22,
        clearcoat: 0.28,
        clearcoatRoughness: 0.38,
        clippingPlanes: realClips,
        clipShadows: true
      })),
      hazardStripe: this.trackMat(new THREE.MeshStandardMaterial({
        map: hazardTex,
        color: 0xffffff,
        roughness: 0.55,
        metalness: 0.12,
        clippingPlanes: realClips,
        clipShadows: true
      })),
      hookRed: this.trackMat(new THREE.MeshPhysicalMaterial({
        color: 0xc23326,
        roughness: 0.36,
        metalness: 0.24,
        clearcoat: 0.28,
        clippingPlanes: realClips,
        clipShadows: true
      })),
      forgedSteel: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0x2c323b,
        bumpMap: ironBump,
        bumpScale: 0.008,
        roughness: 0.38,
        metalness: 0.86,
        clippingPlanes: realClips,
        clipShadows: true
      })),
      chrome: this.trackMat(new THREE.MeshPhysicalMaterial({
        color: 0xe3e8ef,
        roughness: 0.11,
        metalness: 0.96,
        anisotropy: 0.78,
        clearcoat: 0.4,
        clippingPlanes: realClips,
        clipShadows: true
      })),
      machinedSteel: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0x9aa4b2,
        roughness: 0.24,
        metalness: 0.9,
        clippingPlanes: realClips,
        clipShadows: true
      })),
      brass: this.trackMat(new THREE.MeshPhysicalMaterial({
        color: 0xc79c44,
        roughness: 0.24,
        metalness: 0.92,
        anisotropy: 0.5,
        clippingPlanes: realClips,
        clipShadows: true
      })),
      boltSteel: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0xb6c0ce,
        roughness: 0.28,
        metalness: 0.9,
        clippingPlanes: realClips,
        clipShadows: true
      })),
      drumGrooved: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0xb0b8c4,
        map: drumTex,
        bumpMap: drumTex,
        bumpScale: 0.025,
        roughness: 0.32,
        metalness: 0.86,
        clippingPlanes: realClips,
        clipShadows: true
      })),
      acmeThread: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0xccd4df,
        map: acmeTex,
        bumpMap: acmeTex,
        bumpScale: 0.02,
        roughness: 0.28,
        metalness: 0.88,
        clippingPlanes: realClips,
        clipShadows: true
      })),
      wireRope: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0x454e59,
        roughness: 0.4,
        metalness: 0.84,
        clippingPlanes: realClips,
        clipShadows: true
      })),
      rubberHose: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0x1a1e24,
        roughness: 0.86,
        metalness: 0.08,
        clippingPlanes: realClips,
        clipShadows: true
      })),
      castIron: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0x262c34,
        bumpMap: ironBump,
        bumpScale: 0.022,
        roughness: 0.72,
        metalness: 0.56,
        clippingPlanes: realClips,
        clipShadows: true
      })),
      loadChartPlate: this.trackMat(new THREE.MeshStandardMaterial({
        map: loadChartTex,
        color: 0xffffff,
        roughness: 0.42,
        metalness: 0.16,
        clippingPlanes: realClips
      })),
      ballastPlate: this.trackMat(new THREE.MeshStandardMaterial({
        map: ballastTex,
        color: 0xffffff,
        roughness: 0.52,
        metalness: 0.22,
        clippingPlanes: realClips
      })),
      controlPanel: this.trackMat(new THREE.MeshStandardMaterial({
        map: panelTex,
        color: 0xffffff,
        roughness: 0.48,
        metalness: 0.18,
        clippingPlanes: realClips
      })),
      gaugeDial: this.trackMat(new THREE.MeshStandardMaterial({
        map: gaugeTex,
        color: 0xffffff,
        roughness: 0.22,
        metalness: 0.1,
        clippingPlanes: realClips
      })),
      oilGlass: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0xc97b18,
        emissive: 0x3b1f00,
        emissiveIntensity: 0.35,
        roughness: 0.12,
        metalness: 0.15,
        clippingPlanes: realClips
      }))
    };

    // CAD CLAY-WIREFRAME MATERIAL SET (inspired by IMG_8527, clipped by clipPlaneCad)
    this.cadClayMat = this.trackMat(new THREE.MeshStandardMaterial({
      color: 0xe8ecf1,
      roughness: 0.88,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
      clippingPlanes: cadClips,
      clipShadows: true
    }));

    this.cadClayDarkMat = this.trackMat(new THREE.MeshStandardMaterial({
      color: 0xc8d0da,
      roughness: 0.84,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
      clippingPlanes: cadClips,
      clipShadows: true
    }));

    this.cadWireMat = this.trackMat(new THREE.LineBasicMaterial({
      color: 0x161b24,
      transparent: true,
      opacity: 0.78,
      clippingPlanes: cadClips
    }));
  }

  addBox(parent, w, h, d, mat, x, y, z, opts = {}) {
    const mesh = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(w, h, d)), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = opts.castShadow !== false;
    mesh.receiveShadow = opts.receiveShadow !== false;
    if (opts.cadEdgeAngle != null) mesh.userData.cadEdgeAngle = opts.cadEdgeAngle;
    if (opts.cadDark) mesh.userData.cadDark = true;
    parent.add(mesh);
    return mesh;
  }

  queueBolt(x, y, z, rx = 0, ry = 0, rz = 0, scale = 1) {
    this.boltTransforms.push({ x, y, z, rx, ry, rz, scale });
  }

  registerExplode(obj, ox, oy, oz, group = 'drive') {
    this.explodeParts.push({
      obj,
      basePos: obj.position.clone(),
      offset: new THREE.Vector3(ox, oy, oz),
      group
    });
    return obj;
  }

  attachAnchor(id, parent, x, y, z) {
    const anchor = new THREE.Object3D();
    anchor.name = `tagAnchor_${id}`;
    anchor.position.set(x, y, z);
    parent.add(anchor);
    this.tagAnchors.set(id, anchor);
    return anchor;
  }

  buildRealFloorCrane() {
    const root = new THREE.Group();
    root.name = 'craneRoot';
    this.realCraneRoot = root;
    this.scene.add(root);

    const wheelR = 0.118;
    const baseY = wheelR * 2 + 0.044;

    // ----------------------------------------------------------------------
    // 1. OUTRIGGER CHASSIS BASE + WELDED GUSSETS + HAZARD TIPS
    // ----------------------------------------------------------------------
    const chassis = new THREE.Group();
    chassis.name = 'chassis';
    root.add(chassis);

    // Twin main outrigger legs in weathered SVIND Navy
    [-0.66, 0.66].forEach((z) => {
      this.addBox(chassis, 2.66, 0.115, 0.115, this.mats.svindNavy, 0.24, baseY, z);
      // Hazard bumper end caps at front forks
      this.addBox(chassis, 0.14, 0.122, 0.122, this.mats.hazardStripe, -1.07, baseY, z);
      // Rear end weld cap
      this.addBox(chassis, 0.03, 0.12, 0.12, this.mats.svindNavyDark, 1.58, baseY, z);
      // Top reinforcing rib bar
      this.addBox(chassis, 2.24, 0.018, 0.065, this.mats.svindNavyDark, 0.34, baseY + 0.066, z);
    });

    // Crossbeams
    [-0.92, -0.15, 0.68, 1.48].forEach((x) => {
      this.addBox(chassis, 0.115, 0.105, 1.42, this.mats.svindNavy, x, baseY, 0);
    });
    // Central spine beam
    this.addBox(chassis, 1.62, 0.115, 0.15, this.mats.svindNavy, 0.68, baseY, 0);

    // Triangular welded corner gusset plates on chassis intersections
    const gussetGeo = createGussetGeo(0.16, 0.16, 0.016, (g) => this.trackGeo(g));
    [
      [-0.82, -0.54, 0],
      [-0.82, 0.54, Math.PI / 2],
      [0.58, -0.54, -Math.PI / 2],
      [0.58, 0.54, Math.PI]
    ].forEach(([gx, gz, rotY]) => {
      const gMesh = new THREE.Mesh(gussetGeo, this.mats.svindNavyDark);
      gMesh.rotation.x = Math.PI / 2;
      gMesh.rotation.z = rotY;
      gMesh.position.set(gx, baseY + 0.048, gz);
      gMesh.castShadow = true;
      chassis.add(gMesh);
    });

    // Heavy-duty swivel casters with double-plate forks & foot lock pedals (explodable)
    const casterCoords = [
      [-0.94, -0.66],
      [-0.94, 0.66],
      [0.72, -0.66],
      [0.72, 0.66]
    ];
    casterCoords.forEach(([cx, cz], ci) => {
      const caster = new THREE.Group();
      caster.name = `caster_${ci}`;
      caster.position.set(cx, 0, cz);

      // Top mounting plate + 4 bolts
      this.addBox(caster, 0.16, 0.026, 0.16, this.mats.forgedSteel, 0, baseY - 0.068, 0, { cadDark: true });
      [[-0.055, -0.055], [-0.055, 0.055], [0.055, -0.055], [0.055, 0.055]].forEach(([bx, bz]) => {
        this.queueBolt(cx + bx, baseY - 0.05, cz + bz, 0, 0, 0, 0.8);
      });

      // Swivel raceway bearing collar
      const race = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.058, 0.062, 0.028, 16)), this.mats.machinedSteel);
      race.position.set(0, baseY - 0.092, 0);
      caster.add(race);

      // Fork cheeks
      [-0.046, 0.046].forEach((fz) => {
        const leg = this.addBox(caster, 0.095, 0.138, 0.018, this.mats.machinedSteel, -0.022, wheelR + 0.036, fz);
        leg.rotation.z = 0.2;
      });

      // Wheel brake pedal tab
      const pedal = this.addBox(caster, 0.08, 0.014, 0.056, this.mats.hookRed, 0.068, wheelR + 0.045, 0);
      pedal.rotation.z = -0.35;

      // Polyurethane wheel tread + steel rim + axle bolt
      const tire = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(wheelR, wheelR, 0.07, 24)), this.mats.rubberHose);
      tire.rotation.x = Math.PI / 2;
      tire.position.set(-0.03, wheelR, 0);
      tire.castShadow = true;
      tire.userData.cadWire = true;
      caster.add(tire);

      const rim = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(wheelR * 0.58, wheelR * 0.58, 0.078, 18)), this.mats.safetyYellow);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(-0.03, wheelR, 0);
      caster.add(rim);

      const axle = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.125, 12)), this.mats.machinedSteel);
      axle.rotation.x = Math.PI / 2;
      axle.position.set(-0.03, wheelR, 0);
      caster.add(axle);

      root.add(caster);
      if (ci === 0) this.caster0 = caster;
      this.registerExplode(caster, 0, -0.06, Math.sign(cz) * 0.16, 'chassis');
    });

    // ----------------------------------------------------------------------
    // 2. ACME-THREADED MANUAL SCREW-DOWN STABILIZING JACKS
    // ----------------------------------------------------------------------
    this.jacks = [];
    const jackCoords = [
      [-1.08, -0.78],
      [-1.08, 0.78],
      [0.86, -0.78],
      [0.86, 0.78]
    ];
    jackCoords.forEach(([jx, jz], ji) => {
      const jackBracket = new THREE.Group();
      jackBracket.name = `jackBracket_${ji}`;
      jackBracket.position.set(jx, baseY, jz);

      this.addBox(jackBracket, 0.14, 0.115, 0.14, this.mats.svindNavyDark, 0, 0, 0);

      // Threaded cast-iron guide nut collar
      const sleeve = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.044, 0.044, 0.18, 16)), this.mats.castIron);
      sleeve.position.y = 0.02;
      sleeve.userData.cadWire = true;
      jackBracket.add(sleeve);

      const brassCollar = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.048, 0.048, 0.024, 16)), this.mats.brass);
      brassCollar.position.y = 0.115;
      jackBracket.add(brassCollar);

      const plunger = new THREE.Group();
      plunger.name = `jackPlunger_${ji}`;
      plunger.userData.parkedY = -0.085;
      plunger.userData.deployedY = -baseY + 0.015;
      plunger.position.y = plunger.userData.parkedY;

      const rod = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.36, 14)), this.mats.acmeThread);
      rod.position.y = 0.175;
      rod.castShadow = true;
      plunger.add(rod);

      // Knurled top handwheel + crank handle
      const wheel = createHandwheelMesh(0.072, this.mats.machinedSteel, this.mats.forgedSteel, (g) => this.trackGeo(g));
      wheel.rotation.x = Math.PI / 2;
      wheel.position.y = 0.355;
      plunger.add(wheel);

      // Safety-yellow beveled steel floor pad + rubber underside
      this.addBox(plunger, 0.15, 0.02, 0.15, this.mats.safetyYellow, 0, 0.006, 0);
      this.addBox(plunger, 0.142, 0.01, 0.142, this.mats.rubberHose, 0, -0.007, 0, { cadDark: true });

      jackBracket.add(plunger);
      root.add(jackBracket);
      this.jacks.push(plunger);
      this.registerExplode(jackBracket, Math.sign(jx) * 0.06, 0, Math.sign(jz) * 0.18, 'chassis');
    });

    // ----------------------------------------------------------------------
    // 3. VERTICAL MAST TOWER, BOLTED FLANGE, A-FRAME & HYDRAULIC POWER PACK
    // ----------------------------------------------------------------------
    const mast = new THREE.Group();
    mast.name = 'mast';
    root.add(mast);

    // Main vertical mast box column in weathered SVIND Navy
    this.addBox(mast, 0.175, 2.02, 0.175, this.mats.svindNavy, -0.15, baseY + 1.01, 0);
    // Welded base flange plate + 8 heavy hex anchor bolts
    this.addBox(mast, 0.34, 0.042, 0.34, this.mats.forgedSteel, -0.15, baseY + 0.064, 0, { cadDark: true });
    [
      [-0.28, -0.12], [-0.28, 0.12], [-0.02, -0.12], [-0.02, 0.12],
      [-0.15, -0.135], [-0.15, 0.135], [-0.28, 0], [-0.02, 0]
    ].forEach(([bx, bz]) => {
      this.queueBolt(bx, baseY + 0.095, bz, 0, 0, 0, 1.05);
    });

    // Diagonal mast base stiffener fins
    [-0.125, 0.125].forEach((sz) => {
      const fin = new THREE.Mesh(gussetGeo, this.mats.svindNavyDark);
      fin.position.set(-0.27, baseY + 0.16, sz);
      fin.rotation.y = Math.PI;
      mast.add(fin);
    });

    // Diagonal A-frame side bracing struts leaning flush into the main vertical mast column
    [-0.58, 0.58].forEach((sz) => {
      const pFoot = new THREE.Vector3(-0.15, baseY + 0.06, sz);
      const pTop = new THREE.Vector3(-0.15, baseY + 1.66, Math.sign(sz) * 0.085);
      const span = new THREE.Vector3().subVectors(pTop, pFoot);
      const mid = new THREE.Vector3().addVectors(pFoot, pTop).multiplyScalar(0.5);
      const strut = this.addBox(mast, 0.076, span.length(), 0.076, this.mats.svindNavy, mid.x, mid.y, mid.z);
      strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), span.clone().normalize());
      // Clevis collar at foot & top gusset collar on mast
      this.addBox(mast, 0.115, 0.085, 0.115, this.mats.forgedSteel, -0.15, baseY + 0.08, sz, { cadDark: true });
      this.addBox(mast, 0.11, 0.12, 0.055, this.mats.svindNavyDark, -0.15, baseY + 1.64, Math.sign(sz) * 0.1);
    });

    // Rear mast column + top clevis yoke
    this.addBox(mast, 0.145, 1.84, 0.145, this.mats.svindNavy, 0.68, baseY + 0.92, 0);
    this.addBox(mast, 0.28, 0.04, 0.28, this.mats.forgedSteel, 0.68, baseY + 0.062, 0, { cadDark: true });
    this.addBox(mast, 0.36, 0.34, 0.21, this.mats.svindNavyDark, -0.15, baseY + 1.84, 0);

    // Boom pivot pin with machined retaining caps
    const boomPivotPos = new THREE.Vector3(-0.15, 2.28, 0);
    const pivotPin = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.28, 18)), this.mats.machinedSteel);
    pivotPin.rotation.x = Math.PI / 2;
    pivotPin.position.copy(boomPivotPos);
    mast.add(pivotPin);
    [-0.145, 0.145].forEach((pz) => {
      const cap = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.056, 0.056, 0.018, 16)), this.mats.brass);
      cap.rotation.x = Math.PI / 2;
      cap.position.set(boomPivotPos.x, boomPivotPos.y, pz);
      mast.add(cap);
    });

    // Side-mounted Hydraulic Power Unit (Tank + Pressure Gauge + Hand Valve + Braided Hoses)
    const hydroPack = new THREE.Group();
    hydroPack.name = 'hydroPack';
    hydroPack.position.set(-0.02, baseY + 0.64, -0.19);
    this.addBox(hydroPack, 0.24, 0.36, 0.18, this.mats.castIron, 0, 0, 0, { cadDark: true });
    // Brass filler breather cap on top
    const breather = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.026, 0.026, 0.045, 12)), this.mats.brass);
    breather.position.set(-0.05, 0.2, 0);
    hydroPack.add(breather);

    // Pressure gauge with procedural dial face
    const gaugeCase = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.044, 0.044, 0.028, 18)), this.mats.machinedSteel);
    gaugeCase.rotation.x = Math.PI / 2;
    gaugeCase.position.set(0.055, 0.11, -0.095);
    hydroPack.add(gaugeCase);
    const gaugeFace = new THREE.Mesh(this.trackGeo(new THREE.CircleGeometry(0.038, 18)), this.mats.gaugeDial);
    gaugeFace.rotation.y = Math.PI;
    gaugeFace.position.set(0.055, 0.11, -0.111);
    hydroPack.add(gaugeFace);

    // Directional spool valve block + operator hand lever
    this.addBox(hydroPack, 0.11, 0.1, 0.08, this.mats.machinedSteel, -0.04, 0.06, -0.1);
    const lever = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 8)), this.mats.chrome);
    lever.position.set(-0.04, 0.16, -0.14);
    lever.rotation.x = -0.35;
    hydroPack.add(lever);
    const leverBall = new THREE.Mesh(this.trackGeo(new THREE.SphereGeometry(0.022, 12, 12)), this.mats.hookRed);
    leverBall.position.set(-0.04, 0.26, -0.18);
    hydroPack.add(leverBall);

    mast.add(hydroPack);
    this.registerExplode(hydroPack, 0, 0, -0.22, 'boom');

    // Dual flexible braided hydraulic hoses routing from power pack up to luffing ram clevis
    const hoseCurveA = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.02, baseY + 0.82, -0.19),
      new THREE.Vector3(0.08, baseY + 0.96, -0.26),
      new THREE.Vector3(0.08, 1.24, -0.16),
      new THREE.Vector3(-0.04, 1.26, -0.055)
    ]);
    const hoseA = new THREE.Mesh(this.trackGeo(new THREE.TubeGeometry(hoseCurveA, 28, 0.014, 10, false)), this.mats.rubberHose);
    hoseA.castShadow = true;
    hoseA.userData.cadWire = true;
    mast.add(hoseA);

    const hoseCurveB = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.08, baseY + 0.82, -0.19),
      new THREE.Vector3(-0.14, baseY + 1.02, -0.28),
      new THREE.Vector3(-0.18, 1.38, -0.18),
      new THREE.Vector3(-0.12, 1.44, -0.06)
    ]);
    const hoseB = new THREE.Mesh(this.trackGeo(new THREE.TubeGeometry(hoseCurveB, 28, 0.013, 10, false)), this.mats.rubberHose);
    hoseB.castShadow = true;
    hoseB.userData.cadWire = true;
    mast.add(hoseB);

    // Brass hex crimp ferrules on hose ports
    [
      [-0.02, baseY + 0.83, -0.19],
      [-0.08, baseY + 0.83, -0.19],
      [-0.04, 1.26, -0.055],
      [-0.12, 1.44, -0.06]
    ].forEach(([fx, fy, fz]) => {
      const ferrule = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.021, 0.021, 0.036, 6)), this.mats.brass);
      ferrule.position.set(fx, fy, fz);
      mast.add(ferrule);
    });

    // ----------------------------------------------------------------------
    // 4. REAR 1.5 TON BALLAST CAGE + GROOVED WINCH + FINNED MOTOR & GEARBOX
    // ----------------------------------------------------------------------
    const rearDeckY = baseY + 0.06;

    // Safety-yellow ballast steel cage framing
    this.addBox(mast, 0.64, 0.052, 0.88, this.mats.svindNavy, 1.24, rearDeckY + 0.02, 0);
    [
      [0.95, -0.4], [0.95, 0.4], [1.52, -0.4], [1.52, 0.4]
    ].forEach(([px, pz]) => {
      this.addBox(mast, 0.048, 0.58, 0.048, this.mats.safetyYellow, px, rearDeckY + 0.31, pz);
    });
    this.addBox(mast, 0.62, 0.042, 0.048, this.mats.safetyYellow, 1.24, rearDeckY + 0.58, -0.4);
    this.addBox(mast, 0.62, 0.042, 0.048, this.mats.safetyYellow, 1.24, rearDeckY + 0.58, 0.4);
    this.addBox(mast, 0.048, 0.042, 0.84, this.mats.safetyYellow, 1.52, rearDeckY + 0.58, 0);
    this.addBox(mast, 0.048, 0.042, 0.84, this.mats.safetyYellow, 0.95, rearDeckY + 0.58, 0);

    // Stacked slotted cast-iron counterweight slabs (4 visible heavy plates)
    for (let s = 0; s < 4; s += 1) {
      this.addBox(mast, 0.52, 0.118, 0.74, this.mats.castIron, 1.24, rearDeckY + 0.1 + s * 0.128, 0, { cadDark: true });
    }

    const ballastBadge = this.addBox(mast, 0.44, 0.165, 0.014, this.mats.ballastPlate, 1.24, rearDeckY + 0.31, 0.43, { castShadow: false });
    const ballastBadgeBack = this.addBox(mast, 0.44, 0.165, 0.014, this.mats.ballastPlate, 1.24, rearDeckY + 0.31, -0.43, { castShadow: false });
    ballastBadgeBack.rotation.y = Math.PI;
    ballastBadge.userData.cadEdgeAngle = 40;

    // Upper winch deck frame
    const winchDeckY = rearDeckY + 0.76;
    [
      [0.92, -0.34], [0.92, 0.34], [1.46, -0.34], [1.46, 0.34]
    ].forEach(([px, pz]) => {
      this.addBox(mast, 0.044, 0.2, 0.044, this.mats.svindNavy, px, winchDeckY - 0.09, pz);
    });
    this.addBox(mast, 0.62, 0.048, 0.76, this.mats.svindNavy, 1.19, winchDeckY, 0);

    // Grooved cable winch drum + bolted flanges + pillow block
    const winchDrum = new THREE.Group();
    winchDrum.name = 'winchDrum';
    winchDrum.position.set(1.06, winchDeckY + 0.2, -0.06);
    const drumCore = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.135, 0.135, 0.36, 28)), this.mats.drumGrooved);
    drumCore.rotation.x = Math.PI / 2;
    drumCore.castShadow = true;
    drumCore.userData.cadWire = true;
    winchDrum.add(drumCore);

    [-0.185, 0.185].forEach((fz) => {
      const flange = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.2, 0.2, 0.024, 24)), this.mats.forgedSteel);
      flange.rotation.x = Math.PI / 2;
      flange.position.z = fz;
      winchDrum.add(flange);
    });
    // Pillow block bearing stand
    this.addBox(mast, 0.14, 0.25, 0.065, this.mats.castIron, 1.06, winchDeckY + 0.14, -0.29, { cadDark: true });
    this.queueBolt(1.01, winchDeckY + 0.036, -0.29, 0, 0, 0, 0.9);
    this.queueBolt(1.11, winchDeckY + 0.036, -0.29, 0, 0, 0, 0.9);

    mast.add(winchDrum);
    this.winchDrum = winchDrum;
    this.winchTopWorld = new THREE.Vector3(1.06, winchDeckY + 0.33, -0.06);

    // Helical Reduction Gearbox + Explodable Inspection Cover + Oil Sight Glass + Manual Handwheel
    const gearboxGroup = new THREE.Group();
    gearboxGroup.name = 'gearboxGroup';
    gearboxGroup.position.set(1.08, winchDeckY + 0.18, 0.21);
    this.addBox(gearboxGroup, 0.27, 0.3, 0.18, this.mats.castIron, 0, 0, 0, { cadDark: true });
    // Gearbox side inspection plate with 6 bolts (explodable!)
    const gbCover = new THREE.Group();
    gbCover.name = 'gbCover';
    gbCover.position.set(0, 0, 0.095);
    this.addBox(gbCover, 0.21, 0.22, 0.022, this.mats.svindNavy, 0, 0, 0);
    // Brass oil sight glass
    const sightBezel = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.026, 0.026, 0.022, 14)), this.mats.brass);
    sightBezel.rotation.x = Math.PI / 2;
    sightBezel.position.set(-0.04, -0.04, 0.016);
    gbCover.add(sightBezel);
    const sightLens = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.026, 14)), this.mats.oilGlass);
    sightLens.rotation.x = Math.PI / 2;
    sightLens.position.set(-0.04, -0.04, 0.017);
    gbCover.add(sightLens);

    // Emergency manual lowering handwheel on gearbox cover (homage to reference workshop machine!)
    const gbWheel = createHandwheelMesh(0.075, this.mats.machinedSteel, this.mats.forgedSteel, (g) => this.trackGeo(g));
    gbWheel.position.set(0.042, 0.032, 0.032);
    gbCover.add(gbWheel);

    gearboxGroup.add(gbCover);
    mast.add(gearboxGroup);
    this.gbCover = gbCover;
    this.registerExplode(gbCover, 0, 0, 0.28, 'drive');

    // Ribbed Cooling-Fin Electric Hoist Motor + Fan Cowl + Terminal Junction Box (homage to IMG_8527 & IMG_8528!)
    const motorGroup = new THREE.Group();
    motorGroup.name = 'motorGroup';
    motorGroup.position.set(1.31, winchDeckY + 0.18, 0.21);

    const motorCore = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.092, 0.092, 0.26, 20)), this.mats.svindNavyDark);
    motorCore.rotation.z = Math.PI / 2;
    motorCore.castShadow = true;
    motorCore.userData.cadWire = true;
    motorGroup.add(motorCore);

    // 11 radial cooling fins along motor barrel
    const finGeo = this.trackGeo(new THREE.CylinderGeometry(0.114, 0.114, 0.009, 20));
    finGeo.rotateZ(Math.PI / 2);
    for (let f = 0; f < 11; f += 1) {
      const fin = new THREE.Mesh(finGeo, this.mats.svindNavy);
      fin.position.x = -0.105 + f * 0.021;
      fin.castShadow = true;
      motorGroup.add(fin);
    }

    // Top bolted electrical terminal junction box
    this.addBox(motorGroup, 0.11, 0.075, 0.095, this.mats.castIron, 0, 0.13, 0, { cadDark: true });
    // Rear ventilated fan cowl (explodable!)
    const fanCowl = new THREE.Group();
    fanCowl.name = 'fanCowl';
    fanCowl.position.set(0.16, 0, 0);
    const cowlCyl = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.106, 0.11, 0.09, 20)), this.mats.castIron);
    cowlCyl.rotation.z = Math.PI / 2;
    cowlCyl.userData.cadWire = true;
    fanCowl.add(cowlCyl);
    const cowlCap = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.088, 0.106, 0.03, 20)), this.mats.forgedSteel);
    cowlCap.rotation.z = Math.PI / 2;
    cowlCap.position.x = 0.055;
    fanCowl.add(cowlCap);
    motorGroup.add(fanCowl);
    this.registerExplode(fanCowl, 0.28, 0, 0, 'drive');

    mast.add(motorGroup);
    this.motorGroup = motorGroup;
    this.registerExplode(motorGroup, 0.18, 0, 0, 'drive');

    // 415V Electrical Control Enclosure + Rotary Isolator + Red E-Stop + Braided Conduit
    const ctrlBox = new THREE.Group();
    ctrlBox.name = 'ctrlBox';
    ctrlBox.position.set(0.84, winchDeckY - 0.18, -0.35);
    this.addBox(ctrlBox, 0.23, 0.34, 0.15, this.mats.svindNavy, 0, 0, 0);
    // Front nameplate face
    const panelFace = this.addBox(ctrlBox, 0.20, 0.30, 0.01, this.mats.controlPanel, 0, 0, -0.078, { castShadow: false });
    panelFace.rotation.y = Math.PI;
    // Rotary disconnect switch
    const isolator = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.032, 12)), this.mats.forgedSteel);
    isolator.rotation.x = Math.PI / 2;
    isolator.position.set(-0.045, 0.02, -0.088);
    ctrlBox.add(isolator);
    // Red mushroom E-stop button on yellow collar
    const estopCollar = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.032, 0.032, 0.014, 14)), this.mats.safetyYellow);
    estopCollar.rotation.x = Math.PI / 2;
    estopCollar.position.set(0.048, 0.02, -0.084);
    ctrlBox.add(estopCollar);
    const estop = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.024, 0.018, 0.032, 14)), this.mats.hookRed);
    estop.rotation.x = Math.PI / 2;
    estop.position.set(0.048, 0.02, -0.098);
    ctrlBox.add(estop);
    mast.add(ctrlBox);
    this.registerExplode(ctrlBox, 0, 0, -0.22, 'drive');

    // Flexible armored power conduit linking control box to hoist motor
    const conduitCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.84, winchDeckY - 0.01, -0.35),
      new THREE.Vector3(0.95, winchDeckY + 0.08, -0.22),
      new THREE.Vector3(1.18, winchDeckY + 0.11, 0.05),
      new THREE.Vector3(1.31, winchDeckY + 0.28, 0.21)
    ]);
    const conduitMesh = new THREE.Mesh(this.trackGeo(new THREE.TubeGeometry(conduitCurve, 26, 0.016, 10, false)), this.mats.rubberHose);
    conduitMesh.userData.cadWire = true;
    mast.add(conduitMesh);

    // Rear mast upper rope guide sheave
    const rearGuidePos = new THREE.Vector3(0.68, 2.15, 0);
    const rearSheave = createGroovedSheaveMesh(0.115, 0.052, this.mats.machinedSteel, this.mats.forgedSteel, (g) => this.trackGeo(g));
    rearSheave.position.copy(rearGuidePos);
    mast.add(rearSheave);
    this.rearGuideWorld = new THREE.Vector3(0.68, 2.26, 0);

    // ----------------------------------------------------------------------
    // 5. CANTILEVER TELESCOPING BOOM, LOAD CHART, BRASS WEAR PADS & TIP SHEAVE
    // ----------------------------------------------------------------------
    const boomPivot = new THREE.Group();
    boomPivot.name = 'boomPivot';
    boomPivot.position.copy(boomPivotPos);
    root.add(boomPivot);
    this.boomPivot = boomPivot;

    // Main outer box-section boom in weathered SVIND Navy
    this.addBox(boomPivot, 2.52, 0.19, 0.17, this.mats.svindNavy, -0.34, 0, 0);
    // Reinforced front nose collar + brass friction wear pads
    this.addBox(boomPivot, 0.16, 0.22, 0.20, this.mats.svindNavyDark, -1.56, 0, 0);
    [-0.104, 0.104].forEach((pz) => {
      this.addBox(boomPivot, 0.11, 0.055, 0.014, this.mats.brass, -1.56, 0, pz);
    });
    // Telescoping lock T-pin on boom nose
    const lockPin = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.26, 12)), this.mats.chrome);
    lockPin.rotation.x = Math.PI / 2;
    lockPin.position.set(-1.56, 0.06, 0);
    boomPivot.add(lockPin);
    this.addBox(boomPivot, 0.09, 0.022, 0.022, this.mats.hookRed, -1.56, 0.06, -0.14);

    // Side bolted reinforcement splice plates + riveted SVIND Load Chart plates
    const swlFront = this.addBox(boomPivot, 0.72, 0.135, 0.01, this.mats.loadChartPlate, -0.82, 0, 0.09, { castShadow: false });
    const swlBack = this.addBox(boomPivot, 0.72, 0.135, 0.01, this.mats.loadChartPlate, -0.82, 0, -0.09, { castShadow: false });
    swlBack.rotation.y = Math.PI;
    swlFront.userData.cadEdgeAngle = 45;

    // Mid-boom fairlead guide sheave
    const midGuide = createGroovedSheaveMesh(0.06, 0.044, this.mats.machinedSteel, this.mats.forgedSteel, (g) => this.trackGeo(g));
    midGuide.position.set(-0.25, 0.14, 0);
    boomPivot.add(midGuide);
    this.midGuideLocal = new THREE.Vector3(-0.25, 0.195, 0);

    // Telescoping inner jib arm in Safety Yellow (moves both with kinematics and subtly separates on Explode!)
    const boomExt = new THREE.Group();
    boomExt.name = 'boomExt';
    boomPivot.add(boomExt);
    this.boomExt = boomExt;

    this.addBox(boomExt, 1.18, 0.14, 0.125, this.mats.safetyYellow, -1.80, 0, 0);
    // 3 machined reach-position locking holes along the inner jib
    [-1.45, -1.72, -1.99].forEach((hx) => {
      const holeRing = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.136, 12)), this.mats.forgedSteel);
      holeRing.rotation.x = Math.PI / 2;
      holeRing.position.set(hx, 0, 0);
      boomExt.add(holeRing);
    });

    // Boom tip head assembly with beveled twin cheek plates + head sheave + anti-two-block limit switch
    const tipHead = new THREE.Group();
    tipHead.name = 'tipHead';
    tipHead.position.set(-2.38, -0.01, 0);
    boomExt.add(tipHead);
    this.tipHead = tipHead;

    const tipCheekGeo = createBeveledCheekGeo(0.26, 0.24, 0.018, (g) => this.trackGeo(g));
    [-0.072, 0.072].forEach((cz, ci) => {
      const cheek = new THREE.Mesh(tipCheekGeo, this.mats.svindNavyDark);
      cheek.position.set(-0.02, -0.03, cz);
      cheek.castShadow = true;
      cheek.name = `tipCheek_${ci}`;
      tipHead.add(cheek);
      this.registerExplode(cheek, 0, 0, Math.sign(cz) * 0.12, 'hook');
    });

    this.tipSheave = createGroovedSheaveMesh(0.12, 0.052, this.mats.machinedSteel, this.mats.forgedSteel, (g) => this.trackGeo(g));
    this.tipSheave.name = 'tipSheave';
    this.tipSheave.position.set(-0.04, -0.04, 0);
    tipHead.add(this.tipSheave);
    this.tipTopLocal = new THREE.Vector3(-0.04, 0.072, 0);
    this.tipAnchorLocal = new THREE.Vector3(-0.04, -0.145, 0);

    // Anti-two-block limit switch box + counterweight arm
    this.addBox(tipHead, 0.11, 0.085, 0.075, this.mats.hookRed, 0.075, -0.13, 0.092);
    const limitArm = this.addBox(tipHead, 0.17, 0.018, 0.018, this.mats.forgedSteel, -0.02, -0.165, 0.092);
    limitArm.rotation.z = 0.24;

    // ----------------------------------------------------------------------
    // 6. COUPLED HYDRAULIC LUFFING RAM (BARREL + CLEVIS LUGS + CHROME ROD)
    // ----------------------------------------------------------------------
    const ramMastClevis = new THREE.Vector3(-0.24, 1.16, 0);
    this.ramBoomLugLocal = new THREE.Vector3(-0.82, -0.13, 0);

    // Welded double-ear mast clevis bracket + brass pivot pin
    [-0.068, 0.068].forEach((cz) => {
      this.addBox(mast, 0.14, 0.12, 0.022, this.mats.svindNavyDark, -0.23, 1.16, cz);
    });
    const mastRamPin = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.18, 14)), this.mats.brass);
    mastRamPin.rotation.x = Math.PI / 2;
    mastRamPin.position.copy(ramMastClevis);
    mast.add(mastRamPin);

    // Welded double-ear boom underside clevis bracket + brass pivot pin
    [-0.064, 0.064].forEach((cz) => {
      this.addBox(boomPivot, 0.15, 0.11, 0.022, this.mats.svindNavyDark, this.ramBoomLugLocal.x, -0.11, cz);
    });
    const boomRamPin = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.17, 14)), this.mats.brass);
    boomRamPin.rotation.x = Math.PI / 2;
    boomRamPin.position.copy(this.ramBoomLugLocal);
    boomPivot.add(boomRamPin);

    const ramBarrelGroup = new THREE.Group();
    ramBarrelGroup.name = 'ramBarrelGroup';
    ramBarrelGroup.position.copy(ramMastClevis);
    root.add(ramBarrelGroup);
    this.ramBarrelGroup = ramBarrelGroup;

    // Base clevis eye on barrel
    const barrelEye = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.044, 0.044, 0.1, 14)), this.mats.forgedSteel);
    barrelEye.rotation.x = Math.PI / 2;
    ramBarrelGroup.add(barrelEye);

    const barrelMesh = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.056, 0.056, 0.78, 20)), this.mats.svindNavyDark);
    barrelMesh.rotation.x = Math.PI / 2;
    barrelMesh.position.z = 0.41;
    barrelMesh.castShadow = true;
    barrelMesh.userData.cadWire = true;
    ramBarrelGroup.add(barrelMesh);

    // Welded hydraulic port bosses on cylinder barrel
    [0.14, 0.66].forEach((pz) => {
      const boss = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.045, 10)), this.mats.brass);
      boss.rotation.z = Math.PI / 2;
      boss.position.set(-0.06, 0, pz);
      ramBarrelGroup.add(boss);
    });

    const glandNut = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.066, 0.066, 0.068, 18)), this.mats.forgedSteel);
    glandNut.rotation.x = Math.PI / 2;
    glandNut.position.z = 0.80;
    ramBarrelGroup.add(glandNut);

    const wiperRing = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.044, 0.044, 0.024, 16)), this.mats.brass);
    wiperRing.rotation.x = Math.PI / 2;
    wiperRing.position.z = 0.845;
    ramBarrelGroup.add(wiperRing);

    const ramPistonGroup = new THREE.Group();
    ramPistonGroup.name = 'ramPistonGroup';
    root.add(ramPistonGroup);
    this.ramPistonGroup = ramPistonGroup;

    // Rod eye pinned directly into the boom underside clevis
    const rodEye = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.095, 14)), this.mats.forgedSteel);
    rodEye.rotation.x = Math.PI / 2;
    ramPistonGroup.add(rodEye);

    const pistonRod = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.032, 0.032, 0.92, 20)), this.mats.chrome);
    pistonRod.rotation.x = Math.PI / 2;
    pistonRod.position.z = 0.46;
    pistonRod.castShadow = true;
    ramPistonGroup.add(pistonRod);

    // ----------------------------------------------------------------------
    // 7. TWIN-SHEAVE SNATCH BLOCK & FORGED SWIVEL HOOK (EXPLODABLE CHEEKS!)
    // ----------------------------------------------------------------------
    const hookBlock = new THREE.Group();
    hookBlock.name = 'hookBlock';
    root.add(hookBlock);
    this.hookBlock = hookBlock;

    const blockCheekGeo = createBeveledCheekGeo(0.165, 0.27, 0.018, (g) => this.trackGeo(g));
    [-0.056, 0.056].forEach((hz, hi) => {
      const cheek = new THREE.Mesh(blockCheekGeo, this.mats.safetyYellow);
      cheek.position.set(0, 0.04, hz);
      cheek.castShadow = true;
      cheek.name = `hookCheek_${hi}`;
      hookBlock.add(cheek);
      // Hazard stripe badge on outer face
      const stripe = this.addBox(cheek, 0.12, 0.035, 0.005, this.mats.hazardStripe, 0, -0.07, Math.sign(hz) * 0.012, { castShadow: false });
      stripe.userData.cadEdgeAngle = 45;
      if (hi === 0) this.hookCheek0 = cheek;
      this.registerExplode(cheek, 0, 0, Math.sign(hz) * 0.18, 'hook');
    });

    // Twin grooved steel sheaves inside the snatch block (revealed when Exploded!)
    [-0.024, 0.024].forEach((sz) => {
      const sh = createGroovedSheaveMesh(0.068, 0.036, this.mats.machinedSteel, this.mats.forgedSteel, (g) => this.trackGeo(g));
      sh.position.set(0, 0.072, sz);
      hookBlock.add(sh);
    });

    // Tie bolts spanning snatch block
    [
      [-0.054, 0.135], [0.054, 0.135], [-0.054, -0.042], [0.054, -0.042]
    ].forEach(([tx, ty]) => {
      const tie = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.011, 0.011, 0.145, 8)), this.mats.boltSteel);
      tie.rotation.x = Math.PI / 2;
      tie.position.set(tx, ty, 0);
      hookBlock.add(tie);
    });

    const hookSwivelPivot = new THREE.Group();
    hookSwivelPivot.name = 'hookSwivelPivot';
    hookSwivelPivot.position.y = -0.115;
    hookBlock.add(hookSwivelPivot);
    this.hookSwivelPivot = hookSwivelPivot;

    const thrustCollar = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.038, 0.034, 0.058, 16)), this.mats.brass);
    thrustCollar.position.y = 0.032;
    hookSwivelPivot.add(thrustCollar);

    const forgedHook = createForgedHookMesh(this.mats.forgedSteel, this.mats.safetyYellow, (g) => this.trackGeo(g));
    forgedHook.position.y = -0.115;
    hookSwivelPivot.add(forgedHook);
    this.registerExplode(hookSwivelPivot, 0, -0.14, 0, 'hook');

    // ----------------------------------------------------------------------
    // 8. INSTANCED HEX FASTENERS & FLANGE BOLTS (80+ HIGH-DETAIL BOLTS)
    // ----------------------------------------------------------------------
    // Add extra structural flange bolts along mast & ballast frame
    for (let y = 0; y < 5; y += 1) {
      this.queueBolt(-0.24, baseY + 0.35 + y * 0.36, -0.09, 0, 0, Math.PI / 2, 0.78);
      this.queueBolt(-0.24, baseY + 0.35 + y * 0.36, 0.09, 0, 0, Math.PI / 2, 0.78);
    }
    for (let x = 0; x < 6; x += 1) {
      this.queueBolt(-0.7 + x * 0.42, baseY + 0.066, -0.66, 0, 0, 0, 0.8);
      this.queueBolt(-0.7 + x * 0.42, baseY + 0.066, 0.66, 0, 0, 0, 0.8);
    }
    // Gearbox cover perimeter bolts
    [
      [-0.08, -0.08], [0, -0.08], [0.08, -0.08],
      [-0.08, 0.08], [0, 0.08], [0.08, 0.08]
    ].forEach(([bx, by]) => {
      this.queueBolt(1.08 + bx, winchDeckY + 0.18 + by, 0.31, Math.PI / 2, 0, 0, 0.75);
    });
    // Rear mast flange bolts
    [[0.58, -0.1], [0.58, 0.1], [0.78, -0.1], [0.78, 0.1]].forEach(([bx, bz]) => {
      this.queueBolt(bx, baseY + 0.09, bz, 0, 0, 0, 0.95);
    });

    const boltGeo = this.trackGeo(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 6));
    const boltInst = new THREE.InstancedMesh(boltGeo, this.mats.boltSteel, this.boltTransforms.length);
    boltInst.name = 'instancedBolts';
    boltInst.castShadow = true;
    this.boltTransforms.forEach((b, idx) => {
      this._boltDummy.position.set(b.x, b.y, b.z);
      this._boltDummy.rotation.set(b.rx, b.ry, b.rz);
      this._boltDummy.scale.setScalar(b.scale);
      this._boltDummy.updateMatrix();
      boltInst.setMatrixAt(idx, this._boltDummy.matrix);
    });
    boltInst.instanceMatrix.needsUpdate = true;
    boltInst.computeBoundingSphere();
    root.add(boltInst);

    // ----------------------------------------------------------------------
    // 9. DYNAMIC STEEL WIRE ROPE SEGMENTS (2-FALL REEVING)
    // ----------------------------------------------------------------------
    const ropeUnitGeo = this.trackGeo(new THREE.CylinderGeometry(0.0105, 0.0105, 1, 8));
    this.ropeSegs = [];
    for (let i = 0; i < 5; i += 1) {
      const ropeMesh = new THREE.Mesh(ropeUnitGeo, this.mats.wireRope);
      ropeMesh.name = `ropeSeg_${i}`;
      ropeMesh.castShadow = true;
      root.add(ropeMesh);
      this.ropeSegs.push(ropeMesh);
    }

    // ----------------------------------------------------------------------
    // 10. 3D PART CALLOUT ANCHORS (MOUNTED DIRECTLY ON MOVING/EXPLODING PARTS)
    // ----------------------------------------------------------------------
    this.attachAnchor('mast', mast, -0.15, baseY + 1.48, -0.09);
    this.attachAnchor('jib-cad', boomExt, -1.78, 0.08, 0);
    this.attachAnchor('jib-ext', boomExt, -1.86, 0.08, 0);
    this.attachAnchor('luff-ram', ramBarrelGroup, 0, 0, 0.50);
    this.attachAnchor('load-chart', boomPivot, -0.82, 0.09, -0.09);
    if (this.hookCheek0) this.attachAnchor('cheeks', this.hookCheek0, 0, 0.04, -0.015);
    this.attachAnchor('sheaves', hookBlock, 0, 0.075, 0);
    this.attachAnchor('din-hook', hookSwivelPivot, 0, -0.13, 0);
    if (this.motorGroup) this.attachAnchor('motor', this.motorGroup, 0.04, 0.11, 0);
    if (this.gbCover) this.attachAnchor('gearbox', this.gbCover, 0.02, 0.04, 0.05);
    this.attachAnchor('ballast', mast, 1.24, rearDeckY + 0.34, -0.43);
    this.attachAnchor('forks', chassis, -0.46, baseY + 0.06, -0.66);
    if (this.jacks[0]) this.attachAnchor('jacks', this.jacks[0], 0, 0.18, 0);
    if (this.caster0) this.attachAnchor('casters', this.caster0, -0.03, wheelR, 0);
  }

  // Recursively mirrors realCraneRoot into cadCraneRoot sharing BufferGeometries + crisp CAD wireframe lines
  buildCadMirrorFromReal() {
    const syncNames = new Set([
      'boomPivot', 'boomExt', 'tipHead', 'tipSheave',
      'ramBarrelGroup', 'ramPistonGroup',
      'hookBlock', 'hookSwivelPivot', 'winchDrum',
      'hydroPack', 'gbCover', 'fanCowl', 'motorGroup', 'ctrlBox',
      'tipCheek_0', 'tipCheek_1', 'hookCheek_0', 'hookCheek_1',
      'caster_0', 'caster_1', 'caster_2', 'caster_3',
      'jackBracket_0', 'jackBracket_1', 'jackBracket_2', 'jackBracket_3',
      'jackPlunger_0', 'jackPlunger_1', 'jackPlunger_2', 'jackPlunger_3',
      'ropeSeg_0', 'ropeSeg_1', 'ropeSeg_2', 'ropeSeg_3', 'ropeSeg_4'
    ]);

    const edgeGeoCache = new Map();
    const wireGeoCache = new Map();

    const cloneNode = (src) => {
      let dst;

      if (src.isInstancedMesh) {
        dst = new THREE.InstancedMesh(src.geometry, this.cadClayDarkMat, src.count);
        dst.instanceMatrix.copy(src.instanceMatrix);
        dst.instanceMatrix.needsUpdate = true;
        dst.computeBoundingSphere();
      } else if (src.isMesh) {
        const clayMat = src.userData.cadDark ? this.cadClayDarkMat : this.cadClayMat;
        dst = new THREE.Mesh(src.geometry, clayMat);
        dst.castShadow = src.castShadow;
        dst.receiveShadow = src.receiveShadow;

        // Crisp black CAD topological edge lines overlaid on matte clay (IMG_8527 look)
        if (src.userData.cadWire) {
          let wGeo = wireGeoCache.get(src.geometry);
          if (!wGeo) {
            wGeo = this.trackGeo(new THREE.WireframeGeometry(src.geometry));
            wireGeoCache.set(src.geometry, wGeo);
          }
          const lines = new THREE.LineSegments(wGeo, this.cadWireMat);
          dst.add(lines);
        } else {
          const angle = src.userData.cadEdgeAngle ?? 20;
          const cacheKey = `${src.geometry.uuid}_${angle}`;
          let eGeo = edgeGeoCache.get(cacheKey);
          if (!eGeo) {
            eGeo = this.trackGeo(new THREE.EdgesGeometry(src.geometry, angle));
            edgeGeoCache.set(cacheKey, eGeo);
          }
          const lines = new THREE.LineSegments(eGeo, this.cadWireMat);
          dst.add(lines);
        }
      } else {
        dst = new THREE.Group();
      }

      dst.name = src.name;
      dst.position.copy(src.position);
      dst.quaternion.copy(src.quaternion);
      dst.scale.copy(src.scale);
      dst.visible = src.visible;

      if (src.name && syncNames.has(src.name)) {
        this.syncPairs.push([src, dst]);
      }

      for (let i = 0; i < src.children.length; i += 1) {
        dst.add(cloneNode(src.children[i]));
      }
      return dst;
    };

    this.cadCraneRoot = cloneNode(this.realCraneRoot);
    this.scene.add(this.cadCraneRoot);
  }

  positionCylinderBetween(mesh, pA, pB) {
    this._dirVec.subVectors(pB, pA);
    const len = this._dirVec.length();
    if (len < 0.001) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;
    this._tmpMid.addVectors(pA, pB).multiplyScalar(0.5);
    mesh.position.copy(this._tmpMid);
    mesh.scale.set(1, len, 1);
    this._dirVec.normalize();
    mesh.quaternion.setFromUnitVectors(this._upAxis, this._dirVec);
  }

  // Exact screen-space frustum clipping plane: LEFT of seam = REAL STEEL, RIGHT of seam = CAD CLAY-WIREFRAME
  updateClippingPlanes() {
    if (!this.camera) return;
    this.camera.updateMatrixWorld();

    // Map transformCurrent [0..1] slightly beyond screen edges [-1.04..+1.04] so 0% is pure CAD and 100% is pure Real
    const ndcX = THREE.MathUtils.lerp(-1.04, 1.04, this.transformCurrent);

    this._pTop.set(ndcX, 1.0, 0.5).unproject(this.camera);
    this._pBot.set(ndcX, -1.0, 0.5).unproject(this.camera);
    this.clipPlaneReal.setFromCoplanarPoints(this.camera.position, this._pBot, this._pTop);

    // Verify orientation: a point on the LEFT side of ndcX must have positive signed distance for clipPlaneReal
    this._pTest.set(ndcX - 0.5, 0.0, 0.5).unproject(this.camera);
    if (this.clipPlaneReal.distanceToPoint(this._pTest) < 0) {
      this.clipPlaneReal.negate();
    }

    this.clipPlaneCad.copy(this.clipPlaneReal).negate();
    // Sub-millimeter seam overlap prevents pixel cracks between CAD and Real
    this.clipPlaneCad.constant += 0.0005;
  }

  applyAtmosphere(t) {
    const smoothT = t * t * (3 - 2 * t);

    // Keep pure white studio background at every transformation point
    if (this.scene.background) this.scene.background.setHex(0xffffff);
    if (this.scene.fog) this.scene.fog.color.setHex(0xffffff);

    // Subtle light boost as real painted steel reveals on white
    if (this.keyLight) {
      this.keyLight.intensity = THREE.MathUtils.lerp(1.9, 2.25, smoothT);
    }
    if (this.rimLight) {
      this.rimLight.intensity = THREE.MathUtils.lerp(0.75, 1.05, smoothT);
    }
    if (this.scene) {
      this.scene.environmentIntensity = THREE.MathUtils.lerp(0.72, 0.92, smoothT);
    }

    // Subtle CAD drafting grid fades cleanly out to pure white floor with soft contact shadow
    if (this.cadGridMat) {
      this.cadGridMat.opacity = THREE.MathUtils.lerp(0.62, 0.0, smoothT);
    }
    if (this.contactMat) {
      this.contactMat.opacity = THREE.MathUtils.lerp(0.22, 0.34, smoothT);
    }
  }

  // Build crisp single full-viewport SVG leader layer + unboxed HTML label nodes (never clipped by 1px SVG boxes)
  buildPartTagDOM() {
    if (!this.tagsLayer) return;
    this.tagsLayer.textContent = '';
    this.tagNodes = [];

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'sv-fc__tags-svg');
    svg.setAttribute('aria-hidden', 'true');
    this.tagsLayer.appendChild(svg);
    this.tagsSvg = svg;

    PART_TAGS.forEach((def) => {
      const anchor = this.tagAnchors.get(def.id);
      if (!anchor) return;

      const svgGroup = document.createElementNS(svgNS, 'g');
      svgGroup.setAttribute('class', 'sv-fc__tag-svg-group');
      svgGroup.style.opacity = '0';

      const line = document.createElementNS(svgNS, 'polyline');
      line.setAttribute('class', 'sv-fc__tag-line');
      line.setAttribute('fill', 'none');

      const dot = document.createElementNS(svgNS, 'circle');
      dot.setAttribute('class', 'sv-fc__tag-dot');
      dot.setAttribute('r', '3.4');

      svgGroup.appendChild(line);
      svgGroup.appendChild(dot);
      svg.appendChild(svgGroup);

      const el = document.createElement('div');
      el.className = 'sv-fc__tag';
      el.dataset.tagId = def.id;
      el.style.opacity = '0';

      const titleEl = document.createElement('span');
      titleEl.className = 'sv-fc__tag-title';
      titleEl.textContent = def.label;

      const subEl = document.createElement('span');
      subEl.className = 'sv-fc__tag-sub';
      subEl.textContent = def.sub;

      el.appendChild(titleEl);
      el.appendChild(subEl);
      this.tagsLayer.appendChild(el);

      this.tagNodes.push({
        def,
        anchor,
        el,
        svgGroup,
        lineEl: line,
        dotEl: dot,
        lastSide: 0
      });
    });
  }

  // C1-continuous time-keyed Catmull-Rom interpolation across CAMERA_KEYFRAMES
  sampleCameraSpline(p, outPos, outTgt) {
    const n = CAMERA_KEYFRAMES.length;
    if (p <= CAMERA_KEYFRAMES[0].p) {
      outPos.copy(this._kfPos[0]);
      outTgt.copy(this._kfTgt[0]);
      return;
    }
    if (p >= CAMERA_KEYFRAMES[n - 1].p) {
      outPos.copy(this._kfPos[n - 1]);
      outTgt.copy(this._kfTgt[n - 1]);
      return;
    }

    let i = 0;
    while (i < n - 2 && p > CAMERA_KEYFRAMES[i + 1].p) {
      i += 1;
    }

    const pA = CAMERA_KEYFRAMES[i].p;
    const pB = CAMERA_KEYFRAMES[i + 1].p;
    const u = THREE.MathUtils.clamp((p - pA) / Math.max(0.0001, pB - pA), 0, 1);

    const i0 = Math.max(0, i - 1);
    const i1 = i;
    const i2 = Math.min(n - 1, i + 1);
    const i3 = Math.min(n - 1, i + 2);

    const catmull = (v0, v1, v2, v3, t) => {
      const t2 = t * t;
      const t3 = t2 * t;
      return 0.5 * (
        (2 * v1) +
        (-v0 + v2) * t +
        (2 * v0 - 5 * v1 + 4 * v2 - v3) * t2 +
        (-v0 + 3 * v1 - 3 * v2 + v3) * t3
      );
    };

    const p0 = this._kfPos[i0];
    const p1 = this._kfPos[i1];
    const p2 = this._kfPos[i2];
    const p3 = this._kfPos[i3];
    outPos.set(
      catmull(p0.x, p1.x, p2.x, p3.x, u),
      catmull(p0.y, p1.y, p2.y, p3.y, u),
      catmull(p0.z, p1.z, p2.z, p3.z, u)
    );

    const t0 = this._kfTgt[i0];
    const t1 = this._kfTgt[i1];
    const t2 = this._kfTgt[i2];
    const t3 = this._kfTgt[i3];
    outTgt.set(
      catmull(t0.x, t1.x, t2.x, t3.x, u),
      catmull(t0.y, t1.y, t2.y, t3.y, u),
      catmull(t0.z, t1.z, t2.z, t3.z, u)
    );
  }

  // Master A-to-Z scroll choreography evaluator (maps scroll progress p in [0, 1] to all mechanics, sweep, and camera)
  applyScrollFrame(p, forceHud = false) {
    if (!this.camera) return;

    const clampedP = THREE.MathUtils.clamp(p, 0, 1);

    // 1. Drawing -> Real Steel transformation sweep (pure CAD in Act 01, live sweep across Act 02, 100% Real Acts 03-06)
    if (this.reducedStatic) {
      this.transformCurrent = 0.52;
    } else {
      this.transformCurrent = smoothstep(0.16, 0.31, clampedP);
    }

    // 2. Subsystem-masked explode curves (ONLY the featured subsystem opens during its own act, closes cleanly before Finale)
    this.explodeGroups.hook = this.reducedStatic ? 0 : smoothBell(0.36, 0.42, 0.48, 0.535, clampedP) * 0.92;
    this.explodeGroups.drive = this.reducedStatic ? 0 : smoothBell(0.56, 0.615, 0.668, 0.715, clampedP) * 0.85;
    this.explodeGroups.boom = 0; // Keeps braided hydraulic hoses watertightly seated on mast
    this.explodeGroups.chassis = 0; // Keeps casters solidly planted on the white floor shadow

    // 3. Continuous articulated kinematics across the 6 acts
    const boomReachUp = smoothstep(0.14, 0.28, clampedP);
    const boomRetract = smoothstep(0.52, 0.68, clampedP);
    const boomFinale = smoothstep(0.84, 0.96, clampedP);

    this.state.boomPitch = 0.20 + boomReachUp * 0.08 - boomRetract * 0.06 + boomFinale * 0.01;
    this.state.boomExt = 0.08 + boomReachUp * 0.26 - boomRetract * 0.24 + boomFinale * 0.05;

    const hookFocus = smoothBell(0.32, 0.40, 0.50, 0.60, clampedP);
    this.state.hookDrop = 0.84 + hookFocus * 0.26;
    this.state.hookSwivel = 0.12 + clampedP * 1.4 + hookFocus * 0.65;
    this.state.winchSpin = -0.6 - clampedP * 7.5;

    // 4× Acme leveling jacks lower cleanly onto safety-yellow floor pads in Act 05 and stay planted for Act 06
    this.state.jackDrop = 0.14 + smoothstep(0.70, 0.81, clampedP) * 0.86;

    // 4. Smooth Catmull-Rom camera spline with responsive narrow-viewport framing cushion
    this.sampleCameraSpline(clampedP, this._camPosVec, this._camTgtVec);
    const aspect = this.camera.aspect || 1.7;
    const isPhone = window.innerWidth < 600;
    const distScale = isPhone
      ? (aspect < 1.0 ? 1.62 : 1.32)
      : (aspect < 1.2 ? 1.24 : aspect < 1.45 ? 1.08 : 1.0);

    if (distScale !== 1.0) {
      this._camPosVec.sub(this._camTgtVec).multiplyScalar(distScale).add(this._camTgtVec);
    }

    this.camera.position.copy(this._camPosVec);
    this.camera.lookAt(this._camTgtVec);
    this.camera.updateMatrixWorld();

    // 5. Apply subsystem-masked explode offsets
    for (let i = 0; i < this.explodeParts.length; i += 1) {
      const part = this.explodeParts[i];
      const amt = this.explodeGroups[part.group] || 0;
      part.obj.position.copy(part.basePos).addScaledVector(part.offset, amt);
    }

    // 6. Articulated crane mechanisms
    this.boomPivot.rotation.z = -this.state.boomPitch;
    this.boomExt.position.x = -this.state.boomExt;
    this.boomPivot.updateMatrixWorld(true);

    // Coupled hydraulic luffing ram tracks boom lug cleanly
    this._tmpB.copy(this.ramBoomLugLocal).applyMatrix4(this.boomPivot.matrixWorld);
    this.ramBarrelGroup.lookAt(this._tmpB);
    this.ramPistonGroup.position.copy(this._tmpB);
    this.ramPistonGroup.lookAt(this.ramBarrelGroup.position);
    this.ramBarrelGroup.updateMatrixWorld(true);

    // Screw-down leveling jacks
    for (let i = 0; i < this.jacks.length; i += 1) {
      const plunger = this.jacks[i];
      plunger.position.y = THREE.MathUtils.lerp(
        plunger.userData.parkedY,
        plunger.userData.deployedY,
        this.state.jackDrop
      );
      plunger.rotation.y = this.state.jackDrop * Math.PI * 2.5;
    }

    // Rotating winch drum & head sheave
    this.winchDrum.rotation.z = this.state.winchSpin;
    this.tipSheave.rotation.z = -this.state.winchSpin * 0.65;

    // Snatch block & forged hook suspended vertically under boom tip
    this._tmpA.copy(this.tipAnchorLocal).applyMatrix4(this.tipHead.matrixWorld);
    const hookY = Math.max(0.36, this._tmpA.y - this.state.hookDrop);
    this.hookBlock.position.set(this._tmpA.x, hookY, this._tmpA.z);
    this.hookSwivelPivot.rotation.y = this.state.hookSwivel;
    this.hookBlock.updateMatrixWorld(true);

    // Dynamic 2-fall steel wire rope reeving
    this._ropeP0.copy(this.winchTopWorld);
    this.positionCylinderBetween(this.ropeSegs[0], this._ropeP0, this.rearGuideWorld);

    this._ropeP1.copy(this.midGuideLocal).applyMatrix4(this.boomPivot.matrixWorld);
    this.positionCylinderBetween(this.ropeSegs[1], this.rearGuideWorld, this._ropeP1);

    this._ropeP2.copy(this.tipTopLocal).applyMatrix4(this.tipHead.matrixWorld);
    this.positionCylinderBetween(this.ropeSegs[2], this._ropeP1, this._ropeP2);

    this._tmpB.set(this._tmpA.x, hookY + 0.14, this._tmpA.z - 0.024);
    this._ropeP0.set(this._tmpA.x, this._tmpA.y, this._tmpA.z - 0.024);
    this.positionCylinderBetween(this.ropeSegs[3], this._ropeP0, this._tmpB);

    this._tmpB.set(this._tmpA.x, hookY + 0.14, this._tmpA.z + 0.024);
    this._ropeP0.set(this._tmpA.x, this._tmpA.y, this._tmpA.z + 0.024);
    this.positionCylinderBetween(this.ropeSegs[4], this._ropeP0, this._tmpB);

    // Sync exact articulated + exploded transforms onto CAD clay-wireframe mirror root
    for (let i = 0; i < this.syncPairs.length; i += 1) {
      const [src, dst] = this.syncPairs[i];
      dst.position.copy(src.position);
      dst.quaternion.copy(src.quaternion);
      dst.scale.copy(src.scale);
      dst.visible = src.visible;
    }

    this.realCraneRoot.updateMatrixWorld(true);
    this.applyAtmosphere(this.transformCurrent);
    this.updateClippingPlanes();
    this.updateHUD(clampedP, forceHud);
    this.updatePartTags(clampedP);
  }

  updateHUD(p, force = false) {
    let actIdx = 0;
    for (let i = 0; i < SCROLL_ACTS.length; i += 1) {
      if (p >= SCROLL_ACTS[i].start && p < SCROLL_ACTS[i].end) {
        actIdx = i;
        break;
      }
    }
    if (p >= SCROLL_ACTS[SCROLL_ACTS.length - 1].start) {
      actIdx = SCROLL_ACTS.length - 1;
    }

    if (force || actIdx !== this.activeActIdx) {
      this.activeActIdx = actIdx;
      const act = SCROLL_ACTS[actIdx];
      if (this.dom.specCode) this.dom.specCode.textContent = act.code;
      if (this.dom.specTitle) this.dom.specTitle.textContent = act.title;
      if (this.dom.specMeta) this.dom.specMeta.textContent = act.meta;
      if (this.dom.indexEl) this.dom.indexEl.textContent = act.index;
    }

    if (this.dom.scrollCueEl) {
      const cueOpacity = this.reducedStatic ? 0 : (1 - smoothstep(0.015, 0.055, p));
      this.dom.scrollCueEl.style.opacity = cueOpacity.toFixed(3);
    }

    if (this.dom.progressFill) {
      const fillVal = this.reducedStatic ? 0.52 : p;
      this.dom.progressFill.style.transform = `scaleX(${fillVal.toFixed(4)})`;
    }
  }

  // Project 3D child anchors into crisp 2D full-stage SVG leader lines + unboxed labels (zero layout thrash)
  updatePartTags(p) {
    if (!this.tagNodes.length || !this.camera) return;

    const w = this.viewportW;
    const h = this.viewportH;
    const isPhone = window.innerWidth < 600;
    const topSafe = isPhone ? 92 : 112;
    const botSafe = h - (isPhone ? 28 : 38);
    const labelEstW = isPhone ? 160 : 210;

    for (let i = 0; i < this.tagNodes.length; i += 1) {
      const node = this.tagNodes[i];
      const { def, anchor, el, svgGroup, lineEl, dotEl } = node;

      if (this.reducedStatic || (isPhone && !def.mobile)) {
        if (el.style.opacity !== '0') {
          el.style.opacity = '0';
          svgGroup.style.opacity = '0';
        }
        continue;
      }

      const [w0, w1, w2, w3] = def.win;
      const alpha = smoothBell(w0, w1, w2, w3, p);
      if (alpha <= 0.005) {
        if (el.style.opacity !== '0') {
          el.style.opacity = '0';
          svgGroup.style.opacity = '0';
        }
        continue;
      }

      anchor.getWorldPosition(this._projVec);
      this._projVec.project(this.camera);

      if (this._projVec.z > 1 || this._projVec.z < -1) {
        if (el.style.opacity !== '0') {
          el.style.opacity = '0';
          svgGroup.style.opacity = '0';
        }
        continue;
      }

      const sx = (this._projVec.x * 0.5 + 0.5) * w;
      const sy = (-this._projVec.y * 0.5 + 0.5) * h;

      if (sx < 14 || sx > w - 14 || sy < 24 || sy > h - 18) {
        if (el.style.opacity !== '0') {
          el.style.opacity = '0';
          svgGroup.style.opacity = '0';
        }
        continue;
      }

      const scaleLen = isPhone ? 0.45 : 1.0;
      let dx = Math.round(def.dx * scaleLen);
      let dy = Math.round(def.dy * scaleLen);

      // Pick side with enough horizontal room so labels never clip left/right margins (especially on 390px phones)
      const padX = isPhone ? 12 : 20;
      const roomRight = w - padX - sx;
      const roomLeft = sx - padX;
      if (dx > 0 && sx + dx + labelEstW > w - padX) {
        if (roomLeft > roomRight) dx = -Math.abs(dx);
      } else if (dx < 0 && sx + dx - labelEstW < padX) {
        if (roomRight >= roomLeft) dx = Math.abs(dx);
      }

      if (sy + dy < topSafe) {
        dy = Math.max(28, topSafe - sy);
      } else if (sy + dy > botSafe - 28) {
        dy = -Math.max(36, sy - (botSafe - 28));
      }

      // Clamp leader endX so label text stays strictly inside [padX, w - padX]
      let endX = sx + dx;
      const side = dx >= 0 ? 1 : -1;
      if (side > 0) {
        endX = Math.min(endX, w - padX - labelEstW - 8);
      } else {
        endX = Math.max(endX, padX + labelEstW + 8);
      }
      const effDx = endX - sx;
      const elbowX = sx + effDx * 0.62;
      const elbowY = sy + dy;
      const endY = sy + dy;

      dotEl.setAttribute('cx', sx.toFixed(1));
      dotEl.setAttribute('cy', sy.toFixed(1));
      lineEl.setAttribute(
        'points',
        `${sx.toFixed(1)},${sy.toFixed(1)} ${elbowX.toFixed(1)},${elbowY.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`
      );

      el.style.transform = side > 0
        ? `translate3d(${(endX + 8).toFixed(1)}px, ${(endY - 14).toFixed(1)}px, 0)`
        : `translate3d(${(endX - 8).toFixed(1)}px, ${(endY - 14).toFixed(1)}px, 0) translateX(-100%)`;

      if (node.lastSide !== side) {
        node.lastSide = side;
        el.style.textAlign = side > 0 ? 'left' : 'right';
      }

      const alphaStr = alpha.toFixed(3);
      el.style.opacity = alphaStr;
      svgGroup.style.opacity = alphaStr;
    }
  }

  setScrollProgress(progress) {
    if (this.reducedStatic) return;
    this.scrollTarget = THREE.MathUtils.clamp(progress, 0, 1);
    this.ensureLoop();
  }

  setInView(visible) {
    const next = Boolean(visible);
    if (this.inView === next) return;
    this.inView = next;
    if (!this.inView) {
      this.stopPendingFrame();
      return;
    }
    this.applyScrollFrame(this.scrollCurrent);
    this.requestRender();
  }

  ensureLoop() {
    if (this.destroyed || this.contextLost || !this.inView) return;
    if (this.loopActive) {
      this.requestRender();
      return;
    }
    this.loopActive = true;
    this.lastTickTs = performance.now();
    this.requestRender();
  }

  afterDraw(cb) {
    const gl = this.renderer.getContext();
    const sync = gl && gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
    if (!sync) {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    gl.flush();
    const poll = () => {
      if (this.destroyed) {
        gl.deleteSync(sync);
        return;
      }
      const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  requestRender() {
    if (this.destroyed || this.contextLost || !this.renderer) return;
    if (this.renderBusy) {
      this.renderDirty = true;
      return;
    }
    this.renderBusy = true;
    this.frameId = requestAnimationFrame((now) => {
      this.renderDirty = false;
      if (this.destroyed || this.contextLost) {
        this.renderBusy = false;
        return;
      }

      const dt = Math.min(Math.max((now - this.lastTickTs) / 1000, 0.004), 0.08);
      this.lastTickTs = now;

      if (!this.reducedStatic) {
        if (isSoftwareGl) {
          this.scrollCurrent = this.scrollTarget;
          this.loopActive = false;
        } else {
          this.scrollCurrent = THREE.MathUtils.damp(this.scrollCurrent, this.scrollTarget, 10.5, dt);
          if (Math.abs(this.scrollCurrent - this.scrollTarget) < 0.00025) {
            this.scrollCurrent = this.scrollTarget;
            this.loopActive = false;
          }
        }
      } else {
        this.loopActive = false;
      }

      this.applyScrollFrame(this.scrollCurrent);
      this.renderer.render(this.scene, this.camera);

      const done = () => {
        this.renderBusy = false;
        if (this.renderDirty || this.loopActive) {
          this.requestRender();
        }
      };

      if (isSoftwareGl) {
        this.afterDraw(done);
      } else {
        done();
      }
    });
  }

  stopPendingFrame() {
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.loopActive = false;
    this.renderBusy = false;
    this.renderDirty = false;
  }

  resize() {
    if (!this.renderer || !this.camera || !this.mount) return;
    const width = Math.max(this.mount.clientWidth || 960, 300);
    const height = Math.max(this.mount.clientHeight || 520, 280);
    this.viewportW = width;
    this.viewportH = height;

    const dprCap = window.innerWidth < 600 ? 1.5 : 2;
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, dprCap));
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.applyScrollFrame(this.scrollCurrent, true);
    this.requestRender();
  }

  dispose() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stopPendingFrame();
    if (this.boundResize) window.removeEventListener('resize', this.boundResize);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.io) this.io.disconnect();
    this.disposables.geometries.forEach((g) => g.dispose());
    this.disposables.materials.forEach((m) => m.dispose());
    this.disposables.textures.forEach((t) => t.dispose());
    if (this.envRenderTarget) this.envRenderTarget.dispose();
    if (this.pmremGenerator) this.pmremGenerator.dispose();
    if (this.renderer) this.renderer.dispose();
  }
}

/* ==========================================================================
   PURE SCROLL-DRIVEN INITIALIZATION (ZERO BUTTONS / ZERO SLIDERS)
   ========================================================================== */

export function initFloorCraneShowcase() {
  const section = document.querySelector('#floor-crane-showcase');
  if (!section) return;

  const runway = section.querySelector('.sv-fc__runway');
  const sticky = section.querySelector('.sv-fc__sticky');
  const mount = section.querySelector('#sv-fc-mount');
  const fallbackEl = section.querySelector('#sv-fc-fallback');
  if (!mount || !runway || !sticky) return;

  const dom = {
    section,
    runway,
    sticky,
    mount,
    fallbackEl,
    tagsLayer: section.querySelector('[data-fc-tags]'),
    specCode: section.querySelector('[data-fc-spec-code]'),
    specTitle: section.querySelector('[data-fc-spec-title]'),
    specMeta: section.querySelector('[data-fc-spec-meta]'),
    indexEl: section.querySelector('[data-fc-index]'),
    scrollCueEl: section.querySelector('[data-fc-scroll-cue]'),
    progressFill: section.querySelector('[data-fc-progress-fill]')
  };

  const engine = new SVFloorCraneEngine(dom);
  const ok = engine.init();
  if (!ok) return;

  const getStickyTop = () => {
    const topPx = parseFloat(window.getComputedStyle(sticky).top);
    return Number.isFinite(topPx) ? topPx : 68;
  };

  // Direct sticky-runway progress calculation (100% immune to upstream GSAP pin-spacers or lazy image reflows)
  const syncFromScroll = () => {
    if (prefersReducedMotion()) return;
    const rect = runway.getBoundingClientRect();
    const stickyTop = getStickyTop();
    const stickyH = sticky.offsetHeight || Math.max(300, window.innerHeight - stickyTop);
    const travel = Math.max(1, rect.height - stickyH);
    const progress = THREE.MathUtils.clamp((stickyTop - rect.top) / travel, 0, 1);
    engine.setScrollProgress(progress);
  };

  window.addEventListener('scroll', syncFromScroll, { passive: true });
  window.addEventListener('resize', syncFromScroll, { passive: true });
  ScrollTrigger.addEventListener('refresh', syncFromScroll);
  syncFromScroll();

  window.addEventListener('pagehide', () => {
    window.removeEventListener('scroll', syncFromScroll);
    window.removeEventListener('resize', syncFromScroll);
    ScrollTrigger.removeEventListener('refresh', syncFromScroll);
    engine.dispose();
  }, { once: true });
}
