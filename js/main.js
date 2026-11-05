/* =====================================================================
   PAGE LOGIC — renders data.js into the page, plus the small touches:
   torn ink edges, 3D tilt, filters, reveal, cursor, loader counter.
   ===================================================================== */
(function () {
  document.documentElement.classList.add("js");
  const S = window.SITE || {};
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (q, el = document) => el.querySelector(q);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

  /* ---------- loader counter ---------- */
  const count = $("#count");
  if (count) {
    let n = 0;
    const tick = setInterval(() => {
      n = Math.min(100, n + 7 + Math.floor(Math.random() * 9));
      count.textContent = pad(n);
      if (n >= 100) clearInterval(tick);
    }, 70);
  }

  /* ---------- hero letters ---------- */
  document.querySelectorAll(".split").forEach((el) => {
    const text = el.textContent;
    el.innerHTML = [...text].map((c, i) =>
      `<span class="ch" style="animation-delay:${(reduced ? 0 : 1.25 + i * 0.08).toFixed(2)}s">${esc(c)}</span>`).join("");
  });

  /* ---------- featured ---------- */
  const featured = $("#featured");
  if (featured && window.FEATURED) {
    featured.innerHTML = window.FEATURED.map((p, i) => `
      <article class="arc rv">
        <div class="plate-wrap">
          <div class="plate" data-tilt>
            <span class="plate-num">${pad(i + 1)}<sup>+</sup></span>
            <span class="plate-kanji" aria-hidden="true">${esc(p.kanji || "作")}</span>
            ${p.kanjiMeaning ? `<span class="plate-meaning mono">${esc(p.kanji)} · ${esc(p.kanjiMeaning)}</span>` : ""}
          </div>
        </div>
        <div class="arc-body">
          <span class="arc-role mono">${esc(p.role || "")}</span>
          <h3 class="arc-title">${esc(p.title)}</h3>
          <p class="arc-summary">${esc(p.summary)}</p>
          ${p.points ? `<ul class="arc-points">${p.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
          <div class="chips">${(p.stack || []).map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>
          ${p.link ? `<a class="btn arc-link" href="${esc(p.link)}" target="_blank" rel="noopener">View on GitHub ↗</a>` : ""}
        </div>
      </article>`).join("");
  }

  /* ---------- armory ---------- */
  const list = $("#projects");
  if (list && window.PROJECTS) {
    list.innerHTML = window.PROJECTS.map((p, i) => `
      <a class="proj rv" data-tag="${esc(p.tag)}" href="${esc(p.link || S.github || "#")}" target="_blank" rel="noopener">
        <span class="proj-idx">No.${pad(i + 1)}</span>
        <span class="proj-title">${esc(p.title)}${p.status ? `<span class="proj-status">${esc(p.status)}</span>` : ""}</span>
        <span class="proj-blurb">${esc(p.blurb)}</span>
        <span class="proj-stack">${(p.stack || []).map(esc).join(" · ")}</span>
        <span class="proj-arrow" aria-hidden="true">↗</span>
        <span class="proj-tag">${esc(p.tag)}</span>
      </a>`).join("");

    document.querySelectorAll(".filters button").forEach((b) => {
      b.addEventListener("click", () => {
        document.querySelectorAll(".filters button").forEach((x) => x.classList.toggle("on", x === b));
        const f = b.dataset.filter;
        list.querySelectorAll(".proj").forEach((row) => { row.hidden = f !== "All" && row.dataset.tag !== f; });
      });
    });
  }

  /* ---------- skills ---------- */
  const skills = $("#skills");
  if (skills && window.SKILLS) {
    skills.innerHTML = window.SKILLS.map((g) => `
      <div class="skill-col rv">
        <h3>${esc(g.group)}</h3>
        <ul>${g.items.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
      </div>`).join("");
  }

  /* ---------- testimonials ---------- */
  const tWrap = $("#testimonials");
  if (tWrap) {
    const T = window.TESTIMONIALS || [];
    tWrap.innerHTML = T.length
      ? T.map((t) => `
        <figure class="quote-card rv">
          <blockquote>“${esc(t.quote)}”</blockquote>
          <figcaption><b>${esc(t.name)}</b>${esc(t.role || "")}</figcaption>
        </figure>`).join("")
      : `<div class="scroll-empty rv">
          <span class="wax" aria-hidden="true">言</span>
          <p><strong>Scrolls still sealed.</strong>Recommendations from teammates and mentors are being collected. They'll show up here as they come in.</p>
        </div>`;
  }

  /* ---------- contact ---------- */
  const email = $("#email");
  if (email) email.textContent = S.email || "";
  const links = $("#links");
  if (links) {
    const L = [];
    if (S.github) L.push(`<a href="${esc(S.github)}" target="_blank" rel="noopener">GitHub ↗</a>`);
    if (S.linkedin) L.push(`<a href="${esc(S.linkedin)}" target="_blank" rel="noopener">LinkedIn ↗</a>`);
    if (S.email) L.push(`<a href="mailto:${esc(S.email)}">Write directly</a>`);
    links.innerHTML = L.join("");
  }
  const copy = $("#copy");
  if (copy && email) {
    copy.addEventListener("click", () => {
      const done = () => { copy.textContent = "Copied"; setTimeout(() => (copy.textContent = "Copy"), 1600); };
      const fallback = () => {
        const r = document.createRange(); r.selectNodeContents(email);
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
        copy.textContent = "Selected";
        setTimeout(() => (copy.textContent = "Copy"), 1600);
      };
      try {
        navigator.clipboard.writeText(email.textContent).then(done, fallback);
      } catch (e) { fallback(); }
    });
  }

  /* ---------- torn ink edges ---------- */
  function tornPath(seed, rough) {
    let s = seed;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const pts = [];
    const N = 90;
    let y = 40;
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * 1000;
      y += (rnd() - 0.5) * rough;
      y = Math.max(8, Math.min(62, y));
      const spike = rnd() < 0.12 ? (rnd() - 0.6) * 26 : 0;
      pts.push(`${x.toFixed(1)},${Math.max(2, Math.min(68, y + spike)).toFixed(1)}`);
    }
    return `M0,70 L${pts.join(" L")} L1000,70 Z`;
  }
  document.querySelectorAll(".ink-band").forEach((band, i) => {
    ["top", "bottom"].forEach((pos, j) => {
      if (band.classList.contains("contact") && pos === "bottom") return;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 1000 70");
      svg.setAttribute("preserveAspectRatio", "none");
      svg.setAttribute("aria-hidden", "true");
      svg.classList.add("tear", pos);
      svg.innerHTML =
        `<path class="fiber" d="${tornPath(17 + i * 31 + j * 7, 22)}" transform="translate(0,-6)"/>` +
        `<path d="${tornPath(101 + i * 13 + j * 5, 16)}"/>`;
      band.prepend(svg);
    });
  });

  /* ---------- reveal on scroll (motion only) ---------- */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".rv, .section-title, .ronin-quote, .ronin-body").forEach((el) => {
      el.classList.add("rv"); io.observe(el);
    });
  } else {
    document.querySelectorAll(".rv").forEach((el) => el.classList.add("in"));
  }

  /* ---------- 3D tilt on plates and rows ---------- */
  if (!reduced && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 14}deg)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
    document.querySelectorAll(".proj").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        el.style.transform = `rotateY(${x * 4}deg) translateZ(14px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- nav background once past hero ---------- */
  const nav = $(".nav");
  const onScroll = () => nav && nav.classList.toggle("solid", window.scrollY > window.innerHeight * 0.6);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- cursor ring ---------- */
  const cur = $(".cursor");
  if (cur && window.matchMedia("(pointer: fine)").matches) {
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    document.addEventListener("pointerover", (e) => {
      cur.classList.toggle("big", !!e.target.closest("a, button, [data-tilt]"));
    });
    (function loop() {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cur.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    })();
  }
})();
