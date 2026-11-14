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
    { antialias: !isSoftwareGl, alpha: true, powerPreference: 'high-performance' },
    { antialias: false, alpha: true }
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

// 4 sequential front-three-quarter chapters across -Z hemisphere so boom/hook point rightward toward the callout column
const CHAPTERS = [
  {
    id: 'boom',
    thetaDeg: 244,
    radius: 6.1,
    camY: 2.38,
    target: [-0.46, 1.38, 0.0],
    boomPitch: 0.23,
    boomExt: 0.05,
    hookDrop: 0.70,
    jackDrop: 0.0,
    hookSwivel: 0.10,
    winchSpin: 0.0
  },
  {
    id: 'hook',
    thetaDeg: 264,
    radius: 5.95,
    camY: 2.08,
    target: [-0.48, 1.34, 0.0],
    boomPitch: 0.28,
    boomExt: 0.22,
    hookDrop: 1.08,
    jackDrop: 0.25,
    hookSwivel: 0.58,
    winchSpin: -2.0
  },
  {
    id: 'winch',
    thetaDeg: 284,
    radius: 5.95,
    camY: 2.15,
    target: [-0.42, 1.38, 0.0],
    boomPitch: 0.31,
    boomExt: 0.30,
    hookDrop: 0.92,
    jackDrop: 0.65,
    hookSwivel: 0.32,
    winchSpin: -3.8
  },
  {
    id: 'jacks',
    thetaDeg: 302,
    radius: 6.1,
    camY: 1.84,
    target: [-0.45, 1.32, 0.0],
    boomPitch: 0.25,
    boomExt: 0.14,
    hookDrop: 0.78,
    jackDrop: 1.0,
    hookSwivel: 0.0,
    winchSpin: -4.4
  }
];

function createContactShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, 512, 512);
  const grad = ctx.createRadialGradient(256, 256, 24, 256, 256, 240);
  grad.addColorStop(0, 'rgba(18, 24, 34, 0.28)');
  grad.addColorStop(0.45, 'rgba(22, 28, 38, 0.13)');
  grad.addColorStop(0.76, 'rgba(24, 30, 40, 0.04)');
  grad.addColorStop(1, 'rgba(24, 30, 40, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStencilPlateTexture(topLine, bottomLine, bgColor = '#E5A91A', fgColor = '#161A20') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 192);

  ctx.strokeStyle = fgColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 492, 172);

  ctx.fillStyle = fgColor;
  ctx.font = '700 44px "Inter Tight", "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(topLine, 256, 70);

  ctx.font = '600 24px "IBM Plex Mono", monospace';
  ctx.fillText(bottomLine, 256, 130);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createGroovedDrumTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#5B6470';
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 8) {
    ctx.fillStyle = '#7C8794';
    ctx.fillRect(0, y, 256, 4);
    ctx.fillStyle = '#2F3640';
    ctx.fillRect(0, y + 4, 256, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createForgedHookMesh(steelMat, trackGeo) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.042, 0.14);
  shape.lineTo(0.042, 0.14);
  shape.lineTo(0.042, 0.02);
  shape.bezierCurveTo(0.145, -0.025, 0.16, -0.175, 0.015, -0.215);
  shape.bezierCurveTo(-0.115, -0.24, -0.165, -0.135, -0.115, -0.055);
  shape.lineTo(-0.068, -0.078);
  shape.bezierCurveTo(-0.102, -0.135, -0.052, -0.18, 0.014, -0.165);
  shape.bezierCurveTo(0.096, -0.142, 0.092, -0.042, -0.012, -0.012);
  shape.lineTo(-0.042, 0.02);
  shape.closePath();

  const geo = trackGeo(new THREE.ExtrudeGeometry(shape, {
    depth: 0.058,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2
  }));
  geo.center();
  const mesh = new THREE.Mesh(geo, steelMat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createGroovedSheaveMesh(radius, thickness, steelMat, darkMat, trackGeo) {
  const pts = [
    new THREE.Vector2(0.02, -thickness * 0.5),
    new THREE.Vector2(radius, -thickness * 0.5),
    new THREE.Vector2(radius * 0.84, -thickness * 0.15),
    new THREE.Vector2(radius * 0.84, thickness * 0.15),
    new THREE.Vector2(radius, thickness * 0.5),
    new THREE.Vector2(0.02, thickness * 0.5)
  ];
  const geo = trackGeo(new THREE.LatheGeometry(pts, 28));
  geo.rotateX(Math.PI / 2);
  const group = new THREE.Group();
  const wheel = new THREE.Mesh(geo, steelMat);
  wheel.castShadow = true;
  group.add(wheel);

  const hub = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(radius * 0.34, radius * 0.34, thickness * 1.18, 16)),
    darkMat
  );
  hub.rotation.x = Math.PI / 2;
  group.add(hub);
  return group;
}

class SVFloorCraneEngine {
  constructor({ section, mount, svgEl, boxEls, leaderEls, fallbackEl }) {
    this.section = section;
    this.mount = mount;
    this.svgEl = svgEl;
    this.boxEls = boxEls;
    this.leaderEls = leaderEls;
    this.fallbackEl = fallbackEl;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.pmremGenerator = null;
    this.envRenderTarget = null;
    this.disposables = { geometries: [], materials: [], textures: [] };

    this.progressTarget = 0;
    this.progressCurrent = 0;
    this.activeChapterIdx = -1;

    this.currentCam = {
      thetaDeg: CHAPTERS[0].thetaDeg,
      radius: CHAPTERS[0].radius,
      camY: CHAPTERS[0].camY,
      tx: CHAPTERS[0].target[0],
      ty: CHAPTERS[0].target[1],
      tz: CHAPTERS[0].target[2]
    };

    this.state = {
      boomPitch: CHAPTERS[0].boomPitch,
      boomExt: CHAPTERS[0].boomExt,
      hookDrop: CHAPTERS[0].hookDrop,
      jackDrop: CHAPTERS[0].jackDrop,
      hookSwivel: CHAPTERS[0].hookSwivel,
      winchSpin: CHAPTERS[0].winchSpin
    };

    // Pooled reusable math objects (zero GC in loop)
    this._anchorVec = new THREE.Vector3();
    this._tmpA = new THREE.Vector3();
    this._tmpB = new THREE.Vector3();
    this._tmpMid = new THREE.Vector3();
    this._ropeP0 = new THREE.Vector3();
    this._ropeP1 = new THREE.Vector3();
    this._ropeP2 = new THREE.Vector3();
    this._upAxis = new THREE.Vector3(0, 1, 0);
    this._dirVec = new THREE.Vector3();

    this.lastTickTs = 0;
    this.frameId = 0;
    this.renderBusy = false;
    this.renderDirty = false;
    this.loopActive = false;
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
    const width = Math.max(this.mount.clientWidth || 960, 320);
    const height = Math.max(this.mount.clientHeight || 480, 280);

    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.mount.textContent = '';
    this.mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = null;
    this.scene = scene;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new RoomEnvironment();
    this.envRenderTarget = pmrem.fromScene(envScene, 0.04);
    scene.environment = this.envRenderTarget.texture;
    scene.environmentIntensity = 0.85;
    envScene.dispose();
    this.pmremGenerator = pmrem;

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 80);
    this.camera = camera;

    this.buildEnvironment();
    this.buildMaterials();
    this.buildFloorCrane();

    this.applyRigAndCameraFromParams(0, 1);
    this.updateActiveBoxes(0);

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

    this.requestRender();
    return true;
  }

  buildEnvironment() {
    const scene = this.scene;

    const hemi = new THREE.HemisphereLight(0xf8fbff, 0xa2aab4, 0.82);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff7ec, 2.05);
    key.position.set(4.8, 8.2, -6.2);
    key.castShadow = !isSoftwareGl;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 24;
    key.shadow.camera.left = -4.5;
    key.shadow.camera.right = 4.5;
    key.shadow.camera.top = 4.5;
    key.shadow.camera.bottom = -4.5;
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xc2d5f2, 0.92);
    rim.position.set(-5.8, 4.6, 5.2);
    scene.add(rim);

    // Transparent shadow-catcher plane so real shadows land directly on #EFEFEF
    if (!isSoftwareGl) {
      const shadowMat = this.trackMat(
        new THREE.ShadowMaterial({
          color: 0x141a24,
          opacity: 0.16
        })
      );
      const shadowFloor = new THREE.Mesh(this.trackGeo(new THREE.PlaneGeometry(18, 18)), shadowMat);
      shadowFloor.rotation.x = -Math.PI / 2;
      shadowFloor.position.y = 0.001;
      shadowFloor.receiveShadow = true;
      scene.add(shadowFloor);
    }

    // Soft elliptical product contact shadow under wheels & jacks (matches SVIND core.css S2)
    const contactTex = this.trackTex(createContactShadowTexture());
    if (contactTex) {
      const contactMat = this.trackMat(
        new THREE.MeshBasicMaterial({
          map: contactTex,
          transparent: true,
          depthWrite: false
        })
      );
      const contactPlane = new THREE.Mesh(
        this.trackGeo(new THREE.PlaneGeometry(5.6, 3.8)),
        contactMat
      );
      contactPlane.rotation.x = -Math.PI / 2;
      contactPlane.position.set(-0.2, 0.005, 0);
      scene.add(contactPlane);
    }
  }

  buildMaterials() {
    const maxAniso = Math.min(this.renderer.capabilities.getMaxAnisotropy() || 4, 8);

    const drumTex = this.trackTex(createGroovedDrumTexture());
    if (drumTex) drumTex.anisotropy = maxAniso;

    const ballastTex = this.trackTex(createStencilPlateTexture('1.5 TON', 'BALLAST CAGE', '#272C33', '#E5A91A'));
    if (ballastTex) ballastTex.anisotropy = maxAniso;

    const swlTex = this.trackTex(createStencilPlateTexture('1.0–3.0 TON SWL', 'SVIND FLOOR CRANE', '#E5A91A', '#161A20'));
    if (swlTex) swlTex.anisotropy = maxAniso;

    this.mats = {
      yellow: this.trackMat(new THREE.MeshPhysicalMaterial({
        color: 0xe3a818,
        roughness: 0.34,
        metalness: 0.16,
        clearcoat: 0.35,
        clearcoatRoughness: 0.25
      })),
      yellowDark: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0xc28b0e,
        roughness: 0.44,
        metalness: 0.2
      })),
      svindBlue: this.trackMat(new THREE.MeshPhysicalMaterial({
        color: 0x1e5394,
        roughness: 0.36,
        metalness: 0.24,
        clearcoat: 0.25
      })),
      hookRed: this.trackMat(new THREE.MeshPhysicalMaterial({
        color: 0xc43628,
        roughness: 0.32,
        metalness: 0.18,
        clearcoat: 0.3
      })),
      forgedSteel: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0x262b33,
        roughness: 0.34,
        metalness: 0.85
      })),
      chrome: this.trackMat(new THREE.MeshPhysicalMaterial({
        color: 0xd8dee6,
        roughness: 0.12,
        metalness: 0.96,
        anisotropy: 0.7
      })),
      machinedSteel: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0x8e98a6,
        roughness: 0.26,
        metalness: 0.88
      })),
      drumGrooved: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0xa4adb9,
        map: drumTex || null,
        roughness: 0.32,
        metalness: 0.86
      })),
      wireRope: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0x3b424c,
        roughness: 0.42,
        metalness: 0.82
      })),
      casterRubber: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0x1e2228,
        roughness: 0.82,
        metalness: 0.08
      })),
      castIron: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0x252a30,
        roughness: 0.72,
        metalness: 0.45
      })),
      ballastPlate: this.trackMat(new THREE.MeshStandardMaterial({
        map: ballastTex || null,
        color: 0xffffff,
        roughness: 0.5,
        metalness: 0.2
      })),
      swlPlate: this.trackMat(new THREE.MeshStandardMaterial({
        map: swlTex || null,
        color: 0xffffff,
        roughness: 0.38,
        metalness: 0.14
      }))
    };
  }

  addBox(parent, w, h, d, mat, x, y, z) {
    const mesh = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(w, h, d)), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  buildFloorCrane() {
    const root = new THREE.Group();
    this.craneRoot = root;
    this.scene.add(root);

    // 1. OUTRIGGER CHASSIS BASE (casters rest flush at y = 0)
    const wheelR = 0.115;
    const baseY = wheelR * 2 + 0.04;

    const chassis = new THREE.Group();
    root.add(chassis);

    [-0.66, 0.66].forEach((z) => {
      this.addBox(chassis, 2.6, 0.11, 0.11, this.mats.yellow, 0.25, baseY, z);
    });

    [-0.92, -0.15, 0.68, 1.48].forEach((x) => {
      this.addBox(chassis, 0.11, 0.1, 1.42, this.mats.yellow, x, baseY, 0);
    });

    this.addBox(chassis, 1.56, 0.11, 0.14, this.mats.yellow, 0.68, baseY, 0);

    const casterCoords = [
      [-0.94, -0.66],
      [-0.94, 0.66],
      [0.72, -0.66],
      [0.72, 0.66]
    ];
    casterCoords.forEach(([cx, cz]) => {
      const caster = new THREE.Group();
      caster.position.set(cx, 0, cz);

      this.addBox(caster, 0.15, 0.03, 0.15, this.mats.forgedSteel, 0, baseY - 0.068, 0);

      [-0.045, 0.045].forEach((fz) => {
        const leg = this.addBox(caster, 0.09, 0.13, 0.018, this.mats.machinedSteel, -0.02, wheelR + 0.035, fz);
        leg.rotation.z = 0.18;
      });

      const tire = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(wheelR, wheelR, 0.068, 24)),
        this.mats.casterRubber
      );
      tire.rotation.x = Math.PI / 2;
      tire.position.set(-0.03, wheelR, 0);
      tire.castShadow = true;
      caster.add(tire);

      const hub = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(wheelR * 0.54, wheelR * 0.54, 0.088, 16)),
        this.mats.machinedSteel
      );
      hub.rotation.x = Math.PI / 2;
      hub.position.set(-0.03, wheelR, 0);
      caster.add(hub);

      root.add(caster);
    });

    // 2. MANUAL SCREW-DOWN STABILIZING JACKS
    this.jacks = [];
    const jackCoords = [
      [-1.08, -0.78],
      [-1.08, 0.78],
      [0.86, -0.78],
      [0.86, 0.78]
    ];
    jackCoords.forEach(([jx, jz]) => {
      const jackBracket = new THREE.Group();
      jackBracket.position.set(jx, baseY, jz);

      this.addBox(jackBracket, 0.13, 0.11, 0.13, this.mats.yellowDark, 0, 0, 0);

      const sleeve = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.038, 0.038, 0.16, 14)),
        this.mats.forgedSteel
      );
      sleeve.position.y = 0.02;
      jackBracket.add(sleeve);

      const plunger = new THREE.Group();
      plunger.userData.parkedY = -0.085;
      plunger.userData.deployedY = -baseY + 0.012;
      plunger.position.y = plunger.userData.parkedY;

      const rod = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.02, 0.02, 0.34, 12)),
        this.mats.machinedSteel
      );
      rod.position.y = 0.16;
      rod.castShadow = true;
      plunger.add(rod);

      const crank = this.addBox(plunger, 0.16, 0.016, 0.016, this.mats.forgedSteel, 0, 0.33, 0);
      crank.rotation.y = Math.PI * 0.25;

      this.addBox(plunger, 0.14, 0.022, 0.14, this.mats.forgedSteel, 0, 0, 0);

      jackBracket.add(plunger);
      root.add(jackBracket);
      this.jacks.push(plunger);
    });

    // 3. VERTICAL MAST TOWER + A-FRAME GUSSETS
    const mast = new THREE.Group();
    root.add(mast);

    this.addBox(mast, 0.16, 1.98, 0.16, this.mats.yellow, -0.15, baseY + 0.99, 0);
    this.addBox(mast, 0.3, 0.04, 0.3, this.mats.forgedSteel, -0.15, baseY + 0.06, 0);

    [-0.58, 0.58].forEach((sz) => {
      const strutLen = Math.hypot(0.58, 1.56);
      const strut = this.addBox(mast, 0.075, strutLen, 0.075, this.mats.yellow, -0.15, baseY + 0.78, sz * 0.5);
      strut.rotation.x = Math.sign(sz) * Math.atan2(0.58, 1.56);
    });

    this.addBox(mast, 0.14, 1.82, 0.14, this.mats.yellow, 0.68, baseY + 0.91, 0);
    this.addBox(mast, 0.26, 0.04, 0.26, this.mats.forgedSteel, 0.68, baseY + 0.06, 0);
    this.addBox(mast, 0.34, 0.32, 0.18, this.mats.yellowDark, -0.15, baseY + 1.82, 0);

    const boomPivotPos = new THREE.Vector3(-0.15, 2.28, 0);
    const pivotPin = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.036, 0.036, 0.24, 16)),
      this.mats.machinedSteel
    );
    pivotPin.rotation.x = Math.PI / 2;
    pivotPin.position.copy(boomPivotPos);
    mast.add(pivotPin);

    // 4. REAR 1.5 TON BALLAST CAGE + WINCH & BLUE HELICAL GEARBOX
    const rearDeckY = baseY + 0.06;

    this.addBox(mast, 0.62, 0.05, 0.86, this.mats.yellow, 1.24, rearDeckY + 0.02, 0);
    [
      [0.95, -0.4],
      [0.95, 0.4],
      [1.52, -0.4],
      [1.52, 0.4]
    ].forEach(([px, pz]) => {
      this.addBox(mast, 0.045, 0.58, 0.045, this.mats.yellow, px, rearDeckY + 0.31, pz);
    });
    this.addBox(mast, 0.61, 0.04, 0.045, this.mats.yellow, 1.24, rearDeckY + 0.58, -0.4);
    this.addBox(mast, 0.61, 0.04, 0.045, this.mats.yellow, 1.24, rearDeckY + 0.58, 0.4);
    this.addBox(mast, 0.045, 0.04, 0.84, this.mats.yellow, 1.52, rearDeckY + 0.58, 0);
    this.addBox(mast, 0.045, 0.04, 0.84, this.mats.yellow, 0.95, rearDeckY + 0.58, 0);

    this.addBox(mast, 0.52, 0.52, 0.74, this.mats.castIron, 1.24, rearDeckY + 0.28, 0);

    const ballastBadge = this.addBox(mast, 0.42, 0.16, 0.012, this.mats.ballastPlate, 1.24, rearDeckY + 0.31, 0.426);
    ballastBadge.castShadow = false;
    const ballastBadgeBack = this.addBox(mast, 0.42, 0.16, 0.012, this.mats.ballastPlate, 1.24, rearDeckY + 0.31, -0.426);
    ballastBadgeBack.rotation.y = Math.PI;
    ballastBadgeBack.castShadow = false;

    const winchDeckY = rearDeckY + 0.76;
    [
      [0.92, -0.34],
      [0.92, 0.34],
      [1.46, -0.34],
      [1.46, 0.34]
    ].forEach(([px, pz]) => {
      this.addBox(mast, 0.04, 0.2, 0.04, this.mats.yellow, px, winchDeckY - 0.09, pz);
    });
    this.addBox(mast, 0.6, 0.045, 0.74, this.mats.yellow, 1.19, winchDeckY, 0);

    const winchDrum = new THREE.Group();
    winchDrum.position.set(1.06, winchDeckY + 0.19, -0.06);
    const drumCore = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.13, 0.13, 0.36, 24)),
      this.mats.drumGrooved
    );
    drumCore.rotation.x = Math.PI / 2;
    drumCore.castShadow = true;
    winchDrum.add(drumCore);

    [-0.185, 0.185].forEach((fz) => {
      const flange = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.19, 0.19, 0.022, 24)),
        this.mats.forgedSteel
      );
      flange.rotation.x = Math.PI / 2;
      flange.position.z = fz;
      winchDrum.add(flange);
    });

    this.addBox(mast, 0.12, 0.24, 0.06, this.mats.forgedSteel, 1.06, winchDeckY + 0.13, -0.28);
    mast.add(winchDrum);
    this.winchDrum = winchDrum;
    this.winchTopWorld = new THREE.Vector3(1.06, winchDeckY + 0.31, -0.06);

    this.addBox(mast, 0.26, 0.28, 0.18, this.mats.svindBlue, 1.08, winchDeckY + 0.16, 0.21);
    const motorBody = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.1, 0.1, 0.26, 20)),
      this.mats.svindBlue
    );
    motorBody.rotation.z = Math.PI / 2;
    motorBody.position.set(1.28, winchDeckY + 0.16, 0.21);
    motorBody.castShadow = true;
    mast.add(motorBody);

    const ctrlBox = new THREE.Group();
    ctrlBox.position.set(0.84, winchDeckY - 0.18, -0.34);
    this.addBox(ctrlBox, 0.22, 0.32, 0.14, this.mats.svindBlue, 0, 0, 0);
    const isolator = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.03, 12)),
      this.mats.forgedSteel
    );
    isolator.rotation.x = Math.PI / 2;
    isolator.position.set(-0.04, 0.05, -0.075);
    ctrlBox.add(isolator);

    const estop = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.028, 12)),
      this.mats.hookRed
    );
    estop.rotation.x = Math.PI / 2;
    estop.position.set(0.045, 0.05, -0.075);
    ctrlBox.add(estop);
    mast.add(ctrlBox);

    const conduitCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.84, winchDeckY - 0.02, -0.34),
      new THREE.Vector3(0.95, winchDeckY + 0.04, -0.18),
      new THREE.Vector3(1.18, winchDeckY + 0.06, 0.12)
    ]);
    const conduitMesh = new THREE.Mesh(
      this.trackGeo(new THREE.TubeGeometry(conduitCurve, 18, 0.015, 8, false)),
      this.mats.forgedSteel
    );
    mast.add(conduitMesh);

    const rearGuidePos = new THREE.Vector3(0.68, 2.15, 0);
    const rearSheave = createGroovedSheaveMesh(
      0.11,
      0.05,
      this.mats.machinedSteel,
      this.mats.forgedSteel,
      (g) => this.trackGeo(g)
    );
    rearSheave.position.copy(rearGuidePos);
    mast.add(rearSheave);
    this.rearGuideWorld = new THREE.Vector3(0.68, 2.25, 0);

    // 5. CANTILEVER TELESCOPING BOOM ASSEMBLY
    const boomPivot = new THREE.Group();
    boomPivot.position.copy(boomPivotPos);
    root.add(boomPivot);
    this.boomPivot = boomPivot;

    this.addBox(boomPivot, 2.48, 0.18, 0.16, this.mats.yellow, -0.32, 0, 0);
    this.addBox(boomPivot, 0.14, 0.21, 0.19, this.mats.yellowDark, -1.52, 0, 0);

    const swlFront = this.addBox(boomPivot, 0.64, 0.12, 0.008, this.mats.swlPlate, -0.78, 0, 0.084);
    swlFront.castShadow = false;
    const swlBack = this.addBox(boomPivot, 0.64, 0.12, 0.008, this.mats.swlPlate, -0.78, 0, -0.084);
    swlBack.rotation.y = Math.PI;
    swlBack.castShadow = false;

    const midGuide = createGroovedSheaveMesh(
      0.055,
      0.04,
      this.mats.machinedSteel,
      this.mats.forgedSteel,
      (g) => this.trackGeo(g)
    );
    midGuide.position.set(-0.25, 0.13, 0);
    boomPivot.add(midGuide);
    this.midGuideLocal = new THREE.Vector3(-0.25, 0.18, 0);

    const boomExt = new THREE.Group();
    boomPivot.add(boomExt);
    this.boomExt = boomExt;

    this.addBox(boomExt, 1.12, 0.135, 0.12, this.mats.yellow, -1.78, 0, 0);

    const tipHead = new THREE.Group();
    tipHead.position.set(-2.35, -0.01, 0);
    boomExt.add(tipHead);
    this.tipHead = tipHead;

    [-0.068, 0.068].forEach((cz) => {
      this.addBox(tipHead, 0.24, 0.22, 0.018, this.mats.yellowDark, -0.02, -0.03, cz);
    });

    this.tipSheave = createGroovedSheaveMesh(
      0.115,
      0.05,
      this.mats.machinedSteel,
      this.mats.forgedSteel,
      (g) => this.trackGeo(g)
    );
    this.tipSheave.position.set(-0.04, -0.04, 0);
    tipHead.add(this.tipSheave);
    this.tipTopLocal = new THREE.Vector3(-0.04, 0.065, 0);
    this.tipAnchorLocal = new THREE.Vector3(-0.04, -0.14, 0);

    this.addBox(tipHead, 0.1, 0.08, 0.07, this.mats.hookRed, 0.07, -0.13, 0.085);
    const limitArm = this.addBox(tipHead, 0.16, 0.016, 0.016, this.mats.forgedSteel, -0.02, -0.16, 0.085);
    limitArm.rotation.z = 0.24;

    // 6. COUPLED HYDRAULIC LIFTING RAM
    const ramMastClevis = new THREE.Vector3(-0.02, 1.15, 0);
    this.ramBoomLugLocal = new THREE.Vector3(-0.75, -0.11, 0);

    const ramBarrelGroup = new THREE.Group();
    ramBarrelGroup.position.copy(ramMastClevis);
    root.add(ramBarrelGroup);
    this.ramBarrelGroup = ramBarrelGroup;

    const barrelMesh = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.052, 0.052, 0.72, 18)),
      this.mats.yellowDark
    );
    barrelMesh.rotation.x = Math.PI / 2;
    barrelMesh.position.z = 0.36;
    barrelMesh.castShadow = true;
    ramBarrelGroup.add(barrelMesh);

    const glandNut = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 16)),
      this.mats.forgedSteel
    );
    glandNut.rotation.x = Math.PI / 2;
    glandNut.position.z = 0.72;
    ramBarrelGroup.add(glandNut);

    const ramPistonGroup = new THREE.Group();
    root.add(ramPistonGroup);
    this.ramPistonGroup = ramPistonGroup;

    const pistonRod = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 0.72, 18)),
      this.mats.chrome
    );
    pistonRod.rotation.x = Math.PI / 2;
    pistonRod.position.z = 0.36;
    pistonRod.castShadow = true;
    ramPistonGroup.add(pistonRod);

    // 7. FORGED SWIVEL HOOK & SNATCH BLOCK
    const hookBlock = new THREE.Group();
    root.add(hookBlock);
    this.hookBlock = hookBlock;

    [-0.044, 0.044].forEach((hz) => {
      this.addBox(hookBlock, 0.14, 0.24, 0.016, this.mats.hookRed, 0, 0.04, hz);
    });
    const blockSheave = createGroovedSheaveMesh(
      0.062,
      0.042,
      this.mats.machinedSteel,
      this.mats.forgedSteel,
      (g) => this.trackGeo(g)
    );
    blockSheave.position.y = 0.07;
    hookBlock.add(blockSheave);

    const hookSwivelPivot = new THREE.Group();
    hookSwivelPivot.position.y = -0.11;
    hookBlock.add(hookSwivelPivot);
    this.hookSwivelPivot = hookSwivelPivot;

    const swivelNut = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.032, 0.032, 0.06, 14)),
      this.mats.machinedSteel
    );
    swivelNut.position.y = 0.03;
    hookSwivelPivot.add(swivelNut);

    const forgedHook = createForgedHookMesh(this.mats.forgedSteel, (g) => this.trackGeo(g));
    forgedHook.position.y = -0.11;
    hookSwivelPivot.add(forgedHook);

    // Dynamic Steel Wire Rope Segments
    const ropeUnitGeo = this.trackGeo(new THREE.CylinderGeometry(0.0095, 0.0095, 1, 8));
    this.ropeSegs = [];
    for (let i = 0; i < 4; i += 1) {
      const ropeMesh = new THREE.Mesh(ropeUnitGeo, this.mats.wireRope);
      ropeMesh.castShadow = true;
      root.add(ropeMesh);
      this.ropeSegs.push(ropeMesh);
    }

    // World anchor constants for boxes 03 & 04 (on camera-facing -Z side)
    this.winchAnchorWorld = new THREE.Vector3(1.06, winchDeckY + 0.32, -0.10);
    this.jackAnchorWorld = new THREE.Vector3(-1.08, 0.14, -0.78);
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

  sampleChapterValues(t) {
    const clamped = THREE.MathUtils.clamp(t, 0, 1);
    const segCount = CHAPTERS.length - 1;
    const scaled = clamped * segCount;
    const idx = Math.min(Math.floor(scaled), segCount - 1);
    const frac = scaled - idx;
    const s = frac * frac * (3 - 2 * frac);
    const a = CHAPTERS[idx];
    const b = CHAPTERS[idx + 1];

    return {
      nearestIdx: Math.round(scaled),
      thetaDeg: THREE.MathUtils.lerp(a.thetaDeg, b.thetaDeg, s),
      radius: THREE.MathUtils.lerp(a.radius, b.radius, s),
      camY: THREE.MathUtils.lerp(a.camY, b.camY, s),
      tx: THREE.MathUtils.lerp(a.target[0], b.target[0], s),
      ty: THREE.MathUtils.lerp(a.target[1], b.target[1], s),
      tz: THREE.MathUtils.lerp(a.target[2], b.target[2], s),
      boomPitch: THREE.MathUtils.lerp(a.boomPitch, b.boomPitch, s),
      boomExt: THREE.MathUtils.lerp(a.boomExt, b.boomExt, s),
      hookDrop: THREE.MathUtils.lerp(a.hookDrop, b.hookDrop, s),
      jackDrop: THREE.MathUtils.lerp(a.jackDrop, b.jackDrop, s),
      hookSwivel: THREE.MathUtils.lerp(a.hookSwivel, b.hookSwivel, s),
      winchSpin: THREE.MathUtils.lerp(a.winchSpin, b.winchSpin, s)
    };
  }

  applyRigAndCameraFromParams(t, dtFactor) {
    const target = this.sampleChapterValues(t);

    if (dtFactor >= 0.999 || prefersReducedMotion()) {
      this.currentCam.thetaDeg = target.thetaDeg;
      this.currentCam.radius = target.radius;
      this.currentCam.camY = target.camY;
      this.currentCam.tx = target.tx;
      this.currentCam.ty = target.ty;
      this.currentCam.tz = target.tz;

      this.state.boomPitch = target.boomPitch;
      this.state.boomExt = target.boomExt;
      this.state.hookDrop = target.hookDrop;
      this.state.jackDrop = target.jackDrop;
      this.state.hookSwivel = target.hookSwivel;
      this.state.winchSpin = target.winchSpin;
    } else {
      const dt = dtFactor;
      this.currentCam.thetaDeg = THREE.MathUtils.damp(this.currentCam.thetaDeg, target.thetaDeg, 6.5, dt);
      this.currentCam.radius = THREE.MathUtils.damp(this.currentCam.radius, target.radius, 6.5, dt);
      this.currentCam.camY = THREE.MathUtils.damp(this.currentCam.camY, target.camY, 6.5, dt);
      this.currentCam.tx = THREE.MathUtils.damp(this.currentCam.tx, target.tx, 6.5, dt);
      this.currentCam.ty = THREE.MathUtils.damp(this.currentCam.ty, target.ty, 6.5, dt);
      this.currentCam.tz = THREE.MathUtils.damp(this.currentCam.tz, target.tz, 6.5, dt);

      this.state.boomPitch = THREE.MathUtils.damp(this.state.boomPitch, target.boomPitch, 7, dt);
      this.state.boomExt = THREE.MathUtils.damp(this.state.boomExt, target.boomExt, 7, dt);
      this.state.hookDrop = THREE.MathUtils.damp(this.state.hookDrop, target.hookDrop, 7, dt);
      this.state.jackDrop = THREE.MathUtils.damp(this.state.jackDrop, target.jackDrop, 7, dt);
      this.state.hookSwivel = THREE.MathUtils.damp(this.state.hookSwivel, target.hookSwivel, 7, dt);
      this.state.winchSpin = THREE.MathUtils.damp(this.state.winchSpin, target.winchSpin, 7, dt);
    }

    // Cushion radius and horizontal framing on narrow mobile viewports so boom tip & hook remain unclipped
    const aspect = this.camera.aspect;
    const aspectScale = aspect < 1.15 ? 1.38 : aspect < 1.32 ? 1.12 : 1.0;
    const txAdj = aspect < 1.15 ? this.currentCam.tx + 0.16 : this.currentCam.tx;
    const rad = THREE.MathUtils.degToRad(this.currentCam.thetaDeg);
    const rEff = this.currentCam.radius * aspectScale;
    this.camera.position.set(
      txAdj + Math.cos(rad) * rEff,
      this.currentCam.camY,
      this.currentCam.tz + Math.sin(rad) * rEff
    );
    this.camera.lookAt(txAdj, this.currentCam.ty, this.currentCam.tz);
    this.camera.updateMatrixWorld();

    // Articulated crane mechanisms
    this.boomPivot.rotation.z = -this.state.boomPitch;
    this.boomExt.position.x = -this.state.boomExt;
    this.boomPivot.updateMatrixWorld(true);

    this._tmpB.copy(this.ramBoomLugLocal).applyMatrix4(this.boomPivot.matrixWorld);
    this.ramBarrelGroup.lookAt(this._tmpB);
    this.ramPistonGroup.position.copy(this._tmpB);
    this.ramPistonGroup.lookAt(this.ramBarrelGroup.position);

    this.jacks.forEach((plunger) => {
      plunger.position.y = THREE.MathUtils.lerp(
        plunger.userData.parkedY,
        plunger.userData.deployedY,
        this.state.jackDrop
      );
      plunger.rotation.y = this.state.jackDrop * Math.PI * 2.5;
    });

    this.winchDrum.rotation.z = this.state.winchSpin;
    this.tipSheave.rotation.z = -this.state.winchSpin * 0.65;

    this._tmpA.copy(this.tipAnchorLocal).applyMatrix4(this.tipHead.matrixWorld);
    const hookY = Math.max(0.32, this._tmpA.y - this.state.hookDrop);
    this.hookBlock.position.set(this._tmpA.x, hookY, this._tmpA.z);
    this.hookSwivelPivot.rotation.y = this.state.hookSwivel;

    this._ropeP0.copy(this.winchTopWorld);
    this.positionCylinderBetween(this.ropeSegs[0], this._ropeP0, this.rearGuideWorld);

    this._ropeP1.copy(this.midGuideLocal).applyMatrix4(this.boomPivot.matrixWorld);
    this.positionCylinderBetween(this.ropeSegs[1], this.rearGuideWorld, this._ropeP1);

    this._ropeP2.copy(this.tipTopLocal).applyMatrix4(this.tipHead.matrixWorld);
    this.positionCylinderBetween(this.ropeSegs[2], this._ropeP1, this._ropeP2);

    this._tmpB.set(this._tmpA.x, hookY + 0.14, this._tmpA.z);
    this.positionCylinderBetween(this.ropeSegs[3], this._tmpA, this._tmpB);

    if (target.nearestIdx !== this.activeChapterIdx) {
      this.activeChapterIdx = target.nearestIdx;
      this.updateActiveBoxes(this.activeChapterIdx);
    }
    this.updateAllLeaderLines(this.activeChapterIdx);
  }

  updateActiveBoxes(idx) {
    this.boxEls.forEach((box, i) => {
      const active = i === idx;
      box.classList.toggle('is-active', active);
      box.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    this.leaderEls.forEach((g, i) => {
      g.classList.toggle('is-active', i === idx);
    });
  }

  getAnchorWorld(idx, outVec) {
    if (idx === 0 && this.tipHead) {
      outVec.copy(this.tipTopLocal).applyMatrix4(this.tipHead.matrixWorld);
    } else if (idx === 1 && this.hookBlock) {
      outVec.copy(this.hookBlock.position);
      outVec.y -= 0.08;
    } else if (idx === 2) {
      outVec.copy(this.winchAnchorWorld);
    } else {
      outVec.copy(this.jackAnchorWorld);
    }
    return outVec;
  }

  updateAllLeaderLines(activeIdx) {
    if (!this.svgEl || !this.leaderEls.length) return;
    const stageRect = this.svgEl.getBoundingClientRect();
    const mountRect = this.mount.getBoundingClientRect();
    const width = stageRect.width;
    const height = stageRect.height;
    if (window.innerWidth < 900 || width < 640 || height < 240) {
      this.leaderEls.forEach((g) => {
        const line = g.querySelector('.sv-fc__leader-line');
        if (line) line.setAttribute('points', '');
      });
      return;
    }

    this.svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const mountOffsetX = mountRect.left - stageRect.left;
    const mountOffsetY = mountRect.top - stageRect.top;

    for (let i = 0; i < this.leaderEls.length; i += 1) {
      const g = this.leaderEls[i];
      const box = this.boxEls[i];
      const line = g.querySelector('.sv-fc__leader-line');
      const dot = g.querySelector('.sv-fc__leader-dot');
      if (!box || !line || !dot) continue;

      this.getAnchorWorld(i, this._anchorVec);
      this._anchorVec.project(this.camera);

      const ax = mountOffsetX + THREE.MathUtils.clamp((this._anchorVec.x * 0.5 + 0.5) * mountRect.width, 20, mountRect.width - 16);
      const ay = mountOffsetY + THREE.MathUtils.clamp((-this._anchorVec.y * 0.5 + 0.5) * mountRect.height, 20, mountRect.height - 20);

      const boxRect = box.getBoundingClientRect();
      const cx = boxRect.left - stageRect.left;
      const cy = boxRect.top - stageRect.top + boxRect.height * 0.5;
      const elbowX = cx - 28;

      line.setAttribute('points', `${cx.toFixed(1)},${cy.toFixed(1)} ${elbowX.toFixed(1)},${cy.toFixed(1)} ${ax.toFixed(1)},${ay.toFixed(1)}`);
      dot.setAttribute('cx', ax.toFixed(1));
      dot.setAttribute('cy', ay.toFixed(1));
      g.classList.toggle('is-active', i === activeIdx);
    }
  }

  setTargetProgress(t) {
    this.progressTarget = THREE.MathUtils.clamp(t, 0, 1);
    if (prefersReducedMotion()) {
      this.progressCurrent = this.progressTarget;
      this.applyRigAndCameraFromParams(this.progressCurrent, 1);
      this.requestRender();
      return;
    }
    this.startDampLoop();
  }

  jumpToChapter(idx) {
    const t = idx / (CHAPTERS.length - 1);
    this.setTargetProgress(t);
  }

  startDampLoop() {
    if (this.destroyed || this.contextLost) return;
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

      let stillMoving = false;
      if (this.loopActive) {
        this.progressCurrent = THREE.MathUtils.damp(this.progressCurrent, this.progressTarget, 7.5, dt);
        this.applyRigAndCameraFromParams(this.progressCurrent, dt);

        const targetCam = this.sampleChapterValues(this.progressTarget);
        const diff =
          Math.abs(this.progressCurrent - this.progressTarget) +
          Math.abs(this.currentCam.thetaDeg - targetCam.thetaDeg) * 0.008 +
          Math.abs(this.state.hookDrop - targetCam.hookDrop) * 0.1 +
          Math.abs(this.state.jackDrop - targetCam.jackDrop) * 0.1;
        stillMoving = diff > 0.0025;
        if (!stillMoving) {
          this.progressCurrent = this.progressTarget;
          this.applyRigAndCameraFromParams(this.progressCurrent, 1);
          this.loopActive = false;
        }
      } else {
        this.updateAllLeaderLines(this.activeChapterIdx >= 0 ? this.activeChapterIdx : 0);
      }

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
    const height = Math.max(this.mount.clientHeight || 480, 260);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.applyRigAndCameraFromParams(this.progressCurrent, 1);
    this.requestRender();
  }

  dispose() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stopPendingFrame();
    if (this.boundResize) window.removeEventListener('resize', this.boundResize);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.disposables.geometries.forEach((g) => g.dispose());
    this.disposables.materials.forEach((m) => m.dispose());
    this.disposables.textures.forEach((t) => t.dispose());
    if (this.envRenderTarget) this.envRenderTarget.dispose();
    if (this.pmremGenerator) this.pmremGenerator.dispose();
    if (this.renderer) this.renderer.dispose();
  }
}

export function initFloorCraneShowcase() {
  const section = document.querySelector('#floor-crane-showcase');
  if (!section) return;

  const stage = section.querySelector('.sv-fc__stage');
  const mount = section.querySelector('#sv-fc-mount');
  const fallbackEl = section.querySelector('#sv-fc-fallback');
  const svgEl = section.querySelector('.sv-fc__leader-svg');
  const boxEls = Array.from(section.querySelectorAll('[data-fc-box]'));
  const leaderEls = Array.from(section.querySelectorAll('[data-fc-leader]'));

  if (!mount || !stage) return;

  const engine = new SVFloorCraneEngine({
    section,
    mount,
    svgEl,
    boxEls,
    leaderEls,
    fallbackEl
  });

  const ok = engine.init();
  if (!ok) return;

  boxEls.forEach((box, idx) => {
    box.addEventListener('click', () => {
      engine.jumpToChapter(idx);
    });
  });

  // Unpinned natural in-flow scroll scrub — zero collapsing, zero pin spacers
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const st = ScrollTrigger.create({
      trigger: stage,
      start: 'top 86%',
      end: 'bottom 18%',
      scrub: true,
      onUpdate: (self) => {
        engine.setTargetProgress(self.progress);
      }
    });

    return () => {
      st.kill();
    };
  });

  window.addEventListener('pagehide', () => engine.dispose(), { once: true });
}
