# GBU Campus

Live site: https://campus-production-ce74.up.railway.app

The 2026-10-05 crawling-limb revision is deployed and verified on Railway: articulated finger grips, uneven limb pulls, grounded contact, wet tissue, drag marks and staggered reattachment. [Play Haunted night](https://campus-production-ce74.up.railway.app/night/) or [open the Day tour](https://campus-production-ce74.up.railway.app/). Refresh an existing tab once. References, motion review and deployment checks: [crawling-limbs-evidence.md](artifacts/crawling-limbs-evidence.md). Earlier character provenance remains in [realistic-students-evidence.md](artifacts/realistic-students-evidence.md), and campus publication history in [railway-model-evidence.md](artifacts/railway-model-evidence.md).

One campus website with two modes: **Day tour** opens at `/`; **Haunted night** opens at `/night/`. Use the shared header to switch in the same tab. Night pause and ending screens also offer **Return to day tour**. Switching modes ends the current visit or run and stops its audio.

The rebuilt campus follows the physical model: towers at one end, the crescent and garden in the middle, and sports buildings and dormitories at the other. Day tour offers six landmark stops and a guided campus walk. Haunted night adds four location-specific challenges: restore the water reflection, listen in the west teaching block, complete a timed blue-track lap, and replay the dormitory melody. It retains GBU-shirt zombie students, blood loss, kicks, slowly reassembling limbs and touch controls; the kick now uses a photographic running shoe and trousers. Select **Watch demo** from the night title screen.

Night audio shuts down completely on victory, defeat, quit or exit. Pause, mute and leaving the game window suspend its audio engine, including during demos. Continue or Retry restores sound only for active gameplay. See `artifacts/audio-shutdown-evidence.md` for the focused checks and rollout status. Refresh an already-open game tab after an update to load the latest version.

## Run locally

For a fresh checkout, install Node 22.12 or newer, open a terminal in the repository root, then run:

```sh
npm ci
npm run build
npm start
```

Open http://127.0.0.1:5190/ for the day tour or http://127.0.0.1:5190/night/ for the night game. Run all commands from the repository root; the root build packages both modes together. Rebuild after changing source files. The completed build works without internet access. Fonts, geometry, materials and sound generation are local.

On Windows, after the first build you can also double-click **Start-GBU-Campus.cmd**. It uses the existing Codex Node runtime when available, otherwise Node from PATH, and opens the game. The original development checkout uses a junction to local Three.js/Vite dependencies; do not delete that node_modules junction recursively. Fresh checkouts create their own dependencies with `npm ci`.

The Git repository includes `tour/`, `night/`, `shared/`, source assets, build/server tools and written evidence. Generated `dist/` and `release/`, dependencies, local `Old/` snapshots, screenshots, recordings and raw QA results are excluded. Evidence documents describe historical runs; their local capture paths are not included in this source repository.

## Deploy

`npm run build` builds both modes and packages only the finished app into `release/`. That is the Railway upload directory. It contains the built site, a dependency-free Node server, package.json and Dockerfile. Source files, course materials, original standalone projects, QA captures, recordings, credentials and dependencies stay outside the upload.

The server accepts Railway's PORT, listens on 0.0.0.0 in the container, and exposes `/healthz`. Docker runs as a non-root user. Configure the service health check to `/healthz`; the intended settings are recorded in `tools/railway-health.graphql`. Deprecated railway.json was omitted from the release. Production deployment identity and verification are recorded in `artifacts/final-evidence.md`.

Both the daytime and night scenes have independent route bundles, so one mode is active at a time. Missing assets return 404 instead of HTML. Debug scene hooks are available only with `?debug`; normal visitors see no test interface.

## Verification and provenance

For the 2026-10-02 rebuild, see [model-rebuild-evidence.md](artifacts/model-rebuild-evidence.md): 26 desktop/phone captures, complete input-driven and live-browser wins, final map/contact/camera checks, duplicate-image audit and exact publication status. The map pauses gameplay and sound until closed. Physical-phone testing remains outstanding; phone controls were verified through browser touch emulation.

The earlier integration suite uses local Chrome through Playwright, checks same-tab navigation, outgoing audio disposal, public routes, bite/kick behavior, demo switching, modal keyboard access, browser Back behavior and emulated touch navigation. Eight desktop/phone captures cover both title and active states of that earlier release. See `artifacts/final-evidence.md` for its historical results and deployment status. QA tooling additionally needs Playwright and pngjs; this device uses the Codex dependency runtime through NODE_PATH.

Relative building locations follow the supplied physical-model photos/video; visible facades follow the organized campus photos. Distances are compressed for gameplay. Unseen elevations, interiors and the night story remain interpretations. The site is an independent study, not an official or surveyed university reconstruction.

The original Refined_Tour and Haunted_Campus folders are preserved as source history. Future changes to the unified website belong in this Campus_Experience folder. Three.js and Vite are MIT-licensed; font licenses remain with their assets. CC0 environment/material sources are retained under tour/public/environment/SOURCES.md. The existing GBU shirt crest is retained unchanged.
