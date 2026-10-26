/* Home: the cards, the starters, and the idea box that starts plan mode. */
function renderCards() {
  document.getElementById('cards').innerHTML = TRENDING.map((g) => `
    <button class="gcard" type="button">
      <img class="gcard__art" src="${g.art}" alt="">
      <span class="gcard__body">
        <span class="gcard__name">${g.name}</span>
        <span class="gcard__meta">
          <span class="gcard__by"><img src="assets/img/card-avatar.png" alt="">${g.by}</span>
          <span class="gcard__stats">
            <span class="gcard__stat"><img src="assets/icon/card-plays.svg" alt="" width="16" height="16">${g.plays}</span>
            <span class="gcard__stat"><img src="assets/icon/card-friends.svg" alt="" width="16" height="16">${g.friends}</span>
          </span>
        </span>
      </span>
    </button>`).join('');
}

function wireHome({ onSubmit }) {
  const idea = document.getElementById('idea');
  const send = document.getElementById('send');
  const planBtn = document.getElementById('planBtn');
  const form = document.getElementById('composer');

  const sync = () => send.classList.toggle('is-live', idea.value.trim().length > 0);
  idea.addEventListener('input', sync);

  planBtn.onclick = () => {
    const on = planBtn.classList.toggle('is-on');
    planBtn.setAttribute('aria-pressed', String(on));
  };

  document.querySelectorAll('.starter').forEach((b) => {
    b.onclick = () => { idea.value = b.dataset.idea; sync(); idea.focus(); };
  });

  form.onsubmit = (e) => {
    e.preventDefault();
    const text = idea.value.trim() || idea.placeholder;
    onSubmit({ text, plan: planBtn.classList.contains('is-on') });
  };
}
