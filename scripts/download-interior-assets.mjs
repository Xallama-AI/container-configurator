import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const packs = {
  'bedroom-and-living-room-furniture': [
    'Sofa Three Seat (Bedroom and Living Room Furniture)',
    'Sofa Two Seat (Bedroom and Living Room Furniture)',
    'Armchair Lounge (Bedroom and Living Room Furniture)',
    'Chaise Lounger (Bedroom and Living Room Furniture)',
    'Dining Chair Upholstered (Bedroom and Living Room Furniture)',
    'Dining Table 6-Seat (Bedroom and Living Room Furniture)',
    'Desk Writing (Bedroom and Living Room Furniture)',
    'Desk Task Chair (Bedroom and Living Room Furniture)',
    'Double Bed Upholstered (Bedroom and Living Room Furniture)',
    'Bunk Bed Twin (Bedroom and Living Room Furniture)',
    'Wardrobe 2 Door (Bedroom and Living Room Furniture)',
    'Side Table Round (Bedroom and Living Room Furniture)',
    'Rug Wool Large (Bedroom and Living Room Furniture)',
    'Floor Lamp Arc (Bedroom and Living Room Furniture)',
    'Side Table Square Drawer (Bedroom and Living Room Furniture)',
  ],
  'fitted-kitchen-and-bathroom-builder': [
    'Kitchen base unit 600 (Fitted Kitchen and Bathroom Builder)',
    'Kitchen sink base unit 600 (Fitted Kitchen and Bathroom Builder)',
    'Kitchen wall unit 600 (Fitted Kitchen and Bathroom Builder)',
    'Kitchen wall unit 600 in oak (Fitted Kitchen and Bathroom Builder)',
    'Kitchen tall larder unit 600 (Fitted Kitchen and Bathroom Builder)',
    'Kitchen single oven housing 600 (Fitted Kitchen and Bathroom Builder)',
    'Kitchen integrated fridge housing 600 (Fitted Kitchen and Bathroom Builder)',
    'Kitchen worktop run 2 m (Fitted Kitchen and Bathroom Builder)',
    'Kitchen island with breakfast bar 1800 (Fitted Kitchen and Bathroom Builder)',
    'Bathroom vanity unit 800 (Fitted Kitchen and Bathroom Builder)',
    'Bathroom wall hung vanity 800 (Fitted Kitchen and Bathroom Builder)',
    'Close coupled WC (Fitted Kitchen and Bathroom Builder)',
    'Single ended bath 1700 (Fitted Kitchen and Bathroom Builder)',
    'Square shower enclosure 900 (Fitted Kitchen and Bathroom Builder)',
    'Square shower tray 900 (Fitted Kitchen and Bathroom Builder)',
    'Basin mixer tap (Fitted Kitchen and Bathroom Builder)',
    'Wall mounted shower valve (Fitted Kitchen and Bathroom Builder)',
    'Toilet roll holder (Fitted Kitchen and Bathroom Builder)',
  ],
  'home-appliances-and-utility': [
    'Freestanding fridge freezer 600 (Home Appliances and Utility Room)',
    'Built-in single oven 600 (Home Appliances and Utility Room)',
    'Induction hob, four zone (Home Appliances and Utility Room)',
    'Dishwasher 600 (Home Appliances and Utility Room)',
  ],
};

const outputRoot = path.resolve('public/container-configurator/models/interior');
await mkdir(outputRoot, { recursive: true });
const manifest = [];

for (const [packSlug, titles] of Object.entries(packs)) {
  const response = await fetch(`https://3dassets.dev/api/v1/packs/${packSlug}`);
  if (!response.ok) throw new Error(`Could not read ${packSlug}: ${response.status}`);
  const pack = (await response.json()).data;
  const byTitle = new Map(pack.assets.map((asset) => [asset.title, asset]));
  const packDir = path.join(outputRoot, packSlug);
  await mkdir(packDir, { recursive: true });

  for (const title of titles) {
    const asset = byTitle.get(title);
    if (!asset) throw new Error(`Asset missing from ${packSlug}: ${title}`);
    if (asset.license?.slug !== 'cc0-1.0') throw new Error(`Unexpected license for ${title}`);
    const modelResponse = await fetch(asset.cdnUrl);
    if (!modelResponse.ok) throw new Error(`Could not download ${title}: ${modelResponse.status}`);
    const basename = asset.slug.split('-').slice(packSlug.split('-').length).join('-') || asset.id;
    const safeFilename = `${basename.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}.glb`;
    const modelPath = path.join(packDir, safeFilename);
    const bytes = Buffer.from(await modelResponse.arrayBuffer());
    await writeFile(modelPath, bytes);
    manifest.push({
      title,
      path: `/${path.relative('public', modelPath).replaceAll(path.sep, '/')}`,
      source: asset.url,
      downloadUrl: asset.cdnUrl,
      license: asset.license.name,
      aiGenerated: asset.aiGenerated,
      triangles: asset.stats.triangles,
      sizeMeters: asset.stats.sizeMeters,
      fileSize: bytes.byteLength,
    });
    console.log(`${safeFilename} ${Math.round(bytes.byteLength / 1024)} KB`);
  }
}

const fabricRoot = path.resolve('public/container-configurator/textures/furniture');
await mkdir(fabricRoot, { recursive: true });
const textureCredits = [];
for (const textureId of ['wool_boucle', 'poly_wool_herringbone']) {
  const filesResponse = await fetch(`https://api.polyhaven.com/files/${textureId}`);
  if (!filesResponse.ok) throw new Error(`Could not read Poly Haven texture ${textureId}`);
  const files = await filesResponse.json();
  const textureDir = path.join(fabricRoot, textureId);
  await mkdir(textureDir, { recursive: true });
  for (const [mapName, property] of [['color', 'Diffuse'], ['normal', 'nor_gl'], ['arm', 'arm']]) {
    const file = files[property]?.['2k']?.jpg;
    if (!file?.url) throw new Error(`Missing 2K ${mapName} map for ${textureId}`);
    const mapResponse = await fetch(file.url);
    if (!mapResponse.ok) throw new Error(`Could not download ${textureId} ${mapName}`);
    const localName = `${textureId}-${mapName}.jpg`;
    const bytes = Buffer.from(await mapResponse.arrayBuffer());
    await writeFile(path.join(textureDir, localName), bytes);
    console.log(`${localName} ${Math.round(bytes.byteLength / 1024)} KB`);
  }
  textureCredits.push(`- [${textureId.replaceAll('_', ' ')}](https://polyhaven.com/a/${textureId}) by Poly Haven, CC0 1.0.`);
}
const optimize = spawnSync('python', ['scripts/optimize-furniture-textures.py'], { stdio: 'inherit' });
if (optimize.status !== 0) throw new Error('Could not optimize downloaded furniture textures.');

await writeFile(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
const credits = [
  '# Interior 3D asset credits',
  '',
  'Downloaded models in this folder are from [3DAssets.dev](https://3dassets.dev/). The publisher marks these assets CC0 1.0 Universal; no attribution is required. Models are explicitly identified as AI-generated by their publisher. See `manifest.json` for each model page, original CDN URL, dimensions, triangle count, and file size.',
  '',
  'Furniture surface textures:',
  ...textureCredits,
  '',
  'Original license text: https://creativecommons.org/publicdomain/zero/1.0/',
  '',
].join('\n');
await writeFile(path.join(outputRoot, 'CREDITS.md'), credits);
