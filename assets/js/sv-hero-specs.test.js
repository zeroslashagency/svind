import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FLOOR_Y,
  GANTRY_DIMS,
  LETTER_SPECS,
  computeFestoonGeometryData,
  computeDinHookProfile
} from './sv-hero-specs.js';

test('letter specs cover S V I N D left-to-right with rivets and clean floor clearance', () => {
  assert.equal(
    LETTER_SPECS.map((s) => s.char).join(''),
    'SVIND'
  );

  for (let i = 1; i < LETTER_SPECS.length; i += 1) {
    assert.ok(
      LETTER_SPECS[i].x > LETTER_SPECS[i - 1].x,
      `Expected letter ${LETTER_SPECS[i].char} to sit right of ${LETTER_SPECS[i - 1].char}`
    );
  }

  for (const spec of LETTER_SPECS) {
    assert.ok(spec.rivets.length >= 6, `Letter ${spec.char} should have >= 6 physical rivets`);
    const lowestExtent = spec.y - 1.24;
    assert.ok(
      lowestExtent > FLOOR_Y + 0.14,
      `Letter ${spec.char} (${lowestExtent}) must hover cleanly above concrete floor (${FLOOR_Y})`
    );
  }
});

test('gantry dimensions keep hook cleanly between girder underside and central I arch', () => {
  const iSpec = LETTER_SPECS.find((s) => s.char === 'I');
  assert.ok(iSpec);
  const iTopY = iSpec.y + 1.12;
  const hookLowestY = GANTRY_DIMS.sheaveCenterY - 0.14 - 0.37;
  assert.ok(
    hookLowestY > iTopY + 0.05,
    `Hook tip (${hookLowestY.toFixed(2)}) must clear top of letter I (${iTopY.toFixed(2)})`
  );
  assert.ok(
    GANTRY_DIMS.girderY > GANTRY_DIMS.columnTopY,
    'Bridge girder must rest above column capital height'
  );
});

test('festoon curve anchors flush to railY at clamp carriers and drapes smoothly downward', () => {
  const { points, clampXs } = computeFestoonGeometryData({
    xMin: -4.4,
    xMax: 4.4,
    railY: 1.98,
    spanCount: 8,
    sagDepth: 0.16,
    stepsPerSpan: 8
  });
  assert.equal(clampXs.length, 9);
  assert.equal(points.length, 65);
  assert.equal(points[0].y, 1.98);
  assert.equal(points[8].y, 1.98);
  assert.equal(points[points.length - 1].y, 1.98);
  assert.ok(points[4].y < 1.98 && points[4].y >= 1.81);
});

test('forged DIN hook contour has monotonic shank top and rounded throat clearance', () => {
  const pts = computeDinHookProfile(1);
  assert.ok(pts.length >= 16);
  // Top shank symmetrical around X=0
  assert.equal(pts[0][0], -pts[1][0]);
  assert.equal(pts[0][1], 0);
  // Lowest bowl point sits well below shank
  const minY = Math.min(...pts.map(([, y]) => y));
  assert.ok(minY < -0.35);
});
