import { ContainerModelConfig } from '../types';

export interface CostBreakdown {
  containerShell: number;
  openingsGlazing: number;
  insulationThermal: number;
  interiorFinishes: number;
  mepSystems: number; // Mechanical, Electrical, Plumbing
  roofSystem: number;
  foundationEstimate: number;
  totalUsd: number;
  monthlyFinancingUsd: number; // 15-yr 6.5% APR
  sqFtTotal: number;
  costPerSqFt: number;
  constructionWeeks: number;
}

export function calculateConfigurationCost(config: ContainerModelConfig): CostBreakdown {
  // 1. Calculate floor area
  let sqFtTotal = config.lengthFt * config.widthFt;
  if (config.layoutType === 'stacked-2story' || config.layoutType === 'cantilever-offset') {
    sqFtTotal = config.lengthFt * config.widthFt * 1.6; // ground + upper cantilever
  } else if (config.layoutType === 'skybridge-compound') {
    sqFtTotal = config.lengthFt * config.widthFt * 2.1;
  } else if (config.layoutType === 'triple-wide') {
    sqFtTotal = config.lengthFt * config.widthFt;
  } else if (config.layoutType === 'u-shape') {
    sqFtTotal = config.lengthFt * 8 * 2 + (config.widthFt - 16) * 8;
  } else if (config.layoutType === 'l-shape') {
    sqFtTotal = config.lengthFt * 8 + (config.widthFt - 8) * 8;
  }

  // 2. Container Shell Cost
  let containerShell = 0;
  if (config.lengthFt <= 20) {
    containerShell = 5500;
  } else if (config.lengthFt <= 40) {
    containerShell = config.heightFt > 9 ? 9800 : 8500;
  } else {
    containerShell = 12500;
  }

  if (config.layoutType === 'double-wide') {
    containerShell = containerShell * 2 + 8200; // Structural I-beam header & column reinforcement
  } else if (config.layoutType === 'triple-wide') {
    containerShell = containerShell * 3 + 14500;
  } else if (config.layoutType === 'stacked-2story' || config.layoutType === 'cantilever-offset') {
    containerShell = containerShell * 1.9 + 11500; // Structural stacking corners, welding, heavy steel column braces
  } else if (config.layoutType === 'skybridge-compound') {
    containerShell = containerShell * 2.8 + 18500;
  } else if (config.layoutType === 'u-shape') {
    containerShell = containerShell * 2.4 + 9500;
  } else if (config.layoutType === 'l-shape') {
    containerShell = containerShell * 1.7 + 6000;
  }

  // Facade Material Surcharge
  if (config.exteriorMaterial === 'shou-sugi-ban') containerShell += 4800;
  else if (config.exteriorMaterial === 'obsidian-composite') containerShell += 6200;
  else if (config.exteriorMaterial === 'swiss-larch') containerShell += 5400;
  else if (config.exteriorMaterial === 'concrete-panels') containerShell += 5900;
  else if (config.exteriorMaterial === 'alpine-white-stucco') containerShell += 3800;

  // 3. Openings & Glazing
  let openingsGlazing = 0;
  (config.openings || []).forEach((op) => {
    if (op.type === 'bifold-glass-20ft') openingsGlazing += 8900;
    else if (op.type === 'sliding-door-16ft') openingsGlazing += 6200;
    else if (op.type === 'sliding-door-12ft') openingsGlazing += 4600;
    else if (op.type === 'sliding-door-8ft') openingsGlazing += 3200;
    else if (op.type === 'picture-window') openingsGlazing += 1400;
    else if (op.type === 'pivot-door') openingsGlazing += 2800;
    else if (op.type === 'window-4x4' || op.type === 'window-6x3') openingsGlazing += 850;
    else if (op.type === 'entry-door') openingsGlazing += 1500;
    else if (op.type === 'skylight') openingsGlazing += 1200;
    else openingsGlazing += 900;
  });

  // 4. Insulation & Thermal envelope (Closed cell spray foam R-21 to R-30)
  const wallSurfaceSqFt = (config.lengthFt * 2 + config.widthFt * 2) * config.heightFt;
  const insulationThermal = Math.round(wallSurfaceSqFt * 4.4 + sqFtTotal * 3.8);

  // 5. Interior Finishes & Partitions
  let finishRate = 34; // per sq ft
  if (config.interiorStyle === 'dark-loft') finishRate = 42;
  if (config.interiorStyle === 'minimalist-oak') finishRate = 38;
  if (config.interiorStyle === 'industrial-concrete') finishRate = 32;

  // Flooring material rate
  if (config.flooringMaterial === 'chevron-oak') finishRate += 6;
  else if (config.flooringMaterial === 'white-terrazzo') finishRate += 8;
  else if (config.flooringMaterial === 'smoked-walnut') finishRate += 5;

  const partitionsCount = Array.isArray(config.partitions) ? config.partitions.length : 0;
  const interiorFinishes = Math.round(sqFtTotal * finishRate + partitionsCount * 1200);

  // 6. MEP (Plumbing, Smart Electrical Circuit, HVAC)
  const mepSystems = 12500 + (sqFtTotal > 400 ? 5500 : 0);

  // 7. Roof Upgrade & Outdoor Amenities
  let roofSystem = 0;
  if (config.roofOption === 'deck-wood') {
    roofSystem = 6500 + (config.staircase ? 4500 : 0);
  } else if (config.roofOption === 'solar-panels') {
    roofSystem = Math.round(config.solarCapacityKw * 1350 + 3800); // panels + hybrid inverter & battery backup
  } else if (config.roofOption === 'green-roof') {
    roofSystem = 5800;
  }

  // Outdoor Amenities
  if (config.outdoorAmenities?.plungePool) roofSystem += 14500;
  if (config.outdoorAmenities?.firePitLounge) roofSystem += 3800;
  if (config.outdoorAmenities?.pergolaCanopy) roofSystem += 4600;
  if (config.outdoorAmenities?.cantileverBalcony) roofSystem += 5900;

  // 8. Foundation
  let foundationEstimate = 4200;
  if (config.foundationType === 'concrete-slab') foundationEstimate = 8500;
  if (config.foundationType === 'helical-piles') foundationEstimate = 6200;
  if (config.foundationType === 'gravel-pad') foundationEstimate = 2800;

  const totalUsd = Math.round(
    containerShell +
    openingsGlazing +
    insulationThermal +
    interiorFinishes +
    mepSystems +
    roofSystem +
    foundationEstimate
  );

  // Financing: 15-year loan at 6.5% interest
  const monthlyRate = 0.065 / 12;
  const numPayments = 15 * 12;
  const monthlyFinancingUsd = Math.round(
    (totalUsd * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );

  const costPerSqFt = Math.round(totalUsd / (sqFtTotal || 1));
  const constructionWeeks = sqFtTotal > 600 ? 12 : sqFtTotal > 400 ? 9 : 6;

  return {
    containerShell,
    openingsGlazing,
    insulationThermal,
    interiorFinishes,
    mepSystems,
    roofSystem,
    foundationEstimate,
    totalUsd,
    monthlyFinancingUsd,
    sqFtTotal,
    costPerSqFt,
    constructionWeeks,
  };
}
