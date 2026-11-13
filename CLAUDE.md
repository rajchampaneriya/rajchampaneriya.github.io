# rajc.work — Hugo Site

## Quick Reference

- **Stack**: Hugo + Frontier theme, deployed to GitHub Pages (`experiment/mobile-native` branch)
- **Config**: `hugo-site/hugo.toml`
- **Content root**: `hugo-site/content/`
- **Custom CSS**: `hugo-site/assets/css/extended/`
- **Theme layouts**: `hugo-site/themes/frontier/layouts/`
- **Site layouts**: `hugo-site/layouts/` (overrides theme)
- **Everything a reader can open**: listed on `/work/` (posts and projects together); see "Work hub"
- **Home page scroll story**: see "Scroll story"
- **Build**: `cd hugo-site && hugo --gc --minify`
- **Dev server**: `cd hugo-site && hugo server -D`

## Adding Blog Articles

Create file at `hugo-site/content/blog/YYYY/MM/slug.md`:

```markdown
---
title: "Title Here"
date: YYYY-MM-DD
draft: false
tags: ["tag1", "tag2"]
categories: ["Category Name"]
summary: "One-line executive-accessible summary."
---

Content here.
```

**Categories**: `Point of View`, `Experience`, `Industry Experience`, `Architecture Work`, `Technical Concepts`, `Technology`

The category (plus the `case-study` tag) decides which filter the post appears under on `/work/`; see "Work hub".

**Rules**:
- Every post needs executive-accessible opening paragraph
- Titles should intrigue executives, not just practitioners
- Frame technical decisions as business outcomes (cost, risk, time, career impact)
- Quantify claims when possible

## Adding Projects

Create file at `hugo-site/content/projects/slug.md`:

```markdown
---
title: "Project Title"
date: YYYY-MM-DD
draft: false
slug: "slug"
tags: ["architecture", "tag"]
categories: ["Architecture Work"]
summary: "Business-outcome-framed description"
weight: 1
---

Content here.
```

## Work hub (`/work/`)

Posts (`/blog/...`) and projects (`/projects/...`) keep their own URLs but are listed together on `/work/`, organised by what the reader came for. `/blog/`, `/projects/` and the old month pages redirect there (`layout: "work-redirect"`), carrying `?tag=` along.

- **Kinds** (the filter chips) are defined once in `hugo-site/layouts/partials/work/kinds.html` and assigned by `partials/work/kind.html`:

  | Kind (`?kind=`) | A page lands here when |
  |---|---|
  | Industry notes (`industry`) | a category starts with "Industry" |
  | Builds (`build`) | it lives under `content/projects/` |
  | Case studies (`case-study`) | tag `case-study`, or category `Architecture Work` / `Architecture Strategy` |
  | Points of view (`pov`) | category `Point of View` or `Experience` |
  | Deep dives (`deep-dive`) | anything else (`Technical Concepts`, `Technology`, ...) |

  Set `kind: "<key>"` in front matter to override.
- **Series**: posts that share `series: ["Name"]` get "Part N of M" navigation. If a project page declares the same `series`, it becomes the series' home; with 4+ parts the series is folded into that one card on `/work/` (the parts still turn up in search and topic filters).
- **Shareable filters**: `/work/?kind=build`, `/work/?tag=architecture`, `/work/?q=migration`. Tag links on articles and the tag/category/series pages point here.
- **Files**: `layouts/section/work.html`, `layouts/partials/work/*.html`, `themes/frontier/assets/js/work-hub.js`, `assets/css/extended/work-hub.css`. Site search (`index.json`) and `llms.txt` use the same collection.
- **Tests**: `hugo-site/tests/work-hub.spec.js`, `hugo-site/tests/care-story.spec.js` (Playwright, Given/When/Then).

## Scroll story (home page)

The CARE section on the home page is a scroll-driven canvas story: copy steps scroll past a pinned stage. Scroll picks a keyframe, a playhead travels toward it, and the canvas is drawn as a function of the playhead (so scrolling up rewinds it). Read the header comment in `themes/frontier/assets/js/care-story.js` before changing it.

- **CARE copy**: `[params.care]` in `hugo.toml` (question, intro, outro, and the four steps).
- **"CARE in the field" steps**: any post or project with a `story:` block, ordered by `order`, at most four:

  ```yaml
  story:
    order: 1
    title: "Short title for the stage card"      # optional, defaults to the page title
    metric: "99.95%"                             # the headline figure; must come from the page itself
    metricLabel: "uptime held through a zero-downtime cutover"
    care:                                        # optional; one line per move, lights up C·A·R·E on the card
      clarity: "..."
      alignment: "..."
      reality: "..."
      execution: "..."
  ```
- **Files**: `layouts/partials/care-story.html`, `themes/frontier/assets/js/care-story.js`, `assets/css/extended/care-story.css`.
- **Tuning**: open `/?story=debug` to see the reading line, step position, goal keyframe and playhead live.
- Features that live inside `#swup` must start from `app.js` on `DOMContentLoaded` and on Swup's `page:view` (inline scripts in swapped content do not run), and clean up after themselves.

## Brand & Voice

- **Positioning**: Technical Solution Architect for Fortune 500 high-stakes transformations
- **Tone**: Executive-grade, authoritative, quantified
- **Methodology**: "The CARE Architecture Method" (Clarity, Alignment, Reality, Execution)
- **Audience**: CTOs, VPs of Engineering — not junior devs
- **Key metrics**: 13+ years, 4 Fortune 500 industries, $8M+ modernizations, 99.95% uptime
- **Industries**: Healthcare, Property Insurance, Media & Entertainment, Logistics

## Design Standards

- Premium feel: McKinsey/BCG tier, not weekend project
- Color palette: Deep navy/slate, strategic blue/gold accents
- Glassmorphism UI patterns (Frontier theme)
- Light + dark mode, both premium
- Proper syntax highlighting (monokai style)
- Mobile-first responsive

## Search

Search page at `hugo-site/content/search.md` uses `layout: "search"`. JSON output enabled in config (`home = ["HTML", "RSS", "JSON", "llms", "llmsfull"]`).

## llms.txt (AI agents)

- `/llms.txt` ([llmstxt.org](https://llmstxt.org) format) — profile facts from `params.premium`, then posts and projects grouped by the same kinds as `/work/`. Template: `hugo-site/layouts/_default/index.llms.txt`
- `/llms-full.txt` — full text of About, every project, and every published post as clean Markdown. Template: `hugo-site/layouts/_default/index.llmsfull.txt`
- Both regenerate on every build from front matter; drafts are excluded. A post's `summary` is its one-line description in both files, so keep summaries self-contained.
- Cleanup of raw HTML/shortcodes for llms-full.txt lives in `hugo-site/layouts/partials/llms/markdown.html` (code fences are left untouched). New shortcodes that take an `alt` should be added to its `[Image: …]` rule.
- Grouping follows `partials/work/kinds.html`; a new category only needs a line in `partials/work/kind.html` if it should map to something other than Deep dives.

## Content Categories (Priority Order)

1. **Point of View** — Contrarian thought-leadership takes (primary content type)
2. **Architecture Work** — Case studies with business outcome framing
3. **Technical Concepts** — Deep dives with executive summaries
4. **Technology** — Evaluations framed through enterprise lens

## Shortcodes Available

- `{{< tldr >}}...{{< /tldr >}}` — Summary callout box
- Mermaid diagrams supported

## Branch & Deploy

- Workflow: `.github/workflows/hugo.yml`
- Triggers on push to `experiment/mobile-native`
- Hugo 0.154.5, Dart Sass
- Submodules: recursive (Frontier theme)
