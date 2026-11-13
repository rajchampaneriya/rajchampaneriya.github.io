# rajc.work — Technical Solutions & Thought Leadership

Technical Solution Architect for High-Stakes Transformations — Architecture That Protects Careers and Accelerates Transformations

Hugo site deployed to GitHub Pages. Built with the Frontier theme.

## Quick Start

```bash
# Install Hugo (macOS)
brew install hugo

# Dev server
cd hugo-site && hugo server -D

# Production build
cd hugo-site && hugo --gc --minify
```

## Content Structure

- **Blog**: `hugo-site/content/blog/YYYY/MM/slug.md`
- **Projects**: `hugo-site/content/projects/slug/_index.md`
- **Categories**: Point of View, Architecture Work, Technical Concepts, Technology, Experience, Industry Experience
- **Work hub**: posts and projects are listed together on `/work/`, filtered by kind (case studies, builds, points of view, deep dives, industry notes). `/blog/` and `/projects/` redirect there.

## Stack

- **Hugo** 0.154.5 with Dart Sass
- **Frontier** theme (git submodule)
- **Deploy**: GitHub Actions → `experiment/mobile-native` branch → GitHub Pages
- **Config**: `hugo-site/hugo.toml`
- **Custom CSS**: `hugo-site/assets/css/extended/`

## Links

- **Website**: [rajc.work](https://rajc.work/)
- **GitHub**: [github.com/rajchampaneriya](https://github.com/rajchampaneriya)
- **LinkedIn**: [linkedin.com/in/rajchampaneriya](https://linkedin.com/in/rajchampaneriya)

## License

Content is © Raj Champaneriya. All opinions expressed are my own.
