import * as THREE from 'three';

/**
 * Procedurally generates clean, realistic modern architectural landscaping
 * surrounding the container home:
 * - Lush manicured lawn with organic boundary
 * - Crushed basalt / river rock drainage trench bordering the container foundation
 * - Honed thermal bluestone paver walkway leading to the front porch steps
 * - Specimen architectural trees (Paper Birch and Crimson Japanese Maple)
 * - Low-profile modern charcoal pathway bollard lights
 */
export function buildLandscapingGreenery(
  houseLengthFt: number,
  houseWidthFt: number,
  houseElevationFt: number,
  deckWidthFt: number = 0,
  deckDepthFt: number = 0
): THREE.Group {
  const landscapingGroup = new THREE.Group();
  landscapingGroup.name = 'landscaping-greenery';

  // -------------------------------------------------------------
  // 1. MATERIALS PALETTE (Natural, refined, architectural)
  // -------------------------------------------------------------
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x244a25, // Rich deep turf green
    roughness: 0.9,
    metalness: 0.02,
  });

  const riverRockBedMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Basalt & grey river pebble bed
    roughness: 0.85,
  });

  const pebbleMat = new THREE.MeshStandardMaterial({
    color: 0x64748b, // Polished slate river pebbles
    roughness: 0.6,
  });

  const paverMat = new THREE.MeshStandardMaterial({
    color: 0x71717a, // Honed thermal bluestone paver
    roughness: 0.65,
    metalness: 0.08,
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Charcoal powder-coated aluminum
    roughness: 0.4,
    metalness: 0.8,
  });

  const foliageDarkMat = new THREE.MeshStandardMaterial({
    color: 0x143417, // Deep pine evergreen
    roughness: 0.85,
  });

  const foliageMidMat = new THREE.MeshStandardMaterial({
    color: 0x245e28, // Lush summer foliage
    roughness: 0.8,
  });

  const foliageLightMat = new THREE.MeshStandardMaterial({
    color: 0x4d9643, // Fresh spring leaf highlight
    roughness: 0.75,
  });

  const japaneseMapleMat = new THREE.MeshStandardMaterial({
    color: 0x7f1d1d, // Deep crimson burgundy Japanese maple leaf
    roughness: 0.78,
  });

  const birchTrunkMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9, // Creamy paper birch bark
    roughness: 0.65,
  });

  const pineTrunkMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723, // Deep textured pine bark
    roughness: 0.9,
  });

  const warmGlowMat = new THREE.MeshBasicMaterial({
    color: 0xffedd5, // 2700K warm soft pathway glow
  });

  const halfL = houseLengthFt / 2;
  const halfW = houseWidthFt / 2;

  // -------------------------------------------------------------
  // 2. LUSH LANDSCAPED LAWN BED
  // -------------------------------------------------------------
  const lawnMargin = 20;
  const lawnW = houseLengthFt + lawnMargin * 2;
  const lawnD = houseWidthFt + lawnMargin * 2;
  const lawnGeo = new THREE.BoxGeometry(lawnW, 0.12, lawnD);
  const lawnMesh = new THREE.Mesh(lawnGeo, grassMat);
  lawnMesh.position.set(0, 0.04, 0);
  lawnMesh.receiveShadow = true;
  landscapingGroup.add(lawnMesh);

  // -------------------------------------------------------------
  // 3. ARCHITECTURAL RIVER PEBBLE FOUNDATION TRENCH
  // -------------------------------------------------------------
  // 2ft wide crushed basalt border hugging the container foundation
  const trenchW = houseLengthFt + 3.2;
  const trenchD = houseWidthFt + 3.2;
  const trenchGeo = new THREE.BoxGeometry(trenchW, 0.14, trenchD);
  const trenchMesh = new THREE.Mesh(trenchGeo, riverRockBedMat);
  trenchMesh.position.set(0, 0.06, 0);
  trenchMesh.receiveShadow = true;
  landscapingGroup.add(trenchMesh);

  // Subtle river rocks along foundation edge
  const rockGeo = new THREE.DodecahedronGeometry(0.28, 0);
  rockGeo.scale(1.3, 0.6, 1.1);
  for (let r = 0; r < 14; r++) {
    const angle = (r / 14) * Math.PI * 2;
    const rx = (halfL + 1.1) * Math.cos(angle);
    const rz = (halfW + 1.1) * Math.sin(angle);
    const rock = new THREE.Mesh(rockGeo, pebbleMat);
    rock.position.set(rx, 0.11, rz);
    rock.rotation.set(r * 0.4, r * 0.7, 0);
    rock.scale.setScalar(0.7 + (r % 2) * 0.3);
    rock.castShadow = true;
    landscapingGroup.add(rock);
  }

  // -------------------------------------------------------------
  // 4. HONED BLUESTONE PAVER WALKWAY LEADING TO FRONT PORCH
  // -------------------------------------------------------------
  const walkwayStartX = halfL * 0.35;
  const paverCount = 7;
  for (let i = 0; i < paverCount; i++) {
    const paverZ = halfW + (deckDepthFt > 0 ? deckDepthFt : 2.0) + 1.5 + i * 2.3;
    const paverGeo = new THREE.BoxGeometry(3.6, 0.1, 1.8);
    const paver = new THREE.Mesh(paverGeo, paverMat);
    const staggerX = walkwayStartX + (i % 2 === 0 ? -0.2 : 0.2);
    paver.position.set(staggerX, 0.12, paverZ);
    paver.receiveShadow = true;
    paver.castShadow = true;
    landscapingGroup.add(paver);
  }

  // -------------------------------------------------------------
  // 5. ARCHITECTURAL SPECIMEN TREES
  // -------------------------------------------------------------
  // A. Crimson Japanese Maple (Framing the front garden)
  const mapleGroup = new THREE.Group();
  mapleGroup.position.set(walkwayStartX + 7.5, 0.08, halfW + 6.0);

  const trunkH = 3.6;
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.3, trunkH, 8);
  const trunk1 = new THREE.Mesh(trunkGeo, pineTrunkMat);
  trunk1.position.set(0, trunkH / 2, 0);
  trunk1.rotation.z = -0.15;
  trunk1.castShadow = true;
  mapleGroup.add(trunk1);

  const trunk2 = new THREE.Mesh(trunkGeo, pineTrunkMat);
  trunk2.position.set(0.25, trunkH / 2, 0.15);
  trunk2.rotation.z = 0.2;
  trunk2.castShadow = true;
  mapleGroup.add(trunk2);

  // Crimson canopy domes
  const mapleDomes = [
    [0, trunkH + 2.0, 0, 2.8],
    [1.4, trunkH + 1.5, 0.8, 2.0],
    [-1.5, trunkH + 1.7, -0.6, 1.9],
  ];
  mapleDomes.forEach(([cx, cy, cz, rad]) => {
    const domeGeo = new THREE.DodecahedronGeometry(rad as number, 1);
    domeGeo.scale(1.3, 0.75, 1.2);
    const foliage = new THREE.Mesh(domeGeo, japaneseMapleMat);
    foliage.position.set(cx as number, cy as number, cz as number);
    foliage.castShadow = true;
    mapleGroup.add(foliage);
  });
  landscapingGroup.add(mapleGroup);

  // B. Tall Paper Birch (Rear perimeter accent)
  const birchGroup = new THREE.Group();
  birchGroup.position.set(-halfL - 10, 0.08, -halfW - 6);

  const bTrunkH = 7.5;
  const bTrunkGeo = new THREE.CylinderGeometry(0.25, 0.38, bTrunkH, 8);
  const bTrunk = new THREE.Mesh(bTrunkGeo, birchTrunkMat);
  bTrunk.position.y = bTrunkH / 2;
  bTrunk.castShadow = true;
  birchGroup.add(bTrunk);

  const bDome1 = new THREE.Mesh(new THREE.DodecahedronGeometry(4.0, 1), foliageMidMat);
  bDome1.position.y = bTrunkH + 2.5;
  bDome1.castShadow = true;
  birchGroup.add(bDome1);

  const bDome2 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8, 1), foliageLightMat);
  bDome2.position.set(1.5, bTrunkH + 3.8, 0.8);
  bDome2.castShadow = true;
  birchGroup.add(bDome2);

  landscapingGroup.add(birchGroup);

  // C. Evergreen Pine (Right perimeter)
  const pineGroup = new THREE.Group();
  pineGroup.position.set(halfL + 11, 0.08, -halfW - 6);

  const pTrunkH = 6.0;
  const pTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, pTrunkH, 8), pineTrunkMat);
  pTrunk.position.y = pTrunkH / 2;
  pTrunk.castShadow = true;
  pineGroup.add(pTrunk);

  for (let t = 0; t < 3; t++) {
    const tierR = 3.2 - t * 0.7;
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(tierR, 3.5, 8),
      t % 2 === 0 ? foliageDarkMat : foliageMidMat
    );
    cone.position.y = pTrunkH * 0.6 + t * 2.2;
    cone.castShadow = true;
    pineGroup.add(cone);
  }
  landscapingGroup.add(pineGroup);

  // -------------------------------------------------------------
  // 6. MINIMALIST PATHWAY BOLLARD LIGHTS
  // -------------------------------------------------------------
  [-1.6, 1.6].forEach((offset) => {
    for (let b = 0; b < 3; b++) {
      const bz = halfW + (deckDepthFt > 0 ? deckDepthFt : 2.0) + 2.0 + b * 4.2;
      const bx = walkwayStartX + offset * 2.4;
      const bollardGroup = new THREE.Group();
      bollardGroup.position.set(bx, 0.08, bz);

      // Matte Black Metal Post
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), darkMetalMat);
      post.position.y = 0.7;
      post.castShadow = true;
      bollardGroup.add(post);

      // Recessed Warm LED Fixture Head
      const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.2, 8), warmGlowMat);
      glow.position.y = 1.25;
      bollardGroup.add(glow);

      landscapingGroup.add(bollardGroup);
    }
  });

  return landscapingGroup;
}
