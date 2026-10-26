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
      key: 'characters', name: 'Characters', icon: 'cat-characters.png', wide: false,
      items: ['Frost Knight', 'Ridge Scout', 'Ember Ranger', 'Skater Kid', 'Star Witch', 'Tide Mage', 'Sky Pirate',
        'Glade Elf', 'Green Archer', 'Old Captain', 'Night Detective', 'Lumber Jack', 'Wind Samurai', 'Grumpy Gramps',
        'Field Medic', 'Snow Princess', 'City Rebel', 'Moon Dancer', 'Quiet Ranger', 'Iron Viking']
        .map((n, i) => ({ name: n, art: `${A}chars/c${String(i + 1).padStart(2, '0')}.png` })),
    },
    {
      key: 'scenes', name: 'Scenes', icon: 'cat-ideas.png', wide: true,
      items: [['Red Canyon', 'canyon'], ['Spring Meadow', 'meadow'], ['Palm Beach', 'beach'], ['Deep Ocean', 'ocean'], ['Last Sunset', 'sunset']]
        .map(([n, f]) => ({ name: n, art: `${A}env/${f}.jpg` })),
    },
    {
      key: 'music', name: 'Music', icon: 'cat-music.png', wide: true,
      items: [['Desert Wind', 'canyon'], ['Green Hills', 'meadow'], ['Tide Pool', 'beach'], ['Deep Blue', 'ocean'], ['Golden Hour', 'sunset']]
        .map(([n, f]) => ({ name: n, art: `${A}env/${f}.jpg` })),
    },
  ];

  let host = null, plan = null, timers = [];
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
          <img class="pc__lid" src="${A}lid-closed.png" alt="">
          <img class="pc__paw" src="${A}paw.png" alt="">
        </div>

        <div class="pc__open">
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
                <span class="cat__sub">Left to the Artist</span>
              </button>`).join('')}
            </div>
          </section>

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

  /* ── the asset grid for the open category ─────────────────────── */
  const paintGrid = () => {
    const shelf = SHELVES[state.cat];
    const q = $('#pcSearch').value.trim().toLowerCase();
    const items = shelf.items.filter((it) => !q || it.name.toLowerCase().includes(q));
    const picked = state.picks[shelf.key];
    $('#pcGrid').innerHTML = items.length ? items.map((it) => `
      <button class="tile${shelf.wide ? ' tile--wide' : ''}${picked.has(it.name) ? ' is-on' : ''}" type="button" data-name="${it.name}">
        <span class="tile__art">
          <img class="art" src="${it.art}" alt="" loading="lazy">
          <img class="tile__pick tile__pick--off" src="${A}pick-off.svg" alt="">
          <span class="tile__pick tile__pick--on"></span>
        </span>
        <span class="tile__name">${it.name}</span>
      </button>`).join('') : `<p class="empty">Nothing called “${$('#pcSearch').value.trim()}” in ${shelf.name.toLowerCase()} — leave it to the Artist.</p>`;
    $$('.tile').forEach((t) => {
      t.onclick = () => {
        const n = t.dataset.name;
        if (picked.has(n)) picked.delete(n); else picked.add(n);
        t.classList.toggle('is-on', picked.has(n));
        paintCats();
      };
    });
  };
  const paintCats = () => {
    $$('.cat').forEach((c, i) => {
      const n = state.picks[SHELVES[i].key].size;
      c.classList.toggle('is-on', i === state.cat);
      c.classList.toggle('has-picks', n > 0);
      c.querySelector('.cat__sub').textContent = n ? `${n} picked` : 'Left to the Artist';
    });
  };

  /* ── steps ─────────────────────────────────────────────────────── */
  const step = (name) => {
    state.step = name;
    $('#pcLeft').dataset.step = name;
    $$('.tab').forEach((t) => t.classList.toggle('is-on', t.dataset.tab === name));
    $$('.page').forEach((p) => p.classList.toggle('is-on', p.dataset.page === name));
    $('#pcNext').textContent = name === 'plan' ? 'Next Assets' : 'Approve';
    if (name === 'assets') { paintCats(); paintGrid(); }
  };

  const leave = (then) => {
    const pc = $('#pc');
    pc.classList.add('is-leaving');
    at(700, then);
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
    at(2000, () => { $('#pc').classList.add('is-open'); generate(); });

    $('#pcRegen').onclick = () => { state.regens += 1; generate({ fail: state.regens === 2 }); };
    $('#pcRetry').onclick = () => generate();

    $$('.tab').forEach((t) => { t.onclick = () => step(t.dataset.tab); });
    $('#pcNext').onclick = () => {
      if (state.step === 'plan') return step('assets');
      leave(() => document.dispatchEvent(new CustomEvent('e-approved', { detail: { picks: state.picks } })));
    };
    $('#pcCancel').onclick = () => leave(() => unmount());

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
    if (state && state.unfit) state.unfit();
    if (host) { host.innerHTML = ''; host.hidden = true; }
  };
  const replay = () => mount(host, plan);

  return { mount, unmount, replay };
})();
