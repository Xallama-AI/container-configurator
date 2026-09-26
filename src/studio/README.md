# Container Studio

Open `/studio` through the existing development server (`npm run dev`, port 3000).
The original configurator remains at `/`. The entry point loads only the selected
version; the original application and its components are unchanged.

## Structure

- `config.ts`: typed configuration, dimensions and option catalogs.
- `Controls.tsx` / `studio.css`: white accordion controls, desktop 40/60 layout and
  mobile 50/50 viewer/control split. Only the options list scrolls.
- `geometry.ts`: corrugated wall segments with cells removed at real openings.
- `model.ts`: ISO shell, castings, rails, stamped cargo doors, opening frames,
  glazing, shutters, lining, floors, lighting and equipment mounting positions.
- `assets.ts`: lazy texture/model cache and ownership/disposal.
- `camera.ts`: feature views, animated entry/exit paths through the cargo doors,
  interior constraints and responsive framing.
- `Viewport.tsx`: demand rendering, bounded DPR, cached shadows, resized viewport,
  screenshot export and asynchronous AC attachment with stale-request guards.

## Assets and performance

Assets live in `/public/container-configurator`; see `LICENSES.md` and `assets.json`
there for source credits. Run `python scripts/download-studio-assets.py` to rebuild
the downloaded CC0 assets (Python and Pillow required). The outdoor condenser uses
512 px textures in a GLB. The indoor split head is an original compact model;
regenerate it with `node scripts/create-studio-ac.mjs`.

Materials use 1K source maps converted to WebP. AO and roughness share a packed
texture. Grass, the selected wood floor and the 1K HDR load initially; other floors,
concrete and AC models load when selected. Static shell/fittings are batched by
material; roller slats are instanced. Paint changes reuse the existing model.
The renderer draws during interactions, transitions, resize and asset completion,
then stops when idle. Development-only `data-*` counters on `.studio-canvas` expose
frames, calls, triangles, geometries and textures for inspection.

Outer shell proportions follow 20/40 ft ISO standard/high-cube dimensions. Hardware
and modification details are visualization geometry; this is not a fabrication or
engineering drawing. Oversized glazing is fitted within the selected shell.

## Verification

- TypeScript and production build checked.
- Desktop and 390/320 px mobile layouts visually inspected.
- Interior/floor/wall views, glazing on both sides, side/rear shutters and both AC
  units inspected; condenser mounting height and inward lining faces corrected.
- 27 procedural configurations checked for finite geometry/normals/UVs, with a
  maximum of 34,666 triangles in the examined configurations (excluding AC assets).
- Window geometry checked to contain no triangles within the cutout.
- Fresh studio startup checked without console errors or Three.js warnings.
- Idle frame counter remained unchanged across observations.
- Original route rendered and its controls remained available.

Glass transmission adds rendering passes. These checks establish behavior on the
development browser; they are not a benchmark across physical mobile devices.
