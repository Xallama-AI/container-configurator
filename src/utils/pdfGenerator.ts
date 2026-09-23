import jsPDF from 'jspdf';
import { ContainerModelConfig, SitePlanningConfig } from '../types';
import { calculateConfigurationCost } from './calculator';

export function generateArchitecturalPdf(
  modelConfig: ContainerModelConfig,
  siteConfig: SitePlanningConfig,
  clientName?: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const cost = calculateConfigurationCost(modelConfig);
  const sqFt = Math.round(modelConfig.lengthFt * modelConfig.widthFt * (modelConfig.layoutType === 'stacked-2story' ? 2 : 1));
  const docDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const projectRef = `GL-${modelConfig.presetId.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Palette colors
  const primaryColor = [10, 15, 26]; // Dark slate #0a0f1a
  const cyanColor = [0, 200, 220]; // Cyan highlight
  const grayText = [100, 116, 139]; // Slate 500
  const lightBg = [248, 250, 252]; // Slate 50

  // 1. Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 38, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('BEAST ARCHITECTURAL HOMES', 14, 16);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(cyanColor[0], cyanColor[1], cyanColor[2]);
  doc.text('1:1 PRECISION CONTAINER HOUSE SPECIFICATION & INVESTMENT BLUEPRINT', 14, 23);

  doc.setTextColor(200, 210, 220);
  doc.setFontSize(8);
  doc.text(`Doc Ref: ${projectRef}  |  Date: ${docDate}  |  ISO 668 High-Cube Certified`, 14, 30);

  // Status Badge right side
  doc.setFillColor(0, 220, 130);
  doc.rect(155, 12, 42, 8, 'F');
  doc.setTextColor(10, 20, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('FACTORY CERTIFIED', 160, 17.5);

  let y = 46;

  // 2. Project Title & Overview
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(modelConfig.name, 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(
    modelConfig.subtitle ||
      `Turnkey architectural residence engineered with sustainable ISO structural shipping containers.`,
    14,
    y + 5
  );

  y += 14;

  // 3. Key Architectural Metrics (Summary Grid)
  const boxW = 44;
  const boxH = 16;
  const metrics = [
    { label: 'FLOOR AREA', val: `${sqFt} sq ft` },
    { label: 'DIMENSIONS', val: `${modelConfig.lengthFt}' × ${modelConfig.widthFt}' × ${modelConfig.heightFt}'` },
    { label: 'ROOM ZONES', val: `${(modelConfig.partitions || []).length} Living Areas` },
    { label: 'TURNKEY ESTIMATE', val: `$${cost.totalUsd.toLocaleString()}` },
  ];

  metrics.forEach((m, idx) => {
    const bx = 14 + idx * (boxW + 4);
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(bx, y, boxW, boxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.text(m.label, bx + 3, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(m.val, bx + 3, y + 12);
  });

  y += boxH + 10;

  // 4. Detailed Engineering & Material Specification Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('I. ARCHITECTURAL & MATERIAL SCHEDULE', 14, y);
  y += 5;

  const specRows = [
    ['Structural Layout', `${modelConfig.layoutType.replace('-', ' ').toUpperCase()} Configuration`],
    ['Exterior Facade Rainscreen', `${modelConfig.exteriorMaterial.toUpperCase()} with Marine Patina (${modelConfig.colorName})`],
    ['Glazing & Window Envelope', `${modelConfig.glassTint.toUpperCase()} Spectrally Selective Thermal Glass`],
    ['Thermal Insulation', `R-${modelConfig.insulationRValue} Closed-Cell Continuous Envelope`],
    ['Roof Engineering', `${modelConfig.roofOption.toUpperCase()}${modelConfig.solarCapacityKw > 0 ? ` (${modelConfig.solarCapacityKw}kW PV Solar Array)` : ''}`],
    ['Interior Archetype & Flooring', `${modelConfig.interiorStyle.replace('-', ' ').toUpperCase()} with ${modelConfig.flooringMaterial.toUpperCase()}`],
    ['Structural Foundation', `${modelConfig.foundationType.replace('-', ' ').toUpperCase()} Engineering`],
    ['Outdoor Amenities', [
      modelConfig.deckPorch ? `Deck (${modelConfig.deckWidthFt}'×${modelConfig.deckDepthFt}')` : '',
      modelConfig.outdoorAmenities?.plungePool ? 'Plunge Pool' : '',
      modelConfig.outdoorAmenities?.firePitLounge ? 'Fire Pit Lounge' : '',
      modelConfig.outdoorAmenities?.pergolaCanopy ? 'Pergola Canopy' : '',
      modelConfig.staircase ? 'Exterior Architectural Stairs' : '',
    ].filter(Boolean).join(', ') || 'Standard Footprint'],
  ];

  specRows.forEach(([category, detail], i) => {
    const rowY = y + i * 6.2;
    if (i % 2 === 0) {
      doc.setFillColor(250, 252, 255);
      doc.rect(14, rowY - 4.2, 182, 6.2, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(category, 16, rowY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 75, 95);
    doc.text(detail, 75, rowY);
  });

  y += specRows.length * 6.2 + 8;

  // 5. Room Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('II. INTERIOR LIVING ZONES & ROOM SCHEDULE', 14, y);
  y += 5;

  const roomHeaders = ['Room / Living Area', 'Zone Type', 'Position Along Axis', 'Interior Furnishing'];
  doc.setFillColor(240, 244, 250);
  doc.rect(14, y - 4, 182, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(roomHeaders[0], 16, y);
  doc.text(roomHeaders[1], 75, y);
  doc.text(roomHeaders[2], 120, y);
  doc.text(roomHeaders[3], 160, y);
  y += 5;

  const partitions = modelConfig.partitions && modelConfig.partitions.length > 0
    ? modelConfig.partitions
    : [{ id: 'rm-1', name: 'Open Living & Sleeping Suite', roomType: 'living', positionFt: 10, furnishings: true }];

  partitions.forEach((rm, idx) => {
    const rowY = y + idx * 5.8;
    if (idx % 2 === 0) {
      doc.setFillColor(252, 253, 255);
      doc.rect(14, rowY - 4, 182, 5.8, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(rm.name, 16, rowY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 95, 115);
    doc.text(rm.roomType.toUpperCase(), 75, rowY);
    doc.text(`Offset @ ${rm.positionFt} ft`, 120, rowY);
    doc.text(rm.furnishings ? 'Turnkey Furnished' : 'Unfurnished / Open', 160, rowY);
  });

  y += partitions.length * 5.8 + 8;

  // 6. Itemized Turnkey Investment Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('III. ITEMIZED TURNKEY PRODUCTION INVESTMENT', 14, y);
  y += 5;

  const costItems = [
    ['ISO Corten Steel Shipping Container Shells & Frame Fabrication', `$${cost.containerShell.toLocaleString()}`],
    ['Architectural Glazing, 16ft Sliders & Passive Solar Argon Panes', `$${cost.openingsGlazing.toLocaleString()}`],
    ['R-Value Continuous Spray Foam Thermal Envelope', `$${cost.insulationThermal.toLocaleString()}`],
    ['Interior Architectural Millwork, Partitions & Selected Flooring', `$${cost.interiorFinishes.toLocaleString()}`],
    ['Mechanical, Smart Electrical Circuitry & Ducted HVAC Climate Control', `$${cost.mepSystems.toLocaleString()}`],
    ['Engineered Foundation Engineering & Footing Preparation', `$${cost.foundationEstimate.toLocaleString()}`],
    ['Outdoor Decking, Roof Engineering & Configured Amenities', `$${cost.roofSystem.toLocaleString()}`],
    ['Estimated 15-Year Financing (6.5% APR)', `~$${cost.monthlyFinancingUsd.toLocaleString()} / mo`],
    ['Estimated Off-Site Prefabrication Timeline', `${cost.constructionWeeks} weeks`],
  ];

  costItems.forEach(([item, amount], idx) => {
    const rowY = y + idx * 5.2;
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, rowY - 3.8, 182, 5.2, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(50, 65, 85);
    doc.text(item, 16, rowY);

    doc.setFont('helvetica', 'bold');
    doc.text(amount, 180, rowY, { align: 'right' });
  });

  y += costItems.length * 5.2 + 4;

  // Total Box
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, y, 182, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL ESTIMATED TURNKEY PRODUCTION COST', 18, y + 7.5);
  doc.setTextColor(cyanColor[0], cyanColor[1], cyanColor[2]);
  doc.setFontSize(12);
  doc.text(`$${cost.totalUsd.toLocaleString()} USD`, 192, y + 7.5, { align: 'right' });

  y += 18;

  // 7. Footer & Legal Disclaimer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(
    'This specification sheet is generated automatically by BEAST Architectural Studio based on 1:1 ISO 668 standards.',
    14,
    y
  );
  doc.text(
    'Pricing includes prefabricated off-site manufacturing and standard site installation. Certified engineering stamps provided upon final contract.',
    14,
    y + 3.5
  );

  // =========================================================================
  // PAGE 2: ARCHITECTURAL 2D FLOOR PLAN & DIMENSION MATRIX SCHEMATIC
  // =========================================================================
  doc.addPage('a4', 'landscape');

  const pageW = 297;
  const pageH = 210;
  const is2Story = modelConfig.layoutType === 'stacked-2story';
  const isWide = modelConfig.layoutType === 'double-wide' || modelConfig.layoutType === 'triple-wide';

  // Architectural Sheet Border
  doc.setDrawColor(20, 25, 35);
  doc.setLineWidth(0.6);
  doc.rect(8, 8, pageW - 16, pageH - 16, 'S');

  doc.setLineWidth(0.2);
  doc.rect(10, 10, pageW - 20, pageH - 20, 'S');

  // Sheet Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(10, 10, pageW - 20, 18, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('BEAST ARCHITECTURAL HOMES — 2D FLOOR PLAN BLUEPRINT', 16, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 220, 240);
  doc.text(
    `PROJECT: ${modelConfig.name.toUpperCase()}  |  LAYOUT: ${modelConfig.layoutType.toUpperCase()}  |  ENSUITE FLOW: ${modelConfig.attachedBath ? 'ATTACHED MASTER ENSUITE' : 'INDEPENDENT CORRIDOR ACCESS'}`,
    16,
    25
  );

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SHEET: A-101 (LEVEL 01 PLAN)', pageW - 65, 22);

  // Floor Plan Geometry Calculations
  const unitL = modelConfig.lengthFt;
  const unitW = isWide ? 16 : modelConfig.widthFt;
  const scale = unitL <= 24 ? 5.8 : 3.8; // mm per foot

  const planW = unitL * scale;
  const planH = unitW * scale;
  const originX = 16 + Math.max(0, (185 - planW) / 2);
  const originY = 48;

  // Outer Container Perimeter & Corten Wall Cut Lines
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(1.0); // Thick architectural cut line
  doc.rect(originX, originY, planW, planH, 'FD');

  // Corner Castings (ISO standard)
  const ccSize = 3.2;
  [[originX, originY], [originX + planW - ccSize, originY], [originX, originY + planH - ccSize], [originX + planW - ccSize, originY + planH - ccSize]].forEach(([cx, cy]) => {
    doc.setFillColor(30, 41, 59);
    doc.rect(cx, cy, ccSize, ccSize, 'F');
  });

  // Room Zoning Dimensions (Exact Architectural Ratios)
  const is20 = unitL <= 24;
  const bedLen = is20 ? 7.5 : (unitL >= 36 ? 12.0 : 9.8);
  const bathLen = is20 ? 5.5 : 7.5;
  const kitchenLen = is20 ? 5.5 : 9.5;
  const livingLen = unitL - (bedLen + bathLen + (is20 ? 0 : kitchenLen));

  const bedW_mm = bedLen * scale;
  const bathW_mm = bathLen * scale;
  const kitchenW_mm = (is20 ? 0 : kitchenLen) * scale;
  const livingW_mm = planW - (bedW_mm + bathW_mm + kitchenW_mm);

  // Corridor Z Divider (Runs in front of the bathroom)
  const corridorDepthFt = 2.8;
  const bathDepthFt = unitW - corridorDepthFt;
  const bathH_mm = bathDepthFt * scale;
  const corridorH_mm = corridorDepthFt * scale;

  // -------------------------------------------------------------
  // ROOM 1: PRIMARY BEDROOM (West End, X: 0 to bedLen)
  // -------------------------------------------------------------
  const bedStartX = originX;
  const bedEndX = originX + bedW_mm;

  // Bed Partition Wall (Thick architectural wall)
  doc.setLineWidth(0.8);
  doc.setDrawColor(30, 41, 59);
  doc.line(bedEndX, originY, bedEndX, originY + bathH_mm);

  // Bed Door in corridor opening (with swing indicator into bedroom)
  const bedDoorY = originY + bathH_mm + corridorH_mm / 2;
  doc.setLineWidth(0.4);
  doc.setDrawColor(0, 150, 200);
  doc.line(bedEndX, bedDoorY - 3, bedEndX - 3, bedDoorY); // door slab swinging into bedroom
  doc.setLineDashPattern([0.8, 0.8], 0);
  doc.line(bedEndX, bedDoorY + 3, bedEndX - 3, bedDoorY); // swing arc
  doc.setLineDashPattern([], 0);

  // Master Bed (Headboard on West wall matching 3D model)
  const bedSymLen = Math.min(bedW_mm * 0.65, 24);
  const bedSymWid = Math.min(planH * 0.6, 22);
  const bedSymY = originY + (planH - bedSymWid) / 2;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.35);
  // Headboard
  doc.rect(bedStartX + 1.5, bedSymY - 1, 2.5, bedSymWid + 2, 'FD');
  // Bed platform & mattress
  doc.rect(bedStartX + 4, bedSymY, bedSymLen, bedSymWid, 'FD');
  // Pillows
  doc.rect(bedStartX + 4.5, bedSymY + 1.5, 4.5, (bedSymWid - 5) / 2, 'S');
  doc.rect(bedStartX + 4.5, bedSymY + 3.5 + (bedSymWid - 5) / 2, 4.5, (bedSymWid - 5) / 2, 'S');
  // Nightstands
  doc.rect(bedStartX + 1.5, bedSymY - 4.5, 4.0, 3.0, 'S');
  doc.rect(bedStartX + 1.5, bedSymY + bedSymWid + 1.5, 4.0, 3.0, 'S');

  // North Built-In Wardrobe
  doc.setFillColor(226, 232, 240);
  doc.rect(bedStartX + bedSymLen + 6, originY + 1, Math.max(8, bedW_mm - bedSymLen - 8), 5.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text('BUILT-IN WARDROBE', bedStartX + bedSymLen + 7, originY + 4.5);

  // Bedroom Text Labels
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('MASTER BEDROOM SUITE', bedStartX + bedW_mm / 2, originY + planH / 2 + 3, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${bedLen.toFixed(1)}' × ${unitW.toFixed(1)}' (${Math.round(bedLen * unitW)} SQ FT)`, bedStartX + bedW_mm / 2, originY + planH / 2 + 7.5, { align: 'center' });

  // -------------------------------------------------------------
  // ROOM 2: ENCLOSED PRIVATE BATHROOM (Center Rear)
  // Fixtures: Floating Washbasin Vanity, Modern Commode, Freestanding Soaking Tub & Rain Shower
  // -------------------------------------------------------------
  const bathStartX = bedEndX;
  const bathEndX = bathStartX + bathW_mm;

  // Corridor Partition Wall (Divides Bathroom from Corridor)
  doc.setLineWidth(0.8);
  doc.setDrawColor(30, 41, 59);
  doc.line(bathStartX, originY + bathH_mm, bathEndX, originY + bathH_mm);

  // Bathroom East Wall
  doc.line(bathEndX, originY, bathEndX, originY + bathH_mm);

  // Bathroom Door (Pocket Sliding or Ensuite Door)
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 150, 200);
  if (modelConfig.attachedBath) {
    // Attached Ensuite door into bedroom
    doc.line(bedEndX, originY + 4, bedEndX, originY + 12);
    doc.setFontSize(4.5);
    doc.text('SLIDING ENSUITE', bedEndX - 1.5, originY + 8, { align: 'right' });
  } else {
    // Corridor access door on the south partition wall
    const doorMidX = bathStartX + bathW_mm / 2;
    doc.line(doorMidX - 4, originY + bathH_mm, doorMidX + 4, originY + bathH_mm);
    doc.setLineDashPattern([0.8, 0.8], 0);
    doc.line(doorMidX - 4, originY + bathH_mm - 1.5, doorMidX + 2, originY + bathH_mm - 1.5);
    doc.setLineDashPattern([], 0);
  }

  // 1. West: Floating Vanity & Ceramic Vessel Washbasin
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.25);
  doc.rect(bathStartX + 1.5, originY + 1.5, 7.5, 5.5, 'FD'); // vanity cabinet
  doc.ellipse(bathStartX + 5.25, originY + 4.25, 2.5, 1.8, 'S'); // washbasin bowl
  doc.circle(bathStartX + 5.25, originY + 2.4, 0.4, 'FD'); // faucet

  // 2. Center: Modern Commode (Toilet)
  doc.rect(bathStartX + 10.5, originY + 1.5, 4.2, 2.5, 'S'); // in-wall tank
  doc.ellipse(bathStartX + 12.6, originY + 5.5, 1.8, 2.4, 'S'); // toilet bowl

  // 3. East: Freestanding Oval Soaking Bathtub
  const tubX = bathEndX - 10.5;
  doc.ellipse(tubX + 4.5, originY + 4.8, 4.2, 2.8, 'FD'); // outer roll rim
  doc.ellipse(tubX + 4.5, originY + 4.8, 3.4, 2.1, 'S'); // inner soak cavity
  doc.circle(tubX + 9.2, originY + 4.8, 0.45, 'FD'); // floor-mount faucet

  // 4. Walk-In Rain Shower Stall (Behind tub or along east edge)
  doc.setLineWidth(0.3);
  doc.setDrawColor(0, 180, 216);
  doc.line(bathEndX - 11.5, originY + 1, bathEndX - 11.5, originY + bathH_mm - 1); // glass screen
  doc.circle(bathEndX - 6.0, originY + 5.0, 0.6, 'S'); // ceiling shower head

  // Bathroom Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text(modelConfig.attachedBath ? 'ATTACHED SPA ENSUITE' : 'CENTRAL SPA BATHROOM', bathStartX + bathW_mm / 2, originY + bathH_mm - 4.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Tub • Basin • Commode • Shower (${Math.round(bathLen * bathDepthFt)} SQ FT)`, bathStartX + bathW_mm / 2, originY + bathH_mm - 1.8, { align: 'center' });

  // -------------------------------------------------------------
  // ROOM 3: DEDICATED CIRCULATION CORRIDOR (Center Front)
  // -------------------------------------------------------------
  doc.setFillColor(254, 252, 232); // subtle pathway tint
  doc.rect(bathStartX, originY + bathH_mm + 0.5, bathW_mm, corridorH_mm - 1, 'F');

  // Directional Flow Arrow connecting Living -> Bedroom
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.4);
  const arrowY = originY + bathH_mm + corridorH_mm / 2;
  doc.line(bathEndX - 3, arrowY, bathStartX + 4, arrowY);
  doc.line(bathStartX + 4, arrowY, bathStartX + 6.5, arrowY - 1.5);
  doc.line(bathStartX + 4, arrowY, bathStartX + 6.5, arrowY + 1.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(180, 83, 9);
  doc.text('CIRCULATION CORRIDOR', bathStartX + bathW_mm / 2, arrowY - 2.2, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.8);
  doc.text('DIRECT UNOBSTRUCTED BEDROOM WALKWAY', bathStartX + bathW_mm / 2, arrowY + 3.2, { align: 'center' });

  // -------------------------------------------------------------
  // ROOM 4: GOURMET KITCHEN & DINING
  // Fixtures: Fridge, Wall Oven, Induction Cooktop, Sink, Island & Stools
  // -------------------------------------------------------------
  if (!is20) {
    const kitchenStartX = bathEndX;
    const kitchenEndX = kitchenStartX + kitchenW_mm;

    // Rear Counter Run
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.3);
    doc.rect(kitchenStartX + 1, originY + 1, kitchenW_mm - 2, 7.5, 'FD');

    // Refrigerator Tower
    doc.setFillColor(203, 213, 225);
    doc.rect(kitchenStartX + 1.5, originY + 1.2, 5.0, 7.0, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.5);
    doc.setTextColor(51, 65, 85);
    doc.text('REF', kitchenStartX + 4.0, originY + 5.2, { align: 'center' });

    // Undermount Double-Bowl Sink
    doc.rect(kitchenStartX + 7.5, originY + 2.5, 6.0, 4.5, 'S');
    doc.line(kitchenStartX + 10.5, originY + 2.5, kitchenStartX + 10.5, originY + 7.0);

    // Wall Oven Tower
    doc.setFillColor(203, 213, 225);
    doc.rect(kitchenEndX - 6.5, originY + 1.2, 5.0, 7.0, 'FD');
    doc.text('OVEN', kitchenEndX - 4.0, originY + 5.2, { align: 'center' });

    // Center Waterfall Island with Induction Hob & Barstools
    const islandY = originY + 11.5;
    const islandW = Math.min(kitchenW_mm - 6, 22);
    const islandH = 7.0;
    const islandX = kitchenStartX + (kitchenW_mm - islandW) / 2;

    doc.setFillColor(255, 255, 255);
    doc.rect(islandX, islandY, islandW, islandH, 'FD');

    // 4 Burner Cooktop on Island
    doc.circle(islandX + islandW / 2 - 2.5, islandY + 2.5, 1.2, 'S');
    doc.circle(islandX + islandW / 2 + 2.5, islandY + 2.5, 1.2, 'S');
    doc.circle(islandX + islandW / 2 - 2.5, islandY + 5.0, 1.2, 'S');
    doc.circle(islandX + islandW / 2 + 2.5, islandY + 5.0, 1.2, 'S');

    // Barstools
    [-islandW / 3, 0, islandW / 3].forEach((bx) => {
      doc.circle(islandX + islandW / 2 + bx, islandY + islandH + 2.0, 1.0, 'S');
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text('CHEF ISLAND KITCHEN', kitchenStartX + kitchenW_mm / 2, islandY + islandH / 2 - 0.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`${kitchenLen.toFixed(1)}' × ${unitW.toFixed(1)}' (${Math.round(kitchenLen * unitW)} SQ FT)`, kitchenStartX + kitchenW_mm / 2, originY + planH - 3, { align: 'center' });
  }

  // -------------------------------------------------------------
  // ROOM 5: LIVING & MEDIA LOUNGE (East Social End)
  // -------------------------------------------------------------
  const livingStartX = is20 ? bathEndX : bathEndX + kitchenW_mm;
  const livingEndX = originX + planW;

  // L-Shape Sectional Sofa Silhouette
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(148, 163, 184);
  doc.rect(livingStartX + 4, originY + 3, livingW_mm - 8, 7, 'FD');
  doc.rect(livingEndX - 10, originY + 3, 6, planH - 8, 'FD');
  // Coffee Table
  doc.rect(livingStartX + 8, originY + 13, 10, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('LIVING LOUNGE', livingStartX + livingW_mm / 2, originY + planH / 2 - 1, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text(`${livingLen.toFixed(1)}' × ${unitW.toFixed(1)}' (${Math.round(livingLen * unitW)} SQ FT)`, livingStartX + livingW_mm / 2, originY + planH / 2 + 3, { align: 'center' });

  // -------------------------------------------------------------
  // SLIDING PATIO DOORS & GLAZED WINDOWS SYMBOLS ON WALLS
  // -------------------------------------------------------------
  // Panoramic Front Sliding Patio Door
  const sliderStartX = livingStartX - 4;
  const sliderW = 32;
  doc.setLineWidth(1.4);
  doc.setDrawColor(0, 150, 220);
  doc.line(sliderStartX, originY + planH, sliderStartX + sliderW, originY + planH);
  doc.setLineWidth(0.4);
  doc.line(sliderStartX + 2, originY + planH + 1.2, sliderStartX + sliderW - 2, originY + planH + 1.2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(0, 130, 200);
  doc.text('<---> SLIDING GLASS PATIO DOORS', sliderStartX + sliderW / 2, originY + planH + 4.5, { align: 'center' });

  // Rear Windows
  [bedStartX + 6, bathStartX + 4, livingStartX + 8].forEach((wx) => {
    doc.setLineWidth(1.2);
    doc.setDrawColor(0, 150, 220);
    doc.line(wx, originY, wx + 12, originY);
  });

  // Exterior Cedar Decking
  const deckDepth_mm = 16;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.rect(sliderStartX - 8, originY + planH + 6, sliderW + 16, deckDepth_mm, 'S');
  for (let dy = originY + planH + 8; dy < originY + planH + 6 + deckDepth_mm; dy += 2) {
    doc.line(sliderStartX - 8, dy, sliderStartX + sliderW + 8, dy);
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('OUTDOOR ARCHITECTURAL CEDAR LIVING TERRACE', sliderStartX + sliderW / 2, originY + planH + 14, { align: 'center' });

  // Overall Dimension Strings (Engineering Style)
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.3);
  // Length Dimension Line (Top)
  doc.line(originX, originY - 6, originX + planW, originY - 6);
  doc.line(originX, originY - 8, originX, originY - 4);
  doc.line(originX + planW, originY - 8, originX + planW, originY - 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`${unitL}' - 0" OVERALL CONTAINER LENGTH`, originX + planW / 2, originY - 7.5, { align: 'center' });

  // Depth Dimension Line (Left)
  doc.line(originX - 6, originY, originX - 6, originY + planH);
  doc.line(originX - 8, originY, originX - 4, originY);
  doc.line(originX - 8, originY + planH, originX - 4, originY + planH);
  doc.text(`${unitW}' - 0"`, originX - 8, originY + planH / 2, { align: 'right' });

  // -------------------------------------------------------------
  // RIGHT SIDE: ROOM SCHEDULE & ARCHITECTURAL METRIC MATRIX
  // -------------------------------------------------------------
  const schedX = 205;
  const schedY = 44;
  const schedW = pageW - schedX - 12;

  doc.setFillColor(15, 23, 42);
  doc.rect(schedX, schedY, schedW, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CERTIFIED ROOM SCHEDULE MATRIX', schedX + 4, schedY + 5.5);

  const scheduleData = [
    ['Master Bedroom Suite', `${bedLen.toFixed(1)}' × ${unitW.toFixed(1)}'`, `${Math.round(bedLen * unitW)} sq ft`],
    ['Private Spa Washroom', `${bathLen.toFixed(1)}' × ${bathDepthFt.toFixed(1)}'`, `${Math.round(bathLen * bathDepthFt)} sq ft`],
    ['Circulation Corridor', `${bathLen.toFixed(1)}' × ${corridorDepthFt.toFixed(1)}'`, `${Math.round(bathLen * corridorDepthFt)} sq ft`],
    ['Gourmet Kitchen & Dining', `${(is20 ? 0 : kitchenLen).toFixed(1)}' × ${unitW.toFixed(1)}'`, `${Math.round((is20 ? 0 : kitchenLen) * unitW)} sq ft`],
    ['Living & Media Lounge', `${livingLen.toFixed(1)}' × ${unitW.toFixed(1)}'`, `${Math.round(livingLen * unitW)} sq ft`],
    ['Outdoor Cedar Deck', `${Math.round(sliderW / scale + 8)}' × 8.0'`, `~160 sq ft`],
  ];

  scheduleData.forEach(([rName, dims, area], idx) => {
    const rowTop = schedY + 11 + idx * 6.5;
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(schedX, rowTop - 4, schedW, 6.5, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(rName, schedX + 3, rowTop);

    doc.setFont('helvetica', 'bold');
    doc.text(dims, schedX + 48, rowTop);
    doc.text(area, schedX + schedW - 3, rowTop, { align: 'right' });
  });

  // Total Summary Box
  const totalBoxY = schedY + 11 + scheduleData.length * 6.5 + 4;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(schedX, totalBoxY, schedW, 16, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL CONDITIONED INTERIOR:', schedX + 4, totalBoxY + 6);
  doc.setFontSize(11);
  doc.setTextColor(0, 150, 200);
  doc.text(`${Math.round(unitL * unitW * (is2Story ? 2 : 1))} SQ FT`, schedX + schedW - 4, totalBoxY + 6.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('ISO 668 High-Cube Steel Chassis • 100% Factory Built', schedX + 4, totalBoxY + 12);

  // Architectural Title Block (Bottom Right)
  const tbY = pageH - 32;
  doc.setFillColor(15, 23, 42);
  doc.rect(schedX, tbY, schedW, 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('BEAST MODULAR ARCHITECTURAL STUDIO', schedX + 4, tbY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`SCALE: 1/4" = 1'-0"  |  DWG NO: ${projectRef}`, schedX + 4, tbY + 11);
  doc.text('ISO CONTAINER COMPLIANCE CERTIFICATE ATTACHED', schedX + 4, tbY + 15.5);

  // Clean filename
  const cleanName = modelConfig.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${cleanName}_Architectural_Blueprint.pdf`);
}
