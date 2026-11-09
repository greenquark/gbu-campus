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

### 1. Check your environment and working directory

Install **Node 22.12 or newer** (with npm). Open a terminal in your cloned repository, not in `tour/` or `night/`. The repository root contains `package.json`, `package-lock.json`, `server.mjs`, `tour/` and `night/`.

```sh
# If the terminal is in the parent directory, enter your clone first.
# Replace gbu-campus with the actual folder name if different.
cd gbu-campus
node --version
npm --version
```

Skip `cd gbu-campus` if already in the repository root. Check the full Node version: 22.11 does not meet the requirement, while 22.12 or a newer supported release does. If either version command is not found, install Node or fix your PATH, then reopen the terminal before continuing.

### 2. Install, build and start

Run each command separately from the repository root. If one fails, read its error and fix that step before continuing.

```sh
npm ci
npm run build
npm start
```

| Command | What it does and why it is needed |
|---|---|
| `npm ci` | Installs the dependency versions recorded in `package-lock.json`, including Three.js and Vite. It replaces the checkout's existing `node_modules/`; do not run it against the original development junction mentioned below. A fresh installation normally needs network access. Preserve the lockfile rather than deleting it to bypass an error. |
| `npm run build` | Runs `tools/build.mjs`. Vite builds both `tour/` and `night/`, and the script copies their required local assets. The browser-ready output is `dist/` for day and `dist/night/` for night. It also prepares generated release files; these are not your source files. |
| `npm start` | Runs `server.mjs`, which loads the completed `dist/` into memory and serves it over HTTP. It requires both modes to have been built; it does not compile source files or start a hot-reloading development server. |

On successful startup, the terminal prints `Campus experience is ready.` Keep this terminal running while using the site. The command remaining active is normal: it is waiting for browser requests. Press **Ctrl+C** in that terminal to stop it.

### 3. Open the matching address

With the default port, open these URLs in a browser on the **same machine as the server**:

- Day tour: http://127.0.0.1:5190/
- Haunted night: http://127.0.0.1:5190/night/

Do not double-click source HTML files: the application needs the built JavaScript/assets and HTTP paths. The root build packages both modes together. After a successful installation and build, the completed local site works without internet access; fonts, geometry, materials and sound generation are local.

**Remote workspace or container:** `127.0.0.1` always refers to the machine running the browser, not automatically to your workspace. If the server runs remotely, use your workspace platform's private/authenticated port forwarding for **5190** and open its generated URL. For night, use the forwarded site's `/night/` route. If the platform uses a path prefix, follow its routing instructions. If you set another `PORT`, forward that port instead. Running the server in a remote workspace does not start a server on your own laptop, and forwarding it does not publish an update to GitHub Pages.

### 4. View source changes

There is no automatic rebuild or hot reload in this workflow. After editing JavaScript, HTML or CSS:

1. Stop the running server with **Ctrl+C**.
2. Run `npm run build` and check that it succeeds for both modes.
3. Run `npm start` again, then refresh the browser page.

The restart matters because `server.mjs` reads the build into memory at startup; rebuilding on disk alone does not replace that running server's copy. A README-only edit does not change the game, so it does not itself require rebuilding. Re-run `npm ci` when dependencies/lockfile change or dependencies are missing, rather than for every text or style edit.

### 5. Troubleshoot one step at a time

| Symptom | What to check |
|---|---|
| npm cannot find `package.json` | Confirm the terminal is in the repository root, not its parent or a scene subfolder. |
| Dependency download fails | Check network/proxy/registry settings and preserve the exact error. Fix installation before building; do not expose proxy credentials in shared logs. |
| Startup fails | Confirm `npm run build` completed for both modes. The server requires `dist/index.html` and `dist/night/index.html`. Also check whether the chosen port is already occupied; see the port instructions below. |
| Browser says connection refused | Keep the server terminal running and check the URL/port. If it is a remote workspace, check forwarding; your laptop's loopback address is not the workspace's. |
| Source edits do not appear | Rebuild, restart the server and refresh as described above. Confirm you opened the local/forwarded site, not the instructor's GitHub Pages site. |

If still blocked, save the failed command, Node version and error text (without secrets) when asking for help. Successful startup or an HTTP response alone does not prove that all controls and scenes work; check them in the browser.

On Windows, after the first build you can also double-click **Start-GBU-Campus.cmd**. It uses the existing Codex Node runtime when available, otherwise Node from PATH, and opens the game.

**5190 is the default local port.** Both `npm start` and the Windows launcher respect the `PORT` environment variable. To choose another port, set it before starting. For example, in PowerShell:

```powershell
$env:PORT = "5200"
.\Start-GBU-Campus.cmd
```

The launcher starts/checks the server on that port and opens http://127.0.0.1:5200/. Night mode is at http://127.0.0.1:5200/night/. You can also run `npm start` instead of the launcher after setting the same variable, then open the matching URL yourself. Use a whole-number port from 1 to 65535; if another app uses it, choose a different port. To return to the default in that PowerShell session, run `$env:PORT = $null`. This local port setting does not change the GitHub Pages URLs.

The original development checkout uses a junction to local Three.js/Vite dependencies; do not delete that node_modules junction recursively. Fresh checkouts create their own dependencies with `npm ci`.

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
