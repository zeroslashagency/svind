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
      // Fallback to lower flags
    }
  }
  return null;
}

function createGroovedSteelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#707985';
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 8) {
    ctx.fillStyle = '#9BA4B0';
    ctx.fillRect(0, y, 256, 4);
    ctx.fillStyle = '#383F48';
    ctx.fillRect(0, y + 4, 256, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBrushedMetalRoughnessTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#888888';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    const shade = 110 + ((y * 37) % 45);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(0, y, 256, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function createForgedHookMesh(steelMat, trackGeo) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.08, 0.28);
  shape.lineTo(0.08, 0.28);
  shape.lineTo(0.08, 0.04);
  shape.bezierCurveTo(0.3, -0.04, 0.34, -0.36, 0.03, -0.44);
  shape.bezierCurveTo(-0.24, -0.49, -0.34, -0.28, -0.23, -0.12);
  shape.lineTo(-0.14, -0.17);
  shape.bezierCurveTo(-0.21, -0.28, -0.11, -0.37, 0.03, -0.34);
  shape.bezierCurveTo(0.2, -0.29, 0.19, -0.08, -0.02, -0.02);
  shape.lineTo(-0.08, 0.04);
  shape.closePath();

  const geo = trackGeo(new THREE.ExtrudeGeometry(shape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.02,
    bevelSegments: 3
  }));
  geo.center();
  const mesh = new THREE.Mesh(geo, steelMat);
  return mesh;
}

function createGroovedSheave(radius, width, steelMat, darkMat, trackGeo) {
  const pts = [
    new THREE.Vector2(0.04, -width * 0.5),
    new THREE.Vector2(radius, -width * 0.5),
    new THREE.Vector2(radius * 0.84, -width * 0.16),
    new THREE.Vector2(radius * 0.84, width * 0.16),
    new THREE.Vector2(radius, width * 0.5),
    new THREE.Vector2(0.04, width * 0.5)
  ];
  const geo = trackGeo(new THREE.LatheGeometry(pts, 32));
  geo.rotateX(Math.PI / 2);

  const g = new THREE.Group();
  const rim = new THREE.Mesh(geo, steelMat);
  g.add(rim);

  const hub = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(radius * 0.36, radius * 0.36, width * 1.24, 20)),
    darkMat
  );
  hub.rotation.x = Math.PI / 2;
  g.add(hub);

  return g;
}

class SVScopeShowcaseEngine {
  constructor(section) {
    this.section = section;
    this.canvasLayer = section.querySelector('#sv-scope-canvas-layer');
    this.fallbackEl = section.querySelector('#sv-scope-fallback');
    this.colEls = Array.from(section.querySelectorAll('.sv-scope__col'));

    this.renderer = null;
    this.pmremGenerator = null;
    this.envRenderTarget = null;
    this.disposables = { geometries: [], materials: [], textures: [] };

    this.slots = [];
    this.hoverIndex = -1;
    this.selectedIndex = -1;
    this.inView = true;
    this.destroyed = false;
    this.contextLost = false;
    this.renderBusy = false;
    this.renderDirty = false;
    this.frameId = 0;
    this.lastTs = performance.now();
    this.idlePhase = 0;
    this.continuousRunning = false;
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

  addBox(parent, w, h, d, mat, x, y, z) {
    const mesh = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(w, h, d)), mat);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  init() {
    if (!this.canvasLayer || !this.colEls.length) return false;

    const renderer = createWebGLRendererSafely();
    if (!renderer) {
      if (this.fallbackEl) this.fallbackEl.hidden = false;
      return false;
    }

    this.renderer = renderer;
    const width = Math.max(this.section.clientWidth || 1280, 320);
    const height = Math.max(this.section.clientHeight || 680, 320);

    const scopeDprCap = window.innerWidth < 600 ? 1.5 : 2;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, scopeDprCap));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setScissorTest(true);

    this.canvasLayer.textContent = '';
    this.canvasLayer.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new RoomEnvironment();
    this.envRenderTarget = pmrem.fromScene(envScene, 0.04);
    envScene.dispose();
    this.pmremGenerator = pmrem;

    this.buildMaterials();
    this.buildSlots();
    this.bindEvents();
    this.measureViewports();

    if (!isSoftwareGl && typeof renderer.compile === 'function') {
      this.slots.forEach((slot) => renderer.compile(slot.scene, slot.camera));
    }

    this.requestRender();
    this.startLoopIfNeeded();
    return true;
  }

  buildMaterials() {
    const maxAniso = Math.min(this.renderer.capabilities.getMaxAnisotropy() || 4, 8);
    const grooveTex = this.trackTex(createGroovedSteelTexture());
    if (grooveTex) grooveTex.anisotropy = maxAniso;
    const brushedRoughTex = this.trackTex(createBrushedMetalRoughnessTexture());
    if (brushedRoughTex) brushedRoughTex.anisotropy = maxAniso;

    this.mats = {
      brushedSteel: this.trackMat(new THREE.MeshPhysicalMaterial({
        color: 0xb2bac6,
        roughness: 0.24,
        roughnessMap: brushedRoughTex || null,
        metalness: 0.92,
        anisotropy: 0.75
      })),
      structuralSteel: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0x5c6673,
        roughness: 0.48,
        metalness: 0.72
      })),
      forgedDark: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0x2a3038,
        roughness: 0.36,
        metalness: 0.86
      })),
      castIron: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0x1d2229,
        roughness: 0.72,
        metalness: 0.45
      })),
      chromeShaft: this.trackMat(new THREE.MeshPhysicalMaterial({
        color: 0xe3e8ef,
        roughness: 0.12,
        metalness: 0.96,
        clearcoat: 0.4
      })),
      groovedDrum: this.trackMat(new THREE.MeshStandardMaterial({
        color: 0x9fa8b5,
        map: grooveTex || null,
        roughness: 0.34,
        metalness: 0.88
      }))
    };
  }

  createSlotBase(camPos, lookTarget, modelBuilder) {
    const scene = new THREE.Scene();
    scene.environment = this.envRenderTarget.texture;
    scene.environmentIntensity = 0.95;

    const hemi = new THREE.HemisphereLight(0xf6f9ff, 0x454d58, 0.85);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff8ee, 2.2);
    key.position.set(5, 7, 6);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x8bc9f5, 1.1);
    rim.position.set(-6, 3, -5);
    scene.add(rim);

    const fill = new THREE.DirectionalLight(0xd2dce8, 0.75);
    fill.position.set(0, -4, 4);
    scene.add(fill);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    camera.position.set(camPos[0], camPos[1], camPos[2]);
    camera.lookAt(lookTarget[0], lookTarget[1], lookTarget[2]);

    const assembly = modelBuilder();
    scene.add(assembly);

    return {
      scene,
      camera,
      assembly,
      rimLight: rim,
      keyLight: key,
      baseCamPos: new THREE.Vector3(...camPos),
      lookTarget: new THREE.Vector3(...lookTarget),
      aspectScale: 1,
      hoverProgress: 0,
      baseRotY: assembly.rotation.y,
      baseRotX: assembly.rotation.x,
      rect: { x: 0, y: 0, width: 1, height: 1 },
      visible: false
    };
  }

  buildSlots() {
    // 01: Engineering & Design — Angled Twin-Girder EOT Bridge Corner & End-Carriage
    this.slots.push(this.createSlotBase([0.5, 1.8, 7.8], [0.0, 0.0, 0], () => {
      const g = new THREE.Group();

      // Main box girder cantilevered cleanly inside column
      const girder = new THREE.Group();
      this.addBox(girder, 2.7, 0.48, 0.28, this.mats.structuralSteel, 0.45, 0.08, 0);
      this.addBox(girder, 2.72, 0.05, 0.34, this.mats.forgedDark, 0.45, 0.34, 0);
      this.addBox(girder, 2.72, 0.05, 0.34, this.mats.forgedDark, 0.45, -0.18, 0);
      // Top crab rail
      this.addBox(girder, 2.65, 0.07, 0.08, this.mats.chromeShaft, 0.45, 0.39, 0);

      // Welded vertical web stiffener ribs
      for (let x = -0.6; x <= 1.5; x += 0.44) {
        this.addBox(girder, 0.045, 0.45, 0.32, this.mats.brushedSteel, x, 0.08, 0);
      }

      // End carriage saddle & double-flanged bogie wheels at inner tip
      const carriage = new THREE.Group();
      carriage.position.set(-0.85, -0.08, 0);
      this.addBox(carriage, 0.34, 0.36, 1.65, this.mats.castIron, 0, 0, 0);
      this.addBox(carriage, 0.38, 0.06, 1.68, this.mats.brushedSteel, 0, 0.2, 0);

      [-0.6, 0.6].forEach((wz) => {
        const wheel = new THREE.Group();
        wheel.position.set(0, -0.11, wz);
        const tread = new THREE.Mesh(
          this.trackGeo(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 24)),
          this.mats.chromeShaft
        );
        tread.rotation.z = Math.PI / 2;
        wheel.add(tread);

        [-0.06, 0.06].forEach((fx) => {
          const flange = new THREE.Mesh(
            this.trackGeo(new THREE.CylinderGeometry(0.185, 0.185, 0.02, 24)),
            this.mats.forgedDark
          );
          flange.rotation.z = Math.PI / 2;
          flange.position.x = fx;
          wheel.add(flange);
        });
        carriage.add(wheel);
      });

      // Rail safety buffer cylinders
      [-0.88, 0.88].forEach((bz) => {
        const buf = new THREE.Mesh(
          this.trackGeo(new THREE.CylinderGeometry(0.065, 0.075, 0.13, 16)),
          this.mats.forgedDark
        );
        buf.rotation.x = Math.PI / 2;
        buf.position.set(0, 0, bz);
        carriage.add(buf);
      });

      girder.add(carriage);
      g.add(girder);
      g.rotation.set(0.28, -0.62, 0.32);
      g.position.set(0.18, 0.06, 0);
      g.scale.setScalar(0.68);
      return g;
    }));

    // 02: In-House Fabrication — Heavy Crab Trolley & Grooved Hoist Drum
    this.slots.push(this.createSlotBase([0.3, 2.2, 7.6], [0.0, 0.0, 0], () => {
      const g = new THREE.Group();

      // Welded steel trolley frame
      this.addBox(g, 2.1, 0.16, 1.65, this.mats.structuralSteel, 0, 0, 0);
      [-0.76, 0.76].forEach((fz) => {
        this.addBox(g, 2.12, 0.24, 0.1, this.mats.forgedDark, 0, 0.1, fz);
      });
      [-0.96, 0.96].forEach((fx) => {
        this.addBox(g, 0.12, 0.24, 1.65, this.mats.forgedDark, fx, 0.1, 0);
      });

      // 4 Rail bogie wheels with double flanges
      [-0.76, 0.76].forEach((wx) => {
        [-0.82, 0.82].forEach((wz) => {
          const w = new THREE.Mesh(
            this.trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 0.09, 22)),
            this.mats.chromeShaft
          );
          w.rotation.x = Math.PI / 2;
          w.position.set(wx, -0.09, wz);
          g.add(w);
        });
      });

      // Grooved steel rope drum + end cheek plates
      const drum = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.32, 0.32, 1.12, 28)),
        this.mats.groovedDrum
      );
      drum.rotation.z = Math.PI / 2;
      drum.position.set(-0.16, 0.4, 0);
      g.add(drum);

      [-0.73, 0.41].forEach((dx) => {
        const flange = new THREE.Mesh(
          this.trackGeo(new THREE.CylinderGeometry(0.4, 0.4, 0.036, 28)),
          this.mats.brushedSteel
        );
        flange.rotation.z = Math.PI / 2;
        flange.position.set(dx, 0.4, 0);
        g.add(flange);
      });

      // Helical gearbox housing & finned motor
      this.addBox(g, 0.44, 0.54, 0.56, this.mats.castIron, 0.7, 0.38, 0);
      const motor = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.21, 0.21, 0.6, 22)),
        this.mats.structuralSteel
      );
      motor.rotation.z = Math.PI / 2;
      motor.position.set(0.75, 0.38, 0.5);
      g.add(motor);

      // Machined shaft coupling
      const shaft = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.095, 0.095, 0.32, 18)),
        this.mats.chromeShaft
      );
      shaft.rotation.z = Math.PI / 2;
      shaft.position.set(0.5, 0.4, 0);
      g.add(shaft);

      g.rotation.set(0.24, -0.7, -0.06);
      g.position.set(0.16, -0.06, 0);
      g.scale.setScalar(0.68);
      return g;
    }));

    // 03: Proof & FAT Testing — Multi-Sheave Snatch Block & Forged Safety Hook
    this.slots.push(this.createSlotBase([0.0, 0.45, 7.2], [0.0, -0.08, 0], () => {
      const g = new THREE.Group();

      // Short, crisp upper wire rope leads (contained well inside stage)
      [
        [-0.2, -0.12],
        [0.2, -0.12],
        [-0.2, 0.12],
        [0.2, 0.12]
      ].forEach(([rx, rz]) => {
        const rope = new THREE.Mesh(
          this.trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.85, 10)),
          this.mats.forgedDark
        );
        rope.position.set(rx, 0.75, rz);
        g.add(rope);
      });

      // Heavy chamfered steel cheek housing
      this.addBox(g, 0.82, 0.78, 0.52, this.mats.castIron, 0, 0.22, 0);
      [-0.29, 0.29].forEach((cz) => {
        this.addBox(g, 0.88, 0.58, 0.055, this.mats.brushedSteel, 0, 0.22, cz);
      });

      // Twin grooved steel sheaves inside housing
      [-0.13, 0.13].forEach((sz) => {
        const sheave = createGroovedSheave(0.3, 0.1, this.mats.chromeShaft, this.mats.forgedDark, (geo) => this.trackGeo(geo));
        sheave.position.set(0, 0.22, sz);
        g.add(sheave);
      });

      // Center pin & retainer lock plates
      const pin = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.075, 0.075, 0.68, 18)),
        this.mats.chromeShaft
      );
      pin.rotation.x = Math.PI / 2;
      pin.position.set(0, 0.22, 0);
      g.add(pin);

      // Crosshead beam & thrust-bearing swivel collar
      this.addBox(g, 0.42, 0.16, 0.42, this.mats.forgedDark, 0, -0.25, 0);
      const collar = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.13, 0.15, 0.18, 20)),
        this.mats.chromeShaft
      );
      collar.position.set(0, -0.41, 0);
      g.add(collar);

      // Forged solid-steel crane hook
      const hook = createForgedHookMesh(this.mats.forgedDark, (geo) => this.trackGeo(geo));
      hook.position.set(0, -0.73, 0);
      g.add(hook);

      // Calibrated test shackle bar suspended cleanly
      const shackle = new THREE.Mesh(
        this.trackGeo(new THREE.TorusGeometry(0.2, 0.04, 14, 28)),
        this.mats.brushedSteel
      );
      shackle.position.set(0.02, -0.99, 0);
      shackle.rotation.y = Math.PI * 0.45;
      g.add(shackle);

      g.rotation.set(0.12, -0.52, 0.04);
      g.position.set(0.14, 0.04, 0);
      g.scale.setScalar(0.68);
      return g;
    }));

    // 04: Service, AMC & Spares — Helical Gearbox, Finned Motor & Thruster Brake
    this.slots.push(this.createSlotBase([0.2, 1.25, 7.6], [0.0, 0.0, 0], () => {
      const g = new THREE.Group();

      // Main helical gearbox ribbed casing
      this.addBox(g, 0.82, 0.88, 0.7, this.mats.castIron, 0.48, 0.06, 0);
      [-0.36, 0, 0.36].forEach((ry) => {
        this.addBox(g, 0.88, 0.055, 0.76, this.mats.structuralSteel, 0.48, ry, 0);
      });

      // Finned drive motor barrel extending right
      const motor = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.34, 0.34, 1.0, 24)),
        this.mats.forgedDark
      );
      motor.rotation.z = Math.PI / 2;
      motor.position.set(1.18, 0.15, -0.18);
      g.add(motor);

      for (let i = 0; i < 6; i += 1) {
        const fin = new THREE.Mesh(
          this.trackGeo(new THREE.CylinderGeometry(0.37, 0.37, 0.028, 24)),
          this.mats.brushedSteel
        );
        fin.rotation.z = Math.PI / 2;
        fin.position.set(0.84 + i * 0.12, 0.15, -0.18);
        g.add(fin);
      }

      // Cantilevered splined steel drive shaft + brake drum + flanged crane wheel
      const shaft = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.1, 0.1, 1.85, 22)),
        this.mats.chromeShaft
      );
      shaft.rotation.z = Math.PI / 2;
      shaft.position.set(-0.3, -0.04, 0.1);
      g.add(shaft);

      // Machined brake drum & dual caliper shoes
      const brakeDrum = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.3, 0.3, 0.25, 28)),
        this.mats.brushedSteel
      );
      brakeDrum.rotation.z = Math.PI / 2;
      brakeDrum.position.set(-0.14, -0.04, 0.1);
      g.add(brakeDrum);

      [-0.32, 0.32].forEach((sz) => {
        this.addBox(g, 0.22, 0.42, 0.075, this.mats.castIron, -0.14, -0.04, 0.1 + sz);
      });

      // Double-flanged OEM forged crane travel wheel at tip
      const oemWheel = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.4, 0.4, 0.2, 32)),
        this.mats.structuralSteel
      );
      oemWheel.rotation.z = Math.PI / 2;
      oemWheel.position.set(-0.85, -0.04, 0.1);
      g.add(oemWheel);

      [-0.115, 0.115].forEach((fx) => {
        const flange = new THREE.Mesh(
          this.trackGeo(new THREE.CylinderGeometry(0.48, 0.48, 0.036, 32)),
          this.mats.chromeShaft
        );
        flange.rotation.z = Math.PI / 2;
        flange.position.set(-0.85 + fx, -0.04, 0.1);
        g.add(flange);
      });

      g.rotation.set(0.22, -0.52, -0.28);
      g.position.set(0.18, 0.02, 0);
      g.scale.setScalar(0.68);
      return g;
    }));
  }

  measureViewports() {
    if (!this.renderer || !this.canvasLayer) return;

    const sectionRect = this.section.getBoundingClientRect();
    const width = Math.max(Math.round(sectionRect.width), 320);
    const height = Math.max(Math.round(sectionRect.height), 320);

    const scopeDprCap = window.innerWidth < 600 ? 1.5 : 2;
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, scopeDprCap));
    this.renderer.setSize(width, height, false);

    const isPhone = window.innerWidth < 600;
    this.colEls.forEach((col, i) => {
      const slot = this.slots[i];
      if (!slot) return;
      const r = col.getBoundingClientRect();
      const x = Math.round(r.left - sectionRect.left);
      // WebGL viewport origin is bottom-left
      const y = Math.round(sectionRect.bottom - r.bottom);
      const w = Math.max(Math.round(r.width), 1);
      const h = Math.max(Math.round(r.height), 1);

      const aspect = w / h;
      slot.rect = { x, y, width: w, height: h };
      slot.visible = w > 4 && h > 4;
      slot.aspectScale = aspect < 0.72
        ? Math.min(1.45, 0.72 / Math.max(aspect, 0.36))
        : (isPhone ? 1.18 : 1);
      slot.camera.aspect = aspect;
      slot.camera.updateProjectionMatrix();
    });
  }

  setHoverIndex(idx) {
    if (this.hoverIndex === idx) return;
    this.hoverIndex = idx;
    this.requestRender();
    this.startLoopIfNeeded();
  }

  toggleSelectedIndex(idx) {
    this.selectedIndex = this.selectedIndex === idx ? -1 : idx;
    this.colEls.forEach((col, i) => {
      const active = i === this.selectedIndex;
      col.classList.toggle('is-active', active);
      col.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    this.requestRender();
    this.startLoopIfNeeded();
  }

  bindEvents() {
    this._onResize = () => {
      this.measureViewports();
      this.requestRender();
    };
    window.addEventListener('resize', this._onResize, { passive: true });

    if ('ResizeObserver' in window) {
      this._ro = new ResizeObserver(() => {
        this.measureViewports();
        this.requestRender();
      });
      this._ro.observe(this.section);
    }

    if ('IntersectionObserver' in window) {
      this._io = new IntersectionObserver((entries) => {
        this.inView = Boolean(entries[0]?.isIntersecting);
        if (this.inView) {
          this.requestRender();
          this.startLoopIfNeeded();
        } else {
          this.stopLoop();
        }
      }, { rootMargin: '120px 0px', threshold: 0.01 });
      this._io.observe(this.section);
    }

    this.colEls.forEach((col, idx) => {
      col.addEventListener('pointerenter', () => this.setHoverIndex(idx));
      col.addEventListener('pointerleave', () => {
        if (this.hoverIndex === idx) this.setHoverIndex(-1);
      });
      col.addEventListener('focusin', () => this.setHoverIndex(idx));
      col.addEventListener('focusout', () => {
        if (this.hoverIndex === idx) this.setHoverIndex(-1);
      });
      col.addEventListener('click', (ev) => {
        // On touch or intentional click, toggle persistent active state
        if (ev.pointerType === 'touch' || window.innerWidth < 1024) {
          this.toggleSelectedIndex(idx);
        }
      });
      col.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          this.toggleSelectedIndex(idx);
        }
      });
    });

    this.renderer.domElement.addEventListener('webglcontextlost', (ev) => {
      ev.preventDefault();
      this.contextLost = true;
      this.stopLoop();
      if (this.fallbackEl) this.fallbackEl.hidden = false;
    });

    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      this.contextLost = false;
      if (this.fallbackEl) this.fallbackEl.hidden = true;
      this.requestRender();
      this.startLoopIfNeeded();
    });
  }

  stepScene(dt) {
    const reduced = prefersReducedMotion();
    if (!reduced) {
      this.idlePhase += dt * 0.55;
    }

    let anyDamping = false;
    this.slots.forEach((slot, i) => {
      const isFocused = i === this.hoverIndex || i === this.selectedIndex;
      const targetHover = isFocused ? 1 : 0;

      if (reduced) {
        slot.hoverProgress = targetHover;
      } else {
        slot.hoverProgress = THREE.MathUtils.damp(slot.hoverProgress, targetHover, 6.5, dt);
        if (Math.abs(slot.hoverProgress - targetHover) > 0.004) {
          anyDamping = true;
        }
      }

      const h = slot.hoverProgress;
      const floatRot = reduced ? 0 : Math.sin(this.idlePhase + i * 1.35) * 0.055;
      slot.assembly.rotation.y = slot.baseRotY + floatRot - h * 0.18;
      slot.assembly.rotation.x = slot.baseRotX + h * 0.06;

      // Subtle camera zoom & rim-light crispness when column turns dark charcoal
      const s = slot.aspectScale || 1;
      slot.camera.position.set(
        slot.baseCamPos.x * s - h * 0.28,
        slot.baseCamPos.y * s - h * 0.08,
        slot.baseCamPos.z * s - h * 0.55
      );
      slot.camera.lookAt(slot.lookTarget);

      slot.rimLight.intensity = 1.1 + h * 1.15;
      slot.keyLight.intensity = 2.2 + h * 0.35;
    });

    return anyDamping || (!reduced && this.inView && !isSoftwareGl);
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

  startLoopIfNeeded() {
    if (this.destroyed || this.contextLost || this.continuousRunning || !this.inView) return;
    this.continuousRunning = true;
    this.lastTs = performance.now();
    this.requestRender();
  }

  stopLoop() {
    this.continuousRunning = false;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.renderBusy = false;
    this.renderDirty = false;
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

      const dt = Math.min(Math.max((now - this.lastTs) / 1000, 0.004), 0.06);
      this.lastTs = now;

      const keepGoing = this.stepScene(dt);

      if (this.inView) {
        this.renderer.setScissorTest(false);
        this.renderer.clear();
        this.renderer.setScissorTest(true);

        this.slots.forEach((slot) => {
          if (!slot.visible) return;
          const { x, y, width, height } = slot.rect;
          this.renderer.setViewport(x, y, width, height);
          this.renderer.setScissor(x, y, width, height);
          this.renderer.render(slot.scene, slot.camera);
        });
      }

      const done = () => {
        this.renderBusy = false;
        if (this.renderDirty || keepGoing) {
          this.requestRender();
        } else {
          this.continuousRunning = false;
        }
      };

      if (isSoftwareGl) {
        this.afterDraw(done);
      } else {
        done();
      }
    });
  }

  dispose() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stopLoop();
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this._ro) this._ro.disconnect();
    if (this._io) this._io.disconnect();
    this.disposables.geometries.forEach((g) => g.dispose());
    this.disposables.materials.forEach((m) => m.dispose());
    this.disposables.textures.forEach((t) => t.dispose());
    if (this.envRenderTarget) this.envRenderTarget.dispose();
    if (this.pmremGenerator) this.pmremGenerator.dispose();
    if (this.renderer) this.renderer.dispose();
  }
}

export function initScopeShowcase() {
  const section = document.querySelector('#engineering-scope');
  if (!section) return null;

  const engine = new SVScopeShowcaseEngine(section);
  engine.init();
  return engine;
}
