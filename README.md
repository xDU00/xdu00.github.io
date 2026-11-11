# xDU0 — Personal Blog

**🌐 [xdu00.github.io](https://xdu00.github.io)**

Hi, I'm **Hilmi Ouelhazi** (xDU0), a cybersecurity analyst, Master student and CTF player with [Phr34k$](https://ctftime.org/team/278448/).

This is my personal blog. I share my experiences, write-ups and personal achievements: CTF challenges, CyberDefenders labs, HTB Sherlocks and notes from the blue-team side of security.

## Write-ups

| Write-up | Category |
|---|---|
| [HTB Sherlock: Baggage](https://xdu00.github.io/posts/sherlock-writeup/) | HTB Sherlocks · Windows forensics |
| [Will AI Kill the SOC Analyst Job?](https://xdu00.github.io/posts/will-ai-kill-the-soc-analyst-job/) | Cybersecurity |
| [XLMRat Lab](https://xdu00.github.io/posts/xlmrat-lab-writeup/) | CyberDefenders · Network forensics |
| [Securinets ISGT Guided CTF](https://xdu00.github.io/posts/securinets-isgt-guided-ctf-writeups/) | CTF · Web, rev, OSINT |
| [HTB University CTF 2025 — Tinsel Trouble](https://xdu00.github.io/posts/htb-university-ctf-2025---pwn-1-writeup/) | CTF · Pwn |

More on the [blog](https://xdu00.github.io/blog/).

## On the site

- **[About](https://xdu00.github.io/)**: experience, education, projects, certificates and CTF achievements
- **[Blog](https://xdu00.github.io/blog/)**: all write-ups, filterable by category
- **[Art](https://xdu00.github.io/art/)**: sketches and paintings
- Light and night mode

## Connect

[GitHub](https://github.com/xDU00) · [LinkedIn](https://www.linkedin.com/in/hilmi-ouelhazi/) · [CTFtime](https://ctftime.org/team/278448/) · Discord `xduo28_`

---

<details>
<summary>How this site works</summary>

A small static site generator with no framework. `build.mjs` turns the Markdown in `content/` into plain HTML in `dist/`.

- **New post:** add a `.md` file to `content/posts/` (images in `content/posts/img/`) with front matter: `title`, `published`, `description`, `cover`, `tags`, `category`.
- **About page:** edit `content/about.md`.
- **Art:** drop images into `content/art/`.
- **Preview:** `npm install` once, then `npm run dev` → http://localhost:4321
- **Deploy:** run `deploy.cmd` (or `deploy.ps1`). It pushes to this repo, and GitHub Actions builds and publishes the site.

Fast by design: static HTML, inlined CSS, no web fonts, WebP images, build-time code highlighting and instant page prefetching.

</details>
