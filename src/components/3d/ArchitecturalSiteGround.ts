import * as THREE from 'three';

/**
 * Procedurally generates a photorealistic architectural presentation base / model floor.
 * Completely free of grids, graph lines, or wireframes.
 * Features:
 * - Architectural display plinth / beveled presentation base
 * - Manicured estate lawn with realistic tone and soft matte finish
 * - Modern bluestone / travertine architectural paver walkway to front door
 * - Wrap-around terrace apron and stone foundation reveal
 * - Architectural perimeter planter curbs
 */
export function buildArchitecturalModelFloor(
  lotWidthFt: number = 80,
  lotDepthFt: number = 100,
  houseLengthFt: number = 40,
  houseWidthFt: number = 16,
  houseOffsetX: number = 0,
  houseOffsetZ: number = 0
): THREE.Group {
  const floorGroup = new THREE.Group();
  floorGroup.name = 'architectural-model-floor';

  const baseW = Math.max(lotWidthFt, houseLengthFt + 30);
  const baseD = Math.max(lotDepthFt, houseWidthFt + 30);
  const plinthHeight = 0.6; // 6-inch architectural model plinth

  // 1. Generate High-Res Procedural Landscape Textures (Grass, Pavers, Plinth Stone)
  const grassTexture = createManicuredLawnTexture();
  const paverTexture = createArchitecturalPaverTexture();

  // Materials
  const grassMat = new THREE.MeshStandardMaterial({
    map: grassTexture,
    roughness: 0.85,
    metalness: 0.05,
  });

  const plinthBevelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Deep architectural slate podium rim
    roughness: 0.4,
    metalness: 0.2,
  });

  const paverMat = new THREE.MeshStandardMaterial({
    map: paverTexture,
    roughness: 0.65,
    metalness: 0.1,
  });

  const foundationSlabMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Clean architectural concrete footing
    roughness: 0.7,
    metalness: 0.15,
  });

  const mulchMat = new THREE.MeshStandardMaterial({
    color: 0x27201d, // Dark organic bark mulch
    roughness: 0.95,
  });

  // 2. Main Architectural Display Podium Plinth
  const plinthGeo = new THREE.BoxGeometry(baseW, plinthHeight, baseD);
  const plinthMesh = new THREE.Mesh(plinthGeo, plinthBevelMat);
  plinthMesh.position.set(0, -plinthHeight / 2, 0);
  plinthMesh.receiveShadow = true;
  floorGroup.add(plinthMesh);

  // 3. Manicured Estate Green Lawn Top Surface
  const lawnGeo = new THREE.PlaneGeometry(baseW - 0.4, baseD - 0.4);
  const lawnMesh = new THREE.Mesh(lawnGeo, grassMat);
  lawnMesh.rotation.x = -Math.PI / 2;
  lawnMesh.position.set(0, 0.005, 0);
  lawnMesh.receiveShadow = true;
  floorGroup.add(lawnMesh);

  // 4. Concrete Structural House Foundation Pad (Directly beneath the container footprint)
  const padPadding = 1.2;
  const padW = houseLengthFt + padPadding * 2;
  const padD = houseWidthFt + padPadding * 2;
  const padHeight = 0.25;
  const padGeo = new THREE.BoxGeometry(padW, padHeight, padD);
  const padMesh = new THREE.Mesh(padGeo, foundationSlabMat);
  padMesh.position.set(houseOffsetX, padHeight / 2, houseOffsetZ);
  padMesh.receiveShadow = true;
  padMesh.castShadow = true;
  floorGroup.add(padMesh);

  // 5. Modern Bluestone / Travertine Paver Walkway Leading to the Front Porch
  // The front door is typically on the front edge (positive Z side of house)
  const frontPorchX = houseOffsetX - houseLengthFt / 2 + 3.8;
  const frontPorchZ = houseOffsetZ + houseWidthFt / 2;
  const walkwayEndZ = Math.min(baseD / 2 - 2, frontPorchZ + 24);
  const walkwayLength = walkwayEndZ - (frontPorchZ + 1.2);

  if (walkwayLength > 3) {
    const walkwayW = 4.2; // 4.2 ft wide luxury stone walkway
    const walkwayGeo = new THREE.BoxGeometry(walkwayW, 0.08, walkwayLength);
    const walkway = new THREE.Mesh(walkwayGeo, paverMat);
    walkway.position.set(frontPorchX, 0.04, frontPorchZ + 1.2 + walkwayLength / 2);
    walkway.receiveShadow = true;
    floorGroup.add(walkway);

    // Modern Stepping Stone Border or Flanking Planters
    const curbGeo = new THREE.BoxGeometry(0.3, 0.12, walkwayLength);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
    
    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.set(frontPorchX - walkwayW / 2 - 0.15, 0.06, frontPorchZ + 1.2 + walkwayLength / 2);
    leftCurb.receiveShadow = true;
    floorGroup.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, curbMat);
    rightCurb.position.set(frontPorchX + walkwayW / 2 + 0.15, 0.06, frontPorchZ + 1.2 + walkwayLength / 2);
    rightCurb.receiveShadow = true;
    floorGroup.add(rightCurb);
  }

  // 6. Perimeter Garden Mulch Bed around the House Pad
  const mulchBedGeo = new THREE.BoxGeometry(padW + 3.0, 0.04, padD + 3.0);
  const mulchBed = new THREE.Mesh(mulchBedGeo, mulchMat);
  mulchBed.position.set(houseOffsetX, 0.02, houseOffsetZ);
  mulchBed.receiveShadow = true;
  floorGroup.add(mulchBed);

  // 7. Modern Architectural Landscape Planter Shrubs (Stylized boxwood cubes & spheres)
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a4f, // Lush architectural boxwood green
    roughness: 0.8,
    metalness: 0.05,
  });

  const planterPotMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.3,
  });

  // Architectural entrance planters flanking front walkway
  [-2.8, 2.8].forEach((relX) => {
    const potGeo = new THREE.CylinderGeometry(0.7, 0.5, 1.4, 16);
    const pot = new THREE.Mesh(potGeo, planterPotMat);
    pot.position.set(frontPorchX + relX, 0.7, frontPorchZ + 3.0);
    pot.castShadow = true;
    pot.receiveShadow = true;
    floorGroup.add(pot);

    const bushGeo = new THREE.SphereGeometry(0.85, 12, 10);
    const bush = new THREE.Mesh(bushGeo, foliageMat);
    bush.position.set(frontPorchX + relX, 1.8, frontPorchZ + 3.0);
    bush.castShadow = true;
    floorGroup.add(bush);
  });

  // Subtle corner landscape accents around lot
  const cornerPositions = [
    [-baseW / 2 + 4, 0, -baseD / 2 + 4],
    [baseW / 2 - 4, 0, -baseD / 2 + 4],
    [-baseW / 2 + 4, 0, baseD / 2 - 4],
    [baseW / 2 - 4, 0, baseD / 2 - 4],
  ];

  cornerPositions.forEach(([cx, cy, cz]) => {
    const accentBedGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.1, 16);
    const accentBed = new THREE.Mesh(accentBedGeo, mulchMat);
    accentBed.position.set(cx, 0.05, cz);
    accentBed.receiveShadow = true;
    floorGroup.add(accentBed);

    const cornerShrub = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8), foliageMat);
    cornerShrub.position.set(cx, 1.1, cz);
    cornerShrub.castShadow = true;
    floorGroup.add(cornerShrub);
  });

  // -------------------------------------------------------------
  // 8. MODERN HORIZONTAL CEDAR SLAT PRIVACY FENCE (Matching Image 2)
  // -------------------------------------------------------------
  const cedarSlatMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b, // Warm Scandinavian natural cedar
    roughness: 0.65,
    metalness: 0.05,
  });

  const fencePostMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Charcoal black steel posts
    roughness: 0.4,
    metalness: 0.8,
  });

  const fenceGroup = new THREE.Group();
  fenceGroup.name = 'architectural-privacy-fence';

  const fenceH = 6.2;
  const slatCount = 10;
  const slatH = 0.42;
  const slatGap = 0.12;
  const rearFenceZ = -baseD / 2 + 3.0;
  const fenceSpanX = baseW - 8.0;

  // Rear Boundary Fence
  const postSpacing = 9.0;
  const rearPostCount = Math.floor(fenceSpanX / postSpacing) + 1;
  const actualPostSpacing = fenceSpanX / (rearPostCount - 1);

  // Black metal posts
  for (let p = 0; p < rearPostCount; p++) {
    const postX = -fenceSpanX / 2 + p * actualPostSpacing;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, fenceH, 0.35), fencePostMat);
    post.position.set(postX, fenceH / 2, rearFenceZ);
    post.castShadow = true;
    fenceGroup.add(post);
  }

  // Horizontal Cedar Slats
  for (let s = 0; s < slatCount; s++) {
    const slatY = 0.5 + s * (slatH + slatGap);
    const slat = new THREE.Mesh(new THREE.BoxGeometry(fenceSpanX, slatH, 0.12), cedarSlatMat);
    slat.position.set(0, slatY, rearFenceZ);
    slat.castShadow = true;
    slat.receiveShadow = true;
    fenceGroup.add(slat);
  }

  // West Side Boundary Fence (Left perimeter)
  const sideFenceLen = baseD * 0.55;
  const sideFenceStartZ = rearFenceZ;
  const sidePostCount = Math.floor(sideFenceLen / 8.0) + 1;
  const sidePostSpacing = sideFenceLen / (sidePostCount - 1);

  for (let p = 0; p < sidePostCount; p++) {
    const pz = sideFenceStartZ + p * sidePostSpacing;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, fenceH, 0.35), fencePostMat);
    post.position.set(-fenceSpanX / 2, fenceH / 2, pz);
    post.castShadow = true;
    fenceGroup.add(post);
  }

  for (let s = 0; s < slatCount; s++) {
    const slatY = 0.5 + s * (slatH + slatGap);
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.12, slatH, sideFenceLen), cedarSlatMat);
    slat.position.set(-fenceSpanX / 2, slatY, sideFenceStartZ + sideFenceLen / 2);
    slat.castShadow = true;
    slat.receiveShadow = true;
    fenceGroup.add(slat);
  }

  floorGroup.add(fenceGroup);

  return floorGroup;
}

/**
 * Creates high-detail procedural grass texture with realistic variation.
 */
function createManicuredLawnTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Rich architectural turf gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#285e34');
    grad.addColorStop(0.5, '#2f6d3d');
    grad.addColorStop(1, '#24522d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Micro-texture stipple for realistic grass blades and soft sunlight reaction
    for (let i = 0; i < 28000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const bladeTone = Math.random() > 0.5 ? 'rgba(74, 150, 87, 0.35)' : 'rgba(28, 62, 35, 0.35)';
      ctx.fillStyle = bladeTone;
      ctx.fillRect(x, y, 1.5, 2.5);
    }

    // Subtle mowed lawn striping lines (like a luxury golf or villa lawn)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let s = 0; s < 512; s += 64) {
      ctx.fillRect(0, s, 512, 32);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.anisotropy = 8;
  return texture;
}

/**
 * Creates modern architectural stone paver texture.
 */
function createArchitecturalPaverTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Bluestone / Travertine base
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, 512, 512);

    // Stone paver grid joint lines (clean architectural ashlar pattern)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;

    const rowH = 64;
    const colW = 128;

    for (let y = 0; y <= 512; y += rowH) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      const offset = (y / rowH) % 2 === 0 ? 0 : colW / 2;
      for (let x = -colW; x <= 512; x += colW) {
        ctx.beginPath();
        ctx.moveTo(x + offset, y);
        ctx.lineTo(x + offset, y + rowH);
        ctx.stroke();
      }
    }

    // Surface texture noise
    for (let i = 0; i < 15000; i++) {
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(px, py, 2, 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 8);
  texture.anisotropy = 8;
  return texture;
}
