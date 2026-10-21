/* ==========================================================
   T30 — Prototype interactions
   ========================================================== */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const viewport = $('#viewport');
  const screens = $$('.screen');
  const order = ['splash', 'signin', 'goals', 'time', 'translation', 'prefs', 'home', 'live', 'bible', 'discover',
    'dev-list', 'dev-read', 'conf-list', 'conf-session', 'decl-list', 'decl-session', 'plans-list', 'pray-list', 'pray-session', 'complete',
    'plan', 'wotd', 'profile', 'streak', 'settings', 'devotions'];
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
    window.T30Sub && window.T30Sub.onEnter(id);
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
    if (goEl) {
      if (goEl.dataset.done) setDone(goEl.dataset.done);
      if (goEl.dataset.reset !== undefined) history.length = 0;
      go(goEl.dataset.go, { sheet: !!goEl.dataset.sheet }); return;
    }
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

  /* ==========================================================
     SUB-FEATURES
     ========================================================== */
  // Move in-screen sheets into the phone viewport so they overlay correctly
  $$('.sf-sheet, .sf-sheet-bg').forEach(el => viewport.appendChild(el));
  const sheetPairs = { 'streak-sheet': 'streak-sheet-bg', 'del-sheet': 'del-bg', 'cm-sheet': 'cm-bg', 'grace-sheet': 'grace-sheet-bg' };
  function openSf(id) { $('#' + id).classList.add('open'); $('#' + sheetPairs[id]).classList.add('open'); }
  function closeSf() { $$('.sf-sheet, .sf-sheet-bg').forEach(e => e.classList.remove('open')); }
  Object.values(sheetPairs).forEach(bg => $('#' + bg).addEventListener('click', closeSf));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSf(); });

  // Grace Pass on Home
  let graceUsed = false;
  function promptGrace() {
    if (graceUsed) { toast('Grace Pass already active for today 💛'); return; }
    openSf('grace-sheet');
  }
  $('#btn-grace').addEventListener('click', promptGrace);
  $('#btn-use-grace').addEventListener('click', promptGrace);
  $('#btn-cancel-grace').addEventListener('click', closeSf);
  $('#btn-confirm-grace').addEventListener('click', () => {
    graceUsed = true;
    closeSf();
    const todayEl = $('#day-today');
    todayEl.classList.remove('today');
    todayEl.classList.add('grace');
    todayEl.querySelector('i').innerHTML = '<svg class="ico xs"><use href="#i-shield"/></svg>';
    $('#grace-count').textContent = '0 Grace Passes';
    $('#btn-grace').classList.add('used');
    const useBtn = $('#btn-use-grace');
    useBtn.disabled = true;
    useBtn.innerHTML = '<svg class="ico sm"><use href="#i-check"/></svg>Grace Pass Active Today';
    $('#grace-note-text').textContent = 'Grace Pass applied for today! Your 12-day streak is safe. Grace over guilt. 💛';
    toast('Grace Pass applied — streak protected! 🛡️');
  });

  // Generic pill toggles inside sub-feature screens
  $$('.sf-pills').forEach(g => g.addEventListener('click', e => {
    const p = e.target.closest('.pill'); if (!p) return;
    $$('.pill', g).forEach(x => x.classList.toggle('active', x === p));
  }));
  $$('.sf-save').forEach(b => b.addEventListener('click', () => toast('Saved to your library')));

  // Completion screen
  function setDone(title) {
    $('#done-title').textContent = title;
    const subs = {
      'Devotional complete': 'You showed up for God today. That matters.',
      'Confessions spoken': 'Faith comes by hearing, and you just spoke life over yourself.',
      'Declarations made': 'Your words carry weight. Keep declaring His truth.',
      'Prayer complete': 'Cast all your anxiety on Him, because He cares for you.'
    };
    $('#done-sub').textContent = subs[title] || 'Well done, keep the rhythm going.';
  }
  function confetti() {
    const c = $('.sf-confetti'); c.innerHTML = '';
    const cols = ['#8B1E1E', '#C9961A', '#E7C563', '#A32A2A', '#141414'];
    for (let i = 0; i < 36; i++) {
      const s = document.createElement('i');
      s.style.left = Math.random() * 100 + '%';
      s.style.background = cols[i % cols.length];
      s.style.animationDelay = Math.random() * .6 + 's';
      c.appendChild(s);
    }
  }

  /* ---------- Confessions session ---------- */
  const confessions = [
    ['I am a new creation in Christ. The old has gone, the new has come.', '2 Corinthians 5:17'],
    ['I am fearfully and wonderfully made.', 'Psalm 139:14'],
    ['I am chosen, royal and holy, God’s special possession.', '1 Peter 2:9'],
    ['I am the righteousness of God in Christ Jesus.', '2 Corinthians 5:21'],
    ['I am loved with an everlasting love.', 'Jeremiah 31:3'],
    ['I am more than a conqueror through Him who loves me.', 'Romans 8:37'],
    ['I am God’s handiwork, created for good works.', 'Ephesians 2:10']
  ];
  let ci = 0;
  const confSteps = $('#conf-steps');
  confessions.forEach(() => confSteps.insertAdjacentHTML('beforeend', '<i></i>'));
  function renderConf() {
    const [t, r] = confessions[ci];
    const el = $('#conf-text'); el.textContent = t; el.style.animation = 'none'; el.offsetHeight; el.style.animation = '';
    $('#conf-ref').textContent = r;
    $('#conf-count').textContent = `${ci + 1} of ${confessions.length}`;
    $$('i', confSteps).forEach((s, i) => s.classList.toggle('on', i <= ci));
    $('#conf-mic').classList.remove('on');
    $('#conf-next').textContent = ci === confessions.length - 1 ? 'Finish' : 'Next confession';
  }
  $('#conf-mic').addEventListener('click', e => { e.currentTarget.classList.toggle('on'); });
  $('#conf-next').addEventListener('click', () => {
    if (ci < confessions.length - 1) { ci++; renderConf(); }
    else { setDone('Confessions spoken'); go('complete'); }
  });
  $('#conf-prev').addEventListener('click', () => { if (ci > 0) { ci--; renderConf(); } });

  /* ---------- Declarations session ---------- */
  const decls = [
    ['I am more than a conqueror through Him who loves me.', 'Romans 8:37'],
    ['No weapon formed against me shall prosper.', 'Isaiah 54:17'],
    ['The joy of the Lord is my strength.', 'Nehemiah 8:10'],
    ['I can do all things through Christ who strengthens me.', 'Philippians 4:13']
  ];
  let di = 0, dn = 0;
  function renderDecl() {
    const [t, r] = decls[di];
    $('#decl-text').textContent = t;
    $('#decl-text').nextElementSibling.textContent = r;
    dn = 0; updDecl();
    $('#decl-next').textContent = di === decls.length - 1 ? 'Finish' : 'Next declaration';
  }
  function updDecl() {
    $('#decl-n').textContent = `${dn}/3`;
    $('#decl-ring').style.strokeDashoffset = 339.3 * (1 - dn / 3);
  }
  $('#decl-btn').addEventListener('click', e => {
    if (dn >= 3) return;
    dn++; updDecl();
    const b = e.currentTarget; b.classList.remove('pulse'); b.offsetHeight; b.classList.add('pulse');
    if (dn === 3) toast('Declared! 🔥');
  });
  $('#decl-next').addEventListener('click', () => {
    if (di < decls.length - 1) { di++; renderDecl(); }
    else { setDone('Declarations made'); go('complete'); }
  });

  /* ---------- Prayer Companion ---------- */
  let need = 'Anxiety', mins = 5;
  $('#pray-needs').addEventListener('click', e => {
    const c = e.target.closest('.sf-cat'); if (!c) return;
    $$('#pray-needs .sf-cat').forEach(x => x.classList.toggle('sel', x === c));
    need = c.dataset.need;
  });
  $('#pray-len').addEventListener('click', e => { const p = e.target.closest('.pill'); if (p) mins = parseInt(p.textContent, 10); });
  const prayScripts = {
    Anxiety: ['You are my refuge and strength, an ever-present help. You are bigger than every worry I carry.', 'Lord, forgive me for holding on to fear instead of trusting You.', 'Thank You that Your peace guards my heart and mind in Christ Jesus.', 'Calm my racing thoughts. I cast every care on You, for You care for me.'],
    Healing: ['You are Jehovah Rapha, the God who heals.', 'Forgive me where I have doubted Your goodness.', 'Thank You for every breath and every strength You give.', 'Touch my body and soul with Your healing power.'],
    Family: ['You are a faithful Father to every generation.', 'Forgive me for words and attitudes that wounded those I love.', 'Thank You for the family You have placed around me.', 'Unite our home in love; protect and guide each one.'],
    Guidance: ['You are the Good Shepherd who leads me.', 'Forgive me for leaning on my own understanding.', 'Thank You that You go before me.', 'Show me the way I should go; make my path straight.'],
    Provision: ['You are Jehovah Jireh, my provider.', 'Forgive me for worry and comparison.', 'Thank You for daily bread and every open door.', 'Meet every need according to Your riches in glory.'],
    Gratitude: ['You are good, and Your love endures forever.', 'Forgive me for the times I forgot to say thank You.', 'Thank You for salvation, for grace, for this very day.', 'Make my life an offering of praise.']
  };
  const prayRefs = ['Psalm 46:1', '1 John 1:9', 'Philippians 4:7', '1 Peter 5:7'];
  const prayTitles = ['Adore', 'Confess', 'Thank', 'Ask'];
  let ps = 0, prayT, remaining = 0, paused = false, breatheT;
  function renderPray() {
    $('#pray-title').textContent = prayTitles[ps];
    const el = $('#pray-text'); el.textContent = prayScripts[need][ps]; el.style.animation = 'none'; el.offsetHeight; el.style.animation = '';
    $('#pray-ref').textContent = prayRefs[ps];
    $$('#pray-tabs span').forEach((s, i) => { s.classList.toggle('on', i === ps); s.classList.toggle('done', i < ps); });
    $('#pray-next').textContent = ps === 3 ? 'Amen · Finish' : 'Next step';
  }
  function fmtT(s) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
  function startPray() {
    ps = 0; paused = false; remaining = mins * 60;
    $('#pray-need').textContent = need;
    $('[data-screen="pray-session"]').classList.remove('paused');
    $('#pray-timer').textContent = fmtT(remaining);
    renderPray();
    clearInterval(prayT); clearInterval(breatheT);
    prayT = setInterval(() => { if (!paused && remaining > 0) { remaining--; $('#pray-timer').textContent = fmtT(remaining); } }, 1000);
    let inhale = true; $('#breathe-t').textContent = 'Breathe in';
    breatheT = setInterval(() => { if (!paused) { inhale = !inhale; $('#breathe-t').textContent = inhale ? 'Breathe in' : 'Breathe out'; } }, 4000);
  }
  $('#pray-next').addEventListener('click', () => {
    if (ps < 3) { ps++; renderPray(); }
    else { clearInterval(prayT); clearInterval(breatheT); setDone('Prayer complete'); go('complete'); }
  });
  $('#pray-pause').addEventListener('click', e => {
    paused = !paused;
    $('[data-screen="pray-session"]').classList.toggle('paused', paused);
    $('use', e.currentTarget).setAttribute('href', paused ? '#i-play' : '#i-pause');
  });

  /* ---------- Streak: full-year view ---------- */
  (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date(2026, 9, 21);
    const streaks = [[2, 2, 10], [5, 3, 29], [7, 14, 31], [8, 1, 1], [9, 10, 21]]; // [month, from, to]
    const inStreak = (m, d) => streaks.some(([sm, a, b]) => sm === m && d >= a && d <= b);
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const wrap = $('#year-months');
    months.forEach((name, m) => {
      const days = new Date(2026, m + 1, 0).getDate();
      const lead = (new Date(2026, m, 1).getDay() + 6) % 7;
      let cells = '', count = 0;
      for (let i = 0; i < lead; i++) cells += '<i class="x"></i>';
      for (let d = 1; d <= days; d++) {
        const dt = new Date(2026, m, d);
        let cls = '';
        if (dt > today) cls = 'f';
        else if (inStreak(m, d)) { cls = rnd() < .07 ? 'gp' : 'c'; }
        else { const r = rnd(); cls = r < .45 ? 'c' : r < .65 ? 'p' : ''; }
        if (+dt === +today) cls += ' today';
        if (cls.includes('c') || cls.includes('gp')) count++;
        cells += `<i class="${cls}" title="${name} ${d}"></i>`;
      }
      wrap.insertAdjacentHTML('beforeend', `<div class="sf-month"><h5>${name.toUpperCase()}</h5><div class="g">${cells}</div><small>${m > 9 ? '—' : count + ' days'}</small></div>`);
    });
  })();
  ['#btn-share-streak', '#btn-share-streak-top'].forEach(s => $(s).addEventListener('click', () => openSf('streak-sheet')));

  /* ---------- Settings: library + delete account ---------- */
  const lib = {
    notes: { title: 'Notes', items: [['John 3:16', 'God’s love isn’t earned, it’s given. Remember this when I feel unworthy.', 'Oct 14'], ['Psalm 46:10', 'Stillness is an act of trust.', 'Oct 9'], ['1 Kings 19:12', 'God was in the whisper, not the fire.', 'Oct 3']] },
    journals: { title: 'Journals', items: [['Morning reflection', 'Felt anxious about work today. Wrote down three things God has already provided…', 'Today 🔒'], ['When the Storm Rages', 'My “wind” this week was comparison. Fixing my eyes again.', 'Oct 15 🔒']] },
    testimonies: { title: 'Testimonies', items: [['Mum’s recovery', 'After 3 weeks of prayer, the doctors confirmed she is fully recovered. God is faithful!', 'Oct 18 · Shared'], ['New job', 'Got the offer I prayed about for months.', 'Aug 30']] },
    confessions: { title: 'Confessions', items: [['Identity', '“I am the righteousness of God in Christ Jesus.” 2 Cor 5:21', 'Spoken 32×'], ['Healing', '“By His stripes I am healed.” Isaiah 53:5', 'Spoken 14×']] }
  };
  let curLib = null;
  function renderLib(k) {
    curLib = k;
    $('#lib-title').textContent = lib[k].title;
    $('#lib-items').innerHTML = lib[k].items.map(([t, p, d], i) =>
      `<div class="sf-lib-item"><div><b>${t}</b><p>${p}</p><small>${d}</small></div><button aria-label="Delete" data-del="${i}"><svg class="ico sm"><use href="#i-x"/></svg></button></div>`).join('');
  }
  $$('.sf-lib .list-row').forEach(r => r.addEventListener('click', () => {
    const k = r.dataset.lib, panel = $('#lib-panel');
    const same = curLib === k && panel.classList.contains('open');
    $$('.sf-lib .list-row').forEach(x => x.classList.toggle('on', x === r && !same));
    panel.classList.toggle('open', !same);
    if (!same) renderLib(k);
  }));
  $('#lib-items').addEventListener('click', e => {
    const b = e.target.closest('[data-del]'); if (!b) return;
    lib[curLib].items.splice(+b.dataset.del, 1); renderLib(curLib); toast('Deleted');
  });
  $('#lib-add').addEventListener('click', () => {
    const label = { notes: 'New note', journals: 'New journal entry', testimonies: 'New testimony', confessions: 'New confession' }[curLib];
    lib[curLib].items.unshift([label, 'Tap to start writing…', 'Just now']); renderLib(curLib);
  });
  $('#btn-delete-acct').addEventListener('click', () => { $('#del-input').value = ''; $('#del-confirm').disabled = true; openSf('del-sheet'); });
  $('#del-input').addEventListener('input', e => { $('#del-confirm').disabled = e.target.value.trim().toUpperCase() !== 'DELETE'; });
  $('#del-cancel').addEventListener('click', closeSf);
  $('#del-confirm').addEventListener('click', () => { closeSf(); toast('Account deleted'); history.length = 0; setTimeout(() => go('splash', { push: false }), 900); });

  /* ---------- Devotions community feed ---------- */
  const posts = [
    { n: 'Joshua Okon', i: 'JO', c: '#8B1E1E', t: '2h · Lagos', title: 'Fixing my eyes again', body: 'Today’s devotional hit home. I’ve been looking at the waves (bills, deadlines) instead of Jesus. Choosing faith over fear today.', ref: 'Matthew 14:31', img: 'assets/water_walk.jpg', likes: 48, cm: [['Ada M.', 'Amen! Needed this today 🙏', '1h'], ['Tunde', 'Praying with you brother.', '45m']] },
    { n: 'Amara Eze', i: 'AM', c: '#C9961A', t: '5h · Abuja', title: 'The still small voice', body: 'God wasn’t in the earthquake or the fire, but in the whisper. Learning to quiet my heart in the mornings before I reach for my phone.', ref: '1 Kings 19:12', likes: 112, cm: [['Grace A.', 'This is so beautiful.', '3h']] },
    { n: 'Pastor Ade', i: 'PA', c: '#141414', t: 'Yesterday', title: 'New mercies', body: 'Whatever yesterday held, His mercies are new this morning. Let’s walk in that freshness together.', ref: 'Lamentations 3:23', img: 'assets/splash_hero.jpg', likes: 304, cm: [] }
  ];
  let curPost = null;
  function renderFeed() {
    $('#dev-feed').innerHTML = posts.map((p, k) => `
      <article class="sf-post">
        <div class="sf-post-h"><span class="sf-av" style="background:${p.c}">${p.i}</span><div><b>${p.n}</b><span>${p.t}</span></div><button class="icon-btn" style="box-shadow:none;background:none" aria-label="More" data-toast="Report · Mute · Save"><svg class="ico sm"><use href="#i-more"/></svg></button></div>
        ${p.img ? `<img class="cover" src="${p.img}" alt="">` : ''}
        <div class="sf-post-b"><h4>${p.title}</h4><p>${p.body}</p><span class="ref">${p.ref}</span></div>
        <div class="sf-post-a">
          <button data-like="${k}" class="${p.liked ? 'on' : ''}"><svg class="ico sm"><use href="#i-heart"/></svg>${p.likes}</button>
          <button data-cm="${k}"><svg class="ico sm"><use href="#i-message"/></svg>${p.cm.length}</button>
          <button data-share="${k}"><svg class="ico sm"><use href="#i-share"/></svg>Share</button>
        </div>
      </article>`).join('');
  }
  function renderComments() {
    const p = posts[curPost];
    $('#cm-count').textContent = p.cm.length;
    $('#cm-list').innerHTML = p.cm.length ? p.cm.map(([n, t, d]) =>
      `<div class="sf-cm"><span class="sf-av" style="background:${n.startsWith('You') ? '#C9961A' : '#8B1E1E'}">${n.split(' ').map(w => w[0]).join('').slice(0, 2)}</span><div><b>${n}</b> <small>${d}</small><p>${t}</p></div></div>`).join('')
      : '<p class="t-sm muted" style="text-align:center;margin-top:30px">Be the first to encourage.</p>';
    $('#cm-list').scrollTop = 1e5;
  }
  $('#dev-feed').addEventListener('click', e => {
    const l = e.target.closest('[data-like]'), c = e.target.closest('[data-cm]'), s = e.target.closest('[data-share]');
    if (l) { const p = posts[+l.dataset.like]; p.liked = !p.liked; p.likes += p.liked ? 1 : -1; renderFeed(); }
    if (c) { curPost = +c.dataset.cm; renderComments(); openSf('cm-sheet'); }
    if (s) { openSf('streak-sheet'); $('#streak-sheet h3').textContent = 'Share this devotion'; }
  });
  $('#cm-form').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#cm-text').value.trim(); if (!v) return;
    posts[curPost].cm.push(['You', v, 'now']); $('#cm-text').value = '';
    renderComments(); renderFeed();
  });
  renderFeed();

  /* ---------- Screen enter hooks ---------- */
  window.T30Sub = {
    onEnter(id) {
      closeSf();
      if (id === 'conf-session') { ci = 0; renderConf(); }
      if (id === 'decl-session') { di = 0; renderDecl(); }
      if (id === 'pray-session') startPray(); else { clearInterval(prayT); clearInterval(breatheT); }
      if (id === 'complete') confetti();
      if (id === 'streak') $('#streak-sheet h3').textContent = 'Share your streak';
    }
  };

  /* ---------- Init ---------- */
  const start = location.hash.slice(1);
  go(order.includes(start) ? start : 'splash', { push: false });
})();
