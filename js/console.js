/* The plan console, 10/26 — built from Figma (Wanaka Studio · 10/26).
   Console.mount(el, plan) shows it; it fires `e-approved` on document when the
   plan is approved, and closes itself on Cancel. Everything it shows comes from
   the plan and the shelves below, so real data drops in without touching markup. */
const Console = (() => {
  const A = 'assets/v2/';
  const GENRES = ['Platformer', 'Adventure', 'Puzzle', 'Racing', 'Collect-a-thon', 'Shooter', 'Runner'];
  const LOOKS = ['Stylized Toon', 'Realistic', 'Pixel', 'Low Poly', 'Graphic Ink', 'Retro Warm'];
  const QUALITY = ['Low', 'Medium', 'High', 'Ultra'];

  // what the Artist can pull from, per category
  const SHELVES = [
    {
      key: 'characters', name: 'Characters', icon: 'cat-characters.png', wide: false, crew: 'Artist',
      items: ['Frost Knight', 'Ridge Scout', 'Ember Ranger', 'Skater Kid', 'Star Witch', 'Tide Mage', 'Sky Pirate',
        'Glade Elf', 'Green Archer', 'Old Captain', 'Night Detective', 'Lumber Jack', 'Wind Samurai', 'Grumpy Gramps',
        'Field Medic', 'Snow Princess', 'City Rebel', 'Moon Dancer', 'Quiet Ranger', 'Iron Viking']
        .map((n, i) => ({ name: n, art: `${A}chars/c${String(i + 1).padStart(2, '0')}.png` })),
    },
    {
      key: 'scenes', name: 'Scenes', icon: 'cat-ideas.png', wide: true, crew: 'Artist',
      items: [['Red Canyon', 'canyon'], ['Spring Meadow', 'meadow'], ['Palm Beach', 'beach'], ['Deep Ocean', 'ocean'], ['Last Sunset', 'sunset']]
        .map(([n, f]) => ({ name: n, art: `${A}env/${f}.jpg` })),
    },
    {
      key: 'music', name: 'Music', icon: 'cat-music.png', audio: true, crew: 'Musician',
      // name, mood (sets the preview's scale and tempo), length in seconds
      items: [['Island Hop Theme', 'bright', 108], ['Coconut Bounce', 'bright', 84], ['Tide Pool', 'calm', 126],
        ['Rope Swing', 'bright', 72], ['Sunny Shore', 'calm', 141], ['Seagull Chase', 'tense', 66], ['Coral Cove', 'calm', 118],
        ['Steel Drum Jam', 'bright', 95], ['Last Jump', 'tense', 58], ['Far Beach', 'calm', 152], ['Night Lagoon', 'calm', 133],
        ['Ukulele Morning', 'bright', 101], ['Storm Clouds', 'tense', 79], ['Victory Splash', 'bright', 42], ['Sand Castle', 'calm', 88]]
        .map(([n, mood, len], i) => ({ name: n, mood, len, seed: i + 1 })),
    },
  ];

  let host = null, plan = null, timers = [];

  const Keychain = (() => {
    const TAGS = [['tag-v2-1', .524, .115, .998], ['tag-v2-2', .482, .119, .973], ['tag-v2-3', .488, .118, .996],
      ['tag-v2-4', .473, .113, .981], ['tag-v2-5', .489, .116, 1.002]];
    let raf = 0;
    const start = (root) => {
      cancelAnimationFrame(raf);
      const kc = root.querySelector('#kc'), svg = root.querySelector('#kcChain'), charm = root.querySelector('#kcCharm'), eye = root.querySelector('#pcEye');
      if (!kc || !eye) return;
      kc.classList.remove('is-hidden');
      const [f, hx, hy, ar] = TAGS[Math.floor(Math.random() * TAGS.length)];
      charm.querySelector('img').src = `${A}tags/${f}.png`;
      charm.style.setProperty('--hx', hx); charm.style.setProperty('--hy', hy); charm.style.setProperty('--ar', ar);
      const N = 7, W = [0, 1, 1, 1, 1, 1, 9];
      const P = Array.from({ length: N }, () => ({ x: 0, y: 0, px: 0, py: 0 }));
      let seg = 9, ready = false, last = performance.now();
      const anchor = () => {
        const r = eye.getBoundingClientRect(), k = kc.getBoundingClientRect();
        return { x: r.left + r.width / 2 - k.left, y: r.top + r.height / 2 - k.top, w: r.width };
      };
      const step = (dt) => {
        const a = anchor();
        if (!a.w) return;
        seg = Math.max(6, a.w * .62);
        if (!ready) { P.forEach((q, i) => { q.x = q.px = a.x; q.y = q.py = a.y + i * seg; }); ready = true; }
        const g = 2400 * dt * dt;
        P.forEach((q, i) => {
          if (i === 0) return;
          const vx = (q.x - q.px) * .955, vy = (q.y - q.py) * .955;
          q.px = q.x; q.py = q.y; q.x += vx; q.y += vy + g;
        });
        P[0].x = a.x; P[0].y = a.y;
        for (let it = 0; it < 10; it++) {
          for (let i = 0; i < N - 1; i++) {
            const Aa = P[i], B = P[i + 1];
            const dx = B.x - Aa.x, dy = B.y - Aa.y, d = Math.hypot(dx, dy) || .001, diff = (d - seg) / d;
            const wa = i === 0 ? 0 : 1 / W[i], wb = 1 / W[i + 1], sum = wa + wb;
            Aa.x += dx * diff * wa / sum; Aa.y += dy * diff * wa / sum;
            B.x -= dx * diff * wb / sum; B.y -= dy * diff * wb / sum;
          }
        }
      };
      const draw = () => {
        let h = `<circle cx="${P[0].x}" cy="${P[0].y}" r="${seg * .72}" class="kc__ring"/>`;
        for (let i = 0; i < N - 1; i++) {
          const Aa = P[i], B = P[i + 1], cx = (Aa.x + B.x) / 2, cy = (Aa.y + B.y) / 2;
          const ang = Math.atan2(B.y - Aa.y, B.x - Aa.x) * 180 / Math.PI, L = seg * 1.18;
          h += i % 2
            ? `<rect x="${-L / 2}" y="-1.3" width="${L}" height="2.6" rx="1.3" transform="translate(${cx} ${cy}) rotate(${ang})" class="kc__edge"/>`
            : `<ellipse rx="${L / 2}" ry="${seg * .36}" transform="translate(${cx} ${cy}) rotate(${ang})" class="kc__link"/>`;
        }
        svg.innerHTML = h;
        const E = P[N - 1], D = P[N - 2];
        charm.style.transform = `translate(${E.x}px, ${E.y}px) rotate(${Math.atan2(E.y - D.y, E.x - D.x) * 180 / Math.PI - 90}deg)`;
      };
      const tick = (now) => {
        const dt = Math.min(.033, (now - last) / 1000); last = now;
        step(dt / 2); step(dt / 2);
        if (ready) draw();
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const stop = (now) => {
      const kc = host && host.querySelector('#kc');
      if (kc) kc.classList.add('is-hidden');
      if (now) cancelAnimationFrame(raf); else setTimeout(() => cancelAnimationFrame(raf), 400);
    };
    return { start, stop };
  })();
  let state = null;
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const $ = (sel) => host.querySelector(sel);
  const $$ = (sel) => [...host.querySelectorAll(sel)];

  /* ── markup ─────────────────────────────────────────────────── */
  const select = (key, value, options) => `
    <div class="sel" data-sel="${key}">
      <button class="sel__btn" type="button"><span>${value}</span><img src="${A}chevron-down.svg" alt="" width="16" height="16"></button>
      <div class="sel__menu">${options.map((o) => `<button class="sel__opt${o === value ? ' is-on' : ''}" type="button" data-v="${o}">${o}</button>`).join('')}</div>
    </div>`;
  const seg = (key, options, on) => `
    <div class="seg" data-seg="${key}">${options.map((o) => `<button class="opt${o === on ? ' is-on' : ''}" type="button" data-v="${o}">${o}</button>`).join('')}</div>`;
  const checks = (key, options, on) => `
    <div class="seg" data-checks="${key}">${options.map((o) => `
      <button class="opt${on.includes(o) ? ' is-on' : ''}" type="button" data-v="${o}">
        <img src="${A}${on.includes(o) ? 'check-on' : 'check-off'}.svg" alt="">${o}</button>`).join('')}</div>`;

  const markup = (p) => `
    <div class="pc" id="pc">
      <span class="pc__scrim"></span>
      <div class="kc" id="kc" aria-hidden="true">
        <svg class="kc__chain" id="kcChain"></svg>
        <button class="kc__charm" id="kcCharm" type="button" tabindex="-1"><img class="kc__img" alt=""></button>
      </div>
      <div class="pc__stage" id="pcStage">

        <div class="pc__closed" aria-hidden="true">
          <div class="pc__body">
            <img class="pc__lid" src="${A}lid-closed.png" alt="">
            <div class="pc__under"><span class="under__vents">${'<i></i>'.repeat(7)}</span>
              <span class="under__label"><b>wanaka</b><em>W1 · Plan console</em></span></div>
            <span class="pc__lug"><span class="pc__eyelet" id="pcEye"></span></span>
          </div>
          <span class="pc__paw"><img src="${A}paw.png" alt=""><i class="paw__arm"></i></span>
        </div>

        <div class="pc__open">
          <div class="lid" id="pcLid">
          <div class="half half__out" aria-hidden="true">
            <img class="out__badge" src="${A}badge.png" alt="">
            <img class="out__word" src="${A}wanaka-engraved.svg" alt="">
            <img class="out__paw" src="${A}paw-print.svg" alt="">
          </div>
          <section class="half half--l" id="pcLeft" data-step="plan">
            <div class="plan-l">
              <div class="cover is-generating" id="pcCover">
                <img class="cover__img" id="pcCoverImg" src="${p.cover}" alt="">
                <span class="cover__glare cover__glare--a"></span><span class="cover__glare cover__glare--b"></span>
                <div class="cover__state cover__state--gen">
                  <span class="cover__sheen"></span>
                  <span class="spin"></span>
                  <p class="cover__title">Generating your cover…</p>
                  <p class="cover__sub">About 20 seconds — keep editing the plan meanwhile.</p>
                  <span class="bar"><i></i></span>
                </div>
                <div class="cover__state cover__state--fail">
                  <span class="alert">!</span>
                  <p class="cover__title">Couldn't make the cover</p>
                  <p class="cover__sub">Your plan is safe. Try again, or keep going without a cover.</p>
                  <button class="retry" type="button" id="pcRetry">↻ Try again</button>
                </div>
              </div>
              <img class="pc__word" src="${A}wanaka-engraved.svg" alt="Wanaka">
              <button class="btn btn--dark regen" type="button" id="pcRegen" disabled>Regenerate cover</button>
            </div>
            <div class="cats">${SHELVES.map((s, i) => `
              <button class="cat${i === 0 ? ' is-on' : ''}" type="button" data-cat="${i}">
                <img class="cat__icon" src="${A}${s.icon}" alt="">
                <span class="cat__row"><span class="cat__name">${s.name}</span><img class="cat__chev" src="${A}chevron-right.svg" alt=""></span>
                <span class="cat__sub">Picked by AI</span>
              </button>`).join('')}
            </div>
          </section>
          </div>

          <span class="hinge hinge--a"></span><span class="hinge hinge--b"></span>

          <section class="half half--r">
            <nav class="tabs">
              <button class="tab is-on" type="button" data-tab="plan">1.Plan</button>
              <button class="tab" type="button" data-tab="assets">2.Assets</button>
            </nav>
            <div class="body">
              <div class="page is-on" data-page="plan">
                <label class="fld"><span class="fld__k">Game name</span><input class="inp" value="${p.title}" spellcheck="false"></label>
                <div class="fld"><span class="fld__k">Genre</span>${select('genre', p.genre, GENRES)}</div>
                <label class="fld"><span class="fld__k">What you do</span><textarea class="inp" spellcheck="false">${p.doing}</textarea></label>
                <label class="fld"><span class="fld__k">How it feels?</span><input class="inp" value="${p.feel}" spellcheck="false"></label>
                <div class="fld"><span class="fld__k">Look</span>${select('look', `${p.style} · ${p.quality}`, LOOKS.flatMap((l) => QUALITY.slice(1).map((q) => `${l} · ${q}`)))}</div>
                <div class="fld fld--choice"><span class="fld__k">Scope</span>${seg('scope', ['Slice', 'Standard', 'Ambitions'], 'Ambitions')}</div>
                <div class="fld fld--choice"><span class="fld__k">Plays on</span>${checks('plat', ['Web', 'Mobile'], ['Web'])}</div>
                <div class="fld fld--choice"><span class="fld__k">A run</span>${seg('run', ['3-5 min', '8-12 min', '15-20 min'], '15-20 min')}</div>
                <div class="fld fld--choice"><span class="fld__k">Difficulty</span>${seg('diff', ['Gentle', 'Normal', 'Tough'], 'Tough')}</div>
              </div>
              <div class="page" data-page="assets">
                <label class="search"><img src="${A}search.svg" alt="" width="16" height="16"><input type="search" placeholder="Search" id="pcSearch"></label>
                <div class="grid" id="pcGrid"></div>
              </div>
            </div>
            <footer class="foot">
              <button class="btn btn--dark" type="button" id="pcCancel">Cancel</button>
              <button class="btn btn--light" type="button" id="pcNext">Next Assets</button>
            </footer>
          </section>
        </div>
      </div>
    </div>`;

  /* ── the cover: generating → ready, or failed → try again ─────── */
  const cover = (mode) => {
    const el = $('#pcCover');
    el.classList.remove('is-generating', 'is-ready', 'is-failed');
    void el.offsetWidth;
    el.classList.add(`is-${mode}`);
    $('#pcRegen').disabled = mode !== 'ready';
  };
  const generate = ({ fail = false } = {}) => {
    cover('generating');
    const ms = 2800;
    $('#pcCover').style.setProperty('--gen', `${ms}ms`);
    at(ms, () => cover(fail ? 'failed' : 'ready'));
  };

  /* ── music previews: a short tune made on the spot, one at a time ── */
  const Preview = (() => {
    const CLIP = 12;   // seconds of preview
    const SCALES = { bright: [0, 2, 4, 7, 9], calm: [0, 3, 5, 7, 10], tense: [0, 1, 3, 6, 7] };
    const TEMPO = { bright: 132, calm: 84, tense: 150 };
    let ctx = null, out = null, now = null, raf = 0;
    const rand = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const note = (t, f, len, type, vol) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + .01);
      g.gain.exponentialRampToValueAtTime(.0001, t + len);
      o.connect(g).connect(out); o.start(t); o.stop(t + len + .05);
    };
    const play = (it, onTick, onEnd) => {
      stop();
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      ctx.resume();
      out = ctx.createGain(); out.gain.value = .5; out.connect(ctx.destination);
      const r = rand(it.seed * 7919), sc = SCALES[it.mood], beat = 60 / TEMPO[it.mood], t0 = ctx.currentTime + .05;
      const root = 220 * 2 ** ((it.seed % 7) / 12), hz = (deg) => root * 2 ** ((sc[deg % 5] + 12 * Math.floor(deg / 5)) / 12);
      const riff = Array.from({ length: 8 }, () => Math.floor(r() * 8) + 3);
      for (let i = 0, t = t0; t < t0 + CLIP; i++, t += beat / 2) {
        if (r() > .18) note(t, hz(riff[i % 8] + (Math.floor(i / 16) % 2) * 2), beat * .9, it.mood === 'calm' ? 'sine' : 'triangle', .12);
        if (i % 4 === 0) note(t, hz(i % 16 < 8 ? 0 : 3) / 2, beat * 1.8, 'sine', .16);
      }
      const start = performance.now();
      now = { it, onEnd };
      const tick = () => {
        const p = Math.min((performance.now() - start) / (CLIP * 1000), 1);
        onTick(p, Math.floor(p * CLIP));
        if (p < 1) raf = requestAnimationFrame(tick); else stop();
      };
      tick();
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      if (out) { const o = out; o.gain.setTargetAtTime(0, ctx.currentTime, .03); setTimeout(() => o.disconnect(), 200); out = null; }
      if (now) { const { onEnd } = now; now = null; onEnd(); }
    };
    const playing = () => now && now.it;
    return { play, stop, playing };
  })();
  const esc = (t) => t.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  // a fixed-looking waveform per track
  const wave = (seed) => {
    let x = seed * 9301;
    return Array.from({ length: 26 }, (_, i) => {
      x = (x * 16807) % 2147483647;
      const env = Math.sin(Math.PI * (i + .5) / 26) * .55 + .45;
      return Math.round(10 + env * (x % 100) / 100 * 34);
    });
  };

  /* ── the asset grid for the open category ─────────────────────── */
  const paintGrid = () => {
    Preview.stop();
    const shelf = SHELVES[state.cat];
    const q = $('#pcSearch').value.trim().toLowerCase();
    const items = shelf.items.filter((it) => !q || it.name.toLowerCase().includes(q));
    const picked = state.picks[shelf.key];
    const art = (it) => shelf.audio ? `
          <span class="track">
            <span class="track__wave">${wave(it.seed).map((h) => `<i style="height:${h}px"></i>`).join('')}</span>
            <span class="track__play" role="button" aria-label="Play ${it.name}"></span>
            <span class="track__time">${clock(it.len)}</span>
          </span>` : `
          <img class="art" src="${it.art}" alt="" loading="lazy">`;
    $('#pcGrid').innerHTML = items.length ? items.map((it) => `
      <button class="tile${shelf.wide ? ' tile--wide' : ''}${shelf.audio ? ' tile--audio' : ''}${picked.has(it.name) ? ' is-on' : ''}" type="button" data-name="${it.name}">
        <span class="tile__art">${art(it)}
          <img class="tile__pick tile__pick--off" src="${A}pick-off.svg" alt="">
          <span class="tile__pick tile__pick--on"></span>
        </span>
        <span class="tile__name">${it.name}</span>
      </button>`).join('') : `
      <div class="empty">
        <img class="empty__crew" src="${A}crew-${shelf.crew.toLowerCase()}.png" alt="">
        <p class="empty__title">No “${esc($('#pcSearch').value.trim())}” in the library</p>
        <p class="empty__body">Leave it to AI. It will pick one that fits your game.</p>
        <button class="btn btn--dark empty__clear" type="button">Clear search</button>
      </div>`;
    const clear = $('.empty__clear');
    if (clear) clear.onclick = () => { $('#pcSearch').value = ''; paintGrid(); $('#pcSearch').focus(); };
    $$('.tile').forEach((t) => {
      t.onclick = () => {
        const n = t.dataset.name;
        if (picked.has(n)) picked.delete(n); else picked.add(n);
        t.classList.toggle('is-on', picked.has(n));
        paintCats();
      };
    });
    $$('.track__play').forEach((b) => {
      b.onclick = (e) => {
        e.stopPropagation();
        const tile = b.closest('.tile'), it = shelf.items.find((x) => x.name === tile.dataset.name);
        if (Preview.playing() === it) return Preview.stop();
        const bars = [...tile.querySelectorAll('.track__wave i')], time = tile.querySelector('.track__time');
        tile.classList.add('is-playing');
        Preview.play(it, (p, sec) => {
          bars.forEach((bar, i) => bar.classList.toggle('is-past', i / bars.length < p));
          time.textContent = clock(sec);
        }, () => {
          tile.classList.remove('is-playing');
          bars.forEach((bar) => bar.classList.remove('is-past'));
          time.textContent = clock(it.len);
        });
      };
    });
  };
  const paintCats = () => {
    $$('.cat').forEach((c, i) => {
      const n = state.picks[SHELVES[i].key].size;
      c.classList.toggle('is-on', i === state.cat);
      c.classList.toggle('has-picks', n > 0);
      c.querySelector('.cat__sub').textContent = n ? `${n} picked by you` : 'Picked by AI';
    });
  };

  /* ── steps ─────────────────────────────────────────────────────── */
  const step = (name) => {
    state.step = name;
    $('#pcLeft').dataset.step = name;
    $$('.tab').forEach((t) => t.classList.toggle('is-on', t.dataset.tab === name));
    $$('.page').forEach((p) => p.classList.toggle('is-on', p.dataset.page === name));
    $('#pcNext').textContent = name === 'plan' ? 'Next Assets' : 'Approve';
    if (name === 'assets') { paintCats(); paintGrid(); } else Preview.stop();
  };

  const leave = (how, then) => {
    Preview.stop();
    const pc = $('#pc');
    if (how === 'approve') {
      // shut, spin, and the paw takes it away — with the keychain back on while it is shut
      pc.classList.add('is-leaving');
      at(720, () => pc.classList.add('is-folded'));
      at(800, () => Keychain.start(host));
      at(4300, then);
    } else {
      pc.classList.add('is-closing');
      at(720, () => pc.classList.add('is-folded'));
      at(1100, then);
    }
  };

  /* ── wiring ────────────────────────────────────────────────────── */
  const wire = () => {
    // fit the 1744 × 907 stage to the window
    const fit = () => {
      const s = Math.min((innerWidth - 64) / 1744, (innerHeight - 64) / 907, 1);
      $('#pcStage').style.setProperty('--s', s.toFixed(4));
    };
    fit();
    addEventListener('resize', fit);
    state.unfit = () => removeEventListener('resize', fit);

    // the paw brings it up, then it opens and the cover starts generating
    Keychain.start(host);
    at(2700, () => { $('#pc').classList.add('is-open'); Keychain.stop(); });
    at(3900, () => generate());

    $('#pcRegen').onclick = () => { state.regens += 1; generate({ fail: state.regens === 2 }); };
    $('#pcRetry').onclick = () => generate();

    $$('.tab').forEach((t) => { t.onclick = () => step(t.dataset.tab); });
    $('#pcNext').onclick = () => {
      if (state.step === 'plan') return step('assets');
      leave('approve', () => document.dispatchEvent(new CustomEvent('e-approved', { detail: { picks: state.picks } })));
    };
    $('#pcCancel').onclick = () => leave('cancel', () => unmount());

    // selects
    $$('.sel').forEach((s) => {
      s.querySelector('.sel__btn').onclick = (e) => {
        e.stopPropagation();
        $$('.sel').forEach((o) => o !== s && o.classList.remove('is-open'));
        s.classList.toggle('is-open');
      };
      s.querySelectorAll('.sel__opt').forEach((o) => {
        o.onclick = () => {
          s.querySelectorAll('.sel__opt').forEach((x) => x.classList.toggle('is-on', x === o));
          s.querySelector('.sel__btn span').textContent = o.dataset.v;
          s.classList.remove('is-open');
        };
      });
    });
    host.addEventListener('click', () => $$('.sel').forEach((s) => s.classList.remove('is-open')));

    // pick one
    $$('[data-seg]').forEach((g) => g.querySelectorAll('.opt').forEach((o) => {
      o.onclick = () => g.querySelectorAll('.opt').forEach((x) => x.classList.toggle('is-on', x === o));
    }));
    // pick any
    $$('[data-checks]').forEach((g) => g.querySelectorAll('.opt').forEach((o) => {
      o.onclick = () => {
        const on = !o.classList.contains('is-on');
        if (!on && g.querySelectorAll('.opt.is-on').length === 1) return;   // keep at least one platform
        o.classList.toggle('is-on', on);
        o.querySelector('img').src = `${A}${on ? 'check-on' : 'check-off'}.svg`;
      };
    }));

    // categories and search
    $$('.cat').forEach((c) => { c.onclick = () => { state.cat = +c.dataset.cat; $('#pcSearch').value = ''; paintCats(); paintGrid(); }; });
    $('#pcSearch').oninput = paintGrid;
  };

  const mount = (el, p) => {
    clear();
    host = el; plan = p;
    state = { step: 'plan', cat: 0, regens: 0, picks: Object.fromEntries(SHELVES.map((s) => [s.key, new Set()])) };
    host.innerHTML = markup(p);
    host.hidden = false;
    wire();
  };
  const unmount = () => {
    clear();
    Preview.stop();
    Keychain.stop(true);
    if (state && state.unfit) state.unfit();
    if (host) { host.innerHTML = ''; host.hidden = true; }
  };
  const replay = () => mount(host, plan);

  return { mount, unmount, replay };
})();
