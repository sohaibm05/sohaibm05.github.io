/* Trials: two small games. Best scores live only in this visitor's browser. */
(() => {
  'use strict';

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode etc. */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  /* =====================================================
     The salute: solve Build Order, and next time the hero
     is on screen, SM-01 salutes you.
     ===================================================== */
  const mech = document.querySelector('.mech');
  const hero = document.getElementById('top');
  const note = document.getElementById('saluteNote');
  let salutePending = store.get('sm-salute') === '1';
  let saluting = false;

  const salute = () => {
    if (!salutePending || saluting || !mech) return;
    salutePending = false; saluting = true;
    store.del('sm-salute');
    setTimeout(() => {
      mech.classList.add('saluting');
      document.querySelectorAll('.mech-glint, .mech-core').forEach((el) => el.classList.add('flare'));
      note.textContent = 'SM-01 salutes you, pilot.';
      note.classList.add('show');
      setTimeout(() => {
        mech.classList.remove('saluting');
        document.querySelectorAll('.mech-glint, .mech-core').forEach((el) => el.classList.remove('flare'));
        note.classList.remove('show');
        saluting = false;
      }, 6500);
    }, 500);
  };
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { if (e.isIntersecting) salute(); }, { threshold: 0.6 }).observe(hero);
  }
  const queueSalute = () => { salutePending = true; store.set('sm-salute', '1'); };

  /* =====================================================
     Trial I — Iaido: wait for the red, then strike.
     ===================================================== */

  // Put your own best here (in ms) once you've played it; 0 hides the line.
  const SOBU_BEST_MS = 0;

  const stage = document.getElementById('duelStage');
  if (stage) {
    const msg = document.getElementById('duelMsg');
    const lastEl = document.getElementById('duelLast');
    const bestEl = document.getElementById('duelBest');
    const rankEl = document.getElementById('duelRank');
    const sobuEl = document.getElementById('duelSobu');
    const rank = (ms) => ms < 200 ? 'Kensei' : ms < 260 ? 'Samurai' : ms < 330 ? 'Ronin' : 'Apprentice';

    let state = 'idle', timer = null, t0 = 0, lockedUntil = 0;
    let best = Number(store.get('sm-duel-best')) || 0;
    if (best) bestEl.textContent = best + ' ms';
    if (SOBU_BEST_MS > 0) { sobuEl.hidden = false; sobuEl.textContent = `Sobu's best: ${SOBU_BEST_MS} ms. Beat it.`; }

    const set = (s, text) => { state = s; stage.dataset.state = s; msg.textContent = text; };

    const start = () => {
      set('wait', 'Wait for it…');
      timer = setTimeout(() => {
        set('go', 'Strike');
        // time from the frame the red actually shows
        requestAnimationFrame(() => { t0 = performance.now(); });
      }, 1400 + Math.random() * 3200);
    };

    const act = () => {
      const now = performance.now();
      if (now < lockedUntil) return;
      if (state === 'wait') {
        clearTimeout(timer);
        set('early', 'Too early. You moved first. Again?');
        lockedUntil = now + 700;
        return;
      }
      if (state === 'go') {
        if (!t0) return;                       // pressed in the same frame the red appeared
        const ms = Math.round(now - t0);
        t0 = 0;
        const r = rank(ms);
        lastEl.textContent = ms + ' ms';
        rankEl.textContent = r;
        let line = `${ms} ms. ${r}.`;
        if (!best || ms < best) { best = ms; store.set('sm-duel-best', String(ms)); bestEl.textContent = ms + ' ms'; line += ' New best.'; }
        if (SOBU_BEST_MS > 0 && ms < SOBU_BEST_MS) line += ' You beat Sobu.';
        set('done', line + ' Again?');
        lockedUntil = now + 700;
        return;
      }
      start();                                 // idle, done or early: go again
    };

    stage.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; e.preventDefault(); act(); });
    stage.addEventListener('keydown', (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      if (!e.repeat) act();
    });
    stage.addEventListener('click', (e) => e.preventDefault());   // handled on pointerdown/keydown
  }

  /* =====================================================
     Trial II — Build Order: assemble SM-01 from projects.
     ===================================================== */

  const MODULES = [
    { id: 'naheed',   name: 'Naheed Agent', line: 'LLM that decides what to stock',  slot: 'cockpit' },
    { id: 'itemiq',   name: 'ItemIQ',       line: 'Full-stack app built for SIUT',   slot: 'arms' },
    { id: 'unicore',  name: 'UniCore',      line: 'Red-black tree records system',   slot: 'core' },
    { id: 'valorant', name: 'Valorant CV',  line: 'Watches the game live',           slot: 'sensors' },
    { id: 'riscv',    name: 'RISC-V CPU',   line: 'Single-cycle core on an FPGA',    slot: 'frame' }
  ];
  const LIMIT = 45, PENALTY = 3;

  const frame = document.getElementById('buildFrame');
  const tray = document.getElementById('buildTray');
  if (!frame || !tray) return;
  const timerEl = document.getElementById('buildTimer');
  const msgEl = document.getElementById('buildMsg');
  const bestEl2 = document.getElementById('buildBest');
  const resetBtn = document.getElementById('buildReset');
  const slots = [...frame.querySelectorAll('.slot')];
  const slotHTML = new Map(slots.map((s) => [s, s.innerHTML]));

  let selected = null, startedAt = 0, penalty = 0, tick = null, placed = 0, over = false;
  let bestTime = Number(store.get('sm-build-best')) || 0;
  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
  if (bestTime) bestEl2.textContent = bestTime.toFixed(1) + ' s';

  const elapsed = () => (startedAt ? (performance.now() - startedAt) / 1000 : 0) + penalty;
  const render = () => { timerEl.textContent = fmt(Math.max(0, LIMIT - elapsed())); };

  const startClock = () => {
    if (startedAt || over) return;
    startedAt = performance.now();
    tick = setInterval(() => {
      render();
      if (LIMIT - elapsed() <= 0) end(false);
    }, 100);
  };

  const end = (won) => {
    over = true;
    clearInterval(tick);
    if (won) {
      const t = Math.min(LIMIT, elapsed());
      frame.classList.add('online');
      queueSalute();
      let line = `SM-01 online. Assembled in ${t.toFixed(1)} s. Scroll back up.`;
      if (!bestTime || t < bestTime) { bestTime = t; store.set('sm-build-best', t.toFixed(1)); bestEl2.textContent = t.toFixed(1) + ' s'; line += ' New best.'; }
      msgEl.textContent = line;
    } else {
      timerEl.textContent = fmt(0);
      frame.classList.add('stalled');
      msgEl.textContent = 'Out of time. SM-01 stalled. Reset and try again.';
      tray.querySelectorAll('.module').forEach((m) => { m.disabled = true; });
    }
  };

  const select = (btn) => {
    tray.querySelectorAll('.module').forEach((m) => m.setAttribute('aria-pressed', String(m === btn && selected !== btn)));
    selected = selected === btn ? null : btn;
    if (selected) msgEl.textContent = `Where does ${selected.dataset.name} go?`;
  };

  const attempt = (btn, slot) => {
    if (over || !btn || !slot || slot.classList.contains('filled')) return;
    startClock();
    const mod = MODULES.find((m) => m.id === btn.dataset.id);
    if (mod.slot === slot.dataset.slot) {
      slot.classList.add('filled');
      slot.innerHTML = `<span class="slot-role">${slot.querySelector('.slot-role').textContent}</span><span class="slot-name">${mod.name}</span>`;
      slot.setAttribute('aria-label', `${slot.dataset.slot}: ${mod.name}`);
      btn.remove();
      selected = null;
      placed += 1;
      msgEl.textContent = `${mod.name} locked into the ${slot.dataset.slot}.`;
      if (placed === MODULES.length) end(true);
    } else {
      penalty += PENALTY;
      render();
      slot.classList.remove('wrong'); void slot.offsetWidth; slot.classList.add('wrong');
      msgEl.textContent = `${mod.name} doesn't belong in the ${slot.dataset.slot}. −${PENALTY} s.`;
      if (LIMIT - elapsed() <= 0) end(false);
    }
  };

  const build = () => {
    clearInterval(tick);
    selected = null; startedAt = 0; penalty = 0; placed = 0; over = false;
    frame.classList.remove('online', 'stalled');
    slots.forEach((s) => { s.classList.remove('filled', 'wrong'); s.innerHTML = slotHTML.get(s); s.removeAttribute('aria-label'); });
    const order = MODULES.slice().sort(() => Math.random() - 0.5);
    tray.innerHTML = order.map((m) =>
      `<button class="module" type="button" aria-pressed="false" data-id="${m.id}" data-name="${m.name}"><b>${m.name}</b><span>${m.line}</span></button>`).join('');
    msgEl.textContent = 'The clock starts on your first move.';
    render();
  };

  // tap / click / keyboard: pick a module, then a slot
  slots.forEach((slot) => slot.addEventListener('click', () => {
    if (selected) attempt(selected, slot);
    else if (!slot.classList.contains('filled') && !over) msgEl.textContent = 'Pick a project first.';
  }));

  // drag with mouse, pen or finger
  let drag = null;
  tray.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.module');
    if (!btn || btn.disabled || over) return;
    drag = { btn, x: e.clientX, y: e.clientY, moved: false, ghost: null, id: e.pointerId };
    btn.setPointerCapture(e.pointerId);
  });
  tray.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      startClock();
      drag.ghost = document.createElement('div');
      drag.ghost.className = 'ghost';
      drag.ghost.textContent = drag.btn.dataset.name;
      document.body.appendChild(drag.ghost);
      drag.btn.classList.add('dragging');
    }
    drag.ghost.style.left = e.clientX + 'px';
    drag.ghost.style.top = e.clientY + 'px';
    const under = document.elementFromPoint(e.clientX, e.clientY);
    slots.forEach((s) => s.classList.toggle('target', !!under && s.contains(under) && !s.classList.contains('filled')));
  });
  const finishDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    slots.forEach((s) => s.classList.remove('target'));
    if (!d.moved) { select(d.btn); return; }           // a plain tap selects
    d.ghost.remove();
    d.btn.classList.remove('dragging');
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const slot = hit && hit.closest('.slot');
    if (slot) attempt(d.btn, slot);
  };
  tray.addEventListener('pointerup', finishDrag);
  tray.addEventListener('pointercancel', (e) => {
    if (!drag) return;
    if (drag.ghost) drag.ghost.remove();
    drag.btn.classList.remove('dragging');
    drag = null;
    slots.forEach((s) => s.classList.remove('target'));
  });
  // keyboard on a module (Enter/Space) selects it
  tray.addEventListener('click', (e) => { if (e.detail === 0) { const b = e.target.closest('.module'); if (b) select(b); } });

  resetBtn.addEventListener('click', build);
  build();
})();
