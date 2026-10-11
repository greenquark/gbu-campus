# First-person kick asset and campus UI

## Source and asset

- Created with the built-in imagegen tool using the imagegen skill; no CLI/API fallback.
- Source: C:\Users\JiantaoPan\.codex\generated_images\01a0f85c-8ae0-7f80-b424-eded600c63a9\exec-8c30b18e-2b4a-486b-a68c-7add6640166d.png
- Project asset: night/public/player-kick.png
- SHA-256: 72c2f45bb149b4739a47ae42b88a4b3a5a8d8da85cb091697dc51dda03b995c3
- 1254 x 1254 PNG, RGBA. Requested transparent_background=true.
- Pixel inspection: alpha extrema 0..255; 1,120,424 fully transparent pixels of 1,572,516 (71.25%); 451,778 partial-alpha pixels and 314 fully opaque pixels. Interior sample alpha is 253/255, so the soft transparency was preserved exactly as generated. Dominant foreground alpha counts: 253=396,379; 254=21,557; 252=15,751.
- Copied unchanged into the workspace. No background-removal approximation or programmatic image edit.
- Visual inspection: one right shoe and trouser leg, photographic mesh fabric, laces, rubber sole and folded woven trousers. Foot points upward/left; lower leg exits bottom/right. No logo, scenery or opaque rectangular background.

## Generation prompt

Use case: photorealistic-natural. Asset type: transparent first-person video-game kick sprite. Create an isolated, photorealistic adult human RIGHT lower leg wearing charcoal woven trousers and a grey-blue unbranded running shoe. First-person camera looks down the player's own extended leg: trouser leg enters from the BOTTOM RIGHT edge, extends diagonally toward screen centre, and the sneaker toe points UP and slightly LEFT toward the top centre. The shoe upper, laces, mesh fabric, edge of rubber outsole and naturally folded trouser fabric are clearly visible in a believable foreshortened side/top view. The foot is extended in a forward kick. Exactly ONE shoe and ONE continuous attached lower leg; no disconnected anatomy. Composition: square transparent canvas, foot at approximately x=42%, y=28%, trouser cuff near x=66%, y=63%, wide trouser leg cut by bottom-right corner. Natural low-contrast cool neutral night-compatible lighting with soft highlights, rich material detail, photographic texture. Keep shoe edges clean and sharp, no motion blur. Scene/backdrop: truly transparent alpha channel everywhere except the leg and shoe. No checkerboard artwork, no floor, no shadow outside the cutout, no scenery, no person/torso/hands/second leg, no text, no logo, no watermark. Not illustration, not vector, not low-poly, not a handdrawn shape.

## Integration

night/src/zombie-visuals.js loads the cutout as a camera-attached square plane with alpha blending, alphaTest 0.03 (suppresses negligible edge specks), disabled depth testing/writes, and unmodified color texture. The cutout moves from bottom-right toward the lower aiming area. Its projected size adapts to camera aspect ratio.

The .78-second kick duration and .28 / .40-second extension/hold boundaries are retained, including the original smooth retract envelope and impact recoil. No simulation hitbox, cooldown or damage code was changed. The zombie rigs, instancing, disassembly and reassembly are unchanged. One draw call replaces the prior six boot meshes. The new texture, geometry and material are disposed with the existing lifecycle.

Diagnostics retain visible, extension, screenX, screenY and widthFraction, and add asset and assetLoaded. Shader/photo color is not affected by changing world lights.

## Campus UI

- UI follows the threejs-game-ui-designer skill/reference hierarchy.
- The map reads CAMPUS from shared/campus-layout.js for buildings, walks, water-court station, safe lanterns, sports track, memory markers, gate, live player/ghost and navigation target.
- Wide model-relative plan; labels say MODEL FRONT / MODEL REAR. No north direction or surveyed distance claim.
- Gameplay identifiers library / greenhouse / observatory / residence are retained. Visible places are West teaching block / Water court / Sports hall / Dormitory arcade.
- Full MEMORY_TITLES populate the HUD and the map legend. Map markers numbered 1..4 match the legend.
- Optional navigation {label,distance,target} appears as a destination with game units. Optional track {active,next,timeLeft,total,done} displays current checkpoint and seconds remaining; eight seconds or less uses the danger color.
- Existing touch intent handling, keyboard controls, modal focus management, audio buttons and all action names remain intact.

## Verification scope

- PNG alpha and source/project SHA-256 were inspected.
- node --check passed for night/src/ui.js and night/src/zombie-visuals.js.
- Historical desktop and phone kick screenshots were inspected as the before-state reference.
- Current integrated desktop/phone map, track and kick screenshots, gameplay timing, loading and audio lifecycle are covered by the lead's consolidated verification; this file does not claim those runs before their evidence exists.

## Integrated capture review and contrast repair

Inspected artifacts/model-rebuild-3 desktop-active-play, desktop-library, mobile-active-play, mobile-track and mobile-kick-raised PNGs. The photographic kick is visible in the lower centre/right on the phone, with its shoe directed into the target; no rectangular image background is visible. Track state shows checkpoint 1 / 4 and 28s, matching its JSON state.

Found that desktop survival, combat and keyboard hints lost contrast over pale paving. The phone survival/combat backplates already worked. Added compact translucent backplates to the desktop clusters and a content-width keyboard hint strip. Added a compact gradient behind the objective block at every size because its small text crossed pale facades in the track capture; its position, text and footprint remain unchanged. The bell status also now has a small dark backing, addressing the same pale-ground contrast issue on phones. Checked map state/coordinate code without launching a competing browser: player, ghost and destination share mapPoint; marker IDs and live memory state are intact. Changed CSS awaits the lead's final recapture.
