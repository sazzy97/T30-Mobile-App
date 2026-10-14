/* ==========================================================
   T30 — Prototype interactions
   ========================================================== */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const viewport = $('#viewport');
  const screens = $$('.screen');
  const order = ['splash', 'signin', 'goals', 'time', 'translation', 'prefs', 'home', 'live', 'bible', 'discover', 'plan', 'wotd', 'profile'];
  const tabbar = $('#tabbar');
  const audioBar = $('#audio-bar');
  let current = null;
  const history = [];

  /* ---------- Navigation ---------- */
  function go(id, { push = true, sheet = false } = {}) {
    const next = $(`.screen[data-screen="${id}"]`);
    if (!next) return;
    closeSheet();
    if (current && current !== next) {
      if (push) history.push(current.dataset.screen);
      const prev = current;
      prev.classList.add('leaving');
      prev.classList.remove('active');
      setTimeout(() => prev.classList.remove('leaving'), 450);
    }
    next.scrollTop = 0;
    next.classList.add('active');
    current = next;

    // status bar color
    viewport.classList.toggle('dark-status', next.dataset.dark === '1');

    // tab bar
    const tab = next.dataset.tab;
    tabbar.classList.toggle('hidden', !tab);
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tabgo === tab));

    // audio bar only on bible
    audioBar.classList.toggle('hidden', id !== 'bible');

    // sidebar
    $$('.nav-link').forEach(n => n.classList.toggle('active', n.dataset.nav === id && (!!n.dataset.sheet === sheet)));

    if (id === 'live') startLive(); else stopLive();
    if (sheet) setTimeout(() => openSheet($('.verse[data-v="16"]')), 380);

    location.hash = id;
  }

  function back() {
    const prev = history.pop();
    if (prev) go(prev, { push: false });
  }

  document.addEventListener('click', e => {
    const backBtn = e.target.closest('[data-back]');
    if (backBtn) { back(); return; }
    const goEl = e.target.closest('[data-go]');
    if (goEl) { go(goEl.dataset.go, { sheet: !!goEl.dataset.sheet }); return; }
    const tabEl = e.target.closest('[data-tabgo]');
    if (tabEl) { history.length = 0; go(tabEl.dataset.tabgo, { push: false }); return; }
    const nav = e.target.closest('[data-nav]');
    if (nav) { history.length = 0; go(nav.dataset.nav, { push: false, sheet: !!nav.dataset.sheet }); return; }
    const t = e.target.closest('[data-toast]');
    if (t) toast(t.dataset.toast);
  });

  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    const i = order.indexOf(current?.dataset.screen);
    if (e.key === 'ArrowRight' && i < order.length - 1) go(order[i + 1]);
    if (e.key === 'ArrowLeft' && i > 0) go(order[i - 1]);
    if (e.key === 'Escape') closeSheet();
  });

  /* ---------- Toast ---------- */
  let toastT;
  function toast(msg) {
    $('#toast-text').textContent = msg;
    const el = $('#toast');
    el.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('show'), 2000);
  }

  /* ---------- Onboarding ---------- */
  const goalBtn = $('#btn-goals-continue');
  $$('#goal-chips .chip').forEach(c => c.addEventListener('click', () => {
    c.classList.toggle('selected');
    const n = $$('#goal-chips .chip.selected').length;
    $('#goal-count').textContent = `${n} goal${n === 1 ? '' : 's'}`;
    goalBtn.disabled = n === 0;
  }));

  $$('[data-single]').forEach(list => list.addEventListener('click', e => {
    const opt = e.target.closest('.opt');
    if (!opt) return;
    $$('.opt', list).forEach(o => o.classList.toggle('selected', o === opt));
  }));

  $('#trans-search').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    $$('#trans-list .opt').forEach(o => { o.style.display = o.dataset.name.includes(q) ? '' : 'none'; });
  });

  $$('#tone-row .tone').forEach(t => t.addEventListener('click', () => {
    $$('#tone-row .tone').forEach(x => x.classList.toggle('selected', x === t));
    const p = $('#notif-text');
    p.style.opacity = 0;
    setTimeout(() => { p.textContent = t.dataset.tone; p.style.opacity = 1; }, 200);
  }));

  $$('.toggle').forEach(t => t.addEventListener('click', () => t.classList.toggle('on')));
  $('#link-forgot').addEventListener('click', () => toast('Reset link sent to your email'));
  $('#btn-grace').addEventListener('click', () => toast('Grace Pass protects 1 missed day each week'));
  $('#btn-notifs').addEventListener('click', () => toast('No new notifications'));
  $('#btn-save-wotd').addEventListener('click', () => toast('Saved to your collection'));
  $('#btn-enter').addEventListener('click', () => setTimeout(() => toast('Welcome to T30, Grace 💛'), 450));

  /* ---------- Bible: verse sheet ---------- */
  const sheet = $('#verse-sheet');
  const backdrop = $('#sheet-backdrop');
  let activeVerse = null;

  function openSheet(v) {
    if (!v) return;
    $$('.verse.selected').forEach(x => x.classList.remove('selected'));
    activeVerse = v;
    v.classList.add('selected');
    $('#sheet-ref').textContent = `John 3:${v.dataset.v}`;
    $('#sheet-text').textContent = v.textContent.replace(/^\d+/, '').trim();
    $$('#hl-colors .color-dot').forEach(d => d.classList.toggle('on', !!d.dataset.c && v.classList.contains(d.dataset.c)));
    sheet.classList.add('show');
    backdrop.classList.add('show');
  }
  function closeSheet() {
    sheet.classList.remove('show');
    backdrop.classList.remove('show');
    $$('.verse.selected').forEach(x => x.classList.remove('selected'));
  }
  $$('.verse').forEach(v => v.addEventListener('click', () => openSheet(v)));
  backdrop.addEventListener('click', closeSheet);
  $('#sheet-close').addEventListener('click', closeSheet);
  $$('#hl-colors .color-dot').forEach(d => d.addEventListener('click', () => {
    if (!activeVerse) return;
    ['hl-gold', 'hl-rose', 'hl-sage', 'hl-sky'].forEach(c => activeVerse.classList.remove(c));
    if (d.dataset.c) activeVerse.classList.add(d.dataset.c);
    $$('#hl-colors .color-dot').forEach(x => x.classList.toggle('on', x === d && !!d.dataset.c));
    toast(d.dataset.c ? 'Highlight saved & synced' : 'Highlight removed');
  }));
  $$('#note-vis button').forEach(b => b.addEventListener('click', () => {
    $$('#note-vis button').forEach(x => x.classList.toggle('on', x === b));
  }));
  $('#btn-save-note').addEventListener('click', () => {
    if (activeVerse && !activeVerse.nextElementSibling?.classList.contains('note-ind')) {
      const ind = document.createElement('span');
      ind.className = 'note-ind';
      ind.innerHTML = '<svg class="ico"><use href="#i-pen"/></svg>';
      activeVerse.after(ind);
    }
    closeSheet();
    toast('Note saved');
  });

  /* ---------- Bible: audio ---------- */
  let playing = false, pos = 134, dur = 392, audioT, speedIdx = 0;
  const speeds = [1, 1.25, 1.5, 0.75];
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function renderAudio() {
    $('#audio-time').textContent = `${fmt(pos)} / ${fmt(dur)}`;
    $('#a-prog').style.width = `${(pos / dur) * 100}%`;
  }
  $('#a-play').addEventListener('click', () => {
    playing = !playing;
    $('#a-play-ico use').setAttribute('href', playing ? '#i-pause' : '#i-play');
    clearInterval(audioT);
    if (playing) audioT = setInterval(() => { pos = Math.min(dur, pos + speeds[speedIdx]); renderAudio(); }, 1000);
  });
  $('#a-back').addEventListener('click', () => { pos = Math.max(0, pos - 15); renderAudio(); });
  $('#a-fwd').addEventListener('click', () => { pos = Math.min(dur, pos + 15); renderAudio(); });
  $('#a-speed').addEventListener('click', e => { speedIdx = (speedIdx + 1) % speeds.length; e.target.textContent = speeds[speedIdx] + 'x'; });
  renderAudio();

  /* ---------- Discover ---------- */
  $$('#disc-pills .pill').forEach(p => p.addEventListener('click', () => {
    $$('#disc-pills .pill').forEach(x => x.classList.toggle('active', x === p));
  }));
  const heroScroll = $('#hero-scroll');
  heroScroll.addEventListener('scroll', () => {
    const card = heroScroll.firstElementChild.offsetWidth + 12;
    const i = Math.round(heroScroll.scrollLeft / card);
    $$('#hero-dots span').forEach((d, j) => d.classList.toggle('on', j === i));
  });

  /* ---------- Word of the day templates ---------- */
  $$('#templates .tpl').forEach(t => t.addEventListener('click', () => {
    $$('#templates .tpl').forEach(x => x.classList.toggle('on', x === t));
    $('#share-card').className = 'share-card ' + t.dataset.t;
  }));

  /* ---------- Live ---------- */
  const chatMsgs = [
    ['Ngozi P.', 'Amen and amen 🙌', '#A32A2A'],
    ['James T.', 'Watching with my whole family', '#555'],
    ['Ada E.', 'Purpose is not pressure. Needed that!', '#C9961A'],
    ['Kemi S.', '🙏🙏🙏', '#8B6B1A'],
    ['Paul M.', 'Grace over guilt, always', '#6E1515'],
    ['Ruth B.', 'Thank you Pastor! ❤️', '#3A3A3A'],
  ];
  let liveT, mi = 0, viewers = 1218;
  function addMsg([name, text, color]) {
    const chat = $('#chat');
    const el = document.createElement('div');
    el.className = 'msg';
    const initials = name.split(' ').map(s => s[0]).join('').replace('.', '');
    el.innerHTML = `<span class="ma" style="background:${color}">${initials}</span><div><b>${name}</b>${text}</div>`;
    chat.appendChild(el);
    while (chat.children.length > 7) chat.firstElementChild.remove();
  }
  function floatAmen(emoji = '🙏') {
    const f = document.createElement('span');
    f.className = 'floater';
    f.textContent = emoji;
    f.style.setProperty('--dx', `${(Math.random() - .5) * 60}px`);
    $('#floaters').appendChild(f);
    setTimeout(() => f.remove(), 2700);
  }
  function startLive() {
    stopLive();
    liveT = setInterval(() => {
      addMsg(chatMsgs[mi++ % chatMsgs.length]);
      viewers += Math.floor(Math.random() * 6);
      $('#viewer-count').textContent = viewers.toLocaleString();
      if (Math.random() > .4) floatAmen(['🙏', '❤️', '🔥', '🙌'][Math.floor(Math.random() * 4)]);
    }, 2200);
  }
  function stopLive() { clearInterval(liveT); }
  $('#btn-amen').addEventListener('click', () => { for (let i = 0; i < 4; i++) setTimeout(() => floatAmen('🙏'), i * 120); });
  $('#btn-pip').addEventListener('click', () => toast('Picture-in-picture enabled'));

  /* ---------- Profile heatmap (October) ---------- */
  const heat = $('#heat');
  ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(d => heat.insertAdjacentHTML('beforeend', `<span class="hd">${d}</span>`));
  // Oct 1 2026 is a Thursday → 3 leading blanks
  for (let i = 0; i < 3; i++) heat.insertAdjacentHTML('beforeend', '<i style="visibility:hidden"></i>');
  const levels = { 1: 'l2', 2: 'l3', 3: 'l3', 4: 'l1', 5: 'l3', 6: 'l2', 7: 'l3', 8: 'l3', 9: 'l2', 10: 'l3', 11: 'gp', 12: 'l3', 13: 'l3' };
  for (let d = 1; d <= 31; d++) {
    const cls = d === 14 ? 'l1 td' : (levels[d] || '');
    heat.insertAdjacentHTML('beforeend', `<i class="${cls}" title="Oct ${d}"></i>`);
  }

  /* ---------- Scale phone to fit ---------- */
  const wrap = $('#phoneWrap');
  function fit() {
    const area = wrap.parentElement;
    const s = Math.min(1, (area.clientHeight - 40) / 864, (area.clientWidth - 20) / 410);
    wrap.style.transform = `scale(${s})`;
  }
  window.addEventListener('resize', fit);
  fit();

  /* ---------- Init ---------- */
  const start = location.hash.slice(1);
  go(order.includes(start) ? start : 'splash', { push: false });
})();
