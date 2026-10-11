# Audio shutdown fix

The user requested that speaker noise stop after the game ends. The unified Campus_Experience is the active project; original standalone tour/game sources are preserved.

## Finding and change

The previous build stopped all sources and set its master gain to zero, but its native AudioContext remained `running` after victory. This was reproduced against the previous local production server: [baseline.json](audio-end-baseline/baseline.json). Its measured signal was already zero, so that observation establishes an audio-engine lifecycle gap, not a diagnosis of physical speaker noise.

The night audio owner now stops/disconnects sources, closes the native context and recording routes on victory, defeat, return to title and exit. Pause/mute suspend the context. Restart/resume create or resume output only during an active, enabled session. Generation guards invalidate delayed resumes, and stale end-screen sound callbacks cannot create a new audio context. Leaving window focus now pauses demos as well as manual play.

Changed product sources: `night/src/audio.js` and `night/src/main.js`. Day-tour code, gameplay rules, models, animation, visual settings and controls are retained.

## Verification

The updated production build passed. Its public-only release has 32 files / 8,449,247 bytes. The previous release is preserved in `artifacts/release-before-audio-shutdown/`.

All 21 focused local checks passed: [results.json](audio-end-local-2/results.json). The harness observes real browser AudioContext objects independently of game diagnostics, and requires exactly one running engine during play, suspended engines during pause/mute, and all engines closed after ending. Output RMS is zero after each ending. Checks include late callbacks, immediate start/quit, retry, cancelled exit, same-tab mode switching, actual navigation and tab close.

The unassisted live demo completed all four objectives in 131.6 simulation seconds, with two bites, ten kicks and three knockdowns. At the real victory transition, all native audio contexts were closed, all sources stopped, and output remained zero after a further two seconds. The ending capture is [demo-ended.png](audio-end-local-2/demo-ended.png). No runtime errors or missing assets occurred.

The first focused run encountered a test-only error because the ending modal correctly covers the sound button. The resilience check was changed to dispatch stale callbacks explicitly; no product change was needed for that test correction. Its failure record is preserved in `audio-end-local/`.

Physical speaker/driver noise was not measured; this verifies browser game output and audio-engine shutdown. Earlier visual/physics evidence remains valid for unchanged behavior; no visual redesign or frame-rate improvement is claimed.

## Deployment

Live at https://campus-production-ce74.up.railway.app/night/ . Deployment `5fd15912-415e-441e-b701-cf863dd9f1cc` reached SUCCESS at 2026-09-29T16:07:35.700Z (September 30 in Shanghai), after a delayed Railway build/rollout. Evidence: [deployment.json](audio-end-railway/deployment.json).

All six focused public browser checks passed: [results.json](audio-end-railway/results.json). Real audio played after Start; a fatal bite closed every native context; Retry restored audio; victory closed all output and stayed silent beyond scheduled sound tails. No runtime or asset errors occurred. All 31 public HTTP/asset checks passed with exact SHA-256 matches to the tested build: [http.json](audio-end-railway/http.json).

The local launcher at port 5190 also serves this updated build. The temporary verification server was stopped. Refresh any already-open game tab to load the fix; existing JavaScript in an open tab does not change when a deployment is published.
