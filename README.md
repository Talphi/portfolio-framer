# Portfolio — Framer Code Components

Framer code components for my portfolio, built with React + TypeScript.

## Components

### `TerminalConsole.tsx`
A terminal-style UI component with an integrated audio-reactive biosphere canvas.

**Features:**
- Web Audio API driven particle system (biosphere canvas)
- Mouse-position HSL color theming (hue from X axis, lightness from Y)
- Lowpass filter mapped to mouse Y axis — open at top, closed at bottom
- Stutter gate effect mapped to mouse X axis (16th-note rhythmic gating)
- Spore boundary jitter that mirrors stutter depth
- Filter frequency mapped to spore size and biosphere brightness (80% of spores affected)
- Organic floating movement for all cells, softly guided by mouse position
- Zone-based (6×4 grid) cell distribution with auto-replenishment for empty canvas areas
- Terminal animation phases with music toggle

**Usage:**
Drop `TerminalConsole.tsx` into your Framer project's code files. No external imports required — fully self-contained.
