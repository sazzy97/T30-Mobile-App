/* ==========================================================
   T30 — Prototype interactions
   ========================================================== */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const viewport = $('#viewport');
  const screens = $$('.screen');
  const order = ['splash', 'signin', 'goals', 'time', 'translation', 'prefs', 'home', 'live', 'past-devotions', 'bible', 'discover',
    'dev-list', 'dev-read', 'conf-list', 'conf-session', 'decl-list', 'decl-session', 'plans-list', 'pray-list', 'pray-session', 'complete',
    'plan', 'wotd', 'profile', 'streak', 'settings'];
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
      if (goEl.dataset.dev) setDev(goEl.dataset.dev);
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
  $$('.sf-sheet, .sf-sheet-bg, .sf-modal, .yt-return').forEach(el => viewport.appendChild(el));
  const sheetPairs = { 'streak-sheet': 'streak-sheet-bg', 'del-sheet': 'del-bg', 'grace-sheet': 'grace-sheet-bg', 'dd-modal': 'dd-bg' };
  function openSf(id) { $('#' + id).classList.add('open'); $('#' + sheetPairs[id]).classList.add('open'); }
  function closeSf() { $$('.sf-sheet, .sf-sheet-bg, .sf-modal').forEach(e => e.classList.remove('open')); }
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
  let ps = 0, prayT, remaining = 0, paused = false;
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
    clearInterval(prayT);
    prayT = setInterval(() => { if (!paused && remaining > 0) { remaining--; $('#pray-timer').textContent = fmtT(remaining); } }, 1000);
  }
  $('#pray-next').addEventListener('click', () => {
    if (ps < 3) { ps++; renderPray(); }
    else { clearInterval(prayT); setDone('Prayer complete'); go('complete'); }
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

  /* ---------- Devotionals: content + comments (per devotional) ---------- */
  const devs = {
    storm: { title: 'When the Storm Rages', img: 'assets/water_walk.jpg', by: 'By Pastor Ade Okafor · Oct 15', min: 6,
      quote: ['Immediately Jesus reached out his hand and caught him. \u2018You of little faith,\u2019 he said, \u2018why did you doubt?\u2019', 'Matthew 14:31 \u00b7 NIV'],
      body: ['Peter didn\u2019t sink because the storm got stronger. He sank because his eyes moved. The wind had been howling the whole time, yet while he looked at Jesus, the water held him.', 'Your storm may be real: a diagnosis, a bill, a silence from someone you love. But the same hand that caught Peter is close enough to catch you. Faith isn\u2019t the absence of wind; it\u2019s where you fix your eyes in it.'],
      reflect: 'What is one \u201cwind\u201d that has pulled your eyes away from Jesus this week?', pray: 'Lord, when the waves rise, lift my eyes back to You. Reach out Your hand and steady me. Amen.' },
    cave: { title: 'Light in the Cave', img: 'assets/cave_light.jpg', by: 'By Sister Ruth Bello · Oct 12', min: 8,
      quote: ['And after the fire came a gentle whisper.', '1 Kings 19:12 \u00b7 NIV'],
      body: ['Elijah ran from victory straight into a cave. Exhausted and afraid, he wanted to quit. God didn\u2019t scold him. He fed him, let him rest, and then met him in a whisper.', 'Sometimes restoration doesn\u2019t arrive with fire or thunder. It comes quietly, in rest, in a meal, in a still small voice that says, \u201cI am still here.\u201d'],
      reflect: 'Where do you need God\u2019s gentle restoration instead of another push?', pray: 'Father, I am tired. Meet me in the quiet and restore my strength. Amen.' },
    quiet: { title: 'The Quiet Place', img: 'assets/prayer_bible.jpg', by: 'By Pastor Ade Okafor \u00b7 Oct 10', min: 5,
      quote: ['Be still, and know that I am God.', 'Psalm 46:10 \u00b7 NIV'],
      body: ['Stillness is not laziness. It is trust in motion. When we stop striving, we make room to remember who is actually holding the world together.', 'Try five minutes today with no phone and no list. Just breathe, and let Scripture settle over you.'],
      reflect: 'What would five quiet minutes with God change about your day?', pray: 'Lord, quiet my heart. Teach me to be still in Your presence. Amen.' },
    peace: { title: 'Peace that Guards', img: 'assets/candle_peace.jpg', by: 'By Deaconess Ngozi Eze \u00b7 Oct 8', min: 7,
      quote: ['And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.', 'Philippians 4:7 \u00b7 NIV'],
      body: ['Notice the word guard. God\u2019s peace stands at the door of your mind like a sentry, not removing the anxious thought, but refusing it a permanent home.', 'The path to that peace begins with prayer, with thanksgiving, and with handing over each worry by name.'],
      reflect: 'Which worry do you need to hand over by name tonight?', pray: 'Jesus, I give You my worries. Guard my heart and mind with Your peace. Amen.' },
    harvest: { title: 'Seasons of Harvest', img: 'assets/wheat_sunrise.jpg', by: 'By Pastor James Adu \u00b7 Oct 5', min: 6,
      quote: ['Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.', 'Galatians 6:9 \u00b7 NIV'],
      body: ['Every farmer knows the waiting. Seed goes into the ground and, for a long while, nothing seems to happen. But growth is happening where you cannot see it.', 'If you are in a season of sowing, keep going. Your harvest has a proper time.'],
      reflect: 'What seed are you tempted to stop sowing, and why keep going?', pray: 'Lord, give me patience in the waiting and faith for the harvest. Amen.' }
  };
  const seedComments = {
    storm: [
      { n: 'Joshua Okon', i: 'JO', c: '#8B1E1E', t: '2h', text: 'Today\u2019s devotional hit home. I\u2019ve been looking at the waves (bills, deadlines) instead of Jesus. Choosing faith over fear today.', likes: 48, replies: [{ n: 'Ada Mbah', i: 'AM', c: '#C9961A', t: '1h', text: 'Amen! Praying with you, brother \ud83d\ude4f' }] },
      { n: 'Amara Eze', i: 'AE', c: '#C9961A', t: '5h', text: 'Fixing my eyes on Jesus, not the wind. This is exactly what I needed this morning.', likes: 112, replies: [] },
      { n: 'Pastor Ade', i: 'PA', c: '#141414', t: '1d', text: 'Beloved, whatever storm you are in, He is close enough to catch you. Keep your eyes on Him.', likes: 304, replies: [] }
    ],
    cave: [
      { n: 'Ruth Bello', i: 'RB', c: '#8B1E1E', t: '3h', text: 'The whisper after the fire. I needed to hear that God isn\u2019t angry at my exhaustion.', likes: 76, replies: [] },
      { n: 'Tunde Alabi', i: 'TA', c: '#141414', t: '1d', text: 'Rest is also obedience. Thank you for this.', likes: 31, replies: [] }
    ],
    quiet: [{ n: 'Grace Nwosu', i: 'GN', c: '#C9961A', t: '6h', text: 'Five minutes with no phone was harder than I expected, but so worth it.', likes: 22, replies: [] }],
    peace: [
      { n: 'Ngozi Eze', i: 'NE', c: '#8B1E1E', t: '4h', text: '\u201cGuard\u201d is such a powerful word. Peace as a sentry at the door of my mind.', likes: 58, replies: [] },
      { n: 'David Ojo', i: 'DO', c: '#141414', t: '2d', text: 'Handing over worries by name. I am doing this tonight.', likes: 19, replies: [] }
    ],
    harvest: []
  };
  const comments = {};
  Object.keys(devs).forEach(k => comments[k] = seedComments[k].map((c, x) => ({ ...c, id: k + x, liked: false, mine: false })));
  let curDev = 'storm', cmSort = 'top', replyTo = null, uid = 100;
  const esc = s => s.replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const initials = n => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const countAll = k => comments[k].reduce((s, c) => s + 1 + c.replies.length, 0);

  function setDev(k) { if (devs[k]) { curDev = k; cmSort = 'top'; replyTo = null; renderDev(); } }
  function renderDev() {
    const d = devs[curDev];
    $('#dr-hero').src = d.img;
    $('#dr-title').textContent = d.title;
    $('#dr-by').textContent = d.by;
    $('#dr-quote').innerHTML = `\u201c${esc(d.quote[0])}\u201d<cite>${esc(d.quote[1])}</cite>`;
    $('#dr-body').innerHTML = `
      ${d.body.map(p => `<p>${esc(p)}</p>`).join('')}
      <div class="sf-callout"><span class="sf-callout-i"><svg class="ico sm"><use href="#i-feather"/></svg></span><div><b>Reflect</b><p>${esc(d.reflect)}</p></div></div>
      <textarea class="sf-journal" placeholder="Write your reflection\u2026" aria-label="Reflection"></textarea>
      <div class="sf-callout gold"><span class="sf-callout-i"><svg class="ico sm"><use href="#i-pray"/></svg></span><div><b>Pray</b><p>${esc(d.pray)}</p></div></div>`;
    $$('#dr-sort button').forEach(b => b.classList.toggle('on', b.dataset.sort === cmSort));
    $('#dr-text').value = ''; $('#dr-post').disabled = true;
    renderComments();
    $('[data-screen="dev-read"]').scrollTop = 0;
  }
  function cmHTML(c, isReply) {
    return `<div class="dr-cm ${isReply ? 'reply' : ''}" data-id="${c.id}">
      <span class="sf-av" style="background:${c.c}">${c.i}</span>
      <div class="dr-cm-b">
        <div class="dr-cm-h"><b>${esc(c.n)}</b>${c.mine ? '<em>You</em>' : ''}<small>${c.t}</small></div>
        <p>${esc(c.text)}</p>
        <div class="dr-cm-a">
          ${isReply ? '' : `<button data-act="like" class="${c.liked ? 'on' : ''}"><svg class="ico xs"><use href="#i-heart"/></svg>${c.likes}</button>
          <button data-act="reply"><svg class="ico xs"><use href="#i-message"/></svg>Reply</button>`}
          ${c.mine ? '<button data-act="del" class="del">Delete</button>' : ''}
        </div>
        ${!isReply && replyTo === c.id ? `<form class="dr-reply" data-reply="${c.id}"><input placeholder="Reply to ${esc(c.n.split(' ')[0])}\u2026" autocomplete="off" autofocus><button aria-label="Send reply"><svg class="ico sm"><use href="#i-right"/></svg></button></form>` : ''}
        ${!isReply && c.replies.length ? `<div class="dr-replies">${c.replies.map(r => cmHTML({ ...r, id: r.id || '' }, true)).join('')}</div>` : ''}
      </div></div>`;
  }
  function renderComments() {
    let list = comments[curDev].slice();
    if (cmSort === 'top') list.sort((a, b) => b.likes - a.likes);
    if (cmSort === 'new') list.reverse();
    if (cmSort === 'mine') list = list.filter(c => c.mine || c.replies.some(r => r.mine));
    const total = countAll(curDev);
    $('#dr-n').textContent = total;
    $('#dr-jump-t').textContent = `${total} comment${total === 1 ? '' : 's'}`;
    $('#dr-list').innerHTML = list.length ? list.map(c => cmHTML(c)).join('')
      : `<div class="dr-empty"><svg class="ico lg"><use href="#i-message"/></svg><b>${cmSort === 'mine' ? 'You haven\u2019t commented yet' : 'No comments yet'}</b><span>${cmSort === 'mine' ? 'Share your thoughts above.' : 'Be the first to encourage someone on this devotional.'}</span></div>`;
    refreshCounts();
  }
  function refreshCounts() {
    $$('[data-dev]').forEach(el => {
      const k = el.dataset.dev; if (!comments[k]) return;
      let b = $('.sf-cc', el);
      if (!b) { b = document.createElement('span'); b.className = 'sf-cc'; (el.matches('.sf-feature') ? $('.meta', el) : $('.sf-row-t', el)).appendChild(b); }
      b.innerHTML = `<svg class="ico xs"><use href="#i-message"/></svg>${countAll(k)} comments`;
    });
  }
  $('#dr-text').addEventListener('input', e => { $('#dr-post').disabled = !e.target.value.trim(); });
  $('#dr-form').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#dr-text').value.trim(); if (!v) return;
    comments[curDev].push({ id: 'u' + (uid++), n: 'Grace Adeyemi', i: 'GA', c: '#C9961A', t: 'now', text: v, likes: 0, liked: false, mine: true, replies: [] });
    $('#dr-text').value = ''; $('#dr-post').disabled = true;
    cmSort = 'new'; $$('#dr-sort button').forEach(b => b.classList.toggle('on', b.dataset.sort === 'new'));
    renderComments(); toast('Comment posted');
  });
  $('#dr-sort').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    cmSort = b.dataset.sort; $$('#dr-sort button').forEach(x => x.classList.toggle('on', x === b)); renderComments();
  });
  $('#dr-jump').addEventListener('click', () => $('#dr-comments').scrollIntoView({ behavior: 'smooth', block: 'start' }));
  $('#dr-list').addEventListener('click', e => {
    const btn = e.target.closest('[data-act]'); if (!btn) return;
    const wrap = btn.closest('.dr-cm'), id = wrap.dataset.id;
    const parent = comments[curDev].find(c => c.id === id);
    if (btn.dataset.act === 'like' && parent) { parent.liked = !parent.liked; parent.likes += parent.liked ? 1 : -1; renderComments(); }
    if (btn.dataset.act === 'reply') { replyTo = replyTo === id ? null : id; renderComments(); const i = $('.dr-reply input'); i && i.focus(); }
    if (btn.dataset.act === 'del') {
      if (parent) comments[curDev] = comments[curDev].filter(c => c.id !== id);
      else comments[curDev].forEach(c => { c.replies = c.replies.filter(r => r.id !== id); });
      renderComments(); toast('Comment deleted');
    }
  });
  $('#dr-list').addEventListener('submit', e => {
    const f = e.target.closest('.dr-reply'); if (!f) return;
    e.preventDefault();
    const v = $('input', f).value.trim(); if (!v) return;
    const p = comments[curDev].find(c => c.id === f.dataset.reply);
    p.replies.push({ id: 'r' + (uid++), n: 'Grace Adeyemi', i: 'GA', c: '#C9961A', t: 'now', text: v, mine: true });
    replyTo = null; renderComments();
  });
  renderDev();

  /* ==========================================================
     LIVE DEVOTION ON YOUTUBE + PAST DEVOTIONS
     ========================================================== */
  // TODO: replace with the real T30 YouTube channel / live stream URLs
  const YT = { live: 'https://www.youtube.com/@T30App/live', channel: 'https://www.youtube.com/@T30App/videos' };
  const pastData = [
    { id: 'p1', week: 'This week', title: 'Purpose over Pressure', by: 'Pst. James Okafor', date: 'Thu, Oct 29', dur: '28:14', img: 'assets/live_sermon.jpg', watched: true },
    { id: 'p2', week: 'This week', title: 'Anchored in the Storm', by: 'Pst. James Okafor', date: 'Wed, Oct 28', dur: '31:02', img: 'assets/water_walk.jpg', watched: false },
    { id: 'p3', week: 'This week', title: 'The Power of a Quiet Heart', by: 'Sis. Ruth Bello', date: 'Tue, Oct 27', dur: '24:40', img: 'assets/prayer_bible.jpg', watched: true },
    { id: 'p4', week: 'This week', title: 'New Mercies Monday', by: 'Pst. Ade Okafor', date: 'Mon, Oct 26', dur: '29:30', img: 'assets/splash_hero.jpg', watched: false },
    { id: 'p5', week: 'Last week', title: 'Grace Wins on Sunday', by: 'Pst. James Okafor', date: 'Sun, Oct 25', dur: '36:10', img: 'assets/wheat_sunrise.jpg', watched: true },
    { id: 'p6', week: 'Last week', title: 'Light in the Cave', by: 'Sis. Ruth Bello', date: 'Fri, Oct 23', dur: '26:48', img: 'assets/cave_light.jpg', watched: false },
    { id: 'p7', week: 'Last week', title: 'Peace that Guards', by: 'Dns. Ngozi Eze', date: 'Thu, Oct 22', dur: '27:05', img: 'assets/candle_peace.jpg', watched: true },
    { id: 'p8', week: 'Last week', title: 'Seasons of Harvest', by: 'Pst. James Adu', date: 'Wed, Oct 21', dur: '30:21', img: 'assets/wheat_sunrise.jpg', watched: false }
  ];
  let pastFilter = 'all', pendingYT = null, leftAt = 0;
  const attrs = p => `data-yt="past" data-kind="past" data-id="${p.id}" data-title="${esc(p.title)}"`;

  function renderPast() {
    // summary
    const wk = pastData.filter(p => p.week === 'This week'), done = wk.filter(p => p.watched).length;
    $('#pd-sum-t').textContent = `${done} of ${wk.length} caught up this week`;
    $('#pd-sum-bar').style.width = (done / wk.length * 100) + '%';
    // full list, grouped by week
    const list = pastData.filter(p => pastFilter === 'all' || (pastFilter === 'missed' ? !p.watched : p.watched));
    let html = '';
    ['This week', 'Last week'].forEach(w => {
      const items = list.filter(p => p.week === w); if (!items.length) return;
      html += `<div class="section-head"><h3 class="h-lg">${w}</h3><span class="t-sm muted">${items.length} video${items.length > 1 ? 's' : ''}</span></div><div class="pad sf-list">` +
        items.map(p => `<div class="card pd-item" ${attrs(p)} role="link" tabindex="0">
          <div class="pd-thumb"><img src="${p.img}" alt=""><span class="pd-play"><svg class="ico sm"><use href="#i-play"/></svg></span><em>${p.dur}</em></div>
          <div class="pd-info"><b>${esc(p.title)}</b><span>${p.by} \u00b7 ${p.date}</span>
          ${p.watched ? '<span class="pd-st ok"><svg class="ico xs"><use href="#i-check"/></svg>Watched</span>' : '<span class="pd-st miss">Missed \u00b7 Watch now</span>'}</div></div>`).join('') + '</div>';
    });
    $('#pd-list').innerHTML = html || '<div class="dr-empty"><svg class="ico lg"><use href="#i-check"/></svg><b>Nothing here</b><span>You\u2019re all caught up. Well done!</span></div>';
    // strip on the live screen: unwatched first
    const strip = pastData.slice().sort((a, b) => a.watched - b.watched).slice(0, 5);
    $('#live-past').innerHTML = strip.map(p => `<div class="plan-card" ${attrs(p)} role="link" tabindex="0"><div class="img-card"><img src="${p.img}" alt="">
      ${p.watched ? '' : '<div class="tl"><span class="badge badge-live">MISSED</span></div>'}<div class="tr"><span class="badge badge-dark">${p.dur}</span></div></div><b>${esc(p.title)}</b><span>${p.date}</span></div>`).join('');
  }
  $('#pd-filter').addEventListener('click', e => {
    const b = e.target.closest('.pill'); if (!b) return;
    pastFilter = b.dataset.f; $$('#pd-filter .pill').forEach(x => x.classList.toggle('active', x === b)); renderPast();
  });

  // Open YouTube in a new tab and remember what is being watched
  function openYT(el) {
    pendingYT = { kind: el.dataset.kind || 'today', id: el.dataset.id || null, title: el.dataset.title || '' };
    leftAt = 0;
    const url = el.dataset.yt === 'live' ? YT.live : YT.channel;
    window.open(url, '_blank', 'noopener');
    toast('Opening YouTube\u2026');
    $('#yt-return').classList.add('show');
  }
  document.addEventListener('click', e => { const t = e.target.closest('[data-yt]'); if (t) openYT(t); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target.closest && e.target.closest('[data-yt][role="link"]'); if (t) { e.preventDefault(); openYT(t); }
  });

  // Detect the user coming back from YouTube
  const markLeft = () => { if (pendingYT && !leftAt) leftAt = Date.now(); };
  const checkReturn = () => { if (pendingYT && leftAt && Date.now() - leftAt > 3000) showDone(); else if (pendingYT && leftAt) leftAt = 0; };
  document.addEventListener('visibilitychange', () => document.hidden ? markLeft() : checkReturn());
  window.addEventListener('blur', markLeft);
  window.addEventListener('focus', checkReturn);
  $('#yt-return').addEventListener('click', showDone);

  function showDone() {
    if (!pendingYT) return;
    const p = pendingYT; pendingYT = null; leftAt = 0;
    $('#yt-return').classList.remove('show');
    if (p.kind === 'past') {
      const it = pastData.find(x => x.id === p.id); if (it) it.watched = true;
      $('#dd-title').textContent = 'You\u2019re all caught up!';
      $('#dd-sub').textContent = `You watched \u201c${p.title}\u201d. Grace over guilt, you\u2019re back in rhythm.`;
    } else {
      $('#dd-title').textContent = 'Devotion complete!';
      $('#dd-sub').textContent = 'You sat at His feet today and your streak is safe. Let the Word settle in your heart with today\u2019s reading.';
    }
    renderPast();
    openSf('dd-modal');
  }
  $('#dd-read').addEventListener('click', () => { closeSf(); go('bible'); });
  $('#dd-later').addEventListener('click', closeSf);

  /* ---------- Screen enter hooks ---------- */
  renderPast();
  window.T30Sub = {
    onEnter(id) {
      closeSf();
      if (id === 'live' || id === 'past-devotions') renderPast();
      if (id === 'conf-session') { ci = 0; renderConf(); }
      if (id === 'decl-session') { di = 0; renderDecl(); }
      if (id === 'pray-session') startPray(); else { clearInterval(prayT); }
      if (id === 'complete') confetti();
      if (id === 'streak') $('#streak-sheet h3').textContent = 'Share your streak';
    }
  };

  /* ---------- Init ---------- */
  const start = location.hash.slice(1);
  go(order.includes(start) ? start : 'splash', { push: false });
})();
