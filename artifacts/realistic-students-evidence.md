# Realistic GBU zombie students — 2026-10-03

The requested character revision is deployed at [Haunted night](https://campus-production-ce74.up.railway.app/night/). Railway deployment `9f4c2130-a3c6-426b-8c45-dc221df65313` reports **SUCCESS**, created 2026-10-02 18:17 UTC / 2026-10-03 02:17 China time. All 29 public HTTP/asset checks and 13 public browser integration checks passed.

## Delivered change

Six GBU students now share smoothly authored anatomical surfaces with distinct height, width, posture and clothing tints; two original adult face textures provide male and female variants. Rounded shoulders, sculpted facial profiles, necks, elbows, knees, individual fingers and shoes replace the previous primitive-based characters. Cotton, trouser, skin and hair textures add surface detail and wear. The authentic existing GBU crest remains unchanged.

Movement now uses distance-driven gait with stance/swing phases, bent knees, asymmetric arm poses, subtle head anticipation and breathing. The torso bends around the waist. Hidden hip surfaces are fitted inside the clothing, and garment openings are closed for the existing supernatural disassembly. The photographic first-person shoe, collision rules, bite/kick timing, eight-second limb return, campus, tasks and audio lifecycle remain unchanged.

Character textures are loaded before play becomes available, and their shaders are precompiled during loading. Source changes are concentrated in `night/src/student-anatomy.js`, `night/src/zombie-visuals.js`, the loading/debug sections of `night/src/main.js`, and the character-directory copy in `tools/build.mjs`. Prior sources and release records are retained under `Old/20261003-before-realistic-students`.

## References and asset provenance

The chosen direction draws on *Train to Busan* and *28 Days Later*: human proportions, practical infected-person makeup, worn ordinary clothing and uneasy, uneven movement. This is an original character interpretation; no film still or actor photograph was copied into the game. Research references were the [BFI zombie-film overview](https://www.bfi.org.uk/lists/10-great-zombie-films) and the [original Cannes Train to Busan pressbook](https://cdn-media.festival-cannes.com/film_film/0002/15/ce26f0d45fa520bae0bdd53e865c00c3b783019d.pdf). The pressbook text was accessible; its PDF image-render request timed out, so no frame-by-frame movie visual audit is claimed.

Built-in image generation produced the original albedo images, applied to custom-authored geometry. This is not a scanned human, a generated rigged GLB, or motion capture. Tripo/Gemini credentials were unavailable after environment and profile probes, so no external paid model task was submitted. Full prompts, original PNGs, runtime JPEG hashes and limitations are in [asset-report.md](zombie-assets-20261003/asset-report.md). Three runtime JPEGs total 1,359,965 bytes; all are 1254 × 1254 pixels. There are two face identities across six variants, not six unique photographed people.

## Final local verification

The accepted run is [students-final-5/manifest.json](students-final-5/manifest.json); earlier attempts and repairs remain in their original folders.

- Production build passed: **29 files, 4,231,602 bytes (4.04 MiB)**. The exact uploaded hashes are in [railway-students-release-files.json](railway-students-release-files.json). Only `release/` was uploaded.
- All **16 declared captures** passed and were visually inspected: front, profile, rear, six-student lineup, chase, scattered, crawling return and rejoined poses at 1440 × 900 desktop and 390 × 844 phone. Phone lineup naturally crops the outer members; the desktop view verifies all six. Reports include actual state acknowledgments, renderer statistics, nonblank pixel metrics and no browser errors.
- **Nine focused checks** passed in [checks.json](students-final-5/checks.json): both viewports, actual keyboard/touch kicks after a bite, unpaused scatter/return/rise, real walking input, audio pause/resume in both viewports, and no uncaught errors or missing assets.
- **32 live samples**, from simulation time 3.45 to 16.80 seconds, plus a WebM and sequential screenshots preserve the unpaused motion pass. Scatter, crawling, joining, rising and subsequent contact were visually inspected. See [motion.json](students-final-5/motion.json) and [recording](students-final-5/video/page@f8c680527a0f12bc0f445a28cad8b1d8.webm).
- The current-run evidence checker passed all **18 declared artifacts**. Local HTTP/hash checks passed **29 checks** in [students-final-local-http.json](students-final-local-http.json). The unchanged server passed its existing **14 checks**, including real 404s, traversal rejection, headers, conditional responses and health routes.

Review repairs included sleeve/head proportions, matched face/neck shading, atlas-mipmap artifacts, slow-walk foot sliding, first-use shader delay, and shirt/trouser intersections during a lunge. An early test used a fixed 200 ms audio-resume delay; it was corrected to await the asynchronous browser state. No audio implementation was changed.

## Measured rendering and remaining limits

The measured GPU is Intel UHD Graphics 620 through ANGLE/D3D11, not software rendering. Across the final 16 captures, the maxima were **57 calls / 201,740 triangles / 74 geometries / 9 textures**. Students account for 92,892 triangles in 23 shared geometry/material batches. The live recorded motion pass reached 59 calls / 202,054 triangles / 82 geometries / 10 textures; observed frame rates were 36–60 fps while recording video and screenshots.

A separate 15-second active demo sample, with no screenshot or video encoding, recorded **47–60 fps** after initial warmup. Its final sample was 50 fps, mean frame time 20.1 ms and p95 36.0 ms at a 1152 × 720 drawing buffer. That pass reached 65 calls / 202,098 triangles / 85 geometries / 10 textures. See [students-live-performance.json](students-live-performance.json). These results describe this computer, not physical-phone performance; the revision is more expensive than the previous simple character meshes.

The graphics calibration anchors were inspected earlier in this task. The following are editorial scores against this request for greater character realism, not a controlled perceptual benchmark or a claim of film-quality rendering. The old [contact view](model-review-final/contact-00.jpg) and new [front view](students-final-5/desktop-zombie-portrait.png) / [live contact](students-final-5/motion-30.jpg) were reviewed.

| Affected category | Before / 3 | After / 3 | Evidence and limit |
| --- | --- | --- | --- |
| Student anatomy and face | 1 | 2 | Human silhouette, original textured faces, hands and profiles; joint articulation remains segmented and expressions use static albedo. |
| Student materials | 1 | 2 | Cloth weave, skin detail, hair and shoe surfaces; generated albedo includes some baked shading and is not measured PBR capture. |
| Student movement | 1.5 | 2 | Distance-driven steps, knee bends and asymmetric pose; supernatural limb return remains intentionally stylised. |

Campus, lighting, UI, interactables and first-person shoe were not redesigned for this task. The characters are substantially less block-like but remain lightweight authored browser-game models. Physical iPhone/Safari testing, facial deformation, mocap and a full new four-memory completion run were not performed. The earlier full-completion evidence belongs to the prior campus revision; this pass targets the changed character rendering and its shared integration risks.

## Publication evidence

[railway-students-deployments.json](railway-students-deployments.json) records the successful Railway deployment. [railway-students-http.json](railway-students-http.json) confirms **29 public HTTP and exact SHA-256 asset checks**, including the new faces, cloth atlas and final JavaScript bundle. Existing tabs should be refreshed once to load the revision.

The final [public browser integration results](railway-students-20261003/interaction-results.json) contain **13 passed checks**: keyboard movement, same-tab mode switching, audio disposal, normal-route debug gating, real bite/scattering kick, keyboard modal access, browser Back behavior, ending links, phone layout and touch navigation. No uncaught errors or missing assets were recorded. Eight public desktop/phone captures were visually inspected, and the [current public manifest](evidence.json) passed all nine declared artifacts. Phone results use browser touch emulation; physical iPhone testing remains outstanding.
