(() => {
  const d = document;
  // Light / night toggle with a circular reveal from the button
  const root = d.documentElement;
  const tg = d.querySelector(".theme-toggle");
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const current = () => root.dataset.theme || (mq.matches ? "dark" : "light");
  const sync = () => {
    const dark = current() === "dark";
    if (tg) { tg.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to night mode"); tg.setAttribute("aria-pressed", String(dark)); }
    const m = d.querySelector('meta[name="theme-color"]');
    if (m) m.content = dark ? "#121311" : "#f4f0e7";
  };
  sync();
  mq.addEventListener && mq.addEventListener("change", sync);
  if (tg) tg.addEventListener("click", (e) => {
    const next = current() === "dark" ? "light" : "dark";
    const apply = () => { root.dataset.theme = next; try { localStorage.setItem("theme", next); } catch (err) {} sync(); };
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!d.startViewTransition || reduce) {
      root.classList.add("theme-fade"); apply();
      setTimeout(() => root.classList.remove("theme-fade"), 400);
      return;
    }
    const r = tg.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add("theme-vt");
    const vt = d.startViewTransition(apply);
    vt.ready.then(() => root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
      { duration: 600, easing: "cubic-bezier(.2,.7,.2,1)", pseudoElement: "::view-transition-new(root)" }
    ));
    vt.finished.finally(() => root.classList.remove("theme-vt"));
  });
  // Category filter on the blog page
  const fb = d.querySelectorAll(".filters button");
  fb.forEach((b) => b.addEventListener("click", () => {
    const f = b.dataset.filter;
    fb.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    d.querySelectorAll(".post-row").forEach((r) => { r.hidden = f !== "all" && r.dataset.cat !== f; });
  }));
  // Covers / Index toggle on the home band
  const band = d.querySelector(".band[data-mode]");
  if (band) {
    const btns = band.querySelectorAll(".reader-mode button");
    const set = (m) => {
      band.dataset.mode = m;
      btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === m)));
      try { localStorage.setItem("mode", m); } catch (e) {}
    };
    try { const m = localStorage.getItem("mode"); if (m) set(m); } catch (e) {}
    btns.forEach((b) => b.addEventListener("click", () => set(b.dataset.mode)));
  }
  // Highlight the current year / heading while scrolling
  const spy = (links, targets) => {
    if (!links.length || !("IntersectionObserver" in window)) return;
    const map = new Map();
    links.forEach((a) => map.set(a.getAttribute("href").slice(1), a));
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        const id = e.target.dataset.era || e.target.id;
        const a = map.get(id);
        if (!a) return;
        links.forEach((l) => { l.classList.remove("active"); l.removeAttribute("aria-current"); });
        a.classList.add("active");
        a.setAttribute("aria-current", "location");
      });
    }, { rootMargin: "-15% 0px -70% 0px" });
    targets.forEach((t) => io.observe(t));
  };
  spy([...d.querySelectorAll(".era-links a")], d.querySelectorAll(".chapter[data-era]"));
  spy([...d.querySelectorAll(".contents a[href^='#']")], d.querySelectorAll(".prose h2[id]"));
  // Copy buttons on code blocks
  if (navigator.clipboard) d.querySelectorAll("pre").forEach((pre) => {
    const b = d.createElement("button");
    b.className = "copy"; b.type = "button"; b.textContent = "copy";
    b.addEventListener("click", () => navigator.clipboard.writeText(pre.querySelector("code").innerText).then(() => {
      b.textContent = "copied"; setTimeout(() => (b.textContent = "copy"), 1200);
    }));
    pre.appendChild(b);
  });
  // Instant navigation fallback for browsers without Speculation Rules (Firefox, Safari)
  if (!(HTMLScriptElement.supports && HTMLScriptElement.supports("speculationrules"))) {
    const done = new Set();
    const pf = (e) => {
      const a = e.target.closest && e.target.closest("a[href^='/']");
      if (!a || a.target || done.has(a.pathname) || a.pathname === location.pathname) return;
      done.add(a.pathname);
      const l = d.createElement("link"); l.rel = "prefetch"; l.href = a.pathname; d.head.appendChild(l);
    };
    d.addEventListener("mouseover", pf, { passive: true });
    d.addEventListener("touchstart", pf, { passive: true });
  }
})();
