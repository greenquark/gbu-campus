# Realistic zombie student albedo assets — 2026-10-03

The requested visual revision uses original photographic albedos on new custom-authored anatomical meshes. This asset pass supplies two original adult East Asian infected-student faces and one four-material atlas. It does not supply a generated or scanned 3D human model. The lead owns geometry integration, animation, in-game visual checks and deployment.

## Runtime files

All runtime paths are relative to `night/public/`. Each file is 1254×1254, opaque sRGB color. Original PNGs are preserved beside this report and excluded from the runtime directory. JPEG derivatives use Windows System.Drawing JPEG encoding at quality 94, with no resize, crop or content change. Total transfer size: 1,359,965 bytes.

| File | Bytes | SHA-256 |
|---|---:|---|
| `characters/student-zombie-face-v1.jpg` | 339781 | `9C3ACEB881589860B0A643A1FDBBB4C798EDB1E15A600B30A25704732E81A1AA` |
| `characters/student-zombie-face-female-v1.jpg` | 344774 | `E990D3EE5F5424E82591BA9136520F6A31D66D775321A779055A92EC9323B634` |
| `characters/student-zombie-materials-v1.jpg` | 675410 | `8B61CDD3DA4C36A5B21C923D4B6AB01B6A37C58C7618F45C7D860F6FE500E25E` |

## Provenance and method

The built-in `image_gen` tool created all three source images from text prompts. No actor photograph, movie still, or third-party texture was copied. The prompt art direction named *Train to Busan* and *28 Days Later* as references for tactile practical infected-person makeup, requesting original fictional adult identities, plausible anatomy, small cloudy eyes, pallor, pores, veins, perspiration, mild abrasions and no extreme gore. No GBU logo was generated; the authentic existing crest remains a separate integration overlay.

The director's packaged profile-aware credential probe completed after adding `/usr/bin:/bin` inside Git Bash and reported `TRIPO_API_KEY=MISSING`, `GEMINI_API_KEY=MISSING`, and `ELEVENLABS_API_KEY=MISSING`. Separate Windows process/user/machine environment checks agreed. No paid 3D task was submitted; there are no provider task IDs, model versions, skeletons, animation clips or generated-model polygon counts to report. The documented fallback is generated albedo plus custom-authored geometry. Credentials were never printed.

Original generation files:

- Male: `C:/Users/JiantaoPan/.codex/generated_images/01a0fda2-f000-72f2-b4f8-b9819f4eca40/exec-a9fcbdfc-6d59-451e-8ab6-9d84b3ca2337.png`
- Materials: `C:/Users/JiantaoPan/.codex/generated_images/01a0fda2-f000-72f2-b4f8-b9819f4eca40/exec-bcc809db-bb38-42f6-8c0f-b081158bf0cf.png`
- Female: `C:/Users/JiantaoPan/.codex/generated_images/01a0fda2-f000-72f2-b4f8-b9819f4eca40/exec-363538e5-fc0f-4017-af60-5e4313d1f215.png`

## UV and material contract

`landmarks.json` records visually estimated normalized coordinates with **top-left image origin**. Convert y to `1-y` for the usual Three.js UV convention with TextureLoader defaults. These are projection aids, not measured facial landmarks. The male and female photos differ in eye/mouth height; use their respective coordinates.

The atlas has exact half-width and half-height divisions at pixel 627. Top-left is dirty ivory cotton jersey, top-right is charcoal trouser twill, bottom-left is mottled human skin, bottom-right is dark hair strands. Sample with a 2-pixel inset from the quadrant edges to avoid interpolation bleeding. The generated swatches were requested to tile, but edge continuity was not mathematically guaranteed or tested. Do not describe them as seamless measured PBR scans. Atlas hair is vertical and may require per-part UV rotation.

Use the face image only on a sculpted front head, with a carefully matched jaw/temple contour, and use the material atlas or separate neutral skin material on the back. The neutral face-image backdrop is not transparent and must not map onto visible cheeks. The photos include scalp hair and ears, so choose UV cropping with the geometry rather than layering duplicate facial features. There are no normal, roughness or displacement texture maps in this delivery; roughness and physical shape belong to integration.

## Inspection and limits

All three generated PNGs were visually inspected at generation. The female and atlas JPEG runtime encodings were opened and visually inspected after conversion; photographic detail and atlas boundaries were preserved. File dimensions, byte counts and hashes were checked. The male JPEG used the same encoding process and dimensions; the male source PNG was visually inspected.

The faces show realistic skin texture, lips, nostrils, small eyes and original identities, with no Lego-like block forms in the image itself. Some diffuse shading remains baked in, as expected for image-generated albedo. Final realism depends on the head silhouette, UV fit, garment folds, lighting and motion. No browser was opened or GPU capture run by this asset worker. No claim about final in-game motion or skin deformation is made in this report.

Existing shoe art was neither changed nor moved.
