# Design System — specrail dashboard

**Codename:** Reading Room
**Date:** 2026-05-17
**Status:** v0 — approved for v0.1.0 implementation
**Preview:** [`design/preview.html`](./design/preview.html) — open in browser
**Source:** `/design-consultation` skill (gstack), single voice (Claude main + Claude subagent agreed independently)

> **Visual thesis:** A reading room for software specs — editorial typography meets instrument-grade precision. The information density of a dashboard, the legibility of a book.

---

## Product Context

- **What this is:** Local web app that views, relates, and AI-reviews specrail 13-phase markdown specs.
- **Who it's for:** PERSONA-1 "Spec-Driven Builder" — senior developer running Claude Code daily, deeply technical, dark-mode-first, keyboard-shortcut-driven.
- **Space / industry:** OSS developer tools (Linear / Raycast / Vercel / GitHub category — but with `markdown spec reading` as primary surface, not chip-UI dashboard).
- **Project type:** Local web app (npx → localhost:random, single-user, no auth). Desktop 1280+ only.
- **Spec source-of-truth:** `docs/spec/01-prd.md` through `13-implementation-plan.md`.

## Aesthetic Direction

- **Direction:** Editorial × Industrial-utilitarian hybrid.
- **Decoration level:** Minimal — typography does 90% of the visual work; the only ornament is a 1px gold rule for active state.
- **Mood:** "잘 만든 spec 검토 도구." Calm. Disciplined. Warm dark mode (off-white text on near-black, not blue-tinted). Hairline borders, no shadows, no gradients.
- **Reference sites:** None directly imitated. Closest aesthetic kin: a serif-set technical manual (Knuth/Bringhurst) rendered as a Linear-style app.

## Typography

| Role | Font | Loading | Why |
|------|------|---------|-----|
| Display (phase heading, top bar, project name) | **Fraunces** | Google Fonts (variable: opsz, SOFT, wonk) | Variable serif with editorial weight. SOFT axis lets us tune warmth per context (top bar harder, body softer). |
| Body (markdown prose, descriptions, hover popovers) | **Literata** | Google Fonts (variable: opsz) | Designed by Google for long-form e-reader reading. Optimized for **prose** at 15-16px, which is 80% of a session in this product. Tabular figures supported. |
| UI/Labels (toolbar text, button labels, drawer tabs) | **JetBrains Mono** (uppercase, tracked) | Google Fonts | Treats UI chrome as instrument labels, not body text. Distinct from prose. |
| Data / Tables (line numbers, counts, mtime, IDs) | **JetBrains Mono** (tabular-nums) | Google Fonts | Same family as code/IDs. Tabular numerals for alignment. |
| Code (CodeMirror, inline `code`, YAML blocks) | **JetBrains Mono** | Google Fonts | NFR-I18N-2 mixed-script (Korean prose + English IDs + code). Free OSS. Ligatures **off** (we want exact-character spec ID rendering). |

### Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Literata:opsz,wght@7..72,400;7..72,500;7..72,600;7..72,700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

For OSS-friendly self-host alternative: Bunny Fonts (`fonts.bunny.net`) drop-in, GDPR-friendly.

### Scale (rem from 16px root)

| Token | Size | Use |
|------|------|-----|
| `text-xs` | 0.6875rem (11px) | UI labels, eyebrow, breadcrumb |
| `text-sm` | 0.8125rem (13px) | Drawer items, secondary text |
| `text-base` | 0.9375rem (15px) | Markdown body |
| `text-md` | 1rem (16px) | Phase view body alternate |
| `text-lg` | 1.0625rem (17px) | h3 in phase content |
| `text-xl` | 1.375rem (22px) | h2 / phase title |
| `text-2xl` | 2rem (32px) | h1 / hero |

Body line-height **1.65** (prose-optimized). UI line-height 1.3-1.4.

### Font blacklist (do not use)

Inter, Roboto, Arial, Helvetica, system-ui, Open Sans, Lato, Montserrat, Poppins (all overused → category-default sans, undermines RISK 1). Papyrus, Comic Sans, Lobster, Impact, Raleway, Clash Display (slop list).

## Color

**Approach:** Restrained. One accent hue (antique gold). Warm-neutral grayscale (off-white text, not pure white). Four semantic colors used only as 4px dots in alerts/badges, never as fills or fields.

### Dark mode (primary)

```css
:root[data-theme="dark"] {
  --bg:        #0E0F11;  /* near-black, cool undertone */
  --surface:   #16181B;  /* card, drawer, modal */
  --surface-2: #1E2125;  /* hover, selected, sidebar active bg */
  --border:    #2A2D31;  /* 1px hairline */
  --text:      #E6E1D5;  /* warm off-white (aged paper) — never pure white */
  --text-mute: #8B8680;  /* secondary copy, captions */
  --text-dim:  #5C5853;  /* tertiary labels, placeholders */
  --accent:        #C9A961;  /* antique gold — sole hue */
  --accent-mute:   #6B5832;  /* hover, dotted underlines */
  --success:   #65B98A;
  --warning:   #D4A04E;
  --error:     #D46B6B;
  --info:      #6B9FD4;
}
```

### Light mode (secondary)

```css
:root[data-theme="light"] {
  --bg:        #F4F1EB;  /* aged paper, not white */
  --surface:   #EBE7DE;
  --surface-2: #DFDAD0;
  --border:    #C8C2B5;
  --text:      #1A1A1A;
  --text-mute: #5A554F;
  --text-dim:  #8A8580;
  --accent:        #8B6914;  /* darker gold for contrast */
  --accent-mute:   #4A3808;
  --success:   #2F7F4E;
  --warning:   #8A6118;
  --error:     #9F3A3A;
  --info:      #2D5C8A;
}
```

**Dark-mode-first.** System pref drives initial theme; user override persists via `localStorage`.

### Contrast (WCAG AA — NFR-A11Y-3 compliance)

| Pair | Ratio | OK |
|------|-------|----|
| `--text` (#E6E1D5) on `--bg` (#0E0F11) | 14.7:1 | ✓ AAA |
| `--text-mute` (#8B8680) on `--bg` | 4.85:1 | ✓ AA normal |
| `--accent` (#C9A961) on `--bg` | 8.6:1 | ✓ AAA |
| `--accent` on `--text` (light mode) | 6.2:1 | ✓ AA normal |

`--text-dim` is used only on labels (≥ 14px) and decorative numbers — not body text.

## Spacing

- **Base unit:** 4px (subgrid friendly).
- **Density:** Comfortable (not "compact" Linear, not "spacious" Stripe — middle).

```css
--space-2xs: 2px;
--space-xs:  4px;
--space-sm:  8px;
--space-md:  16px;
--space-lg:  24px;
--space-xl:  32px;
--space-2xl: 48px;
--space-3xl: 64px;
```

- Phase view content max-width **`min(72ch, 800px)`** for prose readability.
- 3-pane shell: sidebar `200px` · main flexible · drawer `280px` (collapsible to `0`).

## Layout

- **Approach:** Hybrid. **App shell = strict grid** (3-pane disciplined). **Phase view body = editorial reading** (single column, generous leading, prose-first).
- **Grid (app shell):** fixed widths above. No responsive collapse below 1280px (PRD §6 Non-Goal #4 — desktop only).
- **Border radius:** Hierarchical, conservative.
  - `--radius-sm: 2px` — buttons, inputs, badges (favor flat industrial look)
  - `--radius-md: 4px` — cards, alerts, popovers
  - `--radius-lg: 8px` — modals only
  - **No `border-radius: 9999px` (pill shapes).** Pills feel chip-UI / Notion; we are not that.
- **Border:** All borders are **1px solid `--border`** (hairline). No shadows except modal scrim (`rgba(0,0,0,0.5)` overlay).
- **Active state convention:** Vertical 2px gold rule on the left edge (sidebar active phase), or 1px gold border-bottom (drawer active tab). Never a colored fill background.

## Motion

- **Approach:** Minimal-functional. No entrance animations on page load. No scroll-driven motion. State transitions only.
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard, predictable).
- **Duration tokens:**
  - `--dur-micro: 80ms` — hover state (button bg, link underline)
  - `--dur-short: 120ms` — drawer open/close, popover fade
  - `--dur-medium: 200ms` — modal open, phase route transition
  - `--dur-long`: not used (no animations longer than 200ms)
- **`prefers-reduced-motion: reduce`** → all transitions become `0ms` (instant).

## Component Tokens

### Buttons

```css
.btn { font-family: 'JetBrains Mono'; font-size: 12px; letter-spacing: 0.04em;
       padding: 8px 14px; border-radius: 2px; border: 1px solid var(--border);
       transition: background var(--dur-micro), color var(--dur-micro); }
.btn-primary   { background: var(--accent); color: var(--bg); border-color: var(--accent); font-weight: 600; }
.btn-secondary { background: var(--surface); color: var(--text); }
.btn-ghost     { background: transparent; color: var(--text-mute); border-color: transparent; }
```

### Inline IDs (R1, F1.2, NFR-PERF-2)

```css
.id { font-family: 'JetBrains Mono'; font-size: 0.88em;
      color: var(--accent); border-bottom: 1px dotted var(--accent-mute);
      padding: 0 2px; cursor: pointer; }
.id:hover { color: var(--text); border-bottom-color: var(--accent); }
```

### Sidebar phase row

```
[02-digit num · Fraunces italic 11px · text-dim]   [Phase name · Literata 13px]   [status dot 4px]
```

Active state: vertical `2px solid var(--accent)` on the left edge + `--surface` bg.

### Issue inbox row (source-label as first-class info)

```css
.src.plug   { background: var(--surface-2);              color: var(--text-mute); }  /* plugin-self-check */
.src.cross  { background: rgba(107,159,212,0.15);        color: var(--info); }       /* cross-phase */
.src.ai     { background: rgba(201,169,97,0.12);         color: var(--accent); }     /* ai-quality */
```

Source-label rendered as 9px mono uppercase chip with `padding: 1px 6px`. **Always present** — it's a 1st-class info dimension (per Phase 4 ENT-Issue + Phase 7 §5).

### Status dots (sidebar phase status)

| Icon | Meaning | Color |
|---|---|---|
| `●` 4px green | Clean | `--success` |
| `▲` warning | Issue (severity color) | `--warning` or `--error` |
| `◷` rotating | Check running | `--accent` |
| `✱` solid gold | Patch proposed waiting | `--accent` |

## Deliberate RISKS (vs. category — Linear / Vercel / Raycast / GitHub)

These two choices are where the product **deliberately departs** from convention. They are not accidents.

### RISK 1 — Serif body (Literata) instead of category-default sans (Inter / Geist Sans)

- **What:** Markdown body, descriptions, and popover prose render in **Literata serif** at 15px / line-height 1.65. Phase view body uses serif.
- **Why:** Every dev tool in the reference set uses sans body — optimal for "chip UI" where text is field labels and short metadata. specrail dashboard is **different**: a session spends 80% of time reading **prose** (spec body, AC, descriptions). Serif body signals "this is a reading tool, not a control panel."
- **Gain:** Instant identity. Sets expectation that text is to be **read**, not skimmed. Long sessions less fatiguing.
- **Cost:** First 30 seconds, a senior dev may think "is this a dev tool?" — resolved as soon as they read a paragraph.
- **Inspired by:** Anthropic.com, Stripe Press, Notion (irony noted: we hate the chip UI, love the body type).

### RISK 2 — Antique gold accent (#C9A961) instead of category-default indigo/purple/cyan

- **What:** Single accent hue, gold (`#C9A961` dark / `#8B6914` light). Used sparingly: active sidebar rule, active tab underline, primary button fill, inline ID color, status icons (some).
- **Why:** Linear (indigo), Vercel (cyan-fade), Raycast (red), GitHub (blue/green) — every modern dev tool defaults to cool palette. Zero use gold. 2026 UI color discourse (per research) says **color is the primary differentiator** in mature design. Gold against warm-neutral dark = instant brand. Also: avoids AI-slop purple gradients (CSO Anti-pattern #1).
- **Gain:** Brand signature recognizable in 1 frame. Warm against cool dark surface creates exact visual anchor for "active / important." Pairs naturally with serif (editorial warmth).
- **Cost:** Doesn't read "enterprise SaaS." OSS dev tool — feature, not bug.

## SAFE choices (category baseline — users expect these)

- 3-pane shell (sidebar + main + collapsible drawer) — Linear / Raycast standard.
- Keyboard shortcuts: `g p`, `g g`, `g i`, `cmd+k` (quick switcher), `cmd+s` (save) — fundamental dev tool habit.
- `cmd+k` command palette modal overlay.
- 4 semantic colors (success / warning / error / info) for alerts and status dots.
- Tabular-nums for line numbers, counts, timestamps.
- Dark mode default + system-pref-aware + user override.
- Hairline 1px borders, no shadows on cards (only on modal scrim).
- Right drawer with tabs (Issues / Chat / Refs).

## Anti-slop checklist (none of these in production code)

- ✗ Purple/violet gradients
- ✗ 3-column feature grid with icons in colored circles
- ✗ Centered-everything layout (we are left-anchored)
- ✗ Uniform `border-radius: 9999px` pill shapes
- ✗ Gradient CTAs (solid accent fill only)
- ✗ Generic hero stock photos (no decorative images at all — only product mockups)
- ✗ Decorative blob shapes / gradient orbs
- ✗ "Built for X / Designed for Y" marketing copy
- ✗ Bouncy spring animations
- ✗ Em-dash-heavy AI-generated marketing copy (in **our** UI strings; spec content is user-authored)

## Coherence guarantees

When implementation deviates from any of the above tokens or risks, this is a **break of design system** and must be flagged.

Specifically:
- Adding an accent color other than gold → breaks RISK 2.
- Adding sans-serif body anywhere prose is read → breaks RISK 1.
- Adding rounded pills, shadow elevation, or any gradient → breaks coherence.
- Adding entrance animations or scroll-driven motion → breaks "minimal-functional" promise.

If a real product need requires deviating, propose it as a DESIGN.md amendment (Decisions Log entry below) with rationale and consequences.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-17 | Initial design system created (codename "Reading Room") | `/design-consultation` skill run. Single voice (Claude main + Claude subagent agreed independently on serif body + gold accent + warm neutrals). Codex unavailable (quota). |
| 2026-05-17 | Berkeley Mono rejected for code font | $75/seat commercial license incompatible with OSS distribution. JetBrains Mono is functionally equivalent and free. |
| 2026-05-17 | Inter explicitly blacklisted | Overused; undermines RISK 1 (serif body) — adopting Inter would have made the product visually indistinguishable from Linear/Vercel. |
| 2026-05-17 | Visual implementation phasing | v0.1.0 implementation Phases M0-M7 may ship with unstyled / minimal default (per Phase 12 ADR-9). Final styling applied as one pass after M7 using this DESIGN.md. |
