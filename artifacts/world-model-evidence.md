# Shared campus world: source mapping and verification

Date: 2026-10-02. Scope: `shared/campus-world.js`, `night/src/world.js`, `tour/src/world.js`. Earlier worlds were preserved by the lead under `Old/20261002-before-model-rebuild`. `shared/campus-layout.js` is the unmodified coordinate, path and station authority.

## Source inspection

Inspected all five `output/GBU_Media_Organization_20261002/photos-*.jpg` contact sheets and the complete `long-video-V034.jpg` model walkaround contact sheet. Also inspected full-resolution `Model/IMG_5355.JPEG`, `Central curved building/IMG_5212.JPEG`, `Central curved building/IMG_5216.JPEG`, and `Dormitory blocks with orange recesses/IMG_5199.JPEG` under `3 In Class Activities/University 3D escape room/materials and inputs`.

| Visible feature | Source and implementation |
| --- | --- |
| Overall adjacency | IMG_5355 and IMG_5354 walkaround: left balcony and stepped towers; teaching blocks; central curved garden; east sports and dormitory group. Model front is +Z, not a surveyed north direction. |
| Curved building | IMG_5212/5213/5216/5217: continuously curved white crown, thin horizontal louvers, dark lower glazing and rising/falling lower ribbon. Authored as curved surface geometry around the landscape, not an imported old GLB or a rectangular collider. |
| Water and garden | IMG_0220/5214/5215/5216: low landscaped hill, contour seating, winding path and water lip. The game water-court station remains outside the blocked lake at (-20,17). |
| Teaching blocks and links | IMG_5209/5210/5221/0756–0758: horizontal louvers, tall supporting piers, open undercrofts and glass bridges. The west station is inside the open ground-level passage. |
| Left towers | IMG_5355/IMG_5354 and IMG_4071/4072: stepped podium/tower silhouette and repeated balcony slabs. |
| Dormitories | IMG_5199: white structural grid, dark railings, orange recessed bays and an open arcade. Three compressed blocks follow the model grouping. |
| Sports hall | IMG_5200/5208/4037/4038/9955: tall vertical facade fins, blue interior band, court lines, tiered seats and roof trusses. The entry and centre aisle remain open. Roof form is a simplified sawtooth interpretation. |
| Sports ground | Photographic blue surfaces and the model sports location inform the blue loop, field lines and goal nets. Exact dimensions and lane count are gameplay adaptations. |

## Geometry and rendering contract

- Both editions call the same `build(scene, renderer, {night, onProgress})`; no `campus-reference.glb` is loaded or claimed as current model integration.
- World returns `root`, `colliders`, `bounds`, `stations`, `safeZones`, `spawn`, `exit`, `diagnostics`, `update`, `setMemory`, plus flat-ground `groundHeight` / `isWalkable` helpers.
- Static architecture, piers, windows, rails, paving, field lines and vegetation are merged by material. No per-window draw calls. Numbered track beacons react to `state.track`, turn toward the player and distinguish active-next/completed state.
- Source-derived geometry and collision proxies are separate. Explicit 2D AABBs cover building solids, short curved-shell segments, lake strips and hill strips. Ground is y=0. Elevated bridges do not block ground routes.
- Glass and water use a locally authored 256×128 sky reflection map. This is procedural ambience, not a photographed HDR environment. Water normals animate subtly; there is no real-time planar reflection pass or transmission pass. Flags move from stored rest positions.
- Entire track bounding rectangle excludes vegetation, not merely the four checkpoint points. Field goals and net lines have no collision proxy, keeping the contracted lap unobstructed.

## Verification evidence

Node construction of both editions succeeds with finite geometry. After the foliage/field repairs, static geometry is approximately 107,930 triangles in the night Node construction. Node has no canvas, so the browser adds the wayfinding atlas and cutout foliage materials. Declared dynamic draw-call upper bound is 23; live renderer counts must be read from the consolidated browser reports, not inferred from the Node-only count.

Build-time collision validation samples all 1,967 contracted path positions at 0.4-unit spacing with a conservative 0.65-unit player radius. Results: zero route conflicts; zero station/approach conflicts; zero track checkpoint conflicts. There are 278 explicit collision proxies in the final Node construction. An additional query confirms zero tree-trunk colliders within the complete track rectangle.

The lead's first integrated input simulation reports all stations, track and gate reachable, all path centre lines clear, and a complete movement-driven demo win in 150.3 seconds without a softlock. That first run preceded the final visual repairs; final consolidated rerun is authoritative for release.

Visual review of `artifacts/model-rebuild-3`: desktop welcome, water court, sports hall, dormitory facade, title, active play, teaching memory, water memory and mobile active play. Identified and repaired: two trees on the athletics field; over-high hill and oversized opaque tree crowns concealing the curved building; blank sports interior rear wall; missing football field detail. Repairs lower the hill from 6 to 3.1 units, reduce hill trees from 30 to 18, replace opaque crowns with batched cutout leaf sprays, reserve the full field from planting, and add the interior panel/fins/blue band and goal nets. Final post-repair browser visual and shader verification is recorded below when available.

## Mapping limits

This is a recognisable, stylised reconstruction from a physical model and photographs. It is not a photogrammetric scan, a survey, a BIM model, or an assertion of true dimensions, orientation or exact room functions. Relative distances are compressed for gameplay. Hidden elevations, roofs, furniture, accessible ground-floor rooms, memory objects and the supernatural story are interpretations. The hill and lake are deliberately non-playable; the raised decorative hill path is scenery. Text wayfinding is locally typeset and is not represented as an authentic university logo. No complete-game premium/AAA score is claimed from the world-only pass.

## Final browser follow-up

Reviewed `artifacts/model-final-1/desktop-welcome.png`, `desktop-entrance.png`, `desktop-sports.png`, `desktop-track.png`, `desktop-greenhouse.png`, `mobile-entrance.png`, and `mobile-track.png`. The athletics field is clear, goals and numbered checkpoint beacons are visible, cutout foliage renders with broken leaf silhouettes, and the lower hill reveals the continuous white curve. The water material compiles with `gbu-campus-water-r180-v1` and the environment map is present. All 26 desktop/mobile capture JSON reports have zero console/page errors.

Measured combined-scene renderer upper bounds across those 26 reports: **59 draw calls, 134,696 triangles, 64 geometries, 5 textures**. Day welcome is 43 calls / 109,732 triangles; night active play is 52 calls / 134,144 triangles; mobile active play is 43 calls / 130,532 triangles. These include gameplay objects owned by other files. They stay below the 120-call world target and the skill's 150-call / 300k-triangle mobile starting budgets. Desktop/mobile capture reports use different renderer schemas; values above read either `renderer.render` plus `renderer.memory` or their flat equivalent. They are measured counts, not the inspector's null day-budget row values.

`artifacts/model-final-1/checks.json` records 11 passing integration checks, including path/station reachability, a complete movement-driven win in 150.3167 seconds, real keyboard movement, a held-E water puzzle, kick interaction, loss/retry, emulated touch input and same-tab navigation. No runtime errors or missing assets were recorded. Physical-phone testing remains unperformed.

One minor overlap found in the final sports capture was corrected after that run: the GBU interior plaque moved from z=-6.48 to z=-6.20 so the centre fin no longer cuts through its text. This does not change geometry count, collision or gameplay. The lead's subsequent rebuild owns visual confirmation of that last plaque offset. The consolidated release report owns whole-game interaction, audio, mobile and performance acceptance.
