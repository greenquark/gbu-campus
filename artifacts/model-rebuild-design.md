# Model-based campus rebuild

The player crosses a recognisable GBU campus after dark, recovering four memories while avoiding the Listener and the missing students. Recoveries restore resources; lantern pools offer recovery; kicks and decoy bells create room to escape. Losing preserves recovered memories and permits immediate retry.

## Sources and limits

Relative layout: materials and inputs/Model/IMG_5355.JPEG, IMG_5354.MOV and IMG_4240–4242 views. Facades: curved building IMG_5212, IMG_5213, IMG_5216–5217; louvered teaching blocks IMG_5209–5210/5221; sports hall IMG_5200/5208/4037–4038; balcony towers IMG_4071–4072; dormitory IMG_5199. Left/right/front/back are model-relative. Dimensions are compressed for play; unseen interiors and supernatural story remain invented. No claim of surveyed orientation or real room functions.

## Core loop

Walk or sprint between model-matched landmarks, solve each location's distinct memory challenge, manage torch and blood, kick or distract pursuing students, recover at lanterns, then return to the entry gate. The first student can be encountered within the first 15 seconds. A better player uses safe route junctions and saves battery; risky shortcuts across open lawns expose them to pursuit.

## Layout and encounter plan

shared/campus-layout.js controls both editions. Start at the flag plaza beside the curved building's right tip. The garden/water court is west of the plaza, teaching block further west, towers at the far left. Sports hall and blue track are east; orange-recessed dormitories sit behind them. The long arcade forms a rear route. Pools and buildings block movement; doors and undercrofts stay open. Challenges: torch reflection at water court; stand still with light off in west corridor; run four track checkpoints then restore the sports memory; replay a three-note call at the dorm arcade. Four can be completed in any order. The map and Watch demo follow the same actual geometry.

## Art and integration

White layered horizontal cladding, dark glass, structural piers and bridges, palm-lined lawns, blue track, orange dorm recesses. Procedural architectural geometry is traced from actual facade features to preserve footprint/collision accuracy. A newly generated photorealistic trouser leg and running shoe replaces the prior low-detail kick mesh. Retain student zombie rigs, disassembly, touch controls and verified audio shutdown.

## Ownership / checks

Lead: layout contract, gameplay, navigation/demo, day tour, tests, duplicate removal and release. World worker: shared/campus-world.js and world wrappers. UI/asset worker: night UI/index/style and zombie-visuals kick asset. Lead consolidates real-input progression, path reachability, fail/retry, desktop/phone captures, loading/network errors and audio stop checks.
