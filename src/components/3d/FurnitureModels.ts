import * as THREE from 'three';
import { InteriorStyle } from '../../types';

/**
 * Palette and finishes derived from the selected Interior Archetype
 */
function getStylePalette(style: InteriorStyle) {
  switch (style) {
    case 'dark-loft':
      return {
        wood: 0x27272a,         // Charcoal stained oak
        fabricSofa: 0x3f3f46,   // Charcoal heather
        accentPillow: 0xd97706, // Ochre amber
        marble: 0x18181b,       // Nero marquina black marble
        cabinet: 0x18181b,      // Matte obsidian
        bedFabric: 0x27272a,    // Deep charcoal velvet
        blanket: 0x71717a,      // Cool slate wool
        rug: 0x1c1917,          // Dark woven jute
      };
    case 'industrial-concrete':
      return {
        wood: 0x78716c,         // Reclaimed weathered teak
        fabricSofa: 0x52525b,   // Concrete gray twill
        accentPillow: 0x0284c7, // Industrial cyan
        marble: 0x475569,       // Raw honed concrete
        cabinet: 0x334155,      // Gunmetal steel
        bedFabric: 0x4b5563,    // Heather gray
        blanket: 0x0f172a,      // Midnight navy
        rug: 0x374151,          // Textured graphite
      };
    case 'nordic-white':
      return {
        wood: 0xe2d9cc,         // Bleached Scandinavian pine
        fabricSofa: 0xf1f5f9,   // Off-white boucle
        accentPillow: 0x0d9488, // Nordic spruce teal
        marble: 0xffffff,       // Pure white quartz
        cabinet: 0xf8fafc,      // Crisp white laminate
        bedFabric: 0xe2e8f0,    // Pure linen
        blanket: 0x94a3b8,      // Muted cloud gray
        rug: 0xe2e8f0,          // Cream woven wool
      };
    case 'minimalist-oak':
    default:
      return {
        wood: 0xd4a373,         // Warm natural Scandinavian oak
        fabricSofa: 0x64748b,   // Slate heather linen
        accentPillow: 0xe07a5f, // Terracotta accent
        marble: 0xfafafa,       // Calacatta honed marble
        cabinet: 0x1e293b,      // Matte midnight slate
        bedFabric: 0x334155,    // Navy blue upholstery
        blanket: 0xc4a482,      // Warm camel cashmere
        rug: 0xd6ccc2,          // Warm ivory loop pile
      };
  }
}

/**
 * Builds high-end Living Lounge furniture:
 * L-sectional sofa with pillows, coffee table with accessories,
 * 75" OLED TV, floating fluted media console, arc lamp, woven area rug.
 */
export function buildLivingRoomFurniture(
  partX: number,
  unitH: number,
  unitW: number,
  interiorStyle: InteriorStyle
): THREE.Group {
  const group = new THREE.Group();
  const palette = getStylePalette(interiorStyle);

  const sofaFabricMat = new THREE.MeshStandardMaterial({
    color: palette.fabricSofa,
    roughness: 0.85,
    metalness: 0.05,
  });

  const accentPillowMat = new THREE.MeshStandardMaterial({
    color: palette.accentPillow,
    roughness: 0.75,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: palette.wood,
    roughness: 0.45,
    metalness: 0.1,
  });

  const steelLegMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.3,
    metalness: 0.9,
  });

  // Base position centered in living area
  const posX = partX + 4.2;
  const posZ = unitW * 0.18;

  // 1. Scandinavian Woven Area Rug
  const rugMat = new THREE.MeshStandardMaterial({
    color: palette.rug,
    roughness: 0.95,
  });
  const rugGeo = new THREE.BoxGeometry(8.5, 0.04, 6.0);
  const rugMesh = new THREE.Mesh(rugGeo, rugMat);
  rugMesh.position.set(posX, 0.52, posZ);
  rugMesh.receiveShadow = true;
  group.add(rugMesh);

  // 2. Modern Deep-Seat Sectional Sofa
  const sofaGroup = new THREE.Group();
  sofaGroup.position.set(posX, 0.5, posZ + 1.2);

  // Sofa Platform Base
  const baseGeo = new THREE.BoxGeometry(7.0, 0.4, 3.0);
  const baseMesh = new THREE.Mesh(baseGeo, sofaFabricMat);
  baseMesh.position.set(0, 0.4, 0);
  baseMesh.castShadow = true;
  sofaGroup.add(baseMesh);

  // Sofa Legs (4 tapered black metal pegs)
  const legGeo = new THREE.CylinderGeometry(0.08, 0.05, 0.4, 8);
  [
    [-3.2, 0.2, 1.2],
    [3.2, 0.2, 1.2],
    [-3.2, 0.2, -1.2],
    [3.2, 0.2, -1.2],
  ].forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(legGeo, steelLegMat);
    leg.position.set(lx, ly, lz);
    sofaGroup.add(leg);
  });

  // Main Seat Cushions (3 separate tailored cushions)
  const cushionW = 2.15;
  for (let i = 0; i < 3; i++) {
    const cx = -2.15 + i * cushionW;
    const seatGeo = new THREE.BoxGeometry(cushionW - 0.08, 0.5, 2.5);
    const seatMesh = new THREE.Mesh(seatGeo, sofaFabricMat);
    seatMesh.position.set(cx, 0.85, -0.15);
    seatMesh.castShadow = true;
    sofaGroup.add(seatMesh);
  }

  // Sofa Backrest
  const backGeo = new THREE.BoxGeometry(7.0, 1.6, 0.6);
  const backMesh = new THREE.Mesh(backGeo, sofaFabricMat);
  backMesh.position.set(0, 1.4, 1.2);
  backMesh.castShadow = true;
  sofaGroup.add(backMesh);

  // Sofa Armrests (Left & Right)
  const armGeo = new THREE.BoxGeometry(0.55, 1.2, 3.0);
  [-3.25, 3.25].forEach((ax) => {
    const arm = new THREE.Mesh(armGeo, sofaFabricMat);
    arm.position.set(ax, 1.1, 0);
    arm.castShadow = true;
    sofaGroup.add(arm);
  });

  // Chaise Lounge Section on Left
  const chaiseGeo = new THREE.BoxGeometry(2.2, 0.9, 2.2);
  const chaise = new THREE.Mesh(chaiseGeo, sofaFabricMat);
  chaise.position.set(-2.4, 0.65, -1.8);
  chaise.castShadow = true;
  sofaGroup.add(chaise);

  // Decorative Throw Pillows
  const pillowGeo = new THREE.BoxGeometry(1.0, 1.0, 0.35);
  const pillow1 = new THREE.Mesh(pillowGeo, accentPillowMat);
  pillow1.position.set(-2.8, 1.3, 0.8);
  pillow1.rotation.y = 0.25;
  sofaGroup.add(pillow1);

  const pillow2 = new THREE.Mesh(pillowGeo, accentPillowMat);
  pillow2.position.set(2.8, 1.3, 0.8);
  pillow2.rotation.y = -0.25;
  sofaGroup.add(pillow2);

  group.add(sofaGroup);

  // 3. Solid Oak & Black Steel Coffee Table
  const tableGroup = new THREE.Group();
  tableGroup.position.set(posX + 0.3, 0.5, posZ - 1.2);

  const topGeo = new THREE.BoxGeometry(3.6, 0.15, 2.0);
  const topMesh = new THREE.Mesh(topGeo, woodMat);
  topMesh.position.set(0, 1.0, 0);
  topMesh.castShadow = true;
  tableGroup.add(topMesh);

  // Table Hairpin Legs
  const tableLegGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.95, 8);
  [
    [-1.6, 0.5, 0.8],
    [1.6, 0.5, 0.8],
    [-1.6, 0.5, -0.8],
    [1.6, 0.5, -0.8],
  ].forEach(([tx, ty, tz]) => {
    const tleg = new THREE.Mesh(tableLegGeo, steelLegMat);
    tleg.position.set(tx, ty, tz);
    tableGroup.add(tleg);
  });

  // Accessories on Coffee Table: Ceramic Mug, Magazine, Potted Succulent
  const mugGeo = new THREE.CylinderGeometry(0.15, 0.12, 0.3, 12);
  const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
  const mug = new THREE.Mesh(mugGeo, ceramicMat);
  mug.position.set(-0.8, 1.2, 0.3);
  tableGroup.add(mug);

  const magGeo = new THREE.BoxGeometry(0.8, 0.04, 0.6);
  const magMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
  const magazine = new THREE.Mesh(magGeo, magMat);
  magazine.position.set(0.3, 1.1, -0.2);
  magazine.rotation.y = 0.3;
  tableGroup.add(magazine);

  // Small succulent planter
  const potGeo = new THREE.CylinderGeometry(0.2, 0.15, 0.25, 12);
  const potMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 });
  const plantPot = new THREE.Mesh(potGeo, potMat);
  plantPot.position.set(1.0, 1.2, 0.4);
  tableGroup.add(plantPot);

  const plantGeo = new THREE.SphereGeometry(0.18, 8, 8);
  const plantMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
  const succulent = new THREE.Mesh(plantGeo, plantMat);
  succulent.position.set(1.0, 1.4, 0.4);
  tableGroup.add(succulent);

  group.add(tableGroup);

  // 4. Entertainment Wall: 75" OLED 4K TV & Floating Fluted Console
  const tvGroup = new THREE.Group();
  tvGroup.position.set(posX, 0, -unitW / 2 + 0.3);

  // Floating Fluted Wood Credenza Console
  const credenzaGeo = new THREE.BoxGeometry(6.5, 1.1, 1.4);
  const credenza = new THREE.Mesh(credenzaGeo, woodMat);
  credenza.position.set(0, 1.8, 0.7);
  credenza.castShadow = true;
  tvGroup.add(credenza);

  // Ultra-Thin 75" OLED TV
  const tvFrameGeo = new THREE.BoxGeometry(5.4, 3.1, 0.12);
  const tvFrameMat = new THREE.MeshStandardMaterial({ color: 0x05070a, metalness: 0.9, roughness: 0.2 });
  const tvFrame = new THREE.Mesh(tvFrameGeo, tvFrameMat);
  tvFrame.position.set(0, 4.2, 0.2);
  tvGroup.add(tvFrame);

  // Glossy Dark Screen
  const tvScreenGeo = new THREE.BoxGeometry(5.2, 2.9, 0.05);
  const tvScreenMat = new THREE.MeshPhysicalMaterial({
    color: 0x090d16,
    roughness: 0.05,
    metalness: 0.9,
    reflectivity: 0.95,
  });
  const tvScreen = new THREE.Mesh(tvScreenGeo, tvScreenMat);
  tvScreen.position.set(0, 4.2, 0.25);
  tvGroup.add(tvScreen);

  // Subtle TV Bias Ambient Backlight
  const tvLight = new THREE.PointLight(0x38bdf8, 0.7, 12);
  tvLight.position.set(0, 4.2, 0.1);
  tvGroup.add(tvLight);

  group.add(tvGroup);

  // 5. Modern Minimalist Arc Brass Floor Lamp
  const lampGroup = new THREE.Group();
  lampGroup.position.set(posX + 4.2, 0.5, posZ + 2.2);

  const lampBaseGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.1, 16);
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });
  const lampBase = new THREE.Mesh(lampBaseGeo, brassMat);
  lampBase.position.set(0, 0.05, 0);
  lampGroup.add(lampBase);

  // Arc Pole
  const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 5.8, 8);
  const pole = new THREE.Mesh(poleGeo, brassMat);
  pole.position.set(0, 2.9, 0);
  lampGroup.add(pole);

  // Lamp Dome Shade
  const shadeGeo = new THREE.SphereGeometry(0.45, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const shade = new THREE.Mesh(shadeGeo, brassMat);
  shade.position.set(-0.6, 5.8, -0.4);
  shade.rotation.x = Math.PI;
  lampGroup.add(shade);

  // Warm floor lamp glow
  const lampLight = new THREE.PointLight(0xffecd1, 1.2, 14);
  lampLight.position.set(-0.6, 5.4, -0.4);
  lampGroup.add(lampLight);

  group.add(lampGroup);

  return group;
}

/**
 * Builds Chef's Open Kitchen & Dining Island:
 * Waterfall marble island, dark cabinetry, undermount sink, induction cooktop,
 * overhead extractor hood, stainless steel refrigerator, and barstools.
 */
export function buildKitchenDiningFurniture(
  partX: number,
  unitH: number,
  unitW: number,
  interiorStyle: InteriorStyle
): THREE.Group {
  const group = new THREE.Group();
  const palette = getStylePalette(interiorStyle);

  const marbleMat = new THREE.MeshStandardMaterial({
    color: palette.marble,
    roughness: 0.2,
    metalness: 0.1,
  });

  const cabinetMat = new THREE.MeshStandardMaterial({
    color: palette.cabinet,
    roughness: 0.5,
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.9,
    roughness: 0.2,
  });

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.7,
    roughness: 0.3,
  });

  const posX = partX + 4.0;
  const posY = 0.5;

  // 1. Waterfall Marble Island Counter
  const islandW = 7.5;
  const islandH = 3.0;
  const islandD = 2.8;

  // Cabinet base
  const islandBaseGeo = new THREE.BoxGeometry(islandW - 0.5, islandH - 0.2, islandD - 0.4);
  const islandBase = new THREE.Mesh(islandBaseGeo, cabinetMat);
  islandBase.position.set(posX, posY + (islandH - 0.2) / 2, 0);
  islandBase.castShadow = true;
  group.add(islandBase);

  // Marble Countertop (Waterfall Slab)
  const slabThick = 0.22;
  const counterTopGeo = new THREE.BoxGeometry(islandW, slabThick, islandD);
  const counterTop = new THREE.Mesh(counterTopGeo, marbleMat);
  counterTop.position.set(posX, posY + islandH, 0);
  counterTop.castShadow = true;
  group.add(counterTop);

  // Waterfall Cascading Ends (Left & Right)
  const cascadeGeo = new THREE.BoxGeometry(slabThick, islandH, islandD);
  [-islandW / 2 + slabThick / 2, islandW / 2 - slabThick / 2].forEach((cx) => {
    const cascade = new THREE.Mesh(cascadeGeo, marbleMat);
    cascade.position.set(posX + cx, posY + islandH / 2, 0);
    cascade.castShadow = true;
    group.add(cascade);
  });

  // 2. Ceramic Induction Cooktop with glowing burner rings
  const cooktopGeo = new THREE.BoxGeometry(2.4, 0.05, 1.8);
  const cooktopMat = new THREE.MeshPhysicalMaterial({ color: 0x0a0e17, roughness: 0.1, metalness: 0.9 });
  const cooktop = new THREE.Mesh(cooktopGeo, cooktopMat);
  cooktop.position.set(posX - 1.5, posY + islandH + 0.12, 0);
  group.add(cooktop);

  // Glowing induction element
  const burnerGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.02, 16);
  const burnerMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
  const burner = new THREE.Mesh(burnerGeo, burnerMat);
  burner.position.set(posX - 1.5, posY + islandH + 0.15, 0);
  group.add(burner);

  // 3. Stainless Steel Undermount Sink & Gooseneck Faucet
  const sinkGeo = new THREE.BoxGeometry(1.8, 0.08, 1.4);
  const sinkMesh = new THREE.Mesh(sinkGeo, steelMat);
  sinkMesh.position.set(posX + 1.6, posY + islandH + 0.05, 0);
  group.add(sinkMesh);

  // Gooseneck matte black faucet
  const faucetBaseGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8);
  const faucet = new THREE.Mesh(faucetBaseGeo, blackMat);
  faucet.position.set(posX + 1.6, posY + islandH + 0.5, -0.6);
  group.add(faucet);

  const faucetSpoutGeo = new THREE.BoxGeometry(0.08, 0.08, 0.5);
  const spout = new THREE.Mesh(faucetSpoutGeo, blackMat);
  spout.position.set(posX + 1.6, posY + islandH + 0.9, -0.4);
  group.add(spout);

  // 4. Stainless Steel Chimney Extractor Hood
  const hoodGeo = new THREE.BoxGeometry(3.0, 0.4, 2.0);
  const hood = new THREE.Mesh(hoodGeo, steelMat);
  hood.position.set(posX - 1.5, unitH - 1.2, 0);
  group.add(hood);

  const flueGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16);
  const flue = new THREE.Mesh(flueGeo, steelMat);
  flue.position.set(posX - 1.5, unitH - 0.4, 0);
  group.add(flue);

  // 5. French Door Stainless Steel Refrigerator
  const fridgeGeo = new THREE.BoxGeometry(2.8, 6.2, 2.4);
  const fridge = new THREE.Mesh(fridgeGeo, steelMat);
  fridge.position.set(posX - 3.8, posY + 3.1, -unitW / 2 + 1.6);
  fridge.castShadow = true;
  group.add(fridge);

  // Vertical Refrigerator Bar Handles
  const fridgeHandleGeo = new THREE.CylinderGeometry(0.05, 0.05, 3.5, 8);
  const fHandleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 });
  [-0.15, 0.15].forEach((hx) => {
    const handle = new THREE.Mesh(fridgeHandleGeo, fHandleMat);
    handle.position.set(posX - 3.8 + hx, posY + 3.2, -unitW / 2 + 2.85);
    group.add(handle);
  });

  // 6. Scandinavian Counter Barstools (Pair on breakfast side)
  const stoolMat = new THREE.MeshStandardMaterial({ color: palette.wood, roughness: 0.5 });
  [-1.2, 1.2].forEach((sx) => {
    const stoolGroup = new THREE.Group();
    stoolGroup.position.set(posX + sx, posY, 2.1);

    // Stool Curved Seat
    const seatGeo = new THREE.CylinderGeometry(0.65, 0.6, 0.2, 16);
    const seat = new THREE.Mesh(seatGeo, stoolMat);
    seat.position.set(0, 2.2, 0);
    stoolGroup.add(seat);

    // Slender metal legs
    const stoolLegGeo = new THREE.CylinderGeometry(0.04, 0.03, 2.2, 8);
    [
      [-0.35, 1.1, 0.35],
      [0.35, 1.1, 0.35],
      [-0.35, 1.1, -0.35],
      [0.35, 1.1, -0.35],
    ].forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(stoolLegGeo, blackMat);
      leg.position.set(lx, ly, lz);
      stoolGroup.add(leg);
    });

    group.add(stoolGroup);
  });

  // 7. Floating Open Shelving with Ceramic Dishware
  const shelfGeo = new THREE.BoxGeometry(4.5, 0.12, 0.8);
  const shelfWoodMat = new THREE.MeshStandardMaterial({ color: palette.wood, roughness: 0.4 });
  const shelf = new THREE.Mesh(shelfGeo, shelfWoodMat);
  shelf.position.set(posX + 1.2, posY + 5.0, -unitW / 2 + 0.6);
  group.add(shelf);

  // Stacked ceramic bowls
  const bowlGeo = new THREE.CylinderGeometry(0.35, 0.25, 0.2, 12);
  const bowlMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
  [-1.2, 0, 1.2].forEach((bx) => {
    const bowl = new THREE.Mesh(bowlGeo, bowlMat);
    bowl.position.set(posX + 1.2 + bx, posY + 5.2, -unitW / 2 + 0.6);
    group.add(bowl);
  });

  return group;
}

/**
 * Builds Luxury Master Bedroom Suite:
 * King platform bed with channeled headboard, luxury duvet with accent throw,
 * 4 angled pillows, twin floating nightstands with LED sconces, and built-in closet.
 */
export function buildBedroomSuiteFurniture(
  partX: number,
  unitH: number,
  unitW: number,
  interiorStyle: InteriorStyle
): THREE.Group {
  const group = new THREE.Group();
  const palette = getStylePalette(interiorStyle);

  const bedFabricMat = new THREE.MeshStandardMaterial({
    color: palette.bedFabric,
    roughness: 0.8,
  });

  const duvetMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // Crisp white luxury linen
    roughness: 0.9,
  });

  const blanketMat = new THREE.MeshStandardMaterial({
    color: palette.blanket,
    roughness: 0.85,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: palette.wood,
    roughness: 0.45,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.9,
    roughness: 0.25,
  });

  const posX = partX - 4.2;
  const posZ = 0;
  const posY = 0.5;

  // 1. King Floating Platform Bed Frame with Recessed Shadow Plinth
  const bedW = 6.6;
  const bedL = 7.0;
  const bedH = 1.0;

  // Textured Bedroom Rug under Bed
  const rugGeo = new THREE.BoxGeometry(bedW + 2.5, 0.04, bedL + 2.0);
  const rugMat = new THREE.MeshStandardMaterial({ color: palette.rug, roughness: 0.95 });
  const rug = new THREE.Mesh(rugGeo, rugMat);
  rug.position.set(posX, posY + 0.02, posZ - 0.5);
  rug.receiveShadow = true;
  group.add(rug);

  const platformGeo = new THREE.BoxGeometry(bedW, 0.5, bedL);
  const platform = new THREE.Mesh(platformGeo, woodMat);
  platform.position.set(posX, posY + 0.25, posZ);
  platform.castShadow = true;
  group.add(platform);

  // Recessed floating shadow plinth
  const plinthGeo = new THREE.BoxGeometry(bedW - 1.2, 0.2, bedL - 1.2);
  const plinthMat = new THREE.MeshBasicMaterial({ color: 0x05070a });
  const plinth = new THREE.Mesh(plinthGeo, plinthMat);
  plinth.position.set(posX, posY + 0.1, posZ);
  group.add(plinth);

  // 2. Channeled Upholstered Headboard with vertical acoustic slats
  const headboardGeo = new THREE.BoxGeometry(bedW + 1.4, 3.4, 0.45);
  const headboard = new THREE.Mesh(headboardGeo, bedFabricMat);
  headboard.position.set(posX, posY + 2.0, posZ + bedL / 2 - 0.2);
  headboard.castShadow = true;
  group.add(headboard);

  // Vertical channels
  for (let c = 0; c < 7; c++) {
    const cx = posX - (bedW + 1.2) / 2 + 0.3 + c * ((bedW + 0.6) / 6);
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 0.1), new THREE.MeshStandardMaterial({ color: 0x111827 }));
    slat.position.set(cx, posY + 2.0, posZ + bedL / 2 + 0.05);
    group.add(slat);
  }

  // 3. Thick Luxury Pillow-Top Mattress
  const mattressGeo = new THREE.BoxGeometry(bedW - 0.3, 0.9, bedL - 0.5);
  const mattressMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
  const mattress = new THREE.Mesh(mattressGeo, mattressMat);
  mattress.position.set(posX, posY + 0.95, posZ - 0.15);
  mattress.castShadow = true;
  group.add(mattress);

  // 4. Folded Luxury Duvet with Organic Fold Lines
  const duvetGeo = new THREE.BoxGeometry(bedW - 0.25, 0.4, bedL * 0.68);
  const duvet = new THREE.Mesh(duvetGeo, duvetMat);
  duvet.position.set(posX, posY + 1.3, posZ - 0.7);
  duvet.castShadow = true;
  group.add(duvet);

  // Sheet Turnover Collar
  const sheetCuff = new THREE.Mesh(
    new THREE.BoxGeometry(bedW - 0.3, 0.12, 0.6),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 })
  );
  sheetCuff.position.set(posX, posY + 1.36, posZ + 0.85);
  group.add(sheetCuff);

  // Folded Foot Blanket (Cashmere / Wool Accent) draped diagonally across lower corner
  const blanketGeo = new THREE.BoxGeometry(bedW - 0.1, 0.18, 2.2);
  const blanket = new THREE.Mesh(blanketGeo, blanketMat);
  blanket.position.set(posX + 0.1, posY + 1.5, posZ - 1.8);
  blanket.rotation.y = 0.07;
  blanket.castShadow = true;
  group.add(blanket);

  // Side drape over mattress edge
  const sideDrape = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.65, 1.8), blanketMat);
  sideDrape.position.set(posX + bedW / 2 - 0.1, posY + 1.15, posZ - 1.8);
  sideDrape.castShadow = true;
  group.add(sideDrape);

  // 5. Layered Pillows: Euro Shams + Sleeping Pillows + Accent Toss Cushions
  const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
  const pillowGeo = new THREE.BoxGeometry(2.2, 0.45, 1.4);

  [-1.6, 1.6].forEach((px) => {
    // Back Euro Sham
    const backPillow = new THREE.Mesh(pillowGeo, bedFabricMat);
    backPillow.position.set(posX + px, posY + 1.7, posZ + bedL / 2 - 1.2);
    backPillow.rotation.x = -0.3;
    group.add(backPillow);

    // Front Sleeping Pillow
    const frontPillow = new THREE.Mesh(pillowGeo, pillowMat);
    frontPillow.position.set(posX + px, posY + 1.5, posZ + bedL / 2 - 1.8);
    frontPillow.rotation.x = -0.15;
    group.add(frontPillow);
  });

  // Toss Pillows
  [-0.9, 0.9].forEach((px, i) => {
    const toss = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 0.35), new THREE.MeshStandardMaterial({ color: palette.accentPillow, roughness: 0.8 }));
    toss.position.set(posX + px, posY + 1.5, posZ + bedL / 2 - 2.2);
    toss.rotation.y = i === 0 ? 0.2 : -0.2;
    toss.rotation.x = -0.2;
    toss.castShadow = true;
    group.add(toss);
  });

  // 6. Matching Scandinavian Oak Floating Nightstands with Ceramic Lamps
  const nightstandGeo = new THREE.BoxGeometry(1.6, 0.7, 1.4);
  const nsOffsets = [-bedW / 2 - 0.95, bedW / 2 + 0.95];

  nsOffsets.forEach((nx) => {
    const ns = new THREE.Mesh(nightstandGeo, woodMat);
    ns.position.set(posX + nx, posY + 1.2, posZ + bedL / 2 - 0.9);
    ns.castShadow = true;
    group.add(ns);

    // Ceramic Table Lamp
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.6, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
    lampBase.position.set(posX + nx, posY + 1.85, posZ + bedL / 2 - 0.9);
    lampBase.castShadow = true;
    group.add(lampBase);

    const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.65, 16), new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.9 }));
    lampShade.position.set(posX + nx, posY + 2.35, posZ + bedL / 2 - 0.9);
    group.add(lampShade);

    // Warm reading light
    const readLight = new THREE.PointLight(0xffecd1, 0.9, 8);
    readLight.position.set(posX + nx, posY + 2.35, posZ + bedL / 2 - 0.9);
    group.add(readLight);
  });

  // 7. Corner Potted Indoor Plant (Monstera / Fiddle-Leaf Fig)
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.38, 1.1, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
  pot.position.set(posX + bedW / 2 + 1.8, posY + 0.55, posZ - bedL / 2 + 1.2);
  pot.castShadow = true;
  group.add(pot);

  const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 8), new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 }));
  foliage.position.set(posX + bedW / 2 + 1.8, posY + 1.6, posZ - bedL / 2 + 1.2);
  foliage.castShadow = true;
  group.add(foliage);

  // 8. Built-in Modern Wardrobe Closet with Slatted Doors
  const closetGeo = new THREE.BoxGeometry(1.6, 6.8, unitW - 1.2);
  const closetMat = new THREE.MeshStandardMaterial({ color: palette.cabinet, roughness: 0.6 });
  const closet = new THREE.Mesh(closetGeo, closetMat);
  closet.position.set(posX - 4.5, posY + 3.4, 0);
  closet.castShadow = true;
  group.add(closet);

  return group;
}

/**
 * Builds Luxury Spa Bathroom:
 * Walk-in Crittall glass rain shower, stone floor, floating vanity with vessel sink,
 * illuminated round mirror, and wall-hung toilet.
 */
export function buildBathroomSpaFurniture(
  partX: number,
  unitH: number,
  unitW: number,
  interiorStyle: InteriorStyle
): THREE.Group {
  const group = new THREE.Group();
  const palette = getStylePalette(interiorStyle);

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xccfbf1,
    transmission: 0.92,
    opacity: 0.85,
    transparent: true,
    roughness: 0.05,
    reflectivity: 0.9,
    ior: 1.5,
  });

  const blackSteelMat = new THREE.MeshStandardMaterial({
    color: 0x090d14,
    metalness: 0.85,
    roughness: 0.25,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: palette.wood,
    roughness: 0.45,
  });

  const ceramicWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.15,
  });

  const posX = partX - 2.8;
  const posY = 0.5;

  // 1. Walk-In Rain Shower Enclosure (Crittall Black Grid)
  const showerW = 3.6;
  const showerD = 3.6;
  const showerH = unitH - 1.2;

  // Glass Partition Screen
  const screenGeo = new THREE.BoxGeometry(showerW, showerH, 0.08);
  const screenMesh = new THREE.Mesh(screenGeo, glassMat);
  screenMesh.position.set(posX, posY + showerH / 2, -unitW / 2 + showerD);
  group.add(screenMesh);

  // Black Metal Perimeter Frame
  const frameGeo = new THREE.BoxGeometry(showerW + 0.1, showerH + 0.1, 0.15);
  const frameMesh = new THREE.Mesh(frameGeo, blackSteelMat);
  frameMesh.position.set(posX, posY + showerH / 2, -unitW / 2 + showerD);
  group.add(frameMesh);

  // Overhead Square Rain Shower Head
  const headGeo = new THREE.BoxGeometry(0.8, 0.08, 0.8);
  const showerHead = new THREE.Mesh(headGeo, blackSteelMat);
  showerHead.position.set(posX, unitH - 1.0, -unitW / 2 + showerD / 2);
  group.add(showerHead);

  const downrodGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
  const downrod = new THREE.Mesh(downrodGeo, blackSteelMat);
  downrod.position.set(posX, unitH - 0.5, -unitW / 2 + showerD / 2);
  group.add(downrod);

  // Thermostatic Wall Mixer Valve & Handheld Wand
  const valveGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16);
  const valve = new THREE.Mesh(valveGeo, blackSteelMat);
  valve.position.set(posX - showerW / 2 + 0.1, posY + 3.2, -unitW / 2 + showerD / 2);
  valve.rotation.z = Math.PI / 2;
  group.add(valve);

  // 2. Floating Fluted Oak Vanity with Ceramic Vessel Sink
  const vanityW = 3.2;
  const vanityH = 1.6;
  const vanityD = 1.8;

  const vanityGeo = new THREE.BoxGeometry(vanityW, vanityH, vanityD);
  const vanity = new THREE.Mesh(vanityGeo, woodMat);
  vanity.position.set(posX, posY + 2.2, unitW / 2 - vanityD / 2);
  vanity.castShadow = true;
  group.add(vanity);

  // Ceramic Vessel Sink on top of vanity
  const sinkGeo = new THREE.BoxGeometry(1.6, 0.45, 1.2);
  const sink = new THREE.Mesh(sinkGeo, ceramicWhiteMat);
  sink.position.set(posX, posY + 3.2, unitW / 2 - vanityD / 2);
  sink.castShadow = true;
  group.add(sink);

  // Tall Matte Black Basin Faucet
  const faucetGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8);
  const faucet = new THREE.Mesh(faucetGeo, blackSteelMat);
  faucet.position.set(posX, posY + 3.6, unitW / 2 - 0.4);
  group.add(faucet);

  // 3. Illuminated Round Frameless LED Mirror
  const mirrorGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.08, 32);
  const mirrorMat = new THREE.MeshPhysicalMaterial({
    color: 0xe0f2fe,
    roughness: 0.02,
    reflectivity: 0.98,
    metalness: 0.9,
  });
  const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
  mirror.position.set(posX, posY + 4.9, unitW / 2 - 0.08);
  mirror.rotation.x = Math.PI / 2;
  group.add(mirror);

  // Warm LED Backlight Halo
  const mirrorHalo = new THREE.PointLight(0xffedd5, 1.4, 10);
  mirrorHalo.position.set(posX, posY + 4.9, unitW / 2 - 0.3);
  group.add(mirrorHalo);

  // 4. Modern Wall-Hung Ceramic Toilet
  const toiletGeo = new THREE.BoxGeometry(1.4, 1.2, 2.0);
  const toilet = new THREE.Mesh(toiletGeo, ceramicWhiteMat);
  toilet.position.set(posX + 3.0, posY + 1.2, unitW / 2 - 1.2);
  toilet.castShadow = true;
  group.add(toilet);

  // Dual-Flush Wall Actuator Plate
  const plateGeo = new THREE.BoxGeometry(0.8, 0.5, 0.05);
  const plate = new THREE.Mesh(plateGeo, blackSteelMat);
  plate.position.set(posX + 3.0, posY + 2.8, unitW / 2 - 0.05);
  group.add(plate);

  return group;
}

/**
 * Builds realistic luxury outdoor deck patio furniture and decor:
 * - Architectural teak & black steel deep lounge chairs with throw pillows
 * - Modern concrete fire table with glowing lava glass embers and soft ambient light
 * - Lifestyle tabletop decor: ceramic mugs and design journal
 * - Sleek modern cantilever patio parasol / umbrella
 * - Architectural fluted planters with rich lush foliage
 * - Warm recessed deck edge marker lights
 */
export function buildOutdoorDeckFurniture(
  deckWidthFt: number,
  deckDepthFt: number,
  baseElevation: number,
  unitWFt: number,
  frontDoorBounds?: { xMin: number; xMax: number }[]
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'outdoor-deck-furniture';

  const teakMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.55 });
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.85 });
  const pillowMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.8 }); // Terracotta accent
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.3 });
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.6 });
  const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });

  const deckZ = unitWFt / 2 + deckDepthFt / 2;
  const deckY = baseElevation + 0.48; // Matches top of timber deck

  // Calculate a comfortable lounge zone that NEVER blocks any door or walk-through path
  let loungeCenterX = deckWidthFt >= 24 ? (deckWidthFt / 2 - 6.5) : 0;
  if (frontDoorBounds && frontDoorBounds.length > 0) {
    const isObstructed = (cx: number, halfSpan: number) => {
      return frontDoorBounds.some((b) => (cx + halfSpan) >= (b.xMin - 1.2) && (cx - halfSpan) <= (b.xMax + 1.2));
    };

    if (isObstructed(loungeCenterX, 3.8)) {
      // Try opposite side of the deck
      const altCenterX = -deckWidthFt / 2 + 6.5;
      if (!isObstructed(altCenterX, 3.8)) {
        loungeCenterX = altCenterX;
      }
    }
  }

  // 1. Pair of Sleek Modern Deck Lounge Chairs
  [-2.4, 2.4].forEach((offsetRel, idx) => {
    const cx = loungeCenterX + offsetRel;
    const chairGroup = new THREE.Group();
    chairGroup.position.set(cx, deckY, deckZ);
    chairGroup.rotation.y = idx === 0 ? 0.15 : -0.15;

    // Platform Base
    const seatGeo = new THREE.BoxGeometry(2.1, 0.2, 2.1);
    const seat = new THREE.Mesh(seatGeo, teakMat);
    seat.position.set(0, 0.55, 0);
    seat.castShadow = true;
    chairGroup.add(seat);

    // Bottom Cushion
    const seatCushionGeo = new THREE.BoxGeometry(2.0, 0.25, 2.0);
    const seatCushion = new THREE.Mesh(seatCushionGeo, cushionMat);
    seatCushion.position.set(0, 0.78, 0);
    seatCushion.castShadow = true;
    chairGroup.add(seatCushion);

    // Backrest Frame
    const backFrameGeo = new THREE.BoxGeometry(2.1, 1.6, 0.15);
    const backFrame = new THREE.Mesh(backFrameGeo, teakMat);
    backFrame.position.set(0, 1.4, 0.9);
    backFrame.rotation.x = -0.22;
    backFrame.castShadow = true;
    chairGroup.add(backFrame);

    // Back Cushion
    const backCushionGeo = new THREE.BoxGeometry(1.95, 1.4, 0.22);
    const backCushion = new THREE.Mesh(backCushionGeo, cushionMat);
    backCushion.position.set(0, 1.4, 0.8);
    backCushion.rotation.x = -0.22;
    backCushion.castShadow = true;
    chairGroup.add(backCushion);

    // Accent Pillow
    const pillowGeo = new THREE.BoxGeometry(0.8, 0.7, 0.2);
    const pillow = new THREE.Mesh(pillowGeo, pillowMat);
    pillow.position.set(idx === 0 ? 0.35 : -0.35, 1.1, 0.65);
    pillow.rotation.x = -0.22;
    pillow.castShadow = true;
    chairGroup.add(pillow);

    // Sleek Steel Legs
    const legGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.55, 8);
    [
      [-0.9, 0.28, 0.85],
      [0.9, 0.28, 0.85],
      [-0.9, 0.28, -0.85],
      [0.9, 0.28, -0.85],
    ].forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, metalMat);
      leg.position.set(lx, ly, lz);
      chairGroup.add(leg);
    });

    group.add(chairGroup);
  });

  // 2. Slim Low Wood Drinks Coffee Table between chairs
  const coffeeTable = new THREE.Group();
  coffeeTable.position.set(loungeCenterX, deckY, deckZ);

  const ctTopGeo = new THREE.BoxGeometry(1.8, 0.12, 1.4);
  const ctTop = new THREE.Mesh(ctTopGeo, tableMat);
  ctTop.position.y = 0.65;
  ctTop.castShadow = true;
  coffeeTable.add(ctTop);

  const ctLegGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
  [
    [-0.75, 0.3, 0.55],
    [0.75, 0.3, 0.55],
    [-0.75, 0.3, -0.55],
    [0.75, 0.3, -0.55],
  ].forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(ctLegGeo, metalMat);
    leg.position.set(lx, ly, lz);
    coffeeTable.add(leg);
  });

  // Ceramic Coffee Mugs on Table
  [-0.35, 0.35].forEach((mx) => {
    const mugGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.22, 10);
    const mug = new THREE.Mesh(mugGeo, ceramicMat);
    mug.position.set(mx, 0.82, 0);
    mug.castShadow = true;
    coffeeTable.add(mug);
  });

  group.add(coffeeTable);

  // 3. Low-Profile Modern Planters on Deck Ends
  const planterGeo = new THREE.BoxGeometry(2.4, 1.2, 0.8);
  const planterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });

  [-deckWidthFt / 2 + 2.0, deckWidthFt / 2 - 2.0].forEach((px) => {
    const planter = new THREE.Mesh(planterGeo, planterMat);
    planter.position.set(px, deckY + 0.6, deckZ + deckDepthFt / 2 - 0.7);
    planter.castShadow = true;
    group.add(planter);

    for (let i = 0; i < 4; i++) {
      const leafGeo = new THREE.BoxGeometry(0.28, 1.6, 0.06);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(px - 0.7 + i * 0.45, deckY + 1.8, deckZ + deckDepthFt / 2 - 0.7);
      leaf.rotation.z = (i - 1.5) * 0.08;
      leaf.castShadow = true;
      group.add(leaf);
    }
  });

  // 4. Warm Recessed Deck Step Marker Lights along front edge
  const stepLightCount = 5;
  const stepLightSpacing = (deckWidthFt - 4) / (stepLightCount - 1);
  const stepLightMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
  for (let s = 0; s < stepLightCount; s++) {
    const sx = -(deckWidthFt - 4) / 2 + s * stepLightSpacing;
    const stepLightGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 8);
    const stepLightMesh = new THREE.Mesh(stepLightGeo, stepLightMat);
    stepLightMesh.position.set(sx, deckY + 0.02, deckZ + deckDepthFt / 2 - 0.08);
    group.add(stepLightMesh);
  }

  return group;
}
