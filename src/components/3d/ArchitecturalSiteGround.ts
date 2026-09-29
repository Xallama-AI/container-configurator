import * as THREE from 'three';

const loader = new THREE.TextureLoader();
const textureCache = new Map<string, THREE.Texture>();

function surfaceTexture(path: string, repeatX: number, repeatY: number, color = false) {
  const key = `${path}:${repeatX}:${repeatY}`;
  const cached = textureCache.get(key);
  if (cached) return cached;
  const texture = loader.load(path);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 8;
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

/** A full-scale outdoor setting with scanned PBR surfaces, rather than a display plinth. */
export function buildArchitecturalModelFloor(
  lotWidthFt = 80,
  lotDepthFt = 100,
  houseLengthFt = 40,
  houseWidthFt = 16,
  houseOffsetX = 0,
  houseOffsetZ = 0
): THREE.Group {
  const site = new THREE.Group();
  site.name = 'architectural-site';
  const terrainSize = Math.max(300, lotWidthFt + 120, lotDepthFt + 120);
  const tileCount = terrainSize / 13;

  const lawn = new THREE.Mesh(
    new THREE.PlaneGeometry(terrainSize, terrainSize),
    new THREE.MeshStandardMaterial({
      map: surfaceTexture('/container-configurator/textures/grass/color.webp', tileCount, tileCount, true),
      normalMap: surfaceTexture('/container-configurator/textures/grass/normal.webp', tileCount, tileCount),
      roughnessMap: surfaceTexture('/container-configurator/textures/grass/arm.webp', tileCount, tileCount),
      roughness: 0.98,
      metalness: 0,
      normalScale: new THREE.Vector2(0.42, 0.42),
    })
  );
  lawn.rotation.x = -Math.PI / 2;
  lawn.receiveShadow = true;
  site.add(lawn);

  const concrete = new THREE.MeshStandardMaterial({
    map: surfaceTexture('/container-configurator/textures/walls/concrete/color.webp', 2, 2, true),
    normalMap: surfaceTexture('/container-configurator/textures/walls/concrete/normal.webp', 2, 2),
    roughnessMap: surfaceTexture('/container-configurator/textures/walls/concrete/arm.webp', 2, 2),
    color: 0xb9b9b3,
    roughness: 0.88,
    metalness: 0,
    normalScale: new THREE.Vector2(0.25, 0.25),
  });

  // A poured pad makes the structure feel grounded and catches real contact shadows.
  const pad = new THREE.Mesh(new THREE.BoxGeometry(houseLengthFt + 2.2, 0.22, houseWidthFt + 2.2), concrete);
  pad.position.set(houseOffsetX, 0.06, houseOffsetZ);
  pad.castShadow = true;
  pad.receiveShadow = true;
  site.add(pad);

  // Individual concrete slabs have small grass joints and a believable walking scale.
  const frontZ = houseOffsetZ + houseWidthFt / 2 + 1.5;
  const pathX = houseOffsetX - houseLengthFt / 2 + Math.min(7, houseLengthFt * 0.28);
  const pathEnd = Math.min(lotDepthFt / 2 - 3, frontZ + 22);
  const stepCount = Math.max(0, Math.floor((pathEnd - frontZ) / 3.2));
  for (let i = 0; i < stepCount; i++) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 2.7), concrete);
    slab.position.set(pathX, 0.065, frontZ + i * 3.2 + 1.35);
    slab.castShadow = true;
    slab.receiveShadow = true;
    site.add(slab);
  }

  return site;
}
