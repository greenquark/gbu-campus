# Model and photo campus rebuild — 2026-10-02

Both day and night modes share the completed rebuilt campus. At the local-build handoff, Railway authentication was unavailable. The user subsequently requested deployment and approved the CLI permissions; this exact build is now published and verified. See [railway-model-evidence.md](railway-model-evidence.md) for deployment 800e2671-24eb-4aed-81e3-568d7babe2f9 and the public checks. The build and gameplay evidence below remains attributed to the local rebuild.

## Delivered changes

- Removed exactly five byte-identical JPEG copies, with retained-copy SHA-256 verification. All 60 distinct photographs and all 39 MOV files remain. The 99-file content-hash multiset matches the original inventory minus the five authorized duplicates. Audit: `output/GBU_Media_Organization_20261002/duplicate-image-removal-result.json` and `duplicate-image-verification.json` relative to the course root.
- Replaced the old campus geometry with shared architecture derived from the physical-model photos/walkaround and organized facade photographs. Left towers, west teaching block, central crescent/hill/water court, rear arcade, east teaching block, sports hall/blue track and orange-recessed dormitories retain their model-relative arrangement.
- Rebuilt walking, navigation and demo routes around that layout. Four distinct challenges use the water court, west teaching corridor, track and dormitory arcade. Six day-tour landmark stops and the guided walk use the same geometry. The map now pauses time, combat and audio while open.
- Generated and integrated a photographic sports shoe and charcoal trouser leg. Preserved the existing zombie disassembly/reassembly and attack timing. Fixed pursuers walking into the camera during bite cooldown.
- Preserved the previous source under `Old/20261002-before-model-rebuild`. The earlier standalone games and unrelated racing project were not changed.

Design and sources: `model-rebuild-design.md`, `world-model-evidence.md`, `kick-asset-evidence.md`. The last includes the complete image-generation prompt, asset hash, alpha inspection and integration details. Layout authority: `shared/campus-layout.js`. This is a stylised reconstruction with compressed relative distances, not a surveyed or photogrammetric model. Unseen elevations/interiors and the story are interpretations.

## Verification

| Evidence | Result and scope |
| --- | --- |
| `model-final-1/checks.json` | 11 passing checks: all stations/checkpoints/gate reachable, clear route centre lines, full input-driven win, real keyboard movement/map/held-E puzzle/kick, bite defeat and retry, real emulated-touch movement/kick, same-tab return, no runtime errors or missing assets. |
| `model-final-1/bot.json` | Movement-driven completion in 150.3167 simulation seconds, four memories, zero softlocks; one bite, six kicks, two knockdowns, 14 escapes and 15 chases. No objective grants or teleports in the complete run. |
| `model-evidence.json` and `model-final-1/*` | Declared 26 desktop/phone canvas captures and 26 corresponding JSON reports; manifest checker passed all 27 declared artifacts including checks. Day welcome/water/sports/dormitory; night title/active/west/water/sports/track/kick/defeat/victory. Structural pixel checks and visual inspection were separate. |
| `model-motion-final/motion.json` | Unpaused real-browser Watch demo reached all four memories and victory in 150.3 seconds. Native AudioContext closed and active sources were zero after victory. Fifteen motion frames cover bite, kick, impact, reassembly and departure. A close-contact camera defect found here was subsequently fixed. |
| `model-review-final/checks.json` | Six passing final checks after review fixes. Full input-driven win repeats with identical progression metrics; minimum initial pursuing-student contact spacing is 1.16 units. Final dorm viewpoint/approach are collision-clear. Desktop and emulated phone map suspend gameplay/audio, reject movement/action input, and resume with Escape. No errors or missing assets. |
| `model-review-final/contact-*.jpg` | Seventeen unpaused final frames; inspected bite-to-kick transition, clean shoe silhouette, impact and scattered limbs. The earlier face-through-camera frame is absent. |
| `model-review-final/*-residence.png`, `*-map-paused.png` | Final desktop/phone visual follow-up: oblique dormitory view shows the arcade; map copy/legend fits and clearly states that gameplay is paused. Phone view remains a narrower facade composition than desktop. |
| `model-motion-final/gym-plaque-final.png` | Confirmed the interior GBU plaque no longer intersects the centre structural fin. |
| `model-final-http.json` | 26 final local HTTP and SHA-256 checks match the latest release manifest, including fonts and generated shoe. Despite the verifier's historical filename, this run targets localhost. |
| `tools/server-smoke.mjs` | 14 checks passed for routes, MIME, HEAD, health, real 404s, forbidden paths, symlinks, caching and compression. |

Final source/build changes after the 26-view run were limited to the plaque offset, map contrast/copy/pause behavior, dormitory camera and close-contact spacing. The focused final review run covers those effects; unchanged broad-capture evidence is reused. Earlier failed attempts remain in their own directories. The review test's first attempt pressed Space while focus was on the map-close button, correctly activating that button; the test was repaired to exercise gameplay keys without activating the focused control.

Commands, from the game root using the installed Node/Python runtimes and Playwright dependency path:

```text
node tools/build.mjs
node server.mjs
node tools/verify-rebuild.mjs http://127.0.0.1:5190 model-final-1
python -X utf8 <threejs-game-director>/scripts/check_evidence.py . --manifest artifacts/model-evidence.json
node tools/verify-model-motion.mjs
node tools/verify-model-review.mjs
node tools/server-smoke.mjs
node tools/verify-public.mjs http://127.0.0.1:5190 artifacts/model-final-http.json
```

## Rendering and visual review

Measured Chrome GPU: Intel UHD Graphics 620 through ANGLE/D3D11, not software rendering. Across the 26 declared captures: maximum 59 draw calls, 134,696 triangles, 64 geometries and five textures. Across the sampled live full run: maximum 69 calls, 136,306 triangles, 72 geometries and five textures. Live sampled frame rates ranged from 49 to 60 fps; its ending sample is 60 fps with a 16.8 ms p95 over 360 frames. This is evidence from this computer, not a physical-phone performance claim.

Active-play canvas metrics: desktop entropy 5.11 bits, edge density .376, luminance contrast 191.2, dominant color share .178; phone entropy 5.16, edge density .379, contrast 200.3, dominant share .166. Phone active play uses 43 draw calls / 130,532 triangles, below the inspector's 150-call / 300,000-triangle starting budget. Pixel metrics establish variation and contrast; they do not establish architectural accuracy or aesthetic quality.

The three graphics calibration anchors were inspected. Genre equivalents and final editorial scores follow; no controlled before-score was captured for this rebuild, so no numeric improvement is claimed.

| Category / genre equivalent | Before | After / 3 | Evidence and remaining limit |
| --- | --- | --- | --- |
| Art direction / campus mystery | Not captured | 2 | Campus facades, day/night palette and memory locations follow one place-based direction. |
| Hero / first-person leg | Not captured | 2 | Generated fabric, laces and sole with clean alpha and visible windup/impact/retract. A 2D cutout, not a fully articulated leg. |
| Enemies / students and Listener | Not captured | 2 | Retained GBU student forms, bite anticipation, scattering and slow reassembly; intentionally stylised faces. |
| Interactables / four memories | Not captured | 2 | Location-specific actions, progress, next-track beacon and recovered-map states. |
| World / campus buildings and landscape | Not captured | 2 | Authored crescent, piers, louvered blocks, bridges, towers, orange bays, terraces, water, courts and track; limited fine architectural detail. |
| Materials / campus surfaces | Not captured | 2 | White cladding, dark glazing, orange recesses, blue track, cutout foliage, water normal/reflection and photographic cloth. |
| Lighting / readable night | Not captured | 2 | Readable key/fill, torch, restrained fog and mapped reflection; no real-time night shadows. |
| Motion / kick and pursuit feedback | Not captured | 2 | Input-driven impact, independent falling limbs and reassembly; final close-contact spacing verified in motion. |
| UI / navigation and survival | Not captured | 2 | Map, track timer, responsive actions and readable backplates; compact rectangular survival/objective groups remain visible. |
| Performance evidence | Not captured | 2.5 | Declared viewports, renderer/pixel metrics, real GPU, complete bot and browser run, motion sequence, build/HTTP evidence; no controlled before-performance baseline. |

Average 2.05/3. No overall premium/AAA/showcase claim is made: this is a functioning reference-based stylised campus rebuild. Further photorealism would require richer facade materials and character assets; the current large architectural forms and supplied-photo correspondences are the delivered scope. No observed progression blocker remains. Physical phone hardware, screen-reader gameplay and exhaustive alternate-route/difficulty balancing were not tested.

The screenshot harness was retained because this task changed generated artwork, architecture, map and responsive HUD. It saves acknowledged states and measured pixels. Its baselines support future comparisons; no fabricated visual-diff pass is claimed.

## Build and delivery

Final release: 26 files, 2,859,571 bytes (2.73 MiB), with per-file SHA-256 in `release-files.json`. Only consumed fonts, logo and shoe are copied; the prior unused GLB/HDR assets stay in source/history. Source, references, credentials and QA artifacts are excluded from `release/`. Build passed. Vite's font-resolution notices are covered by verified runtime asset copies; the approximately 506 kB Three.js chunk produces a non-blocking size advisory.

Local play: http://127.0.0.1:5190/night/ . Day tour: http://127.0.0.1:5190/ . Recovery launcher: `Start-GBU-Campus.cmd`. The production build works offline after launching the local server. The same verified release is now public at https://campus-production-ce74.up.railway.app/night/ with Day tour at the site root; publication evidence is recorded separately in `railway-model-evidence.md`.
