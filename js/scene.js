/* ──────────────────────────────────────────────────────────────────
   The game, drawn in code: an isometric giant bedroom that the crew
   builds up in front of you, and that you can then play.

   Scene.mount(el)   – empty room, floor grid only
   Scene.wire()      – Developer: collision boxes + the route
   Scene.art()       – Artist: every box becomes its model
   Scene.music()     – Musician: notes rise, a theme tag
   Scene.test(cb)    – Tester: the kid runs the course
   Scene.play(onWin) – arrow keys / WASD / click the floor; 5 stars, then the hoop
   ────────────────────────────────────────────────────────────────── */
(() => {
const NS = 'http://www.w3.org/2000/svg';
const W = 1472, H = 1024;
const OX = 736, OY = 236, TW = 104, TH = 52, N = 12;      // 12×12 tiles
const P = (i, j, h = 0) => [OX + (i - j) * TW / 2, OY + (i + j) * TH / 2 - h];
const pts = (a) => a.map((p) => p.join(',')).join(' ');
const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k));
  return `rgb(${c.join(',')})`;
};

// a box standing on tiles (i..i+w, j..j+d), h pixels tall, raised z pixels off the floor
function box(i, j, w, d, h, col, z = 0) {
  const top = [P(i, j, z + h), P(i + w, j, z + h), P(i + w, j + d, z + h), P(i, j + d, z + h)];
  const fi = [P(i + w, j, z), P(i + w, j + d, z), P(i + w, j + d, z + h), P(i + w, j, z + h)];
  const fj = [P(i, j + d, z), P(i + w, j + d, z), P(i + w, j + d, z + h), P(i, j + d, z + h)];
  return `<polygon class="f" points="${pts(fi)}" fill="${shade(col, .82)}"/>
    <polygon class="f" points="${pts(fj)}" fill="${shade(col, .66)}"/>
    <polygon class="f" points="${pts(top)}" fill="${col}"/>`;
}
const flat = (i, j, w, d, col, z = 0) =>
  `<polygon class="f" points="${pts([P(i, j, z), P(i + w, j, z), P(i + w, j + d, z), P(i, j + d, z)])}" fill="${col}"/>`;

// the room's furniture and toys: [name, i, j, w, d, h, draw()]
const THINGS = [
  ['rug', 3, 4, 5, 4, 2, () => flat(3, 4, 5, 4, '#4C79C9', 1) + flat(3.5, 4.5, 4, 3, '#5B8BDA', 2)],
  ['blocks', 1, 1, 2, 2, 150, () =>
    box(1, 1, 1, 1, 52, '#E35D4F') + box(2, 1, 1, 1, 52, '#F2C14E') + box(1, 2, 1, 1, 52, '#6CC070')
    + box(1, 1, 1, 1, 52, '#4C9BE8', 52) + box(1.2, 1.2, .6, .6, 46, '#F2C14E', 104)],
  ['books', 8.4, 1, 1.4, 1, 120, () =>
    ['#C84C4C', '#3D7BC9', '#E7B53C', '#4CA36A', '#8E5BC2', '#E07A3C'].map((c, k) => box(8.4, 1, 1.4, 1, 18, c, k * 20)).join('')],
  ['dresser', 10, 4, 1.4, 2.4, 170, () =>
    box(10, 4, 1.4, 2.4, 170, '#B98556') + [40, 90, 140].map((y) => {
      const a = P(10, 4.4, y), b = P(10, 6, y);
      return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#7A5232" stroke-width="3"/>`;
    }).join('')],
  ['ball', 10, 7.4, 1.2, 1.2, 110, () => {
    const [x, y] = P(10.6, 8, 58);
    return `<ellipse cx="${x}" cy="${y + 58}" rx="54" ry="20" fill="rgba(40,30,20,.18)"/>
      <circle cx="${x}" cy="${y}" r="56" fill="#E8762E"/><circle cx="${x - 16}" cy="${y - 18}" r="20" fill="#F39A55" opacity=".7"/>
      <path d="M${x - 56} ${y}Q${x} ${y + 26} ${x + 56} ${y}M${x} ${y - 56}Q${x - 24} ${y} ${x} ${y + 56}" stroke="#7A3812" stroke-width="3" fill="none"/>`;
  }],
  ['truck', 7.4, 8, 2, 1.2, 90, () => {
    const w = (i, j) => { const [x, y] = P(i, j, 14); return `<circle cx="${x}" cy="${y}" r="15" fill="#2B2B2B"/><circle cx="${x}" cy="${y}" r="6" fill="#999"/>`; };
    return box(7.4, 8, 2, 1.2, 46, '#F2C14E', 12) + box(8.6, 8.1, .8, 1, 44, '#E35D4F', 58) + w(7.8, 9.2) + w(9, 9.2);
  }],
  ['teddy', 1, 8, 1.4, 1.4, 150, () => {
    const [x, y] = P(1.7, 8.7, 0);
    return `<ellipse cx="${x}" cy="${y}" rx="52" ry="20" fill="rgba(40,30,20,.18)"/>
      <ellipse cx="${x}" cy="${y - 50}" rx="46" ry="52" fill="#A8703F"/>
      <circle cx="${x}" cy="${y - 118}" r="36" fill="#B97D48"/>
      <circle cx="${x - 30}" cy="${y - 146}" r="13" fill="#A8703F"/><circle cx="${x + 30}" cy="${y - 146}" r="13" fill="#A8703F"/>
      <ellipse cx="${x}" cy="${y - 108}" rx="14" ry="10" fill="#E8C49A"/>
      <circle cx="${x - 12}" cy="${y - 124}" r="4" fill="#2B1B10"/><circle cx="${x + 12}" cy="${y - 124}" r="4" fill="#2B1B10"/>`;
  }],
  ['hoop', 6.6, .25, .5, .5, 260, () => {
    const [x, y] = P(6.85, .5, 0);
    return box(6.6, .25, .5, .5, 230, '#9AA3AD') +
      `<rect x="${x - 58}" y="${y - 330}" width="116" height="78" rx="6" fill="#fff" stroke="#E35D4F" stroke-width="5"/>
       <rect x="${x - 24}" y="${y - 300}" width="48" height="34" fill="none" stroke="#E35D4F" stroke-width="4"/>
       <ellipse cx="${x}" cy="${y - 250}" rx="34" ry="11" fill="none" stroke="#E8762E" stroke-width="6"/>
       <path d="M${x - 30} ${y - 246}l12 34M${x - 10} ${y - 242}l6 38M${x + 10} ${y - 242}l-6 38M${x + 30} ${y - 246}l-12 34" stroke="#fff" stroke-width="2"/>`;
  }],
];
const STARS = [[2.5, 5.5], [4.2, 9.6], [6.6, 6], [8.2, 4.4], [4.6, 2.8]];
const GOAL = [6.85, 1.3];
const START = [.9, 5];
const ROUTE = [START, [2.5, 5.5], [4.2, 9.6], [6.6, 6], [8.2, 4.4], [4.6, 2.8], GOAL];

let svg = null, layer = null, kid = null, keys = {}, raf = 0, playing = false;

function mount(host) {
  host.innerHTML = '';
  svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'gameroom');
  // walls and floor
  const wallL = [P(0, 0), P(0, N), P(0, N, 300), P(0, 0, 300)];
  const wallR = [P(0, 0), P(N, 0), P(N, 0, 300), P(0, 0, 300)];
  const floor = [P(0, 0), P(N, 0), P(N, N), P(0, N)];
  let grid = '';
  for (let k = 0; k <= N; k++) {
    const a = P(k, 0), b = P(k, N), c = P(0, k), d = P(N, k);
    grid += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/><line x1="${c[0]}" y1="${c[1]}" x2="${d[0]}" y2="${d[1]}"/>`;
  }
  const win = [P(4, 0, 250), P(8, 0, 250), P(8, 0, 110), P(4, 0, 110)];
  svg.innerHTML = `
    <g class="room__shell">
      <polygon points="${pts(wallL)}" fill="#EFE3D0"/>
      <polygon points="${pts(wallR)}" fill="#F6ECDC"/>
      <polygon points="${pts(win)}" fill="#BFDDF5" stroke="#fff" stroke-width="8"/>
      <polygon points="${pts(floor)}" fill="#D9B98E"/>
      <g class="room__grid" stroke="rgba(120,84,48,.28)" stroke-width="1.5">${grid}</g>
    </g>
    <g class="room__wire"></g>
    <path class="room__route" d="" />
    <g class="room__things"></g>`;
  host.appendChild(svg);
  layer = svg.querySelector('.room__things');
  const r = ROUTE.map(([i, j]) => P(i, j));
  svg.querySelector('.room__route').setAttribute('d', 'M' + r.map((p) => p.join(' ')).join(' L'));
}

// Developer: every thing starts as its collision box
function wire() {
  const g = svg.querySelector('.room__wire');
  g.innerHTML = THINGS.map(([n, i, j, w, d, h], k) =>
    `<g class="wbox" style="animation-delay:${k * .4}s">${box(i, j, w, d, Math.max(h, 8), '#000000')}</g>`).join('')
    + STARS.map(([i, j], k) => { const [x, y] = P(i, j, 40); return `<circle class="wdot" cx="${x}" cy="${y}" r="16" style="animation-delay:${2.4 + k * .2}s"/>`; }).join('');
  setTimeout(() => svg.classList.add('has-route'), 3000);
}

// Artist: the boxes become the models, one after another
function art(fast) {
  const order = [...THINGS];
  order.forEach(([n, i, j, w, d], k) => {
    const put = () => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'thing');
      g.dataset.depth = n === 'rug' ? -1 : i + w + j + d;   // the rug lies under everything
      g.innerHTML = THINGS.find((t) => t[0] === n)[6]();
      insert(g);
      const wb = svg.querySelectorAll('.room__wire .wbox')[k];
      if (wb) wb.classList.add('is-done');
    };
    fast ? put() : setTimeout(put, 250 + k * 520);
  });
  const stars = () => STARS.forEach(([i, j], k) => {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'star');
    g.dataset.depth = i + j + 1;
    g.dataset.k = k;
    const [x, y] = P(i, j, 44);
    g.innerHTML = `<ellipse cx="${x}" cy="${y + 44}" rx="16" ry="6" fill="rgba(40,30,20,.2)"/>
      <path class="star__s" style="animation-delay:${k * .2}s" transform="translate(${x} ${y})" d="M0 -22l6.5 13.5 14.5 1.8-10.6 10 2.7 14.5L0 10.8l-13.1 7 2.7-14.5-10.6-10L-6.5 -8.5z" fill="#FFD447" stroke="#E0A800" stroke-width="2"/>`;
    insert(g);
  });
  fast ? stars() : setTimeout(stars, 250 + order.length * 520);
  const theKid = () => { makeKid(); };
  fast ? theKid() : setTimeout(theKid, 450 + order.length * 520);
  setTimeout(() => svg.querySelector('.room__wire').classList.add('is-gone'), fast ? 0 : 400 + order.length * 520);
}

function insert(g) {
  const d = +g.dataset.depth;
  const next = [...layer.children].find((c) => +c.dataset.depth > d);
  layer.insertBefore(g, next || null);
}

function makeKid() {
  if (kid) kid.remove();
  kid = document.createElementNS(NS, 'g');
  kid.setAttribute('class', 'kid');
  kid.innerHTML = `
    <ellipse cx="0" cy="0" rx="22" ry="8" fill="rgba(40,30,20,.25)"/>
    <g class="kid__body">
      <rect x="-9" y="-30" width="7" height="24" rx="3" fill="#3D5A80"/><rect x="2" y="-30" width="7" height="24" rx="3" fill="#3D5A80"/>
      <rect x="-15" y="-66" width="30" height="40" rx="11" fill="#F4F1EA"/>
      <rect x="-22" y="-64" width="14" height="30" rx="6" fill="#3F6FB5"/>
      <circle cx="0" cy="-82" r="17" fill="#F2C9A1"/>
      <path d="M-17 -86q4 -20 19 -18q16 0 15 16q-8 -9 -16 -8q-10 1 -18 10z" fill="#6B3E1F"/>
    </g>`;
  kid.dataset.i = START[0]; kid.dataset.j = START[1];
  placeKid(...START);
}
function placeKid(i, j) {
  kid.dataset.i = i; kid.dataset.j = j;
  const [x, y] = P(i, j);
  kid.setAttribute('transform', `translate(${x} ${y})`);
  kid.dataset.depth = i + j + .5;
  kid.remove();
  insert(kid);
}

// Musician: notes and a theme tag (drawn by the page, not the room)
function music(host) {
  const tag = document.createElement('div');
  tag.className = 'tag';
  tag.innerHTML = `<i>♪</i>Theme loop · Giant Bedroom <span class="wave">${'<b></b>'.repeat(7)}</span>`;
  host.appendChild(tag);
  tag.querySelectorAll('.wave b').forEach((b, i) => { b.style.animationDelay = `${i * .12}s`; });
  ['♪', '♫', '♪', '♬', '♫'].forEach((n, i) => setTimeout(() => {
    const el = document.createElement('i');
    el.className = 'note';
    el.textContent = n;
    el.style.left = `${280 + i * 230}px`;
    host.appendChild(el);
    setTimeout(() => el.remove(), 3100);
  }, i * 800));
}

// Tester: the kid runs the course and picks up every star
function test(ms = 4200) {
  const path = ROUTE;
  const seg = path.slice(1).map((p, k) => Math.hypot(p[0] - path[k][0], p[1] - path[k][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  const t0 = performance.now();
  resetStars();
  const step = (now) => {
    let d = Math.min(1, (now - t0) / ms) * total;
    let k = 0;
    while (k < seg.length - 1 && d > seg[k]) { d -= seg[k]; k++; }
    const f = Math.min(1, d / seg[k]);
    const i = path[k][0] + (path[k + 1][0] - path[k][0]) * f;
    const j = path[k][1] + (path[k + 1][1] - path[k][1]) * f;
    placeKid(i, j);
    kid.classList.add('is-walking');
    collect(i, j);
    if (now - t0 < ms) raf = requestAnimationFrame(step);
    else { kid.classList.remove('is-walking'); setTimeout(() => { resetStars(); placeKid(...START); }, 900); }
  };
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(step);
}

function resetStars() { svg.querySelectorAll('.star').forEach((s) => s.classList.remove('is-got')); }
function collect(i, j, onGet) {
  svg.querySelectorAll('.star:not(.is-got)').forEach((s) => {
    const [si, sj] = STARS[+s.dataset.k];
    if (Math.hypot(si - i, sj - j) < .7) { s.classList.add('is-got'); onGet && onGet(); }
  });
}

// Play: walk with the arrow keys / WASD, or click where to go
function play({ onStar, onWin }) {
  stop();
  playing = true;
  resetStars();
  placeKid(...START);
  let target = null;
  let got = 0;
  const speed = .075;
  const tick = () => {
    if (!playing) return;
    let di = 0, dj = 0;
    // screen-aligned keys: up goes up the screen (−i −j), right goes right (+i −j)
    if (keys.ArrowUp || keys.w) { di -= 1; dj -= 1; }
    if (keys.ArrowDown || keys.s) { di += 1; dj += 1; }
    if (keys.ArrowLeft || keys.a) { di -= 1; dj += 1; }
    if (keys.ArrowRight || keys.d) { di += 1; dj -= 1; }
    let i = +kid.dataset.i, j = +kid.dataset.j;
    if (di || dj) { target = null; const m = Math.hypot(di, dj); i += di / m * speed; j += dj / m * speed; }
    else if (target) {
      const dx = target[0] - i, dy = target[1] - j, m = Math.hypot(dx, dy);
      if (m < speed) { i = target[0]; j = target[1]; target = null; } else { i += dx / m * speed; j += dy / m * speed; }
    }
    i = Math.max(.3, Math.min(N - .3, i)); j = Math.max(.3, Math.min(N - .3, j));
    const moving = di || dj || target;
    kid.classList.toggle('is-walking', !!moving);
    if (moving) placeKid(i, j);
    collect(i, j, () => { got++; onStar && onStar(got); });
    if (got === STARS.length && Math.hypot(i - GOAL[0], j - GOAL[1]) < 1.4) { playing = false; kid.classList.remove('is-walking'); onWin && onWin(); return; }
    raf = requestAnimationFrame(tick);
  };
  svg.onclick = (e) => {
    if (!playing) return;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    const a = (p.x - OX) / (TW / 2), b = (p.y - OY) / (TH / 2);
    target = [(a + b) / 2, (b - a) / 2];
  };
  raf = requestAnimationFrame(tick);
}
function stop() { playing = false; cancelAnimationFrame(raf); if (kid) kid.classList.remove('is-walking'); }
addEventListener('keydown', (e) => { keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = true; if (playing && e.key.startsWith('Arrow')) e.preventDefault(); });
addEventListener('keyup', (e) => { keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false; });

window.Scene = { mount, wire, art, music, test, play, stop };
})();
