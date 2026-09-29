import * as THREE from 'three';
import { ContainerModelConfig, ContainerOpening, RoomPartition } from '../../types';
import {
  createIsoCornerCasting,
  createForkliftPockets,
  createVentilationLouvers,
  createContainerDoorDecalTexture,
  createIndustrialCargoDoors,
  createArchitecturalOpening,
  createExteriorHvacUnit,
  getClampedOpeningGeometry,
} from './ContainerDetails';
import { buildOutdoorDeckFurniture } from './FurnitureModels';
import {
  buildLogicalHouseInterior,
  buildArchitecturalHouseEnvelope,
} from './LogicalHouseLayout';
import {
  getContainerSteelNormalMap,
  getExteriorCladdingTextures,
  getInteriorFlooringTexture,
  getSolarPanelTexture,
  createContactShadowPlane,
} from './ProceduralPbrTextures';

/**
 * Builds the complete 3D photorealistic Container House model:
 * Used in 3D Orbit Studio, Walkthrough VR, and Augmented Reality (AR) modes.
 */
export function buildCompleteContainerHouse(modelConfig: ContainerModelConfig): THREE.Group {
  const houseGroup = new THREE.Group();
  houseGroup.name = 'container-house-root';

  const {
    lengthFt,
    widthFt,
    heightFt,
    exteriorColor,
    openings,
    roofOption,
    solarPanelsCount,
    staircase,
    cutawayRoof,
    interiorStyle,
    partitions,
    foundationType,
    pierHeightInches,
    deckPorch,
    deckWidthFt,
    deckDepthFt,
    layoutType,
    cargoDoorsOpen,
  } = modelConfig;

  const pierHeightFt = pierHeightInches / 12;
  const baseElevation = pierHeightFt;

  // -------------------------------------------------------------
  // 1. FOUNDATION SYSTEM
  // -------------------------------------------------------------
  const foundationMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.9,
    metalness: 0.1,
  });

  if (foundationType === 'concrete-piers' || foundationType === 'helical-piles') {
    const pierPositions = [
      [-lengthFt / 2 + 1, -widthFt / 2 + 1],
      [-lengthFt / 2 + 1, widthFt / 2 - 1],
      [lengthFt / 2 - 1, -widthFt / 2 + 1],
      [lengthFt / 2 - 1, widthFt / 2 - 1],
      [0, -widthFt / 2 + 1],
      [0, widthFt / 2 - 1],
    ];
    if (lengthFt > 30) {
      pierPositions.push([-lengthFt / 4, -widthFt / 2 + 1]);
      pierPositions.push([-lengthFt / 4, widthFt / 2 - 1]);
      pierPositions.push([lengthFt / 4, -widthFt / 2 + 1]);
      pierPositions.push([lengthFt / 4, widthFt / 2 - 1]);
    }

    pierPositions.forEach(([px, pz]) => {
      const pierGeo =
        foundationType === 'helical-piles'
          ? new THREE.CylinderGeometry(0.3, 0.3, pierHeightFt, 12)
          : new THREE.BoxGeometry(1.5, pierHeightFt, 1.5);
      const pierMesh = new THREE.Mesh(pierGeo, foundationMat);
      pierMesh.position.set(px, pierHeightFt / 2, pz);
      pierMesh.castShadow = true;
      pierMesh.receiveShadow = true;
      houseGroup.add(pierMesh);
    });
  } else if (foundationType === 'concrete-slab') {
    const slabGeo = new THREE.BoxGeometry(lengthFt + 2, pierHeightFt, widthFt + 2);
    const slabMesh = new THREE.Mesh(slabGeo, foundationMat);
    slabMesh.position.set(0, pierHeightFt / 2, 0);
    slabMesh.receiveShadow = true;
    slabMesh.castShadow = true;
    houseGroup.add(slabMesh);
  }

  // -------------------------------------------------------------
  // 2. TIMBER DECK / PORCH & GROUND ACCESS
  // -------------------------------------------------------------
  if (deckPorch) {
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x9a7b56, // Premium Cedar / Teak composite
      roughness: 0.7,
    });
    const deckThickness = 0.5;
    const deckCenterY = baseElevation + deckThickness / 2;
    const deckTopY = baseElevation + deckThickness; // Matches container interior finished floor (0.50) exactly!
    const deckZ = widthFt / 2 + deckDepthFt / 2;

    const deckGeo = new THREE.BoxGeometry(deckWidthFt, deckThickness, deckDepthFt);
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.position.set(0, deckCenterY, deckZ);
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
    houseGroup.add(deckMesh);

    // Deck Foundation Apron / Sub-frame skirting down to ground grade
    if (baseElevation > 0.1) {
      const apronMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.85 });
      const apronGeo = new THREE.BoxGeometry(deckWidthFt - 0.2, baseElevation, deckDepthFt - 0.2);
      const apronMesh = new THREE.Mesh(apronGeo, apronMat);
      apronMesh.position.set(0, baseElevation / 2, deckZ);
      apronMesh.receiveShadow = true;
      houseGroup.add(apronMesh);
    }

    // Identify front door locations to ensure clear, unobstructed walk-through path
    const frontDoorBounds: { xMin: number; xMax: number }[] = [];
    (modelConfig.openings || []).forEach((op) => {
      if (op.wall === 'front' && (op.type.includes('door') || op.type.includes('bifold'))) {
        const px = -lengthFt / 2 + op.positionFt + op.widthFt / 2;
        frontDoorBounds.push({
          xMin: px - op.widthFt / 2,
          xMax: px + op.widthFt / 2,
        });
      }
    });

    // Walkway / Stair landing coordinates
    const stairX = frontDoorBounds.length > 0 ? ((frontDoorBounds[0].xMin + frontDoorBounds[0].xMax) / 2) : 0;
    const stairWidth = 5.0;

    // Architectural Ground Access Stairs leading from grade (Y = 0) up to Deck Top
    const stairSteps = Math.max(Math.round(deckTopY / 0.55), 1);
    for (let s = 1; s <= stairSteps; s++) {
      const stepDepth = 1.2;
      const stepH = deckTopY / stairSteps;
      const stepH_acc = stepH * s;
      const stepGeo = new THREE.BoxGeometry(stairWidth, stepH, stepDepth);
      const stepMesh = new THREE.Mesh(stepGeo, deckMat);
      stepMesh.position.set(
        stairX,
        stepH_acc - stepH / 2,
        widthFt / 2 + deckDepthFt + (stairSteps - s + 0.5) * (stepDepth * 0.9)
      );
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      houseGroup.add(stepMesh);
    }

    // Modern Deck Railings with open passage at stairs/walkway
    const railingMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.3 });
    const railPostGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);

    // Left and Right End Posts
    [
      [-deckWidthFt / 2 + 0.3, widthFt / 2 + 0.3],
      [-deckWidthFt / 2 + 0.3, widthFt / 2 + deckDepthFt - 0.3],
      [deckWidthFt / 2 - 0.3, widthFt / 2 + 0.3],
      [deckWidthFt / 2 - 0.3, widthFt / 2 + deckDepthFt - 0.3],
      [stairX - stairWidth / 2, widthFt / 2 + deckDepthFt - 0.3],
      [stairX + stairWidth / 2, widthFt / 2 + deckDepthFt - 0.3],
    ].forEach(([rx, rz]) => {
      const post = new THREE.Mesh(railPostGeo, railingMat);
      post.position.set(rx, deckTopY + 1.6, rz);
      post.castShadow = true;
      houseGroup.add(post);
    });

    // Left outer side rail
    const sideRailGeo = new THREE.BoxGeometry(0.12, 0.15, deckDepthFt - 0.6);
    const leftSideRail = new THREE.Mesh(sideRailGeo, railingMat);
    leftSideRail.position.set(-deckWidthFt / 2 + 0.3, deckTopY + 3.1, deckZ);
    leftSideRail.castShadow = true;
    houseGroup.add(leftSideRail);

    // Right outer side rail
    const rightSideRail = new THREE.Mesh(sideRailGeo, railingMat);
    rightSideRail.position.set(deckWidthFt / 2 - 0.3, deckTopY + 3.1, deckZ);
    rightSideRail.castShadow = true;
    houseGroup.add(rightSideRail);

    // Front Rails (Left segment and Right segment with open middle for stairs!)
    const leftSpan = Math.max((stairX - stairWidth / 2) - (-deckWidthFt / 2 + 0.3), 0.5);
    const leftRailGeo = new THREE.BoxGeometry(leftSpan, 0.15, 0.12);
    const leftFrontRail = new THREE.Mesh(leftRailGeo, railingMat);
    leftFrontRail.position.set(-deckWidthFt / 2 + 0.3 + leftSpan / 2, deckTopY + 3.1, widthFt / 2 + deckDepthFt - 0.3);
    leftFrontRail.castShadow = true;
    houseGroup.add(leftFrontRail);

    const rightSpan = Math.max((deckWidthFt / 2 - 0.3) - (stairX + stairWidth / 2), 0.5);
    const rightRailGeo = new THREE.BoxGeometry(rightSpan, 0.15, 0.12);
    const rightFrontRail = new THREE.Mesh(rightRailGeo, railingMat);
    rightFrontRail.position.set(stairX + stairWidth / 2 + rightSpan / 2, deckTopY + 3.1, widthFt / 2 + deckDepthFt - 0.3);
    rightFrontRail.castShadow = true;
    houseGroup.add(rightFrontRail);

    // Outdoor luxury deck furniture smartly positioned away from doors
    const deckFurn = buildOutdoorDeckFurniture(deckWidthFt, deckDepthFt, baseElevation, widthFt, frontDoorBounds);
    houseGroup.add(deckFurn);
  }

  // -------------------------------------------------------------
  // HELPER: BUILD SINGLE CONTAINER BOX UNIT
  // -------------------------------------------------------------
  const buildContainerUnit = (
    unitL: number,
    unitW: number,
    unitH: number,
    posOffset: THREE.Vector3,
    isUpperStory: boolean = false,
    floorType: 'single' | 'ground' | 'upper' = 'single',
    options?: { skipInterior?: boolean; skipEnvelope?: boolean; skipWallSide?: 'front' | 'back' }
  ) => {
    const unitGroup = new THREE.Group();
    unitGroup.position.copy(posOffset);

    // Steel / Facade Material
    let facadeColor = new THREE.Color(exteriorColor);
    let facadeRoughness = 0.45;
    let facadeMetalness = 0.6;

    if (modelConfig.exteriorMaterial === 'shou-sugi-ban') {
      facadeColor = new THREE.Color('#121417');
      facadeRoughness = 0.88;
      facadeMetalness = 0.05;
    } else if (modelConfig.exteriorMaterial === 'swiss-larch') {
      facadeColor = new THREE.Color('#9c7a54');
      facadeRoughness = 0.72;
      facadeMetalness = 0.08;
    } else if (modelConfig.exteriorMaterial === 'corten-steel') {
      facadeColor = new THREE.Color('#7c3f1d');
      facadeRoughness = 0.65;
      facadeMetalness = 0.45;
    } else if (modelConfig.exteriorMaterial === 'obsidian-composite') {
      facadeColor = new THREE.Color('#1a1f2c');
      facadeRoughness = 0.35;
      facadeMetalness = 0.3;
    } else if (modelConfig.exteriorMaterial === 'concrete-panels') {
      facadeColor = new THREE.Color('#64748b');
      facadeRoughness = 0.82;
      facadeMetalness = 0.12;
    } else if (modelConfig.exteriorMaterial === 'alpine-white-stucco') {
      facadeColor = new THREE.Color('#e2e8f0');
      facadeRoughness = 0.9;
      facadeMetalness = 0.02;
    }

    const cladding = getExteriorCladdingTextures(modelConfig.exteriorMaterial, exteriorColor);
    const normalMap = getContainerSteelNormalMap();

    const steelMat = new THREE.MeshStandardMaterial({
      // Albedo maps already contain their own pigment. Multiplying them by the
      // finish colour made painted steel and timber almost black in daylight.
      color: modelConfig.exteriorMaterial === 'shou-sugi-ban' ? 0x383838 : cladding.map ? 0xffffff : facadeColor,
      bumpScale: 0.03,
      normalScale: new THREE.Vector2(0.25, 0.25),
      roughness: facadeRoughness,
      metalness: facadeMetalness,
      ...(cladding.map ? { map: cladding.map } : {}),
      ...(cladding.bumpMap ? { bumpMap: cladding.bumpMap } : {}),
      ...(cladding.normalMap || !cladding.map ? { normalMap: cladding.normalMap ?? normalMap } : {}),
      ...(cladding.roughnessMap ? { roughnessMap: cladding.roughnessMap } : {}),
    });

    const railMat = new THREE.MeshStandardMaterial({
      color: (modelConfig.exteriorMaterial as string) === 'alpine-white-stucco' ? 0x475569 :
             (modelConfig.exteriorMaterial as string) === 'wood-slat-siding' || modelConfig.exteriorMaterial === 'swiss-larch' ? 0x2e2722 :
             modelConfig.exteriorMaterial === 'corten-steel' ? 0x3d271d : 0x1e293b,
      roughness: 0.45,
      metalness: 0.65,
    });

    // A. ISO Corner Castings (Architectural twist-lock fittings, sleek proportion)
    const cornerSize = 0.45;
    const cornerPositions = [
      [-unitL / 2 + cornerSize / 2, cornerSize / 2, -unitW / 2 + cornerSize / 2],
      [-unitL / 2 + cornerSize / 2, cornerSize / 2, unitW / 2 - cornerSize / 2],
      [unitL / 2 - cornerSize / 2, cornerSize / 2, -unitW / 2 + cornerSize / 2],
      [unitL / 2 - cornerSize / 2, cornerSize / 2, unitW / 2 - cornerSize / 2],
      [-unitL / 2 + cornerSize / 2, unitH - cornerSize / 2, -unitW / 2 + cornerSize / 2],
      [-unitL / 2 + cornerSize / 2, unitH - cornerSize / 2, unitW / 2 - cornerSize / 2],
      [unitL / 2 - cornerSize / 2, unitH - cornerSize / 2, -unitW / 2 + cornerSize / 2],
      [unitL / 2 - cornerSize / 2, unitH - cornerSize / 2, unitW / 2 - cornerSize / 2],
    ];

    cornerPositions.forEach(([cx, cy, cz]) => {
      const cornerMesh = createIsoCornerCasting(cornerSize, railMat);
      cornerMesh.position.set(cx, cy, cz);
      unitGroup.add(cornerMesh);
    });

    // B. Forklift Pockets & Industrial Louvers (only when industrial corten shipping container look is chosen)
    if (!isUpperStory && modelConfig.exteriorMaterial === 'corten-steel') {
      const pockets = createForkliftPockets(unitL, unitW, railMat);
      unitGroup.add(pockets);
      const louvers = createVentilationLouvers(unitL, unitW, unitH);
      unitGroup.add(louvers);
    }

    // D. Corner Columns (Sleek architectural perimeter posts)
    const colGeo = new THREE.BoxGeometry(0.35, unitH - cornerSize * 2, 0.35);
    const colX = unitL / 2 - 0.2;
    const colZ = unitW / 2 - 0.2;
    [
      [-colX, -colZ],
      [-colX, colZ],
      [colX, -colZ],
      [colX, colZ],
    ].forEach(([x, z]) => {
      const colMesh = new THREE.Mesh(colGeo, railMat);
      colMesh.position.set(x, unitH / 2, z);
      colMesh.castShadow = true;
      unitGroup.add(colMesh);
    });

    // E. Structural Framing Cutouts Calculation (For seamless walk-in doors & windows)
    const wallHeight = unitH - 0.7;
    const entryDoorX = unitL / 2 - 3.8;

    interface WallCutout {
      xMin: number;
      xMax: number;
      yMin: number;
      yMax: number;
      isDoor: boolean;
    }

    const frontCutouts: WallCutout[] = [];
    const backCutouts: WallCutout[] = [];

    (openings || []).forEach((op) => {
      const geom = getClampedOpeningGeometry(op, unitL, unitW, unitH);
      const cutout: WallCutout = {
        xMin: geom.cutoutXMin,
        xMax: geom.cutoutXMax,
        yMin: Math.max(geom.cutoutYMin - 0.02, 0),
        yMax: Math.min(geom.cutoutYMax + 0.02, unitH - 0.2),
        isDoor: geom.isDoor,
      };

      if (op.wall === 'front') frontCutouts.push(cutout);
      if (op.wall === 'back') backCutouts.push(cutout);
    });

    // Helper to build a complete solid shipping container wall with corrugated flutes and clean aperture cutouts
    const buildContinuousContainerWall = (
      wallZ: number,
      cutouts: WallCutout[],
      isFront: boolean
    ) => {
      const wallGroup = new THREE.Group();
      const minX = -unitL / 2 + cornerSize;
      const maxX = unitL / 2 - cornerSize;
      const ribProfile = new THREE.Shape();
      const projection = isFront ? -0.13 : 0.13;
      ribProfile.moveTo(-0.34, 0);
      ribProfile.lineTo(-0.21, projection);
      ribProfile.lineTo(0.21, projection);
      ribProfile.lineTo(0.34, 0);
      ribProfile.closePath();
      const ribGeometry = new THREE.ExtrudeGeometry(ribProfile, {
        depth: wallHeight,
        bevelEnabled: false,
        curveSegments: 1,
      });
      ribGeometry.rotateX(-Math.PI / 2);

      // Sort and merge overlapping cutout ranges
      const sortedCutouts = [...cutouts].sort((a, b) => a.xMin - b.xMin);

      // Build solid wall panels between cutouts
      let currentX = minX;
      sortedCutouts.forEach((cut) => {
        const cLeft = Math.max(cut.xMin, minX);
        const cRight = Math.min(cut.xMax, maxX);

        if (cLeft > currentX + 0.1) {
          const segW = cLeft - currentX;
          const segMidX = currentX + segW / 2;

          // 1. Solid Steel Backing Wall Sheet
          const panelGeo = new THREE.BoxGeometry(segW, wallHeight, 0.06);
          const panelMesh = new THREE.Mesh(panelGeo, steelMat);
          panelMesh.position.set(segMidX, unitH / 2, wallZ);
          panelMesh.castShadow = true;
          panelMesh.receiveShadow = true;
          wallGroup.add(panelMesh);

          // 2. Continuous Trapezoidal Corrugations (Ribs)
          const ribInterval = 0.8;
          const ribCount = Math.max(Math.floor(segW / ribInterval), 1);
          const ribOffset = (segW - ribCount * ribInterval) / 2 + ribInterval / 2;
          for (let r = 0; r < ribCount; r++) {
            const rx = currentX + ribOffset + r * ribInterval;
            const ribMesh = new THREE.Mesh(ribGeometry, steelMat);
            const zNudge = isFront ? 0.04 : -0.04;
            ribMesh.position.set(rx, unitH / 2 - wallHeight / 2, wallZ + zNudge);
            ribMesh.castShadow = true;
            wallGroup.add(ribMesh);
          }
        }

        // Handle wall above and below window cutouts
        const opW = cRight - cLeft;
        const opMidX = cLeft + opW / 2;

        // Header wall panel above opening (if opening doesn't reach top)
        if (cut.yMax < unitH - 0.4) {
          const headerH = (unitH - 0.35) - cut.yMax;
          const headerGeo = new THREE.BoxGeometry(opW, headerH, 0.06);
          const headerMesh = new THREE.Mesh(headerGeo, steelMat);
          headerMesh.position.set(opMidX, cut.yMax + headerH / 2, wallZ);
          headerMesh.castShadow = true;
          wallGroup.add(headerMesh);
        }

        // Sill wall panel below window (if not a walk-in door)
        if (!cut.isDoor && cut.yMin > 0.4) {
          const sillH = cut.yMin - 0.35;
          const sillGeo = new THREE.BoxGeometry(opW, sillH, 0.06);
          const sillMesh = new THREE.Mesh(sillGeo, steelMat);
          sillMesh.position.set(opMidX, 0.35 + sillH / 2, wallZ);
          sillMesh.castShadow = true;
          wallGroup.add(sillMesh);
        }

        currentX = Math.max(currentX, cRight);
      });

      // Remaining solid wall section to the right
      if (currentX < maxX - 0.1) {
        const segW = maxX - currentX;
        const segMidX = currentX + segW / 2;

        const panelGeo = new THREE.BoxGeometry(segW, wallHeight, 0.06);
        const panelMesh = new THREE.Mesh(panelGeo, steelMat);
        panelMesh.position.set(segMidX, unitH / 2, wallZ);
        panelMesh.castShadow = true;
        panelMesh.receiveShadow = true;
        wallGroup.add(panelMesh);

        const ribInterval = 0.8;
        const ribCount = Math.max(Math.floor(segW / ribInterval), 1);
        const ribOffset = (segW - ribCount * ribInterval) / 2 + ribInterval / 2;
        for (let r = 0; r < ribCount; r++) {
          const rx = currentX + ribOffset + r * ribInterval;
          const ribMesh = new THREE.Mesh(ribGeometry, steelMat);
          const zNudge = isFront ? 0.04 : -0.04;
          ribMesh.position.set(rx, unitH / 2 - wallHeight / 2, wallZ + zNudge);
          ribMesh.castShadow = true;
          wallGroup.add(ribMesh);
        }
      }

      return wallGroup;
    };

    // Build front and rear continuous walls with clean cutouts
    if (options?.skipWallSide !== 'front') {
      const frontWall = buildContinuousContainerWall(unitW / 2 - 0.12, frontCutouts, true);
      unitGroup.add(frontWall);

      // Top Header Rail
      const topRailGeo = new THREE.BoxGeometry(unitL - cornerSize * 2, 0.35, 0.25);
      const topRailFront = new THREE.Mesh(topRailGeo, railMat);
      topRailFront.position.set(0, unitH - 0.175, unitW / 2 - 0.12);
      unitGroup.add(topRailFront);

      // Bottom Sill Rail (Split around walk-in doors for zero trip hazard)
      const walkInDoors = frontCutouts.filter((c) => c.isDoor).sort((a, b) => a.xMin - b.xMin);
      let railX = -unitL / 2 + cornerSize;
      walkInDoors.forEach((door) => {
        if (door.xMin > railX + 0.2) {
          const rW = door.xMin - railX;
          const rGeo = new THREE.BoxGeometry(rW, 0.25, 0.22);
          const rMesh = new THREE.Mesh(rGeo, railMat);
          rMesh.position.set(railX + rW / 2, 0.125, unitW / 2 - 0.12);
          unitGroup.add(rMesh);
        }
        railX = Math.max(railX, door.xMax);
      });
      if (railX < unitL / 2 - cornerSize - 0.2) {
        const rW = (unitL / 2 - cornerSize) - railX;
        const rGeo = new THREE.BoxGeometry(rW, 0.25, 0.22);
        const rMesh = new THREE.Mesh(rGeo, railMat);
        rMesh.position.set(railX + rW / 2, 0.125, unitW / 2 - 0.12);
        unitGroup.add(rMesh);
      }
    }

    if (options?.skipWallSide !== 'back') {
      const backWall = buildContinuousContainerWall(-unitW / 2 + 0.12, backCutouts, false);
      unitGroup.add(backWall);

      // Top & Bottom Rails for Back Wall
      const longRailGeo = new THREE.BoxGeometry(unitL - cornerSize * 2, 0.35, 0.25);
      const topRailBack = new THREE.Mesh(longRailGeo, railMat);
      topRailBack.position.set(0, unitH - 0.175, -unitW / 2 + 0.12);
      unitGroup.add(topRailBack);

      const btmRailBack = new THREE.Mesh(longRailGeo, railMat);
      btmRailBack.position.set(0, 0.175, -unitW / 2 + 0.12);
      unitGroup.add(btmRailBack);
    }

    // G. End Wall & Cargo Doors
    const leftEndGeo = new THREE.BoxGeometry(0.2, wallHeight, unitW - 0.8);
    const leftEndMesh = new THREE.Mesh(leftEndGeo, steelMat);
    leftEndMesh.position.set(-unitL / 2 + 0.15, unitH / 2, 0);
    leftEndMesh.castShadow = true;
    unitGroup.add(leftEndMesh);

    // Right end authentic Double Cargo Doors with open/closed state
    const isHighCube = unitH >= 9.0;
    const is20Ft = unitL <= 22;
    const decalTexture = createContainerDoorDecalTexture(isHighCube, is20Ft);
    const cargoDoors = createIndustrialCargoDoors(
      unitL,
      unitW,
      unitH,
      wallHeight,
      steelMat,
      railMat,
      decalTexture,
      !!cargoDoorsOpen
    );
    unitGroup.add(cargoDoors);

    // H. Interior Subfloor & Flooring
    const flooringPbr = getInteriorFlooringTexture(modelConfig.flooringMaterial || 'chevron-oak');
    const floorMat = new THREE.MeshStandardMaterial({
      map: flooringPbr.map,
      bumpScale: 0.02,
      roughness: flooringPbr.roughness,
      metalness: modelConfig.flooringMaterial === 'polished-concrete' ? 0.15 : 0.04,
      ...(flooringPbr.normalMap ? { normalMap: flooringPbr.normalMap } : { bumpMap: flooringPbr.bumpMap }),
    });
    const floorGeo = new THREE.BoxGeometry(unitL - 1, 0.5, unitW - 1);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, 0.25, 0);
    floorMesh.receiveShadow = true;
    unitGroup.add(floorMesh);

    // I. Roof
    if (!cutawayRoof) {
      const roofGeo = new THREE.BoxGeometry(unitL - 1, 0.4, unitW - 1);
      const roofMesh = new THREE.Mesh(roofGeo, steelMat);
      roofMesh.position.set(0, unitH - 0.2, 0);
      roofMesh.castShadow = true;
      unitGroup.add(roofMesh);

      if (roofOption === 'deck-wood') {
        const roofDeckMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.6 });
        const roofDeckGeo = new THREE.BoxGeometry(unitL - 2, 0.2, unitW - 1.5);
        const roofDeckMesh = new THREE.Mesh(roofDeckGeo, roofDeckMat);
        roofDeckMesh.position.set(0, unitH + 0.1, 0);
        roofDeckMesh.castShadow = true;
        unitGroup.add(roofDeckMesh);

        const glassMat = new THREE.MeshPhysicalMaterial({
          color: 0x00f0ff,
          transmission: 0.85,
          opacity: 0.9,
          transparent: true,
          roughness: 0.1,
          ior: 1.5,
        });
        const roofRailGeo = new THREE.BoxGeometry(unitL - 2, 3.2, 0.1);
        const railFront = new THREE.Mesh(roofRailGeo, glassMat);
        railFront.position.set(0, unitH + 1.7, unitW / 2 - 0.8);
        unitGroup.add(railFront);
        const railBack = new THREE.Mesh(roofRailGeo, glassMat);
        railBack.position.set(0, unitH + 1.7, -unitW / 2 + 0.8);
        unitGroup.add(railBack);
      } else if (roofOption === 'solar-panels') {
        const solarTex = getSolarPanelTexture();
        const panelMat = new THREE.MeshStandardMaterial({
          map: solarTex,
          metalness: 0.85,
          roughness: 0.15,
        });
        const panelCount = Math.min(solarPanelsCount, Math.floor((unitL - 4) / 4) * 2);
        const rows = 2;
        const cols = Math.floor(panelCount / rows);

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const px = -unitL / 2 + 4 + c * 4.2;
            const pz = -unitW / 4 + r * (unitW / 2);
            const panelGeo = new THREE.BoxGeometry(3.8, 0.15, 2.8);
            const panelMesh = new THREE.Mesh(panelGeo, panelMat);
            panelMesh.position.set(px, unitH + 0.5, pz);
            panelMesh.rotation.x = -0.15;
            panelMesh.castShadow = true;
            unitGroup.add(panelMesh);
          }
        }
      } else if (roofOption === 'green-roof') {
        const greenMat = new THREE.MeshStandardMaterial({ color: 0x2e6f40, roughness: 0.9 });
        const greenGeo = new THREE.BoxGeometry(unitL - 2, 0.5, unitW - 1.5);
        const greenMesh = new THREE.Mesh(greenGeo, greenMat);
        greenMesh.position.set(0, unitH + 0.25, 0);
        greenMesh.castShadow = true;
        unitGroup.add(greenMesh);
      }
    }

    // J. Architectural Openings (Sliding doors, entry doors, operable windows)
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x090d14, roughness: 0.3, metalness: 0.7 });
    let glassColorHex = 0xe0f7fa;
    let glassTransmission = 0.92;
    let glassOpacity = 0.85;

    if (modelConfig.glassTint === 'privacy-mirror') {
      glassColorHex = 0x64748b;
      glassTransmission = 0.45;
      glassOpacity = 0.75;
    } else if (modelConfig.glassTint === 'smoked-bronze') {
      glassColorHex = 0x78350f;
      glassTransmission = 0.6;
      glassOpacity = 0.65;
    } else if (modelConfig.glassTint === 'cyan-solar') {
      glassColorHex = 0x00f0ff;
      glassTransmission = 0.85;
      glassOpacity = 0.75;
    }

    const glassPaneMat = new THREE.MeshPhysicalMaterial({
      color: glassColorHex,
      transmission: glassTransmission,
      opacity: glassOpacity,
      transparent: true,
      roughness: 0.05,
      reflectivity: 0.9,
      ior: 1.52,
      depthWrite: false,
    });

    (openings || []).forEach((op) => {
      const archOpening = createArchitecturalOpening(
        op,
        unitL,
        unitW,
        frameMat,
        glassPaneMat,
        steelMat,
        unitH
      );
      unitGroup.add(archOpening);
    });

    // K. Logical Architectural House Interior (Dedicated Bedroom, Spa Bath, Kitchen, Great Room & Corridor)
    if (!options?.skipInterior) {
      const logicalInterior = buildLogicalHouseInterior(
        unitL,
        unitW,
        unitH,
        interiorStyle,
        modelConfig.flooringMaterial,
        floorType,
        modelConfig
      );
      unitGroup.add(logicalInterior);
    }

    // L. Modern Architectural House Envelope & Covered Front Porch
    if (!options?.skipEnvelope) {
      const architecturalEnvelope = buildArchitecturalHouseEnvelope(
        unitL,
        unitW,
        unitH,
        modelConfig.exteriorMaterial,
        exteriorColor,
        !!cutawayRoof,
        roofOption,
        solarPanelsCount,
        !!modelConfig.frontDoorOpen,
        isUpperStory
      );
      unitGroup.add(architecturalEnvelope);
    }

    // M. Interior Ambient Warm LED Fill Light
    const interiorLight = new THREE.PointLight(0xffecd1, cutawayRoof ? 1.5 : 3.0, 40);
    interiorLight.position.set(0, unitH - 1.5, 0);
    unitGroup.add(interiorLight);

    return unitGroup;
  };

  // -------------------------------------------------------------
  // BUILD LAYOUT CONFIGURATIONS
  // -------------------------------------------------------------
  if (layoutType === 'single' || layoutType === 'custom') {
    const mainBox = buildContainerUnit(lengthFt, widthFt, heightFt, new THREE.Vector3(0, baseElevation, 0), false, 'single');
    houseGroup.add(mainBox);
  } else if (layoutType === 'double-wide') {
    const halfW = widthFt / 2;
    // Build the two structural container half-shells with open center seam
    const box1 = buildContainerUnit(
      lengthFt,
      halfW,
      heightFt,
      new THREE.Vector3(0, baseElevation, -halfW / 2),
      false,
      'single',
      { skipInterior: true, skipEnvelope: true, skipWallSide: 'front' }
    );
    const box2 = buildContainerUnit(
      lengthFt,
      halfW,
      heightFt,
      new THREE.Vector3(0, baseElevation, halfW / 2),
      false,
      'single',
      { skipInterior: true, skipEnvelope: true, skipWallSide: 'back' }
    );
    houseGroup.add(box1);
    houseGroup.add(box2);

    // Architectural central structural header beam
    const headerGeo = new THREE.BoxGeometry(lengthFt, 1.0, 1.0);
    const headerMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8 });
    const headerBeam = new THREE.Mesh(headerGeo, headerMat);
    headerBeam.position.set(0, baseElevation + heightFt - 0.5, 0);
    houseGroup.add(headerBeam);

    // ONE UNIFIED 16ft wide architectural interior (TV lounge, chef island kitchen, master suite, spa bath)
    const unifiedInterior = buildLogicalHouseInterior(
      lengthFt,
      widthFt,
      heightFt,
      interiorStyle,
      modelConfig.flooringMaterial,
      'single',
      modelConfig
    );
    unifiedInterior.position.set(0, baseElevation, 0);
    houseGroup.add(unifiedInterior);

    // ONE UNIFIED 16ft wide architectural exterior envelope (cantilevered roof, fascia, soffit lights)
    const unifiedEnvelope = buildArchitecturalHouseEnvelope(
      lengthFt,
      widthFt,
      heightFt,
      modelConfig.exteriorMaterial,
      exteriorColor,
      !!cutawayRoof,
      roofOption,
      solarPanelsCount,
      !!modelConfig.frontDoorOpen,
      false
    );
    unifiedEnvelope.position.set(0, baseElevation, 0);
    houseGroup.add(unifiedEnvelope);
  } else if (layoutType === 'triple-wide') {
    const bayW = widthFt / 3;
    // Build 3 interconnected bays with open side walls
    const box1 = buildContainerUnit(
      lengthFt,
      bayW,
      heightFt,
      new THREE.Vector3(0, baseElevation, -bayW),
      false,
      'single',
      { skipInterior: true, skipEnvelope: true, skipWallSide: 'front' }
    );
    const box2 = buildContainerUnit(
      lengthFt,
      bayW,
      heightFt,
      new THREE.Vector3(0, baseElevation, 0),
      false,
      'single',
      { skipInterior: true, skipEnvelope: true }
    );
    const box3 = buildContainerUnit(
      lengthFt,
      bayW,
      heightFt,
      new THREE.Vector3(0, baseElevation, bayW),
      false,
      'single',
      { skipInterior: true, skipEnvelope: true, skipWallSide: 'back' }
    );
    houseGroup.add(box1);
    houseGroup.add(box2);
    houseGroup.add(box3);

    // Architectural central structural header beams across the 2 seams
    [-bayW / 2, bayW / 2].forEach((seamZ) => {
      const headerGeo = new THREE.BoxGeometry(lengthFt, 1.0, 1.0);
      const headerMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8 });
      const headerBeam = new THREE.Mesh(headerGeo, headerMat);
      headerBeam.position.set(0, baseElevation + heightFt - 0.5, seamZ);
      houseGroup.add(headerBeam);
    });

    // ONE UNIFIED 24ft wide architectural interior
    const unifiedInterior = buildLogicalHouseInterior(
      lengthFt,
      widthFt,
      heightFt,
      interiorStyle,
      modelConfig.flooringMaterial,
      'single',
      modelConfig
    );
    unifiedInterior.position.set(0, baseElevation, 0);
    houseGroup.add(unifiedInterior);

    // ONE UNIFIED 24ft wide architectural exterior envelope
    const unifiedEnvelope = buildArchitecturalHouseEnvelope(
      lengthFt,
      widthFt,
      heightFt,
      modelConfig.exteriorMaterial,
      exteriorColor,
      !!cutawayRoof,
      roofOption,
      solarPanelsCount,
      !!modelConfig.frontDoorOpen,
      false
    );
    unifiedEnvelope.position.set(0, baseElevation, 0);
    houseGroup.add(unifiedEnvelope);
  } else if (layoutType === 'stacked-2story') {
    const singleH = heightFt / 2;
    const storyView = modelConfig.activeStoryView || 'all';

    if (storyView === 'all' || storyView === 'ground') {
      const groundBox = buildContainerUnit(
        lengthFt,
        widthFt,
        singleH,
        new THREE.Vector3(0, baseElevation, 0),
        false,
        'ground'
      );
      houseGroup.add(groundBox);
    }

    if (storyView === 'all' || storyView === 'upper') {
      const upperElevation = storyView === 'upper' ? baseElevation : baseElevation + singleH;
      const upperBox = buildContainerUnit(
        lengthFt * 0.8,
        widthFt,
        singleH,
        new THREE.Vector3(lengthFt * 0.1, upperElevation, 0),
        true,
        'upper'
      );
      houseGroup.add(upperBox);
    }

    if (staircase && storyView === 'all') {
      const stairMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.3 });
      const stepCount = 14;
      const stepHeight = singleH / stepCount;
      const stepLength = 14 / stepCount;

      for (let i = 0; i < stepCount; i++) {
        const stepGeo = new THREE.BoxGeometry(stepLength, 0.25, 3.5);
        const stepMesh = new THREE.Mesh(stepGeo, stairMat);
        stepMesh.position.set(
          -lengthFt / 2 + i * stepLength,
          baseElevation + (i + 1) * stepHeight,
          widthFt / 2 + 2.5
        );
        stepMesh.castShadow = true;
        houseGroup.add(stepMesh);
      }
    }
  } else if (layoutType === 'cantilever-offset') {
    const singleH = heightFt / 2;
    const groundBox = buildContainerUnit(
      lengthFt,
      widthFt,
      singleH,
      new THREE.Vector3(0, baseElevation, 0),
      false,
      'ground'
    );
    const upperBox = buildContainerUnit(
      lengthFt * 0.85,
      widthFt,
      singleH,
      new THREE.Vector3(8.0, baseElevation + singleH, 0),
      true,
      'upper'
    );
    houseGroup.add(groundBox);
    houseGroup.add(upperBox);
  } else if (layoutType === 'u-shape') {
    const mainBox = buildContainerUnit(lengthFt * 0.7, widthFt, heightFt, new THREE.Vector3(0, baseElevation, -lengthFt * 0.2), false, 'single');
    const wing1 = buildContainerUnit(lengthFt * 0.5, widthFt, heightFt, new THREE.Vector3(-lengthFt * 0.35 + widthFt / 2, baseElevation, 0), false, 'single');
    wing1.rotation.y = Math.PI / 2;
    const wing2 = buildContainerUnit(lengthFt * 0.5, widthFt, heightFt, new THREE.Vector3(lengthFt * 0.35 - widthFt / 2, baseElevation, 0), false, 'single');
    wing2.rotation.y = Math.PI / 2;
    houseGroup.add(mainBox);
    houseGroup.add(wing1);
    houseGroup.add(wing2);
  } else if (layoutType === 'l-shape') {
    const box1 = buildContainerUnit(lengthFt * 0.6, widthFt, heightFt, new THREE.Vector3(-lengthFt * 0.2, baseElevation, 0), false, 'single');
    const box2 = buildContainerUnit(lengthFt * 0.6, widthFt, heightFt, new THREE.Vector3(lengthFt * 0.15, baseElevation, lengthFt * 0.25), false, 'single');
    box2.rotation.y = Math.PI / 2;
    houseGroup.add(box1);
    houseGroup.add(box2);
  }

  // Soft Ambient Occlusion Contact Shadow underneath the building footprint to ground model
  const contactShadow = createContactShadowPlane(widthFt, lengthFt);
  contactShadow.position.set(0, baseElevation + 0.02, 0);
  houseGroup.add(contactShadow);

  // Realistic Exterior HVAC Inverter Mini-Split Unit on rear wall
  const hvacUnit = createExteriorHvacUnit(-lengthFt / 2 + 5.0, -widthFt / 2 - 1.0);
  houseGroup.add(hvacUnit);

  return houseGroup;
}
