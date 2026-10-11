# Student anatomy implementation evidence

Created 2026-10-03 for the requested realistic GBU zombie student revision.

## Ownership and source boundary

- New runtime module: `night/src/student-anatomy.js`.
- Read the active `night/src/zombie-visuals.js` and source-protection protocol before authoring this new module.
- This worker did not change combat, simulation, campus, deployment, or the existing animation controller.
- Original image assets were created by the separate asset worker. Runtime inputs are `student-zombie-face-v1.jpg`, `student-zombie-face-female-v1.jpg`, and `student-zombie-materials-v1.jpg` in `night/public/characters/`.
- The male image was visually inspected. Female landmark coordinates were supplied by the image worker after inspection. The complete live character still requires root visual QA under the real gameplay lights.

## Construction

The continuous sculpted head uses authored cross sections and displacement for the nasal bridge, nose tip, orbital hollows, brows, cheeks, philtrum, lips, and jaw. A front projection maps the observed image landmarks onto this lit surface. Female projection uses separate vertical landmark remapping. No separate eyeball spheres, glowing eyes, projecting teeth, or nose primitives remain.

Adult bodies use tapered arm/leg cross sections, overlapping hidden joints, cloth contours and creases, a shaped trouser seat, tapered forearms, five tapered curved fingers per hand, a shaped shoe upper and outsole, and crossed laces. Hair is an irregular fitted surface with 22 thin curved locks, rather than a spherical dome. Cloth, skin, and hair sample the generated atlas. Shared grayscale microtextures drive roughness and fine bump.

## Integration contract

`createStudentKit({baseUrl,onAsset,isDisposed})` returns `geometries`, `materials`, `ready`, `assetStatus`, and `dispose`. `ready` resolves after all three essential JPEGs load and rejects on load failure. `onAsset(name,boolean)` reports `face`, `faceFemale`, and `cloth`. The texture base URL supports empty, root-relative, and trailing-slash paths.

The root merges the dictionaries into its instance batches. It owns geometry/material disposal. `kit.dispose()` owns the shared textures only; call it when the scene is destroyed.

`buildStudent({index,part,joint})` returns `rig`, `hips`, `torso`, `head`, the established arm/leg joint arrays, `height`, `proportions`, `pieceCenters`, and `crest`.

- Coordinates are metres, Y up, forward +Z.
- Hip height: 0.93; torso pivot: hip +0.255; head pivot: torso +0.34.
- Shoulder pivots: torso (+/-0.213, +0.255, -0.001).
- Upper arm pivot length: 0.327; forearm pivot length: 0.267.
- Thigh length: 0.435; shin length: 0.425; ankle floor height: 0.070.
- GBU crest recommendation: torso position (0,0.086,0.133), scale (0.156,0.151,1). The root retains its authentic GBU crest texture.
- Detached-piece centers are available in `pieceCenters`; no exposed gore is authored.

## Verification performed

- `node --check src/student-anatomy.js`: passed.
- CPU construction test with texture loader stub: all geometry attributes are finite; materials/geometry references resolve; expected asset URLs and readiness flags resolve.
- Base adult neutral bounds: X [-0.3051,0.3054], Y [-0.0010,1.8470], Z [-0.1253,0.2120]. The sole bottom is within 1 mm of the floor.
- 14,984 rendered triangles/student; 89,904 for six.
- 27 rendered anatomical parts/student. Male uses 17 geometry/material roles; both face variants add one shared role (18 total), before the root crest/shadow/seam effects.
- Sampled front face, front shirt, and shoe-upper normals point outwards.
- No browser was launched by this worker, avoiding a competing GPU session. Root is responsible for active gameplay, mobile performance, visual closeups, animation/contact checks, and deployment verification.

## Revision after first live review

Inspected all four root screenshots in `students-preview-1`: portrait, profile, rear, and lineup. They showed raised rounded sleeves, a narrow long neck, a conspicuous rear waist intersection, a head texture seam, and coarse fabric weave. The second revision:

- Pulls shoulder pivots inward/down to (+/-0.188,0.231,-0.001) and uses narrower sleeves that overlap the torso.
- Lengthens and flares the shirt hem, including forward depth allowance for the stooped spine, so the shirt covers the trouser seat.
- Lowers the head pivot from +0.340 to +0.313, widens the head 10%, deepens the back of the cranium, and softens the nose/mouth projection and lower jaw.
- Uses an irregular nape hairline.
- Gives face, neck, and back of head the same per-student tint. A material blend joins face edge pixels to the exact skin-atlas edge; front/back seam normals are explicitly averaged. Measured seam-normal difference is zero.
- Repeats cotton 3 times and twill 2.5 times within each atlas quadrant through the existing Three.js r180 map fragment; no added draw calls or texture assets. The custom shaders carry distinct program-cache keys.
- Applies a restrained shared cool tint to face and skin, with darker hair and less creamy clothing.

Second-revision CPU checks passed: 14,984 triangles/student unchanged, finite attributes, valid generated shader snippets/skin uniform, and base neutral bounds X [-0.2620,0.2620], Y [-0.0010,1.8200], Z [-0.1290,0.2120]. These are code/geometry checks; root must confirm GPU compilation and the second live visual pass.

## Focused final correction

Inspected the second live profile and lineup. Corrected the remaining side-waist trouser intersection by increasing the shirt radius to 0.197–0.200 m through the lower waist, with additional front depth. Corrected dotted vertical trouser lines by replacing automatic derivatives of wrapped atlas UVs with `textureGrad` and derivatives of the original unwrapped UVs. This prevents a repeat boundary from selecting an artificially coarse mip and sampling pale neighbouring atlas quadrants. Three.js r180 uses WebGL2; the shader cache key was advanced for this change. `node --check` passed. Root must verify these final two visual corrections and GPU compilation in the final gameplay pass.
