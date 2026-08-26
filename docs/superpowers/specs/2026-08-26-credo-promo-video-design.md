# Credo 75-Second Promotional Video Design

## Purpose

Produce a polished 75-second, 16:9 promotional video for Credo that explains its proof-triggered cross-chain RWA settlement model, leaves a replaceable 35-second slot for a live Playground recording, and includes a complete English voice-over script that continues through the demo segment.

The video is intended for hackathon judges, project presentations, YouTube, and embedded playback. It must communicate one central idea: official USDC remains final on Ethereum, the ERC-1155 remains on Creditcoin, and only cryptographic proof crosses chains.

## Deliverables

- A HyperFrames project under `videos/credo-proof-becomes-ownership/`.
- A 1920×1080, 30 fps composition with a target duration of exactly 75 seconds.
- A rendered promotional MP4 containing a clearly replaceable demo placeholder from 00:20 through 00:55.
- A complete English voice-over script with timecodes and delivery notes.
- A recording guide describing the Playground actions and their target timing.
- A standalone transparent or chroma-safe overlay composition for placement above the user's live-action demo footage.
- A contact sheet used to verify layout and transitions before rendering.

The user will generate and record the final voice-over independently. The initial video therefore uses timing markers and may use a temporary guide voice only when required to validate pacing; the final deliverable must also work without embedded narration so the user's VO can be added later.

## Creative Direction

### Concept: Proof Becomes Ownership

The visual story begins with the constraints of conventional cross-chain settlement, transforms a payment receipt into a visible cryptographic proof, and follows that proof into a deterministic asset release on Creditcoin. The product is presented as infrastructure with evidence, not as speculative crypto imagery.

The emotional target is controlled confidence: precise, verifiable, and calm. The video should feel like a premium protocol launch rather than a generic fintech advertisement.

### Visual Language

- Dark graphite and warm ivory backgrounds derived from the existing Credo UI.
- Credo green as the primary signal for verified state and completed settlement.
- Restrained technical typography, monospaced hashes, exact-value labels, and thin network paths.
- Ethereum, Attestcoin, and Creditcoin represented as distinct execution zones connected by proof, never by a token bridge.
- Motion based on causal progression: bind, transfer, observe, prove, verify, release.
- No floating coin clichés, generic blockchain cubes, neon cyberpunk tunnels, or invented transaction claims.

The open-source `heygen-com/hyperframes-launches` repository may inform composition structure and pacing, but the result must preserve Credo's own brand and narrative identity.

## Runtime Structure

### 00:00–00:06 — Hook

Open on a payment and an RWA separated across two networks. Establish the question: how can payment become ownership without moving the money through a bridge?

### 00:06–00:13 — Reject the Conventional Model

Rapidly remove the usual assumptions: no wrapped USDC, no trusted settlement worker, and no oracle promise.

### 00:13–00:20 — Introduce Credo

Reveal Credo and the three-step causal model: pay on Ethereum, prove through Attestcoin, release on Creditcoin.

### 00:20–00:55 — Replaceable Playground Demo

Reserve exactly 35 seconds for the user's live-action or screen recording. The base composition displays a branded browser-safe placeholder with timecode and action prompts. A separate overlay composition provides labels that can be placed above the user's recording.

The demo sequence is:

1. Open the Credo Playground and frame the guided testnet simulation.
2. Trigger `Run without wallet`.
3. Show the sale entering escrow on Creditcoin.
4. Show the plain Sepolia USDC payment.
5. Show Attestcoin observation and proof preparation.
6. Show every bound payment field changing to `MATCH`.
7. Show settlement, buyer balance `1`, escrow balance `0`, and the real evidence links.

The video must not imply that the guided simulation itself submits mainnet funds. On-screen copy should retain the Playground's distinction between simulation and the separately linked live testnet evidence.

### 00:55–01:08 — Security and Evidence

Highlight exact tuple matching, synchronous contract verification, and global replay protection. Show the verified testnet outcome without overstating production readiness.

### 01:08–01:15 — Close

Resolve to the Credo mark, the line “Proof becomes ownership,” and the established project statement: “The worker discovers. Attestcoin proves. The contract decides.”

## Voice-Over Direction

The final script will be English, approximately 150–165 words, delivered at a deliberate 125–135 words per minute with short pauses around the hook and closing. The language must be understandable to a technically informed judge without requiring prior knowledge of Attestcoin.

The demo narration must describe what the viewer is seeing rather than repeat button labels. It must remain valid if the user performs the Playground actions a few seconds earlier or later, so visual cue points will be grouped into timing windows rather than requiring frame-perfect synchronization.

## Audio Direction

- Minimal electronic bed with restrained pulse and no vocals.
- Low-intensity opening, a clearer rhythmic grid during the demo, and a resolved final chord.
- Subtle interface and proof-confirmation SFX; no loud trailer impacts.
- The music mix must leave sufficient space for independently generated VO.
- Provide a version without embedded VO. If a guide VO is generated for timing, it is a disposable reference rather than the final narration asset.

## Demo Replacement Contract

The placeholder begins at exactly 20.000 seconds and ends at exactly 55.000 seconds. Replacement footage should be 1920×1080 or higher, 30 fps preferred, with the browser zoom adjusted so the Playground console remains readable.

The overlay must keep the central application area unobstructed. Labels occupy only the upper-left title band and lower safe-area progress band. The guide will identify the precise in/out points and recommend a hard cut or short branded wipe at both boundaries.

## Accuracy Constraints

- Say “Ethereum Sepolia” and “Creditcoin CC3” where a testnet distinction matters.
- Do not describe Credo as an atomic two-chain swap.
- Do not claim production or mainnet availability.
- Distinguish the guided simulation from the recorded live settlement evidence.
- Preserve the technical claim that contract verification, rather than the worker, decides settlement.
- Mention the observed 489-second live testnet latency only when labeled as an observed run, not a guaranteed performance figure.

## Acceptance Criteria

- Total composition duration is 75 seconds within one video frame.
- The demo placeholder occupies exactly 35 seconds from 00:20 to 00:55.
- Every narrated claim is supported by the project README, source UI, or evidence files.
- The English script includes timecodes, narration, pronunciation notes, and corresponding visual/demo cues.
- The recording guide is sufficient for the user to capture footage without inspecting the video source.
- The placeholder can be replaced without rebuilding the surrounding intro and closing scenes.
- HyperFrames lint and check pass.
- Midpoint and transition snapshots show no clipping, unreadable text, or continuity pops.
- The final MP4 and demo overlay render successfully at 1920×1080.

## Out of Scope

- Recording the user's live-action footage.
- Generating the user's final voice.
- Editing or redesigning the Credo web application.
- Claiming or demonstrating mainnet settlement.
- Publishing the finished video to an external service.
