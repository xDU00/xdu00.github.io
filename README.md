# xDU0 blog

Static blog, no framework. One build script turns Markdown into plain HTML.

## Write a post
1. Drop a `.md` file in `content/posts/` (images go in `content/posts/img/`).
2. Frontmatter:
   ```yaml
   ---
   title: My Lab Writeup
   published: 2026-10-24
   description: One-line summary shown on the home page.
   cover: "./img/my-cover.png"      # optional, local file
   tags: [DFIR, HTB]
   category: HTB Sherlocks          # groups posts on /writeups/
   sourceLink: "https://..."        # optional "Challenge ↗" link
   draft: false
   ---
   ```
3. `npm run dev`: builds and opens http://localhost:4321

Art: drop images in `content/art/` (the file name becomes the caption).
About page: `content/about.md`. Site name, bio and links are in `SITE` at the top of `build.mjs`.
Design: `src/style.css`. Tiny client script: `src/site.js`.

## Deploy
From this folder, in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 "Describe your change"
```

It copies this folder into github.com/xDU00/xdu00.github.io (without `node_modules` and `dist`), commits and pushes.
GitHub Actions (`.github/workflows/deploy.yml`) then builds the site and publishes it to https://xdu00.github.io.
Repo → Settings → Pages → Source must be **GitHub Actions**.

## Why it's fast
- Plain static HTML, CSS inlined, no web fonts (Georgia/Arial/system mono), ~8–12 KB gzipped per page
- All images converted to WebP at 2 sizes with `srcset`, explicit width/height (zero layout shift), lazy-loaded
- Syntax highlighting done at build time, so no highlighter JS ships
- Speculation Rules prerender links on hover (Chrome/Edge), so clicks open instantly; prefetch fallback elsewhere
- Cross-page View Transitions for smooth navigation
