# GBU Campus integration and deployment evidence

Date: 2026-09-29. Scope: combine the existing daytime campus tour and haunted night game into one website and deploy it to Railway.

Audio shutdown follow-up: [audio-shutdown-evidence.md](audio-shutdown-evidence.md) records the subsequent request, engine-closure fix, current release and its verification. The deployment and asset evidence below describe the original integrated release.

## Product and preserved behavior

One origin and shared GBU Campus header, with Day tour at `/` and Haunted night at `/night/`. Same-tab links unload the outgoing scene and stop its audio. Night pause and end screens return to the tour. Browser Back does not restart an audible night run. Independent route bundles load only the selected experience. Both original source projects remain unchanged.

The existing daytime guided walk, night objectives, zombie chase/bites, kicking/scattering/reassembly, touch input, and Watch demo are retained. This revision changes integration and lifecycle behavior; it does not claim a new complete gameplay balance review. The building remains an artistic interpretation of the supplied reference, with fictional interiors and additional buildings.

## Local verification

- Production Vite builds passed for both routes. Shared Three.js vendor bundles produce an advisory about chunk size; no build errors.
- Static server: 14 checks passed, including real 404 responses, directory redirects, HEAD, health check, MIME types, gzip negotiation and ETags, source/dotfile/traversal protections, and a Windows junction escape check.
- Browser: all 13 checks in [interaction-results.json](integration-1/interaction-results.json) passed on local Chrome with Intel UHD Graphics 620 hardware rendering. Checks cover real day movement, same-tab mode changes, one active canvas, absence of normal-route test hooks, an actual zombie bite and Space kick, keyboard return-link focus, demo audio teardown, Back, an ending-screen return link, phone width and touch switching, and missing assets/runtime errors.
- Eight declared screenshots cover desktop 1280x720 and emulated phone 390x844: day welcome/plaza and night title/active play. All passed nonblank canvas/error checks and were visually inspected for readable navigation, intact identity and unobstructed controls. The evidence manifest checker passed all nine declared artifacts (eight reports plus interaction results).
- Local launcher PowerShell syntax parsed successfully. The combined production server is available at http://127.0.0.1:5190/ while running; Start-GBU-Campus.cmd is the recovery launcher.

Harness decision: reuse the existing deterministic scene hooks and canvas inspector for the integration, with actual keyboard/touch interaction for behavior. A full new gameplay bot/animation pass was unnecessary because gameplay and animation code were retained. Prior standalone demo evidence is not presented as a new public deployment test. No physical phone or subjective listening session was performed.

## Deployment

Public site: https://campus-production-ce74.up.railway.app

- Project: gbu-campus (`073342ca-86c7-4eb5-b801-4ff3006298a1`).
- Service: campus (`51c1c364-8b24-4a82-ae8d-36ad72ca0eea`).
- Environment: production (`be2e5c60-a4f0-499d-802e-8c0f4a2ce57e`).
- Container: Node 24 Alpine, unprivileged node user, dependency-free static server, PORT 5190, `/healthz`, one replica, at most three failure restarts.
- Upload: only `release/`, 32 files, 8,448,940 bytes. The SHA-256 inventory is [release-files.json](release-files.json). It excludes course materials, source projects, screenshots, recordings, credentials and node_modules.
- Initial deployment `4b066a08-59e7-4898-8f13-168789f4b70a` waited in builder scheduling. Its container listened on Railway's initial port 8080 while the domain targeted 5190. The replacement uses explicit PORT=5190 and reached SUCCESS at 2026-09-29T15:14:23.825Z. Final deployment: `2178e792-a9a0-48f7-82af-5ccc7ef95d84`; its running socket is 5190 and diagnosis is null. Evidence: [railway-production.json](railway-production.json).
- Public HTTP verification passed 31 checks at 2026-09-29T15:16:13.174Z: health, both mode routes, correct redirect, all browser-consumed release assets matching local SHA-256 values, and genuine missing/private-file 404s. Evidence: [public-http.json](public-http.json).

Public browser verification passed all 13 integration checks in run `railway-2`: [interaction-results.json](railway-2/interaction-results.json). Eight public captures passed canvas checks and were separately visually inspected (desktop and emulated phone, day welcome/plaza and night title/active play). The shared mode navigation fits both sizes, title copy is readable, and gameplay controls remain visible. Runtime errors and missing asset requests: zero. The public byte comparisons establish that this is the locally tested release.

The first public run passed day movement, day-to-night switching and audio closure, then failed a kick message assertion that sampled after a fixed 500ms delay. No runtime or asset errors were recorded. Changing that test to await the actual feedback with a bounded five-second timeout resolved the timing sensitivity; the actual bite and Space kick then passed. No gameplay code or deployed build changed for the retry. The failed run remains recorded under `railway-1`; the current manifest declares only the complete `railway-2` capture set.

Release result: live and verified on Railway. No unresolved integration defect was found. Physical mobile hardware, sustained production load, and long-term Railway availability were not tested. Existing adaptive resolution and Smooth mode were retained; no new claim of a measured frame-rate improvement is made.
