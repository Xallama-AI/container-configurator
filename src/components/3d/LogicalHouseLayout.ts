import * as THREE from 'three';
import { 
  InteriorStyle, 
  FlooringMaterial, 
  RoofOption, 
  ContainerModelConfig,
  LoungeType,
  KitchenType,
  BathroomType,
  BedroomType
} from '../../types';
import {
  getCalacattaMarbleTexture,
  getWovenFabricBumpMap,
} from './ProceduralPbrTextures';

/**
 * Palettes for high-end interior architectural finishes
 */
function getStylePalette(style: InteriorStyle, modelConfig?: ContainerModelConfig) {
  let base = {
    wood: 0xd4a373,         // Warm natural Scandinavian oak
    wallColor: 0xf1f5f9,    // Clean warm off-white
    cabinet: 0x1e293b,      // Matte midnight slate
    marble: 0xfafafa,       // Calacatta honed marble
    sofa: 0x64748b,         // Slate heather linen
    accentPillow: 0xe07a5f, // Terracotta accent
    bedFabric: 0x334155,    // Navy blue upholstery
    blanket: 0xc4a482,      // Warm camel cashmere
    rug: 0xd6ccc2,          // Warm ivory loop pile
  };

  switch (style) {
    case 'dark-loft':
      base = {
        wood: 0x27272a,         // Charcoal stained oak
        wallColor: 0x27272a,    // Deep charcoal
        cabinet: 0x18181b,      // Matte obsidian
        marble: 0x18181b,       // Nero marquina
        sofa: 0x3f3f46,         // Charcoal heather
        accentPillow: 0xd97706, // Ochre amber
        bedFabric: 0x27272a,    // Charcoal velvet
        blanket: 0x71717a,      // Cool slate wool
        rug: 0x1c1917,          // Dark woven jute
      };
      break;
    case 'industrial-concrete':
      base = {
        wood: 0x78716c,         // Weathered teak
        wallColor: 0x475569,    // Industrial slate grey
        cabinet: 0x334155,      // Gunmetal steel
        marble: 0x475569,       // Honed concrete
        sofa: 0x52525b,         // Concrete grey twill
        accentPillow: 0x0284c7, // Industrial cyan
        bedFabric: 0x4b5563,    // Heather grey
        blanket: 0x0f172a,      // Midnight navy
        rug: 0x374151,          // Textured graphite
      };
      break;
    case 'nordic-white':
      base = {
        wood: 0xe2d9cc,         // Bleached Scandinavian pine
        wallColor: 0xf8fafc,    // Pure architectural white
        cabinet: 0xf8fafc,      // Crisp white laminate
        marble: 0xffffff,       // Pure white quartz
        sofa: 0xf1f5f9,         // Off-white boucle
        accentPillow: 0x0d9488, // Nordic spruce teal
        bedFabric: 0xe2e8f0,    // Pure linen
        blanket: 0x94a3b8,      // Muted cloud grey
        rug: 0xe2e8f0,          // Cream woven wool
      };
      break;
    case 'minimalist-oak':
    default:
      base = {
        wood: 0xd4a373,         // Warm natural Scandinavian oak
        wallColor: 0xf1f5f9,    // Clean warm off-white
        cabinet: 0x1e293b,      // Matte midnight slate
        marble: 0xfafafa,       // Calacatta honed marble
        sofa: 0x64748b,         // Slate heather linen
        accentPillow: 0xe07a5f, // Terracotta accent
        bedFabric: 0x334155,    // Navy blue upholstery
        blanket: 0xc4a482,      // Warm camel cashmere
        rug: 0xd6ccc2,          // Warm ivory loop pile
      };
      break;
  }

  // Real-time customizer overrides
  if (modelConfig?.kitchenColor) {
    switch (modelConfig.kitchenColor) {
      case 'matte-obsidian': base.cabinet = 0x141619; break;
      case 'scandinavian-oak': base.cabinet = 0xc49a6c; break;
      case 'navy-blue': base.cabinet = 0x1b2a4a; break;
      case 'marble-white': base.cabinet = 0xf8fafc; break;
      case 'forest-green': base.cabinet = 0x243828; break;
      case 'smoked-charcoal': base.cabinet = 0x333a42; break;
    }
  }

  if (modelConfig?.bedroomPalette) {
    switch (modelConfig.bedroomPalette) {
      case 'warm-linen':
        base.bedFabric = 0xf8f7f4;
        base.blanket = 0xd6ccc2;
        base.accentPillow = 0x9c7a54;
        break;
      case 'charcoal-grey':
        base.bedFabric = 0x374151;
        base.blanket = 0x1f2937;
        base.accentPillow = 0x64748b;
        break;
      case 'sage-green':
        base.bedFabric = 0x6b8067;
        base.blanket = 0x475569;
        base.accentPillow = 0x2d6a4f;
        break;
      case 'terracotta-clay':
        base.bedFabric = 0xb45309;
        base.blanket = 0x78350f;
        base.accentPillow = 0xd97706;
        break;
      case 'midnight-navy':
        base.bedFabric = 0x1e293b;
        base.blanket = 0x0f172a;
        base.accentPillow = 0x38bdf8;
        break;
    }
  }

  if (modelConfig?.sittingPalette) {
    switch (modelConfig.sittingPalette) {
      case 'warm-cognac':
        base.sofa = 0x965228;
        base.accentPillow = 0xd97706;
        break;
      case 'charcoal-boucle':
        base.sofa = 0x333a42;
        base.accentPillow = 0x94a3b8;
        break;
      case 'sand-beige':
        base.sofa = 0xe2d9cc;
        base.accentPillow = 0x9c7a54;
        break;
      case 'emerald-velvet':
        base.sofa = 0x1b4332;
        base.accentPillow = 0xd4af37;
        break;
      case 'slate-grey':
        base.sofa = 0x64748b;
        base.accentPillow = 0x0284c7;
        break;
    }
  }

  return base;
}

/**
 * Helper to build common architectural materials
 */
function createInteriorMaterials(palette: ReturnType<typeof getStylePalette>, modelConfig?: ContainerModelConfig) {
  const marbleTex = getCalacattaMarbleTexture();
  const fabricBump = getWovenFabricBumpMap();

  let marbleMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: marbleTex,
    roughness: 0.18,
    metalness: 0.06,
  });

  if (modelConfig?.kitchenCountertop === 'black-granite') {
    marbleMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.22,
      metalness: 0.15,
    });
  } else if (modelConfig?.kitchenCountertop === 'butcherblock-oak') {
    marbleMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4a373,
      roughness: 0.55,
      metalness: 0.04,
    });
  } else if (modelConfig?.kitchenCountertop === 'brushed-stainless') {
    marbleMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.2,
      metalness: 0.9,
    });
  }

  let tileMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: marbleTex,
    roughness: 0.25,
    metalness: 0.05,
  });

  if (modelConfig?.washroomTileStyle === 'black-slate') {
    tileMat = new THREE.MeshStandardMaterial({ color: 0x1e2229, roughness: 0.7, metalness: 0.1 });
  } else if (modelConfig?.washroomTileStyle === 'white-terrazzo') {
    tileMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.05 });
  } else if (modelConfig?.washroomTileStyle === 'sandstone') {
    tileMat = new THREE.MeshStandardMaterial({ color: 0xd6c4a8, roughness: 0.65, metalness: 0.02 });
  }

  return {
    wallMat: new THREE.MeshStandardMaterial({ color: palette.wallColor, roughness: 0.78 }),
    doorMat: new THREE.MeshStandardMaterial({ color: palette.wood, roughness: 0.5 }),
    cabinetMat: new THREE.MeshStandardMaterial({ color: palette.cabinet, roughness: 0.42 }),
    marbleMat: marbleMaterial,
    tileMat: tileMat,
    woodMat: new THREE.MeshStandardMaterial({ color: palette.wood, roughness: 0.45 }),
    steelMat: new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.25 }),
    glassMat: new THREE.MeshPhysicalMaterial({ color: 0xccfbf1, transmission: 0.92, opacity: 0.85, transparent: true, roughness: 0.05, ior: 1.5 }),
    frostedGlassMat: new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, transmission: 0.7, opacity: 0.8, transparent: true, roughness: 0.35, ior: 1.3 }),
    sofaFabricMat: new THREE.MeshStandardMaterial({
      color: palette.sofa,
      bumpMap: fabricBump,
      bumpScale: 0.02,
      roughness: 0.88,
    }),
    pillowMat: new THREE.MeshStandardMaterial({
      color: palette.accentPillow,
      bumpMap: fabricBump,
      bumpScale: 0.015,
      roughness: 0.85,
    }),
    bedMat: new THREE.MeshStandardMaterial({
      color: palette.bedFabric,
      bumpMap: fabricBump,
      bumpScale: 0.02,
      roughness: 0.88,
    }),
    blanketMat: new THREE.MeshStandardMaterial({
      color: palette.blanket,
      bumpMap: fabricBump,
      bumpScale: 0.018,
      roughness: 0.88,
    }),
    whiteMat: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65 }),
    chromeMat: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 }),
    goldBrassMat: new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 }),
    screenMat: new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.1, metalness: 0.9 }),
    flameMat: new THREE.MeshBasicMaterial({ color: 0xff7b00 }),
    plantGreenMat: new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 }),
  };
}

/**
 * Builds the complete logical interior house floor plan:
 * Supports single-story, double-wide (16ft unified flow), multi-story, and all room type variations.
 */
export function buildLogicalHouseInterior(
  unitL: number,
  unitW: number,
  unitH: number,
  interiorStyle: InteriorStyle,
  flooringMaterial: FlooringMaterial = 'chevron-oak',
  floorType: 'single' | 'ground' | 'upper' = 'single',
  modelConfig?: ContainerModelConfig
): THREE.Group {
  if (floorType === 'ground') {
    return buildGroundStoryHouseInterior(unitL, unitW, unitH, interiorStyle, flooringMaterial, modelConfig);
  }
  if (floorType === 'upper') {
    return buildUpperStoryHouseInterior(unitL, unitW, unitH, interiorStyle, flooringMaterial, modelConfig);
  }
  if (unitW >= 20 || modelConfig?.layoutType === 'triple-wide') {
    return buildTripleWideHouseInterior(unitL, unitW, unitH, interiorStyle, flooringMaterial, modelConfig);
  }
  if (unitW >= 12 || modelConfig?.layoutType === 'double-wide') {
    return buildDoubleWideHouseInterior(unitL, unitW, unitH, interiorStyle, flooringMaterial, modelConfig);
  }
  return buildSingleStoryHouseInterior(unitL, unitW, unitH, interiorStyle, flooringMaterial, modelConfig);
}

/**
 * ============================================================================
 * MODULAR ROOM BUILDERS (Lounge, Kitchen, Bathroom, Bedroom)
 * ============================================================================
 */

/**
 * 1. LOUNGE BUILDER:
 * Supports TV Media Lounge, Open Great Room with Fireplace, Sunroom/Reading Lounge,
 * Social Conversational Lounge, and Minimalist Scandinavian Studio Lounge.
 */
function buildLoungeFurniture(
  type: LoungeType = 'great-room',
  palette: ReturnType<typeof getStylePalette>,
  mats: ReturnType<typeof createInteriorMaterials>,
  roomDepth: number
): THREE.Group {
  const group = new THREE.Group();
  group.name = `lounge-${type}`;
  group.userData.interiorRoom = 'lounge';
  group.userData.roomDepthFt = roomDepth;

  // Area Rug
  const rugW = Math.min(roomDepth - 1.0, 7.5);
  const rugGeo = new THREE.BoxGeometry(8.0, 0.04, rugW);
  const rug = new THREE.Mesh(rugGeo, new THREE.MeshStandardMaterial({ color: palette.rug, roughness: 0.95 }));
  rug.position.set(0, 0.03, 0);
  group.add(rug);

  if (type === 'tv-media') {
    // -------------------------------------------------------------
    // TV MEDIA LOUNGE / CINEMA SUITE
    // -------------------------------------------------------------
    // Acoustic Wood Slat Media Backdrop Wall
    const mediaWallW = Math.min(roomDepth - 1.2, 7.0);
    const mediaWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 7.5, mediaWallW), mats.woodMat);
    mediaWall.position.set(3.8, 3.8, 0);
    mediaWall.castShadow = true;
    group.add(mediaWall);

    // Vertical Slat Grooves
    const slatCount = Math.floor(mediaWallW * 2.5);
    for (let s = 0; s < slatCount; s++) {
      const sz = -mediaWallW / 2 + 0.2 + s * 0.4;
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.06, 7.4, 0.15), mats.steelMat);
      slat.position.set(3.68, 3.8, sz);
      group.add(slat);
    }

    // 75-inch Ultra-Slim OLED Screen
    const tv = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.2, 5.2), mats.screenMat);
    tv.position.set(3.6, 4.2, 0);
    group.add(tv);

    // Cyan Ambient Bias Backlight
    const tvGlow = new THREE.PointLight(0x00f0ff, 1.2, 10);
    tvGlow.position.set(3.4, 4.2, 0);
    group.add(tvGlow);

    // Floating Walnut Soundbar & Media Credenza
    const credenza = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 6.0), mats.cabinetMat);
    credenza.position.set(3.3, 1.2, 0);
    credenza.castShadow = true;
    group.add(credenza);

    const soundbar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 3.8), mats.steelMat);
    soundbar.position.set(3.3, 1.9, 0);
    group.add(soundbar);

    // Deep Cinema Sectional Sofa (Opposite TV)
    const sofaMain = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.65, Math.min(roomDepth - 1.5, 6.5)), mats.sofaFabricMat);
    sofaMain.position.set(-2.0, 0.5, 0);
    sofaMain.castShadow = true;
    group.add(sofaMain);

    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, Math.min(roomDepth - 1.5, 6.5)), mats.sofaFabricMat);
    sofaBack.position.set(-3.2, 1.3, 0);
    group.add(sofaBack);

    // Pillows
    [-1.8, 0, 1.8].forEach((pz) => {
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.8), mats.pillowMat);
      pillow.position.set(-2.8, 1.2, pz);
      pillow.rotation.y = 0.1;
      group.add(pillow);
    });

    // Round Low Marble Cocktail Coffee Table
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.12, 24), mats.marbleMat);
    tableTop.position.set(0.6, 0.85, 0);
    tableTop.castShadow = true;
    group.add(tableTop);

    const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 0.8, 16), mats.steelMat);
    tableBase.position.set(0.6, 0.4, 0);
    group.add(tableBase);

  } else if (type === 'sunroom-reading') {
    // -------------------------------------------------------------
    // PANORAMIC SUNROOM / READING LOUNGE
    // -------------------------------------------------------------
    // Floor-to-Ceiling Architectural Bookshelf along end wall
    const shelfH = 7.5;
    const shelfW = Math.min(roomDepth - 1.5, 6.5);
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.8, shelfH, shelfW), mats.woodMat);
    shelf.position.set(3.5, shelfH / 2 + 0.1, 0);
    shelf.castShadow = true;
    group.add(shelf);

    // Bookshelf tiers with books & ceramic art
    [-2.0, 0, 2.0].forEach((sy) => {
      const bookBlock = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, shelfW - 0.8), mats.cabinetMat);
      bookBlock.position.set(3.4, 3.8 + sy, 0);
      group.add(bookBlock);
    });

    // Pair of Iconic Lounge Armchairs (Barcelona / Eames style)
    [-1.5, 1.5].forEach((az) => {
      const chair = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 2.2), mats.sofaFabricMat);
      chair.position.set(-1.0, 0.6, az);
      chair.castShadow = true;
      group.add(chair);

      const back = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.8, 2.0), mats.sofaFabricMat);
      back.position.set(-2.0, 1.4, az);
      group.add(back);
    });

    // Fluted Round Brass Side Table between chairs
    const sideTable = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.4, 20), mats.goldBrassMat);
    sideTable.position.set(-1.0, 0.7, 0);
    sideTable.castShadow = true;
    group.add(sideTable);

    // Cocktail Bar Cart
    const barCart = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 2.2), mats.steelMat);
    barCart.position.set(1.5, 0.9, -shelfW / 2 + 1.2);
    group.add(barCart);

  } else if (type === 'social-conversational') {
    // -------------------------------------------------------------
    // SOCIAL CONVERSATIONAL LOUNGE (4 curved armchairs around marble table)
    // -------------------------------------------------------------
    const centerTable = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.15, 24), mats.marbleMat);
    centerTable.position.set(0, 0.9, 0);
    centerTable.castShadow = true;
    group.add(centerTable);

    const centerLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 0.8, 16), mats.steelMat);
    centerLeg.position.set(0, 0.4, 0);
    group.add(centerLeg);

    // 4 Curved Bucket Armchairs in cardinal layout
    const chairOffsets: [number, number, number][] = [
      [-2.4, 0, 0],
      [2.4, 0, 0],
      [0, -1.8, Math.PI / 2],
      [0, 1.8, -Math.PI / 2],
    ];
    chairOffsets.forEach(([cx, cz, rot]) => {
      const chairSeat = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.9, 0.5, 16), mats.sofaFabricMat);
      chairSeat.position.set(cx, 0.6, cz);
      chairSeat.rotation.y = rot;
      chairSeat.castShadow = true;
      group.add(chairSeat);

      const chairBack = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.2, 16, 1, false, 0, Math.PI), mats.sofaFabricMat);
      chairBack.position.set(cx, 1.2, cz);
      chairBack.rotation.y = rot + Math.PI / 2;
      group.add(chairBack);
    });

    // Sculptural Designer Chandelier overhead
    const chandelier = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 8, 24), mats.goldBrassMat);
    chandelier.position.set(0, 6.5, 0);
    chandelier.rotation.x = Math.PI / 2;
    group.add(chandelier);

    const warmLight = new THREE.PointLight(0xffedd5, 1.2, 10);
    warmLight.position.set(0, 6.2, 0);
    group.add(warmLight);

  } else if (type === 'minimalist-studio') {
    // -------------------------------------------------------------
    // MINIMALIST SCANDINAVIAN STUDIO LOUNGE
    // -------------------------------------------------------------
    // Clean tailored 2-seater loveseat
    const loveseat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.55, 4.5), mats.sofaFabricMat);
    loveseat.position.set(-1.8, 0.5, 0);
    loveseat.castShadow = true;
    group.add(loveseat);

    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.3, 4.5), mats.sofaFabricMat);
    backrest.position.set(-2.8, 1.2, 0);
    group.add(backrest);

    // Slim oak media bench
    const bench = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 4.5), mats.woodMat);
    bench.position.set(2.6, 0.5, 0);
    group.add(bench);

    // Slim TV on wall
    const wallTv = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.2, 3.8), mats.screenMat);
    wallTv.position.set(2.9, 3.8, 0);
    group.add(wallTv);

    // Nesting coffee tables
    const tableA = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.1, 20), mats.woodMat);
    tableA.position.set(0.2, 0.85, -0.6);
    group.add(tableA);

    const tableB = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 20), mats.whiteMat);
    tableB.position.set(0.6, 0.7, 0.8);
    group.add(tableB);

  } else {
    // -------------------------------------------------------------
    // OPEN GREAT ROOM LOUNGE (Matching Image 1: 3-Seater Sofa, Oval Coffee Table, Armchair, Media Console)
    // -------------------------------------------------------------
    // Large Textured Living Room Rug anchoring the lounge seating area (matching reference image)
    const livingRugGeo = new THREE.BoxGeometry(6.6, 0.04, Math.min(roomDepth - 0.6, 8.0));
    const livingRugMat = new THREE.MeshStandardMaterial({
      color: palette.rug,
      roughness: 0.95,
      metalness: 0.02,
    });
    const livingRug = new THREE.Mesh(livingRugGeo, livingRugMat);
    livingRug.position.set(0.4, 0.02, -roomDepth / 2 + 2.0);
    livingRug.receiveShadow = true;
    group.add(livingRug);

    // Modern 3-Seater Plush Sofa with deep cushions along the North wall
    const sofaW = Math.min(roomDepth - 1.2, 6.8);
    const sofaGroup = new THREE.Group();
    sofaGroup.position.set(-1.8, 0, -roomDepth / 2 + 1.8);

    // Sofa Base Plinth
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, sofaW), mats.sofaFabricMat);
    sofaBase.position.set(0, 0.25, 0);
    sofaBase.castShadow = true;
    sofaGroup.add(sofaBase);

    // Deep Seat Cushions (3 cushions)
    const cushionW = (sofaW - 0.2) / 3;
    for (let c = 0; c < 3; c++) {
      const cz = -sofaW / 2 + cushionW / 2 + 0.1 + c * cushionW;
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, cushionW - 0.08), mats.sofaFabricMat);
      cushion.position.set(0.05, 0.58, cz);
      cushion.castShadow = true;
      sofaGroup.add(cushion);
    }

    // High Ergonomic Backrest
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.45, sofaW), mats.sofaFabricMat);
    sofaBack.position.set(-0.95, 1.15, 0);
    sofaBack.castShadow = true;
    sofaGroup.add(sofaBack);

    // Dual Armrests
    [-sofaW / 2 + 0.2, sofaW / 2 - 0.2].forEach((az) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.9, 0.35), mats.sofaFabricMat);
      arm.position.set(0, 0.7, az);
      arm.castShadow = true;
      sofaGroup.add(arm);
    });

    // Toss Pillows
    [-sofaW / 3, 0, sofaW / 3].forEach((pz, i) => {
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.8), mats.pillowMat);
      pillow.position.set(-0.6, 1.05, pz);
      pillow.rotation.y = (i === 1 ? 0 : 0.2);
      pillow.rotation.z = -0.15;
      pillow.castShadow = true;
      sofaGroup.add(pillow);
    });
    group.add(sofaGroup);

    // Scandinavian Organic Oval Coffee Table
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0.6, 0, -roomDepth / 2 + 2.2);

    const ctTop = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.1, 24), mats.woodMat);
    ctTop.scale.set(1.45, 1.0, 0.95);
    ctTop.position.set(0, 0.8, 0);
    ctTop.castShadow = true;
    tableGroup.add(ctTop);

    // Coffee table slim legs
    const ctLegGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.75, 8);
    [
      [-1.2, 0.38, 0.6],
      [1.2, 0.38, 0.6],
      [-1.2, 0.38, -0.6],
      [1.2, 0.38, -0.6],
    ].forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(ctLegGeo, mats.steelMat);
      leg.position.set(lx, ly, lz);
      tableGroup.add(leg);
    });

    // Table Accessories: Art Book and Ceramic Mug
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.6), mats.whiteMat);
    book.position.set(-0.3, 0.88, 0.1);
    book.rotation.y = 0.2;
    tableGroup.add(book);

    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.22, 10), mats.whiteMat);
    mug.position.set(0.5, 0.95, -0.2);
    tableGroup.add(mug);
    group.add(tableGroup);

    // Modern Scandinavian Oak Accent Armchair (Facing sofa)
    const chairGroup = new THREE.Group();
    chairGroup.position.set(2.4, 0, -roomDepth / 2 + 2.0);
    chairGroup.rotation.y = -Math.PI * 0.75;

    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 1.6), mats.woodMat);
    chairSeat.position.set(0, 0.65, 0);
    chairSeat.castShadow = true;
    chairGroup.add(chairSeat);

    const chairCushion = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.22, 1.45), mats.whiteMat);
    chairCushion.position.set(0, 0.88, 0);
    chairGroup.add(chairCushion);

    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 1.45), mats.woodMat);
    chairBack.position.set(-0.7, 1.35, 0);
    chairBack.rotation.z = -0.15;
    chairGroup.add(chairBack);

    [
      [-0.6, 0.32, 0.6],
      [0.6, 0.32, 0.6],
      [-0.6, 0.32, -0.6],
      [0.6, 0.32, -0.6],
    ].forEach(([cx, cy, cz]) => {
      const leg = new THREE.Mesh(ctLegGeo, mats.steelMat);
      leg.position.set(cx, cy, cz);
      chairGroup.add(leg);
    });
    group.add(chairGroup);

    // Low Media Console Credenza along the wall
    const credenzaW = Math.min(roomDepth - 1.5, 6.0);
    const credenza = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, credenzaW), mats.woodMat);
    credenza.position.set(3.4, 0.6, 0);
    credenza.castShadow = true;
    group.add(credenza);

    // OLED TV mounted on wall above credenza
    const tv = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.6, 4.6), mats.screenMat);
    tv.position.set(3.4, 3.8, 0);
    group.add(tv);

    // Floor Plant
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.4, 1.2, 16), mats.whiteMat);
    pot.position.set(2.8, 0.6, roomDepth / 2 - 1.2);
    group.add(pot);

    const foliage = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 8), mats.plantGreenMat);
    foliage.position.set(2.8, 1.9, roomDepth / 2 - 1.2);
    group.add(foliage);
  }

  return group;
}

/**
 * 2. KITCHEN BUILDER:
 * Supports Chef Island Kitchen, Galley Kitchen, Breakfast-Bar Peninsula,
 * Linear Minimalist Kitchenette, and Micro Espresso/Cocktail Bar.
 */
function buildKitchenFurniture(
  type: KitchenType = 'chef-island',
  _palette: ReturnType<typeof getStylePalette>,
  mats: ReturnType<typeof createInteriorMaterials>,
  roomDepth: number
): THREE.Group {
  const group = new THREE.Group();
  group.name = `kitchen-${type}`;
  group.userData.interiorRoom = 'kitchen';
  group.userData.roomDepthFt = roomDepth;
  const halfD = roomDepth / 2;

  // 1. Full-Height Stainless Steel French Door Refrigerator Tower
  const fridgeGroup = new THREE.Group();
  fridgeGroup.position.set(-3.2, 3.2, -halfD + 1.25);
  const fridgeBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 6.4, 2.2), mats.steelMat);
  fridgeBody.castShadow = true;
  fridgeGroup.add(fridgeBody);

  // Refrigerator French Doors split line & handles
  const handleL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), mats.chromeMat);
  handleL.position.set(-0.15, 0.6, 1.15);
  fridgeGroup.add(handleL);
  const handleR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), mats.chromeMat);
  handleR.position.set(0.15, 0.6, 1.15);
  fridgeGroup.add(handleR);
  // Bottom freezer drawer handle
  const freezerHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8), mats.chromeMat);
  freezerHandle.position.set(0, -1.6, 1.15);
  freezerHandle.rotation.z = Math.PI / 2;
  fridgeGroup.add(freezerHandle);
  group.add(fridgeGroup);

  // 2. Built-In Wall Oven & Microwave Tower
  const ovenTower = new THREE.Group();
  ovenTower.position.set(3.2, 3.2, -halfD + 1.25);
  const ovenCabinet = new THREE.Mesh(new THREE.BoxGeometry(2.2, 6.4, 2.2), mats.cabinetMat);
  ovenCabinet.castShadow = true;
  ovenTower.add(ovenCabinet);

  // Lower Oven & Upper Microwave glass panels
  [-0.6, 1.0].forEach((oy) => {
    const ovenGlass = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.08), mats.screenMat);
    ovenGlass.position.set(0, oy, 1.12);
    ovenTower.add(ovenGlass);

    const ovenBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8), mats.chromeMat);
    ovenBar.position.set(0, oy + 0.45, 1.18);
    ovenBar.rotation.z = Math.PI / 2;
    ovenTower.add(ovenBar);
  });
  group.add(ovenTower);

  // 3. Main Countertop Run (between fridge and oven tower)
  const counterW = 4.2;
  const backCounter = new THREE.Mesh(new THREE.BoxGeometry(counterW, 2.8, 2.0), mats.cabinetMat);
  backCounter.position.set(0, 1.4, -halfD + 1.1);
  backCounter.castShadow = true;
  group.add(backCounter);

  const backCounterTop = new THREE.Mesh(new THREE.BoxGeometry(counterW + 0.1, 0.12, 2.1), mats.marbleMat);
  backCounterTop.position.set(0, 2.85, -halfD + 1.1);
  group.add(backCounterTop);

  // Undermount Double-Bowl Stainless Sink
  const sink = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 1.2), mats.steelMat);
  sink.position.set(-0.8, 2.86, -halfD + 1.1);
  group.add(sink);

  // High-Arc Chrome Gooseneck Faucet with Pull-Down Sprayer
  const faucetBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.4, 12), mats.chromeMat);
  faucetBase.position.set(-0.8, 3.05, -halfD + 0.45);
  group.add(faucetBase);
  const faucetNeck = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.035, 8, 16, Math.PI), mats.chromeMat);
  faucetNeck.position.set(-0.8, 3.5, -halfD + 0.7);
  faucetNeck.rotation.y = Math.PI / 2;
  group.add(faucetNeck);

  // Countertop Accessories: Italian Espresso Machine
  const espressoGroup = new THREE.Group();
  espressoGroup.position.set(1.2, 3.3, -halfD + 1.1);
  const espressoBody = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.9, 0.8), mats.steelMat);
  espressoBody.castShadow = true;
  espressoGroup.add(espressoBody);
  const portafilter = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8), mats.chromeMat);
  portafilter.position.set(0, -0.15, 0.45);
  portafilter.rotation.x = Math.PI / 2;
  espressoGroup.add(portafilter);
  group.add(espressoGroup);

  // End-Grain Wooden Butcher Cutting Board with Chef's Knife
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.9), mats.woodMat);
  board.position.set(0.3, 2.92, -halfD + 1.15);
  group.add(board);
  const knife = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.02, 0.08), mats.steelMat);
  knife.position.set(0.3, 2.98, -halfD + 1.15);
  knife.rotation.y = 0.3;
  group.add(knife);

  // Floating Upper Display Shelving with Ambient Warm LED Glow
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(counterW, 0.1, 1.0), mats.woodMat);
  shelf.position.set(0, 5.0, -halfD + 0.6);
  group.add(shelf);
  const shelfLight = new THREE.PointLight(0xffedd5, 0.7, 5);
  shelfLight.position.set(0, 4.8, -halfD + 0.8);
  group.add(shelfLight);

  // Ceramic Fruit Bowl with Fresh Fruit
  const fruitBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.25, 0.25, 16), mats.whiteMat);
  fruitBowl.position.set(-1.6, 3.0, -halfD + 1.1);
  group.add(fruitBowl);
  [
    [-1.6, 3.2, -halfD + 1.1, 0x2d6a4f], // Green apple
    [-1.5, 3.22, -halfD + 1.0, 0xd90429], // Red apple
    [-1.7, 3.2, -halfD + 1.05, 0xf77f00], // Orange
  ].forEach(([fx, fy, fz, fcol]) => {
    const fruit = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshStandardMaterial({ color: fcol as number, roughness: 0.6 })
    );
    fruit.position.set(fx as number, fy as number, fz as number);
    group.add(fruit);
  });

  // 4. Chef Island, Galley, Breakfast Bar, or Linear Minimal
  if (type === 'chef-island') {
    const islandW = 5.6;
    const island = new THREE.Mesh(new THREE.BoxGeometry(islandW, 2.8, 2.4), mats.marbleMat);
    island.position.set(0, 1.4, 0.5);
    island.castShadow = true;
    group.add(island);

    // 4-Burner Induction Hob on Island
    const cooktop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 1.4), mats.steelMat);
    cooktop.position.set(0, 2.84, 0.5);
    group.add(cooktop);

    // Illuminated induction rings
    [-0.6, 0.6].forEach((rx) => {
      [-0.35, 0.35].forEach((rz) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.015, 8, 16), mats.flameMat);
        ring.position.set(rx, 2.865, 0.5 + rz);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
      });
    });

    // Ceiling-Mounted Stainless Island Extractor Range Hood
    const hoodGroup = new THREE.Group();
    hoodGroup.position.set(0, 6.2, 0.5);
    const hoodFlue = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 1.0), mats.steelMat);
    hoodFlue.position.y = 0.5;
    hoodGroup.add(hoodFlue);
    const hoodCanopy = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.35, 1.8), mats.steelMat);
    hoodCanopy.position.y = -0.7;
    hoodGroup.add(hoodCanopy);
    const hoodSpot = new THREE.PointLight(0xffffff, 0.8, 4);
    hoodSpot.position.set(0, -0.9, 0);
    hoodGroup.add(hoodSpot);
    group.add(hoodGroup);

    // 3 Modern Barstools at Island Overhang
    [-1.8, 0, 1.8].forEach((bx) => {
      const stool = new THREE.Group();
      stool.position.set(bx, 0, 2.2);

      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 16), mats.woodMat);
      seat.position.y = 2.1;
      seat.castShadow = true;
      stool.add(seat);

      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 8), mats.steelMat);
      leg.position.y = 1.0;
      stool.add(leg);

      group.add(stool);
    });
  } else if (type === 'galley') {
    // Parallel Galley Prep Counter along opposite corridor
    const galleyPrep = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.8, 2.0), mats.cabinetMat);
    galleyPrep.position.set(0, 1.4, 1.4);
    galleyPrep.castShadow = true;
    group.add(galleyPrep);

    const galleyTop = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.15, 2.1), mats.marbleMat);
    galleyTop.position.set(0, 2.85, 1.4);
    group.add(galleyTop);

    // Espresso Machine & Coffee Accessories
    const espresso = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 0.9), mats.steelMat);
    espresso.position.set(-1.4, 3.4, 1.4);
    group.add(espresso);

    // Twin Ceramic Mugs
    [-0.5, -0.1].forEach((mx) => {
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 12), mats.whiteMat);
      mug.position.set(mx, 3.0, 1.4);
      group.add(mug);
    });
  } else if (type === 'linear-minimal') {
    // Floating Oak Open Display Shelf above main counter
    const openShelf = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.12, 0.9), mats.woodMat);
    openShelf.position.set(0, 5.0, -halfD + 1.2);
    openShelf.castShadow = true;
    group.add(openShelf);

    // Warm under-shelf ambient LED strip
    const ledStrip = new THREE.PointLight(0xffecd2, 0.8, 6.0);
    ledStrip.position.set(0, 4.85, -halfD + 1.2);
    group.add(ledStrip);

    // Ceramic canisters on shelf
    [-1.6, -0.6, 0.6, 1.6].forEach((cx) => {
      const canister = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.5, 12), mats.whiteMat);
      canister.position.set(cx, 5.35, -halfD + 1.2);
      group.add(canister);
    });
  } else {
    // Peninsula Breakfast Bar
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.8, 3.6), mats.cabinetMat);
    bar.position.set(1.5, 1.4, 0.2);
    bar.castShadow = true;
    group.add(bar);

    const barTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 3.8), mats.woodMat);
    barTop.position.set(1.5, 2.85, 0.2);
    group.add(barTop);

    [-0.9, 0.9].forEach((bz) => {
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16), mats.woodMat);
      seat.position.set(3.0, 2.1, bz);
      seat.castShadow = true;
      group.add(seat);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 8), mats.steelMat);
      leg.position.set(3.0, 1.0, bz);
      group.add(leg);
    });
  }

  return group;
}

/**
 * 3. BATHROOM BUILDER:
 * Features Modern Sculptural Soak Tub, Designer Floating Vanity & Vessel Washbasin,
 * Modern Commode (Toilet), Frameless Glass Rain Shower, and Zero-Overlap Circulation.
 */
function buildBathroomFurniture(
  type: BathroomType = 'luxury-spa',
  _palette: ReturnType<typeof getStylePalette>,
  mats: ReturnType<typeof createInteriorMaterials>,
  roomWidth: number,
  roomDepth: number,
  clearH: number,
  modelConfig?: ContainerModelConfig
): THREE.Group {
  const group = new THREE.Group();
  group.name = `bathroom-${type}`;
  group.userData.interiorRoom = 'bathroom';
  group.userData.roomWidthFt = roomWidth;
  group.userData.roomDepthFt = roomDepth;

  const halfW = roomWidth / 2;
  const halfD = roomDepth / 2;

  const toiletType = modelConfig?.washroomToiletType || (type === 'powder-room' ? 'wall-hung-rimless' : 'western-commode');
  const wetType = modelConfig?.washroomWetType || (type === 'luxury-spa' ? 'shower-tub-combo' : (type === 'nordic-wetroom' ? 'walk-in-shower' : 'bathtub'));

  // -------------------------------------------------------------------------
  // FIXTURE 1: DESIGNER FLOATING VANITY & CERAMIC WASHBASIN (West Wall / North West)
  // -------------------------------------------------------------------------
  const vanityGroup = new THREE.Group();
  vanityGroup.position.set(-halfW + 1.8, 1.6, -halfD + 1.1);

  // Floating Oak / Walnut Vanity Cabinet with Soft-Close Drawers
  const vanityBox = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 1.8), mats.woodMat);
  vanityBox.castShadow = true;
  vanityGroup.add(vanityBox);

  // White Ceramic Vessel Washbasin Bowl
  const vesselBasin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 1.2), mats.whiteMat);
  vesselBasin.position.set(0, 0.82, 0);
  vesselBasin.castShadow = true;
  vanityGroup.add(vesselBasin);

  // High-Arc Chrome Washbasin Mixer Tap with Lever
  const basinFaucet = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), mats.chromeMat);
  basinFaucet.position.set(0, 1.35, -0.45);
  vanityGroup.add(basinFaucet);
  const faucetSpout = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.3), mats.chromeMat);
  faucetSpout.position.set(0, 1.65, -0.32);
  vanityGroup.add(faucetSpout);

  // Backlit Round LED Halo Vanity Mirror mounted on wall
  const mirror = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.06, 24), mats.chromeMat);
  mirror.position.set(0, 2.7, -0.85);
  mirror.rotation.x = Math.PI / 2;
  vanityGroup.add(mirror);

  const mirrorGlow = new THREE.PointLight(0xfff1e6, 0.9, 4.5);
  mirrorGlow.position.set(0, 2.7, -0.5);
  vanityGroup.add(mirrorGlow);

  // Countertop Soap Dispenser & Folded Hand Towel
  const soapDispenser = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 12), mats.chromeMat);
  soapDispenser.position.set(0.9, 0.75, 0.2);
  vanityGroup.add(soapDispenser);

  const handTowel = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.45), mats.whiteMat);
  handTowel.position.set(-0.9, 0.65, 0.2);
  vanityGroup.add(handTowel);

  group.add(vanityGroup);

  // -------------------------------------------------------------------------
  // FIXTURE 2: COMMODE / WC / TOILET (Central North Privacy Zone)
  // -------------------------------------------------------------------------
  const commodeGroup = new THREE.Group();
  commodeGroup.position.set(0.1, 0.8, -halfD + 1.1);

  if (toiletType === 'western-commode') {
    // A. CLASSIC WESTERN COMMODE (Floor-mounted with close-coupled porcelain tank)
    const basePedestal = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.2, 1.8), mats.whiteMat);
    basePedestal.castShadow = true;
    commodeGroup.add(basePedestal);

    const closeCoupledTank = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.7), mats.whiteMat);
    closeCoupledTank.position.set(0, 0.8, -0.55);
    closeCoupledTank.castShadow = true;
    commodeGroup.add(closeCoupledTank);

    const tankLid = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.08, 0.76), mats.whiteMat);
    tankLid.position.set(0, 1.54, -0.55);
    commodeGroup.add(tankLid);

    // Chrome Dual Flush Push Buttons on top of tank
    const flushBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 12), mats.chromeMat);
    flushBtn.position.set(0, 1.6, -0.55);
    commodeGroup.add(flushBtn);

    const softSeat = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.08, 1.2), mats.whiteMat);
    softSeat.position.set(0, 0.64, 0.25);
    commodeGroup.add(softSeat);
  } else if (toiletType === 'smart-bidet-wc') {
    // B. LUXURY SMART BIDET COMMODE (Japanese heated seat with LED nightlight)
    const bidetGeo = new THREE.CylinderGeometry(0.7, 0.55, 1.3, 20);
    bidetGeo.scale(0.9, 1.0, 1.25);
    const bidetBody = new THREE.Mesh(bidetGeo, mats.whiteMat);
    bidetBody.position.set(0, 0, 0);
    bidetBody.castShadow = true;
    commodeGroup.add(bidetBody);

    const bidetSeat = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.1, 1.55), mats.whiteMat);
    bidetSeat.position.set(0, 0.68, 0.05);
    commodeGroup.add(bidetSeat);

    // Side control console
    const sideWand = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.6), mats.chromeMat);
    sideWand.position.set(0.78, 0.65, 0.1);
    commodeGroup.add(sideWand);

    // Ambient Cyan Nightlight glow
    const bidetGlow = new THREE.PointLight(0x00f0ff, 0.6, 3);
    bidetGlow.position.set(0, 0.1, 0.2);
    commodeGroup.add(bidetGlow);
  } else {
    // C. WALL-HUNG RIMLESS WC (In-wall cistern with suspended bowl)
    const suspendedBowl = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.95, 1.6), mats.whiteMat);
    suspendedBowl.position.set(0, 0.35, 0.1);
    suspendedBowl.castShadow = true;
    commodeGroup.add(suspendedBowl);

    const seatLid = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 1.65), mats.whiteMat);
    seatLid.position.set(0, 0.85, 0.1);
    commodeGroup.add(seatLid);

    // In-Wall Concealed Cistern Cabinet & Dual-Flush Chrome Actuator Plate
    const cisternWall = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.6, 0.25), mats.wallMat);
    cisternWall.position.set(0, 0.8, -0.85);
    commodeGroup.add(cisternWall);

    const flushPlate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.05), mats.chromeMat);
    flushPlate.position.set(0, 1.5, -0.7);
    commodeGroup.add(flushPlate);
  }

  // Chrome Toilet Paper Roll Holder
  const tpHolder = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8), mats.chromeMat);
  tpHolder.position.set(0.95, 0.6, 0);
  tpHolder.rotation.z = Math.PI / 2;
  commodeGroup.add(tpHolder);
  const tpRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.35, 12), mats.whiteMat);
  tpRoll.position.set(0.95, 0.6, 0);
  tpRoll.rotation.z = Math.PI / 2;
  commodeGroup.add(tpRoll);

  group.add(commodeGroup);

  // -------------------------------------------------------------------------
  // FIXTURE 3: BATHING WET ZONE (BATHTUB, WALK-IN SHOWER, OR COMBO)
  // -------------------------------------------------------------------------
  const showTub = (wetType === 'bathtub' || wetType === 'shower-tub-combo') && type !== 'powder-room';
  const showShower = (wetType === 'walk-in-shower' || wetType === 'shower-tub-combo') && type !== 'powder-room';

  if (showTub) {
    const tubGroup = new THREE.Group();
    tubGroup.position.set(halfW - 2.1, 0.8, -halfD + 1.7);

    // Ergonomic Double-Ended Oval Soaking Tub
    const tubOuter = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.15, 1.6, 24), mats.whiteMat);
    tubOuter.scale.set(1.45, 1.0, 0.95);
    tubOuter.castShadow = true;
    tubGroup.add(tubOuter);

    // Tub Interior Hollow Rim
    const tubInner = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.0, 1.45, 20), mats.whiteMat);
    tubInner.position.y = 0.1;
    tubInner.scale.set(1.4, 1.0, 0.9);
    tubGroup.add(tubInner);

    // Floor-Mounted Tall Chrome Tub Filler Faucet with Hand Shower Wand
    const fillerStand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 12), mats.chromeMat);
    fillerStand.position.set(1.45, 0.45, 0);
    tubGroup.add(fillerStand);

    const fillerSpout = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.08), mats.chromeMat);
    fillerSpout.position.set(1.25, 1.7, 0);
    tubGroup.add(fillerSpout);

    const handShower = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), mats.chromeMat);
    handShower.position.set(1.45, 1.2, 0.2);
    tubGroup.add(handShower);

    group.add(tubGroup);
  }

  if (showShower) {
    const showerGroup = new THREE.Group();
    showerGroup.position.set(halfW - 0.2, 0, -halfD + 1.7);

    // Frameless architectural glass screen partition
    const glassScreen = new THREE.Mesh(new THREE.BoxGeometry(0.08, clearH - 0.6, 2.8), mats.glassMat);
    glassScreen.position.set(-3.2, clearH / 2, 0);
    showerGroup.add(glassScreen);

    // Matte Black / Chrome Rainfall Ceiling Showerhead
    const rainPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), mats.steelMat);
    rainPipe.position.set(-1.6, clearH - 0.8, 0);
    showerGroup.add(rainPipe);

    const rainHead = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 16), mats.steelMat);
    rainHead.position.set(-1.6, clearH - 1.4, 0);
    showerGroup.add(rainHead);

    // Stainless Linear Floor Trench Drain
    const floorDrain = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 2.2), mats.steelMat);
    floorDrain.position.set(-1.6, 0.02, 0);
    showerGroup.add(floorDrain);

    // Wall-recessed shampoo niche
    const nicheFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 1.0), mats.tileMat);
    nicheFrame.position.set(0, 3.8, 0);
    showerGroup.add(nicheFrame);

    group.add(showerGroup);
  }

  return group;
}

/**
 * 4. BEDROOM BUILDER:
 * Supports Master King Suite with Walkway Clearance from Corridor Door,
 * Japandi Tatami Platform, Executive Bed & Study Suite, Architectural Dual Bunks,
 * and completely unobstructed doorway zones.
 */
function buildBedroomFurniture(
  type: BedroomType = 'master-suite',
  palette: ReturnType<typeof getStylePalette>,
  mats: ReturnType<typeof createInteriorMaterials>,
  roomWidth: number,
  roomDepth: number,
  clearH: number
): THREE.Group {
  const group = new THREE.Group();
  group.name = `bedroom-${type}`;
  group.userData.interiorRoom = 'bedroom';
  group.userData.roomWidthFt = roomWidth;
  group.userData.roomDepthFt = roomDepth;

  const halfW = roomWidth / 2;
  const halfD = roomDepth / 2;

  if (type === 'dual-bunk') {
    // Bunk beds placed against the West end wall
    const bunkGroup = new THREE.Group();
    bunkGroup.position.set(-halfW + 2.0, 0.2, -halfD + 2.0);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 6.2, 6.4), mats.woodMat);
    frame.position.set(0, 3.1, 0);
    frame.castShadow = true;
    bunkGroup.add(frame);

    const lowerMattress = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.7, 6.0), mats.whiteMat);
    lowerMattress.position.set(0, 1.2, 0);
    bunkGroup.add(lowerMattress);

    const upperMattress = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.7, 6.0), mats.whiteMat);
    upperMattress.position.set(0, 4.4, 0);
    bunkGroup.add(upperMattress);

    group.add(bunkGroup);

  } else if (type === 'japandi-platform') {
    // Low-profile Japanese Tatami Platform against West wall
    const platform = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.35, 6.4), mats.woodMat);
    platform.position.set(-halfW + 3.6, 0.18, -0.4);
    platform.castShadow = true;
    group.add(platform);

    const mattress = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.6, 5.6), mats.whiteMat);
    mattress.position.set(-halfW + 3.6, 0.65, -0.4);
    group.add(mattress);

    const duvet = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.25, 4.2), mats.blanketMat);
    duvet.position.set(-halfW + 3.8, 0.95, -0.4);
    group.add(duvet);

    // Shoji Screen accent on North rear wall
    const shoji = new THREE.Mesh(new THREE.BoxGeometry(5.0, 5.5, 0.08), mats.frostedGlassMat);
    shoji.position.set(-halfW + 3.6, 2.8, -halfD + 0.3);
    group.add(shoji);

  } else if (type === 'executive-study' || type === 'desk-study') {
    // -------------------------------------------------------------
    // EXECUTIVE STUDY & DAYBED SUITE
    // -------------------------------------------------------------
    // 1. Executive Solid Wood Writing Desk along West end wall
    const deskGroup = new THREE.Group();
    deskGroup.position.set(-halfW + 2.0, 0, 0);

    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.15, 5.2), mats.woodMat);
    deskTop.position.set(0, 2.4, 0);
    deskTop.castShadow = true;
    deskGroup.add(deskTop);

    // Sleek Steel Desk Trestle Legs
    [-1.2, 1.2].forEach((lx) => {
      [-2.2, 2.2].forEach((lz) => {
        const dleg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 8), mats.steelMat);
        dleg.position.set(lx, 1.15, lz);
        deskGroup.add(dleg);
      });
    });

    // Laptop on Desk
    const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.8), mats.steelMat);
    laptopBase.position.set(0, 2.5, 0);
    deskGroup.add(laptopBase);
    const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.04), mats.screenMat);
    laptopScreen.position.set(-0.2, 2.85, 0);
    laptopScreen.rotation.z = -0.15;
    deskGroup.add(laptopScreen);

    // Architectural Desk Lamp with Warm Task Glow
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 12), mats.goldBrassMat);
    lampBase.position.set(-0.8, 2.5, 1.8);
    deskGroup.add(lampBase);
    const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), mats.goldBrassMat);
    lampArm.position.set(-0.8, 2.9, 1.8);
    deskGroup.add(lampArm);
    const lampHead = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 12), mats.goldBrassMat);
    lampHead.position.set(-0.6, 3.3, 1.8);
    lampHead.rotation.z = -0.5;
    deskGroup.add(lampHead);
    const taskLight = new THREE.PointLight(0xfff1e6, 0.8, 4.0);
    taskLight.position.set(-0.5, 3.1, 1.8);
    deskGroup.add(taskLight);

    // Ergonomic Swivel Chair
    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 1.6), mats.bedMat);
    chairSeat.position.set(1.6, 1.5, 0);
    chairSeat.castShadow = true;
    deskGroup.add(chairSeat);
    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.6, 1.5), mats.bedMat);
    chairBack.position.set(2.3, 2.2, 0);
    deskGroup.add(chairBack);
    const chairPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8), mats.chromeMat);
    chairPedestal.position.set(1.6, 0.7, 0);
    deskGroup.add(chairPedestal);

    // Floating Bookshelves on North rear wall
    [4.0, 5.2].forEach((sy) => {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 4.2), mats.woodMat);
      shelf.position.set(0, sy, -halfD + 1.2);
      deskGroup.add(shelf);
    });

    group.add(deskGroup);

    // 2. Twin Daybed along East/South corner for relaxing & rest
    const daybedLength = 6.2;
    const daybedWidth = 3.6;
    const daybed = new THREE.Mesh(new THREE.BoxGeometry(daybedLength, 0.45, daybedWidth), mats.woodMat);
    daybed.position.set(halfW - daybedLength / 2 - 0.4, 0.25, -0.4);
    daybed.castShadow = true;
    group.add(daybed);

    const daybedMattress = new THREE.Mesh(new THREE.BoxGeometry(daybedLength - 0.2, 0.55, daybedWidth - 0.2), mats.whiteMat);
    daybedMattress.position.set(halfW - daybedLength / 2 - 0.4, 0.75, -0.4);
    group.add(daybedMattress);

    const daybedBlanket = new THREE.Mesh(new THREE.BoxGeometry(daybedLength * 0.6, 0.15, daybedWidth - 0.1), mats.blanketMat);
    daybedBlanket.position.set(halfW - daybedLength * 0.4, 1.05, -0.4);
    group.add(daybedBlanket);

    // Plush throw pillows
    [-1.2, 0, 1.2].forEach((pz) => {
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.7, 0.8), mats.pillowMat);
      pillow.position.set(halfW - daybedLength / 2 - 0.4, 1.2, -0.4 + pz);
      pillow.rotation.y = 0.1;
      group.add(pillow);
    });

    // Woven Rug under daybed
    const sRug = new THREE.Mesh(new THREE.BoxGeometry(daybedLength + 1.5, 0.03, daybedWidth + 1.5), new THREE.MeshStandardMaterial({ color: palette.rug, roughness: 0.95 }));
    sRug.position.set(halfW - daybedLength / 2 - 0.4, 0.02, -0.4);
    group.add(sRug);

  } else {
    // -------------------------------------------------------------
    // PRIMARY MASTER KING SUITE (Photorealistic Bedding, Rug, Lamps, Curtains & Plant)
    // -------------------------------------------------------------
    // 1. Large Textured Bedroom Area Rug underneath bed
    const rugLength = 8.5;
    const rugWidth = 7.0;
    const bedLength = 6.6;
    const bedWidth = 5.8;
    const bedCenterX = -halfW + 0.4 + bedLength / 2;
    const bedCenterZ = -0.3; // Centered slightly towards rear, leaving wide South walkway

    const bedRugGeo = new THREE.BoxGeometry(rugLength, 0.04, rugWidth);
    const bedRugMat = new THREE.MeshStandardMaterial({
      color: palette.rug,
      roughness: 0.95,
      metalness: 0.02,
    });
    const bedRug = new THREE.Mesh(bedRugGeo, bedRugMat);
    bedRug.position.set(bedCenterX + 0.5, 0.03, bedCenterZ);
    bedRug.receiveShadow = true;
    group.add(bedRug);

    // 2. King Platform Bed - Warm Scandinavian Oak Plinth with Floating Shadow Reveal
    const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(bedLength, 0.5, bedWidth), mats.woodMat);
    bedFrame.position.set(bedCenterX, 0.25, bedCenterZ);
    bedFrame.castShadow = true;
    group.add(bedFrame);

    const bedPlinth = new THREE.Mesh(new THREE.BoxGeometry(bedLength - 1.2, 0.18, bedWidth - 1.2), mats.steelMat);
    bedPlinth.position.set(bedCenterX, 0.09, bedCenterZ);
    group.add(bedPlinth);

    // 3. Architectural Channeled Upholstered Headboard against West wall with soft rounded upper contour
    const headboardWidth = bedWidth + 0.9;
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.4, headboardWidth), mats.bedMat);
    headboard.position.set(-halfW + 0.3, 1.7, bedCenterZ);
    headboard.castShadow = true;
    group.add(headboard);

    // Headboard Vertical Channel Flutes for rich acoustic shadow depth
    const channelCount = 7;
    const channelSpacing = (headboardWidth - 0.6) / (channelCount - 1);
    for (let c = 0; c < channelCount; c++) {
      const cz = bedCenterZ - headboardWidth / 2 + 0.3 + c * channelSpacing;
      const channel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 0.08), mats.steelMat);
      channel.position.set(-halfW + 0.46, 1.7, cz);
      group.add(channel);
    }

    // 4. Pillow-Top Mattress with Crisp White Egyptian Cotton Bedding
    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(bedLength - 0.3, 0.9, bedWidth - 0.3),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 })
    );
    mattress.position.set(bedCenterX + 0.05, 0.9, bedCenterZ);
    mattress.castShadow = true;
    group.add(mattress);

    // 5. Folded Duvet with Rich Organic Creases
    const duvet = new THREE.Mesh(
      new THREE.BoxGeometry(bedLength * 0.68, 0.4, bedWidth - 0.2),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.88 })
    );
    duvet.position.set(bedCenterX + 0.85, 1.3, bedCenterZ);
    duvet.castShadow = true;
    group.add(duvet);

    // Top Sheet Turnover Cuff (crisp fold line at head)
    const sheetCuff = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.12, bedWidth - 0.25),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 })
    );
    sheetCuff.position.set(bedCenterX - 1.25, 1.36, bedCenterZ);
    group.add(sheetCuff);

    // 6. Casual Draped Luxury Throw Blanket (Cashmere / Woven Wool) folded diagonally across foot
    const throwBlanket = new THREE.Mesh(
      new THREE.BoxGeometry(bedLength * 0.42, 0.18, bedWidth - 0.1),
      mats.blanketMat
    );
    throwBlanket.position.set(bedCenterX + 1.85, 1.5, bedCenterZ + 0.15);
    throwBlanket.rotation.y = 0.08;
    throwBlanket.castShadow = true;
    group.add(throwBlanket);

    // Throw Blanket Side Drape Cascade (spilling softly over mattress edge)
    const sideCascade = new THREE.Mesh(
      new THREE.BoxGeometry(bedLength * 0.35, 0.65, 0.14),
      mats.blanketMat
    );
    sideCascade.position.set(bedCenterX + 1.85, 1.15, bedCenterZ + bedWidth / 2 - 0.1);
    sideCascade.castShadow = true;
    group.add(sideCascade);

    // 7. Layered Sleeping Pillows & Accent Throw Cushions
    // Row 1: Large Euro Shams angled against headboard
    [-1.6, 1.6].forEach((pz) => {
      const euroSham = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, 1.9), mats.bedMat);
      euroSham.position.set(-halfW + 0.95, 1.7, bedCenterZ + pz);
      euroSham.rotation.z = -0.22;
      euroSham.castShadow = true;
      group.add(euroSham);
    });

    // Row 2: Crisp White Standard Sleeping Pillows
    [-1.5, 1.5].forEach((pz) => {
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 1.9), mats.whiteMat);
      pillow.position.set(-halfW + 1.6, 1.45, bedCenterZ + pz);
      pillow.rotation.z = -0.12;
      pillow.castShadow = true;
      group.add(pillow);
    });

    // Row 3: Accent Toss Cushions (Terracotta / Charcoal)
    [-0.9, 0.9].forEach((pz, i) => {
      const tossPillow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 1.0), mats.pillowMat);
      tossPillow.position.set(-halfW + 2.2, 1.5, bedCenterZ + pz);
      tossPillow.rotation.y = (i === 0 ? 0.25 : -0.25);
      tossPillow.rotation.z = -0.25;
      tossPillow.castShadow = true;
      group.add(tossPillow);
    });

    // 8. Dual Matching Scandinavian Oak Floating Nightstands with Fluted Face
    [-bedWidth / 2 - 0.85, bedWidth / 2 + 0.85].forEach((nz) => {
      const ns = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.65, 1.3), mats.woodMat);
      ns.position.set(-halfW + 1.05, 1.0, bedCenterZ + nz);
      ns.castShadow = true;
      group.add(ns);

      // Drawer handle
      const nsHandle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.5), mats.goldBrassMat);
      nsHandle.position.set(-halfW + 1.82, 1.0, bedCenterZ + nz);
      group.add(nsHandle);

      // Modern Ceramic Cylinder Table Lamp
      const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.65, 16), mats.whiteMat);
      lampBase.position.set(-halfW + 1.05, 1.65, bedCenterZ + nz);
      lampBase.castShadow = true;
      group.add(lampBase);

      const lampShade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.4, 0.7, 16, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.9 })
      );
      lampShade.position.set(-halfW + 1.05, 2.2, bedCenterZ + nz);
      group.add(lampShade);

      // Warm 2700K Ambient Point Light from lamp
      const lampLight = new THREE.PointLight(0xffedd5, 0.9, 5);
      lampLight.position.set(-halfW + 1.05, 2.2, bedCenterZ + nz);
      group.add(lampLight);
    });

    // 9. Floor-to-Ceiling Sheer White Linen Curtains flanking the room
    const curtainMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.95,
      metalness: 0.05,
    });
    // Curtains on North and South window positions
    [-halfD + 0.35, halfD - 0.35].forEach((cz) => {
      const track = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.06, 0.08), mats.steelMat);
      track.position.set(bedCenterX - 0.5, clearH - 0.2, cz);
      group.add(track);

      // Folded curtain panels on left and right of window
      [-1.5, 1.5].forEach((cx) => {
        const curtainPanel = new THREE.Mesh(new THREE.BoxGeometry(0.8, clearH - 0.5, 0.15), curtainMat);
        curtainPanel.position.set(bedCenterX - 0.5 + cx, (clearH - 0.5) / 2 + 0.2, cz);
        curtainPanel.castShadow = true;
        group.add(curtainPanel);
      });
    });

    // 10. Corner Sculptural Potted Indoor Plant (Fiddle-Leaf Fig / Monstera in Ceramic Pot)
    const plantGroup = new THREE.Group();
    plantGroup.position.set(-halfW + 1.1, 0, halfD - 1.2);

    const potMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.4, 1.2, 16), potMat);
    pot.position.y = 0.6;
    pot.castShadow = true;
    plantGroup.add(pot);

    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0x27201d, roughness: 0.95 }));
    soil.position.y = 1.15;
    plantGroup.add(soil);

    // Multi-tiered organic foliage
    [
      [0, 1.9, 0, 0.75],
      [0.3, 2.3, 0.2, 0.65],
      [-0.25, 2.1, -0.2, 0.6],
      [0.2, 2.6, -0.15, 0.55],
    ].forEach(([lx, ly, lz, r]) => {
      const leafGeo = new THREE.SphereGeometry(r as number, 8, 8);
      leafGeo.scale(1.2, 0.5, 1.1);
      const leaf = new THREE.Mesh(leafGeo, mats.plantGreenMat);
      leaf.position.set(lx as number, ly as number, lz as number);
      leaf.rotation.set((lx as number) * 0.4, (ly as number) * 0.3, (lz as number) * 0.4);
      leaf.castShadow = true;
      plantGroup.add(leaf);
    });
    group.add(plantGroup);

    // 11. Sleek Built-in Wardrobe along the North Wall (leaving corridor entrance 100% clear)
    const wardrobeW = Math.min(roomWidth - 4.5, 6.0);
    if (wardrobeW > 2.0) {
      const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(wardrobeW, clearH - 0.6, 1.4), mats.cabinetMat);
      wardrobe.position.set(bedCenterX + 1.2, (clearH - 0.6) / 2 + 0.2, -halfD + 0.8);
      wardrobe.castShadow = true;
      group.add(wardrobe);
    }
  }

  return group;
}

/**
 * ============================================================================
 * UNIFIED DOUBLE-WIDE RESIDENCE (16ft Wide • Seamless Interconnected Flow)
 * ============================================================================
 * One unified 16ft wide residence:
 * - Living Wing (Z > 0): Grand Open TV Media Lounge or Great Room linked to Gourmet Chef Island & Dining
 * - Private Suites Wing (Z < 0): Master King Bedroom Suite, Second Bedroom/Study & Luxury Spa Bath
 * - Central Spine with Wide Open Walkable Portals between both wings!
 */
function buildDoubleWideHouseInterior(
  unitL: number,
  unitW: number,
  unitH: number,
  interiorStyle: InteriorStyle,
  _flooringMaterial: FlooringMaterial,
  modelConfig?: ContainerModelConfig
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'double-wide-unified-interior';

  const palette = getStylePalette(interiorStyle, modelConfig);
  const mats = createInteriorMaterials(palette, modelConfig);

  const halfL = unitL / 2;
  const halfW = unitW / 2; // e.g. 8ft for a 16ft wide house
  const clearH = unitH - 1.0;

  const loungeType: LoungeType = modelConfig?.loungeType || 'tv-media';
  const kitchenType: KitchenType = modelConfig?.kitchenType || 'chef-island';
  const bathroomType: BathroomType = modelConfig?.bathroomType || 'luxury-spa';
  const bedroomType: BedroomType = modelConfig?.bedroomType || 'master-suite';

  // -------------------------------------------------------------
  // 1. CENTRAL ARCHITECTURAL DIVIDING SPINE WITH WIDE OPEN PORTALS
  // -------------------------------------------------------------
  // Instead of a solid barrier, create structural columns and wide header portals
  // that allow full walkable flow across the entire 16ft house.
  const portalHeaderGeo = new THREE.BoxGeometry(unitL - 2.0, 1.0, 0.4);
  const portalHeader = new THREE.Mesh(portalHeaderGeo, mats.steelMat);
  portalHeader.position.set(0, clearH - 0.5, 0);
  group.add(portalHeader);

  // Modern Fluted Structural Columns at 1/3 and 2/3 length
  [-halfL * 0.4, halfL * 0.35].forEach((colX) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.8, clearH, 0.8), mats.woodMat);
    col.position.set(colX, clearH / 2, 0);
    col.castShadow = true;
    group.add(col);
  });

  // -------------------------------------------------------------
  // 2. LIVING & ENTERTAINING WING (Z > 0)
  // -------------------------------------------------------------
  // A. Lounge / Media Lounge (East Wing, X > 0)
  const loungeCenterX = halfL * 0.45;
  const loungeGroup = buildLoungeFurniture(loungeType, palette, mats, halfW);
  loungeGroup.position.set(loungeCenterX, 0.2, halfW / 2);
  group.add(loungeGroup);

  // B. Gourmet Kitchen & Island (Center, X around 0)
  const kitchenCenterX = -halfL * 0.1;
  const kitchenGroup = buildKitchenFurniture(kitchenType, palette, mats, halfW);
  kitchenGroup.position.set(kitchenCenterX, 0.2, halfW / 2);
  group.add(kitchenGroup);

  // C. Modern Dining Table (West Wing, X < -halfL * 0.5)
  const diningCenterX = -halfL * 0.65;
  const diningGroup = new THREE.Group();
  diningGroup.position.set(diningCenterX, 0.2, halfW / 2);

  const diningTable = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.15, 3.2), mats.marbleMat);
  diningTable.position.y = 2.4;
  diningTable.castShadow = true;
  diningGroup.add(diningTable);

  // Table base
  const tableBase = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.3, 1.2), mats.steelMat);
  tableBase.position.y = 1.15;
  diningGroup.add(tableBase);

  // 4 Dining Chairs
  [[-1.8, 2.0], [1.8, 2.0], [-1.8, -2.0], [1.8, -2.0]].forEach(([dx, dz]) => {
    const chair = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.6, 1.3), mats.sofaFabricMat);
    chair.position.set(dx, 1.2, dz);
    diningGroup.add(chair);
  });

  // Pendant lighting above dining table
  const pendant = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.3, 16), mats.goldBrassMat);
  pendant.position.set(0, 6.8, 0);
  diningGroup.add(pendant);

  const diningLight = new THREE.PointLight(0xffedd5, 1.2, 8);
  diningLight.position.set(0, 6.5, 0);
  diningGroup.add(diningLight);

  group.add(diningGroup);

  // -------------------------------------------------------------
  // 3. PRIVATE SUITES & SANCTUARY WING (Z < 0)
  // -------------------------------------------------------------
  // A. Master Bedroom Suite (East Wing, X > 0)
  const masterCenterX = halfL * 0.45;
  const masterGroup = buildBedroomFurniture(bedroomType, palette, mats, halfL * 0.8, halfW, clearH);
  masterGroup.position.set(masterCenterX, 0.2, -halfW / 2);
  group.add(masterGroup);

  // Master Bedroom Enclosing Partition Wall & Operable Door
  const masterWallX = halfL * 0.05;
  const masterWall = new THREE.Mesh(new THREE.BoxGeometry(0.35, clearH, halfW), mats.wallMat);
  masterWall.position.set(masterWallX, clearH / 2 + 0.2, -halfW / 2);
  masterWall.castShadow = true;
  group.add(masterWall);

  // B. Central Luxury Spa Bathroom (X from -halfL * 0.35 to masterWallX)
  const bathWidth = Math.abs(masterWallX - (-halfL * 0.35));
  const bathCenterX = (masterWallX + (-halfL * 0.35)) / 2;
  const bathGroup = buildBathroomFurniture(bathroomType, palette, mats, bathWidth, halfW, clearH, modelConfig);
  bathGroup.position.set(bathCenterX, 0.2, -halfW / 2);
  group.add(bathGroup);

  // Bathroom Privacy Wall
  const bathWallX = -halfL * 0.35;
  const bathWall = new THREE.Mesh(new THREE.BoxGeometry(0.35, clearH, halfW), mats.wallMat);
  bathWall.position.set(bathWallX, clearH / 2 + 0.2, -halfW / 2);
  bathWall.castShadow = true;
  group.add(bathWall);

  // Operable Sliding Pocket Door on Bathroom
  const pocketDoorGroup = new THREE.Group();
  pocketDoorGroup.name = 'operable-interior-bath-door';
  pocketDoorGroup.position.set(bathCenterX, 3.4, -0.4);
  pocketDoorGroup.userData = {
    isDoorOrWindow: true,
    isAnimatableAperture: true,
    apertureKey: 'interior-bath-door',
    apertureType: 'slide-x',
    targetPosX: bathCenterX,
    closedPosX: bathCenterX,
    openPosX: bathCenterX - 2.2,
    openingId: 'interior-bath-door',
    isOpen: false,
    title: 'Spa Bathroom Sliding Pocket Door',
  };

  const pocketDoorSlab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 6.8, 0.12), mats.doorMat);
  pocketDoorSlab.castShadow = true;
  pocketDoorSlab.userData = pocketDoorGroup.userData;
  pocketDoorGroup.add(pocketDoorSlab);

  const pocketPullHandle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.16), mats.chromeMat);
  pocketPullHandle.position.set(0.8, 0, 0);
  pocketPullHandle.userData = pocketDoorGroup.userData;
  pocketDoorGroup.add(pocketPullHandle);

  group.add(pocketDoorGroup);

  // C. Secondary Guest Bedroom / Executive Study (West Wing, X < bathWallX)
  const secondBedCenterX = (-halfL + bathWallX) / 2;
  const secondBedType: BedroomType = bedroomType === 'dual-bunk' ? 'master-suite' : 'dual-bunk';
  const secondBedGroup = buildBedroomFurniture(secondBedType, palette, mats, Math.abs(bathWallX - (-halfL)), halfW, clearH);
  secondBedGroup.position.set(secondBedCenterX, 0.2, -halfW / 2);
  group.add(secondBedGroup);

  // -------------------------------------------------------------
  // 4. ARCHITECTURAL POT DOWNLIGHTS
  // -------------------------------------------------------------
  const warmLedMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
  [-halfL * 0.65, -halfL * 0.1, halfL * 0.45].forEach((lx) => {
    [-halfW / 2, halfW / 2].forEach((lz) => {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12), warmLedMat);
      pot.position.set(lx, clearH + 0.1, lz);
      group.add(pot);

      const light = new THREE.PointLight(0xfff1e6, 1.1, 14);
      light.position.set(lx, clearH - 0.4, lz);
      group.add(light);
    });
  });

  return group;
}

/**
 * ============================================================================
 * TRIPLE-WIDE ARCHITECTURAL ESTATE (24ft Wide • 3 Seamlessly Interconnected Bays)
 * ============================================================================
 * One expansive 24ft wide logical house layout:
 * - Bay 1 (Z > +4ft): Grand TV Media & Entertaining Lounge with 75" OLED, acoustic wall & sectional
 * - Bay 2 (-4ft < Z < +4ft): Gourmet Island Kitchen & Walk-Through Dining Gallery linked with open portals
 * - Bay 3 (Z < -4ft): Master Sanctuary Suite, Luxury Spa Bathroom & Executive Study Suite
 */
function buildTripleWideHouseInterior(
  unitL: number,
  unitW: number,
  unitH: number,
  interiorStyle: InteriorStyle,
  _flooringMaterial: FlooringMaterial,
  modelConfig?: ContainerModelConfig
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'triple-wide-unified-interior';

  const palette = getStylePalette(interiorStyle, modelConfig);
  const mats = createInteriorMaterials(palette, modelConfig);

  const halfL = unitL / 2;
  const bayW = unitW / 3; // ~8ft per bay
  const clearH = unitH - 1.0;

  const loungeType: LoungeType = modelConfig?.loungeType || 'tv-media';
  const kitchenType: KitchenType = modelConfig?.kitchenType || 'chef-island';
  const bathroomType: BathroomType = modelConfig?.bathroomType || 'luxury-spa';
  const bedroomType: BedroomType = modelConfig?.bedroomType || 'master-suite';

  // 1. Structural Interconnecting Portals & Columns between bays
  [-bayW / 2, bayW / 2].forEach((seamZ) => {
    const portalHeaderGeo = new THREE.BoxGeometry(unitL - 2.0, 1.0, 0.4);
    const portalHeader = new THREE.Mesh(portalHeaderGeo, mats.steelMat);
    portalHeader.position.set(0, clearH - 0.5, seamZ);
    group.add(portalHeader);

    // Fluted architectural columns along the boundary
    [-halfL * 0.45, 0, halfL * 0.45].forEach((colX) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.8, clearH, 0.8), mats.woodMat);
      col.position.set(colX, clearH / 2, seamZ);
      col.castShadow = true;
      group.add(col);
    });
  });

  // -------------------------------------------------------------
  // BAY 1: GRAND LOUNGE & ENTERTAINMENT WING (Z = +bayW)
  // -------------------------------------------------------------
  const loungeZ = bayW;
  const loungeGroup = buildLoungeFurniture(loungeType, palette, mats, bayW);
  loungeGroup.position.set(halfL * 0.2, 0.2, loungeZ);
  group.add(loungeGroup);

  // Secondary conversation / cocktail nook in Lounge Bay
  const cocktailNook = new THREE.Group();
  cocktailNook.position.set(-halfL * 0.55, 0.2, loungeZ);
  const credenza = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.4, 1.6), mats.cabinetMat);
  credenza.position.set(0, 1.2, -bayW / 2 + 1.0);
  credenza.castShadow = true;
  cocktailNook.add(credenza);
  const credenzaTop = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.12, 1.8), mats.marbleMat);
  credenzaTop.position.set(0, 2.45, -bayW / 2 + 1.0);
  cocktailNook.add(credenzaTop);
  group.add(cocktailNook);

  // -------------------------------------------------------------
  // BAY 2: GOURMET CHEF KITCHEN & DINING GALLERY (Z = 0)
  // -------------------------------------------------------------
  // Gourmet Kitchen (Center East)
  const kitchenGroup = buildKitchenFurniture(kitchenType, palette, mats, bayW);
  kitchenGroup.position.set(halfL * 0.25, 0.2, 0);
  group.add(kitchenGroup);

  // Formal Walk-Through Dining Table (West Side of Bay 2)
  const diningGroup = new THREE.Group();
  diningGroup.position.set(-halfL * 0.4, 0.2, 0);

  const diningTable = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.15, 3.4), mats.marbleMat);
  diningTable.position.y = 2.4;
  diningTable.castShadow = true;
  diningGroup.add(diningTable);

  const tableBase = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.3, 1.4), mats.steelMat);
  tableBase.position.y = 1.15;
  diningGroup.add(tableBase);

  // 6 Designer Dining Chairs
  [-2.2, 0, 2.2].forEach((dx) => {
    [-2.1, 2.1].forEach((dz) => {
      const chair = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.6, 1.3), mats.sofaFabricMat);
      chair.position.set(dx, 1.2, dz);
      diningGroup.add(chair);
    });
  });

  // Linear Brass Chandelier
  const linearChandelier = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.2, 0.4), mats.goldBrassMat);
  linearChandelier.position.set(0, 6.8, 0);
  diningGroup.add(linearChandelier);

  const diningLight = new THREE.PointLight(0xffedd5, 1.4, 12);
  diningLight.position.set(0, 6.4, 0);
  diningGroup.add(diningLight);
  group.add(diningGroup);

  // -------------------------------------------------------------
  // BAY 3: MASTER SANCTUARY & PRIVATE SUITES (Z = -bayW)
  // -------------------------------------------------------------
  const privateZ = -bayW;
  // A. Master Bedroom Suite (East)
  const masterGroup = buildBedroomFurniture(bedroomType, palette, mats, halfL * 0.85, bayW, clearH);
  masterGroup.position.set(halfL * 0.45, 0.2, privateZ);
  group.add(masterGroup);

  // Master Wall Partition
  const masterWallX = halfL * 0.05;
  const masterWall = new THREE.Mesh(new THREE.BoxGeometry(0.35, clearH, bayW), mats.wallMat);
  masterWall.position.set(masterWallX, clearH / 2 + 0.2, privateZ);
  masterWall.castShadow = true;
  group.add(masterWall);

  // B. Luxury Spa Master Bath (Center)
  const bathWallX = -halfL * 0.35;
  const bathWidth = Math.abs(masterWallX - bathWallX);
  const bathCenterX = (masterWallX + bathWallX) / 2;
  const bathGroup = buildBathroomFurniture(bathroomType, palette, mats, bathWidth, bayW, clearH, modelConfig);
  bathGroup.position.set(bathCenterX, 0.2, privateZ);
  group.add(bathGroup);

  // Bathroom Wall Partition
  const bathWall = new THREE.Mesh(new THREE.BoxGeometry(0.35, clearH, bayW), mats.wallMat);
  bathWall.position.set(bathWallX, clearH / 2 + 0.2, privateZ);
  bathWall.castShadow = true;
  group.add(bathWall);

  // C. Executive Study / Guest Suite (West)
  const studyCenterX = (-halfL + bathWallX) / 2;
  const studyGroup = buildBedroomFurniture('executive-study', palette, mats, Math.abs(bathWallX - (-halfL)), bayW, clearH);
  studyGroup.position.set(studyCenterX, 0.2, privateZ);
  group.add(studyGroup);

  return group;
}

/**
 * ============================================================================
 * SINGLE-STORY INTERIOR (20ft, 30ft, 40ft, 45ft Monoliths)
 * ============================================================================
 */
function buildSingleStoryHouseInterior(
  unitL: number,
  unitW: number,
  unitH: number,
  interiorStyle: InteriorStyle,
  _flooringMaterial: FlooringMaterial,
  modelConfig?: ContainerModelConfig
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'single-story-interior';

  const palette = getStylePalette(interiorStyle, modelConfig);
  const mats = createInteriorMaterials(palette, modelConfig);

  const halfL = unitL / 2;
  const halfW = unitW / 2;
  const clearH = unitH - 1.0;

  const loungeType: LoungeType = modelConfig?.loungeType || (unitL <= 22 ? 'minimalist-studio' : 'great-room');
  const kitchenType: KitchenType = modelConfig?.kitchenType || (unitL >= 36 ? 'chef-island' : (unitL <= 22 ? 'linear-minimal' : 'breakfast-bar'));
  const bathroomType: BathroomType = modelConfig?.bathroomType || (unitL >= 36 ? 'luxury-spa' : (unitL <= 22 ? 'nordic-wetroom' : 'modern-ensuite'));
  const bedroomType: BedroomType = modelConfig?.bedroomType || (unitL <= 22 ? 'nordic-minimal' : 'master-suite');

  // Zoning coordinates (Clear progression: Entry/Living -> Dining/Kitchen -> Dedicated Corridor + Private Bathroom -> Master Bedroom)
  const isCompact20 = unitL < 26;
  const bedPartitionX = isCompact20 ? -halfL + 7.5 : (unitL >= 36 ? -halfL + 12.0 : -halfL + 9.8);
  const bathPartitionX = isCompact20 ? -halfL + 13.0 : (unitL >= 36 ? -halfL + 19.5 : -halfL + 16.8);
  const bathLength = Math.abs(bathPartitionX - bedPartitionX);

  // Corridor Z Boundary: Corridor runs along front (Z from 0.8 to halfW - 0.3).
  // Private enclosed bathroom sits along rear (Z from -halfW + 0.3 to 0.8).
  const corridorZDivider = 0.8;
  const bathDepth = corridorZDivider - (-halfW + 0.3); // ~4.5ft depth
  const bathCenterZ = (-halfW + 0.3 + corridorZDivider) / 2;
  const isAttachedBath = !!modelConfig?.attachedBath;
  const bathDoorType = modelConfig?.bathroomDoorType || 'pocket-sliding';

  // -------------------------------------------------------------
  // 1. DEDICATED CIRCULATION CORRIDOR & PARTITION WALLS
  // -------------------------------------------------------------
  // A. Bathroom East Dividing Wall (at X = bathPartitionX, from Z = -halfW + 0.3 to corridorZDivider)
  // CRITICAL ARCHITECTURAL RULE: This wall STOPS at corridorZDivider so the corridor is 100% OPEN!
  const bathEastWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, clearH, bathDepth),
    mats.wallMat
  );
  bathEastWall.position.set(bathPartitionX, clearH / 2 + 0.3, bathCenterZ);
  bathEastWall.castShadow = true;
  group.add(bathEastWall);

  // B. Bathroom Corridor Partition Wall (at Z = corridorZDivider, spanning X from bedPartitionX to bathPartitionX)
  // Divides the private washroom from the walking corridor!
  const bathCorridorWallGroup = new THREE.Group();
  bathCorridorWallGroup.position.set((bedPartitionX + bathPartitionX) / 2, clearH / 2 + 0.3, corridorZDivider);

  const doorWidth = 2.4;
  const doorHeight = 6.8;
  const headerHeight = Math.max(clearH - doorHeight, 0.4);

  if (isAttachedBath) {
    // Solid architectural slat acoustic wall facing corridor with designer accent
    const solidCorridorWall = new THREE.Mesh(
      new THREE.BoxGeometry(bathLength, clearH, 0.25),
      mats.woodMat
    );
    solidCorridorWall.castShadow = true;
    bathCorridorWallGroup.add(solidCorridorWall);
  } else {
    // Corridor access with door opening & operable bathroom door
    const sideWallWidth = (bathLength - doorWidth) / 2;
    if (sideWallWidth > 0.1) {
      const leftWall = new THREE.Mesh(new THREE.BoxGeometry(sideWallWidth, clearH, 0.25), mats.wallMat);
      leftWall.position.set(-bathLength / 2 + sideWallWidth / 2, 0, 0);
      leftWall.castShadow = true;
      bathCorridorWallGroup.add(leftWall);

      const rightWall = new THREE.Mesh(new THREE.BoxGeometry(sideWallWidth, clearH, 0.25), mats.wallMat);
      rightWall.position.set(bathLength / 2 - sideWallWidth / 2, 0, 0);
      rightWall.castShadow = true;
      bathCorridorWallGroup.add(rightWall);
    }

    const headerMesh = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, headerHeight, 0.25), mats.wallMat);
    headerMesh.position.set(0, clearH / 2 - headerHeight / 2, 0);
    bathCorridorWallGroup.add(headerMesh);

    // Operable Bathroom Door on the corridor wall
    if (bathDoorType === 'swing-hinged') {
      const bathHingedPivot = new THREE.Group();
      bathHingedPivot.name = 'operable-interior-bath-door';
      bathHingedPivot.position.set(-doorWidth / 2 + 0.05, -clearH / 2 + doorHeight / 2, -0.05);
      bathHingedPivot.userData = {
        isDoorOrWindow: true,
        isAnimatableAperture: true,
        apertureKey: 'interior-bath-door',
        apertureType: 'hinge-y',
        targetRotY: 0,
        closedRotY: 0,
        openRotY: -Math.PI * 0.48,
        openingId: 'interior-bath-door',
        isOpen: false,
        title: 'Bathroom Privacy Door',
      };
      const doorSlab = new THREE.Mesh(new THREE.BoxGeometry(doorWidth - 0.1, doorHeight, 0.1), mats.doorMat);
      doorSlab.position.set((doorWidth - 0.1) / 2, 0, 0);
      doorSlab.castShadow = true;
      doorSlab.userData = bathHingedPivot.userData;
      bathHingedPivot.add(doorSlab);

      const bathLever = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.35), mats.chromeMat);
      bathLever.position.set(doorWidth - 0.3, 0, 0);
      bathLever.userData = bathHingedPivot.userData;
      bathHingedPivot.add(bathLever);

      bathCorridorWallGroup.add(bathHingedPivot);
    } else {
      // Sliding Pocket Door
      const pocketDoorGroup = new THREE.Group();
      pocketDoorGroup.name = 'operable-interior-bath-door';
      pocketDoorGroup.position.set(0, -clearH / 2 + doorHeight / 2, -0.08);
      pocketDoorGroup.userData = {
        isDoorOrWindow: true,
        isAnimatableAperture: true,
        apertureKey: 'interior-bath-door',
        apertureType: 'slide-x',
        targetPosX: 0,
        closedPosX: 0,
        openPosX: -doorWidth * 0.9,
        openingId: 'interior-bath-door',
        isOpen: false,
        title: 'Bathroom Sliding Pocket Door',
      };
      const pocketPanel = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, 0.08), mats.doorMat);
      pocketPanel.castShadow = true;
      pocketPanel.userData = pocketDoorGroup.userData;
      pocketDoorGroup.add(pocketPanel);

      const recessedHandle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.12), mats.chromeMat);
      recessedHandle.position.set(doorWidth / 2 - 0.3, 0, 0);
      pocketDoorGroup.add(recessedHandle);

      bathCorridorWallGroup.add(pocketDoorGroup);
    }
  }
  group.add(bathCorridorWallGroup);

  // C. Master Bedroom Wall (at X = bedPartitionX)
  const bedWallGroup = new THREE.Group();
  bedWallGroup.position.set(bedPartitionX, clearH / 2 + 0.3, 0);

  // Bedroom wall segment behind the bathroom (Z from -halfW + 0.3 to corridorZDivider)
  if (isAttachedBath) {
    // Attached ensuite door connecting Master Bedroom directly into Bathroom!
    const ensuiteDoorW = 2.2;
    const ensuiteWallW = (bathDepth - ensuiteDoorW) / 2;
    if (ensuiteWallW > 0.1) {
      const ensLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, clearH, ensuiteWallW), mats.wallMat);
      ensLeft.position.set(0, 0, -halfW + 0.3 + ensuiteWallW / 2);
      bedWallGroup.add(ensLeft);

      const ensRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, clearH, ensuiteWallW), mats.wallMat);
      ensRight.position.set(0, 0, corridorZDivider - ensuiteWallW / 2);
      bedWallGroup.add(ensRight);
    }
    const ensHeader = new THREE.Mesh(new THREE.BoxGeometry(0.3, headerHeight, ensuiteDoorW), mats.wallMat);
    ensHeader.position.set(0, clearH / 2 - headerHeight / 2, bathCenterZ);
    bedWallGroup.add(ensHeader);

    // Ensuite pocket door
    const ensuiteDoor = new THREE.Group();
    ensuiteDoor.name = 'operable-interior-bath-door';
    ensuiteDoor.position.set(0, -clearH / 2 + doorHeight / 2, bathCenterZ);
    ensuiteDoor.userData = {
      isDoorOrWindow: true,
      isAnimatableAperture: true,
      apertureKey: 'interior-bath-door',
      apertureType: 'slide-z',
      targetPosZ: bathCenterZ,
      closedPosZ: bathCenterZ,
      openPosZ: bathCenterZ + 1.9,
      openingId: 'interior-bath-door',
      isOpen: false,
      title: 'Ensuite Bathroom Sliding Pocket Door',
    };
    const ensPanel = new THREE.Mesh(new THREE.BoxGeometry(0.08, doorHeight, ensuiteDoorW), mats.doorMat);
    ensPanel.castShadow = true;
    ensPanel.userData = ensuiteDoor.userData;
    ensuiteDoor.add(ensPanel);

    const ensHandle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 0.08), mats.chromeMat);
    ensHandle.position.set(0, 0, ensuiteDoorW / 2 - 0.25);
    ensHandle.userData = ensuiteDoor.userData;
    ensuiteDoor.add(ensHandle);

    bedWallGroup.add(ensuiteDoor);
  } else {
    // Solid acoustic wall between Master Bedroom and Bathroom
    const solidBedBathWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, clearH, bathDepth),
      mats.wallMat
    );
    solidBedBathWall.position.set(0, 0, bathCenterZ);
    solidBedBathWall.castShadow = true;
    bedWallGroup.add(solidBedBathWall);
  }

  // Bedroom Privacy Door at the end of the Corridor (Z from corridorZDivider to halfW - 0.3)
  const corridorWidth = (halfW - 0.3) - corridorZDivider;
  const bedDoorW = Math.min(corridorWidth - 0.2, 2.5);
  const bedDoorCenterZ = corridorZDivider + corridorWidth / 2;

  const bedHeaderMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, headerHeight, corridorWidth), mats.wallMat);
  bedHeaderMesh.position.set(0, clearH / 2 - headerHeight / 2, bedDoorCenterZ);
  bedWallGroup.add(bedHeaderMesh);

  // Operable Master Bedroom Door (swings into bedroom when opened)
  const bedDoorPivot = new THREE.Group();
  bedDoorPivot.name = 'operable-interior-bed-door';
  bedDoorPivot.position.set(0, -clearH / 2 + doorHeight / 2, bedDoorCenterZ - bedDoorW / 2);
  bedDoorPivot.userData = {
    isDoorOrWindow: true,
    isAnimatableAperture: true,
    apertureKey: 'interior-bed-door',
    apertureType: 'hinge-y',
    targetRotY: 0,
    closedRotY: 0,
    openRotY: -Math.PI * 0.48,
    openingId: 'interior-bed-door',
    isOpen: false,
    title: 'Master Bedroom Privacy Door',
  };

  const bedDoorSlab = new THREE.Mesh(new THREE.BoxGeometry(0.1, doorHeight, bedDoorW), mats.doorMat);
  bedDoorSlab.position.set(0, 0, bedDoorW / 2);
  bedDoorSlab.castShadow = true;
  bedDoorSlab.userData = bedDoorPivot.userData;
  bedDoorPivot.add(bedDoorSlab);

  const leverHandle = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.4), mats.chromeMat);
  leverHandle.position.set(0, 0, bedDoorW - 0.3);
  bedDoorPivot.add(leverHandle);

  bedWallGroup.add(bedDoorPivot);
  group.add(bedWallGroup);

  // D. Corridor Architectural Downlights (Recessed warm LED dots along the walking corridor)
  const corridorLength = Math.abs(bathPartitionX - bedPartitionX);
  [-0.3 * corridorLength, 0.3 * corridorLength].forEach((lx) => {
    const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 12), mats.chromeMat);
    spot.position.set((bedPartitionX + bathPartitionX) / 2 + lx, clearH + 0.1, bedDoorCenterZ);
    group.add(spot);

    const light = new THREE.PointLight(0xffedd5, 0.8, 6);
    light.position.set((bedPartitionX + bathPartitionX) / 2 + lx, clearH - 0.3, bedDoorCenterZ);
    group.add(light);
  });

  // -------------------------------------------------------------
  // 2. PRIMARY BEDROOM (Quiet West End, X < bedPartitionX)
  // -------------------------------------------------------------
  const bedCenterX = (-halfL + bedPartitionX) / 2;
  const bedGroup = buildBedroomFurniture(
    bedroomType,
    palette,
    mats,
    Math.abs(bedPartitionX - (-halfL)),
    unitW,
    clearH
  );
  bedGroup.position.set(bedCenterX, 0.2, 0);
  group.add(bedGroup);

  // -------------------------------------------------------------
  // 3. WASHROOM / BATHROOM (Plumbing Core enclosed along back wall)
  // -------------------------------------------------------------
  const bathGroup = buildBathroomFurniture(
    bathroomType,
    palette,
    mats,
    bathLength - 0.6,
    bathDepth - 0.4,
    clearH,
    modelConfig
  );
  bathGroup.position.set((bedPartitionX + bathPartitionX) / 2, 0.2, bathCenterZ);
  group.add(bathGroup);

  // -------------------------------------------------------------
  // 4. KITCHEN ZONE (Connecting Dining, Living, and Wet Wall)
  // -------------------------------------------------------------
  const kitchenAvailableSpace = (halfL - 5.0) - bathPartitionX;
  const kitchenCenterX = bathPartitionX + Math.min(kitchenAvailableSpace * 0.45, 4.0);
  const kitchenGroup = buildKitchenFurniture(
    kitchenType,
    palette,
    mats,
    unitW
  );
  kitchenGroup.position.set(kitchenCenterX, 0.2, 0);
  group.add(kitchenGroup);

  // -------------------------------------------------------------
  // 5. LIVING & LOUNGE GREAT ROOM (East Social End & Front Entrance)
  // -------------------------------------------------------------
  const livingCenterX = halfL - (isCompact20 ? 3.0 : 4.8);
  const livingGroup = buildLoungeFurniture(loungeType, palette, mats, unitW);
  livingGroup.position.set(livingCenterX, 0.2, 0);
  group.add(livingGroup);

  // -------------------------------------------------------------
  // 6. POT DOWNLIGHTS
  // -------------------------------------------------------------
  const warmLedMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
  const potStep = unitL / 4;
  for (let i = 0; i < 4; i++) {
    const lx = -halfL + potStep * 0.5 + i * potStep;
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12), warmLedMat);
    pot.position.set(lx, clearH + 0.1, 0);
    group.add(pot);

    const light = new THREE.PointLight(0xfff1e6, 1.0, 12);
    light.position.set(lx, clearH - 0.4, 0);
    group.add(light);
  }

  return group;
}

/**
 * GROUND STORY (for 2-Story Stacked): Dedicated open kitchen, dining, living lounge, powder room
 */
function buildGroundStoryHouseInterior(
  unitL: number,
  unitW: number,
  unitH: number,
  interiorStyle: InteriorStyle,
  _flooringMaterial: FlooringMaterial,
  modelConfig?: ContainerModelConfig
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ground-story-interior';

  const palette = getStylePalette(interiorStyle, modelConfig);
  const mats = createInteriorMaterials(palette, modelConfig);

  const halfL = unitL / 2;
  const clearH = unitH - 1.0;

  const kType = modelConfig?.kitchenType || 'chef-island';
  const lType = modelConfig?.loungeType || 'great-room';
  const bType = modelConfig?.bathroomType || 'powder-room';

  // Kitchen with Chef's Island
  const kitchenGroup = buildKitchenFurniture(kType, palette, mats, unitW);
  kitchenGroup.position.set(-halfL * 0.2, 0.2, 0);
  group.add(kitchenGroup);

  // Open Great Room Lounge
  const livingGroup = buildLoungeFurniture(lType, palette, mats, unitW);
  livingGroup.position.set(halfL - 6.0, 0.2, 0);
  group.add(livingGroup);

  // Powder Room
  const bathGroup = buildBathroomFurniture(bType, palette, mats, 6.0, unitW - 1.0, clearH, modelConfig);
  bathGroup.position.set(-halfL + 5.0, 0.2, 0);
  group.add(bathGroup);

  return group;
}

/**
 * UPPER STORY (for 2-Story Stacked): Master Bedroom Suite, Spa Bathroom & Office
 */
function buildUpperStoryHouseInterior(
  unitL: number,
  unitW: number,
  unitH: number,
  interiorStyle: InteriorStyle,
  _flooringMaterial: FlooringMaterial,
  modelConfig?: ContainerModelConfig
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'upper-story-interior';

  const palette = getStylePalette(interiorStyle, modelConfig);
  const mats = createInteriorMaterials(palette, modelConfig);

  const halfL = unitL / 2;
  const clearH = unitH - 1.0;

  const bedType = modelConfig?.bedroomType || 'master-suite';
  const bathType = modelConfig?.bathroomType || 'luxury-spa';

  // Master Bedroom Suite
  const bedGroup = buildBedroomFurniture(bedType, palette, mats, halfL * 0.9, unitW, clearH);
  bedGroup.position.set(-halfL * 0.4, 0.2, 0);
  group.add(bedGroup);

  // Luxury Spa Bathroom
  const bathGroup = buildBathroomFurniture(bathType, palette, mats, 8.0, unitW - 1.0, clearH, modelConfig);
  bathGroup.position.set(halfL * 0.4, 0.2, 0);
  group.add(bathGroup);

  return group;
}

/**
 * Builds the modern architectural house exterior envelope:
 * - Cantilevered roof overhang with sleek modern fascia and warm soffit downlights
 * - Welcoming covered front porch canopy with vertical cedar slats
 * - Architectural matte black entry door with satin bar handle and frosted glass insert
 * - Dual-beam modern up/down exterior entry sconce light
 * - Porch steps connecting deck to landscape walkway
 */
export function buildArchitecturalHouseEnvelope(
  unitL: number,
  unitW: number,
  unitH: number,
  exteriorMaterial: string,
  exteriorColor: string,
  cutawayRoof: boolean,
  roofOption: RoofOption,
  solarPanelsCount: number,
  frontDoorOpen: boolean = false,
  isUpperStory: boolean = false
): THREE.Group {
  const envelopeGroup = new THREE.Group();
  envelopeGroup.name = 'architectural-envelope';

  const fasciaMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.35,
    metalness: 0.7,
  });

  const soffitMat = new THREE.MeshStandardMaterial({
    color: 0x9c7a54,
    roughness: 0.65,
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(exteriorColor),
    roughness: 0.45,
    metalness: 0.6,
  });

  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.3,
    metalness: 0.8,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xe0f7fa,
    transmission: 0.9,
    opacity: 0.8,
    transparent: true,
    roughness: 0.1,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.1,
  });

  const warmGlowMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });

  const halfL = unitL / 2;
  const halfW = unitW / 2;

  // -------------------------------------------------------------
  // 1. MODERN ROOF OVERHANG & ARCHITECTURAL FASCIA (When roof is closed)
  // -------------------------------------------------------------
  if (!cutawayRoof) {
    const overhang = 1.0;
    const roofW = unitL + overhang * 2;
    const roofD = unitW + overhang * 2;

    // A. Main Roof Slab with architectural fascia
    const roofSlabGeo = new THREE.BoxGeometry(roofW, 0.4, roofD);
    const roofSlab = new THREE.Mesh(roofSlabGeo, fasciaMat);
    roofSlab.position.set(0, unitH + 0.15, 0);
    roofSlab.castShadow = true;
    roofSlab.receiveShadow = true;
    envelopeGroup.add(roofSlab);

    // Fine standing seams give the roof a believable pressed-metal scale.
    const roofSeamGeo = new THREE.BoxGeometry(roofW - 0.7, 0.045, 0.06);
    for (let z = -roofD / 2 + 0.75; z < roofD / 2 - 0.5; z += 0.85) {
      const seam = new THREE.Mesh(roofSeamGeo, fasciaMat);
      seam.position.set(0, unitH + 0.38, z);
      seam.castShadow = true;
      envelopeGroup.add(seam);
    }

    // B. Warm Timber Soffit Underhang Reveal
    const soffitGeo = new THREE.BoxGeometry(roofW - 0.1, 0.08, roofD - 0.1);
    const soffit = new THREE.Mesh(soffitGeo, soffitMat);
    soffit.position.set(0, unitH - 0.08, 0);
    envelopeGroup.add(soffit);

    // C. Recessed Warm Soffit Exterior Downlights along front and rear eaves
    [-halfW - overhang / 2, halfW + overhang / 2].forEach((soffitZ) => {
      const eaveCount = Math.floor(unitL / 8);
      for (let i = 0; i < eaveCount; i++) {
        const ex = -halfL + 4 + i * 8;
        const eaveLight = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 8), warmGlowMat);
        eaveLight.position.set(ex, unitH - 0.12, soffitZ);
        envelopeGroup.add(eaveLight);

        const downGlow = new THREE.PointLight(0xffedd5, 0.9, 10);
        downGlow.position.set(ex, unitH - 0.6, soffitZ);
        envelopeGroup.add(downGlow);
      }
    });

    // D. Rooftop Amenities (Deck or Solar Panels)
    if (roofOption === 'deck-wood') {
      const roofDeckGeo = new THREE.BoxGeometry(unitL - 1.5, 0.15, unitW - 1.5);
      const roofDeckMat = new THREE.MeshStandardMaterial({ color: 0x9c7a54, roughness: 0.6 });
      const roofDeck = new THREE.Mesh(roofDeckGeo, roofDeckMat);
      roofDeck.position.set(0, unitH + 0.42, 0);
      envelopeGroup.add(roofDeck);
    }
  }

  // -------------------------------------------------------------
  // 2. EXTERIOR LIGHTING & ARCHITECTURAL WALL ACCENTS (Ground level only)
  // -------------------------------------------------------------
  if (!isUpperStory) {
    // Slim Architectural Flush Up/Down Exterior Sconces on corners
    [-halfL + 2.0, halfL - 2.0].forEach((sconceX) => {
      const sconceBody = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.1), steelMat);
      sconceBody.position.set(sconceX, 5.0, halfW + 0.06);
      envelopeGroup.add(sconceBody);

      const upLight = new THREE.PointLight(0xffedd5, 0.6, 5);
      upLight.position.set(sconceX, 5.4, halfW + 0.15);
      envelopeGroup.add(upLight);

      const downLight = new THREE.PointLight(0xffedd5, 0.9, 6);
      downLight.position.set(sconceX, 4.6, halfW + 0.15);
      envelopeGroup.add(downLight);
    });
  }

  return envelopeGroup;
}
