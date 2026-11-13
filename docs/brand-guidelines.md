# Visual Brand Guidelines — rajc.work

**Purpose:** Define premium visual identity for elite forward deployed engineer positioning.

## Brand Positioning

rajc.work is the digital presence of a Forward Deployed Engineer who embeds with Fortune 500 teams, from ambiguous brief to production. The visual identity must communicate:
- **Authority** — Commanding, not decorative
- **Premium** — Consulting-grade, not weekend-project
- **Trust** — Institutional credibility, not personal flair
- **Clarity** — Enterprise-grade information hierarchy

## Style architecture

- **Theme (global):** Styles that define the look and layout of the site live in `themes/frontier/assets/css/` — `variables.css` (design tokens), `main.css` (base and components), `critical.css` (inlined above-the-fold).
- **Site overrides:** Feature-specific and site-level overrides live in `assets/css/extended/`. Files are concatenated in alphabetical order; avoid same-specificity overrides across files so cascade remains predictable.
- **Tokens:** Prefer design tokens from `variables.css` for color, spacing, radius, shadow, transition, z-index, and focus/selection; avoid new magic numbers for spacing, color, or z-index.
- **No inline styles:** Keep presentation in CSS; use classes and tokens.

## Color System

### Light Mode — "Executive Clarity"

| Token | Value | Usage |
|-------|-------|-------|
| `--color-brand` | `hsl(215, 65%, 38%)` | Primary brand — Deep Strategic Blue |
| `--color-brand-dim` | `hsl(215, 40%, 55%)` | Muted brand for secondary elements |
| `--color-brand-dark` | `hsl(215, 65%, 32%)` | Darker brand for hover/active (buttons, links) |
| `--color-brand-glow` | `hsla(215, 65%, 38%, 0.12)` | Brand glow/shadow |
| `--color-bg` | `hsl(220, 20%, 98%)` | Page background — Cool Paper (harmonized with surface) |
| `--color-surface` | `hsl(220, 20%, 100%)` | Card/surface — Near White |
| `--color-surface-glass` | `hsla(220, 20%, 99%, 0.88)` | Glass panel |
| `--color-surface-elevated` | `hsl(220, 20%, 95%)` | Raised panels, dropdowns |
| `--color-text-main` | `hsl(220, 30%, 12%)` | Primary text — Near Black |
| `--color-text-muted` | `hsl(220, 10%, 42%)` | Secondary text — Slate (descriptions, body secondary) |
| `--color-text-meta` | `hsl(220, 10%, 52%)` | Meta — dates, labels, category pill text (tertiary hierarchy) |
| `--color-heading` | `var(--color-brand)` | Section and card titles — single accent |
| `--color-pill-bg` | `hsla(220, 20%, 94%, 0.9)` | Category/label pill background |
| `--color-pill-border` | `hsla(220, 30%, 12%, 0.06)` | Category/label pill border |
| `--color-border` | `hsla(220, 30%, 12%, 0.08)` | Borders |
| `--color-on-brand` | `hsl(0, 0%, 100%)` | Text on brand background (buttons, tags, badges) |
| `--color-accent-gold` | `hsl(42, 85%, 55%)` | Accent Gold — Premium highlight |

**Borders:** Use `--color-border` as the canonical token. The alias `--border` exists in `variables.css` for legacy compatibility only; prefer `--color-border` in new and updated CSS.

### Dark Mode — "Boardroom After Hours"

| Token | Value | Usage |
|-------|-------|-------|
| `--color-brand` | `hsl(215, 75%, 65%)` | Strategic Blue — lighter for contrast |
| `--color-brand-dim` | `hsl(215, 50%, 50%)` | Muted brand |
| `--color-brand-dark` | `hsl(215, 75%, 55%)` | Darker brand for hover/active |
| `--color-brand-glow` | `hsla(215, 75%, 65%, 0.18)` | Brand glow |
| `--color-bg` | `hsl(220, 25%, 7%)` | Deep Navy/Charcoal |
| `--color-surface` | `hsl(220, 20%, 11%)` | Card surface |
| `--color-surface-glass` | `hsla(220, 20%, 11%, 0.85)` | Glass panel |
| `--color-surface-elevated` | `hsl(220, 20%, 14%)` | Raised panels |
| `--color-text-main` | `hsl(220, 20%, 94%)` | Light text |
| `--color-text-muted` | `hsl(220, 12%, 65%)` | Muted light text (descriptions) |
| `--color-text-meta` | `hsl(220, 12%, 72%)` | Meta — dates, labels (tertiary in dark) |
| `--color-pill-bg` | `hsla(220, 20%, 18%, 0.5)` | Category/label pill background |
| `--color-pill-border` | `hsla(220, 20%, 94%, 0.08)` | Category/label pill border |
| `--color-border` | `hsla(220, 20%, 94%, 0.08)` | Borders |
| `--color-on-brand` | `hsl(0, 0%, 100%)` | Text on brand background |
| `--color-accent-gold` | `hsl(42, 80%, 60%)` | Warm Gold accent |

### Legacy enterprise token mapping

Enterprise tokens derive from Frontier; prefer `--color-*`, `--text-*`, `--space-*` for new work. For brand/CTAs use `--color-brand`, `--color-brand-dim`, `--color-on-brand` — not `--primary`/`--secondary`.

| Enterprise token | Maps to Frontier token | Note |
|------------------|------------------------|------|
| `--theme`        | `var(--color-bg)`      | Page background |
| `--entry`        | `var(--color-surface)` | Card / surface |
| `--primary`      | `var(--color-text-main)` | Primary text |
| `--secondary`    | `var(--color-text-muted)` | Muted text |
| `--tertiary`     | `var(--color-border)`  | Borders |
| `--content`      | `var(--color-text-main)` | Post content |
| `--hljs-bg`      | `var(--code-bg)`       | Code block bg |
| `--link`         | `var(--color-brand)`   | Brand/link color |
| `--link-hover`   | `var(--color-brand-dim)` | Hover color |
| `--blue-bg`      | `var(--color-brand-glow)` | Badge/pill tint |
| `--blue-border`  | `var(--color-brand-glow)` | Badge border (use sparingly) |

Prefer Frontier tokens; add new tokens only in `variables.css`.

### Overlay & Backdrop tokens

| Token | Default | Usage |
|-------|---------|-------|
| `--overlay-backdrop-strength` | `0.85` | Global alpha (0–1) used by fullscreen/backdrop overlays (dialogs, Mermaid fullscreen). Tune for perceived depth; recommended range: 0.70–0.95. |
| `--overlay-bg` | `hsla(..., var(--overlay-backdrop-strength))` | Theme-aware overlay background — use `var(--overlay-bg)` for fullscreen overlays instead of hard-coded HSLA. |

Lower alpha = more translucency; higher = more focus on overlay content.

### Text and link roles

Use the semantic hierarchy so colors stay consistent:

| Role | Token | Use for |
|------|--------|--------|
| **Primary (accent)** | `--color-brand` / `--color-heading` | Section and card titles, CTAs, inline links, nav links, tags |
| **Secondary** | `--color-text-main` | Headings (when not using accent), body copy, primary labels |
| **Tertiary** | `--color-text-muted` | Descriptions, secondary paragraphs, captions |
| **Meta** | `--color-text-meta` | Dates, category labels, pill text, hints |
| **Link hover** | `--color-brand-dim` | Hover state for text links and footer/nav links |
| **Text on brand** | `--color-on-brand` | Button text when background is brand (e.g. primary button, tag hover) |

**Surfaces:** `--color-bg` (page), `--color-surface` (cards/panels); keep same hue family for a cohesive feel.

Do not use raw hex or `#fff` for “white on brand” — use `var(--color-on-brand)` so theme and future tweaks stay consistent.

### Hover and interactive states — rule set

Apply these rules consistently so link and button hovers are predictable across the site:

| Context | Default | Hover |
|--------|---------|--------|
| **Text links** (content, footer, cards) | `--color-brand` | `--color-brand-dim` |
| **Nav links** (header, bottom nav) | Muted or `--color-brand` when active | `--color-brand` (or `--color-text-main` for highlight-only) |
| **Buttons — primary** (brand fill) | Text `--color-on-brand` | Same text; background can use `--color-brand-dark` or `--color-brand-dim` |
| **Buttons — text/outline** | `--color-brand` | `--color-brand-dim` (or inverse) |
| **Scrollspy / TOC links** | Muted | `--color-brand` |

Do not use global `a:hover { opacity: 0.7 }`; use explicit color/background per context above. Use `--transition-fast/medium/slow` from `variables.css` for transitions; avoid raw values like `0.2s ease`.

## Typography

### Font Stack
- **Headings & Body**: Inter (400, 500, 600, 700, 800)
- **Monospace**: JetBrains Mono (400, 700)

### Type Scale (Fluid)
| Token | Size | Usage |
|-------|------|-------|
| `--text-3xl` | `clamp(2rem, 1.8rem + 1vw, 2.5rem)` | Hero headline |
| `--text-2xl` | `clamp(1.5rem, 1.35rem + 0.75vw, 2rem)` | Section titles |
| `--text-xl` | `clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)` | Card titles |
| `--text-lg` | `clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)` | Subtitles |
| `--text-base` | `clamp(1rem, 0.95rem + 0.25vw, 1.125rem)` | Body text |
| `--text-sm` | `clamp(0.875rem, 0.8rem + 0.375vw, 1rem)` | Meta text |
| `--text-xs` | `clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)` | Labels, badges |

**Heading style:** Weight 800 (h1), 700 (h2–h3), 600 (h4–h6); letter-spacing -0.03em (h1), -0.02em (h2–h3); line-height 1.1.

## Code Block Styling

### Syntax Highlighting
- Style: `monokai` base with custom overrides
- Background: Slightly warmer than pure dark (`hsl(220, 18%, 13%)`)
- Border: Subtle 1px border with `--color-border`
- Border-radius: 12px
- Padding: 1.25rem
- Line numbers: Optional, off by default
- Font: JetBrains Mono at 0.9em

### Language-Specific Colors (Dark code blocks)
| Element | Color | Hex |
|---------|-------|-----|
| Keywords | Electric Blue | `#66d9ef` |
| Strings | Soft Green | `#a6e22e` |
| Comments | Muted Gray | `#75715e` |
| Numbers | Purple | `#ae81ff` |
| Functions | Yellow | `#e6db74` |
| Variables | White | `#f8f8f2` |
| Operators | Red/Pink | `#f92672` |
| JSON Keys | Light Blue | `#66d9ef` |
| JSON Values (strings) | Green | `#a6e22e` |
| JSON Values (numbers) | Purple | `#ae81ff` |

## Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `--space-2xs` | `0.25rem` | Smallest gaps, tight padding |
| `--space-xs` | `0.5rem` | Tight gaps, badge padding |
| `--space-sm` | `1rem` | Card padding, small gaps |
| `--space-md` | `1.5rem` | Section gaps, card margins |
| `--space-lg` | `2.5rem` | Major section separation |
| `--space-xl` | `4rem` | Hero padding, page sections |
| `--space-2xl` | `6rem` | Large section separation |

Use only these tokens (and content tokens like `--content-padding-mobile`, `--home-padding-*`) for margins, padding, and gaps; avoid raw rem/px.

**Radius scale:** Use `--radius-xs` (6px), `--radius-sm` (8px), `--radius-md` (16px), `--radius-lg` (32px), `--radius-pill` (100px), `--radius-card` (10px for card-style panels), `--radius-2xs` (3px for tiny elements), and `--radius-scrollbar` (4px) from `variables.css`. Avoid hardcoded border-radius values.

**Font weight scale:** Use `--fw-normal` (400), `--fw-medium` (500), `--fw-semibold` (600), `--fw-bold` (700), `--fw-extrabold` (800) from `variables.css` instead of raw numbers. Heading weight remains `--font-weight-heading` (maps to `--fw-bold`).

**Opacity (icons/decorative only):** Use `--opacity-icon` (0.95), `--opacity-icon-muted` (0.7), `--opacity-muted` (0.6). Do not use opacity for body or label text; use `--color-text-muted` for hierarchy.

**Shadow elevation:** Use `--shadow-sm`, `--shadow-md`, `--shadow-lg` for depth; `--shadow-hover` for buttons and cards on hover (theme-aware).

**Z-index scale:** Use tokens from `variables.css` so stacking order is consistent: `--z-header` (50), `--z-chat` (101), `--z-nav` (1000), `--z-player` (1001), `--z-scroll-top` (1002), `--z-overlay` (2000), `--z-overlay-content` (2001), `--z-dialog` (10000). Avoid magic numbers.

**Focus and selection:** Use `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-width` for `:focus-visible`; use `--selection-bg` and `--selection-text` for `::selection`. See variables.css.

**Touch targets:** Use `--touch-target-min` (44px) for interactive elements (buttons, nav items, toggles) so they meet accessibility guidelines on touch devices.

**Blog cards:** Feed gap and card padding: `--space-md`; card radius: `--radius-md`; no border-bottom — use gap only.

## Component Patterns

### Glass Panel
```css
background: var(--color-surface-glass);
backdrop-filter: blur(16px);
border: 1px solid var(--color-border);
border-radius: 16px;
box-shadow: 0 2px 4px hsla(220, 20%, 10%, 0.05);
```

### Premium Buttons
- Primary: Brand fill, `--color-on-brand` text, pill shape (border-radius: 100px). Outline: Transparent background, brand border, brand text. Hover per "Hover and interactive states" table; optional subtle translateY(-1px) and box-shadow increase.

### Metric Cards
- Large number in brand color, bold; small muted label below; horizontal flex with even spacing.

### Certification Badges
- Tiny inline pills with check icon, brand glow background, subtle brand border; brand color text, uppercase, 0.62rem.

## Responsive Breakpoints

| Breakpoint | Target |
|-----------|--------|
| `max-width: 480px` | Small phones (iPhone SE) |
| `max-width: 768px` | Tablets/large phones |
| `max-width: 1024px` | Small laptops |
| Default | Desktop |

## Dark/Light Mode

Both modes must feel equally premium. Dark mode is NOT an afterthought — many executives browse in dark mode. Ensure:
- Adequate contrast ratios (WCAG AA minimum)
- Gold/blue accent colors adjusted for dark backgrounds
- Glass panel effects visible in both modes
- Code blocks consistent across modes

## Accessibility and contrast

- **Target ratios**: At least **4.5:1** for normal text, **3:1** for large text (WCAG AA). Prefer higher where possible.
- **Token pairs**: When defining text-on-background (e.g. about page accents), list the pair and verify contrast. All `--about-accent-*-text` / `-number` vs `-bg` pairs in `variables.css` should meet these targets.
- **Avoid opacity for body-like text**: Use muted tokens or accent variants instead of `opacity` for paragraph/label text so contrast is predictable.

**Further detail:** For a full audit of spacing, radii, hover states, and tokenization across the codebase, see [UI Architect Recommendations](UI-ARCHITECT-RECOMMENDATIONS.md). P2 (font-weight and mermaid tokenization) and P3 (deprecated stubs, border alias) are implemented.
