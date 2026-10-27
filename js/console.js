/* The plan console, 10/26 — built from Figma (Wanaka Studio · 10/26).
   Console.mount(el, plan) shows it; it fires `e-approved` on document when the
   plan is approved, and closes itself on Cancel. Everything it shows comes from
   the plan and the shelves below, so real data drops in without touching markup. */
const Console = (() => {
  const A = 'assets/v2/';
  const GENRES = ['Platformer', 'Adventure', 'Puzzle', 'Racing', 'Collect-a-thon', 'Shooter', 'Runner'];
  const LOOKS = ['Stylized Toon', 'Realistic', 'Pixel', 'Low Poly', 'Graphic Ink', 'Retro Warm'];
  const QUALITY = ['Low', 'Medium', 'High', 'Ultra'];

  // how each character sits in its 119.6 × 110.7 picture box (Figma's crop): width %, height %, left %, top %
  const CROPS = [[100, 141.19, 0, -.35], [79.82, 207.93, 17.05, .49], [100, 191.22, 0, -.06], [99.26, 189.8, .56, .48],
    [85.29, 115.21, 7.17, .68], [135.85, 208.24, -17.93, -20.14], [185.02, 231.01, -42.51, -40.59], [133.34, 159.98, -16.67, -5.34],
    [120.67, 195.62, -25.43, -11.41], [115.54, 175.44, -7.77, -8.4], [106.18, 143.35, -3.09, -7.95], [100, 122.18, 0, .32],
    [88.65, 129.49, 5.68, -5.83], [116.87, 134.12, -8.44, -5.05], [100, 191.22, 0, -.42], null, [100, 144.75, 0, -11.14],
    [82.14, 118.3, 8.93, -.24], [82.59, 158.53, 8.71, -5.25], [111.34, 120.25, -5.67, -.14]];

  // what the Artist can pull from, per category
  const SHELVES = [
    {
      key: 'characters', name: 'Characters', icon: 'cat-characters.png', wide: false, crew: 'Artist',
      items: ['Frost Knight', 'Ridge Scout', 'Ember Ranger', 'Skater Kid', 'Star Witch', 'Tide Mage', 'Sky Pirate',
        'Glade Elf', 'Green Archer', 'Old Captain', 'Night Detective', 'Lumber Jack', 'Wind Samurai', 'Grumpy Gramps',
        'Field Medic', 'Snow Princess', 'City Rebel', 'Moon Dancer', 'Quiet Ranger', 'Iron Viking']
        .map((n, i) => ({ name: n, art: `${A}chars/c${String(i + 1).padStart(2, '0')}.png`, crop: CROPS[i] })),
    },
    {
      key: 'scenes', name: 'Scenes', icon: 'cat-ideas.png', wide: true, crew: 'Artist',
      items: [['Red Canyon', 'canyon'], ['Spring Meadow', 'meadow'], ['Palm Beach', 'beach'], ['Deep Ocean', 'ocean'], ['Last Sunset', 'sunset']]
        .map(([n, f]) => ({ name: n, art: `${A}env/${f}.jpg` })),
    },
    {
      key: 'props', name: 'Props', icon: 'cat-ideas.png', wide: true, crew: 'Artist',
      items: [['Baseball', 'baseballs'], ['Basketball', 'basketball'], ['Book Stack', 'book-stacks'], ['Dino Plush', 'dino-suit'],
        ['Dresser', 'dresser'], ['Pencils', 'pencils'], ['Robot Pal', 'robot-pal'], ['Star Pillow', 'stars'], ['Teddy Bear', 'teddy'],
        ['Toy Blocks', 'toy-blocks'], ['Toy Truck', 'truck']]
        .map(([n, f]) => ({ name: n, art: `${A}props/${f}.jpg` })),
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

  /* ── the keychain: hung on once the plan is approved. It hangs from a lug on the shut
     console and lives inside it, so it can never drift off the console. A damped pendulum reads the console's own
     transform each frame (no layout reads), so it swings when the console is pushed,
     tilted or carried, and rides along untouched while it turns in 3D. ── */
  const Keychain = (() => {
    const TAGS = [['tag-v2-1', .524, .115, .998], ['tag-v2-2', .482, .119, .973], ['tag-v2-3', .488, .118, .996],
      ['tag-v2-4', .473, .113, .981], ['tag-v2-5', .489, .116, 1.002]];
    const L = 74, W = 112, G = 2600, DAMP = 3.2, MAX = .85, FLING = 1.4, IN = .22, PUSH = .45, R = 451;
    // chain length, charm width (stage px), gravity, damping, max swing / max when flung by a turn / most it can swing in (rad),
    // how much the console's motion throws it, and how far the eyelet sits from the axis it turns on
    let raf = 0, el = null;
    const markup = () => {
      const [name, hx, hy, ar] = TAGS[Math.floor(Math.random() * TAGS.length)];
      const links = Array.from({ length: 7 }, (_, i) => {
        const y = 6 + i * ((L - 8) / 7);
        return i % 2 ? `<rect x="-1.3" y="${y}" width="2.6" height="${(L - 8) / 7 + 1}" rx="1.3" class="kc__edge"/>`
          : `<ellipse cx="0" cy="${y + (L - 8) / 14}" rx="3.1" ry="${(L - 8) / 14 + 1.2}" class="kc__link"/>`;
      }).join('');
      return `<span class="pc__lug"><span class="pc__eyelet"></span></span>
        <span class="kc" style="--hx:${hx};--hy:${hy};--ar:${ar}">
          <svg class="kc__chain" viewBox="-8 0 16 ${L}" width="16" height="${L}"><circle cx="0" cy="3" r="3.4" class="kc__ring"/>${links}</svg>
          <img class="kc__img" src="${A}tags/${name}.png" alt="" style="width:${W}px;left:${-W * hx}px;top:${L - (W / ar) * hy}px">
        </span>`;
    };
    // where the pivot is on screen-space axes, from the transforms of the console and its box
    const pivot = (body, box) => {
      const mb = new DOMMatrix(getComputedStyle(body).transform === 'none' ? undefined : getComputedStyle(body).transform);
      const mc = new DOMMatrix(getComputedStyle(box).transform === 'none' ? undefined : getComputedStyle(box).transform);
      return { flat: mb.is2D, ang: Math.atan2(mb.b, mb.a), turn: Math.atan2(-mb.m13, mb.m11), m: mc.multiply(mb) };
    };
    const start = (root, swing = 0) => {
      cancelAnimationFrame(raf);
      el = root.querySelector('.kc');
      const body = root.querySelector('.pc__body'), box = root.querySelector('.pc__closed');
      if (!el || !body) return;
      let th = swing, w = 0, last = 0, p0 = null, v0 = null, local = -swing, turn0 = null, spin = 0;
      const swingBy = (ax, ay, dt, max) => {   // one step of the pendulum under gravity and a push (ax, ay)
        w += ((-ax * Math.cos(th) - (G - ay) * Math.sin(th)) / L - DAMP * w) * dt;
        th += w * dt;
        if (th > max) { th = max; if (w > 0) w = 0; }        // at the limit it stops, it doesn't keep winding up
        if (th < -IN) { th = -IN; if (w < 0) w *= -.35; }   // the console's side stops it swinging in
      };
      const tick = (t) => {
        const dt = Math.min(.033, last ? (t - last) / 1000 : .016); last = t;
        const { flat, ang, turn, m } = pivot(body, box);
        if (flat) {
          const p = { x: m.e, y: m.f };   // pivot motion is dominated by the console's translation
          const v = p0 ? { x: (p.x - p0.x) / dt, y: (p.y - p0.y) / dt } : { x: 0, y: 0 };
          const a = v0 ? { x: (v.x - v0.x) / dt, y: (v.y - v0.y) / dt } : { x: 0, y: 0 };
          swingBy(PUSH * Math.max(-6000, Math.min(6000, a.x)), PUSH * Math.max(-6000, Math.min(6000, a.y)), dt, Math.max(MAX, Math.abs(th)));
          p0 = p; v0 = v; turn0 = null; spin = 0;
          local = -th - ang;   // CSS turns clockwise, θ counts toward +x; the console's own tilt is undone so it hangs true
        } else {
          // turning on its upright axis: the spin flings the charm outward, away from the axis
          if (turn0 !== null) {
            let d = turn - turn0;
            if (d > Math.PI) d -= 2 * Math.PI; else if (d < -Math.PI) d += 2 * Math.PI;
            spin += (d / dt - spin) * .35;   // smoothed angular speed
          }
          turn0 = turn; p0 = null; v0 = null;
          swingBy(-spin * spin * R, 0, dt, FLING);   // outward is +x in the console's own frame
          local = -th;
        }
        el.style.transform = `rotate(${local}rad)`;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    return { markup, start, stop };
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
      <div class="pc__stage" id="pcStage">

        <div class="pc__closed" aria-hidden="true">
          <div class="pc__body">
            <div class="half pc__face"><img class="out__badge" src="${A}badge.png" alt="">
              <img class="out__word" src="${A}wanaka-engraved.svg" alt=""><img class="out__paw" src="${A}paw-print.svg" alt=""></div>
            <div class="pc__under"></div>
            ${Keychain.markup()}
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
              <div class="cover is-ready" id="pcCover">
                <img class="cover__img" id="pcCoverImg" src="${p.cover}" alt="">
                <span class="cover__glare cover__glare--a"></span><span class="cover__glare cover__glare--b"></span>
                <div class="cover__state cover__state--gen">
                  <span class="cover__sheen"></span>
                  <img class="cover__icon cover__icon--spin" src="${A}loading.svg" alt="">
                  <p class="cover__title">Generating your cover…</p>
                </div>
                <div class="cover__state cover__state--fail">
                  <img class="cover__icon" src="${A}warning.svg" alt="">
                  <p class="cover__title">Couldn't make the cover</p>
                  <p class="cover__sub">Your plan is safe. Try again, or keep going without a cover.</p>
                  <button class="btn btn--light" type="button" id="pcRetry">Try Again</button>
                </div>
              </div>
              <img class="pc__word" src="${A}wanaka-engraved.svg" alt="Wanaka">
              <button class="btn btn--dark regen" type="button" id="pcRegen">Regenerate cover</button>
            </div>
            <div class="cats">${SHELVES.map((s, i) => `
              <button class="cat${i === 0 ? ' is-on' : ''}" type="button" data-cat="${i}">
                <img class="cat__icon" src="${A}${s.icon}" alt="">
                <span class="cat__name">${s.name}</span>
                <span class="cat__row"><span class="cat__sub">Picked by AI</span><img class="cat__chev" src="${A}arrow-right.svg" alt=""></span>
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
    $('#pcRegen').hidden = mode !== 'ready';
  };
  const generate = ({ fail = false } = {}) => {
    cover('generating');
    const ms = 2800;
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
          ${it.crop !== undefined ? `<span class="art-box"><img class="art" src="${it.art}" alt="" loading="lazy"${it.crop ? ` style="width:${it.crop[0]}%;height:${it.crop[1]}%;left:${it.crop[2]}%;top:${it.crop[3]}%"` : ' data-fill'}></span>` : `<img class="art" src="${it.art}" alt="" loading="lazy">`}`;
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
    nextLabel();
    if (name === 'assets') { paintCats(); paintGrid(); } else Preview.stop();
  };

  const openCat = (i) => { state.cat = i; $('#pcSearch').value = ''; paintCats(); paintGrid(); nextLabel(); };
  const last = () => state.cat === SHELVES.length - 1;
  const nextLabel = () => { $('#pcNext').textContent = state.step === 'plan' ? 'Next Assets' : last() ? 'Start Building' : 'Next'; };

  const leave = (how, then) => {
    Preview.stop();
    const pc = $('#pc');
    if (how === 'approve') {
      // shut, spin, and the paw takes it away — with the keychain back on while it is shut
      pc.classList.add('is-leaving');
      at(700, () => pc.classList.add('is-folded'));
      // the plan is done: a keychain gets hung on the shut console before it goes
      at(760, () => { Keychain.start(host, .7); pc.classList.add('kc-on'); });
      at(4300, then);
    } else {
      pc.classList.add('is-closing');
      at(700, () => pc.classList.add('is-folded'));
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

    // the paw brings it up, the keychain drops away, then the cover opens right there
    at(2450, () => $('#pc').classList.add('is-open'));

    $('#pcRegen').onclick = () => { state.regens += 1; generate({ fail: state.regens === 2 }); };
    $('#pcRetry').onclick = () => generate();

    $$('.tab').forEach((t) => { t.onclick = () => step(t.dataset.tab); });
    $('#pcNext').onclick = () => {
      if (state.step === 'plan') return step('assets');
      if (!last()) return openCat(state.cat + 1);
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
    $$('.cat').forEach((c) => { c.onclick = () => openCat(+c.dataset.cat); });
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
    Keychain.stop();
    if (state && state.unfit) state.unfit();
    if (host) { host.innerHTML = ''; host.hidden = true; }
  };
  const replay = () => mount(host, plan);

  return { mount, unmount, replay };
})();
