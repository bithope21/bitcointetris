# plan.md — Bitcoin Tetris Party: Roblox-Inspired Redesign

## 0. Summary Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Project class | `hobby_project` | Educational game, no login/payment/database required |
| Deliverable | Single self-contained HTML file | Matches existing architecture; zero build step; easy to share/deploy |
| Rendering | CSS + DOM (no WebGL/Three.js) | Low-poly aesthetic achievable with CSS 3D transforms, gradients, SVG; avoids heavy deps for a prototype |
| Framework | React 18 via CDN + Babel standalone | Preserve existing stack; no build tooling needed |
| Slot machine intro | CSS animations + DOM particles | Canvas not needed for this level of effect; keeps bundle simple |
| 3D blocks | CSS `box-shadow` + `transform: perspective()` | Already partially done in existing code; enhance with sharper edge highlights |
| Particle system | Lightweight DOM-based particles | Create/remove divs on line clear; 20-30 particles max; no performance concern |
| Mobile controls | Always-visible D-pad + action buttons | Emulator-style layout; detect touch capability to auto-show |

## 1. Existing Context

### Files (source of truth)
- `bitcointetris.html` — monolithic prototype (~1330 lines, everything inline)
- `tetris-engine.js` — standalone engine (7 shapes, BIP-39 word mapping, board/collision/clear logic)
- `setup.jsx` — Lobby, Setup, Header, SafetyStrip, AdSlot, helpers
- `app.jsx` — Arena, GameOver, VerifyMode, TicketCard, ShareCard, StaticPages, Footer, root App
- `bip39-words.js` — 4-letter BIP-39 word list + filter
- `styles.css` — full CSS (voxel buttons, board, panels, animations)
- `tweaks-panel.jsx` — reusable edit-mode panel (not needed for redesign)

### Current flow
```
Lobby → Setup (name, mode, categories) → Playing → GameOver → Verify → Share
```
6 nav tabs: Play, How it works, Safety, Trust, Privacy, About

### What works well (preserve)
- `TetrisEngine` — board logic, piece spawning, rotation with wall kicks, line clear, scoring
- BIP-39 4-letter word pool + category filtering by starting letter
- Word collection → ticket creation pipeline
- Verify mode (SHA-256 demo address, always 0 BTC)
- Safety constraints (crypto.getRandomValues, no real seeds, no storage)
- Share card with social links
- Toast notification system

### What needs redesign
- Entire visual identity (cream/flat → Roblox low-poly green world)
- Flow: 6-phase → 2-screen (Play / Settings)
- Board cells: flat colored squares → 3D sharp-edge blocks
- Safety strip: full-width banner → compact floating badge
- Mobile controls: hidden (`display: none`) → always visible on touch devices
- Missing: slot machine intro, particle effects, score popups, full-screen game shell

## 2. Product Scope

### In scope (MVP prototype)
1. Main menu with low-poly green world background, "Bitcoin Tetris Party" title, Play + Settings buttons
2. Animated Bitcoin slot machine intro sequence (Play → machine → coins → gameplay)
3. Full-screen gameplay shell (100dvh, no scroll)
4. 3D-ish sharp-edge blocks with readable letters
5. Desktop 3-column layout / Mobile vertical layout
6. Mobile emulator-style controls (D-pad + rotate + drop)
7. Line clear particle burst + score popup
8. Compact safety badge
9. Settings screen (name, mode, categories — reuse existing Setup logic)
10. Game over + Verify + Share (simplified)

### Out of scope
- Real 3D rendering (Three.js/WebGL)
- Backend/database
- Leaderboard (keep as static placeholder)
- Google AdSense integration
- PWA/install flow
- Sound effects (nice-to-have but not in MVP)

## 3. Recommended Architecture

### Single HTML file, enhanced
Keep the monolithic approach. The final deliverable is one `bitcointetris.html` file with:
- Inline `<style>` — complete CSS including new low-poly world, 3D blocks, animations
- Inline `<script>` — BIP-39 words, TetrisEngine (preserved), new UI components
- CDN deps: React 18, ReactDOM 18, Babel standalone (same as current)

### Component tree (new)
```
App
├── MainMenu              (green world bg, title, Play/Settings buttons, slot machine object)
│   └── SlotMachine       (yellow Bitcoin machine, idle animation)
├── SlotMachineIntro      (full-screen transition: machine zoom → lever → coins → fade to game)
├── SettingsScreen        (player name, mode, categories — reuse Setup logic)
├── GameShell             (100dvh full-screen container)
│   ├── GameHUD           (top bar: name, score, lines, level, pause, safety badge)
│   ├── GameBoard         (center: 10x20 grid with 3D blocks)
│   ├── SidePanel         (desktop: next piece, word progress, controls guide)
│   ├── MobileControls    (bottom: D-pad left/right, rotate, soft/hard drop)
│   ├── ParticleLayer     (overlay: line clear particles, score popups)
│   └── PauseOverlay
├── GameOverScreen        (stats + verify/play again/share)
├── VerifyMode            (ticket cards + verify all — simplified)
├── ShareCard             (modal — preserve existing)
├── SafetyBadge           (compact floating badge, bottom-left)
└── ToastHost             (preserve existing)
```

### State flow (new)
```
phase: "menu" | "settings" | "intro" | "playing" | "gameOver" | "verify"

menu → (Play clicked) → intro → playing → gameOver → verify
menu → (Settings clicked) → settings → (Start clicked) → intro → playing → ...
```

## 4. Bithope Integration Points

None. This is a standalone hobby project — no Supabase, no admin panel, no Bithope web integration needed.

## 5. Identity And Access Strategy

None. Anonymous play only. Player name stored in localStorage (non-sensitive stats only, same as current).

## 6. Data Model

No change from existing. All state is in-memory React state:
- `board: Cell[][]` — 20x10 grid
- `piece / next` — current + preview tetromino with BIP-39 word
- `collectedWords: string[]` → `tickets: Ticket[]`
- `localStorage` — player name + game count (non-sensitive)

## 7. Google Sheets / Operations Mirror

N/A — standalone game.

## 8. Admin UX

N/A.

## 9. User UX Flow

### Flow A: Quick Play (default, zero friction)
```
1. Main Menu (green world, slot machine idle)
2. Click "Play"
3. Slot Machine Intro (~3 sec animation)
   - Machine zooms to center
   - Red lever pulls down
   - Lights activate
   - Bitcoin coins burst out
   - Fade/transition to gameplay
4. Gameplay (full-screen, 12-word default, random categories)
5. Game Over → Verify → Share → back to Menu
```

### Flow B: Configured Play
```
1. Main Menu → click "Settings"
2. Settings screen: player name, 12/24/random, category selection
3. Click "Start" → Slot Machine Intro → Gameplay → ...
```

### Main Menu layout
```
┌─────────────────────────────────────┐
│  [green low-poly world background]  │
│                                     │
│     BITCOIN TETRIS PARTY            │  ← big chunky 3D text
│     Stack word blocks. Verify zero. │  ← subtitle
│                                     │
│        ┌──────────┐                 │
│        │  ₿ SLOT  │                 │  ← idle slot machine (CSS)
│        │  MACHINE │                 │
│        └──────────┘                 │
│                                     │
│    ┌──────────┐  ┌──────────┐       │
│    │   Play   │  │ Settings │       │  ← big chunky buttons
│    └──────────┘  └──────────┘       │
│                                     │
│  [Demo only · Never enter a real seed]  ← compact badge
└─────────────────────────────────────┘
```

### Desktop gameplay layout (3-column)
```
┌──────┬────────────────┬──────────┐
│ Left │     Center     │   Right  │
│      │                │          │
│ Word │   Game Board   │ Next     │
│ Bank │   (10x20)      │ Piece    │
│      │                │          │
│ Info │                │ Score    │
│      │                │ Progress │
│      │                │          │
│      │  [safety badge]│ Speed    │
└──────┴────────────────┴──────────┘
   Top bar: Player · Score · Lines · Lvl · Pause
```

### Mobile gameplay layout (vertical)
```
┌──────────────────────┐
│ HUD: Score · Lvl     │  ← compact top bar
├──────────────────────┤
│                      │
│     Game Board       │  ← centered, max width
│     (10x20)          │
│                      │
├──────────────────────┤
│  ◀  ▶  ↻  ▼  ⬇⬇    │  ← emulator controls
└──────────────────────┘
   [safety badge] floating bottom-left
```

## 10. API / Backend Flow

N/A — fully client-side.

## 11. AI / External Services

N/A.

## 12. Revenue / Affiliate / Payment

N/A for MVP. Ad slot placeholders can remain as comment-only markers (remove visible ad boxes from gameplay).

## 13. Privacy / Security / Abuse Prevention

Preserve all existing safety constraints:
- **No real seed input** — game generates words from BIP-39 list using `crypto.getRandomValues`
- **No seed storage** — tickets exist in React state only, lost on refresh
- **No network calls** — everything local (except CDN script loads)
- **No `Math.random` for secret material** — use Web Crypto API throughout
- **Compact safety badge** replaces full-width strip to reduce visual noise while keeping message visible:
  `"Demo only · Never enter a real seed"`

## 14. PWA / Install / Assets

Out of scope for MVP. Could add later:
- manifest.json
- Service worker for offline play
- App icon (Bitcoin + Tetris mashup)

## 15. Environment Variables

None needed — fully static client-side app.

## 16. Implementation Order

### Phase 1: Green World + Main Menu (CSS foundation)
**Goal:** New visual identity established, main menu renders with low-poly world

Tasks:
1. Replace `body` background with green low-poly world scene (CSS gradients + positioned div shapes for trees, hills, sky)
2. Create `MainMenu` component with "Bitcoin Tetris Party" title (chunky 3D text via text-shadow)
3. Add Play + Settings buttons (reuse `.btn` style, larger)
4. Create CSS slot machine object (yellow body, Bitcoin logo, red lever) with idle bob animation
5. Add compact `SafetyBadge` component (fixed bottom-left, small pill)

**Verify:** Open HTML in browser. See green world with title, buttons, and idle slot machine.

### Phase 2: Slot Machine Intro Sequence
**Goal:** Clicking Play triggers a 3-second animated transition into gameplay

Tasks:
1. Create `SlotMachineIntro` component (full-screen overlay with z-index)
2. Animate: machine scale-up to center (CSS transform + transition)
3. Animate: lever pull (CSS rotate on lever element)
4. Animate: coin burst (spawn 15-20 `.coin` divs with random trajectories via CSS animation)
5. Animate: fade out overlay → reveal game board
6. Wire Play button → intro → auto-start game with defaults (12-word, random categories)

**Verify:** Click Play. See slot machine zoom, lever pull, coins burst, smooth transition to gameplay.

### Phase 3: Full-Screen Game Shell + 3D Board
**Goal:** Gameplay renders in 100dvh shell with enhanced 3D blocks

Tasks:
1. Create `GameShell` wrapper (height: 100dvh, overflow: hidden, display: flex/grid)
2. Create `GameHUD` top bar (player name, score, lines, level, pause button — single compact row)
3. Redesign `.board` CSS: keep 10x20 grid, add perspective transform for slight 3D tilt
4. Redesign `.cell.filled` CSS: sharper edge shadows, glossy/plastic look, higher contrast
5. Ensure letters remain highly readable (white text, bold, text-shadow for contrast)
6. Desktop: 3-column grid (side panels + center board)
7. Hide/remove: Header nav bar, SafetyStrip, Footer, AdSlots during gameplay

**Verify:** Board renders full-screen. Blocks look 3D and glossy. Letters are clearly readable. No scroll.

### Phase 4: Side Panels + Next Piece
**Goal:** Desktop shows word bank + next piece panels; mobile hides them

Tasks:
1. Left `SidePanel`: word bank progress bar, collected words (compact), controls guide
2. Right `SidePanel`: next piece preview (larger than current), current/next word, speed slider, word progress
3. `@media (max-width: 768px)`: hide side panels, show only HUD + board + mobile controls
4. Preserve all existing game logic (tryMove, rotate, softDrop, hardDrop, lockAndAdvance)

**Verify:** Desktop shows 3 columns. Resize to mobile width — only board + HUD visible.

### Phase 5: Mobile Controls
**Goal:** Touch-friendly emulator-style controls visible on mobile

Tasks:
1. Create `MobileControls` component (fixed bottom, inside game shell)
2. Layout: left group (◀ ▶), center (↻ rotate), right group (▼ soft, ⬇⬇ hard)
3. Style: large touch targets (min 48px), rounded, chunky 3D button style
4. Use `onTouchStart` + `e.preventDefault()` (avoid scroll/zoom interference)
5. Auto-detect touch: `'ontouchstart' in window` → show controls; desktop → hide
6. Ensure controls don't overlap board or push it off-screen

**Verify:** On mobile (or touch emulation): controls visible, responsive, all 5 actions work.

### Phase 6: Particle Burst + Score Popup
**Goal:** Line clears produce visual celebration

Tasks:
1. Create `ParticleLayer` component (absolute overlay on board, pointer-events: none)
2. On line clear: spawn 20-30 particle divs at cleared row positions
3. Particle style: small colored squares (reuse tetromino colors), random rotation + velocity
4. Particle animation: CSS `@keyframes` — explode outward + fade out over 600ms
5. Score popup: floating "+100" / "+300" text that rises and fades (CSS animation)
6. Clean up particle divs after animation ends (remove from DOM)

**Verify:** Clear a line. See colored particles burst. See score number float up and fade.

### Phase 7: Settings Screen
**Goal:** Settings accessible from main menu, preserves all setup options

Tasks:
1. Create `SettingsScreen` component — reuse Setup logic (name, mode, categories)
2. Style to match new green world / Roblox aesthetic
3. Category cubes: keep existing interaction, restyle with new colors
4. "Start" button → triggers slot machine intro → gameplay with config
5. "Back" button → return to main menu

**Verify:** Menu → Settings → configure → Start → intro plays → game uses settings.

### Phase 8: Game Over + Verify + Share (simplified)
**Goal:** Post-game flow works with new styling

Tasks:
1. Restyle `GameOverScreen` — full-screen, Roblox-themed, chunky stats
2. Restyle `VerifyMode` — ticket cards with new block style
3. Preserve all verify logic (fakeAddressFromWords, 0 BTC result)
4. Preserve `ShareCard` — update styling only
5. "Play Again" → back to main menu (not to setup)
6. Remove visible AdSlot placeholders from game-over and verify screens

**Verify:** Complete a game → game over shows stats → verify tickets → 0 BTC → share works.

### Phase 9: Polish + Responsive + Cleanup
**Goal:** Final quality pass

Tasks:
1. Remove old Lobby, Header (multi-tab nav), SafetyStrip, Footer, AdSlot components
2. Remove static pages (How it works, Safety, Trust, Privacy, About) — or move to a simple info modal
3. Test full flow on desktop (1440px), tablet (768px), mobile (375px)
4. Ensure game board scales properly at all sizes (aspect-ratio: 10/20 maintained)
5. Verify all keyboard controls still work on desktop
6. Verify touch controls work on mobile
7. Check: no scroll during gameplay, no overflow, no clipping
8. Performance: ensure particle burst doesn't cause frame drops (limit particle count)

**Verify:** Full playthrough on desktop + mobile with no issues.

## 17. Verification Checklist

### Functionality
- [ ] Main menu renders with green world, title, Play + Settings buttons
- [ ] Slot machine shows with idle animation
- [ ] Play → slot machine intro → gameplay (with defaults)
- [ ] Settings → configure → Start → intro → gameplay (with config)
- [ ] Tetris board: pieces fall, move left/right, rotate, soft/hard drop
- [ ] Letters visible on every block, highly readable
- [ ] Line clear triggers particle burst + score popup
- [ ] Words collected from cleared lines
- [ ] Tickets created at 12/24 word thresholds
- [ ] Game over screen with accurate stats
- [ ] Verify mode: tickets verify to 0 BTC (always)
- [ ] Share card works (copy, X/Twitter, Reddit, Telegram)
- [ ] Toast notifications appear and auto-dismiss
- [ ] Pause/resume works (keyboard P + button)

### Visual / UX
- [ ] Roblox-inspired low-poly aesthetic (not a finance dashboard)
- [ ] Full-screen gameplay (100dvh, no scroll)
- [ ] 3D-ish blocks (sharp edges, glossy, high contrast)
- [ ] Desktop: 3-column layout
- [ ] Mobile: vertical layout with visible touch controls
- [ ] Touch controls: all 5 actions responsive (left, right, rotate, soft drop, hard drop)
- [ ] Compact safety badge visible but not intrusive
- [ ] No visible ad placeholders during gameplay

### Safety
- [ ] Never asks for real seed phrase
- [ ] No seed stored (localStorage has only name + stats)
- [ ] crypto.getRandomValues used (not Math.random) for word selection
- [ ] "Demo only" messaging present
- [ ] Tickets labeled as "educational gameplay phrase"

## 18. Risks And Open Questions

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| CSS-only low-poly world may look flat | Medium | Use layered gradients, SVG shapes, CSS clip-path for depth; iterate on visual |
| Slot machine animation may feel janky | Medium | Keep it simple: 3-4 keyframe steps, test on mobile, allow skip |
| Particle burst may lag on low-end mobile | Low | Cap at 20 particles, use `will-change: transform`, remove after animation |
| Single HTML file gets very large | Low | Already ~1300 lines; redesign adds maybe 500 more; still fine for a prototype |
| Babel in-browser transpilation is slow | Low | Acceptable for prototype; move to build step if deploying to production |

### Open Questions
1. **Sound effects?** — Not in MVP. Could add Web Audio API beeps/chimes later for piece landing, line clear, coin burst.
2. **Roblox-like character/avatar?** — The redesign brief mentions a small avatar. Could add a simple CSS blocky character on the main menu. Skip for MVP if too complex.
3. **Static pages (How it works, Safety, etc.)?** — Remove from nav, consolidate into a small info/help modal accessible from settings or a "?" button.
4. **Touch swipe gestures?** — D-pad buttons are safer than swipe detection. Could add swipe as enhancement later.
5. **Deployment target?** — If deploying to a domain (bitcointetris.app), will need hosting. For now, the file runs locally via `file://` or any static server.

## 19. Official References

- [BIP-39 Specification](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) — official word list + mnemonic standard
- [React 18 CDN](https://react.dev/learn/add-react-to-an-existing-project) — UMD build used via unpkg
- [CSS Transforms / Perspective](https://developer.mozilla.org/en-US/docs/Web/CSS/perspective) — for 3D block effects
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues) — for secure random word selection
- [CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations) — for particle burst, slot machine, transitions
