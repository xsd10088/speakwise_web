# SpeakWise 设计脑暴

## Approach 1 — Quiet Brass Studio
**Very Brief Intro:** A warm editorial language studio with paper-like surfaces, brass accents, and a calm, tactile recording ritual. It should feel like a focused private lesson rather than a generic SaaS dashboard.

**Probability:** 0.07

## Approach 2 — Field Notes / Chosen Direction
**Very Brief Intro:** A light, instrument-panel-inspired practice desk that treats every recording as a small field note: clear status, honest feedback, and a visible sense of progress. The mood is precise, human, and quietly optimistic.

**Probability:** 0.04

## Approach 3 — Midnight Broadcast
**Very Brief Intro:** A dark broadcast booth with restrained amber signal lights and a strong waveform motif, designed for users who want a more immersive, performance-oriented practice session.

**Probability:** 0.08

## Chosen Approach: Field Notes

### Design Movement
Contemporary editorial utility, borrowing from field notebooks, analog audio meters, and Swiss information design without becoming sterile.

### Core Principles
1. Make recording state impossible to misunderstand: permission, idle, recording, paused, saved, and error each need distinct language and visual treatment.
2. Prefer evidence over decoration: elapsed time, input level, waveform, and recovery actions should be visible at the moment they matter.
3. Use warm, tactile surfaces and restrained asymmetry so the practice loop feels personal, not clinical.
4. Keep the primary action close to the user's focus and make error recovery a first-class path rather than a dead end.

### Color Philosophy
A bone-white paper background gives the interface a calm desk-like quality. Ink navy carries structure and trust. The ownable accent is **signal saffron**, a warm yellow-orange reserved for record state, active focus, and useful emphasis. Sage is used for confirmed success, while brick red is reserved for actionable failure states. The palette is intentionally low-glare and high-contrast so recording feedback remains legible.

### Layout Paradigm
Use a left-aligned practice desk rather than a centered hero. A narrow identity rail anchors the page, the main recording card occupies the visual center, and a side column carries session notes and recovery guidance. On small screens the rail becomes a compact top bar and the side column stacks below the recorder.

### Signature Elements
- A punched-card index marker at the top of major panels.
- A thin signal line that shifts from quiet navy to signal saffron when recording.
- Small field-note labels with uppercase tracking and numbered sections.

### Interaction Philosophy
Interactions should feel like operating a reliable instrument: instant acknowledgement, clear state transitions, no ambiguous disabled moments, and an explanation beside every recovery action. Permission or format failures should preserve the session context and offer a single obvious retry path.

### Animation
Use short, physical transitions under 240ms. The record button should depress on activation; the signal line should breathe only while recording; status changes should fade/translate slightly rather than bounce. Avoid decorative motion during errors. Respect reduced-motion preferences and never use motion as the only state signal.

### Typography System
Use **DM Sans** for readable interface copy and **Space Grotesk** for headings and compact instrument labels. Headings use a strong but not oversized scale; data labels use uppercase 0.12em tracking; body copy remains 16px or larger on the recorder card.

### Brand Essence
SpeakWise is a calm voice practice desk for language learners who want dependable recording feedback without a noisy dashboard. Personality: **observant, grounded, encouraging**.

### Brand Voice
Headlines should be direct and human. CTAs should describe the next action, never generic conversion language. Error copy should explain what happened without blaming the user.

Example lines:
- “Make one clear take.”
- “Your browser is ready to listen again.”

### Wordmark & Logo
Use a compact mark formed by three uneven vertical signal strokes, with the middle stroke cut into a small speech notch. The symbol should work without text and appear as a small ink stamp beside the SpeakWise wordmark.

### Signature Brand Color
**Signal saffron — #E9A23B.** It is warm enough to feel human, distinct from generic app blue, and reserved for moments where the interface is actively listening or asking the user to act.

## Implementation Reminder
This is a focused frontend repair. Preserve a single recording workflow and make the media capture compatibility layer explicit: choose a supported MIME type, create a fresh recorder per take, stop all tracks on every exit path, reset stale blobs, and surface permission/unsupported-browser errors in the same state model as the UI.
