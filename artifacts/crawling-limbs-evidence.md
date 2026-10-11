# Crawling limbs and organic reassembly — 2026-10-05

The revised animation is deployed at [Haunted night](https://campus-production-ce74.up.railway.app/night/). Railway deployment `34d0a140-c610-434d-9378-7f991ee33272` is `SUCCESS`. Public HTTP verification passed all 29 route and asset-integrity checks. All 13 public browser integration checks passed, with no runtime errors or missing assets. Eight public desktop/phone captures were visually inspected and the nine-artifact public manifest passed.

## What changed

- Arms alternate reaching, planting articulated fingers, pulling through the elbow, and recovering. Left and right limbs have independent timing. The head rolls and twitches; knees and toes flex during the return.
- The fallen torso settles onto the paving. Detached surfaces use their visible vertices for floor contact; brief recovery lifts remain visible. Shadows and drag smears sit above the actual plaza surface.
- Separation reveals irregular dark tissue, folded edges and pale connective fibers. Short strands contract near reconnection, with staggered docking and a body shudder. Ordinary hands and wrists blend back to their standing poses.
- Both torch-lit and unlit material variants prepare during loading, avoiding a first-play shader pause.

The existing eight-second knockdown and 1.4-second rise, campus layout, game rules, character textures, crest, player shoe and audio remain intact. This is authored supernatural animation, not a ragdoll or soft-body simulation. All new geometry and effects are original local procedural work; no game assets were copied or new external asset generation used. Previous sources are preserved in `Old/20261005-before-crawling-limbs/`.

## Reference choices and boundaries

[Capcom's Rasklapanje file for Resident Evil 6](https://game.capcom.com/residentevil/de/exfile-2-41.html) describes detached body parts acting independently and reassembling. It supplied the direct mechanical precedent. The official file was available through indexed text; direct automated access returned HTTP 403.

[EA/Motive: Inside Dead Space — A New Necromorph Nightmare](https://careers.ea.com/ea-studios/motive/news/inside-dead-space-2-new-necromorph-nightmare) describes layered anatomy and physical limb reactions. It informed weight, exposed tissue and material response. This is not evidence that Dead Space implements the same autonomous return behavior. The implementation combines those references in an original campus-game sequence.

## Verification

Final local run: `reassembly-final-4`, against the production build on port 5190. All **11 functional checks** passed, with no uncaught page errors or missing assets.

- Twelve declared and visually inspected captures: standing portrait, scattered, gripping, crawling, docking and rejoined, each at desktop 1440×900 and phone 390×844.
- Actual keyboard and touch kicks after a pursuing student's bite; keyboard movement; real menu restart; pause/resume with audio suspension and recovery.
- Twenty-four live samples across game time 3.38–15.25 seconds cover scatter, independent pulls, docking, rising and renewed pursuit. These were recorded unpaused following a real Space-key kick and mouse look. The WebM and motion frames are in `reassembly-final-4/`; selected frames 04, 10, 16, 18 and 22 were visually reviewed alongside the declared captures.
- Live contact checks verify the crawling surfaces remain at pavement contact or inside the intended recovery-lift range.
- The declared manifest checker passed all **14 artifacts**. Local HTTP verification passed **29 checks**.

Independent review found lateral drift during the hand plant, conservative bounding-box contact, a canceled recovery lift and a wrist flip at the down-to-rising transition. The final implementation removes the lateral wiggle from planted limbs, uses visible surface vertices, preserves lift in the contact target and blends child-joint poses back before rising. Visual inspection also found hidden contact stains and a floating torso; both were corrected. An early capture exposed the cold torch-shader pause, which is now prepared at load time. Two subsequent harness failures came from leaving the player exposed until defeat and then testing movement/audio; control tests now start a fresh run through the actual menu.

## Performance and scope

Unrecorded active recovery (`reassembly-live-performance.json`) measured **50–60 fps** after initial samples on this computer's Intel UHD 620 GPU. Final rolling mean was 20.19 ms and p95 35.8 ms. Maximum was **65 draw calls / 268,480 triangles**; the last sample used 87 geometries and 9 textures at a 1152×720 drawing buffer. Video and repeated screenshots are excluded from this measurement. Detached-vertex contact scans run only during the affected fallen states.

The crawling desktop capture measured color entropy 4.90 bits, edge density 0.265, luminance contrast 204.1 and dominant color share 0.228. All twelve capture budgets were within their declared desktop or mobile tiers; their maximum was 65 calls, 268,640 triangles, 81 geometries and 9 textures. These are coverage and resource measurements, not proof of photorealism.

Focused editorial assessment using the graphics skill's VFX/motion category: **before 1.5 / after 2** for reassembly. The earlier regular glide and simple seam feedback now have articulated grips, staggered pulls, ground contact and organic docking. This narrow revision does not re-score the whole game or claim AAA quality.

Phone verification uses Chrome touch emulation; no physical iPhone or Safari test was performed. The full four-memory campaign was not replayed for this animation-only revision. Earlier campaign evidence remains attributed to its original build.

## Release records

Only `release/` was uploaded: **29 files, 4,243,268 bytes**, individually SHA-256 verified before upload. Immutable upload manifest: `railway-reassembly-release-files.json`. Deployment record: `railway-reassembly-deployments.json`. Live hash/route report: `railway-reassembly-http.json`. Public browser checks: `railway-reassembly-20261005/interaction-results.json`, with captures in the same directory and the current public manifest in `evidence.json`. Local capture manifest and functional results: `reassembly-final-4/manifest.json` and `reassembly-final-4/checks.json`.

Skills used: Three.js Game Director, AAA Graphics Builder and QA Release, with the authoring, technical-art, motion-capture, release-check and evidence-manifest references. Audio generation was inspected during planning but no audio changes were made.
