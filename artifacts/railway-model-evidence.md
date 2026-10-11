# Model-based campus rebuild: Railway deployment

Published and verified on 2026-10-02. User request: deploy the completed rebuild to Railway.

Public game: https://campus-production-ce74.up.railway.app/night/

Day tour: https://campus-production-ce74.up.railway.app/

## Deployment

- Existing project `gbu-campus`: `073342ca-86c7-4eb5-b801-4ff3006298a1`.
- Existing service `campus`: `51c1c364-8b24-4a82-ae8d-36ad72ca0eea`.
- Existing production environment: `be2e5c60-a4f0-499d-802e-8c0f4a2ce57e`.
- Deployment `800e2671-24eb-4aed-81e3-568d7babe2f9`, created at `2026-10-02T02:39:25.163Z`, status **SUCCESS**. Railway record: `railway-model-deployments.json`.
- Only `release/` was uploaded using an explicit project, service, environment and `--path-as-root`. The package contains 26 files totaling 2,859,571 bytes (2.73 MiB). Its exact file set and all SHA-256 hashes were checked against the tested manifest before upload; the deployment snapshot is `railway-model-release-files.json`.
- Existing domain and production service were retained. The upload excludes source, course materials, reference photos/videos, prior versions, QA output, node_modules and credentials. No gameplay code was changed for deployment.

The expired CLI login required renewal. Automatic approval review initially rejected the requested workspace/project-admin and SSH-key scopes; the user explicitly approved those permissions. The normal browser authorization then succeeded, but the restricted execution environment stalled/blocked authentication requests. The CLI login completed with approved network access outside that restriction. No credential values are recorded in this evidence or included in the upload.

Command, run from `release/` using the installed Railway CLI 5.63.1:

```text
railway up . --path-as-root --project 073342ca-86c7-4eb5-b801-4ff3006298a1 --service 51c1c364-8b24-4a82-ae8d-36ad72ca0eea --environment be2e5c60-a4f0-499d-802e-8c0f4a2ce57e --detach --message "Model-based campus rebuild: new architecture, routes, challenges and realistic kick"
```

## Public verification

- `railway-model-http.json`: **26 HTTP and asset-integrity checks passed**, verified at `2026-10-02T02:41:31.055Z`. Health, both modes, redirect, every browser-consumed release file, content types and genuine missing/private-file 404s passed. Public bytes match the locally tested release.
- `railway-model-20261002/interaction-results.json`: **13 browser checks passed**. Real keyboard movement; same-tab day/night navigation; one active scene; audio shutdown when leaving either mode; no test hooks on normal URLs; actual bite and scattering kick; pause-screen keyboard access and day return; demo exit; safe browser Back; ending-screen return; phone layout and touch mode switching. Runtime errors: zero. Missing asset requests: zero.
- Eight declared public captures cover desktop 1280×720 and emulated phone 390×844, each with day welcome/plaza and night title/active play. All eight passed canvas/error checks and were visually inspected. Navigation and controls fit; architectural content and artwork match the rebuild. Distant mobile day-overview detail remains softened by the existing fog; the walking view and UI remain legible.
- The evidence manifest checker passed all nine artifacts in `artifacts/evidence.json` (eight reports plus interaction results). The former integration manifest is preserved as `evidence-before-model-deployment.json`.

```text
node tools/verify-public.mjs https://campus-production-ce74.up.railway.app artifacts/railway-model-http.json
node tools/verify-campus.mjs https://campus-production-ce74.up.railway.app railway-model-20261002
python -X utf8 <threejs-game-director>/scripts/check_evidence.py . --manifest artifacts/evidence.json
```

The complete 150.3-second gameplay win, expanded 26-view inspection, final map/contact checks and source-reference audit remain documented in `model-rebuild-evidence.md`. They were performed locally against the same release bytes; the public deployment checks above do not claim a second full-length public completion run. Physical-phone hardware, sustained production load and long-term hosting availability were not tested.

Result: the rebuilt campus is live and verified. No unresolved deployment blocker remains.
