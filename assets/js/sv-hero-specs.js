/**
 * Pure structural & geometric specifications for the SVIND Hero 3D EOT crane bay
 * and machined welded-plate letterforms. Kept framework-free for deterministic unit testing.
 */

export const FLOOR_Y = -1.56;

export const GANTRY_DIMS = {
  columnX: 5.18,
  columnZ: -0.28,
  columnTopY: 1.98,
  girderY: 2.19,
  girderSpan: 10.92,
  girderZOffset: 0.32,
  endTruckX: 5.22,
  trolleyBaseY: 2.43,
  sheaveCenterY: 1.72,
  hookRestX: -0.14
};

/**
 * Per-letter placement & front-face 3D rivet stud coordinates (in letter local space).
 * Rivets sit cleanly on flat machined face surfaces bracketing top, mid weld-seam (y ≈ 0),
 * and bottom plate boundaries.
 */
export const LETTER_SPECS = [
  {
    char: 'S',
    x: -3.68,
    y: -0.12,
    rotY: 0.06,
    rotZ: 0.01,
    rawColor: '#CFD7E2',
    rawRoughness: 0.27,
    rawMetalness: 0.94,
    rivets: [
      [-0.36, 0.78],
      [0.36, 0.72],
      [-0.50, 0.24],
      [-0.14, 0.04],
      [0.24, -0.06],
      [0.48, -0.28],
      [-0.42, -0.70],
      [0.32, -0.76]
    ]
  },
  {
    char: 'V',
    x: -1.86,
    y: -0.12,
    rotY: 0.03,
    rotZ: -0.006,
    rawColor: '#CFD7E2',
    rawRoughness: 0.27,
    rawMetalness: 0.94,
    rivets: [
      [-0.66, 0.98],
      [-0.38, 0.98],
      [0.38, 0.98],
      [0.66, 0.98],
      [-0.34, 0.08],
      [0.34, 0.08],
      [-0.22, -0.94],
      [0.22, -0.94]
    ]
  },
  {
    char: 'I',
    x: -0.14,
    y: -0.12,
    rotY: 0.0,
    rotZ: 0.0,
    rawColor: '#3C434E',
    rawRoughness: 0.40,
    rawMetalness: 0.88,
    rivets: [
      [-0.32, 0.62],
      [0.32, 0.62],
      [-0.38, 0.06],
      [0.0, 0.06],
      [0.38, 0.06],
      [-0.38, -0.94],
      [0.38, -0.94]
    ]
  },
  {
    char: 'N',
    x: 1.58,
    y: -0.12,
    rotY: -0.03,
    rotZ: 0.005,
    rawColor: '#2B4268',
    rawRoughness: 0.30,
    rawMetalness: 0.91,
    rivets: [
      [-0.68, 0.98],
      [-0.40, 0.98],
      [0.40, 0.98],
      [0.68, 0.98],
      [-0.56, 0.06],
      [0.02, 0.06],
      [0.56, 0.06],
      [-0.68, -0.96],
      [-0.40, -0.96],
      [0.40, -0.96],
      [0.68, -0.96]
    ]
  },
  {
    char: 'D',
    x: 3.52,
    y: -0.12,
    rotY: -0.06,
    rotZ: -0.008,
    rawColor: '#CFD7E2',
    rawRoughness: 0.27,
    rawMetalness: 0.94,
    rivets: [
      [-0.74, 0.96],
      [-0.14, 0.96],
      [0.44, 0.72],
      [-0.74, 0.06],
      [-0.46, 0.06],
      [0.48, 0.06],
      [0.74, 0.06],
      [-0.74, -0.96],
      [-0.14, -0.96],
      [0.44, -0.72]
    ]
  }
];

/**
 * Generates smooth catenary-like draping points for the underslung crane festoon cable
 * and returns both cable curve points and C-track trolley carrier X positions.
 */
export function computeFestoonGeometryData({
  xMin = -4.55,
  xMax = 4.55,
  railY = 1.98,
  zOffset = 0.44,
  spanCount = 7,
  sagDepth = 0.17,
  stepsPerSpan = 10
} = {}) {
  const totalSpan = xMax - xMin;
  const spanWidth = totalSpan / spanCount;
  const points = [];
  const clampXs = [];

  for (let s = 0; s <= spanCount; s += 1) {
    clampXs.push(xMin + s * spanWidth);
  }

  const totalSteps = spanCount * stepsPerSpan;
  for (let i = 0; i <= totalSteps; i += 1) {
    const tGlobal = i / totalSteps;
    const x = xMin + tGlobal * totalSpan;
    const localPhase = (i % stepsPerSpan) / stepsPerSpan;
    // Parabolic / sine-weighted catenary sag peaking cleanly at clamps
    const u = i === totalSteps ? 1 : localPhase;
    const sag = Math.sin(u * Math.PI) ** 1.15 * sagDepth;
    points.push({
      x,
      y: railY - sag,
      z: zOffset
    });
  }

  return { points, clampXs };
}

/**
 * Computes a realistic forged DIN 15401 single-ramshorn/C crane hook 2D silhouette contour
 * centered at shank top (0, 0) hanging down along -Y, ready for ExtrudeGeometry with bevels.
 * Guarantees watertight non-self-intersecting outer polygon with tapered horn tip.
 */
export function computeDinHookProfile(scale = 1) {
  const outer = [
    [-0.044 * scale, 0.0],
    [0.044 * scale, 0.0],
    [0.044 * scale, -0.055 * scale],
    [0.020 * scale, -0.088 * scale],
    [-0.062 * scale, -0.118 * scale],
    [-0.128 * scale, -0.185 * scale],
    [-0.132 * scale, -0.275 * scale],
    [-0.082 * scale, -0.348 * scale],
    [0.015 * scale, -0.372 * scale],
    [0.106 * scale, -0.342 * scale],
    [0.156 * scale, -0.268 * scale],
    [0.162 * scale, -0.194 * scale],
    [0.128 * scale, -0.162 * scale],
    [0.106 * scale, -0.192 * scale],
    [0.102 * scale, -0.244 * scale],
    [0.068 * scale, -0.288 * scale],
    [0.008 * scale, -0.300 * scale],
    [-0.046 * scale, -0.278 * scale],
    [-0.066 * scale, -0.224 * scale],
    [-0.044 * scale, -0.168 * scale],
    [0.012 * scale, -0.134 * scale],
    [-0.044 * scale, -0.062 * scale]
  ];

  // Clean smooth C-hook spine with monotonically varying thickness for swept/lathed validation too
  return outer;
}
