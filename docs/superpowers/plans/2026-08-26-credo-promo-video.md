# Credo 75-Second Promotional Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify a 75-second 1920×1080 HyperFrames promotional video for Credo with a replaceable 35-second Playground demo slot, complete English VO script, demo recording guide, overlay, and rendered MP4.

**Architecture:** The video lives in an isolated HyperFrames project at `videos/credo-proof-becomes-ownership/`. A durable brief drives capture and design tokens; the storyboard and locked script define exact narrative timing; independent frame compositions are assembled into one index, with the demo placeholder and overlay kept separate so user footage can be swapped without rebuilding the intro or close.

**Tech Stack:** HyperFrames 0.8.15+, HTML/CSS/JavaScript compositions, GSAP/seek-safe HyperFrames animation runtime, Markdown storyboard/script artifacts, HeyGen media catalog when authenticated, local project assets, Chromium-based snapshot/render pipeline.

---

## File Map

- `videos/credo-proof-becomes-ownership/BRIEF.md` — confirmed purpose, audience, runtime, concept, and constraints.
- `videos/credo-proof-becomes-ownership/hyperframes.json` — project and render configuration.
- `videos/credo-proof-becomes-ownership/capture/` — captured Credo pages, tokens, and asset inventory.
- `videos/credo-proof-becomes-ownership/frame.md` — immutable visual-system source for every frame.
- `videos/credo-proof-becomes-ownership/STORYBOARD.md` — frame order, durations, transitions, assets, and time-coded visual direction.
- `videos/credo-proof-becomes-ownership/SCRIPT.md` — locked English narration with pronunciation and delivery guidance.
- `videos/credo-proof-becomes-ownership/DEMO-RECORDING-GUIDE.md` — user-facing capture and replacement instructions.
- `videos/credo-proof-becomes-ownership/compositions/frames/*.html` — one bounded visual composition per narrative frame.
- `videos/credo-proof-becomes-ownership/compositions/demo-overlay.html` — transparent overlay for the user's Playground footage.
- `videos/credo-proof-becomes-ownership/index.html` — assembled 75-second master composition.
- `videos/credo-proof-becomes-ownership/renders/credo-promo-75s.mp4` — rendered master with placeholder.
- `videos/credo-proof-becomes-ownership/renders/demo-overlay.webm` — overlay with alpha when supported, otherwise chroma-safe fallback.
- `videos/credo-proof-becomes-ownership/snapshots/contact-sheet.jpg` — visual verification evidence.

### Task 1: Initialize and Lock the Brief

**Files:**
- Create: `videos/credo-proof-becomes-ownership/hyperframes.json`
- Create: `videos/credo-proof-becomes-ownership/BRIEF.md`

- [ ] **Step 1: Initialize the video project**

Run from the repository root:

```powershell
npx hyperframes init "videos/credo-proof-becomes-ownership" --non-interactive --example=blank --skill=product-launch-video
```

Expected: exit code `0` and `videos/credo-proof-becomes-ownership/hyperframes.json` exists.

- [ ] **Step 2: Write the confirmed brief**

Create `BRIEF.md` with this locked frontmatter and intent:

```markdown
---
workflow: product-launch-video
flow: automation
storyboard: no
message: "Official USDC stays final on Ethereum, the RWA stays on Creditcoin, and only cryptographic proof crosses chains"
destination: youtube
aspect: 1920x1080
language: en
audience: "BUIDL CTC judges, protocol builders, and RWA teams"
length: 75s
angle: "Proof becomes ownership"
---

## Intent

Create a controlled, premium protocol launch video that markets Credo through verifiable mechanics and evidence. The video must reserve 00:20–00:55 for a user-recorded Playground demonstration while narration continues.

## Assets

- `public/brands/LOGO.png` — Credo mark for reveal and closing sting.
- `public/brands/creditcoin.png` — Creditcoin identity in the settlement zone.
- `public/brands/ethereum.svg` — Ethereum identity in the payment zone.

## Customizations

- A 35-second replaceable demo placeholder plus a separate transparent/chroma-safe overlay.
- Minimal electronic music and restrained verification SFX, mixed for independently generated VO.
- English VO script with timecodes, pronunciation notes, and demo cues; do not require final TTS.

## Notes

- Guided Playground actions are simulated and must not be described as submitting funds.
- Live evidence is testnet-only. Do not claim mainnet availability or atomic two-chain settlement.
- The worker discovers, Attestcoin proves, and the contract decides.
```

- [ ] **Step 3: Record reusable run preferences**

Run the media preference script once for each supported preference:

```powershell
node "C:\Users\HP\.agents\skills\media-use\scripts\prefs.mjs" record --hyperframes . --key destination --value youtube
node "C:\Users\HP\.agents\skills\media-use\scripts\prefs.mjs" record --hyperframes . --key aspect --value 1920x1080
node "C:\Users\HP\.agents\skills\media-use\scripts\prefs.mjs" record --hyperframes . --key language --value en
node "C:\Users\HP\.agents\skills\media-use\scripts\prefs.mjs" record --hyperframes . --key flow --value automation
node "C:\Users\HP\.agents\skills\media-use\scripts\prefs.mjs" record --hyperframes . --key storyboard --value no
```

Working directory: `videos/credo-proof-becomes-ownership`.

Expected: every command records one value without rejecting the key.

- [ ] **Step 4: Inspect authentication without treating signed-out as a failure**

```powershell
npx hyperframes auth status
```

Expected: signed-in provider details or the documented signed-out/offline guidance. Continue locally if signed out because final VO is user-generated.

- [ ] **Step 5: Commit setup artifacts**

```powershell
git add videos/credo-proof-becomes-ownership/hyperframes.json videos/credo-proof-becomes-ownership/BRIEF.md
git commit -m "feat(video): initialize Credo promo brief"
```

### Task 2: Capture Brand and Product Evidence

**Files:**
- Create: `videos/credo-proof-becomes-ownership/capture/**`
- Create: `videos/credo-proof-becomes-ownership/capture/extracted/tokens.json`
- Create: `videos/credo-proof-becomes-ownership/capture/extracted/asset-descriptions.md`

- [ ] **Step 1: Capture the live landing page**

```powershell
npx hyperframes capture "https://credo.becoder.xyz" -o ./capture --json
```

Working directory: `videos/credo-proof-becomes-ownership`.

Expected: JSON reports `ok: true`, no `capture/BLOCKED.md`, and required extracted files exist.

- [ ] **Step 2: Verify the capture gate**

```powershell
Test-Path capture\extracted\tokens.json
Test-Path capture\extracted\visible-text.txt
Test-Path capture\extracted\asset-descriptions.md
Test-Path capture\assets
Test-Path capture\BLOCKED.md
```

Expected: first four values are `True`; `capture/BLOCKED.md` is `False`.

- [ ] **Step 3: Adopt local brand media into the project ledger**

```powershell
node "C:\Users\HP\.agents\skills\media-use\scripts\resolve.mjs" --adopt --project .
```

Expected: existing project media is inventoried without replacing source assets.

- [ ] **Step 4: Commit capture metadata and usable source assets**

```powershell
git add videos/credo-proof-becomes-ownership/capture videos/credo-proof-becomes-ownership/.media
git commit -m "feat(video): capture Credo brand and product evidence"
```

### Task 3: Build the Visual System

**Files:**
- Create: `videos/credo-proof-becomes-ownership/frame.md`
- Create: `videos/credo-proof-becomes-ownership/.hyperframes/caption-skin.html`

- [ ] **Step 1: Select the closest editorial-technical shipped preset**

Use the installed `code-editorial` preset. Its editorial hierarchy and technical monospace vocabulary fit Credo's evidence-led positioning, while the deterministic token remix maps it onto Credo's graphite, ivory, and green palette.

- [ ] **Step 2: Build and self-validate the frame system**

```powershell
node "C:\Users\HP\.agents\skills\product-launch-video\scripts\build-frame.mjs" --preset code-editorial --hyperframes .
```

Expected: exit code `0`, `frame.md` exists, and the caption skin exists when shipped by the preset.

- [ ] **Step 3: Record the confirmed workflow-specific preset**

```powershell
node "C:\Users\HP\.agents\skills\media-use\scripts\prefs.mjs" record --hyperframes . --key style_preset --workflow product-launch-video --value code-editorial
```

Expected: the workflow-scoped preference is accepted.

- [ ] **Step 4: Commit the visual system**

```powershell
git add videos/credo-proof-becomes-ownership/frame.md videos/credo-proof-becomes-ownership/.hyperframes/caption-skin.html
git commit -m "feat(video): establish Credo launch visual system"
```

### Task 4: Author the Storyboard, VO Script, and Demo Guide

**Files:**
- Create: `videos/credo-proof-becomes-ownership/STORYBOARD.md`
- Create: `videos/credo-proof-becomes-ownership/SCRIPT.md`
- Create: `videos/credo-proof-becomes-ownership/DEMO-RECORDING-GUIDE.md`

- [ ] **Step 1: Write the exact seven-frame timing map**

Use these non-overlapping durations, totaling exactly 75 seconds:

```text
Frame 1  Hook                         00:00–00:06   6s
Frame 2  No bridge, wrapper, trust    00:06–00:13   7s
Frame 3  Credo mechanism reveal       00:13–00:20   7s
Frame 4  Playground demo placeholder  00:20–00:55  35s
Frame 5  Exact-match verification     00:55–01:02   7s
Frame 6  Evidence and replay guard     01:02–01:08   6s
Frame 7  Brand close                   01:08–01:15   7s
```

Set storyboard frontmatter to:

```yaml
format: 1920x1080
duration: 75s
message: "Proof becomes ownership"
arc: "Question → Rejection → Mechanism → Demo → Proof → Close"
audience: "BUIDL CTC judges, protocol builders, and RWA teams"
mode: autonomous
music: "minimal electronic pulse, controlled and technical, no vocals"
```

Each frame must name its `asset_candidates`, exact duration, transition, poster time, narration guide, and source path.

- [ ] **Step 2: Lock the English narration**

Write `SCRIPT.md` with approximately 150–165 words across the seven time windows. Include:

```text
Creditcoin: CREDIT-coin
Attestcoin: attest-coin
USDC: U-S-D-C
ERC-1155: E-R-C eleven-fifty-five
Sepolia: seh-POH-lee-ah
```

The script must explicitly distinguish the guided simulation from linked live testnet evidence and must not describe the system as atomic or mainnet-ready.

- [ ] **Step 3: Write the recording guide**

The guide must specify 1920×1080 capture, 30 fps preferred, notification suppression, browser zoom, cursor discipline, and these demo cue windows:

```text
00:20–00:24  Establish Playground console
00:24–00:28  Click Run without wallet
00:28–00:34  Escrow / Creditcoin stage
00:34–00:39  Sepolia USDC payment
00:39–00:46  Attestcoin observation and proof
00:46–00:51  All bound fields show MATCH
00:51–00:55  SETTLED, buyer 1, escrow 0, evidence links
```

- [ ] **Step 4: Validate timing and prohibited claims**

```powershell
rg -n "mainnet|atomic swap|guaranteed|instant" STORYBOARD.md SCRIPT.md DEMO-RECORDING-GUIDE.md
rg -n "20|55|35s|simulation|testnet|contract decides" STORYBOARD.md SCRIPT.md DEMO-RECORDING-GUIDE.md
```

Expected: any prohibited term appears only in explicit negation; timing and accuracy language are present.

- [ ] **Step 5: Commit narrative artifacts**

```powershell
git add videos/credo-proof-becomes-ownership/STORYBOARD.md videos/credo-proof-becomes-ownership/SCRIPT.md videos/credo-proof-becomes-ownership/DEMO-RECORDING-GUIDE.md
git commit -m "feat(video): add Credo storyboard voiceover and demo guide"
```

### Task 5: Enrich Visual Direction and Stage Assets

**Files:**
- Modify: `videos/credo-proof-becomes-ownership/STORYBOARD.md`
- Create: `videos/credo-proof-becomes-ownership/assets/**`

- [ ] **Step 1: Add a time-coded shot sequence to every frame**

For each frame, cite a valid installed blueprint and valid animation rule names. Pace reveals across the full frame duration. Define numeric `handoff_out` and `handoff_in` values wherever the proof path continues through a cut.

- [ ] **Step 2: Add the video-wide direction block**

State camera discipline, type hierarchy, proof-path continuity, demo safe areas, caption keep-out band, and the prohibition on speculative crypto imagery under `## Video direction`.

- [ ] **Step 3: Stage named assets**

```powershell
node "C:\Users\HP\.agents\skills\product-launch-video\scripts\stage-assets.mjs" --storyboard ./STORYBOARD.md --hyperframes .
```

Expected: every storyboard asset candidate used by a frame is copied into `assets/`.

- [ ] **Step 4: Commit the enriched production board**

```powershell
git add videos/credo-proof-becomes-ownership/STORYBOARD.md videos/credo-proof-becomes-ownership/assets
git commit -m "feat(video): define Credo frame motion and stage assets"
```

### Task 6: Build Frame Compositions

**Files:**
- Create: `videos/credo-proof-becomes-ownership/compositions/frames/01-hook.html`
- Create: `videos/credo-proof-becomes-ownership/compositions/frames/02-rejection.html`
- Create: `videos/credo-proof-becomes-ownership/compositions/frames/03-mechanism.html`
- Create: `videos/credo-proof-becomes-ownership/compositions/frames/04-demo-placeholder.html`
- Create: `videos/credo-proof-becomes-ownership/compositions/frames/05-exact-match.html`
- Create: `videos/credo-proof-becomes-ownership/compositions/frames/06-evidence.html`
- Create: `videos/credo-proof-becomes-ownership/compositions/frames/07-close.html`
- Create: `videos/credo-proof-becomes-ownership/compositions/demo-overlay.html`

- [ ] **Step 1: Generate bounded frame packets**

```powershell
node "C:\Users\HP\.agents\skills\product-launch-video\scripts\frame-packets.mjs" --project . --storyboard ./STORYBOARD.md
```

Expected: `.hyperframes/frame-packets/_role.md` and one packet per frame exist.

- [ ] **Step 2: Build the seven frames from their isolated packets**

Dispatch one frame worker per packet as required by the product-launch workflow. Each worker reads only `_role.md`, its frame packet, and `frame.md`, then writes only its assigned HTML file. Build in waves if concurrency is limited.

- [ ] **Step 3: Build the demo overlay as an independent composition**

The overlay must contain only the upper-left Credo/demo title, a lower progress strip, and timed stage labels. Its central 80% must remain transparent and unobstructed. It must use the same 35-second timeline as Frame 4.

- [ ] **Step 4: Mark each completed storyboard frame animated**

Update each frame's metadata from `status: outline` to `status: animated` only after its assigned HTML file exists.

- [ ] **Step 5: Commit frame sources**

```powershell
git add videos/credo-proof-becomes-ownership/compositions videos/credo-proof-becomes-ownership/STORYBOARD.md
git commit -m "feat(video): build Credo promotional frames"
```

### Task 7: Assemble and Verify the Master

**Files:**
- Create: `videos/credo-proof-becomes-ownership/index.html`
- Create: `videos/credo-proof-becomes-ownership/caption_groups.json` when captions are enabled
- Create: `videos/credo-proof-becomes-ownership/snapshots/contact-sheet.jpg`

- [ ] **Step 1: Build captions from the locked narration without embedding final VO**

If no guide TTS is generated, create timing groups from the scripted windows and caption skin. If guide TTS is generated, use its word timestamps, then keep the guide voice out of the final master mix.

- [ ] **Step 2: Assemble the master index**

```powershell
node "C:\Users\HP\.agents\skills\product-launch-video\scripts\assemble-index.mjs" --storyboard ./STORYBOARD.md --hyperframes .
```

Expected: `index.html` exists and assembly reports a 75-second cut.

- [ ] **Step 3: Inject and verify transitions**

```powershell
node "C:\Users\HP\.agents\skills\product-launch-video\scripts\transitions.mjs" inject --storyboard ./STORYBOARD.md --hyperframes .
node "C:\Users\HP\.agents\skills\product-launch-video\scripts\transitions.mjs" verify --storyboard ./STORYBOARD.md --index ./index.html
```

Expected: both commands exit `0` and every seam matches the storyboard.

- [ ] **Step 4: Run structural verification**

```powershell
npx hyperframes lint
npx hyperframes check
```

Expected: both commands exit `0` with no composition or timing errors.

- [ ] **Step 5: Snapshot frame midpoints and both sides of every cut**

```powershell
npx hyperframes snapshot --at 3,5.9,6.2,9.5,12.9,13.2,16.5,19.9,20.2,37.5,54.9,55.2,58.5,61.9,62.2,65,67.9,68.2,71.5
```

Expected: `snapshots/contact-sheet.jpg` exists. Inspect it for clipping, unreadable copy, demo safe-area violations, and proof-path pops.

- [ ] **Step 6: Commit the verified assembly**

```powershell
git add videos/credo-proof-becomes-ownership/index.html videos/credo-proof-becomes-ownership/caption_groups.json videos/credo-proof-becomes-ownership/snapshots/contact-sheet.jpg
git commit -m "feat(video): assemble and verify Credo promo"
```

### Task 8: Preview and Render Deliverables

**Files:**
- Create: `videos/credo-proof-becomes-ownership/renders/credo-promo-75s.mp4`
- Create: `videos/credo-proof-becomes-ownership/renders/demo-overlay.webm`

- [ ] **Step 1: Open the verified preview**

```powershell
npx hyperframes preview --background
```

Expected: Studio opens or reports a background preview URL with the 75-second master.

- [ ] **Step 2: Render the master after the final visual gate**

```powershell
npx hyperframes render --skill=product-launch-video --quality high --output renders/credo-promo-75s.mp4
```

Expected: exit code `0` and the MP4 exists with a 1920×1080 frame and 75-second duration.

- [ ] **Step 3: Render the demo overlay**

Render `compositions/demo-overlay.html` to an alpha-capable WebM when supported. If the runtime cannot preserve alpha, render against an unambiguous green chroma background and document the exact chroma color in `DEMO-RECORDING-GUIDE.md`.

- [ ] **Step 4: Verify final media metadata**

```powershell
ffprobe -v error -show_entries format=duration -show_entries stream=width,height,r_frame_rate -of default=noprint_wrappers=1 renders/credo-promo-75s.mp4
```

Expected: width `1920`, height `1080`, frame rate `30/1` or the project-configured equivalent, and duration within one frame of `75.000` seconds.

- [ ] **Step 5: Report delivery paths and replacement workflow**

Return clickable paths for the MP4, overlay, VO script, recording guide, storyboard, and contact sheet. State the final measured duration and explain that the user's footage replaces exactly 00:20–00:55.
