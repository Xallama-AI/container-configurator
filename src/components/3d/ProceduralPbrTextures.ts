import * as THREE from 'three';
import { ExteriorMaterial, FlooringMaterial } from '../../types';

// Texture Cache to ensure zero memory waste and instantaneous reuse
const textureCache = new Map<string, THREE.Texture>();

/**
 * Creates or retrieves a procedural normal map for painted container steel
 * featuring realistic fine orange-peel paint stippling, sheet metal waviness,
 * and micro-roughness.
 */
export function getContainerSteelNormalMap(): THREE.Texture {
  const cacheKey = 'container-steel-normal';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const imgData = ctx.createImageData(512, 512);
    const data = imgData.data;

    // Generate normal vector perturbations in tangent space (RGB = XYZ normal)
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % 512;
      const y = Math.floor((i / 4) / 512);

      // Fine paint orange-peel noise
      const noise1 = Math.sin(x * 0.15) * Math.cos(y * 0.15);
      const noise2 = Math.sin(x * 0.45 + 1.2) * Math.cos(y * 0.45 + 0.8);
      const micro = (Math.random() - 0.5) * 0.25;

      const perturbX = (noise1 * 0.08 + noise2 * 0.04 + micro * 0.12);
      const perturbY = (noise2 * 0.08 + noise1 * 0.04 + micro * 0.12);

      // Normal map encoding: [0, 1] mapped from [-1, 1], with Z pointing outwards (0.5, 0.5, 1.0 = neutral blue)
      data[i] = Math.floor(128 + perturbX * 127);     // R (X)
      data[i + 1] = Math.floor(128 + perturbY * 127); // G (Y)
      data[i + 2] = 255;                              // B (Z normal)
      data[i + 3] = 255;                              // A
    }
    ctx.putImageData(imgData, 0, 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 4);
  texture.anisotropy = 8;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates realistic procedural diffuse and bump maps for specialized exterior claddings
 */
export function getExteriorCladdingTextures(material: ExteriorMaterial, baseColorHex: string): {
  map?: THREE.Texture;
  bumpMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
} {
  const cacheKey = `exterior-${material}-${baseColorHex}`;
  if (textureCache.has(cacheKey)) {
    return {
      map: textureCache.get(`${cacheKey}-map`),
      bumpMap: textureCache.get(`${cacheKey}-bump`),
      roughnessMap: textureCache.get(`${cacheKey}-rough`),
    };
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 512;
  bumpCanvas.height = 512;
  const bumpCtx = bumpCanvas.getContext('2d');

  if (!ctx || !bumpCtx) return {};

  if (material === 'corten-steel') {
    // Rich weathered Corten steel with oxidation mottling
    const grad = ctx.createRadialGradient(256, 256, 50, 256, 256, 360);
    grad.addColorStop(0, '#8c4820');
    grad.addColorStop(0.5, '#6a3416');
    grad.addColorStop(0.8, '#9c5428');
    grad.addColorStop(1, '#4e2410');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Weathering speckles & streaks
    for (let i = 0; i < 8000; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      const shade = Math.random() > 0.5 ? 'rgba(40, 18, 8, 0.45)' : 'rgba(180, 95, 45, 0.4)';
      ctx.fillStyle = shade;
      ctx.fillRect(rx, ry, Math.random() * 3 + 1, Math.random() * 5 + 1);
    }

    // Bump map for pitted rust texture
    bumpCtx.fillStyle = '#808080';
    bumpCtx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 10000; i++) {
      const bx = Math.random() * 512;
      const by = Math.random() * 512;
      bumpCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)';
      bumpCtx.fillRect(bx, by, 2, 2);
    }
  } else if (material === 'shou-sugi-ban') {
    // Traditional Japanese Yakisugi charred timber
    ctx.fillStyle = '#14171a';
    ctx.fillRect(0, 0, 512, 512);

    bumpCtx.fillStyle = '#808080';
    bumpCtx.fillRect(0, 0, 512, 512);

    // Vertical plank lines & alligator crack charring
    const plankW = 42;
    for (let x = 0; x < 512; x += plankW) {
      ctx.fillStyle = '#0a0c0e';
      ctx.fillRect(x, 0, 3, 512);
      bumpCtx.fillStyle = '#000000';
      bumpCtx.fillRect(x, 0, 3, 512);

      // Charred alligator fissures
      for (let y = 0; y < 512; y += 12) {
        if (Math.random() > 0.35) {
          ctx.fillStyle = 'rgba(5, 7, 9, 0.8)';
          ctx.fillRect(x, y + Math.random() * 4, plankW, 2);
          bumpCtx.fillStyle = 'rgba(20, 20, 20, 0.6)';
          bumpCtx.fillRect(x, y + Math.random() * 4, plankW, 2);
        }
      }
    }
  } else if (material === 'swiss-larch') {
    // Natural warm Alpine larch with vertical tongue-and-groove siding
    ctx.fillStyle = '#9e7952';
    ctx.fillRect(0, 0, 512, 512);

    bumpCtx.fillStyle = '#808080';
    bumpCtx.fillRect(0, 0, 512, 512);

    const plankW = 36;
    for (let x = 0; x < 512; x += plankW) {
      // Groove shadow
      ctx.fillStyle = '#5c4125';
      ctx.fillRect(x, 0, 2, 512);
      bumpCtx.fillStyle = '#222222';
      bumpCtx.fillRect(x, 0, 2, 512);

      // Subtle grain lines within plank
      ctx.fillStyle = 'rgba(215, 175, 125, 0.2)';
      for (let g = 4; g < plankW; g += 6) {
        ctx.fillRect(x + g, 0, 1.5, 512);
      }
    }
  } else if (material === 'concrete-panels') {
    // Architectural board-formed concrete with tie holes
    ctx.fillStyle = '#6b7785';
    ctx.fillRect(0, 0, 512, 512);

    bumpCtx.fillStyle = '#808080';
    bumpCtx.fillRect(0, 0, 512, 512);

    // Panel joints
    ctx.strokeStyle = '#3f4752';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 512, 256);
    ctx.strokeRect(0, 256, 512, 256);

    bumpCtx.strokeStyle = '#111111';
    bumpCtx.lineWidth = 3;
    bumpCtx.strokeRect(0, 0, 512, 256);
    bumpCtx.strokeRect(0, 256, 512, 256);

    // Formwork tie-rod circular indentations
    [[64, 64], [448, 64], [64, 192], [448, 192], [64, 320], [448, 320], [64, 448], [448, 448]].forEach(([cx, cy]) => {
      ctx.fillStyle = '#2b323b';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();

      bumpCtx.fillStyle = '#000000';
      bumpCtx.beginPath();
      bumpCtx.arc(cx, cy, 10, 0, Math.PI * 2);
      bumpCtx.fill();
    });
  } else {
    // Standard Painted Shipping Container Corrugated Metal
    ctx.fillStyle = baseColorHex || '#1e293b';
    ctx.fillRect(0, 0, 512, 512);

    bumpCtx.fillStyle = '#808080';
    bumpCtx.fillRect(0, 0, 512, 512);

    // Micro-texture stipple
    for (let i = 0; i < 12000; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      bumpCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
      bumpCtx.fillRect(rx, ry, 2, 2);
    }
  }

  const mapTex = new THREE.CanvasTexture(canvas);
  mapTex.wrapS = THREE.RepeatWrapping;
  mapTex.wrapT = THREE.RepeatWrapping;
  mapTex.repeat.set(4, 2);
  mapTex.anisotropy = 8;

  const bumpTex = new THREE.CanvasTexture(bumpCanvas);
  bumpTex.wrapS = THREE.RepeatWrapping;
  bumpTex.wrapT = THREE.RepeatWrapping;
  bumpTex.repeat.set(4, 2);
  bumpTex.anisotropy = 8;

  textureCache.set(`${cacheKey}-map`, mapTex);
  textureCache.set(`${cacheKey}-bump`, bumpTex);

  return { map: mapTex, bumpMap: bumpTex };
}

/**
 * Creates luxury architectural interior flooring textures:
 * - Chevron Oak (Herringbone French oak with beveled micro-v-grooves)
 * - Smoked Walnut (Deep chocolate planks with organic grain)
 * - Polished Concrete (Smooth aggregate stipple with satin reflection)
 * - White Terrazzo (Italian marble mosaic chips in cast white cement)
 * - Dark Slate (Natural cleft cleft stone tiles)
 */
export function getInteriorFlooringTexture(flooring: FlooringMaterial): {
  map: THREE.Texture;
  bumpMap: THREE.Texture;
  roughness: number;
} {
  const cacheKey = `flooring-${flooring}`;
  if (textureCache.has(`${cacheKey}-map`)) {
    return {
      map: textureCache.get(`${cacheKey}-map`)!,
      bumpMap: textureCache.get(`${cacheKey}-bump`)!,
      roughness: flooring === 'polished-concrete' ? 0.25 : flooring === 'white-terrazzo' ? 0.2 : 0.45,
    };
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 512;
  bumpCanvas.height = 512;
  const bumpCtx = bumpCanvas.getContext('2d')!;

  if (flooring === 'chevron-oak') {
    // Warm Natural Scandinavian Chevron / Herringbone Parquet
    ctx.fillStyle = '#c8a274';
    ctx.fillRect(0, 0, 512, 512);

    bumpCtx.fillStyle = '#808080';
    bumpCtx.fillRect(0, 0, 512, 512);

    // Chevron zigzag plank geometry
    const plankW = 32;
    const plankH = 64;

    for (let y = 0; y < 512; y += plankH) {
      for (let x = 0; x < 512; x += plankW * 2) {
        // Angled left chevron stave
        ctx.fillStyle = ((x + y) / 32) % 2 === 0 ? '#b89264' : '#d2ac7e';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + plankW, y + plankH / 2);
        ctx.lineTo(x + plankW, y + plankH);
        ctx.lineTo(x, y + plankH / 2);
        ctx.closePath();
        ctx.fill();

        // Angled right chevron stave
        ctx.fillStyle = ((x + y) / 32) % 2 === 0 ? '#d4ae80' : '#bf986a';
        ctx.beginPath();
        ctx.moveTo(x + plankW, y + plankH / 2);
        ctx.lineTo(x + plankW * 2, y);
        ctx.lineTo(x + plankW * 2, y + plankH / 2);
        ctx.lineTo(x + plankW, y + plankH);
        ctx.closePath();
        ctx.fill();

        // Beveled V-joint groove lines
        ctx.strokeStyle = '#825e36';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + plankW, y + plankH / 2);
        ctx.lineTo(x + plankW * 2, y);
        ctx.stroke();

        bumpCtx.strokeStyle = '#101010';
        bumpCtx.lineWidth = 2;
        bumpCtx.beginPath();
        bumpCtx.moveTo(x, y);
        bumpCtx.lineTo(x + plankW, y + plankH / 2);
        bumpCtx.lineTo(x + plankW * 2, y);
        bumpCtx.stroke();
      }
    }
  } else if (flooring === 'smoked-walnut') {
    // Rich chocolate wide-plank walnut with long cathedrals
    ctx.fillStyle = '#3a271d';
    ctx.fillRect(0, 0, 512, 512);

    bumpCtx.fillStyle = '#808080';
    bumpCtx.fillRect(0, 0, 512, 512);

    const plankH = 48;
    for (let y = 0; y < 512; y += plankH) {
      // Plank tone variation
      const toneShift = ((y / plankH) % 3) * 8;
      ctx.fillStyle = `rgb(${58 + toneShift}, ${39 + toneShift / 2}, ${29 + toneShift / 3})`;
      ctx.fillRect(0, y, 512, plankH - 2);

      // Plank seam
      ctx.fillStyle = '#1a100b';
      ctx.fillRect(0, y + plankH - 2, 512, 2);

      bumpCtx.fillStyle = '#0a0a0a';
      bumpCtx.fillRect(0, y + plankH - 2, 512, 2);

      // Wood grain ripples
      ctx.fillStyle = 'rgba(95, 65, 45, 0.3)';
      for (let g = 0; g < 6; g++) {
        const gy = y + Math.random() * (plankH - 6);
        ctx.fillRect(0, gy, 512, 1.5);
      }
    }
  } else if (flooring === 'white-terrazzo') {
    // Luxury polished Italian terrazzo with multi-colored marble aggregate
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 512, 512);

    bumpCtx.fillStyle = '#909090';
    bumpCtx.fillRect(0, 0, 512, 512);

    const chips = ['#334155', '#94a3b8', '#d97706', '#b45309', '#0d9488', '#64748b', '#cbd5e1'];
    for (let i = 0; i < 1800; i++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 512;
      const rad = Math.random() * 5 + 1.5;
      ctx.fillStyle = chips[Math.floor(Math.random() * chips.length)];
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();

      bumpCtx.fillStyle = Math.random() > 0.5 ? '#b0b0b0' : '#707070';
      bumpCtx.beginPath();
      bumpCtx.arc(cx, cy, rad, 0, Math.PI * 2);
      bumpCtx.fill();
    }
  } else if (flooring === 'dark-slate') {
    // Cleft natural charcoal slate tiles
    ctx.fillStyle = '#1e2530';
    ctx.fillRect(0, 0, 512, 512);

    bumpCtx.fillStyle = '#808080';
    bumpCtx.fillRect(0, 0, 512, 512);

    // Large 24"x12" slate tile grid
    const tileW = 128;
    const tileH = 64;

    for (let y = 0; y < 512; y += tileH) {
      const xOff = (y / tileH) % 2 === 0 ? 0 : tileW / 2;
      for (let x = -tileW; x < 512; x += tileW) {
        ctx.strokeStyle = '#0f141c';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + xOff, y, tileW, tileH);

        bumpCtx.strokeStyle = '#050505';
        bumpCtx.lineWidth = 3;
        bumpCtx.strokeRect(x + xOff, y, tileW, tileH);
      }
    }

    // Natural stone cleft texture noise
    for (let i = 0; i < 10000; i++) {
      const sx = Math.random() * 512;
      const sy = Math.random() * 512;
      bumpCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)';
      bumpCtx.fillRect(sx, sy, 3, 3);
    }
  } else {
    // Polished architectural concrete
    ctx.fillStyle = '#717f91';
    ctx.fillRect(0, 0, 512, 512);

    bumpCtx.fillStyle = '#808080';
    bumpCtx.fillRect(0, 0, 512, 512);

    // Subtle aggregate flecks & float trowel swirl
    for (let i = 0; i < 14000; i++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 512;
      const tone = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)';
      ctx.fillStyle = tone;
      ctx.fillRect(cx, cy, 2, 2);

      bumpCtx.fillStyle = Math.random() > 0.5 ? '#909090' : '#707070';
      bumpCtx.fillRect(cx, cy, 2, 2);
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(6, 6);
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(6, 6);
  bumpMap.anisotropy = 8;

  textureCache.set(`${cacheKey}-map`, map);
  textureCache.set(`${cacheKey}-bump`, bumpMap);

  return {
    map,
    bumpMap,
    roughness: flooring === 'polished-concrete' ? 0.25 : flooring === 'white-terrazzo' ? 0.2 : 0.45,
  };
}

/**
 * Creates Calacatta Gold / Carrara marble texture for kitchen waterfall islands
 * and luxury bathroom vanity countertops.
 */
export function getCalacattaMarbleTexture(): THREE.Texture {
  const cacheKey = 'calacatta-marble';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Soft luminous warm-white marble base
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#fafbfc');
  grad.addColorStop(0.5, '#f4f6f8');
  grad.addColorStop(1, '#edf1f5');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Organic meandering vein networks (Gold & Slate-Grey)
  const drawVein = (startX: number, startY: number, color: string, width: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    let cx = startX;
    let cy = startY;
    ctx.moveTo(cx, cy);

    for (let step = 0; step < 18; step++) {
      cx += Math.random() * 38 - 12;
      cy += Math.random() * 42 + 8;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  };

  // Slate-grey dramatic main veins
  drawVein(80, 0, 'rgba(100, 116, 139, 0.45)', 3.5);
  drawVein(280, 0, 'rgba(148, 163, 184, 0.35)', 2.5);
  drawVein(160, 100, 'rgba(148, 163, 184, 0.25)', 1.5);

  // Warm gold / ochre secondary whisper veins
  drawVein(60, 40, 'rgba(217, 119, 6, 0.28)', 2.0);
  drawVein(320, 80, 'rgba(217, 119, 6, 0.22)', 1.5);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.anisotropy = 8;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates woven textile / bouclé bump map for upholstered sofas and beds.
 */
export function getWovenFabricBumpMap(): THREE.Texture {
  const cacheKey = 'woven-fabric-bump';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  // Cross-hatch woven yarn pattern
  for (let y = 0; y < 256; y += 4) {
    for (let x = 0; x < 256; x += 4) {
      ctx.fillStyle = ((x / 4 + y / 4) % 2 === 0) ? '#a0a0a0' : '#606060';
      ctx.fillRect(x, y, 3, 3);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  texture.anisotropy = 8;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates high-efficiency monocrystalline solar photovoltaic panel texture.
 */
export function getSolarPanelTexture(): THREE.Texture {
  const cacheKey = 'solar-photovoltaic';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep anti-reflective solar cell blue/black
  ctx.fillStyle = '#0a192f';
  ctx.fillRect(0, 0, 512, 512);

  // Perimeter aluminum framing
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 504, 504);

  // Silicon wafer cell grid (6 x 10 cells)
  const cols = 6;
  const rows = 10;
  const cellW = (512 - 16) / cols;
  const cellH = (512 - 16) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = 8 + c * cellW;
      const cy = 8 + r * cellH;

      // Dark cell face
      ctx.fillStyle = '#0c2340';
      ctx.fillRect(cx + 2, cy + 2, cellW - 4, cellH - 4);

      // Micro silver busbar lines
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + cellW * 0.3, cy);
      ctx.lineTo(cx + cellW * 0.3, cy + cellH);
      ctx.moveTo(cx + cellW * 0.7, cy);
      ctx.lineTo(cx + cellW * 0.7, cy + cellH);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates a soft-falloff Ambient Occlusion Contact Shadow Map
 * placed directly on the ground beneath the container footprint.
 * Eliminates the "floating CG object" illusion and anchors the house solidly.
 */
export function createContactShadowPlane(widthFt: number, lengthFt: number): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Radial soft-edge Gaussian gradient shadow
  const grad = ctx.createRadialGradient(256, 256, 120, 256, 256, 250);
  grad.addColorStop(0, 'rgba(10, 15, 25, 0.85)');
  grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.55)');
  grad.addColorStop(0.8, 'rgba(20, 30, 50, 0.2)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const shadowTex = new THREE.CanvasTexture(canvas);
  const geo = new THREE.PlaneGeometry(lengthFt + 6.0, widthFt + 6.0);
  const mat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'architectural-contact-shadow';
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02; // Sits just above ground plane
  return mesh;
}
