import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MOTION_REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

function isReducedMotion() {
  return Boolean(window.matchMedia && window.matchMedia(MOTION_REDUCED_QUERY).matches);
}

/* ==========================================================================
   0. MILESTONE 25 YEARS — PINNED KINETIC RIBBON & ORBITAL STRING SEQUENCE
   ========================================================================== */
function initMilestone25Scroll() {
  const section = document.querySelector('#milestone-25');
  if (!section) return;

  const ribbonSegs = Array.from(section.querySelectorAll('.sv-m25__ribbon-seg'));
  const folds = Array.from(section.querySelectorAll('.sv-m25__fold'));
  const wires = Array.from(section.querySelectorAll('.sv-m25__wire'));
  const nodes = Array.from(section.querySelectorAll('.sv-m25__node'));
  const wireGroup = section.querySelector('.sv-m25__wire-group');
  const ribbonGroup = section.querySelector('.sv-m25__ribbon-group');
  const contentEls = [
    section.querySelector('.sv-m25__kicker'),
    section.querySelector('.sv-m25__title'),
    section.querySelector('.sv-m25__actions')
  ].filter(Boolean);

  function prepStroke(el) {
    if (typeof el.getTotalLength !== 'function') return 0;
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    return len;
  }

  function resetStroke(el) {
    el.style.strokeDasharray = '';
    el.style.strokeDashoffset = '';
  }

  const mm = gsap.matchMedia();

  // Desktop (>= 1024px): pinned scroll sequence tracing wire strings into "25"
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    const wireLens = wires.map(prepStroke);
    const segLens = ribbonSegs.map(prepStroke);
    const foldLens = folds.map(prepStroke);
    gsap.set([...ribbonSegs, ...folds], { opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 64px',
        end: '+=140%',
        pin: true,
        pinSpacing: true,
        scrub: 0.7,
        anticipatePin: 1
      }
    });

    // 1. Orbital wire strings stream across first
    wires.forEach((wire, i) => {
      if (!wireLens[i]) return;
      tl.to(wire, {
        strokeDashoffset: 0,
        duration: 0.65,
        ease: 'none'
      }, i * 0.06);
    });

    // 2. Multi-color ribbon segments weave into "25" (revealed only as each starts drawing)
    ribbonSegs.forEach((seg, i) => {
      if (!segLens[i]) return;
      const startAt = 0.1 + i * 0.15;
      tl.to(seg, {
        opacity: 1,
        duration: 0.015,
        ease: 'none'
      }, startAt);
      tl.to(seg, {
        strokeDashoffset: 0,
        duration: 0.24,
        ease: 'power1.inOut'
      }, startAt);
    });

    // 3. Dark ribbon fold intersections snap cleanly at crossings
    folds.forEach((fold, i) => {
      if (!foldLens[i]) return;
      const startAt = 0.22 + i * 0.16;
      tl.to(fold, {
        opacity: 1,
        duration: 0.012,
        ease: 'none'
      }, startAt);
      tl.to(fold, {
        strokeDashoffset: 0,
        duration: 0.12,
        ease: 'none'
      }, startAt);
    });

    // 4. Node beads lock onto orbital wire curves
    if (nodes.length) {
      tl.fromTo(nodes,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.14, stagger: 0.025, ease: 'back.out(2)' },
        0.12
      );
    }

    // 5. Left editorial headline & CTA settle cleanly inside frame
    if (contentEls.length) {
      tl.fromTo(contentEls,
        { y: 24, opacity: 0.18 },
        { y: 0, opacity: 1, duration: 0.34, stagger: 0.07, ease: 'power2.out' },
        0.08
      );
    }

    // Subtle differential cursor parallax across wires vs ribbon
    let onPointerMove = null;
    let onPointerLeave = null;
    if (wireGroup && ribbonGroup && window.matchMedia('(hover: hover)').matches) {
      const wireX = gsap.quickTo(wireGroup, 'x', { duration: 0.45, ease: 'power2.out' });
      const wireY = gsap.quickTo(wireGroup, 'y', { duration: 0.45, ease: 'power2.out' });
      const ribX = gsap.quickTo(ribbonGroup, 'x', { duration: 0.55, ease: 'power2.out' });
      const ribY = gsap.quickTo(ribbonGroup, 'y', { duration: 0.55, ease: 'power2.out' });

      onPointerMove = (ev) => {
        const rect = section.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const nx = (ev.clientX - rect.left) / rect.width - 0.5;
        const ny = (ev.clientY - rect.top) / rect.height - 0.5;
        wireX(nx * 14);
        wireY(ny * 10);
        ribX(nx * 6);
        ribY(ny * 4);
      };

      onPointerLeave = () => {
        wireX(0);
        wireY(0);
        ribX(0);
        ribY(0);
      };

      section.addEventListener('pointermove', onPointerMove, { passive: true });
      section.addEventListener('pointerleave', onPointerLeave, { passive: true });
    }

    return () => {
      tl.kill();
      wires.forEach(resetStroke);
      ribbonSegs.forEach(resetStroke);
      folds.forEach(resetStroke);
      if (onPointerMove) section.removeEventListener('pointermove', onPointerMove);
      if (onPointerLeave) section.removeEventListener('pointerleave', onPointerLeave);
      if (wireGroup) gsap.set(wireGroup, { clearProps: 'transform' });
      if (ribbonGroup) gsap.set(ribbonGroup, { clearProps: 'transform' });
      if (ribbonSegs.length || folds.length) gsap.set([...ribbonSegs, ...folds], { clearProps: 'opacity' });
      if (nodes.length) gsap.set(nodes, { clearProps: 'transform,opacity' });
      if (contentEls.length) gsap.set(contentEls, { clearProps: 'transform,opacity' });
    };
  });

  // Tablet & mobile (< 1024px): clean unpinned path trace on scroll entry
  mm.add('(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)', () => {
    const wireLens = wires.map(prepStroke);
    const segLens = ribbonSegs.map(prepStroke);
    const foldLens = folds.map(prepStroke);
    gsap.set([...ribbonSegs, ...folds], { opacity: 0 });

    const mobileTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 82%',
        once: true
      }
    });

    wires.forEach((wire, i) => {
      if (!wireLens[i]) return;
      mobileTl.to(wire, {
        strokeDashoffset: 0,
        duration: 1.05,
        ease: 'power2.out'
      }, i * 0.08);
    });

    ribbonSegs.forEach((seg, i) => {
      if (!segLens[i]) return;
      const startAt = 0.14 + i * 0.14;
      mobileTl.to(seg, {
        opacity: 1,
        duration: 0.02,
        ease: 'none'
      }, startAt);
      mobileTl.to(seg, {
        strokeDashoffset: 0,
        duration: 0.42,
        ease: 'power2.out'
      }, startAt);
    });

    folds.forEach((fold, i) => {
      if (!foldLens[i]) return;
      const startAt = 0.35 + i * 0.14;
      mobileTl.to(fold, {
        opacity: 1,
        duration: 0.02,
        ease: 'none'
      }, startAt);
      mobileTl.to(fold, {
        strokeDashoffset: 0,
        duration: 0.2,
        ease: 'power1.out'
      }, startAt);
    });

    if (nodes.length) {
      mobileTl.fromTo(nodes,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, stagger: 0.02, ease: 'back.out(1.7)', clearProps: 'transform,opacity' },
        0.2
      );
    }

    return () => {
      mobileTl.kill();
      wires.forEach(resetStroke);
      ribbonSegs.forEach(resetStroke);
      folds.forEach(resetStroke);
      if (ribbonSegs.length || folds.length) gsap.set([...ribbonSegs, ...folds], { clearProps: 'opacity' });
    };
  });
}

/* ==========================================================================
   1. SCOPED GSAP SCROLLTRIGGER CHOREOGRAPHY (Section 04 ONLY)
   ========================================================================== */
function initSection04Scroll() {
  const section = document.querySelector('#capability-scale');
  if (!section) return;

  const cols = Array.from(section.querySelectorAll('.sv-rank__col'));
  const blocks = Array.from(section.querySelectorAll('.sv-rank__block'));
  const numRows = Array.from(section.querySelectorAll('.sv-rank__num-row'));
  const metas = Array.from(section.querySelectorAll('.sv-rank__meta'));
  const foots = Array.from(section.querySelectorAll('.sv-rank__foot'));
  const counters = Array.from(section.querySelectorAll('.sv-mind__value[data-count-to]'));

  const mm = gsap.matchMedia();

  // Desktop (>= 1024px): lively top-to-down scrubbed card drops + continuous scroll depth
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    const scrubTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 95%',
        end: 'top 22%',
        scrub: 0.6
      }
    });

    // Hanging chamfered gates drop briskly top-to-down inside their clipped columns
    blocks.forEach((block, i) => {
      scrubTl.from(block, {
        yPercent: -(42 + i * 14),
        ease: 'none'
      }, i * 0.055);
    });

    // Display numerals and spec metadata ride down with extra top-down momentum
    numRows.forEach((row, i) => {
      scrubTl.from(row, {
        y: -(48 + i * 12),
        opacity: 0.25,
        ease: 'none'
      }, 0.04 + i * 0.055);
    });

    metas.forEach((meta, i) => {
      scrubTl.from(meta, {
        y: -(28 + i * 8),
        opacity: 0.2,
        ease: 'none'
      }, 0.07 + i * 0.055);
    });

    // Lower chambers slide down cleanly from behind the blocks
    foots.forEach((foot, i) => {
      scrubTl.from(foot, {
        y: -(44 + i * 10),
        opacity: 0.2,
        ease: 'none'
      }, 0.1 + i * 0.055);
    });

    // Continuous alive scroll-linked parallax drift as user scrolls past Section 04
    const parallaxTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.75
      }
    });
    numRows.forEach((row, i) => {
      parallaxTl.fromTo(row,
        { y: -(16 + i * 4) },
        { y: 20 + i * 4, ease: 'none' },
        0
      );
    });
    metas.forEach((meta, i) => {
      parallaxTl.fromTo(meta,
        { y: -(10 + i * 3) },
        { y: 12 + i * 3, ease: 'none' },
        0
      );
    });

    // One-shot crisp numeric count-up when entering primary reading zone
    const countTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 78%',
        once: true
      }
    });
    counters.forEach((el, idx) => {
      const target = Number(el.getAttribute('data-count-to'));
      const suffix = el.getAttribute('data-count-suffix') || '';
      if (!Number.isFinite(target)) return;
      const proxy = { val: 0 };
      countTl.to(proxy, {
        val: target,
        duration: 0.95,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = `${Math.round(proxy.val)}${suffix}`;
        },
        onComplete: () => {
          el.textContent = `${target}${suffix}`;
        }
      }, idx * 0.08);
    });

    return () => {
      scrubTl.kill();
      parallaxTl.kill();
      countTl.kill();
    };
  });

  // Tablet & mobile (< 1024px): staggered top-to-down card drop inside clipped rows
  mm.add('(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)', () => {
    const mobileTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 86%',
        once: true
      }
    });

    blocks.forEach((block, i) => {
      mobileTl.from(block, {
        yPercent: -35,
        opacity: 0,
        duration: 0.62,
        ease: 'power3.out',
        clearProps: 'transform,opacity'
      }, i * 0.09);
    });

    foots.forEach((foot, i) => {
      mobileTl.from(foot, {
        y: -22,
        opacity: 0,
        duration: 0.5,
        ease: 'power3.out',
        clearProps: 'transform,opacity'
      }, 0.12 + i * 0.09);
    });

    counters.forEach((el, idx) => {
      const target = Number(el.getAttribute('data-count-to'));
      const suffix = el.getAttribute('data-count-suffix') || '';
      if (!Number.isFinite(target)) return;
      const proxy = { val: 0 };
      mobileTl.to(proxy, {
        val: target,
        duration: 0.9,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = `${Math.round(proxy.val)}${suffix}`;
        },
        onComplete: () => {
          el.textContent = `${target}${suffix}`;
        }
      }, 0.14 + idx * 0.08);
    });

    return () => {
      mobileTl.kill();
    };
  });
}

/* ==========================================================================
   2. PROCEDURAL THREE.JS CRANE BAY ENGINE
   ========================================================================== */
const RIG_SPECS = {
  'double-girder': {
    title: 'Double-Girder EOT Crane',
    specs: 'IS 807 · M5–M8 · CAP UP TO 100+ T · SPAN 24 M'
  },
  'single-girder': {
    title: 'Single-Girder EOT Crane',
    specs: 'IS 3177 · M3–M6 · CAP 1–15 T · SPAN 16 M'
  },
  goliath: {
    title: 'Goliath Portal Gantry Crane',
    specs: 'IS 807 · RAIL PORTAL · CAP 5–100+ T · OUTDOOR YARD'
  }
};

const CARD_PRESETS = {
  '01': { craneType: 'double-girder', cameraView: 'iso', exploded: false, kinematics: false },
  '02': { craneType: 'double-girder', cameraView: 'crab', exploded: false, kinematics: true },
  '03': { craneType: 'goliath', cameraView: 'iso', exploded: false, kinematics: false },
  '04': { craneType: 'double-girder', cameraView: 'crab', exploded: true, kinematics: false }
};

function createContactShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const grad = ctx.createRadialGradient(128, 128, 18, 128, 128, 126);
  grad.addColorStop(0, 'rgba(26, 29, 33, 0.26)');
  grad.addColorStop(0.55, 'rgba(26, 29, 33, 0.10)');
  grad.addColorStop(1, 'rgba(26, 29, 33, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createForgedHookMesh(steelMat) {
  const hookShape = new THREE.Shape();
  hookShape.moveTo(-0.07, 0.22);
  hookShape.lineTo(0.07, 0.22);
  hookShape.lineTo(0.07, 0.04);
  hookShape.bezierCurveTo(0.24, -0.02, 0.26, -0.28, 0.02, -0.34);
  hookShape.bezierCurveTo(-0.18, -0.38, -0.26, -0.22, -0.18, -0.10);
  hookShape.lineTo(-0.11, -0.13);
  hookShape.bezierCurveTo(-0.16, -0.22, -0.08, -0.29, 0.02, -0.27);
  hookShape.bezierCurveTo(0.16, -0.23, 0.15, -0.06, -0.02, -0.02);
  hookShape.lineTo(-0.07, 0.04);
  hookShape.closePath();

  const geo = new THREE.ExtrudeGeometry(hookShape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2
  });
  geo.center();
  const mesh = new THREE.Mesh(geo, steelMat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

class SVCraneBayEngine {
  constructor({ hostEl, fallbackEl, onStateChange }) {
    this.hostEl = hostEl;
    this.fallbackEl = fallbackEl;
    this.onStateChange = onStateChange;

    this.initialized = false;
    this.contextLost = false;
    this.isActive = false;
    this.isSoftwareGl = false;

    this.state = {
      craneType: 'double-girder',
      cameraView: 'iso',
      explodeAmount: 0,
      targetExplode: 0,
      kinematicsPlaying: false,
      bridgePos: 0,
      crabPos: 0,
      hoistDrop: 0.35
    };

    this.simTime = 0;
    this.lastFrameTs = 0;
    this.rafId = 0;
    this.needsRender = false;
    this.cameraTween = null;
    this.explodeTween = null;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.pmremGenerator = null;
    this.envRenderTarget = null;

    this.rigs = {};
    this.bayRunway = null;
    this.groundRails = null;
    this.wheels = {
      'double-girder': [],
      'single-girder': [],
      goliath: []
    };
  }

  init() {
    if (this.initialized) return true;

    try {
      const width = Math.max(this.hostEl.clientWidth || 800, 320);
      const height = Math.max(this.hostEl.clientHeight || 500, 300);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false
      });

      const gl = renderer.getContext();
      let rendererStr = '';
      try {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        rendererStr = dbg
          ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '')
          : String(gl.getParameter(gl.RENDERER) || '');
      } catch (_err) {
        rendererStr = '';
      }

      this.isSoftwareGl = /(SwiftShader|llvmpipe|softpipe|Software|Basic Render)/i.test(rendererStr);

      renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = !this.isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      this.hostEl.textContent = '';
      this.hostEl.appendChild(renderer.domElement);
      this.renderer = renderer;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xefefef);
      scene.fog = new THREE.Fog(0xefefef, 28, 56);
      this.scene = scene;

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envScene = new RoomEnvironment();
      this.envRenderTarget = pmrem.fromScene(envScene, 0.04);
      scene.environment = this.envRenderTarget.texture;
      scene.environmentIntensity = 0.72;
      envScene.dispose();
      this.pmremGenerator = pmrem;

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 140);
      camera.position.set(12.2, 8.6, 13.4);
      this.camera = camera;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.minDistance = 4.5;
      controls.maxDistance = 30;
      controls.maxPolarAngle = Math.PI * 0.485;
      controls.target.set(0, 3.1, 0);
      controls.update();
      this.controls = controls;

      controls.addEventListener('change', () => this.requestRender());
      controls.addEventListener('start', () => {
        if (this.cameraTween) {
          this.cameraTween.kill();
          this.cameraTween = null;
        }
        this.requestRender();
      });

      this.buildLightsAndBay();
      this.buildCraneRigs();

      renderer.domElement.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        this.contextLost = true;
        this.stopLoop();
        if (this.fallbackEl) this.fallbackEl.hidden = false;
      });

      renderer.domElement.addEventListener('webglcontextrestored', () => {
        this.contextLost = false;
        if (this.fallbackEl) this.fallbackEl.hidden = true;
        this.requestRender();
      });

      this.boundResize = () => this.resize();
      window.addEventListener('resize', this.boundResize, { passive: true });
      if ('ResizeObserver' in window) {
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.hostEl);
      }

      this.initialized = true;
      this.applyCraneType(this.state.craneType, false);
      this.applyTransforms();
      this.requestRender();
      return true;
    } catch (_err) {
      if (this.fallbackEl) this.fallbackEl.hidden = false;
      return false;
    }
  }

  buildLightsAndBay() {
    const scene = this.scene;

    const hemi = new THREE.HemisphereLight(0xf9fbff, 0xcad0dc, 0.65);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff6ea, 1.85);
    key.position.set(11, 17, 10);
    key.castShadow = !this.isSoftwareGl;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 2;
    key.shadow.camera.far = 42;
    key.shadow.camera.left = -12;
    key.shadow.camera.right = 12;
    key.shadow.camera.top = 12;
    key.shadow.camera.bottom = -12;
    key.shadow.bias = -0.0005;
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xc2d6f4, 0.78);
    rim.position.set(-12, 9, -11);
    scene.add(rim);

    // Matte floor & subtle grid
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xe9ebf0,
      roughness: 0.92,
      metalness: 0.04
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(32, 32, 0xb2b5c6, 0xd8dce5);
    grid.position.y = 0.005;
    scene.add(grid);

    const shadowTex = createContactShadowTexture();
    if (shadowTex) {
      const contactMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false
      });
      const contactPlane = new THREE.Mesh(new THREE.PlaneGeometry(17, 17), contactMat);
      contactPlane.rotation.x = -Math.PI / 2;
      contactPlane.position.y = 0.01;
      scene.add(contactPlane);
    }

    // Shared materials
    this.mats = {
      navy: new THREE.MeshStandardMaterial({ color: 0x1e3a6b, roughness: 0.36, metalness: 0.28 }),
      navyDeep: new THREE.MeshStandardMaterial({ color: 0x162c52, roughness: 0.42, metalness: 0.34 }),
      forgedDark: new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.3, metalness: 0.84 }),
      machined: new THREE.MeshStandardMaterial({ color: 0x9aa2b0, roughness: 0.24, metalness: 0.9 }),
      baySteel: new THREE.MeshStandardMaterial({ color: 0xc2c7d2, roughness: 0.65, metalness: 0.2 }),
      wireRope: new THREE.MeshStandardMaterial({ color: 0x4b515c, roughness: 0.4, metalness: 0.85 }),
      hazardAmber: new THREE.MeshStandardMaterial({ color: 0xd99b26, roughness: 0.4, metalness: 0.2 }),
      loadSteel: new THREE.MeshStandardMaterial({ color: 0x525a66, roughness: 0.5, metalness: 0.6 })
    };

    // Overhead EOT Bay Columns & Elevated Runway
    const runwayGroup = new THREE.Group();
    const spanHalf = 6.2;
    const bayLen = 17;
    const colPositions = [
      [-spanHalf, -6.5],
      [-spanHalf, 6.5],
      [spanHalf, -6.5],
      [spanHalf, 6.5]
    ];

    colPositions.forEach(([cx, cz]) => {
      const col = new THREE.Group();
      const web = new THREE.Mesh(new THREE.BoxGeometry(0.24, 5.4, 0.34), this.mats.baySteel);
      web.position.y = 2.7;
      web.castShadow = true;
      web.receiveShadow = true;
      col.add(web);

      const base = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 0.68), this.mats.baySteel);
      base.position.y = 0.07;
      col.add(base);

      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.48), this.mats.baySteel);
      bracket.position.y = 5.1;
      col.add(bracket);

      col.position.set(cx, 0, cz);
      runwayGroup.add(col);
    });

    [-spanHalf, spanHalf].forEach((rx) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.48, bayLen), this.mats.baySteel);
      beam.position.set(rx, 5.38, 0);
      beam.castShadow = true;
      beam.receiveShadow = true;
      runwayGroup.add(beam);

      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.11, bayLen), this.mats.machined);
      rail.position.set(rx, 5.68, 0);
      runwayGroup.add(rail);
    });

    scene.add(runwayGroup);
    this.bayRunway = runwayGroup;

    // Ground rails for Goliath
    const gRails = new THREE.Group();
    [-spanHalf, spanHalf].forEach((rx) => {
      const sleeper = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, bayLen), this.mats.baySteel);
      sleeper.position.set(rx, 0.03, 0);
      sleeper.receiveShadow = true;
      gRails.add(sleeper);

      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, bayLen), this.mats.machined);
      rail.position.set(rx, 0.12, 0);
      gRails.add(rail);
    });
    scene.add(gRails);
    this.groundRails = gRails;
  }

  makeWheel(radius = 0.22) {
    const wheel = new THREE.Group();
    const tread = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, 0.12, 20),
      this.mats.forgedDark
    );
    tread.rotation.z = Math.PI / 2;
    tread.castShadow = true;
    wheel.add(tread);

    [-0.07, 0.07].forEach((ox) => {
      const flange = new THREE.Mesh(
        new THREE.CylinderGeometry(radius + 0.04, radius + 0.04, 0.025, 20),
        this.mats.machined
      );
      flange.rotation.z = Math.PI / 2;
      flange.position.x = ox;
      wheel.add(flange);
    });

    return wheel;
  }

  buildDoubleGirderRig() {
    const root = new THREE.Group();
    const bridge = new THREE.Group();
    root.add(bridge);

    const span = 12.4;
    const wheels = [];

    // End Carriages
    const endCarriages = new THREE.Group();
    [-span / 2, span / 2].forEach((ex) => {
      const ec = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.42, 2.75), this.mats.navyDeep);
      body.position.set(ex, 5.98, 0);
      body.castShadow = true;
      ec.add(body);

      [-1.08, 1.08].forEach((wz) => {
        const w = this.makeWheel(0.2);
        w.position.set(ex, 5.93, wz);
        ec.add(w);
        wheels.push(w);
      });

      [-1.44, 1.44].forEach((bz) => {
        const buf = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.09, 0.14, 14),
          this.mats.hazardAmber
        );
        buf.rotation.x = Math.PI / 2;
        buf.position.set(ex, 5.98, bz);
        ec.add(buf);
      });

      ec.userData.side = Math.sign(ex);
      endCarriages.add(ec);
    });
    bridge.add(endCarriages);

    // Twin Box Girders + Stiffener Ribs + Rail Top + Maintenance Platform
    const girders = new THREE.Group();
    [-0.78, 0.78].forEach((gz) => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(span - 0.5, 0.66, 0.36), this.mats.navy);
      box.position.set(0, 6.26, gz);
      box.castShadow = true;
      box.receiveShadow = true;
      girders.add(box);

      const bridgeRail = new THREE.Mesh(new THREE.BoxGeometry(span - 0.6, 0.08, 0.09), this.mats.machined);
      bridgeRail.position.set(0, 6.63, gz);
      girders.add(bridgeRail);

      for (let rx = -5; rx <= 5; rx += 2) {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.4), this.mats.navyDeep);
        rib.position.set(rx, 6.26, gz);
        girders.add(rib);
      }
    });

    // Inspection Walkway along Front Girder
    const walkway = new THREE.Mesh(new THREE.BoxGeometry(span - 0.9, 0.05, 0.5), this.mats.baySteel);
    walkway.position.set(0, 5.98, 1.18);
    girders.add(walkway);

    const railBar = new THREE.Mesh(new THREE.BoxGeometry(span - 0.9, 0.04, 0.04), this.mats.hazardAmber);
    railBar.position.set(0, 6.62, 1.41);
    girders.add(railBar);

    bridge.add(girders);

    // Traversing Crab Trolley
    const crab = new THREE.Group();
    crab.position.y = 6.7;
    bridge.add(crab);

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.24, 1.85), this.mats.navyDeep);
    chassis.position.y = 0.16;
    chassis.castShadow = true;
    crab.add(chassis);

    // Trolley Rail Wheels
    [-0.65, 0.65].forEach((wx) => {
      [-0.78, 0.78].forEach((wz) => {
        const cw = this.makeWheel(0.11);
        cw.rotation.y = Math.PI / 2;
        cw.position.set(wx, 0.05, wz);
        crab.add(cw);
      });
    });

    // Rope Drum + Gearbox Assembly (separates cleanly in Explode)
    const drumGroup = new THREE.Group();
    drumGroup.position.set(0, 0.56, 0);
    const drumMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 1.05, 24),
      this.mats.machined
    );
    drumMesh.rotation.z = Math.PI / 2;
    drumMesh.castShadow = true;
    drumGroup.add(drumMesh);
    crab.add(drumGroup);

    const gearboxGroup = new THREE.Group();
    gearboxGroup.position.set(0.84, 0.56, 0);
    const gbox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.54), this.mats.forgedDark);
    gbox.castShadow = true;
    gearboxGroup.add(gbox);

    const motor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.58, 18),
      this.mats.navy
    );
    motor.rotation.z = Math.PI / 2;
    motor.position.set(0.44, 0.02, 0.08);
    motor.castShadow = true;
    gearboxGroup.add(motor);
    crab.add(gearboxGroup);

    // 4-Fall Wire Ropes + Hook Block + Load
    const ropes = [];
    const ropeOffsets = [
      [-0.2, -0.18],
      [0.2, -0.18],
      [-0.2, 0.18],
      [0.2, 0.18]
    ];
    ropeOffsets.forEach(([ox, oz]) => {
      const rope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 1, 8),
        this.mats.wireRope
      );
      rope.position.set(ox, 0, oz);
      crab.add(rope);
      ropes.push(rope);
    });

    const hookBlock = new THREE.Group();
    const sheaveCasing = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.42, 0.48), this.mats.hazardAmber);
    sheaveCasing.castShadow = true;
    hookBlock.add(sheaveCasing);

    const sheaveStrip = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.16, 0.5), this.mats.forgedDark);
    sheaveStrip.position.y = 0.08;
    hookBlock.add(sheaveStrip);

    const forgedHook = createForgedHookMesh(this.mats.forgedDark);
    forgedHook.position.y = -0.38;
    hookBlock.add(forgedHook);

    // Steel Spreader Beam & Industrial Plate Load
    const spreader = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, 0.45), this.mats.navy);
    spreader.position.y = -0.78;
    spreader.castShadow = true;
    hookBlock.add(spreader);

    const loadBlock = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.56, 1.05), this.mats.loadSteel);
    loadBlock.position.y = -1.26;
    loadBlock.castShadow = true;
    hookBlock.add(loadBlock);

    crab.add(hookBlock);

    this.wheels['double-girder'] = wheels;
    return {
      root,
      bridge,
      endCarriages,
      girders,
      crab,
      drumGroup,
      drumMesh,
      gearboxGroup,
      ropes,
      hookBlock,
      ropeTopY: 0.42,
      minDrop: 1.5,
      maxDrop: 4.1,
      wheelRadius: 0.2
    };
  }

  buildSingleGirderRig() {
    const root = new THREE.Group();
    const bridge = new THREE.Group();
    root.add(bridge);

    const span = 12.4;
    const wheels = [];

    const endCarriages = new THREE.Group();
    [-span / 2, span / 2].forEach((ex) => {
      const ec = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.34, 2.05), this.mats.navyDeep);
      body.position.set(ex, 5.95, 0);
      body.castShadow = true;
      ec.add(body);

      [-0.78, 0.78].forEach((wz) => {
        const w = this.makeWheel(0.18);
        w.position.set(ex, 5.91, wz);
        ec.add(w);
        wheels.push(w);
      });

      ec.userData.side = Math.sign(ex);
      endCarriages.add(ec);
    });
    bridge.add(endCarriages);

    const girders = new THREE.Group();
    const web = new THREE.Mesh(new THREE.BoxGeometry(span - 0.4, 0.58, 0.26), this.mats.navy);
    web.position.set(0, 6.18, 0);
    web.castShadow = true;
    girders.add(web);

    const bottomFlange = new THREE.Mesh(new THREE.BoxGeometry(span - 0.4, 0.08, 0.42), this.mats.navyDeep);
    bottomFlange.position.set(0, 5.87, 0);
    girders.add(bottomFlange);
    bridge.add(girders);

    // Underhung Hoist Trolley
    const crab = new THREE.Group();
    crab.position.y = 5.82;
    bridge.add(crab);

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.26, 0.74), this.mats.forgedDark);
    chassis.position.y = -0.14;
    chassis.castShadow = true;
    crab.add(chassis);

    const drumGroup = new THREE.Group();
    drumGroup.position.set(0, -0.44, 0.22);
    const drumMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.19, 0.78, 22),
      this.mats.machined
    );
    drumMesh.rotation.z = Math.PI / 2;
    drumGroup.add(drumMesh);
    crab.add(drumGroup);

    const gearboxGroup = new THREE.Group();
    gearboxGroup.position.set(-0.56, -0.44, -0.12);
    const motor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.46, 16),
      this.mats.navy
    );
    motor.rotation.z = Math.PI / 2;
    gearboxGroup.add(motor);
    crab.add(gearboxGroup);

    const ropes = [];
    [-0.12, 0.12].forEach((ox) => {
      const rope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 1, 8),
        this.mats.wireRope
      );
      rope.position.set(ox, 0, 0);
      crab.add(rope);
      ropes.push(rope);
    });

    const hookBlock = new THREE.Group();
    const casing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.3, 0.28), this.mats.hazardAmber);
    casing.castShadow = true;
    hookBlock.add(casing);

    const hook = createForgedHookMesh(this.mats.forgedDark);
    hook.scale.setScalar(0.82);
    hook.position.y = -0.32;
    hookBlock.add(hook);

    // Steel Coil Load
    const coil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.9, 24),
      this.mats.loadSteel
    );
    coil.rotation.z = Math.PI / 2;
    coil.position.y = -0.95;
    coil.castShadow = true;
    hookBlock.add(coil);
    crab.add(hookBlock);

    this.wheels['single-girder'] = wheels;
    return {
      root,
      bridge,
      endCarriages,
      girders,
      crab,
      drumGroup,
      drumMesh,
      gearboxGroup,
      ropes,
      hookBlock,
      ropeTopY: -0.46,
      minDrop: 1.45,
      maxDrop: 3.6,
      wheelRadius: 0.18
    };
  }

  buildGoliathRig() {
    const root = new THREE.Group();
    const bridge = new THREE.Group();
    root.add(bridge);

    const span = 12.4;
    const wheels = [];

    // Ground Bogies + Tapered Portal A-Frame Legs
    const endCarriages = new THREE.Group();
    [-span / 2, span / 2].forEach((ex) => {
      const sideGroup = new THREE.Group();
      const sill = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.38, 3.8), this.mats.navyDeep);
      sill.position.set(ex, 0.46, 0);
      sill.castShadow = true;
      sideGroup.add(sill);

      [-1.55, -0.75, 0.75, 1.55].forEach((wz) => {
        const w = this.makeWheel(0.22);
        w.position.set(ex, 0.32, wz);
        sideGroup.add(w);
        wheels.push(w);
      });

      // Angled Portal Legs rising to bridge saddle
      [-1.25, 1.25].forEach((lz) => {
        const legLen = 5.45;
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.36, legLen, 0.38), this.mats.navy);
        leg.position.set(ex, 3.2, lz * 0.65);
        leg.rotation.x = Math.sign(lz) * 0.15;
        leg.castShadow = true;
        sideGroup.add(leg);
      });

      const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.36, 2.3), this.mats.navyDeep);
      saddle.position.set(ex, 5.9, 0);
      sideGroup.add(saddle);

      sideGroup.userData.side = Math.sign(ex);
      endCarriages.add(sideGroup);
    });
    bridge.add(endCarriages);

    // Twin Heavy Portal Girders (cantilever slightly beyond legs)
    const girders = new THREE.Group();
    [-0.75, 0.75].forEach((gz) => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(span + 1.4, 0.72, 0.38), this.mats.navy);
      box.position.set(0, 6.28, gz);
      box.castShadow = true;
      girders.add(box);

      const rail = new THREE.Mesh(new THREE.BoxGeometry(span + 1.2, 0.08, 0.09), this.mats.machined);
      rail.position.set(0, 6.68, gz);
      girders.add(rail);
    });
    bridge.add(girders);

    // Portal Crab Trolley & Ladle/Segment Beam
    const crab = new THREE.Group();
    crab.position.y = 6.74;
    bridge.add(crab);

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.26, 1.85), this.mats.navyDeep);
    chassis.position.y = 0.16;
    chassis.castShadow = true;
    crab.add(chassis);

    const drumGroup = new THREE.Group();
    drumGroup.position.set(0, 0.56, 0);
    const drumMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 1.1, 24),
      this.mats.machined
    );
    drumMesh.rotation.z = Math.PI / 2;
    drumGroup.add(drumMesh);
    crab.add(drumGroup);

    const gearboxGroup = new THREE.Group();
    gearboxGroup.position.set(0.88, 0.56, 0);
    const gbox = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.54, 0.54), this.mats.forgedDark);
    gearboxGroup.add(gbox);
    crab.add(gearboxGroup);

    const ropes = [];
    [
      [-0.22, -0.18],
      [0.22, -0.18],
      [-0.22, 0.18],
      [0.22, 0.18]
    ].forEach(([ox, oz]) => {
      const rope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 1, 8),
        this.mats.wireRope
      );
      rope.position.set(ox, 0, oz);
      crab.add(rope);
      ropes.push(rope);
    });

    const hookBlock = new THREE.Group();
    const casing = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.44, 0.5), this.mats.hazardAmber);
    casing.castShadow = true;
    hookBlock.add(casing);

    const ladleBeam = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.26, 0.55), this.mats.forgedDark);
    ladleBeam.position.y = -0.58;
    hookBlock.add(ladleBeam);

    // Cylindrical Foundry Vessel / Precast Mould Load
    const vessel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.62, 1.25, 24),
      this.mats.loadSteel
    );
    vessel.position.y = -1.32;
    vessel.castShadow = true;
    hookBlock.add(vessel);

    crab.add(hookBlock);

    this.wheels.goliath = wheels;
    return {
      root,
      bridge,
      endCarriages,
      girders,
      crab,
      drumGroup,
      drumMesh,
      gearboxGroup,
      ropes,
      hookBlock,
      ropeTopY: 0.42,
      minDrop: 1.55,
      maxDrop: 4.15,
      wheelRadius: 0.22
    };
  }

  buildCraneRigs() {
    this.rigs['double-girder'] = this.buildDoubleGirderRig();
    this.rigs['single-girder'] = this.buildSingleGirderRig();
    this.rigs.goliath = this.buildGoliathRig();

    Object.values(this.rigs).forEach((rig) => {
      this.scene.add(rig.root);
    });
  }

  applyCraneType(type, tweenCamera = true) {
    if (!this.rigs[type]) return;
    this.state.craneType = type;

    Object.entries(this.rigs).forEach(([key, rig]) => {
      rig.root.visible = key === type;
    });

    const isGoliath = type === 'goliath';
    if (this.bayRunway) this.bayRunway.visible = !isGoliath;
    if (this.groundRails) this.groundRails.visible = isGoliath;

    this.applyTransforms();
    if (tweenCamera) this.setCameraView(this.state.cameraView, true);
    this.requestRender();
    this.emitState();
  }

  setCameraView(view, animate = true) {
    this.state.cameraView = view;
    if (!this.initialized) return;

    const rig = this.rigs[this.state.craneType];
    const crabWorldX = rig ? rig.crab.position.x : 0;
    const bridgeWorldZ = rig ? rig.bridge.position.z : 0;
    const narrowScale = this.camera && this.camera.aspect < 0.85 ? 1.52 : 1.0;

    let pos = [13.8 * narrowScale, 9.4 * (narrowScale > 1 ? 1.18 : 1), 15.2 * narrowScale];
    let target = [0, 3.5, 0];

    if (view === 'crab') {
      pos = [
        crabWorldX + 5.2 * narrowScale,
        7.8 + (narrowScale > 1 ? 1.2 : 0),
        bridgeWorldZ + 6.4 * narrowScale
      ];
      target = [crabWorldX, 5.2, bridgeWorldZ];
    } else if (view === 'carriage') {
      pos = [10.6 * narrowScale, 7.0, bridgeWorldZ + 6.6 * narrowScale];
      target = [5.8, this.state.craneType === 'goliath' ? 2.8 : 5.8, bridgeWorldZ];
    }

    if (this.cameraTween) {
      this.cameraTween.kill();
      this.cameraTween = null;
    }

    if (!animate || isReducedMotion()) {
      this.camera.position.set(pos[0], pos[1], pos[2]);
      this.controls.target.set(target[0], target[1], target[2]);
      this.controls.update();
      this.requestRender();
    } else {
      const start = {
        px: this.camera.position.x,
        py: this.camera.position.y,
        pz: this.camera.position.z,
        tx: this.controls.target.x,
        ty: this.controls.target.y,
        tz: this.controls.target.z
      };
      this.cameraTween = gsap.to(start, {
        px: pos[0],
        py: pos[1],
        pz: pos[2],
        tx: target[0],
        ty: target[1],
        tz: target[2],
        duration: 0.72,
        ease: 'power2.out',
        onUpdate: () => {
          this.camera.position.set(start.px, start.py, start.pz);
          this.controls.target.set(start.tx, start.ty, start.tz);
          this.controls.update();
          this.requestRender();
        },
        onComplete: () => {
          this.cameraTween = null;
          this.requestRender();
        }
      });
    }
    this.emitState();
  }

  setExplode(exploded, animate = true) {
    const target = exploded ? 1 : 0;
    this.state.targetExplode = target;

    if (this.explodeTween) {
      this.explodeTween.kill();
      this.explodeTween = null;
    }

    if (!animate || isReducedMotion()) {
      this.state.explodeAmount = target;
      this.applyTransforms();
      this.requestRender();
    } else {
      this.explodeTween = gsap.to(this.state, {
        explodeAmount: target,
        duration: 0.65,
        ease: 'power3.out',
        onUpdate: () => {
          this.applyTransforms();
          this.requestRender();
        },
        onComplete: () => {
          this.explodeTween = null;
          this.requestRender();
        }
      });
    }
    this.emitState();
  }

  setKinematicsPlaying(play) {
    this.state.kinematicsPlaying = Boolean(play) && !isReducedMotion();
    this.lastFrameTs = performance.now();
    this.requestRender();
    this.emitState();
  }

  setAxes({ bridgePos, crabPos, hoistDrop }) {
    if (typeof bridgePos === 'number') this.state.bridgePos = bridgePos;
    if (typeof crabPos === 'number') this.state.crabPos = crabPos;
    if (typeof hoistDrop === 'number') this.state.hoistDrop = hoistDrop;
    this.applyTransforms();
    this.requestRender();
  }

  applyTransforms() {
    const rig = this.rigs[this.state.craneType];
    if (!rig) return;

    const e = this.state.explodeAmount;
    const bridgeZ = this.state.bridgePos * 4.4;
    const crabX = this.state.crabPos * 4.2;
    const dropDist = rig.minDrop + this.state.hoistDrop * (rig.maxDrop - rig.minDrop);

    rig.bridge.position.z = bridgeZ;

    // Spin rail wheels proportionally to bridge Z position
    const wheelAngle = bridgeZ / rig.wheelRadius;
    const activeWheels = this.wheels[this.state.craneType] || [];
    for (let i = 0; i < activeWheels.length; i += 1) {
      activeWheels[i].rotation.x = wheelAngle;
    }

    // Exploded assembly offsets
    rig.girders.position.y = e * 0.62;
    rig.endCarriages.children.forEach((ec) => {
      const side = ec.userData.side || 0;
      ec.position.x = side * e * 1.05;
    });

    rig.crab.position.x = crabX;
    rig.crab.position.y = (this.state.craneType === 'single-girder' ? 5.82 : 6.72) + e * 1.05;
    rig.drumGroup.position.y = (this.state.craneType === 'single-girder' ? -0.44 : 0.56) + e * 0.42;
    rig.gearboxGroup.position.x = (this.state.craneType === 'single-girder' ? -0.56 : 0.84) + e * 0.72;

    // Rotate rope drum & position hook block
    rig.drumMesh.rotation.y = this.state.hoistDrop * Math.PI * 5;
    const hookY = -(dropDist + e * 0.7);
    rig.hookBlock.position.y = hookY;

    // Stretch wire ropes accurately from upper sheave to lower hook block
    const ropeLength = Math.max(0.25, rig.ropeTopY - hookY);
    const ropeCenterY = (rig.ropeTopY + hookY) * 0.5;
    for (let i = 0; i < rig.ropes.length; i += 1) {
      rig.ropes[i].position.y = ropeCenterY;
      rig.ropes[i].scale.y = ropeLength;
    }
  }

  resize() {
    if (!this.initialized || !this.renderer || !this.camera) return;
    const width = this.hostEl.clientWidth;
    const height = this.hostEl.clientHeight;
    if (width <= 0 || height <= 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.requestRender();
  }

  start() {
    this.isActive = true;
    this.resize();
    this.lastFrameTs = performance.now();
    this.requestRender();
  }

  stopLoop() {
    this.isActive = false;
    if (this.rafId) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  requestRender() {
    if (!this.initialized || !this.isActive || this.contextLost) return;
    this.needsRender = true;
    if (!this.rafId) {
      this.rafId = window.requestAnimationFrame((ts) => this.frame(ts));
    }
  }

  frame(now) {
    this.rafId = 0;
    if (!this.isActive || this.contextLost || !this.renderer) return;

    const dt = Math.min((now - (this.lastFrameTs || now)) / 1000, 0.1);
    this.lastFrameTs = now;

    if (this.state.kinematicsPlaying) {
      this.simTime += dt;
      this.state.bridgePos = Math.sin(this.simTime * 0.55) * 0.65;
      this.state.crabPos = Math.cos(this.simTime * 0.78) * 0.72;
      this.state.hoistDrop = 0.45 + Math.sin(this.simTime * 1.15) * 0.35;
      this.applyTransforms();
      if (this.onStateChange) this.onStateChange(this.state, true);
    }

    const dampingMoved = this.controls ? this.controls.update() : false;
    this.renderer.render(this.scene, this.camera);
    this.needsRender = false;

    if (this.state.kinematicsPlaying || dampingMoved || this.cameraTween || this.explodeTween) {
      this.rafId = window.requestAnimationFrame((ts) => this.frame(ts));
    }
  }

  emitState() {
    if (this.onStateChange) this.onStateChange(this.state, false);
  }
}

/* ==========================================================================
   3. MODAL & COLLAPSIBLE DOCK CONTROLLER
   ========================================================================== */
function initSection04Modal() {
  const modal = document.getElementById('sv-crane-modal');
  const stage = document.getElementById('sv-modal-stage');
  const canvasHost = document.getElementById('sv-modal-canvas');
  const fallbackEl = document.getElementById('sv-modal-fallback');
  const titleEl = document.getElementById('sv-modal-title');
  const specsEl = document.getElementById('sv-modal-specs');
  const closeBtn = document.getElementById('sv-modal-close');
  const dockEl = document.getElementById('sv-modal-dock');
  const dockToggle = document.getElementById('sv-dock-toggle');

  const btnExplode = document.getElementById('sv-btn-explode');
  const btnKinematics = document.getElementById('sv-btn-kinematics');
  const rangeBridge = document.getElementById('sv-axis-bridge');
  const rangeCrab = document.getElementById('sv-axis-crab');
  const rangeHoist = document.getElementById('sv-axis-hoist');

  const rigBtns = Array.from(document.querySelectorAll('[data-crane-type]'));
  const viewBtns = Array.from(document.querySelectorAll('[data-camera-view]'));
  const openBtns = Array.from(document.querySelectorAll('[data-sv-crane-open]'));

  if (!modal || !canvasHost || !openBtns.length) return;

  let lastTrigger = null;

  function syncDockUI(state, slidersOnly) {
    if (rangeBridge) rangeBridge.value = state.bridgePos.toFixed(2);
    if (rangeCrab) rangeCrab.value = state.crabPos.toFixed(2);
    if (rangeHoist) rangeHoist.value = state.hoistDrop.toFixed(2);
    if (slidersOnly) return;

    const meta = RIG_SPECS[state.craneType] || RIG_SPECS['double-girder'];
    if (titleEl) titleEl.textContent = meta.title;
    if (specsEl) specsEl.textContent = meta.specs;

    rigBtns.forEach((b) => {
      b.classList.toggle('is-active', b.getAttribute('data-crane-type') === state.craneType);
    });
    viewBtns.forEach((b) => {
      b.classList.toggle('is-active', b.getAttribute('data-camera-view') === state.cameraView);
    });
    if (btnExplode) {
      btnExplode.setAttribute('aria-pressed', state.targetExplode > 0.5 ? 'true' : 'false');
    }
    if (btnKinematics) {
      btnKinematics.setAttribute('aria-pressed', state.kinematicsPlaying ? 'true' : 'false');
      btnKinematics.textContent = state.kinematicsPlaying ? 'Pause Motion' : 'Run Motion';
    }
  }

  const engine = new SVCraneBayEngine({
    hostEl: canvasHost,
    fallbackEl,
    onStateChange: syncDockUI
  });

  function getFocusables() {
    return Array.from(
      modal.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href]')
    ).filter((el) => el.offsetParent !== null);
  }

  function onKeydown(ev) {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      closeModal();
      return;
    }
    if (ev.key !== 'Tab') return;
    const focusables = getFocusables();
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (ev.shiftKey && document.activeElement === first) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && document.activeElement === last) {
      ev.preventDefault();
      first.focus();
    }
  }

  function openModal(presetKey, triggerEl) {
    lastTrigger = triggerEl || document.activeElement;
    const preset = CARD_PRESETS[presetKey] || CARD_PRESETS['01'];

    if (dockEl && dockToggle) {
      dockEl.setAttribute('data-collapsed', 'false');
      dockToggle.setAttribute('aria-expanded', 'true');
      dockToggle.textContent = 'Hide controls';
    }

    modal.hidden = false;
    document.body.classList.add('is-locked');
    document.addEventListener('keydown', onKeydown, true);

    const ok = engine.init();
    if (ok) {
      engine.resize();
      engine.applyCraneType(preset.craneType, false);
      engine.setExplode(preset.exploded, false);
      engine.setCameraView(preset.cameraView, false);
      engine.setKinematicsPlaying(preset.kinematics);
      engine.start();
      syncDockUI(engine.state, false);
    }

    if (!isReducedMotion()) {
      const panel = modal.querySelector('.sv-modal__panel');
      if (panel) {
        gsap.fromTo(
          panel,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out', clearProps: 'transform,opacity' }
        );
      }
    }

    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    engine.setKinematicsPlaying(false);
    engine.stopLoop();
    modal.hidden = true;
    document.body.classList.remove('is-locked');
    document.removeEventListener('keydown', onKeydown, true);
    if (lastTrigger && typeof lastTrigger.focus === 'function') {
      lastTrigger.focus();
    }
  }

  openBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      openModal(btn.getAttribute('data-sv-crane-open'), btn);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  modal.addEventListener('click', (ev) => {
    if (ev.target === modal) closeModal();
  });

  if (dockToggle && dockEl) {
    dockToggle.addEventListener('click', () => {
      const collapsed = dockEl.getAttribute('data-collapsed') === 'true';
      const next = !collapsed;
      dockEl.setAttribute('data-collapsed', next ? 'true' : 'false');
      dockToggle.setAttribute('aria-expanded', next ? 'false' : 'true');
      dockToggle.textContent = next ? 'Show controls' : 'Hide controls';
    });
  }

  rigBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      engine.applyCraneType(btn.getAttribute('data-crane-type'), true);
    });
  });

  viewBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      engine.setCameraView(btn.getAttribute('data-camera-view'), true);
    });
  });

  if (btnExplode) {
    btnExplode.addEventListener('click', () => {
      engine.setExplode(engine.state.targetExplode < 0.5, true);
    });
  }

  if (btnKinematics) {
    btnKinematics.addEventListener('click', () => {
      engine.setKinematicsPlaying(!engine.state.kinematicsPlaying);
    });
  }

  function onSliderInput() {
    engine.setKinematicsPlaying(false);
    engine.setAxes({
      bridgePos: rangeBridge ? parseFloat(rangeBridge.value) : 0,
      crabPos: rangeCrab ? parseFloat(rangeCrab.value) : 0,
      hoistDrop: rangeHoist ? parseFloat(rangeHoist.value) : 0.35
    });
  }

  if (rangeBridge) rangeBridge.addEventListener('input', onSliderInput);
  if (rangeCrab) rangeCrab.addEventListener('input', onSliderInput);
  if (rangeHoist) rangeHoist.addEventListener('input', onSliderInput);

  if (stage) {
    stage.addEventListener('dblclick', () => {
      engine.setCameraView('iso', true);
    });
  }
}

function boot() {
  initMilestone25Scroll();
  initSection04Scroll();
  initSection04Modal();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
