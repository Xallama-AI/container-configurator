# Container Studio asset sources

Grass: ambientCG Grass005, clean short green lawn, CC0 1.0.
Source: https://ambientcg.com/view?id=Grass005.
The 1K color/normal maps use high-quality WebP; AO and roughness share a
512px lossless packed map to reduce transfer and GPU memory costs.

Downloaded Poly Haven assets are CC0 1.0: https://polyhaven.com/license.
Source IDs, authors, and optimization notes are recorded in `assets.json`.
The preparation script downloads original 1K maps, converts color maps to WebP,
packs AO/roughness into a shared texture, and keeps the wood normal maps lossless.
Only the selected flooring is requested by the viewer.

Outdoor condenser: Monsta3D / Poly Haven, `exterior_aircon_unit`.
The unused rusted variant is removed and the clean unit is packed as GLB with
512px textures. Source: https://polyhaven.com/a/exterior_aircon_unit.

Indoor split head: original model authored for this project, CC0 1.0.
Rebuild with `node scripts/create-studio-ac.mjs`. The searched public indoor
source supplied a proprietary Meshy file rather than an interoperable GLB,
so an original compact GLB was created from the supplied visual references.

Concrete lining: ambientCG Concrete034, CC0 1.0.
Source: https://ambientcg.com/a/Concrete034.
License: https://docs.ambientcg.com/license/.

Container proportions: Hapag-Lloyd Container Specification, external ISO sizes
20 ft = 6.058 m; 40 ft = 12.192 m; width = 2.438 m;
standard height = 2.591 m; high cube = 2.896 m.
https://www.hapag-lloyd.com/en/services-information/cargo-fleet/container.html

Modification geometry was modeled from the user references and the public
Midstate Containers modification catalog. Their photography is not redistributed.
