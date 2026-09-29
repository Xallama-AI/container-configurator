import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const ROOT = '/container-configurator/models/interior/';
const ASSETS: Record<string, string> = {
  sofa: 'bedroom-and-living-room-furniture/sofa-three-seat-6be9b44b.glb',
  sofaSmall: 'bedroom-and-living-room-furniture/sofa-two-seat-904fa140.glb',
  chair: 'bedroom-and-living-room-furniture/armchair-lounge-6873b63b.glb',
  table: 'bedroom-and-living-room-furniture/side-table-square-dr-0e5df392.glb',
  rug: 'bedroom-and-living-room-furniture/rug-wool-large-14b20ed0.glb',
  lamp: 'bedroom-and-living-room-furniture/floor-lamp-arc-7aa27d3a.glb',
  diningTable: 'bedroom-and-living-room-furniture/dining-table-6seat-02f48ab1.glb',
  diningChair: 'bedroom-and-living-room-furniture/dining-chair-upholst-7ec33345.glb',
  desk: 'bedroom-and-living-room-furniture/desk-writing-2f6be817.glb',
  taskChair: 'bedroom-and-living-room-furniture/desk-task-chair-e1320da0.glb',
  bed: 'bedroom-and-living-room-furniture/double-bed-upholster-4c7d1e0e.glb',
  bunk: 'bedroom-and-living-room-furniture/bunk-bed-twin-1f611645.glb',
  wardrobe: 'bedroom-and-living-room-furniture/wardrobe-2-door-de288b64.glb',
  base: 'fitted-kitchen-and-bathroom-builder/base-600-89129dae.glb',
  sink: 'fitted-kitchen-and-bathroom-builder/base-600-sink-a65b92b5.glb',
  wall: 'fitted-kitchen-and-bathroom-builder/wall-600-8d2afd7f.glb',
  larder: 'fitted-kitchen-and-bathroom-builder/tall-600-larder-b9ef44d8.glb',
  island: 'fitted-kitchen-and-bathroom-builder/island-breakfast-b-06cd323b.glb',
  vanity: 'fitted-kitchen-and-bathroom-builder/vanity-800-24368157.glb',
  toilet: 'fitted-kitchen-and-bathroom-builder/wc-close-coupled-13e88a96.glb',
  bath: 'fitted-kitchen-and-bathroom-builder/bath-single-ended-6160600e.glb',
  shower: 'fitted-kitchen-and-bathroom-builder/shower-enclosure-s-b2c77076.glb',
  tray: 'fitted-kitchen-and-bathroom-builder/shower-tray-square-f1ac59e0.glb',
  tap: 'fitted-kitchen-and-bathroom-builder/tap-basin-mixer-b37f7156.glb',
  fridge: 'home-appliances-and-utility/fridge-freezer-freestandin-c577bb9f.glb',
};

const loader = new GLTFLoader();
const modelCache = new Map<string, Promise<THREE.Group>>();
const textureLoader = new THREE.TextureLoader();
const textureCache = new Map<string, THREE.Texture>();
const METRES_TO_FEET = 3.28084;

function model(key: string): Promise<THREE.Group> {
  const url = ROOT + ASSETS[key];
  if (!url || !ASSETS[key]) return Promise.reject(new Error(`Unknown interior model: ${key}`));
  let cached = modelCache.get(url);
  if (!cached) {
    cached = new Promise((resolve, reject) => loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject));
    modelCache.set(url, cached);
  }
  return cached;
}

function texture(path: string, color = false): THREE.Texture {
  let result = textureCache.get(path);
  if (!result) {
    result = textureLoader.load(path);
    result.wrapS = result.wrapT = THREE.RepeatWrapping;
    result.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    textureCache.set(path, result);
  }
  return result;
}

function styleWood(style: string): string {
  if (style.includes('nordic')) return 'light-oak';
  if (style.includes('dark') || style.includes('industrial')) return 'dark-walnut';
  return 'natural-oak';
}

function styleMaterials(root: THREE.Object3D, style: string) {
  const wood = styleWood(style);
  const colorMap = texture(`/container-configurator/textures/wood/${wood}/color.webp`, true);
  const normalMap = texture(`/container-configurator/textures/wood/${wood}/normal.webp`);
  const armMap = texture(`/container-configurator/textures/wood/${wood}/arm.webp`);
  const fabricColor = texture('/container-configurator/textures/furniture/wool_boucle/wool_boucle-color.webp', true);
  const fabricNormal = texture('/container-configurator/textures/furniture/wool_boucle/wool_boucle-normal.webp');
  const fabricArm = texture('/container-configurator/textures/furniture/wool_boucle/wool_boucle-arm.webp');
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const update = (source: THREE.Material) => {
      const mat = source.clone() as THREE.MeshStandardMaterial;
      const label = `${source.name} ${mesh.name}`.toLowerCase();
      if (/fabric|linen|uphol|cushion|textile|cloth/.test(label)) {
        mat.color?.set(0xffffff);
        mat.map = fabricColor;
        mat.normalMap = fabricNormal;
        mat.normalScale?.set(0.35, 0.35);
        mat.roughnessMap = fabricArm;
        mat.roughness = 0.92;
      } else if (/wood|walnut|oak|carcass|front|drawer|seat|table|frame/.test(label)) {
        mat.map = colorMap;
        mat.normalMap = normalMap;
        mat.normalScale?.set(0.28, 0.28);
        mat.roughnessMap = armMap;
        mat.color?.set(style.includes('nordic') ? 0xe8dfd1 : 0xffffff);
      } else if (/metal|chrome|steel|brass|handle|tap|hinge/.test(label)) {
        mat.metalness = 0.78;
        mat.roughness = 0.27;
      } else if (/ceramic|porcelain|basin|toilet|bath/.test(label)) {
        mat.roughness = 0.18;
        mat.metalness = 0;
      }
      mat.needsUpdate = true;
      return mat;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(update) : update(mesh.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.sharedAssetGeometry = true;
  });
}

async function place(group: THREE.Group, key: string, x: number, z: number, widthFt: number, style: string, rotationY = 0) {
  const source = await model(key);
  const instance = source.clone(true);
  styleMaterials(instance, style);
  instance.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(instance);
  const size = bounds.getSize(new THREE.Vector3());
  const scale = widthFt / Math.max(size.x * METRES_TO_FEET, 0.001);
  instance.scale.setScalar(scale);
  instance.updateMatrixWorld(true);
  const scaledBounds = new THREE.Box3().setFromObject(instance);
  instance.position.x -= (scaledBounds.min.x + scaledBounds.max.x) / 2;
  instance.position.y -= scaledBounds.min.y;
  instance.position.z -= (scaledBounds.min.z + scaledBounds.max.z) / 2;
  const anchor = new THREE.Group();
  anchor.position.set(x, 0.3, z);
  anchor.rotation.y = rotationY;
  anchor.add(instance);
  group.add(anchor);
}

async function replaceRoom(source: THREE.Group, config: { interiorStyle: string; bedroomType?: string; kitchenType?: string; bathroomType?: string }) {
  const room = String(source.userData.interiorRoom);
  const depth = Number(source.userData.roomDepthFt) || 8;
  const style = config.interiorStyle || 'modern';
  const replacement = new THREE.Group();
  replacement.name = `real-assets-${room}`;

  if (room === 'lounge') {
    const compact = depth < 6.5;
    await place(replacement, compact ? 'sofaSmall' : 'sofa', -1.1, -depth * 0.22, compact ? 5 : 6.3, style, Math.PI / 2);
    await place(replacement, 'table', 0.65, 0, 1.65, style);
    await place(replacement, 'chair', 2.3, depth * 0.22, 2.4, style, -Math.PI / 2);
    await place(replacement, 'rug', 0.2, 0, Math.min(7.2, depth - 0.3), style);
    await place(replacement, 'lamp', 3.3, -depth * 0.25, 1.8, style);
  } else if (room === 'kitchen') {
    const rowZ = -depth / 2 + 0.85;
    await place(replacement, 'larder', -3.3, rowZ, 2.0, style);
    await place(replacement, 'sink', -1.3, rowZ, 2.0, style);
    await place(replacement, 'base', 0.7, rowZ, 2.0, style);
    await place(replacement, 'wall', -1.3, rowZ, 2.0, style);
    await place(replacement, 'wall', 0.7, rowZ, 2.0, style);
    await place(replacement, 'fridge', 3.0, rowZ, 2.0, style);
    if (depth > 7) await place(replacement, 'island', -0.2, 1.6, 6.1, style);
  } else if (room === 'bedroom') {
    const isBunk = config.bedroomType?.includes('bunk');
    await place(replacement, isBunk ? 'bunk' : 'bed', 0, 0, Math.min(5.6, depth - 0.8), style, Math.PI / 2);
    await place(replacement, 'wardrobe', -3.2, -depth / 2 + 0.85, 3.0, style);
    await place(replacement, 'table', -2.8, 0, 1.4, style);
    if (config.bedroomType?.includes('study')) {
      await place(replacement, 'desk', 3.3, -depth / 2 + 1, 3.4, style);
      await place(replacement, 'taskChair', 3.0, -depth / 2 + 2.3, 1.8, style);
    }
    await place(replacement, 'rug', 0.7, depth / 2 - 0.8, Math.min(5, depth - 1), style);
  } else if (room === 'bathroom') {
    const width = Number(source.userData.roomWidthFt) || 7;
    await place(replacement, 'vanity', -width / 2 + 1, -depth / 2 + 1, 2.7, style);
    await place(replacement, 'tap', -width / 2 + 1, -depth / 2 + 0.85, 0.5, style);
    await place(replacement, 'toilet', -0.3, depth / 2 - 1.0, 1.5, style);
    if (config.bathroomType?.includes('bath') && depth > 6.5) {
      await place(replacement, 'bath', width / 2 - 1.5, -0.1, 4.6, style, Math.PI / 2);
    } else {
      await place(replacement, 'tray', width / 2 - 1.6, -depth / 2 + 1.6, 2.6, style);
      await place(replacement, 'shower', width / 2 - 1.6, -depth / 2 + 1.6, 2.6, style);
    }
  } else return;

  replacement.position.copy(source.position);
  replacement.quaternion.copy(source.quaternion);
  replacement.scale.copy(source.scale);
  source.parent?.add(replacement);
  source.visible = false;
}

export async function upgradeInteriorFurniture(root: THREE.Object3D, config: Parameters<typeof replaceRoom>[1], isCancelled: () => boolean) {
  const rooms: THREE.Group[] = [];
  root.traverse((object) => {
    if (object instanceof THREE.Group && object.userData.interiorRoom) rooms.push(object);
  });
  for (const room of rooms) {
    try {
      await replaceRoom(room, config);
    } catch (error) {
      console.warn(`Could not load realistic ${room.userData.interiorRoom} assets; keeping procedural furniture.`, error);
    }
    if (isCancelled()) return;
  }
}
