# GBU Campus

**Instructor-produced teaching sample.** This project was produced by the course instructor as a sample for learning AI-assisted development. It is **not an official 3D tour of Great Bay University**, an official campus map, or a surveyed reconstruction. The night story is fictional.

- [Game source code](https://github.com/greenquark/gbu-campus)
- [Play the game](https://greenquark.github.io/world/)

Try **Take the guided visit** and **Explore on foot** by day; switch to **Haunted night** for **Begin the night** and **Watch demo**.

The 2026-10-05 crawling-limb revision added: articulated finger grips, uneven limb pulls, grounded contact, wet tissue, drag marks and staggered reattachment. [Play Haunted night](https://greenquark.github.io/world/night/) or [open the Day tour](https://greenquark.github.io/world/). Refresh an existing tab once. References, motion review and deployment checks: [crawling-limbs-evidence.md](artifacts/crawling-limbs-evidence.md). Earlier character provenance remains in [realistic-students-evidence.md](artifacts/realistic-students-evidence.md), and historical Railway publication evidence in [railway-model-evidence.md](artifacts/railway-model-evidence.md). These are historical QA records, not verification of the current Pages deployment.

One campus website with two modes: on GitHub Pages, **Day tour** opens at `/world/` and **Haunted night** at `/world/night/`. Local development uses `/` and `/night/` respectively. Use the shared header to switch in the same tab. Night pause and ending screens also offer **Return to day tour**. Switching modes ends the current visit or run and stops its audio.

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

On Windows, after the first build you can also double-click **Start-GBU-Campus.cmd**. It uses the existing Codex Node runtime when available, otherwise Node from PATH, and opens the game.

**5190 is the default local port.** Both `npm start` and the Windows launcher respect the `PORT` environment variable. To choose another port, set it before starting. For example, in PowerShell:

```powershell
$env:PORT = "5200"
.\Start-GBU-Campus.cmd
```

The launcher starts/checks the server on that port and opens http://127.0.0.1:5200/. Night mode is at http://127.0.0.1:5200/night/. You can also run `npm start` instead of the launcher after setting the same variable, then open the matching URL yourself. Use a whole-number port from 1 to 65535; if another app uses it, choose a different port. To return to the default in that PowerShell session, run `$env:PORT = $null`. This local port setting does not change the GitHub Pages URLs.

The original development checkout uses a junction to local Three.js/Vite dependencies; do not delete that node_modules junction recursively. Fresh checkouts create their own dependencies with `npm ci`.

## Mouse look (fork change)

This fork adds an optional mouse-look camera for players used to online-game controls. The change is local to the client: no new server endpoints, no new assets and no new dependencies.

- **Day tour:** open **Settings**, set **Mouse look** to *Mouse follow*, then click the scene to capture the pointer. Move the mouse to look and press **Esc** to release the cursor. Choosing *Drag to look* returns to the original drag look and `Q` / `E` turning.
- **Haunted night:** open the pause screen (**Esc** or the pause button) and set **Mouse look** the same way. The sensitivity slider sits next to it.
- **Sensitivity** (0.5–2) applies to both drag and mouse follow, so the same setting keeps working whichever mode is selected.
- The two look systems never run together. In follow mode the original pointer drag and the day tour's `Q` / `E` turning are suspended, while `W` `A` `S` `D` walking, `Shift` sprinting, the night game's arrow-key movement and every other action keep working. Switching back restores the original controls.
- Touch screens keep the original drag gestures: mouse follow needs a mouse or trackpad and the option is disabled for coarse pointers. A touch drag in follow mode still looks around.
- Pointer capture and held keys are released when the game pauses, opens the map or settings, loses focus, is hidden, changes mode, ends, or the page unloads.

Known limits: pressing `Esc` while the pointer is captured releases the cursor first, so a second `Esc` is what pauses the visit or the night. A browser that refuses pointer lock (document not focused, or the user just exited a lock) shows a short recovery message instead of failing silently. This fork's mouse look has been checked in desktop Chromium only; it has not been tested on a physical phone or with assistive pointer hardware.

Deployment: the original project publishes from a separate hosting repository that rewrites paths to `/world/`. Pushing this fork does not deploy it — a fork needs its own Pages workflow (or any static host) with a matching base path, and both `/` and `/night/` bundles must be built together with `npm run build`.

The Git repository includes `tour/`, `night/`, `shared/`, source assets, build/server tools and written evidence. Generated `dist/` and `release/`, dependencies, local `Old/` snapshots, screenshots, recordings and raw QA results are excluded. Evidence documents describe historical runs; their local capture paths are not included in this source repository.

## GitHub Pages hosting

Production hosting is **GitHub Pages**, at https://greenquark.github.io/world/; night mode is at https://greenquark.github.io/world/night/.

The [Pages workflow](https://github.com/greenquark/greenquark.github.io/blob/main/.github/workflows/pages.yml) lives in the [hosting repository](https://github.com/greenquark/greenquark.github.io), `greenquark/greenquark.github.io`. It checks out this game repository, adapts asset/navigation/build paths to the `/world/` prefix, installs dependencies with Node 22, builds both scenes and copies the static `dist/` output into `public/world/`. It uploads the assembled static site and deploys it to GitHub Pages.

To publish a source update, merge it into this game's `main`, then manually run that workflow in the hosting repository. The current workflow also runs on changes to the hosting repository's `main`; a commit to this game repository alone does not trigger it. Check the actual workflow run and the live day/night routes after publishing. The workflow is the authority for the current packaging steps; this README change does not itself certify a fresh deployment or playtest.

Pages serves the static build. The local `npm start` server and the `release/` Node/Docker package are not the Pages hosting payload. The older Railway server/health-check instructions and deployment evidence remain in Git history and the historical evidence documents; Railway is not the current hosting route.

Both daytime and night scenes have independent route bundles, so one mode is active at a time. Debug scene hooks are available only with `?debug`; normal visitors see no test interface.

## Verification and provenance

For the 2026-10-02 rebuild, see [model-rebuild-evidence.md](artifacts/model-rebuild-evidence.md): 26 desktop/phone captures, complete input-driven and live-browser wins, final map/contact/camera checks, duplicate-image audit and exact publication status. The map pauses gameplay and sound until closed. Physical-phone testing remains outstanding; phone controls were verified through browser touch emulation.

The earlier integration suite uses local Chrome through Playwright, checks same-tab navigation, outgoing audio disposal, public routes, bite/kick behavior, demo switching, modal keyboard access, browser Back behavior and emulated touch navigation. Eight desktop/phone captures cover both title and active states of that earlier release. See `artifacts/final-evidence.md` for its historical results and deployment status. QA tooling additionally needs Playwright and pngjs; this device uses the Codex dependency runtime through NODE_PATH.

Relative building locations follow the supplied physical-model photos/video; visible facades follow the organized campus photos. Distances are compressed for gameplay. Unseen elevations, interiors and the night story remain interpretations. The site is an independent study, not an official or surveyed university reconstruction.

The original Refined_Tour and Haunted_Campus folders are preserved as source history. Future changes to the unified website belong in this Campus_Experience folder. Three.js and Vite are MIT-licensed; font licenses remain with their assets. CC0 environment/material sources are retained under tour/public/environment/SOURCES.md. The existing GBU shirt crest is retained unchanged.
