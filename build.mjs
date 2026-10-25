// xDU0 blog — tiny static site generator. `npm run build` → ./dist
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { Marked } from "marked";
import hljs from "highlight.js";
import sharp from "sharp";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const C = (...p) => path.join(ROOT, "content", ...p);
const OUT = path.join(ROOT, "dist");

const SITE = {
  url: "https://xdu00.github.io",
  title: "xDU0",
  tagline: "Cybersecurity Notes and CTF Writeups",
  description: "CTF writeups, DFIR notes, and blue team practice by xDU0.",
  author: "xDU0",
  bio: "Cybersecurity Student | DFIR & Blue Team | CTF Player",
  links: [
    ["GitHub", "https://github.com/xDU00"],
    ["LinkedIn", "https://www.linkedin.com/in/hilmi-ouelhazi/"],
  ],
};
const NAV = [
  ["About", "/"],
  ["Blog", "/blog/"],
  ["Art", "/art/"],
];

/* ---------- helpers ---------- */
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const slugify = (s) => String(s).toLowerCase().trim().replace(/<[^>]+>/g, "").replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s/g, "-");
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (d) => `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const isoDate = (d) => d.toISOString().slice(0, 10);
const stripTags = (h) => h.replace(/<[^>]+>/g, "");
const write = async (rel, data) => {
  const f = path.join(OUT, rel);
  await fs.mkdir(path.dirname(f), { recursive: true });
  await fs.writeFile(f, data);
};

// Repair UTF-8 text that was saved through a Windows-1252 decode ("â€”" → "—").
const CP1252 = { 0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f };
function fixMojibake(text) {
  if (!/[âÃð][\u0080-ÿŒ-™]/.test(text)) return text;
  return text.replace(/[Â-ô][\u0080-¿Œ-™�]{1,3}/g, (m) => {
    const bytes = [];
    for (const ch of m) {
      const cp = ch.codePointAt(0);
      if (cp < 0x100) bytes.push(cp);
      else if (CP1252[cp]) bytes.push(CP1252[cp]);
      else return m;
    }
    const s = Buffer.from(bytes).toString("utf8");
    return s.includes("�") ? m : s;
  });
}

/* ---------- images ---------- */
const imgJobs = new Map(); // outRel -> job
const imgMeta = new Map();
async function image(srcAbs, outBase, widths = [760, 1480]) {
  const key = outBase;
  if (imgMeta.has(key)) return imgMeta.get(key);
  const meta = await sharp(srcAbs).metadata();
  const w0 = meta.width, h0 = meta.height;
  const ws = [...new Set(widths.map((w) => Math.min(w, w0)))].sort((a, b) => a - b);
  const variants = ws.map((w) => ({ w, h: Math.round((h0 * w) / w0), rel: `${outBase}-${w}.webp` }));
  for (const v of variants) imgJobs.set(v.rel, { src: srcAbs, ...v });
  const big = variants.at(-1);
  const res = { src: "/" + big.rel, w: big.w, h: big.h, srcset: variants.map((v) => `/${v.rel} ${v.w}w`).join(", "), variants };
  imgMeta.set(key, res);
  return res;
}
async function runImageJobs() {
  const jobs = [...imgJobs.values()];
  let i = 0;
  const worker = async () => {
    while (i < jobs.length) {
      const j = jobs[i++];
      const out = path.join(OUT, j.rel);
      if (existsSync(out)) continue;
      await fs.mkdir(path.dirname(out), { recursive: true });
      await sharp(j.src).resize({ width: j.w, withoutEnlargement: true }).webp({ quality: 80, effort: 5 }).toFile(out);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
}
const imgTag = (im, alt, { sizes = "(max-width: 760px) 100vw, 740px", eager = false, cls = "" } = {}) =>
  `<img src="${im.src}" srcset="${im.srcset}" sizes="${sizes}" width="${im.w}" height="${im.h}" alt="${esc(alt)}"${cls ? ` class="${cls}"` : ""} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;

/* ---------- markdown ---------- */
function makeMarked(ctx) {
  const m = new Marked({ gfm: true, breaks: false });
  m.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        let level = depth + ctx.shift;
        if (level > 6) level = 6;
        let id = slugify(stripTags(html)) || "section";
        const n = ctx.ids.get(id) || 0;
        ctx.ids.set(id, n + 1);
        if (n) id += "-" + n;
        if (level === 2) ctx.toc.push({ id, text: stripTags(html).replace(/&amp;/g, "&") });
        const anchor = level <= 3 ? `<a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>` : "";
        return `<h${level} id="${id}">${html}${anchor}</h${level}>\n`;
      },
      code({ text, lang }) {
        const l = (lang || "").split(/\s+/)[0].toLowerCase();
        let body;
        if (l && hljs.getLanguage(l)) body = hljs.highlight(text, { language: l, ignoreIllegals: true }).value;
        else body = esc(text);
        const label = l && l !== "text" && l !== "txt" ? ` data-lang="${esc(l)}"` : "";
        return `<pre${label}><code>${body}</code></pre>\n`;
      },
      image({ href, title, text }) {
        const im = ctx.images.get(href);
        if (!im) return `<img src="${esc(href)}" alt="${esc(text)}" loading="lazy" decoding="async">`;
        return `<img data-fig="1" src="${im.src}" srcset="${im.srcset}" sizes="(max-width: 760px) 100vw, 740px" width="${im.w}" height="${im.h}" alt="${esc(text)}" loading="lazy" decoding="async">`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const ext = /^https?:\/\//.test(href) && !href.startsWith(SITE.url);
        return `<a href="${esc(href)}"${title ? ` title="${esc(title)}"` : ""}${ext ? ' rel="noopener" target="_blank"' : ""}>${text}</a>`;
      },
    },
  });
  return m;
}
// Paragraphs that only hold one image become <figure> with a click-to-zoom link.
function figures(html) {
  return html.replace(/<p>\s*(<img data-fig="1"[^>]*>)\s*<\/p>/g, (_, img) => {
    const src = img.match(/ src="([^"]+)"/)[1];
    const alt = (img.match(/ alt="([^"]*)"/) || [])[1] || "";
    const cap = alt && !/^(alt text|image|img|screenshot)$/i.test(alt) ? `<figcaption>${alt}</figcaption>` : "";
    return `<figure><a href="${src}" target="_blank" rel="noopener">${img}</a>${cap}</figure>`;
  }).replace(/ data-fig="1"/g, "")
    .replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, "</table></div>");
}

/* ---------- layout ---------- */
const CSS = (await fs.readFile(path.join(ROOT, "src/style.css"), "utf8")).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n+/g, "");
const JS = (await fs.readFile(path.join(ROOT, "src/site.js"), "utf8")).replace(/^\s*\/\/.*$/gm, "").replace(/\n\s*/g, "\n").trim();

function masthead(current) {
  return `<header class="masthead">
  <a class="wordmark" href="/" aria-label="xDU0 home">xDU<span>0</span></a>
  <div class="mast-right"><nav class="nav" aria-label="Site">${NAV.map(([n, u]) => `<a href="${u}"${current === u ? ' aria-current="page"' : ""}>${n}</a>`).join("")}<a href="${SITE.links[0][1]}" rel="noopener" target="_blank">GitHub ↗</a></nav><button class="theme-toggle" type="button" aria-label="Switch to night mode" title="Toggle night mode"><svg viewBox="0 0 24 24" aria-hidden="true"><mask id="moon-cut"><rect width="24" height="24" fill="#fff"/><circle class="cut" cx="30" cy="0" r="7" fill="#000"/></mask><circle class="core" cx="12" cy="12" r="5" fill="currentColor" mask="url(#moon-cut)"/><g class="rays" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1.5v2M12 20.5v2M1.5 12h2M20.5 12h2M4.6 4.6 6 6M18 18l1.4 1.4M4.6 19.4 6 18M18 6l1.4-1.4"/></g></svg></button></div>
</header>`;
}
function footer() {
  return `<footer class="site-footer"><a class="wordmark" href="/">xDU<span>0</span></a><nav>${SITE.links.map(([n, u]) => `<a href="${u}" rel="noopener" target="_blank">${n} ↗</a>`).join("")}<a href="/rss.xml">RSS</a><a href="#top">Back to the beginning ↑</a></nav></footer>`;
}
function page({ title, description, url, current, body, image, type = "website", preload }) {
  const full = title ? `${title} — ${SITE.title}` : `${SITE.title} — ${SITE.tagline}`;
  const canonical = SITE.url + url;
  return `<!doctype html>
<html lang="en" id="top">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description || SITE.description)}">
<meta name="theme-color" content="#f4f0e7">
<script>try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="alternate" type="application/rss+xml" title="${SITE.title}" href="/rss.xml">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title || SITE.title)}">
<meta property="og:description" content="${esc(description || SITE.description)}">
<meta property="og:url" content="${canonical}">
${image ? `<meta property="og:image" content="${SITE.url}${image}">\n<meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">'}
${preload || ""}<style>${CSS}</style>
<script type="speculationrules">{"prerender":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":"/*.*"}}]},"eagerness":"moderate"}]}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${masthead(current)}
<main id="main">
${body}
</main>
${footer()}
<script>${JS}</script>
</body>
</html>`;
}

/* ---------- load content ---------- */
async function loadPosts() {
  const dir = C("posts");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md"));
  const posts = [];
  for (const f of files) {
    const raw = fixMojibake(await fs.readFile(path.join(dir, f), "utf8"));
    const { data, content } = matter(raw);
    if (data.draft) continue;
    const slug = slugify(f.replace(/\.md$/, ""));
    const ctx = { shift: 0, ids: new Map(), toc: [], images: new Map() };

    // headings: drop a lone duplicate H1 title; shift when the body uses several H1 sections
    const lines = content.split("\n");
    let inFence = false;
    const h1 = [];
    lines.forEach((l, i) => {
      if (/^\s*```/.test(l)) inFence = !inFence;
      else if (!inFence && /^# /.test(l)) h1.push(i);
    });
    if (h1.length === 1) lines.splice(h1[0], 1);
    else if (h1.length > 1) ctx.shift = 1;
    let md = lines.join("\n");

    // images
    const refs = new Set();
    md.replace(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, src) => refs.add(src));
    for (const src of refs) {
      if (/^https?:/.test(src)) continue;
      const abs = path.join(dir, decodeURI(src));
      if (!existsSync(abs)) { console.warn("missing image", f, src); continue; }
      const base = `img/${slug}/${slugify(path.basename(src).replace(/\.[^.]+$/, ""))}`;
      ctx.images.set(src, await image(abs, base));
    }
    // cover: local file, else first local image in the post
    let cover = null;
    const coverSrc = data.cover || data.image;
    if (coverSrc && !/^https?:/.test(coverSrc) && existsSync(path.join(dir, coverSrc))) {
      cover = await image(path.join(dir, coverSrc), `img/${slug}/_cover`, [760, 1060, 2120]);
    } else if (ctx.images.size) {
      const [firstSrc] = ctx.images.keys();
      cover = await image(path.join(dir, decodeURI(firstSrc)), `img/${slug}/_cover`, [760, 1060, 2120]);
      // the image is now the cover; drop it from the top of the body so it isn't shown twice
      const lead = md.match(/^\s*!\[[^\]]*\]\(([^)\s]+)\)\s*\n/);
      if (lead && lead[1] === firstSrc) md = md.slice(lead[0].length);
    }

    const html = figures(makeMarked(ctx).parse(md));
    const words = stripTags(html).split(/\s+/).filter(Boolean).length;
    const date = new Date(data.published);
    posts.push({
      slug, url: `/posts/${slug}/`, title: data.title, description: data.description || "", date,
      tags: data.tags || [], category: data.category || "Notes", sourceLink: data.sourceLink,
      html, toc: ctx.toc, cover, minutes: Math.max(1, Math.round(words / 220)),
    });
  }
  return posts.sort((a, b) => b.date - a.date);
}

/* ---------- title emphasis like the reference h1 ---------- */
function emTitle(t) {
  const m = t.match(/^(.*?)(:|\s[-–—]\s)(.+)$/);
  if (m) return `${esc(m[1])}${esc(m[2])}<em>${esc(m[3])}</em>`;
  const w = t.split(" ");
  if (w.length < 4) return `<em>${esc(t)}</em>`;
  const k = Math.ceil(w.length / 2);
  return `${esc(w.slice(0, k).join(" "))} <em>${esc(w.slice(k).join(" "))}</em>`;
}
const catSlug = (c) => slugify(c);
const tagSlug = (t) => slugify(t);

/* ---------- pages ---------- */
function homePage(posts) {
  const cats = [...new Set(posts.map((p) => p.category))];
  const rows = posts.map((p, i) => `<li class="post-row" data-cat="${esc(catSlug(p.category))}">
  <a class="thumb" href="${p.url}" tabindex="-1" aria-hidden="true">${p.cover ? imgTag(p.cover, "", { sizes: "(max-width: 760px) 100vw, 260px", eager: i < 2 }) : ""}</a>
  <div><p class="meta"><time datetime="${isoDate(p.date)}">${fmtDate(p.date)}</time> · ${esc(p.category)} · ${p.minutes} min</p>
  <h2><a href="${p.url}">${esc(p.title)}</a></h2>
  <p class="desc">${esc(p.description)}</p></div>
</li>`).join("\n");
  const body = `<section class="cold-open slim">
  <p class="kicker">Blog · ${posts.length} posts</p>
  <h1 id="opening">Write-ups <em>&amp; notes</em></h1>
  <nav class="filters" aria-label="Filter by category"><button type="button" data-filter="all" aria-pressed="true">All</button>${cats.map((c) => `<button type="button" data-filter="${esc(catSlug(c))}" aria-pressed="false">${esc(c)}</button>`).join("")}</nav>
</section>
<div class="column"><ol class="post-list">${rows}</ol></div>`;
  return page({ title: "Blog", description: "CTF writeups, DFIR notes and blue team practice by xDU0.", url: "/blog/", current: "/blog/", body, image: posts[0]?.cover?.src });
}
function entry(p) {
  return `<li><time datetime="${isoDate(p.date)}">${fmtDate(p.date)} · ${esc(p.category)}</time><a class="title" href="${p.url}">${esc(p.title)}</a><p>${esc(p.description)}</p></li>`;
}
function tagCloud(posts) {
  const m = new Map();
  posts.forEach((p) => p.tags.forEach((t) => m.set(t, (m.get(t) || 0) + 1)));
  const tags = [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return { count: tags.length, tags, html: `<div class="tag-cloud">${tags.map(([t, c]) => `<a href="/archive/#tag-${tagSlug(t)}">#${esc(t)}<sup>${c}</sup></a>`).join("")}</div>` };
}

function postPage(p, prev, next) {
  const tocNav = p.toc.length
    ? `<aside class="contents" aria-label="In this write-up"><p>In this write-up</p><nav>${p.toc.map((t) => `<a href="#${t.id}">${esc(t.text)}</a>`).join("")}</nav></aside>`
    : `<aside class="contents" aria-label="Entry"><p>${esc(p.category)}</p><nav><a href="/blog/">← All entries</a></nav></aside>`;
  const body = `<section class="cold-open" aria-labelledby="opening">
  <p class="kicker"><a href="/blog/">← Blog</a> · ${esc(p.category)} · <time datetime="${isoDate(p.date)}">${fmtDate(p.date)}</time> · ${p.minutes} min read</p>
  <h1 id="opening">${emTitle(p.title)}</h1>
  <p class="identifiers">${p.tags.map((t) => `<a href="/archive/#tag-${tagSlug(t)}">#${esc(t)}</a>`).join("")}${p.sourceLink ? `<a class="rating" href="${esc(p.sourceLink)}" rel="noopener" target="_blank">Challenge ↗</a>` : ""}</p>
  ${p.description ? `<p class="lede">${esc(p.description)}</p>` : ""}
</section>
<div class="writeup-shell tight" id="writeup">
  ${tocNav}
  <article class="prose" aria-label="${esc(p.title)}">
${p.cover ? `<figure class="post-cover">${imgTag(p.cover, p.title, { sizes: "(max-width: 760px) 100vw, 740px", eager: true })}</figure>` : ""}
${p.html}
  <div class="closing">
    <p>Written by <a href="/">${SITE.author}</a> · ${fmtDate(p.date)}</p>
    <nav class="pager" aria-label="More entries">${next ? `<a href="${next.url}"><small>← Newer</small>${esc(next.title)}</a>` : "<span></span>"}${prev ? `<a class="next" href="${prev.url}"><small>Older →</small>${esc(prev.title)}</a>` : ""}</nav>
  </div>
  </article>
</div>`;
  const preload = p.cover ? `<link rel="preload" as="image" imagesrcset="${p.cover.srcset}" imagesizes="(max-width: 760px) 100vw, 740px">\n` : "";
  return page({ title: p.title, description: p.description, url: p.url, body, image: p.cover?.src, type: "article", preload });
}


function archivePage(posts) {
  const years = [...new Set(posts.map((p) => p.date.getUTCFullYear()))];
  const tc = tagCloud(posts);
  const byTag = tc.tags.map(([t]) => `<h3 id="tag-${tagSlug(t)}">#${esc(t)}</h3><ol class="entries">${posts.filter((p) => p.tags.includes(t)).map(entry).join("")}</ol>`).join("");
  const body = `<section class="cold-open">
  <p class="kicker">Archive</p>
  <h1 id="opening">Everything, <em>in order</em></h1>
  ${tc.html}
</section>
<div class="writeup-shell" style="padding-top:24px">
  <aside class="contents"><p>Years</p><nav>${years.map((y) => `<a href="#y${y}">${y}</a>`).join("")}<a href="#tags">Tags</a></nav></aside>
  <article class="prose">${years.map((y) => `<h2 id="y${y}">${y}</h2><ol class="entries">${posts.filter((p) => p.date.getUTCFullYear() === y).map(entry).join("")}</ol>`).join("")}
  <h2 id="tags">Tags</h2>${byTag}</article>
</div>`;
  return page({ title: "Archive", description: "All posts by xDU0, by year and tag.", url: "/archive/", current: "/archive/", body });
}

async function loadArt() {
  const files = (await fs.readdir(C("art"))).filter((f) => /\.(png|jpe?g|webp|gif|avif)$/i.test(f)).sort();
  const items = [];
  for (const f of files) {
    const name = f.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
    const im = await image(C("art", f), `img/art/${slugify(name)}`, [640, 1800]);
    items.push({ name, im });
  }
  return items;
}
const thumb = (im) => ({ ...im, src: "/" + im.variants[0].rel });

// Home page = About. All text lives in content/about.md.
async function aboutPage(posts) {
  const { data: a } = matter(await fs.readFile(C("about.md"), "utf8"));
  const md = new Marked({ gfm: true });
  const il = (s = "") => md.parseInline(String(s));
  const ext = (u) => (/^https?:/.test(u) ? ' rel="noopener" target="_blank"' : "");
  const av = await image(C("avatar.jpg"), "img/me", [192]);
  const parts = [];
  if (a.doing) parts.push(`<h2>What I do</h2><div class="doing">${a.doing.map((d) => `<div><strong>${il(String(d.lead).replace(/\.$/, ""))}</strong><span>${il(d.text)}</span></div>`).join("")}</div>`);
  if (a.experience) parts.push(`<h2>Experience</h2><ol class="xp">${a.experience.map((x) => `<li>
  <div class="xp-when"><span>${esc(x.dates)}</span></div>
  <div class="xp-card"><span class="xp-logo" aria-hidden="true">${esc(String(x.org).replace(/[^A-Za-z0-9]/g, "").slice(0, 1).toUpperCase())}</span>
    <div class="xp-main"><h3>${il(x.role)}</h3><p class="xp-org">${il(x.org)}<span class="xp-when-m"> · ${esc(x.dates)}</span></p><p class="xp-text">${il(x.text)}</p>${x.tags?.length ? `<p class="xp-tags">${x.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</p>` : ""}</div>
  </div>
</li>`).join("")}</ol>`);
  if (a.education) parts.push(`<h2>Education</h2><ol class="xp edu">${a.education.map((e) => `<li>
  <div class="xp-when"><span>${esc(e.dates)}</span></div>
  <div class="xp-card"><span class="xp-logo" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5Z"/><path d="M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5"/><path d="M22 9.5V15"/></svg></span>
    <div class="xp-main"><h3>${il(e.degree)}</h3><p class="xp-org">${il(e.school)}<span class="xp-when-m"> · ${esc(e.dates)}</span></p></div>
  </div>
</li>`).join("")}</ol>`);
  if (a.projects) {
    const cards = [];
    for (const [i, p] of a.projects.entries()) {
      const im = p.image ? await image(C("projects", p.image), `img/projects/${slugify(p.title)}`, [480, 960]) : null;
      const host = p.url.replace(/^https?:\/\//, "");
      cards.push(`<a class="project" href="${esc(p.url)}" rel="noopener" target="_blank" style="--accent:${esc(p.accent || "#a1203f")}">
  <div class="shot"><div class="chrome" aria-hidden="true"><i></i><i></i><i></i><span>${esc(host)}</span></div>
  <div class="shot-img${p.fit === "contain" ? " contain" : ""}">${im ? imgTag(im, `${p.title} screenshot`, { sizes: "(max-width: 760px) 40vw, 240px" }) : ""}</div></div>
  <div class="project-body">
    <p class="repo">${esc(p.repo.replace("/", " / "))}</p>
    <h3>${il(p.title)} <span class="go" aria-hidden="true">↗</span></h3>
    <p class="about">${il(p.text)}</p>
    ${p.tags?.length ? `<p class="ptags">${p.tags.slice(0, 3).map((t) => `<span>${esc(t)}</span>`).join("")}</p>` : ""}
  </div>
</a>`);
    }
    parts.push(`<h2>Projects</h2><div class="projects">${cards.join("\n")}</div>`);
  }
  if (a.certificates) {
    const cards = [];
    for (const c of a.certificates) {
      const done = c.status === "done";
      const im = c.image ? await image(C("certs", c.image), `img/certs/${slugify(c.image.replace(/\.[^.]+$/, ""))}`, [570, 1140]) : null;
      const visual = im
        ? `<div class="cert-img">${imgTag(im, `${c.name} certificate`, { sizes: "(max-width: 760px) 100vw, 360px" })}</div>`
        : `<div class="cert-img cert-placeholder" aria-hidden="true"><span class="ph-issuer">${esc(c.issuer || "")}</span><span class="ph-name">${esc(c.short || c.name)}</span><span class="ph-bar"><i></i></span></div>`;
      const body = `<div class="cert-body"><span class="cert-issuer">${esc(c.issuer || "")}${c.date ? ` · ${esc(c.date)}` : ""}</span><span class="cert-name">${il(c.name)}</span><span class="cert-status ${done ? "ok" : "wip"}">${done ? (c.url ? "✓ Verified · view ↗" : "✓ Certified") : "◔ In progress"}</span></div>`;
      cards.push(c.url ? `<a class="cert" href="${esc(c.url)}" rel="noopener" target="_blank">${visual}${body}</a>` : `<div class="cert">${visual}${body}</div>`);
    }
    parts.push(`<h2>Certificates</h2><div class="certs">${cards.join("")}</div>`);
  }
  if (a.achievements) {
    const A = a.achievements;
    const team = A.team ? (A.team_url ? `<a href="${esc(A.team_url)}" rel="noopener" target="_blank">${esc(A.team)}</a>` : esc(A.team)) : "";
    const tierOf = (pl) => {
      const p = String(pl).toLowerCase();
      if (p.startsWith("win")) return ["gold", "WIN"];
      const n = (p.match(/^\d+/) || [""])[0];
      return [n === "1" ? "gold" : n === "2" ? "silver" : "bronze", String(pl).toUpperCase()];
    };
    const rows = (A.podiums || []).map((p) => {
      const [tier, label] = tierOf(p.place);
      return `<li class="sb-row ${tier}"><span class="sb-rank">${esc(label)}</span><span class="sb-event">${il(p.event)}</span><span class="sb-year">${esc(p.year)}</span></li>`;
    }).join("");
    const finals = (A.finals || []).map((f) => `<li class="sb-row finals"><span class="sb-rank">FINALS</span><span class="sb-event">${il(f.event)}<small>${f.years.length}× qualified</small></span><span class="sb-years">${f.years.map((y) => `<i>${esc(y)}</i>`).join("")}</span></li>`).join("");
    parts.push(`<h2>Achievements</h2><div class="scoreboard">
  <div class="sb-head"><span>rank</span><span>event</span><span>year</span></div>
  <ol class="sb-list">${rows}${finals}</ol>
  ${team ? `<p class="sb-foot">all results with team ${team}</p>` : ""}
</div>`);
  }
  if (a.contact) parts.push(`<h2>Contact</h2><p class="hello">${Object.entries(a.contact).map(([k, v]) => /^https?:/.test(v) ? `<a href="${esc(v)}"${ext(v)}>${esc(k)} ↗</a>` : `<span>${esc(k)} <code>${esc(v)}</code></span>`).join("")}</p>`);
  parts.push(`<h2>Latest write-ups</h2><ol class="entries">${posts.slice(0, 3).map(entry).join("")}</ol><p><a href="/blog/">All posts →</a></p>`);

  const body = `<section class="cold-open slim" aria-labelledby="opening">
  <img class="avatar" src="${av.src}" width="96" height="96" alt="${esc(a.handle || "")} avatar" fetchpriority="high">
  <p class="kicker">About${a.location ? ` · ${esc(a.location)}` : ""}</p>
  <h1 id="opening">${il(a.headline)}</h1>
  <p class="byline-big">${il(a.byline)}</p>
  <p class="lede">${il(a.intro)}</p>
</section>
<div class="column"><article class="prose home">${parts.join("\n")}</article></div>`;
  return page({ title: "About", url: "/", current: "/", body, image: av.src, description: `${a.name} (${a.handle}). ${stripTags(il(a.intro)).slice(0, 150)}` });
}

async function artPage(items) {
  const body = `<section class="cold-open slim">
  <p class="kicker">Art · ${items.length} pieces</p>
  <h1 id="opening">Sketches and <em>paintings</em></h1>
  <p class="lede">Pencil, ink, watercolour and acrylic. Tap a piece to see it full size.</p>
  </section>
<section id="gallery" aria-label="Gallery"><div class="gallery">${items.map(({ name, im }, i) => `<figure><a href="${im.src}" target="_blank" rel="noopener">${imgTag(thumb(im), name, { sizes: "(max-width: 700px) 50vw, 400px", eager: i < 3 })}</a><figcaption>${esc(name)}</figcaption></figure>`).join("")}</div></section>`;
  return page({ title: "Art", description: "Artwork and illustrations by xDU0.", url: "/art/", current: "/art/", body });
}

function notFound() {
  const body = `<section class="cold-open slim"><p class="kicker">404</p><h1>Page <em>not found</em></h1><p class="lede">This page doesn't exist or was moved.</p><nav class="shortcuts"><a href="/">Back home ↑</a><a href="/blog/">Read the blog ↘</a></nav></section>`;
  return page({ title: "Not found", url: "/404.html", body });
}
const redirect = (to) => `<!doctype html><meta charset="utf-8"><title>Redirecting…</title><link rel="canonical" href="${to}"><meta http-equiv="refresh" content="0; url=${to}"><a href="${to}">${to}</a>`;

function rss(posts) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>${SITE.title}</title><link>${SITE.url}/</link><description>${esc(SITE.description)}</description>
${posts.map((p) => `<item><title>${esc(p.title)}</title><link>${SITE.url}${p.url}</link><guid>${SITE.url}${p.url}</guid><pubDate>${p.date.toUTCString()}</pubDate><description>${esc(p.description)}</description>${p.tags.map((t) => `<category>${esc(t)}</category>`).join("")}</item>`).join("\n")}
</channel></rss>`;
}
function sitemap(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${SITE.url}${u}</loc></url>`).join("")}</urlset>`;
}

/* ---------- build ---------- */
const t0 = Date.now();
await fs.mkdir(OUT, { recursive: true });
for (const f of await fs.readdir(OUT)) if (f !== "img") await fs.rm(path.join(OUT, f), { recursive: true, force: true });

const posts = await loadPosts();
const art = await loadArt();
await write("index.html", await aboutPage(posts));
await write("blog/index.html", homePage(posts));
for (let i = 0; i < posts.length; i++) await write(`posts/${posts[i].slug}/index.html`, postPage(posts[i], posts[i + 1], posts[i - 1]));
await write("writeups/index.html", redirect("/blog/"));
await write("archive/index.html", archivePage(posts));
await write("about/index.html", redirect("/"));
await write("art/index.html", await artPage(art));
await write("404.html", notFound());
// keep old URLs working
await write("labs/index.html", redirect("/blog/"));
await write("labs/cyberdefenders/index.html", redirect("/blog/"));
await write("labs/htb-sherlocks/index.html", redirect("/blog/"));
await write("rss.xml", rss(posts));
await write("atom.xml", rss(posts));
await write("sitemap.xml", sitemap(["/", "/blog/", "/archive/", "/art/", ...posts.map((p) => p.url)]));
await write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);
await write(".nojekyll", "");
// logo / favicon from content/avatar.jpg
await write("favicon.png", await sharp(C("avatar.jpg")).resize(64, 64).png({ compressionLevel: 9 }).toBuffer());
await write("apple-touch-icon.png", await sharp(C("avatar.jpg")).resize(180, 180).png({ compressionLevel: 9 }).toBuffer());
await runImageJobs();
// remove stale images
const wanted = new Set([...imgJobs.keys()].map((r) => path.join(OUT, r)));
async function prune(d) {
  for (const e of await fs.readdir(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) await prune(p);
    else if (!wanted.has(p)) await fs.rm(p);
  }
}
if (existsSync(path.join(OUT, "img"))) await prune(path.join(OUT, "img"));
console.log(`Built ${posts.length} posts, ${imgJobs.size} images in ${Date.now() - t0} ms → dist/`);
