# rajc.work — Hugo Site

## Quick Reference

- **Stack**: Hugo + Frontier theme, deployed to GitHub Pages (`experiment/mobile-native` branch)
- **Config**: `hugo-site/hugo.toml`
- **Content root**: `hugo-site/content/`
- **Custom CSS**: `hugo-site/assets/css/extended/`
- **Theme layouts**: `hugo-site/themes/frontier/layouts/`
- **Site layouts**: `hugo-site/layouts/` (overrides theme)
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

- `/llms.txt` ([llmstxt.org](https://llmstxt.org) format) — profile facts from `params.premium`, projects, and blog posts grouped by category. Template: `hugo-site/layouts/_default/index.llms.txt`
- `/llms-full.txt` — full text of About, every project, and every published post as clean Markdown. Template: `hugo-site/layouts/_default/index.llmsfull.txt`
- Both regenerate on every build from front matter; drafts are excluded. A post's `summary` is its one-line description in both files, so keep summaries self-contained.
- Cleanup of raw HTML/shortcodes for llms-full.txt lives in `hugo-site/layouts/partials/llms/markdown.html` (code fences are left untouched). New shortcodes that take an `alt` should be added to its `[Image: …]` rule.
- New category: add its urlized name to the `$order` list in `index.llms.txt` to control placement (otherwise it's appended alphabetically).

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
