/* The Studio screen: the build canvas, and the chat where plan mode runs.
   The run is scripted — swap `script()` for a real stream and nothing else moves. */
const Studio = (() => {
  let thread, timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const el = (html) => {
    const d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstElementChild;
  };
  const push = (node) => { thread.appendChild(node); thread.scrollTop = thread.scrollHeight; return node; };

  const shell = () => `
    <!-- top bar (Figma 48075:32661) -->
    <header class="topbar">
      <div class="topbar__l">
        <button class="tchip tchip--icon"><img src="assets/icon/tb-home.svg" alt="Home" width="16" height="16"></button>
        <span class="tbar__rule"></span>
        <button class="tchip">Main<img src="assets/icon/tb-dots.svg" alt="" width="14" height="14"></button>
      </div>
      <div class="topbar__c">
        <div class="tools">
          <button class="tool2 is-on"><img src="assets/icon/tb-cursor.svg" alt="Select" width="16" height="16"></button>
          <button class="tool2"><img src="assets/icon/tb-hand.svg" alt="Pan" width="16" height="16"></button>
          <span class="tbar__rule"></span>
          <button class="tool2"><img src="assets/icon/tb-move.svg" alt="Move" width="16" height="16"></button>
          <button class="tool2"><img src="assets/icon/tb-rotate.svg" alt="Rotate" width="16" height="16"></button>
          <button class="tool2 is-on"><img src="assets/icon/tb-scale.svg" alt="Scale" width="16" height="16"></button>
          <span class="tbar__rule"></span>
          <button class="tool2"><img src="assets/icon/tb-add.svg" alt="Add" width="16" height="16"></button>
        </div>
        <div class="modes2">
          <button class="modes2__b is-on"><img src="assets/icon/tb-build.svg" alt="" width="16" height="16">Build</button>
          <button class="modes2__b"><img src="assets/icon/tb-preview.svg" alt="" width="16" height="16">Preview</button>
        </div>
      </div>
      <div class="topbar__r">
        <button class="tchip tchip--solid"><img src="assets/icon/tb-friend.svg" alt="" width="16" height="16">Multiplayer</button>
        <button class="tchip tchip--publish"><img src="assets/icon/tb-publish.svg" alt="" width="16" height="16">Publish</button>
        <span class="tcredits">
          <span class="tchip tchip--light"><img src="assets/icon/tb-crown.svg" alt="" width="14" height="14">Upgrade</span>
          <span class="tcoin"><img src="assets/img/coin.png" alt="" width="16" height="16">320</span>
        </span>
        <span class="thistory">
          <img src="assets/icon/tb-history.svg" alt="" width="16" height="16">
          <img src="assets/icon/tb-undo.svg" alt="" width="16" height="16">
          <img src="assets/icon/tb-redo.svg" alt="" width="16" height="16">
          <img src="assets/icon/tb-file.svg" alt="" width="16" height="16">
        </span>
      </div>
    </header>

    <!-- the tool rail (Figma 48075:32864) -->
    <nav class="rail">
      <span class="rail__set">
        ${[1, 2, 3, 4, 5, 6].map((k) => `<button class="rail__b"><img src="assets/icon/rail-${k}.svg" alt="" width="20" height="20"></button>`).join('')}
      </span>
      <img class="rail__me" src="assets/img/rail-avatar.png" alt="" width="28" height="28">
    </nav>

    <section class="stage">
      <span class="stage__sky"></span><span class="stage__grid"></span>
      <div class="roomhost" id="roomhost" hidden></div>
      <svg class="gizmo" viewBox="0 0 96 93" aria-hidden="true">
        <g stroke-width="2" fill="none">
          <path d="M48 62 48 26" stroke="#4d8bff"/><path d="M48 62 20 46" stroke="#2fbf6b"/><path d="M48 62 80 46" stroke="#ff4d5e"/>
        </g>
        <circle cx="48" cy="24" r="8" fill="#4d8bff"/><text x="48" y="28" text-anchor="middle" font-size="9" fill="#fff">Z</text>
        <circle cx="18" cy="44" r="7" fill="#2fbf6b" opacity=".85"/>
        <circle cx="82" cy="44" r="8" fill="#ff4d5e"/><text x="82" y="48" text-anchor="middle" font-size="9" fill="#fff">X</text>
        <circle cx="48" cy="70" r="7" fill="#6f7681" opacity=".7"/>
      </svg>
      <div class="stage__empty"><b>Nothing built yet</b><span>The plan comes first — approve it and the team starts.</span></div>
    </section>

    <!-- the chat (Figma 48075:32772) -->
    <aside class="chat">
      <header class="chat__head">
        <button class="chat__name"><span>${PLAN.title}</span><img src="assets/icon/ch-chevron.svg" alt="" width="16" height="16"></button>
        <button class="chat__new" aria-label="New chat"><img src="assets/icon/ch-plus-sq.svg" alt="" width="12" height="12"></button>
      </header>
      <div class="thread" id="thread"></div>
      <div class="chatfoot">
        <p class="chatfoot__model"><img class="chatfoot__cat" src="assets/img/wana-work.png" alt="">Wanaka 1.0 Max<i></i></p>
        <form class="composer2">
          <textarea placeholder="Ask, plan, build anything..." spellcheck="false"></textarea>
          <div class="composer2__row">
            <span class="composer2__left">
              <button class="round" type="button" aria-label="Attach"><img src="assets/icon/ch-plus-line.svg" alt="" width="12" height="12"></button>
              <button class="round" type="button" aria-label="Cut"><img src="assets/icon/ch-scissors.svg" alt="" width="32" height="32"></button>
              <button class="model2" type="button">Wanaka 1.0 Max<img src="assets/icon/ch-arrowdown.svg" alt="" width="16" height="16"></button>
            </span>
            <span class="composer2__right">
              <button class="planpill" type="button">Plan</button>
              <button class="round round--send" type="button" aria-label="Send"><i></i></button>
            </span>
          </div>
        </form>
      </div>
    </aside>`;

  /* what the team does after you press Plan mode */
  const script = (idea, onPlanReady) => {
    push(el(`<p class="rule"><i></i>Plan mode on · your game team is in</p>`));
    push(el(`<div class="msg msg--you"><span class="bub">${idea}</span>
      <span class="msg__tools"><img src="assets/icon/ch-copy.svg" alt="" width="16" height="16"><img src="assets/icon/ch-edit.svg" alt="" width="16" height="16"></span></div>`));

    at(700, () => push(el(`
      <div class="msg wana"><img src="assets/img/planner-av.png" alt="">
        <div><b>Planner Wana</b><p>Love it. I've called in the team; we'll draft the whole plan for you to check before anything gets built.</p></div>
      </div>`)));

    at(1500, () => {
      const rows = PLAN_STEPS.map((t) => push(el(`
        <p class="step2"><img src="assets/icon/step-todo.svg" alt="" width="16" height="16">${t}</p>`)));
      PLAN_STEPS.forEach((t, i) => {
        at(i * 900, () => {
          rows[i].classList.add('is-run');
          rows[i].querySelector('img').src = 'assets/icon/step-run.svg';
          thread.scrollTop = thread.scrollHeight;
        });
        at(i * 900 + 700, () => {
          rows[i].classList.remove('is-run');
          rows[i].classList.add('is-done');
          rows[i].querySelector('img').src = 'assets/icon/step-done.svg';
        });
      });
    });

    const after = 1500 + PLAN_STEPS.length * 900 + 700;
    at(after, () => push(el(`
      <div class="msg wana"><img src="assets/img/wana-planner.webp" alt="">
        <div><b>Planner Wana</b><p>Here it is — it opens on the left. Every card is yours to change, and nothing gets built until you approve it.</p></div>
      </div>`)));
    at(after + 600, () => {
      const card = push(el(`
        <div class="msg plancard"><img src="${PLAN.cover}" alt="">
          <div><em>Plan v1.0</em><b>${PLAN.title}: ${PLAN.sub}</b><button type="button">View full plan</button></div>
        </div>`));
      card.querySelector('button').onclick = () => onPlanReady(true);   // opened by hand: allowed again after Cancel
      at(700, () => card.classList.add('is-hot'));
      at(1400, () => onPlanReady());
    });
  };

  /* the crew bar: one cat works at a time, the line says what it is doing */
  const CREW = ['planner', 'developer', 'artist', 'audio', 'tester'];
  const CREW_LINE = {
    planner: 'Planner: plan approved — keeping the crew on track',
    developer: 'Developer: Writing your game logic...',
    artist: 'Artist: Modelling the bedroom and the toys...',
    audio: 'Musician: Scoring a theme loop for the bedroom...',
    tester: 'Tester: Playing it through before you do...',
  };
  const crewbar = (active) => {
    const stage = document.querySelector('.stage');
    let bar = document.querySelector('.crew');
    if (!bar) {
      bar = el(`<div class="crew">
        <button class="crew__min" type="button" aria-label="Minimise"></button>
        <div class="crew__row">${CREW.map((k) => `
          <button class="crew__cat" type="button" data-k="${k}"><img alt="${k}"></button>`).join('')}</div>
        <p class="crew__line"></p>
      </div>`);
      stage.appendChild(bar);
      bar.querySelector('.crew__min').onclick = () => bar.remove();
      bar.querySelectorAll('.crew__cat').forEach((c) => {
        c.onmouseenter = () => { bar.querySelector('.crew__line').textContent = CREW_LINE[c.dataset.k]; };
        c.onmouseleave = () => { bar.querySelector('.crew__line').textContent = CREW_LINE[bar.dataset.active]; };
      });
    }
    bar.dataset.active = active;
    bar.querySelectorAll('.crew__cat').forEach((c) => {
      const on = c.dataset.k === active;
      c.classList.toggle('is-on', on);
      c.querySelector('img').src = `assets/img/crew-${c.dataset.k}${on ? '.webp' : '-still.png'}`;
    });
    bar.querySelector('.crew__line').textContent = CREW_LINE[active];
    return bar;
  };

  const WORK = {
    developer: () => Scene.wire(),                       // collision boxes and the route
    artist: () => Scene.art(),                           // every box becomes its model
    audio: () => Scene.music(document.querySelector('.stage')),
    tester: () => Scene.test(4200),                      // the kid runs the course
  };

  const built = () => {
    clear();
    push(el(`<div class="msg msg--you">Approve and build now</div>`));
    at(400, () => push(el(`
      <div class="msg wana"><img src="assets/img/wana-planner.webp" alt="">
        <div><b>Planner Wana</b><p>Cool, my crew is working for you...</p></div>
      </div>`)));

    const STEPS = [['developer', 'Game logic'], ['artist', 'Models and scene'],
                   ['audio', 'Theme music'], ['tester', 'Playtest']];
    let rows = [];
    at(800, () => {
      const list = push(el(`<div class="msg steps">${STEPS
        .map(([, t], i) => `<p class="step${i === 0 ? ' is-busy' : ''}"><i></i>${t}</p>`).join('')}</div>`));
      rows = [...list.querySelectorAll('.step')];
      document.querySelector('.stage__empty').remove();
      const host = document.getElementById('roomhost');
      host.hidden = false;
      Scene.mount(host);
      crewbar('developer');
    });

    // each cat takes its turn; the one working is the only one in colour
    STEPS.forEach(([who], i) => {
      at(900 + i * 5000, () => {
        crewbar(who);
        rows.forEach((r, k) => r.classList.toggle('is-busy', k === i));
        WORK[who]();
      });
      at(900 + (i + 1) * 5000 - 200, () => {
        rows[i]?.classList.remove('is-busy');
        rows[i]?.classList.add('is-done');
      });
    });

    // version 1.0 is up
    at(900 + STEPS.length * 5000, () => {
      document.querySelector('.crew')?.remove();
      document.getElementById('roomhost')?.classList.add('is-built');
      document.querySelector('.stage')?.appendChild(el('<span class="vtag">Version 1.0</span>'));
      push(el(`
        <div class="msg wana"><img src="assets/img/crew-tester.webp" alt="">
          <div><b>Tester Wana</b><p>Version 1.0 is up and it holds together — five stars to find, one hoop to reach. Give it a go.</p></div>
        </div>`));
      push(el(`
        <div class="msg plancard"><img src="${PLAN.cover}" alt="">
          <div><em>Version 1.0</em><b>${PLAN.title}: ${PLAN.sub}</b><button type="button">▶ Play</button></div>
        </div>`));
    });
  };

  const open = (idea, onPlanReady) => {
    clear();
    const screen = document.getElementById('screenStudio');
    screen.innerHTML = shell();
    thread = document.getElementById('thread');
    script(idea, onPlanReady);
  };

  return { open, built, clear };
})();
