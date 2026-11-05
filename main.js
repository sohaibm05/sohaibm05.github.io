(() => {
  'use strict';

  /* What flows down the spine once it's drawn: 'ink' (black, wet sheen), 'red' (red pulses), or 'both'. */
  const SPINE_FLOW = 'ink';
  const spineEl = document.getElementById('spineSvg');
  if (spineEl) spineEl.dataset.flow = SPINE_FLOW;

  const motion = document.documentElement.classList.contains('motion');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ordinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]) + '.';
  };

  /* ---------- Render projects from data/projects.js ---------- */
  const stopsEl = document.getElementById('stops');
  const projects = Array.isArray(window.PROJECTS) ? window.PROJECTS : [];

  stopsEl.innerHTML = projects.map((p, i) => {
    const side = i % 2 === 0 ? 'left' : 'right';
    const title = p.link
      ? `<a href="${esc(p.link)}">${esc(p.title)}</a>`
      : esc(p.title);
    const stack = (p.stack || []).join(' · ');

    if (p.featured) {
      const shot = p.image
        ? `<img src="${esc(p.image)}" alt="${esc(p.alt || p.title + ' screenshot')}" loading="lazy">`
        : `<span class="shot-empty">[ screenshot ]</span>`;
      const rows = [
        p.type && ['Type', p.type],
        stack && ['Stack', stack],
        p.hard && ['Hard part', p.hard]
      ].filter(Boolean).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
      return `
        <article class="stop stop--major stop--${side} reveal" data-i="${i}">
          <header class="stop-head"><span class="num">${ordinal(i + 1)}</span><h3 class="stop-title">${title}</h3></header>
          <figure class="shot">${shot}</figure>
          <div class="stop-body">
            <dl class="attrs">${rows}</dl>
            <p class="stop-summary">${esc(p.summary)}</p>
          </div>
        </article>`;
    }
    return `
      <article class="stop stop--minor stop--${side} reveal" data-i="${i}">
        <header class="stop-head"><span class="num">${ordinal(i + 1)}</span><h3 class="stop-title">${title}</h3></header>
        <p class="stop-summary">${esc(p.summary)} <span class="stack">${esc(stack)}</span></p>
      </article>`;
  }).join('');

  /* ---------- Render testimonials ---------- */
  const words = Array.isArray(window.TESTIMONIALS) ? window.TESTIMONIALS : [];
  const scrollsEl = document.getElementById('scrolls');
  if (words.length) {
    scrollsEl.innerHTML = words.map((t) => `
      <figure class="scroll reveal">
        <blockquote>“${esc(t.quote)}”</blockquote>
        <figcaption>${esc(t.name)}${t.role ? ' · ' + esc(t.role) : ''}</figcaption>
        <span class="chop" aria-hidden="true"></span>
      </figure>`).join('');
  } else {
    document.getElementById('words').hidden = true;
    const navLink = document.querySelector('[data-nav="words"]');
    if (navLink) navLink.hidden = true;
  }

  /* ---------- Split the discipline statement into words ---------- */
  const statement = document.getElementById('statement');
  if (statement) {
    statement.innerHTML = statement.textContent.trim().split(/\s+/)
      .map((w, i) => `<span class="w" style="--i:${i}">${esc(w)}</span>`).join(' ');
    statement.classList.add('reveal-group');
  }

  /* ---------- Circuit traces from the spine to each project ---------- */
  const tracesSvg = document.getElementById('traces');
  const pathSection = document.getElementById('path');
  const pathInner = pathSection.querySelector('.path-inner');
  const spineBox = document.getElementById('spineSvg');

  const layoutTraces = () => {
    const W = pathSection.clientWidth, H = pathSection.clientHeight;
    tracesSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const sp = spineBox.getBoundingClientRect(), host = pathSection.getBoundingClientRect();
    const cx = sp.left + sp.width / 2 - host.left;
    let out = '';
    document.querySelectorAll('.stop').forEach((stop) => {
      const head = stop.querySelector('.stop-head');
      const hb = head.getBoundingClientRect();           // reveals only slide sideways, so height is reliable
      const y = hb.top - host.top + hb.height * 0.55;
      const parent = (stop.offsetParent || pathInner).getBoundingClientRect();
      const left = parent.left - host.left + stop.offsetLeft;  // layout position, ignoring the reveal slide
      const onRight = left > cx;
      // reach right up to the heading text, not the empty edge of the column
      const slide = stop.getBoundingClientRect().left - host.left - left;   // current reveal offset
      let textRight = left;
      [stop.querySelector('.num'), stop.querySelector('.stop-title')].forEach((el) => {
        const rg = document.createRange(); rg.selectNodeContents(el);
        [...rg.getClientRects()].forEach((r) => { textRight = Math.max(textRight, r.right - host.left - slide); });
      });
      const end = onRight ? left - 20 : textRight + 22;
      const dir = onRight ? 1 : -1;
      if (Math.abs(end - cx) < 80) return; // too tight (phones): no trace
      const jog = 26, bend = cx + dir * 26;
      const main = `M${cx} ${y + jog} H${bend} L${bend + dir * jog} ${y} H${end}`;
      const mid = cx + (end - cx) * 0.55;
      const thin = `M${cx} ${y + jog + 8} H${bend + dir * 6} L${bend + dir * (jog + 6)} ${y + 8} H${mid}`;
      const state = stop.classList.contains('pre') ? 'pre' : (stop.classList.contains('in') ? 'in' : '');
      out += `<g class="trace ${state}" id="trace-${stop.dataset.i}">
        <path class="tr" pathLength="1" d="${main}"></path>
        <path class="tr tr--thin" pathLength="1" d="${thin}"></path>
        <circle class="via" cx="${bend}" cy="${y + jog}" r="2.2"></circle>
        <circle class="via" cx="${mid}" cy="${y + 8}" r="2"></circle>
        <circle class="node" cx="${end}" cy="${y}" r="5.5"></circle>
        <circle class="node-core" cx="${end}" cy="${y}" r="2"></circle>
      </g>`;
    });
    tracesSvg.innerHTML = out;
  };
  const syncTrace = (stop) => {
    const t = document.getElementById('trace-' + stop.dataset.i);
    if (!t) return;
    t.classList.toggle('pre', stop.classList.contains('pre'));
    t.classList.toggle('in', stop.classList.contains('in'));
  };
  layoutTraces();

  /* ---------- Circuitry inside the spine ---------- */
  // Centre line of the spine's ink stroke (average of its two edges), in the spine's own 220×2000 space.
  const SPINE_CENTRE = 'M110 0 C139 200 83 400 117 600 C148 800 91 1000 112 1200 C134 1400 86 1600 114 2000';
  const buildCircuit = () => {
    const host = document.getElementById('spineCircuit');
    if (!host) return;
    const NS = 'http://www.w3.org/2000/svg';
    const guide = document.createElementNS(NS, 'path');
    guide.setAttribute('d', SPINE_CENTRE);
    guide.setAttribute('fill', 'none');
    host.appendChild(guide);
    const L = guide.getTotalLength();
    const pt = (s, off) => {
      const a = guide.getPointAtLength(Math.max(0, Math.min(L, s)));
      const b = guide.getPointAtLength(Math.max(0, Math.min(L, s + 1)));
      const dx = b.x - a.x, dy = b.y - a.y, n = Math.hypot(dx, dy) || 1;
      return [(a.x - (dy / n) * off).toFixed(1), (a.y + (dx / n) * off).toFixed(1)];
    };
    let seed = 20261104;                                  // fixed seed: same circuit every visit
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const LANES = [-7, 0, 7];
    let lines = '', vias = '', long = [];
    LANES.forEach((lane) => {
      let s = 30 + rnd() * 120, cur = lane;
      while (s < L - 60) {
        const end = Math.min(L - 30, s + 90 + rnd() * 260);
        let d = `M${pt(s, cur).join(' ')}`;
        for (let t = s + 16; t <= end; t += 16) d += ` L${pt(t, cur).join(' ')}`;
        let last = pt(end, cur);
        if (rnd() < 0.55) {                               // 45° jog into a neighbouring lane
          const next = Math.max(-7, Math.min(7, cur + (rnd() < 0.5 ? -7 : 7)));
          if (next !== cur) {
            last = pt(end + 9, next); d += ` L${last.join(' ')}`;
            for (let t = end + 25; t <= end + 25 + rnd() * 50; t += 16) { last = pt(t, next); d += ` L${last.join(' ')}`; }
            cur = next;
          }
        }
        lines += `<path class="ct" d="${d}"></path>`;
        const [sx, sy] = pt(s, lane === cur ? cur : lane);
        vias += `<rect class="via" x="${(+sx - 2.2).toFixed(1)}" y="${(+sy - 2.6).toFixed(1)}" width="4.4" height="5.2"></rect>`;
        vias += `<rect class="via" x="${(+last[0] - 2.2).toFixed(1)}" y="${(+last[1] - 2.6).toFixed(1)}" width="4.4" height="5.2"></rect>`;
        if (end - s > 200) long.push(d);
        s = end + 40 + rnd() * 90;
      }
    });
    // a few red signals travel down the longer traces once the spine is alive
    const sigs = long.filter((_, i) => i % 2 === 0).slice(0, 5).map((d, i) =>
      `<path class="sig" pathLength="1" d="${d}" style="--d:${(3.2 + rnd() * 2.6).toFixed(1)}s;--delay:${(i * 0.9).toFixed(1)}s"></path>`).join('');
    host.innerHTML = lines + vias + sigs;
  };
  buildCircuit();
  let traceTimer;
  window.addEventListener('resize', () => { clearTimeout(traceTimer); traceTimer = setTimeout(layoutTraces, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutTraces);

  if (!motion) return;

  /* ---------- Hero: ink bleeds in ---------- */
  document.querySelectorAll('.hero-art .smil').forEach((a) => {
    try { a.beginElement(); } catch (e) { /* SMIL unsupported: rest state stays */ }
  });

  /* ---------- Hero: then the red keeps flowing ---------- */
  const flowLayer = document.querySelector('.hero-flow-layer');
  setTimeout(() => {
    flowLayer.querySelectorAll('.hero-flow').forEach((a) => { try { a.beginElement(); } catch (e) {} });
    flowLayer.classList.add('on');
  }, 2200);
  if ('IntersectionObserver' in window && flowLayer.pauseAnimations) {
    const heroEl = document.getElementById('top');
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) flowLayer.unpauseAnimations();
      else flowLayer.pauseAnimations();
      heroEl.classList.toggle('paused', !e.isIntersecting);
    }).observe(heroEl);
  }

  /* ---------- Scroll reveals ---------- */
  const targets = [...document.querySelectorAll('.reveal, .reveal-group, .stamp')];
  if ('IntersectionObserver' in window) {
    const vh = window.innerHeight;
    targets.forEach((el) => {
      // Only hide things the visitor can't see yet, so the first frame is always complete.
      if (el.getBoundingClientRect().top > vh * 0.92) el.classList.add('pre');
    });
    document.querySelectorAll('.stop').forEach(syncTrace);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.remove('pre');
        e.target.classList.add('in');
        if (e.target.classList.contains('stop')) syncTrace(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    targets.forEach((el) => io.observe(el));
  }

  /* ---------- Spine draws itself as you scroll ---------- */
  const path = document.getElementById('path');
  const clipRect = document.getElementById('spineClipRect');
  const spineSvg = document.getElementById('spineSvg');
  let ticking = false;
  let alive = false;

  // Once the spine is fully drawn, red pulses start flowing down it.
  const wakeSpine = () => {
    alive = true;
    spineSvg.classList.add('alive');
    spineSvg.querySelectorAll('.alive-anim:not(.alive-late)').forEach((a) => { try { a.beginElement(); } catch (e) {} });
    setTimeout(() => {
      spineSvg.querySelectorAll('.alive-late').forEach((a) => { try { a.beginElement(); } catch (e) {} });
    }, 2600);
  };

  const drawSpine = () => {
    ticking = false;
    const r = path.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / r.height));
    clipRect.setAttribute('height', String(progress * 2000));
    if (!alive && progress >= 0.99) wakeSpine();
  };

  // Only animate the spine while it's on screen.
  if ('IntersectionObserver' in window && spineSvg.pauseAnimations) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) spineSvg.unpauseAnimations();
      else spineSvg.pauseAnimations();
    }).observe(path);
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(drawSpine); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  drawSpine();

  /* ---------- Ink trail on the hero (mouse/trackpad only) ---------- */
  const hero = document.getElementById('top');
  const canvas = hero.querySelector('.ink-trail');
  if (!window.matchMedia('(pointer: fine)').matches || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  let drops = [];
  let running = false;
  let last = null;
  let dpr = 1;

  const size = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = hero.clientWidth * dpr;
    canvas.height = hero.clientHeight * dpr;
  };
  size();
  window.addEventListener('resize', size);

  hero.addEventListener('pointermove', (ev) => {
    const b = hero.getBoundingClientRect();
    const x = ev.clientX - b.left, y = ev.clientY - b.top;
    const speed = last ? Math.hypot(x - last.x, y - last.y) : 0;
    last = { x, y };
    if (drops.length > 420) drops.splice(0, drops.length - 420);
    drops.push({ x, y, r: 1.4 + Math.min(speed * 0.07, 5), life: 1, red: Math.random() < 0.07, jx: (Math.random() - .5) * 2, jy: (Math.random() - .5) * 2 });
    if (speed > 22 && Math.random() < 0.5) {
      const a = Math.random() * Math.PI * 2, d = 8 + Math.random() * 18;
      drops.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, r: 0.8 + Math.random() * 1.6, life: 1, red: false, jx: 0, jy: 0 });
    }
    if (!running) { running = true; requestAnimationFrame(tick); }
  });
  hero.addEventListener('pointerleave', () => { last = null; });

  let prev = performance.now();
  function tick(now) {
    const dt = Math.min(64, now - prev); prev = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drops = drops.filter((d) => (d.life -= dt / 1500) > 0);
    for (const d of drops) {
      const a = d.life * 0.5;
      ctx.fillStyle = d.red ? `rgba(179,20,27,${a})` : `rgba(20,20,20,${a})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(d.x + d.jx, d.y + d.jy, d.r * 0.7, 0, Math.PI * 2); ctx.fill();
    }
    if (drops.length) requestAnimationFrame(tick);
    else { running = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }
})();
