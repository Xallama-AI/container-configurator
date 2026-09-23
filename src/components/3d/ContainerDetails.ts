import * as THREE from 'three';
import { ContainerOpening } from '../../types';

/**
 * Creates an authentic high-resolution procedural canvas texture
 * featuring ISO 6346 shipping container stencil markings, serial codes,
 * CSC safety approval plate, and weight rating specifications.
 */
export function createContainerDoorDecalTexture(
  isHighCube: boolean = true,
  is20Ft: boolean = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Transparent base so the underlying container paint color shines through
    ctx.clearRect(0, 0, 1024, 1024);

    // Color definitions
    const stencilWhite = 'rgba(255, 255, 255, 0.92)';
    const stencilMuted = 'rgba(220, 230, 242, 0.78)';
    const darkPlate = '#1e2530';

    // 1. Top Warning Chevron / High-Cube Stripe
    if (isHighCube) {
      ctx.fillStyle = '#f59e0b'; // High-cube warning yellow
      ctx.fillRect(80, 40, 864, 45);
      ctx.fillStyle = '#0f172a';
      // Warning diagonal stripes
      for (let x = 80; x < 944; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 40);
        ctx.lineTo(x + 20, 40);
        ctx.lineTo(x, 85);
        ctx.lineTo(x - 20, 85);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px "SF Mono", monospace, sans-serif';
      ctx.fillText('WARNING 9\'6" HIGH CONTAINER (2.9M)', 260, 70);
    }

    // 2. ISO 6346 Container Serial ID (e.g. GLXU 849201 [4])
    ctx.fillStyle = stencilWhite;
    ctx.font = 'bold 54px "Courier New", monospace, sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('GLXU  849201', 540, 190);

    // Box around check digit
    ctx.strokeRect(900, 142, 60, 58);
    ctx.lineWidth = 4;
    ctx.strokeStyle = stencilWhite;
    ctx.fillText('4', 916, 188);

    // 3. ISO Size & Type Code (45G1 for 40ft High Cube, 22G1 for 20ft Standard)
    ctx.font = 'bold 44px "Courier New", monospace, sans-serif';
    ctx.fillText(is20Ft ? '22G1' : '45G1', 820, 260);

    // 4. Weight Rating Stencils (Right Door Specs Block)
    ctx.font = 'bold 24px monospace';
    const specsY = 330;
    const lineGap = 38;

    const specs = [
      { label: 'MAX. GROSS', kg: '32,500 KG', lbs: '71,650 LBS' },
      { label: 'TARE WT.', kg: is20Ft ? '2,300 KG' : '3,850 KG', lbs: is20Ft ? '5,070 LBS' : '8,480 LBS' },
      { label: 'PAYLOAD', kg: is20Ft ? '30,200 KG' : '28,650 KG', lbs: is20Ft ? '66,580 LBS' : '63,170 LBS' },
      { label: 'CUBIC CAP.', kg: is20Ft ? '33.2 CU.M' : '76.4 CU.M', lbs: is20Ft ? '1,172 CU.FT' : '2,700 CU.FT' },
    ];

    specs.forEach((item, idx) => {
      const y = specsY + idx * lineGap;
      ctx.fillStyle = stencilMuted;
      ctx.fillText(item.label, 480, y);
      ctx.fillStyle = stencilWhite;
      ctx.fillText(item.kg, 660, y);
      ctx.fillText(item.lbs, 820, y);
    });

    // 5. CSC Safety Approval Metal Plate (Convention for Safe Containers)
    ctx.fillStyle = darkPlate;
    ctx.fillRect(480, 520, 480, 180);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.strokeRect(480, 520, 480, 180);

    // Plate corner rivets
    ctx.fillStyle = '#94a3b8';
    [
      [490, 530],
      [950, 530],
      [490, 690],
      [950, 690],
    ].forEach(([rx, ry]) => {
      ctx.beginPath();
      ctx.arc(rx, ry, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('CSC SAFETY APPROVAL', 600, 550);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText('CERTIFIED BY: LLOYDS REGISTER / BUREAU VERITAS', 505, 580);
    ctx.fillText('MANUFACTURER ID: GRIDLOGIC-ISO1161-2026', 505, 605);
    ctx.fillText('STRUCTURAL GRADE: CORTEN-A HIGH TENSILE STEEL', 505, 630);
    ctx.fillText('FLOOR TREATMENT: NON-TOXIC ECO COMPOSITE', 505, 655);
    ctx.fillText('INSPECTION DATE: CERTIFIED FOR MODULAR ARCHITECTURE', 505, 680);

    // 6. Left Door Architectural Badge
    ctx.strokeStyle = stencilMuted;
    ctx.lineWidth = 3;
    ctx.strokeRect(120, 220, 280, 200);

    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('GRID & LOGIC', 150, 275);
    ctx.fillStyle = stencilWhite;
    ctx.font = '16px monospace';
    ctx.fillText('MODULAR DWELLINGS', 150, 310);
    ctx.fillText('REAL SCALE: 1.000', 150, 340);
    ctx.fillText('ISO 1496-1 COMPLIANT', 150, 370);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates an ISO 1161 twist-lock corner casting with authentic recessed
 * oblong apertures (twistlock holes) on its top, front, and side faces.
 */
export function createIsoCornerCasting(
  size: number,
  railMat: THREE.Material
): THREE.Group {
  const cornerGroup = new THREE.Group();

  // Solid cast steel cube
  const cubeGeo = new THREE.BoxGeometry(size, size, size);
  const cubeMesh = new THREE.Mesh(cubeGeo, railMat);
  cubeMesh.castShadow = true;
  cubeMesh.receiveShadow = true;
  cornerGroup.add(cubeMesh);

  // Recessed dark aperture slots (the characteristic twist-lock holes)
  const holeMat = new THREE.MeshBasicMaterial({ color: 0x05070a });

  // Top/bottom oval aperture
  const topHoleGeo = new THREE.BoxGeometry(size * 0.55, 0.05, size * 0.35);
  const topHole = new THREE.Mesh(topHoleGeo, holeMat);
  topHole.position.set(0, size / 2 + 0.005, 0);
  cornerGroup.add(topHole);

  // Front face aperture
  const frontHoleGeo = new THREE.BoxGeometry(size * 0.45, size * 0.4, 0.05);
  const frontHole = new THREE.Mesh(frontHoleGeo, holeMat);
  frontHole.position.set(0, 0, size / 2 + 0.005);
  cornerGroup.add(frontHole);

  // Side face aperture
  const sideHoleGeo = new THREE.BoxGeometry(0.05, size * 0.4, size * 0.45);
  const sideHole = new THREE.Mesh(sideHoleGeo, holeMat);
  sideHole.position.set(size / 2 + 0.005, 0, 0);
  cornerGroup.add(sideHole);

  return cornerGroup;
}

/**
 * Creates authentic structural Forklift Pockets in the bottom side rails
 * (standard ISO spacing: 2050mm / 6.7ft center-to-center).
 */
export function createForkliftPockets(
  unitL: number,
  unitW: number,
  railMat: THREE.Material
): THREE.Group {
  const pocketGroup = new THREE.Group();
  const pocketSpacing = 6.7; // ~2050mm apart
  const pocketW = 1.3;
  const pocketH = 0.45;
  const pocketD = unitW;

  const pocketMat = new THREE.MeshStandardMaterial({
    color: 0x0b0f17,
    metalness: 0.8,
    roughness: 0.4,
  });

  const trimGeo = new THREE.BoxGeometry(pocketW, pocketH, 0.15);
  const sleeveGeo = new THREE.BoxGeometry(pocketW * 0.9, pocketH * 0.8, pocketD);

  [-pocketSpacing / 2, pocketSpacing / 2].forEach((px) => {
    // Front pocket trim
    const frontTrim = new THREE.Mesh(trimGeo, pocketMat);
    frontTrim.position.set(px, 0.32, unitW / 2 + 0.02);
    pocketGroup.add(frontTrim);

    // Back pocket trim
    const backTrim = new THREE.Mesh(trimGeo, pocketMat);
    backTrim.position.set(px, 0.32, -unitW / 2 - 0.02);
    pocketGroup.add(backTrim);

    // Through-pocket dark sleeve tunnel
    const sleeve = new THREE.Mesh(sleeveGeo, pocketMat);
    sleeve.position.set(px, 0.32, 0);
    pocketGroup.add(sleeve);
  });

  return pocketGroup;
}

/**
 * Creates an aperture indicator (kept as a clean invisible helper group so
 * the 3D model remains pristine without artificial floating text badges).
 */
export function createApertureIndicatorBadge(
  title: string,
  isOpen: boolean,
  openingId: string,
  width: number = 3.0
): THREE.Group {
  // Clean presentation without floating billboard text
  const badgeGroup = new THREE.Group();
  badgeGroup.name = `badge-${openingId}`;
  badgeGroup.visible = false;
  return badgeGroup;
}

/**
 * Floor swing trajectory (clean architectural presentation without CAD graph lines).
 */
export function createFloorSwingArc(
  radius: number,
  startAngle: number,
  sweepAngle: number,
  colorHex: number = 0x00f0ff
): THREE.Group {
  // Clean presentation without CAD graph lines
  const arcGroup = new THREE.Group();
  arcGroup.name = 'floor-swing-arc';
  arcGroup.visible = false;
  return arcGroup;
}

/**
 * Creates high-detail Industrial Cargo End Doors with vertical locking bars,
 * cams, keepers, forged hinges, rubber seals, and decal graphics.
 */
export function createIndustrialCargoDoors(
  unitL: number,
  unitW: number,
  unitH: number,
  wallHeight: number,
  steelMat: THREE.Material,
  railMat: THREE.Material,
  decalTexture: THREE.Texture,
  isOpen: boolean = false
): THREE.Group {
  const doorGroup = new THREE.Group();
  doorGroup.name = 'cargo-doors-group';

  const doorW = (unitW - 1.6) / 2;
  // Authentic clearance: door sits above the floor and below the top header rail
  const doorH = unitH - 0.95;
  const doorCenterY = 0.50 + doorH / 2;
  const doorThick = 0.22;

  // Door Panel Material with decal texture mapped to the right door
  const decalDoorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0.5,
    map: decalTexture,
    transparent: true,
  });

  const galvanizedMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    metalness: 0.9,
    roughness: 0.25,
  });

  const rubberGasketMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.95,
  });

  // 1. Rubber Gasket Weather Seal Perimeter
  const gasketGeo = new THREE.BoxGeometry(0.1, doorH + 0.1, unitW - 1.2);
  const gasket = new THREE.Mesh(gasketGeo, rubberGasketMat);
  gasket.position.set(unitL / 2 - 0.1, doorCenterY, 0);
  doorGroup.add(gasket);

  // -------------------------------------------------------------
  // LEFT DOOR LEAF (Pivoting at the left corner post)
  // -------------------------------------------------------------
  const leftPivotGroup = new THREE.Group();
  leftPivotGroup.name = 'cargo-door-left-pivot';
  leftPivotGroup.position.set(unitL / 2 - 0.05, doorCenterY, -unitW / 2 + 0.6);
  leftPivotGroup.userData = {
    isDoorOrWindow: true,
    isAnimatableAperture: true,
    apertureKey: 'cargo-doors-left',
    apertureType: 'hinge-y',
    targetRotY: isOpen ? -Math.PI * 0.58 : 0,
    closedRotY: 0,
    openRotY: -Math.PI * 0.58,
    openingId: 'cargo-doors',
    isOpen: !!isOpen,
    title: 'Dual Cargo Doors (Left)',
  };
  if (isOpen) {
    leftPivotGroup.rotation.y = -Math.PI * 0.58; // Swing open 105 degrees outward
  }

  const leftDoorGeo = new THREE.BoxGeometry(doorThick, doorH, doorW);
  const leftDoorMesh = new THREE.Mesh(leftDoorGeo, steelMat);
  leftDoorMesh.position.set(0, 0, doorW / 2);
  leftDoorMesh.castShadow = true;
  leftDoorMesh.userData = leftPivotGroup.userData;
  leftPivotGroup.add(leftDoorMesh);

  // Left door locking rods & handle attached to swinging door
  const rodGeo = new THREE.CylinderGeometry(0.07, 0.07, doorH * 1.02, 12);
  const camGeo = new THREE.BoxGeometry(0.2, 0.35, 0.3);
  [-doorW * 0.25 + doorW / 2, doorW * 0.25 + doorW / 2].forEach((relZ) => {
    const rod = new THREE.Mesh(rodGeo, galvanizedMat);
    rod.position.set(0.18, 0, relZ);
    rod.castShadow = true;
    rod.userData = leftPivotGroup.userData;
    leftPivotGroup.add(rod);

    const topCam = new THREE.Mesh(camGeo, galvanizedMat);
    topCam.position.set(0.18, doorH / 2 - 0.5, relZ);
    topCam.userData = leftPivotGroup.userData;
    leftPivotGroup.add(topCam);

    const btmCam = new THREE.Mesh(camGeo, galvanizedMat);
    btmCam.position.set(0.18, -doorH / 2 + 0.5, relZ);
    btmCam.userData = leftPivotGroup.userData;
    leftPivotGroup.add(btmCam);
  });

  const handleGeo = new THREE.BoxGeometry(0.12, 0.12, 1.4);
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 });
  const leftHandle = new THREE.Mesh(handleGeo, handleMat);
  leftHandle.position.set(0.25, -doorH * 0.08, doorW * 0.72);
  leftHandle.rotation.z = 0.2;
  leftHandle.userData = leftPivotGroup.userData;
  leftPivotGroup.add(leftHandle);

  doorGroup.add(leftPivotGroup);

  // -------------------------------------------------------------
  // RIGHT DOOR LEAF (Pivoting at the right corner post)
  // -------------------------------------------------------------
  const rightPivotGroup = new THREE.Group();
  rightPivotGroup.name = 'cargo-door-right-pivot';
  rightPivotGroup.position.set(unitL / 2 - 0.05, doorCenterY, unitW / 2 - 0.6);
  rightPivotGroup.userData = {
    isDoorOrWindow: true,
    isAnimatableAperture: true,
    apertureKey: 'cargo-doors-right',
    apertureType: 'hinge-y',
    targetRotY: isOpen ? Math.PI * 0.58 : 0,
    closedRotY: 0,
    openRotY: Math.PI * 0.58,
    openingId: 'cargo-doors',
    isOpen: !!isOpen,
    title: 'Dual Cargo Doors (Right)',
  };
  if (isOpen) {
    rightPivotGroup.rotation.y = Math.PI * 0.58; // Swing open 105 degrees outward
  }

  const rightDoorGeo = new THREE.BoxGeometry(doorThick, doorH, doorW);
  const rightDoorMesh = new THREE.Mesh(rightDoorGeo, steelMat);
  rightDoorMesh.position.set(0, 0, -doorW / 2);
  rightDoorMesh.castShadow = true;
  rightDoorMesh.userData = rightPivotGroup.userData;
  rightPivotGroup.add(rightDoorMesh);

  // Decal Quad on right door
  const decalGeo = new THREE.PlaneGeometry(doorH * 0.95, doorW * 0.95);
  const decalMesh = new THREE.Mesh(decalGeo, decalDoorMat);
  decalMesh.rotation.y = Math.PI / 2;
  decalMesh.rotation.z = -Math.PI / 2;
  decalMesh.position.set(0.15, 0, -doorW / 2);
  decalMesh.userData = rightPivotGroup.userData;
  rightPivotGroup.add(decalMesh);

  // Right door locking rods & handle
  [-doorW * 0.25 - doorW / 2, doorW * 0.25 - doorW / 2].forEach((relZ) => {
    const rod = new THREE.Mesh(rodGeo, galvanizedMat);
    rod.position.set(0.18, 0, relZ);
    rod.castShadow = true;
    rod.userData = rightPivotGroup.userData;
    rightPivotGroup.add(rod);

    const topCam = new THREE.Mesh(camGeo, galvanizedMat);
    topCam.position.set(0.18, doorH / 2 - 0.5, relZ);
    topCam.userData = rightPivotGroup.userData;
    rightPivotGroup.add(topCam);

    const btmCam = new THREE.Mesh(camGeo, galvanizedMat);
    btmCam.position.set(0.18, -doorH / 2 + 0.5, relZ);
    btmCam.userData = rightPivotGroup.userData;
    rightPivotGroup.add(btmCam);
  });

  const rightHandle = new THREE.Mesh(handleGeo, handleMat);
  rightHandle.position.set(0.25, -doorH * 0.08, -doorW * 0.72);
  rightHandle.rotation.z = -0.2;
  rightHandle.userData = rightPivotGroup.userData;
  rightPivotGroup.add(rightHandle);

  doorGroup.add(rightPivotGroup);

  // Architectural floor swing arcs for both cargo doors
  const leftArc = createFloorSwingArc(doorW, 0, -Math.PI * 0.58, 0x00f0ff);
  leftArc.position.set(unitL / 2 - 0.05, 0.50 + 0.02, -unitW / 2 + 0.6);
  doorGroup.add(leftArc);

  const rightArc = createFloorSwingArc(doorW, Math.PI, Math.PI * 0.58, 0x00f0ff);
  rightArc.position.set(unitL / 2 - 0.05, 0.50 + 0.02, unitW / 2 - 0.6);
  doorGroup.add(rightArc);

  // Floating 3D Interactive Badge centered above cargo doors
  const cargoBadge = createApertureIndicatorBadge('DUAL CARGO DOORS', !!isOpen, 'cargo-doors', 3.6);
  cargoBadge.position.set(unitL / 2 + 0.4, unitH + 0.6, 0);
  cargoBadge.rotation.y = Math.PI / 2;
  doorGroup.add(cargoBadge);

  // -------------------------------------------------------------
  // FIXED HINGES (Welded to corner posts)
  // -------------------------------------------------------------
  const hingeH = 0.5;
  const hingeW = 0.7;
  const hingeGeo = new THREE.BoxGeometry(0.3, hingeH, hingeW);
  const pinGeo = new THREE.CylinderGeometry(0.08, 0.08, hingeH * 1.1, 12);

  const hingeYs = [
    unitH * 0.18,
    unitH * 0.40,
    unitH * 0.62,
    unitH * 0.84,
  ];

  hingeYs.forEach((hy) => {
    // Left fixed hinge
    const leftHinge = new THREE.Mesh(hingeGeo, railMat);
    leftHinge.position.set(unitL / 2 - 0.05, hy, -unitW / 2 + 0.6);
    doorGroup.add(leftHinge);

    const leftPin = new THREE.Mesh(pinGeo, galvanizedMat);
    leftPin.position.set(unitL / 2 + 0.1, hy, -unitW / 2 + 0.75);
    doorGroup.add(leftPin);

    // Right fixed hinge
    const rightHinge = new THREE.Mesh(hingeGeo, railMat);
    rightHinge.position.set(unitL / 2 - 0.05, hy, unitW / 2 - 0.6);
    doorGroup.add(rightHinge);

    const rightPin = new THREE.Mesh(pinGeo, galvanizedMat);
    rightPin.position.set(unitL / 2 + 0.1, hy, unitW / 2 - 0.75);
    doorGroup.add(rightPin);
  });

  return doorGroup;
}

/**
 * Creates stamped steel ventilation breathers (maritime condensation vents).
 */
export function createVentilationLouvers(
  unitL: number,
  unitW: number,
  unitH: number
): THREE.Group {
  const ventGroup = new THREE.Group();
  const ventGeo = new THREE.BoxGeometry(1.2, 0.5, 0.15);
  const ventMat = new THREE.MeshStandardMaterial({ color: 0x18202f, metalness: 0.8, roughness: 0.3 });

  // Two vents on each upper side near corners
  [
    [-unitL / 2 + 3, unitH - 0.8, unitW / 2 + 0.02],
    [unitL / 2 - 3, unitH - 0.8, unitW / 2 + 0.02],
    [-unitL / 2 + 3, unitH - 0.8, -unitW / 2 - 0.02],
    [unitL / 2 - 3, unitH - 0.8, -unitW / 2 - 0.02],
  ].forEach(([vx, vy, vz]) => {
    const vent = new THREE.Mesh(ventGeo, ventMat);
    vent.position.set(vx, vy, vz);
    ventGroup.add(vent);
  });

  return ventGroup;
}

/**
 * Safely clamps opening bounds so doors and windows NEVER exceed the container frame,
 * never cut into structural corner posts, and never exceed floor/ceiling boundaries.
 */
export function getClampedOpeningGeometry(
  op: ContainerOpening,
  unitL: number,
  unitW: number,
  unitH: number = 9.5
) {
  const isDoor = op.type.includes('door') || op.type.includes('bifold');
  const isLengthWall = op.wall === 'front' || op.wall === 'back';
  const wallSpan = isLengthWall ? unitL : unitW;
  
  // Safe margin away from corner castings and structural edge posts (0.8ft = ~9.6 inches)
  const cornerMargin = 0.8;
  const maxAllowedWidth = Math.max(wallSpan - cornerMargin * 2, 1.5);
  const widthFt = Math.max(1.5, Math.min(op.widthFt, maxAllowedWidth));

  // Clamped position along the wall
  const minPos = cornerMargin;
  const maxPos = Math.max(cornerMargin, wallSpan - cornerMargin - widthFt);
  const positionFt = Math.max(minPos, Math.min(op.positionFt, maxPos));

  // Heights and elevation
  const floorTop = 0.50;
  const ceilingBottom = unitH - 0.45;
  const maxAvailableH = Math.max(ceilingBottom - floorTop, 4.0);

  let heightFt: number;
  let elevationFt: number;
  let posY: number;

  if (isDoor) {
    heightFt = Math.max(6.5, Math.min(op.heightFt, maxAvailableH));
    elevationFt = 0;
    posY = floorTop + heightFt / 2;
  } else {
    heightFt = Math.max(2.0, Math.min(op.heightFt, maxAvailableH - 1.2));
    const maxElevation = Math.max(0.4, maxAvailableH - heightFt);
    elevationFt = Math.max(0.4, Math.min(op.elevationFt ?? 2.5, maxElevation));
    posY = floorTop + elevationFt + heightFt / 2;
  }

  let posX = 0;
  let posZ = 0;
  let rotY = 0;

  if (op.wall === 'front') {
    posX = -unitL / 2 + positionFt + widthFt / 2;
    posZ = unitW / 2;
    rotY = 0;
  } else if (op.wall === 'back') {
    posX = -unitL / 2 + positionFt + widthFt / 2;
    posZ = -unitW / 2;
    rotY = Math.PI;
  } else if (op.wall === 'left') {
    posX = -unitL / 2;
    posZ = -unitW / 2 + positionFt + widthFt / 2;
    rotY = -Math.PI / 2;
  } else if (op.wall === 'right') {
    posX = unitL / 2;
    posZ = -unitW / 2 + positionFt + widthFt / 2;
    rotY = Math.PI / 2;
  }

  return {
    isDoor,
    widthFt,
    heightFt,
    elevationFt,
    positionFt,
    posX,
    posY,
    posZ,
    rotY,
    cutoutYMin: isDoor ? floorTop : floorTop + elevationFt,
    cutoutYMax: isDoor ? floorTop + heightFt : floorTop + elevationFt + heightFt,
    cutoutXMin: isLengthWall ? posX - widthFt / 2 - 0.05 : posZ - widthFt / 2 - 0.05,
    cutoutXMax: isLengthWall ? posX + widthFt / 2 + 0.05 : posZ + widthFt / 2 + 0.05,
  };
}

/**
 * Helper to build an authentic architectural window/door sash with hollow extruded frame
 * rails and stiles surrounding a clear, transparent glass pane (never a solid box!).
 */
function createGlazedSash(
  width: number,
  height: number,
  frameDepth: number,
  border: number,
  frameMat: THREE.Material,
  glassMat: THREE.Material,
  userData?: Record<string, unknown>
): THREE.Group {
  const sash = new THREE.Group();
  if (userData) sash.userData = userData;

  // Top rail
  const topRail = new THREE.Mesh(new THREE.BoxGeometry(width, border, frameDepth), frameMat);
  topRail.position.set(0, height / 2 - border / 2, 0);
  topRail.castShadow = true;
  if (userData) topRail.userData = userData;
  sash.add(topRail);

  // Bottom rail
  const btmRail = new THREE.Mesh(new THREE.BoxGeometry(width, border, frameDepth), frameMat);
  btmRail.position.set(0, -height / 2 + border / 2, 0);
  btmRail.castShadow = true;
  if (userData) btmRail.userData = userData;
  sash.add(btmRail);

  // Left stile
  const stileH = Math.max(height - border * 2, 0.1);
  const leftStile = new THREE.Mesh(new THREE.BoxGeometry(border, stileH, frameDepth), frameMat);
  leftStile.position.set(-width / 2 + border / 2, 0, 0);
  leftStile.castShadow = true;
  if (userData) leftStile.userData = userData;
  sash.add(leftStile);

  // Right stile
  const rightStile = new THREE.Mesh(new THREE.BoxGeometry(border, stileH, frameDepth), frameMat);
  rightStile.position.set(width / 2 - border / 2, 0, 0);
  rightStile.castShadow = true;
  if (userData) rightStile.userData = userData;
  sash.add(rightStile);

  // Clear glass pane in center
  const glassW = Math.max(width - border * 2 + 0.04, 0.1);
  const glassH = Math.max(height - border * 2 + 0.04, 0.1);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(glassW, glassH, 0.04), glassMat);
  glass.position.set(0, 0, 0);
  if (userData) glass.userData = userData;
  sash.add(glass);

  return sash;
}

/**
 * Creates structural HSS tubular steel framing and architectural glazing
 * for windows and sliding doors cut out from the corrugated wall,
 * with authentic operable sliding panels, swinging doors, and operable window sashes.
 */
export function createArchitecturalOpening(
  op: ContainerOpening,
  unitL: number,
  unitW: number,
  frameMat: THREE.Material,
  glassPaneMat: THREE.Material,
  steelMat: THREE.Material,
  unitH: number = 9.5
): THREE.Group {
  // Clamped bounds prevent any element from exceeding the container envelope
  const geom = getClampedOpeningGeometry(op, unitL, unitW, unitH);
  const isDoor = geom.isDoor;

  const openingGroup = new THREE.Group();
  openingGroup.name = `opening-${op.id}`;
  openingGroup.position.set(geom.posX, geom.posY, geom.posZ);
  openingGroup.rotation.y = geom.rotY;

  const isOpen = !!op.isOpen;
  openingGroup.userData = {
    isDoorOrWindow: true,
    openingId: op.id,
    isOpen: isOpen,
    title: `${op.type.toUpperCase().replace(/-/g, ' ')} (${isOpen ? 'OPEN' : 'CLOSED'})`,
  };

  // 1. Sleek Architectural Perimeter Frame (Header, Sill, and Jambs - completely clear inside!)
  const frameBorder = 0.22;
  const frameThick = 0.28;
  const halfOW = geom.widthFt / 2;
  const halfOH = geom.heightFt / 2;

  // Header (Top member)
  const headerGeo = new THREE.BoxGeometry(geom.widthFt, frameBorder, frameThick);
  const headerMesh = new THREE.Mesh(headerGeo, frameMat);
  headerMesh.position.set(0, halfOH - frameBorder / 2, 0);
  headerMesh.castShadow = true;
  headerMesh.userData = openingGroup.userData;
  openingGroup.add(headerMesh);

  // Sill (Bottom member: low-profile threshold for walk-in doors so entry is level!)
  const sillHeight = isDoor ? 0.08 : frameBorder;
  const sillGeo = new THREE.BoxGeometry(geom.widthFt, sillHeight, frameThick);
  const sillMesh = new THREE.Mesh(sillGeo, frameMat);
  sillMesh.position.set(0, -halfOH + sillHeight / 2, 0);
  sillMesh.castShadow = true;
  sillMesh.userData = openingGroup.userData;
  openingGroup.add(sillMesh);

  // Clear inner opening dimensions
  const jambH = Math.max(geom.heightFt - frameBorder - sillHeight, 1.0);
  const innerCenterY = (-sillHeight + frameBorder) / 2;

  // Left Jamb
  const jambGeo = new THREE.BoxGeometry(frameBorder, jambH, frameThick);
  const leftJamb = new THREE.Mesh(jambGeo, frameMat);
  leftJamb.position.set(-halfOW + frameBorder / 2, innerCenterY, 0);
  leftJamb.castShadow = true;
  leftJamb.userData = openingGroup.userData;
  openingGroup.add(leftJamb);

  // Right Jamb
  const rightJamb = new THREE.Mesh(jambGeo, frameMat);
  rightJamb.position.set(halfOW - frameBorder / 2, innerCenterY, 0);
  rightJamb.castShadow = true;
  rightJamb.userData = openingGroup.userData;
  openingGroup.add(rightJamb);

  const clearW = Math.max(geom.widthFt - 2 * frameBorder, 1.0);
  const clearH = jambH;

  // Modern Hardware Materials
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5, metalness: 0.1 });

  // -------------------------------------------------------------
  // A. SLIDING GLASS DOORS (8ft, 12ft, 16ft, 20ft bifold)
  // -------------------------------------------------------------
  if (op.type.includes('sliding-door') || op.type.includes('bifold')) {
    const is12FtPlus = geom.widthFt >= 11;
    const panelCount = is12FtPlus ? 3 : 2;
    const panelOverlap = 0.22;
    const panelW = (clearW + (panelCount - 1) * panelOverlap) / panelCount;
    const trackH = 0.08;
    const panelH = clearH - trackH * 2 - 0.02;

    // Bottom Sliding Guide Track
    const trackGeo = new THREE.BoxGeometry(clearW - 0.02, trackH, 0.30);
    const trackMesh = new THREE.Mesh(trackGeo, frameMat);
    trackMesh.position.set(0, -halfOH + sillHeight + trackH / 2, 0);
    trackMesh.userData = openingGroup.userData;
    openingGroup.add(trackMesh);

    // Top Guide Track
    const topTrackGeo = new THREE.BoxGeometry(clearW - 0.02, trackH, 0.30);
    const topTrackMesh = new THREE.Mesh(topTrackGeo, frameMat);
    topTrackMesh.position.set(0, halfOH - frameBorder - trackH / 2, 0);
    topTrackMesh.userData = openingGroup.userData;
    openingGroup.add(topTrackMesh);

    // Fixed Stationary Glass Leaf (Left side, sitting flush inside left jamb)
    const fixedLeftX = -clearW / 2 + panelW / 2 + 0.02;
    const fixedSash = createGlazedSash(panelW, panelH, 0.14, 0.15, frameMat, glassPaneMat, openingGroup.userData);
    fixedSash.position.set(fixedLeftX, innerCenterY, -0.06);
    openingGroup.add(fixedSash);

    // Middle panel for 3-panel 12ft+ sliders
    if (panelCount === 3) {
      const midSash = createGlazedSash(panelW, panelH, 0.14, 0.15, frameMat, glassPaneMat, openingGroup.userData);
      midSash.position.set(0, innerCenterY, -0.06);
      openingGroup.add(midSash);
    }

    // Active Operable Sliding Glass Leaf (Right side)
    const slideLeafGroup = new THREE.Group();
    slideLeafGroup.name = `operable-slider-${op.id}`;
    const closedRightX = clearW / 2 - panelW / 2 - 0.02;
    const slideTravel = panelW * 0.85;
    const openOffset = isOpen ? -slideTravel : 0;
    slideLeafGroup.position.set(closedRightX + openOffset, innerCenterY, 0.07);
    slideLeafGroup.userData = {
      isDoorOrWindow: true,
      isAnimatableAperture: true,
      apertureKey: `opening-${op.id}`,
      apertureType: 'slide-x',
      targetPosX: closedRightX + openOffset,
      closedPosX: closedRightX,
      openPosX: closedRightX - slideTravel,
      openingId: op.id,
      isOpen: isOpen,
      title: `${op.type.toUpperCase().replace(/-/g, ' ')} (${isOpen ? 'OPEN' : 'CLOSED'})`,
    };

    // Hollow glazed sliding sash
    const activeSash = createGlazedSash(panelW, panelH, 0.14, 0.15, frameMat, glassPaneMat, slideLeafGroup.userData);
    slideLeafGroup.add(activeSash);

    // Vertical Architect Stainless Steel Pull Bar Handles (Exterior and Interior for POV mode)
    const pullGeo = new THREE.CylinderGeometry(0.04, 0.04, Math.min(panelH * 0.6, 3.4), 12);

    // Exterior pull handle
    const pullBar = new THREE.Mesh(pullGeo, handleMat);
    pullBar.position.set(-panelW / 2 + 0.3, 0, 0.14);
    pullBar.userData = slideLeafGroup.userData;
    slideLeafGroup.add(pullBar);

    // Interior pull handle (visible when walking inside in POV mode!)
    const innerPullBar = new THREE.Mesh(pullGeo, handleMat);
    innerPullBar.position.set(-panelW / 2 + 0.3, 0, -0.14);
    innerPullBar.userData = slideLeafGroup.userData;
    slideLeafGroup.add(innerPullBar);

    // Exterior and Interior handle standoffs
    const standoffH = Math.min(panelH * 0.25, 1.2);
    [-standoffH, standoffH].forEach((sy) => {
      const standoffGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.1, 8);
      const extStandoff = new THREE.Mesh(standoffGeo, handleMat);
      extStandoff.rotation.x = Math.PI / 2;
      extStandoff.position.set(-panelW / 2 + 0.3, sy, 0.09);
      extStandoff.userData = slideLeafGroup.userData;
      slideLeafGroup.add(extStandoff);

      const intStandoff = new THREE.Mesh(standoffGeo, handleMat);
      intStandoff.rotation.x = -Math.PI / 2;
      intStandoff.position.set(-panelW / 2 + 0.3, sy, -0.09);
      intStandoff.userData = slideLeafGroup.userData;
      slideLeafGroup.add(intStandoff);
    });

    openingGroup.add(slideLeafGroup);

    // Floating 3D Interactive Badge above sliding glass door
    const sliderBadge = createApertureIndicatorBadge(
      op.type.replace(/-/g, ' ').toUpperCase(),
      isOpen,
      op.id,
      Math.min(geom.widthFt * 0.65, 3.2)
    );
    sliderBadge.position.set(0, geom.heightFt / 2 + 0.65, 0.35);
    openingGroup.add(sliderBadge);
  }
  // -------------------------------------------------------------
  // B. ENTRY DOORS & PIVOT DOORS
  // -------------------------------------------------------------
  else if (op.type === 'entry-door' || op.type === 'pivot-door') {
    const doorW = clearW - 0.04;
    const doorH = clearH - 0.04;

    // Hinged Door Leaf Pivot Assembly
    const doorPivot = new THREE.Group();
    doorPivot.name = `operable-door-${op.id}`;
    // Anchor pivot point precisely at the left door jamb
    doorPivot.position.set(-clearW / 2 + 0.02, innerCenterY, 0.02);
    doorPivot.userData = {
      isDoorOrWindow: true,
      isAnimatableAperture: true,
      apertureKey: `opening-${op.id}`,
      apertureType: 'hinge-y',
      targetRotY: isOpen ? -Math.PI * 0.45 : 0,
      closedRotY: 0,
      openRotY: -Math.PI * 0.45,
      openingId: op.id,
      isOpen: isOpen,
      title: `${op.type.toUpperCase().replace(/-/g, ' ')} (${isOpen ? 'OPEN' : 'CLOSED'})`,
    };

    if (isOpen) {
      // Swing open 81 degrees outward
      doorPivot.rotation.y = -Math.PI * 0.45;
    }

    // Door Panel Solid Slab
    const slabGeo = new THREE.BoxGeometry(doorW, doorH, 0.20);
    const slabMesh = new THREE.Mesh(slabGeo, darkWoodMat);
    slabMesh.position.set(doorW / 2, 0, 0);
    slabMesh.castShadow = true;
    slabMesh.userData = doorPivot.userData;
    doorPivot.add(slabMesh);

    // Vertical Frosted Glass Lite Vision Strip
    const liteGeo = new THREE.BoxGeometry(Math.min(0.4, doorW * 0.2), doorH * 0.75, 0.1);
    const liteMesh = new THREE.Mesh(liteGeo, glassPaneMat);
    liteMesh.position.set(doorW * 0.25, 0, 0);
    doorPivot.add(liteMesh);

    // Modern 4ft Vertical Stainless Steel Pull Handle (Exterior)
    const pullGeo = new THREE.BoxGeometry(0.07, Math.min(doorH * 0.6, 3.8), 0.07);
    const pullMesh = new THREE.Mesh(pullGeo, handleMat);
    pullMesh.position.set(doorW * 0.82, 0, 0.16);
    pullMesh.userData = doorPivot.userData;
    doorPivot.add(pullMesh);

    // Modern 4ft Vertical Stainless Steel Pull Handle (Interior)
    const innerPullMesh = new THREE.Mesh(pullGeo, handleMat);
    innerPullMesh.position.set(doorW * 0.82, 0, -0.16);
    innerPullMesh.userData = doorPivot.userData;
    doorPivot.add(innerPullMesh);

    // Deadbolt lock cylinder
    const lockGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 12);
    const lockMesh = new THREE.Mesh(lockGeo, handleMat);
    lockMesh.rotation.x = Math.PI / 2;
    lockMesh.position.set(doorW * 0.82, -0.6, 0.12);
    lockMesh.userData = doorPivot.userData;
    doorPivot.add(lockMesh);

    openingGroup.add(doorPivot);

    // Architectural floor swing arc for entry door
    const entryArc = createFloorSwingArc(doorW, 0, -Math.PI * 0.45, 0x00f0ff);
    entryArc.position.set(-clearW / 2 + 0.02, -halfOH + sillHeight + 0.02, 0.02);
    openingGroup.add(entryArc);

    // Floating 3D Interactive Badge above door
    const entryBadge = createApertureIndicatorBadge(
      op.type.replace(/-/g, ' ').toUpperCase(),
      isOpen,
      op.id,
      Math.min(geom.widthFt * 0.75, 3.0)
    );
    entryBadge.position.set(0, geom.heightFt / 2 + 0.65, 0.35);
    openingGroup.add(entryBadge);
  }
  // -------------------------------------------------------------
  // C. SLIDING WINDOWS (Dual-Track Horizontal Sliders)
  // -------------------------------------------------------------
  else if (op.type.includes('sliding-window')) {
    const halfWinW = (clearW + 0.2) / 2;
    const winH = clearH - 0.08;

    // Track frame top & bottom
    const trackGeo = new THREE.BoxGeometry(clearW - 0.02, 0.08, 0.26);
    const topTrack = new THREE.Mesh(trackGeo, frameMat);
    topTrack.position.set(0, halfOH - frameBorder - 0.04, 0);
    openingGroup.add(topTrack);

    const btmTrack = new THREE.Mesh(trackGeo, frameMat);
    btmTrack.position.set(0, -halfOH + sillHeight + 0.04, 0);
    openingGroup.add(btmTrack);

    // Left Stationary Glass Sash (Hollow perimeter frame with transparent glass!)
    const fixedSash = createGlazedSash(halfWinW, winH, 0.12, 0.12, frameMat, glassPaneMat);
    fixedSash.position.set(-clearW / 2 + halfWinW / 2 + 0.01, innerCenterY, -0.05);
    openingGroup.add(fixedSash);

    // Right Active Sliding Glass Sash
    const slideWinGroup = new THREE.Group();
    slideWinGroup.name = `operable-sliding-win-${op.id}`;
    const closedX = clearW / 2 - halfWinW / 2 - 0.01;
    const slideTravel = halfWinW * 0.85;
    const openOffsetX = isOpen ? -slideTravel : 0;
    slideWinGroup.position.set(closedX + openOffsetX, innerCenterY, 0.05);
    slideWinGroup.userData = {
      isDoorOrWindow: true,
      isAnimatableAperture: true,
      apertureKey: `opening-${op.id}`,
      apertureType: 'slide-x',
      targetPosX: closedX + openOffsetX,
      closedPosX: closedX,
      openPosX: closedX - slideTravel,
      openingId: op.id,
      isOpen: isOpen,
      title: `SLIDING WINDOW (${isOpen ? 'OPEN' : 'CLOSED'})`,
    };

    // Hollow glazed sliding window sash
    const activeWinSash = createGlazedSash(halfWinW, winH, 0.12, 0.12, frameMat, glassPaneMat, slideWinGroup.userData);
    slideWinGroup.add(activeWinSash);

    // Slim architectural sliding window pull handles
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.06, Math.min(winH * 0.5, 1.2), 0.08), handleMat);
    handle.position.set(-halfWinW / 2 + 0.15, 0, 0.09);
    handle.userData = slideWinGroup.userData;
    slideWinGroup.add(handle);

    const innerHandle = new THREE.Mesh(new THREE.BoxGeometry(0.06, Math.min(winH * 0.5, 1.2), 0.08), handleMat);
    innerHandle.position.set(-halfWinW / 2 + 0.15, 0, -0.09);
    innerHandle.userData = slideWinGroup.userData;
    slideWinGroup.add(innerHandle);

    openingGroup.add(slideWinGroup);

    // Floating badge
    const winBadge = createApertureIndicatorBadge('SLIDING WINDOW', isOpen, op.id, Math.min(geom.widthFt * 0.75, 2.6));
    winBadge.position.set(0, geom.heightFt / 2 + 0.55, 0.3);
    openingGroup.add(winBadge);
  }
  // -------------------------------------------------------------
  // D. OPERABLE & PICTURE WINDOWS
  // -------------------------------------------------------------
  else {
    const isPicture = op.type === 'picture-window';
    const winW = clearW - 0.04;
    const winH = clearH - 0.04;

    if (isPicture) {
      // Fixed Architectural Glass Wall with hollow perimeter frame
      const picSash = createGlazedSash(winW, winH, 0.10, 0.10, frameMat, glassPaneMat, {
        isDoorOrWindow: true,
        openingId: op.id,
        isOpen: false,
        title: 'Fixed Architectural Picture Window',
      });
      picSash.position.set(0, innerCenterY, 0);
      openingGroup.add(picSash);
    } else {
      // Operable Awning/Casement Window
      const windowPivot = new THREE.Group();
      windowPivot.name = `operable-window-${op.id}`;
      // Top hinge anchor for awning window
      windowPivot.position.set(0, innerCenterY + winH / 2, 0.04);
      windowPivot.userData = {
        isDoorOrWindow: true,
        isAnimatableAperture: true,
        apertureKey: `opening-${op.id}`,
        apertureType: 'hinge-x',
        targetRotX: isOpen ? -Math.PI * 0.22 : 0,
        closedRotX: 0,
        openRotX: -Math.PI * 0.22,
        openingId: op.id,
        isOpen: isOpen,
        title: `${op.type.toUpperCase().replace(/-/g, ' ')} (${isOpen ? 'OPEN' : 'CLOSED'})`,
      };

      if (isOpen) {
        // Tilt window open outward 32 degrees
        windowPivot.rotation.x = -Math.PI * 0.22;
      }

      // Hollow glazed operable window sash
      const winSash = createGlazedSash(winW, winH, 0.12, 0.12, frameMat, glassPaneMat, windowPivot.userData);
      winSash.position.set(0, -winH / 2, 0);
      windowPivot.add(winSash);

      // Bottom stainless steel crank/cam latch
      const latchGeo = new THREE.BoxGeometry(0.25, 0.06, 0.12);
      const latch = new THREE.Mesh(latchGeo, handleMat);
      latch.position.set(0, -winH + 0.15, 0.10);
      windowPivot.add(latch);

      openingGroup.add(windowPivot);

      // Floating 3D Interactive Badge above operable window
      const winBadge = createApertureIndicatorBadge(
        'OPERABLE WINDOW',
        isOpen,
        op.id,
        Math.min(geom.widthFt * 0.75, 2.6)
      );
      winBadge.position.set(0, geom.heightFt / 2 + 0.55, 0.3);
      openingGroup.add(winBadge);
    }
  }

  return openingGroup;
}

/**
 * Creates an ultra-realistic exterior HVAC Mini-Split Inverter Compressor Unit.
 * Sits on an elevated concrete pad with realistic fan grille, copper lineset, and line-hide casing.
 */
export function createExteriorHvacUnit(posX: number, posZ: number): THREE.Group {
  const hvacGroup = new THREE.Group();
  hvacGroup.name = 'exterior-hvac-unit';
  hvacGroup.position.set(posX, 0, posZ);

  // 1. Concrete equipment pad
  const padGeo = new THREE.BoxGeometry(3.2, 0.25, 1.6);
  const padMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });
  const pad = new THREE.Mesh(padGeo, padMat);
  pad.position.set(0, 0.125, 0);
  pad.castShadow = true;
  pad.receiveShadow = true;
  hvacGroup.add(pad);

  // 2. Main compressor cabinet (powder-coated off-white)
  const cabGeo = new THREE.BoxGeometry(2.8, 2.3, 1.1);
  const cabMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.4 });
  const cab = new THREE.Mesh(cabGeo, cabMat);
  cab.position.set(0, 0.25 + 1.15, 0);
  cab.castShadow = true;
  hvacGroup.add(cab);

  // 3. Circular fan grille on front face
  const grilleGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.08, 24);
  const grilleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.8 });
  const grille = new THREE.Mesh(grilleGeo, grilleMat);
  grille.rotation.x = Math.PI / 2;
  grille.position.set(-0.25, 0.25 + 1.15, 0.56);
  hvacGroup.add(grille);

  // 4. Status LED
  const ledGeo = new THREE.BoxGeometry(0.12, 0.06, 0.04);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  const led = new THREE.Mesh(ledGeo, ledMat);
  led.position.set(0.9, 0.25 + 1.9, 0.56);
  hvacGroup.add(led);

  // 5. Refrigerant lineset bundle running vertically into container wall
  const lineGeo = new THREE.BoxGeometry(0.18, 5.2, 0.18);
  const lineMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
  const lineHide = new THREE.Mesh(lineGeo, lineMat);
  lineHide.position.set(1.0, 2.8, -0.3);
  lineHide.castShadow = true;
  hvacGroup.add(lineHide);

  return hvacGroup;
}

