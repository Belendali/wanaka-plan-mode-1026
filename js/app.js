/* The run: home → the team drafts the plan → the console opens → approve → build. */
(() => {
  const screens = { home: document.getElementById('screenHome'), studio: document.getElementById('screenStudio') };
  const show = (name) => {
    Object.entries(screens).forEach(([k, el]) => el.classList.toggle('is-on', k === name));
    document.getElementById('app').classList.toggle('is-studio', name === 'studio');
  };

  let consoleHost = document.getElementById('consoleHost');
  if (!consoleHost) {
    consoleHost = document.createElement('div');
    consoleHost.id = 'consoleHost';
    consoleHost.className = 'consolehost';
    consoleHost.hidden = true;
    document.getElementById('app').appendChild(consoleHost);
  }

  // the chat opens the plan by itself once; after that only the card's button reopens it
  let shown = false;
  const openPlan = (opts) => {
    if (!consoleHost.hidden || (shown && !opts)) return;
    shown = true;
    Console.mount(consoleHost, PLAN, opts);
  };

  renderCards();
  wireHome({
    onSubmit: ({ text, plan }) => {
      show('studio');
      if (plan) {
        Studio.open(text, openPlan);
      } else {
        Studio.open(text, () => {});
      }
    },
  });

  // ?go=console skips the home page and the chat, straight to the console;
  // ?view=plan shows the finished plan, already open
  const q = new URLSearchParams(location.search);
  if (q.get('go') === 'console' || q.get('view') === 'plan') {
    show('studio');
    Studio.open('Make me a jump game', openPlan);
    openPlan({ view: q.get('view') === 'plan' });
  }

  // the console leaves once the plan is approved, and the team starts building
  document.addEventListener('e-approved', () => {
    setTimeout(() => { Console.unmount(); Studio.built(); }, 300);
  });
})();
